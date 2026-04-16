# 04. Gamification Engine (XP, Levels, Clubs)

**Core Module:** `backend/src/services/gamification_engine.js`  
**Database Tables:** `gamification`, `athleteAchievement`, `athleteShield`  
**Trigger:** Real-time on session completion, PR unlocks, streak milestones  

---

## Purpose

The **Gamification Engine** tracks athlete engagement through **XP (experience points), levels, shields, and total clubs**. It provides continuous positive feedback and recognizable progression milestones, keeping athletes motivated through the long training journey.

---

## XP Rewards System

| Event | XP | Trigger |
|-------|----|----|
| **Session Complete** | +100 | Log any training session |
| **Week Complete** | +300 | Complete ≥5 sessions in 1 week |
| **PR Broken** | +500 | New personal record logged |
| **Streak 7 Days** | +200 | 7 consecutive training days |
| **Streak 30 Days** | +1000 | 30 consecutive training days |
| **Daily Check-in** | +50 | Log PRE-session readiness |
| **Shield Activated** | +200 | Activate a shield item |
| **Club Entry** | +1000 | Join a total club (100kg, 150kg, etc.) |
| **Challenge Complete** | +300 | Finish Pulse conditioning challenge |
| **Damage Control** | +150 | Complete reduced session (adaptation) |
| **Píldora Followed** | +50 | Practice coaching tip |
| **Invincible Mode** | +500 | Complete session with max shields active |
| **Golden Ratio** | +200 | Hit proportion (e.g., Sn = 0.8×CJ) |
| **BW Milestone** | +150 | Snatch/CJ at specific bodyweight level |
| **Coach Stamp** | +300 | Receive coach approval/stamp |

---

## Level System

**9 Tier Structure:**

| Level Range | Tier Name | XP Threshold |
|-------------|-----------|--------------|
| 1-10 | **Novato** (Novice) | 0 - 5,000 XP |
| 11-25 | **Intermedio** (Intermediate) | 5,000 - 20,000 XP |
| 26-50 | **Avanzado** (Advanced) | 20,000 - 60,000 XP |
| 51-75 | **Élite** | 60,000 - 120,000 XP |
| 76-100 | **Legendario** (Legendary) | 120,000 - 250,000+ XP |

**Level Progression Example:**
```
Level 1 @ 0 XP
    ↓ +100 XP per session
Level 5 @ 2,000 XP
    ↓ +100 XP per session
Level 10 @ 5,000 XP (← Tier boundary)
    ↓ switch to "Intermedio" tier
Level 11 @ 6,000 XP
    ↓ continue...
Level 25 @ 20,000 XP (← Tier boundary)
    ↓ switch to "Avanzado" tier
```

---

## Total Clubs System

Athletes unlock **strength achievement clubs** when they hit absolute strength thresholds:

| Club | Snatch + CJ Total | Icon | XP Reward |
|------|-------------------|------|-----------|
| 100kg Club | 100kg | 🥉 | 1,000 |
| 150kg Club | 150kg | 🥈 | 1,000 |
| 200kg Club | 200kg | 🥇 | 1,000 |
| 250kg Club | 250kg | 💎 | 1,500 |
| 300kg Club | 300kg+ | 👑 | 2,000 |

**Logic:**
```
If (athleteSnatchMax + athleteCleanJerkMax) ≥ 100kg
  AND athlete not yet in club
  → Unlock "100kg Club"
  → Award +1,000 XP
  → Display achievement card
```

---

## Shield System

**5 Shield Types** (one-time use, cooldown-based):

| Shield | Effect | Cooldown | Benefit |
|--------|--------|----------|---------|
| **SLEEP** | Recover from bad sleep day | 1/month | +10 readiness |
| **PROTEIN** | Boost recovery on low intake | 2/month | +5 fitness gain |
| **ANTI_STRESS** | Reduce daily stress impact | 2/month | -10 fatigue |
| **CONSISTENCY** | Protect streak if miss 1 day | 1/month | Freeze streak 1 day |
| **RECOVERY** | Extra recovery day bonus | 2/month | +3 readiness |

**Usage:**
```
Athlete had poor sleep (5 hours)
Readiness = 35 (low)

Athlete activates SLEEP shield:
Readiness = 35 + 10 = 45 (moderate)
Shield on cooldown until next month
+200 XP for shield use
```

---

## Achievement System

