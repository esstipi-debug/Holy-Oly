# Motor 25 — Agentic AI Ecosystem: Peak Qual Sales Engine

**Objetivo:** Que HolyOly (halterofilia) y Volta (crossfit) se vendan solos mediante agentes IA proactivos que testean, corrigen, monitorizan, responden leads y cierran ventas en todos los canales.

**Estado:** Arquitectura v1 — lista para implementación

---

## 1. Visión General

No es un solo agente. Son **5 agentes especializados** que trabajan en paralelo:

| Agente | Rol | Trigger | Frecuencia |
|--------|-----|---------|------------|
| **Test Agent** | Testea código, verifica deploys, valida endpoints | Push a main | Cada deploy |
| **Security Agent** | Verifica seguridad, auth, rate limits, CORS | Diario/semanal | 2AM diario + domingo semanal |
| **Growth Agent** | Pricing, A/B tests, churn, emails, referrals | Continuo | Jobs cada hora |
| **Response Agent** | Responde mensajes de IG, WhatsApp, TikTok, email, web | Evento en tiempo real | <3 segundos |
| **Content Agent** | Genera posts, stories, cards virales, píldoras | Diario | 9AM diario |

Todos comparten:
- **Gemini 2.5 Flash Lite** como cerebro (ya en stack)
- **PostgreSQL** como memoria compartida
- **FastAPI** como runtime
- **Render** como hosting

---

## 2. Dónde vive cada agente en el repo

```
backend/src/
├── agents/                          ← NUEVO: directorio de agentes
│   ├── __init__.py
│   ├── base.py                      ← Clase base: todos los agentes heredan
│   │                                │   (logging, error handling, decision log)
│   │
│   ├── test_agent/                  ← Test Agent
│   │   ├── __init__.py
│   │   ├── runner.py                ← Ejecuta tests post-deploy
│   │   ├── api_tests.py             ← Tests de endpoints HTTP
│   │   ├── platform_tests.py        ← Tests multiplataforma (mobile/desktop)
│   │   └── report.py                ← Genera report de resultados
│   │
│   ├── security_agent/              ← Security Agent
│   │   ├── __init__.py
│   │   ├── scanner.py               ← Escanea: CORS, auth, rate limits, SQLi
│   │   ├── auth_audit.py            ← Verifica JWT, token expiry, permisos
│   │   ├── weekly_report.py         ← Report semanal de seguridad
│   │   └── alerts.py                ← Alertas si encuentra vulnerabilidad
│   │
│   ├── growth_agent/                ← Growth Agent
│   │   ├── __init__.py
│   │   ├── engagement.py            ← Engagement score 0-100
│   │   ├── churn.py                 ← Predicción churn
│   │   ├── pricing.py               ← Dynamic pricing (Gemini)
│   │   ├── experiments.py           ← A/B test framework
│   │   ├── referrals.py             ← Referral system
│   │   ├── email_campaigns.py       ← Secuencias trial/winback/upsell
│   │   └── email_service.py         ← Resend API wrapper
│   │
│   ├── response_agent/              ← Response Agent (multi-canal)
│   │   ├── __init__.py
│   │   ├── router.py                ← Webhook router: recibe de todos los canales
│   │   ├── instagram.py             ← IG comments → DM automation (Meta API)
│   │   ├── whatsapp.py              ← WhatsApp Business API (free: 1000 svc/mo)
│   │   ├── tiktok.py                ← TikTok comments webhook
│   │   ├── email_inbound.py         ← Resend inbound email handler
│   │   ├── webchat.py               ← Widget web en holyoly.com
│   │   ├── intent_classifier.py     ← Gemini: clasifica intención del mensaje
│   │   ├── response_generator.py    ← Gemini: genera respuesta con voz de marca
│   │   └── lead_capture.py          ← Captura lead en DB, asigna score
│   │
│   └── content_agent/               ← Content Agent
│       ├── __init__.py
│       ├── viral_card.py            ← Genera cards para social (ya existe B9)
│       ├── pilodoras.py             ← Tips diarios (+50 XP)
│       ├── social_posts.py          ← Genera captions para IG/TikTok
│       └── schedule.py              ← Programa publicaciones
│
├── scheduler.py                     ← NUEVO: APScheduler integrado con lifespan
├── growth_router.py                 ← Endpoints /api/v1/growth/*
├── agents_router.py                 ← Endpoints /api/v1/agents/* (status, logs)
│
├── main.py                          ← Se modifica: registra agentes + scheduler
└── db/
    └── agents_schema.sql            ← NUEVO: 20 tablas para agentes
```

