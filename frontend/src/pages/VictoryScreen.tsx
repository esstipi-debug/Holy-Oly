import React from 'react';
import { useAthlete } from '../context/AthleteContext';

/**
 * VictoryScreen · HO sesión finalizada · informativa, NO viral.
 *
 * Diseño:
 *  - Cero botones (el atleta toma screenshot nativo del dispositivo)
 *  - Toda la data útil: volumen, IMR (%1RM medio), series, PRs, lista detallada
 *  - Contexto del mesociclo (semana X/Y + progresión)
 *  - Micro-pildora educativa al final (qué sistema cargó hoy)
 *
 * TODO post-MVP:
 *  - Reemplazar mock SESSION data con la sesión real que viene del state
 *    de ActiveSession
 */

const SESSION = {
  duration_min: 58,
  total_volume_kg: 4250,
  imr_percent: 78,
  series_done: 18,
  series_planned: 18,
  prs: 1,
  exercises: [
    { name: 'Snatch',        sets: 5, reps: 3, weight: 95,  pct_1rm: 85, volume: 1425, is_pr: true,  delta: '+3kg vs anterior' },
    { name: 'Clean & Jerk',  sets: 5, reps: 2, weight: 115, pct_1rm: 82, volume: 1150, is_pr: false },
    { name: 'Front Squat',   sets: 4, reps: 5, weight: 130, pct_1rm: 75, volume: 2600, is_pr: false },
    { name: 'Pull Snatch',   sets: 3, reps: 3, weight: 100, pct_1rm: 78, volume: 900,  is_pr: false },
  ],
};

const PEDAGOGY_BY_INTENSITY = (imr: number): { title: string; body: string } => {
  if (imr >= 85) return {
    title: 'Hoy trabajaste FUERZA MÁXIMA',
    body: 'A esta intensidad el sistema nervioso se estresa más que el músculo. Dormir 8h hoy es parte del entreno.',
  };
  if (imr >= 75) return {
    title: 'Hoy fue sesión de FUERZA',
    body: '5 series al 75-90% es trabajo serio. Mañana priorizá descanso entre series si tenés otra sesión pesada.',
  };
  if (imr >= 60) return {
    title: 'Hoy fue TÉCNICA-VELOCIDAD',
    body: 'Las sesiones <75% parecen fáciles pero graban el movimiento para cuando la carga pese de verdad.',
  };
  return {
    title: 'Hoy fue DESCARGA',
    body: 'Tu cuerpo no se fortalece mientras entrenás. Se fortalece mientras descansa. Esta semana es estratégica.',
  };
};

