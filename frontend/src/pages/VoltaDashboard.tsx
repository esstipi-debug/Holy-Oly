import React, { useState } from 'react';
import { useNav } from '../context/NavigationContext';
import { useAthlete } from '../context/AthleteContext';
import WiseAssistant from '../components/WiseAssistant';
import QuestsSection, { type QuestProgress } from '../components/QuestsSection';
import BottomSheet from '../components/BottomSheet';
import { loadResults, overallProgress, personalizationTier } from '../data/baseline';

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

interface WellnessRowProps {
  icon: string;
  title: string;
  /** Valor principal grande (ej "52", "64", "88mg") */
  value: string;
  /** Descripción corta debajo del valor (ej "del baseline", "Score 0-100") */
  valueLabel?: string;
  /** Contexto · qué significa o cómo va vs ayer */
  context: string;
  pct: number;
  color: string;
  alert: 'critical' | 'warning' | 'info';
  label: string;
}

const WellnessRow: React.FC<WellnessRowProps> = ({ icon, title, value, valueLabel, context, pct, color, alert, label }) => (
  <div style={{
    marginBottom: 10,
    background: 'rgba(255,255,255,0.02)',
    border: `1px solid ${color}22`,
    borderRadius: 12,
    padding: '10px 12px',
  }}>
    {/* Top row: icon · title · valor · badge */}
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
      {/* Icono en círculo coloreado */}
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: `${color}1A`, border: `1px solid ${color}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, flexShrink: 0,
      }}>{icon}</div>

      {/* Title + valor grande · ocupa el centro */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: C.muted, letterSpacing: '.08em', textTransform: 'uppercase' }}>
            {title}
          </span>
          <span style={{ fontSize: 18, fontWeight: 900, color, lineHeight: 1, fontStyle: 'italic', fontVariantNumeric: 'tabular-nums' }}>
            {value}
          </span>
          {valueLabel && (
            <span style={{ fontSize: 10, color: C.muted, fontWeight: 600 }}>{valueLabel}</span>
          )}
        </div>
        <p style={{ fontSize: 11, color: C.text, opacity: 0.7, margin: '4px 0 0', lineHeight: 1.4 }}>
          {context}
        </p>
      </div>

      {/* Alert badge en columna derecha */}
      <div style={{ flexShrink: 0 }}>
        <AlertBadge kind={alert} small>{label}</AlertBadge>
      </div>
    </div>

    {/* Progress bar al final */}
    <div style={{ height: 4, borderRadius: 2, background: C.line, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, transition: 'width .8s ease' }} />
    </div>
  </div>
);

interface CFComponentInfo {
  title: string;
  what: string;
  how: string;
  zone: string;
  tip?: string;
}

const CF_INFOS: Record<string, CFComponentInfo> = {
  index: {
    title: 'CF Index',
    what: 'Score global 0-100 que sintetiza tu nivel CrossFit. Combina fuerza, capacidad metabólica, gimnasia, performance en benchmarks y adherencia.',
    how: 'CF Index = promedio ponderado de los 5 componentes: Strength 25% · Engine 25% · Gymnastics 20% · Benchmark 20% · Consistency 10%.',
    zone: '<40 Beginner · 40-60 Intermediate · 60-80 Rx · ≥80 Élite · ≥90 Competidor regional.',
    tip: 'Subir tu peor componente da más score que mejorar el mejor. Foco en el más bajo.',
  },
  Strength: {
    title: 'Strength',
    what: 'Capacidad de fuerza absoluta y relativa. Mide tus PRs en Back Squat, Deadlift, Press y Olympic lifts vs BW.',
    how: 'Strength = ((Squat + Deadlift + Press + Snatch + C&J) / BW) × 10. Normalizado 0-100.',
    zone: '<50 Foundation · 50-70 Intermediate · 70-85 Advanced · ≥85 Elite. Squat 2× BW = referencia élite.',
    tip: 'Si <60, considerá un CF Strength Cycle de 8-10 semanas (off-season).',
  },
  Engine: {
    title: 'Engine',
    what: 'Capacidad aeróbica y láctica. Tu motor para WODs largos: cuánto podés mantener intensidad sin fundirte.',
    how: 'Engine = combinación de Row 2k, Run 5k, AirBike 10min calories. Convertido a percentile vs población CF.',
    zone: '<40 Punto débil · 40-60 OK · 60-80 Buen motor · ≥80 Engine élite. Row 2k <7min = élite.',
    tip: 'Es lo que más impacto tiene en WODs >12min. Agregá 1-2 sesiones de capacidad por semana.',
  },
  Gymnastics: {
    title: 'Gymnastics',
    what: 'Dominio de movimientos de peso corporal: pull-ups, HSPU, muscle-ups, ring work, handstands.',
    how: 'Score basado en skills accomplished del SkillTree. Cada skill suma según tier (T1=2pts, T5=20pts).',
    zone: '<50 Foundation · 50-75 Atleta · 75-90 Avanzado · ≥90 Élite gimnástico (todos los muscle-ups).',
    tip: 'Las skills T4-T5 (BMU, RMU, Strict HSPU) son las que más score dan. Constancia 3-4 sesiones/sem.',
  },
  Benchmark: {
    title: 'Benchmark',
    what: 'Performance en los "Girls" y heroes WODs. Cuánto te separás del tiempo promedio en Fran, Helen, Murph, etc.',
    how: 'Tu tiempo vs percentile de la base de datos CrossFit Open. Promediado entre 6+ benchmarks completados.',
    zone: 'Fran <4min = élite. Murph <40min = élite. Score 50 = mediana. Score 80+ = top 20% mundial.',
    tip: 'Repetí los mismos benchmarks cada 8-12 semanas para medir progreso real.',
  },
  Consistency: {
    title: 'Consistency',
    what: 'Adherencia al programa. Cuántas sesiones programadas completaste en las últimas 4 semanas.',
    how: 'Consistency = (sesiones completadas / programadas) × 100. Castiga skip > 3 días consecutivos.',
    zone: '<60 Riesgo de salir del macro · 60-75 OK · 75-90 Bueno · ≥90 Consistencia élite.',
    tip: 'Es el factor que más correlaciona con resultados a largo plazo. Más importante que la intensidad puntual.',
  },
};


const VolumePromptCard: React.FC<{ onNavigate: () => void; athlete: any }> = ({ onNavigate, athlete }) => {
  const recent: number[] = athlete?.sessions_last_7?.map((s: any) => Math.round(s.load)) ?? [];
  const weekVolume = recent.reduce((a, b) => a + b, 0);
  // Aproximación semana anterior: si no hay data, asumir base
  const prevWeekVolume = Math.max(Math.round(weekVolume * 0.85), 8000);
  const deltaPct = prevWeekVolume > 0 ? Math.round(((weekVolume - prevWeekVolume) / prevWeekVolume) * 100) : 0;
  const wodsDone = recent.filter(v => v > 100).length;
  const alert = deltaPct < -15;
  return (
    <button
      onClick={onNavigate}
      className="btn-press"
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: 14, marginBottom: 14,
        background: alert
          ? 'linear-gradient(135deg, rgba(255,179,0,0.14) 0%, rgba(255,179,0,0.04) 100%)'
          : 'linear-gradient(135deg, rgba(0,229,255,0.12) 0%, rgba(0,229,255,0.03) 100%)',
        border: `1px solid ${alert ? 'rgba(255,179,0,0.40)' : 'rgba(0,229,255,0.30)'}`,
        borderRadius: 16, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
        color: C.text,
      }}
    >
      <div style={{
        width: 46, height: 46, borderRadius: 12,
        background: alert ? 'rgba(255,179,0,0.18)' : 'rgba(0,229,255,0.18)',
        border: `2px solid ${alert ? C.amber : C.cyan}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 900, color: alert ? C.amber : C.cyan, flexShrink: 0,
        flexDirection: 'column', lineHeight: 1,
      }}>
        <span style={{ fontSize: 14, fontStyle: 'italic' }}>{(weekVolume / 1000).toFixed(1)}</span>
        <span style={{ fontSize: 7, marginTop: 1, opacity: 0.7 }}>TON</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', color: alert ? C.amber : C.cyan, textTransform: 'uppercase', margin: 0 }}>
          {alert ? '⚠ VOLUMEN BAJO' : 'TUS NÚMEROS'}
        </p>
        <p style={{ fontSize: 13, fontWeight: 900, color: C.text, margin: '2px 0', letterSpacing: '-.01em' }}>
          {wodsDone} WODs · {(weekVolume / 1000).toFixed(1)}t esta semana
        </p>
        <p style={{ fontSize: 10, color: C.muted, margin: 0 }}>
          {alert
            ? `${Math.abs(deltaPct)}% por debajo de la semana pasada · tap para ver`
            : `${deltaPct >= 0 ? '▲' : '▼'} ${Math.abs(deltaPct)}% vs semana anterior · ver gráficos`}
        </p>
      </div>
      <span style={{ fontSize: 18, color: alert ? C.amber : C.cyan, flexShrink: 0 }}>›</span>
    </button>
  );
};

