# 🧠 RAG Brands Instructions — Holy Oly / Volta / Axon

> **Destinatario:** Antigravity
> **Fecha:** 2026-04-20
> **Estado actual:** Solo Huberman ingested. Faltan 3 marcas deportivas.
> **Objetivo:** Poblar `knowledge_base` (pgvector) con contenido de las 3 marcas usando `text-embedding-005`.

---

## 1. Mapeo de marcas → contenido

| Marca | Deporte | Fuente primaria | Directorio local |
|---|---|---|---|
| **Holy Oly** | Halterofilia olímpica (USAW) | USA Weightlifting manuals, Catalyst Athletics, Chinese/Bulgarian methods | `holy_oly/source/` |
| **Volta** | CrossFit / Functional Fitness | CompTrain, Mayhem, PRVN, Invictus | `volta/source/` |
| **Axon** | Hyrox | Hyrox PDF rulebook, Hyrox Training Club, Runs×Stations protocols | `axon/source/` |

**Brain files ya redactados** (usar como semilla curada):
- `holy_oly/HOLY_OLY_BRAIN.md`
- `volta/VOLTA_BRAIN.md`
- `axon/AXON_BRAIN.md`

---

## 2. Schema de metadata obligatorio

Cada chunk ingested debe incluir:

```python
{
  "brand": "holy_oly" | "volta" | "axon" | "huberman",
  "sport": "weightlifting" | "crossfit" | "hyrox" | "lifestyle",
  "topic": "technique" | "programming" | "recovery" | "nutrition" | "injury",
  "difficulty": "beginner" | "intermediate" | "advanced",
  "source": "<filename>",
  "section": "<h2_title>",
  "token_count": <int>,
  "lang": "es" | "en"
}
```

**Por qué importa:** permite filtrar en retrieval (`WHERE brand='volta' AND topic='programming'`) y hacer routing preciso.

---

## 3. Chunking strategy (por tipo de contenido)

| Tipo contenido | Chunk size | Overlap | Método |
|---|---|---|---|
| Manuales técnicos (USAW, Hyrox rules) | 512 tokens | 80 | Split por H2/H3 markdown |
| Programación (CompTrain, Mayhem) | 384 tokens | 50 | Split por WOD/sesión |
| Podcast transcripts (Huberman) | 768 tokens | 120 | Split por tópico semántico |
| Engines internos (`engines/*.md`) | 512 tokens | 80 | Split por sección |
| Brain files (HOLY_OLY_BRAIN etc.) | 256 tokens | 40 | Split por subsection |

Regla: **chunks < 200 tokens se descartan** (ruido). **Chunks > 1024 se re-splitean.**

---

## 4. Pipeline por marca (3 ETL scripts nuevos)

Crear:

### `backend/src/ingestion/etl_holy_oly.py`
```python
# Fuentes:
# 1. holy_oly/source/*.md (brain curado)
# 2. holy_oly/source/usaw/*.pdf (manuales USAW)
# 3. engines/*.md filtered por tag weightlifting
# Output: chunks con brand="holy_oly", sport="weightlifting"
```

### `backend/src/ingestion/etl_volta.py`
```python
# Fuentes:
# 1. volta/source/*.md (CompTrain scraped)
# 2. volta/VOLTA_BRAIN.md
# 3. engines/*.md filtered por tag crossfit
# Output: chunks con brand="volta", sport="crossfit"
```

### `backend/src/ingestion/etl_axon.py`
```python
# Fuentes:
# 1. axon/source/*.md (Hyrox rulebook + HTC)
# 2. axon/AXON_BRAIN.md
# 3. engines/*.md filtered por tag hyrox
# Output: chunks con brand="axon", sport="hyrox"
```

**Patrón común:** reusar `chunker.py` genérico, solo cambiar metadata injection.

---

## 5. Orquestador `ingest_all.py`

```python
# backend/src/ingestion/ingest_all.py

from .etl_huberman import ingest_huberman
from .etl_holy_oly import ingest_holy_oly
from .etl_volta import ingest_volta
from .etl_axon import ingest_axon

def run_full_ingestion():
    stats = {
        "huberman": ingest_huberman(),
        "holy_oly": ingest_holy_oly(),
        "volta": ingest_volta(),
        "axon": ingest_axon(),
    }
    print_report(stats)  # chunks por marca, tokens totales, costo
    return stats
```

Ejecutar con: `python -m src.ingestion.ingest_all`

---