const VictoryScreen: React.FC = () => {
  const { athlete } = useAthlete();
  const macro = athlete?.macrocycle;
  const pedagogy = PEDAGOGY_BY_INTENSITY(SESSION.imr_percent);
  const compliance = Math.round((SESSION.series_done / SESSION.series_planned) * 100);
  const tons = (SESSION.total_volume_kg / 1000).toFixed(2);

  return (
    <div className="flex flex-col min-h-full bg-holy-bg text-holy-text overflow-y-auto" style={{ paddingBottom: 28 }}>

      {/* HERO TROPHY */}
      <div className="px-6 pt-10 pb-4 flex flex-col items-center text-center relative">
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-holy-gold/15 via-holy-gold/5 to-transparent pointer-events-none" />

        <div className="relative mb-4 z-10">
          <div className="absolute inset-0 bg-holy-gold/30 blur-3xl rounded-full" />
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-holy-gold to-amber-700 flex items-center justify-center text-4xl shadow-2xl shadow-holy-gold/50 relative border border-white/20">
            🏆
          </div>
          {SESSION.prs > 0 && (
            <div className="absolute -bottom-2 -right-2 bg-green-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-holy-bg shadow-xl">
              {SESSION.prs} PR
            </div>
          )}
        </div>

        <p className="text-[10px] font-black tracking-[0.3em] text-holy-gold uppercase">HOLY OLY · SMART TRAINING</p>
        <h1 className="text-2xl font-black italic tracking-tighter uppercase mt-1">Sesión completada</h1>
        {macro && (
          <p className="text-[11px] font-bold text-holy-text-secondary mt-2 tracking-wide">
            {macro.program_name} · Semana {macro.week}/{macro.total_weeks} · {macro.focus}
          </p>
        )}
        <p className="text-[10px] text-holy-text-secondary mt-1">
          {SESSION.duration_min} min · {new Date().toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
      </div>

      {/* HERO STATS · 4 boxes */}
      <div className="px-4 grid grid-cols-2 gap-3 mb-3">
        <StatBox
          label="Volumen total"
          value={tons}
          unit="t"
          sub={`${SESSION.total_volume_kg.toLocaleString('es')} kg movidos`}
          accent="#F5C518"
        />
        <StatBox
          label="Intensidad media"
          value={String(SESSION.imr_percent)}
          unit="% 1RM"
          sub={SESSION.imr_percent >= 85 ? 'Zona FUERZA MÁX' : SESSION.imr_percent >= 75 ? 'Zona FUERZA' : 'Zona TÉCNICA'}
          accent={SESSION.imr_percent >= 85 ? '#FF3D00' : SESSION.imr_percent >= 75 ? '#FFB300' : '#22C55E'}
        />
        <StatBox
          label="Series completadas"
          value={`${SESSION.series_done}/${SESSION.series_planned}`}
          unit=""
          sub={`${compliance}% del plan`}
          accent="#56CCF2"
        />
        <StatBox
          label="PRs hoy"
          value={String(SESSION.prs)}
          unit=""
          sub={SESSION.prs > 0 ? 'Logrado · ver detalle abajo' : 'No esta vez'}
          accent={SESSION.prs > 0 ? '#22C55E' : '#52527A'}
        />
      </div>

      {/* LISTA DE EJERCICIOS */}
      <div className="px-4 mb-3">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-holy-text-secondary mb-2 px-1">
          Detalle de la sesión
        </p>
        <div className="bg-[#0F0F1C] border border-[#1E1E32] rounded-2xl overflow-hidden">
          {SESSION.exercises.map((ex, i) => (
            <div
              key={ex.name}
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderTop: i === 0 ? 'none' : '1px solid #1E1E32' }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black tracking-tight">{ex.name}</span>
                  {ex.is_pr && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-green-500/20 text-green-400 border border-green-500/40 uppercase tracking-wider">
                      PR
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-holy-text-secondary mt-0.5">
                  {ex.sets} × {ex.reps} @ {ex.weight}kg · {ex.pct_1rm}% 1RM
                </p>
                {ex.is_pr && ex.delta && (
                  <p className="text-[10px] text-green-400 font-bold mt-0.5">▲ {ex.delta}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-holy-gold italic">{ex.volume.toLocaleString('es')}<span className="text-[10px] text-holy-text-secondary ml-0.5 not-italic">kg</span></p>
                <p className="text-[9px] text-holy-text-secondary uppercase tracking-wider">volumen</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MESOCICLO context */}
      {macro && (
        <div className="px-4 mb-3">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-holy-text-secondary mb-2 px-1">
            Tu mesociclo
          </p>
          <div className="bg-[#0F0F1C] border border-[#1E1E32] rounded-2xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-black">{macro.program_name}</span>
              <span className="text-[10px] font-bold text-holy-gold">
                Semana {macro.week} / {macro.total_weeks}
              </span>
            </div>
            <div className="h-1.5 w-full bg-[#1E1E32] rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-holy-gold to-amber-500"
                style={{ width: `${Math.round((macro.week / macro.total_weeks) * 100)}%`, transition: 'width 1s ease' }}
              />
            </div>
            <p className="text-[10px] text-holy-text-secondary leading-relaxed">
              Pico planificado en semana 10 · quedan {Math.max(0, 10 - macro.week)} semanas de carga ascendente
            </p>
            <div className="mt-3 pt-3 border-t border-[#1E1E32] flex justify-between text-[11px]">
              <span className="text-holy-text-secondary">Snatch progresión</span>
              <span className="font-black text-holy-text">95 → 102 → 108 → <span className="text-holy-gold">110</span> kg</span>
            </div>
          </div>
        </div>
      )}

      {/* PEDAGOGÍA · qué cargó hoy */}
      <div className="px-4 mb-3">
        <div className="bg-gradient-to-br from-holy-primary/15 to-holy-primary/5 border border-holy-primary/30 rounded-2xl p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-holy-primary mb-2">
            Aprendizaje del día
          </p>
          <p className="text-[14px] font-black tracking-tight mb-1">
            {pedagogy.title}
          </p>
          <p className="text-[12px] text-holy-text-secondary leading-relaxed">
            {pedagogy.body}
          </p>
        </div>
      </div>

      {/* Brand footer */}
      <p className="text-center text-[9px] font-black italic tracking-tighter text-holy-text-secondary mt-2 px-6">
        holyoly.app · SMART TRAINING · ZERO BURNOUT
      </p>
    </div>
  );
};

const StatBox: React.FC<{ label: string; value: string; unit: string; sub: string; accent: string }> = ({ label, value, unit, sub, accent }) => (
  <div
    className="rounded-2xl p-4"
    style={{
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${accent}33`,
    }}
  >
    <p className="text-[9px] font-black uppercase tracking-[0.1em] text-holy-text-secondary">{label}</p>
    <div className="flex items-baseline gap-1 mt-1">
      <span className="text-2xl font-black italic tracking-tighter" style={{ color: accent }}>{value}</span>
      {unit && <span className="text-[11px] font-bold text-holy-text-secondary">{unit}</span>}
    </div>
    <p className="text-[9px] text-holy-text-secondary mt-1 leading-tight">{sub}</p>
  </div>
);

export default VictoryScreen;
