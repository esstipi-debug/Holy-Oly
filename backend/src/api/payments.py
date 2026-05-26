"""
Payments · transferencia bancaria con verificación por email.

Flujo:
  1. Atleta tap "PRO 1 mes" → POST /v1/payments/intents → {code, cbu, alias, amount}
  2. Atleta transfiere desde home banking poniendo `code` en concepto
  3. Watcher de email (separado, cron) lee bandeja del banco
     → parsea concepto → POST /v1/payments/intents/{code}/verify
  4. Atleta refresca → GET /v1/payments/intents/{id} → status='verified' → tier='pro'

Endpoints expuestos:
  POST   /v1/payments/intents              · crea intent + código único
  GET    /v1/payments/intents              · lista intents del user auth
  GET    /v1/payments/intents/{code}       · estado de un intent
  POST   /v1/payments/intents/{code}/verify · admin/watcher · marca verified + activa tier
  GET    /v1/payments/plans                · catálogo público de planes
"""
import os
import secrets
import string
from datetime import datetime, timedelta
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field

from .auth.auth import verify_token
from .auth.jwt_utils import User
from ..db import users_repo

router = APIRouter(prefix="/v1/payments", tags=["payments"])

# ----------------------------------------------------------------
# CATÁLOGO DE PLANES
# ----------------------------------------------------------------
# Precios en ARS. TODO: hacer configurable por env / DB cuando haya admin.

# Mercado: CHILE · moneda CLP (sin decimales prácticos)
# Trial: 14 días free PRO al registrarse (definido en 000_init.sql users.trial_ends_at)
#
# AJUSTAR precios cuando estén definidos · setear via env vars en Render:
#   PRICE_ATHLETE_PRO_MONTHLY, PRICE_COACH_PRO_MONTHLY
PLANS = {
    "athlete_pro_1m": {
        "label":    "PRO Atleta · 1 mes",
        "amount":   int(os.getenv("PRICE_ATHLETE_PRO_MONTHLY", "7990")),  # CLP — TBD
        "days":     30,
        "tier":     "pro",
        "audience": "athlete",
    },
    "athlete_pro_12m": {
        "label":    "PRO Atleta · 12 meses",
        "amount":   int(os.getenv("PRICE_ATHLETE_PRO_YEARLY", "79900")),  # CLP — TBD · 10x mensual = 2 meses gratis
        "days":     365,
        "tier":     "pro",
        "audience": "athlete",
    },
    "coach_pro_1m": {
        "label":    "PRO Coach · 1 mes",
        "amount":   int(os.getenv("PRICE_COACH_PRO_MONTHLY", "24990")),  # CLP — TBD
        "days":     30,
        "tier":     "pro",
        "audience": "coach",
    },
    "coach_pro_12m": {
        "label":    "PRO Coach · 12 meses",
        "amount":   int(os.getenv("PRICE_COACH_PRO_YEARLY", "249900")),  # CLP — TBD
        "days":     365,
        "tier":     "pro",
        "audience": "coach",
    },
}

# Provider de pago: 'transfer' (legacy/bank) o 'mercadopago' (Checkout Pro)
PAYMENT_PROVIDER = os.getenv("PAYMENT_PROVIDER", "mercadopago")

# MercadoPago Chile · sandbox o prod según ACCESS_TOKEN (TEST-... vs APP_USR-...)
MP_ACCESS_TOKEN = os.getenv("MP_ACCESS_TOKEN", "")
MP_PUBLIC_KEY   = os.getenv("MP_PUBLIC_KEY", "")
MP_WEBHOOK_SECRET = os.getenv("MP_WEBHOOK_SECRET", "")
# URL del frontend para los callbacks success/failure/pending
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://holy-oly.onrender.com")

# Datos bancarios solo para PAYMENT_PROVIDER='transfer' (legacy, fallback)
BANK_DATA = {
    "alias":    os.getenv("BANK_ALIAS", "HOLY.OLY.CL"),
    "rut":      os.getenv("BANK_RUT", "11.111.111-1"),
    "holder":   os.getenv("BANK_HOLDER", "Holy Oly SpA"),
    "bank":     os.getenv("BANK_NAME", "Banco de Chile"),
    "account":  os.getenv("BANK_ACCOUNT", "00-000-00000-00"),
    "type":     os.getenv("BANK_ACCOUNT_TYPE", "Cuenta Corriente"),
    "currency": "CLP",
}

ADMIN_TOKEN = os.getenv("PAYMENTS_ADMIN_TOKEN", "")  # para watcher de email


