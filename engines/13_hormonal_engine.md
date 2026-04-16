# 13. Hormonal Periodization Engine — Menstrual Cycle Support

**Purpose:** Adapt training for female athletes across 4 menstrual cycle phases to optimize performance and recovery

**Status:** Optional feature, integrates with session adaptation  
**Update Frequency:** Manual cycle tracking (athlete inputs)  
**Performance:** O(1) phase determination + recommendations

---

## Overview

Female athletes experience 4 distinct hormonal phases during their ~28-day menstrual cycle. Each phase has different strength capacity, recovery needs, and training recommendations.

**Key Concept:**
```
Estrogen & Progesterone fluctuation throughout cycle
→ Affects muscle protein synthesis, inflammation, CNS recovery
→ Different phases = different optimal training stimuli
```

---

## 4 Cycle Phases

### Phase 1: Menstruation (Days 1-5)

**Hormones:** Low estrogen, low progesterone  
**Duration:** ~5 days

**Characteristics:**
- Lowest energy levels
- Highest fatigue
- Elevated inflammation
- Increased recovery needs
- Lower strength capacity

**Training Recommendations:**
```json
{
  "phase": "menstruation",
  "intensity_adjustment": -10,      // 10% lower intensity
  "volume_adjustment": -15,         // 15% lower volume
  "focus": "recovery_and_technique",
  "movement_types": ["mobility", "technique_work", "low_intensity_conditioning"],
  "intensity_examples": [
    "Light Snatch 3×2 @ 60%",
    "Clean Grip RDL 4×5 @ 70%",
    "Mobility work + meditation"
  ],
  "rest_recommendation": "1-2 extra rest days if available",
  "load_adjustment": 0.85,          // 85% of normal loading
  "xp_modifier": 0.9                // 90% of normal XP
}
```

**Coach Notes:** This is "active recovery" week, not deload. Still train, just easier.

---

### Phase 2: Follicular (Days 6-14)

**Hormones:** Rising estrogen  
**Duration:** ~9 days

**Characteristics:**
- Energy rising
- Strength improving
- Good recovery
- Optimal window for heavy training
- Low injury risk
- Excellent adaptation window

**Training Recommendations:**
```json
{
  "phase": "follicular",
  "intensity_adjustment": 5,        // 5% higher intensity okay
  "volume_adjustment": 0,           // Maintain volume
  "focus": "strength_and_power",
  "movement_types": ["heavy_squats", "competition_lifts", "high_intensity"],
  "intensity_examples": [
    "Snatch 3×2 @ 90%+",
    "Back Squat 3×3 @ 85%+",
    "Hard conditioning - EMOM"
  ],
  "rest_recommendation": "Standard rest days (can do 6 days/week)",
  "load_adjustment": 1.05,          // 105% of normal loading
  "xp_modifier": 1.0                // Standard XP
}
```

**Coach Notes:** Best time to test maxes or increase load. Use this phase strategically.

---

### Phase 3: Ovulation (Days 15-17)

**Hormones:** Peak estrogen, slight rise in progesterone  
**Duration:** ~3 days

**Characteristics:**
- Peak strength window
- Peak cognitive function
- Peak motivation
- Highest competition readiness
- Risk: can overdo it

**Training Recommendations:**
```json
{
  "phase": "ovulation",
  "intensity_adjustment": 10,       // 10% higher intensity is okay
  "volume_adjustment": 5,           // Slight volume increase okay
  "focus": "peak_performance",
  "movement_types": ["max_effort", "competition_simulation", "records"],
  "intensity_examples": [
    "Snatch singles @ 95%+",
    "Clean & Jerk max attempts",
    "Max test day opportunity"
  ],
  "rest_recommendation": "Can handle high frequency and intensity",
  "load_adjustment": 1.10,          // 110% of normal loading safe
  "xp_modifier": 1.1                // 110% XP bonus for peak phase training
}
```

**Coach Notes:** Window for PRs, 1RM tests, competition. Plan important sessions here.

---

### Phase 4: Luteal (Days 18-28)

**Hormones:** Rising progesterone, falling estrogen (late luteal: both drop)  
**Duration:** ~11 days

**Characteristics:**
- Energy declining
- Recovery slower
- Appetite increased
- Risk of injury increases (ligaments more lax)
- Mood can be volatile
- Needs more nutrition + sleep

**Training Recommendations:**
```json
{
  "phase": "luteal",
  "intensity_adjustment": -5,       // 5% lower intensity
  "volume_adjustment": -10,         // 10% lower volume
  "focus": "maintenance_and_stability",
  "movement_types": ["moderate_intensity", "stability_work", "consistency"],
  "intensity_examples": [
    "Snatch 3×3 @ 80%",
    "Front Squat 4×5 @ 75%",
    "Strength endurance work"
  ],
  "rest_recommendation": "At least 1-2 rest days, prioritize sleep",
  "load_adjustment": 0.90,          // 90% of normal loading
  "xp_modifier": 0.95               // 95% of normal XP
}
```

**Coach Notes:** Higher nutrition needs. Hormonal mood swings are normal. Recovery focused.

---

## Algorithm

### Step 1: Determine Cycle Phase

```javascript
function determineCyclePhase(cycleStartDate, currentDate) {
  const dayOfCycle = Math.floor((currentDate - cycleStartDate) / (24 * 60 * 60 * 1000)) % 28;
  
  if (dayOfCycle <= 5) return "menstruation";
  if (dayOfCycle <= 14) return "follicular";
  if (dayOfCycle <= 17) return "ovulation";
  return "luteal";
}
```

### Step 2: Get Phase Recommendations

