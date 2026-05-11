import React, { useState, useRef, useEffect } from 'react';
import { useRole } from '../context/RoleContext';
import { useProduct } from '../context/ProductContext';

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

type Msg = { role: 'user' | 'wise'; content: string; ts: number };

// Stub respuestas WISE — pattern matching simple hasta que se conecte al backend
function wiseReply(q: string, ctx: string): string {
  const lower = q.toLowerCase();
  if (lower.includes('marco') && (lower.includes('hrv') || lower.includes('cómo está'))) {
    return `Marco Torres tiene HRV crítico (-1.8σ del baseline) hace 3 días. Recomendación: WOD modificado al 80% o descanso activo. Su Wise Score subiría +50 con un rest day vs +30 con WOD modificado.`;
  }
  if (lower.includes('wod') && (lower.includes('crear') || lower.includes('hacer') || lower.includes('hoy'))) {
    return `Para el box hoy te sugiero: AMRAP 20min con 5 C&J · 10 Pull-ups · 15 Box Jumps. Con 1 atleta en HRV crítico (Marco) y 2 en watch, escalá a 80% para esos 3. Los otros 3 pueden ir Rx. ¿Te lo armo en el planificador?`;
  }
  if (lower.includes('macro') || lower.includes('periodiz')) {
    return `Estás en semana 4/8 del bloque Conditioning. Adherencia promedio: 71%. Pablo Iglesias está en 38% — riesgo de salir del bloque. Sugerencia: 1:1 esta semana o reasignar a un macrociclo más liviano.`;
  }
  if (lower.includes('lesion') || lower.includes('riesgo')) {
    return `Atletas en riesgo: Marco (HRV crítico), Pablo (V-Form rojo + HRV bajo). Diego en watch (HRV amber). Nadie con lesión activa registrada. Activá Injury Shield si Pablo no mejora en 48h.`;
  }
  if (lower.includes('comparar') || lower.includes('vs')) {
    return `Decime los 2-3 atletas que querés comparar y armo la tabla con: CF Index, V-Form, HRV, adherencia, último PR.`;
  }
  if (lower.includes('hola') || lower.includes('hey') || lower.includes('buenas')) {
    return `Hey coach. Estoy mirando ${ctx}. ¿Necesitás revisar a alguien, planificar el WOD de hoy o ver tendencias del box?`;
  }
  if (lower.includes('top') || lower.includes('mejor')) {
    return `Top 3 esta semana: Camila Vega (CF 89, adherencia 94%), Lucía Ramos (CF 81, 88%), Sofía Méndez (CF 76, 71%). Camila lleva PR Snatch +3kg.`;
  }
  return `Tengo el contexto del box y los 6 atletas activos. Puedo ayudarte con: estado de un atleta, sugerir WOD del día, revisar macrociclo, detectar riesgos, comparar atletas o resumir tendencias. ¿Por dónde arrancamos?`;
}

const SUGGESTIONS_COACH = [
  '¿Cómo está Marco?',
  'Sugerí el WOD de hoy',
  'Atletas en riesgo',
  'Top performers semana',
];

const SUGGESTIONS_ATHLETE_HO = [
  '¿Estoy listo para entrenar?',
  '¿Cómo voy con la arrancada?',
  'Tip de técnica',
  'Plan de la semana',
];

const SUGGESTIONS_ATHLETE_VOLTA = [
  '¿Cómo está mi HRV?',
  'Sugerí escalado para hoy',
  'Mi progreso del mes',
  'Próximo nivel · pull-ups',
];

function wiseGreeting(role: 'atleta' | 'coach', product: 'holy-oly' | 'volta'): string {
  if (role === 'coach') {
    return `Hey coach. Soy WISE, tu asistente del box. Tengo el contexto de los 6 atletas activos, el WOD de hoy y el macrociclo en curso. ¿En qué te ayudo?`;
  }
  if (product === 'volta') {
    return `Hola. Soy WISE, tu asistente. Te ayudo a leer tu HRV, escalar el WOD del día y trackear progresión. ¿Por dónde arrancamos?`;
  }
  return `Hola. Soy WISE, tu asistente. Conozco tu macrociclo, tus máximos y tu readiness. Preguntame si te conviene cargar hoy o necesitás tip técnico.`;
}