### Tier 1: Strength Milestones
- "First 100kg Club" — Snatch + CJ ≥ 100kg
- "Golden Snatcher" — Snatch ≥ 80kg
- "Clean Beast" — Clean+Jerk ≥ 120kg

### Tier 2: Consistency Milestones
- "Week Warrior" — 5 sessions / week
- "Month Master" — 20 sessions / month
- "Unbreakable" — 100 consecutive training days

### Tier 3: Skill Milestones
- "Proportionate" — Golden ratio achieved
- "Perfect Bars" — 10 sessions with RPE match
- "Balanced Athlete" — All exercise ratios in target range

---

## Data Structure

```javascript
{
  athlete_id: "uuid",
  xp: 28500,
  current_level: 35,
  level_name: "Intermedio",
  xp_to_next_level: 1500,
  
  clubs: [
    {
      name: "100kg Club",
      unlocked_date: "2026-02-15",
      xp_reward: 1000,
      icon: "🥉"
    },
    {
      name: "150kg Club",
      unlocked_date: "2026-03-20",
      xp_reward: 1000,
      icon: "🥈"
    }
  ],
  
  shields: {
    sleep: {
      active: false,
      last_used: "2026-04-01",
      next_available: "2026-05-01"
    },
    protein: {
      active: true,
      expires: "2026-04-11",
      uses_left: 1
    }
  },
  
  achievements: [
    {
      id: "achievement-100-club",
      name: "100kg Club",
      unlocked_date: "2026-02-15"
    }
  ]
}
```

---

## Integration Points

### Receives Notifications From:
- **Session Engine** — Session completion triggers XP (+100)
- **Stress Engine** — PR unlock triggers XP (+500)
- **Smart Streak Engine** — Streak milestones (+200, +1000)
- **BW Milestone Engine** — Bodyweight achievement (+150)
- **Golden Ratio Engine** — Ratio achieved (+200)
- **Pulse Engine** — Challenge completion (+300)

### Feeds Data To:
- **Leaderboard Cache** — XP rankings (global, club-based)
- **Social Engine** — Milestone cards (club entry, level up)
- **Frontend Dashboard** — XP bar, level display, achievement notifications

---

## Example Progression

```
Day 1: Athlete joins HolyOly
  XP = 0
  Level = 1 (Novato)
  
Day 2: First session completed
  XP = 100
  Level = 1
  Notification: "Great start! +100 XP"

Day 8: Week complete (5 sessions)
  XP = 100 + 500 (5 sessions) + 300 (week bonus)
  = 900 XP
  Level = 1
  Notification: "Week Warrior badge earned! +300 XP"

Day 15: 7-day streak
  XP = 900 + 700 (7 more sessions) + 200 (streak bonus)
  = 1800 XP
  Level = 1
  Notification: "🔥 7-Day Streak! +200 XP"

Day 20: PR broken (Snatch 100kg → 105kg)
  XP = 1800 + 200 (3 sessions) + 500 (PR)
  = 2500 XP
  Level = 1
  Notification: "🎉 New PR! Snatch 105kg! +500 XP"

Day 35: 30-day streak
  XP = 2500 + 1500 (more sessions) + 1000 (30-day streak)
  = 5000 XP
  Level = 11 (← Tier change to Intermedio)
  Notification: "🎊 Level 11! Welcome to Intermedio tier"

Day 50: Club unlock (Snatch 80kg + CJ 95kg = 175kg, but already over 100kg club)
  Athlete hits 100kg Club threshold
  XP += 1000
  = 6000+ XP
  Level = 12
  Notification: "🏆 100kg Club unlocked! +1,000 XP"
```

---

## Performance Optimization

**Real-time Updates:**
- XP addition: O(1) — Simple field update
- Level recalculation: O(1) — Lookup threshold table
- Club unlock check: O(n) where n=5 clubs (negligible)

**Cron Operations (optional nightly roll-up):**
- Verify unlocked achievements: ~10ms per athlete
- Send milestone notifications: Batched, ~100ms for 1000 athletes

---

## Testing & Validation

**Unit Test Location:** `backend/__tests__/gamification_engine.test.js`

**Test Cases:**
1. XP award for session completion
2. Level-up detection and tier transitions
3. Club unlock when threshold met
4. Shield cooldown calculation
5. Achievement unlock logic
6. Multiple simultaneous unlocks (e.g., level + club)

---

**Next:** See [05_belt_engine.md](./05_belt_engine.md) for progressive belt ranking system.