**Resumen:** 32 archivos nuevos, 1 modificación (`main.py`).

---

## 3. Qué hace cada agente — detalle funcional

### 3.1 Test Agent (post-deploy automático)

**Trigger:** GitHub Actions deploy a Render → webhook → Test Agent arranca

**Qué ejecuta:**
| Test | Qué verifica | Frecuencia |
|------|-------------|------------|
| Health check | `GET /health` → 200 | Inmediato post-deploy |
| Auth endpoints | `POST /v1/auth/login` con user test | Inmediato |
| Stress Engine | `POST /v1/stress/calculate` con payload test | Inmediato |
| Session Adaptation | `POST /v1/session/adapt` | Inmediato |
| Macrocycle | `GET /v1/macrocycles` | Inmediato |
| CORS | Request desde dominio permitido y bloqueado | Inmediato |
| Rate limiting | 150 requests en 60s → verificar 429 | Diario |
| Mobile responsive | Screenshot 390px vs 768px | Semanal |
| DB connection | Query simple a PostgreSQL | Inmediato |

**Si algo falla:**
1. Log en `agent_decisions` table
2. Alerta por email al equipo
3. Intenta auto-fix si es reversible (ej: re-migrar DB)
4. Si no puede fix → rollback del deploy

**Costo:** $0.10/mo en Gemini (tests usan Gemini para analizar errores)

---

### 3.2 Security Agent (diario + semanal)

**Trigger:** APScheduler — 2AM diario (checks básicos) + domingo 3AM (full scan)

**Checks diarios (2 min):**
| Check | Qué verifica |
|-------|-------------|
| JWT tokens expirados | Cuenta tokens que deberían haber sido rotados |
| Failed login attempts | Detecta brute force (>10 intentos/hora por IP) |
| Rate limit breaches | Cuántos IPs fueron bloqueadas hoy |
| CORS violations | Requests rechazados por origen inválido |

**Scan semanal (15 min):**
| Check | Qué verifica |
|-------|-------------|
| SQL injection | Fuzz inputs con payloads comunes |
| XSS | Prueba formularios con scripts |
| Auth bypass | Intenta acceder endpoints protegidos sin token |
| Dependency vulnerabilities | pip audit contra CVEs conocidos |
| SSL/TLS | Verifica certificado HTTPS vigente |
| Exposed endpoints | Scanea paths sensibles (`/admin`, `/debug`, `/.env`) |
| DB permissions | Verifica que el user de app no tenga DROP/ALTER |

**Si encuentra vulnerabilidad:**
1. **Crítica:** alerta inmediata por email + WhatsApp, sugiere fix
2. **Media:** agrega al report semanal con recomendación
3. **Baja:** log en DB, no hace ruido

**Costo:** $0.30/mo en Gemini (analiza resultados de scans)

---

### 3.3 Growth Agent (continuo, jobs programados)

**Jobs diarios:**

| Hora | Job | Qué hace |
|------|-----|----------|
| 2:00 AM | Engagement scores | Calcula score 0-100 para cada usuario activo |
| 3:00 AM | Churn prediction | Score de probabilidad de churn por usuario |
| 6:00 AM | Exchange rates | Actualiza CLP/USD para pricing dinámico |
| 9:00 AM | Trial reminders | Envía emails según día del trial (1, 7, 14, 30, 44) |
| 10:00 AM | Win-back emails | Expirados: día 1, 7, 30 post-expiry |
| 11:00 AM | Referral rewards | Procesa recompensas de referidos |
| 7:00 PM | Pricing analysis | Gemini analiza data y sugiere ajustes |

