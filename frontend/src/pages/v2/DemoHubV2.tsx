/**
 * DemoHubV2 · entry point único cuando `?demo=1&auto=1`.
 *
 * Muestra SOLO pantallas con UI nuevo portado de Claude Design.
 * Las pantallas legacy NO se accesan desde acá · están bloqueadas en migración.
 *
 * Cada vez que se porta una pantalla nueva, se agrega a STATUS abajo.
 */
import { useNav } from '../../context/NavigationContext';
import type { View } from '../../context/NavigationContext';
import '../../styles/v2/demo-hub.css';

type ItemStatus = 'new' | 'partial' | 'pending';

interface DemoItem {
  view: View;
  title: string;
  subtitle: string;
  status: ItemStatus;
  block?: 'auth' | 'ho-atleta' | 'ho-coach' | 'volta-atleta' | 'volta-coach' | 'componentes';
  promptId?: number;
}

const ITEMS: DemoItem[] = [
  // ✅ Nuevo · portado desde batch drop · Claude Design FIFA/Strava
  { view: 'HO_MACRO_CATALOG',  title: 'Catálogo Macrociclos',  subtitle: '23 macros · filtros familia · recomendados IA',           status: 'new', block: 'ho-atleta' },
  { view: 'HO_MACRO_DETAIL',   title: 'Detalle Ruso Clásico',  subtitle: 'filosofía · chart 16s · 4 mesos · drawer + Week Picker', status: 'new', block: 'ho-atleta' },
  { view: 'HO_MACRO_ATHLETE',  title: 'Mi Macrociclo (atleta)', subtitle: 'vista del atleta de su macro activo · plate stacks',     status: 'new', block: 'ho-atleta' },
  { view: 'VOLTA_MACRO_ATHLETE', title: 'Volta · Mi Macrocycle', subtitle: '6 bloques timeline + 7 dominios CrossFit',              status: 'new', block: 'volta-atleta' },
  { view: 'CONTROL_DANIOS_V2', title: 'Control de Daños',      subtitle: 'ajuste auto IA · tono empático · sin culpa',              status: 'new', block: 'ho-atleta' },

  // 🚧 V2 partial · drop anterior · bloqueadas hasta porteo batch v4
  //   (CoachDashV2 rompe grid en mobile · resto tampoco está pulido)
  { view: 'V2_HOME',           title: 'Atleta Home (v2)',       subtitle: 'reemplazo del prompt 30 / refresh · pendiente',         status: 'pending', block: 'ho-atleta' },
  { view: 'V2_CHECKIN',        title: 'Daily Checkin (v2)',     subtitle: 'reemplazo planeado · pendiente',                          status: 'pending', block: 'ho-atleta' },
  { view: 'V2_COACH',          title: 'Coach Dashboard (v2)',   subtitle: 'reemplazo del prompt 24 (CommandCenter) · pendiente',     status: 'pending', block: 'ho-coach', promptId: 24 },
  { view: 'V2_SKILL_TREE',     title: 'Skill Tree (v2)',        subtitle: 'refresh diseño · pendiente',                              status: 'pending', block: 'ho-atleta' },

  // ✅ Nuevo · batch v4 · Ola 1 (auth + onboarding) portado a V3
  { view: 'LANDING_V3',        title: 'Landing · selector',     subtitle: 'prompt 01 · selector producto · ✅ portado',              status: 'new', block: 'auth', promptId: 1 },
  { view: 'LOGIN_V3',          title: 'Login',                  subtitle: 'prompt 02 · ✅ portado',                                 status: 'new', block: 'auth', promptId: 2 },
  { view: 'REGISTER_V3',       title: 'Register',               subtitle: 'prompt 03 · ✅ portado',                                 status: 'new', block: 'auth', promptId: 3 },
  { view: 'ONBOARDING_V3',     title: 'Onboarding Wizard',      subtitle: 'prompt 04 · 4 steps · ✅ portado (CSS reconstruido)',     status: 'new', block: 'auth', promptId: 4 },

  // 🚧 Pending · batch v4 prompts esperando generación + porteo
  { view: 'PREMIUM',           title: 'Premium Paywall',        subtitle: 'prompt 05 · batch v4 pendiente',                         status: 'pending', block: 'auth', promptId: 5 },

  { view: 'INDEX',             title: 'OLY Index detail',       subtitle: 'prompt 06 · batch v4 pendiente',                         status: 'pending', block: 'ho-atleta', promptId: 6 },
  { view: 'HO_STATS',          title: 'HO Stats',               subtitle: 'prompt 07 · batch v4 pendiente',                         status: 'pending', block: 'ho-atleta', promptId: 7 },
  { view: 'PROFILE',           title: 'Profile (3 secciones)',  subtitle: 'prompt 10 · Hormonal+Privacy+Delete · pendiente',        status: 'pending', block: 'ho-atleta', promptId: 10 },
  { view: 'SCHEDULE',          title: 'Session Schedule',       subtitle: 'prompt 11 · calendario · pendiente',                     status: 'pending', block: 'ho-atleta', promptId: 11 },
  { view: 'SESSION',           title: 'Active Session',         subtitle: 'prompt 13 · timer + sets + RPE · pendiente',             status: 'pending', block: 'ho-atleta', promptId: 13 },
  { view: 'VICTORY',           title: 'Victory Screen',         subtitle: 'prompt 15 · celebración PR · pendiente',                 status: 'pending', block: 'ho-atleta', promptId: 15 },
  { view: 'HORMONAL',          title: 'Hormonal Setup',         subtitle: 'prompt 16 · opt-in ciclo · pendiente',                   status: 'pending', block: 'ho-atleta', promptId: 16 },
  { view: 'BELT_CEREMONY',     title: 'Belt Ceremony',          subtitle: 'prompt 19 · refresh · pendiente',                        status: 'pending', block: 'ho-atleta', promptId: 19 },
  { view: 'LEADERBOARD',       title: 'Leaderboard cohort',     subtitle: 'prompt 22 · cohort-based · pendiente',                   status: 'pending', block: 'ho-atleta', promptId: 22 },

  { view: 'COACH_DASH',        title: 'Command Center coach',   subtitle: 'prompt 24 · batch v4 pendiente',                         status: 'pending', block: 'ho-coach', promptId: 24 },
  { view: 'ATHLETE_DETAIL',    title: 'Athlete Deep Dive',      subtitle: 'prompt 25 · batch v4 pendiente',                         status: 'pending', block: 'ho-coach', promptId: 25 },
  { view: 'ASSIGN_MACRO',      title: 'Assign Macro · Gantt',   subtitle: 'prompt 26 · CON Week Picker · pendiente',                status: 'pending', block: 'ho-coach', promptId: 26 },

  { view: 'VOLTA_HOME_V3',     title: 'Volta Dashboard',        subtitle: 'prompt 30 · home Volta · ✅ portado',                     status: 'new', block: 'volta-atleta', promptId: 30 },
  { view: 'VOLTA_PREWOD',      title: 'Volta PreWod readiness', subtitle: 'prompt 31 · batch v4 pendiente',                         status: 'pending', block: 'volta-atleta', promptId: 31 },
  { view: 'WARMUP',            title: 'Volta Warmup Mayhem',    subtitle: 'prompt 32 · 3 fases · pendiente',                        status: 'pending', block: 'volta-atleta', promptId: 32 },
  { view: 'VOLTA_STATS',       title: 'Volta Stats',            subtitle: 'prompt 35 · benchmarks · pendiente',                     status: 'pending', block: 'volta-atleta', promptId: 35 },

  { view: 'VOLTA_COACH',       title: 'Volta Coach Dash',       subtitle: 'prompt 36 · batch v4 pendiente',                         status: 'pending', block: 'volta-coach', promptId: 36 },
  { view: 'VOLTA_COACH_WOD',   title: 'Volta Coach WOD builder',subtitle: 'prompt 37 · batch v4 pendiente',                         status: 'pending', block: 'volta-coach', promptId: 37 },
];

