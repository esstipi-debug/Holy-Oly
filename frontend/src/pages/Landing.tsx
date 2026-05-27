import React from 'react';
import { useNav } from '../context/NavigationContext';

/**
 * Landing page · selector de producto.
 *
 * Se muestra cuando el usuario entra a `/` sin `?p=` y no está autenticado.
 * Tap en una card redirige a `?p=ho` o `?p=volta` para pre-setear el producto
 * y entrar al flujo de login del producto correspondiente.
 *
 * Si `?demo=1` está presente en la URL, mostramos un badge "modo testing"
 * (sirve para distinguir despliegues de QA del prod).
 */
const Landing: React.FC = () => {
  const { navigate } = useNav();
  const params = new URLSearchParams(window.location.search);
  const demoFlag = params.get('demo') === '1';

  // Preservamos el flag demo al navegar a un producto puntual
  const goTo = (p: 'ho' | 'volta') => {
    const qs = new URLSearchParams();
    qs.set('p', p);
    if (demoFlag) qs.set('demo', '1');
    window.location.href = `?${qs.toString()}`;
  };

  const goLogin = () => goTo('ho');

  return (
    <div
      style={{
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '64px 24px 32px',
        background:
          'radial-gradient(120% 80% at 50% 0%, #14141F 0%, #07070F 60%, #050509 100%)',
        color: '#fff',
        fontFamily: 'inherit',
      }}
    >
      {/* HEADER */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <p
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '.22em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.55)',
            marginBottom: 10,
          }}
        >
          Elegí tu disciplina
        </p>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 900,
            letterSpacing: '-.02em',
            lineHeight: 1.1,
          }}
        >
          Smart training,<br />zero burnout
        </h1>
        {demoFlag && (
          <div
            style={{
              marginTop: 14,
              display: 'inline-block',
              padding: '4px 10px',
              borderRadius: 999,
              background: 'rgba(245,158,11,0.12)',
              border: '1px solid rgba(245,158,11,0.4)',
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: '.18em',
              textTransform: 'uppercase',
              color: '#fbbf24',
            }}
          >
            ⚠ Modo testing · demo habilitado
          </div>
        )}
      </div>

      {/* CARDS */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          flex: 1,
          justifyContent: 'center',
        }}
      >
        {/* HOLY OLY */}
        <button
          onClick={() => goTo('ho')}
          style={{
            width: '100%',
            padding: '28px 22px',
            borderRadius: 22,
            background:
              'linear-gradient(135deg, rgba(245,197,24,0.14) 0%, rgba(245,197,24,0.04) 100%)',
            border: '1px solid rgba(245,197,24,0.35)',
            color: '#fff',
            textAlign: 'left',
            cursor: 'pointer',
            fontFamily: 'inherit',
            boxShadow: '0 12px 40px rgba(245,197,24,0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: 18,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background:
                'linear-gradient(135deg, #F5C518 0%, #B8860B 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              flexShrink: 0,
              boxShadow: '0 8px 24px rgba(245,197,24,0.4)',
            }}
          >
            🏋️
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: '.18em',
                textTransform: 'uppercase',
                color: '#F5C518',
                marginBottom: 4,
              }}
            >
              Halterofilia
            </p>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 900,
                letterSpacing: '-.01em',
                marginBottom: 4,
              }}
            >
              HOLY OLY
            </h2>
            <p
              style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.6)',
                lineHeight: 1.35,
              }}
            >
              Olympic lifting · macrociclos · técnica
            </p>
          </div>
          <span
            style={{
              fontSize: 20,
              color: '#F5C518',
              fontWeight: 900,
              flexShrink: 0,
            }}
          >
            →
          </span>
        </button>

        {/* VOLTA */}
        <button
          onClick={() => goTo('volta')}
          style={{
            width: '100%',
            padding: '28px 22px',
            borderRadius: 22,
            background:
              'linear-gradient(135deg, rgba(0,229,255,0.14) 0%, rgba(0,229,255,0.04) 100%)',
            border: '1px solid rgba(0,229,255,0.35)',
            color: '#fff',
            textAlign: 'left',
            cursor: 'pointer',
            fontFamily: 'inherit',
            boxShadow: '0 12px 40px rgba(0,229,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: 18,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background:
                'linear-gradient(135deg, #00E5FF 0%, #0070FF 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              flexShrink: 0,
              boxShadow: '0 8px 24px rgba(0,229,255,0.4)',
            }}
          >
            ⚡
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: '.18em',
                textTransform: 'uppercase',
                color: '#00E5FF',
                marginBottom: 4,
              }}
            >
              CrossFit
            </p>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 900,
                letterSpacing: '-.01em',
                marginBottom: 4,
              }}
            >
              VOLTA
            </h2>
            <p
              style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.6)',
                lineHeight: 1.35,
              }}
            >
              WODs · benchmarks · doble sesión
            </p>
          </div>
          <span
            style={{
              fontSize: 20,
              color: '#00E5FF',
              fontWeight: 900,
              flexShrink: 0,
            }}
          >
            →
          </span>
        </button>
      </div>

      {/* FOOTER */}
      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <button
          onClick={goLogin}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.55)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            textDecoration: 'underline',
          }}
        >
          Ya tengo cuenta · iniciar sesión
        </button>
        <div style={{ marginTop: 20, display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center' }}>
          <button
            onClick={() => navigate('PRIVACY')}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', padding: 0, textDecoration: 'underline' }}
          >
            Privacidad
          </button>
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>·</span>
          <button
            onClick={() => navigate('TERMS')}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', padding: 0, textDecoration: 'underline' }}
          >
            Términos
          </button>
        </div>
        <p
          style={{
            marginTop: 14,
            fontSize: 9,
            color: 'rgba(255,255,255,0.3)',
            fontWeight: 700,
            letterSpacing: '.18em',
            textTransform: 'uppercase',
          }}
        >
          v1.0.0-alpha
        </p>
      </div>
    </div>
  );
};

export default Landing;
