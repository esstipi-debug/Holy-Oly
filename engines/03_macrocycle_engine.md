# 03. Macrocycle Engine

**Core Module:** `backend/src/services/macrocycle_service.js`  
**Data Source:** `/archive/escuelas con macrociclos/` (1,236 canonical sessions)  
**Database Tables:** `macrocycle`, `macrocycleWeek`, `macrocycleSession`, `macrocycleSessionExercise`  
**Trigger:** Coach assigns macrocycle to athlete  

---

## Purpose

The **Macrocycle Engine** manages 23 standardized training programs from 9 weightlifting schools worldwide. It provides a **pre-validated, research-backed foundation** for athlete training, eliminating the need for coaches to program from scratch.

**Key Features:**
- **1,236 canonical sessions** from 9 Olympic schools
- **4-20 week programs** covering all training phases
- **Progressive periodization** (hypertrophy → strength → peaking)
- **Automatic session generation** with exercise ordering, loads, reps

---

## The 23 Macrocycles

### By School & Focus

**Bulgarian School (3 cycles):**
1. **High Frequency Pure Oly** (8 weeks) — Daily singles, daily maxes
2. **Bulgarian Heavy** (12 weeks) — Extreme frequency + loads
3. **Bulgarian Strength Block** (6 weeks) — Lower frequency, higher intensity

**Russian School (4 cycles):**
4. **Russian Classic Periodization** (12 weeks) — Hypertrophy → Strength → Power
5. **Russian Strength-Speed Block** (8 weeks) — Speed under load
6. **Russian Heavy Chains** (10 weeks) — Wave loading with chains/bands
7. **Russian Competition Prep** (4 weeks) — Peaking taper

**Chinese School (3 cycles):**
8. **Chinese Extensive** (16 weeks) — High volume, moderate intensity
9. **Chinese Competition Phase** (6 weeks) — Peaking focus
10. **Chinese Youth Development** (12 weeks) — Foundation building

**American School (2 cycles):**
11. **American Hybrid Complex** (10 weeks) — Oly + strength + CrossFit transfer
12. **American Strength Bias** (8 weeks) — Heavy squats + pulls

**Iranian School (2 cycles):**
13. **Iranian High Volume** (14 weeks) — ~20+ exercises per session
14. **Iranian Competition Block** (5 weeks) — 72h taper to peak

**European School (3 cycles):**
15. **European Technical Focus** (10 weeks) — Technique refinement
16. **European Periodized Waves** (12 weeks) — 3-week waves, undulating
17. **European Endurance-Strength Hybrid** (9 weeks) — WL + conditioning

**Japanese School (2 cycles):**
18. **Japanese Precision OLY** (10 weeks) — Position work + technical fidelity
19. **Japanese Strength Endurance** (12 weeks) — High reps (5-6) at 85%+

**Ukrainian School (2 cycles):**
20. **Ukrainian Extreme Frequency** (6 weeks) — 10+ sessions/week
21. **Ukrainian Strength Block** (8 weeks) — 3×/week with heavy squats

**Turkish School (2 cycles):**
22. **Turkish Volume Progression** (14 weeks) — Slow volume increase
23. **Turkish Speed-Strength** (7 weeks) — Explosive + technical

---

## Macrocycle Structure

### Timeline Example: Russian Classic Periodization (12 weeks)

```
Week 1-4:   HYPERTROPHY BLOCK
            Sessions: 5-6/week
            Rep Range: 5-8 @ 70-78%
            Focus: Volume, muscle damage, GH response
            Example: 5×5 Back Squat @ 75%, 4×6 Clean + 3×8 Jerk Dip

Week 5-8:   STRENGTH BLOCK
            Sessions: 4-5/week
            Rep Range: 2-4 @ 85-92%
            Focus: CNS adaptation, peak strength
            Example: 3×2 Snatch @ 90%, 3×3 Clean @ 85%

Week 9-11:  POWER/PEAKING BLOCK
            Sessions: 4/week
            Rep Range: 1-3 @ 90-95%+
            Focus: Competition simulation, tapering volume
            Example: 2×1 Snatch @ 95%, 2×1 Clean @ 92%

Week 12:    COMPETITION / REST
            Sessions: 1-2 (very light)
            Focus: Recovery, mental preparation
            Example: 2×2 Technique @ 60%, 3×3 Snatch Balance @ 70%
```

---

## Session Components

Each **MacrocycleSession** contains:

