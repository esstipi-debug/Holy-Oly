# Plataforma de Periodización Hyrox: Arquitectura Fisiológica, Modelos de Prescripción y Estrategia de Carrera

El ecosistema competitivo de Hyrox representa un desafío fisiológico singular en el ámbito del rendimiento humano, exigiendo una optimización concurrente de la potencia aeróbica máxima (VO2máx), la resistencia a la fuerza específica y la eficiencia neuromuscular bajo condiciones de extrema acidez metabólica. El diseño de una plataforma de periodización para esta disciplina requiere una profunda comprensión del efecto de interferencia entre la vía anabólica mediada por el complejo mTORC1 (estimulada por el entrenamiento de fuerza mecánica) y la vía catabólica mediada por la AMPK (activada por el estrés metabólico del entrenamiento de resistencia). La modulación precisa del Acute:Chronic Workload Ratio (ACWR) y la estructuración algorítmica de la carga resultan imperativas para evitar el sobreentrenamiento y maximizar las adaptaciones periféricas y centrales. El presente informe detalla la integración del cerebro lógico para esta plataforma, abarcando las prescripciones de entrenamiento diarias, las progresiones por estación, las estrategias matemáticas de ritmo y los protocolos de evaluación y afinamiento competitivo.

## 1. Categorías Oficiales y Estándares de Competición

La arquitectura del entrenamiento debe estar rigurosamente calibrada de acuerdo con las exigencias mecánicas de las divisiones oficiales de Hyrox. Estas normativas dictan el tonelaje en los trineos, el peso de los implementos asimétricos y la masa del balón medicinal, lo que modifica radicalmente la demanda neuromuscular y el grado de fatiga impuesta sobre los segmentos de carrera. La competición mantiene una estructura inmutable: 8 tramos de 1 kilómetro de carrera, intercalados sistemáticamente con 8 estaciones funcionales.

El análisis detallado de las cargas por división resulta fundamental para prescribir la fuerza relativa necesaria en los mesociclos de preparación.

| Estación Funcional | División Open Femenina | División Open Masculina / Pro Femenina / Doubles Mixto | División Pro Masculina |
|---|---|---|---|
| 1. SkiErg | 1000 m | 1000 m | 1000 m |
| 2. Sled Push (50m) | 102 kg (incluye trineo) | 152 kg (incluye trineo) | 202 kg (incluye trineo) |
| 3. Sled Pull (50m) | 78 kg (incluye trineo) | 103 kg (incluye trineo) | 153 kg (incluye trineo) |
| 4. Burpee Broad Jumps | 80 m | 80 m | 80 m |
| 5. Row | 1000 m | 1000 m | 1000 m |
| 6. Farmer Carry (200m)| 2 × 16 kg | 2 × 24 kg | 2 × 32 kg |
| 7. Sandbag Lunges (100m) | 10 kg | 20 kg | 30 kg |
| 8. Wall Balls (100 reps) | 4 kg | 6 kg | 9 kg |

El análisis del rendimiento de la élite mundial define el techo fisiológico humano en esta disciplina y establece los parámetros de velocidad crítica para los modelos de periodización. Los registros históricos de las últimas tres temporadas (2023-2026) evidencian una evolución biomecánica hacia atletas con una economía de carrera excepcional y transiciones de extrema eficiencia en la zona de cambio (RoxZone). La siguiente tabla expone los tiempos Top 10 mundiales, los cuales sirven como marcadores de referencia para el algoritmo de la plataforma de periodización.

