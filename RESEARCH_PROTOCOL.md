# Research Protocol — Peak Qual Engine Development

> Usa este protocolo para investigar cualquier engine nuevo.
> Con esta información, el sistema puede crear el BRAIN.md, config.py y engine.py correspondientes.

---

## Cómo usar este protocolo

1. Copia la sección **Template de Investigación**
2. Rellena cada bloque con lo que encuentres
3. Trae el documento relleno → el sistema construye el engine completo

---

## Template de Investigación

### BLOQUE 1 — Identidad del Engine
```
Nombre del engine: _______________
Deporte(s) donde aplica: [ ] Holy Oly  [ ] Volta  [ ] Axon  [ ] Peak Qual (todos)
¿Qué problema resuelve?
¿Qué sin este engine no se puede detectar/medir?
```

### BLOQUE 2 — Variables de Entrada
```
¿Qué datos necesita el engine para funcionar?
Por cada variable:
  - Nombre: _______________
  - Unidad de medida: _______________
  - Rango normal: _______________
  - Cómo se obtiene: [ ] Manual  [ ] Wearable  [ ] Test  [ ] Calculado
  - ¿Es opcional o requerida?
```

### BLOQUE 3 — Matemática y Fórmulas
```
¿Existe un modelo científico establecido? (nombre, autor, año)
Fórmula principal: _______________
¿Hay sub-fórmulas o pasos intermedios?
¿Qué parámetros varían por género / edad / deporte?
¿Hay ventanas de tiempo (7d, 28d, ciclo mensual)?
```

### BLOQUE 4 — Umbrales y Zonas
```
¿Cuándo es una señal BUENA? (valores, condiciones)
¿Cuándo es WARNING? (valores, condiciones)
¿Cuándo es CRÍTICO / RED FLAG? (valores, condiciones)
¿Hay diferencias por género o deporte?
```

### BLOQUE 5 — Cuándo SÍ y cuándo NO
```
Situaciones donde esta variable AYUDA al rendimiento:
Situaciones donde esta variable DAÑA el rendimiento:
Situaciones donde ENMASCARA otras señales:
Situaciones donde otras variables ENMASCARAN esta:
```

### BLOQUE 6 — Alertas para el atleta
```
Mensaje nivel INFO (informativo, sin urgencia):
Mensaje nivel WARNING (requiere atención):
Mensaje nivel CRITICAL (acción inmediata):
¿El atleta debe ver esto o solo el coach?
```

### BLOQUE 7 — Intervenciones automáticas
```
Si umbral WARNING → ¿qué ajuste hace el sistema?
Si umbral CRITICAL → ¿qué ajuste hace el sistema?
¿Afecta el tonelaje? ¿Cuánto? (ej: -15%)
¿Afecta la intensidad (%1RM)? ¿Cuánto?
¿Afecta el volumen (reps/sets)?
¿Cuántos días dura la intervención?
¿Cuándo se levanta la intervención?
```

### BLOQUE 8 — Integración con otros engines
```
¿Cómo afecta al Stress Engine (Fitness/Fatigue/Readiness)?
¿Cómo afecta al Session Adaptation (Risk Score)?
¿Cómo afecta al Macrocycle Engine (tonelaje/fase)?
¿Cómo afecta al Caffeine Engine?
¿Hay interacción con otros engines pendientes?
```

### BLOQUE 9 — Visualizaciones
```
¿Cómo se vería esto en un gráfico? Describe 2-3 visualizaciones útiles.
  Viz 1: tipo, ejes, qué muestra, quién la ve (coach/atleta/ambos)
  Viz 2: _______________
  Viz 3: _______________
```

### BLOQUE 10 — Fuentes científicas
```
¿Hay literatura científica que respalde el modelo?
¿Hay protocolos de entrenamiento que lo usen?
¿Hay papers, libros, o expertos de referencia?
```

---

## Engines pendientes y sus preguntas clave

