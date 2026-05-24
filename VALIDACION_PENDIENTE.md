# Lista de Validación · Pantallas y Mejoras Visuales

Para que vos validés antes de que yo trabaje sobre esto.

---

## A) Bugs ya fixeados en esta sesión (4)

Estos ya están commiteados en el PR #2. Solo validá que se vean bien.

| # | Pantalla | Bug | Status |
|---|----------|-----|--------|
| 1 | Todas mobile (DEV) | Dev nav switcher tapaba bottom nav real | ✅ Colapsable con toggle ⋯ |
| 2 | AssignMacrocycle | Sticky CTA transparente sobre cards | ✅ Backdrop gradient + blur |
| 3 | AthleteDeepDive | Gráfico Carga Semanal barras altura 0 | ✅ Flexbox stretch |
| 4 | VoltaCoachWod | WISE FAB tapaba "PUBLICAR AL BOX" | ✅ Prop `bottomOffset=170` |

---

## B) Pendientes por auditar (decidí si los reviso ahora)

Screens que NO entré aún en esta pasada. Probable que tengan bugs similares:

### Holy Oly Atleta
- [ ] `WARMUP` — Warmup Generator (timer, exercises)
- [ ] `SESSION` — Active Session (set tracker, rest timer)
- [ ] `SUMMARY` — Post-WOD summary (recap)
- [ ] `VICTORY` — Victory screen (XP, badges)
- [ ] `PERFORMANCE` — Performance Deep Dive (gráficos 1RM trends)
- [ ] `INDEX` — Oly Index (score global)
- [ ] `SCHEDULE` — Session Schedule (semana)
- [ ] `PULSE` — Pulse Hub (wellness)
- [ ] `PILLS` — Knowledge Pills (tips)
- [ ] `SOCIAL` — Social Card
- [ ] `ONBOARDING` — Onboarding biométrico
- [ ] `PREMIUM` — Premium upgrade

### Volta Atleta
- [ ] `PROGRESSION` — Movement Progression (muscle-up, HSPU)

### Volta Coach
- [ ] `VOLTA_COACH_MACRO` — Eval Macrociclo
- [ ] `VOLTA_COACH_INVENTORY` — Inventario Box

### Auth flow
- [ ] `LOGIN` — pantalla nueva con botón GitHub
- [ ] `REGISTER`
- [ ] `GITHUB_CALLBACK`

---

## C) Mejoras visuales propuestas (basadas en refs de GitHub/Dribbble)

### C1. Hero cards más premium
**Hoy:** Cards con border solid `var(--card-border)`, sin gradient, planas.
**Propuesta:**
- Glassmorphism sutil en cards de estado (HRV/sueño/V-Form)
- Gradient sutil top→bottom dentro del card
- Border `1px` con `linear-gradient` en bordes destacados (ej. card del WOD del día)