```javascript
{
  id: "session-uuid",
  macrocycleId: "macro-uuid",
  week: 2,
  dayOfWeek: "Monday",
  sessionOrder: 1,
  sessionTheme: "Snatch Focus + Squat",
  estimatedDuration: 90,        // minutes
  
  exercises: [
    {
      exerciseId: "snatch-uuid",
      name: "Snatch",
      sets: 5,
      reps: 3,
      intensity: "80%",          // of 1RM
      rpe: 8,
      notes: "Perfect technique focus",
      complexity: 9,
      cnsDemand: 10,
      position: "Competition",
      substitutableWith: ["Power Snatch", "Snatch Balance"],
      estimatedLoad: 3500        // in "load units"
    },
    {
      exerciseId: "bs-uuid",
      name: "Back Squat",
      sets: 4,
      reps: 5,
      intensity: "78%",
      rpe: 7.5,
      notes: "Controlled tempo, 2sec descent",
      complexity: 6,
      cnsDemand: 7,
      position: "Competition",
      estimatedLoad: 2100
    },
    // ... more exercises
  ]
}
```

---

## Exercise Attributes

| Attribute | Purpose | Example |
|-----------|---------|---------|
| **exerciseId** | Database reference | uuid |
| **name** | Display name | "Snatch", "Back Squat" |
| **sets** | Planned volume | 5 |
| **reps** | Reps per set | 3 |
| **intensity** | % of 1RM | "80%", "85%", "90%" |
| **rpe** | Rate of Perceived Exertion | 7-9 |
| **position** | Training position | "Competition", "Power", "Hang", "From blocks" |
| **complexity** | Technical difficulty (1-10) | 9=Snatch, 6=Squat, 3=Leg Press |
| **cnsDemand** | CNS stress (1-10) | 10=Snatch, 5=Squat, 2=Belt Squat |
| **substitutableWith** | Safer alternatives | ["Power Snatch", "Snatch Balance"] |
| **notes** | Coaching cues | "Tempo: 2s descent", "Perfect position focus" |
| **estimatedLoad** | Training load estimate | ~2500 load units |

---

## How Assignment Works

### Step 1: Coach Selects Macrocycle

```
Coach: "I want to assign Russian Classic Periodization to this athlete"

System checks:
  - Athlete age/gender ✓
  - Current fitness level ✓
  - Previous training phase ✓
  - Competition date ✓
→ Suggests optimal start week (e.g., "Week 1" for fresh athlete)
```

### Step 2: System Generates Athlete-Specific Sessions

```
For each MacrocycleSession in the template:
  1. Load exercise template
  2. Calculate %1RM from athlete's current maxes
     (If athlete Snatch 1RM = 100kg, and session is 80% → 80kg)
  3. Estimate load using Stress Engine
  4. Create athlete's CompletedSession record (pre-populated, pending)
  5. Generate notifications (athlete gets "New program assigned")
```

### Step 3: Athlete Executes Sessions

```
Athlete sees:
  [Session 1: Snatch Focus + Squat]
  Monday, Jan 15

  Snatch 5×3 @ 80kg (80% of your 1RM)
  Back Squat 4×5 @ 78kg
  ... [more exercises]

Athlete completes (logs RPE, actual weight, comments)
→ Feeds into Stress Engine for readiness calc
```

### Step 4: Progression to Next Week

```
Cron Job (weekly, Monday 00:00):
  1. Check if athlete completed ≥80% of previous week's sessions
  2. If YES → Unlock next week automatically
  3. If NO → Warn coach "Compliance low, advance anyway?"
  4. Generate new week's sessions with updated %1RM
```

---

## Integration Points

### Uses Data From:
- **Athlete Profile** — Current 1RM maxes (snatch, clean, jerk, squat)
- **Body Weight** — For ratio calculations
- **Age/Gender** — For periodization recommendations
- **Competition Date** — For peaking phase timing

### Feeds Data To:
- **Session Adaptation Engine** — Exercise complexity for risk scoring
- **Balance Engine** — Session ratios (FS/BS, Sn/CJ)
- **Gamification Engine** — Planned load for XP estimation
- **Smart Coach Engine** — Periodization phase for alert generation
- **Frontend** — Session display on athlete dashboard

---

## Example: Assigning Russian Classic to 90kg Male Athlete

```
Athlete Profile:
  Name: Ivan
  Age: 28
  BW: 95kg
  1RM Snatch: 120kg
  1RM Clean: 145kg
  1RM Back Squat: 200kg
  Competition: 8 weeks away

Coach Action: Assign "Russian Classic Periodization (12 weeks)"

System Calculates:
  Week 1 Snatch Target: 120kg × 0.70 = 84kg (70% for hypertrophy)
  Week 1 BS Target: 200kg × 0.75 = 150kg
  ... continue for all exercises

Generated Week 1 Sessions:
  Monday: Snatch Focus
    - Snatch 5×5 @ 84kg (70%)
    - Clean 4×4 @ 100kg (69%)
    - Back Squat 5×6 @ 120kg (60%)
    - Snatch Pull 3×5 @ 110kg
  
  Wednesday: Clean Focus
    - Clean 5×5 @ 100kg (69%)
    - Jerk 4×4 @ 110kg (76%)
    - Front Squat 4×5 @ 140kg (70%)
    - Push Press 3×5 @ 100kg

  Friday: Heavy Squat
    - Back Squat 4×4 @ 160kg (80%)
    - Snatch Pull 3×3 @ 125kg
    - Jerk Drive 3×4 @ 120kg
    - Core Work

Ivan receives notification:
  "New macrocycle assigned: Russian Classic Periodization
   Starting Monday — 12 weeks to competition
   [View Program] [Questions?]"
```

