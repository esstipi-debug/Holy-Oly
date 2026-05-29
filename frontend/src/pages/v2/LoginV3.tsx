/**
 * LoginV3 · Peak Qual · login mobile-first.
 *
 * Atleta/coach con cuenta · mantiene contexto de producto (HO o Volta)
 * elegido en Landing (localStorage 'product:current').
 *
 * Decisiones diseño:
 *  - Header 80px · back chevron a Landing · tag mono "INICIAR SESIÓN"
 *  - Card glass dark con bordes hairline + glow del producto
 *  - 2 inputs floating-label · focus glow cyan · error glow red
 *  - Toggle reveal password (eye/eye-off SVG)
 *  - CTA full width · "ENTRAR →" verde lime si HO · cyan si Volta
 *  - Links secundarios: "Olvidé mi contraseña" + "Crear cuenta nueva"
 *  - Demo mode opt-in si localStorage app:demo_mode === '1'
 *  - Auth REAL vía AuthContext (useAuth.login) contra backend · misma lógica
 *    que la pantalla legacy Login.tsx · error inline desde e.message
 *  - Banner backend down ligado a useAuth.backendAlive
 *
 * Scope CSS bajo .lg-root · sin globals agresivos.
 * Router: vista 'LOGIN_V3'.
 */
import { useEffect, useRef, useState, type CSSProperties, type ReactElement } from 'react';
import { useNav, type View } from '../../context/NavigationContext';
import { useAuth } from '../../context/AuthContext';
import { useProduct } from '../../context/ProductContext';
import { useRole } from '../../context/RoleContext';
import '../../styles/v2/login.css';

// ============================================================
// Types
// ============================================================
type ProductId = 'ho' | 'volta';

interface ProductMeta {
  label: string;
  glyph: 'barbell' | 'bolt';
  accent: string;       // CTA accent
  accentSoft: string;   // gradient soft
  glowVar: string;
}

// ============================================================
// Mock data inline
// ============================================================
const PRODUCTS: Record<ProductId, ProductMeta> = {
  ho:    { label: 'HOLY OLY', glyph: 'barbell', accent: '#84CC16', accentSoft: '#22C55E', glowVar: 'var(--glow-green)' },
  volta: { label: 'VOLTA',    glyph: 'bolt',    accent: '#00E5FF', accentSoft: '#3B82F6', glowVar: 'var(--glow-cyan)' },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// ============================================================
// Icons · stroke 1.7 línea
// ============================================================
const ICONS: Record<string, ReactElement> = {
  back:    <polyline points="15 18 9 12 15 6"/>,
  chev:    <polyline points="9 18 15 12 9 6"/>,
  eye:     <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
  eyeOff:  <><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>,
  alert:   <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
  spinner: <><circle cx="12" cy="12" r="9" strokeOpacity="0.25"/><path d="M21 12a9 9 0 0 1-9 9"/></>,
  arrow:   <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
  barbell: <><circle cx="5" cy="12" r="2.5"/><circle cx="19" cy="12" r="2.5"/><line x1="7.5" y1="12" x2="16.5" y2="12"/><line x1="3" y1="9" x2="3" y2="15"/><line x1="21" y1="9" x2="21" y2="15"/></>,
  bolt:    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>,
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
// Helpers
// ============================================================
function readCurrentProduct(): ProductId {
  try {
    const p = localStorage.getItem('product:current');
    return p === 'volta' ? 'volta' : 'ho';
  } catch {
    return 'ho';
  }
}

// Gate del modo demo · solo visible si la URL trajo `?demo=1`
// (persistido por main.tsx en localStorage al boot) · igual que Login.tsx legacy
function isDemoModeAllowed(): boolean {
  try { return localStorage.getItem('app:demo_mode') === '1'; }
  catch { return false; }
}

// ============================================================
// Header con producto activo + back
// ============================================================
function Header({ product, onBack }: { product: ProductMeta; onBack: () => void }) {
  return (
    <header className="lg-header" style={{ ['--cc' as string]: product.accent } as CSSProperties}>
      <button type="button" className="lg-back" onClick={onBack} aria-label="Volver a Landing">
        <Icon name="back" size={14} stroke={2}/>
      </button>
      <div className="lg-header-mid">
        <div className="lg-header-logo" aria-hidden="true">
          <Icon name={product.glyph} size={16} stroke={1.8}/>
        </div>
        <div className="lg-header-meta">
          <span className="lg-header-product">{product.label}</span>
          <span className="lg-header-tag">INICIAR SESIÓN</span>
        </div>
      </div>
      <span className="lg-header-spacer" aria-hidden="true"/>
    </header>
  );
}

// ============================================================
// Field · floating label input
// ============================================================
interface FieldProps {
  label: string;
  type: 'email' | 'password' | 'text';
  value: string;
  onChange: (v: string) => void;
  onEnter?: () => void;
  error?: string | null;
  autoComplete?: string;
  ariaLabel: string;
  trailing?: ReactElement;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}
function Field({ label, type, value, onChange, onEnter, error, autoComplete, ariaLabel, trailing, inputRef }: FieldProps) {
  const [focused, setFocused] = useState<boolean>(false);
  const filled = value.length > 0;
  return (
    <label className="lg-field" data-focus={focused} data-filled={filled} data-error={!!error}>
      <span className="lg-field-label">{label}</span>
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onEnter) {
            e.preventDefault();
            onEnter();
          }
        }}
        autoComplete={autoComplete}
        aria-label={ariaLabel}
        aria-invalid={!!error}/>
      {trailing && <span className="lg-field-trailing">{trailing}</span>}
      {error && (
        <span className="lg-field-error" role="alert">
          <Icon name="alert" size={11} stroke={2}/> {error}
        </span>
      )}
    </label>
  );
}

