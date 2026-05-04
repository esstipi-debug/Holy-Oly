"""
Response Agent — Agente de respuesta multi-canal con budget awareness.
Captura leads de email, webchat, IG, WhatsApp, TikTok.
Responde con voz de marca: energetico y motivador.
Cada lead capturado gana credits para el agente.
"""

from .intent_classifier import IntentClassifier
from .response_generator import ResponseGenerator
from .lead_capture import LeadCapture
from .email_handler import EmailInboundHandler
from .webchat import WebChatHandler
from .router import router, set_handlers

__all__ = [
    "IntentClassifier",
    "ResponseGenerator",
    "LeadCapture",
    "EmailInboundHandler",
    "WebChatHandler",
    "router",
    "set_handlers",
]
