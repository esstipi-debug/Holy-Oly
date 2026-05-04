import { themes, type ThemeDefinition } from '../themes';
import { useTheme } from '../context/ThemeContext';

const themePreviews: Record<string, { greeting: string; status: string; cta: string }> = {
  't-brutal': { greeting: '// USER: JUAN', status: 'READY', cta: 'START SESSION →' },
  't-deco': { greeting: 'Bienvenido, Juan', status: 'LISTO', cta: 'EMPEZAR' },
  't-cyber': { greeting: 'user_juan.exe', status: 'ONLINE', cta: 'JACK IN ▸' },
  't-comic': { greeting: '¡Hey, Juan!', status: '¡POW!', cta: '¡VAMOS!' },
  't-wood': { greeting: 'Hola, Juan', status: '// LISTO', cta: 'EMPEZAR SESIÓN' },
  't-rpg': { greeting: 'P1: JUAN', status: 'READY', cta: '▶ START' },
  't-editorial': { greeting: 'Buenos días, Juan', status: 'LISTO', cta: 'Empezar sesión' },
  't-industrial': { greeting: 'UNIT // JUAN', status: 'ARMED', cta: 'DEPLOY' },
  't-organic': { greeting: '¡Hola, Juan!', status: 'listo ✨', cta: 'empezar ✨' },
  't-terminal': { greeting: 'whoami', status: 'READY', cta: 'run start.sh' },
  't-marble': { greeting: 'Bienvenido, Juan', status: 'listo', cta: 'Comenzar' },
  't-arcade': { greeting: 'PLAYER 1 · JUAN', status: 'READY', cta: 'PRESS START' },
  't-vapor': { greeting: 'aesthetic, juan', status: 'VIBE', cta: 'エンター ▸' },
  't-glass': { greeting: 'Sir Juan', status: 'Listo', cta: 'Adelante' },
  't-news': { greeting: '— Mar 15, 2026 — Sr. Juan Pérez', status: 'EXTRA', cta: 'Begin Session →' },
  't-graffiti': { greeting: 'YO! JUAN', status: 'RAW', cta: '¡VAMOS! ▸' },
  't-mercury': { greeting: 'USR // JUAN', status: 'ACTIVE', cta: 'INITIATE' },
  't-zen': { greeting: '道 · Juan', status: '禅 ZEN', cta: '始める · COMENZAR' },
  't-cosmic': { greeting: '★ Hola, Juan ★', status: 'ALIGNED', cta: '⋆ LIFTOFF ⋆' },
  't-lego': { greeting: 'HOLA JUAN', status: 'GO', cta: 'JUGAR ▸' },
  't-velvet': { greeting: 'Sr. Juan Pérez', status: 'VIP', cta: 'ENTRAR' },
  't-lava': { greeting: 'JUAN INFERNO', status: 'BURN', cta: 'IGNITE ▸' },
  't-sketch': { greeting: 'hola, Juan!', status: 'ready', cta: '¡vamos!' },
  't-leather': { greeting: 'JUAN P.', status: 'READY', cta: 'RIDE' },
  't-floral': { greeting: 'Hola, Juan', status: 'listo', cta: 'comenzar' },
  't-holo': { greeting: 'USER · JUAN', status: 'SYNCED', cta: 'START' },
  't-mono': { greeting: 'JUAN', status: 'READY', cta: 'START' },
  't-pirate': { greeting: 'Capitán Juan', status: 'A BORDO', cta: '¡ZARPAR!' },
};

export default function ThemeGallery() {
  const { currentTheme, setTheme } = useTheme();

  return (
    <div className="p-6 pb-24">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-black text-white mb-2">Theme Gallery</h1>
        <p className="text-slate-400 text-sm">28 personalidades visuales · Elige tu estilo</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {themes.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            isActive={currentTheme.id === theme.id}
            onSelect={() => setTheme(theme.id)}
            preview={themePreviews[theme.id]}
          />
        ))}
      </div>
    </div>
  );
}

function ThemeCard({ theme, isActive, onSelect, preview }: {
  theme: ThemeDefinition;
  isActive: boolean;
  onSelect: () => void;
  preview?: { greeting: string; status: string; cta: string };
}) {

  return (
    <div
      className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${
        isActive ? 'ring-2 ring-[var(--primary)] scale-105' : 'hover:scale-102'
      }`}
      style={{
        background: theme.variables['--bg'],
        fontFamily: theme.variables['--font-family'],
        color: theme.variables['--text'],
      }}
      onClick={onSelect}
    >
      {/* Mini preview */}
      <div className="p-4 space-y-3 min-h-[280px] flex flex-col">
        <div className="flex justify-between items-center text-xs">
          <span style={{ fontFamily: theme.variables['--font-mono'] }}>{preview?.greeting || 'User'}</span>
          <span
            className="px-2 py-1 rounded text-xs font-bold"
            style={{
              background: theme.variables['--status-bg'],
              color: theme.variables['--status-text'],
              clipPath: theme.variables['--status-clip'] || 'none',
            }}
          >
            {preview?.status || 'OK'}
          </span>
        </div>

        <div className="text-4xl font-black" style={{ color: theme.variables['--text'] }}>
          84
        </div>

        <div
          className="p-3 rounded"
          style={{
            background: theme.variables['--card-bg'],
            border: `1px solid ${theme.variables['--card-border']}`,
            clipPath: theme.variables['--card-clip'] || 'none',
          }}
        >
          <div className="text-xs opacity-60">OLY INDEX</div>
          <div className="text-lg font-bold">7.4</div>
        </div>

        <div
          className="mt-auto text-center py-2 rounded-lg font-bold text-sm"
          style={{
            background: theme.variables['--cta-bg'],
            color: theme.variables['--cta-text'],
            clipPath: theme.variables['--cta-clip'] || 'none',
          }}
        >
          {preview?.cta || 'SELECT'}
        </div>
      </div>

      {/* Label bar */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent flex justify-between items-center">
        <div>
          <div className="text-white text-xs font-bold">{theme.name}</div>
          <div className="text-[10px] text-slate-400">{theme.font}</div>
        </div>
        {theme.premium && (
          <span className="text-[9px] font-bold px-2 py-1 rounded bg-gradient-to-r from-yellow-600 to-yellow-400 text-black">
            PREMIUM
          </span>
        )}
        {isActive && (
          <span className="text-[9px] font-bold px-2 py-1 rounded bg-[var(--primary)] text-white">
            ACTIVE
          </span>
        )}
      </div>
    </div>
    );
  }
}
