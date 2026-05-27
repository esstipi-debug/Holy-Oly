import { useState } from 'react';
import ThemeGallery from '../components/ThemeGallery';
import AchievementsGrid from '../components/AchievementsGrid';
import { useAthlete } from '../context/AthleteContext';
import { useAuth } from '../context/AuthContext';
import { useNav } from '../context/NavigationContext';
import { useProduct } from '../context/ProductContext';
import { useRole } from '../context/RoleContext';
import { unlockedCount, totalCount, type AthleteState } from '../data/achievements';

const API_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? '' : 'https://holy-oly-3.onrender.com');

const SETTINGS_ATLETA = [
  { id: 'biometrics', label: 'Datos Biométricos', icon: '⚖️' },
  { id: 'equipment',  label: 'Equipo Disponible',  icon: '🏋️' },
  { id: 'coach',      label: 'Mi Entrenador',       icon: '🕴️' },
  { id: 'units',      label: 'Unidades (KG / LBS)', icon: '📐' },
  { id: 'notifications', label: 'Notificaciones',   icon: '🔔' },
  { id: 'themes',     label: 'Temas',               icon: '🎨' },
];

const SETTINGS_COACH = [
  { id: 'box',        label: 'Mi Box / Club',      icon: '🏛️' },
  { id: 'roster',     label: 'Atletas Asignados',  icon: '👥' },
  { id: 'equipment',  label: 'Inventario',          icon: '🏋️' },
  { id: 'units',      label: 'Unidades (KG / LBS)', icon: '📐' },
  { id: 'notifications', label: 'Notificaciones',   icon: '🔔' },
  { id: 'themes',     label: 'Temas',               icon: '🎨' },
];

