import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNav } from '../context/NavigationContext';
import { useProduct } from '../context/ProductContext';

interface LoginProps {
  onSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const { login, loginWithGithub, enterDemoMode, backendAlive } = useAuth();
  const { navigate } = useNav();
  const { product } = useProduct();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const accent = product === 'volta' ? '#00E5FF' : '#22C55E';

  const handleSubmit = async () => {
    if (!email || !password) return;
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      onSuccess();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="anim-fade-in" style={{
      display: 'flex', flexDirection: 'column', minHeight: '100%',
      background: 'var(--bg)', padding: '60px 24px 28px', justifyContent: 'center',
    }}>
      {/* HEADER */}
      <div style={{ textAlign: 'center', marginBottom: 38 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: `linear-gradient(135deg, ${accent}, ${product === 'volta' ? '#0070FF' : '#3B82F6'})`,
          margin: '0 auto 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 30,
          boxShadow: `0 10px 38px ${accent}40`,
        }}>{product === 'volta' ? '⚡' : '🏋️'}</div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)', letterSpacing: '-.02em' }}>
          {product === 'volta' ? 'VOLTA' : 'HOLY OLY'}
        </h1>
        <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', marginTop: 6 }}>
          Smart training · Zero burnout
        </p>
      </div>

      {/* BACKEND STATUS */}
      {backendAlive === false && (
        <div style={{
          marginBottom: 14, padding: '10px 14px', borderRadius: 12,
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
          fontSize: 11, color: '#fbbf24', lineHeight: 1.4,
        }}>
          ⚠ Servidor no disponible. Podés entrar en <strong>modo Demo</strong> para explorar la app.
        </div>
      )}

      {/* FORM */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--card-border)',
        borderRadius: 18, padding: 18, marginBottom: 14,
      }}>
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 6 }}>
            Email
          </p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            style={{
              width: '100%', padding: '13px 14px',
              background: 'var(--bg)', border: '1px solid var(--card-border)',
              borderRadius: 12, fontSize: 14, color: 'var(--text)',
              fontFamily: 'inherit', outline: 'none',
            }}
            autoComplete="email"
          />
        </div>
        <div>
          <p style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 6 }}>
            Contraseña
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="••••••••"
            style={{
              width: '100%', padding: '13px 14px',
              background: 'var(--bg)', border: '1px solid var(--card-border)',
              borderRadius: 12, fontSize: 14, color: 'var(--text)',
              fontFamily: 'inherit', outline: 'none',
            }}
            autoComplete="current-password"
          />
        </div>
      </div>

      {error && (
        <div style={{
          padding: '10px 14px', borderRadius: 12, marginBottom: 12,
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
          fontSize: 11, color: '#f87171', fontWeight: 600,
        }}>{error}</div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || !email || !password}
        style={{
          width: '100%', padding: '14px 0', borderRadius: 14,
          background: accent, color: '#07070F', border: 'none',
          fontSize: 14, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
          cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit',
          opacity: (loading || !email || !password) ? 0.6 : 1,
          boxShadow: `0 6px 20px ${accent}30`,
          marginBottom: 10,
        }}
      >{loading ? 'Entrando…' : 'Entrar →'}</button>

      <button
        onClick={() => navigate('REGISTER')}
        style={{
          width: '100%', padding: '12px 0', borderRadius: 14,
          background: 'transparent', color: 'var(--text)',
          border: '1px solid var(--card-border)',
          fontSize: 12, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase',
          cursor: 'pointer', fontFamily: 'inherit',
          marginBottom: 12,
        }}
      >Crear cuenta nueva</button>

      <button
        onClick={loginWithGithub}
        style={{
          width: '100%', padding: '12px 0', borderRadius: 14,
          background: 'rgba(255,255,255,0.08)', color: 'var(--text)',
          border: '1px solid var(--card-border)',
          fontSize: 12, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase',
          cursor: 'pointer', fontFamily: 'inherit',
          marginBottom: 18,
        }}
      >🔗 Entrar con GitHub</button>

      <div style={{ textAlign: 'center' }}>
        <button
          onClick={() => { enterDemoMode(); onSuccess(); }}
          style={{
            fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600,
            background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            textDecoration: 'underline',
          }}
        >
          Entrar en modo Demo (sin backend)
        </button>
      </div>

      <p style={{ textAlign: 'center', fontSize: 9, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', marginTop: 24 }}>
        v1.0.0-alpha
      </p>
    </div>
  );
};

export default Login;
