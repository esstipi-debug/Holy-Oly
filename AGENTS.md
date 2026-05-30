# Holy Oly — Task Brief para Agentes

> ⛔ **REGLA DURA (Boss · 2026-05-30) · PRIORIDAD MÁXIMA — DATA Y DISEÑO REALES, CERO INVENTO SIN SUPERVISIÓN**
> - Toda data que se muestre viene del **backend/engine real**. PROHIBIDO mockear, generar
>   client-side, o usar `data/*` para datos del atleta. Demo = usuario demo real seedeado, no mock.
> - Toda UI sigue el **diseño canónico aprobado por el Boss**. No inventar estilo nuevo ni copiar el viejo.
> - Si falta el endpoint/dato/diseño real → **PARAR y preguntar al Boss**, NO inventar para "que funcione".
> - **Verificar contra el código/backend antes de afirmar** (los docs pueden estar stale).
> - Inventar sin supervisión = confusión (frontend ≠ backend ≠ docs) + retrabajo. Detalle: `AUDIT_DATA_INTEGRITY.md`.
>
> ⚠️ NOTA: el resto de este AGENTS.md está **desactualizado (2026-05-05)** — verificar contra el repo real antes de usarlo.

> Repo: https://github.com/esstipi-debug/Holy-Oly  
> App en vivo: https://holy-oly-frontend.onrender.com  
> Stack: Vite + React + TypeScript (frontend) · FastAPI (backend en Render)  
> Wireframes locales: `/wireframes/` — abrir `index.html` para ver el diseño objetivo

---

## Contexto rápido

Holy Oly es una app móvil (390×844px simulada en browser) para atletas de halterofilia argentina. Tiene:
- **Atleta flow**: Home → Warmup → Session → Victory → Stats
- **Coach flow**: CommandCenter → AthleteDeepDive → AssignMacrocycle
- **29 temas visuales** (Theme Gallery, archivo `public/b16-themes.css`)
- **Stress Engine** (Banister model) en backend: `POST /v1/stress/calculate`

El diseño objetivo está en `wireframes/B1_dashboard_atleta.html` (atleta) y `wireframes/index.html` (índice completo).

---

## Estado actual (2026-05-05)

### Funcionando ✅
- Build y deploy en Render (auto-deploy en push a `main`)
- SPA routing (`_redirects` + `render.yaml`)
- App abre directo en HOME sin login
- AtletaHome: réplica del wireframe B1 con inline styles
- Theme system: CSS vars en `:root`, 29 temas en `src/themes.ts`
- ThemeGallery: grid 2col con previews reales de cada tema
- Google Fonts cargadas en `index.html`
- Seed data: 5 atletas argentinos en `src/data/athletes.ts`
- AthleteContext: llama `/v1/stress/calculate` y expone `stress`

### Pendiente ❌

#### ALTA PRIORIDAD
1. **Pantallas incompletas** — estas pages tienen stubs placeholder, necesitan replicar sus wireframes:
   - `src/pages/ActiveSession.tsx` → wireframe: `B3_active_session.html`
   - `src/pages/WarmupGenerator.tsx` → wireframe: `B2_warmup_generator.html`
   - `src/pages/VictoryScreen.tsx` → wireframe: `B4_victory_screen.html`
   - `src/pages/OlyIndex.tsx` → wireframe: `B5_oly_index.html`
   - `src/pages/SessionSchedule.tsx` → wireframe: `B6_schedule.html`
   - `src/pages/PulseHub.tsx` → wireframe: `B7_pulse_hub.html`
   - `src/pages/KnowledgePills.tsx` → wireframe: `B8_knowledge_pills.html`
   - `src/pages/PerformanceDeepDive.tsx` → wireframe: `B9_performance.html`
   - `src/pages/SocialCard.tsx` → wireframe: `B10_social.html`
   - `src/pages/CommandCenter.tsx` → wireframe: `V1_command_center.html` (coach)
   - `src/pages/AthleteDeepDive.tsx` → wireframe: `V2_athlete_detail.html` (coach)
   - `src/pages/Profile.tsx` → mejorar, actualmente tiene datos hardcoded de "Juan Pérez"

