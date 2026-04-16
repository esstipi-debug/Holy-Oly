# 07. BW Milestone Engine (Body Weight Achievements)

**Core Module:** `backend/src/services/bw_milestone_engine.js`  
**Database Table:** `athleteBwMilestone`  
**Trigger:** On PR update (snatch/CJ/FS/BS log)  

---

## Purpose

The **BW Milestone Engine** tracks **relative strength achievements** — hitting specific lift amounts relative to body weight. This celebrates progress meaningful to the athlete, regardless of absolute strength.

---

## Standard Milestones

### Snatch @ Bodyweight (Snatch = 1.0 × BW)

| Bodyweight | Snatch Target | Badge | XP |
|-----------|---|---|---|
| 60kg | Snatch 60kg | 🥉 | 150 |
| 70kg | Snatch 70kg | 🥈 | 150 |
| 80kg | Snatch 80kg | 🥇 | 200 |
| 90kg | Snatch 90kg | 👑 | 250 |
| 100kg | Snatch 100kg | 🔥 | 300 |
| 110kg | Snatch 110kg | 💎 | 350 |

### Clean+Jerk @ 1.2× Bodyweight

| Bodyweight | CJ Target | Badge | XP |
|-----------|---|---|---|
| 60kg | CJ 72kg | 🥉 | 150 |
| 70kg | CJ 84kg | 🥈 | 150 |
| 80kg | CJ 96kg | 🥇 | 200 |
| 90kg | CJ 108kg | 👑 | 250 |
| 100kg | CJ 120kg | 🔥 | 300 |
| 110kg | CJ 132kg | 💎 | 350 |

### Front Squat @ 1.3× Bodyweight

| Bodyweight | FS Target | Badge | XP |
|-----------|---|---|---|
| 60kg | FS 78kg | 🥉 | 100 |
| 70kg | FS 91kg | 🥈 | 100 |
| 80kg | FS 104kg | 🥇 | 150 |
| 90kg | FS 117kg | 👑 | 150 |
| 100kg | FS 130kg | 🔥 | 200 |
| 110kg | FS 143kg | 💎 | 250 |

### Back Squat @ 1.5× Bodyweight

| Bodyweight | BS Target | Badge | XP |
|-----------|---|---|---|
| 60kg | BS 90kg | 🥉 | 100 |
| 70kg | BS 105kg | 🥈 | 100 |
| 80kg | BS 120kg | 🥇 | 150 |
| 90kg | BS 135kg | 👑 | 150 |
| 100kg | BS 150kg | 🔥 | 200 |
| 110kg | BS 165kg | 💎 | 250 |

---

## Detection Logic

```javascript
On each session completion:
  FOR each exercise (snatch, CJ, FS, BS):
    IF athlete_pr[exercise] >= milestone_target[exercise][bw]
    AND athlete NOT yet earned this milestone
    THEN:
      Unlock milestone
      Award XP
      Create achievement card
      Notify athlete
```

**Example:**
```
Athlete: 75kg bodyweight
Session logs: Snatch 75kg (new PR)

Check milestones:
  Snatch @ 75kg = 1.0 × BW ✓
  → Unlock "Snatch 75kg" milestone
  → +150 XP
  → Notification: "🎉 Snatch @ BW! 75kg achieved!"
```

---

## Data Structure

```javascript
{
  athlete_id: "uuid",
  body_weight: 75,
  
  milestones: [
    {
      milestone_type: "snatch_at_bw",
      target_weight: 75,
      achieved: true,
      achieved_date: "2026-03-15",
      xp_reward: 150,
      badge: "🥉",
      pr_weight: 75
    },
    {
      milestone_type: "cj_at_120_percent_bw",
      target_weight: 90,      // 75 × 1.2
      achieved: false,
      current_best: 88,       // Close!
      progress_pct: 97.8,
      xp_reward: 150,
      badge: "🥈"
    }
  ],
  
  progress_summary: {
    total_unlocked: 3,
    total_available: 24,
    completion_pct: 12.5,
    next_milestone: "CJ @ 90kg (2kg away)"
  }
}
```

---

## Integration Points

### Uses Data From:
- **Athlete Profile** — Body weight
- **Session Engine** — PR updates
- **Stress Engine** — Training load (indirectly)

### Feeds Data To:
- **Gamification Engine** — XP rewards
- **Social Engine** — Achievement cards
- **Frontend** — Progress display

---

## Example Progression (75kg Athlete)

```
Month 1: Joins HolyOly
  BW: 75kg
  Current Snatch: 50kg (no milestones yet)

Month 2: Snatch 60kg
  Milestone unlocked: Not yet (need 75kg)
  Progress: 60/75 = 80%

Month 3: Snatch 70kg
  Milestone unlocked: Not yet (need 75kg)
  Progress: 70/75 = 93% (so close!)

Month 4: Snatch 75kg (PR)
  ✓ Milestone unlocked: "Snatch @ BW"
  +150 XP
  Notification: "🥉 Snatch @ Bodyweight! 75kg!"
  Badge displayed on profile

Month 5: CJ 88kg (PR)
  Progress toward "CJ @ 90kg": 88/90 = 97.8%
  Expected next month

Month 6: CJ 90kg (PR)
  ✓ Milestone unlocked: "CJ @ 1.2×BW"
  +150 XP
  Notification: "🥈 Clean+Jerk milestone! 90kg!"

Month 8: FS 97kg (PR)
  Progress toward "FS @ 1.3×BW": 97/97.5 = 99.5%

Month 9: FS 97.5kg (PR)
  ✓ Milestone unlocked: "FS @ 1.3×BW"
  +150 XP
  Cumulative: 3 milestones, 450 XP earned

Month 12: BS 112kg (PR)
  Progress toward "BS @ 1.5×BW": 112/112.5 = 99.6%
  Expected next month

Progress Dashboard:
  Unlocked: 3/24 (12.5%)
  Next: BS @ 112.5kg (0.5kg away!)
  Recent: CJ @ 90kg (Sep 2026)
```

---

## Testing & Validation

**Unit Test Location:** `backend/__tests__/bw_milestone_engine.test.js`

**Test Cases:**
1. Milestone unlock on PR
2. No duplicate unlocks
3. Progress calculation (current / target)
4. BW change affects future milestones
5. XP reward distribution

---

**Next:** See [09_pulse_engine.md](./09_pulse_engine.md) for conditioning challenges.
