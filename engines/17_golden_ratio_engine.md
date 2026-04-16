# 17. Golden Ratio Engine — Lift Ratio Tracking & Rewards

**Purpose:** Track and reward "golden ratio" lift relationships (proportion improvements between lifts)

**Status:** Gamification overlay + achievement tracking  
**Update Frequency:** Per PR entry  
**Performance:** O(1) ratio calculation

---

## Overview

Golden Ratio tracks proportional improvements between related lifts:
- **Snatch:** Should be 80% of Clean + Jerk
- **Front Squat:** Should be 85% of Back Squat
- **Back Squat:** Should be 135% of Snatch

When these ratios improve, athletes earn XP and recognition.

---

## Target Ratios

```
Ratio Name         | Formula          | Target | Reward
─────────────────────────────────────────────────────────
Snatch Power       | Sn / (Sn + CJ)   | 0.45   | +150 XP
Clean Power        | CJ / (Sn + CJ)   | 0.55   | +100 XP
Squat Proportion   | FS / BS           | 0.85   | +150 XP
Squat Dominance    | BS / Sn           | 1.35   | +100 XP
Recovery Strength  | CJ / (Sn × 1.15)  | 0.95   | +100 XP
```

### Example: Snatch vs Clean & Jerk

```
Scenario 1: Balanced Athlete
  Snatch: 100kg
  Clean: 130kg
  Ratio: 100/130 = 0.77 (good)
  Target: 0.80
  Status: Close to optimal

Scenario 2: Snatch-Weak Athlete
  Snatch: 80kg
  Clean: 130kg
  Ratio: 80/130 = 0.62 (too low)
  Recommendation: Focus on Snatch technique/power
  Training: Extra Snatch volume

Scenario 3: Snatch-Strong Athlete
  Snatch: 120kg
  Clean: 130kg
  Ratio: 120/130 = 0.92 (too high)
  Recommendation: Focus on Clean strength
  Training: Extra Clean + Jerk work
```

---

## Tracking Algorithm

### Per-Lift PR Entry

```javascript
async function processNewPR(athleteId, exerciseId, weight) {
  // Get current PRs for all lifts
  const prs = await getAthleteAllPRs(athleteId);
  
  // Calculate all ratios
  const ratios = {
    snatch_power: prs.snatch / (prs.snatch + prs.clean_jerk),
    clean_power: prs.clean_jerk / (prs.snatch + prs.clean_jerk),
    squat_prop: prs.front_squat / prs.back_squat,
    squat_dom: prs.back_squat / prs.snatch,
    recovery: prs.clean_jerk / (prs.snatch * 1.15)
  };
  
  // Get previous ratios
  const old_ratios = await getAthleteRatioHistory(athleteId, 1);
  
  // Check for improvements
  for (const [ratio_name, new_value] of Object.entries(ratios)) {
    const old_value = old_ratios[0][ratio_name];
    const target = GOLDEN_RATIOS[ratio_name].target;
    
    // Check if ratio improved AND closer to target
    if (hasImproved(old_value, new_value, target)) {
      const xp = GOLDEN_RATIOS[ratio_name].reward;
      const achievement = {
        type: 'golden_ratio',
        ratio: ratio_name,
        old: old_value.toFixed(2),
        new: new_value.toFixed(2),
        improvement: (new_value - old_value).toFixed(2),
        xp_earned: xp
      };
      
      // Award XP + notify
      await grantXP(athleteId, xp);
      await createAchievement(athleteId, achievement);
      await notifyAthlete(athleteId, `Golden Ratio improved: ${ratio_name}`);
    }
  }
  
  // Store ratio history
  await storeRatioSnapshot(athleteId, ratios);
}
```

### Improvement Detection

```javascript
function hasImproved(oldRatio, newRatio, target) {
  // 1. Did the ratio change?
  if (Math.abs(newRatio - oldRatio) < 0.01) return false;
  
  // 2. Did it move closer to target?
  const oldDistance = Math.abs(oldRatio - target);
  const newDistance = Math.abs(newRatio - target);
  
  return newDistance < oldDistance;
}
```