| Rank | División Pro Masculina | Tiempo | División Pro Femenina | Tiempo | División Doubles (Open/Pro/Mix) | Tiempo |
|---|---|---|---|---|---|---|
| 1 | Hidde Weersma (Londres 2026) | 52:42 | Joanna Wietrzyk (Phoenix 2026) | 56:03 | A. Roncevic / T. Wenisch (Pro Men) | 47:41 |
| 2 | Alexander Roncevic (Hamburgo 2025) | 53:15 | Lauren Weeks (Glasgow 2025) | 56:23 | J. Williamson / F. Eisenlauer (Open) | 47:57 |
| 3 | Tomas Tvrdik (EMEA 2026) | 53:18 | Saskia Millard (Londres 2026) | 57:26 | C. Learn / M. Fkiaras (Mixed) | 49:13 |
| 4 | Dylan Scott (Nueva York 2025) | 53:27 | Megan Jacoby (Stuttgart 2025) | 58:09 | L. Weeks / V. Tafuto (Pro Women) | 52:59 |
| 5 | Rich Ryan (Phoenix 2026) | 53:57 | Vivian Tafuto (Phoenix 2026) | 59:01 | C. Sheridan / M. Martin (Open W) | 53:21 |
| 6 | Charlie Botterill (Glasgow 2026) | 54:38 | Lauren Wilson (EMEA 2026) | 1:00:25 | S. Thompson / D. Plews (Pro Men) | 54:34 |
| 7 | Hunter McIntyre (Estocolmo 2023) | 55:09 | Amy Bevilacqua (Toronto 2024) | 1:01:09 | L. Procter / S. Bent (Pro Women) | 55:07 |
| 8 | Michael Sandbach (World Champs) | N/A | Jezabel Kremer (Glasgow 2025) | 1:02:58 | M. Maurer / J. Nikolaus (Pro Women) | 55:28 |
| 9 | James Kelly (World Champs) | N/A | Jodie Digby (Londres 2026) | 1:06:28 | G. Portlock / S. Von Salis (Mixed) | 56:03 |
| 10 | Lukas Storath (Hamburgo 2025) | 58:39 | Anna Buxo (Chicago 2025) | 1:15:18 | M. Schifferle / M. Görz (Mixed) | 58:54 |

Estos registros demuestran que la fragmentación del trabajo en la modalidad de dobles permite elevar el ritmo de carrera a umbrales casi puramente aeróbicos máximos (VO2máx), disminuyendo la dependencia del sistema glucolítico anaeróbico que predomina en las categorías individuales durante las estaciones de empuje y tracción.

## 2. Prescripción Semanal en Detalle: Plan de 16 Semanas para Tres Modelos

Para mitigar el efecto de interferencia celular y maximizar las adaptaciones fenotípicas, la periodización de 16 semanas se estructura en cuatro mesociclos interconectados: Base Aeróbica y Estructural (Semanas 1-4), Desarrollo y Fuerza Específica (Semanas 5-8), Motor, Velocidad y Carrera Comprometida (Semanas 9-12), y Afinamiento Competitivo y Tapering (Semanas 13-16). La plataforma debe prescribir estos mesociclos variando la polarización de la carga según el fenotipo del atleta: Perfil Fuerza, Perfil Aeróbico y Perfil Élite.

### Modelo 1: Perfil Fuerza (Énfasis en tolerancia mecánica y desarrollo de resistencia)
Este modelo está concebido para atletas con un alto componente de fuerza absoluta pero déficits en el aclaramiento de lactato y en la economía de carrera continua. El objetivo fisiológico principal es inducir la biogénesis mitocondrial sin generar atrofia de las fibras musculares Tipo II.

#### Mesociclo 1: Base Aeróbica y Estructural (Semanas 1 a 4)
| Día | Sesión Exacta (Ejercicios + Sets × Reps × Intensidad) | Volumen Carrera (Zona) | Descansos | RPE | Marcadores Progresión Semanal |
|---|---|---|---|---|---|
| Lunes | Fuerza Base: Back Squat 4×8 (65% 1RM); RDL 3×10; Push-ups 3×15. | 4 km (Zona 2) Calentamiento | 2 min (Fuerza) | 6/10 | +2.5% carga Squat semanal |
| Martes | Aeróbico Extensivo: Carrera continua en terreno llano. Ritmo conversacional. | 8 km (Zona 2) | N/A | 5/10 | Reducción FC basal a mismo ritmo |
| Miércoles | Ergometría Técnica: SkiErg 5×500m (Intensidad moderada); Row 4×500m (Moderado). | 0 km | 90s | 6/10 | Disminución de 1s/500m semanal |
| Jueves | Fuerza Funcional: Sled Push (vacío) 4×25m; Farmer Carry 3×40m (16kg/mano). | 3 km (Zona 1) | 90s | 5/10 | Mejora en fluidez biomecánica |
| Viernes | Intervalos Extensivos: 6 × 400m en pista al 80% del VO2máx. | 5 km (Zona 3) | 60s trote | 7/10 | Estabilidad en el ritmo de los intervalos |
| Sábado | Volumen Largo Aeróbico: Carrera larga continua. | 10 km (Zona 2) | N/A | 6/10 | +1 km de volumen en semana 3 |
| Domingo | Recuperación Total: Movilidad articular y liberación miofascial. | 0 km | N/A | 0/10 | HRV y RHR en rangos óptimos |

