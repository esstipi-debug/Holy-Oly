# HolyOly — Cursor Project Context

**Created:** 2026-05-02
**Last Updated:** 2026-05-02

---

## 1. Project Overview

**HolyOly** is a smart training platform for Olympic Weightlifting (Halterofilia).
**Volta** is the same ecosystem but for CrossFit.
**Peak Qual** is the parent brand.

**Tagline:** Smart training, zero burnout.

**Business Model:** B2B2C — Coaches pay $29/mo Premium, athletes are freemium (with coach) or limited (no coach). 45-day free trial.

**Current Status:** Phase 2 (UI/UX complete, backend API in development, Motor 25 agents built but not deployed).

---

## 2. Architecture

### Stack
| Layer | Technology | Status |
|---|---|---|
| **Frontend** | React + Vite + Tailwind CSS | Phase 2 (wireframes complete, components pending) |
| **Backend** | Python FastAPI | In development (src/ has engines, agents, RAG, auth) |
| **Database** | AlloyDB (PostgreSQL + pgvector) | Schema defined, not migrated |
| **AI/LLM** | Gemini 2.5 Flash Lite (+ MiniMax-M2.7 optional) | Configured but not in production |
| **Hosting** | Render (free tier) | render.yaml + GitHub Actions workflow ready |
| **Email** | Resend (3k emails/mo free) | Configured in Growth Agent |
| **Analytics** | PostHog (1M events/mo free) | Planned |
| **Payments** | Lemon Squeezy + Flow (Chile) | Planned |

### Project Structure
```
Holy Oly 001/
├── backend/src/           # FastAPI backend
│   ├── api/               # REST endpoints (auth, users, etc.)
│   ├── agents/            # Motor 25 — 5 autonomous agents
│   │   ├── budget.py      # Budget governance system
│   │   ├── base.py        # Base agent class
│   │   ├── github_researcher.py  # GitHub research tool
│   │   ├── router.py      # Agent endpoints
│   │   ├── response_agent/       # Lead capture & response
│   │   ├── growth_agent/         # Engagement, churn, A/B tests, emails
│   │   ├── security_agent/       # Vulnerability scanning
│   │   ├── test_agent/           # Post-deploy testing
│   │   └── content_agent/        # Social content generation
│   ├── coach/             # Coach-specific endpoints
│   ├── db/                # SQL schemas (agents_schema.sql, etc.)
│   ├── rag/               # RAG system with self-healing
│   ├── scheduler.py       # APScheduler for agent cron jobs
│   └── main.py            # FastAPI app entry point
├── frontend/              # React frontend (not yet initialized)
│   └── widget.js          # Webchat embeddable widget
├── engines/               # Engine specs (Stress, Session, Macrocycle, etc.)
├── ux/                    # UX decisions & flows
├── wireframes/            # 27 HTML wireframes (complete)
├── apps/                  # Alternative app structures (if any)
├── MEMORY.md              # Full project memory & decisions
├── MOTOR25_ARCHITECTURE.md  # Agent system architecture
└── STITCH_EXPORT.md       # Google Stitch design export
```

---

## 3. Motor 25 — Agentic AI System

### 5 Autonomous Agents
| Agent | Role | Schedule | Auto-Acts |
|---|---|---|---|
| **Response Agent** | Lead capture (email, webchat, IG, WhatsApp) + brand voice replies | 24/7 (webhook) | Yes (low risk) |
| **Growth Agent** | Trial reminders, win-back emails, engagement scoring, churn prediction, A/B tests | Daily 2am-10am | Yes (emails) |
| **Content Agent** | Daily tips (pildoras), weekly digest, social posts | Daily 9am / Mon 8am | No (drafts only) |
| **Security Agent** | Daily vuln scans + weekly full audit | 3am daily / 3am Sun | No (reports only) |
| **Test Agent** | Post-deploy endpoint/DB/security tests | On deploy | Yes (auto-fix) |

### Budget Governance (Long Cycle)
Agents DON'T self-fund automatically. Budget is approved by humans on a quarterly/annual cycle:

1. **LAUNCH** → Minimum budget ($12/mo total across all agents)
2. **OPERATION** → Agents work within limits, generate value
3. **REVIEW (Quarterly)** → Auto-generated ROI report → human approves/rejects adjustments
4. **CONSOLIDATION (Annual)** → Revenue determines next year's API budget (default 5% of revenue)

**Default LAUNCH budgets:**
| Agent | Monthly USD | Daily Tokens | Daily Emails |
|---|---|---|---|
| Response Agent | $5 | 5,000 | 10 |
| Growth Agent | $3 | 2,000 | 5 |
| Security Agent | $1 | 1,000 | 0 |
| Test Agent | $1 | 1,000 | 0 |
| Content Agent | $2 | 2,000 | 0 |

**API endpoints for budget:**
- `GET /api/v1/agents/budget` — Current status
- `GET /api/v1/agents/budget/report/pending` — Pending human approval report
- `POST /api/v1/agents/budget/report/generate` — Generate cycle report
- `POST /api/v1/agents/budget/approve` — Approve next cycle budgets
- `POST /api/v1/agents/budget/consolidate` — Annual consolidation

