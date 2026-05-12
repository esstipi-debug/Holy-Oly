import React from 'react';
import Button from '../components/Button';
import { useNav } from '../context/NavigationContext';

interface Feature {
  label: string;
  free: boolean | string;
  pro: boolean | string;
  elite: boolean | string;
}

const features: Feature[] = [
  { label: 'Sesiones/mes', free: '8', pro: 'Ilimitadas', elite: 'Ilimitadas' },
  { label: 'IA Coach', free: false, pro: true, elite: true },
  { label: 'Injury Shield', free: false, pro: true, elite: true },
  { label: 'Analytics avanzados', free: false, pro: true, elite: true },
  { label: 'Volta CrossFit', free: false, pro: false, elite: true },
  { label: 'Soporte prioritario', free: false, pro: false, elite: true },
  { label: 'Coach asignado', free: false, pro: false, elite: true },
];

const Cell: React.FC<{ value: boolean | string }> = ({ value }) => {
  if (typeof value === 'string') return <span className="text-holy-text text-xs font-bold">{value}</span>;
  return value
    ? <span className="text-green-400 text-base">✓</span>
    : <span className="text-holy-text-secondary text-base">—</span>;
};

const PreMium: React.FC = () => {
  const { navigate } = useNav();
  const choose = (plan: 'free' | 'pro' | 'elite') => {
    try { localStorage.setItem('subscription', plan); } catch { /* ignore */ }
    navigate('HOME');
  };
  return (
    <div className="flex flex-col min-h-full bg-holy-bg">
      {/* Header */}
      <header className="px-6 pt-6 pb-2 text-center relative">
        <h1 className="text-holy-text text-2xl font-black">Elige tu plan</h1>
        <p className="text-holy-text-secondary text-xs mt-1">Desbloquea todo tu potencial</p>
      </header>

      <div className="flex-1 px-4 pb-6 overflow-y-auto">
        {/* Plan cards */}
        <div className="flex gap-3 mt-6 mb-6">
          {/* Free */}
          <div className="flex-1 bg-[#111118] border border-[#1E1E32] rounded-2xl p-4 text-center">
            <p className="text-holy-text-secondary text-[10px] font-black uppercase">Free</p>
            <p className="text-holy-text text-2xl font-black mt-1">$0</p>
            <p className="text-holy-text-secondary text-[10px]">para siempre</p>
          </div>
          {/* Pro */}
          <div className="flex-1 bg-green-600/10 border border-green-600/50 rounded-2xl p-4 text-center relative">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-green-600 text-holy-text text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Popular</div>
            <p className="text-green-400 text-[10px] font-black uppercase">Pro</p>
            <p className="text-holy-text text-2xl font-black mt-1">$19</p>
            <p className="text-holy-text-secondary text-[10px]">/ mes</p>
          </div>
          {/* Elite */}
          <div className="flex-1 bg-amber-500/10 border border-amber-500/40 rounded-2xl p-4 text-center">
            <p className="text-amber-400 text-[10px] font-black uppercase">Elite</p>
            <p className="text-holy-text text-2xl font-black mt-1">$49</p>
            <p className="text-holy-text-secondary text-[10px]">/ mes</p>
          </div>
        </div>

        {/* Features table */}
        <div className="bg-[#111118] border border-[#1E1E32] rounded-2xl overflow-hidden mb-6">
          {/* Column headers */}
          <div className="grid grid-cols-4 border-b border-[#1E1E32] px-4 py-2">
            <div />
            <div className="text-center text-holy-text-secondary text-[10px] font-black uppercase">Free</div>
            <div className="text-center text-green-400 text-[10px] font-black uppercase">Pro</div>
            <div className="text-center text-amber-400 text-[10px] font-black uppercase">Elite</div>
          </div>
          {features.map((f, i) => (
            <div
              key={f.label}
              className={`grid grid-cols-4 px-4 py-3 items-center ${i < features.length - 1 ? 'border-b border-[#1E1E32]' : ''}`}
            >
              <span className="text-holy-text-secondary text-[11px]">{f.label}</span>
              <div className="flex justify-center"><Cell value={f.free} /></div>
              <div className="flex justify-center"><Cell value={f.pro} /></div>
              <div className="flex justify-center"><Cell value={f.elite} /></div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer CTAs */}
      <footer className="px-6 pb-8 space-y-3">
        <Button fullWidth variant="gold" size="lg" onClick={() => choose('elite')}>
          Elegir Elite — $49/mes
        </Button>
        <Button fullWidth variant="primary" size="lg" onClick={() => choose('pro')}>
          Elegir Pro — $19/mes
        </Button>
        <Button fullWidth variant="ghost" className="text-holy-text-secondary" onClick={() => choose('free')}>
          Continuar gratis
        </Button>
      </footer>
    </div>
  );
};

export default PreMium;
