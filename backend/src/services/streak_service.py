"""
Smart Streak service (Engine 06).

Calcula el streak (días consecutivos de training) basándose en las fechas
en las que el atleta tiene actividad registrada:

- `wod_results.completed_at::date`  (cuando logueó un WOD Volta)
- `cf_sessions.fecha` (sesión planeada/completada Holy Oly)

Reglas:
- "Día activo" = al menos 1 wod_result o cf_session (completada=true) ese día
- Streak actual = run de días consecutivos contando desde HOY hacia atrás
- Si HOY no hay actividad pero AYER sí → streak sigue contando hasta ayer
  (no se "pierde" hasta saltarse 2 días seguidos · gracia 1 día)
- best_streak = el mejor run histórico

No persiste en DB · se calcula on-demand (cheap query).
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from typing import Optional

from ..db import users_repo


@dataclass
class StreakInfo:
    current: int           # días consecutivos hoy (puede contar desde ayer si hoy aún no entrenó)
    best: int              # mejor streak histórico
    last_active_date: Optional[date]
    grace_used: bool       # True si "hoy no entrenó pero contamos el de ayer"
    total_active_days: int # cumulative · usado por Belt Engine


async def calc_streak(user_id: str, today: Optional[date] = None) -> StreakInfo:
    """
    Calcula streak actual + best + total_active_days en una sola query.

    Para perf, traemos todas las fechas activas en una lista y procesamos en Python.
    Escala hasta ~10k días por user · OK para nuestro volumen.
    """
    today = today or date.today()

    pool = await users_repo.get_pool()
    if pool is None:
        return StreakInfo(current=0, best=0, last_active_date=None, grace_used=False, total_active_days=0)

    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT DISTINCT d FROM (
                SELECT completed_at::date AS d
                  FROM wod_results
                 WHERE user_id = $1::uuid
                UNION
                SELECT fecha AS d
                  FROM cf_sessions
                 WHERE athlete_id = $1::uuid AND completada = TRUE
            ) AS days
            ORDER BY d DESC
            """,
            user_id,
        )

    # Lista ordenada DESC de fechas únicas con actividad
    dates: list[date] = [r["d"] for r in rows]
    if not dates:
        return StreakInfo(current=0, best=0, last_active_date=None, grace_used=False, total_active_days=0)

    last_active = dates[0]

    # ── Current streak ──
    # Punto de partida: hoy → si hay actividad, sumamos · si no, intentamos AYER (grace)
    current = 0
    grace_used = False
    cursor = today
    if last_active == today:
        current = 1
        cursor = today - timedelta(days=1)
    elif last_active == today - timedelta(days=1):
        # Grace · contamos desde ayer
        current = 1
        cursor = today - timedelta(days=2)
        grace_used = True
    else:
        # Más de 1 día sin actividad → streak roto
        return StreakInfo(
            current=0,
            best=_best_run(dates),
            last_active_date=last_active,
            grace_used=False,
            total_active_days=len(dates),
        )

    # Caminamos hacia atrás contando días consecutivos
    date_set = set(dates)
    while cursor in date_set:
        current += 1
        cursor -= timedelta(days=1)

    return StreakInfo(
        current=current,
        best=max(current, _best_run(dates)),
        last_active_date=last_active,
        grace_used=grace_used,
        total_active_days=len(dates),
    )


def _best_run(dates_desc: list[date]) -> int:
    """Mejor run histórico de días consecutivos. `dates_desc` viene DESC."""
    if not dates_desc:
        return 0
    # Procesamos ASC para simplicidad
    sorted_asc = sorted(dates_desc)
    best = 1
    cur = 1
    for i in range(1, len(sorted_asc)):
        if sorted_asc[i] == sorted_asc[i - 1] + timedelta(days=1):
            cur += 1
            best = max(best, cur)
        else:
            cur = 1
    return best