**Acciones automáticas (sin aprobación):**
- Enviar emails pre-aprobados (trial, winback)
- Calcular scores (engagement, churn)
- Asignar usuarios a experimentos activos
- Generar códigos de referido
- Scrapear precios de competidores

**Acciones que te consulta (con data):**
- "Coach X tiene 85% probabilidad de churn. ¿Ofrecer 1 mes gratis?"
- "El precio $29 tiene elasticidad de -0.3. Sugerencia: $32. ¿Aplicar?"
- "Experiment A/B: 62% prefieren CTA verde sobre azul. ¿Implementar?"

**Costo:** $0.50-5.00/mo en Gemini (depende de usuarios)

---

### 3.4 Response Agent (tiempo real — el más importante para ventas)

**Este es el que captura y responde leads de todos los canales.**

**Arquitectura de canales:**

```
┌─────────────────────────────────────────────────────────────┐
│                    Response Agent                           │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Instagram │  │ WhatsApp │  │  TikTok  │  │  Email   │    │
│  │  Webhook  │  │  Webhook │  │  Webhook │  │ Inbound  │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       │              │             │              │          │
│       └──────────────┴─────────────┴──────────────┘          │
│                          │                                   │
│                   ┌──────▼──────┐                            │
│                   │   Router    │ → Clasifica canal + tipo   │
│                   └──────┬──────┘                            │
│                          │                                   │
│                   ┌──────▼──────┐                            │
│                   │   Intent    │ → Gemini: ¿qué quiere?     │
│                   │ Classifier  │   (precio, demo, soporte)  │
│                   └──────┬──────┘                            │
│                          │                                   │
│              ┌───────────┼───────────┐                       │
│              │           │           │                       │
│       ┌──────▼──────┐ ┌──▼───┐ ┌────▼─────┐                 │
│       │  Lead       │ │ Info │ │ Soporte  │                 │
│       │  Capture    │ │ Query│ │ Ticket   │                 │
│       └──────┬──────┘ └──┬───┘ └────┬─────┘                 │
│              │            │          │                       │
│       ┌──────▼──────┐ ┌──▼───┐ ┌────▼─────┐                 │
│       │  Response   │ │ Res- │ │ Res-     │                 │
│       │  Generator  │ │ ponse│ │ ponse    │                 │
│       │  (Gemini)   │ │      │ │          │                 │
│       └──────┬──────┘ └──┬───┘ └────┬─────┘                 │
│              │            │          │                       │
│              └────────────┴──────────┘                       │
│                          │                                   │
│                   ┌──────▼──────┐                            │
│                   │  Send Back  │ → Al canal original        │
│                   └─────────────┘                            │
└─────────────────────────────────────────────────────────────┘
```

**Flujo por canal:**

#### Instagram (Comment → DM automation)
| Evento | Trigger | Respuesta | Costo |
|--------|---------|-----------|-------|
| Alguien comenta "precio" en un post | Webhook Meta | DM automático con precios + link a trial | $0 (Meta API free tier) |
| Alguien comenta "demo" en un reel | Webhook Meta | DM con link a demo + pregunta de calificación | $0 |
| Alguien comenta "info" | Webhook Meta | DM con info del producto + CTA | $0 |
| Alguien responde una story | Webhook Meta | DM con respuesta personalizada por Gemini | $0 |

**Servicio recomendado:** Meta Graph API directo (gratis) o PostEngage.ai (free forever para básico)
**Limitación free:** Requiere Instagram Business/Creator account. Webhook comments funciona 24/7.

#### WhatsApp Business API
| Evento | Trigger | Respuesta | Costo |
|--------|---------|-----------|-------|
| Usuario escribe primero | Service window 24h | Gemini responde con voz de marca | ✅ GRATIS (service conversations son free) |
| 1000 conversations/mo | Free tier de Meta | Hasta 1000 chats de soporte/mo gratis | ✅ GRATIS |
| Usuario escribe desde ad click | 72h free window | Todo es gratis por 72h | ✅ GRATIS |

**Costo cuando superas free:** Chile = $0.0188/marketing, $0.0044/service (que es gratis)
**Setup:** Necesitas número de teléfono dedicado + verificación de Meta Business

