import React, { useState, useRef, useEffect } from 'react';
import { useRole } from '../context/RoleContext';
import { useProduct } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import { pickPhrase } from '../data/wisePhrases';

const C = {
  cyan: '#00E5FF',
  green: '#00E676',
  bg: '#07070F',
  surface: '#0F0F1C',
  surface2: '#161626',
  line: '#1E1E32',
  text: '#EAEAF5',
  muted: '#52527A',
};

type Msg = {
  role: 'user' | 'wise';
  content: string;
  phrase?: string | null;
  level?: 'llm' | 'lite' | 'local';
  ts: number;
};

// API base (mismo patrón que lib/api.ts)
const API_URL =
  (import.meta as any).env?.VITE_API_URL ??
  ((import.meta as any).env?.DEV ? '' : 'https://holy-oly-3.onrender.com');

// Tier limits — el spec menciona 5 mensajes/semana en FREE
const FREE_WEEKLY_LIMIT = 5;
const QUOTA_KEY = 'wise.quota.v1';

interface QuotaState {
  weekStart: number; // timestamp del lunes de la semana
  count: number;
}

function getWeekStart(): number {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // lunes=0
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d.getTime();
}

function loadQuota(): QuotaState {
  try {
    const raw = localStorage.getItem(QUOTA_KEY);
    if (raw) {
      const q = JSON.parse(raw) as QuotaState;
      if (q.weekStart === getWeekStart()) return q;
    }
  } catch {
    /* ignore */
  }
  return { weekStart: getWeekStart(), count: 0 };
}

function saveQuota(q: QuotaState) {
  try {
    localStorage.setItem(QUOTA_KEY, JSON.stringify(q));
  } catch {
    /* ignore */
  }
}

const SUGGESTIONS_COACH = [
  '¿Cómo está el box hoy?',
  'Sugerí el WOD de hoy',
  'Atletas en riesgo',
  'Top performers semana',
];

const SUGGESTIONS_ATHLETE_HO = [
  '¿Estoy listo para entrenar?',
  '¿Cómo voy con la arrancada?',
  'Tip de técnica',
  'Estoy cansado, ¿qué hago?',
];

const SUGGESTIONS_ATHLETE_VOLTA = [
  '¿Cómo está mi HRV?',
  'Sugerí escalado para hoy',
  'Tip para mi snatch',
  'Estoy cansado',
];

function wiseGreeting(role: 'atleta' | 'coach', product: 'holy-oly' | 'volta', name?: string): string {
  const who = name ? `, ${name}` : '';
  if (role === 'coach') {
    return `Hey coach${who}. Soy WISE. Tengo el contexto del box, los atletas activos y el WOD del día. ¿En qué te ayudo?`;
  }
  if (product === 'volta') {
    return `Hola${who}. Soy WISE. Te leo el HRV, te escalo el WOD y trackeo progresión. ¿Por dónde arrancamos?`;
  }
  return `Hola${who}. Soy WISE. Conozco tu macrociclo, tus máximos y tu readiness. ¿Te conviene cargar hoy o necesitás tip técnico?`;
}

interface Props {
  context?: string;
  bottomOffset?: number;
  /** Datos del atleta para pasar al backend (HRV, racha, etc). Opcional. */
  athleteContext?: {
    name?: string;
    sport?: string;
    streak_days?: number;
    hrv?: number;
    hrv_baseline?: number;
    sleep_hours?: number;
    vform_color?: 'green' | 'yellow' | 'red';
    belt?: string;
    last_pr?: string;
    macro_block?: string;
  };
}

