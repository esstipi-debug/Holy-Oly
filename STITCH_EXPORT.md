# HolyOly — Design Specs for Google Stitch

**App:** HolyOly — Smart training, zero burnout  
**Type:** Weightlifting coaching platform (Athlete + Coach)  
**Platform:** Mobile-first web app (React + Vite + Tailwind)  
**Design System:** Dark theme primary, 4 premium themes available

---

## Global Design Tokens

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#07070F` | App background |
| `--surface` | `#111118` | Cards, panels |
| `--surface2` | `#1A1A26` | Elevated cards |
| `--primary` | `#22C55E` | Green (success, readiness) |
| `--gold` | `#F59E0B` | Gold (OLY Index, PRs, achievements) |
| `--cyan` | `#06B6D4` | Cyan (Smart/Carbon theme) |
| `--indigo` | `#6366F1` | Indigo (Coach, onboarding) |
| `--danger` | `#EF4444` | Red (risk, warnings) |
| `--warning` | `#EAB308` | Yellow (moderate risk) |
| `--text-primary` | `#f1f5f9` | Main text |
| `--text-secondary` | `#94a3b8` | Labels |
| `--text-muted` | `#475569` | Captions |
| `--border` | `#1e1e30` | Card borders |

### Typography
- **Font:** Inter (system-ui fallback)
- **Weights:** 400, 600, 700, 800, 900
- **Heading pattern:** 20px–48px, weight 800–900, letter-spacing -.02em
- **Body:** 12–14px, weight 400–600
- **Labels:** 10–11px, weight 700, uppercase, letter-spacing .06em–.08em

### Spacing
- Border radius: 12px (small), 14px–16px (medium), 20px–28px (large), 44px (phone)
- Card padding: 14px–24px
- Section gap: 16px–24px

### Navigation Pattern
- **Athlete bottom nav (4 items):** Inicio, Sesión, Progreso, Perfil
- **Coach bottom nav (4 items):** Panel, Ajustes, Equipo, Stats

---

## Screens (27 Wireframes)

---

### A1 · Login

**Route:** `/login`  
**Purpose:** Email/password + Apple/Google social auth

