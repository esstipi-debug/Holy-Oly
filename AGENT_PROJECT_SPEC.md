# AGENT_PROJECT_SPEC: AI Backend para Holy Oly

> ⚠️ **STACK UPDATE 2026-04-20:** Ver `GOOGLE_STACK_UPDATE.md` — override oficial. Stack 100% Google (Gemini + Cloud SQL pgvector + Vertex AI + Cloud Run). Anthropic/Voyage/Cohere/Supabase/Prisma prohibidos.

## 1. Contexto Mínimo y Archivos a Leer
**Misión:** Construir el "Cerebro" de Holy Oly, un backend IA diseñado para ingerir, procesar y servir conocimiento técnico especializado en Halterofilia (USA Weightlifting), CrossFit, Hyrox y protocolos de estilo de vida/recuperación (Huberman Lab). Su objetivo es proporcionar prescripciones analíticas empáticas ("Control de Daños") para optimizar el rendimiento y evitar el burnout.

**Archivos esenciales a revisar antes de la implementación:**
- `README.md` (Visión general del SaaS).
- `INDEX.md` (Mapa del proyecto).
- `MEMORY.md` (Restricciones y aprendizajes previos).
- `engines/22_imr_engine.md` (Lógica interna del índice de recuperación y carga metabólica).
- `ELITE_PROMPTING_GUIDE.md` (Para referenciar el tono de las respuestas y arquitectura de prompts).

## 2. Módulo 1: RAG Avanzado
**Objetivo:** Motor de recuperación semántica que unifique las metodologías de entrenamiento y de salud.
- **Funcionalidad:** Búsqueda híbrida (BM25 + Dense Embeddings) para resolver consultas complejas de manera contextual (ej: "Atleta durmió 4h después de tomar alcohol, ¿qué variante de halterofilia procede hoy sin riesgo de lesión?").
- **Componentes:**
  - Indexación vectorial en Cloud SQL Postgres con `pgvector` (o AlloyDB AI).
  - LLM dedicado **Gemini 2.5 Pro** vía Vertex AI para generar respuestas sintéticas seguras combinando metodologías.

## 3. Módulo 2: Agent Router
**Objetivo:** Clasificador inteligente en la capa de API para derivar las consultas de los atletas o coaches al engine adecuado.
- **Flujo:**
  - `Coach Query` -> Deriva al Engine de Programación y Métricas de Rendimiento.
  - `Athlete Query` -> Deriva al Engine de Recuperación Empática (Control de Daños).
  - `Ingestion Trigger` -> Deriva al Pipeline de Auto-ingest.
- **Implementación:** Gemini 2.5 Flash configurado estrictamente para function calling y routing sin alucinaciones, absorbiendo el volumen de peticiones ligeras.

## 4. Módulo 3: Pipeline Auto-ingest
**Objetivo:** Sistema asíncrono para mantener viva la base de conocimientos sin requerir intervención manual constante.
- **Funcionalidad:** Extracción, fragmentación (text chunking) y vectorización vía `text-embedding-005` (Google) de nuevos contenidos. Mantenidos por Cloud Scheduler.
- **Proceso:** Limpieza -> Metadata tagging -> Embeddings -> Guardado en Cloud SQL Postgres.

## 5. Estructura de Directorios Target
Se requiere aplicar una Clean Architecture modular:

```text
/src
  /api          # Endpoints, Middlewares y Agent Router
  /core         # Dominios de negocio: RAG, Tipos, Interfaces
  /ingestion    # Lógica del Pipeline Auto-ingest (Web Scraping, Chunking)
  /infrastructure # Conexiones a BD, LLMs, Vector Stores
  /tests        # Tests unitarios y de integración
/docs           # Documentación y specs (como la actual)
```

## 6. Tareas Week-by-Week (Roadmap)
- **Semana 1: Setup y Pipeline Ingesta.** Configurar entorno. Desarrollar scripts de extracción y segmentación de datos crudos (ETL).
- **Semana 2: RAG Básico y Base de Datos.** Implementar el Vector Store, realizar el embedding bulk de la base de conocimiento (Huberman, Halterofilia) validando la conexión de DB.
- **Semana 3: Agent Router y LLM Core.** Desarrollar la capa de inferencia principal y el routing de peticiones según la carga cognitiva de perfiles (Coach vs Athlete).
- **Semana 4: APIs, Tuning y Performance.** Exponer endpoints. Pruebas de evaluación RAG (Retrieval tuning), ajuste del tono "Control de Daños" y reducción de latencias.

## 7. Criterios de Aceptación (Métricas Numéricas)
- **Precisión Semántica:** Recuperación de fragmentos relevantes `Top-K (K=3)` con una exactitud `> 85%` para casos ambiguos.
- **Latencia de Router:** El Agent Router debe decidir la rama de ejecución en `< 400ms`.
- **Latencia Total RAG:** El ciclo End-to-End (API Query -> Retrieval -> Generación LLM) debe ser `< 2500ms` en el p90.
- **Cobertura de Testing:** `> 80%` min coverage de unit tests en core models y pipeline router.
- **Tasa de Errores Auto-ingest:** `< 2%` de fallos al parsear nuevos PDFs nativos o artículos reconocidos.

## 8. Restricciones Stack
**Estrictamente PROHIBIDO (Stack Restrictions):**
- ❌ **Supabase** (Ni pgvector de Supabase, ni Auth).
- ❌ **Prisma ORM**.
- ❌ **Anthropic (Claude), OpenAI, Cohere o Voyage**.

**Stack OBLIGATORIO (100% Google):**
- **Backend:** Node.js / TypeScript.
- **Base de Datos / Vectorial:** Cloud SQL Postgres + pgvector (o AlloyDB).
- **ORM / Queries:** Drizzle ORM.
- **LLM / AI Layer:** Gemini 2.5 Pro (Razonamiento lento/crítico) y Gemini 2.5 Flash (Router/Volumen). Vertex AI Ranking API para Rerank. `text-embedding-005` para embeddings.
- **Despliegue:** Cloud Run (Scale-to-zero) y Cloud Logging para Telemetría.

## 9. Decisiones Delegadas al Agente (Antigravity)
- **Stack Definitivo Oculto:** Eres libre de elegir el lenguaje (TypeScript vs Python) y el ORM/VectorStore de acuerdo con el mejor rendimiento y facilidad de mantenimiento.
- **Táctica de Chunking:** Determinar el tamaño (chunk size) y superposición (overlap) ideales para el tipo de texto formativo de Holy Oly (ej: listados metodológicos vs transcripciones de podcast).
- **Diseño del Esquema DB Relacional:** Estructurar la DB (Cloud SQL) mediante Drizzle schemas abstrayendo correctamente las interfaces `LLMProvider` y `Embedder` para evitar vendor lock-in.

---

**[Handoff to Antigravity]**
- Ruta del proyecto: `C:\Users\Gamer\Desktop\Holy Oly 001`
- Repo local referenciado: `esstipi-debug/Holy-Oly`
- El Spec está completo, el Agente tiene luz verde para proceder de forma autónoma.
