---
tags: [ai, rag, vector-db, distillation, strategy, backend]
type: strategy
status: draft
updated: 2026-04-18
---

# 🧠 AI Strategy — Vector DB, RAG, Distillation

**Fecha:** 2026-04-18
**Estado:** ✅ 9/9 decisiones aprobadas por founder (2026-04-18) · Schema pgvector pendiente integrar a Prisma
**Dependencias:** [[COACH_FLOW_DECISIONS]] (rename "IA" → "Smart"), [[../MEMORY]]
**Propósito:** Plan técnico para IA real en Holy Oly — cuándo activar, qué construir, qué NO hacer.

---

## ⚠️ Contradicción a resolver

| Decisión previa | Nueva consulta |
|---|---|
| "No hay IA, renombrar a **Recomendación Smart**" | Preguntar por RAG + distillation |

**3 posiciones posibles:**

- **A — Smart público + IA privada (RECOMENDADA):** Marketing dice "Smart". Backend usa IA real oculta en algunos engines (ej: Smart Coach). Cliente nunca ve la palabra "IA".
- **B — Pivotar a vender IA:** Volver atrás, vender IA como diferenciador. Requiere rehacer copy, web, pitch.
- **C — IA solo V2/V3:** Arrancar 100% determinístico. Agregar IA cuando haya data y validación de negocio.

**Posición por defecto en este doc:** **A** (aplicada en propuestas abajo). Confirmar o cambiar.

---

## 🗄️ Inventario de datos vectorizables

| Fuente | Volumen año 1 | Utilidad vector | Fase activación |
|---|---|---|---|
| Notas coach texto libre | ~5k notas | Alta | V2 |
| Reportes atleta (dolor, sueño, RPE, fatiga) | ~100k | Media | V2 |
| Sesiones completas (estructura + outcome) | ~50k sesiones | Alta | V2 |
| Macrociclos + resultados por atleta | ~200 combinaciones | Alta | V2 |
| Lesiones históricas | ~1k eventos | Alta | V2 |
| Píldoras / contenido educativo | ~500 ítems | Media | V1 (contenido estático) |
| Comentarios sesión (RPE texto libre) | ~50k | Media | V2 |

**Conclusión:** volumen suficiente para RAG entre mes 9 y 12 con 1k atletas activos.

---

## 🔍 Casos de uso por engine

### Smart Coach Engine (14) — RAG contextual

**Query ejemplo:** "¿Cómo responden atletas mujeres 25-30 años a macrociclo Colombiano?"

**Pipeline:**
1. Retrieval: buscar sesiones similares anónimas (mismo rango edad/sexo/macrociclo)
2. Context injection: últimas 20 sesiones con outcomes
3. Generation: LLM responde con insight basado en data real
4. Output: recomendación personalizada al coach

**Valor:** insight imposible con reglas determinísticas.

---

### Session Adaptation Engine (02) — RAG + reglas híbrido

**Caso:** "Atleta readiness 35 · dolor rodilla · programado Snatch 5x3 85%"

**Hoy (determinístico):** regla "readiness <40 → reducir carga -15% + sustituir Snatch por Power Snatch"

**Con RAG:**
1. Retrieval: 50 casos históricos similares (readiness bajo + dolor rodilla)
2. Analysis: ¿qué hicieron otros coaches? ¿qué funcionó? ¿qué empeoró?
3. Generation: recomendación contextual con evidencia
4. Output: "83% de casos similares resolvió con [X]. Sugerimos [Y]."

**Mejora:** datos > reglas fijas.

---

### Smart Insights (nuevo, futuro) — Chat coach con histórico

**Query coach:** "¿Por qué Juan baja rendimiento las últimas 3 semanas?"

**Pipeline:**
1. Retrieval: histórico Juan (sesiones, readiness, reportes, ajustes aplicados)
2. Retrieval secundario: atletas similares que pasaron por patrón parecido
3. Generation: síntesis con hipótesis priorizadas
4. Output: "3 posibles causas en orden de probabilidad: [A, B, C]. Data que lo soporta: [X]. Acción sugerida: [Y]."

**Valor:** coach obtiene segunda opinión data-driven sin contratar consultor.

