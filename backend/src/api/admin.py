"""
Admin endpoints · solo accesibles con PAYMENTS_ADMIN_TOKEN.

Útil para:
- Correr migraciones bajo demanda (si el pre-deploy command de Render no se configuró)
- Inspeccionar el estado de la DB
- Limpiar mocks / test data

Auth: header `X-Admin-Token` o query param `admin_token`.
"""
import os
import asyncio
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException, Header, status

from ..db import users_repo

router = APIRouter(prefix="/v1/admin", tags=["admin"])

ADMIN_TOKEN = os.getenv("PAYMENTS_ADMIN_TOKEN", "")

MIGRATION_FILES = [
    "000_init.sql",
    "001_enable_rls.sql",
    "002_enable_pgvector.sql",
    "003_wise_score.sql",
    "004_rag_self_healing.sql",
    "005_github_oauth.sql",
    "006_wod_results.sql",
    "007_push_subscriptions.sql",
    "008_coach_skill_focus.sql",
    "009_wellness_checkins.sql",
    "010_manual_sessions.sql",
    "011_coach_skill_evaluation.sql",
    "012_volta_competitor.sql",
    "013_custom_wods.sql",
    "014_hormonal_cycle.sql",
    "015_athlete_belts.sql",
    "016_box_inventory.sql",
    "017_macrocycle_templates.sql",
    "018_athlete_macro_assignments.sql",
    "019_smart_coach_alerts.sql",
    "020_lifestyle_inputs.sql",
]


def check_admin(token: Optional[str]):
    if not ADMIN_TOKEN:
        raise HTTPException(503, "Admin token not configured on server")
    if token != ADMIN_TOKEN:
        raise HTTPException(401, "Invalid admin token")


@router.post("/migrate")
async def run_migrations(x_admin_token: Optional[str] = Header(default=None)):
    """
    Corre las migraciones SQL en orden contra la DB.
    Cada una se ejecuta en su propia transacción — si una falla, las siguientes
    siguen corriendo. Idempotente porque las migraciones usan IF NOT EXISTS.
    """
    check_admin(x_admin_token)

    pool = await users_repo.get_pool()
    if pool is None:
        raise HTTPException(503, "No DB pool available — check DATABASE_URL env var")

    # Las migraciones están en /app/migrations dentro del container, no /app/backend/migrations
    # porque el Dockerfile hace COPY backend/src/ ./src/ pero no copia migrations.
    # FIX: vamos a soportar 2 paths comunes
    candidates = [
        Path("/app/migrations"),                              # si Dockerfile copia migrations explícito
        Path("/app/src/../migrations"),                       # relativo a src
        Path(__file__).resolve().parent.parent.parent / "migrations",  # backend/migrations relativo al código
    ]
    migrations_dir = next((p for p in candidates if p.exists()), None)
    if migrations_dir is None:
        raise HTTPException(500, f"Migrations dir not found. Tried: {[str(p) for p in candidates]}")

    results = []
    async with pool.acquire() as conn:
        for fname in MIGRATION_FILES:
            fpath = migrations_dir / fname
            if not fpath.exists():
                results.append({"file": fname, "status": "missing"})
                continue
            sql = fpath.read_text(encoding="utf-8")
            try:
                await conn.execute(sql)
                results.append({"file": fname, "status": "ok"})
            except Exception as e:
                results.append({"file": fname, "status": "error", "error": str(e)[:300]})

    return {
        "migrations_dir": str(migrations_dir),
        "results": results,
    }


@router.post("/mp/create-plans")
async def create_mp_plans(x_admin_token: Optional[str] = Header(default=None)):
    """
    Crea los 4 preapproval_plan en MercadoPago Chile (una vez por entorno).
    Devuelve los plan_ids que tenés que setear como env vars:
      MP_PLAN_ID_ATHLETE_PRO_1M, MP_PLAN_ID_ATHLETE_PRO_12M,
      MP_PLAN_ID_COACH_PRO_1M,   MP_PLAN_ID_COACH_PRO_12M
    """
    check_admin(x_admin_token)
    from . import payments as P
    results = {}
    for plan_key, plan in P.PLANS.items():
        try:
            r = await P.create_mp_preapproval_plan(plan_key=plan_key, plan=plan)
            results[plan_key] = {"plan_id": r["plan_id"], "init_point": r["init_point"], "status": r["status"]}
        except Exception as e:
            results[plan_key] = {"error": str(e)[:300]}
    return {
        "plans": results,
        "next_step": "Setear las env vars MP_PLAN_ID_* en Render con los plan_ids de arriba y redeployar",
    }


