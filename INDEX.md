# HolyOly Extraction: Complete Documentation Index

**Status:** ✅ All 3 major systems extracted and documented  
**Date:** 2026-04-10  
**Total Files:** 34 markdown + data files  
**Total Documentation:** ~10,200 lines

---

## Quick Navigation

### 📊 [ENGINES/](./engines/) — 22 Computational Systems
**Architecture, logic, and integration of all training engines**

- **README.md** — Master architecture with dependency graphs
- **01_stress_engine.md** — Banister Fitness-Fatigue model
- **02_session_adaptation_engine.md** — Risk-based session modification
- **03_macrocycle_engine.md** — 23 standardized training programs
- **04_gamification_engine.md** — XP, levels, clubs, streaks
- **05_belt_engine.md** — 9-belt progression system
- **06_smart_streak_engine.md** — Adherence tracking + comebacks
- **07_bw_milestone_engine.md** — Body weight relative achievements
- **08_warmup_engine.md** — Readiness-aware warmup protocols
- **09_pulse_engine.md** — Gamified conditioning challenges (EMOM, For Time)
- **10_balance_engine.md** — Exercise ratio enforcement
- **11_oly_index_engine.md** — Competitive strength ranking
- **12_lifestyle_engine.md** — Daily load factor modeling
- **13_hormonal_engine.md** — Menstrual cycle periodization
- **14_smart_coach_engine.md** — Athlete intelligence categorization
- **15_pildoras_engine.md** — Context-aware daily coaching tips
- **16_social_engine.md** — Shareable athletic cards
- **17_golden_ratio_engine.md** — Lift ratio tracking & rewards
- **18_theme_engine.md** — Visual customization system
- **19_privacy_engine.md** — Data access control
- **20_readiness_cache_service.md** — Readiness caching (O(90)→O(1))
- **21_leaderboard_cache_service.md** — Leaderboard caching (O(n log n)→O(1))
- **22_imr_engine.md** — Intensity Maintenance Ratio (IMR) y cruce con Macrociclos
- **EXTRACTION_COMPLETE.md** — Meta documentation

**Key Insights:**
- Stress Engine uses Banister model (7-day fatigue EMA, 28-day fitness EMA)
- Session Adaptation uses complexity × CNS scoring for risk assessment
- 4 risk zones: GREEN (0-25), YELLOW (26-50), ORANGE (51-75), RED (76-100)
- 19 engines integrate via cron jobs (5min/1h/24h/weekly schedules)

---

### 🏋️ [MACROCYCLES/](./macrocycles/) — 19 Training Programs
**1,236+ canonical sessions from 9 weightlifting schools**