```javascript
function getPhaseRecommendations(phase) {
  const recommendations = {
    menstruation: { intensity: -10, volume: -15, focus: "recovery" },
    follicular: { intensity: 5, volume: 0, focus: "strength" },
    ovulation: { intensity: 10, volume: 5, focus: "peak_performance" },
    luteal: { intensity: -5, volume: -10, focus: "maintenance" }
  };
  
  return recommendations[phase];
}
```

### Step 3: Modify Session Plan

```javascript
async function generateHormonalAdjustments(athleteId, sessionId) {
  const athlete = await prisma.athlete.findUnique({ where: { id: athleteId } });
  const phase = determineCyclePhase(athlete.cycleStartDate, new Date());
  const recommendations = getPhaseRecommendations(phase);
  
  const session = await prisma.macrocycleSession.findUnique({ where: { id: sessionId } });
  
  // Apply adjustments to session
  const adjustedSession = {
    ...session,
    phase,
    recommended_intensity_mod: recommendations.intensity,
    recommended_volume_mod: recommendations.volume,
    recommended_focus: recommendations.focus,
    note: `${phase.toUpperCase()} phase: ${recommendations.focus}`
  };
  
  return adjustedSession;
}
```

---

## Cycle Tracking Interface

### Athlete Logs Cycle Status

```json
{
  "athlete_id": "uuid",
  "cycle_tracking": {
    "cycle_start_date": "2026-03-20",
    "cycle_length": 28,
    "cycle_phase": "follicular",
    "day_of_cycle": 8,
    "next_period_estimated": "2026-04-17",
    "symptoms": ["energy_up", "motivation_high"],
    "flow": "light"  // light|moderate|heavy (optional)
  }
}
```

**Manual Entry:** Takes 30 seconds, done via app

**Optional Integration:** 
- Flo app API (period tracking)
- Apple Health (if available)
- Oura Ring (can estimate based on HR/HRV patterns)

---

## Coach Dashboard

### Hormonal Phase Overview

```
HORMONAL PERIODIZATION — Team View
════════════════════════════════════════════════

Maria (follicular phase - Day 8)
  → Peak window: Strong, good for heavy training ✅
  → Next 6 days: Optimal for PR attempts
  → Recommendation: Test max Snatch, Back Squat
  
Kristina (menstruation phase - Day 2)
  → Recovery phase: Light training recommended ⚠️
  → Next 4 days: Easy sessions, mobility focus
  → Recommendation: Take 1-2 rest days, hydrate
  
Helena (luteal phase - Day 20)
  → Maintenance phase: Moderate intensity ⚠️
  → Next 8 days: Consistent training, extra recovery
  → Recommendation: Increase sleep target, nutrition focus
```

---

## Notifications

### Smart Alerts

```
IF phase === "ovulation" AND athlete_ready_for_max:
  → "You're in peak hormonal phase! Good day for PR attempts."

IF phase === "menstruation" AND session_is_very_hard:
  → "You're in recovery phase. Consider easier session today."

IF phase === "luteal" AND sleep_low:
  → "Luteal phase + low sleep = injury risk. Extra rest recommended."
```

---

## Data Storage

```sql
CREATE TABLE "CycleTracking" (
  "id" UUID PRIMARY KEY,
  "athleteId" UUID UNIQUE,
  "cycleStartDate" DATE,
  "cycleLengthDays" INT,        -- typically 28, range 21-35
  "isTrackingEnabled" BOOLEAN,
  "optionalIntegration" VARCHAR, -- "flo_app", "apple_health", "oura", "manual"
  "updatedAt" TIMESTAMP
);

CREATE TABLE "CycleLogEntry" (
  "id" UUID PRIMARY KEY,
  "athleteId" UUID,
  "logDate" DATE,
  "dayOfCycle" INT,
  "phase" VARCHAR,              -- "menstruation"|"follicular"|"ovulation"|"luteal"
  "symptoms" JSON,              -- ["energy_up", "fatigue", "mood_swing"]
  "flowIntensity" VARCHAR,      -- "light"|"moderate"|"heavy"|null
  "notes" TEXT,
  "loggedAt" TIMESTAMP
);
```

---

## Scientific Basis

**Research:**
- Estrogen peaks in follicular + ovulation → strength higher
- Progesterone peaks in luteal → slower recovery, higher injury risk
- CNS recovery slower in luteal phase
- Inflammation markers highest during menstruation

**Conservative Approach:**
- Recommendations are guideline, not mandate
- Individual variation is huge (some athletes don't notice phases)
- Athlete should always have final say
- Coach should normalize conversation about cycle

---

## Integration Points

**Feeds Into:**
- **Session Adaptation Engine** → Phase recommendations modify risk thresholds
- **Smart Coach** → Hormonal phase alerts
- **Notifications** → Phase-appropriate coaching cues

**Receives From:**
- **Athlete Cycle Logs** → Manual or integrated tracking
- **Athlete Profile** → Cycle start date

---

## Important Notes

- **Privacy:** Cycle data never shared with other athletes
- **Opt-in:** Female athletes can enable/disable cycle tracking anytime
- **Not Required:** System works fine without it, but provides insights for those who want it
- **Cultural Sensitivity:** Normalize period training discussion
- **Individuality:** Some athletes don't experience phases; recommendations are optional

---

## Testing Checklist

- [ ] Phase determination logic (day of cycle → phase)
- [ ] Intensity/volume adjustments apply correctly
- [ ] Cycle tracking UI is simple and private
- [ ] Notifications trigger only when enabled
- [ ] Coach dashboard shows phase overview
- [ ] No data exposed to other athletes
- [ ] Phase recommendations appear in session notes
- [ ] Cycle start date can be updated

---

**Generated:** 2026-04-10  
**Source:** Extracted from hormonal_periodization_engine.js  
**Integration Status:** ✅ Complete (optional, no enforcement)
