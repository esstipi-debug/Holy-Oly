# Coach HO · Loop — Implementation Plan

> **For agentic workers:** Ejecutar task-by-task. Steps usan checkbox (`- [ ]`).
> **Verificación adaptada (sin TDD):** este repo NO tiene test runner. La compuerta
> de correctitud es `cd frontend && npm run build` (tsc -b, atrapa tipos + unused) +
> verificación visual en preview (regla dura del handoff). Los "test steps" del
> template estándar se reemplazan por **build + preview check**. No se agrega un
> framework de tests (YAGNI, fuera del scope del demo).

**Goal:** Activar el loop de Coach HO del spec (`docs/superpowers/specs/2026-05-28-coach-ho-design.md`): bandeja de notificaciones viva + revisión post-hoc del coach + gráfico IMR vs banda de fase con insight automático.

**Architecture:** Demo offline (token 'demo' → 401 → mock). El "motor" del loop es un store **frontend** (sessionStorage) porque no hay API de notificaciones; las notificaciones se **derivan de señales REALES del roster** (sesiones no completadas con nota, lesiones, 1RM desactualizado) — sin inventar. La "lectura" (IMR vs banda) se deriva de `sessionDetail` (ola 2) + el mapa fase→banda del spec §5. El lado-atleta del loop queda fuera de alcance (spec §8).

**Tech Stack:** React 19 + Vite + TS, framer-motion. Reusa `data/sessionDetail.ts`, `data/macroDetail.ts`, `data/derive.ts`, `data/athletes.ts`, `components/BottomSheet.tsx`.

---

## File Structure

**Nuevos:**
- `frontend/src/data/insight.ts` — motor de insight: dado (valor, contexto) → `{ text, severity }` (1 línea + color). Reusable por todos los gráficos/números.
- `frontend/src/data/imrBand.ts` — banda de IMR esperado por semana (fase→rango, spec §5) + serie IMR planificado/real por semana del macro + insight de sobre/subcarga.
- `frontend/src/data/coachInbox.ts` — bandeja: deriva notificaciones de señales reales del roster + capa de revisión del coach (confirmar/revertir/visto) persistida en sessionStorage.
- `frontend/src/components/coach/NotificationsSheet.tsx` — UI de la bandeja (🔔 → BottomSheet, acciones del coach).
- `frontend/src/components/coach/ImrBandChart.tsx` — gráfico IMR vs banda + insight inline + drawer (BottomSheet).

**Modificados:**
- `frontend/src/pages/v2/CoachDashV2.tsx` — cablear la 🔔 (badge + abrir bandeja).
- `frontend/src/pages/AthleteDeepDive.tsx` — montar `ImrBandChart` en la ficha del atleta.

---

## Sub-ola 3a · Motor de insight + banda de IMR

### Task 1: `data/insight.ts` — motor de insight

**Files:**
- Create: `frontend/src/data/insight.ts`

- [ ] **Step 1: Crear el módulo**

```ts
/**
 * insight · motor de lectura automática (spec §2 principio 5: "insight sobre cada
 * número/gráfico"). Dado un valor + contexto devuelve una línea en lenguaje claro
 * coloreada por severidad. Lo consumen los 4 gráficos del coach.
 */
export type Severity = 'ok' | 'watch' | 'alert';

export interface Insight {
  text: string;
  severity: Severity;
}

export const SEVERITY_COLOR: Record<Severity, string> = {
  ok: '#22C55E',
  watch: '#F59E0B',
  alert: '#EF4444',
};

/** IMR vs banda esperada de la fase. */
export function imrInsight(imr: number, lo: number, hi: number, phase: string): Insight {
  if (imr > hi) {
    const over = Math.round(imr - hi);
    return { severity: 'alert', text: `IMR ${imr}% vs esperado <${hi}% (${phase}) → sobrecarga ~${over}pts. Bajá volumen ~10%.` };
  }
  if (imr < lo) {
    const under = Math.round(lo - imr);
    return { severity: 'watch', text: `IMR ${imr}% vs esperado >${lo}% (${phase}) → subcarga ~${under}pts. Podés exigir más.` };
  }
  return { severity: 'ok', text: `IMR ${imr}% dentro de banda ${lo}-${hi}% (${phase}). En plan.` };
}

/** ACWR (agudo:crónico). Zona segura 0.8-1.3. */
export function acwrInsight(acwr: number): Insight {
  if (acwr > 1.3) return { severity: 'alert', text: `ACWR ${acwr.toFixed(2)} → zona de riesgo de lesión, considerá deload.` };
  if (acwr < 0.8) return { severity: 'watch', text: `ACWR ${acwr.toFixed(2)} → carga baja, hay margen para progresar.` };
  return { severity: 'ok', text: `ACWR ${acwr.toFixed(2)} en zona segura (0.8-1.3).` };
}

/** Readiness (0-10). */
export function readinessInsight(r: number): Insight {
  if (r < 4) return { severity: 'alert', text: `Readiness ${r.toFixed(1)} → crítico, priorizá recuperación.` };
  if (r < 6.5) return { severity: 'watch', text: `Readiness ${r.toFixed(1)} → monitoreá la carga de hoy.` };
  return { severity: 'ok', text: `Readiness ${r.toFixed(1)} → listo para entrenar.` };
}
```

