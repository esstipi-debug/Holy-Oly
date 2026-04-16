# 05. Belt System (Cinturones de Progresión)

**Core Module:** `backend/src/services/belt_engine.js`  
**Database Table:** `athleteBelt`  
**Trigger:** Daily validation (achieved criteria → auto-upgrade)  

---

## Purpose

The **Belt System** provides long-term gamification progression. Unlike XP (fast, attainable), belts require **sustained excellence across multiple dimensions**, creating aspirational goals that keep athletes engaged for months/years.

---

## Belt Progression

| Belt | Color | Min OLY Index | Min Streak | Min Shields | Min Club | Min Pulse | Min Ratios | Min Active Days |
|------|-------|--|---|---|---|---|---|---|
| **White** | ⚪ | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **Yellow** | 🟡 | 150 | 1w | 1 | 0 | 0 | 0 | 7d |
| **Orange** | 🟠 | 250 | 2w | 2 | 100kg | 0 | 0 | 30d |
| **Green** | 🟢 | 400 | 4w | 3 | 150kg | 10 | 0 | 90d |
| **Blue** | 🔵 | 550 | 8w | 4 | 200kg | 20 | 1 | 180d |
| **Purple** | 🟣 | 700 | 12w | 5 | 250kg | 30 | 2 | 270d |
| **Brown** | 🟤 | 850 | 16w | 6 | 300kg | 40 | 3 | 365d |
| **Red** | 🔴 | 1000 | 24w | 7 | 300kg | 50 | 4 | 500d |
| **Gold** | 🥇 | 1200+ | 52w | 8+ | 300kg | 75 | 5+ | 730d |

**Key Metrics:**
- **OLY Index** — Normalized strength (Sn + CJ) / BW
- **Smart Streak** — Consecutive training days (never reset, frozen days)
- **Shields** — Defensive items activated
- **Club** — Total lifted (cumulative strength)
- **Pulse** — Conditioning challenges completed
- **Golden Ratios** — Proportion achievements (Sn/CJ, FS/BS, etc.)
- **Active Days** — Training days (cumulative, lifetime)

---

## How Belts Work

### 1. Criteria Check

Each day at 00:30 UTC (via cron):

```
For each athlete:
  - Check if current_belt criteria still met (no demotion)
  - Check if next_belt criteria met (auto-promote)
  - If promoted: Award XP, send notification, update belt_color
```

### 2. Auto-Promotion

```
IF athlete.olyIndex ≥ 550
   AND athlete.streak ≥ 8 weeks
   AND athlete.shields ≥ 4
   AND athlete.totalClub ≥ 200kg
   AND athlete.pulseCompleted ≥ 20
   AND athlete.goldenRatios ≥ 1
   AND athlete.activeDays ≥ 180
THEN
  athlete.belt = 'blue'
  athlete.beltColor = '#0081C8'
  athlete.xp += 5000 (belt promotion bonus)
  notify(athlete, "🎊 Blue Belt achieved! You're elite now.")
```

### 3. Permanent Progression

**Belts are never lost** — Once earned, permanent. This removes fear and creates cumulative achievement.

```
Edge case: Athlete stops training 6 months
  → Streak resets (smart_streak_engine)
  → But Blue Belt stays
  → Can regain Blue Belt by restarting streak

This design is intentional:
  - Respects past achievements
  - Motivates comeback ("I was Blue Belt, let's get back there")
  - No punishment for life circumstances
```

---

## XP Rewards Per Belt

| Belt Promotion | XP | Notes |
|---|---|---|
| White → Yellow | 500 | Starting threshold |
| Yellow → Orange | 1,000 | |
| Orange → Green | 1,500 | Entering "Advanced" |
| Green → Blue | 2,000 | Entering "Elite" |
| Blue → Purple | 2,500 | |
| Purple → Brown | 3,000 | |
| Brown → Red | 3,500 | |
| Red → Gold | 5,000 | Legendary rank |

---

## Integration Points

### Uses Data From:
- **OLY Index Engine** — Strength calculation
- **Smart Streak Engine** — Consecutive days
- **Gamification Engine** — Shields count
- **Macrocycle Engine** — Club unlocks
- **Pulse Engine** — Challenge completions
- **Golden Ratio Engine** — Proportion achievements

### Feeds Data To:
- **Frontend Dashboard** — Belt display (prominent)
- **Social Engine** — Belt promotion cards
- **Leaderboard** — Belt tier grouping

---

## Example Progression

```
Month 1: White Belt (default)
  - Athlete joins and trains
  - OLY Index: 120 (low)
  
Month 2: Yellow Belt achieved ✓
  - OLY Index: 180 (≥150 ✓)
  - Streak: 35 days (≥7 ✓)
  - Shields: 1 (≥1 ✓)
  - Active Days: 45 (≥7 ✓)
  → Promoted to Yellow
  → +500 XP
  → Notification: "Yellow Belt! You're consistent!"

Month 4: Orange Belt achieved ✓
  - OLY Index: 280 (≥250 ✓)
  - Streak: 60+ days (≥14 ✓)
  - Shields: 2 (≥2 ✓)
  - Club: 110kg (≥100 ✓)
  - Active Days: 90+ (≥30 ✓)
  → Promoted to Orange
  → +1,000 XP
  → Notification: "Orange Belt! Intermediate achieved!"

Month 12: Blue Belt (elite status)
  - OLY Index: 600 (≥550 ✓)
  - Streak: 8+ weeks maintained
  - Shields: 4+ activated over time
  - Club: 210kg (≥200 ✓)
  - Pulse: 25 challenges (≥20 ✓)
  - Ratios: 2 golden achievements (≥1 ✓)
  - Active Days: 200+ (≥180 ✓)
  → Promoted to Blue ("Elite" tier)
  → +2,000 XP
  → Notification: "🎊 Blue Belt! You're now ELITE!"

Year 2+: Purple, Brown, Red, Gold
  - Belts require sustained excellence
  - Red Belt: ~2 years dedicated training
  - Gold Belt: Only top 5-10% of community
```

---

## Display & Psychology

**Frontend Display (Dashboard):**

```
┌─────────────────────────────┐
│  Belt Progression           │
├─────────────────────────────┤
│                             │
│  Current: Blue Belt  🔵     │
│  Earned: April 10, 2026    │
│                             │
│  Next Goal: Purple Belt     │
│  ▓▓▓▓▓░░░░ 57% progress    │
│  (Need OLY Index 700)       │
│                             │
│  Your OLY Index: 645/700   │
│  Still need: 55 points      │
│                             │
└─────────────────────────────┘
```

**Psychology Benefits:**
1. **Visible aspiration** — See next belt immediately
2. **Measurable progress** — 57% toward next goal
3. **No punishment** — Current belt never lost
4. **Community respect** — Belt color signals status
5. **Lifetime achievement** — "I earned Gold Belt" is real

---

## Testing & Validation

**Unit Test Location:** `backend/__tests__/belt_engine.test.js`

**Test Cases:**
1. Promotion when all criteria met
2. No demotion (permanent progression)
3. XP reward per belt
4. Multiple athletes in different belts
5. Criteria combination (e.g., high OLY but low streak → no promotion)

---

**Next:** See [06_smart_streak_engine.md](./06_smart_streak_engine.md) for adherence tracking with comeback mechanics.
