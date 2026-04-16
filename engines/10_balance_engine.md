# 10. Balance Engine — Exercise Ratio Enforcement

**Purpose:** Maintain healthy exercise ratios (FS/BS, Snatch/Clean, Pull/Push) to prevent imbalances and injuries

**Status:** Integrated with session adaptation + macrocycle design  
**Update Frequency:** Per session (real-time validation)  
**Performance:** O(1) ratio calculation

---

## Overview

Olympic lifting creates natural imbalances (athletes train Snatch more than Clean, prioritize squats). Balance Engine ensures sustainable training by enforcing healthy ratios across macro-level programming.

**Three Critical Ratios:**
1. **FS/BS** (Front Squat / Back Squat) = 0.70–0.90
2. **Snatch/Clean** (Snatch volume / Clean volume) = 0.80–1.00
3. **Pull/Push** (Pulling movements / Pushing movements) = 1.00–1.20

---

## Target Ratios & Physiological Basis

### 1. FS/BS Ratio: 0.70–0.90

**Physiological Goal:** Maintain quad strength while protecting spinal loading

```
Front Squat = ~0.75–0.85 × Back Squat

Why?
• Back Squat is primary strength builder (full posterior chain)
• Front Squat complements with anterior quad emphasis
• Too much FS (ratio > 0.90) = quad dominance, spinal stress reduced (too easy)
• Too little FS (ratio < 0.70) = insufficient quad strength for C&J catches
```

**Example Target:**
```
Athlete BS 1RM: 200kg
Target FS: 150kg (ratio 0.75)

Volume over 4 weeks:
  BS: 12 reps @ 90%+ = ~10,800 kg total
  FS: 12 reps @ 85%+ = ~9,360 kg total
  Ratio: 0.87 ✅ (within 0.70-0.90 range)
```

---

### 2. Snatch/Clean Ratio: 0.80–1.00

**Physiological Goal:** Balance technical work (Snatch) with strength emphasis (Clean)

```
Snatch Volume ≈ 0.80–1.00 × Clean Volume

Why?
• Snatch = more technical, lower loading capacity (athletes lift ~80% of Clean PR)
• Clean = heavier loads, more strength building
• Balanced approach = technical + strength + safety
• Too much Snatch (ratio > 1.00) = technical fatigue, CNS tax
• Too little Snatch (ratio < 0.80) = insufficient competition prep
```

**Example Tracking:**
```
Month-long volume:
  Snatch variants total: 1,200 kg
  Clean variants total: 1,400 kg
  Ratio: 0.86 ✅ (within 0.80-1.00 range)

By family:
  Full Snatch 5×2 @ 90%: 900kg
  Hang Snatch 5×2 @ 85%: 300kg
  Total: 1,200 kg
```

---

### 3. Pull/Push Ratio: 1.00–1.20

**Physiological Goal:** Posterior chain health + shoulder stability

```
Pull Volume ≥ Push Volume (ideally 1.00–1.20)

Why?
• Overhead pressing can imbalance shoulders (internal rotation)
• Pulling movements (rows, chin-ups) counterbalance
• Ratio 1.00–1.20 maintains shoulder health + posture
• Too much pushing (ratio < 1.00) = impingement risk
• Excessive pulling (ratio > 1.20) = unnecessary
```

**Example:**
```
Weekly push movements:
  Press 5×3: 500kg
  Push Jerk 3×2: 450kg
  Dips 3×5: (bodyweight + weight)
  Total: ~1,000 kg

Weekly pull movements:
  Snatch Pull 6×2 @ 90%: 1,200kg
  Clean Pull 6×2 @ 90%: 1,200kg
  Rows 4×5: 400kg
  Total: ~2,800 kg

Ratio: 2.8 ⚠️ (TOO HIGH - reduce pulls or increase push)
```

---

## Balance Calculation Algorithm

### Step 1: Aggregate Exercise Volume

```javascript
function calculateRatios(athlete, timeframe = '4weeks') {
  const sessions = getSessionsInTimeframe(athlete, timeframe);
  
  // Initialize volume trackers
  let fs_volume = 0;      // Front Squat total kg
  let bs_volume = 0;      // Back Squat total kg
  let snatch_volume = 0;  // All Snatch variants
  let clean_volume = 0;   // All Clean variants
  let pull_volume = 0;    // Pull, deadlift, rows
  let push_volume = 0;    // Press, jerk, dips
  
  // Sum across all sessions
  for (const session of sessions) {
    for (const exercise of session.exercises) {
      const volume = exercise.sets × exercise.reps × exercise.weight_kg;
      
      if (exercise.is_front_squat) fs_volume += volume;
      if (exercise.is_back_squat) bs_volume += volume;
      if (exercise.category === 'snatch') snatch_volume += volume;
      if (exercise.category === 'clean') clean_volume += volume;
      if (exercise.movement_type === 'pull') pull_volume += volume;
      if (exercise.movement_type === 'push') push_volume += volume;
    }
  }
  
  return { fs_volume, bs_volume, snatch_volume, clean_volume, pull_volume, push_volume };
}
```

