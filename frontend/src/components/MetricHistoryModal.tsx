import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Chart from './social/Chart';

/**
 * MetricHistoryModal · bottom-sheet con sparkline 14d para métricas de Banister.
 *
 * Las métricas (stress/fitness/fatigue/cns/readiness) actualmente se muestran
 * con su valor presente · este modal expone la EVOLUCIÓN tappeando esos valores.
 *
 * Si no se pasa `history`, se genera un mock determinista 14d basado en el
 * valor actual + métrica (cada métrica oscila distinto: fatigue es más volátil,
 * fitness más estable, cns más reactivo). El determinismo garantiza que en
 * cada render se vea la misma serie sin nuevos endpoints.
 */

export type MetricType = 'stress' | 'fitness' | 'fatigue' | 'cns' | 'readiness';

interface HistoryPoint { date: string; value: number; }

interface Props {
  metric: MetricType;
  currentValue: number;
  history?: HistoryPoint[];
  onClose: () => void;
  /** Color accent · default gold */
  accent?: string;
}

const META: Record<MetricType, { label: string; unit: string; tagline: string; defaultAccent: string }> = {
  stress: {
    label: 'Factor de estrés',
    unit: '',
    tagline: 'Tu carga acumulada (Banister CTL). Subir = más fitness pero más fatiga.',
    defaultAccent: '#F59E0B',
  },
  fitness: {
    label: 'Fitness',
    unit: '',
    tagline: 'Tu capacidad física estimada (Chronic Training Load).',
    defaultAccent: '#22C55E',
  },
  fatigue: {
    label: 'Fatiga',
    unit: '',
    tagline: 'Carga aguda (Acute Training Load). Si crece más rápido que fitness, vas a sobrecargarte.',
    defaultAccent: '#EF4444',
  },
  cns: {
    label: 'CNS',
    unit: '',
    tagline: 'Estado del sistema nervioso. Zonas 0-100: <40 rojo · 40-70 amarillo · >70 verde.',
    defaultAccent: '#A855F7',
  },
  readiness: {
    label: 'Readiness',
    unit: '/100',
    tagline: 'Cuánto podés exigirte hoy. Score 0-100 basado en fitness, fatiga, sueño, sores.',
    defaultAccent: '#F5C518',
  },
};

// PRNG determinista por (metric + currentValue)
const seededRandom = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

const generateMockHistory = (metric: MetricType, currentValue: number): HistoryPoint[] => {
  const seed = Math.round(currentValue * 100) + metric.length * 31;
  const rand = seededRandom(seed);
  // Volatilidad por métrica
  const vol = metric === 'fatigue' ? 0.18
    : metric === 'cns' ? 0.14
    : metric === 'readiness' ? 0.12
    : metric === 'stress' ? 0.08
    : 0.06; // fitness
  // Trend: stress/fitness leve creciente · fatigue plano · cns y readiness rebotan
  const trend = metric === 'fitness' ? -0.015
    : metric === 'stress' ? -0.01
    : metric === 'fatigue' ? -0.005
    : 0;

  const out: HistoryPoint[] = [];
  const today = new Date();
  // Construimos 14 puntos: t-13 → t-0. El último es currentValue.
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    if (i === 0) {
      out.push({ date, value: currentValue });
    } else {
      const noise = (rand() - 0.5) * 2 * vol * currentValue;
      const t = trend * i * currentValue;
      const raw = currentValue + t + noise;
      const clamped = Math.max(0, Math.min(100, raw));
      out.push({ date, value: Math.round(clamped * 10) / 10 });
    }
  }
  return out;
};

const dayShort = (iso: string) => {
  const d = new Date(iso + 'T12:00:00');
  return ['D', 'L', 'M', 'X', 'J', 'V', 'S'][d.getDay()];
};

