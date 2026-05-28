/**
 * LandingV3 · Peak Qual product selector · sin sesión, sin deep-link.
 *
 * Atleta/coach abre la app sin elegir producto · escoge HO o VOLTA antes
 * de loguear. AXON queda locked (HYROX próximamente).
 *
 * Decisiones diseño:
 *  - Hero logo Peak Qual top 28vh · tagline mono · scroll hint
 *  - 3 product cards verticales · color por producto · glow neón al hover
 *  - HO=rojo halterofilia (tier-4) · VOLTA=cyan neón (engine-stress) · AXON=gris locked
 *  - Footer: link sobrio "Ya tenés cuenta" + legal mini
 *  - Tap card → guarda product:current en localStorage + navigate(LOGIN_V3)
 *  - Long-press card (500ms) → flash preview placeholder (mock)
 *  - Background: grid tactical sutil con drift CSS (respeta reduce-motion)
 *
 * Scope CSS bajo .lp-root · sin globals agresivos.
 *
 * Router: vista 'LANDING_V3' (Boss integra después al type View).
 */
import { useEffect, useRef, useState, type CSSProperties, type ReactElement } from 'react';
import { useNav, type View } from '../../context/NavigationContext';
import '../../styles/v2/landing.css';

// ============================================================
// Types
// ============================================================
type ProductId = 'ho' | 'volta' | 'axon';

interface ProductCard {
  id: ProductId;
  title: string;
  sub: string;
  bullets: string[];
  color: string;
  glowVar: string;
  locked?: boolean;
  badge?: string;
}

// ============================================================
// Mock data inline · sin fetch
// ============================================================
const PRODUCTS: ProductCard[] = [
  {
    id: 'ho',
    title: 'HOLY OLY',
    sub: 'Halterofilia Olímpica',
    bullets: ['Snatch · Clean & Jerk', 'Macrociclos por escuela', 'Discos por nivel'],
    color: '#EF4444',
    glowVar: 'var(--glow-red)',
  },
  {
    id: 'volta',
    title: 'VOLTA',
    sub: 'CrossFit · WODs · benchmarks',
    bullets: ['Mayhem warmup', 'Doble sesión', 'Timer live'],
    color: '#00E5FF',
    glowVar: 'var(--glow-cyan)',
  },
  {
    id: 'axon',
    title: 'AXON',
    sub: 'HYROX · híbrido funcional',
    bullets: ['8 estaciones · running', 'Compromis racing', 'Beta privada'],
    color: '#64748B',
    glowVar: 'none',
    locked: true,
    badge: 'PRÓXIMAMENTE',
  },
];

// ============================================================
// Icons · stroke 1.7 línea
// ============================================================
const ICONS: Record<string, ReactElement> = {
  chev:    <polyline points="9 18 15 12 9 6"/>,
  lock:    <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
  barbell: <><circle cx="5" cy="12" r="2.5"/><circle cx="19" cy="12" r="2.5"/><line x1="7.5" y1="12" x2="16.5" y2="12"/><line x1="3" y1="9" x2="3" y2="15"/><line x1="21" y1="9" x2="21" y2="15"/></>,
  bolt:    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>,
  hex:     <polygon points="12 2 21 7 21 17 12 22 3 17 3 7 12 2"/>,
  scroll:  <><polyline points="6 9 12 15 18 9"/></>,
};

function Icon({ name, size = 16, stroke = 1.7, style, className }: {
  name: keyof typeof ICONS; size?: number; stroke?: number; style?: CSSProperties; className?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={stroke}
         strokeLinecap="round" strokeLinejoin="round"
         className={className} style={style}>
      {ICONS[name]}
    </svg>
  );
}

// ============================================================
// Product icon · render por id
// ============================================================
function ProductIcon({ id }: { id: ProductId }) {
  if (id === 'ho')    return <Icon name="barbell" size={28} stroke={1.6}/>;
  if (id === 'volta') return <Icon name="bolt" size={28} stroke={1.6}/>;
  return <Icon name="hex" size={28} stroke={1.6}/>;
}

// ============================================================
// Hero · logo + tagline + scroll hint
// ============================================================
function Hero({ visible }: { visible: boolean }) {
  return (
    <header className="lp-hero" data-visible={visible}>
      <div className="lp-logo" aria-label="Peak Qual">
        <span className="lp-logo-bar"/>
        <span className="lp-logo-mark">PQ</span>
        <span className="lp-logo-bar"/>
      </div>
      <div className="lp-brand">PEAK QUAL</div>
      <div className="lp-tagline">SMART TRAINING · ZERO BURNOUT</div>
      <div className="lp-scroll-hint" aria-hidden="true">
        <Icon name="scroll" size={14} stroke={1.8}/>
      </div>
    </header>
  );
}