@router.post("/promote-to-coach")
async def promote_to_coach(
    email: str,
    x_admin_token: Optional[str] = Header(default=None),
):
    """
    Cambia el role de un user de 'athlete' a 'coach'.

    Útil para:
    - Boss asignando coaches sin tocar la DB
    - Onboarding manual de partners box

    Idempotente: si ya es coach, devuelve el estado actual sin error.
    """
    check_admin(x_admin_token)

    pool = await users_repo.get_pool()
    if pool is None:
        raise HTTPException(503, "No DB pool available")

    email_norm = email.strip().lower()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, email, role FROM users WHERE LOWER(email) = $1",
            email_norm,
        )
        if not row:
            raise HTTPException(404, f"User not found: {email_norm}")

        prev_role = row["role"]
        if prev_role == "coach":
            return {
                "ok": True,
                "user_id": str(row["id"]),
                "email": row["email"],
                "previous_role": prev_role,
                "current_role": prev_role,
                "changed": False,
                "note": "User already had coach role",
            }
        if prev_role == "admin":
            raise HTTPException(400, f"User is admin · refusing to demote to coach")

        await conn.execute(
            "UPDATE users SET role = 'coach' WHERE id = $1",
            row["id"],
        )

        return {
            "ok": True,
            "user_id": str(row["id"]),
            "email": row["email"],
            "previous_role": prev_role,
            "current_role": "coach",
            "changed": True,
        }


@router.post("/demote-to-athlete")
async def demote_to_athlete(
    email: str,
    x_admin_token: Optional[str] = Header(default=None),
):
    """Revertir promoción · útil si se asignó coach por error."""
    check_admin(x_admin_token)

    pool = await users_repo.get_pool()
    if pool is None:
        raise HTTPException(503, "No DB pool available")

    email_norm = email.strip().lower()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, email, role FROM users WHERE LOWER(email) = $1",
            email_norm,
        )
        if not row:
            raise HTTPException(404, f"User not found: {email_norm}")

        prev_role = row["role"]
        if prev_role == "athlete":
            return {
                "ok": True,
                "user_id": str(row["id"]),
                "email": row["email"],
                "previous_role": prev_role,
                "current_role": prev_role,
                "changed": False,
            }
        if prev_role == "admin":
            raise HTTPException(400, "Refusing to demote admin")

        await conn.execute(
            "UPDATE users SET role = 'athlete' WHERE id = $1",
            row["id"],
        )

        return {
            "ok": True,
            "user_id": str(row["id"]),
            "email": row["email"],
            "previous_role": prev_role,
            "current_role": "athlete",
            "changed": True,
        }


