import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const THEME_KEY = 'holyoly_theme';

interface Theme {
  id: string;
  name: string;
  accent: string;
  bg: string;
  preview: string;
  description: string;
}

const themes: Theme[] = [
  { id: 'classic', name: 'Classic', accent: '#22C55E', bg: '#07070F', preview: 'from-[#07070F] to-[#111118]', description: 'Negro / Verde' },
  { id: 'arctic', name: 'Arctic', accent: '#3B82F6', bg: '#F0F4FF', preview: 'from-[#E8F0FF] to-[#C7D9FF]', description: 'Blanco / Azul' },
  { id: 'inferno', name: 'Inferno', accent: '#EF4444', bg: '#0A0505', preview: 'from-[#0A0505] to-[#1A0808]', description: 'Negro / Rojo' },
  { id: 'olympic-gold', name: 'Olympic Gold', accent: '#F59E0B', bg: '#080800', preview: 'from-[#080800] to-[#141400]', description: 'Negro / Dorado' },
  { id: 'carbon', name: 'Carbon', accent: '#6B7280', bg: '#111111', preview: 'from-[#111111] to-[#1F1F1F]', description: 'Gris / Negro' },
  { id: 'cyber-neon', name: 'Cyber Neon', accent: '#00E5FF', bg: '#04040D', preview: 'from-[#04040D] to-[#080818]', description: 'Negro / Cyan' },
];

const ThemeGallery: React.FC = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState<string>(() => localStorage.getItem(THEME_KEY) || 'classic');

  const applyTheme = (id: string) => {
    localStorage.setItem(THEME_KEY, id);
    setActive(id);
  };

  return (
    <div className="flex flex-col min-h-full bg-[#07070F]">
      {/* Header */}
      <header className="px-6 pt-6 pb-4 flex items-center gap-3">
        <button
          onClick={() => navigate('/profile')}
          className="w-9 h-9 rounded-xl bg-[#111118] border border-[#1E1E32] flex items-center justify-center text-slate-400 hover:text-white transition"
        >
          ←
        </button>
        <div>
          <h1 className="text-white text-xl font-black">Temas visuales</h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase">Personaliza tu app</p>
        </div>
      </header>

      <div className="flex-1 px-6 pb-8">
        <div className="grid grid-cols-2 gap-4">
          {themes.map((theme) => {
            const isActive = active === theme.id;
            return (
              <div
                key={theme.id}
                className={`rounded-2xl border overflow-hidden transition ${isActive ? 'border-white/40 shadow-lg shadow-white/10' : 'border-[#1E1E32]'}`}
              >
                {/* Color preview */}
                <div className={`h-24 bg-gradient-to-br ${theme.preview} flex items-center justify-center`}>
                  <div className="w-8 h-8 rounded-full" style={{ backgroundColor: theme.accent }} />
                </div>

                {/* Info */}
                <div className="bg-[#111118] p-3 space-y-2">
                  <div>
                    <p className="text-white text-sm font-bold">{theme.name}</p>
                    <p className="text-slate-500 text-[10px]">{theme.description}</p>
                  </div>
                  <button
                    onClick={() => applyTheme(theme.id)}
                    className={`w-full py-1.5 rounded-xl text-[11px] font-black uppercase transition ${
                      isActive
                        ? 'bg-green-600 text-white'
                        : 'bg-[#1E1E32] text-slate-400 hover:bg-[#2A2A42] hover:text-white'
                    }`}
                  >
                    {isActive ? 'Activo ✓' : 'Aplicar'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ThemeGallery;