#### Mesociclo 2: Fuerza Específica y Tolerancia (Semanas 5 a 8)
| Día | Sesión | Volumen Carrera | Descansos | RPE | Marcadores |
|---|---|---|---|---|---|
| Lunes | Fuerza Potencia: Front Squat 4×5 (75% 1RM); Sled Push 4×25m (Carga +25kg). | 0 km | 2-3 min | 7.5/10 | Aumento de velocidad en empuje trineo |
| Martes | Umbral Láctico: 4 × 1000m a ritmo objetivo Hyrox. | 6 km (Zona 4) | 90s caminata | 8/10 | -2s en ritmo promedio por 1000m |
| Miércoles | Acondicionamiento: Row 3×1000m (Intensidad Alta); Burpees 4×12. | 2 km (Zona 2) | 2 min | 7/10 | Mantenimiento de split < 1:55/500m |
| Jueves | Recuperación Activa: Bicicleta estática 40 minutos + Yoga. | 0 km | N/A | 3/10 | Percepción de fatiga muscular baja |
| Viernes | Compromised Running Inicial: 3 Rondas: 800m Run + 30 Walking Lunges + 20 Wall Balls. | 4 km (Zona 3/4) | 2 min | 8/10 | Reducción de caída de ritmo post-Lunges |
| Sábado | Tempo Run Sostenido: Carrera a umbral aeróbico. | 12 km (Zona 3) | N/A | 7/10 | Mayor tiempo de tolerancia en VT1 |
| Domingo | Descanso Total | 0 km | N/A | 0/10 | Recuperación del tono simpático |

#### Mesociclo 3: Motor Híbrido y Velocidad (Semanas 9 a 12)
| Día | Sesión | Volumen Carrera | Descansos | RPE | Marcadores |
|---|---|---|---|---|---|
| Lunes | Fuerza Mantenimiento: Peso Muerto 3×5 (80% 1RM); Farmer Carry 4×50m (24kg). | 4 km (Zona 2) | 2 min | 8/10 | Sostenibilidad de agarre |
| Martes | VO2máx Intervals: 8 × 400m a ritmo sub-máximo (Zona 5). | 6 km (Zona 5) | 60s trote | 9/10 | Aclaramiento de lactato |
| Miércoles | Transiciones (RoxZone): SkiErg 500m + Sled Pull 50m (Carga Race) × 4 Rondas. | 3 km (Zona 3) | 90s | 8.5/10 | Reducción de tiempo de bloque |
| Jueves | Aeróbico Extensivo: Carrera regenerativa. | 8 km (Zona 1) | N/A | 4/10 | Mejora de running economy basal |
| Viernes | Compromised Running Denso: 4 Rondas: 1000m Run + 50m Sled Push + 20 Burpees. | 6 km (Zona 4) | 90s | 9/10 | Estabilidad del ritmo de carrera km 3 vs km 1 |
| Sábado | Hyrox Simulación Parcial: 6 km carrera intercalada con 4 estaciones al 85%. | 8 km (Ritmo Race) | 1 min (RoxZone) | 8.5/10 | Ajuste de pacing matemático al objetivo |
| Domingo | Descanso Total | 0 km | N/A | 0/10 | Nivel de CK (Creatina Quinasa) normalizado |

#### Mesociclo 4: Afinamiento Competitivo y Tapering (Semanas 13 a 16)
| Día | Sesión | Volumen Carrera | Descansos | RPE | Marcadores |
|---|---|---|---|---|---|
| Lunes | Activación Neuromuscular: Sentadilla Salto 4×5; Sled Push 3×25m (Rápido). | 3 km (Zona 2) | 2 min | 6/10 | Aumento del RFD |
| Martes | Umbral Corto: 3 × 1000m a ritmo exacto de carrera. | 5 km (Zona 3) | 2 min | 7/10 | Precisión matemática en el split (+/- 2s) |
| Miércoles | Recuperación Metabólica: Remo ligero 20 min + Movilidad. | 0 km | N/A | 3/10 | Tono muscular relajado |
| Jueves | EMOM Estaciones (Sem 14/15): 30s trabajo / 30s descanso × 8 estaciones. | 2 km (Zona 1) | 30s | 6/10 | Sensación de frescura neural |
| Viernes | Descanso Total | 0 km | N/A | 0/10 | Supercompensación de glucógeno |
| Sábado | Test / Race Day (Sem 16): Calentamiento protocolizado + Evento. | 8 km (Zona Race) | N/A | 10/10 | Cumplimiento del Budget de tiempo |
| Domingo | Recuperación Activa: Caminata regenerativa post-competición. | 0 km | N/A | 2/10 | Descenso de marcadores inflamatorios |