def gen_code() -> str:
    """Genera HOLY-XXXX-YYYY (8 chars alfanuméricos sin ambiguos)."""
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # sin O/0/I/1
    part1 = ''.join(secrets.choice(alphabet) for _ in range(4))
    part2 = ''.join(secrets.choice(alphabet) for _ in range(4))
    return f"HOLY-{part1}-{part2}"


# ----------------------------------------------------------------
# SCHEMAS
# ----------------------------------------------------------------

class IntentCreate(BaseModel):
    plan: Literal['athlete_pro_1m', 'athlete_pro_12m', 'coach_pro_1m', 'coach_pro_12m']


class IntentVerify(BaseModel):
    verified_email_id: Optional[str] = None
    bank_sender: Optional[str] = None
    parsed_amount: Optional[float] = None
    notes: Optional[str] = None
    admin_token: str = Field(..., description="Token compartido con el watcher de email")


# ----------------------------------------------------------------
# PUBLIC
# ----------------------------------------------------------------

@router.get("/plans")
def list_plans():
    """Catálogo público de planes + provider activo + datos bancarios (legacy)."""
    return {
        "plans": [{"id": k, **v} for k, v in PLANS.items()],
        "provider": PAYMENT_PROVIDER,
        "currency": "CLP",
        "country": "CL",
        "mp_public_key": MP_PUBLIC_KEY if PAYMENT_PROVIDER == "mercadopago" else None,
        "bank": BANK_DATA if PAYMENT_PROVIDER == "transfer" else None,
    }


# ----------------------------------------------------------------
# MERCADOPAGO Checkout Pro · helpers
# ----------------------------------------------------------------

async def create_mp_preference(*, intent_id: str, code: str, plan: dict) -> dict:
    """
    Crea una preferencia de pago en MercadoPago Chile.
    Devuelve el init_point (URL a la que redirigís al user) + preference_id.

    Docs: https://www.mercadopago.cl/developers/es/reference/preferences/_checkout_preferences/post
    """
    if not MP_ACCESS_TOKEN:
        raise HTTPException(503, "MP_ACCESS_TOKEN no configurado en server")

    import httpx
    body = {
        "items": [{
            "title":       plan["label"],
            "description": f"Holy Oly · {plan['label']} · acceso por {plan['days']} días",
            "quantity":    1,
            "currency_id": "CLP",
            "unit_price":  plan["amount"],
        }],
        "external_reference": code,  # nuestro código HOLY-XXXX-YYYY para matching webhook
        "back_urls": {
            "success": f"{FRONTEND_URL}/#PAYMENT_SUCCESS?code={code}",
            "failure": f"{FRONTEND_URL}/#PAYMENT_FAILURE?code={code}",
            "pending": f"{FRONTEND_URL}/#PAYMENT_PENDING?code={code}",
        },
        "auto_return": "approved",
        "metadata": {"intent_id": intent_id, "code": code, "plan_id": plan.get("id", "")},
        "notification_url": f"{os.getenv('BACKEND_URL', 'https://holy-oly-3.onrender.com')}/v1/payments/webhooks/mercadopago",
        "statement_descriptor": "HOLY OLY",
        # MercadoPago Chile: permitir débito + crédito + Webpay (transferencia)
        "payment_methods": {
            "excluded_payment_types": [],
            "installments": 1,
        },
    }

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            "https://api.mercadopago.com/checkout/preferences",
            json=body,
            headers={"Authorization": f"Bearer {MP_ACCESS_TOKEN}"},
        )
        if resp.status_code >= 400:
            raise HTTPException(502, f"MP error {resp.status_code}: {resp.text[:300]}")
        data = resp.json()
        return {
            "init_point": data.get("init_point"),
            "sandbox_init_point": data.get("sandbox_init_point"),
            "preference_id": data.get("id"),
        }


# ----------------------------------------------------------------
# AUTH USER
# ----------------------------------------------------------------

