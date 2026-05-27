"""
Macrocycle DB service · Sprint A.

Lee templates + assignments desde tablas (017 + 018). Fallback al engine
hardcoded `macrocycle_engine.PROGRAMS` si DB vacía.

Capa nueva · NO toca macrocycle_engine.py legacy.
"""

from __future__ import annotations

import json as _json
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Optional, List
from uuid import UUID

from ..db import users_repo
from ..core.macrocycle_engine import MacrocycleEngine


@dataclass
class TemplateRow:
    id: str
    program_id: str
    name: str
    school: str
    product: str
    description: str
    total_weeks: int
    focus: Optional[str]
    level_min: str
    level_max: str
    goal_tags: list
    required_equipment: list
    typical_athletes: int
    is_system: bool
    coach_id: Optional[str]


@dataclass
class AssignmentRow:
    id: str
    athlete_id: str
    coach_id: Optional[str]
    template_id: str
    program_id: str
    started_at: date
    ends_at: Optional[date]
    completed_at: Optional[datetime]
    cancelled_at: Optional[datetime]
    is_active: bool
    athlete_snapshot: dict
    overrides: dict


async def list_templates(
    product: Optional[str] = None,
    coach_id: Optional[str] = None,
    include_system: bool = True,
) -> List[TemplateRow]:
    """Lista templates · filtros opcionales."""
    pool = await users_repo.get_pool()
    if pool is None:
        return _fallback_templates(product)

    conditions = []
    params: list = []
    idx = 1
    if product and product != "any":
        conditions.append(f"(product = ${idx} OR product = 'any')")
        params.append(product)
        idx += 1
    if coach_id:
        conditions.append(f"(coach_id = ${idx}::uuid OR is_system = TRUE)" if include_system else f"coach_id = ${idx}::uuid")
        params.append(coach_id)
        idx += 1
    elif not include_system:
        conditions.append("is_system = FALSE")

    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    async with pool.acquire() as conn:
        rows = await conn.fetch(
            f"""
            SELECT id, program_id, name, school, product, description,
                   total_weeks, focus, level_min, level_max,
                   goal_tags, required_equipment, typical_athletes,
                   is_system, coach_id
              FROM macrocycle_templates
              {where}
             ORDER BY is_system DESC, school ASC, total_weeks ASC
            """,
            *params,
        )

    if not rows:
        return _fallback_templates(product)

    return [
        TemplateRow(
            id=str(r["id"]),
            program_id=r["program_id"],
            name=r["name"],
            school=r["school"],
            product=r["product"],
            description=r["description"] or "",
            total_weeks=r["total_weeks"],
            focus=r["focus"],
            level_min=r["level_min"],
            level_max=r["level_max"],
            goal_tags=_parse_json(r["goal_tags"]),
            required_equipment=_parse_json(r["required_equipment"]),
            typical_athletes=r["typical_athletes"],
            is_system=r["is_system"],
            coach_id=str(r["coach_id"]) if r["coach_id"] else None,
        )
        for r in rows
    ]


def _fallback_templates(product: Optional[str]) -> List[TemplateRow]:
    """Si DB vacía, devolvemos los 23 hardcoded del engine."""
    result = []
    for p in MacrocycleEngine.PROGRAMS.values():
        result.append(TemplateRow(
            id=f"system-{p.id}",
            program_id=p.id,
            name=p.name,
            school=p.school.lower(),
            product="holy-oly",
            description=p.description,
            total_weeks=p.duration_weeks,
            focus=p.focus_type,
            level_min="beginner",
            level_max="elite",
            goal_tags=[p.focus_type.lower()],
            required_equipment=[],
            typical_athletes=1,
            is_system=True,
            coach_id=None,
        ))
    if product and product != "any":
        result = [t for t in result if t.product == product or t.product == "any"]
    return result


