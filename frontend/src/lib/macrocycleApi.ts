/**
 * Cliente para los endpoints reales del Macrocycle Engine.
 *
 * Backend: backend/src/core/macrocycle_engine.py (23 programas, 9 escuelas).
 * Endpoints en `/v1/macrocycles*` (requieren JWT — usan el mismo `api`/token de auth).
 *
 * Diseño: si la API falla (sin token, backend caído, etc), los consumidores
 * pueden hacer fallback a `data/macrocycles.ts` localmente.
 */

import { api } from './api';

// ── Tipos crudos del backend ─────────────────────────────────────────────
export interface BackendMacrocycleSummary {
  id: string;
  name: string;
  school: string;              // 'Bulgarian' | 'Russian' | ... (9 escuelas)
  weeks: number;
  focus: string;               // 'Hypertrophy' | 'Strength' | 'Power' | 'Peaking' | 'Technical'
  difficulty: number;          // 1-5
  sessions_per_week: number;
}

export interface BackendMacrocycleDetail extends BackendMacrocycleSummary {
  description: string;
}

interface MacrocyclesListResponse {
  programs: BackendMacrocycleSummary[];
  total: number;
}

// ── Tipo normalizado para la UI ──────────────────────────────────────────
// Mantiene paridad con el shape de `data/macrocycles.ts` para coexistir.
export interface RemoteMacrocycle {
  id: string;
  name: string;
  school: string;
  focus: string;
  weeks: number;
  sessions_per_week: number;
  difficulty: number;
  description?: string;
  // Derivados para visualización (alineados con la UI existente)
  family: string;        // = school (string libre, no enum)
  product: 'holy-oly' | 'volta';
  desc: string;          // = description o fallback
  frequency: string;     // "5d/sem"
  duration: string;      // "12 semanas"
  intensity: number;     // 1-5 (derivado de focus + difficulty)
  volume: number;        // 1-5 (derivado de focus + difficulty)
  color: string;         // por escuela
  bestFor?: string;
}

// Paleta por escuela (coincide en espíritu con macrocycles.ts hardcoded)
const SCHOOL_COLORS: Record<string, string> = {
  Bulgarian: '#EF4444',
  Russian: '#06B6D4',
  Chinese: '#F59E0B',
  American: '#0EA5E9',
  Iranian: '#10B981',
  European: '#22C55E',
  Japanese: '#A855F7',
  Ukrainian: '#FACC15',
  Turkish: '#DC2626',
};

// Mapeo focus → (intensity, volume) tentativo para las barras
function deriveIntensityVolume(focus: string, difficulty: number): { intensity: number; volume: number } {
  const f = focus.toLowerCase();
  if (f.includes('peaking')) return { intensity: Math.min(5, difficulty + 1), volume: 2 };
  if (f.includes('power')) return { intensity: 4, volume: Math.max(2, difficulty - 1) };
  if (f.includes('strength')) return { intensity: difficulty, volume: 3 };
  if (f.includes('hypertrophy')) return { intensity: 3, volume: 5 };
  if (f.includes('technical')) return { intensity: 2, volume: 3 };
  return { intensity: difficulty, volume: difficulty };
}

export function normalize(p: BackendMacrocycleSummary, description?: string): RemoteMacrocycle {
  const { intensity, volume } = deriveIntensityVolume(p.focus, p.difficulty);
  return {
    ...p,
    description,
    family: p.school,
    product: 'holy-oly', // los 23 son halterofilia
    desc: description ?? `${p.school} · ${p.focus}. ${p.weeks} semanas · ${p.sessions_per_week}d/sem.`,
    frequency: `${p.sessions_per_week}d/sem`,
    duration: `${p.weeks} semanas`,
    intensity,
    volume,
    color: SCHOOL_COLORS[p.school] ?? '#06B6D4',
    bestFor: undefined,
  };
}

// ── API calls ────────────────────────────────────────────────────────────

export async function fetchMacrocycles(): Promise<RemoteMacrocycle[]> {
  const res = await api.get<MacrocyclesListResponse>('/v1/macrocycles');
  return res.programs.map(p => normalize(p));
}

export async function fetchMacrocycleDetail(programId: string): Promise<RemoteMacrocycle> {
  const detail = await api.get<BackendMacrocycleDetail>(`/v1/macrocycles/${programId}`);
  return normalize(detail, detail.description);
}

export interface GenerateMacrocycleRequest {
  athlete_id: string;
  program_id: string;
  maxes: {
    snatch: number;
    clean: number;
    jerk: number;
    back_squat: number;
    front_squat?: number;
    body_weight?: number;
  };
  start_date: string; // ISO yyyy-mm-dd
}

export interface GenerateMacrocycleResponse {
  athlete_id: string;
  program_id: string;
  total_sessions: number;
  sessions: unknown[];
}

export async function generateMacrocycle(req: GenerateMacrocycleRequest): Promise<GenerateMacrocycleResponse> {
  return api.post<GenerateMacrocycleResponse>('/v1/macrocycles/generate', req);
}

// ── Helper resiliente: intenta API, retorna null si falla ────────────────
export async function tryFetchMacrocycles(): Promise<RemoteMacrocycle[] | null> {
  try {
    return await fetchMacrocycles();
  } catch (e) {
    console.warn('[macrocycleApi] Fallback to local data:', (e as Error).message);
    return null;
  }
}
