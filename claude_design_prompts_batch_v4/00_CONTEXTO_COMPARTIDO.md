# Contexto compartido · Pegar al inicio de CADA prompt Claude Design

> **Boss:** copiá este bloque al inicio de cada chat nuevo de Claude Design, ANTES del prompt específico. Garantiza coherencia visual entre las 43 pantallas.

---

## CONTEXTO PRODUCTO

**Peak Qual** · plataforma multi-deporte con 2 verticales activas:
- **Holy Oly** · Halterofilia Olímpica (Snatch · Clean & Jerk · sistema discos)
- **Volta** · CrossFit (WODs · benchmarks · macrocycles)

Tercera vertical futura: Axon (HYROX).

**Lema:** "Smart Training · Zero Burnout"

**Misión:** ganar conciencia de salud al entrenar · IA explica decisiones · cuando se equivoca acompaña ("Control de Daños"). NO premia volumen ciego · premia adherencia consciente.

**Audiencias:**
- Atleta amateur a élite · 18-50 años · usa app diario
- Coach de box · gestiona 5-50 atletas · usa app pre/post sesión

---

## VISUAL STYLE · "HÍBRIDO FIFA + STRAVA"

| Contexto | Estilo |
|---|---|
| **Atleta** (training, home, sesión activa) | FIFA Modo Leyenda + Tactical HUD · neón cyan/lime · gaming feel |
| **Coach** (dashboard, analytics, gestión) | Strava-clean · sobrio · datos densos · sin neón excesivo |

**NO usar:** glassmorphism · neumorfismo · skeuomorphism · cartoonish

**Sí usar:** dark mode default · monoespaciado tabular · bento grid · gradientes diagonales sutiles · glow neón en CTAs primarios · bordes 1px hairline · iconografía línea 1.7px stroke

---

## DESIGN TOKENS

```css
/* SURFACE */
--bg-deep:    #050510;
--bg:         #0A0A14;
--surface-1:  #12121C;
--surface-2:  #1A1A28;
--surface-3:  #232336;
--border-soft: rgba(255,255,255,0.06);
--border-hard: rgba(0,229,255,0.35);

/* ENGINE COLORS */
--engine-stress:    #00E5FF;   /* CNS · readiness · neón cyan */
--engine-adapt:     #A855F7;   /* adaptation · violet */
--engine-macro:     #FFB300;   /* macrocycle · amber */
--engine-belt:      #F5A623;   /* belt / XP · gold */
--engine-streak:    #FF6B35;   /* streak · fire */
--engine-oly:       #22C55E;   /* OLY index · green */
--engine-hormonal:  #EC4899;   /* ciclo menstrual · pink */
--engine-pulse:     #EF4444;   /* HR zones · red */

/* TIER DISCS (halterofilia) — NO cinturones */
--tier-0: #F8F8F8;   /* blanco · starter */
--tier-1: #22C55E;   /* verde 10kg · iniciante */
--tier-2: #FBBF24;   /* amarillo 15kg · intermedio */
--tier-3: #3B82F6;   /* azul 20kg · avanzado */
--tier-4: #EF4444;   /* rojo 25kg · élite */

/* TEXT */
--text-hi:  #F1F5F9;
--text:     #CBD5E1;
--text-mid: #94A3B8;
--text-lo:  #64748B;

/* TYPE */
--font-display: 'Space Grotesk', system-ui, sans-serif;
--font-body:    'Inter', system-ui, sans-serif;
--font-mono:    'JetBrains Mono', ui-monospace, monospace;

/* RADIUS */
--r-sm: 6px; --r-md: 12px; --r-lg: 18px; --r-xl: 24px; --r-full: 999px;

/* GLOW */
--glow-cyan:  0 0 24px rgba(0,229,255,0.25);
--glow-amber: 0 0 24px rgba(255,179,0,0.30);
--glow-violet: 0 0 24px rgba(168,85,247,0.30);
--glow-green: 0 0 24px rgba(34,197,94,0.30);
--glow-red:   0 0 24px rgba(239,68,68,0.35);
```

---

## STACK TÉCNICO ESPERADO

- **React 19** + **TypeScript** + **Tailwind 4** + componentes shadcn/ui cuando aplique
- **Mobile-first:** viewport 375x812 (iPhone) base · respeta safe-area iOS top/bottom
- **Bottom nav:** 76px alto si la pantalla lo necesita
- **Output:** 1 archivo TSX autocontenido + CSS file scoped (ej. `.hd-root`, `.hc-root`)
- **Custom elements existentes a reutilizar:**
  - `<plate-3d tier="3" size="96">` · disco halterofilia 3D
  - `<plate-stack tiers="1,2,3" orientation="row" weight>` · stack discos
- **Mock data inline al final del archivo** como `mockX`
- **API endpoint comentado** donde corresponde · ej. `GET /v1/...`

---

## TONO COPY · CRÍTICO

| ✅ Sí | ❌ No |
|---|---|
| "Subiste 4 kg en Snatch" | "¡INCREÍBLE PR!" |
| "Carga semanal alta · considerá deload" | "Cuidado, te vas a lesionar!" |
| "Tu CNS bajó 12% · ajustamos el plan" | "Te falló el descanso, mejorá!" |
| Factual · neutral · forward-looking | Exclamaciones · paternalismo · emojis tristes |
| Español neutro Latam | Modismos regionales |
| Tabular numbers, mono para data | Letras decorativas |

---

## ACCESIBILIDAD MÍNIMA

- Contraste AA mínimo en textos sobre fondos oscuros
- Color NO único portador de info (siempre íconos + texto en estados)
- ARIA labels en gráficos · tabla equivalente `sr-only` para charts
- Keyboard navegable (Tab/Enter/Space/Escape para drawers/modals)
- `reduce-motion` desactiva animaciones glow/pulse

---

## ESTADOS UNIVERSALES

Cada pantalla debe definir:
- **Loading:** skeleton tactical (líneas neón sutiles · NO spinners genéricos)
- **Empty:** ilustración mínima + 1 línea + CTA recovery
- **Error:** toast bottom NO modal disruptivo + retry inline
- **Success:** confirmación discreta · NO confetti excesivo (excepto VictoryScreen)

---

## ENTREGABLE ESPERADO POR PROMPT

Claude Design devuelve un proyecto con:
- 1 HTML (shell)
- 1 CSS scoped (`.{prefix}-root`)
- 1 JSX que renderiza el componente principal
- (Opcional) Custom elements si necesita gráficos custom
- Preview HTML autocontenido renderiza con React 18 UMD + Babel standalone

Boss baja zip · me lo pasa · yo porto a TSX en `frontend/src/pages/v3/` y agrego al router.

---

## REFERENCIAS VISUALES (URL para inspirar Claude Design)

- **FIFA Modo Leyenda** · cards jugador con stats
- **Strava** (web) · segmento detail con gradient + elevation profile
- **WHOOP** · cards minimalistas con datos densos
- **Garmin Connect** · training load semanal
- **Notion** · tablas densas legibles
- **Football Manager** · tactical board
- **CS2 HUD** · barras tactical, transitions glitch (sólo para activeWod / timer screens)

---

**FIN CONTEXTO COMPARTIDO. Pegar a continuación el prompt específico del archivo correspondiente.**
