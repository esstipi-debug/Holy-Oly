/**
 * derive · datos derivados coherentes para el demo offline de Holy Oly.
 *
 * El roster real (data/athletes.ts) trae los 1RM actuales y las sesiones de la
 * semana, pero NO un histórico de PRs ni la fecha del último test por lift.
 * Para que el demo sea realista (y cada atleta lea distinto) derivamos ese
 * detalle de forma DETERMINÍSTICA a partir de señales reales: el 1RM actual +
 * un seed estable del id del atleta.
 *
 * No es una fuente real de historia — enriquece el mock sin inventar números
 * sueltos: cada serie TERMINA en el 1RM real del atleta y progresa hacia atrás
 * con deltas plausibles (+0..+4 kg). El mismo seed garantiza que la tarjeta de
 * RM del deep dive y el histórico de PRs de Performance cuenten lo mismo.
 */

// ── PRNG determinístico ──────────────────────────────────────────────────────
/** Hash estable string → uint32 (FNV-1a) para sembrar el PRNG por atleta+lift. */
function seedOf(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
/** mulberry32 — generador pseudoaleatorio determinístico [0,1). */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Generador base de PRs (del más reciente al más viejo) ────────────────────
const PR_N = 5; // cuántos PRs mostramos por lift
export interface PrRaw { kg: number; delta: number; daysAgo: number }

/**
 * Serie de PRs por lift: PR_N puntos terminando en `currentMax` (el más reciente)
 * y bajando hacia atrás con mejoras de +0..+4 kg. `delta` de cada punto = cuánto
 * mejoró respecto al PR anterior (más viejo). Determinístico por (id, lift).
 */
function genPrRaw(athleteId: string, lift: string, currentMax: number): PrRaw[] {
  const rand = rng(seedOf(`${athleteId}:${lift}`));
  const steps: number[] = [];
  for (let i = 0; i < PR_N; i++) steps.push(rand() < 0.18 ? 0 : 1 + Math.floor(rand() * 4)); // +0..+4
  const out: PrRaw[] = [];
  let kg = Math.round(currentMax);
  let daysAgo = 2 + Math.floor(rand() * 6); // el más reciente hace ~2-7 días
  for (let i = 0; i < PR_N; i++) {
    out.push({ kg, delta: steps[i], daysAgo });
    kg -= steps[i]; // el PR anterior fue `steps[i]` kg más liviano
    daysAgo += 10 + Math.floor(rand() * 18); // ~10-28 días entre PRs
  }
  return out;
}

// ── API pública ──────────────────────────────────────────────────────────────
const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
function fmtDate(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')} ${MES[d.getMonth()]}`;
}
/** "5d" / "2sem" / "1mes" desde una cantidad de días. */
function fmtAgo(days: number): string {
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.round(days / 7)}sem`;
  return `${Math.round(days / 30)}mes`;
}

export interface PrPoint { date: string; kg: number; delta: number }
/** Histórico de PRs por lift (más reciente → más viejo). `[]` si no hay 1RM. */
export function derivePrHistory(athleteId: string, lift: string, currentMax: number): PrPoint[] {
  if (!currentMax || currentMax <= 0) return [];
  const today = new Date();
  return genPrRaw(athleteId, lift, currentMax).map(p => {
    const d = new Date(today);
    d.setDate(today.getDate() - p.daysAgo);
    return { date: fmtDate(d), kg: p.kg, delta: p.delta };
  });
}

export interface RmStatus { change: string; date: string; up: boolean }
/** Estado del último test de 1RM por lift (cambio + hace cuánto). Coincide con el PR más reciente. */
export function deriveRmStatus(athleteId: string, lift: string, currentMax: number): RmStatus {
  if (!currentMax || currentMax <= 0) return { change: '—', date: '—', up: false };
  const latest = genPrRaw(athleteId, lift, currentMax)[0];
  return {
    change: latest.delta > 0 ? `+${latest.delta}kg` : '0kg',
    date: fmtAgo(latest.daysAgo),
    up: latest.delta > 0,
  };
}

/** 1RM de Clean & Jerk: limitado por el más débil entre clean y jerk (hay que hacer ambos). */
export function cjMax(clean: number, jerk: number): number {
  return Math.min(clean || 0, jerk || 0) || Math.max(clean || 0, jerk || 0);
}