- **README.md** — Master index of all 19 programs
- **EXTRACTION_INDEX.md** — Catalog with metadata
- **RAW_SOURCES/** — 19 original .txt files with week-by-week sessions

**Programs by School:**
- Bulgarian: 1 program (6d/week, daily maxes)
- Russian: 1 program (5d/week, waviness)
- Cuban: 5 programs (2-5d/week, novice to competition)
- Chinese: 1 program (5d/week, high reps)
- Korean: 2 programs (5-6d/week, technical focus)
- Colombian: 1 program (5d/week, balanced)
- Polish: 2 programs (4-5d/week, periodized)
- Ukrainian: 2 programs (3-4d/week, minimal frequency)
- Modern Hybrid: 4 programs (3-5d/week, flexible)

**Total Sessions:** ~1,236 across 254 weeks  
**Periodization:** Prep → Strength → Power → Peaking (typical)

---

### 💪 [EXERCISES/](./exercises/) — 49 Exercises + 48 Substitution Chains
**Complete exercise database with complexity ratings and degradation paths**

- **README.md** — All 49 exercises with properties
- **SUBSTITUTION_CHAINS.md** — Complete mapping of 48 chains
- **EXTRACTION_COMPLETE.md** — Implementation guide

**Exercise Families:**
- Snatch: 12 variants (complexity 4-10, CNS 3-10)
- Clean & Jerk: 15 variants (complexity 3-9, CNS 3-10)
- Pulls & Deadlifts: 6 variants (complexity 2-3, CNS 2-6)
- Squats: 5 variants (complexity 1-6, CNS 4-7)
- Press: 3 variants (complexity 1-5, CNS 3-4)
- Row: 1 variant (complexity 1, CNS 2)
- Accessories: 5 variants (complexity 1, CNS 2)
- Activation/Conditioning: 2 variants (complexity 1, CNS 1-2)

**Substitution Logic:**
- 48 total chains organized by family
- Level 1 (mild): Reduce intensity ~5-15%
- Level 2 (moderate): Reduce intensity 15-30%, volume 0-20%
- Level 3 (heavy): Reduce intensity 30-40%, major simplification

---

## Integration Map

```
┌─────────────────────────────────────────────────────────────┐
│                    HOLY OLY EXTRACTION                      │
└─────────────────────────────────────────────────────────────┘

ENGINES (Logic Layer)
  ├─ Stress Engine
  │   └─ Calculates: fitness, fatigue, readiness (Banister)
  │
  ├─ Session Adaptation Engine
  │   └─ Uses: Exercise complexity + CNS → Risk score
  │   └─ Suggests: Substitution chains at risk levels
  │
  ├─ Macrocycle Engine
  │   └─ Selects from: 19 programs, 23 variants
  │   └─ Generates: Weekly sessions with exercises
  │
  └─ Gamification Engine
      └─ Rewards: XP, belts, streaks, milestones

         ↓

MACROCYCLES (Program Layer)
  ├─ 19 standardized programs
  ├─ 254 weeks of training
  ├─ 1,236+ canonical sessions
  └─ Week-by-week structure with periodization

         ↓

EXERCISES (Data Layer)
  ├─ 49 standardized exercises
  ├─ Complexity ratings (1-10)
  ├─ CNS demand ratings (1-10)
  └─ 48 substitution chains for adaptation
```

---

## How to Use This Documentation

### For Understanding
1. Start with **ENGINES/README.md** (understand what systems exist)
2. Then read **MACROCYCLES/README.md** (understand training structure)
3. Then read **EXERCISES/README.md** (understand exercise data)
4. Reference specific engines/programs as needed

### For Implementation
1. Create database schema from extracted specifications
2. Seed exercises from EXERCISES/README.md table
3. Seed substitutions from EXERCISES/SUBSTITUTION_CHAINS.md
4. Implement engines in priority order (Stress → Adaptation → Macrocycle)
5. Build macrocycle parser to load 19 programs
6. Connect everything with tests

### For Validation
- Each folder has EXTRACTION_COMPLETE.md with validation checklists
- Test cases provided for major systems
- Integration points documented

---

## Key Statistics

| Component | Count | Details |
|-----------|-------|---------|
| **Engines** | 22 | 20 + 2 cache services |
| **Programs** | 19 | From 9 schools, 8-16 weeks each |
| **Sessions** | ~1,236 | Canonical exercises per program |
| **Exercises** | 49 | Across 7 families |
| **Complexity** | 1-10 | Scale for technical demand |
| **CNS Demand** | 1-10 | Scale for nervous system tax |
| **Substitutions** | 48 | Degradation chains |
| **Risk Zones** | 4 | Green/Yellow/Orange/Red |
| **Degradation Levels** | 3 | Mild/Moderate/Heavy |
| **Cron Schedules** | 4 | Every 5min/1h/24h/weekly |

---

## File Organization

```
EXTRACTION/
├── INDEX.md (you are here)
│
├── engines/
│   ├── README.md
│   ├── 01_stress_engine.md
│   ├── 02_session_adaptation_engine.md
│   ├── 03_macrocycle_engine.md
│   ├── 04_gamification_engine.md
│   ├── 05_belt_engine.md
│   ├── 06_smart_streak_engine.md
│   ├── 07_bw_milestone_engine.md
│   ├── 08_warmup_engine.md
│   ├── 09_pulse_engine.md
│   ├── 10_balance_engine.md
│   ├── 11_oly_index_engine.md
│   ├── 12_lifestyle_engine.md
│   ├── 13_hormonal_engine.md
│   ├── 14_smart_coach_engine.md
│   ├── 15_pildoras_engine.md
│   ├── 16_social_engine.md
│   ├── 17_golden_ratio_engine.md
│   ├── 18_theme_engine.md
│   ├── 19_privacy_engine.md
│   ├── 20_readiness_cache_service.md
│   ├── 21_leaderboard_cache_service.md
│   ├── 22_imr_engine.md
│   └── EXTRACTION_COMPLETE.md
│
├── macrocycles/
│   ├── README.md
│   ├── EXTRACTION_INDEX.md
│   └── RAW_SOURCES/ (19 .txt files)
│
└── exercises/
    ├── README.md
    ├── SUBSTITUTION_CHAINS.md
    └── EXTRACTION_COMPLETE.md
```

---

## Quick Lookups

**"How is readiness calculated?"**  
→ `engines/01_stress_engine.md` — Banister model explanation

**"What programs are available?"**  
→ `macrocycles/README.md` — Table of 19 programs by school

**"How complex is the Snatch?"**  
→ `exercises/README.md` — Complexity/CNS ratings table

**"What do I substitute when readiness is low?"**  
→ `exercises/SUBSTITUTION_CHAINS.md` — All 48 chains with reasons

**"When do sessions get adapted?"**  
→ `engines/02_session_adaptation_engine.md` — Risk zones and triggers

**"How do I implement this?"**  
→ Each folder has EXTRACTION_COMPLETE.md with implementation guide

---

## Next Steps

### Ready For:
- [ ] Prisma schema implementation (use extracted schemas)
- [ ] Database seeding (all data provided)
- [ ] Unit testing (test cases in each EXTRACTION_COMPLETE.md)
- [ ] Integration testing (data flows documented)
- [ ] Frontend UI implementation (components listed)

### Future Work:
- Validation phase (logic review)
- UX/UI design (screen specifications)
- Clean rebuild (implementation from specs)
- Performance optimization (caching strategies documented)
- Deployment (Railway configuration)

---

## Source Information

**All files extracted from:**
- `backend/src/services/*.js` — Engine logic
- `backend/prisma/schema.prisma` — Data models
- `backend/prisma/seed.js` + `seed-adaptation.js` — Seeding data
- `_archive/escuelas con macrociclos/` — Original program files

**Extraction date:** 2026-04-10  
**Total size:** ~1.5MB documentation  
**Format:** Markdown + metadata tables  
**Ready for:** Implementation and validation

---

## Contact

For questions about specific systems:
1. Check the relevant folder's README.md
2. Check EXTRACTION_COMPLETE.md in that folder
3. Check section "Questions During Implementation?" at end of each file

All specifications are self-contained and ready for rebuild.

---

**Last Updated:** 2026-04-10  
**Version:** 1.0 (Extraction Complete)  
**Status:** ✅ Ready for implementation