const BaselinePromptCard: React.FC<{ onNavigate: () => void }> = ({ onNavigate }) => {
  const results = loadResults();
  const { done, total, pct } = overallProgress(results);
  const tier = personalizationTier(pct);
  const isComplete = pct >= 100;
  return (
    <button
      onClick={onNavigate}
      className="btn-press"
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: 14, marginBottom: 14,
        background: 'linear-gradient(135deg, rgba(124,92,255,0.12) 0%, rgba(124,92,255,0.04) 100%)',
        border: '1px solid rgba(124,92,255,0.35)',
        borderRadius: 16, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
        color: C.text,
      }}
    >
      <div style={{
        width: 46, height: 46, borderRadius: '50%',
        background: 'rgba(124,92,255,0.18)', border: '2px solid #7C5CFF',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, fontWeight: 900, color: '#A88BFF', flexShrink: 0,
      }}>{pct}%</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', color: '#A88BFF', textTransform: 'uppercase', margin: 0 }}>
          {isComplete ? '✓ Plan Inteligente activo' : 'Tu Base · Comptrain'}
        </p>
        <p style={{ fontSize: 13, fontWeight: 900, color: C.text, margin: '2px 0', letterSpacing: '-.01em' }}>
          {isComplete ? 'Cargas 100% personalizadas' : `Completá tu base · ${done}/${total} tests`}
        </p>
        <p style={{ fontSize: 10, color: C.muted, margin: 0 }}>
          {isComplete ? 'Tap para retest o actualizar' : tier.perk}
        </p>
      </div>
      <span style={{ fontSize: 18, color: '#7C5CFF', flexShrink: 0 }}>›</span>
    </button>
  );
};

