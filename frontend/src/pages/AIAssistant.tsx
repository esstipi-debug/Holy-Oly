import { useState, useRef, useEffect } from 'react';
import { useAthlete } from '../context/AthleteContext';
import { useAuth } from '../context/AuthContext';
import { loginRequest } from '../lib/api';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  category?: string;
  context_used?: string;
  model?: string;
  error?: boolean;
};

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

function getToken() {
  const t = localStorage.getItem('token');
  return t && t !== 'demo' ? t : null;
}

export default function AIAssistant() {
  const { athlete } = useAthlete();
  const { login } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [userType, setUserType] = useState<'athlete' | 'coach'>('athlete');
  const [model, setModel] = useState('flash-latest');
  const [loading, setLoading] = useState(false);
  const [authOk, setAuthOk] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-login con mock user si el token no es válido
  useEffect(() => {
    const t = getToken();
    if (t) { setAuthOk(true); return; }
    login('user@example.com', 'password123')
      .then(() => setAuthOk(true))
      .catch(() => {
        loginRequest('user@example.com', 'password123')
          .then(data => {
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setAuthOk(true);
          })
          .catch(e => console.warn('Auto-login failed:', e));
      });
  }, []);

  async function send() {
    if (!input.trim() || loading) return;
    if (!authOk) {
      setMessages(prev => [...prev, { role: 'assistant', content: '⏳ Conectando con el servidor...', error: true }]);
      return;
    }
    const q = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setLoading(true);

    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/v1/agent/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          user_id: athlete?.id ?? 'guest',
          user_type: userType,
          query: q,
          model,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Backend error ${res.status}: ${errText}`);
      }

      const data = await res.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response ?? 'Sin respuesta',
        category: data.category,
        context_used: data.context_used,
        model: data.model,
      }]);
    } catch (e: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${e.message}`,
        error: true,
      }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%', padding: '0 0 80px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--card-border)', background: 'var(--surface)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text)', margin: 0 }}>RAG AI Assistant</h2>
        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
          API: {API_URL}
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '8px', padding: '12px 20px', borderBottom: '1px solid var(--card-border)', background: 'var(--surface)', flexWrap: 'wrap' }}>
        <select
          value={userType}
          onChange={e => setUserType(e.target.value as 'athlete' | 'coach')}
          style={{ flex: 1, minWidth: '120px', padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '12px', fontWeight: 600 }}
        >
          <option value="athlete">Atleta</option>
          <option value="coach">Coach</option>
        </select>
        <select
          value={model}
          onChange={e => setModel(e.target.value)}
          style={{ flex: 1, minWidth: '140px', padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '12px', fontWeight: 600 }}
        >
          <option value="flash-latest">Flash Latest (auto)</option>
          <option value="flash-lite">Flash Lite 2.0</option>
          <option value="flash-2.5">Flash 2.5 Preview</option>
          <option value="flash">Flash 2.0</option>
          <option value="pro">Pro 2.5</option>
        </select>
      </div>

      {/* Chat */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)', fontSize: '13px' }}>
            Hacé una pregunta para probar el RAG.<br />
            Ej: "¿Cómo mejorar mi snatch?" o "Diseñá una rutina"
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '85%',
              padding: '10px 14px',
              borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: m.role === 'user' ? 'var(--primary)' : m.error ? 'rgba(239,68,68,0.1)' : 'var(--card-bg)',
              color: m.role === 'user' ? '#fff' : m.error ? '#ef4444' : 'var(--text)',
              fontSize: '13px',
              lineHeight: 1.5,
              border: m.role === 'assistant' ? '1px solid var(--card-border)' : 'none',
            }}>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{m.content}</p>
              {m.role === 'assistant' && !m.error && (m.category || m.model) && (
                <div style={{ marginTop: '8px', fontSize: '10px', color: 'var(--text-secondary)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {m.category && <span style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px' }}>{m.category}</span>}
                  {m.model && <span style={{ background: 'rgba(99,102,241,0.1)', color: '#6366F1', padding: '2px 6px', borderRadius: '4px' }}>{m.model}</span>}
                </div>
              )}
              {m.role === 'assistant' && m.context_used && (
                <details style={{ marginTop: '8px', fontSize: '10px', color: 'var(--text-secondary)' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Contexto RAG</summary>
                  <pre style={{ whiteSpace: 'pre-wrap', margin: '6px 0 0', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', fontSize: '9px', lineHeight: 1.4 }}>{m.context_used}</pre>
                </details>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '10px 14px', borderRadius: '16px 16px 16px 4px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Pensando...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px 20px', borderTop: '1px solid var(--card-border)', background: 'var(--surface)', display: 'flex', gap: '8px' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
          placeholder="Escribí tu pregunta..."
          style={{ flex: 1, padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px', outline: 'none' }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          style={{
            padding: '10px 18px',
            borderRadius: '12px',
            background: loading || !input.trim() ? 'var(--card-border)' : 'var(--primary)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '13px',
            border: 'none',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
