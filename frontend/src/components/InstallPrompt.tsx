import { useEffect, useState } from 'react';

/**
 * Banner de instalación PWA · detecta plataforma:
 *  - Android/Chrome → captura `beforeinstallprompt` y muestra botón "Instalar"
 *    que dispara el prompt nativo de "Agregar a pantalla de inicio".
 *  - iOS/Safari → no expone prompt programático, así que mostramos la
 *    instrucción manual (Compartir → Agregar a inicio).
 *  - Si ya está instalada (display-mode standalone) o el user la descartó, no aparece.
 * Solo en dispositivos táctiles (pointer: coarse).
 */

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const DISMISS_KEY = 'pwa:install_dismissed';

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const iPhone = /iphone|ipad|ipod/i.test(ua);
  // iPadOS 13+ se reporta como Mac → detectar Mac táctil
  const iPadOS = navigator.platform === 'MacIntel'
    && (navigator as unknown as { maxTouchPoints: number }).maxTouchPoints > 1;
  return iPhone || iPadOS;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches
    || (navigator as unknown as { standalone?: boolean }).standalone === true;
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isStandalone()) return;
    try { if (localStorage.getItem(DISMISS_KEY) === '1') return; } catch { /* ignore */ }
    if (!window.matchMedia('(pointer: coarse)').matches) return; // solo móvil/táctil

    if (isIOS()) { setIos(true); setShow(true); return; }

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    const onInstalled = () => {
      setShow(false);
      try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
    };
    window.addEventListener('beforeinstallprompt', onBIP);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBIP);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const dismiss = () => {
    setShow(false);
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
  };

  const install = async () => {
    if (!deferred) return;
    try { await deferred.prompt(); await deferred.userChoice; } catch { /* ignore */ }
    setDeferred(null);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="Instalar la app"
      style={{
        position: 'fixed', left: 12, right: 12,
        bottom: 'max(12px, env(safe-area-inset-bottom))',
        zIndex: 9999, display: 'flex', alignItems: 'center', gap: 12,
        padding: 12, borderRadius: 16, maxWidth: 460, margin: '0 auto',
        background: 'rgba(13,13,24,0.96)', backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.5)', fontFamily: 'inherit',
      }}
    >
      <img src="/icon-192.png" alt="" width={40} height={40} style={{ borderRadius: 10, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Instalá la app</div>
        <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.3 }}>
          {ios
            ? <>Tocá <span style={{ color: '#fff' }}>Compartir</span> y luego <span style={{ color: '#fff' }}>“Agregar a inicio”</span></>
            : 'Accedé como app, sin abrir el navegador'}
        </div>
      </div>
      {!ios && (
        <button
          onClick={install}
          style={{
            flexShrink: 0, padding: '9px 14px', borderRadius: 10,
            background: 'var(--primary, #22C55E)', color: 'var(--primary-text, #07070F)',
            border: 'none', fontFamily: 'inherit', fontSize: 12, fontWeight: 800, cursor: 'pointer',
          }}
        >Instalar</button>
      )}
      <button
        onClick={dismiss}
        aria-label="Cerrar"
        style={{
          flexShrink: 0, width: 28, height: 28, borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)', color: '#94a3b8',
          border: 'none', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit',
        }}
      >×</button>
    </div>
  );
}
