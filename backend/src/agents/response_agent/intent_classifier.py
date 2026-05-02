"""
Intent Classifier — Usa Gemini 2.5 Flash Lite para clasificar
la intencion de un mensaje entrante.
"""

from typing import Optional
import logging

logger = logging.getLogger("motor25.response")

INTENT_CATEGORIES = {
    "pricing": "Pregunta por precios, planes, descuentos",
    "demo": "Quiere ver demo, probar gratis, trial",
    "support": "Problema tecnico, bug, ayuda con la app",
    "feature": "Pregunta sobre funcionalidades especificas",
    "comparison": "Compara con competidores",
    "coach": "Es coach buscando herramienta para su equipo",
    "athlete": "Es atleta buscando plataforma de entrenamiento",
    "partnership": "Propuesta de partnership, sponsor, colaboracion",
    "complaint": "Queja, reclamo, experiencia negativa",
    "general": "Otro / saludo / conversacion general",
}

CLASSIFIER_SYSTEM_PROMPT = """Eres el clasificador de intencion del Response Agent de Peak Qual (HolyOly + Volta).

Tu unico trabajo es clasificar mensajes entrantes de leads potenciales.

Categorias disponibles:
""" + "\n".join(f"- {k}: {v}" for k, v in INTENT_CATEGORIES.items()) + """

Reglas:
- Analiza el mensaje del usuario
- Determina la categoria mas probable
- Determina si es coach o atleta (o unknown)
- Determina el producto de interes: holyoly, volta, both, o unknown
- Calcula confianza 0-1

Responde SOLO JSON:
{
    "intent": "categoria",
    "intent_confidence": 0.85,
    "user_role": "coach|athlete|unknown",
    "product_interest": "holyoly|volta|both|unknown",
    "urgency": "low|medium|high",
    "summary": "resumen en 10 palabras"
}
"""


class IntentClassifier:
    """Clasifica intenciones usando Gemini 2.5 Flash Lite."""

    def __init__(self, gemini_client):
        self.gemini_client = gemini_client

    async def classify(self, message: str, channel: str = "unknown") -> dict:
        """
        Clasificar un mensaje entrante.

        Args:
            message: texto del mensaje del usuario
            channel: canal de origen (email, webchat, instagram, etc.)

        Returns:
            dict con intent, confidence, user_role, product_interest, urgency
        """
        prompt = f"""
Canal: {channel}
Mensaje del usuario: "{message}"

Clasifica este mensaje segun las categorias definidas.
"""

        try:
            response = await self.gemini_client.generate_flash(
                system_prompt=CLASSIFIER_SYSTEM_PROMPT,
                user_prompt=prompt,
            )

            result = self._parse_json_response(response)
            logger.info(f"[IntentClassifier] classified: {result.get('intent')} (conf: {result.get('intent_confidence', 0):.2f})")
            return result

        except Exception as e:
            logger.error(f"[IntentClassifier] Failed: {e}")
            return {
                "intent": "general",
                "intent_confidence": 0.0,
                "user_role": "unknown",
                "product_interest": "unknown",
                "urgency": "low",
                "summary": "Error al clasificar",
            }

    def _parse_json_response(self, text: str) -> dict:
        """Extraer JSON de la respuesta de Gemini."""
        import json
        import re

        # Buscar bloque JSON
        json_match = re.search(r"\{.*\}", text, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group())
            except json.JSONDecodeError:
                pass

        # Fallback
        return {
            "intent": "general",
            "intent_confidence": 0.3,
            "user_role": "unknown",
            "product_interest": "unknown",
            "urgency": "low",
            "summary": text[:100],
        }
