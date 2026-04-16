# 01. Stress Engine (Readiness Calculator)

**Core Module:** `backend/src/services/stress_engine.js`  
**Related Service:** `backend/src/services/readiness_cache_service.js`  
**Cron Job:** Daily at 00:30 UTC  

---

## Purpose

The **Stress Engine** is the central nervous system of HolyOly. It calculates athlete readiness using the **Banister Fitness-Fatigue Model**, predicting when an athlete is prepared to train hard vs. when they need recovery.

**Key Outputs:**
- **Fitness Score** — Long-term training adaptation (28-day EMA)
- **Fatigue Score** — Short-term accumulated stress (7-day EMA)
- **Readiness** — Current readiness to train (Fitness - Fatigue)
- **Readiness Projection** — Next 4 weeks of predicted readiness

---

## How It Works

### 1. Training Load Calculation

**Formula:**
```
Training Load = Sets × Reps × Weight (kg) × RPE Factor
```

**RPE Factor Table (1-10 scale):**
| RPE | Factor | RPE | Factor |
|-----|--------|-----|--------|
| 10  | 1.00   | 5   | 0.75   |
| 9.5 | 0.975  | 5.5 | 0.775  |
| 9   | 0.95   | 6   | 0.80   |
| 8.5 | 0.925  | 6.5 | 0.825  |
| 8   | 0.90   | 7   | 0.85   |
| 7.5 | 0.875  | 7.5 | 0.875  |
| 7   | 0.85   | ...and so on|

**Example:**
```
Exercise: Snatch
  Sets: 5
  Reps: 3
  Weight: 100kg
  RPE: 8.5

Load = 5 × 3 × 100 × 0.925 = 1,387.5
```

**Session Total:** Sum of all exercise loads

---

### 2. Fatigue Score (7-Day Exponential Moving Average)

**Formula:**
```
Fatigue_today = α × Load_today + (1-α) × Fatigue_yesterday

where α (alpha) = 2 / (7 + 1) = 0.25
```

**Interpretation:**
- **Higher fatigue** = Accumulated stress from recent sessions
- **Decays slowly** — Takes ~28 days to fully recover from a single high-load session
- **Example:** If you hit 5,000 load today and rest tomorrow:
  - Day 1: Fatigue = 0.25 × 5000 + 0.75 × 0 = 1,250
  - Day 2: Fatigue = 0.25 × 0 + 0.75 × 1,250 = 938
  - Day 3: Fatigue = 0.25 × 0 + 0.75 × 938 = 704
  - ... continues decaying

---

### 3. Fitness Score (28-Day Exponential Moving Average)

**Formula:**
```
Fitness_today = β × Load_today + (1-β) × Fitness_yesterday

where β (beta) = 2 / (28 + 1) ≈ 0.069
```

**Interpretation:**
- **Higher fitness** = Long-term training adaptations and strength gains
- **Builds slowly** — Requires consistent ~4 weeks of training to see peak
- **Persists longer** — Doesn't decay as fast as fatigue (key to supercompensation)

---

### 4. Readiness (Base Calculation)

**Formula:**
```
Readiness_base = ((Fitness - Fatigue) / Fitness) × 100

Range: 0-100 (clamped)
```

**Interpretation:**
- **Readiness = 100** → Fully recovered, adapted, ready for hard session
- **Readiness = 50** → Neutral state (default if no data)
- **Readiness = 0** → Completely fatigued, overreached, needs immediate rest

---

### 5. Readiness Modifiers

After base readiness is calculated, the system applies **4 modifiers** to refine the score:

#### A. Sleep Modifier

**For Men:**
- \< 6 hours → **-10** readiness
- 6-7 hours → **-5** readiness
- ≥ 7 hours → **0** (no penalty)

**For Women:**
- \< 7 hours → **-10** readiness
- 7-8 hours → **-5** readiness
- ≥ 8 hours → **0** (no penalty)

**Rationale:** CNS recovery requires adequate sleep; women have slightly higher sleep needs.

---

#### B. RPE Divergence Modifier

**Condition:** If athlete reports RPE much higher than expected for the load

**Formula:**
```
RPE_divergence = RPE_real - RPE_expected
if divergence > 1.5 → -5 readiness
else → 0
```

