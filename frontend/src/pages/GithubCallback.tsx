import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNav } from '../context/NavigationContext';

const GithubCallback: React.FC = () => {
  const { loginWithGithubCode } = useAuth();
  const { navigate } = useNav();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');

      if (!code) {
        setError('No se recibió código de GitHub.');
        return;
      }

      try {
        await loginWithGithubCode(code);
        navigate('VOLTA_HOME');
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Error al autenticar con GitHub');
      }
    };

    handleCallback();
  }, [loginWithGithubCode, navigate]);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', minHeight: '100%',
      background: 'var(--bg)', padding: '60px 24px 28px', justifyContent: 'center',
      alignItems: 'center', textAlign: 'center',
    }}>
      {error ? (
        <>
          <div style={{ fontSize: 48, marginBottom: 20 }}>⚠️</div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)', marginBottom: 12 }}>
            Error de autenticación
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
            {error}
          </p>
          <button
            onClick={() => navigate('LOGIN')}
            style={{
              padding: '12px 24px', borderRadius: 14,
              background: 'var(--primary)', color: 'var(--primary-text)',
              border: 'none', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Volver a intentar
          </button>
        </>
      ) : (
        <>
          <div style={{ fontSize: 48, marginBottom: 20, animation: 'spin 1s linear infinite' }}>
            ⚙️
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)', marginBottom: 12 }}>
            Autenticando...
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Un momento mientras te conectamos con GitHub
          </p>
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </>
      )}
    </div>
  );
};

export default GithubCallback;