### ALCOHOL ENGINE
Investiga:
- ¿Cuánto alcohol (g/kg) suprime la síntesis proteica? ¿Por cuántas horas?
- ¿Cómo interfiere con el sueño profundo (Deep%)? ¿Fragmenta REM?
- ¿Qué hace al HRV la noche siguiente?
- ¿Hay un umbral "seguro" para atletas de fuerza?
- ¿Cómo interactúa con cafeína si se consumen el mismo día?
- ¿Difiere el impacto entre hombre y mujer?

### SLEEP QUALITY ENGINE
Investiga:
- ¿Qué % de Deep sleep es mínimo para recuperación neuromuscular?
- ¿Qué % de REM es mínimo para aprendizaje motor (técnica weightlifting)?
- ¿Cómo calcular un Sleep Score compuesto? ¿Existe modelo establecido?
- ¿Qué causa fragmentación del sueño en atletas de fuerza?
- ¿Cómo se relaciona Deep% con HRV matutina?
- ¿Difiere la necesidad por género/edad?

### HORMONAL ENGINE (Ciclo Femenino)
Investiga:
- ¿Qué fases del ciclo de 28 días son anabólicas vs catabólicas?
- ¿En qué fase se puede entrenar con mayor intensidad?
- ¿Cuándo reducir volumen/intensidad? ¿Cuánto?
- ¿Cómo afecta al RPE percibido en cada fase?
- ¿Cómo afecta al rendimiento en snatch/clean & jerk específicamente?
- ¿Qué ajuste de %1RM es recomendable por fase?
- ¿El ciclo hormonal modifica el riesgo de lesión ligamentosa?

### MOVEMENT VOLUME ENGINE (Holy Oly específico)
Investiga:
- ¿Qué es el tonelaje óptimo semanal por movimiento (snatch, C&J, squat)?
- ¿Cuántas reps de snatch/semana según nivel (principiante/intermediio/élite)?
- ¿Cómo varía por fase del macrociclo (hypertrophy→peaking)?
- ¿Qué ratio Snatch:Clean&Jerk:Squat es óptimo?
- ¿Cómo se mide el TUT (time under tension) en halterofilia?
- ¿Hay un umbral de tonelaje donde el riesgo de lesión sube?

### BAR VELOCITY ENGINE
Investiga:
- ¿Qué velocidades (m/s) corresponden a cada %1RM? (tabla VBT)
- ¿Qué velocidad de barra indica fatiga neural (CNS) aguda?
- ¿Cómo varía por movimiento (snatch vs squat vs deadlift)?
- ¿Se puede estimar 1RM en tiempo real con velocidad?
- ¿Qué hardware/apps capturan bar velocity? (PUSH, GymAware, etc.)

### NUTRITION ENGINE
Investiga:
- ¿Qué déficit calórico es seguro para un atleta de fuerza en temporada?
- ¿Cuántos g/kg de proteína mínimo para no perder masa?
- ¿Cómo afecta la deshidratación al rendimiento en %?
- ¿Timing de carbohidratos pre/post sesión en halterofilia?
- ¿Difiere por fase del macrociclo?

### COMPETITION ENGINE
Investiga:
- ¿Cómo se calcula el Sinclair Coefficient actual?
- ¿Cómo se hace el taper (reducción de volumen) para competición?
- ¿Cuántas semanas de peaking son óptimas?
- ¿Cómo calcular el "Peak Day" óptimo?
- ¿Qué métricas indican que el atleta está listo para competir?

---

## Orden de prioridad sugerido para investigar

1. **Sleep Quality** — upgrade inmediato, ya medimos horas
2. **Hormonal** — impacto directo en Holy Oly + Volta para atletas mujeres
3. **Movement Volume** — Holy Oly no puede lanzar sin esto
4. **Alcohol** — completa el lifestyle layer con cafeína
5. **Bar Velocity** — requiere hardware, pero impacto alto en CNS
6. **Nutrition** — fundacional pero complejo
7. **Competition** — específico para fase de peaking

---

## Cómo entregar la investigación

Trae cualquiera de estas formas:
- Documento con los bloques 1-10 rellenos
- Párrafo libre describiendo la ciencia → el sistema estructura
- Fuente externa (PDF, link, paper) → el sistema extrae y estructura
- Conversación → el sistema pregunta y construye en vivo
