import { useEffect, useState } from 'react';
import {
  isPushSupported,
  getCurrentPermission,
  enablePushNotifications,
  disablePushNotifications,
} from '../lib/pushNotifications';

type Status = 'idle' | 'enabling' | 'disabling' | 'enabled' | 'denied' | 'unsupported';

const NotificationsToggle: React.FC = () => {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPushSupported()) {
      setStatus('unsupported');
      return;
    }
    const perm = getCurrentPermission();
    if (perm === 'denied') {
      setStatus('denied');
    } else if (perm === 'granted') {
      // verificar si hay subscription activa
      navigator.serviceWorker
        .getRegistration()
        .then((reg) => reg?.pushManager.getSubscription())
        .then((sub) => setStatus(sub ? 'enabled' : 'idle'))
        .catch(() => setStatus('idle'));
    } else {
      setStatus('idle');
    }
  }, []);

  const handleEnable = async () => {
    setError(null);
    setStatus('enabling');
    const result = await enablePushNotifications();
    if (result.ok) {
      setStatus('enabled');
      return;
    }
    switch (result.reason) {
      case 'unsupported':
        setStatus('unsupported');
        break;
      case 'denied':
        setStatus('denied');
        break;
      case 'no-vapid':
        setStatus('idle');
        setError('No pudimos obtener la VAPID key del servidor.');
        break;
      case 'subscribe-failed':
        setStatus('idle');
        setError('El navegador rechazó la suscripción.');
        break;
      case 'server-error':
        setStatus('idle');
        setError('No pudimos registrarte en el servidor.');
        break;
      default:
        setStatus('idle');
        setError('Algo falló al activar notificaciones.');
    }
  };

  const handleDisable = async () => {
    setError(null);
    setStatus('disabling');
    await disablePushNotifications();
    setStatus('idle');
  };

  /* -------- render -------- */

  const Row: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 16px',
        background: 'var(--surface)',
        border: '1px solid var(--card-border)',
        borderRadius: 16,
        gap: 12,
      }}
    >
      {children}
    </div>
  );

  if (status === 'unsupported') {
    return (
      <Row>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 18 }}>🔕</span>
          <div>
            <p style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600 }}>Notificaciones</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 10 }}>
              Este navegador no las soporta.
            </p>
          </div>
        </div>
      </Row>
    );
  }

  if (status === 'denied') {
    return (
      <Row>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 18 }}>🚫</span>
          <div>
            <p style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600 }}>Notificaciones</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 10, lineHeight: 1.4, marginTop: 2 }}>
              Permisos bloqueados · habilitalos en la config del navegador.
            </p>
          </div>
        </div>
      </Row>
    );
  }

  const enabled = status === 'enabled';
  const busy = status === 'enabling' || status === 'disabling';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Row>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 18 }}>{enabled ? '🔔' : '🔕'}</span>
          <div>
            <p style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600 }}>Notificaciones push</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 10, marginTop: 2 }}>
              {enabled ? 'Activadas · WOD del día + alertas' : 'Activá para recibir tu WOD del día'}
            </p>
          </div>
        </div>

        {enabled ? (
          <button
            disabled={busy}
            onClick={handleDisable}
            style={{
              background: 'transparent',
              border: '1px solid var(--card-border)',
              borderRadius: 999,
              color: 'var(--text-secondary)',
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '.06em',
              textTransform: 'uppercase',
              padding: '8px 14px',
              cursor: busy ? 'progress' : 'pointer',
              opacity: busy ? 0.6 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            {busy ? '...' : 'Desactivar'}
          </button>
        ) : (
          <button
            disabled={busy}
            onClick={handleEnable}
            style={{
              background: '#F5C518',
              border: '1px solid #F5C518',
              borderRadius: 999,
              color: '#07070F',
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: '.06em',
              textTransform: 'uppercase',
              padding: '8px 14px',
              cursor: busy ? 'progress' : 'pointer',
              opacity: busy ? 0.6 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            {status === 'enabling' ? '...' : 'Activar'}
          </button>
        )}
      </Row>
      {error && (
        <p style={{ color: '#f87171', fontSize: 10, paddingLeft: 4 }}>{error}</p>
      )}
    </div>
  );
};

export default NotificationsToggle;