Inspiración: [Fitness Challenge App por Orbix Studio](https://me.muz.li/orbix-studio/fitness-challenge-app-gamified-health-tracking-ui-2)

### C2. Animaciones de entrada/transición
**Hoy:** Cero animaciones — todo aparece de golpe al navegar.
**Propuesta:**
- Fade-in + slide-up suave (200ms) en cards al entrar a pantalla
- Skeleton loader en cards mientras cargan datos
- Pulse en badges críticos (HRV crítico, V-Form rojo)

Librerías: `framer-motion` (estándar React, ya popular). Costo: +20KB gzipped.

### C3. Charts más serios
**Hoy:** Charts son `<div>` con altura % manual. Funciona pero limitado.
**Propuesta:** Usar **Recharts** o **Visx** para:
- Performance Deep Dive (trends 1RM en líneas)
- Carga Semanal ATL/CTL (área stacked con gradient)
- Pulse Hub (HRV trend con banda de baseline)

Referencia: [Serkanbyx/fitness-tracker](https://github.com/Serkanbyx/fitness-tracker) usa Recharts en dark mode con buena integración.

### C4. Iconos consistentes
**Hoy:** Mix de emojis (🏋️ ⚡ 🔥 💪) + SVG inline custom (bottom nav).
**Propuesta:** Reemplazar emojis críticos por **lucide-react** icons. Mantener emojis solo en mood selectors / contenido informal.

Inspiración: [Momentum Habit Tracker](https://github.com/TrisTheKitten/Habit-Tracker-) usa lucide-react full dark theme.

### C5. Typography hierarchy
**Hoy:** Mix de pesos (700/800/900) con sizes inconsistentes (10/11/12/13).
**Propuesta:** Definir 4 estilos canónicos:
- `heading-xl`: 28px / 900 / -.02em (page titles)
- `heading-md`: 17px / 800 / -.01em (section titles)
- `body`: 13px / 600 (default text)
- `caption`: 10px / 700 / .1em uppercase (labels)

Aplicar via CSS classes en `index.css` o tokens del theme.

### C6. Loading + Empty states unificados
**Hoy:** Cada empty state se diseñó ad-hoc (ej. el de chart que fixeé hoy).
**Propuesta:** Componente `<EmptyState icon="📊" title="..." subtitle="..." cta?={...} />` reusable.

### C7. Dark theme con más profundidad
**Hoy:** Solo 2 niveles de profundidad (`bg`, `surface`).
**Propuesta:** Agregar `surface2` y `surface3` con elevation real:
- `bg`: #07070F (base)
- `surface`: #0F0F1C (cards nivel 1)
- `surface2`: #161626 (cards anidadas)
- `surface3`: #1E1E32 (chips/badges)

Ya existe `surface2` en algunos lugares pero no es consistente.

---

## D) GitHub repos como referencia (links útiles)

| Repo | Por qué |
|------|---------|
| [Serkanbyx/fitness-tracker](https://github.com/Serkanbyx/fitness-tracker) | React 18 + TS + Zustand + Recharts + Tailwind dark. Charts profesionales. |
| [Momentum Habit Tracker](https://github.com/TrisTheKitten/Habit-Tracker-) | Lucide icons + Tailwind dark. Buen pattern de cards. |
| [TailGrids](https://github.com/Tailgrids/tailgrids) | Librería de UI blocks listos. Útil para hero sections. |
| [Abdull121/Fitness-Tracking-Web-App](https://github.com/Abdull121/Fitness-Tracking-Web-App) | Fullstack con tracker de peso. Buenas tablas. |
| [Dribbble: Crossfit App](https://dribbble.com/tags/crossfit-app) | 17 conceptos visuales de apps CrossFit |
| [Dribbble: Fitness App](https://dribbble.com/tags/fitness-app) | 6000+ apps fitness — para hero sections, leaderboards |

---

## E) Sugerencia de orden de ataque

Priorizado por impacto/costo:

### Quick wins (1-2 horas c/u)
1. C6 — Componente `<EmptyState>` reusable
2. C5 — Typography canónica en `index.css`
3. C7 — Surfaces más profundos consistentes
4. B — Audit visual del resto de pantallas + fixes inline

### Medium (medio día c/u)
5. C4 — Migrar emojis críticos a lucide-react
6. C2 — Animaciones con framer-motion (fade-in + skeleton)

### Big (1 día+)
7. C3 — Charts con Recharts (refactor de Performance, Carga, Pulse)
8. C1 — Glassmorphism + gradients premium

---

## ¿Cómo quiero que sigamos?

Decime:

1. **¿Auditas el resto de pantallas (B) antes o después de las mejoras visuales (C)?**
2. **¿De C, qué orden? (sugiero: C7 → C5 → C6 → C4 → C2 → C3 → C1)**
3. **¿Hay alguna pantalla específica que sabés que está rota?** (la priorizo)
4. **¿Algún ref visual de Dribbble/repo que te haya pegado más?** (mando a fondo en ese estilo)

Sources:
- [Serkanbyx/fitness-tracker](https://github.com/Serkanbyx/fitness-tracker)
- [Momentum Habit Tracker](https://github.com/TrisTheKitten/Habit-Tracker-)
- [TailGrids React UI Library](https://github.com/Tailgrids/tailgrids)
- [21 Dark Admin Dashboards 2026](https://colorlib.com/wp/dark-admin-dashboard-templates/)
- [Dribbble · Crossfit App](https://dribbble.com/tags/crossfit-app)
- [Dribbble · Fitness App](https://dribbble.com/tags/fitness-app)
- [Orbix Studio · Fitness Challenge App](https://me.muz.li/orbix-studio/fitness-challenge-app-gamified-health-tracking-ui-2)
- [Top Open-Source React Native UI 2026](https://dev.to/ellispike/top-open-source-react-native-ui-libraries-of-2026-oie)
