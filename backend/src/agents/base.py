"""
Clase base para todos los agentes de Motor 25.
Cada agente hereda de esto: logging, decision log, error handling.
"""

import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Optional

logger = logging.getLogger("motor25")


class AgentName(str, Enum):
    TEST = "test"
    SECURITY = "security"
    GROWTH = "growth"
    RESPONSE = "response"
    CONTENT = "content"


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class ActionMode(str, Enum):
    AUTO = "auto"
    RECOMMEND = "recommend"
    FAILED = "failed"


@dataclass
class AgentDecision:
    """Registro de una decision tomada por un agente."""
    agent_name: AgentName
    decision_type: str
    action: ActionMode
    risk_level: RiskLevel
    context: dict
    recommendation: Optional[dict] = None
    confidence: float = 0.0
    human_override: bool = False
    override_reason: Optional[str] = None
    outcome: Optional[dict] = None
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class AgentResult:
    """Resultado de una ejecucion de agente."""
    success: bool
    agent_name: AgentName
    action: str
    data: Optional[Any] = None
    error: Optional[str] = None
    execution_time_ms: int = 0


class BaseAgent(ABC):
    """
    Clase base para todos los agentes.

    Subclases deben implementar:
    - name: nombre del agente
    - run(): logica principal
    - _auto_actions(): acciones de bajo riesgo (auto-ejecutar)
    - _recommendations(): acciones de alto riesgo (sugerir)
    """

    name: AgentName
    auto_confidence_threshold: float = 0.75

    def __init__(self, db_pool=None, gemini_client=None):
        self.db_pool = db_pool
        self.gemini_client = gemini_client
        self._decisions: list[AgentDecision] = []

    @abstractmethod
    async def run(self, **kwargs) -> AgentResult:
        """Ejecutar la logica principal del agente."""
        pass

    async def execute_auto(self, decision: AgentDecision) -> AgentResult:
        """
        Ejecutar accion automatica si confidence >= threshold y risk = LOW.
        Si no, log como recomendacion.
        """
        if decision.risk_level == RiskLevel.LOW and decision.confidence >= self.auto_confidence_threshold:
            decision.action = ActionMode.AUTO
            try:
                result = await self._execute_action(decision)
                decision.outcome = {"success": result.success, "data": str(result.data)}
                return result
            except Exception as e:
                decision.action = ActionMode.FAILED
                decision.outcome = {"error": str(e)}
                logger.error(f"[{self.name.value}] Auto action failed: {e}")
                return AgentResult(success=False, agent_name=self.name, action=decision.decision_type, error=str(e))
        else:
            decision.action = ActionMode.RECOMMEND
            logger.info(f"[{self.name.value}] Recommendation queued: {decision.decision_type} (confidence: {decision.confidence})")
            return AgentResult(success=True, agent_name=self.name, action=f"recommend:{decision.decision_type}", data=decision.recommendation)

    async def _execute_action(self, decision: AgentDecision) -> AgentResult:
        """
        Hook para ejecutar la accion concreta.
        Subclases pueden sobrescribir para logica custom.
        """
        raise NotImplementedError("Subclasses must implement _execute_action")

    def log_decision(self, decision: AgentDecision):
        """Guardar decision en memoria y (si hay DB) persistir."""
        self._decisions.append(decision)
        logger.info(
            f"[{self.name.value}] Decision: {decision.decision_type} | "
            f"Action: {decision.action.value} | "
            f"Risk: {decision.risk_level.value} | "
            f"Confidence: {decision.confidence:.2f}"
        )

    def get_recent_decisions(self, limit: int = 20) -> list[AgentDecision]:
        """Obtener decisiones recientes."""
        return self._decisions[-limit:]

    async def _save_decision_to_db(self, decision: AgentDecision):
        """Persistir decision en PostgreSQL."""
        if not self.db_pool:
            return

        query = """
            INSERT INTO agent_decisions
            (agent_name, decision_type, action_taken, risk_level, context,
             recommendation, confidence, human_override, override_reason, outcome)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        """
        try:
            await self.db_pool.execute(
                query,
                decision.agent_name.value,
                decision.decision_type,
                decision.action.value,
                decision.risk_level.value,
                decision.context,
                decision.recommendation,
                decision.confidence,
                decision.human_override,
                decision.override_reason,
                decision.outcome,
            )
        except Exception as e:
            logger.warning(f"[{self.name.value}] Failed to save decision to DB: {e}")