**Layout:**
- Centered logo (gradient purple square with 🏋️, 72px)
- "HolyOly" title, tagline "Smart training, zero burnout."
- Email input field (placeholder: tu@email.com)
- Password input with "¿Olvidaste tu contraseña?" link right-aligned
- Primary button: "Iniciar sesión" (full width, indigo #6366F1)
- Divider "o continúa con"
- Two social buttons: Apple + Google (side by side, ghost style)
- "¿Primera vez? Crear cuenta" link below
- Info note: roles auto-detected from account

---

### A2 · Register (with Coach Invite)

**Route:** `/register`  
**Purpose:** Multi-step registration with coach invite context

**Layout:**
- 3-step indicator (Paso 1: Cuenta → 2: Perfil → 3: Acceso)
- Invite badge: "45 días Elite gratis — Invitado por Coach Ramírez" (amber gradient)
- Role selector cards (2 columns): Atleta 🏋️ vs Coach 📋 (Atleta pre-selected)
- Form fields: Nombre completo, Email, Contraseña, Confirmar contraseña
- Terms checkbox with links
- CTA: "Crear mi cuenta → Paso 2"
- Social auth alternative (Apple + Google)

---

### A3 · Forgot Password

**Route:** `/forgot-password`  
**Purpose:** OTP-based password reset (3 states)

**Layout (3 states, toggle):**
1. **Email:** Icon ✉️, "Olvidé mi contraseña", email input, "Enviar código →"
2. **OTP:** 6-digit input boxes, countdown timer "4:47", "Verificar código →" + "Reenviar código"
3. **New password:** Password + confirm, strength indicator (3/4 bars), "Guardar nueva contraseña"
- Note: closing all sessions on devices after reset

---

### B1 · Athlete Dashboard

**Route:** `/dashboard`  
**Purpose:** Main daily hub for athletes

**Layout:**
- **Header:** Greeting "Buenos días, [Name]", belt badge (e.g. CINTURÓN AZUL), avatar circle
- **Píldoras row (Stories):** Scrollable horizontal pills — 🧠 Mentalidad, 💤 Recuperación, 🎯 Técnica, 🥗 Nutrición (gradient ring for active, gray for unread)
- **Readiness + OLY Index row (2 columns):**
  - Left: Readiness ring gauge (110px, score 78, "VERDE", +5 vs ayer)
  - Right: OLY Index card (7.4, "Top 23% del club") + Streak card (🔥 14 DÍAS)
- **Belt Progress:** XP bar (88,400/100,000, 88%, gradient blue→purple)
- **Today's Session card:** Macro name (Colombiano 5D — Fuerza), IMR 76%, exercise list (5 items with ⭐), risk chip "VERDE", CTA "Iniciar Sesión →" (green gradient)
- **Pulse Widget:** "Reto Semanal Pulse" — EMOM 12min AirBike, +300 XP, purple accent
- **Quick Stats row (3 columns):** Sesiones (3), Tonelaje (42.5t), XP (+750)
- **Bottom nav:** Inicio (active green), Sesión, Progreso, Perfil

---

### B2 · Pre-Check (5 Sliders)

**Route:** `/pre-check`  
**Purpose:** Daily wellness check-in before session

**Layout:**
- Back arrow + title "Check-in diario · ¿Cómo te sientes hoy?"
- Risk score card: large number (18, green), "VERDE · Sin adaptaciones"
- 5 sliders (horizontal, 1–5 scale):
  1. 🧠 Coordinación
  2. 😴 Fatiga
  3. 💪 Dolor muscular
  4. 🎯 Enfoque mental
  5. 🌙 Calidad de sueño
- CTA: "Analizar Riesgo →" (green)
- Secondary: "Skip Check-in (desactiva protección de lesiones)" (ghost)

---

### B3 · Injury Shield Modal

**Route:** Modal overlay (triggered from dashboard/pre-check)  
**Purpose:** Risk intervention — shows when risk score is high

**Layout (3 risk levels):**

**RED (76/100):**
- Shield icon pulsing (🛡️, red border), "Modo Protección Activado"
- "Tu cuerpo necesita un ajuste hoy"
- Risk badge: 76 ROJO
- Reason badges: 😴 Sueño 4h, 😣 Fatiga 4/5, 🦵 Dolor rodilla 3/5, ⚡ CNS bajo
- Exercise comparison (Original → Suggested): Full Snatch → Power Snatch, -15% load
- AI explanation card: "Tu CNS no está recuperado..."
- CTA: "🛡️ Activar Protección" (cyan) + "Ignorar riesgo" (ghost, with warning)

**YELLOW (42/100):**
- Similar but amber tones, "Ajuste Recomendado"
- "Puedes entrenar, pero con precaución"
- 3 options: Apply adjustment / Continue with risk accepted / Dismiss

**IN-SESSION GUARDIAN:**
- Triggered when RPE reported 10×3 vs planned RPE 8
- Warning: "Estás por encima de la intensidad programada"
- Options: Recalculate & protect / Continue aware (coach gets alert)

---

### B4 · Session Summary (Pre-Session)

**Route:** `/session/:id/summary`  
**Purpose:** Review session details before starting

**Layout:**
- Header: "Resumen de Sesión"
- Main card: Macro name, focus (Fuerza Máxima), estimated time (75 min), blocks (5), intensity (85%)
- Coach note: Card with left amber border, coach's message
- Exercise list: 5 exercises with sets/reps/weights (⭐ for main lifts)
- Full-width CTA: "COMENZAR SESIÓN →" (green gradient, 60px tall)

---

### B5 · Warmup Generator

**Route:** `/session/:id/warmup`  
**Purpose:** Readiness-aware warmup protocol

**Layout:**
- Header: "Calentamiento" + "Readiness Aware: Activo" (green)
- 3 phase tabs: Movilidad | Específico (active) | Aproximación
- Warmup checklist (items with check circles):
  - Muscle Snatch (done ✓)
  - Snatch Balance (active, with 🔄)
  - Power Snatch + OHS
- Divider: "Series de Aproximación"
- Ramp-up sets with progressive weights: 40kg (45%) → 60kg (65%)
- Rest timer card: "45s descanso entre series, Zona 2 HR"
- CTA: "FINALIZAR CALENTAMIENTO →" (green)
- Skip option

---

### B6 · Active Session (Logging)

**Route:** `/session/:id/active`  
**Purpose:** Log sets/reps during training

**Layout:**
- Progress bar: "Ejercicio 1 de 5 · 20%" + timer (⏱ 34:12)
- Exercise card: Name (Arrancada), plan (5×3 @ 80kg, 85% 1RM), current 1RM (94kg)
- "🔥 Generar Calentamiento Inteligente" button
- PR Flash banner (animated gold glow): "¡NUEVO PR DETECTADO!"
- Sets grid (4 columns: Set#, Weight, Reps, Check):
  - Sets 1–3: completed (green)
  - Set 4: active (border green, editing)
  - Set 5: pending (gray)
- "+ Agregar serie extra" (dashed border)
- Nav: Anterior | Siguiente ejercicio → (2:1 ratio)
- **RPE bottom sheet:** 1–10 selector pills, "Guardar RPE 6 →", skip option

---

### B7/B8 · Victory Screen (4 Themes × 2 Modes)

**Route:** `/session/:id/victory`  
**Purpose:** Post-session celebration + gamification

**Layout:**
- Mode tabs: ⭐ Epic PR | 🛡️ Smart Victory
- Avatar zone: SVG weightlifter silhouette (vectorial for most themes, 16-bit pixel for Cyber theme) with glow ring
- Achievement badge: "LEVEL UP! Snatch 94kg"
- Stats panel: PR (94kg), tonnage (18.45t), streak (15 days), Wise Score (+12→847)
- XP breakdown: Session (+100), PR (+500), Pre-check (+50), Streak (+75) = +725 total
- Belt progress bar
- CTA: "📲 Compartir mi Victoria" | "Volver al Dashboard"

**Themes:**
- Carbon Stealth (cyan)
- Olympic Gold (gold/black)
- Cyber Neon (magenta/cyan, pixel art avatar, scanlines)
- Crimson Power (red/neon)

**Modes:**
- Epic PR: Focus on records, gold accents
- Smart Victory: Focus on longevity, damage avoided (+18%), cyan accents

---

### B9 · Viral Card Generator

**Route:** `/share`  
**Purpose:** Generate 9:16 social card for Stories

**Layout:**
- Theme selector pills: Carbon | Gold | Cyber | Crimson
- Card type tabs: ⭐ PR Card | 🛡️ Smart Card | 🔥 Streak Card | 🏅 Belt Card
- Card preview (9:16 aspect ratio):
  - Photo background with dark gradient overlay
  - Athlete silhouette (🏋️, low opacity)
  - Top: Avatar + name + belt chip
  - Bottom: Big achievement number (e.g. 94 kg), secondary stats row (Ton, Streak, OLY, IMR, BW Ratio)
  - Bottom branding: "HOLYOLY" + QR code
  - Accent bar (top, theme color)
- "📷 Elegir foto" button (dashed)
- Caption suggestions (3 options selectable)
- Share buttons: Instagram Stories (primary), WhatsApp, Save image, More

---

### B10 · Performance Deep Dive

**Route:** `/analytics`  
**Purpose:** Golden Ratio engine + readiness projection

**4 Tabs:**

**Tab 1 — Radar:**
- SVG hexagonal radar chart (6 axes: Sn/CJ, FS/BS, Pull/CJ, CJ/BS, Sn/BS, FS/CJ)
- User polygon (purple) vs Ideal polygon (green dashed)
- Alert for weak axis (Sn/BS below ideal, amber)
- Ratio detail table with progress bars + ideal zones
- Golden Ratio XP rewards section
- Coach suggestion card

**Tab 2 — Detail:**
- Numerical breakdown of all ratios
- Each ratio: name, current value, progress bar with ideal zone marker, status badge

**Tab 3 — Readiness:**
- 3 stat cards: Fitness (68.4), Fatigue (42.1), Readiness (78 Verde)
- SVG line chart: 90-day readiness curve + 28-day projection (dashed)
- Today marker with tooltip
- Supercompensation window alert: "Pico en 7–9 días, Readiness 85+"

**Tab 4 — Lifestyle:**
- Period selector: Sem | Mes | 3m | 6m | 1y
- Sleep section: line chart, avg 7.2h, quality 82%
- Caffeine section: bar chart by day, threshold warning (>400mg)
- Alcohol section: dot chart by day, 30-day trend
- Wearables status: Apple Health + Google Fit (synced indicators)
- Configuration toggles

---

### B11 · OLY Index

**Route:** `/oly-index`  
**Purpose:** Competitive ranking + percentile analysis

**Layout:**
- Score card: Large 7.4 (gold), "Nivel: Avanzado"
- Ranking stats: #12/85 club, Top 14% percentile
- Performance breakdown bars:
  - 🏋️ Fuerza Absoluta: 8.2 (82%)
  - ⚡ Eficiencia: 6.9 (69%)
  - 📉 Consistencia: 9.1 (91%)
- Club leaderboard: Rank + avatar + name + level + score
  - "Me" row highlighted (amber border)

---

### B12/B13 · Pulse Hub

**Route:** `/pulse`  
**Purpose:** Weekly conditioning challenges (EMOM/For Time)

**Layout:**
- Challenge card with countdown timer
- EMOM protocol details
- Leaderboard for weekly challenge
- XP rewards info
- "Ver →" button to start challenge

---

### B14 · Píldoras / Stories

**Route:** `/stories`  
**Purpose:** Daily micro-tips (5 second reads, +50 XP)

**Layout:**
- Horizontal scrollable story pills (like Instagram Stories)
- Categories: Mentalidad, Recuperación, Técnica, Nutrición
- Gradient ring for unread, gray for read
- Full-screen story view with text overlay

---

### B15 · Athlete Profile

**Route:** `/profile`  
**Purpose:** Athlete settings + personal data

**Layout:**
- Profile header: Avatar, name, belt, OLY Index
- Wise Score section
- Theme selector
- Nutrition sync status (Apple Health / Google Fit)
- Privacy settings
- Subscription/trial status

---

### C1 · Coach Command Center

**Route:** `/coach/panel`  
**Purpose:** Main dashboard for coaches — athlete risk overview

**Layout:**
- Header: "Panel de control", Coach name, avatar, +Atleta button
- View toggle: Hoy | Semana | 28d
- Global stats strip: 45 atletas, 12 Premium, 33 Trial, 94% Longevidad
- **Riesgo Alto section (red, 3 athletes):**
  - Athlete cards: avatar, name, status chip (Overreaching), readiness dot (score), context line
  - Left red border on card
- **Riesgo Moderado section (yellow, 5 athletes):**
  - Same format, amber styling
  - "+4 atletas más" expandable
- **Ausentes section (gray, 4 athletes):**
  - "3 días ausente", streak broken
- **Pulse Engine section (purple):**
  - Protocol suggestion, athlete avatars stacked, "Aprobar e Inyectar" button
- **Bottom nav:** Panel (active indigo), Ajustes, Equipo, Stats

---

### C2 · Risk Intervention Modal

**Route:** Modal (from C1)  
**Purpose:** Deep dive into at-risk athlete

**Layout:**
- Bottom sheet over blurred background
- Athlete header: avatar, name, risk score (22/100, red)
- Quick diagnosis: sleep, pain, planned session
- AI suggestion: "Cambiar Snatch → Power Snatch · -15% · Eliminar series"
- Actions: "✅ Aplicar Adaptación" (primary), "💤 Asignar Recuperación" | "🔍 Ver perfil", "Ignorar"

---

### C3 · Adjustment Hub

**Route:** `/coach/adjustments`  
**Purpose:** Bulk approve AI suggestions for athlete sessions

**Layout:**
- "7 sugerencias de la IA" header
- Bulk approve card: "Aprobar todas las sugerencias de seguridad — 5 adaptaciones" (green)
- Individual cards (swipeable):
  - Athlete avatar + name + suggestion + risk score
  - 3 actions per card: ✅ Aprobar | 👁 Ver más | ✗ Ignorar
- "+5 sugerencias más..." collapsed

---

### C4 · Athlete Deep Dive

**Route:** `/coach/athlete/:id`  
**Purpose:** 7/14/28-day rollable analytics for single athlete

**Layout:**
- Athlete header + period selector (7/14/28 day roller)
- Session history with adherence
- Readiness trend
- Macrocycle progress
- Coach notes section

---

### C5/C6 · Add Athlete + Assign Macrocycle

**Route:** `/coach/add-athlete`  
**Purpose:** Onboard new athlete with coach invite link

**Layout:**
- Anonymous code auto-generated
- Pre-filled invite link
- WhatsApp + Email share buttons
- Macrocycle assignment dropdown
- Only 1 coach per athlete (confirmed)

---

### C7/C8/C9 · Coach Tools

**Route:** `/coach/tools`  
**Purpose:** Pulse approval, leaderboard, coach profile

**Layout:**
- Pulse approval interface
- Longevity leaderboard (team-wide)
- Coach profile (private, visible to their athletes only)

---

### D1 · Onboarding Athleta

**Route:** `/onboarding`  
**Purpose:** 4-step onboarding flow

**Layout (4 steps):**

**Paso 1 — Bienvenida:**
- Coach invite message: "Coach Ramírez te ha invitado"
- 45-day Elite Trial badge (indigo, animated glow)
- Feature list: Session Adaptation AI, Gamificación, Injury Shield, 4 Temas, Wise Score
- "¿Por qué 45 días?" explanation (Banister model needs 28 days to calibrate)
- CTA: "Empezar mi calibración →"
- "Sin tarjeta de crédito" note

**Paso 2 — 1RMs:**
- 4 input rows: Arrancada, Dos Tiempos, Sentadilla Trasera, Sentadilla Frontal
- Smart ratio preview: Sn/CJ 0.795 ✓, FS/BS 0.862 ✓
- "No tengo mis marcas — el coach las ingresará" option

**Paso 3 — Perfil Base:**
- Name, Weight (kg), Biological sex (M/F toggle), Experience level (Novato/Intermedio/Avanzado)

**Paso 4 — ¡Listo!:**
- Success icon (green check)
- Assigned macrocycle: 🇨🇴 Colombiano 5D, 16 semanas
- First session preview
- CTA: "Ir a mi Dashboard →"

---

### D2 · Free → Premium Transition

**Route:** `/trial-expiring`  
**Purpose:** Trial expiration + upsell

**Layout:**
- Trial days remaining countdown
- Feature comparison (Free vs Premium)
- Upgrade CTA
- Grace period info (3 days)

---

## B · Stress Engine Charts (Bonus)

### B_cns_battery.html
- CNS Battery visualization: gauge showing current neural capacity
- Depletion vs recovery states
- Color-coded zones (green/amber/red)

### B_stress_3layers.html
- 3-layer stress model: Training + Lifestyle + Psychological
- Stacked visualization showing total load

### B_stress_correlations.html
- Scatter plot: Sleep × Load (risk map)
- Zone indicators
- Correlation insights

---

## Component Reference

### Readiness Ring
- Circular progress gauge, 110px diameter
- 3 states: Green (≥60), Amber (26-59), Red (≤25)
- Center: score number + zone label
- Border color + glow matches zone

### Athlete Card (Coach View)
- Avatar (38px circle, first initial)
- Name + status chip
- Context line (emoji + text)
- Readiness dot (36px, colored border)
- Left colored border for risk level

### Status Chips
- `chip-overreaching`: red bg + border
- `chip-peaking`: green bg + border  
- `chip-maturity`: cyan bg + border
- `chip-absent`: gray bg + border
- `chip-trial`: purple bg + border

### Bottom Sheet Modal
- Handle bar (36×4px, rounded, gray)
- Slides up from bottom
- Backdrop blur overlay
- Border-top with matching risk color

### Set Input Grid
- 4 columns: Set#, Weight, Reps, Check
- States: done (green border/bg), active (highlighted), pending (gray)
- Check button: empty → checkmark on completion

### PR Flash Banner
- Gold gradient background
- Animated pulse glow
- Trophy icon + achievement text

---

## Navigation Architecture

```
/ (redirects based on auth)
/login (A1)
/register (A2)
/forgot-password (A3)

Athlete Routes:
/dashboard (B1)
/pre-check (B2)
/session/:id (B4 summary → B5 warmup → B6 active → B7/B8 victory)
/share (B9)
/analytics (B10 — 4 tabs)
/oly-index (B11)
/pulse (B12/B13)
/stories (B14)
/profile (B15)

Coach Routes:
/coach/panel (C1)
/coach/athlete/:id (C4)
/coach/add-athlete (C5/C6)
/coach/adjustments (C3)
/coach/tools (C7/C8/C9)

Shared:
/onboarding (D1 — 4 steps)
/trial-expiring (D2)
```

---

## Key UX Patterns

1. **Color = Status:** Green (good), Amber (caution), Red (danger), Purple (pulse/coach)
2. **Bottom sheets > modals:** All interventions slide up from bottom
3. **Risk-driven hierarchy:** Red items always on top, then yellow, then gray
4. **Gamification everywhere:** XP, belts, streaks, badges on every screen
5. **Coach-in-the-loop:** AI suggests, coach approves (never auto-apply critical changes)
6. **Readiness-aware:** Every session adapts based on daily pre-check + Banister model
7. **Share-first:** Victory → Card generator → Social share (Stories, WhatsApp)
