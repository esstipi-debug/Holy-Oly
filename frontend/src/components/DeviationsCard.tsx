import React, { useEffect, useMemo, useState } from 'react';
import {
  deviationsApi,
  type DeviationsResponse,
  type DeviationSeverity,
  type DeviationType,
} from '../lib/api';
import BottomSheet from './BottomSheet';

/**
 * DeviationsCard · "Desvíos del macrociclo"
 *
 * Renderiza el resumen agregado de las últimas N semanas + tooltip ⓘ
 * explicativo + CTA "Ver detalle" que abre un BottomSheet con la lista
 * completa de desvíos semana por semana (expected vs actual).
 *
 * Props:
 *   - macroId    · id del macrociclo (ej. 'russian_classic')
 *   - athleteId  · UUID del atleta (omitir si current_user = atleta · backend default)
 *   - weeks      · ventana de análisis · default 4
 *
 * Estados:
 *   - loading: skeleton
 *   - error:   mensaje compacto (no rompe la página)
 *   - empty:   "Sin desvíos · cumpliendo el plan"
 *   - data:    severity + counts + recomendación + CTA detalle
 */

interface Props {
  macroId: string;
  athleteId?: string;
  weeks?: number;
}

const SEVERITY_COLOR: Record<DeviationSeverity, string> = {
  low: '#22C55E',
  medium: '#F59E0B',
  high: '#EF4444',
};

const SEVERITY_LABEL: Record<DeviationSeverity, string> = {
  low: 'LOW',
  medium: 'MEDIUM',
  high: 'HIGH',
};

const TYPE_ICON: Record<DeviationType, string> = {
  load_deviation: '▼',
  intensity_low: '▼',
  intensity_high: '▲',
  skip: '⏸',
  early_termination: '✂',
};

const TYPE_LABEL: Record<DeviationType, string> = {
  load_deviation: 'carga',
  intensity_low: 'intensidad baja',
  intensity_high: 'intensidad alta',
  skip: 'skip',
  early_termination: 'corte',
};

