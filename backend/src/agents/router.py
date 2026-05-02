"""
Agents Router — Endpoints para todos los agentes.
"""

from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import Optional
import logging

logger = logging.getLogger("motor25")

router = APIRouter(prefix="/api/v1/agents", tags=["agents"])


# ============================================================
# REQUEST/RESPONSE MODELS
# ============================================================

class BudgetApprovalRequest(BaseModel):
    """Solicitud humana de aprobacion de budget."""
    decisions: dict
    next_cycle: Optional[str] = None
    notes: Optional[str] = ""


class BudgetRejectRequest(BaseModel):
    notes: str = ""


class AnnualConsolidationRequest(BaseModel):
    """Datos para consolidacion anual."""
    year: int
    total_revenue_usd: float = 0.0
    total_conversions: int = 0
    churn_saved: int = 0
    total_leads: int = 0
    api_budget_pct: float = 5.0
    human_notes: str = ""


# ============================================================
# STATUS
# ============================================================

@router.get("/status")
async def agents_status():
    """Status de todos los agentes y scheduler jobs."""
    from .scheduler import get_all_jobs_status

    return {
        "status": "running",
        "agents": {
            "response": "active",
            "test": "on-demand",
            "security": "scheduled",
            "growth": "scheduled",
            "content": "scheduled",
            "research": "on-demand",
        },
        "scheduler_jobs": get_all_jobs_status(),
    }


# ============================================================
# BUDGET — GOBERNANZA DE CICLO LARGO
# ============================================================

@router.get("/budget")
async def agents_budget():
    """
    Status actual de presupuestos de todos los agentes.
    Muestra ciclo actual, limites diarios, y spending.
    """
    from .budget import get_budget_manager

    budget_manager = get_budget_manager()
    return budget_manager.get_status()


@router.get("/budget/report/pending")
async def budget_pending_report():
    """
    Reporte pendiente de aprobacion humana.
    Genera el reporte del ciclo actual y lo devuelve para revision.
    """
    from .budget import get_budget_manager

    budget_manager = get_budget_manager()
    report = budget_manager.generate_cycle_report()
    pending = budget_manager.get_pending_report()

    if not pending:
        return {"status": "no_pending_report", "message": "No hay reporte pendiente. Usa /budget/report/generate primero."}

    return pending


@router.post("/budget/report/generate")
async def budget_generate_report(revenue_data: Optional[dict] = None):
    """
    Generar reporte de ciclo para revision humana.

    POST body (opcional):
    {
        "total_revenue_usd": 1500.0,
        "new_conversions": 15,
        "churn_saved": 3,
        "leads_captured": 120,
        "leads_responded": 95,
        "conversions_by_agent": {"response_agent": 10, "growth_agent": 5},
        "revenue_by_agent": {"response_agent": 1000.0, "growth_agent": 500.0}
    }
    """
    from .budget import get_budget_manager

    budget_manager = get_budget_manager()
    report = budget_manager.generate_cycle_report(revenue_data)

    return {
        "cycle": report.cycle.value,
        "period": f"{report.period_start.date()} → {report.period_end.date()}",
        "revenue_usd": report.total_revenue_usd,
        "spending_usd": report.api_spending_usd,
        "roi": report.roi,
        "conversions": report.new_conversions,
        "churn_saved": report.churn_saved,
        "leads_captured": report.leads_captured,
        "leads_responded": report.leads_responded,
        "agent_effectiveness": report.agent_effectiveness,
        "recommendations": report.budget_recommendation,
        "status": "pending_human_approval",
        "message": "Revisa las recomendaciones y usa POST /budget/approve o /budget/reject",
    }


@router.post("/budget/approve")
async def budget_approve(request: BudgetApprovalRequest):
    """
    Aprobar presupuestos para el proximo ciclo.

    POST body:
    {
        "decisions": {
            "response_agent": {
                "approved_budget": 25.0,
                "approved_daily_tokens": 20000,
                "approved_daily_emails": 50,
                "approved_model": "gemini-2.0-flash",
                "notes": "Aprobado por buen ROI"
            }
        },
        "next_cycle": "q1",
        "notes": "Ciclo Q1 aprobado"
    }
    """
    from .budget import get_budget_manager, BudgetCycle

    budget_manager = get_budget_manager()

    if not budget_manager.current_report:
        raise HTTPException(status_code=400, detail="No hay reporte generado. Usa POST /budget/report/generate primero.")

    next_cycle = BudgetCycle(request.next_cycle) if request.next_cycle else None

    report = budget_manager.human_approve_budgets(
        budget_manager.current_report,
        request.decisions,
        next_cycle,
    )

    return {
        "status": "approved",
        "cycle": report.cycle.value,
        "agents_configured": len(request.decisions),
        "next_cycle": next_cycle.value if next_cycle else report.cycle.value,
        "notes": request.notes,
    }