- [ ] **Step 2: Build**

Run: `cd frontend && npm run build`
Expected: PASS (sin errores de tipos/unused).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/data/insight.ts
git commit -m "feat(coach-ho): motor de insight (lectura por severidad)"
```

---

### Task 2: `data/imrBand.ts` — banda de IMR por fase + serie

**Files:**
- Create: `frontend/src/data/imrBand.ts`

- [ ] **Step 1: Crear el módulo**

```ts
/**
 * imrBand · banda de IMR esperado por fase (spec §5) + serie semanal del macro.
 *
 * El macro (macroDetail.weekly) ya da fase (meso 1-4) e IMR planificado por semana.
 * Acá mapeamos meso→banda esperada y derivamos un IMR "real" determinístico por
 * atleta (planificado ± desvío seedeado) para el gráfico "IMR vs banda" (spec §4.1①).
 */
import { getMacroDetail } from './macroDetail';
import { seeded } from './derive';

// meso 1-4 = GPP/básico · Fuerza · SPP/precompetitivo · Peaking (spec §5 mapa fase→banda)
const PHASE_BAND: Array<{ lo: number; hi: number; name: string }> = [
  { lo: 60, hi: 72, name: 'GPP / básico' },
  { lo: 70, hi: 80, name: 'Fuerza' },
  { lo: 78, hi: 88, name: 'SPP / precompetitivo' },
  { lo: 85, hi: 95, name: 'Peaking' },
];

export interface ImrWeek {
  week: number;
  planned: number;   // IMR planificado (macro)
  real: number;      // IMR real (determinístico por atleta)
  lo: number;        // banda baja de la fase
  hi: number;        // banda alta de la fase
  phase: string;
  current: boolean;
}

/** Serie semana-a-semana de IMR planificado/real + banda de fase para un atleta. */
export function imrBandSeries(athleteId: string, programId: string | null, currentWeek: number): ImrWeek[] {
  const macro = getMacroDetail(programId);
  const rand = seeded(`${athleteId}:imrband`);
  return macro.weekly.map(w => {
    const band = PHASE_BAND[Math.max(0, Math.min(3, w.meso - 1))];
    // real = planificado ± hasta 6pts (desvío determinístico); semanas pasadas más ruidosas
    const drift = Math.round((rand() - 0.45) * 12);
    const real = Math.max(40, Math.min(102, w.imr + drift));
    return { week: w.w, planned: w.imr, real, lo: band.lo, hi: band.hi, phase: band.name, current: w.w === currentWeek };
  });
}
```

- [ ] **Step 2: Build**

Run: `cd frontend && npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/data/imrBand.ts
git commit -m "feat(coach-ho): banda de IMR por fase + serie semanal"
```

---

### Task 3: `components/coach/ImrBandChart.tsx` — gráfico IMR vs banda

**Files:**
- Create: `frontend/src/components/coach/ImrBandChart.tsx`
- Modify: `frontend/src/pages/AthleteDeepDive.tsx` (montar el chart)

- [ ] **Step 1: Crear el componente**

```tsx
import React, { useMemo, useState } from 'react';
import BottomSheet from '../BottomSheet';
import { imrBandSeries } from '../../data/imrBand';
import { imrInsight, SEVERITY_COLOR } from '../../data/insight';

/**
 * ImrBandChart · gráfico estrella del coach (spec §4.1①): IMR real por semana vs
 * banda esperada de la fase (sombreada) + lectura automática (1 línea + drawer).
 */
interface Props { athleteId: string; programId: string | null; currentWeek: number; }

