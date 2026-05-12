import React from 'react';
import { useNav } from '../context/NavigationContext';
import WiseAssistant from '../components/WiseAssistant';

const C = {
  bg: '#07070F',
  surface: '#0F0F1C',
  surface2: '#161626',
  line: '#1E1E32',
  text: '#EAEAF5',
  muted: '#52527A',
  cyan: '#00E5FF',
  amber: '#FFB300',
  red: '#FF3D00',
  green: '#00E676',
};

const Sec: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <p style={{
    fontSize: 10, fontWeight: 700, letterSpacing: '.08em',
    textTransform: 'uppercase', color: C.muted,
    ...style,
  }}>{children}</p>
);

const Emoji: React.FC<{ children: React.ReactNode; active?: boolean; tint?: 'red' | 'amber' | 'cyan' }> = ({ children, active, tint = 'cyan' }) => {
  const bg = active
    ? (tint === 'amber' ? 'rgba(255,179,0,0.15)' : tint === 'red' ? 'rgba(255,61,0,0.15)' : 'rgba(0,229,255,0.15)')
    : 'rgba(0,229,255,0.05)';
  const border = active
    ? (tint === 'amber' ? C.amber : tint === 'red' ? C.red : C.cyan)
    : C.line;
  return (
    <button style={{
      width: 36, height: 36, borderRadius: 10,
      background: bg, border: `${active ? 2 : 1}px solid ${border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 18, cursor: 'pointer', fontFamily: 'inherit', padding: 0,
    }}>{children}</button>
  );
};

const VoltaPreWod: React.FC = () => {
  const { navigate } = useNav();

  // Cafeína: simulamos toma hace ~2.5h. Decaimiento exp con t1/2 = 5h.
  const intakeMg = 200;
  const intake = new Date(Date.now() - 2.5 * 3600 * 1000);
  const hrs = intake.getHours();
  const mins = intake.getMinutes();
  const h12 = ((hrs + 11) % 12) + 1;
  const ampm = hrs < 12 ? 'am' : 'pm';
  const intakeLabel = `${h12}:${mins.toString().padStart(2, '0')}${ampm}`;
  const residualMg = Math.round(intakeMg * Math.pow(0.5, 2.5 / 5));

  return (
    <div style={{ background: C.bg, minHeight: '100%', paddingBottom: 90, color: C.text }}>

      {/* HEADER */}
      <div style={{ padding: '48px 16px 12px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: `1px solid ${C.line}` }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 900, color: C.text }}>Check pre-WOD</div>
          <div style={{ fontSize: 11, color: C.muted }}>AMRAP 20min · Hoy</div>
        </div>
      </div>

      <div style={{ padding: '14px 16px 80px' }}>

        {/* ESTADO AHORA */}
        <Sec style={{ marginBottom: 8 }}>Tu estado ahora mismo</Sec>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[
            { label: 'HRV',    value: '52',  sub: '-1.8σ',         color: C.red,   badge: '⚠ CRIT', kind: 'critical' as const },
            { label: 'Sueño',  value: '64',  sub: '3 días bajo',   color: C.amber, badge: '⚠ WARN', kind: 'warning' as const },
            { label: 'V-Form', value: '+3',  sub: 'Amarillo',      color: C.amber, badge: '🟡',     kind: 'warning' as const },
          ].map((m) => (
            <div key={m.label} style={{
              flex: 1, background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14,
              padding: 12, textAlign: 'center',
            }}>
              <Sec style={{ marginBottom: 6 }}>{m.label}</Sec>
              <div style={{ fontSize: 22, fontWeight: 900, color: m.color, lineHeight: 1 }}>{m.value}</div>
              <div style={{ fontSize: 9, color: C.muted, marginTop: 3 }}>{m.sub}</div>
              <div style={{ marginTop: 6 }}>
                <span style={{
                  display: 'inline-flex', fontSize: 9, padding: '2px 6px', borderRadius: 12, fontWeight: 700,
                  background: m.kind === 'critical' ? 'rgba(255,61,0,0.12)' : 'rgba(255,179,0,0.12)',
                  color: m.kind === 'critical' ? C.red : C.amber,
                  border: `1px solid ${m.kind === 'critical' ? 'rgba(255,61,0,0.25)' : 'rgba(255,179,0,0.25)'}`,
                }}>{m.badge}</span>
              </div>
            </div>
          ))}
        </div>

        {/* HRV ALERT BLOCK */}
        <div style={{
          background: 'rgba(255,61,0,0.06)',
          border: '1px solid rgba(255,61,0,0.2)',
          borderRadius: 14, padding: 14, marginBottom: 16,
        }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.red, marginBottom: 6 }}>
            🔴 HRV bajo — intensidad limitada
          </div>
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
            Tu sistema nervioso no está recuperado. El WOD se ajustó automáticamente a 80% de intensidad.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 10 }}>
            <div style={{ fontSize: 11, color: C.text }}>• C&amp;J: reducido a <span style={{ color: C.amber, fontWeight: 700 }}>80% 1RM</span></div>
            <div style={{ fontSize: 11, color: C.text }}>• Volumen accesorio: <span style={{ color: C.amber, fontWeight: 700 }}>-15%</span></div>
            <div style={{ fontSize: 11, color: C.text }}>• Movilidad extra: <span style={{ color: C.cyan, fontWeight: 700 }}>+5 min</span></div>
          </div>
        </div>

        {/* MOOD */}
        <Sec style={{ marginBottom: 8 }}>¿Cómo te sentís hoy?</Sec>
        <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: C.text }}>Energía</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <Emoji tint="red">😩</Emoji>
              <Emoji tint="amber" active>😐</Emoji>
              <Emoji>💪</Emoji>
              <Emoji>🔥</Emoji>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 12, color: C.text }}>Musculatura</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <Emoji tint="red">🤕</Emoji>
              <Emoji tint="amber">😬</Emoji>
              <Emoji active>👌</Emoji>
              <Emoji>🦾</Emoji>
            </div>
          </div>
        </div>

        {/* CAFEÍNA */}
        <Sec style={{ marginBottom: 8 }}>Cafeína hoy</Sec>
        <div style={{
          background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14,
          padding: '12px 14px', marginBottom: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>☕</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{intakeMg}mg — {intakeLabel}</div>
              <div style={{ fontSize: 10, color: C.muted }}>C_residual actual: {residualMg}mg</div>
            </div>
          </div>
          <button style={{
            fontSize: 10, fontWeight: 700, color: C.cyan,
            background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          }}>+ Agregar</button>
        </div>

        {/* WISE SCORE INCENTIVO */}
        <div style={{
          background: 'rgba(0,230,118,0.04)',
          border: '1px solid rgba(0,230,118,0.18)',
          borderRadius: 14, padding: '12px 14px', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            border: `2.5px solid ${C.green}`,
            background: 'radial-gradient(circle, rgba(0,230,118,0.1), transparent)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 14, fontWeight: 900, color: C.green, lineHeight: 1 }}>84</span>
            <span style={{ fontSize: 7, fontWeight: 700, color: 'rgba(0,230,118,0.5)' }}>WISE</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.green }}>
              Seguí el WOD modificado → <span style={{ fontSize: 13 }}>+30 pts</span>
            </div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
              Tomá descanso activo → +50 pts · Override → 0 pts
            </div>
          </div>
        </div>

        {/* CTAS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={() => navigate('VOLTA_HOME')}
            style={{
              padding: 14, background: C.cyan, color: '#07070F',
              border: 'none', borderRadius: 14,
              fontSize: 14, fontWeight: 900, cursor: 'pointer', width: '100%', fontFamily: 'inherit',
            }}
          >⚡ Iniciar WOD (modificado) +30 Wise</button>
          <button
            onClick={() => navigate('VOLTA_HOME')}
            style={{
              padding: 12, background: C.surface2, color: C.text,
              border: `1px solid ${C.line}`, borderRadius: 14,
              fontSize: 13, fontWeight: 700, cursor: 'pointer', width: '100%', fontFamily: 'inherit',
            }}
          >😴 Cambiar a movilidad / descanso +50 Wise</button>
          <button
            onClick={() => navigate('VOLTA_HOME')}
            style={{
              padding: 12, background: 'transparent', color: C.muted,
              border: `1px solid ${C.line}`, borderRadius: 14,
              fontSize: 12, fontWeight: 600, cursor: 'pointer', width: '100%', fontFamily: 'inherit',
            }}
          >Ver WOD sin cambios · sin pts Wise</button>
        </div>
      </div>

      <WiseAssistant context="Volta Atleta · Pre-WOD" />
    </div>
  );
};

export default VoltaPreWod;
