# 08. Warmup Engine (Adaptive Protocol)

**Core Module:** `backend/src/services/warmup_engine.js`  
**Data Source:** Ported from `warmup_generator.py`  
**Trigger:** Athlete requests warmup for specific exercise (on-demand)  

---

## Purpose

The **Warmup Engine** generates **readiness-aware warmup protocols** that scale from 55% intensity to competition weight. Unlike generic "5×5 at 50%" warmups, this system adapts to athlete fatigue level, ensuring adequate preparation without wasteful volume.

---

## Warmup Phases

### Standard 4-Phase Protocol

| Phase | Intensity | Reps | Category | Purpose |
|-------|-----------|------|----------|---------|
| **Technical** | 55% | 3 | technical | Form work, activation |
| **Speed** | 65% | 2 | speed | Movement fluidity |
| **Power** | 75% | 2 | power | Dynamic preparation |
| **Competition** | 85% | 1 | competition | Final approach |

**Example for Athlete with 100kg Snatch 1RM:**
```
Target intensity: 90% (90kg work set)

Phase 1: Technical
  55% × 3 = 55kg × 3 reps

Phase 2: Speed
  65% × 2 = 65kg × 2 reps

Phase 3: Power
  75% × 2 = 75kg × 2 reps

Phase 4: Competition
  85% × 1 = 85kg × 1 rep

Then: Work set
  90% × 3 = 90kg × 3 reps
```

---

## Readiness-Based Adaptations

### Adaptation Levels

| Readiness | Level | Warmup Profile | Extra Activation |
|-----------|-------|-----------|---------|
| < 40 | **Exhausted** | Extended + mobility | Yes (+45% set) |
| 40-60 | **Fatigued** | Standard | No |
| 60-80 | **Normal** | Standard | No |
| > 80 | **Fresh** | Reduced (skip technical) | No |

**Examples:**

**Exhausted (Readiness 30):**
```
Phase 0 (Extra): Activation
  45% × 3 = 45kg × 3 reps
  
Phase 1: Technical
  55% × 3 = 55kg × 3 reps
  
Phase 2: Speed
  65% × 2 = 65kg × 2 reps
  
Phase 3: Power
  75% × 2 = 75kg × 2 reps
  
Phase 4: Competition
  80% × 1 = 80kg × 1 rep (reduced from 85%)

Coach note: "Extended warmup. Extra mobility work."
```

**Fresh (Readiness 85):**
```
Phase 1: SKIP (technical phase skipped for fresh athlete)

Phase 2: Speed
  65% × 2 = 65kg × 2 reps
  
Phase 3: Power
  75% × 2 = 75kg × 2 reps
  
Phase 4: Competition
  85% × 1 = 85kg × 1 rep

Coach note: "Brief warmup. You're ready to go!"
```

---

## Position-Based Variants

**First Exercise in Session:** Full warmup (activation through competition)  
**Second Exercise:** Reduced warmup (skip technical phase, start at speed)  
**Third+ Exercise:** Minimal (just 1-2 sets at 75-80%)

**Example Session:**
```
Exercise 1 (Snatch): Full warmup
  45% × 3, 55% × 3, 65% × 2, 75% × 2, 85% × 1
  Then: 90% × 3 (work set)

Exercise 2 (Clean): Reduced warmup
  65% × 2, 75% × 2, 85% × 1
  Then: 88% × 3 (work set)

Exercise 3 (Back Squat): Minimal warmup
  80% × 2
  Then: 85% × 5 (work set)

Exercise 4 (Snatch Pull): Minimal warmup
  75% × 3
  Then: 90% × 3 (work set)
```

---

## Exercise-Specific Variations

### Snatch (Complexity: 9/10)
- **Full warmup always** (complex movement, most CNS demand)
- Extra mobility if exhausted
- Includes approach set at 90%+ intensity

### Clean (Complexity: 8/10)
- **Full warmup** but slightly less activation than snatch
- Same phases as snatch

### Front Squat (Complexity: 6/10)
- **Reduced warmup** (less complex)
- Can skip activation phase even if exhausted

### Back Squat (Complexity: 5/10)
- **Minimal warmup** (simple movement)
- 2-3 sets sufficient

### Pulls (Complexity: 4/10)
- **Brief warmup** (low technique demand)
- Just 1-2 sets

### Accessory (Complexity: 2-3/10)
- **No formal warmup** (bodyweight activation sufficient)

---

## Data Structure

```javascript
{
  exercise_name: "Snatch",
  target_intensity: 90,        // % of 1RM
  athlete_1rm: 100,            // kg
  position_in_session: 1,      // 1st exercise = full
  athlete_readiness: 72,       // 0-100
  
  warmup_protocol: [
    {
      set_number: 1,
      reps: 3,
      intensity_pct: 55,
      weight_kg: 55,
      description: "Técnica / Forma",
      category: "technical"
    },
    {
      set_number: 2,
      reps: 2,
      intensity_pct: 65,
      weight_kg: 65,
      description: "Velocidad / Fluidez",
      category: "speed"
    },
    // ... more sets
  ],
  
  total_warmup_load: 1200,     // Sum of all sets
  estimated_duration: 8,       // minutes
  notes: "Standard warmup. Athlete ready.",
  readiness_level: "normal"
}
```

---

## Integration Points

### Uses Data From:
- **Athlete Profile** — 1RM for each exercise
- **Stress Engine** — Readiness score (determines adaptation)
- **Macrocycle Engine** — Exercise order in session

### Feeds Data To:
- **Frontend** — Display warmup on mobile (athlete follows)
- **Session Recording** — Warmup data stored but not counted toward training load

---

## Example Workflow

```
Athlete opens "Today's Session"
  → Snatch 5×3 @ 90%
  → Back Squat 4×5 @ 85%
  → Snatch Pull 3×5 @ 95%

Athlete clicks "Generate Warmup"
  System fetches:
    - Readiness: 65 (fatigued)
    - Snatch 1RM: 100kg
    - Target: 90kg
    - Position: 1 (first exercise)
  
  Calculates:
    - Readiness level: "fatigued" → standard warmup
    - Position: 1 → full warmup (no skips)
    - Complexity: 9 → include competition phase
  
  Generates:
    Set 1: 55kg × 3 (Technical)
    Set 2: 65kg × 2 (Speed)
    Set 3: 75kg × 2 (Power)
    Set 4: 85kg × 1 (Competition)
    
  Notes: "Standard warmup. You're ready."

Athlete completes warmup (doesn't log volume)
  Then: 90kg × 5 × 3 (work sets)
  
  Logs RPE, actual weight, compliance
  → Feeds into Stress Engine for next day's readiness

Next Exercise: Back Squat
  Click "Generate Warmup"
  Position: 2 (second) → reduced warmup
  
  Generates:
    Set 1: 65kg × 2 (Speed, skip technical)
    Set 2: 75kg × 2 (Power)
    Set 3: 85kg × 1 (Competition)
  
  Notes: "Brief warmup. Already warmed up."
```

---

## Performance Optimization

**Warmup Generation:** ~20ms (O(1) lookup + calculation)  
**Weight Rounding:** Automatic to nearest 0.5kg (plate increments)

---

## Testing & Validation

**Unit Test Location:** `backend/__tests__/warmup_engine.test.js`

**Test Cases:**
1. Weight calculation and rounding
2. Phase generation for each readiness level
3. Position-based reduction (2nd, 3rd exercise)
4. Exercise-specific complexity adjustments
5. Total load estimation

---

**Next:** See [10_balance_engine.md](./10_balance_engine.md) for exercise ratio enforcement.
