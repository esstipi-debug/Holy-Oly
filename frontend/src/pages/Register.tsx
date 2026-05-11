import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNav } from '../context/NavigationContext';
import { useProduct } from '../context/ProductContext';
import { useRole } from '../context/RoleContext';

const Register: React.FC = () => {
  const { register } = useAuth();
  const { navigate } = useNav();
  const { product, setProduct } = useProduct();
  const { role, setRole } = useRole();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const accent = product === 'volta' ? '#00E5FF' : '#22C55E';

  const handleSubmit = async () => {
    setError('');
    if (!name.trim() || !email.trim() || !password) {
      setError('Completá todos los campos');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      await register(email, password, name, role, product);
      navigate(role === 'coach'
        ? (product === 'volta' ? 'VOLTA_COACH' : 'COACH_DASH')
        : (product === 'volta' ? 'VOLTA_HOME' : 'ONBOARDING'));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al registrarte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', minHeight: '100%',
      background: 'var(--bg)', padding: '40px 24px 24px',
    }}>
      {/* HEADER */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{
          width: 58, height: 58, borderRadius: 18,
          background: `linear-gradient(135deg, ${accent}, ${product === 'volta' ? '#0070FF' : '#3B82F6'})`,
          margin: '0 auto 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26,
          boxShadow: `0 8px 32px ${accent}40`,
        }}>{product === 'volta' ? '⚡' : '🏋️'}</div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text)', letterSpacing: '-.02em' }}>
          {product === 'volta' ? 'VOLTA' : 'HOLY OLY'}
        </h1>
        <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', marginTop: 4 }}>
          Crear cuenta
        </p>
      </div>

      {/* PRODUCT + ROLE SELECTORS */}
      <div style={{ marginBottom: 18 }}>
        <p style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 8 }}>
          Plataforma
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {(['holy-oly', 'volta'] as const).map(p => (
            <button
              key={p}
              onClick={() => setProduct(p)}
              style={{
                flex: 1, padding: '12px 0', borderRadius: 14,
                background: product === p
                  ? (p === 'volta' ? 'linear-gradient(135deg,#00E5FF,#0070FF)' : 'linear-gradient(135deg,#FFD700,#B8860B)')
                  : 'var(--surface)',
                color: product === p ? '#07070F' : 'var(--text-secondary)',
                border: `1px solid ${product === p ? 'transparent' : 'var(--card-border)'}`,
                fontSize: 12, fontWeight: 800, letterSpacing: '.06em',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >{p === 'volta' ? 'VOLTA · CrossFit' : 'HOLY OLY · Halterofilia'}</button>
          ))}
        </div>

        <p style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 8 }}>
          Soy
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['atleta', 'coach'] as const).map(r => (
            <button
              key={r}
              onClick={() => setRole(r)}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 12,
                background: role === r ? accent : 'var(--surface)',
                color: role === r ? '#07070F' : 'var(--text-secondary)',
                border: `1px solid ${role === r ? accent : 'var(--card-border)'}`,
                fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >{r === 'atleta' ? 'Atleta' : 'Coach'}</button>
          ))}
        </div>
      </div>

      {/* FORM */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--card-border)',
        borderRadius: 18, padding: 18, marginBottom: 14,
      }}>
        {[
          { label: 'Nombre completo', type: 'text', value: name, set: setName, placeholder: 'Tu nombre' },
          { label: 'Email', type: 'email', value: email, set: setEmail, placeholder: 'tu@email.com' },
          { label: 'Contraseña (mín. 6)', type: 'password', value: password, set: setPassword, placeholder: '••••••••' },
          { label: 'Confirmar contraseña', type: 'password', value: confirm, set: setConfirm, placeholder: '••••••••' },
        ].map((f, i) => (
          <div key={f.label} style={{ marginBottom: i < 3 ? 14 : 0 }}>
            <p style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 6 }}>
              {f.label}
            </p>
            <input
              type={f.type}
              value={f.value}
              onChange={(e) => f.set(e.target.value)}
              placeholder={f.placeholder}
              onKeyDown={(e) => e.key === 'Enter' && i === 3 && handleSubmit()}
              style={{
                width: '100%', padding: '12px 14px',
                background: 'var(--bg)', border: '1px solid var(--card-border)',
                borderRadius: 12, fontSize: 14, color: 'var(--text)',
                fontFamily: 'inherit', outline: 'none',
              }}
              autoComplete={f.type === 'password' ? 'new-password' : f.type}
            />
          </div>
        ))}
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
        disabled={loading}
        style={{
          width: '100%', padding: '14px 0', borderRadius: 14,
          background: accent, color: '#07070F', border: 'none',
          fontSize: 14, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
          cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit',
          opacity: loading ? 0.6 : 1,
          boxShadow: `0 6px 20px ${accent}30`,
        }}
      >{loading ? 'Creando…' : 'Crear cuenta →'}</button>

      <div style={{ textAlign: 'center', marginTop: 18 }}>
        <button
          onClick={() => navigate('LOGIN')}
          style={{
            fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600,
            background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          ¿Ya tenés cuenta? <strong style={{ color: accent }}>Iniciar sesión</strong>
        </button>
      </div>
    </div>
  );
};

export default Register;
