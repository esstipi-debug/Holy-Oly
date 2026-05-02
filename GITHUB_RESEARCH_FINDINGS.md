# GitHub Research — Repos Utiles para HolyOly / Volta

**Buscado:** 2026-04-30
**Criterio:** Open source, MIT license, activos en 2025-2026, relevantes para nuestro stack

---

## Top Repos Encontrados

### 1. FastAPI Boilerplates (Backend)

| Repo | ⭐ | Qué nos sirve | Prioridad |
|------|-----|---------------|-----------|
| [teamhide/fastapi-boilerplate](https://github.com/teamhide/fastapi-boilerplate) | 1482 | Async SQLAlchemy, custom user class, permisos, Celery, Docker | 🔴 ALTA |
| [akhil2308/fastapi-large-app-template](https://github.com/akhil2308/fastapi-large-app-template) | 18 | JWT auth, rate limiting con Redis, OpenTelemetry, Prometheus + Grafana | 🟡 MEDIA |
| [eslam5464/Fastapi-Template](https://github.com/eslam5464/Fastapi-Template) | 66 | JWT, PostgreSQL, Alembic, Celery Beat, Resend/Brevo email, Firebase | 🟡 MEDIA |

**Que podemos copiar de estos:**
- `teamhide`: Custom user class con automatic JWT decode → simplifica nuestro auth
- `akhil2308`: Rate limiting con Redis + fail-open pattern → mejor que el nuestro en memoria
- `eslam5464`: Celery Beat scheduler → alternativa a APScheduler si necesitamos distribuir

### 2. SaaS Boilerplates (Frontend + Full Stack)

| Repo | ⭐ | Stack | Qué nos sirve |
|------|-----|-------|---------------|
| [saasyachtclub/saas-boiler](https://github.com/saasyachtclub/saas-boiler) | - | Next.js 15 + React 19 + TS + Better Auth + Stripe + Neon PG | PostHog + Resend ya integrados, landing pages, dashboard |
| [MazBenOscar/launchloop](https://github.com/MazBenOscar/launchloop) | - | Next.js + Prisma + Clerk + Stripe + Resend + Make/n8n | MicroSaaS completo, email sequences, billing |
| [wasp-lang/open-saas](https://github.com/wasp-lang/open-saas) | - | React + NodeJS + Prisma + Wasp | Auth, email, background jobs, AI-ready con AGENTS.md |

**Recomendacion:** Usar `saas-boiler` como base del frontend si queremos ir rapido. Tiene PostHog y Resend ya configurados.

### 3. Auth Engine (IAM)

| Repo | ⭐ | Features |
|------|-----|----------|
| [Q-Niranjan/auth-engine](https://github.com/Q-Niranjan/auth-engine) | - | JWT, Magic Links, TOTP/MFA, WebAuthn/Passkeys, OAuth 2.0, OIDC Provider, multi-tenant |

**Nota:** Ya deployado en Render. Podriamos usarlo como servicio separado si queremos auth mas robusto.

### 4. Herramientas Especificas que Necesitamos

| Necesidad | Repo/Tool | Costo |
|-----------|-----------|-------|
| Email transactional | Resend (ya integrado) | 3,000/mo gratis |
| Analytics | PostHog Cloud | 1M eventos/mo gratis |
| Background jobs | Celery + Redis o APScheduler | Gratis |
| Rate limiting | slowapi (FastAPI) o Redis-backed | Gratis |
| CI/CD | GitHub Actions | 2,000 min/mo gratis |
| Monitoring | OpenTelemetry + Prometheus + Grafana | Gratis (self-hosted) |
| Error tracking | Sentry | 5,000 errores/mo gratis |
| Payments | Stripe | Solo % por transaccion |
| Payments (Chile) | Lemon Squeezy + Flow | % por transaccion |

---

## Plan de Integracion

### Fase 1 (Inmediato)
- [ ] Copiar `slowapi` para rate limiting mejorado desde `akhil2308` template
- [ ] Usar estructura de custom user class de `teamhide` para simplificar auth
- [ ] Agregar Sentry para error tracking (gratis)

### Fase 2 (Cuando empecemos frontend)
- [ ] Evaluar `saas-boiler` como base del frontend React
- [ ] Integrar PostHog para analytics (ya tiene free tier generoso)
- [ ] Usar landing pages del boilerplate para holyoly.com

### Fase 3 (Cuando escalemos)
- [ ] Considerar `auth-engine` si necesitamos OIDC para multi-app
- [ ] OpenTelemetry para observabilidad
- [ ] Prometheus + Grafana dashboards

---

## Como el GitHub Research Agent lo usa automaticamente

El agente tiene estos metodos:

```python
researcher = GitHubResearcher()

# Buscar repos para un problema especifico
repos = await researcher.search_repos("fastapi rate limiting", language="python", stars_min=100)

# Buscar librerias para una tarea
libs = await researcher.find_library("send transactional emails")

# Buscar workflows de CI/CD
workflows = await researcher.find_workflow_examples("deploy_render")

# Ver trending
trending = await researcher.search_trending("python", since="weekly")
```

**Cuando se ejecuta automaticamente:**
- El **Test Agent** busca soluciones si un test falla repetidamente
- El **Growth Agent** busca herramientas de marketing/analytics nuevas
- El **Security Agent** busca vulnerabilidades conocidas en nuestras dependencias
- Cualquier agente puede llamar `get_researcher()` cuando no sabe como resolver algo
