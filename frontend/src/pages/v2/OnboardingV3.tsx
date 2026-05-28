/**
 * OnboardingV3 · Wizard 4 steps · atleta nuevo · Peak Qual.
 *
 * Spec: claude_design_prompts_batch_v4/01_AUTH_ONBOARDING.md · prompt 4
 * Estilo: híbrido FIFA + Strava · neón cyan/lime · dark mode
 *
 * Steps:
 *  1 · Datos básicos (nombre · fecha nac · género · opt-in hormonal si fem)
 *  2 · Cuerpo (altura slider · peso slider + toggle kg/lbs)
 *  3 · Experiencia (4 cards) + opcional 1RM Sn/CJ si HO
 *  4 · Objetivos (3 chips multi) + toggle coach + input código 6 dígitos
 *
 * Navegación:
 *  - Swipeable horizontal · slide 250ms
 *  - Progress dots top tappable (solo steps completados)
 *  - Bottom CTA "Continuar →" · "Atrás" desde step 2+
 *  - Step 4 CTA "EMPEZAR" verde lime
 *
 * Mock final: localStorage save + navigate(DEMO_HUB)
 * API real: POST /v1/users/onboarding { payload }
 */
import { useMemo, useRef, useState, useEffect, type CSSProperties, type ReactElement } from 'react';
import { useNav } from '../../context/NavigationContext';
import '../../styles/v2/onboarding.css';

// ============================================================
// Types
// ============================================================
type Gender = 'masc' | 'fem' | 'na';
type Experience = 'principiante' | 'intermedio' | 'avanzado' | 'elite';
type Goal = 'performance' | 'composicion' | 'salud';
type ProductCtx = 'holy-oly' | 'volta';

interface OnboardingPayload {
  name: string;
  birthDate: string;       // yyyy-mm-dd
  gender: Gender;
  hormonalOptIn: boolean;
  heightCm: number;
  weightKg: number;
  weightUnit: 'kg' | 'lbs';
  experience: Experience | null;
  oneRmSnatch?: number;
  oneRmCleanJerk?: number;
  goals: Goal[];
  hasCoach: boolean;
  coachCode: string;
}

interface GenderOption { id: Gender; label: string; }
interface ExperienceOption {
  id: Experience;
  title: string;
  sub: string;
  yearsLabel: string;
  c: string;
}
interface GoalOption { id: Goal; label: string; desc: string; c: string; }

// ============================================================
// Static data
// ============================================================
const GENDERS: GenderOption[] = [
  { id: 'masc', label: 'Masculino' },
  { id: 'fem',  label: 'Femenino' },
  { id: 'na',   label: 'Prefiero no decir' },
];

const EXPERIENCES: ExperienceOption[] = [
  { id: 'principiante', title: 'Principiante', sub: 'Empezando · curiosidad',           yearsLabel: '< 6 meses',     c: '#22C55E' },
  { id: 'intermedio',   title: 'Intermedio',   sub: 'Sumás constancia',                 yearsLabel: '6m · 2 años',   c: '#00E5FF' },
  { id: 'avanzado',     title: 'Avanzado',     sub: 'Conocés tu cuerpo',                yearsLabel: '2 · 5 años',    c: '#A855F7' },
  { id: 'elite',        title: 'Élite',        sub: 'Competís · alta exigencia',        yearsLabel: '> 5 años',      c: '#EF4444' },
];

const GOALS: GoalOption[] = [
  { id: 'performance', label: 'Performance',          desc: 'Más fuerte · más rápido',         c: '#00E5FF' },
  { id: 'composicion', label: 'Composición corporal', desc: 'Cuerpo más eficiente',            c: '#A855F7' },
  { id: 'salud',       label: 'Salud · longevidad',   desc: 'Entrenar para la vida',           c: '#22C55E' },
];

const TOTAL_STEPS = 4;