---

## Athlete Dashboard View

### Golden Ratio Card

```
GOLDEN RATIOS — Your Proportions
═════════════════════════════════════════════════════════

┌─ Snatch Power: 0.79 → 0.80 ✅ IMPROVED ──────────────┐
│ Your Snatch is 80% of (Snatch + Clean) = OPTIMAL     │
│ Previous: 0.75 | Target: 0.80 | Change: +0.05       │
│ +150 XP for this improvement!                         │
└────────────────────────────────────────────────────────┘

┌─ Front Squat / Back Squat: 0.78 (Target: 0.85) ──────┐
│ Your FS is only 78% of BS. Need more Front Squat.    │
│ Gap: 0.07 below target                               │
│ Recommendation: Add 1-2 FS sessions/week             │
└────────────────────────────────────────────────────────┘

┌─ Back Squat / Snatch: 1.42 (Target: 1.35) ────────────┐
│ Your BS is 42% stronger than your Snatch (good!)     │
│ Status: Slightly above target (safe)                  │
│ BS is your strength base — keep training it          │
└────────────────────────────────────────────────────────┘

Overall Golden Ratio Score: 82/100 ✅
  2/3 ratios optimal, 1 slightly low. Keep balanced!
```

---

## Coach Analytics

### Team Golden Ratio Report

```
GOLDEN RATIO ANALYSIS — Team View
═════════════════════════════════════════════════════════

Maria:         82/100 ✅ All ratios balanced
João:          65/100 ⚠️  Snatch weak (0.68, target 0.80)
Kristina:      78/100 ✅ FS low (0.78, target 0.85)
Helena:        71/100 ⚠️  Clean weak, Snatch too strong
Carlos:        88/100 ✅ Near perfect proportions

Team Insights:
  → Weak point: Front Squat on average (0.81 vs 0.85 target)
  → Recommendation: Add FS day to weekly programming
  → Strong point: Back Squat is well-developed (avg 1.41)
  → Follow-up: Help athletes develop proportional strength
```

---

## Data Storage

```sql
CREATE TABLE "GoldenRatioSnapshot" (
  "id" UUID PRIMARY KEY,
  "athleteId" UUID,
  "dateRecorded" DATE,
  "snatchPower" DECIMAL,       -- Sn / (Sn + CJ)
  "cleanPower" DECIMAL,        -- CJ / (Sn + CJ)
  "squatProp" DECIMAL,         -- FS / BS
  "squatDom" DECIMAL,          -- BS / Sn
  "recoveryStr" DECIMAL,       -- CJ / (Sn × 1.15)
  "overallScore" INT           -- 0-100
);

CREATE TABLE "GoldenRatioAchievement" (
  "id" UUID PRIMARY KEY,
  "athleteId" UUID,
  "ratioType" VARCHAR,
  "oldValue" DECIMAL,
  "newValue" DECIMAL,
  "targetValue" DECIMAL,
  "improvementAmount" DECIMAL,
  "xpEarned" INT,
  "achievedAt" TIMESTAMP
);
```

---

## Integration Points

**Feeds Into:**
- **Gamification** → XP rewards (+150 for good ratios)
- **Leaderboard** → Golden Ratio category ranking
- **Coach Dashboard** → Team imbalance detection

**Receives From:**
- **RM Records** → All lift PRs
- **Session Log** → New maxes detected

---

## Testing Checklist

- [ ] Snatch power ratio calculates: Sn / (Sn + CJ)
- [ ] Front Squat ratio: FS / BS targets 0.85
- [ ] Back Squat dominance: BS / Sn targets 1.35
- [ ] Improvement detection works (closer to target = +XP)
- [ ] XP awarded only once per improvement
- [ ] Dashboard displays all 5 ratios
- [ ] Coach sees team average ratios
- [ ] Historical tracking stores snapshots
- [ ] Overall score (0-100) calculates correctly

---

**Generated:** 2026-04-10  
**Source:** Extracted from golden_ratio_engine.js  
**Integration Status:** ✅ Complete (XP rewards + tracking)