@router.post("/seed-macro-templates")
async def seed_macro_templates(x_admin_token: Optional[str] = Header(default=None)):
    """
    Migra los 23 PROGRAMS hardcoded en macrocycle_engine.py a tabla DB.
    Idempotente · ON CONFLICT DO NOTHING por program_id único.
    Plus 5 templates Volta (CF Open · CF Conditioning · CF Strength · HYROX · Open Prep).
    """
    check_admin(x_admin_token)

    pool = await users_repo.get_pool()
    if pool is None:
        raise HTTPException(503, "DB no disponible")

    from ..core.macrocycle_engine import MacrocycleEngine
    import json as _json

    # Equipment requirements heurísticos por focus
    EQUIPMENT_BY_FOCUS = {
        "Strength":   ["barbell_olympic_20kg", "plate_bumper_kg", "rig_pullup", "rack"],
        "Power":      ["barbell_olympic_20kg", "plate_bumper_kg", "rack"],
        "Hypertrophy":["barbell_olympic_20kg", "plate_bumper_kg", "dumbbell_set", "rack"],
        "Peaking":    ["barbell_olympic_20kg", "plate_bumper_kg", "plate_change", "rack"],
        "Technical":  ["barbell_training_15kg", "plate_change", "barbell_olympic_20kg"],
    }

    GOAL_BY_FOCUS = {
        "Strength":    ["strength", "fuerza"],
        "Power":       ["power", "explosividad"],
        "Hypertrophy": ["volume", "masa"],
        "Peaking":     ["meet_prep", "competition"],
        "Technical":   ["technique", "skill"],
    }

    LEVEL_BY_DIFFICULTY = {
        1: ("beginner", "intermediate"),
        2: ("beginner", "intermediate"),
        3: ("intermediate", "advanced"),
        4: ("intermediate", "elite"),
        5: ("advanced", "elite"),
    }

    results = []
    inserted = 0

    async with pool.acquire() as conn:
        # Holy Oly · 23 programas
        for p in MacrocycleEngine.PROGRAMS.values():
            level_min, level_max = LEVEL_BY_DIFFICULTY.get(p.difficulty_level, ("intermediate", "advanced"))
            equipment = EQUIPMENT_BY_FOCUS.get(p.focus_type, [])
            goals = GOAL_BY_FOCUS.get(p.focus_type, [])

            try:
                await conn.execute(
                    """
                    INSERT INTO macrocycle_templates
                        (program_id, name, school, product, description, total_weeks,
                         focus, level_min, level_max, goal_tags, required_equipment,
                         typical_athletes, is_system, coach_id)
                    VALUES ($1, $2, $3, 'holy-oly', $4, $5, $6, $7, $8,
                            $9::jsonb, $10::jsonb, 1, TRUE, NULL)
                    ON CONFLICT (program_id) DO NOTHING
                    """,
                    p.id, p.name, p.school.lower(), p.description, p.duration_weeks,
                    p.focus_type.lower(), level_min, level_max,
                    _json.dumps(goals), _json.dumps(equipment),
                )
                results.append({"program_id": p.id, "status": "inserted"})
                inserted += 1
            except Exception as e:
                results.append({"program_id": p.id, "status": "error", "error": str(e)[:200]})

        # Volta · 5 programas CrossFit/HYROX
        VOLTA_PROGRAMS = [
            {
                "program_id": "cf_open_prep",  "name": "CrossFit Open Prep",
                "school": "crossfit", "weeks": 8, "focus": "peaking",
                "description": "8 semanas pre-Open · ciclos cortos · benchmarks recurrentes",
                "equipment": ["barbell_olympic_20kg", "plate_bumper_kg", "rig_pullup", "rower", "bike_assault", "wall_ball", "kettlebell_set", "plyo_box"],
                "goals": ["crossfit_open", "metcon"], "athletes": 12,
            },
            {
                "program_id": "cf_conditioning", "name": "CrossFit Conditioning Block",
                "school": "crossfit", "weeks": 6, "focus": "conditioning",
                "description": "Pulse zones · capacidad aeróbica + anaeróbica",
                "equipment": ["rower", "bike_assault", "rope_jump", "kettlebell_set", "wall_ball"],
                "goals": ["conditioning", "engine"], "athletes": 15,
            },
            {
                "program_id": "cf_strength", "name": "CrossFit Strength Cycle",
                "school": "crossfit", "weeks": 10, "focus": "strength",
                "description": "Squat + DL + presses · base fuerza para WODs",
                "equipment": ["barbell_olympic_20kg", "plate_bumper_kg", "rack", "rig_pullup"],
                "goals": ["strength", "1rm"], "athletes": 10,
            },
            {
                "program_id": "hyrox_prep", "name": "HYROX Race Prep",
                "school": "hyrox", "weeks": 12, "focus": "endurance",
                "description": "8 estaciones · 1km run x8 · sled push/pull · burpee broad jumps",
                "equipment": ["rower", "bike_assault", "sled", "wall_ball", "kettlebell_set", "sandbag"],
                "goals": ["hyrox", "race", "endurance"], "athletes": 8,
            },
            {
                "program_id": "hyrox_strength_endurance", "name": "HYROX Strength-Endurance",
                "school": "hyrox", "weeks": 8, "focus": "endurance",
                "description": "Off-season HYROX · base strength + zone 2",
                "equipment": ["barbell_olympic_20kg", "kettlebell_set", "rower", "rope_jump"],
                "goals": ["hyrox_offseason", "base"], "athletes": 10,
            },
        ]

        for v in VOLTA_PROGRAMS:
            product = "axon" if v["school"] == "hyrox" else "volta"
            try:
                await conn.execute(
                    """
                    INSERT INTO macrocycle_templates
                        (program_id, name, school, product, description, total_weeks,
                         focus, level_min, level_max, goal_tags, required_equipment,
                         typical_athletes, is_system, coach_id)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, 'beginner', 'elite',
                            $8::jsonb, $9::jsonb, $10, TRUE, NULL)
                    ON CONFLICT (program_id) DO NOTHING
                    """,
                    v["program_id"], v["name"], v["school"], product,
                    v["description"], v["weeks"], v["focus"],
                    _json.dumps(v["goals"]), _json.dumps(v["equipment"]),
                    v["athletes"],
                )
                results.append({"program_id": v["program_id"], "status": "inserted", "product": product})
                inserted += 1
            except Exception as e:
                results.append({"program_id": v["program_id"], "status": "error", "error": str(e)[:200]})

        total = await conn.fetchval("SELECT COUNT(*) FROM macrocycle_templates")

    return {
        "ok": True,
        "inserted_this_run": inserted,
        "total_in_db": total,
        "details": results,
    }


