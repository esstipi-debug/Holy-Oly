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
Training Load = Sets × Reps × Weight (kg) × RPE Factor × Intensity_Multiplier × Sport_Bias
```

**Intensity Multiplier (Neural Tax):**
- `< 70% 1RM` = 1.0 (Metabolic/Hypertrophy zone)
- `70% - 85% 1RM` = 1.2 (Strength zone)
- `85% - 95% 1RM` = 1.5 (High CNS tax)
- `> 95% 1RM` = 2.0 (Maximum Neural Drive)

**Sport Bias Multiplier (RAG Engine Interop):**
- **Halterofilia:** x1.0 para fuerza cruda, pero volumen puro de reps >8 (poco común) se reduce a x0.8.
- **CrossFit / Hyrox:** x1.2 para zonas de alta frecuencia cardíaca o DOMS metabólico prolongado.

**RPE Factor Table (1-10 scale):**
| RPE | Factor | RPE | Factor |
|-----|--------|-----|--------|
| 10  | 1.00   | 5   | 0.75   |
| 9.5 | 0.975  | 5.5 | 0.775  |
| 9   | 0.95   | 6   | 0.80   |
| 8.5 | 0.925  | 6.5 | 0.825  |

**Example:**
```
Exercise: Snatch (Halterofilia)
  Sets: 5
  Reps: 3
  Weight: 100kg (88% 1RM)
  RPE: 8.5

Load = 5 × 3 × 100 × 0.925 (RPE) × 1.5 (Int_M) × 1.0 (Sport_B) = 2,081.25
```

**Session Total:** Sum of all exercise loads

---

### 2. Fatigue Score (Short-Term Exponential Moving Average)

**Formula:**
```
Fatigue_today = α × Load_today + (1-α) × Fatigue_yesterday

where α (alpha) = 2 / (Fatigue_Window + 1)
```

**Age-Adjusted Fatigue Window (Amortization):**
The speed at which an athlete clears fatigue decreases with age.
- `Age < 25`: Window = 5 Days (α = 0.33)
- `Age 25-35`: Window = 7 Days (α = 0.25) [BASELINE]
- `Age 35-45`: Window = 9 Days (α = 0.20)
- `Age 45+`: Window = 11 Days (α = 0.16)

---

### 3. Fitness Score (Long-Term Exponential Moving Average)

**Formula:**
```
Fitness_today = β × Load_today + (1-β) × Fitness_yesterday

where β (beta) = 2 / (Fitness_Window + 1)
```

**Age-Adjusted Fitness Window:**
- `Age < 25`: Window = 21 Days (β = 0.090)
- `Age 25-35`: Window = 28 Days (β = 0.069) [BASELINE]
- `Age 35-45`: Window = 35 Days (β = 0.055)
- `Age 45+`: Window = 42 Days (β = 0.046)

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

## 8. CNS Score (Nervous System Load) — Extension

**Purpose:** Dedicated 0-100 score measuring central nervous system state, distinct from general Readiness. Captures autonomic fatigue that Banister alone misses (HRV, resting HR, grip, bar velocity, subjective load).

**Why separate:** Banister tracks training load stress. CNS tracks recovery capacity of the nervous system — a lifter can be "fit" (high fitness score) yet CNS-drained (low HRV, elevated RHR) and should not attempt max lifts.

### Inputs (4 signals)

| Signal | Source | Weight |
|---|---|---|
| HRV (rMSSD) | Wearable auto / manual entry | 30% |
| Sleep (hours × quality) | Wearable / self-report | 25% |
| Resting HR (morning) | Wearable / manual | 20% |
| Subjective (soreness + motivation + life stress, 1–10 each) | Self-report | 25% |

Each signal normalized 0-100 against athlete's rolling 14-day baseline (personal, not population).

### Formula

```
cnsScore = 0.30*hrvNorm + 0.25*sleepNorm + 0.20*rhrNorm + 0.25*subjectiveNorm
```

Where:
- `hrvNorm`    = clamp(0, 100, 50 + (hrvToday - hrvBaseline14d) / hrvBaseline14d * 200)
- `sleepNorm`  = min(100, (hoursSlept / 8) * 100) * (qualityScore / 10)
- `rhrNorm`    = clamp(0, 100, 100 - (rhrToday - rhrBaseline14d) * 4)
- `subjectiveNorm` = ((11 - soreness) + motivation + (11 - lifeStress)) / 3 * 10

### Zones

| Score | Zone | Guidance |
|---|---|---|
| ≥75 | 🟢 Ready | PR attempts safe, 85-95% 1RM window open |
| 50-74 | 🟡 Moderate | Volume OK, cap intensity ≤80% 1RM |
| <50 | 🔴 Drained | Deload, mobility only, or full rest |

### Interaction with Readiness

- `readinessFinal` uses Banister + sleep + RPE + compliance (unchanged above).
- `cnsScore` is **independent** but **gates high-intensity decisions** in Session Adaptation Engine.
- Rule: if `readinessFinal ≥ 70` but `cnsScore < 50` → downgrade intensity cap to 75% 1RM regardless.

### Role Permissions

- Athlete: edits raw inputs (HRV manual, sleep hours, subjective 1-10, logs grip/velocity tests).
- Coach: views score + inputs, annotates (private notes), adjusts athlete's baseline window (14/28d), flags test as invalid. **Cannot edit raw biometric values.**
- System: calculates cnsScore. No manual override of final score.

### Sport-specific adaptation

- **Holy Oly (Weightlifting):** bar velocity @70% squat added as optional 5th signal (if sensor available), replacing 5% of HRV weight.
- **Volta (CrossFit):** grip strength weighted higher (gymnastics volume drains grip CNS fast).
- **Axon (Hyrox):** HR drift in Z2 test added as optional 5th signal (aerobic CNS).

### Output addition to `ReadinessCache`

```
cnsScore         Int       // 0-100
cnsZone          String    // 'ready' | 'moderate' | 'drained'
cnsSignals       Json      // { hrvNorm, sleepNorm, rhrNorm, subjectiveNorm }
cnsBaselineWindow Int      // days used for baseline (default 14)
```

---

**Next:** See [02_session_adaptation_engine.md](./02_session_adaptation_engine.md) for how readiness feeds into risk-based session modification.
