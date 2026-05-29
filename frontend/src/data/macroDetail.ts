/**
 * macroDetail · generador de detalle rico de macrociclo para HolyOlyDetailV2.
 *
 * El backend solo devuelve metadata básica (nombre/semanas/dificultad). Este
 * módulo GENERA, a partir de los params del macro (data/macrocycles.ts), la
 * curva IMR semanal, los 4 mesociclos, una semana tipo y la filosofía/contexto
 * por escuela. Determinístico y coherente: cada macro se ve distinto y creíble
 * sin hardcodear 23 ensayos a mano.
 *
 * Las filosofías por familia son las reales de cada escuela de halterofilia.
 */
import { MACROCYCLES } from './macrocycles';

// ── Tipos (compartidos con HolyOlyDetailV2) ──────────────────────────────────
export interface WeeklyEntry { w: number; imr: number; reps: number; meso: number; focus: string; current?: boolean }
export interface Mesocycle { idx: number; name: string; weeks: [number, number]; imrRange: string; focus: string; desc: string; color: string }
export interface Slot { slot: string; ex: string; pct: number; kg: number; base: string; plates: string }
export interface Day { d: string; type: 'vol' | 'med' | 'int' | 'act' | 'tec' | 'rec'; name: string; dur: number; tonelaje: number; slots: Slot[]; rpe: string }
export interface WeekTypical { label: string; days: Day[] }
export interface UserState { isActive: boolean; currentWeek: number; pctComplete: number; role: 'athlete' | 'coach'; has1RM: boolean }
export interface PhiloCard { name: string; icon: 'wave' | 'pyramid' | 'pulse'; desc: string }
export interface MacroFooter { origin: string; similar: { name: string; meta: string }[] }
export interface MacroData {
  id: string; name: string; family: string; schoolColor: string;
  duration: number; frequency: number;
  intensity: number; volume: number; recovery: number; difficulty: number;
  subtitle: string;
  philoTitle: string;
  philosophy: PhiloCard[];
  weekly: WeeklyEntry[];
  mesocycles: Mesocycle[];
  weekTypical: WeekTypical;
  footer: MacroFooter;
  user: UserState;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// ── Filosofía + contexto por familia (escuelas reales de halterofilia) ───────
interface FamilyMeta { title: string; cards: PhiloCard[]; origin: string }
const FAMILY: Record<string, FamilyMeta> = {
  'Ruso': {
    title: '¿Qué hace único al método ruso?',
    cards: [
      { name: 'Waviness · Ondulación', icon: 'wave', desc: 'Las cargas suben y bajan dentro de la misma semana (pesado · ligero · mediano). Estímulo sin acumular fatiga lineal.' },
      { name: 'GPP extensa', icon: 'pyramid', desc: 'Preparación general amplia antes de la especificidad. Variantes Hang/Muscle/Power para base técnica.' },
      { name: 'Estructura 3:1', icon: 'pulse', desc: 'Tres semanas de carga progresiva + una de descarga. Probado en programas soviéticos desde los 70s.' },
    ],
    origin: 'Codificado por Alexei Medvedev y refinado por la escuela soviética. Base de prácticamente todos los sistemas modernos de halterofilia.',
  },
  'Búlgaro': {
    title: '¿Qué hace único al método búlgaro?',
    cards: [
      { name: 'Daily Max', icon: 'pulse', desc: 'Se busca el máximo del día, todos los días. Especificidad extrema sobre clásicos + sentadilla.' },
      { name: 'Mínimo de ejercicios', icon: 'pyramid', desc: 'Snatch, Clean & Jerk, Front/Back Squat. Sin accesorios: todo lo que no transfiere, se descarta.' },
      { name: 'Alta frecuencia', icon: 'wave', desc: 'Múltiples picos diarios. Exige un SNC adaptado y capacidad de recuperación de élite.' },
    ],
    origin: 'Sistema de Ivan Abadjiev (Bulgaria, años 70-80). Dominó la halterofilia mundial; brutal y no apto para principiantes.',
  },
  'Coreano': {
    title: '¿Qué hace único al método coreano?',
    cards: [
      { name: 'Volumen de tirones', icon: 'pyramid', desc: 'Gran carga de pulls (snatch/clean pulls) para fuerza posicional y velocidad de barra.' },
      { name: 'Disciplina rígida', icon: 'pulse', desc: 'Estructura fija, ejecución estricta. Poca improvisación: el plan se cumple.' },
      { name: 'Posiciones de transición', icon: 'wave', desc: 'Énfasis en las posiciones intermedias del levantamiento como base de consistencia técnica.' },
    ],
    origin: 'Escuela coreana, referencia de consistencia técnica y trabajo de tirones. Alta carga semanal distribuida.',
  },
  'Chino': {
    title: '¿Qué hace único al método chino?',
    cards: [
      { name: 'Pulls + culturismo funcional', icon: 'pyramid', desc: 'Tirones altos y trabajo de hipertrofia dirigida para corregir debilidades estructurales.' },
      { name: 'Fuerza posicional', icon: 'pulse', desc: 'Sentadillas pesadas y trabajo cuasi-isométrico para blindar las posiciones del levantamiento.' },
      { name: 'Variabilidad controlada', icon: 'wave', desc: 'Rotación de variantes para estímulo sostenido sin estancamiento.' },
    ],
    origin: 'Escuela china (referencia institucional moderna). Domina el medallero mundial con alto volumen y técnica refinada.',
  },
  'Cubano': {
    title: '¿Qué hace único al método cubano?',
    cards: [
      { name: 'Técnica primero', icon: 'wave', desc: 'Foco en la calidad del movimiento con variantes amplias antes de subir intensidad.' },
      { name: 'Progresión cauta', icon: 'pyramid', desc: 'Cargas que suben de forma conservadora. Ideal para construir base sin lesionar.' },
      { name: 'Ondulación suave', icon: 'pulse', desc: 'Variación moderada de carga semana a semana. Sostenible para atletas en desarrollo.' },
    ],
    origin: 'Escuela cubana, reconocida por desarrollar técnica sólida desde la base. Excelente para reentrada o atletas nuevos.',
  },
  'Polaco': {
    title: '¿Qué hace único al método polaco?',
    cards: [
      { name: 'Block periodization', icon: 'pyramid', desc: 'Bloques concentrados de una capacidad por vez. Calidad sobre cantidad.' },
      { name: 'Series cortas', icon: 'pulse', desc: 'Mayoría de trabajo en 1-3 reps cerca de intensidad competitiva. Mucho pull desde bloques.' },
      { name: 'Picos frecuentes', icon: 'wave', desc: 'Taper inteligente y picos rápidos: recuperar sensaciones de competencia sin saturar.' },
    ],
    origin: 'Escuela polaca de periodización por bloques. Eficaz para ciclos cortos pre-competencia.',
  },
  'Ucraniano': {
    title: '¿Qué hace único al método ucraniano?',
    cards: [
      { name: 'Alta densidad', icon: 'pulse', desc: 'Mucho trabajo en poco tiempo (EMOM-heavy). Tolerancia al trabajo denso.' },
      { name: 'Tirones largos', icon: 'pyramid', desc: 'Volumen alto de pulls para construir la base de fuerza del levantamiento.' },
      { name: 'Eficiencia', icon: 'wave', desc: 'Diseñado para sacar el máximo de sesiones acotadas. Ideal para tiempo limitado.' },
    ],
    origin: 'Escuela ucraniana, conocida por la densidad de trabajo y el volumen de tirones.',
  },
  'Colombiano': {
    title: '¿Qué hace único al método colombiano?',
    cards: [
      { name: 'Prioridad C&J', icon: 'pyramid', desc: 'El envión y el overhead son el eje. Refuerza el Jerk y la posición sobre la cabeza.' },
      { name: 'Ondulación constante', icon: 'wave', desc: 'Variación de carga permanente para sostener el estímulo a lo largo del ciclo.' },
      { name: 'Adaptación latina', icon: 'pulse', desc: 'Pensado para climas cálidos y trabajo aeróbico extra de soporte.' },
    ],
    origin: 'Escuela colombiana/latinoamericana en ascenso. Fuerte en C&J y overhead.',
  },
  'Híbrido': {
    title: '¿Qué hace único al método híbrido moderno?',
    cards: [
      { name: 'Acum · Transmut · Realiz', icon: 'pyramid', desc: 'Tres fases: acumular volumen, transmutarlo a fuerza específica, realizarlo en picos.' },
      { name: 'Compuestos grandes', icon: 'pulse', desc: 'Prioriza los movimientos que más transfieren; menos accesorios, más densidad por sesión.' },
      { name: 'Adaptable', icon: 'wave', desc: 'Block periodization modular: se ajusta al tiempo y nivel del atleta. Sostenible largo plazo.' },
    ],
    origin: 'Síntesis moderna (Issurin y otros). Pensado para atletas con tiempo limitado o transición desde CrossFit.',
  },
  'USA': {
    title: '¿Qué hace único al método USA?',
    cards: [
      { name: 'Periodización lineal', icon: 'pyramid', desc: 'Progresión clásica de volumen a intensidad a lo largo del ciclo.' },
      { name: 'Balance', icon: 'wave', desc: 'Equilibrio entre volumen e intensidad, sin extremos. Estándar competitivo.' },
      { name: 'Estructura clara', icon: 'pulse', desc: 'Programación predecible y replicable, fácil de seguir y medir.' },
    ],
    origin: 'Sistema de USA Weightlifting (USAW). Estándar competitivo norteamericano, balanceado y accesible.',
  },
};
const FAMILY_FALLBACK: FamilyMeta = FAMILY['Ruso'];

// ── Helpers de parseo ────────────────────────────────────────────────────────
function parseWeeks(d: string): number {
  const m = d.match(/\d+/);
  const n = m ? parseInt(m[0], 10) : 12;
  return clamp(Number.isFinite(n) ? n : 12, 4, 24);
}
function parseFreq(f: string): number {
  const m = f.match(/\d+/);
  const n = m ? parseInt(m[0], 10) : 5;
  return clamp(Number.isFinite(n) ? n : 5, 2, 6);
}

// ── Generador de la curva semanal (IMR + reps + meso + foco) ─────────────────
const PHASE_MID = [65, 75, 84, 92];           // GPP · Fuerza · SPP · Peaking
const PHASE_VOL = [1.05, 1.0, 0.85, 0.6];     // factor de volumen por fase
const FOCUS_LOAD = ['Acumulación', 'Choque · pico', 'Intensificación', 'Peaking · singles'];

function quarterOf(i: number, weeks: number): number {
  return clamp(Math.floor((i / weeks) * 4), 0, 3);
}

function genWeekly(weeks: number, intensity: number, volume: number): WeeklyEntry[] {
  const intShift = (intensity - 3) * 4;       // macro intenso → IMR más alto
  const volBase = 240 + volume * 48;          // ~288..480 reps base
  const out: WeeklyEntry[] = [];
  for (let i = 0; i < weeks; i++) {
    const w = i + 1;
    const q = quarterOf(i, weeks);
    const isDeload = w % 4 === 0 && w !== weeks;
    const isTest = w === weeks;
    const ramp = ((i % 4) / 3) * 6 - 3;       // -3..+3 dentro del bloque
    let imr = PHASE_MID[q] + intShift + ramp - (isDeload ? 12 : 0);
    if (isTest) imr = clamp(98 + intShift / 2, 95, 102);
    imr = Math.round(clamp(imr, 50, 102));
    let reps = volBase * PHASE_VOL[q] * (isDeload ? 0.45 : 1);
    if (isTest) reps *= 0.4;
    const focus = isTest ? 'Test PR · 100%+'
      : isDeload ? 'Descarga'
      : w === 1 ? 'Introducción · técnica'
      : FOCUS_LOAD[q];
    out.push({ w, imr, reps: Math.round(reps), meso: q + 1, focus });
  }
  const curIdx = clamp(Math.round(weeks * 0.45), 0, out.length - 1);
  out[curIdx].current = true;
  return out;
}

// ── Generador de mesociclos (4 fases) ────────────────────────────────────────
const MESO_NAMES = ['PREPARACIÓN GENERAL', 'FUERZA / ACUMULACIÓN', 'SPP / INTENSIFICACIÓN', 'PEAKING / TEST'];
const MESO_FOCUS = ['Acondicionamiento + técnica', 'Fuerza máxima + acumulación', 'Especificidad clásicos', 'Picos + test PR'];
const MESO_DESC = [
  'Variantes Muscle/Hang/Power + squat. Sienta la base aeróbica y técnica del macrociclo.',
  'Acumula fuerza máxima en sentadillas y tirones para transferir a los clásicos.',
  'Transferencia de la fuerza acumulada a Snatch y C&J completos. Singles y doubles en zona competitiva.',
  'Taper progresivo · sesiones cortas de alta intensidad · test de PRs olímpicos al final.',
];
const MESO_CSS = ['meso-1', 'meso-2', 'meso-3', 'meso-4'];

function genMesos(weekly: WeeklyEntry[]): Mesocycle[] {
  return [0, 1, 2, 3].map(q => {
    const wk = weekly.filter(w => w.meso === q + 1);
    const first = wk[0]?.w ?? 1;
    const last = wk[wk.length - 1]?.w ?? first;
    const imrs = wk.map(w => w.imr);
    const lo = imrs.length ? Math.min(...imrs) : PHASE_MID[q];
    const hi = imrs.length ? Math.max(...imrs) : PHASE_MID[q];
    return {
      idx: q + 1,
      name: MESO_NAMES[q],
      weeks: [first, last] as [number, number],
      imrRange: `${lo}-${hi}%`,
      focus: MESO_FOCUS[q],
      desc: MESO_DESC[q],
      color: MESO_CSS[q],
    };
  });
}

// ── Generador de la semana tipo (día por día) ────────────────────────────────
const DOW = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
// 1RM genéricos de referencia para la prescripción de ejemplo
const REF = { Sn: 92, CJ: 115, BS: 185, FS: 155 };
const plateHint = (kg: number) => kg >= 140 ? '2🔴 1🟡 (×2)' : kg >= 100 ? '1🔴 1🔵 1🟢 (×2)' : kg >= 60 ? '1🟡 1🟢 (×2)' : '1🟢 (×2)';

function dayFromType(d: string, type: Day['type'], intensity: number): Day {
  const lift = (slot: string, ex: string, pct: number, base: number, baseLbl: string): Slot => {
    const kg = Math.round((pct / 100) * base);
    return { slot, ex, pct, kg, base: baseLbl, plates: plateHint(kg) };
  };
  const hi = 78 + intensity * 2;   // tope de % según intensidad del macro
  switch (type) {
    case 'int':
      return { d, type, name: 'INT · Intensidad', dur: 90, tonelaje: 3800, rpe: '8-9', slots: [
        lift('ARRANQUE', 'Snatch · 5×2', Math.min(hi, 85), REF.Sn, '1RM Sn 92kg'),
        lift('ENVIÓN', 'Clean & Jerk · 5×1', Math.min(hi + 2, 88), REF.CJ, '1RM C&J 115kg'),
      ] };
    case 'med':
      return { d, type, name: 'MED · Mediano', dur: 80, tonelaje: 3100, rpe: '7', slots: [
        lift('ARRANQUE', 'Hang Snatch · 4×3', 68, REF.Sn, '1RM Sn 92kg'),
        lift('FRONT SQ', 'Front Squat · 4×4', 75, REF.FS, '1RM FS 155kg'),
      ] };
    case 'tec':
      return { d, type, name: 'TEC · Técnica', dur: 75, tonelaje: 2100, rpe: '5-6', slots: [
        lift('TÉCNICA', 'Snatch tirón hasta rodilla · 5×3', 55, REF.Sn, '1RM Sn 92kg'),
      ] };
    case 'act':
      return { d, type, name: 'ACT · Activación', dur: 60, tonelaje: 1450, rpe: '5', slots: [
        lift('CLÁSICOS', 'C&J Power · 3×2', 60, REF.CJ, '1RM C&J 115kg'),
      ] };
    case 'rec':
      return { d, type, name: 'REC · Recuperación', dur: 45, tonelaje: 600, rpe: '3-4', slots: [
        lift('MOVILIDAD', 'Técnica barra vacía · 5×5', 20, REF.Sn, '1RM Sn 92kg'),
      ] };
    default: // vol
      return { d, type, name: 'VOL · Volumen', dur: 95, tonelaje: 4250, rpe: '6-7', slots: [
        lift('ARRANQUE', 'Muscle Snatch · 4×4', 55, REF.Sn, '1RM Sn 92kg'),
        lift('FUERZA', 'Back Squat · 5×6', 65, REF.BS, '1RM BS 185kg'),
      ] };
  }
}

/** Patrón de tipos de día por escuela (compartido entre la semana tipo y el plan semanal). */
function familyDayPattern(family: string): Day['type'][] {
  return family === 'Búlgaro'
    ? ['int', 'int', 'int', 'int', 'int', 'int']
    : family === 'Polaco'
    ? ['int', 'tec', 'int', 'med', 'int', 'act']
    : family === 'Cubano'
    ? ['vol', 'tec', 'med', 'tec', 'act', 'rec']
    : ['vol', 'tec', 'int', 'med', 'act', 'rec'];   // ruso/clásico por defecto
}

function genWeekTypical(freq: number, family: string, intensity: number): WeekTypical {
  const pattern = familyDayPattern(family);
  const days = Array.from({ length: freq }, (_, i) => dayFromType(DOW[i], pattern[i % pattern.length], intensity));
  return { label: 'Semana tipo · bloque de fuerza', days };
}

// ── Plan semanal de 7 días (Lun→Dom) derivado del macro ──────────────────────
// Atado a la escuela real (patrón de tipos) + frecuencia real (cuántos días entrena).
// Lo consumen Coach Dash (Week WODs del macro dominante) y Session Schedule
// (semana del macro del atleta). NO inventa: deriva de los params del macro.
export interface WeekPlanDay {
  dow: string;                    // 'LUN'…'DOM' (Lun-first)
  type: Day['type'] | 'rest';
  label: string;                  // corto: 'Intensidad'
  name: string;                   // largo: 'Intensidad · Clásicos'
  intensity: number;              // 0 (rest) … 5
  rest: boolean;
}

const TYPE_META: Record<string, { label: string; name: string; intensity: number }> = {
  int:  { label: 'Intensidad',   name: 'Intensidad · Clásicos',  intensity: 5 },
  med:  { label: 'Fuerza',       name: 'Mediano · Fuerza',       intensity: 3 },
  vol:  { label: 'Volumen',      name: 'Volumen · Base',         intensity: 4 },
  tec:  { label: 'Técnica',      name: 'Técnica · Drills',       intensity: 2 },
  act:  { label: 'Activación',   name: 'Activación · Potencia',  intensity: 3 },
  rec:  { label: 'Recuperación', name: 'Recuperación',           intensity: 1 },
  rest: { label: 'Descanso',     name: 'Descanso',               intensity: 0 },
};

// Qué días de la semana (índice Lun=0) son de entrenamiento según la frecuencia.
const TRAIN_DAYS: Record<number, number[]> = {
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 4],
  5: [0, 1, 2, 3, 4],
  6: [0, 1, 2, 3, 4, 5],
};
const DOW_MON = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

