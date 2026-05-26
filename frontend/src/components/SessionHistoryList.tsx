import React, { useMemo, useState } from 'react';
import type { AthleteProfile, AthleteSession } from '../data/athletes';

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

// ── RPE chip color ───────────────────────────────────────────────────────────

const rpeChipStyle = (rpe: number): { bg: string; fg: string; bd: string } | null => {
  if (rpe <= 0) return null;
  if (rpe >= 9) return { bg: 'rgba(239,68,68,0.15)', fg: '#f87171', bd: 'rgba(239,68,68,0.35)' };
  if (rpe >= 7) return { bg: 'rgba(245,197,24,0.15)', fg: HO_GOLD, bd: 'rgba(245,197,24,0.35)' };
  return { bg: 'rgba(34,197,94,0.15)', fg: '#4ade80', bd: 'rgba(34,197,94,0.35)' };
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

  const accent = isVolta ? CYAN : HO_GOLD;

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <p style={{
          fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700,
          letterSpacing: '.12em', textTransform: 'uppercase',
        }}>
          Historial de sesiones
        </p>
        <p style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 600 }}>
          últimas {athlete.sessions_last_7.length} · más reciente arriba
        </p>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        {(
          [
            { key: 'all',       label: 'Todas' },
            { key: 'completed', label: 'Completadas' },
            { key: 'rest',      label: 'Rest' },
            { key: 'skipped',   label: 'Skipped' },
          ] as { key: Filter; label: string }[]
        ).map(c => {
          const active = filter === c.key;
          return (
            <button
              key={c.key}
              onClick={() => setFilter(c.key)}
              className="btn-press"
              style={{
                padding: '5px 12px', borderRadius: 999,
                background: active ? `${accent}22` : 'transparent',
                color: active ? accent : 'var(--text-secondary)',
                border: `1px solid ${active ? `${accent}55` : 'var(--card-border)'}`,
                fontSize: 10, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* List */}
      {items.length === 0 ? (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--card-border)',
          borderRadius: 14, padding: 18, textAlign: 'center',
        }}>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>
            {athlete.sessions_last_7.length === 0
              ? 'Sin sesiones registradas todavía'
              : `Sin sesiones para el filtro "${filter}"`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map(s => {
            const key = `${s.date}-${s.load}`;
            const isOpen = expandedKey === key;
            const kind = kindFromSession(s, isVolta);
            const rpe = rpeChipStyle(s.rpe_reported);
            const summary = summarizeSession(s, isVolta);
            return (
              <button
                key={key}
                onClick={() => setExpandedKey(isOpen ? null : key)}
                className="btn-press"
                style={{
                  textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                  background: 'var(--surface)',
                  border: `1px solid ${isOpen ? `${accent}55` : 'var(--card-border)'}`,
                  borderRadius: 12, padding: '10px 12px',
                  display: 'flex', flexDirection: 'column', gap: isOpen ? 10 : 0,
                  color: 'var(--text)',
                }}
              >
                {/* Top row · fecha · kind · summary · RPE */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: `${kind.color}15`,
                    border: `1px solid ${kind.color}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, flexShrink: 0,
                  }}>{kind.emoji}</div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 800, color: 'var(--text)',
                        letterSpacing: '-.01em',
                      }}>{fmtDate(s.date)}</span>
                      <span style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: '.06em',
                        color: kind.color, textTransform: 'uppercase',
                      }}>{kind.label}</span>
                    </div>
                    <p style={{
                      fontSize: 11, color: 'var(--text-secondary)',
                      margin: '3px 0 0', lineHeight: 1.35,
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      whiteSpace: isOpen ? 'normal' : 'nowrap',
                    }}>
                      {summary}
                    </p>
                  </div>

                  {rpe && (
                    <span style={{
                      flexShrink: 0,
                      padding: '3px 8px', borderRadius: 8,
                      background: rpe.bg, color: rpe.fg, border: `1px solid ${rpe.bd}`,
                      fontSize: 10, fontWeight: 800, letterSpacing: '.04em',
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      RPE {s.rpe_reported}
                    </span>
                  )}

                  <span style={{
                    flexShrink: 0, fontSize: 12, color: 'var(--text-secondary)',
                    transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform .15s ease',
                  }}>›</span>
                </div>

                {/* Expanded detail */}
                {isOpen && (
                  <div style={{
                    background: 'var(--bg)', borderRadius: 10, padding: 10,
                    border: '1px solid var(--card-border)',
                    display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8,
                  }}>
                    <DetailRow label={isVolta ? 'Load total' : 'Tonelaje'} value={`${Math.round(s.load).toLocaleString('es-AR')}${isVolta ? '' : ' kg'}`} />
                    <DetailRow label="RPE plan / real" value={`${s.rpe_expected}/10 → ${s.rpe_reported}/10`} />
                    <DetailRow label="Sueño" value={`${s.sleep_hours} h`} />
                    <DetailRow label="Sore / Motiv / Stress" value={`${s.soreness} · ${s.motivation} · ${s.life_stress}`} />
                    {s.notes && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <p style={{
                          fontSize: 9, color: 'var(--text-secondary)',
                          fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase',
                          marginBottom: 3,
                        }}>Nota</p>
                        <p style={{
                          fontSize: 11, color: 'var(--text)', fontStyle: 'italic',
                          lineHeight: 1.45, margin: 0,
                        }}>"{s.notes}"</p>
                      </div>
                    )}
                    {isVolta && s.completed && s.load > 0 && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <p style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                          Escala estimada: {s.rpe_reported >= 8 ? 'Rx' : s.rpe_reported >= 6 ? 'Scaled' : 'Beginner'}
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
    <p style={{
      fontSize: 9, color: 'var(--text-secondary)',
      fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase',
      margin: '0 0 2px',
    }}>{label}</p>
    <p style={{
      fontSize: 12, color: 'var(--text)', fontWeight: 700,
      margin: 0, fontVariantNumeric: 'tabular-nums',
    }}>{value}</p>
  </div>
);

export default SessionHistoryList;