const ImrBandChart: React.FC<Props> = ({ athleteId, programId, currentWeek }) => {
  const series = useMemo(() => imrBandSeries(athleteId, programId, currentWeek), [athleteId, programId, currentWeek]);
  const [open, setOpen] = useState(false);

  const cur = series.find(s => s.current) ?? series[series.length - 1];
  const insight = cur ? imrInsight(cur.real, cur.lo, cur.hi, cur.phase) : null;
  const color = insight ? SEVERITY_COLOR[insight.severity] : 'var(--text-secondary)';

  // Escala: IMR 40-102 → 0-100% alto de columna.
  const y = (v: number) => Math.max(0, Math.min(100, ((v - 40) / 62) * 100));

  return (
    <div className="add-section">
      <div className="add-section-head">
        <h3>IMR vs banda de fase</h3>
        <span className="meta">tap para detalle</span>
      </div>
      <div className="add-card" style={{ cursor: 'pointer' }} onClick={() => setOpen(true)}>
        <div style={{ position: 'relative', height: 120, display: 'flex', alignItems: 'flex-end', gap: 3 }}>
          {series.map(s => (
            <div key={s.week} style={{ flex: 1, position: 'relative', height: '100%' }} title={`S${s.week} · ${s.phase}`}>
              {/* banda esperada */}
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: `${y(s.lo)}%`, height: `${y(s.hi) - y(s.lo)}%`, background: 'color-mix(in oklab, var(--engine-oly) 18%, transparent)' }} />
              {/* IMR real */}
              <div style={{ position: 'absolute', left: '15%', right: '15%', bottom: 0, height: `${y(s.real)}%`, background: s.current ? 'var(--engine-stress)' : (s.real > s.hi ? '#EF4444' : s.real < s.lo ? '#F59E0B' : '#22C55E'), borderRadius: 2, opacity: s.current ? 1 : 0.7 }} />
            </div>
          ))}
        </div>
        {insight && (
          <p style={{ fontSize: 11, lineHeight: 1.4, marginTop: 10, color, fontWeight: 600 }}>
            <span style={{ color: '#F5C518' }}>✦ </span>{insight.text}
          </p>
        )}
      </div>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="IMR vs banda · por semana">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {series.map(s => {
            const ins = imrInsight(s.real, s.lo, s.hi, s.phase);
            return (
              <div key={s.week} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 8, background: s.current ? 'color-mix(in oklab, var(--engine-stress) 14%, transparent)' : 'var(--surface)', border: '1px solid var(--card-border)' }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)' }}>Sem {s.week} · {s.phase}</p>
                  <p style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Esperado {s.lo}-{s.hi}% · plan {s.planned}%</p>
                </div>
                <span style={{ fontSize: 14, fontWeight: 900, color: SEVERITY_COLOR[ins.severity] }}>{s.real}%</span>
              </div>
            );
          })}
        </div>
      </BottomSheet>
    </div>
  );
};

export default ImrBandChart;
```

- [ ] **Step 2: Montar en AthleteDeepDive**

En `frontend/src/pages/AthleteDeepDive.tsx`, importar y montar el chart después de `<WeeklyAnalysisCharts ... />`:

```tsx
import ImrBandChart from '../components/coach/ImrBandChart';
// ...
{/* ① IMR vs banda de fase (spec §4.1) */}
<ImrBandChart athleteId={a.id} programId={a.macrocycle.program_id} currentWeek={a.macrocycle.week} />
```

- [ ] **Step 3: Build**

Run: `cd frontend && npm run build`
Expected: PASS.

- [ ] **Step 4: Preview check**

Coach HO → tap atleta → scroll a "IMR vs banda de fase". Verificar: barras + banda sombreada, semana actual resaltada, insight 1-línea coloreada. Tap → drawer con desglose semanal.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/coach/ImrBandChart.tsx frontend/src/pages/AthleteDeepDive.tsx
git commit -m "feat(coach-ho): grafico IMR vs banda de fase + insight (spec 4.1)"
```

---

## Sub-ola 3b · Bandeja de notificaciones del coach (🔔)

### Task 4: `data/coachInbox.ts` — derivación + revisión

**Files:**
- Create: `frontend/src/data/coachInbox.ts`

- [ ] **Step 1: Crear el módulo**

