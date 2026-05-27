"""
Engine 24 · IA Explica API.

GET /v1/explain/{metric}?value=X&context=Y
→ chip "¿por qué?" en cualquier métrica del frontend
→ retorna explicación contextual + factors + acción sugerida
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from ..auth.auth import verify_token
from ..auth.jwt_utils import User
from ...services import explain_service


router = APIRouter(prefix="/v1/explain", tags=["explain"])


class ExplainResponse(BaseModel):
    metric: str
    value: str
    short_answer: str
    long_answer: str
    factors: list
    suggested_action: Optional[str] = None
    source: str


@router.get("/{metric}", response_model=ExplainResponse)
async def explain_metric(
    metric: str,
    value: str = Query(default=""),
    context: Optional[str] = Query(default=None),
    use_ai: bool = Query(default=True),
    user: User = Depends(verify_token),
) -> ExplainResponse:
    """
    Métricas soportadas: stress_fatigue · cns_zone · oly_index · belt · streak ·
    recovery_debt · readiness · hormonal_phase · adaptation_risk.

    Contexto opcional: 'pre_wod' · 'post_wod' · 'check_in' · 'damage_control'.
    """
    explanation = await explain_service.explain(
        user_id=user.id,
        metric=metric,
        value=value,
        context=context,
        use_ai=use_ai,
    )
    return ExplainResponse(**explanation.__dict__)