@router.post("/intents", status_code=status.HTTP_201_CREATED)
async def create_intent(payload: IntentCreate, user: User = Depends(verify_token)):
    """
    Crea un payment_intent. Según PAYMENT_PROVIDER:
      - 'mercadopago' (default): genera preferencia MP, devuelve init_point para redirigir
      - 'transfer' (legacy): devuelve datos bancarios + código a poner en el concepto
    """
    plan = PLANS[payload.plan]
    plan_with_id = {**plan, "id": payload.plan}
    pool = await users_repo.get_pool()
    code = gen_code()
    expires_at = datetime.utcnow() + timedelta(hours=48)

    # Persistir el intent
    intent_id: str
    if pool is None:
        intent_id = "mock"
    else:
        async with pool.acquire() as conn:
            for _ in range(5):
                try:
                    row = await conn.fetchrow(
                        """
                        INSERT INTO payment_intents (user_id, code, plan, amount, currency, status, expires_at)
                        VALUES ($1::uuid, $2, $3, $4, 'CLP', 'pending'::payment_status, $5)
                        RETURNING id
                        """,
                        user.id, code, payload.plan, plan["amount"], expires_at,
                    )
                    intent_id = str(row["id"])
                    break
                except Exception:
                    code = gen_code()
            else:
                raise HTTPException(500, "No se pudo generar un código único")

    base = {
        "id": intent_id, "code": code, "plan": payload.plan,
        "plan_label": plan["label"], "audience": plan.get("audience", "athlete"),
        "amount": plan["amount"], "currency": "CLP",
        "status": "pending",
        "expires_at": expires_at.isoformat(),
        "provider": PAYMENT_PROVIDER,
    }

    if PAYMENT_PROVIDER == "mercadopago":
        try:
            mp = await create_mp_preference(intent_id=intent_id, code=code, plan=plan_with_id)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(502, f"MP integration error: {e}")
        return {**base, **mp}

    # Legacy: transferencia bancaria
    return {
        **base,
        "bank": BANK_DATA,
        "instructions": _build_instructions(code, plan, BANK_DATA),
    }


# ----------------------------------------------------------------
# WEBHOOK MercadoPago · activación automática
# ----------------------------------------------------------------

@router.post("/webhooks/mercadopago")
async def mp_webhook(request: Request):
    """
    Recibe notificaciones de MercadoPago cuando cambia el estado de un pago.
    Si el pago está 'approved', verifica el intent y activa la suscripción.

    Docs: https://www.mercadopago.cl/developers/es/docs/your-integrations/notifications/webhooks
    """
    payload = await request.json()
    # MP envía {action, type, data: {id: payment_id}}
    payment_id = (payload.get("data") or {}).get("id")
    if not payment_id:
        return {"received": True, "skipped": "no payment_id"}

    import httpx
    if not MP_ACCESS_TOKEN:
        raise HTTPException(503, "MP_ACCESS_TOKEN no configurado")

    # Fetch del pago real desde MP
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(
            f"https://api.mercadopago.com/v1/payments/{payment_id}",
            headers={"Authorization": f"Bearer {MP_ACCESS_TOKEN}"},
        )
        if r.status_code >= 400:
            return {"received": True, "error": f"MP fetch failed {r.status_code}"}
        payment = r.json()

    if payment.get("status") != "approved":
        return {"received": True, "status": payment.get("status"), "skipped": "not approved"}

    code = payment.get("external_reference")
    if not code:
        return {"received": True, "error": "no external_reference"}

    pool = await users_repo.get_pool()
    if pool is None:
        return {"received": True, "error": "no DB"}

    paid_amount = float(payment.get("transaction_amount") or 0)

    async with pool.acquire() as conn:
        intent = await conn.fetchrow(
            "SELECT id, user_id, plan, amount, status::text AS status, expires_at FROM payment_intents WHERE code = $1",
            code,
        )
        if not intent:
            return {"received": True, "error": "intent not found", "code": code}
        if intent["status"] != "pending":
            return {"received": True, "skipped": f"intent already {intent['status']}"}

        expected = float(intent["amount"])
        if abs(paid_amount - expected) / max(expected, 1) > 0.01:
            return {"received": True, "error": f"amount mismatch: expected {expected}, paid {paid_amount}"}

        plan = PLANS[intent["plan"]]
        now = datetime.utcnow()
        new_trial_ends_at = now + timedelta(days=plan["days"])

        async with conn.transaction():
            await conn.execute(
                """
                UPDATE payment_intents
                SET status='verified'::payment_status, verified_at=NOW(),
                    verified_email_id=$2, bank_sender=$3,
                    notes='MP webhook ' || $4
                WHERE id = $1
                """,
                intent["id"], str(payment_id), payment.get("payer", {}).get("email"), payment.get("id"),
            )
            await conn.execute(
                """
                UPDATE users
                SET tier = $2::subscription_tier,
                    subscribed_at = $3,
                    trial_ends_at = $4
                WHERE id = $1
                """,
                intent["user_id"], plan["tier"], now, new_trial_ends_at,
            )

    return {"received": True, "verified": True, "code": code, "expires_at": new_trial_ends_at.isoformat()}