#### TikTok
| Evento | Trigger | Respuesta | Costo |
|--------|---------|-----------|-------|
| Nuevo comentario en video | Webhook TikTok | Responde públicamente con link a trial | $0 |
| Mención de @holyoly | Webhook | Responde + captura como lead | $0 |
| Pregunta sobre precio | Webhook | Responde con info + DM | $0 |

**Limitación:** TikTok API no permite enviar DMs directamente desde webhooks. Solo comments. Para DMs necesitarías TikTok Business API (más complejo).

#### Email
| Evento | Trigger | Respuesta | Costo |
|--------|---------|-----------|-------|
| Email entrante a hola@holyoly.com | Resend inbound webhook | Gemini responde en <5 min | $0 (cuenta del free tier) |
| Pregunta sobre precios | Inbound | Respuesta con tabla de precios | $0 |
| Solicitud de soporte | Inbound | Crea ticket + responde | $0 |

#### Web Chat (widget en holyoly.com)
| Evento | Trigger | Respuesta | Costo |
|--------|---------|-----------|-------|
| Usuario abre chat | Frontend widget | Saludo + "¿en qué puedo ayudarte?" | $0 |
| Pregunta cualquier cosa | Message | Gemini responde con contexto de HolyOly/Volta | $0.001/mensaje |

**Lead capture:** Cada interacción se guarda en DB con:
- Canal (IG, WhatsApp, TikTok, email, web)
- Intención (precio, demo, soporte, otro)
- Score del lead (0-100 basado en engagement + fit)
- Estado (nuevo, contactado, calificado, convertido)

**Costo Response Agent:** $1-10/mo en Gemini (depende de volumen de mensajes)

---

### 3.5 Content Agent (publicaciones automáticas)

**Trigger:** Diario 9AM

| Job | Qué genera | Frecuencia |
|-----|-----------|------------|
| Píldoras diarias | Tips para atletas (+50 XP) | Diario |
| Social post IG | Post con caption para holyoly.com/IG | 3x semana |
| TikTok script | Guion corto para video | 2x semana |
| Viral cards | Cards de logros para atletas | Cuando hay PRs |
| Coach digest | Email semanal para coaches con stats de equipo | Semanal (lunes) |

**Costo:** $0.50-2.00/mo en Gemini

---

## 4. Costo total del ecosistema (gratis vs real)

### Con 100 usuarios (todo gratis)

| Componente | Costo mensual | Notas |
|-----------|--------------|-------|
| Render (web service) | $0 | Free tier, 750h/mo |
| Render (PostgreSQL) | $0 | Free tier |
| Gemini 2.5 Flash Lite | $2.50 | ~3M tokens para 5 agentes |
| Resend (email) | $0 | 3,000 emails/mo free |
| Instagram API | $0 | Meta Graph API, gratis |
| WhatsApp Business API | $0 | 1,000 service conversations free |
| TikTok API | $0 | Developer account, gratis |
| PostHog Cloud | $0 | 1M eventos/mo free |
| ExchangeRate-API | $0 | 1,500 req/mo free |
| GitHub Actions | $0 | 2,000 min/mo free |
| **TOTAL** | **$2.50/mo** | |

### Con 1,000 usuarios

| Componente | Costo mensual | Notas |
|-----------|--------------|-------|
| Render (web service) | $7 | Starter plan (no duerme) |
| Render (PostgreSQL) | $7 | Starter plan |
| Gemini 2.5 Flash Lite | $15 | Más volumen de análisis |
| Resend (email) | $20 | Pro plan (50K emails) |
| Instagram API | $0 | Sigue gratis |
| WhatsApp Business API | $5 | ~100 marketing msgs extra |
| TikTok API | $0 | Sigue gratis |
| PostHog Cloud | $0 | Sigue en free tier |
| ExchangeRate-API | $0 | Sigue gratis |
| GitHub Actions | $0 | Sigue gratis |
| **TOTAL** | **$54/mo** | |

### Con 10,000 usuarios

