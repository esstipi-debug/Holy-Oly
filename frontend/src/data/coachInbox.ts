/**
 * coachInbox · la 🔔 del coach (spec §3.5). NO hay API de notificaciones → se
 * DERIVAN de señales reales del roster + una capa de revisión persistida en
 * sessionStorage (confirmar/revertir/visto). Sin inventar: cada item nace de un
 * dato real (sesión no completada con nota, lesión, 1RM > 30 días).
 */
import type { AthleteProfile } from './athletes';
import { deriveRmStatus } from './derive';

export type InboxKind = 'deviation' | 'injury' | 'stale_rm' | 'request';
export type InboxState = 'pending' | 'confirmed' | 'reverted' | 'seen';

export interface InboxItem {
  id: string;
  athleteId: string;
  who: string;
  kind: InboxKind;
  title: string;
  detail: string;
  severity: 'alert' | 'watch';
}

const KEY = 'ho:inbox:review';
function readReview(): Record<string, InboxState> {
  try { return JSON.parse(sessionStorage.getItem(KEY) || '{}'); } catch { return {}; }
}
function writeReview(map: Record<string, InboxState>): void {
  try { sessionStorage.setItem(KEY, JSON.stringify(map)); } catch { /* ignore */ }
}
export function setItemState(id: string, state: InboxState): void {
  const map = readReview();
  map[id] = state;
  writeReview(map);
}
export function itemState(id: string): InboxState {
  return readReview()[id] ?? 'pending';
}

const firstName = (n: string) => n.split(' ')[0];

/** Deriva los items de la bandeja para un roster (de señales reales). */
export function deriveInbox(roster: AthleteProfile[]): InboxItem[] {
  const items: InboxItem[] = [];
  for (const a of roster) {
    // 1) Sesiones no completadas con nota = desvío reportado por el atleta.
    a.sessions_last_7.forEach((s, i) => {
      if (!s.completed && s.notes && /falt|no pudo|cancel|lesi|dolor/i.test(s.notes)) {
        items.push({
          id: `dev:${a.id}:${i}`, athleteId: a.id, who: firstName(a.name), kind: 'deviation',
          title: `${firstName(a.name)} · sesión no realizada`, detail: `${s.date} — "${s.notes}"`, severity: 'watch',
        });
      }
    });
    // 2) Lesión activa.
    if (a.injuries && a.injuries.length > 0) {
      items.push({
        id: `inj:${a.id}`, athleteId: a.id, who: firstName(a.name), kind: 'injury',
        title: `${firstName(a.name)} · lesión activa`, detail: a.injuries[0], severity: 'alert',
      });
    }
    // 3) 1RM desactualizado (>30 días) → IMR distorsionado (spec §5).
    const snatch = deriveRmStatus(a.id, 'snatch', a.maxes.snatch);
    if (/mes/.test(snatch.date)) {
      items.push({
        id: `rm:${a.id}:snatch`, athleteId: a.id, who: firstName(a.name), kind: 'stale_rm',
        title: `${firstName(a.name)} · 1RM Arrancada viejo`, detail: `Último test hace ${snatch.date} → IMR distorsionado, retesteá.`, severity: 'watch',
      });
    }
  }
  return items;
}

/** Items pendientes (no revisados) — para el badge de la 🔔. */
export function pendingCount(roster: AthleteProfile[]): number {
  return deriveInbox(roster).filter(it => itemState(it.id) === 'pending').length;
}