async def get_active_assignment(athlete_id: str) -> Optional[AssignmentRow]:
    """Asignación activa del atleta (máx 1 simultánea)."""
    pool = await users_repo.get_pool()
    if pool is None:
        return None

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT id, athlete_id, coach_id, template_id, program_id,
                   started_at, ends_at, completed_at, cancelled_at,
                   is_active, athlete_snapshot, overrides
              FROM athlete_macro_assignments
             WHERE athlete_id = $1::uuid AND is_active = TRUE
             LIMIT 1
            """,
            athlete_id,
        )

    if not row:
        return None

    return AssignmentRow(
        id=str(row["id"]),
        athlete_id=str(row["athlete_id"]),
        coach_id=str(row["coach_id"]) if row["coach_id"] else None,
        template_id=str(row["template_id"]),
        program_id=row["program_id"],
        started_at=row["started_at"],
        ends_at=row["ends_at"],
        completed_at=row["completed_at"],
        cancelled_at=row["cancelled_at"],
        is_active=row["is_active"],
        athlete_snapshot=_parse_json(row["athlete_snapshot"]),
        overrides=_parse_json(row["overrides"]),
    )


async def assign_template(
    athlete_id: str,
    coach_id: str,
    template_id: str,
    athlete_snapshot: dict,
    overrides: Optional[dict] = None,
) -> AssignmentRow:
    """
    Asigna template a atleta. Si ya tiene activo, lo archiva primero.
    Calcula ends_at desde started_at + total_weeks.
    """
    pool = await users_repo.get_pool()
    if pool is None:
        raise RuntimeError("DB no disponible")

    async with pool.acquire() as conn:
        async with conn.transaction():
            # Archivar activo anterior
            await conn.execute(
                """
                UPDATE athlete_macro_assignments
                   SET is_active = FALSE,
                       cancelled_at = NOW(),
                       cancel_reason = 'superseded'
                 WHERE athlete_id = $1::uuid AND is_active = TRUE
                """,
                athlete_id,
            )

            # Traer template para calcular ends_at + copiar program_id
            tpl = await conn.fetchrow(
                "SELECT program_id, total_weeks FROM macrocycle_templates WHERE id = $1",
                UUID(template_id),
            )
            if not tpl:
                raise ValueError(f"Template {template_id} no existe")

            ends_at = date.today() + timedelta(weeks=tpl["total_weeks"])

            row = await conn.fetchrow(
                """
                INSERT INTO athlete_macro_assignments
                    (athlete_id, coach_id, template_id, program_id,
                     started_at, ends_at, is_active,
                     athlete_snapshot, overrides)
                VALUES ($1::uuid, $2::uuid, $3::uuid, $4,
                        CURRENT_DATE, $5, TRUE,
                        $6::jsonb, $7::jsonb)
                RETURNING id, athlete_id, coach_id, template_id, program_id,
                          started_at, ends_at, completed_at, cancelled_at,
                          is_active, athlete_snapshot, overrides
                """,
                athlete_id, coach_id, template_id, tpl["program_id"],
                ends_at,
                _json.dumps(athlete_snapshot),
                _json.dumps(overrides or {}),
            )

    return AssignmentRow(
        id=str(row["id"]),
        athlete_id=str(row["athlete_id"]),
        coach_id=str(row["coach_id"]) if row["coach_id"] else None,
        template_id=str(row["template_id"]),
        program_id=row["program_id"],
        started_at=row["started_at"],
        ends_at=row["ends_at"],
        completed_at=row["completed_at"],
        cancelled_at=row["cancelled_at"],
        is_active=row["is_active"],
        athlete_snapshot=_parse_json(row["athlete_snapshot"]),
        overrides=_parse_json(row["overrides"]),
    )


async def calculate_adherence(assignment_id: str) -> dict:
    """
    Calcula adherence de un assignment.
    Retorna: {planned, completed, skipped, adherence_pct, by_reason}
    """
    pool = await users_repo.get_pool()
    if pool is None:
        return {"planned": 0, "completed": 0, "skipped": 0, "adherence_pct": 0, "by_reason": {}}

    async with pool.acquire() as conn:
        stats = await conn.fetchrow(
            """
            SELECT
              COUNT(*) FILTER (WHERE planned = TRUE) AS planned,
              COUNT(*) FILTER (WHERE completed = TRUE) AS completed,
              COUNT(*) FILTER (WHERE planned = TRUE AND completed = FALSE) AS skipped
              FROM macro_session_adherence
             WHERE assignment_id = $1::uuid
            """,
            assignment_id,
        )

        reasons = await conn.fetch(
            """
            SELECT skipped_reason, COUNT(*) AS n
              FROM macro_session_adherence
             WHERE assignment_id = $1::uuid AND skipped_reason IS NOT NULL
             GROUP BY skipped_reason
            """,
            assignment_id,
        )

    planned = stats["planned"] or 0
    completed = stats["completed"] or 0
    skipped = stats["skipped"] or 0
    adherence_pct = round((completed / planned * 100) if planned else 0, 1)

    return {
        "planned": planned,
        "completed": completed,
        "skipped": skipped,
        "adherence_pct": adherence_pct,
        "by_reason": {r["skipped_reason"]: r["n"] for r in reasons},
    }


def _parse_json(val) -> dict | list:
    """Helper: asyncpg puede devolver str o dict para JSONB."""
    if val is None:
        return {} if not isinstance(val, list) else []
    if isinstance(val, (dict, list)):
        return val
    try:
        return _json.loads(val)
    except (ValueError, TypeError):
        return {}
