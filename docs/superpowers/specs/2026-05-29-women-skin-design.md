# Spec · Skin mujer (UI para mujeres) — F2

> Fecha: 2026-05-29 · branch `feat/api-first-refactor`. Feature 2 de 2 (F1 recomendador ya hecho).

## Objetivo

Una variante visual ("skin mujer") con **otros colores** para coach y atleta, que se aplica **automáticamente según el género del atleta en foco**. Los **discos se mantienen** idénticos (son lenguaje de carga + marca).

## Decisiones del Boss

- **Trigger: auto por género del atleta en foco.** Lado-atleta → género de la persona; lado-coach → género del `selectedAthlete` en vistas centradas en un atleta. Dash/stats (roster mixto) → default.
- **Paleta: coral + violeta.**
- Discos (`--tier-*`) **no cambian**. Accents semánticos (oly verde, pulse rojo, etc.) tampoco.
- Sin toggle manual (solo auto).

## Hallazgo técnico (dos sistemas de vars)

- `themes.ts` (ThemeProvider) setea **inline** en `documentElement`: `--bg`, `--text`, `--primary`, `--surface`, `--card-*`, `--cta-*`, fonts. → NO los tocamos (inline gana; son del theme switcher).
- `tokens.css :root` define `--engine-*` (accents), `--tier-*` (discos), glows, `--border-hard`, `--surface-1/2/3`. → Estos NO están inline → un **CSS rule `[data-skin="women"]` los override** sin conflicto.
- Por eso la skin re-tinta **solo accents/glows de tokens**, no el fondo del theme ni los discos.

## Mecanismo

1. **CSS** (append a `styles/v2/tokens.css`): bloque `[data-skin="women"]` que override los accents primarios + glows:

```css
[data-skin="women"] {
  --engine-stress: #FF7E6B;                         /* primario: cyan → coral */
  --engine-macro:  #A78BFA;                          /* macro: amber → violeta */
  --border-hard:   rgba(255,126,107,0.35);           /* borde acentuado coral */
  --glow-cyan:     0 0 24px rgba(255,126,107,0.25);  /* glow coral */
  --glow-amber:    0 0 24px rgba(167,139,250,0.30);  /* glow violeta */
}
```
NO se tocan `--tier-0..4` (discos), `--engine-oly/pulse/streak/hormonal/adapt/belt` (semánticos), ni `--bg/--text` (ThemeProvider).

2. **App.tsx (AppInner)**: computar la skin del atleta en foco y reflejarla en `document.documentElement`:

```tsx
const ATHLETE_FOCUSED_COACH_VIEWS = new Set<View>(['ATHLETE_DETAIL', 'ASSIGN_MACRO']);
const focusAthlete = role === 'coach'
  ? (ATHLETE_FOCUSED_COACH_VIEWS.has(currentView) ? selectedAthlete : null)
  : athlete;
const skin: 'women' | 'default' = focusAthlete?.gender === 'F' ? 'women' : 'default';
useEffect(() => {
  if (skin === 'women') document.documentElement.setAttribute('data-skin', 'women');
  else document.documentElement.removeAttribute('data-skin');
}, [skin]);
```
(`role` de useRole · `currentView` de useNav · `athlete`/`selectedAthlete` de useAthlete — agregar los hooks que falten en AppInner.)

## Comportamiento

- **Atleta (rol atleta):** persona mujer → skin coral/violeta en todas sus pantallas. (En el demo la persona es Matías/M → se ve default; con persona mujer se vería la skin.)
- **Coach viendo una atleta mujer** (deep-dive / asignar macro de Luciana Vega -59kg o Daniela Moreno -49kg) → skin coral/violeta, **discos idénticos**.
- **Coach dash / stats / macro-view** (roster mixto) → default (cyan/amber).
- Al volver a un atleta varón o al dash → `data-skin` se remueve → vuelve al default.

## Edge cases

- Sin atleta en foco (ej. dash) → default.
- `selectedAthlete` queda seteado tras abrir un atleta, pero la skin coach solo aplica en `ATHLETE_DETAIL`/`ASSIGN_MACRO` → el dash no hereda la skin de la última atleta vista.
- ThemeProvider re-aplica sus vars inline en cada cambio de theme; no pisa `--engine-*` (no los setea) → la skin convive con cualquier theme.

## Verificación

- Build `tsc -b && vite build` limpio.
- Preview: Coach HO → abrir deep-dive de **Luciana** o **Daniela** → accents coral/violeta, **discos (PlateBadge) sin cambios**; volver al dash → vuelve a cyan/amber. Abrir un atleta varón (Matías) → default. `preview_inspect`/eval del color computado de un elemento con `--engine-stress`.
- Commit + push.

## NO inventar

- Solo cambio de paleta (override de tokens). No se inventa data. Discos y semántica de colores intactos.
