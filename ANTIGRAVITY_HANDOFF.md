# ANTIGRAVITY_HANDOFF

> ⚠️ **STACK UPDATE 2026-04-20:** Ver `GOOGLE_STACK_UPDATE.md` — stack cambió a 100% Google (Gemini + Cloud SQL pgvector + Vertex AI). Sobrescribe cualquier referencia a Anthropic/Voyage/Cohere.

En este documento encontrarás el handoff único necesario para iniciar definitivamente la orquestación del backend de Holy Oly.

---

## Bloque Copy-Paste para Antigravity

**[ INICIO COPIA PARA EL PROMPT DEL AGENTE ]**
Asume tu identidad estructural completa como Tech Lead (Antigravity). Estamos construyendo la arquitectura híbrida Backend de Holy Oly (RAG Avanzado para Atletas y Coaches). 
Tu misión inquebrantable a partir de aquí es cumplir los 9 pasos ejecutables con el nuevo Google Stack fijado (FastAPI/Node.js, Drizzle/SQLAlchemy, Cloud SQL Postgres + pgvector, Gemini 2.5 y Vertex AI). 

Restricciones inquebrables dictadas hoy:
- No tienes permiso para usar Supabase ni Prisma.
- No tienes permiso para usar Anthropic Claude, OpenAI, Cohere o Voyage. Todo vector, rerank y LLM debe correr por Google.
- Es mandatorio avanzar superando fase por fase los "Fase-Gates" validando métricas estrictas. 

Inicia leyendo en orden los 8 Documentos Madre listados en tu Spec, aplica el ciclo de pasos lógicos (F0 -> F7), e inicializa el Cost Logger.
**[ FIN COPIA ]**

---

## 8 Documentos Madre a Leer en Orden
1. `README.md`
2. `INDEX.md`
3. `MEMORY.md`
4. `ELITE_PROMPTING_GUIDE.md`
5. `engines/22_imr_engine.md`
6. `PEAK_QUAL.md`
7. `AGENT_PROJECT_SPEC.md`
8. `ANTIGRAVITY_VOLUME_STEPS.md`

---

## 9 Pasos Ejecutables Secuenciales
1. **Verificar Repo Local:** Validar claves y entorno actual (`require API keys`).
2. **Entorno y Scripts Básicos (F0):** Levantar Virtual Environments e instalar repos requeridos para ETL.
3. **Parseo de Semillas (F1):** Procesar listados crudos (`huberman_topics.md` y guías locales usando Chunkers limpios).
4. **Almacenamiento (F2):** Indexar lo procesado hacia Cloud SQL Postgres (pgvector) usando embeddings `text-embedding-005`.
5. **Configuración de Routing LLM (F3):** Armado de Langchain/Google Vertex router (Gemini 2.5 Flash) para derivar Atleta vs Coach.
6. **Implementar Generador Secuencial (F4-F5):** Escribir capa retrieval híbrida + el output de Control de Daños/Empatía vía Gemini 2.5 Pro.
7. **Cache & Capa de Volumen (F6):** Escribir mecanismo semántico para cachar (Context Caching API) que absorba cuota de consultas redundantes.
8. **Scripts Mocks & Validaciones (F7):** Integrar la suite bash de evaluación para automatizar el comando `validate:all` verificando métricas.
9. **Despliegue Base:** Exponer Telemetría vía Cloud Logging / Cloud Run localmente validando SLAs.

---

## Reglas de Operación
- **Reporte:** Detallar outputs en resúmenes objetivos cada vez que culmina un commit importante de código.
- **Fase-gate:** Avanzar estrictamente sujeto a superar el paso numérico de `ANTIGRAVITY_VOLUME_STEPS`.
- **Restricciones:** 0% Supabase, 0% Prisma. Estrictos con Clean Architecture, evitando dependencias gigantes si no son requeridas.
- **Costo:** Monitoreo intrusivo de coste LLM token-level para garantizar meta de `<$0.005 / request`.

## Criterios GO / NO-GO (Merge)
No existirá pull request a Main a menos que se presente el reporte arrojando:
- P95 latency < 1200ms al 100 concurrent load en Cloud Run.
- Cost <$0.003 en queries gracias a Gemini Flash.
- Tasa de 80% o más de queries atrapadas por Capa de Volumen antes de ir al vector grueso y LLM denso.

## 7 Entregables Finales
1. Entorno Backend limpio con API Rest expulsa local (`main.py` core).
2. ETL pipeline modular y aislado.
3. Suite de tests y fixtures numéricos expuestos en 1 bash (`validate:all`).
4. Capa de Agent Router con "Control de Daños" en rama para Atletas, "Métricas" para Coaches.
5. Caché LLM / Fast-Retrieval Layer operativo.
6. Local Cost Logger integrado de retención sobre 7 días (no sintético).
7. Reporte GO emitido demostrando las aserciones de Load Test y Fixturas pasadas al 100%.

---

## Arranque: 5 Pasos para Stipi
A ti, Stipi: 

1. **Abre Antigravity** en la consola / chat principal de esta raíz.
2. **Copia el bloque de código** (ubicado en este documento bajo `[ INICIO COPIA ]`).
3. **Pega** ese bloque proveyéndome autorización. Además, entrégame estrictamente estas **3 CREDENCIALES NUEVAS**:
   - `GOOGLE_API_KEY`
   - `GOOGLE_APPLICATION_CREDENTIALS` (service account JSON content)
   - `DATABASE_URL` (Cloud SQL Postgres connection string)
4. Ejecuta o permite que inicie, cruzando los brazos mientras se ejecutan pruebas de setup de los pasos F0→F7.
5. **Telemetría directa:** Revisa Google Cloud Monitoring y Cloud Logging de forma nativa para ver costos y SLA desde tu móvil.