---

### Clasificador texto libre (RPE / dolor / sueño)

**Caso:** atleta escribe en check-in diario:
> "Dormí fatal anoche, me duele un poco el hombro pero creo que puedo entrenar. Quizás no al 100%."

**Output deseado:**
```json
{
  "readiness_estimate": 55,
  "pain_locations": ["shoulder"],
  "pain_severity": "moderate",
  "sleep_quality": "poor",
  "predicted_rpe": 7,
  "can_train": true,
  "confidence": 0.82
}
```

**Valor:** reemplaza formulario tedioso por texto natural. Fricción bajísima.

---

### Overreaching Detector

**Input:** secuencia 14 días de sesiones + reportes
**Output:** probabilidad overreaching próximas 2 semanas (0-1)
**Uso:** alerta preventiva coach antes del breakdown

**Banister actual:** calcula fatigue acumulado (regla fija).
**Mejora ML:** predice overreaching probabilistic con data real de quién colapsó.

---

### Generador Píldoras personalizadas

**Hoy:** 500 píldoras estáticas, rotación por día.
**Con IA:** generar píldora contextual al perfil del atleta (ej: principiante mujer 22 años en fase lútea → tip específico sobre entrenamiento en esa fase).

**Monetización:** Premium tier "IA Coaching" adicional $5/mes.

---

## 🎓 Distillation — Plan año 2+

### Candidatos para destilación

| Modelo origen (grande) | Modelo destilado (pequeño) | Ahorro inferencia |
|---|---|---|
| Claude Sonnet: clasificador RPE | Modelo local 125M params | 100x más barato |
| GPT-4: generador píldoras | Modelo fine-tuned LLaMA | 50x más barato |
| Claude Opus: analizador sesión | Modelo específico domain | 30x más barato |

### Proceso

1. **Año 1:** usar APIs grandes (Claude/GPT). Loggear input + output + feedback.
2. **Mes 12:** dataset etiquetado ~50k-100k ejemplos.
3. **Año 2 Q1:** fine-tune modelo open source (LLaMA 3 / Mistral) con dataset.
4. **Año 2 Q2:** desplegar modelo propio. Inferencia en CPU o GPU compartida.
5. **Ahorro típico:** 50-100x costo inferencia.

### Pre-requisitos

- Logging exhaustivo desde día 1 (inputs, outputs, human feedback)
- Dataset minimum: 10k ejemplos alta calidad
- 1 ML engineer parte-time
- Infraestructura training: Lambda Labs / Modal / Hugging Face Endpoints ($500-2000 one-time per modelo)

---

## 🏗️ Stack técnico recomendado

### Base de datos vectorial

**Elección: Postgres + pgvector extension**

Razones:
- ✅ Ya usas Postgres para datos relacionales (Prisma schema)
- ✅ Cero infra adicional
- ✅ Gratis (open source)
- ✅ Escalable a 10M+ vectores sin problema
- ✅ Queries híbridas SQL + vector en una sola BD

Alternativas descartadas:
- ❌ Pinecone: $70+/mes mínimo, vendor lock-in
- ❌ Weaviate/Qdrant: infra separada, overhead operacional
- ❌ Chroma: excelente dev pero menos maduro producción

### Embeddings provider

**Opción A — OpenAI `text-embedding-3-small`:**
- $0.02 / 1M tokens
- 1536 dimensiones
- Calidad excelente español
- Latencia ~200ms

**Opción B — Anthropic (cuando liberen embeddings):**
- Por definir precio/performance
- Integración ya existente con Claude

**Opción C — Local (sentence-transformers):**
- Gratis (self-hosted)
- Calidad español menor
- Latencia local <50ms

**Recomendación:** OpenAI Option A. Más simple, calidad probada, costo insignificante.

### LLM inference

**Opción A — Claude API:**
- Sonnet 4.6 para latencia/costo
- Opus 4.7 para casos críticos (lesión, análisis complejo)
- Context caching para ahorrar en prompts repetidos

**Opción B — OpenAI GPT-4o:**
- Alternativa principal
- Ecosistema maduro

