"""
Response Generator — Genera respuestas con voz de marca.
Tono: energetico y motivador.
Contexto: conoce HolyOly (halterofilia) y Volta (crossfit).
"""

import logging

logger = logging.getLogger("motor25.response")

BRAND_CONTEXT = """
CONTEXTO DE MARCA — PEAK QUAL:

HolyOly: Plataforma de entrenamiento de Halterofilia (Smart training, zero burnout)
- Para coaches: gestion de atletas, sesiones adaptativas, protection de lesiones
- Para atletas: seguimiento de entrenamiento, readiness, gamificacion
- Modelo: Coach paga Premium ($29/mo), Atleta Freemium con coach
- Trial: 45 dias gratis para atletas invitados por coach
- Features: Stress Engine, Session Adaptation AI, Injury Shield, 4 temas premium, Wise Score, OLY Index

Volta: Plataforma de entrenamiento de CrossFit
- Mismo ecosystem, diferente deporte
- Features similares adaptadas a CrossFit

PRECIOS:
- Coach Premium: $29 USD/mes
- Atleta con coach: Freemium (basico)
- Atleta sin coach: registro libre, engines limitados
- Trial: 45 dias Elite gratis

TONO DE RESPUESTA:
- Energetico y motivador
- Usa exclamaciones y emojis moderados
- Cercano, directo, sin jerga corporativa
- Siempre incluye un CTA claro
- Responde en el idioma del usuario (espanol por defecto)
"""

INTENT_RESPONSE_TEMPLATES = {
    "pricing": {
        "greeting": "¡Excelente que quieras saber nuestros precios! 🏋️",
        "coach": "Para coaches, el plan Premium es de **$29 USD/mes**. Incluye todo: gestion ilimitada de atletas, IA de adaptacion de sesiones, Injury Shield, analytics avanzados, y 45 dias de prueba GRATIS. ¡Sin tarjeta de credito! ¿Quieres que te active el trial ahora?",
        "athlete": "Como atleta, si tienes un coach usando HolyOly, ¡tu acceso base es GRATIS! 🎉 Puedes loguear entrenamientos, ver tu progreso, y usar las funcionalidades basicas sin pagar nada. Si quieres las features premium (analytics profundos, temas exclusivos), puedes hacer upgrade. ¿Tu coach ya usa HolyOly?",
        "cta": "¡Empieza tu trial de 45 dias ahora! Solo necesitas registrarte y un coach te invita 👇",
    },
    "demo": {
        "greeting": "¡Por supuesto! Vamos a mostrarte lo que HolyOly puede hacer por ti 🚀",
        "body": "Tenemos un trial de **45 dias completamente gratis** — sin tarjeta de credito, sin compromiso. Puedes ver en tiempo real como funciona el Stress Engine, las sesiones adaptativas, y el Injury Shield protegiendo a tus atletas. ¿Quieres que te mande el link de registro?",
        "cta": "¡Activa tu trial en 2 minutos! 👇",
    },
    "support": {
        "greeting": "¡Hola! Lamento que tengas un problema, pero no te preocupes, lo vamos a resolver 💪",
        "body": "Cuentame mas detalles de lo que esta pasando y te ayudo de inmediato. Si es algo tecnico, puedo escalarlo a nuestro equipo para que lo resuelvan rapido.",
        "cta": "Describeme el problema y me pongo a trabajar 👇",
    },
    "feature": {
        "greeting": "¡Buena pregunta! HolyOly tiene features que ningun coach de halterofilia deberia ignorar 🔥",
        "body": "Nuestros motores principales:\n🧠 **Stress Engine** — modelo Banister: fitness, fatigue, readiness en tiempo real\n🛡️ **Injury Shield** — detecta riesgo de lesion y adapta sesiones automaticamente\n📊 **Session Adaptation** — ajusta cargas segun como se siente el atleta hoy\n🏆 **OLY Index** — ranking competitivo normalizado\n💎 **Wise Score** — premia la inteligencia de entrenamiento\n\n¿Cual te interesa mas?",
        "cta": "Pruebalo gratis 45 dias y lo ves en accion 👇",
    },
    "coach": {
        "greeting": "¡Perfecto! HolyOly fue diseñado EXACTAMENTE para coaches como tu 🎯",
        "body": "Con HolyOly puedes:\n✅ Gestionar todos tus atletas desde un panel\n✅ Ver quien esta en riesgo de lesion ANTES de que pase\n✅ Asignar macrociclos de 9 escuelas de halterofilia\n✅ Adaptar sesiones automaticamente segun readiness\n✅ Recibir alertas inteligentes de overreaching\n\nTodo por **$29/mes** con **45 dias de prueba gratis**. Sin tarjeta de credito.",
        "cta": "¿Cuantos atletas manejas? Te digo cuanto tiempo te ahorra HolyOly 👇",
    },
    "athlete": {
        "greeting": "¡Que bueno que quieras entrenar mas inteligente! 🏋️‍♂️",
        "body": "HolyOly es tu companero de entrenamiento. Te dice cuando estas listo para darlo todo y cuando necesitas recuperar. Con el Injury Shield, entrenas duro pero SIN quemarte.\n\nSi tu coach usa HolyOly, tu acceso base es **100% GRATIS**. Si no, puedes registrarte y conectar con un coach despues.",
        "cta": "Registrate gratis y empieza a entrenar inteligente 👇",
    },
    "comparison": {
        "greeting": "Buena comparacion! Te digo exactamente que nos hace diferentes 💡",
        "body": "A diferencia de otras apps de entrenamiento, HolyOly:\n🔹 Se ADAPTA automaticamente segun tu readiness diario\n🔹 Predice lesiones con el Injury Shield antes de que ocurran\n🔹 Tiene 19 macrociclos de 9 escuelas reales de halterofilia\n🔹 Gamificacion con XP, cinturones, y streaks\n🔹 El coach ve todo en tiempo real y puede intervenir cuando importa\n\nNo es solo un log de entrenamientos. Es un sistema inteligente de proteccion y optimizacion.",
        "cta": "Pruebalo 45 dias y comparalo tu mismo 👇",
    },
}

