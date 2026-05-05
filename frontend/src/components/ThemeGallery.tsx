import { useEffect } from 'react';
import { themes } from '../themes';
import { useTheme } from '../context/ThemeContext';

// Map theme id → B16 CSS class name
const THEME_CLASS: Record<string, string> = {
  'holy-dark':   '',          // default, no B16 class
  't-brutal':    't-brutal',
  't-deco':      't-deco',
  't-cyber':     't-cyber',
  't-comic':     't-comic',
  't-wood':      't-wood',
  't-rpg':       't-rpg',
  't-editorial': 't-editorial',
  't-industrial':'t-industrial',
  't-organic':   't-organic',
  't-terminal':  't-terminal',
  't-marble':    't-marble',
  't-arcade':    't-arcade',
  't-vapor':     't-vapor',
  't-glass':     't-glass',
  't-news':      't-news',
  't-graffiti':  't-graffiti',
  't-mercury':   't-mercury',
  't-zen':       't-zen',
  't-cosmic':    't-cosmic',
  't-lego':      't-lego',
  't-velvet':    't-velvet',
  't-lava':      't-lava',
  't-sketch':    't-sketch',
  't-leather':   't-leather',
  't-floral':    't-floral',
  't-holo':      't-holo',
  't-mono':      't-mono',
  't-pirate':    't-pirate',
};

const PREVIEWS: Record<string, { greeting: string; status: string; cta: string }> = {
  'holy-dark':   { greeting: 'Hola, Matías', status: 'VERDE', cta: 'INICIAR SESIÓN →' },
  't-brutal':    { greeting: '// USER: MATIAS', status: 'READY', cta: 'START SESSION →' },
  't-deco':      { greeting: 'Bienvenido, Matías', status: 'LISTO', cta: 'EMPEZAR' },
  't-cyber':     { greeting: 'user_matias.exe', status: 'ONLINE', cta: 'JACK IN ▸' },
  't-comic':     { greeting: '¡Hey, Matías!', status: '¡POW!', cta: '¡VAMOS!' },
  't-wood':      { greeting: 'Hola, Matías', status: '// LISTO', cta: 'EMPEZAR SESIÓN' },
  't-rpg':       { greeting: 'P1: MATIAS', status: 'READY', cta: '▶ START' },
  't-editorial': { greeting: 'Buenos días, Matías', status: 'LISTO', cta: 'Empezar sesión' },
  't-industrial':{ greeting: 'UNIT // MATIAS', status: 'ARMED', cta: 'DEPLOY' },
  't-organic':   { greeting: '¡Hola, Matías!', status: 'listo ✨', cta: 'empezar ✨' },
  't-terminal':  { greeting: 'whoami', status: 'READY', cta: 'run start.sh' },
  't-marble':    { greeting: 'Bienvenido, Matías', status: 'listo', cta: 'Comenzar' },
  't-arcade':    { greeting: 'PLAYER 1 · MATIAS', status: 'READY', cta: 'PRESS START' },
  't-vapor':     { greeting: 'aesthetic, matias', status: 'VIBE', cta: 'エンター ▸' },
  't-glass':     { greeting: 'Sir Matías', status: 'Listo', cta: 'Adelante' },
  't-news':      { greeting: '— 5 May 2026 — Sr. Matías', status: 'EXTRA', cta: 'Begin Session →' },
  't-graffiti':  { greeting: 'YO! MATIAS', status: 'RAW', cta: '¡VAMOS! ▸' },
  't-mercury':   { greeting: 'USR // MATIAS', status: 'ACTIVE', cta: 'INITIATE' },
  't-zen':       { greeting: '道 · Matías', status: '禅 ZEN', cta: '始める · COMENZAR' },
  't-cosmic':    { greeting: '★ Hola, Matías ★', status: 'ALIGNED', cta: '⋆ LIFTOFF ⋆' },
  't-lego':      { greeting: 'HOLA MATIAS', status: 'GO', cta: 'JUGAR ▸' },
  't-velvet':    { greeting: 'Sr. Matías P.', status: 'VIP', cta: 'ENTRAR' },
  't-lava':      { greeting: 'MATIAS INFERNO', status: 'BURN', cta: 'IGNITE ▸' },
  't-sketch':    { greeting: 'hola, Matías!', status: 'ready', cta: '¡vamos!' },
  't-leather':   { greeting: 'MATIAS P.', status: 'READY', cta: 'RIDE' },
  't-floral':    { greeting: 'Hola, Matías', status: 'listo', cta: 'comenzar' },
  't-holo':      { greeting: 'USER · MATIAS', status: 'SYNCED', cta: 'START' },
  't-mono':      { greeting: 'MATIAS', status: 'READY', cta: 'START' },
  't-pirate':    { greeting: 'Capitán Matías', status: 'A BORDO', cta: '¡ZARPAR!' },
};

