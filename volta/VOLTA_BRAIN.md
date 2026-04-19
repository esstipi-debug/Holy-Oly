---
tags: [volta, crossfit, brain, peak-qual]
type: brand-brain
status: in-progress
updated: 2026-04-19
parent: "[[../PEAK_QUAL]]"
---

# ⚡ Volta — Cerebro CrossFit

**Marca:** Peak Qual
**Disciplina:** CrossFit
**Lema:** *Train smart. Zero burnout.*
**Fuente madre:** [[source/COMPTRAIN_MASTER|CompTrain Philosophy]] (4006 líneas)

---

## 🧠 Qué ya tenemos (CompTrain)

✅ Training philosophy (cardio + muscular + intensity)
✅ Training domains (7 dominios: cardio endurance → max strength)
✅ Estructura sesiones
✅ Progresiones movimientos
✅ Warmup protocols
✅ Skill work breakdown
✅ Metcon design principles

---

## 🚧 Qué falta construir

### Motores de medición (engines)

| Engine | Propósito | Prioridad |
|---|---|---|
| **V-Stress Engine** | Banister adaptado metcon (cardio + muscular combined load) | P1 |
| **V-Volume Engine** | Tonelaje + reps + time domain tracking | P1 |
| **Wise Score Engine** | Stat estrella (0-99) multifactorial | P1 |
| **V-Readiness Engine** | HRV + sleep + metcon fatigue residual | P1 |
| **V-Domain Engine** | Clasifica WOD por dominio (7 dominios CompTrain) | P2 |
| **V-Benchmark Engine** | Tracking Fran/Murph/Cindy/etc + percentil | P2 |
| **V-Engine Score** | Aerobic threshold estimado | P2 |
| **V-Gymnastics Index** | Skill level muscle-ups, HSPU, pistols | P2 |
| **V-Power Output** | Watts estimados por metcon | P3 |
| **V-Recovery Engine** | Sueño + HRV + Huberman core | P1 (shared) |

### Datos a medir por sesión

**Input atleta:**
- WOD completado (sí/no + tiempo/rounds)
- RPE post-sesión
- Peso usado (si RX/scaled)
- Fallos técnicos
- Sensación (fresh/flat/cooked)

**Calculado automático:**
- Tonelaje total (sum peso × reps)
- Time under tension
- Work:rest ratio
- Dominio predominante
- Stress contribución al mesociclo
- Readiness impact próximas 48h

---

## 📊 Wise Score (stat estrella)

Formula propuesta 0-99:

```
Wise Score = 0.25 × Strength Index
           + 0.25 × Engine Score
           + 0.20 × Gymnastics Index
           + 0.15 × Benchmark Percentile
           + 0.15 × Consistency Score
```

Normalizado por edad + peso corporal + sexo.

---

## 🎯 Cerebro especializado (RAG Volta)

**Namespace pgvector:** `volta`

**Fuentes:**
- ✅ CompTrain Master (ya ingestado)
- ⏳ CrossFit Journal archive
- ⏳ Games/Open WODs database
- ⏳ CrossFit Level 1-3 training guides
- ✅ Huberman Core (shared cross-brand)
- ⏳ Ben Bergeron podcast + libros
- ⏳ Chris Hinshaw running protocols

**Chunks estimados:** ~2000-3000 (solo CompTrain + benchmarks)

---

## 🏗️ Arquitectura engines

```
Volta Session
  ↓
V-Volume Engine (tonelaje, reps, time)
V-Stress Engine (Banister metcon-adapted)
  ↓
V-Readiness Engine (próxima sesión gate)
  ↓
Wise Score Engine (rating global)
  ↓
Smart Coach Agent (RAG Volta + Huberman)
  ↓
Recomendación personalizada
```

---

## 🔗 Shared con Peak Qual

- Huberman Core RAG
- Banister base (adaptada)
- Anti-burnout philosophy
- Skin System
- Design system
- Billing + auth
- Cascading IA (Phi-3 + Flash-Lite + Sonnet)

---

## 📋 Próximos pasos

1. Ingesta CompTrain → chunks + embeddings
2. Spec V-Stress Engine (adaptado a metcon)
3. Spec V-Volume Engine (CrossFit-specific)
4. Spec Wise Score Engine (fórmula definitiva)
5. UX Volta (post Holy Oly UX cerrado)
6. Design system (hereda de Peak Qual)

---

## 🔗 Docs relacionados

- [[../PEAK_QUAL]] — Marca paraguas
- [[source/COMPTRAIN_MASTER]] — Fuente madre 4006 líneas
- [[../ux/AI_STRATEGY]] — Stack IA compartido
- [[../_HOME]] — Mapa general

---

**Última actualización:** 2026-04-19
**Status:** Cerebro base construido. Faltan 10 engines especificados.