**Recomendación:** Claude Sonnet 4.6 primario + Opus 4.7 casos críticos. Enable prompt caching desde día 1.

---

## 📐 Schema Prisma (preparar desde V1)

```prisma
// Schema addition para V1 (preparación, sin activar IA aún)

model Embedding {
  id          String   @id @default(cuid())
  sourceType  String   // 'session', 'note', 'pill', 'report'
  sourceId    String   // FK polimórfico
  content     String   @db.Text
  embedding   Unsupported("vector(1536)")
  metadata    Json?
  createdAt   DateTime @default(now())

  @@index([sourceType, sourceId])
  // Vector index:
  // CREATE INDEX ON "Embedding" USING hnsw (embedding vector_cosine_ops);
}

model AIInteractionLog {
  id           String   @id @default(cuid())
  userId       String
  userRole     String   // 'coach' | 'athlete'
  inputType    String   // 'check_in_text', 'coach_query', 'session_note'
  input        String   @db.Text
  output       Json
  modelUsed    String   // 'claude-sonnet-4-6', 'gpt-4o', etc.
  latencyMs    Int
  feedback     String?  // 'helpful' | 'not_helpful' | null
  feedbackText String?
  createdAt    DateTime @default(now())

  @@index([userId, createdAt])
  @@index([inputType])
}

model MLTrainingExample {
  id           String   @id @default(cuid())
  taskType     String   // 'rpe_classifier', 'overreaching_predictor', etc.
  input        Json
  output       Json
  verified     Boolean  @default(false)
  source       String   // 'claude_api', 'gpt_api', 'coach_curated'
  createdAt    DateTime @default(now())

  @@index([taskType, verified])
}
```

---

## 💰 Costos estimados

### V1 (año 1, sin IA activa — solo preparación)
- pgvector extension: $0
- Schema preparation: $0
- Total: **$0/mes**

### V2 (año 2, IA activa con 1k atletas)
- Embeddings OpenAI: ~$20/mes (1M tokens)
- Claude API (Sonnet): ~$100-300/mes con prompt caching
- Monitoring/logging: $20/mes
- Total: **$150-350/mes**

### V3 (año 3, con modelos destilados)
- Reducción costo LLM: -60% (~$60-120/mes ahorro)
- Infraestructura training: $100/mes amortizado
- Total: **$100-250/mes**

---

## 🚦 Roadmap activación

### Fase 1 — Preparación (AHORA, Q2 2026)
- [ ] Habilitar pgvector extension en Postgres
- [ ] Schema Prisma con tablas `Embedding`, `AIInteractionLog`, `MLTrainingExample`
- [ ] Logging exhaustivo input/output/outcome desde día 1
- [ ] **NO activar IA en producto final todavía**

### Fase 2 — RAG activo (Q4 2026, mes 9-12)
- [ ] Volumen mínimo: 10k sesiones + 1k atletas activos
- [ ] Activar Smart Coach Engine con RAG real
- [ ] Smart Session Adaptation híbrida (reglas + RAG)
- [ ] A/B test vs versión solo determinística
- [ ] Métricas: NPS coach, decisión acceptance rate, lesiones prevenidas

### Fase 3 — Clasificadores texto libre (Q1 2027)
- [ ] Clasificador RPE desde check-in texto
- [ ] Detector overreaching
- [ ] Validación con coach en vivo

### Fase 4 — Distillation (Q3 2027+)
- [ ] Dataset ≥50k ejemplos etiquetados
- [ ] Fine-tune modelos open source
- [ ] Desplegar modelo propio
- [ ] Reducir dependencia APIs externas

---

## 🚨 Riesgos y mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Data insuficiente año 1 | Alta | Alto | Logging desde día 1 + Fase 2 solo al tener volumen |
| Alucinación Claude/GPT sobre salud | Media | Fatal | Disclaimer explícito + coach siempre aprueba final |
| Regulación data salud Chile/GDPR | Media | Alto | Anonimización vía código atleta + opt-in explícito |
| Costo APIs explota con escala | Baja | Medio | Prompt caching + distillation año 2 |
| Contradicción "no IA" marketing | Alta | Medio | Mantener "Smart" público, IA backend invisible (Opción A) |
| Dependencia OpenAI/Anthropic | Media | Medio | Abstraer con adapter pattern + preparar fallback local |

