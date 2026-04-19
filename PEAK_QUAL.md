---
tags: [brand, parent-company, peak-qual]
type: brand-architecture
status: active
updated: 2026-04-19
---

# 🏔️ Peak Qual — Marca Paraguas

**Lema:** *Train smart. Zero burnout.*
**Filosofía:** performance sostenible basada en ciencia. Anti-sobreentrenamiento.

---

## 🎯 Arquitectura de marca

| Producto | Disciplina | Estado |
|---|---|---|
| **Holy Oly** | Halterofilia | 🟡 En desarrollo UX |
| **Volta** | CrossFit | 🔵 Documentación parcial |
| **Axon** | Hyrox | ⏳ Pendiente arranque |

---

## 🧬 Core compartido

Toda propiedad Peak Qual hereda:

- **Huberman RAG** — sleep, HRV, recovery, nutrition, stress (capa base científica)
- **Banister Engine** — Fitness-Fatigue-Readiness model
- **Anti-overtraining philosophy** — deload forzado, readiness gates
- **Agente IA cascading** — Phi-3 on-device → Gemini Flash-Lite → Sonnet 4.6
- **Skin System** — Holy Oly Card System adaptado por marca
- **Design language** — PES collectible + ElevenLabs tech dark
- **Stack técnico** — Postgres + pgvector + Next.js + React Native
- **Pricing base** — $9 USD/mes atleta premium, margen 65%

---

## 🎨 Identidad por producto

### Holy Oly — Halterofilia
- Acento: Holy Gold
- Stat estrella: IMR (Iron Movement Ratio)
- Arquetipo: guerrero técnico
- Target: levantadores Chile → LATAM

### Volta — CrossFit
- Acento: Electric Cyan (pendiente confirmar)
- Stat estrella: Wise Score
- Arquetipo: atleta híbrido explosivo
- Target: boxes LATAM

### Axon — Hyrox
- Acento: Neural Magenta (propuesta)
- Stat estrella: Flow Index (propuesta)
- Arquetipo: endurance híbrido
- Target: corredores performance Europa/LATAM

---

## 💰 Modelo negocio unificado

- **B2B2C** en los 3 productos
- Coach premium: $29 USD/mes
- Atleta premium: $9 USD/mes
- Trial 45 días atleta, desde primer coach-athlete link
- Skins + drops limitados: revenue adicional >95% margen
- API-as-Service multi-vertical: mes 12+

---

## 📊 Proyección revenue año 2

| Producto | Users | ARPU | Revenue |
|---|---|---|---|
| Holy Oly | 1,000 | $9 | $108k |
| Volta | 3,000 | $9 | $324k |
| Axon | 500 | $15 | $90k |
| Skins cross-brand | — | — | $60k |
| **Total** | **4,500** | — | **~$582k/año** |

---

## 🏗️ Infraestructura compartida

```
Peak Qual Platform
  ├── Shared RAG (Huberman core)
  ├── Shared AI agent (cascading stack)
  ├── Shared billing (Flow Chile + Lemon Squeezy)
  ├── Shared auth
  ├── Shared design system
  └── Brand namespace per product
      ├── holy-oly.* (halterofilia RAG + UI)
      ├── volta.* (crossfit RAG + UI)
      └── axon.* (hyrox RAG + UI)
```

Un backend. Tres frontends. Tres marcas. Un moat.

---

## 🗺️ Roadmap ejecución

1. **Q2 2026** — Holy Oly MVP Chile
2. **Q3 2026** — Volta piloto (sobre material existente)
3. **Q4 2026** — Axon diseño + lanzamiento
4. **Q1 2027** — API Peak Qual pública
5. **Q2 2027** — Expansión LATAM

---

## 🔗 Docs relacionados

- [[_HOME]] — Mapa general
- [[ux/AI_STRATEGY]] — Agente cascading
- [[ux/SKIN_SYSTEM]] — Card system
- [[MEMORY]] — Histórico decisiones
- [[PLAN]] — Roadmap técnico

---

**Última actualización:** 2026-04-19
**Responsable:** Stipi · Claude Code session