/** Resuelve el plan semanal (7 días) del macro por id. Cae al primer macro HO si el id no existe. */
export function getWeekPlan(id: string | null): WeekPlanDay[] {
  const base = (id ? MACROCYCLES.find(m => m.id === id) : null)
    ?? MACROCYCLES.find(m => m.product === 'holy-oly')
    ?? MACROCYCLES[0];
  const freq = parseFreq(base.frequency);
  const pattern = familyDayPattern(base.family);
  const trainIdx = TRAIN_DAYS[freq] ?? TRAIN_DAYS[5];
  let p = 0;
  return Array.from({ length: 7 }, (_, i) => {
    const isTrain = trainIdx.includes(i);
    const type: WeekPlanDay['type'] = isTrain ? pattern[p++ % pattern.length] : 'rest';
    const meta = TYPE_META[type];
    return { dow: DOW_MON[i], type, label: meta.label, name: meta.name, intensity: meta.intensity, rest: !isTrain };
  });
}

// ── Resolver + ensamblar ─────────────────────────────────────────────────────
function similarOf(id: string, family: string): { name: string; meta: string }[] {
  const sameFam = MACROCYCLES.filter(m => m.product === 'holy-oly' && m.family === family && m.id !== id);
  const pool = sameFam.length >= 2 ? sameFam : MACROCYCLES.filter(m => m.product === 'holy-oly' && m.id !== id);
  return pool.slice(0, 2).map(m => ({ name: m.name, meta: `${parseWeeks(m.duration)} sem · ${parseFreq(m.frequency)}d` }));
}

