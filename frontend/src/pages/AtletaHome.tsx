import React from 'react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { useAthlete } from '../context/AthleteContext';
import { athletes } from '../data/athletes';

const readinessColor = (r: number) => {
  if (r >= 7) return 'text-green-400';
  if (r >= 5) return 'text-yellow-400';
  return 'text-red-400';
};

const AtletaHome: React.FC = () => {
  const { athlete, stress, stressLoading } = useAthlete();

  if (!athlete) return null;

  const { macrocycle, maxes, injuries } = athlete;
  const readiness = stress ? Math.round(stress.readiness * 10) / 10 : null;
  const fatigueLabel = stress
    ? stress.readiness_category === 'High' ? 'Baja' : stress.readiness_category === 'Moderate' ? 'Media' : 'Alta'
    : '—';
  const fatigueColor = stress
    ? stress.readiness_category === 'High' ? 'text-green-500' : stress.readiness_category === 'Moderate' ? 'text-yellow-500' : 'text-red-500'
    : 'text-slate-600';

  // Club activity: otros atletas del mismo club
  const clubMates = athletes
    .filter(a => a.coach_id === athlete.coach_id && a.id !== athlete.id)
    .slice(0, 3);

  // Último PR o sesión destacada de cada compañero
  const clubActivity = clubMates.map(a => {
    const lastSession = a.sessions_last_7.filter(s => s.completed).at(-1);
    return {
      name: a.name.split(' ')[0] + ' ' + a.name.split(' ')[1]?.[0] + '.',
      weight_class: a.weight_class,
      load: lastSession?.load ?? 0,
      maxSnatch: a.maxes.snatch,
    };
  });

  const firstName = athlete.name.split(' ')[0];

  return (
    <div className="px-6 py-4 space-y-8">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-white text-2xl font-black">Hola, {firstName}</h2>
          <p className="text-slate-500 text-xs font-bold uppercase mt-0.5">
            Semana {macrocycle.week} · Día {macrocycle.day} · {macrocycle.focus}
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-holy-gold/20 flex items-center justify-center border border-holy-gold/30">
          <span className="text-holy-gold text-sm font-black">{Math.round(maxes.snatch)}</span>
        </div>
      </header>

      {/* Sesión del día */}
      <Card variant="solid" className="relative border-holy-primary/30 bg-holy-primary/5">
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <Badge variant="success" dot>Entrenamiento Hoy</Badge>
            <span className="text-slate-500 text-[10px] font-bold uppercase">{macrocycle.program_name}</span>
          </div>
          <div>
            <h3 className="text-white text-xl font-bold">
              Semana {macrocycle.week} / {macrocycle.total_weeks} — Día {macrocycle.day}
            </h3>
            <p className="text-slate-500 text-sm mt-1">
              {macrocycle.focus} · Snatch {maxes.snatch}kg · CJ {maxes.jerk}kg
            </p>
          </div>
          <div className="pt-2">
            <Button fullWidth variant="primary" size="lg">
              INICIAR SESIÓN →
            </Button>
          </div>
        </div>
      </Card>

      {/* Métricas Stress Engine */}
      <div className="grid grid-cols-2 gap-4">
        <Card padding="md" variant="glass" className="space-y-2">
          <p className="text-slate-500 text-[10px] font-black uppercase">Readiness</p>
          {stressLoading ? (
            <div className="h-8 w-12 bg-slate-800 rounded animate-pulse" />
          ) : (
            <div className="flex items-end gap-1">
              <span className={`text-2xl font-black ${readiness !== null ? readinessColor(readiness) : 'text-slate-600'}`}>
                {readiness ?? '—'}
              </span>
              <span className="text-slate-600 text-[9px] font-bold mb-1.5">
                {stress?.readiness_category ?? ''}
              </span>
            </div>
          )}
        </Card>
        <Card padding="md" variant="glass" className="space-y-2">
          <p className="text-slate-500 text-[10px] font-black uppercase">Fatiga (Banister)</p>
          {stressLoading ? (
            <div className="h-8 w-16 bg-slate-800 rounded animate-pulse" />
          ) : (
            <div className="flex items-end gap-1">
              <span className={`text-2xl font-black ${fatigueColor}`}>{fatigueLabel}</span>
              <span className="text-slate-600 text-[9px] font-bold mb-1.5">
                {stress ? Math.round(stress.fatigue) : '—'}
              </span>
            </div>
          )}
        </Card>
      </div>

      {/* Injury Shield */}
      {injuries && injuries.length > 0 && (
        <Card variant="solid" className="border-red-500/20 bg-red-500/[0.02] flex gap-4 items-center">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-xl">🛡️</div>
          <div className="flex-1">
            <h4 className="text-white text-sm font-bold">Injury Shield</h4>
            <p className="text-slate-500 text-[11px]">{injuries[0]}</p>
          </div>
          <Button variant="ghost" size="sm" className="text-red-400">Ver</Button>
        </Card>
      )}

      {/* Actividad club */}
      <div className="space-y-4 pt-2">
        <div className="flex justify-between items-center">
          <h4 className="text-slate-400 text-xs font-black uppercase">Actividad Club</h4>
          <span className="text-holy-primary text-[10px] font-bold cursor-pointer">Ver todo</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
          {clubActivity.length > 0 ? clubActivity.map((m, i) => (
            <div key={i} className="min-w-[140px] h-40 rounded-2xl bg-slate-900 border border-slate-800 p-4 flex flex-col justify-end">
              <div className="w-8 h-8 rounded-lg bg-holy-primary/20 mb-auto flex items-center justify-center text-holy-primary font-black text-xs">
                {m.name.charAt(0)}
              </div>
              <p className="text-white text-xs font-bold">{m.name}</p>
              <p className="text-slate-600 text-[10px]">{m.weight_class} · {m.maxSnatch}kg SN ✅</p>
            </div>
          )) : (
            <div className="min-w-[140px] h-40 rounded-2xl bg-slate-900 border border-slate-800 p-4 flex items-center justify-center">
              <p className="text-slate-600 text-[10px] text-center">Sin compañeros en el club aún</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AtletaHome;
