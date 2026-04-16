# 02. Session Adaptation Engine

**Core Module:** `backend/src/services/session_adaptation_engine.js`  
**Endpoint:** `POST /coaching/athlete/:athleteId/pre-check`  
**Trigger:** Athlete initiates pre-session check-in  

---

## Purpose

The **Session Adaptation Engine** protects athletes from injury by intelligently degrading sessions when they're not ready. It **never blocks** a session—it **suggests safer alternatives** that the coach can approve with one tap.

**Philosophy:** *"The system SUGGESTS, the coach APPROVES with 1 tap. The coach's job is NOT eliminated—it's accelerated."*

---

## How It Works

### 1. Risk Score Calculation

**Input Data (1-5 Scale):**
```javascript
{
  coordinationScore: 4,      // 1=terrible, 5=excellent
  fatigueLevel: 3,           // 1=fresh, 5=destroyed
  sorenessLevel: 2,          // 1=none, 5=severe
  mentalFocus: 3,            // 1=unfocused, 5=locked in
  sleepHours: 6.5            // numeric hours (null = unknown)
}
```

**Normalization to 0-100 "Risk" Scale:**
- **Coordination:** `risk = (5 - score) / 4 × 100`
  - Score 5 (excellent) → 0 risk
  - Score 1 (terrible) → 100 risk
- **Fatigue:** `risk = (level - 1) / 4 × 100`
  - Level 1 (fresh) → 0 risk
  - Level 5 (destroyed) → 100 risk
- **Soreness:** `risk = (level - 1) / 4 × 100`
  - Level 1 (none) → 0 risk
  - Level 5 (severe) → 100 risk
- **Mental Focus:** `risk = (5 - focus) / 4 × 100`
  - Focus 5 (locked) → 0 risk
  - Focus 1 (unfocused) → 100 risk
- **Sleep:** `risk = (8 - hours) / 4 × 100`
  - 8+ hours → 0 risk
  - 4 hours → 100 risk
  - Unknown (null) → 50 risk (assume moderate)

---

### 2. Risk Weighting

**Final Risk Score:**
```
RiskScore = Σ(individual_risk × weight)

Weights:
  Coordination: 30% (most important for WL safety)
  Fatigue:      25% (overall body stress)
  Sleep:        20% (CNS recovery)
  Soreness:     15% (muscular damage)
  Mental:       10% (focus/motivation)
```

**Example:**
```
coordinationScore = 4 → coordRisk = 25
fatigueLevel = 4 → fatigueRisk = 75
sorenessLevel = 2 → sorenessRisk = 25
mentalFocus = 3 → mentalRisk = 50
sleepHours = 6 → sleepRisk = 50

RiskScore = (25 × 0.30) + (75 × 0.25) + (50 × 0.20) + (25 × 0.15) + (50 × 0.10)
          = 7.5 + 18.75 + 10 + 3.75 + 5
          = 45 → YELLOW zone
```

---

### 3. Risk Zones

Once risk score is calculated, the system assigns a **risk zone** and **recommended action:**

| Zone | Range | Color | Recommended Action |
|------|-------|-------|-----------|
| **GREEN** | 0-25 | 🟢 | Execute session as planned |
| **YELLOW** | 26-50 | 🟡 | Reduce load or simplify variants |
| **ORANGE** | 51-75 | 🟠 | Substitute complex exercises + reduce volume |
| **RED** | 76-100 | 🔴 | Technique-only with light bar or rest |

---

### 4. Exercise Degradation Levels

For each exercise in the session, the engine determines a **degradation level** (0-3):

```javascript
degradationLevel(exerciseComplexity, exerciseCnsDemand, riskScore, riskZone)

where:
  exerciseComplexity: 1-10 (snatch=9, clean=8, back squat=6)
  exerciseCnsDemand: 1-10 (snatch=10, clean=9, squat=5)
  riskZone: green/yellow/orange/red
```

**Decision Logic:**

```
IF riskZone == 'green'
  → degradationLevel = 0 (no change)

IF riskZone == 'red'
  → IF exerciseComplexity ≥ 5
     → degradationLevel = 3 (heavy degradation)
  → ELSE
     → degradationLevel = 2 (moderate degradation)

IF riskZone == 'orange'
  → exerciseRisk = (complexity × 0.6 + cnsDemand × 0.4) / 10
  → IF exerciseRisk > 0.7
     → degradationLevel = 3
  → ELSE IF exerciseRisk > 0.4
     → degradationLevel = 2
  → ELSE
     → degradationLevel = 1

IF riskZone == 'yellow'
  → IF exerciseRisk > 0.7
     → degradationLevel = 2 (complex exercise + moderate risk)
  → ELSE IF exerciseRisk > 0.5
     → degradationLevel = 1
  → ELSE
     → degradationLevel = 0
```