## 6. Validaciones numéricas (F1-F2 gates)

Antes de avanzar a F3:

| Métrica | Target | Comando |
|---|---|---|
| Chunks totales | ≥ 2,500 | `SELECT COUNT(*) FROM knowledge_base;` |
| Chunks por marca | ≥ 400 cada una | `SELECT brand, COUNT(*) GROUP BY brand;` |
| Drop rate parseo | < 2% | Log de ETL |
| Tiempo indexación | < 30 min | Timer en `ingest_all` |
| Embedding cost | < $0.50 total | Gemini usage dashboard |
| Chunks huérfanos (sin embedding) | 0 | `WHERE embedding IS NULL` |

**Si alguna falla → bloquea F3.**

---

## 7. Retrieval con filtros por marca

Actualizar `rag_retriever.py`:

```python
def get_context(self, query: str, brand: str = None, limit: int = 5):
    # Si la query viene de UI de atleta Holy Oly → brand="holy_oly"
    # Si es query cross-brand (ej. recovery Huberman) → brand=None
    filters = {"brand": brand} if brand else {}
    results = self.vector_store.search(query, filters=filters, limit=limit)
    ...
```

Router detecta marca desde `user.sport_id` en request.

---

## 8. Fuentes externas que Antigravity DEBE scrapear

**Prioridad alta (semana 1):**

### Holy Oly
- https://www.catalystathletics.com/articles/ (halterofilia técnica)
- USAW Level 1 Course manual (PDF oficial)
- `huberman_topics.md` filtered (alcohol, sleep, supplements)

### Volta
- https://comptrain.co/blog/ (programación)
- https://www.crossfit.com/workout (WODs oficiales)
- Invictus Athlete blog

### Axon
- https://hyrox.com/race-rules/ (reglamento)
- Hyrox Training Club programs (PDFs oficiales)
- https://www.hyroxtraining.com/blog

**Usa:** `scrape_huberman.py` como template. Respeta `robots.txt`, rate-limit 1 req/2s.

---

## 9. Curación manual (anti-garbage)

Antes de indexar, aplicar `polish-markdown.js` (ya existe en `scripts/`):

- Remueve footers, navegación, ads
- Normaliza headers (H1 solo para título doc, H2 para secciones)
- Convierte tablas HTML → markdown
- Detecta y remueve contenido duplicado (SimHash)

**Output:** archivos `.cleaned.md` que van a chunker.

---

## 10. Checklist de entrega (F2 GO)

- [ ] `etl_holy_oly.py`, `etl_volta.py`, `etl_axon.py` creados
- [ ] `ingest_all.py` ejecuta las 4 marcas en cadena
- [ ] ≥ 400 chunks por marca en `knowledge_base`
- [ ] Metadata completa (brand, sport, topic, difficulty)
- [ ] Filtros por brand funcionan en `rag_retriever.py`
- [ ] Tests: `pytest tests/test_retrieval_by_brand.py` PASS
- [ ] Cost logger reporta < $0.50 total embedding
- [ ] Commit: `feat(rag): multi-brand ingestion (holy_oly + volta + axon)`

---

## 11. Fixture de testing (20 queries mínimas)

Crear `backend/tests/fixtures/brand_queries.json`:

```json
[
  {"query": "¿Cómo corregir un fallo en front squat al recibir el clean?", "expected_brand": "holy_oly"},
  {"query": "Programación 5/3/1 para atletas de CrossFit", "expected_brand": "volta"},
  {"query": "Estrategia de transición entre run y sled push en Hyrox", "expected_brand": "axon"},
  {"query": "Cold plunge después de entrenamiento pesado", "expected_brand": "huberman"},
  ...20 total, 5 por marca
]
```

**Target accuracy:** ≥ 85% hit del brand correcto.

---

## 12. Acción inmediata

1. **Leer** `HOLY_OLY_BRAIN.md`, `VOLTA_BRAIN.md`, `AXON_BRAIN.md` (fuente de verdad curada)
2. **Scrapear** fuentes externas prioritarias (sección 8)
3. **Crear** 3 ETL scripts + orquestador
4. **Ejecutar** `ingest_all.py` con logs verbose
5. **Validar** métricas (sección 6)
6. **Reportar** a telemetry con `runId` activo

**Sin esto, F3 (Router) y F4 (Retrieval) están bloqueados.**

---

**Ruta:** `C:\Users\Gamer\Desktop\Holy Oly 001\RAG_BRANDS_INSTRUCTIONS.md`
