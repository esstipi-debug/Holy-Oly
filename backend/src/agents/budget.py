"""
Agent Budget System — Ciclo largo de gobernanza trimestral/anual.

Los agentes operan con presupuesto BASE aprobado por el humano.
Cada ciclo (trimestral) se revisa ROI y el humano aprueba ajustes.
Las ventas anuales consolidan el presupuesto para el año siguiente.

CICLO:
  1. LAUNCH     → Budget base mínimo (aprobado por humano)
  2. OPERACIÓN  → Agentes trabajan dentro del budget, generan valor
  3. REVIEW     → Reporte trimestral de ROI (auto-generado)
  4. DECISIÓN   → Humano aprueba/rechaza ajustes de presupuesto
  5. CONSOLIDACIÓN → Ventas anuales → budget del año siguiente

Esto evita que los agentes gasten sin control y alinea el gasto de APIs
con la realidad del negocio (ventas reales, no metricas vanidosas).
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional

logger = logging.getLogger("motor25.budget")


class BudgetCycle(str, Enum):
    LAUNCH = "launch"
    Q1 = "q1"
    Q2 = "q2"
    Q3 = "q3"
    Q4 = "q4"
    ANNUAL_CONSOLIDATION = "annual_consolidation"


class ApprovalStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CONDITIONAL = "conditional"


@dataclass
class AgentBudgetConfig:
    """Configuracion de presupuesto de un agente para el ciclo actual."""
    agent_name: str
    daily_token_limit: int
    daily_email_limit: int
    daily_api_call_limit: int
    max_model: str
    monthly_budget_usd: float
    can_use_gemini_pro: bool = False
    can_use_github_api: bool = True
    notes: str = ""


@dataclass
class BudgetCycleReport:
    """Reporte generado al final de un ciclo para revision humana."""
    cycle: BudgetCycle
    period_start: datetime
    period_end: datetime
    generated_at: datetime = field(default_factory=datetime.utcnow)

    # Metricas de negocio
    total_revenue_usd: float = 0.0
    new_conversions: int = 0
    churn_saved: int = 0
    leads_captured: int = 0
    leads_responded: int = 0

    # Metricas de agente
    agent_usage: dict = field(default_factory=dict)  # {agent_name: {tokens, emails, api_calls, decisions}}
    agent_effectiveness: dict = field(default_factory=dict)  # {agent_name: {conversions_attributed, revenue_attributed}}

    # Gasto real en APIs
    api_spending_usd: float = 0.0
    gemini_cost_usd: float = 0.0
    resend_cost_usd: float = 0.0
    github_api_cost_usd: float = 0.0

    # ROI
    roi: float = 0.0  # revenue / api_spending

    # Recomendacion del agente (auto-generada)
    budget_recommendation: dict = field(default_factory=dict)
    # {agent_name: {"request_increase": bool, "requested_budget": float, "reason": str}}

    # Estado de approval
    approval_status: ApprovalStatus = ApprovalStatus.PENDING
    human_notes: str = ""
    approved_budgets: dict = field(default_factory=dict)  # {agent_name: next_cycle_config}


@dataclass
class AnnualConsolidation:
    """Consolidacion anual de ventas y presupuesto para el año siguiente."""
    year: int
    total_revenue_usd: float = 0.0
    total_api_spending_usd: float = 0.0
    net_profit_usd: float = 0.0
    total_conversions: int = 0
    total_churn_saved: int = 0
    total_leads: int = 0

    # Porcentaje de revenue destinado a APIs (default 5%)
    api_budget_pct: float = 5.0
    next_year_api_budget_usd: float = 0.0

    # Decisiones humanas
    human_approved: bool = False
    human_notes: str = ""
    approved_at: Optional[datetime] = None


# ============================================================
# DEFAULT BUDGET CONFIGS POR CICLO
# ============================================================

DEFAULT_CYCLE_BUDGETS = {
    BudgetCycle.LAUNCH: {
        "response_agent": AgentBudgetConfig(
            agent_name="response_agent",
            daily_token_limit=5_000,
            daily_email_limit=10,
            daily_api_call_limit=20,
            max_model="gemini-2.0-flash-lite",
            monthly_budget_usd=5.0,
            can_use_gemini_pro=False,
            notes="Budget minimo para capturar primeros leads",
        ),
        "growth_agent": AgentBudgetConfig(
            agent_name="growth_agent",
            daily_token_limit=2_000,
            daily_email_limit=5,
            daily_api_call_limit=5,
            max_model="gemini-2.0-flash-lite",
            monthly_budget_usd=3.0,
            can_use_gemini_pro=False,
            notes="Solo trial reminders basicos",
        ),
        "security_agent": AgentBudgetConfig(
            agent_name="security_agent",
            daily_token_limit=1_000,
            daily_email_limit=0,
            daily_api_call_limit=10,
            max_model="gemini-2.0-flash-lite",
            monthly_budget_usd=1.0,
            can_use_gemini_pro=False,
            notes="Escaneo basico de seguridad",
        ),
        "test_agent": AgentBudgetConfig(
            agent_name="test_agent",
            daily_token_limit=1_000,
            daily_email_limit=0,
            daily_api_call_limit=5,
            max_model="gemini-2.0-flash-lite",
            monthly_budget_usd=1.0,
            can_use_gemini_pro=False,
            notes="Solo post-deploy tests",
        ),
        "content_agent": AgentBudgetConfig(
            agent_name="content_agent",
            daily_token_limit=2_000,
            daily_email_limit=0,
            daily_api_call_limit=5,
            max_model="gemini-2.0-flash-lite",
            monthly_budget_usd=2.0,
            can_use_gemini_pro=False,
            notes="Pildoras diarias basicas",
        ),
    },
    BudgetCycle.Q1: {
        "response_agent": AgentBudgetConfig(
            agent_name="response_agent",
            daily_token_limit=20_000,
            daily_email_limit=50,
            daily_api_call_limit=50,
            max_model="gemini-2.0-flash",
            monthly_budget_usd=25.0,
            can_use_gemini_pro=False,
            notes="Si Q1 genera >$500 en ventas",
        ),
        "growth_agent": AgentBudgetConfig(
            agent_name="growth_agent",
            daily_token_limit=10_000,
            daily_email_limit=25,
            daily_api_call_limit=20,
            max_model="gemini-2.0-flash",
            monthly_budget_usd=15.0,
            can_use_gemini_pro=False,
            notes="A/B tests basicos",
        ),
        "security_agent": AgentBudgetConfig(
            agent_name="security_agent",
            daily_token_limit=2_000,
            daily_email_limit=0,
            daily_api_call_limit=20,
            max_model="gemini-2.0-flash-lite",
            monthly_budget_usd=3.0,
            can_use_gemini_pro=False,
        ),
        "test_agent": AgentBudgetConfig(
            agent_name="test_agent",
            daily_token_limit=2_000,
            daily_email_limit=0,
            daily_api_call_limit=10,
            max_model="gemini-2.0-flash-lite",
            monthly_budget_usd=2.0,
            can_use_gemini_pro=False,
        ),
        "content_agent": AgentBudgetConfig(
            agent_name="content_agent",
            daily_token_limit=5_000,
            daily_email_limit=0,
            daily_api_call_limit=10,
            max_model="gemini-2.0-flash",
            monthly_budget_usd=8.0,
            can_use_gemini_pro=False,
        ),
    },
}

# ============================================================
# TRACKING DE GASTO EN TIEMPO REAL
# ============================================================

@dataclass
class SpendingRecord:
    """Registro de un gasto individual."""
    agent_name: str
    resource_type: str  # tokens, email, api_call
    amount: float
    estimated_cost_usd: float
    timestamp: datetime = field(default_factory=datetime.utcnow)
    context: dict = field(default_factory=dict)


# Costos estimados por unidad (para tracking)
# Mistral pricing: small $0.10/1M input, $0.30/1M output
UNIT_COSTS_USD = {
    "tokens_mistral_small": 0.00000010,   # $0.10 / 1M tokens input
    "tokens_mistral_medium": 0.00000020,  # $0.20 / 1M tokens input
    "tokens_mistral_large": 0.00000200,   # $2.00 / 1M tokens input
    "email_sent": 0.0,                     # Resend: 3000/mo gratis
    "github_api_call": 0.0,                # GitHub API: gratis (rate limited)
}


class BudgetManager:
    """
    Gestiona el budget de agentes con ciclo de gobernanza largo.

    Flujo:
    1. setup_cycle(cycle) → Carga budgets aprobados para el ciclo
    2. check_budget(agent, resource, amount) → Verifica si puede gastar
    3. spend(agent, type, amount) → Registra gasto
    4. generate_cycle_report() → Genera reporte para revision humana
    5. human_approve_budgets(report, decisions) → Humano aprueba budgets del proximo ciclo

    Uso:
        budget = BudgetManager(db_pool)
        budget.setup_cycle(BudgetCycle.LAUNCH)

        # Verificar antes de gastar
        if budget.check_budget("response_agent", "tokens", 2000):
            response = await gemini.generate(prompt)
            budget.spend("response_agent", "tokens_flash_lite", 2000)

        # Al final del trimestre
        report = budget.generate_cycle_report(revenue_data)
        # Humano revisa report y aprueba budgets para Q1
        budget.human_approve_budgets(report, {
            "response_agent": {"monthly_budget_usd": 25.0, ...},
            ...
        })
    """

    def __init__(self, db_pool=None):
        self.db_pool = db_pool
        self.current_cycle: BudgetCycle = BudgetCycle.LAUNCH
        self.agent_configs: dict[str, AgentBudgetConfig] = {}
        self.spending_records: list[SpendingRecord] = []
        self.cycle_start: datetime = datetime.utcnow()
        self.current_report: Optional[BudgetCycleReport] = None
        self.annual_consolidations: list[AnnualConsolidation] = []

        # Contadores diarios (reset a medianoche)
        self._daily_usage: dict[str, dict] = {}
        self._last_reset: datetime = datetime.utcnow()

    def setup_cycle(self, cycle: BudgetCycle, custom_configs: dict = None):
        """
        Configurar budget para un nuevo ciclo.

        Args:
            cycle: BudgetCycle (LAUNCH, Q1, Q2, Q3, Q4)
            custom_configs: Dict {agent_name: AgentBudgetConfig} para overrides
        """
        self.current_cycle = cycle
        self.cycle_start = datetime.utcnow()
        self.spending_records = []
        self._daily_usage = {}
        self._last_reset = datetime.utcnow()

        defaults = DEFAULT_CYCLE_BUDGETS.get(cycle, DEFAULT_CYCLE_BUDGETS[BudgetCycle.LAUNCH])
        self.agent_configs = {name: config for name, config in defaults.items()}

        if custom_configs:
            for name, config in custom_configs.items():
                self.agent_configs[name] = config

        logger.info(f"[Budget] Cycle {cycle.value} configured with {len(self.agent_configs)} agents")

    def _check_daily_reset(self):
        """Reset contadores diarios."""
        now = datetime.utcnow()
        if now.date() > self._last_reset.date():
            self._daily_usage = {}
            self._last_reset = now

    def _get_daily_usage(self, agent_name: str) -> dict:
        self._check_daily_reset()
        if agent_name not in self._daily_usage:
            self._daily_usage[agent_name] = {
                "tokens": 0,
                "emails": 0,
                "api_calls": 0,
            }
        return self._daily_usage[agent_name]

    def check_budget(self, agent_name: str, resource: str, amount: float) -> dict:
        """
        Verificar si un agente puede gastar recursos.

        Returns:
            dict con success, reason, y limits
        """
        config = self.agent_configs.get(agent_name)
        if not config:
            return {"success": False, "reason": f"Agent {agent_name} not configured for cycle {self.current_cycle.value}"}

        daily = self._get_daily_usage(agent_name)

        if resource == "tokens":
            remaining = config.daily_token_limit - daily["tokens"]
            can_use = remaining >= amount
            return {
                "success": can_use,
                "reason": "ok" if can_use else f"Token limit reached ({daily['tokens']}/{config.daily_token_limit})",
                "daily_used": daily["tokens"],
                "daily_limit": config.daily_token_limit,
                "remaining": remaining,
                "max_model": config.max_model,
            }
        elif resource == "emails":
            remaining = config.daily_email_limit - daily["emails"]
            can_use = remaining >= amount
            return {
                "success": can_use,
                "reason": "ok" if can_use else f"Email limit reached ({daily['emails']}/{config.daily_email_limit})",
                "daily_used": daily["emails"],
                "daily_limit": config.daily_email_limit,
                "remaining": remaining,
            }
        elif resource == "api_calls":
            remaining = config.daily_api_call_limit - daily["api_calls"]
            can_use = remaining >= amount
            return {
                "success": can_use,
                "reason": "ok" if can_use else f"API call limit reached ({daily['api_calls']}/{config.daily_api_call_limit})",
                "daily_used": daily["api_calls"],
                "daily_limit": config.daily_api_call_limit,
                "remaining": remaining,
            }

        return {"success": False, "reason": f"Unknown resource: {resource}"}

    def spend(self, agent_name: str, spend_type: str, amount: float, context: dict = None) -> dict:
        """
        Registrar un gasto.

        Args:
            agent_name: Nombre del agente
            spend_type: "tokens_flash_lite", "tokens_flash", "tokens_pro", "email_sent", "github_api_call"
            amount: Cantidad (tokens para LLM, 1 para emails/calls)
            context: Info adicional

        Returns:
            dict con info del gasto
        """
        # Determinar tipo de recurso
        if spend_type.startswith("tokens_"):
            resource = "tokens"
            daily_key = "tokens"
        elif spend_type == "email_sent":
            resource = "emails"
            daily_key = "emails"
        elif spend_type == "github_api_call":
            resource = "api_calls"
            daily_key = "api_calls"
        else:
            resource = "api_calls"
            daily_key = "api_calls"

        # Calcular costo estimado
        cost_per_unit = UNIT_COSTS_USD.get(spend_type, 0.0)
        estimated_cost = amount * cost_per_unit

        # Registrar
        record = SpendingRecord(
            agent_name=agent_name,
            resource_type=resource,
            amount=amount,
            estimated_cost_usd=estimated_cost,
            context=context or {},
        )
        self.spending_records.append(record)

        # Actualizar contador diario
        daily = self._get_daily_usage(agent_name)
        daily[daily_key] += int(amount) if resource != "tokens" else amount

        # DB persistence handled by agents on their own async loop
        # In-memory records are sufficient for cycle reports

        return {
            "success": True,
            "amount": amount,
            "estimated_cost_usd": round(estimated_cost, 6),
            "daily_used": daily[daily_key],
        }

    def track_conversion(self, agent_name: str, revenue_usd: float, metadata: dict = None):
        """Registrar una conversion atribuida a un agente."""
        # Esto se usa para calcular ROI en el reporte
        pass  # Se trackea via revenue data en generate_cycle_report

    # ============================================================
    # GENERACION DE REPORTES
    # ============================================================

    def generate_cycle_report(self, revenue_data: dict = None) -> BudgetCycleReport:
        """
        Generar reporte del ciclo actual para revision humana.

        Args:
            revenue_data: {
                "total_revenue_usd": float,
                "new_conversions": int,
                "churn_saved": int,
                "leads_captured": int,
                "leads_responded": int,
                "conversions_by_agent": {agent_name: int},
                "revenue_by_agent": {agent_name: float},
            }

        Returns:
            BudgetCycleReport para revision humana
        """
        now = datetime.utcnow()
        revenue_data = revenue_data or {}

        # Agregar spending por agente
        agent_usage = {}
        agent_costs = {}
        for record in self.spending_records:
            if record.agent_name not in agent_usage:
                agent_usage[record.agent_name] = {"tokens": 0, "emails": 0, "api_calls": 0, "spending_count": 0}
                agent_costs[record.agent_name] = 0.0

            if record.resource_type == "tokens":
                agent_usage[record.agent_name]["tokens"] += record.amount
            elif record.resource_type == "emails":
                agent_usage[record.agent_name]["emails"] += int(record.amount)
            elif record.resource_type == "api_calls":
                agent_usage[record.agent_name]["api_calls"] += int(record.amount)

            agent_usage[record.agent_name]["spending_count"] += 1
            agent_costs[record.agent_name] += record.estimated_cost_usd

        # Total spending
        total_spending = sum(r.estimated_cost_usd for r in self.spending_records)
        gemini_cost = sum(r.estimated_cost_usd for r in self.spending_records if "tokens" in r.resource_type)
        resend_cost = sum(r.estimated_cost_usd for r in self.spending_records if r.resource_type == "emails")
        github_cost = sum(r.estimated_cost_usd for r in self.spending_records if r.resource_type == "api_calls")

        # Revenue
        total_revenue = revenue_data.get("total_revenue_usd", 0.0)
        roi = (total_revenue / total_spending) if total_spending > 0 else 0.0

        # Efectividad por agente
        agent_effectiveness = {}
        conversions_by_agent = revenue_data.get("conversions_by_agent", {})
        revenue_by_agent = revenue_data.get("revenue_by_agent", {})
        for agent_name in self.agent_configs:
            agent_effectiveness[agent_name] = {
                "conversions_attributed": conversions_by_agent.get(agent_name, 0),
                "revenue_attributed": revenue_by_agent.get(agent_name, 0.0),
                "spending_usd": round(agent_costs.get(agent_name, 0.0), 4),
                "roi": round(revenue_by_agent.get(agent_name, 0.0) / agent_costs.get(agent_name, 0.0), 2) if agent_costs.get(agent_name, 0.0) > 0 else 0,
            }

        # Generar recomendaciones de budget
        budget_recommendations = self._generate_budget_recommendations(
            agent_usage, agent_costs, agent_effectiveness, total_revenue, total_spending
        )

        report = BudgetCycleReport(
            cycle=self.current_cycle,
            period_start=self.cycle_start,
            period_end=now,
            total_revenue_usd=total_revenue,
            new_conversions=revenue_data.get("new_conversions", 0),
            churn_saved=revenue_data.get("churn_saved", 0),
            leads_captured=revenue_data.get("leads_captured", 0),
            leads_responded=revenue_data.get("leads_responded", 0),
            agent_usage=agent_usage,
            agent_effectiveness=agent_effectiveness,
            api_spending_usd=round(total_spending, 4),
            gemini_cost_usd=round(gemini_cost, 4),
            resend_cost_usd=round(resend_cost, 4),
            github_api_cost_usd=round(github_cost, 4),
            roi=round(roi, 2),
            budget_recommendation=budget_recommendations,
        )

        self.current_report = report
        logger.info(f"[Budget] Cycle report generated: {self.current_cycle.value} | "
                    f"Revenue: ${total_revenue:.2f} | Spending: ${total_spending:.4f} | ROI: {roi:.2f}x")

        return report

    def _generate_budget_recommendations(self, agent_usage, agent_costs, agent_effectiveness, total_revenue, total_spending) -> dict:
        """
        Generar recomendaciones automaticas de budget basadas en performance.

        Estas son SUGERENCIAS que el humano puede aprobar o rechazar.
        """
        recommendations = {}

        for agent_name, config in self.agent_configs.items():
            effectiveness = agent_effectiveness.get(agent_name, {})
            revenue_attributed = effectiveness.get("revenue_attributed", 0.0)
            spending = effectiveness.get("spending_usd", 0.0)
            conversions = effectiveness.get("conversions_attributed", 0)

            # Reglas de recomendacion
            if conversions > 0 and spending > 0:
                agent_roi = revenue_attributed / spending
                if agent_roi > 10:
                    # ROI excelente → pedir mas budget
                    recommendations[agent_name] = {
                        "request_increase": True,
                        "requested_budget": config.monthly_budget_usd * 2,
                        "reason": f"ROI de {agent_roi:.1f}x — {conversions} conversiones generaron ${revenue_attributed:.2f}",
                        "suggested_max_model": "gemini-2.0-flash" if config.max_model == "gemini-2.0-flash-lite" else config.max_model,
                    }
                elif agent_roi > 3:
                    recommendations[agent_name] = {
                        "request_increase": True,
                        "requested_budget": config.monthly_budget_usd * 1.5,
                        "reason": f"ROI de {agent_roi:.1f}x — buen retorno, escalar moderadamente",
                        "suggested_max_model": config.max_model,
                    }
                else:
                    recommendations[agent_name] = {
                        "request_increase": False,
                        "requested_budget": config.monthly_budget_usd,
                        "reason": f"ROI de {agent_roi:.1f}x — mantener budget actual, optimizar antes de escalar",
                        "suggested_max_model": config.max_model,
                    }
            elif conversions == 0 and spending > config.monthly_budget_usd * 0.5:
                # Gastando pero sin conversiones → reducir o mantener
                recommendations[agent_name] = {
                    "request_increase": False,
                    "requested_budget": config.monthly_budget_usd * 0.75,
                    "reason": f"Sin conversiones registradas, gasto ${spending:.2f} — reducir y reevaluar",
                    "suggested_max_model": config.max_model,
                }
            else:
                # Sin datos suficientes → mantener
                recommendations[agent_name] = {
                    "request_increase": False,
                    "requested_budget": config.monthly_budget_usd,
                    "reason": "Datos insuficientes para recomendar cambio — mantener y monitorear",
                    "suggested_max_model": config.max_model,
                }

        return recommendations

    # ============================================================
    # APPROBACION HUMANA
    # ============================================================

    def human_approve_budgets(self, report: BudgetCycleReport, decisions: dict, next_cycle: BudgetCycle = None) -> BudgetCycleReport:
        """
        El humano aprueba o rechaza ajustes de presupuesto.

        Args:
            report: El reporte del ciclo actual
            decisions: Dict {
                "response_agent": {
                    "approved_budget": 25.0,
                    "approved_daily_tokens": 20000,
                    "approved_daily_emails": 50,
                    "approved_model": "gemini-2.0-flash",
                    "notes": "Aprobado por buen ROI en Q1"
                },
                ...
            }
            next_cycle: El proximo ciclo (Q1, Q2, etc.)

        Returns:
            Reporte actualizado con status de approval
        """
        report.approval_status = ApprovalStatus.APPROVED
        report.approved_budgets = decisions

        if next_cycle:
            # Configurar proximo ciclo con budgets aprobados
            custom_configs = {}
            for agent_name, decision in decisions.items():
                if agent_name in self.agent_configs:
                    current = self.agent_configs[agent_name]
                    custom_configs[agent_name] = AgentBudgetConfig(
                        agent_name=agent_name,
                        daily_token_limit=decision.get("approved_daily_tokens", current.daily_token_limit),
                        daily_email_limit=decision.get("approved_daily_emails", current.daily_email_limit),
                        daily_api_call_limit=decision.get("approved_daily_api_calls", current.daily_api_call_limit),
                        max_model=decision.get("approved_model", current.max_model),
                        monthly_budget_usd=decision.get("approved_budget", current.monthly_budget_usd),
                        can_use_gemini_pro=decision.get("approved_model", current.max_model) == "gemini-2.5-pro",
                        notes=decision.get("notes", ""),
                    )

            self.setup_cycle(next_cycle, custom_configs)

        logger.info(f"[Budget] Budgets approved for next cycle: {len(decisions)} agents")
        return report

    def human_reject_adjustments(self, report: BudgetCycleReport, notes: str = ""):
        """El humano rechaza los ajustes recomendados."""
        report.approval_status = ApprovalStatus.REJECTED
        report.human_notes = notes
        logger.info(f"[Budget] Budget adjustments rejected: {notes}")

    # ============================================================
    # CONSOLIDACION ANUAL
    # ============================================================

    def consolidate_annual(self, year: int, revenue_data: dict) -> AnnualConsolidation:
        """
        Consolidar ventas anuales y calcular budget para el año siguiente.

        Args:
            year: Año a consolidar
            revenue_data: {
                "total_revenue_usd": float,
                "total_conversions": int,
                "churn_saved": int,
                "total_leads": int,
                "api_budget_pct": float (default 5%),
            }
        """
        consolidation = AnnualConsolidation(
            year=year,
            total_revenue_usd=revenue_data.get("total_revenue_usd", 0.0),
            total_conversions=revenue_data.get("total_conversions", 0),
            churn_saved=revenue_data.get("churn_saved", 0),
            total_leads=revenue_data.get("total_leads", 0),
            api_budget_pct=revenue_data.get("api_budget_pct", 5.0),
        )

        # Calcular gasto total en APIs del año
        consolidation.total_api_spending_usd = sum(r.estimated_cost_usd for r in self.spending_records)
        consolidation.net_profit_usd = consolidation.total_revenue_usd - consolidation.total_api_spending_usd

        # Budget del año siguiente = X% del revenue total
        consolidation.next_year_api_budget_usd = (
            consolidation.total_revenue_usd * consolidation.api_budget_pct / 100
        )

        self.annual_consolidations.append(consolidation)

        logger.info(f"[Budget] Annual consolidation {year}: "
                    f"Revenue ${consolidation.total_revenue_usd:.2f} | "
                    f"API Spend ${consolidation.total_api_spending_usd:.4f} | "
                    f"Next year budget ${consolidation.next_year_api_budget_usd:.2f}")

        return consolidation

    def approve_annual_budget(self, consolidation: AnnualConsolidation, human_notes: str = "") -> bool:
        """
        El humano aprueba el budget anual calculado.

        Esto distribuye el budget entre los agentes para el año siguiente.
        """
        consolidation.human_approved = True
        consolidation.human_notes = human_notes
        consolidation.approved_at = datetime.utcnow()

        # Distribuir budget entre agentes (proporcional al ciclo actual)
        total_current = sum(c.monthly_budget_usd for c in self.agent_configs.values())
        monthly_budget = consolidation.next_year_api_budget_usd / 12

        for agent_name, config in self.agent_configs.items():
            proportion = config.monthly_budget_usd / total_current if total_current > 0 else 1 / len(self.agent_configs)
            config.monthly_budget_usd = monthly_budget * proportion
            config.notes = f"Annual {consolidation.year + 1} — approved: {human_notes}"

        logger.info(f"[Budget] Annual budget approved: ${consolidation.next_year_api_budget_usd:.2f}/year "
                    f"(${monthly_budget:.2f}/month) distributed across {len(self.agent_configs)} agents")

        return True

    # ============================================================
    # STATUS Y REPORTING
    # ============================================================

    def get_status(self) -> dict:
        """Status actual de todos los agentes."""
        status = {
            "current_cycle": self.current_cycle.value,
            "cycle_start": self.cycle_start.isoformat(),
            "total_spending_usd": round(sum(r.estimated_cost_usd for r in self.spending_records), 4),
            "total_records": len(self.spending_records),
            "agents": {},
        }

        for agent_name, config in self.agent_configs.items():
            daily = self._get_daily_usage(agent_name)
            status["agents"][agent_name] = {
                "daily_tokens": f"{daily['tokens']}/{config.daily_token_limit}",
                "daily_emails": f"{daily['emails']}/{config.daily_email_limit}",
                "daily_api_calls": f"{daily['api_calls']}/{config.daily_api_call_limit}",
                "max_model": config.max_model,
                "monthly_budget_usd": config.monthly_budget_usd,
                "notes": config.notes,
            }

        return status

    def get_pending_report(self) -> Optional[dict]:
        """Obtener reporte pendiente de approval humana."""
        if not self.current_report:
            return None

        if self.current_report.approval_status == ApprovalStatus.PENDING:
            return {
                "cycle": self.current_report.cycle.value,
                "period": f"{self.current_report.period_start.date()} → {self.current_report.period_end.date()}",
                "revenue_usd": self.current_report.total_revenue_usd,
                "spending_usd": self.current_report.api_spending_usd,
                "roi": self.current_report.roi,
                "conversions": self.current_report.new_conversions,
                "leads": self.current_report.leads_captured,
                "agent_effectiveness": self.current_report.agent_effectiveness,
                "recommendations": self.current_report.budget_recommendation,
                "status": "pending_human_approval",
            }

        return None


# Global singleton
_budget_manager: Optional[BudgetManager] = None


def get_budget_manager(db_pool=None) -> BudgetManager:
    global _budget_manager
    if _budget_manager is None:
        _budget_manager = BudgetManager(db_pool)
        _budget_manager.setup_cycle(BudgetCycle.LAUNCH)
    return _budget_manager


def reset_budget_manager():
    global _budget_manager
    _budget_manager = None
