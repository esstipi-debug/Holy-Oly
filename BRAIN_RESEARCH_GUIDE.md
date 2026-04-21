# 🧠 Brain Research Guide — Instrucciones para completar los 3 cerebros

**Fecha:** 2026-04-20
**Status:** Scaffolds creados, falta deep research por sección.
**Template base:** 7 secciones heredadas de AXON_BRAIN.md.

---

## 📋 Estructura target (los 3 cerebros)

1. Base científica
2. Stat estrella (métrica signature por deporte)
3. 6 Atributos (radar card FIFA-style)
4. Engines pendientes específicos del deporte
5. 3 Modelos macrociclo
6. Shared Peak Qual (qué comparte con los otros dos)
7. Identidad visual + próximos pasos

---

## 🏋️ HOLY OLY — Halterofilia

**Deep research prompts para Perplexity / ChatGPT / papers:**

### Base científica
- "USA Weightlifting periodization model — 4-phase macrocycle: intensity, volume, technique, recovery distribution per phase."
- "Prilepin's Table — optimal rep ranges per %1RM for Olympic lifts."
- "Sinclair Coefficient — body-weight normalization formula and current IWF values 2024."
- "Neural adaptation vs hypertrophy in Olympic weightlifting — volume thresholds."

### Stat estrella
- Confirmar: "Sinclair Score" vs "OLY Index" propio. Research: "weightlifting performance index body-weight normalized."

### 6 atributos (rellenar con benchmarks elite vs novicio)
1. Snatch Power — velocidad barra m/s por categoría.
2. Clean & Jerk Power — idem.
3. Squat Dominance — ratio FS/BS/Snatch.
4. Pull Balance — snatch pull vs clean pull %.
5. Technique — make/miss rate competición.
6. Recovery — HRV baseline por categoría edad/sexo.

### Engines específicos
- USA 4-phase periodization engine (ya spec'd en macrocycles).
- Wilks/Sinclair calculator.
- Competition cut weight protocol.
- Snatch/C&J velocity-based training.

### 3 modelos macrociclo (existentes en RAW_SOURCES)
- Cubano (Novicio/Intermedio/Avanzado/Competidor).
- Búlgaro (6D alta frecuencia).
- Chino/Coreano/Polaco/Ruso/Colombiano.
- **Research:** efectividad comparada, drop-out rate, riesgo lesión por sistema.

### Shared Peak Qual
- CNS, Stress, Readiness, Warmup, Viral Card, Mobility.

### Fuentes recomendadas
- USA Weightlifting Coaching Manual.
- Bompa "Periodization Training for Sports."
- Zatsiorsky "Science and Practice of Strength Training."
- ChinaWeightlifting.com research papers.
- JuggernautAI / 1:1 Gold articles.

---

## 🔥 VOLTA — CrossFit

### Base científica
- CompTrain methodology — 6-8 week mesocycle model.
- Glassman "Fitness in 100 Words" + 10 general physical skills.
- Energy systems: phosphagen, glycolytic, oxidative — distribution per WOD.
- Metcon recovery demands vs strength training.

### Stat estrella
- "Fitness Age" — ya definido. Research: "CrossFit Open ranking normalization + fitness age algorithm."
- Alt: "CrossFit Total" (Back Squat + Press + Deadlift 1RMs).

### 6 atributos
1. Strength — CrossFit Total / BW.
2. Engine — 2k row, 5k run, Assault Bike cal/min.
3. Gymnastics — muscle-ups, HSPU, T2B unbroken.
4. Weightlifting — Snatch + C&J.
5. Metcon — Fran, Helen, Jackie benchmarks.
6. Recovery — HRV baseline.

### Engines específicos
- CompTrain macrocycle generator.
- Benchmark tracker (girls/heroes/Open workouts).
- Fitness Age calculator.
- Pain cave tolerance score (RPE management).

### 3 modelos macrociclo
- CompTrain (ya en COMPTRAIN_MASTER.md).
- Mayhem / Invictus / PRVN para comparar.
- Open Prep (8 semanas pre-Open).

### Shared Peak Qual
- Todos los engines base.

### Fuentes recomendadas
- CompTrain methodology docs.
- CrossFit Journal (archivo histórico).
- Juggernaut CrossFit strength programs.
- BarBend / Morning Chalk Up data.
- Rx'd Radio podcast (methodology episodes).

---

## ⚡ AXON — Hyrox

### Base científica
- Hyrox race structure: 8×1km run + 8 functional stations.
- Hybrid athlete physiology: lactate threshold + functional strength.
- VO2max vs wattage profile para Hyrox elite.
- Station-to-run transition physiology (pacing strategy).

### Stat estrella
- "Flow Index" — ya definido. Research: métricas Hyrox oficiales (total time percentile, station splits, run splits).

### 6 atributos
1. Running — 5k/10k pace.
2. Functional Strength — sled push/pull, wall balls.
3. Endurance Hybrid — HR drift Z2, VO2max.
4. Transitions — pace degradation estación→run.
5. Mobility — ROM específico running + funcional.
6. Recovery — HRV.

### Engines específicos
- Hyrox pacing calculator (target time por split).
- Station-specific strength test (wall ball PR, sled max).
- Hybrid training distribution (correr:funcional ratio).
- Race simulation tracker.

### 3 modelos macrociclo
- Hyrox base build (16 semanas).
- Peaking (6 semanas pre-race).
- Off-season strength focus.

### Shared Peak Qual
- Todos los engines base.

### Fuentes recomendadas
- HYROX.com official training guides.
- Hunter McIntyre training blueprints.
- Hybrid Athlete podcast.
- Hyrox Science research papers.
- Athletica.ai / TrainingPeaks Hyrox programs.

---

## 🔧 Workflow para rellenar

### Por cada sección del cerebro:

1. **Copiar prompt arriba** → Perplexity / ChatGPT con "Deep Research" mode.
2. **Validar con 2+ fuentes independientes** (paper + coach élite + federación oficial).
3. **Extraer:**
   - Fórmulas numéricas concretas.
   - Benchmarks elite vs novicio (para calibrar atributos 0-99).
   - Referencias a papers/libros.
4. **Escribir en BRAIN.md** con formato:
   ```
   ## Sección
   - Concepto + fórmula + rango.
   - Source: [autor, año, URL].
   ```
5. **Commit** con mensaje "brain: complete [sport] section [name]".

### Auto-ingest al RAG

Una vez rellenos los brains, pipeline automático:
1. Filesystem watcher detecta cambio.
2. `polish-markdown.js` estructura YAML frontmatter.
3. `generate-rag.js` chunk + embed + ingest.
4. Brain queryable por AI Brains RAG Engine (`24_ai_brains_rag_engine.md`).

---

## ✅ Checklist completar

### Holy Oly
- [ ] Sección 1: Base científica (USA + Cubano + Prilepin)
- [ ] Sección 2: Stat estrella OLY Index fórmula final
- [ ] Sección 3: 6 atributos con rangos elite/novicio
- [ ] Sección 4: Engines específicos listados
- [ ] Sección 5: 3 modelos macrociclo seleccionados
- [ ] Sección 6: Shared Peak Qual mapeado
- [ ] Sección 7: Identidad visual + próximos pasos

### Volta (repetir)
- [ ] 7 secciones

### Axon (repetir)
- [ ] 7 secciones

---

**Mantener consistencia:** las 3 brains deben tener misma profundidad. Si una queda superficial, las viral cards y radar charts comparados serán injustos.

**Propiedad:** Stipi investiga + redacta. Claude Code integra y valida cruces con engines existentes.