| Componente | Costo mensual |
|-----------|--------------|
| Render (web service) | $20 |
| Render (PostgreSQL) | $20 |
| Gemini 2.5 Flash Lite | $75 |
| Resend (email) | $90 |
| WhatsApp Business API | $30 |
| PostHog Cloud | $0 (1M events free) o $50 |
| **TOTAL** | **$235-285/mo** |

---

## 5. Limitaciones reales del free tier

### Lo que SÍ funciona perfecto gratis

| Servicio | Limitación | ¿AfectaHolyOly? |
|----------|-----------|-----------------|
| **Gemini 2.5 Flash** | Sin límites de calidad ni velocidad | ❌ No afecta |
| **Instagram API** | Requiere Business account | ❌ No afecta (solo es configuración) |
| **WhatsApp service** | Gratis ilimitado dentro de 24h window | ❌ No afecta |
| **TikTok webhooks** | Comments sí, DMs no | ⚠️ No puedes auto-respondar DMs de TikTok |
| **PostHog** | 1M eventos = ~5,000 usuarios activos | ❌ Suficiente por mucho tiempo |
| **Resend** | 100 emails/día | ⚠️ Suficiente para primeros 200 coaches |
| **ExchangeRate-API** | 1,500 req/mo | ❌ Solo usamos 30/mo |

### Lo que tiene limitación real

| Servicio | Limitación | Impacto | Solución |
|----------|-----------|---------|----------|
| **Render free** | Dyno duerme 15min sin tráfico | Jobs de scheduler se retrasan hasta 15min | Cron-job.org ping cada 5min (gratis) |
| **Render free DB** | Se borra después de 90 días sin uso | No aplica si hay tráfico activo | Migrar a $7/mo si es problema |
| **WhatsApp marketing** | Solo service conversations gratis | No puedes enviar promos proactivas gratis | Usa service window (responde cuando escriben) |
| **Resend free** | 1 dominio, 100 emails/día | No puedes tener holyoly.com y volta.com | Usa subdominios (app.holyoly.com) |
| **TikTok** | No hay API para DMs outbound | No puedes enviar DMs automáticos | Responde comments públicos con link |

### Conclusión sobre limitaciones

**Con 100 usuarios: 0 limitaciones prácticas.** El único fix es un ping cada 5 min a Render (gratis).

**La calidad de Gemini es la misma gratis que pagando.** No hay degradación. Pagas por volumen de tokens, no por "calidad de respuesta."

---

## 6. Proactividad — cómo los agentes venden solos

### Escenario 1: Lead desde Instagram

```
1. HolyOly publica reel: "¿Tu coach te cuida o te quema?"
2. Usuario comenta: "precio"
3. IG webhook → Response Agent (en <3 seg)
4. Intent Classifier (Gemini): "quiere saber precios"
5. Response Generator: genera DM con precios + link trial
6. DM enviado automáticamente
7. Lead capturado en DB con score inicial
8. Si abre el link → engagement score sube
9. Si no convierte en 7 días → win-back email automático
```

### Escenario 2: Lead desde WhatsApp

```
1. Usuario escribe a +569XXXXXXX: "¿qué es HolyOly?"
2. WhatsApp webhook → Response Agent
3. Intent Classifier: "quiere info del producto"
4. Response Generator: explica HolyOly + pregunta si es coach o atleta
5. Usuario: "soy coach"
6. Agent: envía info de plan coach + link a trial 45 días
7. Lead capturado como "coach prospect"
8. Si no activa trial en 24h → WhatsApp follow-up automático
```

### Escenario 3: Lead desde TikTok

```
1. HolyOly publica: "3 señales de que tu macrocycle está mal"
2. Usuario comenta: "necesito ayuda con mi plan"
3. TikTok webhook → Response Agent
4. Intent Classifier: "necesita ayuda, posible lead"
5. Agent responde públicamente: "Te mandamos info 📩 Link en bio para trial gratis"
6. Lead capturado (username de TikTok)
7. Si el username tiene email público → email de follow-up
```

### Escenario 4: Lead desde email