@router.get("/intents")
async def list_user_intents(user: User = Depends(verify_token)):
    """Lista los intents del usuario auth (ordenados por más recientes)."""
    pool = await users_repo.get_pool()
    if pool is None:
        return []
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, code, plan, amount, currency, status::text AS status,
                   expires_at, verified_at, created_at
            FROM payment_intents
            WHERE user_id = $1::uuid
            ORDER BY created_at DESC
            LIMIT 20
            """,
            user.id,
        )
        out = []
        for r in rows:
            d = dict(r); d["id"] = str(d["id"]); out.append(d)
        return out


@router.get("/intents/{code}")
async def get_intent(code: str, user: User = Depends(verify_token)):
    pool = await users_repo.get_pool()
    if pool is None:
        return {"code": code, "status": "pending", "mock": True}
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT id, code, plan, amount, currency, status::text AS status,
                   expires_at, verified_at, created_at, user_id
            FROM payment_intents WHERE code = $1
            """,
            code,
        )
        if not row:
            raise HTTPException(404, "Intent no encontrado")
        d = dict(row)
        if str(d["user_id"]) != user.id:
            raise HTTPException(403, "No es tu intent")
        d["id"] = str(d["id"]); d.pop("user_id", None)
        return d


# ----------------------------------------------------------------
# ADMIN / WATCHER
# ----------------------------------------------------------------

@router.post("/intents/{code}/verify")
async def verify_intent(code: str, payload: IntentVerify):
    """
    Llamado por el watcher de email cuando matchea un comprobante.

    Auth: simple shared token via header `X-Admin-Token` o body.admin_token.
    """
    if not ADMIN_TOKEN or payload.admin_token != ADMIN_TOKEN:
        raise HTTPException(401, "Admin token inválido")

    pool = await users_repo.get_pool()
    if pool is None:
        return {"verified": False, "reason": "no_db"}

    async with pool.acquire() as conn:
        intent = await conn.fetchrow(
            "SELECT id, user_id, plan, amount, status::text AS status, expires_at FROM payment_intents WHERE code = $1",
            code,
        )
        if not intent:
            raise HTTPException(404, "Intent no encontrado")
        if intent["status"] != "pending":
            return {"verified": False, "reason": f"already_{intent['status']}", "code": code}
        if intent["expires_at"] < datetime.utcnow():
            await conn.execute(
                "UPDATE payment_intents SET status='expired'::payment_status WHERE id = $1",
                intent["id"],
            )
            raise HTTPException(410, "Intent expirado")

        # Validar monto (tolerancia ±1% por redondeos de banco)
        if payload.parsed_amount is not None:
            expected = float(intent["amount"])
            if abs(payload.parsed_amount - expected) / expected > 0.01:
                raise HTTPException(409, f"Monto no coincide: esperado {expected}, recibido {payload.parsed_amount}")

        plan = PLANS[intent["plan"]]
        new_subscribed_at = datetime.utcnow()
        new_trial_ends_at = new_subscribed_at + timedelta(days=plan["days"])

        async with conn.transaction():
            await conn.execute(
                """
                UPDATE payment_intents
                SET status='verified'::payment_status, verified_at=NOW(),
                    verified_email_id=$2, bank_sender=$3, notes=$4
                WHERE id = $1
                """,
                intent["id"], payload.verified_email_id, payload.bank_sender, payload.notes,
            )
            await conn.execute(
                """
                UPDATE users
                SET tier = $2::subscription_tier,
                    subscribed_at = $3,
                    trial_ends_at = $4
                WHERE id = $1
                """,
                intent["user_id"], plan["tier"], new_subscribed_at, new_trial_ends_at,
            )

        return {
            "verified": True,
            "code": code,
            "tier": plan["tier"],
            "expires_at": new_trial_ends_at.isoformat(),
        }


# ----------------------------------------------------------------
# HELPERS
# ----------------------------------------------------------------

def _build_instructions(code: str, plan: dict, bank: dict) -> str:
    return (
        f"Transferí ${plan['amount']:,} {bank['currency']} a:\n"
        f"  Alias: {bank['alias']}\n"
        f"  CBU:   {bank['cbu']}\n"
        f"  Titular: {bank['holder']} ({bank['bank']})\n\n"
        f"IMPORTANTE: poné este código en el concepto/referencia de la transferencia:\n"
        f"  {code}\n\n"
        f"Activación automática en menos de 10 minutos."
    )