---

## Data Storage

### Database Schema

```sql
CREATE TABLE "macrocycle" (
  "id" UUID PRIMARY KEY,
  "name" VARCHAR NOT NULL,      -- "Russian Classic"
  "school" VARCHAR,             -- "Russian", "Bulgarian", etc.
  "duration_weeks" INT,         -- 12
  "focus_type" VARCHAR,         -- "Strength", "Hypertrophy", "Peaking"
  "difficulty_level" INT,       -- 1-5 (1=novice, 5=elite)
  "description" TEXT
);

CREATE TABLE "macrocycleWeek" (
  "id" UUID PRIMARY KEY,
  "macrocycleId" UUID,
  "week_number" INT,
  "theme" VARCHAR,              -- "Hypertrophy Block", etc.
  "sessions_per_week" INT,      -- 5-6
  "intensity_target" VARCHAR,   -- "70-78%", "85-92%", etc.
  "volume_estimate" INT         -- ~8000 load units
);

CREATE TABLE "macrocycleSession" (
  "id" UUID PRIMARY KEY,
  "macrocycleWeekId" UUID,
  "dayOfWeek" VARCHAR,
  "sessionTheme" VARCHAR,
  "estimatedDuration" INT,      -- minutes
  "sessionOrder" INT
);

CREATE TABLE "macrocycleSessionExercise" (
  "id" UUID PRIMARY KEY,
  "macrocycleSessionId" UUID,
  "exerciseId" UUID,
  "sets" INT,
  "reps" INT,
  "intensity" VARCHAR,          -- "80%"
  "rpe" DECIMAL,
  "notes" TEXT,
  "exerciseOrder" INT
);

CREATE TABLE "athleteMacrocycle" (
  "id" UUID PRIMARY KEY,
  "athleteId" UUID,
  "macrocycleId" UUID,
  "assignedDate" TIMESTAMPTZ,
  "startDate" TIMESTAMPTZ,
  "endDate" TIMESTAMPTZ,
  "currentWeek" INT,
  "status" VARCHAR             -- "active", "completed", "paused"
);
```

---

## Performance Optimization

**Initial Load (Assign Macrocycle):**
- Fetch template: ~20ms
- Generate 60-80 sessions: ~500ms
- Bulk insert: ~100ms
- **Total: ~620ms**

**Weekly Progression:**
- Check compliance: ~50ms
- Generate next week (8-10 sessions): ~100ms
- Bulk insert: ~50ms
- **Total: ~200ms** (efficient cron job)

**Display Session:**
- Query + exercise details: ~50ms (with indexes)

---

## Validation Rules

1. **Intensity Progression** — Each week should slightly increase or maintain intensity (not regress without reason)
2. **Session Balance** — Each week should have ≥1 snatch day, ≥1 clean day, ≥1 squat focus
3. **Exercise Variety** — Don't repeat exact same session twice in 3 weeks
4. **CNS Load** — Total complexity-weighted load per week should not exceed threshold
5. **Rest Days** — Minimum 1 rest day per 3-4 training days

---

## Example Workflow

```
Timeline:

Week 0: Coach selects "Russian Classic Periodization"
  → System generates Weeks 1-4 (Month 1)

Week 1: Athlete trains sessions
  → Logs data, gets readiness updates

Week 2: Cron checks compliance
  → "Ivan: 5/5 sessions completed. Week 2 unlocked."
  → System generates Week 5 (Strength Block)

Week 4: End of Hypertrophy Block
  → Intensity increases for Week 5

...continue through Week 12

Week 12: Competition Day
  → Macrocycle marked "completed"
  → Coach can assign next 12-week cycle
```

---

## Key Insights

1. **Pre-validated programs** — No need to design from scratch; research-backed
2. **Scalable to unlimited athletes** — One coach manages 50+ athletes, all progressing automatically
3. **Athlete-specific loads** — Templates auto-adjust to each athlete's 1RMs
4. **Transparent periodization** — Athlete sees "Hypertrophy Block → Strength Block → Peaking"
5. **Flexible reassignment** — Coach can swap to different macrocycle at any week

---

## Testing & Validation

**Unit Test Location:** `backend/__tests__/macrocycle_engine.test.js`

**Test Cases:**
1. Macrocycle fetch from canonical data
2. Session generation with athlete 1RMs
3. Intensity progression (no regressions)
4. Exercise balance validation
5. Cron-based week progression

---

**Next:** See [04_gamification_engine.md](./04_gamification_engine.md) for how sessions feed into reward systems.
