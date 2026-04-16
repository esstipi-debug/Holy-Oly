# HolyOly Exercise Database

**49 standardized exercises** with complexity ratings, CNS demand, and 48 intelligent substitution chains for session adaptation.

---

## Overview

The Exercise Database is the foundation for:
- **Session Adaptation** — Complexity/CNS scoring determines risk-based degradation
- **Macrocycle Design** — Exercise selection within periodization phases
- **Warmup Engine** — Complexity weighting for readiness-aware protocols
- **Balance Engine** — Exercise ratio enforcement (FS/BS, Snatch/CJ, Pull/Push)
- **Frontend UI** — Exercise selection, substitution suggestions, PR tracking

---

## Database Schema

```sql
CREATE TABLE "Exercise" (
  "id" UUID PRIMARY KEY,
  "name" VARCHAR (English),           -- "Snatch (Arrancada)"
  "nameEs" VARCHAR (Spanish),         -- "Arrancada"
  "category" VARCHAR,                 -- "Snatch", "Clean & Jerk", "Pull", "Squat", etc.
  "movementType" VARCHAR,             -- "snatch", "clean_jerk", "pull", "squat", "press", "row", "accessory", "conditioning", "activation"
  "isCompetitionLift" BOOLEAN,        -- true for Snatch, CJ, FS, BS; false for variants
  "requires1rm" BOOLEAN,              -- true if needs athlete's 1RM for %calculation
  "technicalComplexity" INT (1-10),   -- How technically demanding (coordination, timing, positions)
  "cnsDemand" INT (1-10)              -- CNS tax at high intensity (fatigue accumulation)
);

CREATE TABLE "ExerciseSubstitution" (
  "id" UUID PRIMARY KEY,
  "originalExerciseId" UUID,
  "substituteId" UUID,
  "degradationLevel" INT (1-3),       -- 1=mild (yellow), 2=moderate (orange), 3=heavy (red)
  "reason" VARCHAR,                   -- "fatigue_cns", "poor_coordination", "soreness", "general"
  "intensityModPct" INT,              -- % intensity change (-40 to 0, typically negative)
  "volumeModPct" INT,                 -- % volume change (-30 to 0, or 0 for no change)
  UNIQUE(originalExerciseId, substituteId, degradationLevel)
);
```

---

## Exercise Categories (7)

| Category | Exercises | Complexity Range | CNS Demand |
|----------|-----------|------------------|-----------|
| **Snatch** | 12 variants | 4-10 | 3-10 |
| **Clean & Jerk** | 15 variants | 3-9 | 3-10 |
| **Pulls & Deadlifts** | 6 variants | 2-3 | 2-6 |
| **Squat** | 5 variants | 1-6 | 4-7 |
| **Press** | 3 variants | 1-5 | 3-4 |
| **Row** | 1 variant | 1 | 2 |
| **Accessory** | 5 variants | 1 | 2 |
| **Activation** | 1 variant | 1 | 1 |
| **Conditioning** | 1 variant | 1 | 2 |

---

## All 49 Exercises

### SNATCH FAMILY (12 exercises)

| # | Exercise (English) | Spanish | Complexity | CNS | CompLift | Requires1RM | Common Use |
|---|---|---|---|---|---|---|---|
| 1 | Snatch (Arrancada) | Arrancada | **10** | **10** | ✅ YES | ✅ YES | Full competition lift |
| 2 | Power Snatch | Arrancada de Fuerza | **8** | **8** | ✅ YES | ✅ YES | High power training |
| 3 | Hang Snatch | Arrancada Colgante | **8** | **7** | ✅ YES | ✅ YES | Reduced pull distance |
| 4 | Hang Power Snatch | Arrancada de Fuerza Colgante | **7** | **6** | ✅ YES | ✅ YES | Short pull, less fatigue |
| 5 | Block Snatch | Arrancada de Tacos | **7** | **7** | ✅ YES | ✅ YES | Start position focus |
| 6 | Tall Snatch | Arrancada Alta / Sin Impulso | **5** | **3** | ❌ NO | ❌ NO | Position work (light) |
| 7 | Muscle Snatch | Arrancada Muscular | **4** | **3** | ❌ NO | ❌ NO | Technique drill |
| 8 | No-Foot Snatch | Arrancada sin Desplazamiento | **7** | **7** | ✅ YES | ✅ YES | Footwork restriction |
| 9 | Snatch Balance | Equilibrio de Arrancada | **6** | **5** | ❌ NO | ❌ NO | Receiving position |
| 10 | Drop Snatch | Caida de Arrancada | **5** | **3** | ❌ NO | ❌ NO | Catch position drill |
| 11 | Snatch Pull | Tiron de Arrancada | **3** | **5** | ✅ YES | ✅ YES | Pull pattern only |
| 12 | Hip Snatch | Hip Snatch | **5** | **4** | ❌ NO | ❌ NO | Hip extension focus |