// ============================================================
// Banner · backend status
// ============================================================
function BackendBanner({ alive }: { alive: boolean }) {
  if (alive) return null;
  return (
    <div className="lg-banner" role="status">
      <Icon name="alert" size={13} stroke={2}/>
      <span>Servidor no disponible · podés usar <strong>modo Demo</strong></span>
    </div>
  );
}

// ============================================================
// Toast bottom (network error)
// ============================================================
function NetworkToast({ msg, onRetry, onClose }: { msg: string | null; onRetry: () => void; onClose: () => void }) {
  useEffect(() => {
    if (!msg) return;
    const t = window.setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [msg, onClose]);
  if (!msg) return null;
  return (
    <div className="lg-toast" role="alert">
      <Icon name="alert" size={13} stroke={2}/>
      <span className="lg-toast-text">{msg}</span>
      <button type="button" className="lg-toast-retry" onClick={onRetry}>Reintentar</button>
    </div>
  );
}

// ============================================================
// Main
// ============================================================
interface LoginV3Props {
  onSuccess?: () => void;
}
export default function LoginV3({ onSuccess }: LoginV3Props = {}) {
  const { navigate } = useNav();
  const { login, enterDemoMode, backendAlive } = useAuth();
  const { setProduct } = useProduct();
  const { setRole } = useRole();

  const [productId] = useState<ProductId>(readCurrentProduct());
  const product = PRODUCTS[productId];
  const demoAllowed = isDemoModeAllowed();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [revealPw, setRevealPw] = useState<boolean>(false);
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [networkErr, setNetworkErr] = useState<string | null>(null);

  const emailRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);

  // autofocus email al mount
  useEffect(() => {
    const t = window.setTimeout(() => emailRef.current?.focus(), 240);
    return () => clearTimeout(t);
  }, []);

  // Validación
  const validateEmail = (v: string): string | null => {
    if (!v) return 'Ingresá tu email';
    if (!EMAIL_RE.test(v)) return 'Email con formato inválido';
    return null;
  };
  const validatePw = (v: string): string | null => {
    if (!v) return 'Ingresá tu contraseña';
    if (v.length < 6) return 'Mínimo 6 caracteres';
    return null;
  };

  const handleEmailChange = (v: string) => {
    setEmail(v);
    if (emailErr) setEmailErr(validateEmail(v));
    if (formErr) setFormErr(null);
  };
  const handlePwChange = (v: string) => {
    setPassword(v);
    if (pwErr) setPwErr(validatePw(v));
    if (formErr) setFormErr(null);
  };

  const goLanding = () => {
    try {
      navigate('LANDING_V3' as View);
    } catch {
      navigate('LOGIN');
    }
  };

  const goRegister = () => {
    try {
      navigate('REGISTER_V3' as View);
    } catch {
      navigate('REGISTER');
    }
  };

  const goAfterSuccess = () => {
    if (onSuccess) {
      onSuccess();
      return;
    }
    try {
      navigate('DEMO_HUB' as View);
    } catch {
      navigate('HOME');
    }
  };

  const handleSubmit = async () => {
    const eErr = validateEmail(email);
    const pErr = validatePw(password);
    setEmailErr(eErr);
    setPwErr(pErr);
    setFormErr(null);
    setNetworkErr(null);
    if (eErr || pErr) return;

    setLoading(true);
    try {
      // Auth REAL · POST /v1/auth/login vía AuthContext (igual que Login.tsx legacy)
      await login(email, password);
      goAfterSuccess();
    } catch (e: unknown) {
      // El backend devuelve el detalle del error en e.message
      // (ej. "Credenciales inválidas"). Lo mostramos inline en el form.
      setFormErr(e instanceof Error ? e.message : 'Email o contraseña inválidos');
    } finally {
      setLoading(false);
    }
  };

  // Entrada demo determinística por cuadrante. Usa los setters de contexto
  // (ProductContext/RoleContext) para que useProduct()/useRole() se actualicen
  // reactivamente — escribir localStorage crudo NO bastaría (esos contextos solo
  // leen storage al init). Luego enterDemoMode() habilita demoMode + user mock y
  // navegamos directo al home del cuadrante (NO a DEMO_HUB).
  const enterDemoQuadrant = (p: 'holy-oly' | 'volta', r: 'atleta' | 'coach') => {
    setProduct(p);
    setRole(r);
    enterDemoMode();
    const home: View = p === 'volta'
      ? (r === 'coach' ? 'VOLTA_COACH' : 'VOLTA_HOME')
      : (r === 'coach' ? 'COACH_DASH' : 'HOME');
    navigate(home);
  };

  const ctaDisabled = loading || !email || !password;

  return (
    <div className="lg-root" style={{ ['--cc' as string]: product.accent, ['--cc-soft' as string]: product.accentSoft, ['--cc-glow' as string]: product.glowVar } as CSSProperties}>
      <div className="lg-bg" aria-hidden="true"/>
      <div className="lg-scroll">
        <Header product={product} onBack={goLanding}/>

        {backendAlive === false && <BackendBanner alive={backendAlive}/>}

        <section className="lg-form-wrap" aria-label="Formulario de login">
          <div className="lg-form-card">
            <div className="lg-form-head">
              <span className="lg-form-bar"/>
              <span className="lg-form-tag">SESIÓN · {product.label}</span>
              <span className="lg-form-bar"/>
            </div>
            <h1 className="lg-form-title">Acceso atleta o coach</h1>
            <p className="lg-form-sub">Ingresá con tu email registrado</p>

            <div className="lg-fields">
              <Field
                label="Email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                onEnter={() => passwordRef.current?.focus()}
                error={emailErr}
                autoComplete="email"
                ariaLabel="Email"
                inputRef={emailRef}/>
              <Field
                label="Contraseña"
                type={revealPw ? 'text' : 'password'}
                value={password}
                onChange={handlePwChange}
                onEnter={handleSubmit}
                error={pwErr}
                autoComplete="current-password"
                ariaLabel="Contraseña"
                inputRef={passwordRef}
                trailing={
                  <button
                    type="button"
                    className="lg-eye"
                    onClick={() => setRevealPw(v => !v)}
                    aria-label={revealPw ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    aria-pressed={revealPw}
                    tabIndex={0}>
                    <Icon name={revealPw ? 'eyeOff' : 'eye'} size={15} stroke={1.8}/>
                  </button>
                }/>
            </div>

            {formErr && (
              <div className="lg-form-err" role="alert">
                <Icon name="alert" size={13} stroke={2}/>
                <span>{formErr}</span>
              </div>
            )}

            <button
              type="button"
              className="lg-cta"
              onClick={handleSubmit}
              disabled={ctaDisabled}
              aria-busy={loading}>
              {loading ? (
                <>
                  <Icon name="spinner" size={15} stroke={2.4} className="lg-spinner"/>
                  Verificando…
                </>
              ) : (
                <>
                  ENTRAR
                  <Icon name="arrow" size={14} stroke={2.2}/>
                </>
              )}
            </button>

            <div className="lg-links">
              <button type="button" className="lg-link lg-link-soft" onClick={() => alert('Mock · flujo recovery pendiente')}>
                Olvidé mi contraseña
              </button>
              <button type="button" className="lg-link lg-link-strong" onClick={goRegister}>
                Crear cuenta nueva <Icon name="chev" size={11} stroke={2.2}/>
              </button>
            </div>
          </div>
        </section>

        {demoAllowed && (
          <section className="lg-demo" aria-label="Modo demo">
            <div className="lg-demo-divider">
              <span className="lg-demo-bar"/>
              <span className="lg-demo-or">demo · QA</span>
              <span className="lg-demo-bar"/>
            </div>
            <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-mid, #94A3B8)', margin: '0 0 10px' }}>
              Entrá con datos mock · elegí cuadrante
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {([
                { p: 'holy-oly', r: 'atleta', label: '🏋️ Atleta HO', c: '#FFB300' },
                { p: 'holy-oly', r: 'coach',  label: '📋 Coach HO',  c: '#FFB300' },
              ] as const).map(q => (
                <button
                  key={`${q.p}-${q.r}`}
                  type="button"
                  className="btn-press"
                  onClick={() => enterDemoQuadrant(q.p, q.r)}
                  style={{
                    padding: '12px 10px',
                    borderRadius: 12,
                    background: `color-mix(in oklab, ${q.c} 12%, transparent)`,
                    border: `1px solid color-mix(in oklab, ${q.c} 40%, transparent)`,
                    color: q.c,
                    fontFamily: 'inherit',
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: '.02em',
                    cursor: 'pointer',
                  }}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </section>
        )}

        <div className="lg-foot-legal">
          <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacidad</a>
          <span className="sep">·</span>
          <a href="#terms" onClick={(e) => e.preventDefault()}>Términos</a>
          <span className="sep">·</span>
          <span className="ver">v1.0.0-alpha</span>
        </div>
      </div>

      <NetworkToast
        msg={networkErr}
        onRetry={() => { setNetworkErr(null); handleSubmit(); }}
        onClose={() => setNetworkErr(null)}/>
    </div>
  );
}