---

### 5. Degradation Actions

**Degradation Level 0 (No Change):**
- Snatch 5×3 @ 90% → Execute as planned

**Degradation Level 1 (Mild - Reduce volume):**
- Snatch 5×3 @ 90% → Snatch 3×3 @ 90% (fewer sets)
- Or: Snatch 5×3 @ 90% → Snatch 5×2 @ 90% (fewer reps)

**Degradation Level 2 (Moderate - Reduce load):**
- Snatch 5×3 @ 90% → Snatch 3×3 @ 75% (fewer sets + lower intensity)
- Back Squat 4×5 @ 85% → Back Squat 3×3 @ 70%

**Degradation Level 3 (Heavy - Substitute or technique):**
- Snatch 5×3 @ 90% → Snatch technique 5×2 @ 40% (light bar only)
- **Or substitute** with safer movement:
  - Snatch → Power Snatch or Snatch Balance
  - Clean → Power Clean or Hang Clean
  - Complex barbell → Accessory work (leg press, bench press)

---

### 6. Substitution Chains

When degradation level 3 is needed, the engine looks up **substitution chains** in the database:

```javascript
// Substitution priority (safest to complex)
snatchChain = [
  "Snatch Balance",        // Safest, pure position
  "Power Snatch",          // Similar movement, less demand
  "Hang Snatch",           // Reduced range
  "Snatch Pull",           // No catch, pure power
  "Snatch Push Press",     // Shoulder-only variation
];

cleanChain = [
  "Power Clean",
  "Hang Clean",
  "Clean Pull",
  "Muscle Clean",
];

squatChain = [
  "Leg Press",
  "Belt Squat",
  "Smith Machine Squat",
];
```

---

## Input Data Structure

```javascript
{
  athleteId: "uuid",
  sessionId: "macrocycleSessionId",
  preCheckData: {
    coordinationScore: 4,
    fatigueLevel: 3,
    sorenessLevel: 2,
    mentalFocus: 3,
    sleepHours: 6.5
  }
}
```

---

## Output Data Structure

```javascript
{
  approved: true,                    // Coach can execute session
  modified: false,                   // No adaptations needed
  risk_score: 45,
  risk_zone: "yellow",
  
  breakdown: {
    coordination: { raw: 4, risk: 25 },
    fatigue: { raw: 3, risk: 75 },
    sleep: { raw: 6.5, risk: 50 },
    soreness: { raw: 2, risk: 25 },
    mental: { raw: 3, risk: 50 }
  },
  
  recommendation: "Reduce load or simplify variants",
  
  originalPlan: [
    { exercise: "Snatch", sets: 5, reps: 3, weight: "90%", complexity: 9 },
    { exercise: "Back Squat", sets: 4, reps: 5, weight: "85%", complexity: 6 }
  ],
  
  adaptedPlan: [
    { 
      exercise: "Snatch", 
      sets: 3, 
      reps: 3, 
      weight: "90%",
      degradation: 1,
      reasoning: "Yellow zone + high complexity → reduce volume"
    },
    {
      exercise: "Back Squat",
      sets: 3,
      reps: 5,
      weight: "85%",
      degradation: 1,
      reasoning: "Yellow zone + medium complexity → reduce volume"
    }
  ],
  
  warnings: [
    "Sleep was low (6.5h) — consider extra recovery day",
    "Fatigue elevated — monitor for overtraining"
  ]
}
```

---

## Integration Points

### Uses Data From:
- **Stress Engine** — Readiness level informs risk baseline
- **Pre-Check Form** — Athlete inputs (coordination, fatigue, soreness, mental, sleep)
- **Session Plan** — Exercise complexity, CNS demand
- **Macrocycle Definition** — Substitution chains per exercise

### Feeds Data To:
- **Session Recording** — Modified plan is logged as "prescribed"
- **Smart Coach Engine** — Alert if RED zone 3+ days
- **Gamification Engine** — Completion tracked (adapted vs. original)

---

