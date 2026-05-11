# Audit Frontend — Holy Oly / Volta

> Sesión: 2026-05-11 · Worktree: `busy-robinson-d4eaa0`

---

## ✅ Bugs fixeados esta sesión

| # | Archivo | Fix |
|---|---|---|
| 1 | `frontend/src/pages/PulseHub.tsx` | DROP-OFF CHALLENGE card: `min-w-0 flex-1 overflow-hidden` + `truncate` en título/sub, `flex-shrink-0` en timer |
| 2 | `frontend/src/pages/SessionSchedule.tsx` | Días generados dinámicamente desde `new Date()` (lunes-domingo de la semana actual). Mes dinámico en card list |
| 3 | `frontend/src/App.tsx` | Dev sidebar + mobile switcher envueltos en `import.meta.env.DEV` |
| 4 | `frontend/src/components/WiseAssistant.tsx` | FAB gradient + shadow según `useProduct()` — HO: oro `#FFD700→#B8860B`, Volta: cyan-verde `#00E676→#00E5FF` |
| 5 | `frontend/src/pages/AIAssistant.tsx` | Borrado (dead code, sin references) |

Todos verificados en preview mobile 375×812.

---

## 🔍 Hallazgos audit · 12 pantallas

### 1. ATHLETE_DETAIL (HO Coach)
- Chart "CARGA SEMANAL (ATL/CTL)" vacío sin estado vacío con mensaje
- "Ver todo →" usa color verde (`text-holy-primary`) en modo HO donde el theme es oro → token rígido, no theme-aware
- Bottom CTAs (`CAMBIAR MACRO` / `ENVIAR FEEDBACK`) quedan tapados por dev mobile switcher (en DEV; en prod ya queda OK con fix #3)
- Día abreviado "X" para Miércoles vs "MIE" en SessionSchedule — inconsistencia de abreviaturas

### 2. ASSIGN_MACRO (HO Coach)
- Bottom button "ELEGÍ UNA ESCUELA" sticky se solapa con última card "Catalyst Athletics" — falta `padding-bottom` en scroll container
- 4 escuelas con barras intensidad/volumen OK
- Selección de escuela: el click sobre la card no muestra estado activo visible (¿target del onClick mal seteado o no provee feedback?)

### 3. VOLTA_HOME (Atleta)
- Saludo "Buen día" a las 17:12 PM — debería ser "Buenas tardes". Greeting no honra hora del día.
- "WOD DE HOY · SEMANA 4 · DÍA 3" — semana/día hardcoded en lugar de derivar del macrociclo activo
- CF INDEX 72, V-FORM Amarillo, RACHA 11 días — datos OK
- WISE FAB cyan-verde ✓ correcto para Volta

### 4. VOLTA_PREWOD (Atleta)
- "Cafeína hoy: 200mg — 8:15am" — hora hardcoded
- HRV 52, Sueño 64, V-Form +3 cards OK
- 3 CTAs (Iniciar WOD modificado / Cambiar a movilidad / Ver WOD sin cambios) ✓

### 5. VOLTA_COACH_WOD (Planner)
- "PUBLICAR AL BO." cortado por WISE FAB en bottom right — solapa el botón
- Estructura correcta: tipo WOD / duración / escala / movimientos / preview

### 6. VOLTA_COACH_TOOLS (8 tabs)
Todos los tabs renderizan contenido:
- ✓ Progresión · Skill Matrix 6×8 con L1-L5 color codes
- ✓ Templates · biblioteca 8 (Fran, Grace, Helen, Karen, Murph...)
- ✓ Masiva · 3/6 atletas seleccionados, escalado WISE auto
- ✓ Comparar · A vs B (Marco vs Camila), 4 métricas
- ✓ Tendencias · 4 KPIs + Top 3 performers
- ✓ Eval Macro · review semanal + 6 criterios
- ✓ Calendario · 4 competencias próximas
- ✓ Notas · 4 mensajes rápidos + nuevo

Issue Calendario: fechas mezclan formato "Jun/Jul/Ago/Oct" (no consistente con "ABR/MAY" en SessionSchedule)

### 7. PROGRESSION detail (Volta Atleta)
- Card movimiento con progress hacia siguiente nivel ✓
- Sparkline 4 puntos "Últimas sesiones · reps" ✓
- Timeline "Evolución de Nivel" L1 → L2 → L3 con fechas ✓
- Sección "Camino completo · 5 niveles" debajo
- Todo funcional

### 8. ONBOARDING (3 steps)
- Step 1 (nombre + DOB): CTA "Continuar" **VERDE** — debería ser theme-aware (HO=oro)
- Step 2 (peso/altura/nivel): CTA verde idem
- Step 3 (perfil completado): CTA "Entrar al dashboard" **ORO** ✓
- Inconsistencia: steps 1-2 hardcoded verde, step 3 respeta theme

### 9. PREMIUM (3 planes)
- Free $0 / Pro $19 / Elite $49 ✓
- Comparativa features con —/✓ ✓
- CTA "Elegir Elite — $49/mes" oro ✓
- "Volta CrossFit" row aparece solo en Elite ✓

### 10. REGISTER
- Selector Plataforma HOLY OLY (oro) / VOLTA - CrossFit (cyan) ✓
- Selector Rol ATLETA (verde) / COACH ✓
- Form nombre + email + contraseña × 2
- Switch HOLY OLY → VOLTA reskina logo + nombre app dinámicamente ✓
- Dev switcher/sidebar correctamente ocultos en LOGIN/REGISTER (fix #3 + `hideNav={isPublic}`)

### 11. Profile → Temas (theme switch)
- Theme Gallery con 29 temas
- Click en "Brutalist" cambia el theme globalmente (phone frame, dev nav, headers, body) ✓
- Click en "Holy Oly Dark" revierte ✓
- Persistencia: theme se mantiene tras navegación

### 12. Logout flow
- "CERRAR SESIÓN" en Profile → llama `logout()` + `navigate('LOGIN')` ✓
- Login real renderiza branding según último `product` (en este caso Volta)
- "Servidor no disponible. Podés entrar en modo Demo..." warning visible
- Botones: ENTRAR / CREAR CUENTA NUEVA / "Entrar en modo Demo (sin backend)" ✓
- Status bar mobile, sin dev sidebar (público) ✓

---

## 🎨 Hardcoded theme-breaks · Inventario

Total: **141 ocurrencias en 11 archivos** (todas en `frontend/src/pages/`, productos HO):

| Archivo | text-white | text-slate-* | bg-slate-* | Total |
|---|---:|---:|---:|---:|
| PulseHub.tsx | 7 | 5 | 1 | 13 |
| SessionSummaryPreview.tsx | 6 | 8 | 2 | 16 |
| PerformanceDeepDive.tsx | 5 | 8 | 1 | 14 |
| SocialCard.tsx | 4 | 5 | 0 | 9 |
| OlyIndex.tsx | 6 | 8 | 2 | 16 |
| PreMium.tsx | 6 | 9 | 0 | 15 |
| KnowledgePills.tsx | 3 | 2 | 0 | 5 |
| SessionSchedule.tsx | 3 | 5 | 2 | 10 |
| WarmupGenerator.tsx | 7 | 7 | 3 | 17 |
| VictoryScreen.tsx | 6 | 5 | 1 | 12 |
| Onboarding.tsx | 6 | 6 | 2 | 14 |

**Plan migración** (no aplicado en esta sesión, blast radius grande):
- `text-white` → `color: var(--text)` o clase `text-fg-primary` definida con CSS var
- `text-slate-{400,500,600}` → `text-fg-secondary`, `text-fg-tertiary`, `text-fg-muted`
- `bg-slate-{700,800,900}` → `bg-surface-2`, `bg-surface-3` o `bg-card`

Pasos sugeridos para migrar:
1. Definir clases utilitarias en `tailwind.config.js` mapeando a CSS vars
2. Sed global por archivo (regex predecible)
3. Verificar en cada tema (Holy Oly Dark, Brutalist, otros 27) por screenshots automatizados

---

## 🐞 Issues nuevos (no en lista original)

| Sev | Pantalla | Issue |
|---|---|---|
| Media | ATHLETE_DETAIL | Gráfico ATL/CTL vacío sin empty state |
| Media | ASSIGN_MACRO | Bottom button sticky se solapa con scroll content |
| Media | VOLTA_COACH_WOD | WISE FAB tapa "PUBLICAR AL BOX" — z-index/position |
| Media | VOLTA_HOME | Saludo "Buen día" no respeta hora del día |
| Baja | VOLTA_HOME | "Semana 4 · Día 3" hardcoded |
| Baja | VOLTA_PREWOD | Cafeína "200mg 8:15am" hardcoded |
| Baja | ONBOARDING | CTAs step 1-2 verdes, step 3 oro — inconsistencia |
| Baja | Calendario (VCT) | Formato meses inconsistente con resto de app |
| Baja | ATHLETE_DETAIL | "X" vs "MIE" abreviaturas inconsistentes |
| Baja | WiseAssistant | Panel interno (avatars/suggestions/send/user-msg-bg) sigue cyan en HO — solo FAB fue fixeado |
| Baja | App.tsx | `ProductRoleSwitcher` (HO/VOL/ATL/COACH) NO oculto en prod — solo dev sidebar y mobile switcher fueron gateados |

---

## 📝 Recomendación próxima sesión

1. Theme-break massive fix: 141 ocurrencias en 11 archivos — sesión dedicada con grep + sed + verificación visual por theme
2. Saludo time-of-day en VOLTA_HOME (utility `getGreeting(hour, product, role)`)
3. Macrociclo dinámico: derivar semana/día de `athlete.activeMacro`
4. ATHLETE_DETAIL gráfico ATL/CTL: empty state o datos reales del backend
5. WiseAssistant panel completo themed por producto (cyan ↔ oro)
6. Decisión arquitectónica: `ProductRoleSwitcher` ¿queda en prod o se gatea?
