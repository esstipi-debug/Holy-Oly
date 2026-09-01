# 🏋️ HolyOly — Smart Training Platform

**HolyOly** is an application designed to manage **Weightlifting** training. 

### 🎯 Main Purpose
*   **Coach side:** Manage multiple athletes and their training sessions efficiently.
*   **Athlete side:** Look after fatigue levels and gauge the body's stress in order to optimize performance and avoid burnout.

**Core Philosophy (Damage Control):** We know nobody is perfect and that most users are not professional athletes. They want to live a good, balanced life and enjoy it. *That is why we look after them*. Peak Qual is not a punitive system and does not blame the athlete; its artificial intelligence applies an empathetic "damage control" to bring the user back and adapt the prescription when life (stress, parties, tiredness) gets in the way of training.

**Tagline:** *Smart training, zero burnout.*

---

## 🏋️ What Is Weightlifting?

**Weightlifting** means Olympic weightlifting: it consists of lifting the maximum possible weight with a barbell and plates from the floor to overhead, with the arms extended, under the strict rules of the IWF (International Weightlifting Federation).

It has been an Olympic sport since 1896. It develops strength, power, speed and coordination. **It is not powerlifting** (which focuses only on the squat, bench press and deadlift).

### Main Lifts
*   **Snatch:** A single fluid movement. Wide grip, explosive pull from the floor, fast drop under the bar into an overhead squat, and a final extension. It is the most technical lift (~80% of the clean & jerk load).
*   **Clean & Jerk:** Split into two phases.
    1.  **Clean:** Medium grip, bring the bar up to the shoulders (rack position) in a front squat and stand up.
    2.  **Jerk:** Drive from the shoulders to overhead with a dip-and-drive movement.

### Training Characteristics
*   **Frequency:** Typically 3-5 days/week.
*   **Focus:** Technique, explosive strength and mobility.
*   **Priority:** Having a coach is essential to ensure correct technique and avoid injuries.
*   **Effort:** Both lifts prioritize the lower body (approx. 70% of the effort). A common mistake is the lack of full hip extension in the pull.

In competition, each athlete has 3 attempts per lift; the best of each is added together for the Olympic total.

---

## 📊 Project Status

| Metric | Status |
|---------|--------|
| **Phase** | 2 — High-Fidelity UI (Google Stitch) |
| **Screens** | Base wireframes complete (21/27). Critical UI screens built in `stitch_holy_oly_saas/` |
| **Engines** | 21 specified, ready for Phase 3 (Prisma/Node) |
| **Stack** | React + Vite + Tailwind (frontend) · Node.js + Express + Prisma (backend) |
| **DB** | PostgreSQL · ~60 models · 150+ queries |

---

## 🎯 How to Use This Repo

### For a new session / new terminal:

```bash
# Clone
git clone https://github.com/esstipi-debug/Holy-Oly.git
cd "Holy Oly 001"

# View current memory (full context)
cat MEMORY.md

# View work plan
cat PLAN.md

# Open wireframes in the browser
cd wireframes && open index.html
```

### Structure:
```
Holy Oly 001/
├── MEMORY.md                 ← Current context (what we did, where we are going)
├── PLAN.md                   ← Detailed roadmap
├── INDEX.md                  ← Engine and model specifications
├── wireframes/               ← Interactive HTML (21/27 completed)
│   ├── index.html           ← Navigator with current status
│   ├── A1_A2_A3_auth.html   ← Auth flows (login, register, forgot pass)
│   ├── B1_dashboard_atleta.html
│   ├── B3_injury_shield.html
│   ├── B6_active_session.html
│   ├── B7_B8_victory_screen.html  ← 4 interactive themes
│   ├── B9_social_card.html        ← Social card generator
│   ├── B10_performance_deep_dive.html
│   ├── B15_perfil_atleta.html
│   ├── C1_command_center_coach.html
│   ├── C4_athlete_deep_dive.html
│   ├── C5_C6_add_athlete_assign_macro.html
│   ├── D1_onboarding_atleta.html
│   └── D2_free_premium_transition.html
├── engines/                  ← Specifications of the 21 engines
├── exercises/                ← Base of 49 exercises + substitutions
├── macrocycles/              ← 19 programs from 9 schools
└── ux/                       ← Complete UX documents
```