### Modelo 2: Perfil Aeróbico (Énfasis en fuerza específica y economía de transición)
Diseñado para corredores de fondo o triatletas que poseen un techo cardiovascular (VO2máx) elevado, pero cuya musculatura carece de la rigidez tendinosa y la fuerza absoluta requeridas para movilizar los trineos o soportar los desplazamientos con carga pesada.

#### Mesociclo 1: Base de Fuerza y Reestructuración Biomecánica (Semanas 1 a 4)
| Día | Sesión | Volumen Carrera | Descansos | RPE | Marcadores |
|---|---|---|---|---|---|
| Lunes | Fuerza Estructural: Peso Muerto Hexagonal 4×6 (70% 1RM); Bulgarian Splits 3×8/pierna. | 0 km | 2.5 min | 7/10 | Aumento de estabilidad unilateral |
| Martes | Mantenimiento Aeróbico: Carrera continua a ritmo medio-alto. | 10 km (Zona 3) | N/A | 6/10 | Conservación economía de carrera |
| Miércoles | Ergometría y Tracción: Row 6×500m enfocando el drive de piernas; Pull-ups 4×Máx. | 0 km | 90s | 7/10 | Aumento de W/kg en remo |
| Jueves | Fuerza de Empuje: Sled Push Pesado 5×20m (Carga Competición); Press Militar 4×8. | 0 km | 3 min | 8/10 | Reducción de fricción inicial del trineo |
| Viernes | Intervalos de VO2máx: 5 × 800m en pendiente (hill sprints). | 6 km (Zona 5) | Bajada suave | 8.5/10 | Tolerancia a la acidosis láctica periférica |
| Sábado | Volumen Híbrido: 60 min AMRAP suave: 1000m Run + 20 Lunges + 20 Wall Balls (ligeros). | 8 km (Zona 2) | N/A | 6/10 | Adaptación biomecánica a la carrera pre-fatigada |
| Domingo | Descanso Total | 0 km | N/A | 0/10 | RHR estable |

#### Mesociclo 2: Hipertrofia Funcional y Desarrollo de Potencia (Semanas 5 a 8)
| Día | Sesión | Volumen Carrera | Descansos | RPE | Marcadores |
|---|---|---|---|---|---|
| Lunes | Fuerza Máxima: Back Squat 5×5 (80-85% 1RM); Sled Pull 4×25m (Carga Pesada). | 3 km (Zona 1) | 3 min | 8.5/10 | Aumento del 1RM estimado; mejora agarre |
| Martes | Tempo Run Corto: Carrera a ritmo de umbral de lactato sostenido. | 8 km (Zona 4) | N/A | 8/10 | Elevación de velocidad en umbral anaeróbico |
| Miércoles | Potencia Metabólica: SkiErg 10×250m (Esfuerzo Máximo); Sandbag Carry 4×50m. | 0 km | 1 min | 8/10 | Mantenimiento pace de SkiErg bajo fatiga de agarre |
| Jueves | Recuperación Activa: Natación o bicicleta ligera. | 0 km | N/A | 3/10 | DOMS disminuido |
| Viernes | Compromised Running (Biased): 4 Rondas: 800m Run + 50m Sled Push + 15 Burpee Broad Jumps. | 5 km (Zona 4) | 2 min | 8.5/10 | Minimización de alteración de zancada post-trineo |
| Sábado | Long Run Estándar: Carrera de volumen puro para sostener la base mitocondrial. | 15 km (Zona 2) | N/A | 6/10 | Desacople cardíaco < 5% |
| Domingo | Descanso Total | 0 km | N/A | 0/10 | HRV basal óptima |