const WiseAssistant: React.FC<Props> = ({
  context = 'Volta Coach',
  bottomOffset = 96,
  athleteContext,
}) => {
  const { role } = useRole();
  const { product } = useProduct();
  const { user, token } = useAuth();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [quota, setQuota] = useState<QuotaState>(loadQuota);
  const scrollRef = useRef<HTMLDivElement>(null);

  const tier = (user as any)?.tier as string | undefined;
  const isFree = !tier || tier === 'trial' || tier === 'free';
  const remaining = isFree ? Math.max(0, FREE_WEEKLY_LIMIT - quota.count) : Infinity;

  const suggestions = role === 'coach'
    ? SUGGESTIONS_COACH
    : (product === 'volta' ? SUGGESTIONS_ATHLETE_VOLTA : SUGGESTIONS_ATHLETE_HO);

  const brandGradient = product === 'volta'
    ? 'linear-gradient(135deg, #00E676 0%, #00E5FF 100%)'
    : 'linear-gradient(135deg, #FFD700 0%, #B8860B 100%)';
  const brandShadow = product === 'volta'
    ? '0 0 0 3px rgba(0,230,118,0.15), 0 0 28px rgba(0,229,255,0.4), 0 8px 24px rgba(0,0,0,0.5)'
    : '0 0 0 3px rgba(255,215,0,0.18), 0 0 28px rgba(255,215,0,0.4), 0 8px 24px rgba(0,0,0,0.5)';
  const brandAccent = product === 'volta' ? C.cyan : '#FFD700';
  const brandAccentRgb = product === 'volta' ? '0,229,255' : '255,215,0';
  const brandStatusColor = product === 'volta' ? C.green : '#FFD700';
  const brandPanelShadow = product === 'volta'
    ? '0 -12px 40px rgba(0,229,255,0.15)'
    : '0 -12px 40px rgba(255,215,0,0.15)';

  useEffect(() => {
    if (open && msgs.length === 0) {
      setTimeout(() => {
        setMsgs([{
          role: 'wise',
          content: wiseGreeting(role, product, user?.name),
          ts: Date.now(),
        }]);
      }, 200);
    }
  }, [open, msgs.length, role, product, user?.name]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, typing]);

  const localFallback = (q: string): Msg => {
    // Fallback de último recurso si el backend cae completamente
    const lq = q.toLowerCase();
    let answer = `Estoy con vos. Decime qué pasa con el entreno y te ayudo concreto.`;
    let phraseCtx: Parameters<typeof pickPhrase>[0] = 'default';

    if (lq.includes('cansado') || lq.includes('fatig')) {
      answer = 'Si estás cansado escuchá. Movilidad + zona 1, 30min. Mañana revisás HRV.';
      phraseCtx = 'tired';
    } else if (lq.includes('hrv') || lq.includes('listo')) {
      if (athleteContext?.vform_color === 'red') {
        answer = 'V-Form rojo. Hoy es descanso o técnica al 60%.';
        phraseCtx = 'vform_red';
      } else if (athleteContext?.vform_color === 'yellow') {
        answer = 'V-Form amarillo. Trabajá al 80%, foco en técnica.';
        phraseCtx = 'vform_yellow';
      } else {
        answer = 'Sin datos claros de HRV, asumí día normal. Calentá y leé las primeras series.';
      }
    } else if (lq.includes('snatch') || lq.includes('arrancad')) {
      answer = 'Foco en primera tracción lenta, segunda explosiva. Complejo snatch pull + hang snatch + snatch al 75%, 4x3.';
    } else if (lq.includes('streak') || lq.includes('racha')) {
      phraseCtx = 'streak';
    }

    return {
      role: 'wise',
      content: answer,
      phrase: pickPhrase(phraseCtx, {
        name: user?.name,
        streak: athleteContext?.streak_days,
      }),
      level: 'local',
      ts: Date.now(),
    };
  };

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || typing) return;

    // Quota check FREE tier
    if (isFree && remaining <= 0) {
      setMsgs(prev => [
        ...prev,
        { role: 'user', content: q, ts: Date.now() },
        {
          role: 'wise',
          content: `Llegaste al límite de ${FREE_WEEKLY_LIMIT} mensajes/semana del plan FREE. Subí a PRO para WISE ilimitado.`,
          ts: Date.now(),
        },
      ]);
      setInput('');
      return;
    }

    setMsgs(prev => [...prev, { role: 'user', content: q, ts: Date.now() }]);
    setInput('');
    setTyping(true);

    // Update quota
    if (isFree) {
      const next = { ...quota, count: quota.count + 1 };
      setQuota(next);
      saveQuota(next);
    }

    try {
      const res = await fetch(`${API_URL}/v1/wise/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          question: q,
          athlete_id: user?.id,
          name: user?.name,
          role: role === 'coach' ? 'coach' : 'athlete',
          product,
          tier,
          ...(athleteContext ?? {}),
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as {
        answer: string;
        phrase?: string | null;
        level: 'llm' | 'lite';
      };

      setMsgs(prev => [
        ...prev,
        {
          role: 'wise',
          content: data.answer,
          phrase: data.phrase ?? null,
          level: data.level,
          ts: Date.now(),
        },
      ]);
    } catch (err) {
      console.warn('[WISE] backend fail, using local fallback', err);
      setMsgs(prev => [...prev, localFallback(q)]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'absolute', bottom: bottomOffset, right: 16, zIndex: 55,
          width: 56, height: 56, borderRadius: '50%',
          background: brandGradient,
          boxShadow: brandShadow,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          transition: 'transform .15s ease',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
        aria-label="Abrir WISE"
      >
        <span style={{ fontSize: 18, lineHeight: 1 }}>✦</span>
        <span style={{ fontSize: 8, fontWeight: 900, color: '#07070F', letterSpacing: '.08em', marginTop: 1 }}>WISE</span>
      </button>

      {/* Panel */}
      {open && (
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 100,
            background: 'rgba(7,7,15,0.6)', backdropFilter: 'blur(6px)',
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          }}
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: C.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28,
              border: `1px solid ${C.line}`, borderBottom: 'none',
              height: '78%', display: 'flex', flexDirection: 'column',
              boxShadow: brandPanelShadow,
            }}
          >
            {/* HEADER */}
            <div style={{
              padding: '16px 18px 14px',
              borderBottom: `1px solid ${C.line}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: brandGradient,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 16px rgba(0,229,255,0.4)',
                }}>
                  <span style={{ fontSize: 14, lineHeight: 1 }}>✦</span>
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 900, color: C.text, letterSpacing: '.02em' }}>WISE</p>
                  <p style={{ fontSize: 9, color: brandStatusColor, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                    ● {context}
                    {isFree && ` · ${remaining} / ${FREE_WEEKLY_LIMIT}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: C.surface, border: `1px solid ${C.line}`,
                  color: C.text, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >×</button>
            </div>

            {/* MESSAGES */}
            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
              {msgs.map((m, i) => (
                <div key={i} style={{
                  display: 'flex', flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
                  marginBottom: 12, gap: 8,
                }}>
                  {m.role === 'wise' && (
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: brandGradient,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, fontSize: 12,
                    }}>✦</div>
                  )}
                  <div style={{ maxWidth: '78%', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{
                      padding: '10px 13px',
                      background: m.role === 'user' ? brandAccent : C.surface,
                      color: m.role === 'user' ? '#07070F' : C.text,
                      border: m.role === 'user' ? 'none' : `1px solid ${C.line}`,
                      borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                      fontSize: 12, lineHeight: 1.5, fontWeight: m.role === 'user' ? 600 : 400,
                      whiteSpace: 'pre-wrap',
                    }}>{m.content}</div>
                    {m.phrase && (
                      <div style={{
                        padding: '8px 12px',
                        background: `rgba(${brandAccentRgb},0.08)`,
                        border: `1px dashed rgba(${brandAccentRgb},0.35)`,
                        borderRadius: 12,
                        fontSize: 11,
                        lineHeight: 1.45,
                        color: brandAccent,
                        fontStyle: 'italic',
                        fontWeight: 600,
                      }}>
                        “{m.phrase}”
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {typing && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: brandGradient,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12,
                  }}>✦</div>
                  <div style={{
                    padding: '12px 14px',
                    background: C.surface, border: `1px solid ${C.line}`,
                    borderRadius: '4px 16px 16px 16px',
                    display: 'flex', gap: 4,
                  }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: brandAccent, opacity: 0.4,
                        animation: `ring-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SUGGESTIONS */}
            {msgs.length <= 1 && !typing && (
              <div className="scroll-x-no-bar" style={{
                display: 'flex', gap: 6, padding: '0 16px 10px',
                overflowX: 'auto',
              }}>
                {suggestions.map(s => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    style={{
                      flexShrink: 0, padding: '7px 12px', borderRadius: 16,
                      background: `rgba(${brandAccentRgb},0.08)`, color: brandAccent,
                      border: `1px solid rgba(${brandAccentRgb},0.25)`,
                      fontSize: 11, fontWeight: 700,
                      cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                    }}
                  >{s}</button>
                ))}
              </div>
            )}

            {/* INPUT */}
            <div style={{
              padding: '12px 14px 18px',
              borderTop: `1px solid ${C.line}`,
              display: 'flex', gap: 8, alignItems: 'center',
            }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send(input)}
                placeholder={isFree && remaining <= 0 ? 'Sin mensajes esta semana — pasá a PRO' : 'Preguntale a WISE…'}
                disabled={isFree && remaining <= 0}
                style={{
                  flex: 1, padding: '12px 14px',
                  background: C.surface, border: `1px solid ${C.line}`,
                  borderRadius: 14, fontSize: 13, color: C.text,
                  fontFamily: 'inherit', outline: 'none',
                  opacity: isFree && remaining <= 0 ? 0.5 : 1,
                }}
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || typing || (isFree && remaining <= 0)}
                style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: input.trim() && !typing && remaining > 0 ? brandGradient : C.surface,
                  color: input.trim() && !typing && remaining > 0 ? '#07070F' : C.muted,
                  border: input.trim() && !typing && remaining > 0 ? 'none' : `1px solid ${C.line}`,
                  fontSize: 16, fontWeight: 900,
                  cursor: input.trim() && !typing && remaining > 0 ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit',
                }}
              >→</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WiseAssistant;
