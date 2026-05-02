"""
Response Router — Webhook router para todos los canales.
Registra endpoints para email, webchat, y prepara IG/WhatsApp/TikTok.
"""

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional
import logging
import time

logger = logging.getLogger("motor25.response")

router = APIRouter(prefix="/api/v1", tags=["response-agent"])


class WebChatRequest(BaseModel):
    message: str
    session_id: str
    email: Optional[str] = None
    name: Optional[str] = None


class LeadResponse(BaseModel):
    lead_id: Optional[str] = None
    lead_score: int = 0
    response: str
    response_time_ms: int = 0
    intent: str = "general"
    suggested_actions: list = []


class LeadDetail(BaseModel):
    id: str
    channel: str
    name: Optional[str] = None
    email: Optional[str] = None
    intent: str
    lead_score: int
    status: str
    product_interest: str
    first_contact_at: str


# Global agent references (set during app startup)
_email_handler = None
_webchat_handler = None
_lead_capture = None


def set_handlers(email_handler, webchat_handler, lead_capture):
    """Set handler instances (called during app startup)."""
    global _email_handler, _webchat_handler, _lead_capture
    _email_handler = email_handler
    _webchat_handler = webchat_handler
    _lead_capture = lead_capture


# ============ WEBCAT ENDPOINTS ============

@router.post("/webchat/message", response_model=LeadResponse)
async def handle_webchat_message(request: WebChatRequest):
    """Procesar mensaje del widget web de chat."""
    if not _webchat_handler:
        raise HTTPException(status_code=503, detail="Response Agent not initialized")

    try:
        result = await _webchat_handler.handle_message(
            message=request.message,
            session_id=request.session_id,
            email=request.email,
            name=request.name,
        )
        return LeadResponse(**result)
    except Exception as e:
        logger.error(f"[WebChat] Error: {e}")
        return LeadResponse(
            response="¡Ups! Algo salio mal. Pero no te preocupes, un humano te respondera pronto 💪",
            intent="general",
        )


# ============ EMAIL INBOUND WEBHOOK ============

@router.post("/webhooks/resend-inbound")
async def handle_resend_inbound(request: Request):
    """Webhook de Resend para emails entrantes."""
    if not _email_handler:
        raise HTTPException(status_code=503, detail="Response Agent not initialized")

    try:
        data = await request.json()
        result = await _email_handler.handle_inbound(data)

        if "error" in result:
            logger.error(f"[EmailInbound] Error: {result['error']}")
            return {"status": "error", "detail": result["error"]}

        # Enviar respuesta automatica por email
        if result.get("auto_send"):
            to_email = data.get("from", {}).get("email", data.get("From", ""))
            subject = f"Re: {data.get('subject', data.get('Subject', ''))}"

            await _email_handler.send_reply(
                to_email=to_email,
                subject=subject,
                body=result["response"],
            )

        return {
            "status": "ok",
            "lead_id": result.get("lead_id"),
            "lead_score": result.get("lead_score"),
            "intent": result.get("intent"),
            "response_sent": result.get("auto_send"),
        }
    except Exception as e:
        logger.error(f"[EmailInbound] Webhook error: {e}")
        return {"status": "error", "detail": str(e)}


# ============ INSTAGRAM WEBHOOK (preparado) ============

@router.post("/webhooks/instagram")
async def handle_instagram_webhook(request: Request):
    """
    Webhook de Instagram para comments.
    Se activa cuando se configure Meta Developer App.
    """
    # TODO: Implement when Meta Developer account is ready
    logger.info("[Instagram] Webhook received (placeholder)")
    return {"status": "ok", "message": "Instagram webhook ready — configure Meta Developer App to activate"}


@router.get("/webhooks/instagram")
async def verify_instagram_webhook(request: Request):
    """
    Verificacion del webhook de Instagram (Meta challenge).
    """
    # TODO: Implement Meta webhook verification
    params = dict(request.query_params)
    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge")

    if mode == "subscribe" and token == "holyoly_verify_2026":
        return int(challenge)
    return {"error": "Invalid verification token"}


# ============ TIKTOK WEBHOOK (preparado) ============

@router.post("/webhooks/tiktok")
async def handle_tiktok_webhook(request: Request):
    """
    Webhook de TikTok para comments.
    Se activa cuando se configure TikTok Developer App.
    """
    # TODO: Implement when TikTok Developer account is ready
    logger.info("[TikTok] Webhook received (placeholder)")
    return {"status": "ok", "message": "TikTok webhook ready — configure TikTok Developer App to activate"}


# ============ WHATSAPP WEBHOOK (preparado) ============

@router.post("/webhooks/whatsapp")
async def handle_whatsapp_webhook(request: Request):
    """
    Webhook de WhatsApp Business API.
    Se activa cuando se configure WhatsApp Business.
    """
    # TODO: Implement when WhatsApp Business API is ready
    logger.info("[WhatsApp] Webhook received (placeholder)")
    return {"status": "ok", "message": "WhatsApp webhook ready — configure WhatsApp Business API to activate"}


# ============ LEADS CRUD ============

@router.get("/agents/response/leads")
async def get_leads(status: str = None, channel: str = None, limit: int = 50):
    """Obtener lista de leads capturados."""
    if not _lead_capture or not _lead_capture.db_pool:
        return {"leads": [], "total": 0}

    query = "SELECT * FROM leads WHERE 1=1"
    params = []
    param_idx = 1

    if status:
        query += f" AND status = ${param_idx}"
        params.append(status)
        param_idx += 1
    if channel:
        query += f" AND channel = ${param_idx}"
        params.append(channel)
        param_idx += 1

    query += f" ORDER BY lead_score DESC, first_contact_at DESC LIMIT {limit}"

    try:
        rows = await _lead_capture.db_pool.fetch(query, *params)
        return {
            "leads": [dict(r) for r in rows],
            "total": len(rows),
        }
    except Exception as e:
        logger.error(f"[Leads] Failed to fetch: {e}")
        return {"leads": [], "total": 0, "error": str(e)}


@router.get("/agents/response/leads/{lead_id}")
async def get_lead_detail(lead_id: str):
    """Obtener detalle de un lead + conversaciones."""
    if not _lead_capture or not _lead_capture.db_pool:
        raise HTTPException(status_code=503, detail="DB not available")

    try:
        lead = await _lead_capture.db_pool.fetchrow(
            "SELECT * FROM leads WHERE id = $1", lead_id
        )
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")

        conversations = await _lead_capture.db_pool.fetch(
            "SELECT * FROM agent_conversations WHERE lead_id = $1 ORDER BY created_at DESC",
            lead_id,
        )

        return {
            "lead": dict(lead),
            "conversations": [dict(c) for c in conversations],
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Leads] Failed to fetch detail: {e}")
        raise HTTPException(status_code=500, detail=str(e))
