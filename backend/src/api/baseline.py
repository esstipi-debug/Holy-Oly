"""
Baseline / Tests de Referencia · endpoints.

GET  /v1/baseline/results            → último valor por test_id del usuario auth
POST /v1/baseline/results            → guarda un resultado
DELETE /v1/baseline/results/{test}   → borra el último resultado de un test
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Literal

from .auth.auth import verify_token
from .auth.jwt_utils import User
from ..db import users_repo

router = APIRouter(prefix="/v1/baseline", tags=["baseline"])


class BaselineResultIn(BaseModel):
    test_id: str = Field(..., min_length=1, max_length=64)
    value: float = Field(..., gt=0)
    unit: Literal['kg', 'reps', 'seconds', 'cm', 'meters', 'ml/kg/min']


@router.get("/results")
async def list_results(user: User = Depends(verify_token)):
    rows = await users_repo.get_baseline_results(user.id)
    # Adaptar a formato del frontend: { test_id: { value, unit, date } }
    return {
        r["test_id"]: {
            "value": float(r["value"]),
            "unit": r["unit"],
            "date": r["tested_at"].isoformat() if hasattr(r["tested_at"], "isoformat") else str(r["tested_at"]),
        }
        for r in rows
    }


@router.post("/results", status_code=status.HTTP_201_CREATED)
async def save_result(payload: BaselineResultIn, user: User = Depends(verify_token)):
    saved = await users_repo.save_baseline_result(
        user_id=user.id, test_id=payload.test_id,
        value=payload.value, unit=payload.unit,
    )
    return saved


@router.delete("/results/{test_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_result(test_id: str, user: User = Depends(verify_token)):
    deleted = await users_repo.delete_baseline_result(user.id, test_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="No hay resultado para ese test")
    return None