**Example:**
- Planned session: 75% intensity (RPE ~7.5)
- Athlete reports: RPE 9.2
- Divergence: 9.2 - 7.5 = 1.7 (> 1.5) → Apply -5 penalty

**Interpretation:** Session felt harder than expected = nervous system isn't recovered

---

#### C. Compliance Modifier

**Based on:** Last 7 sessions (completed vs. planned)

**Formula:**
```
Compliance_rate = Completed / Planned × 100

if compliance < 50% → -7 readiness
if compliance < 70% → -3 readiness
else → 0
```

**Example:**
- Planned: 6 sessions / week
- Completed: 3 sessions
- Compliance: 50% → Apply -7 penalty

**Interpretation:** Skipping sessions = possible overtraining, illness, or life stress

---

#### D. Operating Mode Modifier

**Depends on athlete's configured operating mode:**

| Mode | Input | Adjustment |
|------|-------|-----------|
| **Zero Friction** | No input (estimated 100% compliance) | No penalty |
| **Semi** | RPE only | No additional penalty |
| **Pro** | Full data (sets, reps, weight, RPE) | Can apply RPE divergence |

---

### 6. Final Readiness Score

**Formula:**
```
Readiness_raw = Readiness_base + Sleep_mod + RPE_div_mod + Compliance_mod

Readiness_final = CLAMP(Readiness_raw, 0, 100)
```

---

### 7. Readiness Projection (4 Weeks)

The engine projects the next 4 weeks assuming:
- **Current sessions continue** at the same load
- **No additional stressors** appear
- **Linear fatigue decay**

**Output:** Array of projected readiness values for days 1-28

**Use Case:** Coach sees "readiness drops to 25 in 3 days" → can plan deload before athlete hits burnout

---

## Input Data Structure

```javascript
{
  fitness: 68.2,              // Current fitness EMA (28-day)
  fatigue: 45.3,              // Current fatigue EMA (7-day)
  sleepHours: 7.2,            // Last night's sleep (null if not logged)
  gender: 'M',                // 'M' or 'F'
  rpeReal: 8.5,               // Reported RPE (null if not logged)
  rpeExpected: 7.5,           // Estimated RPE from intensity%
  completedSessions: 5,       // Last 7 days completed
  plannedSessions: 6          // Last 7 days planned
}
```

---

## Output Data Structure

```javascript
{
  fitness: 68.2,
  fatigue: 45.3,
  readiness: 22.9,
  readiness_category: "Low",  // "Low" (<40), "Moderate" (40-60), "High" (>60)
  breakdown: {
    base: 22.9,               // Before modifiers
    sleep_mod: -5,            // Sleep modifier
    rpe_divergence_mod: 0,    // RPE divergence
    compliance_mod: 0         // Compliance
  },
  projection: [               // Next 28 days
    { date: "2026-04-11", readiness: 23.5 },
    { date: "2026-04-12", readiness: 24.1 },
    ...
  ]
}
```

---

## Constants & Calibration

```javascript
// Exponential Moving Average parameters
FATIGUE_ALPHA = 0.25      // 2 / (7 + 1) — 7-day decay
FITNESS_BETA = 0.069      // 2 / (28 + 1) — 28-day decay

// Defaults
DEFAULT_READINESS = 50    // Neutral when no historical data
BASELINE_DAYS = 28        // Time to reach full calibration
MAX_PROJECTION_WEEKS = 4  // How far to project readiness
```

---

## Integration Points

### Uses Data From:
- **Session Results** — Training load (sets, reps, weight, RPE)
- **Daily Metrics** — Sleep hours logged by athlete
- **Lifestyle Profile** — Daily stress, work hours (affects compliance)
- **Operating Mode** — How much data athlete provides

### Feeds Data To:
- **Readiness Cache Service** — Stores daily snapshot (fast lookups)
- **Session Adaptation Engine** — Risk score uses fitness/fatigue
- **Smart Coach Engine** — Alert triggers based on readiness trends
- **Píldoras Engine** — Daily tip selection based on readiness
- **Frontend Dashboard** — Real-time readiness gauge

---

## Cron Job Schedule

**Trigger:** Daily at 00:30 UTC  
**Function:** `recalculateDailyMetrics()` in `backend/src/services/cron.js`

**Process:**
1. For each athlete, fetch last 90 days of sessions
2. Recalculate fitness/fatigue/readiness for each day
3. Store results in `ReadinessCache` table
4. Generate readiness projections (next 28 days)
5. Log completion: `[Cron] Daily metrics: 450/500 athletes updated`

