/**
 * macroSources · detalle REAL por macro extraído de macrocycles/RAW_SOURCES/.
 *
 * Antes el detalle (macroDetail.ts) generaba la curva IMR y los mesos de forma
 * PARAMÉTRICA por escuela. Acá viven los datos auténticos de cada programa:
 *   - imrByWeek: IMR % real semana a semana (de cada header "SEMANA N · IMR X%").
 *   - mesos: nombre + objetivo reales de cada mesociclo.
 *   - filosofia: filosofía de carga del programa.
 *
 * getMacroDetail() prefiere estos valores cuando existen (override sobre el
 * generador), y cae al paramétrico para lo que falte. Sin inventar: donde la
 * fuente no declaraba IMR explícito por semana (sistemas Daily Max / EMOM /
 * rangos por mes), el valor está derivado de las cargas reales — ver el .txt.
 */
export interface MacroSource {
  imrByWeek: number[];               // IMR % por semana (vacío si la fuente no da curva)
  filosofia: string;
  mesos: { name: string; objetivo: string }[];
}

export const MACRO_SOURCES: Record<string, MacroSource> = {
  'ruso-5d': {
    imrByWeek: [65, 68, 70, 60, 74, 77, 80, 70, 78, 82, 85, 70, 80, 85, 75, 70],
    filosofia: 'Waviness · ondulación de cargas por semana y dentro de la misma semana (pesado/ligero/mediano).',
    mesos: [
      { name: 'Preparación general (GPP & técnica)', objetivo: 'Acondicionamiento físico, corrección de errores y musculación base; variantes no clásicas y volumen alto de sentadilla.' },
      { name: 'Fuerza y acumulación (SPP)', objetivo: 'Fuerza máxima en sentadillas y tirones; transferencia a los clásicos con series de 2-3 reps.' },
      { name: 'Transmutación (intensificación)', objetivo: 'Convertir la fuerza en potencia específica; ondulación de intensidad (wave loading) y levantamientos completos.' },
      { name: 'Realización (peaking)', objetivo: 'Eliminar fatiga acumulada y expresar el máximo; intensidad muy alta, volumen muy bajo, simulación de competencia.' },
    ],
  },
  'bulgaro-6d': {
    imrByWeek: [93, 94, 95, 83, 94, 95, 96, 80, 95, 95, 88, 70],
    filosofia: 'Daily Max · máximo técnico posible del día (no PR diario), selección minimalista de ejercicios.',
    mesos: [
      { name: 'Adaptación a la frecuencia', objetivo: 'Adaptar el SNC a levantar >90% seis días/semana; alternar máximos clásicos y potencia/back squat para gestionar fatiga.' },
      { name: 'Especificidad pura (grind)', objetivo: 'Eliminar variantes power; todo completo y pesado. Foco en resiliencia mental.' },
      { name: 'Peaking (competición)', objetivo: 'Afilar el SNC para el día de prueba; reducir frecuencia de sentadilla pesada para liberar piernas.' },
    ],
  },
  'coreano-5d': {
    imrByWeek: [70, 73, 76, 65, 78, 81, 84, 70, 85, 88, 75, 70],
    filosofia: 'Énfasis en fuerza estática (pulls pesados) y musculación específica; estructura rígida y disciplinada.',
    mesos: [
      { name: 'Cimentación (acumulación)', objetivo: 'Hipertrofia funcional, corrección técnica y capacidad de trabajo; trabajo estricto, pausas y musculación al final.' },
      { name: 'Transformación (fuerza)', objetivo: 'Transferencia a fuerza específica y potencia; tirones pesados (>100%) y sentadillas de alta intensidad.' },
      { name: 'Realización (competencia)', objetivo: 'Puesta a punto y simulación; alta especificidad, eliminación de accesorios y volumen bajo.' },
    ],
  },
  'coreano-6d': {
    imrByWeek: [70, 73, 76, 65, 78, 81, 84, 70, 85, 88, 75, 70],
    filosofia: 'Alta frecuencia de sentadilla y tirones; el 6º día para consolidación de fuerza máxima o testeo controlado.',
    mesos: [
      { name: 'Cimentación (acumulación)', objetivo: 'Base muscular, corrección de posturas y tolerancia al volumen; trabajo de posiciones y fortalecimiento general.' },
      { name: 'Transformación (fuerza)', objetivo: 'Transferencia a fuerza específica; tirones pesados (>100%) y aumento de intensidad en clásicos.' },
      { name: 'Realización (competencia)', objetivo: 'Puesta a punto y simulación; volumen bajo, intensidad máxima, sin auxiliares.' },
    ],
  },
  'chino-5d': {
    imrByWeek: [72, 80, 88, 75],
    filosofia: 'Estructura mixta: fatiga muscular localizada (culturismo) tras la potencia; mucho pull y squats.',
    mesos: [
      { name: 'Base estructural (volumen alto)', objetivo: 'Acondicionamiento de tendones y construcción muscular; pausas largas, excéntricos y mucho bodybuilding final.' },
      { name: 'Acumulación de carga (fuerza absoluta)', objetivo: 'Fuerza máxima en tirones y sentadillas para transferir a los clásicos; pulls pesados y squats >85%.' },
      { name: 'Choque (intensidad máxima)', objetivo: 'Máximos esfuerzos bajo fatiga; max out controlado (single diario) seguido de fuerza pesada.' },
      { name: 'Descarga / taper', objetivo: 'Disipar fatiga y preparar el siguiente bloque; mantener sensación de peso con volumen muy reducido.' },
    ],
  },
  'colombiano-5d': {
    imrByWeek: [68, 71, 75, 63, 75, 79, 84, 68, 80, 85, 75, 70],
    filosofia: 'Prioridad absoluta al Clean & Jerk y variantes overhead; el snatch a volumen medio para no fatigar el empuje.',
    mesos: [
      { name: 'Técnica y base (acumulación jerk)', objetivo: 'Capacidad de trabajo en overhead y mecánica del dip & drive; alto volumen en push press y jerk desde soportes.' },
      { name: 'Fuerza específica (jerk pesado)', objetivo: 'Transferencia a pesos altos; jerks pesados desde rack y front squat alto, subiendo intensidad en C&J.' },
      { name: 'Intensificación y realización', objetivo: 'Picos de intensidad y simulacro de competencia; estabilidad máxima overhead y confianza en el 1RM.' },
    ],
  },
  'cubano-novicio-2d': {
    imrByWeek: [60, 61, 62, 55, 64, 65, 66, 60, 68, 69, 70, 65, 72, 74, 72, 72],
    filosofia: 'Cimentación técnica progresiva; solo cuentan reps ≥55% 1RM, técnica sobre el peso, deload cada 4ª semana.',
    mesos: [
      { name: 'Cimentación (técnica / hang)', objetivo: 'Aprender posiciones colgadas y fortalecer la espalda (IMR 60-62%).' },
      { name: 'Desarrollo (potencia / floor)', objetivo: 'Pasar del colgado al suelo; introducción de velocidad (IMR 64-66%).' },
      { name: 'Intensificación (fuerza / complejos)', objetivo: 'Mover cargas más pesadas y mejorar la sentadilla (IMR 68-70%).' },
      { name: 'Realización (pico / test)', objetivo: 'Preparar el cuerpo para probar nuevos máximos; tapering (IMR 72%+).' },
    ],
  },
  'cubano-novicio-3d': {
    imrByWeek: [60, 61, 62, 55, 64, 65, 66, 60, 68, 69, 70, 65, 75, 77, 73, 72],
    filosofia: 'Distribución Lun volumen alto · Mié técnico/recuperación · Vie intensidad; solo cuentan reps ≥55% 1RM.',
    mesos: [
      { name: 'Cimentación (posiciones colgantes)', objetivo: 'Automatizar la trayectoria de la barra pegada al cuerpo (IMR 60-62%).' },
      { name: 'Desarrollo (potencia desde el suelo)', objetivo: 'Transferir la fuerza del piso a la barra; sentadilla frontal (IMR 64-66%).' },
      { name: 'Intensificación (levantamientos completos)', objetivo: 'Introducir el squat snatch/clean profundo y cargas submáximas (IMR 68-70%).' },
      { name: 'Realización (pico y test)', objetivo: 'Disipar la fatiga y probar nuevos 1RM (IMR 75%+).' },
    ],
  },
  'cubano-int-5d': {
    imrByWeek: [68, 70, 72, 62, 74, 76, 78, 68, 80, 82, 85, 70, 80, 82, 75, 70],
    filosofia: 'Jerarquía de slots Arranque→Envión→Fuerza; distribución semanal Lun 35% / Mar 22% / Mié 30% / Jue 15% / Vie 28%.',
    mesos: [
      { name: 'Cimentación (volumen alto)', objetivo: 'Capacidad de trabajo; series de 3 repeticiones.' },
      { name: 'Fuerza general', objetivo: 'Series de 2 repeticiones; variantes de fuerza (no-foot, blocks).' },
      { name: 'Intensificación', objetivo: 'Potencia máxima; series de 1 repetición (singles).' },
      { name: 'Realización (tapering & test)', objetivo: 'Puesta a punto; reducir volumen manteniendo frecuencia.' },
    ],
  },
  'cubano-avanzado-5d': {
    imrByWeek: [70, 71, 72, 65, 72, 74, 75, 68, 76, 78, 70, 76, 80, 82, 75, 70],
    filosofia: 'IMR base 70-75%; estructura 2×1 (choque) mezclada con 3×1 en la base, jerarquía Arranque→Envión→Fuerza.',
    mesos: [
      { name: 'Acumulación (volumen alto)', objetivo: 'Fatiga controlada y acondicionamiento específico; estructura 3×1 (IMR 70-72%).' },
      { name: 'Fuerza específica (intensidad media/alta)', objetivo: 'Transferencia a bloques y variantes complejas; IMR promedio sube a ~73%.' },
      { name: 'Intensificación (2×1 puro)', objetivo: 'Potencia máxima; singles. Carga/choque, descarga y pre-competencia.' },
      { name: 'Realización (tapering avanzado)', objetivo: 'Disipar fatiga acumulada manteniendo la intensidad neural.' },
    ],
  },
  'cubano-competidor': {
    imrByWeek: [72, 74, 76, 66, 74, 76, 78, 68, 76, 78, 70, 76, 80, 82, 75, 70],
    filosofia: 'Doble turno 2 días/sem (Lun y Mié); un solo gesto técnico por sesión para máxima calidad neural.',
    mesos: [
      { name: 'Acumulación (volumen alto)', objetivo: 'Capacidad de trabajo y resistencia a la fuerza; series de 3 repeticiones (IMR 72%).' },
      { name: 'Desarrollo fuerza', objetivo: 'Transferencia a bloques y potencia; series de 2 repeticiones (IMR 74-76%).' },
      { name: 'Intensificación (choque 2×1)', objetivo: 'Potencia máxima; singles, el competidor busca 95%+.' },
      { name: 'Competencia (peaking)', objetivo: 'Simulación de competencia y puesta a punto; se eliminan los dobles turnos en el taper.' },
    ],
  },
  'polaco-4d': {
    imrByWeek: [75, 81, 88, 65, 85, 60],
    filosofia: 'Progresión cauta con picos frecuentes; intensidad alta (70-95%+) y volumen bajo, deload en S4.',
    mesos: [
      { name: 'Carga progresiva (S1-3)', objetivo: 'Subir rápidamente la intensidad manteniendo el volumen bajo.' },
      { name: 'Descarga y realización (S4-6)', objetivo: 'Recuperación (deload) y test de máximos.' },
    ],
  },
  'polaco-5d': {
    imrByWeek: [75, 80, 88, 62, 85, 60],
    filosofia: 'Calidad sobre cantidad; series cortas (1-3 reps), mucho pull y variantes desde bloques, deload en S4.',
    mesos: [
      { name: 'Inducción y carga (S1-3)', objetivo: 'Adaptación a 85-90% con volumen muy controlado; 3 días de carga + 2 de soporte técnico.' },
      { name: 'Descarga y realización (S4-6)', objetivo: 'Recuperación profunda (S4) seguida de un pico rápido de rendimiento.' },
    ],
  },
  'ucraniano-3d': {
    imrByWeek: [72, 76, 80, 80, 62, 83, 85, 88, 73, 70],
    filosofia: 'Alta densidad pura vía EMOM y acumulación de singles pesados (estilo Torokhtiy); para tiempo limitado.',
    mesos: [
      { name: 'Acumulación (S1-5)', objetivo: 'Densidad vía EMOM (2-3 reps) con volumen creciente hasta pico, cerrando con descarga.' },
      { name: 'Intensificación & peaking (S6-10)', objetivo: 'Singles pesados (85-90%+), acumular 25-30 singles sobre el 90%, taper y test.' },
    ],
  },
  'ucraniano-4d': {
    imrByWeek: [72, 76, 80, 80, 62, 83, 85, 88, 73, 70],
    filosofia: 'Estándar: mayor volumen accesorio y distribución de carga; EMOM + singles pesados con día accesorio.',
    mesos: [
      { name: 'Acumulación (S1-5)', objetivo: 'EMOM con volumen creciente hasta pico, día accesorio dedicado, cerrando con descarga.' },
      { name: 'Intensificación & peaking (S6-10)', objetivo: 'Singles pesados (85-90%), choque, taper y test máximo.' },
    ],
  },
  'hibrido-3d': {
    imrByWeek: [70, 73, 76, 65, 80, 83, 85, 70, 89, 94, 80, 70],
    filosofia: 'Alta densidad por sesión; ejercicios compuestos grandes y complejos sobre accesorios aislados, rango 70→95%+.',
    mesos: [
      { name: 'Acumulación (capacidad y estructura)', objetivo: 'Base aeróbica local y corrección técnica bajo fatiga; complejos para aumentar tiempo bajo tensión (IMR 70-75%).' },
      { name: 'Transmutación (densidad EMOM)', objetivo: 'Fuerza específica y capacidad de alta intensidad; EMOMs intensivos (IMR 80-85%).' },
      { name: 'Realización (peaking)', objetivo: 'Máxima intensidad y simulación; días muy pesados seguidos de recuperación completa (IMR 90%+).' },
    ],
  },
  'hibrido-4d': {
    imrByWeek: [70, 73, 76, 65, 80, 82, 85, 70, 89, 94, 80, 70],
    filosofia: 'Block periodization; equilibrio entre culturismo, densidad (EMOM) y fuerza clásica, rango 70→95%+.',
    mesos: [
      { name: 'Acumulación (hipertrofia funcional)', objetivo: 'Capacidad de trabajo, construcción muscular y corrección técnica; volumen alto, descansos incompletos (IMR 70-75%).' },
      { name: 'Transmutación (fuerza y densidad EMOM)', objetivo: 'Intensidad y densidad; EMOMs para mantener técnica bajo fatiga (IMR 80-85%).' },
      { name: 'Realización (peaking & test)', objetivo: 'Puesta a punto; especificidad máxima (singles) y eliminación de fatiga (IMR 90%+).' },
    ],
  },
  'hibrido-5d': {
    imrByWeek: [70, 73, 76, 65, 79, 82, 85, 70, 89, 94, 80, 70],
    filosofia: 'Block periodization (Acumulación/Transmutación/Realización) integrando densidad EMOM; calidad sobre cantidad.',
    mesos: [
      { name: 'Acumulación (hipertrofia funcional)', objetivo: 'Construcción de tejido, capacidad de trabajo y corrección de desbalances; complejos y variantes No Feet/Hang (IMR 70-75%).' },
      { name: 'Transmutación (fuerza y densidad)', objetivo: 'Convertir ganancia muscular en potencia; aumento de intensidad e introducción de EMOMs (IMR 80-85%).' },
      { name: 'Realización (peaking)', objetivo: 'Puesta a punto competitiva; reducción drástica del volumen, intensidad >90% (IMR 90%+).' },
    ],
  },
  'hibrido-block': {
    imrByWeek: [70, 85, 95, 65, 70, 85, 95, 65, 70, 85, 95, 65],
    filosofia: 'Variación coordinada: bloques concentrados + ondulación semanal A-B-C-D (Vol/Carga/Intensidad/Descarga), autorregulación por RPE.',
    mesos: [
      { name: 'Bloque de hipertrofia (acumulación)', objetivo: 'Capacidad de trabajo y construcción muscular; alto volumen (300-400 reps/sem), series largas y complejos.' },
      { name: 'Bloque de fuerza (transmutación)', objetivo: 'Fuerza absoluta y adaptación neural; volumen moderado (150-200 reps/sem), reps 1-5.' },
      { name: 'Bloque de potencia (realización)', objetivo: 'Expresión de potencia y singles máximos; volumen bajo (50-100 reps/sem), reps 1-3.' },
    ],
  },
  'usa-school': {
    imrByWeek: [],
    filosofia: 'Sistema descentralizado (clubes + NCAA): periodización por bloques soviética + autorregulación moderna + VBT + RPE.',
    mesos: [
      { name: 'Acumulación', objetivo: 'Hipertrofia + GPP; variaciones hang/blocks, prohibido fallo técnico. IMR 60-75%, fuerza:olímpico 50:50.' },
      { name: 'Desarrollo (transmutación)', objetivo: 'Puente fuerza→velocidad balística; complexes y pausas isométricas, front squat prioritaria. IMR 70-80%.' },
      { name: 'Fuerza (intensificación)', objetivo: 'Resistencia acomodada (bandas/cadenas), dobles y singles pesados, squat 2×/sem. IMR 80-90%.' },
      { name: 'Realización (peaking)', objetivo: 'Todo desde suelo, 95-100%+ a 10-14d, caídas 60-70% días previos, singles diarios. IMR 85-100%+.' },
    ],
  },
  'usa-principiante': {
    imrByWeek: [60, 60, 60, 60, 68, 68, 68, 68, 75, 75, 75, 75, 85, 85, 85, 85],
    filosofia: 'Lineal 16 sem; progresión IMR 55→90% con prohibición de fallo técnico en fase inicial, proyección Epley en el test.',
    mesos: [
      { name: 'Preparación anatómica (S1-4)', objetivo: 'High hang estática, sentadillas ligeras y core; series 5-6, IMR 55-65%.' },
      { name: 'Transición fuerza base (S5-8)', objetivo: 'Levantamiento desde el suelo y pull correcto; series 4-5, IMR 65-70%.' },
      { name: 'Fuerza integrada (S9-12)', objetivo: 'Snatch + C&J completos y sentadillas lineales; series 3-4, IMR 70-80%.' },
      { name: 'Intensificación + test (S13-16)', objetivo: 'Series 2-3, IMR 80-90%; test moderado con proyección Epley.' },
    ],
  },
  'usa-intermedio': {
    imrByWeek: [70, 70, 70, 70, 79, 79, 79, 79, 84, 84, 84, 84, 90, 90, 90, 90],
    filosofia: 'Bloques ondulantes 16 sem (Acumulación/Transmutación/Intensificación/Realización) con deloads en S4 y S12.',
    mesos: [
      { name: 'Acumulación (S1-4)', objetivo: 'Sentadillas 5-8 reps, complejos largos; alto volumen, IMR 65-75%, deload en S4.' },
      { name: 'Transmutación (S5-8)', objetivo: 'Front squat + push press, pausas isométricas; IMR 75-82%.' },
      { name: 'Intensificación (S9-12)', objetivo: 'Trabajo balístico, pulls 105%; IMR 80-88%, deload profundo en S12.' },
      { name: 'Realización (S13-16)', objetivo: 'Simulación de competencia, singles; bajo volumen, IMR 85-95%+, max test en S16.' },
    ],
  },
  'usa-avanzado': {
    imrByWeek: [83, 83, 89, 89, 94, 94, 80, 80],
    filosofia: 'Peaking de 8 sem pre-competencia; sobrecarga transmutativa → choque neural → realización submáxima → tapering.',
    mesos: [
      { name: 'Sobrecarga transmutativa (S1-2)', objetivo: 'Frecuencia alta, squats post-OLY; IMR 80-85%.' },
      { name: 'Choque neural + deload (S3-4)', objetivo: 'S3 burdening máximo, S4 supercompensación al 70%; IMR 85-92%.' },
      { name: 'Realización submáxima (S5-6)', objetivo: 'Últimos pulls máximos 14d pre-comp, OLY como aperturas; IMR 90-98%.' },
      { name: 'Tapering + competencia (S7-8)', objetivo: 'Tapering abrupto, reposo 48h pre-comp; IMR 60-100%.' },
    ],
  },
  'usa-master': {
    imrByWeek: [65, 65, 65, 65, 75, 75, 75, 75, 86, 86, 86, 86],
    filosofia: 'Adaptado 40+, 12 sem; powers dominantes, levantamiento desde bloques (omite 1er pull), deload 2:1, descansos 3-5 min.',
    mesos: [
      { name: 'Estabilidad articular (S1-4)', objetivo: '3 días de carga real, trabajo unilateral, powers dominantes; IMR 60-70%.' },
      { name: 'Fuerza preservada (S5-8)', objetivo: 'Levantamiento desde bloques (omite 1er pull), deload 2:1; IMR 70-80%.' },
      { name: 'Realización Master (S9-12)', objetivo: 'Front squat ligero, descansos 3-5 min mínimos; IMR 80-92%.' },
    ],
  },
};
