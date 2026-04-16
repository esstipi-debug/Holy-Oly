# 12. Lifestyle Engine — Daily Load Factor Modeling

**Purpose:** Model non-training stress (work, sleep, transport, family stress) and adjust readiness downward accordingly

**Status:** Integrated with stress engine, modifies readiness calculation  
**Update Frequency:** Daily (athlete logs)  
**Performance:** O(1) lifestyle load calculation

---

## Overview

Training stress is only part of fatigue. Work deadlines, sleep loss, long commutes, and family stress all contribute to overall fatigue. Lifestyle Engine models these factors and reduces readiness accordingly.

**Key Concept:**
```
Total Fatigue = Training Stress + Lifestyle Stress
Readiness = Fitness - Total Fatigue (not just training fatigue)
```

---

## Input Factors

### Daily Lifestyle Log

Athlete logs once per day (takes 2 minutes):

```json
{
  "date": "2026-04-10",
  "work_hours": 9,              // Hours worked (0-24)
  "work_intensity": 7,          // 1-10 (stressful deadline, meetings, etc.)
  "sleep_hours": 7,             // Hours slept last night
  "sleep_quality": "poor",      // poor|fair|good|excellent
  "stress_level": 6,            // 1-10 (life stress: family, finances, etc.)
  "transport_minutes": 45,      // Commute time
  "family_stress": 4,           // 1-10 (conflicts, obligations)
  "illness": null,              // "cold", "flu", "soreness", null
  "notes": "Long day at work, didn't sleep well"
}
```

---

## Calculation Algorithm

### Step 1: Base Load Factors

```javascript
function calculateDailyLoadFactor(lifestyle) {
  let load = 0;
  
  // Work hours contribution (0-2.0 points)
  // 8 hours = baseline 0, each hour above/below changes load
  const work_load = Math.abs(lifestyle.work_hours - 8) * 0.1;
  
  // Work intensity (0-1.0 points)
  const intensity_load = (lifestyle.work_intensity / 10) * 0.5;
  
  // Sleep hours (0-1.5 points, losing sleep = higher load)
  // 8 hours = baseline 0
  const sleep_load = Math.max(0, (8 - lifestyle.sleep_hours) * 0.15);
  
  // Sleep quality modifier (-0.5 to +0.5)
  const quality_mod = {
    "poor": 0.5,       // Poor sleep = high load
    "fair": 0.25,
    "good": 0,
    "excellent": -0.25
  }[lifestyle.sleep_quality];
  
  // Stress level (0-1.0 points)
  const stress_load = (lifestyle.stress_level / 10) * 0.5;
  
  // Transport (0-0.5 points, long commutes = fatigue)
  const transport_load = Math.min(0.5, lifestyle.transport_minutes / 120 * 0.5);
  
  // Family stress (0-0.5 points)
  const family_load = (lifestyle.family_stress / 10) * 0.5;
  
  // Illness multiplier (severe illness = 2x load)
  let illness_mod = 1.0;
  if (lifestyle.illness === "flu") illness_mod = 2.0;
  if (lifestyle.illness === "cold") illness_mod = 1.5;
  if (lifestyle.illness === "soreness") illness_mod = 1.2;
  
  // Sum all factors
  load = (work_load + intensity_load + sleep_load + quality_mod + stress_load + transport_load + family_load) * illness_mod;
  
  return Math.min(load, 5.0);  // Cap at 5.0
}
```

### Step 2: Cumulative Stress

```javascript
async function calculateCumulativeStress(athleteId, days = 7) {
  const logs = await prisma.lifestyleLog.findMany({
    where: { athleteId },
    orderBy: { date: 'desc' },
    take: days
  });
  
  let cumulative = 0;
  for (const log of logs) {
    cumulative += calculateDailyLoadFactor(log);
  }
  
  return cumulative;
}
```

### Step 3: Readiness Impact

```javascript
function calculateReadinessImpact(dailyLoad, cumulativeStress) {
  // Immediate impact from today's load
  const daily_impact = -dailyLoad * 5;  // Each load point = -5 readiness points
  
  // Cumulative impact (if stress accumulates, bigger penalty)
  const cumulative_threshold = 10;  // If 7-day cum stress > 10, significant impact
  let cumulative_impact = 0;
  
  if (cumulativeStress > cumulative_threshold) {
    cumulative_impact = -(cumulativeStress - cumulative_threshold) * 3;
  }
  
  return Math.round(daily_impact + cumulative_impact);
}
```

---

## Integration with Stress Engine

### Modified Readiness Formula

```javascript
// Standard readiness from stress engine
const training_readiness = ((fitness - fatigue) / fitness) * 100;

// Get lifestyle impact
const daily_load = calculateDailyLoadFactor(todayLifestyle);
const cumulative_stress = await calculateCumulativeStress(athleteId, 7);
const lifestyle_impact = calculateReadinessImpact(daily_load, cumulative_stress);

// Final readiness
const final_readiness = training_readiness + lifestyle_impact;
// Cap to 0-100 range
return Math.max(0, Math.min(100, final_readiness));
```

### Example Calculation

