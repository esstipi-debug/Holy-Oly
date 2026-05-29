import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';

// Client ID publico de Google OAuth (Web). Es publico por diseno: va embebido en
// el front. El secret NO se usa (flujo GSI id_token). Override por VITE_GOOGLE_CLIENT_ID.
export const GOOGLE_CLIENT_ID =
  ((import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim()) ||
  '576946246697-7c4u4g1uu802qh7pjm8iiij0srh82t6o.apps.googleusercontent.com';

const GSI_SRC = 'https://accounts.google.com/gsi/client';

function loadGsi(): Promise<void> {
  return new Promise((resolve, reject) => {
    const w = window as unknown as { google?: { accounts?: { id?: unknown } } };
    if (w.google?.accounts?.id) { resolve(); return; }
    const existing = document.querySelector(`script[src="${GSI_SRC}"]`) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('gsi load error')));
      return;
    }
    const s = document.createElement('script');
    s.src = GSI_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('gsi load error'));
    document.head.appendChild(s);
  });
}

/**
 * Boton "Continuar con Google" (Google Identity Services).
 * Devuelve un id_token -> AuthContext.loginWithGoogle -> backend POST /v1/auth/google.
 * `onAuthed` se llama tras loguear OK (para navegar al home).
 */
export default function GoogleSignInButton({ onAuthed }: { onAuthed?: () => void }) {
  const { loginWithGoogle } = useAuth();
  const ref = useRef<HTMLDivElement | null>(null);
  const cbRef = useRef(onAuthed);
  cbRef.current = onAuthed;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let cancelled = false;
    loadGsi()
      .then(() => {
        if (cancelled || !ref.current) return;
        const w = window as unknown as {
          google: { accounts: { id: {
            initialize: (o: unknown) => void;
            renderButton: (el: HTMLElement, o: unknown) => void;
          } } };
        };
        w.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (resp: { credential?: string }) => {
            if (!resp?.credential) return;
            try {
              await loginWithGoogle(resp.credential);
              cbRef.current?.();
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Error con Google');
            }
          },
        });
        ref.current.innerHTML = '';
        w.google.accounts.id.renderButton(ref.current, {
          type: 'standard',
          theme: 'filled_black',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          logo_alignment: 'center',
          width: 280,
        });
      })
      .catch(() => { if (!cancelled) setError('No se pudo cargar Google'); });
    return () => { cancelled = true; };
  }, [loginWithGoogle]);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, margin: '4px 0' }}>
      <div ref={ref} />
      {error && <span style={{ fontSize: 11, color: '#f87171' }}>{error}</span>}
    </div>
  );
}
