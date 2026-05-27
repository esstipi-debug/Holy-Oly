"""
Box Inventory API · Sprint A Coach Foundation
==============================================

Reemplaza el useState mock del frontend (VoltaCoachInventory + VoltaCoachTools tab
inventario) por persistencia real en `box_inventory` (migration 016).

Endpoints:
- GET    /v1/inventory                  → lista mi inventario (coach)
- GET    /v1/inventory/{coach_id}       → ver inventario de un coach específico (admin u owner)
- POST   /v1/inventory                  → crear item nuevo
- PATCH  /v1/inventory/{item_id}        → editar count/total/notes
- DELETE /v1/inventory/{item_id}        → eliminar item
- POST   /v1/inventory/seed-defaults    → poblar con catálogo standard (primera vez)
- GET    /v1/inventory/validate/{template_id} → ¿puedo ejecutar este macrocycle con mi inventario actual?

OWN-ONLY: coach solo ve y edita su inventario.
"""

from __future__ import annotations

from typing import Optional, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from ..auth.auth import verify_token
from ..auth.jwt_utils import User
from ...db import users_repo


router = APIRouter(prefix="/v1/inventory", tags=["inventory"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

VALID_CATEGORIES = [
    "barbells", "plates", "kettlebells", "dumbbells",
    "ropes", "plyo", "machines", "rowers",
    "bikes", "rigs", "medicine_balls", "misc",
]


class InventoryItem(BaseModel):
    id: str
    coach_id: str
    item_key: str
    name: str
    category: str
    count: int
    total: int
    unit: Optional[str] = None
    icon: Optional[str] = None
    notes: Optional[str] = None
    sort_order: int = 100


class CreateItem(BaseModel):
    item_key: str = Field(..., min_length=1, max_length=64)
    name: str = Field(..., min_length=1, max_length=120)
    category: str = Field(...)
    count: int = Field(default=0, ge=0)
    total: int = Field(default=0, ge=0)
    unit: Optional[str] = Field(default=None, max_length=16)
    icon: Optional[str] = Field(default=None, max_length=16)
    notes: Optional[str] = None
    sort_order: int = Field(default=100, ge=0, le=10000)


class UpdateItem(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    count: Optional[int] = Field(default=None, ge=0)
    total: Optional[int] = Field(default=None, ge=0)
    unit: Optional[str] = Field(default=None, max_length=16)
    icon: Optional[str] = Field(default=None, max_length=16)
    notes: Optional[str] = None
    sort_order: Optional[int] = Field(default=None, ge=0, le=10000)


class InventoryValidation(BaseModel):
    template_id: str
    template_name: str
    can_execute: bool
    missing_items: List[dict]
    warnings: List[str]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

DEFAULT_INVENTORY = [
    {"item_key": "barbell_olympic_20kg", "name": "Barras olímpicas 20kg", "category": "barbells",    "count": 12,  "total": 12,  "icon": "🏋️",  "sort_order": 10},
    {"item_key": "barbell_training_15kg","name": "Barras de entrenamiento 15kg","category": "barbells","count": 6,   "total": 6,   "icon": "🏋️",  "sort_order": 11},
    {"item_key": "plate_bumper_kg",      "name": "Bumpers (kg total)",           "category": "plates", "count": 480, "total": 600, "icon": "⚪",  "unit": "kg",  "sort_order": 20},
    {"item_key": "plate_change",         "name": "Plates de cambio (0.5-5kg)",   "category": "plates", "count": 40,  "total": 40,  "icon": "🔘",  "sort_order": 21},
    {"item_key": "kettlebell_set",       "name": "Kettlebells (8-32kg)",         "category": "kettlebells", "count": 18, "total": 20, "icon": "🥊", "sort_order": 30},
    {"item_key": "rope_jump",            "name": "Cuerdas de saltar",            "category": "ropes",  "count": 8,   "total": 8,   "icon": "🪢",  "sort_order": 40},
    {"item_key": "rope_climb",           "name": "Cuerdas para climb",           "category": "ropes",  "count": 2,   "total": 2,   "icon": "🧗",  "sort_order": 41},
    {"item_key": "plyo_box",             "name": "Cajones plyo (20\"/24\"/30\")", "category": "plyo",  "count": 8,   "total": 8,   "icon": "📦",  "sort_order": 50},
    {"item_key": "rower",                "name": "Remos Concept2",               "category": "rowers", "count": 4,   "total": 4,   "icon": "🚣",  "sort_order": 60},
    {"item_key": "bike_assault",         "name": "Bikes Assault/Echo",           "category": "bikes",  "count": 3,   "total": 3,   "icon": "🚴",  "sort_order": 70},
    {"item_key": "rig_pullup",           "name": "Estaciones pull-up del rig",   "category": "rigs",   "count": 12,  "total": 12,  "icon": "🏗️",  "sort_order": 80},
    {"item_key": "rings",                "name": "Anillas gimnásticas",          "category": "misc",   "count": 4,   "total": 4,   "icon": "⭕",  "sort_order": 90},
    {"item_key": "wall_ball",            "name": "Wall balls (9kg/14kg)",        "category": "medicine_balls", "count": 12, "total": 12, "icon": "🏐", "sort_order": 100},
    {"item_key": "dumbbell_set",         "name": "Dumbbells (5-50lb)",           "category": "dumbbells", "count": 20, "total": 20, "icon": "🏋️",  "sort_order": 110},
    {"item_key": "ghd",                  "name": "GHD machine",                  "category": "machines", "count": 2, "total": 2, "icon": "💪", "sort_order": 120},
]


def _require_coach(user: User):
    if user.role not in ("coach", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo coaches pueden gestionar inventario",
        )


async def _require_pool():
    pool = await users_repo.get_pool()
    if pool is None:
        raise HTTPException(503, "DB no disponible")
    return pool


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("", response_model=List[InventoryItem])
async def list_my_inventory(user: User = Depends(verify_token)) -> List[InventoryItem]:
    """Coach: lista su inventario. Si nunca lo configuró, retorna [] (frontend ofrece seed-defaults)."""
    _require_coach(user)
    pool = await _require_pool()

    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, coach_id, item_key, name, category, count, total, unit, icon, notes, sort_order
              FROM box_inventory
             WHERE coach_id = $1::uuid
             ORDER BY sort_order ASC, name ASC
            """,
            user.id,
        )

    return [
        InventoryItem(
            id=str(r["id"]),
            coach_id=str(r["coach_id"]),
            item_key=r["item_key"],
            name=r["name"],
            category=r["category"],
            count=r["count"],
            total=r["total"],
            unit=r["unit"],
            icon=r["icon"],
            notes=r["notes"],
            sort_order=r["sort_order"],
        )
        for r in rows
    ]


@router.post("", response_model=InventoryItem, status_code=status.HTTP_201_CREATED)
async def create_item(payload: CreateItem, user: User = Depends(verify_token)) -> InventoryItem:
    """Coach crea item nuevo. UNIQUE (coach_id, item_key) · si existe → 409."""
    _require_coach(user)
    if payload.category not in VALID_CATEGORIES:
        raise HTTPException(400, f"Categoría inválida · usá: {VALID_CATEGORIES}")
    if payload.count > payload.total:
        raise HTTPException(400, "count no puede ser > total")

    pool = await _require_pool()
    try:
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO box_inventory
                    (coach_id, item_key, name, category, count, total, unit, icon, notes, sort_order)
                VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING id, coach_id, item_key, name, category, count, total, unit, icon, notes, sort_order
                """,
                user.id, payload.item_key, payload.name, payload.category,
                payload.count, payload.total, payload.unit, payload.icon,
                payload.notes, payload.sort_order,
            )
    except Exception as e:
        if "box_inventory_coach_id_item_key_key" in str(e):
            raise HTTPException(409, f"Ya existe un item con key '{payload.item_key}' · usá PATCH para editarlo")
        raise HTTPException(500, f"No se pudo crear el item: {str(e)[:200]}")

    return InventoryItem(
        id=str(row["id"]),
        coach_id=str(row["coach_id"]),
        item_key=row["item_key"],
        name=row["name"],
        category=row["category"],
        count=row["count"],
        total=row["total"],
        unit=row["unit"],
        icon=row["icon"],
        notes=row["notes"],
        sort_order=row["sort_order"],
    )


@router.patch("/{item_id}", response_model=InventoryItem)
async def update_item(
    item_id: UUID,
    payload: UpdateItem,
    user: User = Depends(verify_token),
) -> InventoryItem:
    """Coach edita un item propio · count/total/notes."""
    _require_coach(user)
    pool = await _require_pool()

    async with pool.acquire() as conn:
        target = await conn.fetchrow(
            "SELECT id, coach_id FROM box_inventory WHERE id = $1",
            item_id,
        )
        if not target:
            raise HTTPException(404, "Item no encontrado")
        if str(target["coach_id"]) != str(user.id) and user.role != "admin":
            raise HTTPException(403, "Solo podés editar tu propio inventario")

        # Build dynamic UPDATE
        sets = []
        params: list = []
        idx = 1
        for field in ["name", "count", "total", "unit", "icon", "notes", "sort_order"]:
            val = getattr(payload, field)
            if val is not None:
                sets.append(f"{field} = ${idx}")
                params.append(val)
                idx += 1
        if not sets:
            raise HTTPException(400, "Nada para actualizar")

        sets.append(f"updated_at = NOW()")
        params.append(item_id)

        row = await conn.fetchrow(
            f"""
            UPDATE box_inventory
               SET {', '.join(sets)}
             WHERE id = ${idx}
            RETURNING id, coach_id, item_key, name, category, count, total, unit, icon, notes, sort_order
            """,
            *params,
        )

    return InventoryItem(
        id=str(row["id"]),
        coach_id=str(row["coach_id"]),
        item_key=row["item_key"],
        name=row["name"],
        category=row["category"],
        count=row["count"],
        total=row["total"],
        unit=row["unit"],
        icon=row["icon"],
        notes=row["notes"],
        sort_order=row["sort_order"],
    )


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(item_id: UUID, user: User = Depends(verify_token)):
    """Coach borra un item de su inventario."""
    _require_coach(user)
    pool = await _require_pool()
    async with pool.acquire() as conn:
        target = await conn.fetchrow(
            "SELECT id, coach_id FROM box_inventory WHERE id = $1",
            item_id,
        )
        if not target:
            raise HTTPException(404, "Item no encontrado")
        if str(target["coach_id"]) != str(user.id) and user.role != "admin":
            raise HTTPException(403, "Solo podés borrar tu propio inventario")
        await conn.execute("DELETE FROM box_inventory WHERE id = $1", item_id)
    return None


@router.post("/seed-defaults", response_model=List[InventoryItem])
async def seed_defaults(user: User = Depends(verify_token)) -> List[InventoryItem]:
    """
    Pobla el inventario del coach con el catálogo standard de un box CrossFit típico.
    Idempotente: solo inserta items que NO existen (ON CONFLICT DO NOTHING).
    """
    _require_coach(user)
    pool = await _require_pool()

    async with pool.acquire() as conn:
        async with conn.transaction():
            for item in DEFAULT_INVENTORY:
                await conn.execute(
                    """
                    INSERT INTO box_inventory
                        (coach_id, item_key, name, category, count, total, unit, icon, sort_order)
                    VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9)
                    ON CONFLICT (coach_id, item_key) DO NOTHING
                    """,
                    user.id, item["item_key"], item["name"], item["category"],
                    item["count"], item["total"], item.get("unit"), item.get("icon"),
                    item["sort_order"],
                )

        rows = await conn.fetch(
            """
            SELECT id, coach_id, item_key, name, category, count, total, unit, icon, notes, sort_order
              FROM box_inventory
             WHERE coach_id = $1::uuid
             ORDER BY sort_order ASC, name ASC
            """,
            user.id,
        )

    return [
        InventoryItem(
            id=str(r["id"]),
            coach_id=str(r["coach_id"]),
            item_key=r["item_key"],
            name=r["name"],
            category=r["category"],
            count=r["count"],
            total=r["total"],
            unit=r["unit"],
            icon=r["icon"],
            notes=r["notes"],
            sort_order=r["sort_order"],
        )
        for r in rows
    ]


@router.get("/validate/{template_id}", response_model=InventoryValidation)
async def validate_inventory_for_template(
    template_id: UUID,
    user: User = Depends(verify_token),
) -> InventoryValidation:
    """
    Chequea si el coach puede ejecutar el macrocycle template con su inventario actual.

    Retorna:
    - can_execute: True/False
    - missing_items: items requeridos que faltan
    - warnings: alertas (ej: "wall_ball count=2 pero recomendado 8 para clase de 8 atletas")

    Cierra el bug crítico de Sprint A: NO se asignan programas imposibles.
    """
    _require_coach(user)
    pool = await _require_pool()

    async with pool.acquire() as conn:
        template = await conn.fetchrow(
            """
            SELECT id, name, required_equipment, typical_athletes
              FROM macrocycle_templates
             WHERE id = $1
            """,
            template_id,
        )
        if not template:
            raise HTTPException(404, "Template no encontrado")

        my_items = await conn.fetch(
            "SELECT item_key, count, total, name FROM box_inventory WHERE coach_id = $1::uuid",
            user.id,
        )

    inventory_map = {r["item_key"]: dict(r) for r in my_items}
    required: list = template["required_equipment"] or []
    if isinstance(required, str):
        import json as _json
        required = _json.loads(required)

    typical = template["typical_athletes"] or 1
    missing_items: list[dict] = []
    warnings: list[str] = []

    for req_key in required:
        if isinstance(req_key, dict):
            key = req_key.get("item_key")
            min_count = req_key.get("min_count", 1)
        else:
            key = req_key
            min_count = typical

        if key not in inventory_map:
            missing_items.append({"item_key": key, "needed": min_count, "have": 0})
        elif inventory_map[key]["count"] < min_count:
            warnings.append(
                f"{inventory_map[key]['name']}: tenés {inventory_map[key]['count']} "
                f"pero el programa requiere {min_count} para {typical} atletas simultáneos"
            )

    return InventoryValidation(
        template_id=str(template["id"]),
        template_name=template["name"],
        can_execute=len(missing_items) == 0,
        missing_items=missing_items,
        warnings=warnings,
    )
