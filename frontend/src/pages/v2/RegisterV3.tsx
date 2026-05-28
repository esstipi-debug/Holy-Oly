/**
 * RegisterV3 · Crear cuenta atleta nueva · Peak Qual.
 *
 * Spec: claude_design_prompts_batch_v4/01_AUTH_ONBOARDING.md · prompt 3
 * Estilo: híbrido FIFA + Strava · neón cyan/red · dark mode
 *
 * Estructura:
 *  - Header back chevron + tag mono "CREAR CUENTA"
 *  - Product switcher sticky (HO rojo · Volta cyan) cambia acentos
 *  - Form 4 inputs + checkbox + strength indicator + match validation
 *  - CTA neón producto · validación inline antes de submit
 *
 * Mock: success siempre · navigate(ONBOARDING) ya que NavigationContext
 * todavía no incluye ONBOARDING_V3. Cuando se agregue, swap el navigate.
 */
import { useMemo, useState, type CSSProperties, type ReactElement } from 'react';
import { useNav } from '../../context/NavigationContext';
import '../../styles/v2/register.css';

// ============================================================
// Types
// ============================================================
type Product = 'holy-oly' | 'volta';
interface ProductMeta {
  id: Product;
  name: string;
  sub: string;
  accent: string;     // color para botones y glow
  accentSoft: string; // background gradient base
  glow: string;
  emoji: string;
}

interface FormState {
  name: string;
  email: string;
  password: string;
  confirm: string;
  terms: boolean;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
  terms?: string;
  submit?: string;
}

interface StrengthInfo {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
}

// ============================================================
// Product meta · HO rojo · Volta cyan
// API real: lee de ProductContext · acá hardcoded para mock
// ============================================================
const PRODUCTS: ProductMeta[] = [
  {
    id: 'holy-oly',
    name: 'HOLY OLY',
    sub: 'Halterofilia',
    accent: '#EF4444',
    accentSoft: 'rgba(239,68,68,0.15)',
    glow: '0 0 24px rgba(239,68,68,0.35)',
    emoji: 'HO',
  },
  {
    id: 'volta',
    name: 'VOLTA',
    sub: 'CrossFit',
    accent: '#00E5FF',
    accentSoft: 'rgba(0,229,255,0.15)',
    glow: '0 0 24px rgba(0,229,255,0.30)',
    emoji: 'VO',
  },
];