### Step 2: Calculate Ratios

```javascript
function getRatios(athlete, timeframe = '4weeks') {
  const volumes = calculateRatios(athlete, timeframe);
  
  return {
    fs_bs: bs_volume > 0 ? fs_volume / bs_volume : 0,      // 0.70-0.90
    snatch_clean: clean_volume > 0 ? snatch_volume / clean_volume : 0,  // 0.80-1.00
    pull_push: push_volume > 0 ? pull_volume / push_volume : 0  // 1.00-1.20
  };
}
```

### Step 3: Status Classification

```javascript
function classifyRatios(ratios) {
  return {
    fs_bs: {
      value: ratios.fs_bs,
      target: "0.70-0.90",
      status: ratios.fs_bs >= 0.70 && ratios.fs_bs <= 0.90 ? "✅ optimal" : "⚠️ needs adjustment",
      suggestion: ratios.fs_bs < 0.70 ? "↑ Add Front Squat volume" : "↓ Reduce Front Squat"
    },
    snatch_clean: {
      value: ratios.snatch_clean,
      target: "0.80-1.00",
      status: ratios.snatch_clean >= 0.80 && ratios.snatch_clean <= 1.00 ? "✅ optimal" : "⚠️ needs adjustment",
      suggestion: ratios.snatch_clean < 0.80 ? "↑ Add Snatch volume" : "↓ Reduce Snatch"
    },
    pull_push: {
      value: ratios.pull_push,
      target: "1.00-1.20",
      status: ratios.pull_push >= 1.00 && ratios.pull_push <= 1.20 ? "✅ optimal" : "⚠️ needs adjustment",
      suggestion: ratios.pull_push < 1.00 ? "↑ Add Pull volume" : "↓ Reduce Pull"
    }
  };
}
```

---

## Macrocycle Design Integration

### Pre-Build Validation

Before macrocycle is assigned to athlete:

```javascript
async function validateMacrocycleBalance(macrocycleId, athleteCurrentState) {
  const macrocycle = await getMacrocycle(macrocycleId);
  const projected_ratios = calculateMacrocycleRatios(macrocycle);
  const current_ratios = calculateRatios(athleteCurrentState, '4weeks');
  
  // After macrocycle, will ratios stay healthy?
  const post_macrocycle_ratios = {
    fs_bs: (currentState.fs_volume + macrocycle.projected_fs) / (currentState.bs_volume + macrocycle.projected_bs),
    snatch_clean: (currentState.snatch_vol + macrocycle.projected_snatch) / (currentState.clean_vol + macrocycle.projected_clean),
    pull_push: (currentState.pull_vol + macrocycle.projected_pull) / (currentState.push_vol + macrocycle.projected_push)
  };
  
  // All within range?
  const is_balanced = 
    post_macrocycle_ratios.fs_bs >= 0.70 && post_macrocycle_ratios.fs_bs <= 0.90 &&
    post_macrocycle_ratios.snatch_clean >= 0.80 && post_macrocycle_ratios.snatch_clean <= 1.00 &&
    post_macrocycle_ratios.pull_push >= 1.00 && post_macrocycle_ratios.pull_push <= 1.20;
  
  return is_balanced;
}
```

---

## Session-Level Suggestions

### Real-Time Balance Feedback

```json
{
  "session_id": "uuid",
  "balance_analysis": {
    "current_ratios": {
      "fs_bs": 0.65,    // ⚠️ Below 0.70
      "snatch_clean": 0.95, // ✅ Good
      "pull_push": 1.15     // ✅ Good
    },
    "session_exercises": [
      { "exercise": "Back Squat", "volume": 2000 },
      { "exercise": "Snatch Pull", "volume": 1800 }
    ],
    "post_session_ratios": {
      "fs_bs": 0.62,    // ⚠️ Will get worse
      "snatch_clean": 0.95,
      "pull_push": 1.18
    },
    "suggestions": [
      {
        "issue": "FS/BS too low (0.62, target 0.70+)",
        "fix": "Add 1-2 Front Squat sets to this session",
        "example": "Add 3×5 @ 140kg Front Squat (+2,100 kg volume)"
      }
    ]
  }
}
```

