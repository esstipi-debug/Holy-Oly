import { useState } from 'react';
import ThemeGallery from '../components/ThemeGallery';
import AchievementsGrid from '../components/AchievementsGrid';
import { useAthlete } from '../context/AthleteContext';
import { useAuth } from '../context/AuthContext';
import { useNav } from '../context/NavigationContext';
import { useProduct } from '../context/ProductContext';
import { useRole } from '../context/RoleContext';
import { unlockedCount, totalCount, type AthleteState } from '../data/achievements';
import '../styles/v2/profile.css';

/**
 * Profile · perfil del atleta/coach.
 * Estilo V2 dark "Macrociclos" · scoped bajo `.prof-root` · acento
 * product-aware (ámbar HO · cyan Volta) via data-accent. Se monta dentro
 * de PhoneLayout (chrome + bottom nav) → no dibuja chrome propio. Lógica
 * intacta: toda la data, toggles (units/notifications + localStorage),
 * navegación, logout, export/delete GDPR; solo cambia la presentación.
 */

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
  const accent = product === 'volta' ? 'volta' : 'ho';

  if (showThemes) {
    return (
      <div className="prof-themes">
        <div className="prof-themes-head">
          <button className="prof-back btn-press" onClick={() => setShowThemes(false)}>←</button>
          <h2 className="prof-themes-title">Temas</h2>
        </div>
        <div className="prof-themes-body">
          <ThemeGallery />
        </div>
      </div>
    );
  }

  const stats = isCoach
    ? [
        { icon: '👥', label: 'Atletas', sub: `${rosterCount} en el roster`, onClick: () => navigate(product === 'volta' ? 'VOLTA_COACH' : 'COACH_DASH') },
        { icon: '🔥', label: 'Activos esta semana', sub: `${activeAthletes} de ${rosterCount}`, onClick: () => navigate(product === 'volta' ? 'VOLTA_COACH' : 'COACH_DASH') },
      ]
    : [
        { icon: '🏆', label: 'Logros', sub: `${unlocked}/${total} Desbloqueados`, onClick: () => navigate('SOCIAL') },
        { icon: '💳', label: 'Pagos',  sub: 'PRO Expira en 12d', onClick: () => navigate('PREMIUM') },
      ];

  return (
    <div className="prof-root anim-fade-in" data-accent={accent}>
      <div className="prof-scroll">

        {/* Avatar + name */}
        <div className="prof-head">
          <div className="prof-avatar">{firstName[0]}{lastInitial}</div>
          <h1 className="prof-name">{athlete?.name ?? (isCoach ? 'Coach' : 'Atleta')}</h1>
          <p className="prof-sub">
            {isCoach ? `${product === 'volta' ? 'VOLTA' : 'HOLY OLY'} · Coach` : `Suscripción: HOLY ${subscription}`}
          </p>
        </div>

        {/* Stats grid · diferente por rol */}
        <div className="prof-stats">
          {stats.map((item) => (
            <div key={item.label} className="prof-stat btn-press" onClick={item.onClick}>
              <span className="prof-stat-icon">{item.icon}</span>
              <p className="prof-stat-label">{item.label}</p>
              <p className="prof-stat-sub">{item.sub}</p>
            </div>
          ))}
        </div>

        {/* Achievements · solo atleta */}
        {!isCoach && (
          <div className="prof-achievements">
            <AchievementsGrid product={product} state={athleteState} />
          </div>
        )}

        {/* Settings */}
        <p className="prof-sec-label">Configuración</p>
        <div className="prof-list">
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
              <div key={item.id} className="prof-row btn-press" onClick={handleClick}>
                <div className="prof-row-left">
                  <span className="prof-row-icon">{item.icon}</span>
                  <p className="prof-row-label">{item.label}</p>
                </div>
                {isUnits ? (
                  <div className="prof-seg">
                    {(['kg', 'lbs'] as const).map(u => (
                      <span key={u} className="prof-seg-opt" data-on={units === u}>{u}</span>
                    ))}
                  </div>
                ) : isNotif ? (
                  <div className="prof-switch" data-on={notifications}>
                    <div className="prof-switch-knob" />
                  </div>
                ) : (
                  <span className="prof-row-arrow">→</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Panels inline para coach/equipment */}
        {openPanel === 'coach' && (
          <div className="prof-panel">
            <div className="prof-panel-head">
              <p className="prof-panel-title">🕴️ Tu entrenador</p>
              <button className="prof-panel-close" onClick={() => setOpenPanel(null)}>✕</button>
            </div>
            <p className="prof-panel-line">Sebastián Torres</p>
            <p className="prof-panel-line">Club Halterofilia Buenos Aires · 14 años de experiencia</p>
            <p className="prof-panel-accent">Especialización: Escuela Rusa / Búlgara híbrida</p>
          </div>
        )}
        {openPanel === 'equipment' && (
          <div className="prof-panel">
            <div className="prof-panel-head">
              <p className="prof-panel-title">🏋️ Equipo disponible</p>
              <button className="prof-panel-close" onClick={() => setOpenPanel(null)}>✕</button>
            </div>
            <p className="prof-panel-line">
              Inventario gestionado por tu coach. Si necesitás equipo específico, mandá mensaje desde el chat con WISE.
            </p>
          </div>
        )}
        {openPanel === 'box' && (
          <div className="prof-panel">
            <div className="prof-panel-head">
              <p className="prof-panel-title">🏛️ Mi Box / Club</p>
              <button className="prof-panel-close" onClick={() => setOpenPanel(null)}>✕</button>
            </div>
            <p className="prof-panel-line">
              {product === 'volta' ? 'CrossFit Box · 28 atletas' : 'Club Halterofilia · 18 atletas'}
            </p>
            <p className="prof-panel-line">
              Configuración del box, capacidad por clase, horarios y branding desde el dashboard web.
            </p>
          </div>
        )}

        {/* Logout */}
        <button className="prof-logout btn-press" onClick={() => { logout(); navigate('LOGIN'); }}>
          Cerrar sesión
        </button>

        {/* Ciclo hormonal · opcional opt-in · solo atleta */}
        {!isCoach && (
          <>
            <p className="prof-sec-label">Salud · opcional</p>
            <button className="prof-row btn-press" onClick={() => navigate('HORMONAL')}>
              <div className="prof-row-left">
                <span className="prof-row-icon">🌙</span>
                <div>
                  <p className="prof-row-label">Ciclo hormonal</p>
                  <p className="prof-row-desc">Adapta entrenamiento al ciclo · opt-in</p>
                </div>
              </div>
              <span className="prof-row-arrow">→</span>
            </button>
          </>
        )}

        {/* Legal & datos · sección requerida app stores (GDPR/Apple/Google) */}
        <p className="prof-sec-label">Privacidad y datos</p>
        <div className="prof-list">
          <button className="prof-row btn-press" onClick={() => navigate('PRIVACY')}>
            <div className="prof-row-left">
              <span className="prof-row-icon">📄</span>
              <p className="prof-row-label">Política de Privacidad</p>
            </div>
            <span className="prof-row-arrow">→</span>
          </button>

          <button className="prof-row btn-press" onClick={() => navigate('TERMS')}>
            <div className="prof-row-left">
              <span className="prof-row-icon">📜</span>
              <p className="prof-row-label">Términos y Condiciones</p>
            </div>
            <span className="prof-row-arrow">→</span>
          </button>

          <button
            className="prof-row btn-press"
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
          >
            <div className="prof-row-left">
              <span className="prof-row-icon">⬇️</span>
              <div>
                <p className="prof-row-label">Exportar mis datos</p>
                <p className="prof-row-desc">JSON descargable · GDPR</p>
              </div>
            </div>
            <span className="prof-row-arrow">→</span>
          </button>

          <button
            className="prof-row danger btn-press"
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
          >
            <div className="prof-row-left">
              <span className="prof-row-icon">🗑️</span>
              <div>
                <p className="prof-row-label">Eliminar cuenta</p>
                <p className="prof-row-desc">Permanente · irreversible</p>
              </div>
            </div>
            <span className="prof-row-arrow">→</span>
          </button>
        </div>

        <p className="prof-foot">Peak Qual SpA · hola@peakqual.app</p>

      </div>
    </div>
  );
};

export default Profile;