---

## 🚀 Development Workflow

### 1. **Before starting a session:**
```bash
git pull                    # Sync memory
cat MEMORY.md               # Read where we left off
cat PLAN.md                 # View next steps
```

### 2. **During the session:**
- Build wireframes → Update `wireframes/index.html`
- Make decisions → Note them in MEMORY.md
- Complete milestones → Incremental commit

### 3. **At the end of the session:**
```bash
# MEMORY.md is updated automatically with:
# - Screens completed today
# - Next 3 screens to do
# - Decisions and scope changes
# - Link to new wireframes

git add .
git commit -m "Phase 1: 21/27 wireframes · [description]"
git push
```

---

## 🔧 Confirmed Tech Stack

| Layer | Tech | Notes |
|------|------|-------|
| Frontend | React 18 + Vite + Tailwind CSS | SPA, 369KB JS gzip |
| State | React Context API | No Redux for now |
| Backend | Node.js + Express | Monolithic async/await |
| ORM | Prisma (schema-first) | ~60 models |
| DB | PostgreSQL | 150+ query patterns |
| Auth | JWT + refresh rotation | bcryptjs, 3 roles |
| Jobs | Cron jobs | 4 schedules: 5m/1h/24h/weekly |
| Cache | DB tables (no Redis) | Readiness O(90)→O(1) |

---

## 📋 The 21 Engines

**P1 (Phase 3 backend):**
- Stress Engine (Banister: Fitness-Fatigue-Readiness)
- Session Adaptation (Risk Score 0-100)
- Macrocycle Engine (19 programs)

**P2 (Phase 4):**
- Gamification, Belt System, Smart Streak, Warmup Engine, Privacy Engine, Readiness Cache

**P3 (Phase 5):**
- Balance, OLY Index, Lifestyle, Hormonal, Smart Coach, Píldoras, Golden Ratio, Leaderboard Cache

**P4 (Phase 5+):**
- Theme Engine, Social Engine, Pulse Engine, BW Milestone

---

## 💰 B2B2C Business Model

| Role | Plan | Price | Features |
|-----|------|--------|----------|
| **Coach** | Premium | $29/mo | Unlimited teams, all engines, AI |
| **Athlete w/ Coach** | Freemium → Elite | Free + $12 | Engines active, 45-day Elite Trial |
| **Athlete without Coach** | Free | $0 | Sign-up + basic history (sterile) |

**Trial:** 45 days of Elite free (activated when invited by a coach)

---

## 🎨 Product Decisions (Confirmed 2026-04-15)

| # | Decision | ✅ Choice |
|---|----------|-----------|
| D1 | Onboarding without a coach | Open sign-up → link a coach later |
| D2 | Initial macrocycle | Coach assigns it in the sign-up form |
| D3 | Payment model | Coach always pays Premium · Athlete is Freemium if they have a coach |
| D4 | Messaging | ❌ No chat, no video. Removed from the flows. |
| D5 | Athlete nav | Bottom nav: Dashboard / Session / Progress / Profile |

---

## 🎯 Next 6 Screens (Phase 1 final)

- **B4**: Session Summary (post-session wrap-up)
- **B5**: Warmup Generator (pre-session protocol)
- **B11**: OLY Index (normalized competitive ranking)
- **B12/B13**: Pulse Hub + Cockpit (EMOM/AMRAP challenges)
- **B14**: Píldoras / Stories (contextual daily tips)
- **C7/C8/C9**: Pulse Approval · Longevity Leaderboard · Coach Profile

---

## 📞 Contact / FAQ

**How do I view the wireframes?**
→ Open `wireframes/index.html` in the browser (they are all HTML + Tailwind, clickable)

**How do I contribute?**
→ Create a branch, make your changes, open a PR. The wireframes are plain static HTML, with no dependencies.

**When does the backend start?**
→ Phase 3, after validating ALL wireframes with stakeholders.

**Where is the DB?**
→ `INDEX.md` has the full Prisma schema (60 models).

---

**Last updated:** 2026-04-16 — Branch `main`  
**Created by:** Claude Code · HolyOly Development