## Example Workflow

### Scenario: Athlete in YELLOW Zone

```
Pre-Check Inputs:
  coordinationScore: 3 (struggling with position)
  fatigueLevel: 4 (tired)
  sorenessLevel: 3 (sore from yesterday)
  mentalFocus: 2 (unfocused, distracted)
  sleepHours: 6

Risk Calculation:
  coordRisk = (5-3)/4 × 100 = 50
  fatigueRisk = (4-1)/4 × 100 = 75
  sorenessRisk = (3-1)/4 × 100 = 50
  mentalRisk = (5-2)/4 × 100 = 75
  sleepRisk = (8-6)/4 × 100 = 50

  RiskScore = (50×0.30) + (75×0.25) + (50×0.20) + (50×0.15) + (75×0.10)
            = 15 + 18.75 + 10 + 7.5 + 7.5
            = 58.75 → ORANGE zone ⚠️

Adaptation:
  Original: Snatch 5×3 @ 90%, Back Squat 4×5 @ 85%
  
  Snatch (complexity=9, cnsDemand=10):
    exerciseRisk = (9×0.6 + 10×0.4) / 10 = 0.94 (very high)
    → degradationLevel = 3 (heavy)
    → SUBSTITUTE: "Snatch Balance 3×3 @ 60%"
  
  Back Squat (complexity=6, cnsDemand=5):
    exerciseRisk = (6×0.6 + 5×0.4) / 10 = 0.56 (moderate-high)
    → degradationLevel = 2 (moderate)
    → MODIFY: "Back Squat 3×3 @ 70%"

Recommendation:
  "Coordination and mental focus are compromised.
   Substitute complex movements with accessories.
   Still get quality work but reduce technical demand."

Coach Actions:
  [See Adapted Plan]  [Adjust Further]  [Accept]
```

---

### Scenario: Athlete in RED Zone

```
Pre-Check Inputs:
  coordinationScore: 1 (poor position awareness)
  fatigueLevel: 5 (destroyed)
  sorenessLevel: 4 (very sore)
  mentalFocus: 1 (can't focus)
  sleepHours: 4 (slept terribly)

Risk Score: 88 → RED zone 🔴

Recommendation:
  "Technique-only with light bar or rest.
   Your body is signaling overtraining.
   Consider a full rest day instead."

Options:
  [Technique Warmup Only]  [Full Rest Day]  [Custom Adaptation]
```

---

## Key Insights

1. **Coordination is critical** (30% weight) — Fatigued nervous system + heavy bar = injury risk
2. **Sleep > all** — Missing sleep affects everything: coordination, fatigue recovery, mental focus
3. **Degradation != Cancellation** — Even RED zone athletes get quality work (technique, accessories)
4. **Coach retains authority** — System suggests, coach makes final call
5. **Transparent reasoning** — Athlete sees breakdown of why session was adapted

---

## Performance Optimization

**Query Pattern:**
```sql
SELECT * FROM macrocycleSession
WHERE id = ?
INCLUDE exercises
INCLUDE exercise (for complexity + cnsDemand)
```

**Response Time:** ~50-100ms (with database indexes)

---

## Testing & Validation

**Unit Test Location:** `backend/__tests__/session_adaptation_engine.test.js`

**Test Cases:**
1. Risk score calculation for various inputs
2. Degradation level assignment (all 4 zones)
3. Substitution chain lookup
4. Session reconstruction with modified exercises
5. Edge cases (single exercise, rest day, etc.)

---

## Constants

```javascript
const RISK_WEIGHTS = {
  coordination: 0.30,
  fatigue: 0.25,
  sleep: 0.20,
  soreness: 0.15,
  mental: 0.10,
};

const RISK_ZONES = {
  GREEN: { min: 0, max: 25, action: "Execute as planned" },
  YELLOW: { min: 26, max: 50, action: "Reduce load or simplify" },
  ORANGE: { min: 51, max: 75, action: "Substitute + reduce volume" },
  RED: { min: 76, max: 100, action: "Technique-only or rest" },
};
```

---

## Dependencies

- **Stress Engine** — Readiness context (optional, for alert triggering)
- **Prisma ORM** — Fetch session + exercise definitions
- **PostgreSQL** — Store substitution chains, exercise complexity ratings

---

**Next:** See [03_macrocycle_engine.md](./03_macrocycle_engine.md) for how sessions are generated and assigned to athletes.
