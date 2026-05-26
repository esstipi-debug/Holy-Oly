/**
 * Storage helper para sesiones planificadas (con soporte de doble sesión).
 *
 * Persistencia actual: localStorage key `planned:{athleteId}` → JSON `PlannedSession[]`.
 * Estado de sesión: localStorage key `planned_status:{athleteId}:{date}:{slot}` → 'pending' | 'in_progress' | 'completed'.
 *
 * MIGRACIÓN A BACKEND (futuro):
 * - GET /v1/athletes/{id}/planned_sessions?from=YYYY-MM-DD&to=YYYY-MM-DD
 *   → 200 { sessions: PlannedSession[] }
 * - POST /v1/athletes/{id}/planned_sessions
 *   body: { sessions: PlannedSession[] } (upsert por (date, slot))
 * - PATCH /v1/athletes/{id}/planned_sessions/{date}/{slot}
 *   body: { status: 'pending'|'in_progress'|'completed' }
 */

import type { PlannedSession, TrainingSlot } from '../types/training';
import { manualSessionsApi, type ManualSessionResponse } from './api';

const STORAGE_PREFIX = 'planned:';
const STATUS_PREFIX = 'planned_status:';

const todayISO = (): string => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};

export const getPlannedSessions = (athleteId: string): PlannedSession[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${athleteId}`);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (s): s is PlannedSession =>
        s &&
        typeof s.date === 'string' &&
        (s.slot === 'am' || s.slot === 'pm' || s.slot === 'full'),
    );
  } catch {
    return [];
  }
};

export const setPlannedSessions = (
  athleteId: string,
  sessions: PlannedSession[],
): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      `${STORAGE_PREFIX}${athleteId}`,
      JSON.stringify(sessions),
    );
  } catch {
    /* ignore quota errors */
  }
};

export const getSessionsForDate = (
  athleteId: string,
  dateISO: string,
): PlannedSession[] => {
  return getPlannedSessions(athleteId)
    .filter((s) => s.date === dateISO)
    .map((s) => ({
      ...s,
      status: getSlotStatus(athleteId, s.date, s.slot),
    }));
};

export const getPendingForToday = (athleteId: string): PlannedSession[] => {
  const today = todayISO();
  return getSessionsForDate(athleteId, today).filter(
    (s) => s.status !== 'completed',
  );
};

/** Upsert por (date, slot). Si ya existe una sesión en esa fecha+slot, la reemplaza. */
export const upsertPlannedSession = (
  athleteId: string,
  session: PlannedSession,
): void => {
  const all = getPlannedSessions(athleteId);
  const idx = all.findIndex(
    (s) => s.date === session.date && s.slot === session.slot,
  );
  if (idx >= 0) {
    all[idx] = session;
  } else {
    all.push(session);
  }
  setPlannedSessions(athleteId, all);
};

/** Elimina todas las sesiones planificadas para una fecha (vuelve a 0 o 1 default). */
export const clearDate = (athleteId: string, dateISO: string): void => {
  const all = getPlannedSessions(athleteId).filter((s) => s.date !== dateISO);
  setPlannedSessions(athleteId, all);
};

export const getSlotStatus = (
  athleteId: string,
  dateISO: string,
  slot: TrainingSlot,
): 'pending' | 'in_progress' | 'completed' => {
  if (typeof window === 'undefined') return 'pending';
  try {
    const raw = window.localStorage.getItem(
      `${STATUS_PREFIX}${athleteId}:${dateISO}:${slot}`,
    );
    if (raw === 'completed' || raw === 'in_progress') return raw;
    return 'pending';
  } catch {
    return 'pending';
  }
};

export const setSlotStatus = (
  athleteId: string,
  dateISO: string,
  slot: TrainingSlot,
  status: 'pending' | 'in_progress' | 'completed',
): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      `${STATUS_PREFIX}${athleteId}:${dateISO}:${slot}`,
      status,
    );
  } catch {
    /* ignore */
  }
};

/** Helper para guardar el slot activo cuando el atleta entra a una sesión. */
export const setActiveSlot = (slot: TrainingSlot | null): void => {
  if (typeof window === 'undefined') return;
  try {
    if (slot) {
      window.localStorage.setItem('active_session:slot', slot);
    } else {
      window.localStorage.removeItem('active_session:slot');
    }
  } catch {
    /* ignore */
  }
};

export const getActiveSlot = (): TrainingSlot | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem('active_session:slot');
    if (raw === 'am' || raw === 'pm' || raw === 'full') return raw;
    return null;
  } catch {
    return null;
  }
};

// ──────────────────────────────────────────────────────────────────
// Backend-aware wrappers · offline-first
// Si el backend retorna manual_sessions del atleta para hoy, se mergean
// con las locales (las del backend tienen prioridad por (date, slot)).
// ──────────────────────────────────────────────────────────────────

const manualToPlanned = (m: ManualSessionResponse): PlannedSession => ({
  date: m.date,
  slot: m.slot,
  focus: m.focus,
  exercises: m.exercises.map((e) => ({
    name: e.name,
    sets: e.sets,
    reps: e.reps,
    pct: e.pct,
    max_key: e.max_key,
  })),
});

/**
 * Fetch sesiones manuales del backend para HOY · si falla devuelve [].
 * El caller las mergea con las locales vía getPendingForTodayAsync.
 */
export const fetchTodayManualSessions = async (): Promise<PlannedSession[]> => {
  try {
    const sessions = await manualSessionsApi.meToday();
    return sessions.map(manualToPlanned);
  } catch {
    return [];
  }
};

/**
 * Versión async de getPendingForToday · mergea backend (prioridad) + localStorage.
 * Útil cuando el atleta consume sesiones asignadas por el coach desde otro device.
 * NOTE: status se setea desde localStorage del cliente actual (no del backend).
 */
export const getPendingForTodayAsync = async (
  athleteId: string,
): Promise<PlannedSession[]> => {
  const today = todayISO();
  const local = getPendingForToday(athleteId);
  const remote = await fetchTodayManualSessions();
  if (remote.length === 0) return local;

  // Merge por slot · backend gana
  const bySlot = new Map<TrainingSlot, PlannedSession>();
  for (const s of local) bySlot.set(s.slot, s);
  for (const r of remote) {
    const status = getSlotStatus(athleteId, today, r.slot);
    bySlot.set(r.slot, { ...r, status });
  }
  return Array.from(bySlot.values()).filter((s) => s.status !== 'completed');
};