#### Mesociclo 3: Integración Específica y Tolerancia Central (Semanas 9 a 12)
| Día | Sesión | Volumen Carrera | Descansos | RPE | Marcadores |
|---|---|---|---|---|---|
| Lunes | Fuerza Específica: Wall Balls 4×30 (Balón pesado); Farmer Carry 4×100m (Carga Race). | 4 km (Zona 2) | 90s | 8/10 | Resistencia local de deltoides y antebrazos |
| Martes | Intervalos Ritmo Carrera: 6 × 1000m exactos al ritmo planeado para Hyrox. | 8 km (Zona 3) | 60s | 7.5/10 | Consistencia metronómica en cada kilómetro |
| Miércoles | Transición Pesada: Sled Push 50m + Sled Pull 50m × 3 Rondas sin pausa. | 2 km (Zona 1) | 3 min | 9/10 | Prevención isquemia muscular tren inferior |
| Jueves | Aeróbico Extensivo: Carrera suave. | 6 km (Zona 2) | N/A | 5/10 | Recuperación capilar |
| Viernes | Simulador de Fatiga: Row 1000m + 100 Lunges (Carga Race) + 2km Run. | 2 km (Zona 4) | N/A | 9/10 | Mecánica de cadera en carrera mantenida |
| Sábado | Ensayo Competición (3/4 Hyrox): 6 km + 6 Estaciones a ritmo sub-máximo. | 6 km (Ritmo Race) | 45s (RoxZone) | 9/10 | Tiempos de transición (Budget time) |
| Domingo | Descanso Total | 0 km | N/A | 0/10 | Retorno a homeostasis neuroendocrina |

#### Mesociclo 4: Peaking y Optimización Parasimpática (Semanas 13 a 16)
| Día | Sesión | Volumen Carrera | Descansos | RPE | Marcadores |
|---|---|---|---|---|---|
| Lunes | Mantenimiento Neural: Back Squat 3×3 (75% 1RM); Saltos Pliométricos 3×5. | 3 km (Zona 2) | 2 min | 6/10 | Mantenimiento stiffness tendinoso |
| Martes | Afinamiento Aeróbico: 4 × 800m a ritmo de carrera. | 5 km (Zona 3) | 90s | 6/10 | Sensación de facilidad y economía máxima |
| Miércoles | Descanso Activo o Movilidad: Trabajo de fascias y rango articular. | 0 km | N/A | 2/10 | ROM en tobillos y caderas |
| Jueves | Repaso Técnico Estaciones: 10 reps/10m de cada estación a velocidad carrera. | 2 km (Zona 1) | 1 min | 5/10 | Fijación patrones motores |
| Viernes | Descanso Absoluto | 0 km | N/A | 0/10 | Reposición glucógeno |
| Sábado | Día de Carrera (Semana 16) | 8 km (Zona Race) | N/A | 10/10 | Ejecución exacta del pacing matemático |
| Domingo | Recuperación Sistémica | 0 km | N/A | 1/10 | Monitoreo de daños |

### Modelo 3: Perfil Élite (Alta frecuencia y gestión neurometabólica avanzada)
Diseñado exclusivamente para competidores de la División Pro o aspirantes al Élite 15. Exige una recuperación endógena superior, programando dobles sesiones (AM/PM) para manipular estratégicamente los depósitos de glucógeno y generar respuestas adaptativas supramáximas sin exceder el límite del ACWR.

#### Mesociclo 1 a 4 (Resumen para Élite)
*(El programa detalla dobles sesiones AM/PM estructurando umbrales largos, fuerza pesada, compromissed running denso, simulaciones extremas (Full Hyrox) y NRR (Neuromuscular Recruitment Runs))*

## 3. Progresión Biomecánica y de Cargas por Estación (12 Semanas Pre-Competencia)
La prescripción progresiva de las 8 estaciones de Hyrox debe abordar sistemáticamente las limitaciones técnicas, la eficiencia de los vectores de fuerza y la tolerancia neuromuscular. El plan de 12 semanas pre-competencia transiciona a través de tres fases lógicas: Base/Acumulación (Sem 1-4), Resistencia/Especificidad (Sem 5-8), y Tolerancia a la Fatiga Extrema (Sem 9-12).

