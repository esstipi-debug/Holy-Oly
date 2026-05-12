import { useState } from 'react';
import ThemeGallery from '../components/ThemeGallery';
import { useAthlete } from '../context/AthleteContext';
import { useAuth } from '../context/AuthContext';
import { useNav } from '../context/NavigationContext';

const SETTINGS = [
  { id: 'biometrics', label: 'Datos Biométricos', icon: '⚖️' },
  { id: 'equipment',  label: 'Equipo Disponible',  icon: '🏋️' },
  { id: 'coach',      label: 'Mi Entrenador',       icon: '🕴️' },
  { id: 'units',      label: 'Unidades (KG / LBS)', icon: '📐' },
  { id: 'notifications', label: 'Notificaciones',   icon: '🔔' },
  { id: 'themes',     label: 'Temas',               icon: '🎨' },
];

const Profile: React.FC = () => {
  const [showThemes, setShowThemes] = useState(false);
  const [units, setUnits] = useState<'kg' | 'lbs'>(() => (localStorage.getItem('units:current') as 'kg' | 'lbs') ?? 'kg');
  const [notifications, setNotifications] = useState<boolean>(() => localStorage.getItem('notifications:enabled') !== 'false');
  const [openPanel, setOpenPanel] = useState<null | 'equipment' | 'coach' | 'notifications'>(null);
  const { athlete } = useAthlete();
  const { logout } = useAuth();
  const { navigate } = useNav();

  const toggleUnits = () => {
    const next = units === 'kg' ? 'lbs' : 'kg';
    setUnits(next);
    localStorage.setItem('units:current', next);
  };
  const toggleNotifications = () => {
    const next = !notifications;
    setNotifications(next);
    localStorage.setItem('notifications:enabled', String(next));
  };

  const firstName = athlete?.name.split(' ')[0] ?? 'Atleta';
  const lastInitial = athlete?.name.split(' ')[1]?.[0] ?? '';
  const subscription = athlete?.subscription?.toUpperCase() ?? 'PRO';

  if (showThemes) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={() => setShowThemes(false)}
            style={{ background: 'var(--surface)', border: '1px solid var(--card-border)', borderRadius: 10, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 16 }}
          >←</button>
          <h2 style={{ color: 'var(--text)', fontSize: 17, fontWeight: 900 }}>Temas</h2>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <ThemeGallery />
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%', paddingBottom: 80 }}>
      <div style={{ padding: '32px 20px 20px' }}>

        {/* Avatar + name */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 84, height: 84, borderRadius: 26,
            background: 'linear-gradient(135deg,var(--primary),#3B82F6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, fontWeight: 900, color: 'var(--bg)',
            margin: '0 auto 14px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}>
            {firstName[0]}{lastInitial}
          </div>
          <h1 style={{ color: 'var(--text)', fontSize: 22, fontWeight: 900, letterSpacing: '-.02em' }}>{athlete?.name ?? 'Atleta'}</h1>
          <p style={{ color: 'var(--primary)', fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', marginTop: 4 }}>
            Suscripción: HOLY {subscription}
          </p>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          {[
            { icon: '🏆', label: 'Logros', sub: '12 Desbloqueados', onClick: () => navigate('SOCIAL') },
            { icon: '💳', label: 'Pagos',  sub: 'PRO Expira en 12d', onClick: () => navigate('PREMIUM') },
          ].map((item) => (
            <div
              key={item.label}
              onClick={item.onClick}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--card-border)',
                borderRadius: 18,
                padding: '18px 14px',
                textAlign: 'center',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 26, display: 'block', marginBottom: 6 }}>{item.icon}</span>
              <p style={{ color: 'var(--text)', fontSize: 12, fontWeight: 700 }}>{item.label}</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', marginTop: 2 }}>{item.sub}</p>
            </div>
          ))}
        </div>

        {/* Settings */}
        <p style={{ color: 'var(--text-secondary)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10, paddingLeft: 4 }}>
          Configuración
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
          {SETTINGS.map((item) => {
            const isUnits = item.id === 'units';
            const isNotif = item.id === 'notifications';
            const handleClick = () => {
              if (item.id === 'themes') setShowThemes(true);
              else if (item.id === 'biometrics') navigate('ONBOARDING');
              else if (item.id === 'coach') setOpenPanel('coach');
              else if (item.id === 'equipment') setOpenPanel('equipment');
              else if (isUnits) toggleUnits();
              else if (isNotif) toggleNotifications();
            };
            return (
              <div
                key={item.id}
                onClick={handleClick}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 16px',
                  background: 'var(--surface)',
                  border: '1px solid var(--card-border)',
                  borderRadius: 16,
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  <p style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600 }}>{item.label}</p>
                </div>
                {isUnits ? (
                  <div style={{ display: 'flex', gap: 2, padding: 3, background: 'var(--bg)', border: '1px solid var(--card-border)', borderRadius: 999 }}>
                    {(['kg', 'lbs'] as const).map(u => (
                      <span key={u} style={{
                        padding: '4px 12px', borderRadius: 999,
                        background: units === u ? 'var(--primary)' : 'transparent',
                        color: units === u ? 'var(--primary-text)' : 'var(--text-secondary)',
                        fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                      }}>{u}</span>
                    ))}
                  </div>
                ) : isNotif ? (
                  <div style={{
                    width: 36, height: 20, borderRadius: 999,
                    background: notifications ? 'var(--primary)' : 'var(--card-border)',
                    position: 'relative', transition: 'background .2s ease',
                  }}>
                    <div style={{
                      position: 'absolute', top: 2, left: notifications ? 18 : 2,
                      width: 16, height: 16, borderRadius: '50%',
                      background: '#fff', transition: 'left .2s ease',
                    }} />
                  </div>
                ) : (
                  <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>→</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Panels inline para coach/equipment */}
        {openPanel === 'coach' && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--card-border)', borderRadius: 16, padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ color: 'var(--text)', fontSize: 13, fontWeight: 800 }}>🕴️ Tu entrenador</p>
              <button onClick={() => setOpenPanel(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 11, marginBottom: 4 }}>Sebastián Torres</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 10, marginBottom: 8 }}>Club Halterofilia Buenos Aires · 14 años de experiencia</p>
            <p style={{ color: 'var(--primary)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>Especialización: Escuela Rusa / Búlgara híbrida</p>
          </div>
        )}
        {openPanel === 'equipment' && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--card-border)', borderRadius: 16, padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ color: 'var(--text)', fontSize: 13, fontWeight: 800 }}>🏋️ Equipo disponible</p>
              <button onClick={() => setOpenPanel(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 11, lineHeight: 1.6 }}>
              Inventario gestionado por tu coach. Si necesitás equipo específico, mandá mensaje desde el chat con WISE.
            </p>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={() => { logout(); navigate('LOGIN'); }}
          style={{
            width: '100%',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 16,
            padding: '14px 0',
            color: '#f87171',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            letterSpacing: '.04em',
          }}
        >
          CERRAR SESIÓN
        </button>

      </div>
    </div>
  );
};

export default Profile;
