# 06. Smart Streak Engine (Adherence + Comebacks)

**Core Module:** `backend/src/services/smart_streak_engine.js`  
**Database Table:** `athleteStreak`, `streakFreeze`  
**Trigger:** Daily (00:00 UTC) — marks day as trained or skipped  

---

## Purpose

The **Smart Streak Engine** tracks training consistency while respecting real-world circumstances through **intelligent comeback mechanics**. Unlike traditional all-or-nothing streaks, this system doesn't punish missed days—it counts what matters: **total training dedication over time**.

---

## How Streaks Work

### 1. Daily Status Tracking

Every athlete gets a daily status:

```
Status: 'COMPLETED' | 'SKIPPED' | 'PENDING'

COMPLETED: Logged session today
SKIPPED: Didn't log session (missed day)
PENDING: Day isn't over yet (shows current streak in-progress)
```

### 2. Streak Rules

**Building Streaks:**
- Session logged = +1 to streak counter
- Consecutive days only (1 day skip = broken)

**Streak Freeze (Monthly):**
- 1 use per month (resets 1st of month)
- Athlete can "freeze" streak for 1 day
- Skipped day doesn't break streak, but doesn't add to it either
- Example:
  ```
  Day 1-30: 30-day streak
  Day 31: Use freeze (didn't train)
  Day 32: Train again
  → Streak continues at 31 days (freeze protected)
  ```

**Smart Comeback (No Reset):**
- Missed 1 day? Streak broken, but comeback available
- Unlike traditional streaks (100 → 0), this system gives back:
  ```
  Day 1-100: 100-day streak
  Day 101: Skip (missed)
  → Streak: 100 → 99 (lose only 1 day, not all)
  
  Day 102: Train again
  → Streak: 99 → 100 (comeback restores it)
  ```

---

### 3. Comeback Mechanics

**Comeback Eligibility:**
```
IF streak broken (day skipped)
AND athlete returns within 7 days
AND logs session
THEN
  activeStreak = previousStreak - 1
  comebackEligible = true
  (athlete can rebuild quickly)
```

**Example:**
```
100-day streak → Skip day 101 → Streak becomes 99
Days 102-108: Stay available for comeback (7-day window)
Day 108: Log session → Comeback! Streak: 99 → 100

After Day 108: Comeback window closes
If still haven't trained by Day 109: Streak resets to 0
```

---

## Streak Milestones

| Days | Tier | XP Reward | Badge |
|------|------|-----------|-------|
| 7 | Week Warrior | +200 | 🔥 |
| 14 | Fortnight | +300 | 🔥🔥 |
| 30 | Monthly Warrior | +500 | 🔥 ×5 |
| 60 | Bimonthly | +750 | 🔥 ×10 |
| 90 | Quarterly | +1000 | 👑 |
| 180 | Half-Year | +1500 | 👑👑 |
| 365 | Annual | +3000 | 👑👑👑 |

---

## Freezes & Comebacks

### Monthly Freeze Allocation

```
Reset: 1st of every month
Usage: Up to 1 per month

Example:
  March 1: Reset (1 freeze available)
  March 15: Use freeze (protected 1 day)
  March 15-31: 0 freezes left
  April 1: Reset (1 freeze available again)
```

### Comeback Window

```
7 days to restore broken streak

Timeline:
  Day 100: Session (streak 100)
  Day 101: Missed (streak 99, comeback available)
  Day 102-108: Can still complete session (7-day window)
  Day 108: Train (comeback accepted, streak 99 → 100)
  Day 109+: If no training by now, streak resets to 0
```

---

## Data Structure

```javascript
{
  athlete_id: "uuid",
  current_streak: 47,          // Days
  longest_streak: 150,         // All-time high
  freezes_used_this_month: 0,  // 0-1
  freezes_remaining: 1,        // Next available: May 1
  comeback_eligible: false,    // Eligible to restore broken streak
  comeback_days_left: 0,       // Days remaining in comeback window (7)
  
  streak_history: [
    {
      date: "2026-04-10",
      status: "completed",     // or "skipped" or "frozen"
      used_freeze: false,
      comeback_day: false,
      notes: ""
    }
  ],
  
  milestones_achieved: [
    { days: 7, unlocked: "2026-02-15" },
    { days: 30, unlocked: "2026-03-05" },
    { days: 90, unlocked: "2026-04-05" }
  ]
}
```

---

## Integration Points

### Uses Data From:
- **Session Engine** — Training logged = +1 streak day
- **Calendar System** — Daily date for streak calculation

### Feeds Data To:
- **Gamification Engine** — Streak milestone XP rewards
- **Belt Engine** — Streak requirement for belt progression
- **Social Engine** — Milestone achievement cards
- **Notifications** — Streak alerts

---

## Example Progression

```
Day 1 (Feb 1): First session
  Streak: 0 → 1
  Freezes: 1 available
  
Day 7 (Feb 7): Milestone reached
  Streak: 7 ✓
  XP Reward: +200
  Badge: 🔥
  Notification: "Week Warrior! 7-day streak!"

Day 14 (Feb 14): Two weeks
  Streak: 14 ✓
  XP Reward: +300
  
Day 30 (Mar 1): Monthly milestone + Reset
  Streak: 30 ✓
  XP Reward: +500
  Freezes reset: 1 available (new month)
  
Day 45 (Mar 16): Missed a day!
  Status: SKIPPED
  Streak: 45 → 44
  Comeback eligible: YES (7-day window open)
  Freezes: 1 available (could use to protect next miss)
  
Day 46 (Mar 17): Come back!
  Status: COMPLETED
  Comeback activated
  Streak: 44 → 45 (restored!)
  Notification: "💪 Comeback! 45-day streak restored!"

Day 52 (Mar 23): Last day of comeback window
  If I miss this day:
    Streak: 45 → 44
    But could still comeback until Day 52 midnight
    
Day 53+ (Mar 24+): Comeback window closed
  If streak broken: 45 → 0 (hard reset)
  Notification: "Streak lost. New challenge: Start again!"

Day 90 (Apr 30): Quarterly milestone
  Streak: 90 ✓
  XP Reward: +1000
  Badge: 👑
  Tier: Athlete now "elite" status
```

---

## Cron Job

**Trigger:** Daily at 00:00 UTC

```
For each athlete:
  1. Check if logged session yesterday
  2. Update yesterday's status (COMPLETED or SKIPPED)
  3. Recalculate current_streak
  4. Check if milestone reached → Award XP
  5. Check if comeback window expired → Reset streak
  6. Email athlete (optional): "Streak update: 47 days"
```

---

## Psychology Benefits

1. **No permanent failure** — Comeback mechanic removes shame of missed day
2. **Sustainable goals** — Monthly freezes prevent burnout
3. **Cumulative progress** — -1 instead of -100 feels achievable
4. **Visible reset** — 1st of month = fresh start psychologically
5. **Respects life** — Freezes acknowledge illness, travel, family

---

## Testing & Validation

**Unit Test Location:** `backend/__tests__/smart_streak_engine.test.js`

**Test Cases:**
1. Streak increment on training
2. Freeze usage and protection
3. Comeback window behavior
4. Comeback window expiration
5. Milestone XP rewards
6. Monthly reset of freezes
7. All-time longest streak tracking

---

**Next:** See [07_bw_milestone_engine.md](./07_bw_milestone_engine.md) for bodyweight achievement tracking.
