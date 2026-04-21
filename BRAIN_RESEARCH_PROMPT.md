# 🔬 Deep Research Prompt — 3 Brains Peak Qual

Copiar/pegar este prompt completo en Perplexity Deep Research, ChatGPT Deep Research, o Claude con búsqueda web. Generar **3 reportes separados** (uno por deporte).

---

## PROMPT UNIVERSAL (reemplaza [DEPORTE])

```
Eres investigador senior en ciencias del deporte especializado en [DEPORTE].
Necesito un documento técnico, con citas a papers y fuentes verificables,
que cubra exactamente 7 secciones con el formato y profundidad que describo.

CONTEXTO DEL PRODUCTO
Estoy construyendo una plataforma SaaS ("Peak Qual") con 3 sub-marcas deportivas:
- Holy Oly (Halterofilia olímpica)
- Volta (CrossFit)
- Axon (Hyrox)
Cada deporte tiene su propio "cerebro" (brain) con ciencia, métricas, macrociclos.
Comparten engines core: Stress Engine (CNS + Banister Fitness-Fatigue), Readiness,
Warmup, Mobility, Viral Card (radar 6 atributos estilo FIFA).
Stack: TypeScript + Drizzle ORM + PostgreSQL + React + Claude API.
Público: atletas amateur-competidor (edades 18-45, ambos sexos).

ENTREGA ESPERADA
Un documento markdown de 1500-3000 palabras por deporte, con las 7 secciones
abajo listadas. Cada afirmación numérica DEBE incluir fuente (paper, libro,
federación oficial, coach élite con URL).

═══════════════════════════════════════════════════════
SECCIÓN 1 · BASE CIENTÍFICA
═══════════════════════════════════════════════════════
- Modelos de periodización dominantes en [DEPORTE] (lineal, bloques, ondulatorio).
- Demandas fisiológicas: sistemas energéticos (%fosfágeno/glucolítico/oxidativo).
- Adaptaciones neurales vs hipertróficas relevantes.
- Umbrales de volumen/intensidad MEV, MAV, MRV (Israetel) si aplica.
- Factores determinantes de performance top: fuerza, potencia, resistencia,
  técnica, movilidad — con peso relativo %.
- 3-5 referencias bibliográficas clave.

═══════════════════════════════════════════════════════
SECCIÓN 2 · STAT ESTRELLA (signature metric)
═══════════════════════════════════════════════════════
Identificar LA métrica signature del deporte (ej. Sinclair en halterofilia,
Fitness Age en CrossFit, Flow Index en Hyrox).
- Fórmula matemática completa.
- Tabla de rangos: principiante / intermedio / avanzado / élite / world-class.
- Diferencias por edad y sexo (coeficientes).
- Cómo se calcula en tiempo real con datos de app
  (sesiones completadas, PRs, tests).
- Validación cruzada con métricas oficiales de la federación.

═══════════════════════════════════════════════════════
SECCIÓN 3 · 6 ATRIBUTOS RADAR (tarjeta FIFA 0-99)
═══════════════════════════════════════════════════════
Para un radar polygon estilo FIFA/PES, proponer exactamente 6 atributos
específicos a [DEPORTE]. Por cada atributo:
- Nombre corto (1-2 palabras, ES + EN).
- Qué mide biomecánicamente.
- Inputs crudos (tests, sesiones, sensores).
- Fórmula de normalización 0-99 con ejemplos numéricos.
- Benchmarks: 20 (principiante), 50 (recreacional), 75 (competidor),
  90+ (élite), 99 (world-class).
- Diferencia M/F si aplica.

═══════════════════════════════════════════════════════
SECCIÓN 4 · ENGINES ESPECÍFICOS DEL DEPORTE
═══════════════════════════════════════════════════════
Qué lógica algorítmica necesita el sistema además de los engines core.
- Engine de periodización (entrada: objetivo + nivel + tiempo; salida: macro).
- Engine de warmup específico deporte.
- Engine de prevención lesiones (patrones de riesgo de este deporte).
- Engine de técnica (checklist movimientos clave + video).
- Engine de competición (tapering, cut weight, race-day protocol).
- Engine de benchmarks (qué workouts/tests mide y cuándo).
Para cada engine: inputs, outputs, fórmula/lógica, frecuencia ejecución.

═══════════════════════════════════════════════════════
SECCIÓN 5 · 3 MODELOS DE MACROCICLO
═══════════════════════════════════════════════════════
Describir 3 macrociclos reales usados por élites del deporte.
Por cada uno:
- Nombre + origen (país, coach, equipo).
- Duración típica (semanas).
- Estructura bloques: Acumulación, Intensificación, Realización, Transición.
- Distribución semanal (% volumen por día).
- Ejemplo de 1 semana dentro de cada bloque.
- Pros / contras / perfil de atleta ideal.
- Fuente (libro, paper, coach oficial).

═══════════════════════════════════════════════════════
SECCIÓN 6 · SHARED PEAK QUAL — Integración con engines core
═══════════════════════════════════════════════════════
Cómo los engines compartidos se adaptan a [DEPORTE]:
- CNS Score: qué factores pesan más (ej. Hyrox = HR drift; halterofilia = bar velocity).
- Banister Fitness/Fatigue: constantes k1/k2 recomendadas.
- Readiness: modificadores específicos.
- Warmup: duración + patrones.
- Mobility: 8-10 tests ROM priorizados.
- Viral Card radar: cómo se colorea la card + glow por skin.

═══════════════════════════════════════════════════════
SECCIÓN 7 · IDENTIDAD + VIABILIDAD COMERCIAL
═══════════════════════════════════════════════════════
- Paleta sugerida (colores HEX).
- Tipografía ideal (display + body).
- Tone of voice (3 adjetivos).
- Tamaño de mercado global + LatAm + Chile (atletas activos).
- 3 competidores directos de software/app + sus gaps.
- Pricing benchmark (qué cobran apps líderes).
- Buyer persona principal (edad, ingreso, comportamiento).

═══════════════════════════════════════════════════════
RESTRICCIONES DE RESPUESTA
═══════════════════════════════════════════════════════
- Markdown puro, sin emojis decorativos.
- Cada número con fuente entre paréntesis: "bar velocity 0.8 m/s (González-Badillo, 2014)".
- Tablas markdown para benchmarks.
- No rellenar con marketing — datos duros.
- Si un dato no existe o es incierto, decirlo explícitamente: "sin datos públicos".
- Priorizar: papers peer-reviewed > libros autorizados > coaches élite > blogs.
- Idioma: español técnico. Términos específicos en inglés entre comillas si no hay traducción.
```

---

## 📋 Uso

**3 ejecuciones separadas:**

1. Reemplazar `[DEPORTE]` por **Halterofilia Olímpica (Olympic Weightlifting)** → pegar resultado en `holy_oly/source/RESEARCH_RAW.md`
2. Reemplazar `[DEPORTE]` por **CrossFit** → `volta/source/RESEARCH_RAW.md`
3. Reemplazar `[DEPORTE]` por **Hyrox** → `axon/source/RESEARCH_RAW.md`

**Después:** pegas los 3 archivos aquí, yo:
- Estructuro en los brains correspondientes.
- Calibro atributos radar con los benchmarks.
- Actualizo engines con constantes específicas por deporte.
- Ingesto al RAG vía `polish-markdown.js` + `generate-rag.js`.

---

**Ruta archivo:** `C:\Users\Gamer\Desktop\Holy Oly 001\BRAIN_RESEARCH_PROMPT.md`
