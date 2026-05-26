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
# Precios anchored a USD target (USD/CLP ~900):
#   Atleta 3-5 USD/mes  → ~3.990 CLP
#   Coach  40-60 USD/mes → ~44.990 CLP
# Anual = 10x mensual (2 meses gratis)
#
# Configurables via env vars (preferido para cambiar sin redeploy):
#   PRICE_ATHLETE_PRO_MONTHLY, PRICE_ATHLETE_PRO_YEARLY
#   PRICE_COACH_PRO_MONTHLY,   PRICE_COACH_PRO_YEARLY
#
# `frequency` y `frequency_type` se usan para crear preapproval_plan en MP.
PLANS = {
    "athlete_pro_1m": {
        "label":          "PRO Atleta · Mensual",
        "amount":         int(os.getenv("PRICE_ATHLETE_PRO_MONTHLY", "3990")),
        "frequency":      1,
        "frequency_type": "months",
        "days":           30,
        "tier":           "pro",
        "audience":       "athlete",
    },
    "athlete_pro_12m": {
        "label":          "PRO Atleta · Anual",
        "amount":         int(os.getenv("PRICE_ATHLETE_PRO_YEARLY", "39900")),  # 10x mensual · 2 meses gratis
        "frequency":      12,
        "frequency_type": "months",
        "days":           365,
        "tier":           "pro",
        "audience":       "athlete",
    },
    "coach_pro_1m": {
        "label":          "PRO Coach · Mensual",
        "amount":         int(os.getenv("PRICE_COACH_PRO_MONTHLY", "44990")),
        "frequency":      1,
        "frequency_type": "months",
        "days":           30,
        "tier":           "pro",
        "audience":       "coach",
    },
    "coach_pro_12m": {
        "label":          "PRO Coach · Anual",
        "amount":         int(os.getenv("PRICE_COACH_PRO_YEARLY", "449900")),
        "frequency":      12,
        "frequency_type": "months",
        "days":           365,
        "tier":           "pro",
        "audience":       "coach",
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
# MERCADOPAGO Subscriptions API · helpers
# ----------------------------------------------------------------
# Flow:
#   1. (Una vez por plan) POST /preapproval_plan → guardar plan_id
#   2. (Por user) POST /preapproval con plan_id + payer_email → devuelve init_point
#   3. User paga en MP-hosted checkout → MP cobra recurrente automático
#   4. Webhook /v1/payments/webhooks/mercadopago notifica cada evento
#      (authorized | payment | cancelled | paused | finished)
#
# Docs: https://www.mercadopago.cl/developers/es/reference/subscriptions/_preapproval/post

BACKEND_URL = os.getenv("BACKEND_URL", "https://holy-oly-3.onrender.com")

def _mp_plan_id_for(plan_key: str) -> Optional[str]:
    """Devuelve el preapproval_plan_id guardado en env var para un plan dado."""
    return os.getenv(f"MP_PLAN_ID_{plan_key.upper()}")


async def create_mp_preapproval_plan(*, plan_key: str, plan: dict) -> dict:
    """
    Crea un preapproval_plan en MP (una sola vez por plan).
    Devuelve el plan_id que después hay que guardar como env var MP_PLAN_ID_{KEY}.
    """
    if not MP_ACCESS_TOKEN:
        raise HTTPException(503, "MP_ACCESS_TOKEN no configurado en server")

    import httpx
    body = {
        "reason": f"Holy Oly · {plan['label']}",
        "auto_recurring": {
            "frequency":          plan["frequency"],
            "frequency_type":     plan["frequency_type"],
            "transaction_amount": plan["amount"],
            "currency_id":        "CLP",
        },
        "back_url": f"{FRONTEND_URL}/#PAYMENT_SUCCESS?plan={plan_key}",
        "status":   "active",
    }
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            "https://api.mercadopago.com/preapproval_plan",
            json=body,
            headers={"Authorization": f"Bearer {MP_ACCESS_TOKEN}"},
        )
        if resp.status_code >= 400:
            raise HTTPException(502, f"MP error {resp.status_code}: {resp.text[:300]}")
        data = resp.json()
        return {
            "plan_id":    data.get("id"),
            "init_point": data.get("init_point"),
            "status":     data.get("status"),
        }


async def create_mp_preapproval(*, code: str, plan_key: str, plan: dict, user_email: str) -> dict:
    """
    Crea una suscripción (preapproval) para un usuario sobre un preapproval_plan.
    Devuelve init_point que el frontend debe abrir para que el user ingrese tarjeta.
    """
    if not MP_ACCESS_TOKEN:
        raise HTTPException(503, "MP_ACCESS_TOKEN no configurado en server")

    plan_id = _mp_plan_id_for(plan_key)
    if not plan_id:
        raise HTTPException(503, f"MP_PLAN_ID_{plan_key.upper()} no configurado. Crear el preapproval_plan en MP primero con POST /v1/admin/mp/create-plans")

    import httpx
    body = {
        "preapproval_plan_id": plan_id,
        "reason":              f"Holy Oly · {plan['label']}",
        "external_reference":  code,
        "payer_email":         user_email,
        "back_url":            f"{FRONTEND_URL}/#PAYMENT_SUCCESS?code={code}",
        "status":              "pending",
    }
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            "https://api.mercadopago.com/preapproval",
            json=body,
            headers={"Authorization": f"Bearer {MP_ACCESS_TOKEN}"},
        )
        if resp.status_code >= 400:
            raise HTTPException(502, f"MP error {resp.status_code}: {resp.text[:300]}")
        data = resp.json()
        return {
            "preapproval_id": data.get("id"),
            "init_point":     data.get("init_point"),
            "status":         data.get("status"),
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
        # Fetch user email para asociar a la preapproval
        u = await users_repo.find_by_id(user.id) if pool else None
        user_email = (u or {}).get("email") or f"{user.id}@holyoly.app"
        try:
            mp = await create_mp_preapproval(
                code=code, plan_key=payload.plan, plan=plan_with_id, user_email=user_email,
            )
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
    Webhook MP · maneja 2 tipos de eventos:
      - type='subscription_authorized_payment' / 'preapproval': activación de suscripción
      - type='payment': cobros recurrentes individuales

    Docs: https://www.mercadopago.cl/developers/es/docs/your-integrations/notifications/webhooks
    """
    payload = await request.json()
    event_type = payload.get("type") or payload.get("topic")  # MP a veces usa 'topic'
    obj_id = (payload.get("data") or {}).get("id") or payload.get("id")
    if not obj_id:
        return {"received": True, "skipped": "no obj_id"}

    if not MP_ACCESS_TOKEN:
        raise HTTPException(503, "MP_ACCESS_TOKEN no configurado")

    import httpx
    pool = await users_repo.get_pool()
    if pool is None:
        return {"received": True, "error": "no DB"}

    # Resolver event a un preapproval que matchee con un intent
    code = None
    plan_key = None
    status_mp = None

    if event_type in ("preapproval", "subscription_preapproval"):
        # Es un cambio de estado de la suscripción → fetch /preapproval/{id}
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(
                f"https://api.mercadopago.com/preapproval/{obj_id}",
                headers={"Authorization": f"Bearer {MP_ACCESS_TOKEN}"},
            )
            if r.status_code >= 400:
                return {"received": True, "error": f"MP fetch preapproval failed {r.status_code}"}
            pa = r.json()
        code = pa.get("external_reference")
        status_mp = pa.get("status")
        # status posibles: pending / authorized / paused / cancelled / finished

    elif event_type in ("payment", "subscription_authorized_payment"):
        # Cobro individual recurrente → fetch /v1/payments/{id}
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(
                f"https://api.mercadopago.com/v1/payments/{obj_id}",
                headers={"Authorization": f"Bearer {MP_ACCESS_TOKEN}"},
            )
            if r.status_code >= 400:
                return {"received": True, "error": f"MP fetch payment failed {r.status_code}"}
            pay = r.json()
        code = pay.get("external_reference")
        status_mp = pay.get("status")  # approved | pending | rejected
    else:
        return {"received": True, "skipped": f"unhandled event type: {event_type}"}

    if not code:
        return {"received": True, "skipped": "no external_reference"}

    async with pool.acquire() as conn:
        intent = await conn.fetchrow(
            "SELECT id, user_id, plan, amount, status::text AS status FROM payment_intents WHERE code = $1",
            code,
        )
        if not intent:
            return {"received": True, "error": "intent not found", "code": code}

        # Solo activamos si MP nos dice approved/authorized
        if status_mp not in ("authorized", "approved"):
            return {"received": True, "code": code, "skipped": f"MP status: {status_mp}"}

        # Si ya está verificado, igual extendemos el trial_ends_at (cobro recurrente)
        plan = PLANS[intent["plan"]]
        now = datetime.utcnow()
        new_expires = now + timedelta(days=plan["days"])

        async with conn.transaction():
            if intent["status"] == "pending":
                await conn.execute(
                    """
                    UPDATE payment_intents
                    SET status='verified'::payment_status, verified_at=NOW(),
                        verified_email_id=$2,
                        notes=COALESCE(notes,'') || ' | MP ' || $3
                    WHERE id = $1
                    """,
                    intent["id"], str(obj_id), str(event_type),
                )
            await conn.execute(
                """
                UPDATE users
                SET tier = $2::subscription_tier,
                    subscribed_at = COALESCE(subscribed_at, $3),
                    trial_ends_at = $4
                WHERE id = $1
                """,
                intent["user_id"], plan["tier"], now, new_expires,
            )

    return {"received": True, "verified": True, "code": code, "event": event_type, "expires_at": new_expires.isoformat()}


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
