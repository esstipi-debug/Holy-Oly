import React from 'react';
import BottomSheet from '../BottomSheet';

/**
 * MetricsInfoSheet · explica CÓMO se construye y alimenta cada métrica del estado
 * de hoy del atleta (el "?" de las cartas del coach). No son ratings inventados:
 * salen del engine Banister + el check-in diario. Mismo orden que deriveStats().
 */
interface Metric { key: string; label: string; what: string; how: string; source: string }

const METRICS: Metric[] = [
  {
    key: 'RDY', label: 'Readiness',
    what: 'Qué tan listo está el atleta HOY para entrenar fuerte.',
    how: 'Engine Banister: balance forma (fitness) − fatiga + frescura del SNC, escalado 0-99.',
    source: 'Engine + check-in de hoy',
  },
  {
    key: 'SUE', label: 'Sueño',
    what: 'Descanso de anoche respecto al objetivo.',
    how: 'Horas dormidas anoche ÷ 8h objetivo × 100.',
    source: 'Check-in del atleta',
  },
  {
    key: 'CNS', label: 'SNC (sistema nervioso)',
    what: 'Frescura del sistema nervioso central — clave en levantamientos máximos.',
    how: 'cns_score del engine; cae con intensidad alta y fatiga acumulada.',
    source: 'Engine (Banister)',
  },
  {
    key: 'REC', label: 'Recuperación',
    what: 'Cuán recuperado está el músculo (inverso del dolor).',
    how: '(10 − soreness reportado) ÷ 9 × 100. Más dolor = menos recuperación.',
    source: 'Check-in del atleta',
  },
  {
    key: 'MOT', label: 'Ánimo',
    what: 'Estado mental / motivación para entrenar.',
    how: 'Motivación reportada (1-10) × 10.',
    source: 'Check-in del atleta',
  },
  {
    key: 'CRG', label: 'Carga',
    what: 'Frescura según la relación entre forma y fatiga acumulada.',
    how: '100 − (fatiga ÷ fitness × 60). Baja cuando la fatiga supera la forma.',
    source: 'Engine (Banister)',
  },
];

const MetricsInfoSheet: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => (
  <BottomSheet open={open} onClose={onClose} title="Estado de hoy · cómo se calcula">
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        Estas 6 métricas no son un rating de vanidad: salen del <strong style={{ color: 'var(--text)' }}>engine Banister</strong> y del <strong style={{ color: 'var(--text)' }}>check-in diario</strong> del atleta. Son accionables para decidir la carga de hoy.
      </p>
      {METRICS.map(m => (
        <div key={m.key} style={{ padding: 12, borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--card-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{m.label}</p>
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.08em', color: 'var(--engine-stress)', textTransform: 'uppercase' }}>{m.source}</span>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text)', lineHeight: 1.4 }}>{m.what}</p>
          <p style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: 4 }}>
            <strong style={{ color: '#F5C518' }}>Cálculo: </strong>{m.how}
          </p>
        </div>
      ))}
    </div>
  </BottomSheet>
);

export default MetricsInfoSheet;