---

## ✅ Decisiones cerradas (9/9) · 2026-04-18

| # | Tema | Decisión final |
|---|---|---|
| 1 | Posición "Smart vs IA" | **A — Smart público, IA privada backend** |
| 2 | pgvector schema V1 | **APROBADO** (costo cero) |
| 3 | Logging exhaustivo día 1 | **APROBADO** (input/output/feedback) |
| 4 | Timing activación RAG | **Mes 9-12** al tener >10k sesiones |
| 5 | Embeddings provider | **OpenAI text-embedding-3-small** |
| 6 | LLM primario | **Claude Sonnet 4.6 + prompt caching** · Opus 4.7 casos críticos |
| 7 | Distillation timeline | **Año 2+** con dataset etiquetado >50k |
| 8 | Presupuesto infra | V1 **$0** · V2 **$150-350/mes** · V3 **$100-250/mes** |
| 9 | Compliance data salud | **Anonimización obligatoria** vía código atleta + opt-in explícito |

---

## 🔗 Docs relacionados

- [[COACH_FLOW_DECISIONS]] — Decisión "rename IA → Smart"
- [[../INDEX]] — Prisma schema base (60 modelos)
- [[../engines/14_smart_coach_engine|Engine 14 Smart Coach]] — Principal consumidor de IA
- [[../engines/02_session_adaptation_engine|Engine 02 Session Adaptation]] — Reglas actuales, híbrido futuro
- [[SKIN_SYSTEM]] — Engine 23 Skin Engine (no relacionado IA)

---

## 💡 Reflexión final

**No construyas IA antes de tener data.**

El error común: activar RAG y chatbots con 100 usuarios y 200 sesiones. Resultado: alucinaciones, recomendaciones incoherentes, pérdida de confianza.

**Estrategia correcta:**
1. Engines determinísticos sólidos como base.
2. Loggear todo desde día 1.
3. Activar IA solo cuando la data la justifica.
4. Destilar modelos propios cuando ya tienes dataset.

Holy Oly tiene ventaja única: halterofilia es nicho con **data altamente estructurada** (sesiones, RPE, sesgos fisiológicos). En 12-18 meses, tendrás mejor dataset de halterofilia que Nike Training Club o TrueCoach combinados. Eso es el moat real, no la IA per se.

---

**Última actualización:** 2026-04-18
**Autor:** Claude Code session
**Próximo paso:** Responder 9 decisiones + integrar schema a Prisma V1

---

## 📌 Adenda 2026-04-19 — Unit economics + stack ejecución

### Precio atleta premium: **$9 USD/mes** (ajuste desde $12)

**Costo por atleta uso intensivo (58 llamadas/día):**

| Concepto | Costo |
|---|---|
| Gemini 2.5 Flash-Lite | $0.07 |
| Sonnet 4.6 crítico (lesiones/planning) | $0.15 |
| Embeddings + pgvector | $0.05 |
| Infra servidor | $0.43 |
| Soporte | $0.30 |
| Payment fees | $0.45 |
| IVA Chile 19% | $1.71 |
| **Total costo** | **$3.16** |
| **Margen bruto** | **$5.84 (65%)** |

### Stack cascading

```
Request → SLM router (Phi-3 on-device)
       → Gemini Flash-Lite cloud (80% casos)
       → Sonnet 4.6 (crítico 5%)
```

### Voz

Híbrida on-device: Whisper tiny + Kokoro TTS local + Flash-Lite cloud. Costo marginal ~$0.

### Estrategia agente

**Paralelo + MCP server (A+E).**
- Construcción agente paralela a producto
- MCP server público como side-project viral dev community
- API-as-Service diferida mes 12+ (requiere dataset real)

### Decisiones cerradas

- ✅ Precio $9 USD atleta premium
- ✅ Gemini Flash-Lite default + Sonnet crítico
- ✅ On-device voz obligatorio
- ✅ Cap soft 100 llamadas/día
- ✅ MCP server como canal distribución paralelo