**Performance:** ~50ms per athlete on cached data

---

## Example Workflow

### Day 1: Heavy Session
```
Athlete completes:
  - 5×3 Snatch @ 100kg, RPE 8.5 → Load = 1,387.5
  - 3×2 Clean+Jerk @ 110kg, RPE 8.0 → Load = 528
  - 3×3 Back Squat @ 140kg, RPE 7.0 → Load = 882
  - Total Load = 2,797.5

Current State:
  Fitness = 60, Fatigue = 30
  Sleep = 8h, RPE_div = 0, Compliance = 100%

After Stress Engine:
  Fitness = 0.069 × 2797.5 + (1-0.069) × 60 = 192.8 + 55.9 = 248.7 (↑)
  Fatigue = 0.25 × 2797.5 + (1-0.25) × 30 = 699.4 + 22.5 = 721.9 (↑)
  Readiness_base = ((248.7 - 721.9) / 248.7) × 100 = -190 → CLAMP(0) = 0

  No modifiers (sleep OK, RPE matches, compliance good)
  
  Final Readiness = 0 → "Flatlined" (completely fatigued)
```

### Day 2: Rest
```
Load = 0

After Stress Engine:
  Fitness = 0.069 × 0 + 0.931 × 248.7 = 231.6 (slight decay)
  Fatigue = 0.25 × 0 + 0.75 × 721.9 = 541.4 (decays fast)
  Readiness_base = ((231.6 - 541.4) / 231.6) × 100 = -134 → CLAMP(0) = 0
  
  Final Readiness = 0 (still fatigued)
```

### Day 3: Rest + Good Sleep
```
Load = 0, Sleep = 9h (good recovery)

After Stress Engine:
  Fitness = 0.069 × 0 + 0.931 × 231.6 = 215.6
  Fatigue = 0.25 × 0 + 0.75 × 541.4 = 406.1
  Readiness_base = ((215.6 - 406.1) / 215.6) × 100 = -88 → CLAMP(0) = 0
  
  Sleep modifier = 0 (9h is good)
  
  Final Readiness = 0 (still recovering)
```

### Day 8: Readiness Returns
```
After 7 rest days, fatigue has decayed significantly

Fitness ≈ 215
Fatigue ≈ 50
Readiness_base = ((215 - 50) / 215) × 100 = 77

Sleep = 7.5h (slight dip)
Sleep_mod = -5

Final Readiness = 77 - 5 = 72 → "High" ✓ Ready to train hard
```

---

## Key Insights

1. **Fatigue decays fast** (7-day EMA) — A single hard session's fatigue recovers in ~3-4 days
2. **Fitness builds slow** (28-day EMA) — Peak adaptation takes ~4 weeks of consistent training
3. **Sleep is critical** — CNS recovery (sleep) can flip a session from "doable" to "too risky"
4. **Compliance matters** — Skipping sessions signals problem (illness, overtraining, life stress)
5. **Readiness is predictive** — Using projection, coach can avoid burnout 3-4 weeks in advance

---

## Performance Optimization

**Without Cache:**
- Recalculating for one athlete: ~500ms (O(90) recalculations)
- Dashboard loading for 100 athletes: ~50 seconds ❌

**With Readiness Cache (implemented):**
- Reading from cache: ~50ms (O(1) lookup)
- Dashboard loading for 100 athletes: ~5 seconds ✓

**Cron Pre-calculation (00:30 UTC):**
- Runs once daily, not on every request
- Stores results in PostgreSQL for instant retrieval
- Scales to 10,000+ athletes without performance impact

---

## Testing & Validation

**Unit Test Location:** `backend/__tests__/stress_engine.test.js`

**Test Cases:**
1. Training load calculation with various RPE values
2. EMA convergence over 90 days
3. Readiness bounds (0-100)
4. Modifier application (sleep, RPE, compliance)
5. Projection accuracy

---

## Dependencies

- **Prisma ORM** — Fetch session data from `completedSession` table
- **PostgreSQL** — Store `ReadinessCache` table (pre-calculated values)
- **Cron Service** — Scheduled recalculation daily

---

**Next:** See [02_session_adaptation_engine.md](./02_session_adaptation_engine.md) for how readiness feeds into risk-based session modification.