```
Day 1: Good Training Day
  Training Readiness: 75
  Lifestyle: 8h sleep, 8h work, low stress
    Daily Load: 0.5
    Cumulative (7d): 3.5
    Impact: -2.5
  Final Readiness: 72.5 ✅

Day 2: Stressful Day
  Training Readiness: 75
  Lifestyle: 6h sleep, 12h work, high stress (8/10), family conflict
    Daily Load: 2.8
    Cumulative (7d): 6.3
    Impact: -14
  Final Readiness: 61 ⚠️
  
Day 3: Accumulated Stress
  Training Readiness: 78
  Lifestyle: 7h sleep, 10h work, continued high stress
    Daily Load: 2.4
    Cumulative (7d): 8.7
    Impact: -14
  Final Readiness: 64 ⚠️

Day 7: Recovery Week Needed
  Cumulative stress has been > 10 for 3 days
  System suggests: "Consider deload week, stress level is high"
```

---

## Coach Insights

### Lifestyle Dashboard

```json
{
  "athlete": "Maria",
  "last_7_days": [
    { "date": "2026-04-04", "load": 0.5, "notes": "Normal day" },
    { "date": "2026-04-05", "load": 1.2, "notes": "Busy at work" },
    { "date": "2026-04-06", "load": 2.8, "notes": "Deadline, poor sleep" },
    { "date": "2026-04-07", "load": 2.4, "notes": "Continued stress" },
    { "date": "2026-04-08", "load": 1.5, "notes": "Recovering" },
    { "date": "2026-04-09", "load": 0.8, "notes": "Better" },
    { "date": "2026-04-10", "load": 0.6, "notes": "Good" }
  ],
  "cumulative_7d": 10.8,
  "recommendation": "⚠️ High cumulative stress this week. Monitor sessions, offer rest day if needed.",
  "average_sleep": 6.9,  // Low
  "average_work_hours": 10.1,  // High
  "trend": "↓ Improving (was 12.3 last week)"
}
```

---

## Athlete Notifications

### Smart Alerts Based on Lifestyle

```
IF daily_load > 3.0 AND training_ready_to_do_hard_session:
  → "High stress today. Consider lighter session, prioritize recovery."

IF cumulative_stress > 12 AND athlete_not_recovering:
  → "You've had a stressful week. We recommend a deload day tomorrow."

IF sleep_hours < 6 AND session_planned:
  → "Only 6h sleep - avoid high-intensity work. Focus on technique."

IF stress_level > 8 AND family_issues:
  → "Family stress detected. Breathwork and meditation may help. App suggests 5min mediation."
```

---

## Data Storage

```sql
CREATE TABLE "LifestyleLog" (
  "id" UUID PRIMARY KEY,
  "athleteId" UUID,
  "date" DATE,
  "workHours" INT,
  "workIntensity" INT,      -- 1-10
  "sleepHours" DECIMAL,
  "sleepQuality" VARCHAR,   -- poor|fair|good|excellent
  "stressLevel" INT,        -- 1-10
  "transportMinutes" INT,
  "familyStress" INT,       -- 1-10
  "illness" VARCHAR,        -- null|cold|flu|soreness
  "notes" TEXT,
  "dailyLoadFactor" DECIMAL,
  "readinessImpact" INT,
  "loggedAt" TIMESTAMP
);
```

---

## Cron Integration

### Daily at 00:30 UTC (After Stress Calc)

```javascript
async function updateLifestyleLoadDaily() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const lifestyleLogs = await prisma.lifestyleLog.findMany({
    where: { date: yesterday }
  });
  
  for (const log of lifestyleLogs) {
    const load = calculateDailyLoadFactor(log);
    const cumulative = await calculateCumulativeStress(log.athleteId, 7);
    const impact = calculateReadinessImpact(load, cumulative);
    
    // Store
    await prisma.lifestyleLog.update({
      where: { id: log.id },
      data: {
        dailyLoadFactor: load,
        readinessImpact: impact
      }
    });
  }
}
```

---

## Integration Points

**Feeds Into:**
- **Stress Engine** → Modifies final readiness calculation
- **Session Adaptation** → High lifestyle load → more conservative adaptations
- **Coach Dashboard** → Lifestyle insights
- **Smart Coach** → Alert generation for high stress

**Receives From:**
- **Athlete Lifestyle Log** → Daily input
- **Sleep Tracking** → Optional integration with wearables (Oura, Whoop)

---

## Testing Checklist

- [ ] Daily load calculation (work + sleep + stress + transport + family)
- [ ] Cumulative 7-day stress calculation correct
- [ ] Illness modifier applies correctly (cold = 1.5x, flu = 2.0x)
- [ ] Readiness impact reduces final readiness appropriately
- [ ] Coach sees lifestyle insights in dashboard
- [ ] Alerts triggered when cumulative > 10 for 3+ days
- [ ] Logging UI is simple (2-minute completion)
- [ ] Historical data stored and graphed

---

**Generated:** 2026-04-10  
**Source:** Extracted from lifestyle_engine.js + stress_engine.js  
**Integration Status:** ✅ Complete (readiness modifier + alerts)
