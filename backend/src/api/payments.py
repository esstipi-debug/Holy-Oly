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

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from .auth.auth import verify_token
from .auth.jwt_utils import User
from ..db import users_repo

router = APIRouter(prefix="/v1/payments", tags=["payments"])

# ----------------------------------------------------------------
# CATÁLOGO DE PLANES
# ----------------------------------------------------------------
# Precios en ARS. TODO: hacer configurable por env / DB cuando haya admin.

PLANS = {
    "pro_1m":     {"label": "PRO 1 mes",     "amount": 5990,  "days": 30,  "tier": "pro"},
    "pro_3m":     {"label": "PRO 3 meses",   "amount": 15990, "days": 90,  "tier": "pro"},
    "pro_12m":    {"label": "PRO 12 meses",  "amount": 49990, "days": 365, "tier": "pro"},
    "elite_1m":   {"label": "ELITE 1 mes",   "amount": 9990,  "days": 30,  "tier": "elite"},
}

# Datos de cobro · TODO: mover a env vars
BANK_DATA = {
    "alias":   os.getenv("BANK_ALIAS", "HOLYOLY.SMART.TRAIN"),
    "cbu":     os.getenv("BANK_CBU", "0000000000000000000000"),
    "holder":  os.getenv("BANK_HOLDER", "Holy Oly SAS"),
    "bank":    os.getenv("BANK_NAME", "Banco Galicia"),
    "currency": "ARS",
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
    plan: Literal['pro_1m', 'pro_3m', 'pro_12m', 'elite_1m']


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
    """Catálogo público + datos bancarios."""
    return {
        "plans": [{"id": k, **v} for k, v in PLANS.items()],
        "bank": BANK_DATA,
    }


# ----------------------------------------------------------------
# AUTH USER
# ----------------------------------------------------------------

@router.post("/intents", status_code=status.HTTP_201_CREATED)
async def create_intent(payload: IntentCreate, user: User = Depends(verify_token)):
    """Crea un payment_intent con código único + ventana de 48h."""
    plan = PLANS[payload.plan]
    pool = await users_repo.get_pool()
    code = gen_code()
    expires_at = datetime.utcnow() + timedelta(hours=48)

    if pool is None:
        # Fallback mock — útil para testear el frontend sin DB
        return {
            "id": "mock", "code": code, "plan": payload.plan,
            "amount": plan["amount"], "currency": BANK_DATA["currency"],
            "status": "pending",
            "expires_at": expires_at.isoformat(),
            "bank": BANK_DATA,
            "instructions": _build_instructions(code, plan, BANK_DATA),
        }

    async with pool.acquire() as conn:
        # Asegurar que el código no colisione
        for _ in range(5):
            try:
                row = await conn.fetchrow(
                    """
                    INSERT INTO payment_intents (user_id, code, plan, amount, currency, status, expires_at)
                    VALUES ($1::uuid, $2, $3, $4, $5, 'pending'::payment_status, $6)
                    RETURNING id, code, plan, amount, currency, status::text, expires_at, created_at
                    """,
                    user.id, code, payload.plan, plan["amount"], BANK_DATA["currency"], expires_at,
                )
                break
            except Exception:
                code = gen_code()
        else:
            raise HTTPException(500, "No se pudo generar un código único")

        d = dict(row)
        d["id"] = str(d["id"])
        d["bank"] = BANK_DATA
        d["instructions"] = _build_instructions(code, plan, BANK_DATA)
        return d


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
