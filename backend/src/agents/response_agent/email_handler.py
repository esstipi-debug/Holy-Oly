"""
Email Inbound Handler — Procesa emails entrantes via Resend.
"""

import logging
import time
from typing import Optional

logger = logging.getLogger("motor25.response")

EMAIL_INBOUND_WEBHOOK_SECRET = None  # Set from env var


class EmailInboundHandler:
    """
    Procesa emails entrantes de Resend inbound webhook.

    Resend envia un POST a /api/v1/webhooks/resend-inbound con:
    - from: email del remitente
    - subject: asunto
    - text: cuerpo del email
    - html: cuerpo HTML (si existe)
    - to: email destino (hola@holyoly.com)
    """

    def __init__(self, intent_classifier, response_generator, lead_capture, resend_api_key: str = None):
        self.intent_classifier = intent_classifier
        self.response_generator = response_generator
        self.lead_capture = lead_capture
        self.resend_api_key = resend_api_key

    async def handle_inbound(self, data: dict) -> dict:
        """
        Procesar email entrante y generar respuesta.

        Args:
            data: payload del webhook de Resend

        Returns:
            dict con lead_id, response, y metadata
        """
        start_time = time.time()

        sender_email = data.get("from", {}).get("email", data.get("From", ""))
        sender_name = data.get("from", {}).get("full_name", data.get("From", ""))
        subject = data.get("subject", data.get("Subject", ""))
        message_body = data.get("text", data.get("Text", ""))

        if not sender_email:
            logger.warning("[EmailInbound] No sender email in webhook")
            return {"error": "No sender email"}

        # Full message = subject + body
        full_message = f"{subject}\n\n{message_body}".strip()

        # Clasificar intencion
        intent_data = await self.intent_classifier.classify(full_message, channel="email")

        # Crear lead
        lead = self.lead_capture.create_lead(
            channel="email",
            channel_user_id=sender_email,
            intent=intent_data.get("intent", "general"),
            intent_confidence=intent_data.get("intent_confidence", 0.0),
            user_role=intent_data.get("user_role", "unknown"),
            product_interest=intent_data.get("product_interest", "unknown"),
            urgency=intent_data.get("urgency", "low"),
            email=sender_email,
            name=sender_name if sender_name != sender_email else None,
        )

        # Guardar lead
        await self.lead_capture.save_lead(lead)

        # Generar respuesta
        response_text = await self.response_generator.generate(
            intent=intent_data.get("intent", "general"),
            user_role=intent_data.get("user_role", "unknown"),
            product=intent_data.get("product_interest", "unknown"),
            message=full_message,
            channel="email",
        )

        response_time_ms = int((time.time() - start_time) * 1000)

        # Log conversacion
        await self.lead_capture.log_conversation(
            lead_id=lead.id,
            channel="email",
            direction="inbound",
            content=full_message,
            response_time_ms=response_time_ms,
        )

        return {
            "lead_id": lead.id,
            "lead_score": lead.lead_score,
            "intent": intent_data.get("intent"),
            "response": response_text,
            "response_time_ms": response_time_ms,
            "auto_send": True,
        }

    async def send_reply(self, to_email: str, subject: str, body: str,
                          in_reply_to: str = None) -> dict:
        """
        Enviar respuesta via Resend API.

        Args:
            to_email: email del lead
            subject: asunto del email
            body: cuerpo del email (puede ser HTML)
            in_reply_to: message-id del email original para threading

        Returns:
            dict con id del email enviado
        """
        if not self.resend_api_key:
            logger.warning("[EmailInbound] No Resend API key, email not sent")
            return {"error": "No Resend API key configured"}

        import httpx

        headers = {
            "Authorization": f"Bearer {self.resend_api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "from": "Peak Qual <hola@holyoly.com>",
            "to": [to_email],
            "subject": subject,
            "html": body,
        }

        if in_reply_to:
            payload["headers"] = {"In-Reply-To": in_reply_to}

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post("https://api.resend.com/emails", json=payload, headers=headers)
                resp.raise_for_status()
                result = resp.json()
                logger.info(f"[EmailInbound] Reply sent to {to_email}: {result.get('id')}")
                return result
        except Exception as e:
            logger.error(f"[EmailInbound] Failed to send reply: {e}")
            return {"error": str(e)}
