# HolyOly Engine Architecture

**19 Computational Engines** powering the intelligent coaching system.

---

## Table of Contents

1. [Core Engines](#core-engines) — Stress, Session Adaptation, Macrocycles
2. [Athlete Development](#athlete-development) — Gamification, Belt, Streak, BW Milestones
3. [Training Optimization](#training-optimization) — Warmup, Pulse, Balance, OLY Index
4. [Lifestyle & Recovery](#lifestyle--recovery) — Lifestyle Profile, Hormonal Periodization
5. [Insights & Social](#insights--social) — Smart Coach, Píldoras, Social, Golden Ratio
6. [User Experience](#user-experience) — Theme, Privacy, Cache, Readiness

---

## Core Engines

### 1. Stress Engine (Readiness Calculator)
**File:** `01_stress_engine.md`  
**Purpose:** Calculate athlete readiness using Banister Fitness-Fatigue model  
**Input:** Training load (sets × reps × weight × RPE), historical data (90 days)  
**Output:** `{fitness, fatigue, readiness, projection}`  
**Key Formula:** EMA(7-day fatigue) - EMA(28-day fitness) = readiness  
**Connects to:** Session Adaptation, Smart Coach, Readiness Cache  
**Update Frequency:** Daily (00:30 UTC cron)

---

### 2. Session Adaptation Engine
**File:** `02_session_adaptation_engine.md`  
**Purpose:** Adjust or block sessions based on athlete readiness & risk  
**Input:** Current session, athlete readiness, recent compliance, PRs  
**Output:** `{approved, modified_session, risk_score, substitutions}`  
**Key Metrics:** Risk = (low_readiness + low_compliance + high_load) / 3  
**Connects to:** Stress Engine, Balance Engine, Smart Coach  
**Update Frequency:** On-demand (athlete pre-check)

---

### 3. Macrocycle Engine
**File:** `03_macrocycle_engine.md`  
**Purpose:** Manage 23 standardized training programs from 9 schools  
**Input:** Athlete profile (level, goal, max, BW), duration (4-20 weeks)  
**Output:** `{macrocycle_id, weeks[], sessions[], weekly_themes}`  
**Data Source:** `/archive/escuelas con macrociclos/` (1,236 canonical sessions)  
**Connects to:** Balance Engine (exercise ratios), OLY Index (target metrics)  
**Update Frequency:** Manual (coach assigns)

---

## Athlete Development

### 4. Gamification Engine (XP, Levels, Clubs)
**File:** `04_gamification_engine.md`  
**Purpose:** Track XP, levels, shields, and total clubs  
**Input:** Session completion, PRs, streaks, shields  
**Output:** `{xp, level, level_name, clubs_joined, shields}`  
**Reward Table:** Session (+100 XP) → Week (+300) → Streak 7d (+200) → Club (+1000)  
**Connects to:** Leaderboard Cache (rankings), Smart Streak (comebacks)  
**Update Frequency:** Real-time

---

### 5. Belt System
**File:** `05_belt_engine.md`  
**Purpose:** Progressive gamification ranking (white → red → gold)  
**Input:** XP milestones, training consistency  
**Output:** `{belt_color, belt_name, xp_to_next_belt}`  
**Belt Progression:** White (0) → Yellow (20k) → Orange (40k) → Green (60k) → Blue (80k) → Purple (100k) → Brown (130k) → Red (160k) → Gold (200k+)  
**Connects to:** Gamification Engine (XP tracking)  
**Update Frequency:** Real-time

---

### 6. Smart Streak Engine (Adherence + Comebacks)
**File:** `06_smart_streak_engine.md`  
**Purpose:** Track training consistency with intelligent comeback mechanics  
**Input:** Daily session completion, status (completed/skipped/pending)  
**Output:** `{current_streak, longest_streak, freezes_used, comeback_eligible}`  
**Features:** Streak freeze (1/month), comeback (missed day = -1 only, not full reset)  
**Connects to:** Gamification Engine (streak XP bonus)  
**Update Frequency:** Daily

---

### 7. BW Milestone Engine (Body Weight Achievements)
**File:** `07_bw_milestone_engine.md`  
**Purpose:** Track body weight-relative achievements (snatch/CJ at specific BW)  
**Input:** Athlete BW, current lifts (snatch, CJ, FS, BS)  
**Output:** `{milestone_type, achievement, xp_reward, next_milestone}`  
**Milestone Types:** "Snatch at 0.8×BW", "CJ at 1.0×BW", etc.  
**Connects to:** Gamification Engine (XP), Golden Ratio (ratio tracking)  
**Update Frequency:** On PR unlock

---

## Training Optimization

### 8. Warmup Engine (Adaptive Protocol)
**File:** `08_warmup_engine.md`  
**Purpose:** Generate position-specific warmup protocols  
**Input:** Athlete readiness, target exercise (snatch/clean/squat), time available  
**Output:** `{exercises[], sets[], reps[], notes[]}`  
**Adaptation:** Low readiness → longer warmup + mobility; High readiness → brief + technical  
**Connects to:** Stress Engine (readiness)  
**Update Frequency:** Per-session (athlete requests)

---

### 9. Pulse Engine (Conditioning Challenges)
**File:** `09_pulse_engine.md`  
**Purpose:** Gamified conditioning challenges (EMOM, For Time, Complejos)  
**Input:** Athlete level, available time, recent performance  
**Output:** `{challenge_type, movements[], config{}, scoring}`  
**Challenge Types:** EMOM (Every Minute On the Minute), For Time (AMRAP), Complejos (chained lifts)  
**Connects to:** Gamification Engine (XP rewards)  
**Update Frequency:** Weekly

---

### 10. Balance Engine (Exercise Ratio Enforcement)
**File:** `10_balance_engine.md`  
**Purpose:** Maintain healthy exercise ratios (FS/BS, Sn/CJ, Pull/Push)  
**Input:** Current session exercises, historical ratios  
**Output:** `{is_balanced, ratio_analysis, suggested_adjustments}`  
**Target Ratios:** FS/BS = 0.7-0.9, Sn/CJ = 0.8-1.0, Pull/Push = 1.0-1.2  
**Connects to:** Session Adaptation (substitutions), Macrocycle (program design)  
**Update Frequency:** On session planning

---

### 11. OLY Index Engine (Competitive Strength Ranking)
**File:** `11_oly_index_engine.md`  
**Purpose:** Rank athletes by normalized strength (total × categories)  
**Input:** Snatch PR, Clean+Jerk PR, Body Weight  
**Output:** `{oly_index_score, ranking, percentile}`  
**Formula:** (Sn + CJ) / (BW × categories_factor)  
**Connects to:** Leaderboard Cache (global rankings)  
**Update Frequency:** On PR update

---

## Lifestyle & Recovery

### 12. Lifestyle Profile (Daily Load Factor)
**File:** `12_lifestyle_engine.md`  
**Purpose:** Model non-training stress (work, sleep, transport, family)  
**Input:** Daily log (work_hours, sleep_quality, stress_level, transport_mins)  
**Output:** `{daily_load_factor, cumulative_stress}`  
**Impact:** Reduces readiness if cumulative stress > 60  
**Connects to:** Stress Engine (affects fatigue calculation)  
**Update Frequency:** Daily (user-submitted)

---

### 13. Hormonal Periodization (Menstrual Cycle)
**File:** `13_hormonal_engine.md`  
**Purpose:** Adapt training for female athletes across 4 cycle phases  
**Input:** Cycle start date, cycle length (28-35 days), phase markers  
**Output:** `{current_phase, recommendations, load_adjustment}`  
**Phases:** Menstruation, Follicular, Ovulation, Luteal  
**Adjustments:** Follicular (↑ strength focus), Luteal (↑ recovery focus)  
**Connects to:** Session Adaptation, Smart Coach  
**Update Frequency:** Daily

---

## Insights & Social

### 14. Smart Coach Engine (Athlete Intelligence)
**File:** `14_smart_coach_engine.md`  
**Purpose:** Categorize athletes and generate batch coaching alerts  
**Input:** Athlete profile (age, training history, compliance, readiness trends)  
**Output:** `{athlete_category, alerts[], coaching_tips[]}`  
**Categories:** Novice, Progressing, Elite, Injured, Burnout-Risk  
**Alerts:** "Low readiness 3 days" → Suggest deload; "High consistency" → Increase intensity  
**Connects to:** Stress Engine, Lifestyle, Session Adaptation  
**Update Frequency:** Hourly

---

### 15. Píldoras Engine (Daily Coaching Tips)
**File:** `15_pildoras_engine.md`  
**Purpose:** Deliver context-aware daily tips  
**Input:** Athlete readiness, cycle phase, current mesocycle, goals  
**Output:** `{pill_type, content, relevance_score}`  
**Types:** Technique (video link), Recovery (sleep/nutrition), Mentality (motivation)  
**Connects to:** Gamification (XP for following tips)  
**Update Frequency:** Daily

---

### 16. Social Engine (Shareable Cards)
**File:** `16_social_engine.md`  
**Purpose:** Generate shareable athletic cards for Instagram/WhatsApp  
**Input:** Athlete name, PRs, milestones, streak, level  
**Output:** `{card_image_url, caption, hashtags}`  
**Types:** PR card, Club entry, Belt promotion, Streak milestone  
**Viral Mechanics:** Shared card shows friend's lift next to yours  
**Connects to:** Gamification (milestones)  
**Update Frequency:** On unlock

---

### 17. Golden Ratio Engine (Lift Ratio Tracking)
**File:** `17_golden_ratio_engine.md`  
**Purpose:** Track and reward "golden ratio" lift relationships  
**Input:** Snatch PR, CJ PR, FS PR, BS PR  
**Output:** `{ratios{}, proportion_score, xp_reward}`  
**Golden Ratios:** Sn = 0.8×CJ, FS = 0.85×BS, etc.  
**Achievement:** Unlock XP when ratio improves  
**Connects to:** Gamification (ratio XP), BW Milestones  
**Update Frequency:** On PR update

---

## User Experience

### 18. Theme Engine (Visual Customization)
**File:** `18_theme_engine.md`  
**Purpose:** Manage light/dark/sport-specific visual themes  
**Input:** User preference, time of day, device type  
**Output:** `{theme_name, colors, fonts}`  
**Themes:** Dark (default), Light, Olimpic (blue/yellow/red), Minimalist  
**Connects to:** Frontend (CSS variables injection)  
**Update Frequency:** User-toggled

---

### 19. Privacy Engine (Data Access Control)
**File:** `19_privacy_engine.md`  
**Purpose:** Manage what data coaches/athletes can see  
**Input:** User role, athlete preferences, relationship type  
**Output:** `{readable_fields, editable_fields, visible_screens}`  
**Tiers:** Solo (self only), Coached (coach + self), Club (club + team), Admin (all)  
**Connects to:** Backend authorization (route guards)  
**Update Frequency:** User-configured

---

## Supporting Services

### Readiness Cache Service
**File:** `20_readiness_cache_service.md`  
**Purpose:** Pre-calculate and store readiness (eliminates O(90) on-demand calc)  
**Input:** Stress Engine output (daily)  
**Output:** Cache table: `{athlete_id, date, fitness, fatigue, readiness}`  
**Query Performance:** O(1) lookup vs O(90) recalculation  
**Cron:** 00:30 UTC daily  

---

### Leaderboard Cache Service
**File:** `21_leaderboard_cache_service.md`  
**Purpose:** Pre-calculate and store rankings (eliminates O(n log n) sorting)  
**Input:** OLY Index scores, Gamification XP (daily)  
**Output:** Cache table: `{club_id, athlete_id, rank, xp, streak}`  
**Query Performance:** O(1) lookup vs O(n log n) sort  
**Cron:** 01:00 UTC daily  

---

## Next Steps

Continue to individual engine documentation files:
- [01_stress_engine.md](./01_stress_engine.md) — Banister model, readiness calculation
- [02_session_adaptation_engine.md](./02_session_adaptation_engine.md) — Risk scoring, session modifications
- [03_macrocycle_engine.md](./03_macrocycle_engine.md) — 23 standardized programs
- ... (see file organization below)