export default function ThemeGallery() {
  const { currentTheme, setTheme } = useTheme();

  // Inject B16 CSS once
  useEffect(() => {
    const id = 'b16-theme-css';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = '/b16-themes.css';
    document.head.appendChild(link);
  }, []);

  return (
    <div style={{ background: '#050510', minHeight: '100%', padding: '20px 16px 80px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-.02em' }}>
          Theme <span style={{ background: 'linear-gradient(90deg,#FFD700,#00E5FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Gallery</span>
        </h1>
        <p style={{ fontSize: 12, color: '#475569', marginTop: 6 }}>
          {themes.length} personalidades visuales · Elige tu estilo
        </p>
      </div>

      {/* Grid 2 cols */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {themes.map((theme) => {
          const isActive = currentTheme.id === theme.id;
          const cls = THEME_CLASS[theme.id] ?? '';
          const pv = PREVIEWS[theme.id] ?? { greeting: 'Hola', status: 'LISTO', cta: 'EMPEZAR' };

          return (
            <div
              key={theme.id}
              className={`theme-card ${cls}`}
              onClick={() => setTheme(theme.id)}
              style={
                cls === ''
                  ? {
                      // Holy Oly Dark — manual preview since no B16 class
                      background: '#07070F',
                      color: '#fff',
                      fontFamily: 'Inter, system-ui, sans-serif',
                      outline: isActive ? '2px solid #22C55E' : undefined,
                    }
                  : {
                      outline: isActive ? '2px solid #22C55E' : undefined,
                    }
              }
            >
              {cls === '' ? (
                // Holy Oly Dark manual preview
                <div className="preview" style={{ background: '#07070F' }}>
                  <div className="pv-top">
                    <div className="pv-greeting" style={{ color: '#94a3b8', opacity: 1 }}>{pv.greeting}</div>
                    <div className="pv-status" style={{ background: 'rgba(34,197,94,.15)', color: '#4ade80', padding: '3px 8px', borderRadius: 20, border: '1px solid rgba(34,197,94,.3)' }}>{pv.status}</div>
                  </div>
                  <div>
                    <div className="pv-label" style={{ color: '#64748b' }}>READINESS</div>
                    <div className="pv-stat-big" style={{ fontSize: 80, fontWeight: 900, color: '#22C55E', lineHeight: 1 }}>84</div>
                  </div>
                  <div className="pv-card" style={{ background: '#111118', border: '1px solid #1e1e30', borderRadius: 14, padding: '10px 14px' }}>
                    <div><div className="pv-card-num" style={{ fontSize: 18, fontWeight: 800, color: '#F59E0B' }}>7.4</div><div className="pv-card-lbl" style={{ color: '#64748b' }}>OLY INDEX</div></div>
                  </div>
                  <div className="pv-bottom-cta" style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', color: '#fff', padding: '12px', borderRadius: 14, fontWeight: 800, fontSize: 13, marginTop: 'auto', textAlign: 'center' }}>{pv.cta}</div>
                </div>
              ) : (
                <div className="preview">
                  <div className="pv-top">
                    <div className="pv-greeting">{pv.greeting}</div>
                    <div className="pv-status">{pv.status}</div>
                  </div>
                  <div>
                    <div className="pv-label">READINESS</div>
                    <div className="pv-stat-big">84</div>
                  </div>
                  <div className="pv-card">
                    <div><div className="pv-card-num">7.4</div><div className="pv-card-lbl">OLY INDEX</div></div>
                  </div>
                  <div className="pv-card">
                    <div><div className="pv-card-num">15D</div><div className="pv-card-lbl">RACHA</div></div>
                  </div>
                  <div className="pv-bottom-cta">{pv.cta}</div>
                </div>
              )}

              <div className="label-bar">
                <div>
                  <div className="lbl-name">{theme.name}</div>
                  <div className="lbl-font">{theme.font}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  {isActive && (
                    <span className="lbl-tag" style={{ background: '#22C55E', color: '#07070F' }}>✓ ACTIVO</span>
                  )}
                  {theme.premium && !isActive && (
                    <span className="lbl-tag prem">💎 PRO</span>
                  )}
                  {!theme.premium && !isActive && (
                    <span className="lbl-tag">FREE</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