@router.post("/budget/reject")
async def budget_reject(request: BudgetRejectRequest):
    """
    Rechazar ajustes de presupuesto recomendados.

    POST body:
    {
        "notes": "Mantener budget actual hasta tener mas data"
    }
    """
    from .budget import get_budget_manager

    budget_manager = get_budget_manager()

    if not budget_manager.current_report:
        raise HTTPException(status_code=400, detail="No hay reporte generado.")

    budget_manager.human_reject_adjustments(budget_manager.current_report, request.notes)

    return {
        "status": "rejected",
        "notes": request.notes,
    }


# ============================================================
# CONSOLIDACION ANUAL
# ============================================================

@router.post("/budget/consolidate")
async def annual_consolidate(request: AnnualConsolidationRequest):
    """
    Consolidar ventas anuales y calcular budget para el año siguiente.

    POST body:
    {
        "year": 2026,
        "total_revenue_usd": 50000.0,
        "total_conversions": 200,
        "churn_saved": 15,
        "total_leads": 1500,
        "api_budget_pct": 5.0,
        "human_notes": "Aprobar budget del 5% del revenue"
    }
    """
    from .budget import get_budget_manager

    budget_manager = get_budget_manager()

    revenue_data = {
        "total_revenue_usd": request.total_revenue_usd,
        "total_conversions": request.total_conversions,
        "churn_saved": request.churn_saved,
        "total_leads": request.total_leads,
        "api_budget_pct": request.api_budget_pct,
    }

    consolidation = budget_manager.consolidate_annual(request.year, revenue_data)

    return {
        "year": consolidation.year,
        "total_revenue_usd": consolidation.total_revenue_usd,
        "total_api_spending_usd": consolidation.total_api_spending_usd,
        "net_profit_usd": consolidation.net_profit_usd,
        "next_year_api_budget_usd": consolidation.next_year_api_budget_usd,
        "monthly_budget_usd": round(consolidation.next_year_api_budget_usd / 12, 2),
        "api_budget_pct": consolidation.api_budget_pct,
        "human_approved": False,
        "message": "Consolidacion generada. Usa POST /budget/consolidate/approve para aprobar.",
    }


@router.post("/budget/consolidate/approve")
async def annual_consolidate_approve(year: int, notes: str = ""):
    """
    Aprobar el budget anual calculado.

    Esto distribuye el budget entre los agentes para el año siguiente.
    """
    from .budget import get_budget_manager

    budget_manager = get_budget_manager()

    consolidation = next(
        (c for c in budget_manager.annual_consolidations if c.year == year),
        None,
    )

    if not consolidation:
        raise HTTPException(status_code=404, detail=f"No hay consolidacion para el año {year}")

    budget_manager.approve_annual_budget(consolidation, notes)

    return {
        "status": "approved",
        "year": year,
        "annual_budget_usd": consolidation.next_year_api_budget_usd,
        "monthly_budget_usd": round(consolidation.next_year_api_budget_usd / 12, 2),
        "agents": budget_manager.get_status()["agents"],
        "notes": notes,
    }


# ============================================================
# GITHUB RESEARCH
# ============================================================

@router.get("/research/repos")
async def research_repos(
    query: str = Query(..., description="Termino de busqueda"),
    language: str = Query("python", description="Filtrar por lenguaje"),
    stars_min: int = Query(100, description="Minimo de estrellas"),
):
    """Buscar repositorios en GitHub."""
    from .github_researcher import get_researcher

    researcher = get_researcher()
    repos = await researcher.search_repos(query, language=language, stars_min=stars_min)

    return {"query": query, "repos": repos, "total": len(repos)}


@router.get("/research/trending")
async def research_trending(
    language: str = Query("python", description="Filtrar por lenguaje"),
    since: str = Query("weekly", description="weekly o monthly"),
):
    """Buscar repos trending en GitHub."""
    from .github_researcher import get_researcher

    researcher = get_researcher()
    repos = await researcher.search_trending(language=language, since=since)

    return {"repos": repos, "total": len(repos)}


@router.get("/research/workflows")
async def research_workflows(
    workflow_type: str = Query(..., description="deploy_render, deploy_docker, ci_python, security_scan, email_automation"),
):
    """Buscar ejemplos de GitHub Actions workflows."""
    from .github_researcher import get_researcher

    researcher = get_researcher()
    repos = await researcher.find_workflow_examples(workflow_type)

    return {"workflow_type": workflow_type, "repos": repos, "total": len(repos)}