```
1. Coach escribe a hola@holyoly.com: "¿tienen descuento para equipos grandes?"
2. Resend inbound webhook → Response Agent
3. Intent Classifier: "pregunta por precio + volumen"
4. Response Generator: responde con tabla de descuentos por volumen
5. Lead capturado como "coach enterprise"
6. Growth Agent asigna score alto (pregunta por volumen = alta intención)
7. Si no responde en 48h → email de follow-up con caso de éxito
```

### Escenario 5: Test Agent detecta bug post-deploy

```
1. Push a main → GitHub Actions → deploy a Render
2. Render completa deploy → webhook → Test Agent
3. Test Agent ejecuta 9 tests
4. Test 7 falla: CORS bloquea requests desde holyoly.com
5. Agent analiza: "CORS_ORIGINS no incluye holyoly.com"
6. Agent intenta auto-fix: actualiza env var CORS_ORIGINS
7. Re-run tests → todos pasan
8. Log en agent_decisions: "Auto-fix CORS exitoso"
9. Si no puede fix → alerta al equipo con diagnóstico completo
```

---

## 7. Base de datos — 20 tablas nuevas

```sql
-- ==========================================
-- AGENT CORE (tablas compartidas por todos los agentes)
-- ==========================================

-- Log de todas las decisiones de los agentes
CREATE TABLE agent_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name VARCHAR(50) NOT NULL, -- 'test', 'security', 'growth', 'response', 'content'
    decision_type VARCHAR(50) NOT NULL,
    action_taken VARCHAR(20), -- 'auto', 'recommended', 'failed'
    context JSONB NOT NULL,
    recommendation JSONB,
    human_override BOOLEAN DEFAULT FALSE,
    override_reason TEXT,
    outcome JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- RESPONSE AGENT (leads multi-canal)
-- ==========================================

-- Leads capturados de cualquier canal
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel VARCHAR(20) NOT NULL, -- 'instagram', 'whatsapp', 'tiktok', 'email', 'webchat'
    channel_user_id VARCHAR(100), -- IG username, WhatsApp number, TikTok username, email
    name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    intent VARCHAR(50), -- 'pricing', 'demo', 'support', 'general'
    intent_confidence DECIMAL(3,2), -- 0-1, confianza del Gemini classifier
    lead_score INTEGER DEFAULT 0, -- 0-100
    status VARCHAR(20) DEFAULT 'new', -- 'new', 'contacted', 'qualified', 'converted', 'lost'
    product_interest VARCHAR(20), -- 'holyoly', 'volta', 'both'
    user_role VARCHAR(20), -- 'coach', 'athlete', 'unknown'
    first_contact_at TIMESTAMP DEFAULT NOW(),
    last_contact_at TIMESTAMP,
    converted_at TIMESTAMP,
    converted_to_user_id UUID, -- Si se convirtió en usuario real
    notes TEXT
);

-- Historial de conversaciones del Response Agent
CREATE TABLE agent_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    channel VARCHAR(20) NOT NULL,
    direction VARCHAR(10) NOT NULL, -- 'inbound', 'outbound'
    content TEXT NOT NULL,
    gemini_model VARCHAR(50),
    tokens_used INTEGER,
    response_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- GROWTH AGENT
-- ==========================================

CREATE TABLE growth_experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    experiment_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft',
    variants JSONB NOT NULL,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE growth_user_experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    experiment_id UUID REFERENCES growth_experiments(id),
    variant_name VARCHAR(50) NOT NULL,
    assigned_at TIMESTAMP DEFAULT NOW(),
    converted BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, experiment_id)
);

CREATE TABLE user_engagement_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    score DECIMAL(5,2) NOT NULL,
    components JSONB NOT NULL,
    calculated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE churn_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    churn_probability DECIMAL(5,4) NOT NULL,
    risk_level VARCHAR(20),
    contributing_factors JSONB,
    intervention_suggested JSONB,
    intervention_sent BOOLEAN DEFAULT FALSE,
    predicted_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    lead_id UUID REFERENCES leads(id),
    campaign_type VARCHAR(50) NOT NULL,
    email_address VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    sent_at TIMESTAMP DEFAULT NOW(),
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'sent'
);

CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    referred_email VARCHAR(255),
    referred_user_id UUID REFERENCES users(id),
    referral_code VARCHAR(20) NOT NULL UNIQUE,
    status VARCHAR(20) DEFAULT 'pending',
    reward_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- SECURITY AGENT
-- ==========================================

CREATE TABLE security_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_type VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'post_deploy'
    status VARCHAR(20) DEFAULT 'running',
    findings JSONB,
    vulnerabilities_found INTEGER DEFAULT 0,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE security_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID REFERENCES security_scans(id),
    severity VARCHAR(20) NOT NULL, -- 'critical', 'high', 'medium', 'low'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    affected_endpoint VARCHAR(255),
    suggested_fix TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- TEST AGENT
-- ==========================================

CREATE TABLE test_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deploy_id VARCHAR(100), -- commit hash o render deploy ID
    status VARCHAR(20) DEFAULT 'running',
    total_tests INTEGER,
    passed_tests INTEGER,
    failed_tests INTEGER,
    auto_fixes_applied INTEGER DEFAULT 0,
    duration_seconds INTEGER,
    report JSONB,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_run_id UUID REFERENCES test_runs(id),
    test_name VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'passed', 'failed', 'skipped'
    error_message TEXT,
    response_time_ms INTEGER,
    details JSONB
);

-- ==========================================
-- CONTENT AGENT
-- ==========================================

CREATE TABLE content_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent VARCHAR(50) DEFAULT 'content',
    content_type VARCHAR(50) NOT NULL, -- 'pilodora', 'social_post', 'tiktok_script', 'viral_card', 'coach_digest'
    status VARCHAR(20) DEFAULT 'draft',
    content JSONB NOT NULL,
    scheduled_for TIMESTAMP,
    published_at TIMESTAMP,
    channel VARCHAR(50),
    engagement_metrics JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- ÍNDICES
-- ==========================================

CREATE INDEX idx_agent_decisions_agent ON agent_decisions(agent_name);
CREATE INDEX idx_agent_decisions_date ON agent_decisions(created_at);
CREATE INDEX idx_leads_channel ON leads(channel);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_score ON leads(lead_score DESC);
CREATE INDEX idx_agent_conversations_lead ON agent_conversations(lead_id);
CREATE INDEX idx_churn_predictions_risk ON churn_predictions(risk_level);
CREATE INDEX idx_security_alerts_severity ON security_alerts(severity);
CREATE INDEX idx_security_alerts_resolved ON security_alerts(resolved);
CREATE INDEX idx_test_runs_deploy ON test_runs(deploy_id);
CREATE INDEX idx_test_results_run ON test_results(test_run_id);
CREATE INDEX idx_content_schedule_status ON content_schedule(status);
CREATE INDEX idx_content_schedule_date ON content_schedule(scheduled_for);
```