@router.post("/seed-pills")
async def seed_knowledge_pills(x_admin_token: Optional[str] = Header(default=None)):
    """Pobla catálogo de píldoras educacionales · sleep · cafeína · alcohol · etc."""
    check_admin(x_admin_token)
    pool = await users_repo.get_pool()
    if pool is None:
        raise HTTPException(503, "DB no disponible")

    import json as _json

    PILLS = [
        # Sleep
        ("sleep_under_6h", "sleep", "warning",
         "Sueño <6h afecta tu entrenamiento",
         "Dormir menos de 6 horas reduce capacidad de recuperación 40% · evita carga pesada hoy.",
         "Dormir <6h reduce síntesis proteica muscular, eleva cortisol matinal, baja testosterona y reduce reaction time. La fuerza máxima cae 5-15% y el RPE percibido sube. Recomendación: hoy entrenar a 70% intensidad o priorizar técnica.",
         "Watson et al. 2017 · Sports Medicine"),
        ("sleep_7_9h", "sleep", "info",
         "Sueño óptimo · 7-9h",
         "7-9h es la ventana óptima para recovery + síntesis hormonal.",
         "Durante sueño profundo se libera 70% del GH diario, se consolida memoria motora (skill learning) y se restauran neurotransmisores. Atletas que duermen <7h tienen 1.7x más probabilidad de lesión.",
         "Mah et al. 2011 · Sleep"),

        # Caffeine
        ("caffeine_residual", "caffeine", "info",
         "Cafeína · ¿cuándo te afecta?",
         "Vida media 5h · 200mg a las 9am = 100mg a las 2pm · 25mg a las 7pm.",
         "Cafeína se metaboliza con t1/2=5h promedio (varía 2-12h según CYP1A2). Para dormir bien evitar consumo después de las 14h. Para entrenar fuerte: 3-6mg/kg 45min pre-WOD mejora rendimiento 5-15%.",
         "Goldstein et al. 2010 · J Int Soc Sports Nutr"),
        ("caffeine_too_much", "caffeine", "warning",
         "Cafeína >400mg/día puede ser contraproducente",
         "Más de 400mg/día eleva ansiedad, reduce calidad del sueño y desensibiliza el efecto ergogénico.",
         "Tolerancia a cafeína se desarrolla en 1-2 semanas con uso diario. Para mantener efecto ergogénico óptimo: ciclar (5 días on, 2 off) o limitar a <300mg/día. >500mg/día se asocia con hipertensión y disritmias.",
         "Nehlig 2018 · Pharmacol Rev"),

        # Alcohol
        ("alcohol_post_training", "alcohol", "warning",
         "Alcohol post-entrenamiento mata el progreso",
         "≥1 unidad reduce síntesis proteica muscular 24h · pésimo para PR hoy.",
         "Etanol bloquea mTOR (clave para síntesis proteica), reduce GH nocturno 70%, deshidrata y empeora sueño profundo. 2 unidades post-WOD = pierdes 24h de adaptación. Si vas a tomar: 3+ horas después del entrenamiento, agua + comida proteica.",
         "Parr et al. 2014 · PLoS One"),
        ("alcohol_2_units", "alcohol", "critical",
         "2+ unidades · evita PR mañana",
         "Tu performance caerá 11% en pruebas anaeróbicas el día siguiente.",
         "Estudios muestran caída de 11.4% en pruebas anaeróbicas y 6.8% en aeróbicas tras 1g/kg de alcohol. Recuperación cardiovascular tarda 2-3 días. Para halterofilia: máxima caída en jerk + back squat (afecta CNS).",
         "Lecoultre & Schutz 2009 · Med Sci Sports Exerc"),

        # Smoking
        ("smoking_vo2", "smoking", "warning",
         "Fumar reduce VO2max 5-15%",
         "Cada cigarrillo afecta capacidad pulmonar ~4h · CO en sangre desplaza O2.",
         "Carboxihemoglobina (HbCO) de fumar reduce transporte de oxígeno. En atletas se traduce en ~5% menos VO2max por cada 10 pack-years. Vida media de CO en sangre: 4-6h. Mejor opción: dejar de fumar 2h antes de entrenar.",
         "Suminski et al. 2009 · J Smok Cessation"),

        # Stress
        ("chronic_stress", "stress", "warning",
         "Stress crónico · enemigo de la fuerza",
         "Cortisol elevado >2 semanas reduce testosterona, masa muscular y motivación.",
         "El stress eleva cortisol agudo (normal) y luego crónico (problema). Atletas con HRV crónicamente baja muestran 22% más riesgo de overtraining. Estrategias: respiración 4-7-8, journaling, sleep priority, reducir volumen entrenamiento -20% durante semanas estresantes.",
         "Stults-Kolehmainen & Bartholomew 2012 · Med Sci Sports Exerc"),

        # Recovery
        ("recovery_active", "recovery", "info",
         "Recovery activo > recovery pasivo",
         "10-15min de movilidad + zona 2 acelera recuperación 30% vs reposo total.",
         "El flujo sanguíneo bajo intensidad (50-60% FCmax) acelera clearance de lactato y subproductos metabólicos. Recovery activo post-WOD: 5-10min bike easy + foam rolling. En días off: 20-30min caminata + movilidad articular.",
         "Bahnert et al. 2013 · Sports Med"),

        # Hormonal
        ("luteal_phase", "hormonal", "info",
         "Fase lútea · contexto importante",
         "Días 18-28 · más fatiga + menor tolerancia al calor · bajemos volumen 20-30%.",
         "En fase lútea el cuerpo prioriza función reproductiva: temperatura basal sube 0.3°C, retención de líquidos aumenta, motivación baja. Estrategia: priorizar técnica, reducir volumen 20-30%, evitar tests máximos. Atletas de élite reportan -5-10% en fuerza máxima durante esta fase.",
         "Sims & Heather 2018 · Exp Physiol"),

        # Training
        ("rest_day_purpose", "training", "info",
         "Día de descanso = día de progreso",
         "El cuerpo se adapta DURANTE el descanso · no entrenando · si lo saltás, retrocedés.",
         "Adaptaciones (supercompensación) ocurren post-entrenamiento. Sin recovery suficiente, no hay adaptación. 1-2 días off/semana son obligatorios. Síntomas de under-recovery: HRV ↓, sueño peor, motivación baja, RPE alto en esfuerzos submáximos.",
         "Bompa & Buzzichelli 2015 · Periodization training"),

        # Injury prevention
        ("warmup_15min", "injury_prevention", "info",
         "Calentamiento <10min · riesgo lesión sube 2x",
         "10-15min de warmup específico reduce lesiones 30-50%.",
         "Warmup eleva temperatura muscular (mejor compliance), activa CNS (mejor reclutamiento), aumenta rango articular. Estructura: 3min cardio leve + 5min movilidad dinámica + 5min activación específica del WOD.",
         "Fradkin et al. 2010 · J Strength Cond Res"),

        # Nutrition
        ("pre_wod_meal", "nutrition", "info",
         "Comida pre-WOD · 1-3h antes",
         "Última comida sólida 2-3h antes · evita PR con estómago lleno.",
         "Comer cerca del entrenamiento desvía flujo sanguíneo al sistema digestivo, reduciendo performance. Ideal: comida balanceada (carbs + proteína + poca grasa) 2-3h antes. Si no es posible: snack ligero (banana, dátiles) 30-60min antes.",
         "Burke et al. 2011 · J Sports Sci"),
    ]

    inserted = 0
    async with pool.acquire() as conn:
        for slug, category, severity, title, short_text, long_text, citation in PILLS:
            try:
                await conn.execute(
                    """
                    INSERT INTO knowledge_pills
                        (slug, category, severity, title, short_text, long_text, citation,
                         trigger_rules, related_engines)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, '{}'::jsonb, $8::jsonb)
                    ON CONFLICT (slug) DO NOTHING
                    """,
                    slug, category, severity, title, short_text, long_text, citation,
                    _json.dumps([category]),
                )
                inserted += 1
            except Exception as e:
                print(f"[seed-pills] {slug}: {e}")

        total = await conn.fetchval("SELECT COUNT(*) FROM knowledge_pills")

    return {"ok": True, "inserted_this_run": inserted, "total_in_db": total}