### CLEAN & JERK FAMILY (15 exercises)

| # | Exercise (English) | Spanish | Complexity | CNS | CompLift | Requires1RM | Common Use |
|---|---|---|---|---|---|---|---|
| 13 | Clean & Jerk | Dos Tiempos | **9** | **10** | ✅ YES | ✅ YES | Full competition lift |
| 14 | Power Clean | Cargada de Fuerza | **7** | **7** | ✅ YES | ✅ YES | High power training |
| 15 | Hang Clean | Cargada Colgante | **7** | **6** | ✅ YES | ✅ YES | Reduced pull distance |
| 16 | Hang Power Clean | Cargada de Fuerza Colgante | **6** | **5** | ✅ YES | ✅ YES | Short pull, less fatigue |
| 17 | Block Clean | Cargada desde Tacos | **6** | **6** | ✅ YES | ✅ YES | Start position focus |
| 18 | Tall Clean | Cargada Alta / Sin Impulso | **5** | **3** | ❌ NO | ❌ NO | Position work (light) |
| 19 | Muscle Clean | Cargada Muscular | **4** | **3** | ❌ NO | ❌ NO | Technique drill |
| 20 | No-Foot Clean | Cargada sin Desplazamiento | **7** | **6** | ✅ YES | ✅ YES | Footwork restriction |
| 21 | Split Jerk | Envion en Tijera | **7** | **7** | ❌ NO | ❌ NO | Classic jerk position |
| 22 | Push Jerk | Push Jerk | **5** | **5** | ❌ NO | ❌ NO | Power jerk (no split) |
| 23 | Squat Jerk | Jerk en Sentadilla | **9** | **8** | ❌ NO | ❌ NO | Deep jerk position |
| 24 | Jerk from Rack | Jerk desde Soportes | **5** | **5** | ❌ NO | ❌ NO | Isolated jerk |
| 25 | Jerk Balance | Equilibrio de Jerk | **4** | **3** | ❌ NO | ❌ NO | Jerk position work |
| 26 | Jerk Dip / Drive | Impulso de Jerk | **3** | **4** | ❌ NO | ❌ NO | Power phase only |
| 27 | Jerk Recovery | Recuperacion de Jerk | **3** | **4** | ❌ NO | ❌ NO | Recovery position |

### PULLS & DEADLIFTS (6 exercises)

| # | Exercise (English) | Spanish | Complexity | CNS | CompLift | Requires1RM | Common Use |
|---|---|---|---|---|---|---|---|
| 28 | Clean Deadlift | Peso Muerto de Cargada | **2** | **5** | ❌ NO | ✅ YES | Pull power base |
| 29 | Clean Pull | Tiron de Cargada | **3** | **5** | ❌ NO | ✅ YES | Competition pull pattern |
| 30 | Clean Grip RDL | Peso Muerto Rumano de Cargada | **2** | **3** | ❌ NO | ❌ NO | Hip extension (light) |
| 31 | Snatch Grip RDL | Peso Muerto Rumano de Arrancada | **2** | **3** | ❌ NO | ❌ NO | Wider grip RDL |
| 32 | Deficit Pulls / Deadlifts | Tirones con Deficit | **3** | **6** | ❌ NO | ✅ YES | Extended ROM pulls |
| 33 | Snatch Deadlift | Peso Muerto de Arrancada | **2** | **5** | ❌ NO | ✅ YES | Snatch pull base |

### SQUAT FAMILY (5 exercises)

