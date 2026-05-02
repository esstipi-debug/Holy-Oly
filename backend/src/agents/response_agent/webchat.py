"""
WebChat Handler — Procesa mensajes del widget web en la pagina.
"""

import logging
import time

logger = logging.getLogger("motor25.response")


class WebChatHandler:
    """
    Maneja conversaciones del widget web de chat.

    El frontend envia mensajes via POST a /api/v1/webchat/message
    Este handler clasifica, captura lead, y genera respuesta.
    """

    def __init__(self, intent_classifier, response_generator, lead_capture):
        self.intent_classifier = intent_classifier
        self.response_generator = response_generator
        self.lead_capture = lead_capture

    async def handle_message(self, message: str, session_id: str,
                              email: str = None, name: str = None) -> dict:
        """
        Procesar mensaje del webchat.

        Args:
            message: texto del mensaje
            session_id: ID de sesion del chat
            email: email del usuario (si lo proporciono)
            name: nombre del usuario (si lo proporciono)

        Returns:
            dict con respuesta, lead info
        """
        start_time = time.time()

        # Clasificar intencion
        intent_data = await self.intent_classifier.classify(message, channel="webchat")

        # Crear o actualizar lead
        lead = self.lead_capture.create_lead(
            channel="webchat",
            channel_user_id=session_id,
            intent=intent_data.get("intent", "general"),
            intent_confidence=intent_data.get("intent_confidence", 0.0),
            user_role=intent_data.get("user_role", "unknown"),
            product_interest=intent_data.get("product_interest", "unknown"),
            urgency=intent_data.get("urgency", "low"),
            email=email,
            name=name,
        )

        lead_id = await self.lead_capture.save_lead(lead)

        # Generar respuesta
        response_text = await self.response_generator.generate(
            intent=intent_data.get("intent", "general"),
            user_role=intent_data.get("user_role", "unknown"),
            product=intent_data.get("product_interest", "unknown"),
            message=message,
            channel="webchat",
        )

        response_time_ms = int((time.time() - start_time) * 1000)

        # Log conversacion
        await self.lead_capture.log_conversation(
            lead_id=lead_id,
            channel="webchat",
            direction="inbound",
            content=message,
            response_time_ms=response_time_ms,
        )

        await self.lead_capture.log_conversation(
            lead_id=lead_id,
            channel="webchat",
            direction="outbound",
            content=response_text,
            response_time_ms=response_time_ms,
        )

        return {
            "lead_id": lead_id,
            "lead_score": lead.lead_score,
            "response": response_text,
            "response_time_ms": response_time_ms,
            "intent": intent_data.get("intent"),
            "suggested_actions": self._get_suggested_actions(intent_data),
        }

    def _get_suggested_actions(self, intent_data: dict) -> list:
        """Acciones sugeridas para el frontend del chat."""
        intent = intent_data.get("intent", "general")
        actions = []

        if intent in ("pricing", "demo", "coach"):
            actions.append({"type": "cta_button", "label": "Empezar Trial Gratis", "url": "/register"})
        if intent == "pricing":
            actions.append({"type": "link", "label": "Ver Planes Completos", "url": "/pricing"})
        if intent in ("support", "complaint"):
            actions.append({"type": "cta_button", "label": "Hablar con un Humano", "url": "/support"})
        if intent == "feature":
            actions.append({"type": "link", "label": "Ver Documentacion", "url": "/docs"})

        return actions
