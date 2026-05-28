import React, { useMemo, useState } from 'react';
import type { AthleteProfile, AthleteSession } from '../data/athletes';
import { PlateBadge, type PlateTier } from './PlateBadge';
import '../styles/v2/session-history.css';

/**
 * SessionHistoryList · listado cronológico DESC de sesiones recientes del atleta.
 *
 * Diferenciador vs WeeklyAnalysisCharts / 30d calendar:
 *  - este componente muestra DETALLE por sesión (qué entrenó · cuándo · cómo fue · nota)
 *  - tap → expande detalle full (load · RPE expected vs reported · sleep · wellness · notes)
 *
 * Adapta labels y emojis a producto Volta (WOD / score / scaling) vs HO (oly / strength).
 * Lee de `athlete.sessions_last_7` (mock). Cuando exista API real, swap por endpoint
 * de history extendido.
 *
 * Estilo V2 dark · scoped bajo `.shl-root` · tokens de styles/v2/tokens.css.
 * Solo presentación restyleada: toda la lógica (hooks, sort/filtro, clasificación
 * de sesiones, expand, formato de fecha) se mantiene idéntica.
 */

const HO_GOLD = '#F5C518';
const HO_PURPLE = '#7C5CFF';
const CYAN = '#00E5FF';

type Filter = 'all' | 'completed' | 'rest' | 'skipped';

interface Props {
  athlete: AthleteProfile;
  /** Cap de items mostrados. Default 14. */
  limit?: number;
}

// ── Classify session into a "type" emoji + label ─────────────────────────────

interface SessionKind {
  emoji: string;
  label: string;
  color: string;
}

const kindFromSession = (s: AthleteSession, isVolta: boolean): SessionKind => {
  // Skipped (load 0 + no completed + no rest note)
  if (!s.completed && s.load === 0) {
    const note = (s.notes ?? '').toLowerCase();
    if (note.includes('descan') || note.includes('libre') || note.includes('rest') || note.includes('mobility') || note.includes('foam')) {
      return { emoji: '🧘', label: isVolta ? 'Recovery' : 'Descanso', color: 'rgba(148,163,184,0.7)' };
    }
    return { emoji: '🚫', label: 'Skip', color: '#f87171' };
  }
  const note = (s.notes ?? '').toLowerCase();
  if (isVolta) {
    if (note.includes('amrap') || note.includes('emom') || note.includes('fran') || note.includes('helen')
        || note.includes('grace') || note.includes('cindy') || note.includes('murph') || note.includes('wod')) {
      return { emoji: '⚡', label: 'Metcon', color: CYAN };
    }
    if (note.includes('squat') || note.includes('strength') || note.includes('deadlift') || note.includes('press')) {
      return { emoji: '💪', label: 'Strength', color: HO_GOLD };
    }
    if (note.includes('snatch') || note.includes('clean')) {
      return { emoji: '🏋️', label: 'Olympic', color: HO_PURPLE };
    }
    return { emoji: '⚡', label: 'Metcon', color: CYAN };
  }
  // HO
  if (s.rpe_reported >= 9) return { emoji: '💪', label: 'Strength', color: HO_GOLD };
  if (s.rpe_reported >= 7) return { emoji: '🏋️', label: 'Olympic', color: HO_PURPLE };
  return { emoji: '🏋️', label: 'Técnica', color: 'rgba(148,163,184,0.85)' };
};

// ── RPE chip level · drives token-based chip colors via data-level ──────────

type RpeLevel = 'high' | 'mid' | 'low' | null;

const rpeLevel = (rpe: number): RpeLevel => {
  if (rpe <= 0) return null;
  if (rpe >= 9) return 'high';
  if (rpe >= 7) return 'mid';
  return 'low';
};

// ── Disc tier · mapea intensidad RPE de una sesión hecha a un tier de disco ──
// Solo se muestra un disco PlateBadge cuando hay carga real (no rest/skip):
// la intensidad acumulada de la sesión se lee como tier halterofilia.

const tierFromSession = (s: AthleteSession): PlateTier | null => {
  if (!s.completed || s.load === 0) return null;
  const rpe = s.rpe_reported;
  if (rpe >= 9) return 'red';
  if (rpe >= 7) return 'blue';
  if (rpe >= 5) return 'yellow';
  if (rpe > 0)  return 'green';
  return 'white';
};

// ── Date formatting · "vie 23 may" ──────────────────────────────────────────

const DOW = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const fmtDate = (iso: string): string => {
  // Parse YYYY-MM-DD as local date (avoid TZ shift)
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return `${DOW[date.getDay()]} ${String(date.getDate()).padStart(2, '0')} ${MONTHS[date.getMonth()]}`;
};

// ── Summary line (1-line resumen del entrenamiento) ─────────────────────────

const summarizeSession = (s: AthleteSession, isVolta: boolean): string => {
  if (!s.completed && s.load === 0) {
    return s.notes ?? (isVolta ? 'Sin WOD registrado' : 'Sin sesión registrada');
  }
  // Si hay nota, úsala como resumen prioritario (la mock las trae con detalle WOD/setup)
  if (s.notes && s.notes.length > 0) return s.notes;
  if (isVolta) {
    return `WOD · load ${Math.round(s.load).toLocaleString('es-AR')} · sleep ${s.sleep_hours}h`;
  }
  return `Sesión · ${Math.round(s.load).toLocaleString('es-AR')} kg total · sleep ${s.sleep_hours}h`;
};