| # | Exercise (English) | Spanish | Complexity | CNS | CompLift | Requires1RM | Common Use |
|---|---|---|---|---|---|---|---|
| 34 | Back Squat | Sentadilla Trasera | **2** | **7** | ❌ NO | ✅ YES | Primary squat |
| 35 | Front Squat | Sentadilla Frontal | **3** | **6** | ✅ YES | ✅ YES | Clean reception |
| 36 | Overhead Squat | Sentadilla de Arrancada | **6** | **5** | ❌ NO | ❌ NO | Snatch receiving |
| 37 | Pause Squat | Sentadilla con Pausa | **2** | **6** | ❌ NO | ✅ YES | Tempo squat |
| 38 | 1/4 Squat / Half Squat | Media Sentadilla | **1** | **4** | ❌ NO | ❌ NO | Reduced ROM (soreness) |

### PRESS FAMILY (3 exercises)

| # | Exercise (English) | Spanish | Complexity | CNS | CompLift | Requires1RM | Common Use |
|---|---|---|---|---|---|---|---|
| 39 | Strict Press | Press Militar | **1** | **3** | ❌ NO | ❌ NO | Upper body strength |
| 40 | Push Press | Push Press | **2** | **4** | ❌ NO | ❌ NO | Leg drive press |
| 41 | Sots Press | Press Sots | **5** | **3** | ❌ NO | ❌ NO | Squat receiving (light) |

### ROW (1 exercise)

| # | Exercise (English) | Spanish | Complexity | CNS | CompLift | Requires1RM | Common Use |
|---|---|---|---|---|---|---|---|
| 42 | Pendlay Row | Remo Pendlay | **1** | **2** | ❌ NO | ❌ NO | Back strength |

### ACCESSORIES (5 exercises)

| # | Exercise (English) | Spanish | Complexity | CNS | CompLift | Requires1RM | Common Use |
|---|---|---|---|---|---|---|---|
| 43 | Pull-Up / Weighted Pull-Up | Dominadas | **1** | **2** | ❌ NO | ❌ NO | Back + core |
| 44 | Dips / Weighted Dips | Fondos | **1** | **2** | ❌ NO | ❌ NO | Upper body |
| 45 | Good Morning | Buenos Dias | **1** | **2** | ❌ NO | ❌ NO | Posterior chain |
| 46 | Snatch High Pull / Hyper Pull | Tiron Alto de Arrancada | **4** | **5** | ❌ NO | ✅ YES | Upper pull power |

### ACTIVATION & CONDITIONING (2 exercises)

| # | Exercise (English) | Spanish | Complexity | CNS | CompLift | Requires1RM | Common Use |
|---|---|---|---|---|---|---|---|
| 47 | Empty Bar | Barra Vacia | **1** | **1** | ❌ NO | ❌ NO | Warmup only |
| 48 | Saltos | Saltos | **1** | **2** | ❌ NO | ❌ NO | Conditioning/plyos |

---

## Complexity & CNS Demand Scale

### Technical Complexity (1-10)
Measures how demanding the exercise is in terms of **coordination, timing, and technical positions**.

| Score | Examples | Key Factors |
|-------|----------|------------|
| **1** | Strict Press, Pendlay Row, Pull-Up, Half Squat | Single movement pattern, minimal coordination |
| **2-3** | Clean Deadlift, Clean Pull, Front Squat, RDL | Hinge + upright, simple sequencing |
| **4-5** | Muscle variations, Tall variations, Snatch Balance, Sots Press | Restricted positions or light bars |
| **6-7** | Hang variants, Block variants, Squat Jerk, Split Jerk, No-Foot | Multiple positions, footwork complexity |
| **8-9** | Power Snatch, Power Clean, Clean & Jerk | Full pattern with receiving positions |
| **10** | Full Snatch | Most complex: timing + positions + speed |

### CNS Demand (1-10)
Measures how much the exercise **stresses the Central Nervous System at high intensities** (heavy loads, explosive power, or maximal effort).

| Score | Examples | Key Factors |
|-------|----------|------------|
| **1-2** | Empty bar, Press, Row, Accessories | Low intensity, high reps safe |
| **3-4** | Muscle variants, Tall variants, Half Squat, Jerk accessory | Light loads, technique focus |
| **5-6** | Clean Pull, Snatch Pull, RDL, Front Squat, Hang variants | Moderate complexity + power/strength |
| **7-8** | Power Clean, Power Snatch, Back Squat, Block variants, Split Jerk | Heavy loads + coordination |
| **9-10** | Full Clean & Jerk, Full Snatch, Squat Jerk | Maximum coordination + heavy loads |