const VoltaDashboard: React.FC = () => {
  const { navigate } = useNav();
  const { athlete } = useAthlete();
  const [activeInfo, setActiveInfo] = useState<CFComponentInfo | null>(null);
  const userName = athlete?.name ?? 'Atleta';
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  // Día: 1=Lun..7=Dom; Semana: índice dentro de macrociclo de 4 semanas (week-of-year mod 4 + 1)
  const dia = ((now.getDay() + 6) % 7) + 1;
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000 / 7);
  const semana = (weekOfYear % 4) + 1;

  return (
    <div className="anim-fade-in" style={{ background: C.bg, minHeight: '100%', paddingBottom: 90, color: C.text }}>

      {/* HEADER */}
      <div className="anim-fade-up" style={{ padding: '12px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 12, color: C.muted }}>{greeting},</div>
          <div style={{ fontSize: 19, fontWeight: 900, color: C.text, letterSpacing: '-.02em' }}>{userName}</div>
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

        {/* BASELINE PROMPT · invita a completar tests */}
        <BaselinePromptCard onNavigate={() => navigate('BASELINE')} />

        {/* VOLUMEN PROMPT · función principal */}
        <VolumePromptCard onNavigate={() => navigate('VOLTA_STATS')} athlete={athlete} />

        {/* ESTADO ACTUAL */}
        <Sec style={{ marginBottom: 8 }}>Estado actual</Sec>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <button
            onClick={() => setActiveInfo(CF_INFOS.index)}
            className="btn-press"
            style={{
              flex: 1, padding: 14,
              background: C.surface,
              border: '1px solid rgba(0,229,255,0.2)',
              borderRadius: 18,
              boxShadow: '0 0 20px rgba(0,229,255,0.06)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Sec>CF Index</Sec>
              <span style={{
                width: 14, height: 14, borderRadius: '50%',
                background: 'rgba(0,229,255,0.12)', color: C.cyan,
                fontSize: 8, fontWeight: 900,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                marginLeft: 4,
              }}>ⓘ</span>
            </div>
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
          </button>
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
          <WellnessRow
            icon="💓" title="HRV" value="52" valueLabel="ms · -1.8σ"
            context="3 días bajo tu baseline. Sistema nervioso bajo carga: priorizá sueño."
            pct={28} color={C.red} alert="critical" label="🔴 CRÍTICO"
          />
          <WellnessRow
            icon="😴" title="Sueño" value="64" valueLabel="/100"
            context="Tercer día por debajo. Acumulás deuda de sueño · objetivo 8h hoy."
            pct={42} color={C.amber} alert="warning" label="⚠ CRÓNICO"
          />
          <WellnessRow
            icon="☕" title="Cafeína" value="88" valueLabel="mg residual"
            context="Última toma 200mg hace 2.5h. Curfew 19hs OK · no afecta sueño."
            pct={62} color={C.cyan} alert="info" label="ⓘ INFO"
          />
        </div>

        {/* QUESTS DE LA SEMANA */}
        <Sec style={{ marginTop: 12, marginBottom: 8 }}>Quests semanales</Sec>
        <div style={{ marginBottom: 16 }}>
          <QuestsSection
            product="volta"
            weekOfYear={Math.ceil(((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 86400000 + new Date(new Date().getFullYear(), 0, 1).getDay() + 1) / 7)}
            progress={{
              sessionsThisWeek: 3,
              rxThisWeek: 1,
              prsThisWeek: 0,
              tonelajeKg: 0,
              skippedThisWeek: 0,
              mobilityDays: 1,
              sleepDays: 4,
              hrvDays: 5,
              waterDays: 3,
              foamDays: 1,
              preCheckCount: 3,
              benchmarkDone: false,
              teamWodDone: false,
              skillPrDone: false,
            } satisfies QuestProgress}
          />
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

        {/* CF INDEX DESGLOSE · clickable */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Sec>CF Index — desglose</Sec>
          <span style={{ fontSize: 9, color: C.muted, fontWeight: 700 }}>👆 Tocá para info</span>
        </div>
        <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 18, padding: 14 }}>
          {[
            { name: 'Strength',   pct: 78, color: C.cyan },
            { name: 'Engine',     pct: 46, color: C.amber, warn: true },
            { name: 'Gymnastics', pct: 82, color: C.cyan },
            { name: 'Benchmark',  pct: 70, color: C.cyan },
            { name: 'Consistency',pct: 76, color: C.cyan, last: true },
          ].map((s) => (
            <button
              key={s.name}
              onClick={() => setActiveInfo(CF_INFOS[s.name])}
              className="btn-press"
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: s.last ? 0 : 8,
                background: 'transparent', border: 'none', padding: 0, fontFamily: 'inherit',
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 700, color: C.text, width: 110 }}>{s.name}</span>
              <div style={{ flex: 1, margin: '0 10px' }}>
                <div style={{ height: 4, borderRadius: 2, background: C.line, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${s.pct}%`, background: s.color, transition: 'width .8s ease' }} />
                </div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: s.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                {s.pct}{s.warn ? ' ⚠' : ''}
                <span style={{ fontSize: 9, color: C.muted }}>ⓘ</span>
              </span>
            </button>
          ))}
          <button
            onClick={() => setActiveInfo(CF_INFOS.Engine)}
            className="btn-press"
            style={{
              width: '100%', marginTop: 10, padding: '9px 11px',
              background: 'rgba(255,179,0,0.06)',
              border: '1px solid rgba(255,179,0,0.15)',
              borderRadius: 10, cursor: 'pointer',
              fontFamily: 'inherit', textAlign: 'left',
            }}
          >
            <div style={{ fontSize: 11, color: C.amber, fontWeight: 700 }}>💡 Engine es tu punto débil</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Agrega 1 WOD de capacidad larga por semana.</div>
          </button>
        </div>
      </div>

      {/* ─── BottomSheet: info de componente CF ─── */}
      <BottomSheet
        open={activeInfo !== null}
        onClose={() => setActiveInfo(null)}
        title={activeInfo?.title}
      >
        {activeInfo && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, color: C.text }}>
            <div>
              <p className="type-caption" style={{ color: C.cyan }}>¿Qué mide?</p>
              <p className="type-body" style={{ marginTop: 4 }}>{activeInfo.what}</p>
            </div>
            <div>
              <p className="type-caption" style={{ color: C.cyan }}>¿Cómo se calcula?</p>
              <p className="type-body" style={{ marginTop: 4 }}>{activeInfo.how}</p>
            </div>
            <div style={{
              background: C.surface, border: `1px solid ${C.line}`,
              borderRadius: 12, padding: '10px 14px',
            }}>
              <p className="type-caption" style={{ color: C.muted }}>Zonas de referencia</p>
              <p className="type-body" style={{ marginTop: 4 }}>{activeInfo.zone}</p>
            </div>
            {activeInfo.tip && (
              <div style={{
                background: 'rgba(0,229,255,0.06)',
                border: '1px solid rgba(0,229,255,0.18)',
                borderRadius: 12, padding: '10px 14px',
              }}>
                <p className="type-caption" style={{ color: C.cyan }}>💡 Tip</p>
                <p className="type-body" style={{ marginTop: 4 }}>{activeInfo.tip}</p>
              </div>
            )}
          </div>
        )}
      </BottomSheet>

      <WiseAssistant context="Volta Atleta · Dashboard" />
    </div>
  );
};

export default VoltaDashboard;