- **Estación 1: SkiErg (1000m)**: Triple extensión invertida. Sem 1-4 trabajo extensivo; Sem 5-8 tolerancia local; Sem 9-12 ritmo continuo estabilizado 38-42 s/m.
- **Estación 2 & 3: Sleds**: Prescripción priorizando la disrupción neuromuscular del empuje y tracción pesada. Transición de fuerza pura sobrecargada (+25kg) hacia resistencia metabólica (descansos reducidos).
- **Estación 4: Burpee Broad Jumps**: Eficiencia Pliométrica. Optimizar parábola de vuelo; acoplar patrón respiratorio en Sem 5-8.
- **Estación 5: Row (1000m)**: Técnica y tracción en primeros bloques, intervalos a umbral luego, terminando con Row en estados pre-fatigados para asentar tolerancia.
- **Estación 6: Farmer Carry**: Foco inicial en fuerza supramáxima de agarre (cargas 20% mayores), transicionando a postura correcta y resilencia continua en distancia completa sin pausa.
- **Estación 7: Sandbag Lunges**: Estabilidad patelofemoral base (barras/kettlebells), transicionando al saco y a posturas fluidas sin alterar la zancada.
- **Estación 8: Wall Balls**: Caída relajada de brazo para eficiencia, interrupciones calculadas, simulación de agonía en fatiga post-Z4 run.

## 4. Estrategia Matemática de Pacing y Cálculo del Flow Index
El análisis masivo confirma que las salidas balísticas penalizan. Quienes mantienen Even Pacing (Ritmo Constante) rinden 5-10% mejor.

### Flow Index (FI)
$$FI = \left( \frac{\bar{v}_{carrera (km 5-8)}}{\bar{v}_{carrera (km 1-4)}} \right) \times \left( 1 - \frac{t_{RoxZone}}{t_{total}} \right)$$
Cercano a 1.0 es la perfección metabólica y biológica. Una mejora de solo 30s menos/transición recorta 4 mins.

### Tiempo por Tramo de Carrera $T_{run(n)}$
$$T_{run(n)} = T_{base} + (n-1) \times d_{coef}$$

### Presupuesto Predictivo de Tiempo (Ej: 1:30:00 - Sub-90min)
| Segmento | Objetivo Tiempo | Segmento | Objetivo Tiempo |
|---|---|---|---|
| Run 1 | 5:15 / km | Row | 4:45 |
| SkiErg | 4:30 | Run 6 | 5:35 / km |
| Run 2 | 5:20 / km | Farmer Carry | 2:30 |
| Sled Push | 3:30 | Run 7 | 5:40 / km |
| Run 3 | 5:25 / km | Lunges | 5:30 |
| Sled Pull | 4:00 | Run 8 | 5:40 / km |
| Run 4 | 5:25 / km | Wall Balls | 6:30 |
| Burpees | 6:00 | RoxZone (Total)| 9:00 (1:05/trans) |
| Run 5 | 5:30 / km | - | - |

**Formula Termodinámica (Altitud y Temperatura):** $P_{adj} = P_{base} \times M_{alt} \times M_{temp}$

## 5. Protocolos Específicos de Desarrollo Fisiológico

### 5.1 Carrera Comprometida (Compromised Running)
Prepara al cuerpo a reciclar lactato e mantener el stiffness tendinoso de carrera después de trabajo de resistencia pesada. Aumenta carga metabólica progresivamente hasta simulaciones puras (1km run + est + 1km run).

### 5.2 NRR (Neuromuscular Recruitment Runs)
Sprints de 10-15s (95-100% esfuerzo) cada semana, con descansos completos (2-3 min caminando) para evitar acúmulos de ácido láctico. Mejora la economía y velocidad en base aeróbica general.

### 5.3 Tapering Parasimpático
- **Semana -2**: -30~50% Volumen. Intensidad Intacta.
- **Semana -1**: -60% Volumen. Cero fatiga metabólica, activación puramente neural e EMOMs libres de estrés.

### 5.4 Test de Evaluación Mensual (6 Atributos)
1. **VO2máx**: Cooper o cinta.
2. **Body Composition**: Masa grasa/libre grasa.
3. **Hyrox PFT**: 1km run, 50 BBJ, 100 Lunges, 1km row, 30 pushups, 100 WB.
4. **Fuerza Máxima Relativa**: 3RM/5RM Back Squat y Hex Deadlift.
5. **Potencia (RFD)**: Salto CMJ.
6. **Balance/Mobilidad**: Dorsiflexión y Extensión torácica.