const DeviationsCard: React.FC<Props> = ({ macroId, athleteId, weeks = 4 }) => {
  const [data, setData] = useState<DeviationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    deviationsApi
      .get({ macro_id: macroId, weeks, athlete_id: athleteId })
      .then(res => { if (!cancelled) setData(res); })
      .catch(e => { if (!cancelled) setError(e?.message ?? 'Error de red'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [macroId, athleteId, weeks]);

  const byTypeEntries = useMemo(() => {
    if (!data) return [] as Array<[DeviationType, number]>;
    return (Object.entries(data.summary.by_type) as Array<[DeviationType, number]>)
      .filter(([, n]) => n > 0);
  }, [data]);

  // ----- Loading skeleton -----
  if (loading) {
    return (
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--card-border)',
        borderRadius: 16, padding: 14, marginBottom: 20, minHeight: 130,
      }}>
        <p style={{
          fontSize: 9, color: 'var(--text-secondary)', fontWeight: 800,
          letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8,
        }}>Desvíos del macrociclo · cargando…</p>
        <div style={{
          height: 14, width: '60%', background: 'var(--card-border)',
          borderRadius: 4, marginBottom: 8, opacity: 0.5,
        }} />
        <div style={{
          height: 10, width: '40%', background: 'var(--card-border)',
          borderRadius: 4, opacity: 0.4,
        }} />
      </div>
    );
  }

  // ----- Error -----
  if (error || !data) {
    return (
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--card-border)',
        borderRadius: 16, padding: 14, marginBottom: 20,
      }}>
        <p style={{
          fontSize: 9, color: 'var(--text-secondary)', fontWeight: 800,
          letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6,
        }}>Desvíos del macrociclo</p>
        <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
          {error ?? 'No pudimos cargar los desvíos.'}
        </p>
      </div>
    );
  }

  const sev = data.summary.severity;
  const total = data.summary.total_deviations;
  const isEmpty = total === 0;
  const sevColor = SEVERITY_COLOR[sev];

  return (
    <>
      <div style={{
        background: 'var(--surface)',
        border: `1px solid ${isEmpty ? 'var(--card-border)' : `${sevColor}40`}`,
        borderRadius: 16, padding: 14, marginBottom: 20,
      }}>
        {/* HEADER · título + ⓘ */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <p style={{
              fontSize: 9, color: 'var(--text-secondary)', fontWeight: 800,
              letterSpacing: '.08em', textTransform: 'uppercase',
            }}>Desvíos del macrociclo</p>
            <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>
              Últimas {data.weeks_analyzed} semanas
            </p>
          </div>
          <button
            onClick={() => setShowInfo(true)}
            aria-label="¿Qué es un desvío?"
            style={{
              background: 'transparent', border: '1px solid var(--card-border)',
              color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700,
              width: 26, height: 26, borderRadius: 13, cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >ⓘ</button>
        </div>

        {isEmpty ? (
          // ----- Empty state -----
          <>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#22C55E', marginBottom: 6 }}>
              ✓ Sin desvíos
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              <span style={{ color: '#F5C518', fontWeight: 700 }}>✦ WISE: </span>
              {data.recommendation}
            </p>
          </>
        ) : (
          // ----- Data state -----
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
              <span style={{
                fontSize: 11, fontWeight: 900, color: sevColor,
                letterSpacing: '.08em',
                padding: '3px 8px', borderRadius: 6,
                background: `${sevColor}1a`, border: `1px solid ${sevColor}40`,
              }}>{SEVERITY_LABEL[sev]}</span>
              <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 700 }}>
                {total} desvío{total === 1 ? '' : 's'}
              </span>
            </div>

            {/* Type breakdown chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {byTypeEntries.map(([type, n]) => (
                <span key={type} style={{
                  fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700,
                  padding: '3px 7px', borderRadius: 6,
                  background: 'var(--bg)', border: '1px solid var(--card-border)',
                }}>
                  {TYPE_ICON[type]} {n} {TYPE_LABEL[type]}
                </span>
              ))}
            </div>

            <p style={{
              fontSize: 11, color: 'var(--text)', lineHeight: 1.4,
              fontStyle: 'italic', marginBottom: 12,
              padding: '8px 10px', borderRadius: 8,
              background: 'var(--bg)', border: '1px solid var(--card-border)',
            }}>
              <span style={{ color: '#F5C518', fontWeight: 700, fontStyle: 'normal' }}>✦ WISE te sugiere: </span>
              "{data.recommendation}"
            </p>

            <button
              onClick={() => setShowDetail(true)}
              style={{
                width: '100%', padding: '10px 0', borderRadius: 10,
                background: 'transparent', color: sevColor,
                border: `1px solid ${sevColor}40`,
                fontSize: 11, fontWeight: 800, letterSpacing: '.04em',
                textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >Ver detalle ›</button>
          </>
        )}
      </div>

      {/* TOOLTIP ⓘ · qué es un desvío */}
      <BottomSheet
        open={showInfo}
        onClose={() => setShowInfo(false)}
        title="¿Qué es un desvío?"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, color: 'var(--text)' }}>
          <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
            Un desvío es cualquier diferencia entre el plan prescrito y lo que
            el atleta ejecutó:
          </p>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <li style={{ fontSize: 12, lineHeight: 1.4 }}>
              <strong style={{ color: '#F59E0B' }}>🔻 Carga:</strong>{' '}
              levantó &lt;70% del volumen planeado
            </li>
            <li style={{ fontSize: 12, lineHeight: 1.4 }}>
              <strong style={{ color: '#F59E0B' }}>🔻 Intensidad baja:</strong>{' '}
              RPE muy por debajo del esperado
            </li>
            <li style={{ fontSize: 12, lineHeight: 1.4 }}>
              <strong style={{ color: '#EF4444' }}>🔺 Intensidad alta:</strong>{' '}
              RPE por encima del esperado (sobrecarga)
            </li>
            <li style={{ fontSize: 12, lineHeight: 1.4 }}>
              <strong style={{ color: '#EF4444' }}>⏸ Skip:</strong>{' '}
              sesión planeada no realizada
            </li>
            <li style={{ fontSize: 12, lineHeight: 1.4 }}>
              <strong style={{ color: '#F59E0B' }}>✂ Corte:</strong>{' '}
              sesión terminada antes de tiempo
            </li>
          </ul>
          <p style={{
            fontSize: 12, lineHeight: 1.5, color: 'var(--text)',
            padding: 12, borderRadius: 10,
            background: 'var(--surface)', border: '1px solid var(--card-border)',
          }}>
            <strong>Muchos desvíos = el plan no se ajusta a la realidad del atleta.</strong>
            {' '}Considerá deload o cambio de macro.
          </p>
        </div>
      </BottomSheet>

      {/* DETALLE · lista completa de desvíos por semana */}
      <BottomSheet
        open={showDetail}
        onClose={() => setShowDetail(false)}
        title={`Detalle · ${total} desvío${total === 1 ? '' : 's'}`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {data.weeks.filter(w => w.deviations.length > 0).map(week => (
            <div key={week.week}>
              <p style={{
                fontSize: 10, color: 'var(--text-secondary)', fontWeight: 800,
                letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 8,
              }}>
                Semana {week.week} · {week.week_start}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {week.deviations.map((d, i) => {
                  const c = SEVERITY_COLOR[d.severity];
                  return (
                    <div key={i} style={{
                      padding: 12, borderRadius: 10,
                      background: 'var(--surface)', border: `1px solid ${c}33`,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: c }}>
                          {TYPE_ICON[d.type]} {TYPE_LABEL[d.type].toUpperCase()}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                          {d.session_date}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
                        <div>
                          <p style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 700 }}>PLANEADO</p>
                          <p style={{ fontSize: 11, color: 'var(--text)' }}>{d.expected}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 700 }}>REAL</p>
                          <p style={{ fontSize: 11, color: 'var(--text)' }}>{d.actual}</p>
                        </div>
                      </div>
                      <p style={{ fontSize: 11, fontWeight: 800, color: c, marginBottom: 6 }}>
                        Δ {d.delta}
                      </p>
                      <p style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {d.explanation}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {data.weeks.every(w => w.deviations.length === 0) && (
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', padding: 20 }}>
              Sin desvíos para mostrar.
            </p>
          )}
        </div>
      </BottomSheet>
    </>
  );
};

export default DeviationsCard;