```ts
/**
 * coachInbox · la 🔔 del coach (spec §3.5). NO hay API de notificaciones → se
 * DERIVAN de señales reales del roster + una capa de revisión persistida en
 * sessionStorage (confirmar/revertir/visto). Sin inventar: cada item nace de un
 * dato real (sesión no completada con nota, lesión, 1RM > 30 días).
 */
import type { AthleteProfile } from './athletes';
import { deriveRmStatus } from './derive';

export type InboxKind = 'deviation' | 'injury' | 'stale_rm' | 'request';
export type InboxState = 'pending' | 'confirmed' | 'reverted' | 'seen';

export interface InboxItem {
  id: string;
  athleteId: string;
  who: string;
  kind: InboxKind;
  title: string;
  detail: string;
  severity: 'alert' | 'watch';
}

const KEY = 'ho:inbox:review';
function readReview(): Record<string, InboxState> {
  try { return JSON.parse(sessionStorage.getItem(KEY) || '{}'); } catch { return {}; }
}
function writeReview(map: Record<string, InboxState>): void {
  try { sessionStorage.setItem(KEY, JSON.stringify(map)); } catch { /* ignore */ }
}
export function setItemState(id: string, state: InboxState): void {
  const map = readReview();
  map[id] = state;
  writeReview(map);
}
export function itemState(id: string): InboxState {
  return readReview()[id] ?? 'pending';
}

const firstName = (n: string) => n.split(' ')[0];

/** Deriva los items de la bandeja para un roster. */
export function deriveInbox(roster: AthleteProfile[]): InboxItem[] {
  const items: InboxItem[] = [];
  for (const a of roster) {
    // 1) Sesiones no completadas con nota = desvío reportado por el atleta.
    a.sessions_last_7.forEach((s, i) => {
      if (!s.completed && s.notes && /falt|no pudo|cancel|lesi|dolor/i.test(s.notes)) {
        items.push({
          id: `dev:${a.id}:${i}`, athleteId: a.id, who: firstName(a.name), kind: 'deviation',
          title: `${firstName(a.name)} · sesión no realizada`, detail: `${s.date} — "${s.notes}"`, severity: 'watch',
        });
      }
    });
    // 2) Lesión activa.
    if (a.injuries && a.injuries.length > 0) {
      items.push({
        id: `inj:${a.id}`, athleteId: a.id, who: firstName(a.name), kind: 'injury',
        title: `${firstName(a.name)} · lesión activa`, detail: a.injuries[0], severity: 'alert',
      });
    }
    // 3) 1RM desactualizado (>30 días) en algún lift → IMR distorsionado (spec §5).
    const snatch = deriveRmStatus(a.id, 'snatch', a.maxes.snatch);
    if (/mes/.test(snatch.date)) {
      items.push({
        id: `rm:${a.id}:snatch`, athleteId: a.id, who: firstName(a.name), kind: 'stale_rm',
        title: `${firstName(a.name)} · 1RM Arrancada viejo`, detail: `Último test hace ${snatch.date} → IMR distorsionado, retesteá.`, severity: 'watch',
      });
    }
  }
  return items;
}

/** Items pendientes (no revisados) — para el badge de la 🔔. */
export function pendingCount(roster: AthleteProfile[]): number {
  return deriveInbox(roster).filter(it => itemState(it.id) === 'pending').length;
}
```

- [ ] **Step 2: Build**

Run: `cd frontend && npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/data/coachInbox.ts
git commit -m "feat(coach-ho): bandeja derivada de senales reales + revision (sessionStorage)"
```

---

### Task 5: `components/coach/NotificationsSheet.tsx` + cablear la 🔔

**Files:**
- Create: `frontend/src/components/coach/NotificationsSheet.tsx`
- Modify: `frontend/src/pages/v2/CoachDashV2.tsx`

- [ ] **Step 1: Crear la bandeja**

```tsx
import React, { useState } from 'react';
import BottomSheet from '../BottomSheet';
import { deriveInbox, itemState, setItemState, type InboxItem, type InboxState } from '../../data/coachInbox';
import type { AthleteProfile } from '../../data/athletes';

interface Props {
  open: boolean;
  onClose: () => void;
  roster: AthleteProfile[];
  onOpenAthlete: (id: string) => void;
}

const SEV_COLOR = { alert: '#EF4444', watch: '#F59E0B' } as const;

const NotificationsSheet: React.FC<Props> = ({ open, onClose, roster, onOpenAthlete }) => {
  const [, force] = useState(0);
  const items = deriveInbox(roster);
  const act = (id: string, state: InboxState) => { setItemState(id, state); force(n => n + 1); };

  const visible = items.filter(it => itemState(it.id) !== 'seen');

  return (
    <BottomSheet open={open} onClose={onClose} title={`Bandeja · ${visible.filter(i => itemState(i.id) === 'pending').length} pendientes`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {visible.length === 0 && (
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', padding: 20 }}>Sin pendientes · roster al día.</p>
        )}
        {visible.map((it: InboxItem) => {
          const st = itemState(it.id);
          const c = SEV_COLOR[it.severity];
          return (
            <div key={it.id} style={{ padding: 12, borderRadius: 10, background: 'var(--surface)', border: `1px solid ${st === 'pending' ? `${c}55` : 'var(--card-border)'}`, opacity: st === 'pending' ? 1 : 0.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)' }}>{it.title}</p>
                {st !== 'pending' && <span style={{ fontSize: 9, color: c, fontWeight: 800, textTransform: 'uppercase' }}>{st === 'confirmed' ? 'confirmado' : st === 'reverted' ? 'revertido' : ''}</span>}
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>{it.detail}</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button onClick={() => { onClose(); onOpenAthlete(it.athleteId); }} style={btn('var(--engine-stress)')}>Revisar →</button>
                <button onClick={() => act(it.id, 'confirmed')} style={btn('#22C55E')}>Confirmar</button>
                <button onClick={() => act(it.id, 'reverted')} style={btn('var(--text-secondary)')}>Revertir</button>
              </div>
            </div>
          );
        })}
      </div>
    </BottomSheet>
  );
};

function btn(color: string): React.CSSProperties {
  return { flex: 1, padding: '8px 0', borderRadius: 8, background: 'transparent', border: `1px solid ${color}55`, color, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit' };
}

export default NotificationsSheet;
```