// ── Filter helpers ───────────────────────────────────────────────────────────

const passesFilter = (s: AthleteSession, f: Filter): boolean => {
  if (f === 'all') return true;
  if (f === 'completed') return s.completed;
  if (f === 'rest') {
    if (s.completed) return false;
    const note = (s.notes ?? '').toLowerCase();
    return s.load === 0 && (note.includes('descan') || note.includes('libre') || note.includes('rest') || note.includes('mobility'));
  }
  if (f === 'skipped') {
    if (s.completed) return false;
    if (s.load > 0) return false;
    const note = (s.notes ?? '').toLowerCase();
    const isRest = note.includes('descan') || note.includes('libre') || note.includes('rest') || note.includes('mobility');
    const isPending = note.includes('pendiente') || note.includes('hoy');
    return !isRest && !isPending;
  }
  return true;
};

// ── Component ────────────────────────────────────────────────────────────────

const SessionHistoryList: React.FC<Props> = ({ athlete, limit = 14 }) => {
  const isVolta = athlete.product === 'volta';
  const [filter, setFilter] = useState<Filter>('all');
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  // Sort DESC por fecha y aplicar filtro
  const items = useMemo(() => {
    const sorted = [...athlete.sessions_last_7].sort((a, b) => b.date.localeCompare(a.date));
    return sorted.filter(s => passesFilter(s, filter)).slice(0, limit);
  }, [athlete.sessions_last_7, filter, limit]);

  return (
    <section className="shl-root" data-accent={isVolta ? 'volta' : 'ho'}>
      <div className="shl-head">
        <p className="shl-eyebrow"><span className="pip" />Historial de sesiones</p>
        <p className="shl-meta">
          últimas {athlete.sessions_last_7.length} · más reciente arriba
        </p>
      </div>

      {/* Filter chips */}
      <div className="shl-filters">
        {(
          [
            { key: 'all',       label: 'Todas' },
            { key: 'completed', label: 'Completadas' },
            { key: 'rest',      label: 'Rest' },
            { key: 'skipped',   label: 'Skipped' },
          ] as { key: Filter; label: string }[]
        ).map(c => (
          <button
            key={c.key}
            onClick={() => setFilter(c.key)}
            className="shl-chip btn-press"
            data-active={filter === c.key}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* List */}
      {items.length === 0 ? (
        <div className="shl-empty">
          <p>
            {athlete.sessions_last_7.length === 0
              ? 'Sin sesiones registradas todavía'
              : `Sin sesiones para el filtro "${filter}"`}
          </p>
        </div>
      ) : (
        <div className="shl-list">
          {items.map(s => {
            const key = `${s.date}-${s.load}`;
            const isOpen = expandedKey === key;
            const kind = kindFromSession(s, isVolta);
            const level = rpeLevel(s.rpe_reported);
            const tier = tierFromSession(s);
            const summary = summarizeSession(s, isVolta);
            return (
              <button
                key={key}
                onClick={() => setExpandedKey(isOpen ? null : key)}
                className="shl-row btn-press"
                data-open={isOpen}
                style={{ '--row-c': kind.color } as React.CSSProperties}
              >
                {/* Top row · fecha · kind · summary · RPE */}
                <div className="shl-row-top">
                  {tier ? (
                    <span className="shl-row-disc">
                      <PlateBadge tier={tier} size={32} />
                    </span>
                  ) : (
                    <div className="shl-row-icon">{kind.emoji}</div>
                  )}

                  <div className="shl-row-main">
                    <div className="shl-row-titleline">
                      <span className="shl-row-date">{fmtDate(s.date)}</span>
                      <span className="shl-row-kind">{kind.label}</span>
                    </div>
                    <p className="shl-row-summary">{summary}</p>
                  </div>

                  {level && (
                    <span className="shl-rpe" data-level={level}>
                      RPE {s.rpe_reported}
                    </span>
                  )}

                  <span className="shl-caret">›</span>
                </div>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="shl-detail">
                    <DetailRow label={isVolta ? 'Load total' : 'Tonelaje'} value={`${Math.round(s.load).toLocaleString('es-AR')}${isVolta ? '' : ' kg'}`} />
                    <DetailRow label="RPE plan / real" value={`${s.rpe_expected}/10 → ${s.rpe_reported}/10`} />
                    <DetailRow label="Sueño" value={`${s.sleep_hours} h`} />
                    <DetailRow label="Sore / Motiv / Stress" value={`${s.soreness} · ${s.motivation} · ${s.life_stress}`} />
                    {s.notes && (
                      <div className="shl-detail-cell-full">
                        <p className="shl-detail-label">Nota</p>
                        <p className="shl-note-quote">"{s.notes}"</p>
                      </div>
                    )}
                    {isVolta && s.completed && s.load > 0 && (
                      <div className="shl-detail-cell-full">
                        <p className="shl-scale">
                          Escala estimada: <strong>{s.rpe_reported >= 8 ? 'Rx' : s.rpe_reported >= 6 ? 'Scaled' : 'Beginner'}</strong>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};

const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <p className="shl-detail-label">{label}</p>
    <p className="shl-detail-value">{value}</p>
  </div>
);

export default SessionHistoryList;