const Profile: React.FC = () => {
  const [showThemes, setShowThemes] = useState(false);
  const [units, setUnits] = useState<'kg' | 'lbs'>(() => (localStorage.getItem('units:current') as 'kg' | 'lbs') ?? 'kg');
  const [notifications, setNotifications] = useState<boolean>(() => localStorage.getItem('notifications:enabled') !== 'false');
  const [openPanel, setOpenPanel] = useState<null | 'equipment' | 'coach' | 'notifications' | 'box' | 'roster'>(null);
  const { athlete, allAthletes } = useAthlete();
  const { logout } = useAuth();
  const { navigate } = useNav();
  const { product } = useProduct();
  const { role } = useRole();
  const isCoach = role === 'coach';
  const SETTINGS = isCoach ? SETTINGS_COACH : SETTINGS_ATLETA;

  // Stats del atleta para AchievementsGrid (solo si atleta)
  const athleteState: AthleteState = {
    sessionCount: 42,
    rxSessionCount: 12,
    prCount: 7,
    prByLift: { snatch: 3, clean_jerk: 2, squat: 2 },
    streakDays: 12,
    currentTier: 3,
    wellnessDays: { sleep: 18, hrv: 25, mood: 10, caffeine: 30 },
    leaderboardPercentile: 23,
    wodsCompleted: product === 'volta' ? ['fran', 'helen'] : [],
  };
  const unlocked = isCoach ? 0 : unlockedCount(athleteState, product);
  const total = isCoach ? 0 : totalCount(product);

  // Stats del coach (roster)
  const rosterCount = allAthletes.length;
  const activeAthletes = allAthletes.filter(a => (a.sessions_last_7?.filter(s => s.completed).length ?? 0) > 0).length;

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
          <h1 style={{ color: 'var(--text)', fontSize: 22, fontWeight: 900, letterSpacing: '-.02em' }}>{athlete?.name ?? (isCoach ? 'Coach' : 'Atleta')}</h1>
          <p style={{ color: 'var(--primary)', fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', marginTop: 4 }}>
            {isCoach ? `${product === 'volta' ? 'VOLTA' : 'HOLY OLY'} · Coach` : `Suscripción: HOLY ${subscription}`}
          </p>
        </div>

        {/* Stats grid · diferente por rol */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          {(isCoach
            ? [
                { icon: '👥', label: 'Atletas', sub: `${rosterCount} en el roster`, onClick: () => navigate(product === 'volta' ? 'VOLTA_COACH' : 'COACH_DASH') },
                { icon: '🔥', label: 'Activos esta semana', sub: `${activeAthletes} de ${rosterCount}`, onClick: () => navigate(product === 'volta' ? 'VOLTA_COACH' : 'COACH_DASH') },
              ]
            : [
                { icon: '🏆', label: 'Logros', sub: `${unlocked}/${total} Desbloqueados`, onClick: () => navigate('SOCIAL') },
                { icon: '💳', label: 'Pagos',  sub: 'PRO Expira en 12d', onClick: () => navigate('PREMIUM') },
              ]
          ).map((item) => (
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

        {/* Achievements · solo atleta */}
        {!isCoach && (
          <div style={{ marginBottom: 24 }}>
            <AchievementsGrid product={product} state={athleteState} />
          </div>
        )}

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
              else if (item.id === 'equipment') {
                // Coach va al inventario real, atleta abre panel info
                if (isCoach && product === 'volta') navigate('VOLTA_COACH_INVENTORY');
                else setOpenPanel('equipment');
              }
              else if (item.id === 'box') setOpenPanel('box');
              else if (item.id === 'roster') navigate(product === 'volta' ? 'VOLTA_COACH' : 'COACH_DASH');
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
        {openPanel === 'box' && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--card-border)', borderRadius: 16, padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ color: 'var(--text)', fontSize: 13, fontWeight: 800 }}>🏛️ Mi Box / Club</p>
              <button onClick={() => setOpenPanel(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 11, marginBottom: 4 }}>
              {product === 'volta' ? 'CrossFit Box · 28 atletas' : 'Club Halterofilia · 18 atletas'}
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 10 }}>
              Configuración del box, capacidad por clase, horarios y branding desde el dashboard web.
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

        {/* Ciclo hormonal · opcional opt-in · solo atleta */}
        {!isCoach && (
          <>
            <p style={{ color: 'var(--text-secondary)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', marginTop: 32, marginBottom: 10, paddingLeft: 4 }}>
              Salud · opcional
            </p>
            <button
              onClick={() => navigate('HORMONAL')}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 16px', width: '100%',
                background: 'var(--surface)', border: '1px solid var(--card-border)', borderRadius: 16,
                cursor: 'pointer', textAlign: 'left', marginBottom: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 18 }}>🌙</span>
                <div>
                  <p style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600 }}>Ciclo hormonal</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 10, marginTop: 2 }}>
                    Adapta entrenamiento al ciclo · opt-in
                  </p>
                </div>
              </div>
              <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>→</span>
            </button>
          </>
        )}

        {/* Legal & datos · sección requerida app stores (GDPR/Apple/Google) */}
        <p style={{ color: 'var(--text-secondary)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', marginTop: 32, marginBottom: 10, paddingLeft: 4 }}>
          Privacidad y datos
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={() => navigate('PRIVACY')}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 16px', width: '100%',
              background: 'var(--surface)', border: '1px solid var(--card-border)', borderRadius: 16,
              cursor: 'pointer', textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 18 }}>📄</span>
              <p style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600 }}>Política de Privacidad</p>
            </div>
            <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>→</span>
          </button>

          <button
            onClick={() => navigate('TERMS')}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 16px', width: '100%',
              background: 'var(--surface)', border: '1px solid var(--card-border)', borderRadius: 16,
              cursor: 'pointer', textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 18 }}>📜</span>
              <p style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600 }}>Términos y Condiciones</p>
            </div>
            <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>→</span>
          </button>

          <button
            onClick={async () => {
              try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_URL}/v1/auth/me/export`, {
                  headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                });
                if (!res.ok) throw new Error('Export falló');
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `holyoly-mis-datos-${new Date().toISOString().slice(0,10)}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              } catch (e) {
                alert('No se pudo exportar. Probá de nuevo.');
              }
            }}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 16px', width: '100%',
              background: 'var(--surface)', border: '1px solid var(--card-border)', borderRadius: 16,
              cursor: 'pointer', textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 18 }}>⬇️</span>
              <div>
                <p style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600 }}>Exportar mis datos</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: 10, marginTop: 2 }}>JSON descargable · GDPR</p>
              </div>
            </div>
            <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>→</span>
          </button>

          <button
            onClick={async () => {
              const confirm1 = window.confirm(
                '¿Eliminar tu cuenta?\n\nSe borrarán PERMANENTEMENTE:\n· Tu perfil y credenciales\n· Todas tus sesiones y resultados\n· Tu historial de bienestar\n· Todos los datos asociados\n\nEsta acción NO se puede deshacer.'
              );
              if (!confirm1) return;
              const confirm2 = window.prompt('Escribí "ELIMINAR" para confirmar:');
              if (confirm2 !== 'ELIMINAR') {
                alert('Cancelado · texto no coincide');
                return;
              }
              try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_URL}/v1/auth/me`, {
                  method: 'DELETE',
                  headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                });
                if (!res.ok) throw new Error('Delete falló');
                logout();
                navigate('LOGIN');
                alert('Tu cuenta fue eliminada. Lamentamos verte partir.');
              } catch (e) {
                alert('No se pudo eliminar. Contactá hola@peakqual.app');
              }
            }}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 16px', width: '100%',
              background: 'rgba(239,68,68,0.05)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 16,
              cursor: 'pointer', textAlign: 'left',
              marginTop: 4,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 18 }}>🗑️</span>
              <div>
                <p style={{ color: '#f87171', fontSize: 13, fontWeight: 700 }}>Eliminar cuenta</p>
                <p style={{ color: 'rgba(239,68,68,0.6)', fontSize: 10, marginTop: 2 }}>Permanente · irreversible</p>
              </div>
            </div>
            <span style={{ color: '#f87171', fontSize: 14 }}>→</span>
          </button>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: 9, textAlign: 'center', marginTop: 24, opacity: 0.5 }}>
          Peak Qual SpA · hola@peakqual.app
        </p>

      </div>
    </div>
  );
};

export default Profile;