const STATUS_META: Record<ItemStatus, { label: string; color: string; clickable: boolean }> = {
  new:     { label: '✓ NUEVO',       color: '#22C55E', clickable: true  },
  partial: { label: '◐ PARCIAL',     color: '#FBBF24', clickable: true  },
  pending: { label: '◌ EN MIGRACIÓN', color: '#64748B', clickable: false },
};

const BLOCK_TITLE: Record<string, string> = {
  'auth':         'Auth & Onboarding',
  'ho-atleta':    'Holy Oly · Atleta',
  'ho-coach':     'Holy Oly · Coach',
  'volta-atleta': 'Volta · Atleta',
  'volta-coach':  'Volta · Coach',
  'componentes':  'Componentes / Modals',
};

export default function DemoHubV2() {
  const { navigate } = useNav();

  const grouped = ITEMS.reduce<Record<string, DemoItem[]>>((acc, it) => {
    const k = it.block || 'otros';
    (acc[k] = acc[k] || []).push(it);
    return acc;
  }, {});

  const counts = ITEMS.reduce(
    (a, i) => ({ ...a, [i.status]: a[i.status] + 1 }),
    { new: 0, partial: 0, pending: 0 } as Record<ItemStatus, number>
  );

  return (
    <div className="dh-root">
      <header className="dh-header">
        <div className="dh-tag">PEAK QUAL · DEMO HUB</div>
        <h1>UI Migration Status</h1>
        <p className="dh-sub">
          Navegá solo las pantallas con UI nuevo. Las legacy están bloqueadas hasta su porteo.
        </p>
        <div className="dh-stats">
          <span className="dh-stat" data-s="new">✓ {counts.new} nuevas</span>
          <span className="dh-stat" data-s="partial">◐ {counts.partial} parciales</span>
          <span className="dh-stat" data-s="pending">◌ {counts.pending} pendientes</span>
        </div>
      </header>

      {Object.entries(grouped).map(([block, items]) => (
        <section key={block} className="dh-block">
          <h2 className="dh-block-title">{BLOCK_TITLE[block] || block}</h2>
          <div className="dh-grid">
            {items.map(it => {
              const meta = STATUS_META[it.status];
              return (
                <button
                  key={it.view}
                  className="dh-card"
                  data-status={it.status}
                  disabled={!meta.clickable}
                  onClick={() => meta.clickable && navigate(it.view)}
                  style={{ ['--status-c' as string]: meta.color } as React.CSSProperties}>
                  <span className="dh-card-status">{meta.label}</span>
                  <span className="dh-card-title">{it.title}</span>
                  <span className="dh-card-sub">{it.subtitle}</span>
                  {it.promptId && (
                    <span className="dh-card-prompt">prompt #{it.promptId}</span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      ))}

      <footer className="dh-footer">
        <p>
          ¿Encontraste algo raro? El demo tiene mock data inline · sin backend real.
        </p>
        <p className="dh-credits">
          Build · {new Date().toISOString().slice(0, 10)} · Branch <code>feat/api-first-refactor</code>
        </p>
      </footer>
    </div>
  );
}