2. **Profile usa datos reales**: conectar con `useAthlete()` de `AthleteContext`

#### MEDIA PRIORIDAD
3. **Onboarding** (`src/pages/Onboarding.tsx`) — flujo de registro nuevo atleta
4. **SessionSummaryPreview** (`src/pages/SessionSummaryPreview.tsx`) — resumen post-sesión

---

## Cómo replicar un wireframe

### Patrón estándar para cada page

```tsx
// src/pages/NombrePage.tsx
import { useAthlete } from '../context/AthleteContext';

export default function NombrePage() {
  const { athlete, stress } = useAthlete();
  
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%', padding: '0 0 80px' }}>
      {/* Replicar el HTML del wireframe usando inline styles con CSS vars */}
      {/* Usar: var(--bg), var(--surface), var(--text), var(--text-secondary) */}
      {/* var(--primary), var(--card-bg), var(--card-border), var(--cta-bg) */}
    </div>
  );
}
```

### CSS vars disponibles (definidas en `src/themes.ts`)
```
--bg            fondo de pantalla
--surface       fondo de cards/nav
--text          texto principal
--text-secondary texto secundario
--primary       color de acento (verde por defecto: #22C55E)
--card-bg       fondo de tarjetas
--card-border   borde de tarjetas
--cta-bg        fondo del botón CTA
--cta-text      texto del botón CTA
--radius        border-radius estándar
--status-bg/text/border  colores del badge de estado
```

### Paleta hardcoded (Holy Oly Dark, siempre segura)
```
#07070F  fondo principal
#111118  cards
#1e1e30  bordes
#f1f5f9  texto principal
#64748b  texto secundario
#22C55E  verde primario
#F59E0B  dorado/ámbar
#6366F1  índigo (stats, macrocycle)
```

---

## Datos disponibles en AthleteContext

```ts
const { athlete, stress, stressLoading, allAthletes } = useAthlete();

athlete: {
  id, name, email, age, gender, weight_class,
  club, coach_id, subscription,
  maxes: { snatch, clean_jerk, back_squat, front_squat },
  macrocycle: { name, week, total_weeks, phase },
  injuries: [{ body_part, severity, notes }],
  sessions_last_7: number,
  prior_fitness: number,
  prior_fatigue: number,
}

stress: {
  fitness: number,      // CTL
  fatigue: number,      // ATL  
  form: number,         // TSB
  readiness: number,    // 0-100
}
```

---

## Flujo de navegación (App.tsx)

La app usa `View` string como router. Para navegar entre views, el componente necesita recibir un `onNavigate` prop o usar un contexto. Por ahora el nav está solo en `App.tsx`.

Para testear una pantalla: usar el **UI Explorer** sidebar (visible en desktop 2xl+) o la barra inferior de botones en mobile.

---

## Cómo correr localmente

```bash
cd frontend
npm install
npm run dev
# abre http://localhost:5173
```

## Deploy

```bash
# Desde raíz del repo
git add -A
git commit -m "descripción"
git push
# Render auto-deploya en ~2 min
```

---

## Archivos clave

```
frontend/
  src/
    App.tsx                    # Router principal + dev sidebar
    themes.ts                  # 29 temas con CSS vars
    data/athletes.ts           # 5 atletas seed
    context/
      ThemeContext.tsx          # setTheme(), currentTheme
      AthleteContext.tsx        # athlete, stress data
      AuthContext.tsx           # user, auto-auth (no login)
    pages/
      AtletaHome.tsx            # ✅ COMPLETO — referencia de calidad
      [otras pages]             # ❌ pendientes
    components/
      ThemeGallery.tsx          # Gallery de 29 temas
      Card.tsx / Button.tsx / Badge.tsx / Input.tsx
    layouts/
      PhoneLayout.tsx           # Shell del "teléfono" + bottom nav
  public/
    b16-themes.css             # CSS de los 29 temas (NO modificar)
    _redirects                 # SPA routing para Render
  index.html                   # Google Fonts precargadas aquí
wireframes/
  B1_dashboard_atleta.html    # Diseño objetivo Home
  B2_warmup_generator.html
  B3_active_session.html
  [... etc]
  index.html                   # Índice navegable de todos los wireframes
```
