import React from 'react';
import { useNav } from '../context/NavigationContext';

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

const ROSTER = [
  { id: 'm1', name: 'Marco Torres',   initials: 'MT', cf: 72, vform: 'amber',  hrv: 'red',    wod: 'AMRAP 20', last: 'Hoy' },
  { id: 'm2', name: 'Lucía Ramos',    initials: 'LR', cf: 81, vform: 'green',  hrv: 'green',  wod: 'Fran',     last: 'Hoy' },
  { id: 'm3', name: 'Diego Suárez',   initials: 'DS', cf: 64, vform: 'amber',  hrv: 'amber',  wod: 'Helen',    last: 'Ayer' },
  { id: 'm4', name: 'Camila Vega',    initials: 'CV', cf: 89, vform: 'green',  hrv: 'green',  wod: 'Karen',    last: 'Hoy' },
  { id: 'm5', name: 'Pablo Iglesias', initials: 'PI', cf: 58, vform: 'red',    hrv: 'red',    wod: 'Rest',     last: 'Descanso' },
  { id: 'm6', name: 'Sofía Méndez',   initials: 'SM', cf: 76, vform: 'green',  hrv: 'amber',  wod: 'Grace',    last: 'Hace 2d' },
];

const colorMap = { red: C.red, amber: C.amber, green: C.green };

const VoltaCoachDash: React.FC = () => {
  const { navigate } = useNav();

  const critical = ROSTER.filter((a) => a.hrv === 'red').length;
  const warning  = ROSTER.filter((a) => a.hrv === 'amber').length;
  const ok       = ROSTER.filter((a) => a.hrv === 'green').length;

  return (
    <div style={{ background: C.bg, minHeight: '100%', paddingBottom: 90, color: C.text }}>

      {/* HEADER */}
      <div style={{ padding: '12px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 12, color: C.muted }}>Coach</div>
          <div style={{ fontSize: 19, fontWeight: 900, color: C.text, letterSpacing: '-.02em' }}>Box Roster</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 12,
            background: 'rgba(0,229,255,0.1)', color: C.cyan, border: '1px solid rgba(0,229,255,0.2)',
          }}>{ROSTER.length} atletas</div>
        </div>
      </div>

      {/* TRIAGE STRIP */}
      <div style={{
        display: 'flex', gap: 8, padding: '8px 16px 14px',
        borderBottom: `1px solid ${C.line}`,
        background: 'rgba(0,229,255,0.03)',
      }}>
        <div style={{
          flex: 1, padding: 10, borderRadius: 12,
          background: 'rgba(255,61,0,0.08)', border: '1px solid rgba(255,61,0,0.25)',
        }}>
          <div style={{ fontSize: 9, color: C.red, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase' }}>Crítico</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: C.red, lineHeight: 1.2 }}>{critical}</div>
          <div style={{ fontSize: 9, color: C.muted }}>HRV bajo</div>
        </div>
        <div style={{
          flex: 1, padding: 10, borderRadius: 12,
          background: 'rgba(255,179,0,0.06)', border: '1px solid rgba(255,179,0,0.25)',
        }}>
          <div style={{ fontSize: 9, color: C.amber, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase' }}>Watch</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: C.amber, lineHeight: 1.2 }}>{warning}</div>
          <div style={{ fontSize: 9, color: C.muted }}>Fatiga</div>
        </div>
        <div style={{
          flex: 1, padding: 10, borderRadius: 12,
          background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.25)',
        }}>
          <div style={{ fontSize: 9, color: C.green, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase' }}>OK</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: C.green, lineHeight: 1.2 }}>{ok}</div>
          <div style={{ fontSize: 9, color: C.muted }}>Listos</div>
        </div>
      </div>

      <div style={{ padding: '14px 16px' }}>

        {/* ALERTAS */}
        <Sec style={{ marginBottom: 8 }}>Alertas activas</Sec>
        {ROSTER.filter((a) => a.hrv === 'red').map((a) => (
          <div
            key={a.id}
            onClick={() => navigate('ATHLETE_DETAIL')}
            style={{
              background: 'rgba(255,61,0,0.05)',
              border: '1px solid rgba(255,61,0,0.22)',
              borderRadius: 14, padding: 12, marginBottom: 8,
              display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
            }}
          >
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'linear-gradient(135deg,#FF3D00,#7f1d1d)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 900, color: '#fff',
            }}>{a.initials}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{a.name}</div>
              <div style={{ fontSize: 10, color: C.red, fontWeight: 700, marginTop: 2 }}>🔴 HRV bajo · Sugerí descanso activo</div>
            </div>
            <span style={{ fontSize: 16, color: C.cyan }}>›</span>
          </div>
        ))}

        {/* ROSTER */}
        <Sec style={{ marginBottom: 8, marginTop: 18 }}>Roster del Box</Sec>
        <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 16, overflow: 'hidden' }}>
          {ROSTER.map((a, i) => (
            <div
              key={a.id}
              onClick={() => navigate('ATHLETE_DETAIL')}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px',
                borderBottom: i < ROSTER.length - 1 ? `1px solid ${C.line}` : 'none',
                cursor: 'pointer',
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg,#00E5FF,#0070FF)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 900, color: '#07070F',
              }}>{a.initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {a.name}
                </div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>
                  CF <span style={{ color: C.cyan, fontWeight: 700 }}>{a.cf}</span> · {a.wod} · {a.last}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <span title="V-Form" style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: colorMap[a.vform as keyof typeof colorMap],
                }} />
                <span title="HRV" style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: colorMap[a.hrv as keyof typeof colorMap],
                }} />
              </div>
              <span style={{ fontSize: 16, color: C.muted }}>›</span>
            </div>
          ))}
        </div>

        {/* ACTIONS */}
        <Sec style={{ marginBottom: 8, marginTop: 18 }}>Acciones rápidas</Sec>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => navigate('ASSIGN_MACRO')}
            style={{
              flex: 1, padding: '12px 8px',
              background: 'rgba(0,229,255,0.08)',
              border: '1px solid rgba(0,229,255,0.25)',
              borderRadius: 12, color: C.cyan,
              fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >📋 Asignar WOD</button>
          <button
            onClick={() => navigate('VOLTA_PREWOD')}
            style={{
              flex: 1, padding: '12px 8px',
              background: 'rgba(0,229,255,0.08)',
              border: '1px solid rgba(0,229,255,0.25)',
              borderRadius: 12, color: C.cyan,
              fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >⚡ Ver WOD hoy</button>
          <button
            onClick={() => navigate('ATHLETE_DETAIL')}
            style={{
              flex: 1, padding: '12px 8px',
              background: 'rgba(0,229,255,0.08)',
              border: '1px solid rgba(0,229,255,0.25)',
              borderRadius: 12, color: C.cyan,
              fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >+ Atleta</button>
        </div>
      </div>
    </div>
  );
};

export default VoltaCoachDash;