---

## 8. Endpoints nuevos de la API

```
POST   /api/v1/webhooks/instagram          ← IG comments/DMs webhook
POST   /api/v1/webhooks/whatsapp           ← WhatsApp inbound webhook
POST   /api/v1/webhooks/tiktok             ← TikTok comments webhook
POST   /api/v1/webhooks/resend-inbound     ← Email inbound webhook
POST   /api/v1/webhooks/render-deploy      ← Render deploy complete → trigger Test Agent

POST   /api/v1/agents/test/run             ← Trigger manual test run
GET    /api/v1/agents/test/latest          ← Último test run + resultados
GET    /api/v1/agents/security/status      ← Estado de seguridad actual
GET    /api/v1/agents/security/alerts      ← Alertas abiertas
POST   /api/v1/agents/security/scan        ← Trigger manual security scan
GET    /api/v1/agents/growth/status        ← Growth agent status
GET    /api/v1/agents/growth/decisions     ← Decisiones recientes
GET    /api/v1/agents/response/leads       ← Leads capturados
GET    /api/v1/agents/response/leads/:id   ← Detalle de lead + conversación
GET    /api/v1/agents/content/schedule     ← Contenido programado
GET    /api/v1/agents/status               ← Status de todos los agentes
```

---

## 9. Cron Jobs (APScheduler en FastAPI)