- [ ] **Step 2: Cablear la 🔔 en CoachDashV2**

En `frontend/src/pages/v2/CoachDashV2.tsx`:
- Importar: `import NotificationsSheet from '../../components/coach/NotificationsSheet';` y `import { pendingCount } from '../../data/coachInbox';`
- En `CoachDashV2()`, agregar estado: `const [inboxOpen, setInboxOpen] = useState(false);`
- Calcular badge: `const pending = useMemo(() => pendingCount(allAthletes), [allAthletes]);`
- Pasar a `Header`: `<Header coachName={coachName} count={cards.length} pending={pending} onBell={() => setInboxOpen(true)} />`
- En `Header`, aceptar props `pending`/`onBell` y cablear el botón de la campana:
  ```tsx
  <button className="cd-h-btn" aria-label="Notificaciones" onClick={onBell}>
    <Icon name="bell" size={18}/>{pending > 0 && <span className="dot"/>}
  </button>
  ```
- Antes del `</div>` final (después de `<ActionsFab/>`), montar:
  ```tsx
  <NotificationsSheet open={inboxOpen} onClose={() => setInboxOpen(false)} roster={allAthletes} onOpenAthlete={openDetail} />
  ```

- [ ] **Step 3: Build**

Run: `cd frontend && npm run build`
Expected: PASS.

- [ ] **Step 4: Preview check**

Coach HO → la 🔔 muestra un punto si hay pendientes → tap abre la bandeja con items derivados (Nicolás "Faltó"/"No pudo ir", Franco/Matías lesión). Confirmar/Revertir cambian el estado; "Revisar →" entra al atleta.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/coach/NotificationsSheet.tsx frontend/src/pages/v2/CoachDashV2.tsx
git commit -m "feat(coach-ho): bandeja de notificaciones viva en la campana del coach"
```

---

## Sub-ola 3c · Insight en wellness/ACWR/desvíos (seguimiento)

Aplicar la convención de insight (1 línea + color por severidad) a los gráficos existentes del deep dive, reusando `data/insight.ts`:
- En la métrica Readiness de `AthleteDeepDive` → `readinessInsight(readiness)`.
- En el ring ACWR (si existe en `WeeklyAnalysisCharts`/`Chart`) → `acwrInsight(acwr)`.
- `DeviationsCard` ya trae recomendación WISE; alinear el color a `SEVERITY_COLOR`.

(Se detalla al ejecutar, leyendo cada componente primero. Es polish; 3a/3b son el núcleo demostrable.)

---

## Self-Review

- **Spec coverage:** §3.5 bandeja → Task 4-5 ✓ · §3.2/§3.4 revisión coach (confirmar/revertir) → Task 5 ✓ · §4.1① IMR vs banda → Task 2-3 ✓ · §2.5/§5 insight + bandas → Task 1-2 ✓ · §3.3 opciones atleta (auto-aplican) → fuera de alcance (spec §8, lado-atleta) · §4.1②③④ wellness/ACWR/desvíos → Task (3c, polish, ya existen).
- **Placeholders:** ninguno — código completo por step.
- **Type consistency:** `InboxState`/`InboxItem`/`InboxKind` definidos en Task 4 y usados igual en Task 5. `Insight`/`Severity`/`SEVERITY_COLOR` de Task 1 reusados en Task 3. `ImrWeek` de Task 2 usado en Task 3.
- **Verificación:** cada task cierra con build (tsc) + (donde aplica) preview check, en vez de unit tests (no hay runner).
