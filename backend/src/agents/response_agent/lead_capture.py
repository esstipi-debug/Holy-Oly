"""
Lead Capture — Captura leads desde cualquier canal, asigna score.
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

logger = logging.getLogger("motor25.response")


@dataclass
class Lead:
    """Representa un lead capturado."""
    channel: str
    channel_user_id: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    intent: str = "general"
    intent_confidence: float = 0.0
    lead_score: int = 0
    status: str = "new"
    product_interest: str = "unknown"
    user_role: str = "unknown"
    notes: Optional[str] = None
    id: Optional[str] = None
    first_contact_at: datetime = field(default_factory=datetime.utcnow)
    last_contact_at: Optional[datetime] = None
    converted_at: Optional[datetime] = None


SCORE_RULES = {
    # Intencion: preguntas de pricing y demo = alta intencion
    "intent_pricing": 25,
    "intent_demo": 20,
    "intent_coach": 20,
    "intent_athlete": 10,
    "intent_support": 5,
    "intent_general": 0,

    # Rol: coaches valen mas (ellos pagan)
    "role_coach": 20,
    "role_athlete": 10,

    # Urgencia
    "urgency_high": 15,
    "urgency_medium": 10,
    "urgency_low": 0,

    # Canal: webchat e IG = mas engagement
    "channel_webchat": 10,
    "channel_instagram": 10,
    "channel_whatsapp": 10,
    "channel_email": 5,
    "channel_tiktok": 5,
}


class LeadCapture:
    """Captura, scorea y persiste leads."""

    def __init__(self, db_pool=None):
        self.db_pool = db_pool

    def calculate_score(self, intent: str, user_role: str, urgency: str, channel: str) -> int:
        """
        Calcular score 0-100 del lead basado en reglas.

        Factores:
        - Intencion (pricing/demo = alto)
        - Rol (coach = alto porque paga)
        - Urgencia
        - Canal (webchat/IG = mas engagement)
        """
        score = 0

        score += SCORE_RULES.get(f"intent_{intent}", 0)
        score += SCORE_RULES.get(f"role_{user_role}", 0)
        score += SCORE_RULES.get(f"urgency_{urgency}", 0)
        score += SCORE_RULES.get(f"channel_{channel}", 0)

        return min(100, score)

    def create_lead(self, channel: str, channel_user_id: str, intent: str,
                    intent_confidence: float, user_role: str, product_interest: str,
                    urgency: str, email: str = None, name: str = None,
                    phone: str = None) -> Lead:
        """Crear un nuevo lead con score calculado."""
        score = self.calculate_score(intent, user_role, urgency, channel)

        lead = Lead(
            channel=channel,
            channel_user_id=channel_user_id,
            intent=intent,
            intent_confidence=intent_confidence,
            user_role=user_role,
            product_interest=product_interest,
            email=email,
            name=name,
            phone=phone,
            lead_score=score,
        )

        logger.info(f"[LeadCapture] New lead: {lead.name or lead.channel_user_id} | "
                     f"Channel: {channel} | Intent: {intent} | Score: {score}")
        return lead

    async def save_lead(self, lead: Lead) -> Optional[str]:
        """Persistir lead en PostgreSQL. Retorna el ID."""
        if not self.db_pool:
            logger.warning("[LeadCapture] No DB pool, lead not persisted")
            return None

        query = """
            INSERT INTO leads
            (channel, channel_user_id, name, email, phone, intent,
             intent_confidence, lead_score, status, product_interest, user_role,
             first_contact_at, last_contact_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING id
        """
        try:
            row = await self.db_pool.fetchrow(
                query,
                lead.channel,
                lead.channel_user_id,
                lead.name,
                lead.email,
                lead.phone,
                lead.intent,
                lead.intent_confidence,
                lead.lead_score,
                lead.status,
                lead.product_interest,
                lead.user_role,
                lead.first_contact_at,
                lead.last_contact_at or lead.first_contact_at,
            )
            lead.id = str(row["id"])
            logger.info(f"[LeadCapture] Saved lead: {lead.id}")
            return lead.id
        except Exception as e:
            logger.error(f"[LeadCapture] Failed to save lead: {e}")
            return None

    async def log_conversation(self, lead_id: str, channel: str, direction: str,
                                content: str, gemini_model: str = None,
                                tokens_used: int = 0, response_time_ms: int = 0):
        """Log de conversacion para un lead."""
        if not self.db_pool or not lead_id:
            return

        query = """
            INSERT INTO agent_conversations
            (lead_id, channel, direction, content, gemini_model, tokens_used, response_time_ms)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        """
        try:
            await self.db_pool.execute(
                query, lead_id, channel, direction, content,
                gemini_model, tokens_used, response_time_ms,
            )
        except Exception as e:
            logger.error(f"[LeadCapture] Failed to log conversation: {e}")