interface Props {
  context?: string; // ej. "Volta Coach · WOD Builder"
}

const WiseAssistant: React.FC<Props> = ({ context = 'Volta Coach' }) => {
  const { role } = useRole();
  const { product } = useProduct();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestions = role === 'coach'
    ? SUGGESTIONS_COACH
    : (product === 'volta' ? SUGGESTIONS_ATHLETE_VOLTA : SUGGESTIONS_ATHLETE_HO);

  useEffect(() => {
    if (open && msgs.length === 0) {
      setTimeout(() => {
        setMsgs([{
          role: 'wise',
          content: wiseGreeting(role, product),
          ts: Date.now(),
        }]);
      }, 200);
    }
  }, [open, msgs.length, role, product]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, typing]);

  const send = (text: string) => {
    const q = text.trim();
    if (!q) return;
    const userMsg: Msg = { role: 'user', content: q, ts: Date.now() };
    setMsgs(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);
    // Simular delay de pensamiento
    const delay = 600 + Math.random() * 800;
    setTimeout(() => {
      setMsgs(prev => [...prev, { role: 'wise', content: wiseReply(q, context), ts: Date.now() }]);
      setTyping(false);
    }, delay);
  };

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'absolute', bottom: 96, right: 16, zIndex: 55,
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, #00E676 0%, #00E5FF 100%)',
          boxShadow: '0 0 0 3px rgba(0,230,118,0.15), 0 0 28px rgba(0,229,255,0.4), 0 8px 24px rgba(0,0,0,0.5)',
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
              boxShadow: '0 -12px 40px rgba(0,229,255,0.15)',
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
                  background: 'linear-gradient(135deg, #00E676, #00E5FF)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 16px rgba(0,229,255,0.4)',
                }}>
                  <span style={{ fontSize: 14, lineHeight: 1 }}>✦</span>
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 900, color: C.text, letterSpacing: '.02em' }}>WISE</p>
                  <p style={{ fontSize: 9, color: C.green, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                    ● {context}
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
                      background: 'linear-gradient(135deg, #00E676, #00E5FF)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, fontSize: 12,
                    }}>✦</div>
                  )}
                  <div style={{
                    maxWidth: '78%',
                    padding: '10px 13px',
                    background: m.role === 'user' ? C.cyan : C.surface,
                    color: m.role === 'user' ? '#07070F' : C.text,
                    border: m.role === 'user' ? 'none' : `1px solid ${C.line}`,
                    borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                    fontSize: 12, lineHeight: 1.5, fontWeight: m.role === 'user' ? 600 : 400,
                    whiteSpace: 'pre-wrap',
                  }}>{m.content}</div>
                </div>
              ))}
              {typing && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #00E676, #00E5FF)',
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
                        background: C.cyan, opacity: 0.4,
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
                      background: 'rgba(0,229,255,0.08)', color: C.cyan,
                      border: '1px solid rgba(0,229,255,0.25)',
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
                placeholder="Preguntale a WISE…"
                style={{
                  flex: 1, padding: '12px 14px',
                  background: C.surface, border: `1px solid ${C.line}`,
                  borderRadius: 14, fontSize: 13, color: C.text,
                  fontFamily: 'inherit', outline: 'none',
                }}
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || typing}
                style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: input.trim() && !typing ? 'linear-gradient(135deg, #00E676, #00E5FF)' : C.surface,
                  color: input.trim() && !typing ? '#07070F' : C.muted,
                  border: input.trim() && !typing ? 'none' : `1px solid ${C.line}`,
                  fontSize: 16, fontWeight: 900,
                  cursor: input.trim() && !typing ? 'pointer' : 'not-allowed',
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