@router.post("/seed-pills-huberman")
async def seed_pills_huberman(x_admin_token: Optional[str] = Header(default=None)):
    """
    Pobla 20 píldoras basadas en protocolos Huberman Lab.
    Fuente: Huberman Lab Podcast (Stanford · Andrew Huberman).
    Citation incluye episodio específico cuando aplica.
    """
    check_admin(x_admin_token)
    pool = await users_repo.get_pool()
    if pool is None:
        raise HTTPException(503, "DB no disponible")

    import json as _json

    PILLS_HUBERMAN = [
        # ── SUEÑO ──
        ("huberman_morning_sunlight", "sleep", "info",
         "Luz solar 10min · primeros 30-60min al despertar",
         "10-30min de luz solar matinal sincroniza tu reloj circadiano · mejora sueño esa noche +20min.",
         "Exposición a luz solar (100k+ lux) dentro de la primera hora despierto activa células ganglionares de retina que sincronizan núcleo supraquiasmático. Resultado: cortisol matinal saludable, melatonina temprana en la noche, sleep onset 15-20min más rápido. NO usar gafas oscuras. Días nublados: 20-30min. Ventana inteligente · no después de 9-10am.",
         "Huberman Lab #2: Master Your Sleep & Be More Alert When Awake"),

        ("huberman_evening_sunset", "sleep", "info",
         "Luz solar atardecer · ancla circadiana",
         "Mirá el sol bajando 5-10min · protege contra luz artificial nocturna · mejora cortisol mañana siguiente.",
         "Ver el sol cerca del atardecer (5-10min) actúa como segunda ancla circadiana. La luz de baja longitud de onda señaliza al cerebro 'el día termina'. Protege contra disrupciones por luz artificial nocturna posterior. Bonus: mejora ánimo (serotonina + dopamina).",
         "Huberman Lab #2 & #28"),

        ("huberman_delayed_caffeine", "caffeine", "info",
         "Cafeína retrasada · 90-120min post despertar",
         "Tomar cafeína 90-120min después de levantarte evita el bajón del mediodía y mejora alerta sostenida.",
         "Al despertar, adenosina (que cafeína bloquea) ya está cayendo naturalmente. Cafeína inmediata = bloqueo redundante. Si esperás 90-120min, la cafeína actúa cuando adenosina volvería a subir → curva de alerta más estable. Reduce el clearance crash de mediodía. Sin cafeína después de 14h para protegerse del sleep.",
         "Huberman Lab #100: Caffeine"),

        ("huberman_nsdr", "recovery", "info",
         "NSDR · Non-Sleep Deep Rest 10-20min",
         "Práctica diaria de Yoga Nidra/NSDR mejora dopamina, sleep onset y recovery cognitivo +60%.",
         "NSDR (Yoga Nidra) es una práctica de relajación consciente sin dormirse. 10-20min eleva dopamina basal 65% (vs reposo pasivo) y mejora reset cognitivo. Útil post-entrenamiento intenso o cuando sleep fue corto. Spotify/YouTube tiene scripts gratuitos. Forma: acostado, ojos cerrados, narración guiada con body scan.",
         "Huberman Lab #5 & #28 · Yoga Nidra protocol"),

        # ── COLD/HEAT ──
        ("huberman_cold_protocol", "recovery", "info",
         "Cold exposure · 11min/semana total",
         "Inmersión fría 1-3min × 2-4 sesiones por semana eleva dopamina +250% por 3+ horas · mejora resilencia.",
         "Frío deliberado (10-15°C) en sesiones cortas (1-3min). Total semanal: 11min divididos en 2-4 inmersiones. Eleva norepinefrina (alerta) y dopamina (motivación) sostenidas 3+h. Para recovery post-WOD: hacer >6h después del entrenamiento (sino bloquea adaptaciones hipertróficas). Ducha fría 1-3min también sirve.",
         "Huberman Lab #66: Deliberate Cold Exposure"),

        ("huberman_sauna", "recovery", "info",
         "Sauna · 4×/semana × 20min reduce mortalidad 50%",
         "Sauna 4-7 sesiones/semana × 20min a 80°C correlaciona con -47% mortalidad cardiovascular.",
         "Estudio finlandés 20-año: 4-7 sesiones/semana × 19-23min cada una correlaciona con -50% mortalidad cardiovascular y mejora VO2max. Eleva GH 16x post-sesión (timing recovery). Protege contra Alzheimer (-65%). Hacer >30min post-WOD pesado para no bloquear adaptaciones.",
         "Huberman Lab #87: Sauna · Laukkanen et al. JAMA Intern Med 2015"),

        # ── ENTRENAMIENTO ──
        ("huberman_zone_2", "training", "info",
         "Zone 2 cardio · 180-200min/semana",
         "Zone 2 (conversación posible) 3h/semana mejora mitocondrias, base aeróbica, recovery, longevidad.",
         "Zone 2 = 60-70% FC máx · podés mantener conversación sin jadear. Acumular 180-200min/semana mejora densidad mitocondrial, oxidación de grasas, recovery entre WODs intensos. Esencial para halterofilia · CrossFit · HYROX. Puede ser caminar inclinado, bike easy, rower easy. Separar de strength por 6+h.",
         "Huberman Lab #102 & Iñigo San Millán · Stanford"),

        ("huberman_strength_protocol", "training", "info",
         "Strength · 3-5 reps · 3-5 series · 80-85%",
         "Para fuerza máxima · 3-5 reps × 3-5 series × 80-85% 1RM · descansos 2-4min · 2x/semana por grupo.",
         "Protocolo strength science-based: 3-5 reps en 3-5 series con 80-85% del 1RM y descansos largos (2-4min). Frecuencia: 2× por semana por grupo muscular. Combinable con hypertrophy alternada (8-12 reps × 3-4 series × 65-75%). Time-under-tension para hipertrofia · velocidad explosiva para fuerza.",
         "Huberman Lab #34: Optimize Your Training · Andy Galpin"),

        # ── SUPLEMENTACIÓN ──
        ("huberman_creatine", "nutrition", "info",
         "Creatina monohidrato · 5g/día",
         "5g/día creatina monohidrato · mejora fuerza 8% y cognición · seguridad extensamente validada.",
         "Suplemento más estudiado en deporte. 5g/día (sin carga necesaria) mejora fuerza máxima 5-15%, potencia anaeróbica 10-20%, masa muscular magra 1-2kg/8 semanas. Bonus cognitivo (memoria de trabajo +5%). Saturación tarda ~28 días. Tomar con comida cualquier momento. No daña riñones en personas sanas.",
         "Huberman Lab #88 · Kreider et al. 2017 Meta-analysis"),

        ("huberman_magnesium", "sleep", "info",
         "Magnesio L-threonato 30-60min antes de dormir",
         "200mg de magnesio L-threonate antes de dormir mejora calidad de sueño y atraviesa BHE.",
         "Forma específica L-threonato cruza barrera hematoencefálica (otras formas no). Mejora deep sleep, reduce sleep onset, y mejora memoria. Dosis: 145-200mg de Mg elemental (revisar etiqueta). Alternativas si no tenés: glicinato 200mg + apigenina 50mg. NO mezclar con melatonina (Huberman no recomienda melatonina rutinaria).",
         "Huberman Lab #2 & #28 · Slutsky et al. 2010 Neuron"),

        ("huberman_no_melatonin", "sleep", "warning",
         "Melatonina · evitar uso crónico",
         "Melatonina suplementaria reduce producción endógena · efecto rebote · usar solo jetlag.",
         "Melatonina suplementaria tiende a tener dosis 10-100× la fisiológica. Uso crónico (>1 semana) puede suprimir producción endógena · disrumpe sistema. Solo recomendado para jetlag (3-5 días máximo). Alternativas más seguras: magnesio + apigenina + glicina · sleep hygiene · light protocols.",
         "Huberman Lab #2 & #28 · Concern over melatonin"),

        # ── RESPIRACIÓN ──
        ("huberman_physiological_sigh", "stress", "info",
         "Physiological Sigh · 1-3 ciclos en 30 segundos",
         "Doble inhalación nasal + exhalación larga por boca · baja stress en <1min · gratis · validado.",
         "Patrón respiratorio que reduce stress en <60seg: doble inhalación nasal (1ra profunda, 2da topping off los alvéolos) + exhalación larga por boca. 1-3 ciclos. Activa parasimpático, reduce CO2, baja heart rate. Validado por Stanford lab. Útil pre-WOD pesado · entre rounds · si te abruma el día.",
         "Huberman Lab #28 · Balban et al. 2023 Cell Rep Med"),

        ("huberman_box_breathing", "stress", "info",
         "Box Breathing · 4-4-4-4 · 5min/día",
         "4 inhalo · 4 retengo · 4 exhalo · 4 retengo · activa parasimpático · entrena HRV.",
         "Patrón cuadrado: inhalar 4seg, retener 4seg, exhalar 4seg, retener 4seg. Practicar 5min/día baseline mejora HRV crónica (mejor recovery). Pre-WOD: 1-2min para enfocar. Si stress agudo: physiological sigh (más rápido). Box breathing es para regulación basal del SN autónomo.",
         "Huberman Lab #28 · Navy SEAL technique"),

        # ── CICLO HORMONAL ──
        ("huberman_testosterone", "hormonal", "info",
         "Testosterona · cosas que la suben naturalmente",
         "Sueño 7-9h · resistencia ejercicio · vitamina D · zinc · evitar alcohol · exposición frío deliberada.",
         "Comportamientos validados que optimizan testosterona endógena: sueño 7-9h (cada hora <7 reduce T ~15%), resistencia training 3-4×/sem, vitamina D 1000-2000 IU/día si deficiente, zinc 15-30mg/día con comida, exposición al frío deliberada, evitar alcohol crónico (>1 unidad/día reduce T 6%). Cortisol crónico es el enemigo principal.",
         "Huberman Lab #15 · Optimize testosterone & estrogen"),

        ("huberman_female_hormones", "hormonal", "info",
         "Ciclo menstrual · adaptar entrenamiento por fase",
         "Folicular: PR + intensidad · Ovulación: pico fuerza · Lútea: -20% volumen + técnica.",
         "Fase folicular (días 1-14): estrógeno sube · sensibilidad a insulina alta · tolerancia carga máxima alta · ventana para PRs. Ovulación (día ~14): pico testosterona · puede atentar PR. Lútea (días 15-28): progesterona alta · retención líquido · temperatura sube 0.3°C · reducir volumen 20-30% · priorizar técnica · evitar tests máximos.",
         "Huberman Lab #58 · Stacy Sims PhD"),

        # ── NUTRICIÓN ──
        ("huberman_protein_timing", "nutrition", "info",
         "Proteína · 1g/lb body weight · distribuida",
         "Atletas: 1g de proteína por libra de body weight diarios · 4-5 comidas · 30-40g por comida.",
         "Para hipertrofia + recovery: 1.6-2.2g/kg/día (= 0.7-1g/lb). Distribuir en 4-5 comidas con 30-40g por comida (saturación de mTOR). Source: whey/casein/huevos/carne tienen leucina alta (mejor signal). Pre-sleep 30-40g caseína extiende síntesis durante sueño. Vegetal: aumentar 20-25% para compensar lower digestibility.",
         "Huberman Lab #97 · Andy Galpin protocol"),

        ("huberman_omega3", "nutrition", "info",
         "Omega-3 EPA/DHA · 2-3g/día",
         "2-3g/día de EPA + DHA reduce inflamación · mejora mood · clave para recovery post-WOD pesado.",
         "EPA/DHA bajos correlacionan con inflamación crónica, peor recovery, mood bajo. Dosis efectiva: 2-3g/día (sumar EPA + DHA del label). Pescado graso 2-3×/sem o suplemento certificado IFOS. NO confundir con omega-3 total · solo EPA + DHA cuentan. Tomar con comida grasa para absorción.",
         "Huberman Lab #62 · Foundational supplements"),

        # ── DOPAMINA / MOTIVACIÓN ──
        ("huberman_dopamine_management", "mental", "info",
         "Dopamina · no la quemes con shortcuts",
         "Multiple shortcuts en un día (cafeína + redes + porn + apuestas) agota dopamina · entrenar se vuelve gris.",
         "Dopamina opera en sistema 'tonic + phasic'. Múltiples picos rápidos en un día (cafeína + redes sociales + porn + apuestas + sugar) sobrecargan el sistema · baseline cae · placer normal (entrenar, comer bien) se vuelve aburrido. Soluciones: limitar shortcuts a 1-2/día, separados, alternar con esfuerzo. Pre-WOD: NO cafeína sin entrenamiento real.",
         "Huberman Lab #39 · Controlling Dopamine"),

        ("huberman_effort_reward", "mental", "info",
         "Aprende a disfrutar el ESFUERZO, no solo recompensa",
         "Liberar dopamina DURANTE el esfuerzo difícil entrena cerebro a buscar más esfuerzo · adicción al trabajo bueno.",
         "Truco mental clave: en lugar de pensar 'qué bueno cuando termine', pensar 'esto es bueno PORQUE es difícil'. Liberar dopamina durante el esfuerzo (no solo post) entrena el sistema a buscar trabajo duro. Atletas de élite naturalmente lo hacen. Útil mid-WOD en zona roja, en sesiones de 5x5 finales, en zone 2 monótono.",
         "Huberman Lab #39 · Effort-derived dopamine"),

        # ── ALCOHOL ──
        ("huberman_alcohol_zero", "alcohol", "warning",
         "Alcohol · NO hay dosis saludable",
         "Más de 2 unidades/semana eleva riesgo cáncer · -7 puntos cognitivo · empeora sleep dramáticamente.",
         "Análisis 2022 (>5M personas): cualquier alcohol regular aumenta riesgo cánceres digestivos. >2 unidades/semana asociado con atrofia cerebral, -7 puntos cognitivos sostenidos, peor sleep architecture (cero deep sleep), peor recovery muscular. Para entrenar serio: 0 unidades semana antes de competencia · max 1-2/semana mantenimiento.",
         "Huberman Lab #86 · Alcohol effects · GBD 2022 Lancet"),
    ]

    inserted = 0
    async with pool.acquire() as conn:
        for slug, category, severity, title, short_text, long_text, citation in PILLS_HUBERMAN:
            try:
                await conn.execute(
                    """
                    INSERT INTO knowledge_pills
                        (slug, category, severity, title, short_text, long_text, citation,
                         trigger_rules, related_engines)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, '{}'::jsonb, $8::jsonb)
                    ON CONFLICT (slug) DO UPDATE
                      SET title = EXCLUDED.title,
                          short_text = EXCLUDED.short_text,
                          long_text = EXCLUDED.long_text,
                          citation = EXCLUDED.citation
                    """,
                    slug, category, severity, title, short_text, long_text, citation,
                    _json.dumps([category, "huberman"]),
                )
                inserted += 1
            except Exception as e:
                print(f"[seed-pills-huberman] {slug}: {e}")

        total = await conn.fetchval("SELECT COUNT(*) FROM knowledge_pills")
        by_source = await conn.fetch(
            """
            SELECT
              COUNT(*) FILTER (WHERE citation ILIKE '%Huberman%') AS huberman,
              COUNT(*) FILTER (WHERE citation NOT ILIKE '%Huberman%') AS otros,
              COUNT(*) AS total
              FROM knowledge_pills
            """
        )

    return {
        "ok": True,
        "inserted_this_run": inserted,
        "total_in_db": total,
        "breakdown": dict(by_source[0]) if by_source else {},
    }