```python
# scheduler.py — Integrado con FastAPI lifespan

daily_jobs = [
    ("02:00", "engagement_scores",       "Growth Agent"),
    ("03:00", "churn_prediction",        "Growth Agent"),
    ("03:00", "security_daily_check",    "Security Agent"),
    ("06:00", "exchange_rates",          "Growth Agent"),
    ("09:00", "trial_reminder_emails",   "Growth Agent"),
    ("09:00", "generate_daily_pildora",  "Content Agent"),
    ("10:00", "winback_emails",          "Growth Agent"),
    ("11:00", "referral_rewards",        "Growth Agent"),
    ("19:00", "pricing_analysis",        "Growth Agent"),
]

weekly_jobs = [
    ("Sunday 03:00", "security_full_scan",     "Security Agent"),
    ("Monday 08:00", "generate_coach_digest",  "Content Agent"),
    ("Monday 08:00", "competitor_scraping",    "Growth Agent"),
    ("Friday 17:00", "weekly_growth_report",   "Growth Agent"),
]

keep_alive = [
    ("*/5", "ping_render", "System"),  # Cada 5 min para evitar dyno sleep
]
```

---

## 10. Implementación — orden recomendado

### Semana 1: Cimientos (los más valiosos primero)
1. **Response Agent básico** — email inbound + webchat → Gemini responde
2. **APScheduler** integrado en `main.py`
3. **Test Agent** — health check + endpoint tests post-deploy
4. **Base de datos** — 20 tablas nuevas

### Semana 2: Multi-canal
5. **Instagram webhook** — comments → DM automation
6. **WhatsApp webhook** — service conversations → Gemini responde
7. **TikTok webhook** — comments → respuesta pública
8. **Lead capture** — todas las interacciones van a DB con scoring

### Semana 3: Growth + Security
9. **Email campaigns** — trial reminders, winback, upsell
10. **Churn prediction** — scoring diario
11. **Security Agent** — daily checks + weekly full scan
12. **A/B test framework** — experiments + user assignment

### Semana 4: Content + Refinamiento
13. **Content Agent** — píldoras, social posts, viral cards
14. **Referral system** — codes + tracking + rewards
15. **Dashboard de agentes** — endpoint /agents/status con health de todos
16. **Refinamiento** — ajustar prompts de Gemini, thresholds, timing

---

## 11. Lo que necesitas configurar (una sola vez)

| Servicio | Qué hacer | Tiempo |
|----------|-----------|--------|
| **Resend** | Crear cuenta, verificar dominio, generar API key | 10 min |
| **Meta Developer** | Crear app, conectar IG Business account, configurar webhook | 20 min |
| **WhatsApp Business** | Crear cuenta, verificar Meta Business, obtener número | 30 min |
| **TikTok Developer** | Crear app, configurar webhook para comments | 15 min |
| **PostHog Cloud** | Crear cuenta, obtener API key | 5 min |
| **Cron-job.org** | Crear cuenta, configurar ping cada 5min a Render | 5 min |
| **Render** | Deployar desde GitHub (ya configurado) | 5 min |

**Total setup:** ~90 min. Después de eso, los agentes trabajan solos.

---

## 12. Resumen ejecutivo

| Pregunta | Respuesta |
|----------|-----------|
| ¿Es posible? | Sí, 100%. Todo se puede hacer con APIs gratuitas + Gemini |
| ¿Cuánto cuesta empezar? | $2.50/mo (solo tokens de Gemini) |
| ¿Cuánto cuesta a 1000 usuarios? | $54/mo |
| ¿Pierde calidad Gemini en free? | No. Misma calidad, mismo modelo |
| ¿Qué no se puede hacer gratis? | Enviar DMs de TikTok, emails ilimitados (>100/día), dyno siempre activo |
| ¿Cuántos archivos nuevos? | 32 archivos + 1 modificación |
| ¿Cuánto tiempo para implementar? | 4 semanas (1 módulo por semana) |
| ¿Qué canal es más efectivo para ventas? | WhatsApp (responde en tiempo real, gratis) + Instagram (comment→DM, gratis) |
| ¿Reemplaza al humano? | No. Automatiza lo repetitivo, te presenta lo estratégico |