DEFAULT_RESPONSE = {
    "greeting": "¡Hola! Gracias por escribirnos 🙌",
    "body": "En Peak Qual estamos aqui para ayudarte con lo que necesites, ya sea HolyOly para halterofilia o Volta para CrossFit. ¿En que te puedo ayudar?",
    "cta": "Cuentame mas y te ayudo de inmediato 👇",
}


class ResponseGenerator:
    """Genera respuestas con voz de marca usando templates + Gemini."""

    def __init__(self, gemini_client):
        self.gemini_client = gemini_client

    async def generate(self, intent: str, user_role: str, product: str, message: str, channel: str = "email") -> str:
        """
        Generar respuesta para un lead.

        Args:
            intent: categoria de intencion clasificada
            user_role: coach, athlete, o unknown
            product: holyoly, volta, both, unknown
            message: mensaje original del usuario
            channel: canal de origen

        Returns:
            String con la respuesta completa
        """
        template = INTENT_RESPONSE_TEMPLATES.get(intent, INTENT_RESPONSE_TEMPLATES.get("general", DEFAULT_RESPONSE))

        # Seleccionar body segun rol
        body = template.get(user_role, template.get("body", DEFAULT_RESPONSE["body"]))

        # Construir respuesta base del template
        base_response = f"{template['greeting']}\n\n{body}\n\n{template['cta']}"

        # Si el mensaje es complejo o no esta en templates, usar Gemini
        if intent == "general" or len(message) > 200 or intent in ("complaint", "partnership"):
            return await self._generate_gemini_response(intent, user_role, product, message, channel)

        return base_response

    async def _generate_gemini_response(self, intent: str, user_role: str, product: str, message: str, channel: str) -> str:
        """Generar respuesta personalizada con Gemini."""
        prompt = f"""
{BRAND_CONTEXT}

INTENT DEL USUARIO: {intent}
ROL: {user_role}
PRODUCTO DE INTERES: {product}
CANAL: {channel}
MENSAJE DEL USUARIO: "{message}"

Genera una respuesta energetica y motivadora. Maximo 150 palabras.
Incluye un CTA claro al final.
Responde en espanol.
"""

        try:
            response = await self.gemini_client.generate_flash(
                user_prompt=prompt,
            )
            return response.strip()
        except Exception as e:
            logger.error(f"[ResponseGenerator] Gemini failed: {e}")
            return DEFAULT_RESPONSE["greeting"] + "\n\n" + DEFAULT_RESPONSE["body"]