// ============================================================
// Card · product selector
// ============================================================
interface CardProps {
  product: ProductCard;
  index: number;
  visible: boolean;
  onSelect: (id: ProductId) => void;
  onLongPress: (id: ProductId) => void;
}
function Card({ product, index, visible, onSelect, onLongPress }: CardProps) {
  const pressTimer = useRef<number | null>(null);
  const longFired = useRef<boolean>(false);

  const startPress = () => {
    if (product.locked) return;
    longFired.current = false;
    pressTimer.current = window.setTimeout(() => {
      longFired.current = true;
      onLongPress(product.id);
    }, 500);
  };
  const cancelPress = () => {
    if (pressTimer.current !== null) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };
  const handleClick = () => {
    if (product.locked) return;
    if (longFired.current) {
      longFired.current = false;
      return;
    }
    onSelect(product.id);
  };

  return (
    <article
      className="lp-card"
      data-locked={product.locked || false}
      data-visible={visible}
      style={{
        ['--cc' as string]: product.color,
        ['--cc-glow' as string]: product.glowVar,
        ['--stagger' as string]: `${index * 80}ms`,
      } as CSSProperties}
      tabIndex={product.locked ? -1 : 0}
      role="button"
      aria-label={product.locked ? `${product.title} bloqueado · próximamente` : `Elegir ${product.title} · ${product.sub}`}
      aria-disabled={product.locked || false}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (product.locked) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(product.id);
        }
      }}
      onMouseDown={startPress}
      onMouseUp={cancelPress}
      onMouseLeave={cancelPress}
      onTouchStart={startPress}
      onTouchEnd={cancelPress}
      onTouchCancel={cancelPress}>
      <div className="lp-card-banner">
        <span className="lp-card-banner-bar"/>
        <span className="lp-card-banner-tag">
          {product.locked ? product.badge : 'DISCIPLINA'}
        </span>
        <span className="lp-card-banner-bar"/>
      </div>
      <div className="lp-card-body">
        <div className="lp-card-icon" aria-hidden="true">
          {product.locked ? <Icon name="lock" size={26} stroke={1.8}/> : <ProductIcon id={product.id}/>}
        </div>
        <div className="lp-card-meta">
          <div className="lp-card-title">{product.title}</div>
          <div className="lp-card-sub">{product.sub}</div>
        </div>
      </div>
      <ul className="lp-card-bullets">
        {product.bullets.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>
      <div className="lp-card-cta">
        {product.locked ? (
          <span className="lp-card-cta-locked">
            <Icon name="lock" size={11} stroke={2}/> ACCESO BETA
          </span>
        ) : (
          <span className="lp-card-cta-go">
            Elegir <Icon name="chev" size={12} stroke={2}/>
          </span>
        )}
      </div>
    </article>
  );
}

// ============================================================
// Toast preview · long-press feedback
// ============================================================
function PreviewToast({ product, onClose }: { product: ProductCard | null; onClose: () => void }) {
  useEffect(() => {
    if (!product) return;
    const t = window.setTimeout(onClose, 1800);
    return () => clearTimeout(t);
  }, [product, onClose]);
  if (!product) return null;
  return (
    <div className="lp-toast" style={{ ['--cc' as string]: product.color } as CSSProperties} role="status" aria-live="polite">
      <span className="lp-toast-bar"/>
      <span className="lp-toast-text">
        Preview <strong>{product.title}</strong> · disponible tras login
      </span>
    </div>
  );
}

// ============================================================
// Footer secundario + legal
// ============================================================
function Footer({ onLogin, onDemo }: { onLogin: () => void; onDemo: () => void }) {
  return (
    <footer className="lp-footer">
      <button type="button" className="lp-login-link" onClick={onLogin}>
        Ya tenés cuenta · <span>iniciar sesión</span>
      </button>
      <button type="button" className="lp-login-link" onClick={onDemo} style={{ marginTop: 8 }}>
        Modo demo · <span>QA sin cuenta</span>
      </button>
      <div className="lp-legal">
        <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacidad</a>
        <span className="sep">·</span>
        <a href="#terms" onClick={(e) => e.preventDefault()}>Términos</a>
        <span className="sep">·</span>
        <span className="ver">v1.0.0-alpha</span>
      </div>
    </footer>
  );
}

// ============================================================
// Main
// ============================================================
export default function LandingV3() {
  const { navigate } = useNav();
  const [visible, setVisible] = useState<boolean>(false);
  const [preview, setPreview] = useState<ProductCard | null>(null);

  // entrada cascada · trigger después de mount
  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), 40);
    return () => clearTimeout(t);
  }, []);

  const goLogin = () => {
    try {
      navigate('LOGIN_V3' as View);
    } catch {
      navigate('LOGIN');
    }
  };

  const handleSelect = (id: ProductId) => {
    try {
      // product:current espera 'holy-oly' | 'volta' — NO el id corto 'ho'.
      // (antes guardaba 'ho', que caía al default por no matchear en readProduct)
      localStorage.setItem('product:current', id === 'volta' ? 'volta' : 'holy-oly');
    } catch {
      /* ignore */
    }
    goLogin();
  };

  // Entrada a modo demo/QA sin necesidad de `?demo=1` en la URL: habilita el
  // gate y manda al login, donde aparecen los botones por cuadrante (HO/Volta).
  const goDemo = () => {
    try {
      localStorage.setItem('app:demo_mode', '1');
      localStorage.setItem('product:current', 'holy-oly');
    } catch {
      /* ignore */
    }
    goLogin();
  };

  const handleLongPress = (id: ProductId) => {
    const p = PRODUCTS.find(x => x.id === id);
    if (p) setPreview(p);
  };

  return (
    <div className="lp-root">
      <div className="lp-bg" aria-hidden="true"/>
      <div className="lp-scroll">
        <Hero visible={visible}/>
        <section className="lp-products" aria-label="Elegí tu disciplina">
          <div className="lp-section-head">
            <span className="lp-section-bar"/>
            <h2>Elegí tu disciplina</h2>
            <span className="lp-section-bar"/>
          </div>
          <div className="lp-cards">
            {PRODUCTS.map((p, i) => (
              <Card
                key={p.id}
                product={p}
                index={i}
                visible={visible}
                onSelect={handleSelect}
                onLongPress={handleLongPress}/>
            ))}
          </div>
        </section>
        <Footer onLogin={goLogin} onDemo={goDemo}/>
      </div>
      <PreviewToast product={preview} onClose={() => setPreview(null)}/>
    </div>
  );
}