**Why This Matters:**
- High complexity + high CNS = HIGH RISK for fatigued athletes (sessions get adapted first)
- Low complexity + low CNS = LOW RISK (safe to load even when readiness is poor)
- **Example:** Snatch (10/10) is high-risk, Pendlay Row (1/2) is safe backup option

---

## Substitution Chains Overview

**48 total substitution chains** organized by exercise family. Each shows:
- **Original** exercise (the one athlete is supposed to do)
- **Substitute** exercise (what to do instead when fatigued/coordinated)
- **Degradation Level** (1=mild, 2=moderate, 3=heavy)
- **Reason** (fatigue_cns, poor_coordination, soreness, general)
- **Intensity Mod** (% reduction, typically -5 to -40)
- **Volume Mod** (% change in sets/reps, typically 0 to -30)

### Example Chain: Snatch Degradation

```
Full Snatch (complexity 10, CNS 10)
├─ Level 1 (yellow): Power Snatch (-5% intensity, no volume change)
├─ Level 2 (orange): Hang Power Snatch (-15% intensity, -20% volume)
├─ Level 3 (red): Muscle Snatch (-40% intensity, no volume change)
└─ Level 3 (red): Snatch Pull (-10% intensity, no volume change)
```

**Why this works:**
- Power Snatch removes receiving depth requirement (better coordination)
- Hang variant reduces pull distance (less CNS tax)
- Muscle variant removes catching entirely (pure power, no timing)
- Snatch Pull keeps pull pattern, removes catch (safest for CNS fatigue)

---

## Integration Points

### Uses Data From:
- **Athlete Profile** — 1RM records for % calculations
- **Session Adapter** — Complexity/CNS to determine risk
- **Macrocycle Engine** — Exercise selection per week

### Feeds Data To:
- **Session Adaptation Engine** — Risk scoring (complexity × CNS × risk score)
- **Balance Engine** — Exercise categories for ratio validation
- **Warmup Engine** — Complexity weighting (1st exercise full warmup, 2nd reduced, 3rd minimal)
- **Frontend UI** — Exercise selection dropdowns, PR tracking, substitution suggestions
- **Macrocycle Progression** — Proper exercises per periodization phase

---

## Implementation Notes

### For Developers
1. **Exercise Table:** Use provided schema, seed with 49 base exercises
2. **Complexity/CNS Updates:** Run `seed-adaptation.js` to populate complexity scores
3. **Substitutions:** Automatically seeded from SUBSTITUTION_CHAINS list
4. **1RM Requirements:** Check `requires1rm` flag when creating session
5. **Frontend Dropdowns:** Filter by `category` or `movementType`

### For Coaches
- Understand that **high complexity + high CNS = first to get adapted**
- Simple exercises (Pendlay Row, Strict Press) are safe when readiness is low
- **Substitution chains are pre-calculated** — system suggests automatically
- Coach can override any adaptation with 1-tap approval

### For Athletes
- Some exercises are **competition lifts** (Snatch, CJ, FS, BS) — track PRs
- Others are **variants** — used for development, technique, or adaptation
- When readiness is low, system suggests simpler variants automatically
- Can still track weights/reps for all exercises in training log

---

## Statistics

- **Total Exercises:** 49
- **Competition Lifts:** 5 (Snatch, Power Snatch, Hang Snatch, Hang Power Snatch, Block Snatch, Clean & Jerk, Power Clean, Hang Clean, Hang Power Clean, Block Clean, Front Squat, Back Squat) — actually 12 main ones that require 1RM
- **Substitution Chains:** 48 total
- **Risk Scoring Considerations:** Complexity (60% weight), CNS Demand (40% weight) when determining degradation
- **Complexity Range:** 1-10 (mean ~4.5)
- **CNS Demand Range:** 1-10 (mean ~4.8)

---

## Next Steps

1. **Seed exercises** in production database
2. **Populate complexity/CNS** via seed-adaptation.js
3. **Validate substitution chains** in session adaptation tests
4. **Build frontend dropdowns** with exercise selection by category
5. **Implement 1RM tracking** for required exercises
6. **Test adaptation logic** with complex + high CNS exercises

---

**Generated:** 2026-04-10  
**Source:** Extracted from `backend/prisma/seed.js` + `seed-adaptation.js`  
**Version:** 1.0 (Complete Exercise Database)  
**Status:** Ready for implementation
