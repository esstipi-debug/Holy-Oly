import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';

interface BodyZone {
  name: string;
  fatigue: 'LOW' | 'MEDIUM' | 'HIGH';
  detail: string;
}

const zones: BodyZone[] = [
  { name: 'Hombros', fatigue: 'MEDIUM', detail: 'Acumulación de press overhead' },
  { name: 'Rodillas', fatigue: 'LOW', detail: 'Recuperación normal' },
  { name: 'Espalda baja', fatigue: 'HIGH', detail: 'Carga elevada en deadlift' },
  { name: 'Muñecas', fatigue: 'LOW', detail: 'Sin señales de alerta' },
];

type BadgeVariant = 'success' | 'warning' | 'danger';

const riskConfig: Record<'LOW' | 'MEDIUM' | 'HIGH', { label: string; color: string; bg: string; border: string; badge: BadgeVariant }> = {
  LOW: { label: 'BAJO', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', badge: 'success' },
  MEDIUM: { label: 'MEDIO', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', badge: 'warning' },
  HIGH: { label: 'ALTO', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', badge: 'danger' },
};

const overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';

const InjuryShield: React.FC = () => {
  const navigate = useNavigate();
  const cfg = riskConfig[overallRisk];

  return (
    <div className="flex flex-col min-h-full bg-[#07070F]">
      {/* Header */}
      <header className="px-6 pt-6 pb-4 flex items-center gap-3">
        <button
          onClick={() => navigate('/home')}
          className="w-9 h-9 rounded-xl bg-[#111118] border border-[#1E1E32] flex items-center justify-center text-slate-400 hover:text-white transition"
        >
          ←
        </button>
        <div>
          <h1 className="text-white text-xl font-black">Injury Shield</h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase">Monitoreo de riesgo</p>
        </div>
      </header>

      <div className="flex-1 px-6 space-y-6 pb-8">
        {/* Overall Risk Indicator */}
        <Card variant="solid" className={`${cfg.bg} ${cfg.border}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl ${cfg.bg} border ${cfg.border} flex items-center justify-center text-2xl`}>
                🛡️
              </div>
              <div>
                <p className="text-slate-500 text-[10px] font-black uppercase">Riesgo general</p>
                <p className={`text-2xl font-black ${cfg.color}`}>{cfg.label}</p>
              </div>
            </div>
            <Badge variant={cfg.badge}>
              {cfg.label}
            </Badge>
          </div>
        </Card>

        {/* Body Zones */}
        <div>
          <h2 className="text-slate-400 text-[10px] font-black uppercase mb-3">Zonas del cuerpo</h2>
          <div className="space-y-3">
            {zones.map((zone) => {
              const zoneCfg = riskConfig[zone.fatigue];
              return (
                <Card key={zone.name} variant="solid" padding="md" className="flex items-center gap-4">
                  <div className={`w-2 h-10 rounded-full ${zone.fatigue === 'LOW' ? 'bg-green-500' : zone.fatigue === 'MEDIUM' ? 'bg-amber-500' : 'bg-red-500'}`} />
                  <div className="flex-1">
                    <p className="text-white text-sm font-bold">{zone.name}</p>
                    <p className="text-slate-500 text-[11px]">{zone.detail}</p>
                  </div>
                  <span className={`text-[10px] font-black ${zoneCfg.color}`}>{zoneCfg.label}</span>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Recommendation */}
        <Card variant="solid" className="bg-amber-500/5 border-amber-500/20">
          <div className="flex gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <p className="text-amber-400 text-xs font-black uppercase mb-1">Recomendación del día</p>
              <p className="text-white text-sm font-semibold">Reduce carga en sentadilla 20%</p>
              <p className="text-slate-500 text-[11px] mt-1">
                Tu espalda baja muestra fatiga elevada. Mantén técnica y baja el volumen hoy.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Footer */}
      <footer className="px-6 pb-8">
        <Button fullWidth variant="primary" size="lg" onClick={() => navigate('/home')}>
          Entendido
        </Button>
      </footer>
    </div>
  );
};

export default InjuryShield;