---

## Coach Dashboard View

### Balance Analytics

```
BALANCE REPORT — Last 4 Weeks
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Athlete: Maria | Training Phase: Strength

┌─ Front Squat / Back Squat ─────────────┐
│ Current Ratio: 0.72 ✅ (target 0.70-0.90)  │
│ Volume: 1,200 kg FS / 1,667 kg BS      │
│ Status: OPTIMAL                        │
└────────────────────────────────────────┘

┌─ Snatch / Clean ──────────────────────┐
│ Current Ratio: 0.89 ✅ (target 0.80-1.00)  │
│ Volume: 1,300 kg Sn / 1,462 kg Cl     │
│ Status: OPTIMAL                        │
└────────────────────────────────────────┘

┌─ Pull / Push ─────────────────────────┐
│ Current Ratio: 1.18 ✅ (target 1.00-1.20)  │
│ Volume: 4,200 kg Pull / 3,559 kg Push │
│ Status: OPTIMAL                        │
└────────────────────────────────────────┘

Recommendation: Continue current programming
```

---

## Imbalance Intervention

### Automatic Suggestions When Out of Range

```javascript
// If ratio goes outside target range, system suggests fixes

if (fs_bs < 0.70) {
  suggestion = "Front Squat volume is low. Add 1-2 sessions/week";
}

if (snatch_clean > 1.00) {
  suggestion = "Snatch volume is high. Reduce complexity or add Clean variants";
}

if (pull_push < 1.00) {
  suggestion = "Not enough pulling. Add rows, more pulls to sessions";
}
```

### Coach Override

Coach can:
1. **Accept suggestion** — Auto-adjust next macrocycle
2. **Modify session** — Add/remove exercises this week
3. **Override** — Consciously ignore for specific goal (e.g., "competition prep = more heavy singles")

---

## Data Storage

```sql
CREATE TABLE "ExerciseRatioAnalysis" (
  "id" UUID PRIMARY KEY,
  "athleteId" UUID,
  "timeframeStart" DATE,
  "timeframeEnd" DATE,
  "fs_volume_kg" DECIMAL,
  "bs_volume_kg" DECIMAL,
  "snatch_volume_kg" DECIMAL,
  "clean_volume_kg" DECIMAL,
  "pull_volume_kg" DECIMAL,
  "push_volume_kg" DECIMAL,
  "fs_bs_ratio" DECIMAL,        -- 0.70-0.90
  "snatch_clean_ratio" DECIMAL, -- 0.80-1.00
  "pull_push_ratio" DECIMAL,    -- 1.00-1.20
  "fs_bs_status" VARCHAR,       -- optimal|low|high
  "snatch_clean_status" VARCHAR,
  "pull_push_status" VARCHAR,
  "calculated_at" TIMESTAMP
);
```

---

## Integration Points

**Feeds Into:**
- **Macrocycle Engine** → Validates program balance before assigning
- **Session Adaptation** → Suggests substitutions to rebalance
- **Coach Dashboard** → Visualizes ratios over time

**Receives From:**
- **Session Completion** → Records exercise volume
- **Athlete Profile** → Gets squat/lift 1RMs for calculation

---

## Testing Checklist

- [ ] FS/BS ratio calculation accurate (0.70-0.90 range)
- [ ] Snatch/Clean ratio accurate (0.80-1.00 range)
- [ ] Pull/Push ratio accurate (1.00-1.20 range)
- [ ] Volume aggregation across multiple sessions correct
- [ ] Macrocycle pre-validation prevents imbalanced programs
- [ ] Session-level suggestions appear when ratio drifts
- [ ] Coach override works without validation errors
- [ ] Dashboard displays all three ratios correctly
- [ ] Timeframe filtering (1 week, 4 weeks, 8 weeks) works
- [ ] Ratio status labels (✅/⚠️) display correctly

---

## Performance Notes

**Ratio Calculation:** O(n) where n = number of exercises in timeframe
- Typically ~50-100 exercises per 4-week macrocycle
- Pre-calculated at macrocycle end (non-blocking)

**Validation Query:** O(1) via cached ratio calculations

---

**Generated:** 2026-04-10  
**Source:** Extracted from balance_engine.js + macrocycle_engine.js  
**Integration Status:** ✅ Complete (macrocycle + session level)