const MetricHistoryModal: React.FC<Props> = ({ metric, currentValue, history, onClose, accent }) => {
  const meta = META[metric];
  const color = accent ?? meta.defaultAccent;

  const series = useMemo(() => {
    if (history && history.length > 0) return history.slice(-14);
    return generateMockHistory(metric, currentValue);
  }, [metric, currentValue, history]);

  const values = series.map(p => p.value);
  const labels = series.map(p => dayShort(p.date));

  const yesterday = values.length >= 2 ? values[values.length - 2] : null;
  const delta = yesterday !== null ? Math.round((currentValue - yesterday) * 10) / 10 : null;
  const deltaSign = delta === null ? '' : delta > 0 ? '+' : '';
  const deltaColor = delta === null ? 'var(--text-secondary)'
    : metric === 'fatigue'
      ? (delta > 0 ? '#EF4444' : '#22C55E')   // fatiga sube = malo
      : (delta > 0 ? '#22C55E' : delta < 0 ? '#EF4444' : 'var(--text-secondary)');

  const maxV = Math.round(Math.max(...values) * 10) / 10;
  const minV = Math.round(Math.min(...values) * 10) / 10;
  const avg = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 110,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          onClick={e => e.stopPropagation()}
          role="dialog"
          aria-label={`Historial de ${meta.label}`}
          style={{
            width: '100%', maxWidth: 360,
            background: 'var(--bg, #0A0A14)',
            borderTopLeftRadius: 24, borderTopRightRadius: 24,
            borderTop: `1px solid ${color}55`,
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
            maxHeight: '92%', overflowY: 'auto',
            scrollPaddingBottom: 80,
            boxShadow: `0 -10px 40px ${color}22`,
          }}
        >
          {/* Handle */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: `${color}55` }} />
          </div>

          {/* Header: nombre + valor + delta */}
          <div style={{ padding: '4px 20px 16px' }}>
            <p style={{
              fontSize: 10, fontWeight: 800, letterSpacing: '.14em',
              textTransform: 'uppercase', color: color,
              margin: 0,
            }}>
              {meta.label}
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 4 }}>
              <span style={{
                fontSize: 40, fontWeight: 900, color: 'var(--text, #EAEAF5)',
                letterSpacing: '-.03em', lineHeight: 1, fontVariantNumeric: 'tabular-nums',
              }}>
                {Math.round(currentValue * 10) / 10}
              </span>
              {meta.unit && (
                <span style={{ fontSize: 12, color: 'var(--text-secondary, #888)', fontWeight: 600 }}>
                  {meta.unit}
                </span>
              )}
              {delta !== null && (
                <span style={{
                  fontSize: 12, fontWeight: 800, color: deltaColor,
                  marginLeft: 'auto',
                  background: `${deltaColor}1A`,
                  border: `1px solid ${deltaColor}44`,
                  padding: '3px 8px', borderRadius: 10,
                }}>
                  {deltaSign}{delta} vs ayer
                </span>
              )}
            </div>
          </div>

          {/* Sparkline grande */}
          <div style={{
            margin: '0 20px 16px',
            padding: 12,
            background: 'rgba(255,255,255,0.02)',
            border: `1px solid ${color}22`,
            borderRadius: 14,
          }}>
            <Chart
              data={{ kind: 'sparkline', values, labels: [labels[0], labels[labels.length - 1]] }}
              color={color}
              width={300}
              height={120}
              scheme="dark"
            />
            <p style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase',
              color: 'var(--text-secondary, #888)', margin: '8px 0 0', textAlign: 'center',
            }}>
              Últimos 14 días
            </p>
          </div>

          {/* Stats row: max · min · avg */}
          <div style={{
            margin: '0 20px 16px',
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
          }}>
            {[
              { label: 'Máx', value: maxV, c: color },
              { label: 'Mín', value: minV, c: 'var(--text-secondary, #888)' },
              { label: 'Prom 14d', value: avg, c: 'var(--text, #EAEAF5)' },
            ].map((s) => (
              <div key={s.label} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12, padding: '10px 8px', textAlign: 'center',
              }}>
                <p style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase',
                  color: 'var(--text-secondary, #888)', margin: 0,
                }}>{s.label}</p>
                <p style={{
                  fontSize: 18, fontWeight: 900, color: s.c, marginTop: 4,
                  fontVariantNumeric: 'tabular-nums', fontStyle: 'italic',
                }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Tagline educativa */}
          <div style={{
            margin: '0 20px 16px',
            padding: '10px 14px',
            background: `${color}0F`,
            border: `1px solid ${color}33`,
            borderRadius: 12,
          }}>
            <p style={{
              fontSize: 11, color: 'var(--text, #EAEAF5)', opacity: 0.85,
              margin: 0, lineHeight: 1.5,
            }}>
              {meta.tagline}
            </p>
          </div>

          {/* Cerrar */}
          <div style={{ padding: '0 20px' }}>
            <button
              onClick={onClose}
              style={{
                width: '100%',
                padding: '12px 0',
                background: color,
                color: '#0A0A14',
                border: 'none', borderRadius: 12,
                fontSize: 13, fontWeight: 800, letterSpacing: '.02em',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MetricHistoryModal;