// ============================================================
// Icons · 1.7px stroke
// ============================================================
const ICONS: Record<string, ReactElement> = {
  back:   <polyline points="15 18 9 12 15 6"/>,
  check:  <polyline points="20 6 9 17 4 12"/>,
  eye:    <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
  eyeOff: <><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>,
  warn:   <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
  spin:   <><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></>,
  arrow:  <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
};
function Icon({ name, size = 14, stroke = 1.7, className, style }: { name: keyof typeof ICONS; size?: number; stroke?: number; className?: string; style?: CSSProperties }) {
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
// Validators
// ============================================================
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function calcStrength(pw: string): StrengthInfo {
  if (!pw) return { score: 0, label: '—', color: 'var(--text-lo)' };
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const labels = ['débil', 'débil', 'media', 'fuerte', 'excelente'];
  const colors = ['#EF4444', '#EF4444', '#FBBF24', '#22C55E', '#22C55E'];
  return { score: Math.min(4, s) as StrengthInfo['score'], label: labels[s], color: colors[s] };
}

function validateAll(f: FormState): FormErrors {
  const err: FormErrors = {};
  if (!f.name.trim() || f.name.trim().length < 2) err.name = 'Mínimo 2 caracteres';
  if (!EMAIL_RX.test(f.email.trim())) err.email = 'Email inválido';
  if (f.password.length < 6) err.password = 'Mínimo 6 caracteres';
  else if (!/\d/.test(f.password)) err.password = 'Debe incluir al menos un número';
  if (f.confirm !== f.password) err.confirm = 'Las contraseñas no coinciden';
  if (!f.terms) err.terms = 'Aceptá los términos para continuar';
  return err;
}

// ============================================================
// Subcomponent · StrengthBar 4 segments
// ============================================================
function StrengthBar({ info }: { info: StrengthInfo }) {
  return (
    <div className="rg-strength" aria-hidden="true">
      <div className="rg-strength-segs">
        {[1, 2, 3, 4].map(i => (
          <span key={i}
                className={`rg-strength-seg ${i <= info.score ? 'on' : ''}`}
                style={{ background: i <= info.score ? info.color : 'var(--surface-3)' }}/>
        ))}
      </div>
      <span className="rg-strength-label" style={{ color: info.color }}>
        {info.label.toUpperCase()}
      </span>
    </div>
  );
}

// ============================================================
// Subcomponent · ProductSwitcher sticky
// ============================================================
function ProductSwitcher({ active, setActive }: { active: Product; setActive: (p: Product) => void }) {
  return (
    <div className="rg-switcher" role="tablist" aria-label="Seleccionar producto">
      {PRODUCTS.map(p => {
        const on = active === p.id;
        return (
          <button key={p.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  className="rg-switcher-btn"
                  data-active={on}
                  style={{
                    ['--p-c' as string]: p.accent,
                    ['--p-bg' as string]: p.accentSoft,
                    ['--p-glow' as string]: p.glow,
                  } as CSSProperties}
                  onClick={() => setActive(p.id)}>
            <span className="rg-switcher-emoji">{p.emoji}</span>
            <span className="rg-switcher-name">{p.name}</span>
            <span className="rg-switcher-sub">{p.sub}</span>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// Main
// ============================================================
export default function RegisterV3(): ReactElement {
  const { navigate, back } = useNav();
  const [product, setProduct] = useState<Product>('holy-oly');
  const [form, setForm] = useState<FormState>({
    name: '', email: '', password: '', confirm: '', terms: false,
  });
  const [touched, setTouched] = useState<Record<keyof FormState, boolean>>({
    name: false, email: false, password: false, confirm: false, terms: false,
  });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  const productMeta = PRODUCTS.find(p => p.id === product)!;
  const strength = useMemo(() => calcStrength(form.password), [form.password]);
  const errors = useMemo(() => validateAll(form), [form]);
  const valid = Object.keys(errors).length === 0;

  const onField = <K extends keyof FormState>(k: K) => (v: FormState[K]) => {
    setForm(prev => ({ ...prev, [k]: v }));
  };
  const onBlur = (k: keyof FormState) => () => {
    setTouched(prev => ({ ...prev, [k]: true }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitErr(null);
    setTouched({ name: true, email: true, password: true, confirm: true, terms: true });
    if (!valid) return;
    setLoading(true);
    try {
      // Mock: cualquier email valida · success siempre
      // API real: POST /v1/auth/register { email, password, name, product }
      await new Promise(r => setTimeout(r, 600));
      // 409 mock · si email contiene "exists"
      if (form.email.toLowerCase().includes('exists')) {
        setSubmitErr('Email ya registrado · ¿iniciar sesión?');
        return;
      }
      try {
        localStorage.setItem('rg:registered', JSON.stringify({
          email: form.email, name: form.name, product, at: Date.now(),
        }));
      } catch { /* ignore */ }
      // Navigate al onboarding V3 (ya declarado en NavigationContext)
      navigate('ONBOARDING_V3');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rg-root" data-product={product}
         style={{
           ['--p-c' as string]: productMeta.accent,
           ['--p-bg' as string]: productMeta.accentSoft,
           ['--p-glow' as string]: productMeta.glow,
         } as CSSProperties}>

      <header className="rg-header">
        <button type="button" className="rg-back" onClick={back} aria-label="Volver">
          <Icon name="back" size={14}/>
        </button>
        <div className="rg-header-title">
          <span className="tag">CREAR CUENTA · ATLETA</span>
          <span className="brand">PEAK QUAL</span>
        </div>
        <div className="rg-header-spacer" aria-hidden="true"/>
      </header>

      <ProductSwitcher active={product} setActive={setProduct}/>

      <form className="rg-form" onSubmit={onSubmit} noValidate>
        <h1 className="rg-title">Tu cuenta de atleta</h1>
        <p className="rg-sub">Pocos datos · te llevamos al onboarding en seguida.</p>

        {/* NOMBRE */}
        <div className="rg-field">
          <label htmlFor="rg-name">Nombre</label>
          <input
            id="rg-name"
            type="text"
            autoComplete="name"
            value={form.name}
            onChange={(e) => onField('name')(e.target.value)}
            onBlur={onBlur('name')}
            placeholder="Cómo te llaman"
            aria-invalid={touched.name && !!errors.name}
            aria-describedby={touched.name && errors.name ? 'rg-name-err' : undefined}/>
          {touched.name && errors.name && (
            <span id="rg-name-err" className="rg-err"><Icon name="warn" size={11}/> {errors.name}</span>
          )}
        </div>

        {/* EMAIL */}
        <div className="rg-field">
          <label htmlFor="rg-email">Email</label>
          <input
            id="rg-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => onField('email')(e.target.value)}
            onBlur={onBlur('email')}
            placeholder="tu@email.com"
            aria-invalid={touched.email && !!errors.email}
            aria-describedby={touched.email && errors.email ? 'rg-email-err' : undefined}/>
          {touched.email && errors.email && (
            <span id="rg-email-err" className="rg-err"><Icon name="warn" size={11}/> {errors.email}</span>
          )}
        </div>

        {/* PASSWORD */}
        <div className="rg-field">
          <label htmlFor="rg-pw">Contraseña</label>
          <div className="rg-input-wrap">
            <input
              id="rg-pw"
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => onField('password')(e.target.value)}
              onBlur={onBlur('password')}
              placeholder="Mínimo 6 caracteres + 1 número"
              aria-invalid={touched.password && !!errors.password}
              aria-describedby="rg-pw-strength"/>
            <button type="button"
                    className="rg-input-icon"
                    onClick={() => setShowPw(s => !s)}
                    aria-label={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
              <Icon name={showPw ? 'eyeOff' : 'eye'} size={14}/>
            </button>
          </div>
          <div id="rg-pw-strength">
            <StrengthBar info={strength}/>
          </div>
          {touched.password && errors.password && (
            <span className="rg-err"><Icon name="warn" size={11}/> {errors.password}</span>
          )}
        </div>

        {/* CONFIRM */}
        <div className="rg-field">
          <label htmlFor="rg-confirm">Confirmar contraseña</label>
          <div className="rg-input-wrap">
            <input
              id="rg-confirm"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              value={form.confirm}
              onChange={(e) => onField('confirm')(e.target.value)}
              onBlur={onBlur('confirm')}
              placeholder="Repetí la contraseña"
              aria-invalid={touched.confirm && !!errors.confirm}
              aria-describedby={touched.confirm && errors.confirm ? 'rg-confirm-err' : undefined}/>
            <button type="button"
                    className="rg-input-icon"
                    onClick={() => setShowConfirm(s => !s)}
                    aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
              <Icon name={showConfirm ? 'eyeOff' : 'eye'} size={14}/>
            </button>
          </div>
          {touched.confirm && form.confirm && !errors.confirm && (
            <span className="rg-ok"><Icon name="check" size={11}/> Coinciden</span>
          )}
          {touched.confirm && errors.confirm && (
            <span id="rg-confirm-err" className="rg-err"><Icon name="warn" size={11}/> {errors.confirm}</span>
          )}
        </div>

        {/* TERMS */}
        <label className="rg-terms" data-checked={form.terms}>
          <input
            type="checkbox"
            checked={form.terms}
            onChange={(e) => { onField('terms')(e.target.checked); onBlur('terms')(); }}/>
          <span className="rg-terms-box" aria-hidden="true">
            {form.terms && <Icon name="check" size={11} stroke={2.4}/>}
          </span>
          <span className="rg-terms-text">
            Acepto los <a href="#terms" onClick={(e) => { e.preventDefault(); try { navigate('TERMS'); } catch { /* */ } }}>Términos</a>
            {' '}y la <a href="#privacy" onClick={(e) => { e.preventDefault(); try { navigate('PRIVACY'); } catch { /* */ } }}>Privacidad</a>.
          </span>
        </label>
        {touched.terms && errors.terms && (
          <span className="rg-err"><Icon name="warn" size={11}/> {errors.terms}</span>
        )}

        {/* SUBMIT ERROR */}
        {submitErr && (
          <div className="rg-submit-err" role="alert">
            <Icon name="warn" size={12}/>
            <span>{submitErr}</span>
            <button type="button" className="rg-submit-err-link" onClick={() => { try { navigate('LOGIN_V3'); } catch { /* */ } }}>
              Iniciar sesión
            </button>
          </div>
        )}

        {/* CTA */}
        <button
          type="submit"
          className="rg-cta"
          disabled={loading}
          data-loading={loading}>
          {loading ? (
            <>
              <Icon name="spin" size={14} className="rg-spin"/>
              <span>Creando cuenta…</span>
            </>
          ) : (
            <>
              <span>CREAR CUENTA</span>
              <Icon name="arrow" size={14} stroke={2.2}/>
            </>
          )}
        </button>

        {/* COACH NOTICE */}
        <p className="rg-coach-note">
          ¿Sos coach? Acceso por invitación · <a href="mailto:admin@holyoly.app">admin@holyoly.app</a>
        </p>

        {/* LOGIN LINK */}
        <p className="rg-login-link">
          ¿Ya tenés cuenta?{' '}
          <button type="button" onClick={() => { try { navigate('LOGIN_V3'); } catch { /* */ } }}>
            Iniciar sesión
          </button>
        </p>
      </form>
    </div>
  );
}
