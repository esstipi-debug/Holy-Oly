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
  cyanDim: '#00B8CC',
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

const AlertBadge: React.FC<{ kind: 'critical' | 'warning' | 'info'; children: React.ReactNode; small?: boolean }> = ({ kind, children, small }) => {
  const styles = {
    critical: { bg: 'rgba(255,61,0,0.12)', fg: C.red, border: 'rgba(255,61,0,0.25)' },
    warning:  { bg: 'rgba(255,179,0,0.12)', fg: C.amber, border: 'rgba(255,179,0,0.25)' },
    info:     { bg: 'rgba(0,229,255,0.08)', fg: C.cyan, border: 'rgba(0,229,255,0.2)' },
  }[kind];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: small ? '3px 8px' : '5px 10px',
      borderRadius: 20,
      fontSize: small ? 10 : 11,
      fontWeight: 700,
      background: styles.bg, color: styles.fg,
      border: `1px solid ${styles.border}`,
      whiteSpace: 'nowrap',
    }}>{children}</span>
  );
};

const WellnessRow: React.FC<{ icon: string; title: string; sub: string; pct: number; color: string; alert: 'critical' | 'warning' | 'info'; label: string }> = ({ icon, title, sub, pct, color, alert, label }) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{title}</div>
          <div style={{ fontSize: 10, color: C.muted }}>{sub}</div>
        </div>
      </div>
      <AlertBadge kind={alert} small>{label}</AlertBadge>
    </div>
    <div style={{ height: 4, borderRadius: 2, background: C.line, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, transition: 'width .8s ease' }} />
    </div>
  </div>
);