/**
 * Resuelve el detalle rico de un macro por su id (sessionStorage 'ho:selectedMacroId').
 * Si el id no existe, cae al primer macro HO. Siempre devuelve data coherente.
 */
export function getMacroDetail(id: string | null): MacroData {
  const base = (id ? MACROCYCLES.find(m => m.id === id) : null)
    ?? MACROCYCLES.find(m => m.product === 'holy-oly')
    ?? MACROCYCLES[0];
  const weeks = parseWeeks(base.duration);
  const freq = parseFreq(base.frequency);
  const fam = FAMILY[base.family] ?? FAMILY_FALLBACK;
  const weekly = genWeekly(weeks, base.intensity, base.volume);
  return {
    id: base.id,
    name: base.name.toUpperCase(),
    family: base.family.toUpperCase(),
    schoolColor: base.color,
    duration: weeks,
    frequency: freq,
    intensity: base.intensity,
    volume: base.volume,
    recovery: clamp(6 - base.intensity, 1, 5),
    difficulty: base.intensity,
    subtitle: `${weeks} semanas · ${freq} días/semana · Escuela ${base.family}`,
    philoTitle: fam.title,
    philosophy: fam.cards,
    weekly,
    mesocycles: genMesos(weekly),
    weekTypical: genWeekTypical(freq, base.family, base.intensity),
    footer: { origin: fam.origin, similar: similarOf(base.id, base.family) },
    // Vista de PREVIEW del catálogo: no es el macro activo del atleta → sin banner de progreso.
    user: { isActive: false, currentWeek: 0, pctComplete: 0, role: 'athlete', has1RM: true },
  };
}