@router.post("/seed-demo")
async def run_seed_demo(
    reset: bool = False,
    x_admin_token: Optional[str] = Header(default=None),
):
    """
    Corre el seed de datos demo · pobla coach + 6 atletas + baselines +
    30 días wod_results + 90 días cf_sessions.

    Si reset=True, borra los users demo primero (CASCADE limpia todo lo asociado).

    Idempotente: re-correr sin reset no duplica datos.
    """
    check_admin(x_admin_token)

    # Import perezoso · evita ciclo en boot
    import os
    if reset:
        os.environ["DEMO_SEED_RESET"] = "1"
    try:
        from ..scripts.seed_demo import seed as _seed_demo  # type: ignore
    except ImportError:
        # Si la estructura de paquete no incluye scripts/, intentamos path absoluto
        import importlib.util
        from pathlib import Path
        candidates = [
            Path("/app/scripts/seed_demo.py"),
            Path("/app/backend/scripts/seed_demo.py"),
            Path(__file__).resolve().parent.parent.parent / "scripts" / "seed_demo.py",
        ]
        seed_path = next((p for p in candidates if p.exists()), None)
        if seed_path is None:
            raise HTTPException(500, f"seed_demo.py not found. Tried: {[str(p) for p in candidates]}")
        spec = importlib.util.spec_from_file_location("seed_demo", seed_path)
        if spec is None or spec.loader is None:
            raise HTTPException(500, "Could not load seed_demo spec")
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        _seed_demo = module.seed

    try:
        await _seed_demo()
    except Exception as e:
        raise HTTPException(500, f"Seed failed: {str(e)[:300]}")
    finally:
        os.environ.pop("DEMO_SEED_RESET", None)

    pool = await users_repo.get_pool()
    if pool is not None:
        async with pool.acquire() as conn:
            n_demo = await conn.fetchval(
                "SELECT COUNT(*) FROM users WHERE email LIKE '%.demo@holyoly.app' OR email = 'coach.demo@holyoly.app'",
            )
        return {
            "ok": True,
            "reset_used": reset,
            "demo_users_count": n_demo,
            "credentials": {
                "coach":  "coach.demo@holyoly.app  /  DemoCoach2026!",
                "athlete": "<nombre>.demo@holyoly.app  /  DemoAth2026!",
            },
        }
    return {"ok": True, "reset_used": reset}


@router.get("/db-status")
async def db_status(x_admin_token: Optional[str] = Header(default=None)):
    """Inspecciona qué tablas existen + count rápido."""
    check_admin(x_admin_token)
    pool = await users_repo.get_pool()
    if pool is None:
        return {"connected": False}

    async with pool.acquire() as conn:
        tables = await conn.fetch(
            """
            SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
            """
        )
        table_names = [r["tablename"] for r in tables]

        counts = {}
        for t in ["users", "baseline_results", "social_screenshots", "payment_intents"]:
            if t in table_names:
                try:
                    row = await conn.fetchrow(f"SELECT COUNT(*) as n FROM {t}")
                    counts[t] = row["n"]
                except Exception as e:
                    counts[t] = f"error: {str(e)[:100]}"

        return {
            "connected": True,
            "tables": table_names,
            "counts": counts,
        }