### Key Agent Files
- `backend/src/agents/budget.py` — BudgetManager, cycle configs, approval system
- `backend/src/agents/growth_agent/__init__.py` — Full growth agent (trial reminders, win-back, engagement, churn, A/B)
- `backend/src/agents/response_agent/email_handler.py` — Resend inbound + outbound
- `backend/src/agents/response_agent/response_generator.py` — Template + Gemini responses (budget-aware)
- `backend/src/scheduler.py` — APScheduler with keep-alive ping

---

## 4. Database

### Main Schema (20+ tables for agents)
- `leads`, `agent_conversations` — Response agent data
- `growth_experiments`, `growth_user_experiments` — A/B tests
- `user_engagement_scores`, `churn_predictions` — Growth analytics
- `email_logs`, `referrals` — Email tracking
- `security_scans`, `security_alerts` — Security data
- `test_runs`, `test_results` — Test history
- `content_schedule` — Content calendar
- `agent_decisions` — All agent decisions
- `agent_spending` — Budget tracking

SQL schema: `backend/src/db/agents_schema.sql`

---

## 5. Current State & What's Done

### ✅ Completed
- [x] 27 HTML wireframes (Phase 1.5 complete)
- [x] STITCH_EXPORT.md for Google Stitch
- [x] 20 UX decisions signed off
- [x] Motor 25 agent architecture (MOTOR25_ARCHITECTURE.md)
- [x] 5 agent modules with working code
- [x] Budget governance system (long cycle)
- [x] APScheduler with cron jobs + Render keep-alive
- [x] GitHub Actions Render deploy workflow
- [x] Render configuration (render.yaml, .env.render)
- [x] Webchat widget (frontend/widget.js)
- [x] Response Agent (email + webchat + intent classifier)
- [x] Growth Agent (trial reminders, win-back, engagement, churn, A/B tests)
- [x] Security Agent (daily/weekly scan framework)
- [x] Content Agent (daily tips, weekly digest)
- [x] Test Agent (post-deploy test framework)
- [x] GitHub Researcher (agents can search for tools/solutions)
- [x] Agent status & budget API endpoints

### 🔄 In Progress
- [ ] React frontend setup (Vite + Tailwind)
- [ ] Connect frontend to backend API
- [ ] Database migration (AlloyDB)
- [ ] Resend + PostHog configuration
- [ ] Meta Developer / WhatsApp Business setup for IG/WhatsApp webhooks

### ⏳ Next
- [ ] Deploy backend to Render
- [ ] Test agents live with real data
- [ ] Build React app from wireframes
- [ ] Launch landing page with webchat widget

---

## 6. Key Decisions & Constraints

### Decisions
- Render for hosting (not Google Cloud Run) — free tier
- Gemini 2.5 Flash Lite as primary LLM — same quality as paid, $2.50/mo for 100 users
- Budget governance is human-approved, not auto-scaling — aligns API spend with real revenue
- Agents auto-act on LOW risk only — consult human on MEDIUM/HIGH
- Instagram/WhatsApp/TikTok webhooks are code-ready but pending account setup
- NO chat in-app, NO video analysis — explicit product decision
- HealthKit/Health Connect for nutrition — no direct third-party API integrations

### Constraints
- Free tier everything until revenue justifies upgrades
- Chile-first market (CLP pricing, local payment processors)
- B2B2C model — coaches are the paying customers
- 45-day trial for athletes invited by coaches

---

## 7. Environment Variables

```env
# Required
DATABASE_URL=postgresql://user:pass@host:5432/holyoly
GOOGLE_API_KEY=your_gemini_api_key
RESEND_API_KEY=your_resend_key
JWT_SECRET=your_jwt_secret
GITHUB_TOKEN=your_github_token  # for researcher (optional)

# Optional
RENDER_EXTERNAL_URL=https://your-app.onrender.com
POSTHOG_API_KEY=your_posthog_key
CORS_ORIGINS=https://holyoly.com,http://localhost:5173
```

---

## 8. How to Run

### Backend
```bash
cd backend
python -m uvicorn src.main:app --reload --port 8000
```

### Frontend (when created)
```bash
cd frontend
npm install
npm run dev
```

### Webchat Widget (embed)
```html
<script src="https://holyoly.com/widget.js" data-channel-id="YOUR_ID"></script>
```

### Deploy
```bash
git push origin main  # triggers .github/workflows/render-deploy.yml
```

---

## 9. Useful URLs

- **API Docs:** http://localhost:8000/docs
- **Agent Status:** /api/v1/agents/status
- **Budget Status:** /api/v1/agents/budget
- **Health Check:** /health
- **Webchat:** /api/v1/webchat/message

---

## 10. Notes for Cursor

- This project is transitioning from Phase 1 (UX/UI) to Phase 2 (Frontend implementation) and Phase 3 (Backend integration).
- The Motor 25 agent system is fully coded but not yet deployed — it's the priority differentiator.
- Budget system prevents runaway API costs — agents can't spend without human approval.
- All agents use `BaseAgent` from `agents/base.py` — follow that pattern for new agents.
- Use `backend/src/db/agents_schema.sql` for database migrations.
- The webchat widget (`frontend/widget.js`) is standalone and can be embedded on any site.
- Gemini client should be lazily initialized — not all features need it.
- Render free tier spins down after 15 min of inactivity — keep-alive pings every 5 min.
