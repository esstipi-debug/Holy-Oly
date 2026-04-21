# ANTIGRAVITY_VOLUME_STEPS: Validación Secuencial de Fases (F0 - F7)

> ⚠️ **STACK UPDATE 2026-04-20:** Ver `GOOGLE_STACK_UPDATE.md`. LLM = Gemini 2.5 Flash/Pro. Embeddings = text-embedding-005. Vector DB = Cloud SQL + pgvector. Reranker = Vertex AI Ranking. Deploy = Cloud Run. Aplicar en todas las fases.

Este documento define las 8 fases secuenciales de validación estricta para el backend de IA. Avanzar requiere que cada fase apruebe su respectiva validación numérica.

---

## Línea que Sigo para Validar

1. **Fase-gate:** Es mandatorio aprobar la tabla de validación de la fase anterior antes de avanzar. Si falla, el progreso queda bloqueado en dicha fase.
2. **Command único `validate:all`:** Ejecuta todo el bloque: `tests + cost report + bench + eval` de una pasada.
3. **GO/NO-GO final (Métricas No Negociables):** 
   - Costo promedio dictaminado: **`<$0.003` por req**.
   - Latencia RAG/Agente en percentil estricto: **p95 `<1200ms`**.
   - **`80%` queries absorbidos** en capa volumen (modelos Gemini Flash / Context Cache).
4. **Evidencia Objetiva a Presentar:**
   - **Router Accuracy** frente a un fixture de **50 queries etiquetadas** (Coach vs. Athlete vs. Chit-chat).
   - **RAG Recall** versus un fixture masivo de **200 queries metodológicas** de alto peso.
   - **Cost logger** debe agregar el gasto incurrido a lo largo de **7 días reales** probados empíricamente, no de forma sintética (pre-producción staging).
   - **Load Test** con estrés garantizado de **100 concurrentes × 5 minutos**.
5. **Bloqueos CI:** Estrictamente **imposible el merge a `main`** de la rama de desarrollo si cualquier métrica anterior arroja fallo. No se aprueban PRs compasivos.
6. **Ciclo de Corrección:** ¿Falla una métrica? -> (Identificar el intent / métrica / modelo culpable) -> (Ajustar vectorización de chunking, routing o prompts) -> Re-testear el ciclo completo de la fase.

---

## 8 Fases Secuenciales (Validación Numérica)

### F0: Setup y Base Line
- **Objetivo:** Setup estricto inicial con variables de entorno o dependencias.
- **Validación Númerica:** `0` errores de compilación, > `50%` cobertura de testing de salud básica.

### F1: Extracción y Chunking Core
- **Objetivo:** Normalización semántica de todos los manuales y libros de reglas.
- **Validación Numérica:** `0%` pérdida de documentos (Drop rate 0). Tasa de error en parseo `PDF/MD < 2%`.

### F2: Vector Store y Sembrado
- **Objetivo:** Alimentar al índice en Cloud SQL Postgres con pgvector.
- **Validación Numérica:** Tiempo total de indexación de manuales estáticos `< 30 min` y pérdida nula `0 chunks dead`.

### F3: Router Agent Evaluation
- **Objetivo:** Modelar el routing entre queries de Programación vs Control de Daños.
- **Validación Numérica:** Exactitud (Router Accuracy) general `> 95%` ante las **50 queries** listadas en el fixture. Demora de enrutamiento aislado `< 400ms`.

### F4: Core Retrieval Optimization
- **Objetivo:** Evaluar puramente si la BD escoge bien los sub-documentos correctos.
- **Validación Numérica:** Recovery / Recall contra **200 queries** `> 85%` (Métrica Context Precision en herramientas como LangSmith o Ragas).

### F5: Agente de Generación Central
- **Objetivo:** Validar la capacidad de síntesis, prohibiendo explicaciones no científicamente sustentadas por textos fuente.
- **Validación Numérica:** Score Ragas *Faithfulness* o Hallucination Score rigurosamente `< 0.05`. Tono calificador de empático estandarizado en métrica binaria en un 90%.

### F6: Capa Eficiente de Volumen
- **Objetivo:** Caché de preguntas repetitivas o routing simple hacia modelos ultra rápidos (Flash).
- **Validación Numérica:** Demostrar que el **`80%` del volumen** de un día cae en este cubo.

### F7: GO/NO-GO Final y Stress Telemetría
- **Objetivo:** Simulación de entorno y CI. Ejecutar el `validate:all` totalizador hacia Cloud Run.
- **Validación Numérica:** Latencia real de **p95 `<1200ms`** a `100 conc / 5m`. Costo reportativo demostrándose bajo los `$<0.003` por request en Cloud Monitoring.