const VoltaDashboard: React.FC = () => {
  const { navigate } = useNav();
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  // Día: 1=Lun..7=Dom; Semana: índice dentro de macrociclo de 4 semanas (week-of-year mod 4 + 1)
  const dia = ((now.getDay() + 6) % 7) + 1;
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000 / 7);
  const semana = (weekOfYear % 4) + 1;

  return (
    <div style={{ background: C.bg, minHeight: '100%', paddingBottom: 90, color: C.text }}>

      {/* HEADER */}
      <div style={{ padding: '12px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 12, color: C.muted }}>{greeting},</div>
          <div style={{ fontSize: 19, fontWeight: 900, color: C.text, letterSpacing: '-.02em' }}>Marco Torres</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12,
            background: 'rgba(0,229,255,0.1)', color: C.cyan, border: '1px solid rgba(0,229,255,0.2)',
          }}>Rx</div>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg,#00E5FF,#0070FF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, fontWeight: 900, color: '#07070F',
          }}>M</div>
        </div>
      </div>

      {/* ALERT STRIP */}
      <div className="scroll-x-no-bar" style={{
        display: 'flex', gap: 6, alignItems: 'center',
        padding: '8px 16px',
        background: 'rgba(0,229,255,0.03)',
        borderBottom: `1px solid ${C.line}`,
        overflowX: 'auto',
      }}>
        <AlertBadge kind="critical">🔴 HRV bajo</AlertBadge>
        <AlertBadge kind="warning">⚠ Sueño crónico</AlertBadge>
        <AlertBadge kind="info">ⓘ Cafeína activa</AlertBadge>
      </div>

      <div style={{ padding: '14px 16px 80px' }}>

        {/* ESTADO ACTUAL */}
        <Sec style={{ marginBottom: 8 }}>Estado actual</Sec>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <div style={{
            flex: 1, padding: 14,
            background: C.surface,
            border: '1px solid rgba(0,229,255,0.2)',
            borderRadius: 18,
            boxShadow: '0 0 20px rgba(0,229,255,0.06)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          }}>
            <Sec>CF Index</Sec>
            <div style={{
              width: 96, height: 96, borderRadius: '50%',
              border: `5px solid ${C.cyan}`,
              background: 'radial-gradient(circle at 50% 50%, rgba(0,229,255,0.08), transparent)',
              boxShadow: '0 0 28px rgba(0,229,255,0.3), inset 0 0 12px rgba(0,229,255,0.06)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 30, fontWeight: 900, color: C.cyan, lineHeight: 1 }}>72</span>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.06em', color: C.cyanDim }}>RX · H</span>
            </div>
            <div style={{ fontSize: 10, color: C.muted }}>↑ +1 esta semana</div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 18, padding: 13 }}>
              <Sec style={{ marginBottom: 6 }}>V-Form</Sec>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                background: 'rgba(255,179,0,0.12)', color: C.amber,
                border: '1px solid rgba(255,179,0,0.25)',
              }}>🟡 AMARILLO</div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 5 }}>Fatiga acumulada — entrena con criterio</div>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 18, padding: 13 }}>
              <Sec style={{ marginBottom: 4 }}>Racha</Sec>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 20 }}>🔥</span>
                <span style={{ fontSize: 22, fontWeight: 900, color: '#f97316', lineHeight: 1 }}>11</span>
                <span style={{ fontSize: 10, color: '#78350f', fontWeight: 700 }}>DÍAS</span>
              </div>
            </div>
          </div>
        </div>

        {/* WELLNESS HOY */}
        <Sec style={{ marginBottom: 8 }}>Wellness hoy</Sec>
        <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 18, padding: 14, marginBottom: 14 }}>
          <WellnessRow icon="💓" title="HRV" sub="-1.8σ del baseline" pct={28} color={C.red} alert="critical" label="🔴 CRÍTICO" />
          <WellnessRow icon="😴" title="Sueño" sub="Score 64 · 3° día bajo" pct={42} color={C.amber} alert="warning" label="⚠ CRÓNICO" />
          <WellnessRow icon="☕" title="Cafeína" sub="C_residual 88mg · curfew OK" pct={62} color={C.cyan} alert="info" label="ⓘ INFO" />
        </div>

        {/* WISE SCORE */}
        <Sec style={{ marginBottom: 8 }}>Wise Score — entrenás con criterio</Sec>
        <div style={{
          background: 'rgba(0,230,118,0.03)',
          border: '1px solid rgba(0,230,118,0.2)',
          borderRadius: 18, padding: 14, marginBottom: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              border: `4px solid ${C.green}`,
              background: 'radial-gradient(circle, rgba(0,230,118,0.1), transparent)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, boxShadow: '0 0 18px rgba(0,230,118,0.2)',
            }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: C.green, lineHeight: 1 }}>84</span>
              <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(0,230,118,0.6)', letterSpacing: '.04em' }}>WISE</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.green, marginBottom: 4 }}>Smart trainer ✓</div>
              <div style={{ fontSize: 10, color: C.muted, lineHeight: 1.5 }}>
                Puntos por seguir las recomendaciones del sistema y no sobre-entrenarte.
              </div>
            </div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 6 }}>
            {[
              { day: 'Ayer',     val: '+30', sub: 'Carga 80%', color: C.green, border: 'rgba(0,230,118,0.15)' },
              { day: 'Hace 2d',  val: '+50', sub: 'Rest day ✓', color: C.green, border: 'rgba(0,230,118,0.15)' },
              { day: 'Hace 3d',  val: '−20', sub: 'Override ⚠', color: C.red,   border: 'rgba(255,61,0,0.15)' },
            ].map((d) => (
              <div key={d.day} style={{
                flex: 1, background: C.surface2,
                border: `1px solid ${d.border}`, borderRadius: 10,
                padding: 8, textAlign: 'center',
              }}>
                <div style={{ fontSize: 9, color: C.muted, marginBottom: 3 }}>{d.day}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: d.color }}>{d.val}</div>
                <div style={{ fontSize: 8, color: C.muted }}>{d.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* WOD DE HOY */}
        <Sec style={{ marginBottom: 8 }}>WOD de hoy · Semana {semana} · Día {dia}</Sec>
        <div style={{
          background: C.surface,
          border: '1px solid rgba(0,229,255,0.2)',
          borderRadius: 18, overflow: 'hidden',
          marginBottom: 14,
          boxShadow: '0 0 20px rgba(0,229,255,0.06)',
        }}>
          <div style={{
            padding: '13px 14px',
            background: 'linear-gradient(135deg, rgba(0,229,255,0.06), transparent)',
            borderBottom: `1px solid ${C.line}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>AMRAP 20min</div>
              <div style={{ fontSize: 11, color: C.cyan, marginTop: 2 }}>5 C&amp;J · 10 Pull-ups · 15 Box jumps</div>
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 8px', borderRadius: 8, fontSize: 10, fontWeight: 700,
              background: 'rgba(255,179,0,0.12)', color: C.amber,
              border: '1px solid rgba(255,179,0,0.25)',
            }}>⚠ MODIFICADO</div>
          </div>
          <div style={{ padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>Ajustes automáticos por HRV bajo:</div>
            <div style={{ fontSize: 11, color: C.text }}>• C&amp;J: 100% → <span style={{ color: C.amber, fontWeight: 700 }}>80% 1RM</span></div>
            <div style={{ fontSize: 11, color: C.text, marginTop: 4 }}>• Volumen total: <span style={{ color: C.amber, fontWeight: 700 }}>-15%</span> accesorios</div>
          </div>
          <div style={{ padding: '12px 14px', borderTop: `1px solid ${C.line}`, display: 'flex', gap: 8 }}>
            <button
              onClick={() => navigate('VOLTA_PREWOD')}
              style={{
                flex: 1, padding: 10, background: C.cyan, color: '#07070F',
                border: 'none', borderRadius: 12,
                fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Iniciar WOD
            </button>
            <button
              onClick={() => navigate('VOLTA_PREWOD')}
              style={{
                padding: '10px 14px', background: C.surface2, color: C.muted,
                border: `1px solid ${C.line}`, borderRadius: 12,
                fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Ver detalle
            </button>
          </div>
        </div>

        {/* CF INDEX DESGLOSE */}
        <Sec style={{ marginBottom: 8 }}>CF Index — desglose</Sec>
        <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 18, padding: 14 }}>
          {[
            { name: 'Strength',   pct: 78, color: C.cyan },
            { name: 'Engine',     pct: 46, color: C.amber, warn: true },
            { name: 'Gymnastics', pct: 82, color: C.cyan },
            { name: 'Benchmark',  pct: 70, color: C.cyan },
            { name: 'Consistency',pct: 76, color: C.cyan, last: true },
          ].map((s) => (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: s.last ? 0 : 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.text, width: 110 }}>{s.name}</span>
              <div style={{ flex: 1, margin: '0 10px' }}>
                <div style={{ height: 4, borderRadius: 2, background: C.line, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${s.pct}%`, background: s.color }} />
                </div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.pct}{s.warn ? ' ⚠' : ''}</span>
            </div>
          ))}
          <div style={{
            marginTop: 10, padding: '9px 11px',
            background: 'rgba(255,179,0,0.06)',
            border: '1px solid rgba(255,179,0,0.15)',
            borderRadius: 10,
          }}>
            <div style={{ fontSize: 11, color: C.amber, fontWeight: 700 }}>💡 Engine es tu punto débil</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Agrega 1 WOD de capacidad larga por semana.</div>
          </div>
        </div>
      </div>

      <WiseAssistant context="Volta Atleta · Dashboard" />
    </div>
  );
};

export default VoltaDashboard;