// ============================================================
// Icons
// ============================================================
const ICONS: Record<string, ReactElement> = {
  back:    <polyline points="15 18 9 12 15 6"/>,
  forward: <polyline points="9 18 15 12 9 6"/>,
  arrow:   <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
  check:   <polyline points="20 6 9 17 4 12"/>,
  info:    <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>,
  spark:   <path d="M12 2v6m0 8v6M2 12h6m8 0h6M5 5l4 4m6 6l4 4M5 19l4-4m6-6l4-4"/>,
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
// Slider component · range con valor central grande
// ============================================================
interface SliderProps {
  id: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  accent?: string;
}
function Slider({ id, label, unit, min, max, step = 1, value, onChange, accent = '#00E5FF' }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="ob-slider">
      <div className="ob-slider-head">
        <span className="ob-slider-label">{label}</span>
        <span className="ob-slider-range">{min} – {max} {unit}</span>
      </div>
      <div className="ob-slider-value" style={{ color: accent }}>
        <span className="num">{value}</span>
        <span className="unit">{unit}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="ob-slider-input"
        style={{
          background: `linear-gradient(90deg, ${accent} 0%, ${accent} ${pct}%, var(--surface-3) ${pct}%, var(--surface-3) 100%)`,
        } as CSSProperties}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}/>
      <div className="ob-slider-ticks">
        <span>{min}</span>
        <span>{Math.round((min + max) / 2)}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

// ============================================================
// Step 1 · Datos básicos
// ============================================================
function Step1({ data, set }: { data: OnboardingPayload; set: <K extends keyof OnboardingPayload>(k: K, v: OnboardingPayload[K]) => void }) {
  return (
    <div className="ob-step">
      <h2 className="ob-step-title">Empecemos por lo básico</h2>
      <p className="ob-step-sub">Datos para personalizar tu plan. Podés editarlos después.</p>

      <div className="ob-field">
        <label htmlFor="ob-name">Cómo te llaman</label>
        <input
          id="ob-name"
          type="text"
          autoComplete="given-name"
          value={data.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="Tu nombre o apodo"/>
      </div>

      <div className="ob-field">
        <label htmlFor="ob-birth">Fecha de nacimiento</label>
        <input
          id="ob-birth"
          type="date"
          value={data.birthDate}
          onChange={(e) => set('birthDate', e.target.value)}
          max={new Date().toISOString().slice(0, 10)}/>
      </div>

      <div className="ob-field">
        <label>Género</label>
        <div className="ob-chips" role="radiogroup" aria-label="Género">
          {GENDERS.map(g => (
            <button key={g.id}
                    type="button"
                    role="radio"
                    aria-checked={data.gender === g.id}
                    className="ob-chip"
                    data-active={data.gender === g.id}
                    onClick={() => set('gender', g.id)}>
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {data.gender === 'fem' && (
        <div className="ob-toggle-card">
          <div className="ob-toggle-row">
            <div className="ob-toggle-text">
              <span className="ob-toggle-label">Tracking hormonal · ciclo menstrual</span>
              <span className="ob-toggle-desc">Datos sensibles · podés desactivar después.</span>
            </div>
            <button type="button"
                    className="ob-toggle"
                    data-on={data.hormonalOptIn}
                    role="switch"
                    aria-checked={data.hormonalOptIn}
                    onClick={() => set('hormonalOptIn', !data.hormonalOptIn)}>
              <span className="knob"/>
            </button>
          </div>
          <div className="ob-toggle-note">
            <Icon name="info" size={11}/>
            <span>Cifrado AES · sólo vos y tu coach lo ven (si autorizás).</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Step 2 · Cuerpo
// ============================================================
function Step2({ data, set }: { data: OnboardingPayload; set: <K extends keyof OnboardingPayload>(k: K, v: OnboardingPayload[K]) => void }) {
  const displayWeight = data.weightUnit === 'kg'
    ? data.weightKg
    : Math.round(data.weightKg * 2.20462);
  const onWeightChange = (v: number) => {
    if (data.weightUnit === 'kg') set('weightKg', v);
    else set('weightKg', Math.round(v / 2.20462));
  };

  return (
    <div className="ob-step">
      <h2 className="ob-step-title">Tu cuerpo hoy</h2>
      <p className="ob-step-sub">Línea base para calcular cargas y readiness.</p>

      <Slider
        id="ob-height"
        label="Altura"
        unit="cm"
        min={140}
        max={220}
        value={data.heightCm}
        onChange={(v) => set('heightCm', v)}
        accent="#00E5FF"/>

      <div className="ob-weight-block">
        <div className="ob-weight-toggle" role="group" aria-label="Unidad de peso">
          {(['kg', 'lbs'] as const).map(u => (
            <button key={u}
                    type="button"
                    data-active={data.weightUnit === u}
                    onClick={() => set('weightUnit', u)}>
              {u.toUpperCase()}
            </button>
          ))}
        </div>
        <Slider
          id="ob-weight"
          label="Peso"
          unit={data.weightUnit}
          min={data.weightUnit === 'kg' ? 40 : 88}
          max={data.weightUnit === 'kg' ? 180 : 397}
          value={displayWeight}
          onChange={onWeightChange}
          accent="#A855F7"/>
      </div>
    </div>
  );
}

// ============================================================
// Step 3 · Experiencia + 1RM opcional (HO)
// ============================================================
function Step3({ data, set, isHO }: { data: OnboardingPayload; set: <K extends keyof OnboardingPayload>(k: K, v: OnboardingPayload[K]) => void; isHO: boolean }) {
  return (
    <div className="ob-step">
      <h2 className="ob-step-title">Hace cuánto entrenás?</h2>
      <p className="ob-step-sub">Tu nivel ajusta carga y progresión. Sin presión.</p>

      <div className="ob-exp-grid">
        {EXPERIENCES.map(e => {
          const on = data.experience === e.id;
          return (
            <button key={e.id}
                    type="button"
                    className="ob-exp-card"
                    data-active={on}
                    style={{ ['--c' as string]: e.c } as CSSProperties}
                    onClick={() => set('experience', e.id)}
                    aria-pressed={on}>
              <span className="ob-exp-tag">{e.yearsLabel}</span>
              <span className="ob-exp-title">{e.title}</span>
              <span className="ob-exp-sub">{e.sub}</span>
              {on && (
                <span className="ob-exp-check" aria-hidden="true">
                  <Icon name="check" size={12} stroke={2.4}/>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {isHO && (
        <div className="ob-1rm">
          <div className="ob-1rm-head">
            <span>Tu 1RM en clásicos · opcional</span>
            <span className="ob-1rm-skip">Saltá si no sabés</span>
          </div>

          <Slider
            id="ob-1rm-sn"
            label="Snatch · arranque"
            unit="kg"
            min={20}
            max={200}
            step={5}
            value={data.oneRmSnatch ?? 60}
            onChange={(v) => set('oneRmSnatch', v)}
            accent="#FBBF24"/>

          <Slider
            id="ob-1rm-cj"
            label="Clean & Jerk · envión"
            unit="kg"
            min={20}
            max={250}
            step={5}
            value={data.oneRmCleanJerk ?? 80}
            onChange={(v) => set('oneRmCleanJerk', v)}
            accent="#F97316"/>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Step 4 · Objetivos + coach
// ============================================================
function Step4({ data, set }: { data: OnboardingPayload; set: <K extends keyof OnboardingPayload>(k: K, v: OnboardingPayload[K]) => void }) {
  const toggleGoal = (g: Goal) => {
    if (data.goals.includes(g)) set('goals', data.goals.filter(x => x !== g));
    else set('goals', [...data.goals, g]);
  };

  const onCoachCode = (raw: string) => {
    const clean = raw.replace(/\D/g, '').slice(0, 6);
    set('coachCode', clean);
  };

  return (
    <div className="ob-step">
      <h2 className="ob-step-title">Qué buscás?</h2>
      <p className="ob-step-sub">Elegí uno o más · ajustamos el foco del plan.</p>

      <div className="ob-goals">
        {GOALS.map(g => {
          const on = data.goals.includes(g.id);
          return (
            <button key={g.id}
                    type="button"
                    className="ob-goal"
                    data-active={on}
                    style={{ ['--c' as string]: g.c } as CSSProperties}
                    onClick={() => toggleGoal(g.id)}
                    aria-pressed={on}>
              <span className="ob-goal-check" aria-hidden="true">
                {on && <Icon name="check" size={12} stroke={2.4}/>}
              </span>
              <span className="ob-goal-text">
                <span className="ob-goal-label">{g.label}</span>
                <span className="ob-goal-desc">{g.desc}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="ob-coach">
        <div className="ob-coach-row">
          <div className="ob-toggle-text">
            <span className="ob-toggle-label">Tengo coach asignado</span>
            <span className="ob-toggle-desc">Si tenés código · linkeamos cuenta.</span>
          </div>
          <button type="button"
                  className="ob-toggle"
                  data-on={data.hasCoach}
                  role="switch"
                  aria-checked={data.hasCoach}
                  onClick={() => set('hasCoach', !data.hasCoach)}>
            <span className="knob"/>
          </button>
        </div>

        {data.hasCoach && (
          <div className="ob-coach-code">
            <label htmlFor="ob-coach-code">Código del coach · 6 dígitos</label>
            <div className="ob-coach-code-input">
              <input
                id="ob-coach-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={data.coachCode}
                onChange={(e) => onCoachCode(e.target.value)}/>
              <div className="ob-coach-code-dots" aria-hidden="true">
                {[0, 1, 2, 3, 4, 5].map(i => (
                  <span key={i} className={`dot ${data.coachCode.length > i ? 'on' : ''}`}/>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Main · Wizard
// ============================================================
export default function OnboardingV3(): ReactElement {
  const { navigate, back } = useNav();
  // Hardcoded · en real lee de ProductContext
  const product: ProductCtx = useMemo<ProductCtx>(() => {
    try {
      const p = localStorage.getItem('product:current');
      return p === 'volta' ? 'volta' : 'holy-oly';
    } catch {
      return 'holy-oly';
    }
  }, []);
  const isHO = product === 'holy-oly';

  const [step, setStep] = useState<number>(1);
  const [maxReached, setMaxReached] = useState<number>(1);
  const [saving, setSaving] = useState(false);

  const [data, setData] = useState<OnboardingPayload>(() => {
    let name = '';
    try {
      const stored = localStorage.getItem('rg:registered');
      if (stored) name = (JSON.parse(stored).name ?? '') as string;
    } catch { /* ignore */ }
    return {
      name,
      birthDate: '',
      gender: 'na',
      hormonalOptIn: false,
      heightCm: 175,
      weightKg: 75,
      weightUnit: 'kg',
      experience: null,
      goals: [],
      hasCoach: false,
      coachCode: '',
    };
  });

  const set = <K extends keyof OnboardingPayload>(k: K, v: OnboardingPayload[K]) => {
    setData(prev => ({ ...prev, [k]: v }));
  };

  // Step validation
  const canAdvance = useMemo(() => {
    if (step === 1) {
      return data.name.trim().length >= 2 && data.birthDate.length > 0 && data.gender !== undefined;
    }
    if (step === 2) {
      return data.heightCm >= 140 && data.weightKg >= 40;
    }
    if (step === 3) {
      return data.experience !== null;
    }
    if (step === 4) {
      const goalsOk = data.goals.length >= 1;
      const coachOk = !data.hasCoach || data.coachCode.length === 6;
      return goalsOk && coachOk;
    }
    return false;
  }, [step, data]);

  // Touch / swipe handling
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0 && canAdvance && step < TOTAL_STEPS) goNext();
      else if (dx > 0 && step > 1) goPrev();
    }
    touchStart.current = null;
  };

  const goNext = () => {
    if (step >= TOTAL_STEPS) return;
    const next = step + 1;
    setStep(next);
    setMaxReached(m => Math.max(m, next));
  };
  const goPrev = () => {
    if (step <= 1) return;
    setStep(step - 1);
  };
  const goToStep = (s: number) => {
    if (s <= maxReached) setStep(s);
  };

  const onFinish = async () => {
    setSaving(true);
    try {
      // Mock: localStorage save
      // API real: POST /v1/users/onboarding { ...data }
      try {
        localStorage.setItem('ob:payload', JSON.stringify({ ...data, product, at: Date.now() }));
        localStorage.setItem('ob:done', '1');
      } catch { /* ignore */ }
      await new Promise(r => setTimeout(r, 500));
      // Final step · navigate al hub demo
      navigate('DEMO_HUB');
    } finally {
      setSaving(false);
    }
  };

  // Reset experience-related 1RM defaults · cuando cambia experiencia · opcional
  useEffect(() => {
    if (data.experience && data.oneRmSnatch === undefined && isHO) {
      // Pre-load defaults sólo si HO + sin valor previo
      const defaults: Record<Experience, { sn: number; cj: number }> = {
        principiante: { sn: 40, cj: 60 },
        intermedio:   { sn: 70, cj: 90 },
        avanzado:     { sn: 95, cj: 120 },
        elite:        { sn: 130, cj: 160 },
      };
      const d = defaults[data.experience];
      setData(prev => ({ ...prev, oneRmSnatch: d.sn, oneRmCleanJerk: d.cj }));
    }
  }, [data.experience, data.oneRmSnatch, isHO]);

  const ctaLabel = step === TOTAL_STEPS ? 'EMPEZAR' : 'CONTINUAR';
  const isFinalStep = step === TOTAL_STEPS;
  const productAccent = isHO ? '#EF4444' : '#00E5FF';

  return (
    <div className="ob-root"
         data-step={step}
         data-product={product}
         style={{ ['--p-c' as string]: productAccent } as CSSProperties}>
      <header className="ob-header">
        <button type="button"
                className="ob-back"
                onClick={step === 1 ? back : goPrev}
                aria-label={step === 1 ? 'Volver al register' : 'Paso anterior'}>
          <Icon name="back" size={14}/>
        </button>
        <div className="ob-progress" role="tablist" aria-label="Progreso onboarding">
          {[1, 2, 3, 4].map(n => (
            <button key={n}
                    type="button"
                    role="tab"
                    aria-selected={step === n}
                    aria-label={`Paso ${n}`}
                    className="ob-progress-dot"
                    data-active={step === n}
                    data-done={n < step}
                    data-reachable={n <= maxReached}
                    onClick={() => goToStep(n)}
                    disabled={n > maxReached}/>
          ))}
        </div>
        <div className="ob-step-counter">
          <span className="num">{step}</span>
          <span className="sep">/</span>
          <span className="total">{TOTAL_STEPS}</span>
        </div>
      </header>

      <div className="ob-stage"
           onTouchStart={onTouchStart}
           onTouchEnd={onTouchEnd}>
        <div className="ob-slider-track" style={{ transform: `translateX(${-(step - 1) * 100}%)` } as CSSProperties}>
          <div className="ob-slide" aria-hidden={step !== 1}>
            <Step1 data={data} set={set}/>
          </div>
          <div className="ob-slide" aria-hidden={step !== 2}>
            <Step2 data={data} set={set}/>
          </div>
          <div className="ob-slide" aria-hidden={step !== 3}>
            <Step3 data={data} set={set} isHO={isHO}/>
          </div>
          <div className="ob-slide" aria-hidden={step !== 4}>
            <Step4 data={data} set={set}/>
          </div>
        </div>
      </div>

      <footer className="ob-footer">
        {step > 1 && (
          <button type="button" className="ob-cta-back" onClick={goPrev}>
            <Icon name="back" size={12}/>
            <span>Atrás</span>
          </button>
        )}
        <button type="button"
                className="ob-cta"
                data-final={isFinalStep}
                disabled={!canAdvance || saving}
                onClick={() => { if (isFinalStep) onFinish(); else goNext(); }}>
          {saving ? (
            <span>Guardando…</span>
          ) : (
            <>
              <span>{ctaLabel}</span>
              <Icon name="arrow" size={14} stroke={2.2}/>
            </>
          )}
        </button>
      </footer>
    </div>
  );
}
