# Calendario de competencias + planificador de picos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el coach agende competencias por atleta y el sistema planifique el pico del macro hacia esa fecha (Approach C del spec 2026-05-29).

**Architecture:** Módulo puro de lógica (`data/competitions.ts`) + context con persistencia sessionStorage (patrón Wave 1) + UI: CompetitionsCard/AddCompetitionSheet en el deep-dive del coach, week-picker competition-aware (reusa Wave 1: `buildMacroAssignment` + `updateMacro`), countdown real en el home del atleta.

**Tech Stack:** React 19 + Vite + TS, framer-motion (BottomSheet), sessionStorage. Sin backend. Sin test runner → **verificación = `cd frontend && npm run build` (tsc -b atrapa unused) + preview**. NO inventar data: competencias = input del coach.

> Worktree: `C:/Users/Gamer/Desktop/Holy Oly 001/.claude/worktrees/compassionate-rhodes-7d48f8` · branch `feat/api-first-refactor`. Rutas relativas a `frontend/src/`.

---

## File structure

- **Create** `data/competitions.ts` — tipos `Competition`, persistencia sessionStorage (`ho:competitions`), helpers puros (`weeksBetween`, `phaseOfWeek`, `competitionsFor`, `nextCompetition`, `planToward`, `alignment`).
- **Create** `context/CompetitionContext.tsx` — estado + add/update/remove + persist + `useCompetitions`.
- **Create** `components/coach/AddCompetitionSheet.tsx` — BottomSheet con form.
- **Create** `components/coach/CompetitionsCard.tsx` — lista + insight + mini-barra + CTAs.
- **Modify** `App.tsx:519` — montar `<CompetitionProvider>` dentro de `<AthleteProvider>`.
- **Modify** `pages/AthleteDeepDive.tsx` — render `<CompetitionsCard>` tras la sección "Macrociclo activo".
- **Modify** `pages/AssignMacrocycle.tsx` — WeekPicker pre-selecciona S\* si hay competencia.
- **Modify** `components/coach/TransitionSheet.tsx` — `suggestStartWeek` prefiere S\* alineado a la competencia.
- **Modify** `pages/v2/AtletaHomeV2.tsx` — MacroCard muestra countdown a la competencia real.

---

## Task 1: Módulo de lógica `data/competitions.ts`

**Files:**
- Create: `frontend/src/data/competitions.ts`

- [ ] **Step 1: Escribir el módulo completo**

```ts
import type { AthleteProfile } from './athletes';
import { getMacroDetail } from './macroDetail';

export type CompetitionLevel = 'local' | 'nacional' | 'internacional';

export interface Competition {
  id: string;
  athleteId: string;
  name: string;
  date: string;            // 'YYYY-MM-DD'
  level?: CompetitionLevel;
  objective?: string;
  priority?: boolean;
}

const KEY = 'ho:competitions';

export function loadCompetitions(): Competition[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Competition[];
  } catch { /* ignore */ }
  return [];
}
export function saveCompetitions(list: Competition[]): void {
  try { sessionStorage.setItem(KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

const DAY = 86400000;
export function toDate(iso: string): Date { return new Date(iso + 'T00:00:00'); }
export function weeksBetween(today: Date, target: Date): number {
  return Math.round((target.getTime() - today.getTime()) / (7 * DAY));
}

export type Phase = 'ACUM' | 'INTENS' | 'REAL' | 'TEST' | 'POST';
const PHASE_LABEL: Record<Phase, string> = {
  ACUM: 'Acumulación', INTENS: 'Intensificación', REAL: 'Realización', TEST: 'Test/Pico', POST: 'Post-macro',
};
export function phaseLabel(p: Phase): string { return PHASE_LABEL[p]; }
export function phaseOfWeek(week: number, total: number): Phase {
  if (total <= 0) return 'ACUM';
  if (week > total) return 'POST';
  const pct = week / total;
  if (pct <= 0.4) return 'ACUM';
  if (pct <= 0.7) return 'INTENS';
  if (pct < 0.95) return 'REAL';
  return 'TEST';
}

export function competitionsFor(list: Competition[], athleteId: string): Competition[] {
  return list.filter(c => c.athleteId === athleteId).sort((a, b) => a.date.localeCompare(b.date));
}

export function nextCompetition(list: Competition[], athleteId: string, today: Date): Competition | null {
  const upcoming = competitionsFor(list, athleteId).filter(c => toDate(c.date).getTime() >= today.getTime());
  if (!upcoming.length) return null;
  const prio = upcoming.filter(c => c.priority);
  return prio[0] ?? upcoming[0];
}

export interface PlanResult {
  weeksUntil: number;
  suggestedStartWeek: number;
  realizationStart: number;
  fits: 'ok' | 'too-short' | 'too-soon';
}
export function planToward(macroTotalWeeks: number, compDate: string, today: Date): PlanResult {
  const total = Math.max(1, macroTotalWeeks);
  const weeksUntil = Math.max(0, weeksBetween(today, toDate(compDate)));
  const realizationStart = Math.max(1, Math.round(total * 0.7));
  const suggestedStartWeek = Math.max(1, Math.min(total, total - weeksUntil));
  let fits: PlanResult['fits'] = 'ok';
  if (weeksUntil > total - 1) fits = 'too-short';
  else if (suggestedStartWeek > realizationStart) fits = 'too-soon';
  return { weeksUntil, suggestedStartWeek, realizationStart, fits };
}

export interface Alignment {
  weeksUntil: number;
  compWeek: number;
  phase: Phase;
  status: 'on-peak' | 'early' | 'late' | 'past';
  suggestedStartWeek: number;
  message: string;
}
export function alignment(comp: Competition, athlete: AthleteProfile, today: Date): Alignment {
  const total = Math.max(1, athlete.macrocycle.total_weeks || getMacroDetail(athlete.macrocycle.program_id).duration);
  const current = Math.max(1, athlete.macrocycle.week || 1);
  const weeksUntil = weeksBetween(today, toDate(comp.date));
  const compWeek = current + weeksUntil;
  const realizationStart = Math.max(1, Math.round(total * 0.7));
  const phase = phaseOfWeek(compWeek, total);
  const suggestedStartWeek = Math.max(1, Math.min(total, total - weeksUntil));
  let status: Alignment['status'];
  let message: string;
  if (weeksUntil < 0) {
    status = 'past';
    message = `Competencia pasada (hace ${-weeksUntil} sem).`;
  } else if (compWeek >= realizationStart && compWeek <= total) {
    status = 'on-peak';
    message = `Cae en S${compWeek}/${total} (realización) · pica a tiempo ✓`;
  } else if (compWeek < realizationStart) {
    status = 'early';
    message = `Cae en S${compWeek}/${total} (${phaseLabel(phase)}), antes del pico S${total} → arrancá en S${suggestedStartWeek} o elegí un macro más corto.`;
  } else {
    status = 'late';
    message = `El macro termina ${compWeek - total} sem antes de la comp → quedás sin pico → elegí un macro más largo o reiniciá en S${suggestedStartWeek}.`;
  }
  return { weeksUntil, compWeek, phase, status, suggestedStartWeek, message };
}
```

- [ ] **Step 2: Build**

Run: `cd frontend && npm run build`
Expected: PASS (tsc -b + vite build sin errores).

---

## Task 2: `context/CompetitionContext.tsx` + montaje en App.tsx

**Files:**
- Create: `frontend/src/context/CompetitionContext.tsx`
- Modify: `frontend/src/App.tsx` (import + provider en :519)

- [ ] **Step 1: Crear el context**

```tsx
import { createContext, useContext, useState, type ReactNode } from 'react';
import { loadCompetitions, saveCompetitions, type Competition } from '../data/competitions';

interface CompetitionContextType {
  competitions: Competition[];
  addCompetition: (c: Omit<Competition, 'id'>) => Competition;
  updateCompetition: (id: string, patch: Partial<Omit<Competition, 'id'>>) => void;
  removeCompetition: (id: string) => void;
}
const CompetitionContext = createContext<CompetitionContextType | null>(null);

export function CompetitionProvider({ children }: { children: ReactNode }) {
  const [competitions, setCompetitions] = useState<Competition[]>(() => loadCompetitions());
  const persist = (list: Competition[]) => { setCompetitions(list); saveCompetitions(list); };
  const addCompetition = (c: Omit<Competition, 'id'>): Competition => {
    const comp: Competition = { ...c, id: `comp_${Date.now().toString(36)}` };
    persist([...competitions, comp]);
    return comp;
  };
  const updateCompetition = (id: string, patch: Partial<Omit<Competition, 'id'>>) =>
    persist(competitions.map(c => (c.id === id ? { ...c, ...patch } : c)));
  const removeCompetition = (id: string) =>
    persist(competitions.filter(c => c.id !== id));
  return (
    <CompetitionContext.Provider value={{ competitions, addCompetition, updateCompetition, removeCompetition }}>
      {children}
    </CompetitionContext.Provider>
  );
}
export function useCompetitions() {
  const ctx = useContext(CompetitionContext);
  if (!ctx) throw new Error('useCompetitions must be used within CompetitionProvider');
  return ctx;
}
```

- [ ] **Step 2: Importar en App.tsx** (junto a los otros context imports, ~línea 4)

```tsx
import { CompetitionProvider } from './context/CompetitionContext';
```

- [ ] **Step 3: Montar el provider** — envolver `<ProductProvider>` dentro de `<AthleteProvider>` (App.tsx:519-529)

```tsx
        <AthleteProvider>
          <CompetitionProvider>
            <ProductProvider>
              <RoleProvider>
                <NavigationProvider>
                  <ToastProvider>
                    <AppInner />
                  </ToastProvider>
                </NavigationProvider>
              </RoleProvider>
            </ProductProvider>
          </CompetitionProvider>
        </AthleteProvider>
```
(El hijo real entre `<ToastProvider>` y `</ToastProvider>` es el que ya existe — solo agregar el wrapper `<CompetitionProvider>`.)

- [ ] **Step 4: Build + preview no crashea**

Run: `cd frontend && npm run build` → PASS.
Preview: cargar `?demo=1` → Coach HO. La app monta sin error (consola limpia).

---

## Task 3: `components/coach/AddCompetitionSheet.tsx`

**Files:**
- Create: `frontend/src/components/coach/AddCompetitionSheet.tsx`

- [ ] **Step 1: Crear el componente**

```tsx
import React, { useState } from 'react';
import BottomSheet from '../BottomSheet';
import type { CompetitionLevel } from '../../data/competitions';

interface Props {
  open: boolean;
  onClose: () => void;
  athleteName: string;
  onSave: (input: { name: string; date: string; level?: CompetitionLevel; objective?: string; priority?: boolean }) => void;
}
const ACCENT = 'var(--engine-macro)';
const LEVELS: { id: CompetitionLevel; label: string }[] = [
  { id: 'local', label: 'Local' }, { id: 'nacional', label: 'Nacional' }, { id: 'internacional', label: 'Internacional' },
];

const AddCompetitionSheet: React.FC<Props> = ({ open, onClose, athleteName, onSave }) => {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [level, setLevel] = useState<CompetitionLevel>('nacional');
  const [objective, setObjective] = useState('');
  const [priority, setPriority] = useState(true);

  const reset = () => { setName(''); setDate(''); setLevel('nacional'); setObjective(''); setPriority(true); };
  const close = () => { onClose(); setTimeout(reset, 250); };
  const canSave = name.trim().length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(date);
  const save = () => {
    if (!canSave) return;
    onSave({ name: name.trim(), date, level, objective: objective.trim() || undefined, priority });
    close();
  };

  return (
    <BottomSheet open={open} onClose={close} title={`Agregar competencia · ${athleteName.split(' ')[0]}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Nombre"><input value={name} onChange={e => setName(e.target.value)} placeholder="Campeonato Argentino" style={inp()} /></Field>
        <Field label="Fecha"><input type="date" value={date} onChange={e => setDate(e.target.value)} style={inp()} /></Field>
        <Field label="Nivel">
          <div style={{ display: 'flex', gap: 6 }}>
            {LEVELS.map(l => <button key={l.id} onClick={() => setLevel(l.id)} style={chip(level === l.id)}>{l.label}</button>)}
          </div>
        </Field>
        <Field label="Objetivo (opcional)"><input value={objective} onChange={e => setObjective(e.target.value)} placeholder="Clasificar · PR total" style={inp()} /></Field>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <input type="checkbox" checked={priority} onChange={e => setPriority(e.target.checked)} /> Competencia prioritaria (pico principal)
        </label>
        <button onClick={save} disabled={!canSave} style={cta(canSave)}>Agendar competencia</button>
      </div>
    </BottomSheet>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.08em', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6 }}>{label}</p>
    {children}
  </div>
);
function inp(): React.CSSProperties {
  return { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--card-border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit' };
}
function chip(active: boolean): React.CSSProperties {
  return { padding: '7px 12px', borderRadius: 999, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', background: active ? `color-mix(in oklab, ${ACCENT} 20%, transparent)` : 'transparent', border: `1px solid ${active ? ACCENT : 'var(--card-border)'}`, color: active ? ACCENT : 'var(--text-secondary)' };
}
function cta(enabled: boolean): React.CSSProperties {
  return { marginTop: 4, width: '100%', padding: '11px 0', borderRadius: 10, background: enabled ? ACCENT : 'var(--card-border)', color: enabled ? '#0a0a0a' : 'var(--text-secondary)', border: 'none', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', cursor: enabled ? 'pointer' : 'default', fontFamily: 'inherit' };
}
export default AddCompetitionSheet;
```

- [ ] **Step 2: Build**

Run: `cd frontend && npm run build` → PASS.

---

## Task 4: `components/coach/CompetitionsCard.tsx` + wiring en AthleteDeepDive

**Files:**
- Create: `frontend/src/components/coach/CompetitionsCard.tsx`
- Modify: `frontend/src/pages/AthleteDeepDive.tsx`

- [ ] **Step 1: Crear CompetitionsCard**

```tsx
import React, { useState } from 'react';
import type { AthleteProfile } from '../../data/athletes';
import { useCompetitions } from '../../context/CompetitionContext';
import { competitionsFor, alignment, type Alignment } from '../../data/competitions';
import AddCompetitionSheet from './AddCompetitionSheet';

interface Props {
  athlete: AthleteProfile;
  onPlan: () => void;   // abre AssignMacrocycle (week-picker competition-aware)
}
const ACCENT = 'var(--engine-macro)';
const STATUS_COLOR: Record<Alignment['status'], string> = {
  'on-peak': '#22C55E', early: '#F59E0B', late: '#EF4444', past: 'var(--text-secondary)',
};

const CompetitionsCard: React.FC<Props> = ({ athlete, onPlan }) => {
  const { competitions, addCompetition, removeCompetition } = useCompetitions();
  const [adding, setAdding] = useState(false);
  const today = new Date();
  const list = competitionsFor(competitions, athlete.id);

  return (
    <div className="add-section">
      <div className="add-section-head">
        <h3>Competencias objetivo</h3>
        <button className="add-link-btn" onClick={() => setAdding(true)}>＋ Agregar</button>
      </div>
      {list.length === 0 ? (
        <div className="add-card">
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Sin competencias agendadas. Agregá una para planificar el pico del macro hacia esa fecha.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map(c => {
            const al = alignment(c, athlete, today);
            const color = STATUS_COLOR[al.status];
            return (
              <div key={c.id} className="add-card" style={{ borderLeft: `3px solid ${color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>{c.priority ? '🏆 ' : ''}{c.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      {fmtDate(c.date)} · {al.weeksUntil >= 0 ? `en ${al.weeksUntil} sem` : 'pasada'}{c.level ? ` · ${c.level}` : ''}{c.objective ? ` · ${c.objective}` : ''}
                    </p>
                  </div>
                  <button onClick={() => removeCompetition(c.id)} aria-label="Quitar" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 18, fontFamily: 'inherit', lineHeight: 1 }}>×</button>
                </div>
                <MacroFlagBar total={athlete.macrocycle.total_weeks} current={athlete.macrocycle.week} compWeek={al.compWeek} color={color} />
                <p style={{ fontSize: 11, fontWeight: 600, color, lineHeight: 1.4, marginTop: 6 }}>
                  <span style={{ color: '#F5C518' }}>✦ </span>{al.message}
                </p>
                {(al.status === 'early' || al.status === 'late') && (
                  <button onClick={onPlan} style={planBtn()}>Planificar hacia esta competencia →</button>
                )}
              </div>
            );
          })}
        </div>
      )}
      <AddCompetitionSheet open={adding} onClose={() => setAdding(false)} athleteName={athlete.name}
        onSave={(input) => addCompetition({ athleteId: athlete.id, ...input })} />
    </div>
  );
};

const MacroFlagBar: React.FC<{ total: number; current: number; compWeek: number; color: string }> = ({ total, current, compWeek, color }) => {
  const safeTotal = total > 0 ? total : 12;
  return (
    <div style={{ display: 'flex', gap: 2, marginTop: 8 }}>
      {Array.from({ length: safeTotal }, (_, i) => {
        const w = i + 1;
        const past = w <= current;
        const isComp = w === compWeek;
        return <div key={w} style={{ flex: 1, height: 6, borderRadius: 2, background: isComp ? color : past ? 'var(--text-secondary)' : 'var(--card-border)' }} />;
      })}
    </div>
  );
};

function planBtn(): React.CSSProperties {
  return { marginTop: 8, width: '100%', padding: '9px 0', borderRadius: 8, background: `color-mix(in oklab, ${ACCENT} 14%, transparent)`, border: `1px solid color-mix(in oklab, ${ACCENT} 45%, transparent)`, color: ACCENT, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '.03em' };
}
function fmtDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}
export default CompetitionsCard;
```

- [ ] **Step 2: Importar en AthleteDeepDive** (junto a los imports de componentes coach, ~línea 15)

```tsx
import CompetitionsCard from '../components/coach/CompetitionsCard';
```

- [ ] **Step 3: Render tras la sección "Macrociclo activo"** — en `AthleteDeepDive.tsx`, después del `</div>` que cierra el `add-section` del macro (el bloque que contiene "Cambiar días →"), agregar:

```tsx
      {/* COMPETENCIAS OBJETIVO · planificador de picos */}
      <CompetitionsCard athlete={a} onPlan={() => navigate('ASSIGN_MACRO')} />
```
(`a` es el atleta resuelto `selectedAthlete ?? currentAthlete`; `navigate` ya está en scope.)

- [ ] **Step 4: Build + preview**

Run: `cd frontend && npm run build` → PASS.
Preview (`?demo=1` → Coach HO → card de un atleta → ATHLETE_DETAIL):
- Aparece "Competencias objetivo" con estado vacío.
- "＋ Agregar" → sheet → nombre "Campeonato Argentino", fecha ~8 semanas adelante, prioritaria → "Agendar".
- La card lista la comp con countdown, mini-barra con bandera en la semana de la comp, e insight de alineación (on-peak/early/late).
- `sessionStorage['ho:competitions']` tiene la comp.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/data/competitions.ts frontend/src/context/CompetitionContext.tsx frontend/src/components/coach/AddCompetitionSheet.tsx frontend/src/components/coach/CompetitionsCard.tsx frontend/src/App.tsx frontend/src/pages/AthleteDeepDive.tsx
git commit -m "feat(coach): calendario de competencias por atleta + insight de pico"
```

---

## Task 5: WeekPicker competition-aware en AssignMacrocycle

**Files:**
- Modify: `frontend/src/pages/AssignMacrocycle.tsx`

- [ ] **Step 1: Imports** (junto a los existentes)

```tsx
import { useCompetitions } from '../context/CompetitionContext';
import { nextCompetition, planToward, toDate } from '../data/competitions';
```

- [ ] **Step 2: Calcular sugerencia** — dentro del componente, tras `const target = selectedAthlete ?? currentAthlete;`:

```tsx
  const { competitions } = useCompetitions();
  const targetComp = target ? nextCompetition(competitions, target.id, new Date()) : null;
  const plan = (targetComp && selectedWeeks > 0) ? planToward(selectedWeeks, targetComp.date, new Date()) : null;
  const compHint = (targetComp && plan)
    ? `Para picar en ${targetComp.name} (${toDate(targetComp.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}): S${plan.suggestedStartWeek}`
    : undefined;
```
(`selectedWeeks` ya existe; `target` ya existe.)

- [ ] **Step 3: Pasar props al WeekPickerModal** — en el JSX `<WeekPickerModal ... />`:

```tsx
          suggestedWeek={plan?.suggestedStartWeek}
          suggestionHint={compHint}
```

- [ ] **Step 4: Extender WeekPickerModal** — agregar a su firma de props:

```tsx
  suggestedWeek,
  suggestionHint,
}: {
  open: boolean;
  onClose: () => void;
  macroName: string;
  totalWeeks: number;
  accent: string;
  submitting: boolean;
  onConfirm: (startWeek: number, reason: string) => void;
  suggestedWeek?: number;
  suggestionHint?: string;
}) {
```

- [ ] **Step 5: Pre-seleccionar la semana sugerida** — en el `useEffect` de reset del modal:

```tsx
  useEffect(() => {
    if (open) {
      setSelectedWeek(suggestedWeek && suggestedWeek >= 1 && suggestedWeek <= totalWeeks ? suggestedWeek : 1);
      setReason(suggestedWeek ? 'previous_program' : 'beginning');
    }
  }, [open, totalWeeks, suggestedWeek]);
```

- [ ] **Step 6: Mostrar el hint** — bajo `<p className="am-wp-sub">…`, agregar:

```tsx
          {suggestionHint && <p className="am-wp-sub" style={{ color: accent, fontWeight: 700 }}>🏆 {suggestionHint}</p>}
```

- [ ] **Step 7: Build + preview**

Run: `cd frontend && npm run build` → PASS.
Preview: atleta con comp agendada → "Cambiar macro" / "Planificar hacia esta comp" → elegir macro → Confirmar → el WeekPicker abre **pre-seleccionado en S\*** y muestra el hint "🏆 Para picar en …: S…". Confirmar asigna desde esa semana (reusa Wave 1 `updateMacro`) y el deep-dive refleja el cambio.

---

## Task 6: TransitionSheet competition-aware

**Files:**
- Modify: `frontend/src/components/coach/TransitionSheet.tsx`
- Modify: `frontend/src/pages/AthleteDeepDive.tsx` (pasar la fecha de la comp)

- [ ] **Step 1: Imports en TransitionSheet**

```tsx
import { planToward } from '../../data/competitions';
```

- [ ] **Step 2: Nueva prop** — agregar a `Props`:

```tsx
  /** ISO date de la próxima competencia objetivo (si hay) → alinea la semana sugerida al pico. */
  nextCompetitionDate?: string;
```
y al destructuring del componente: `…currentTotal, onApply, nextCompetitionDate,`

- [ ] **Step 3: Preferir S\* alineado en `pickMacro`**

```tsx
  const pickMacro = (a: AffineMacro) => {
    setPicked(a);
    const aligned = nextCompetitionDate ? planToward(a.weeks, nextCompetitionDate, new Date()).suggestedStartWeek : null;
    setStartWeek(aligned ?? suggestStartWeek(currentWeek, currentTotal, a.weeks));
    setMode('continue');
  };
```

- [ ] **Step 4: Hint en el paso 3** — bajo el bloque de modo continuar/reiniciar, antes del botón "Asignar":

```tsx
              {nextCompetitionDate && (
                <p style={{ fontSize: 10, color: ACCENT, fontWeight: 700, textAlign: 'center', marginTop: 6 }}>
                  🏆 S{effectiveWeek} alinea el pico a tu próxima competencia.
                </p>
              )}
```

- [ ] **Step 5: Pasar la fecha desde AthleteDeepDive** — en el `<TransitionSheet … />`, agregar import + cálculo y prop:

En imports de AthleteDeepDive:
```tsx
import { useCompetitions } from '../context/CompetitionContext';
import { nextCompetition } from '../data/competitions';
```
En el cuerpo (tras `const a = …`):
```tsx
  const { competitions } = useCompetitions();
  const nextComp = a ? nextCompetition(competitions, a.id, new Date()) : null;
```
En el JSX del TransitionSheet:
```tsx
        nextCompetitionDate={nextComp?.date}
```

- [ ] **Step 6: Build + preview**

Run: `cd frontend && npm run build` → PASS.
Preview: atleta con comp → "Cambiar días" → elegir frecuencia + macro afín → la semana sugerida queda **alineada al pico de la comp** + hint. Aplicar persiste (Wave 1).

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/AssignMacrocycle.tsx frontend/src/components/coach/TransitionSheet.tsx frontend/src/pages/AthleteDeepDive.tsx
git commit -m "feat(coach): week-picker alinea el pico a la competencia (assign + transición)"
```

---

## Task 7: Countdown a la competencia real en AtletaHomeV2

**Files:**
- Modify: `frontend/src/pages/v2/AtletaHomeV2.tsx`

- [ ] **Step 1: Imports**

```tsx
import { useCompetitions } from '../../context/CompetitionContext';
import { nextCompetition, weeksBetween, toDate } from '../../data/competitions';
```

- [ ] **Step 2: Próxima competencia** — en el cuerpo, tras `const { macrocycle, maxes } = athlete;`:

```tsx
  const { competitions } = useCompetitions();
  const nextComp = nextCompetition(competitions, athlete.id, new Date());
  const compWeeksAway = nextComp ? Math.max(0, weeksBetween(new Date(), toDate(nextComp.date))) : undefined;
```

- [ ] **Step 3: Pasar props a MacroCard** — en `<MacroCard … />`:

```tsx
              compName={nextComp?.name}
              compWeeksAway={compWeeksAway}
```

- [ ] **Step 4: Extender MacroCard** — firma y lógica:

```tsx
function MacroCard({ current = 4, total = 12, peakAt = 8, title = 'Macrociclo', fullWidth = false, onClick, compName, compWeeksAway }) {
  const safeTotal = total > 0 ? total : 12;
  const safeCurrent = Math.min(current, safeTotal);
  const hasComp = compName != null && compWeeksAway != null;
  const flagWeek = hasComp ? Math.min(safeTotal, safeCurrent + compWeeksAway) : peakAt;
  const weeksToPeak = hasComp ? compWeeksAway : Math.max(0, peakAt - safeCurrent);
```
En el render del bar, reemplazar `const isPeak = w === peakAt;` por `const isPeak = w === flagWeek;` y el `<span className="flag" style={{ left: \`${((peakAt - 0.5) / safeTotal) * 100}%\` }}/>` por `left: \`${((flagWeek - 0.5) / safeTotal) * 100}%\``.
En el foot, reemplazar el `<span className="next">…` por:
```tsx
        <span className="next">{hasComp ? `🏆 ${compName} en ${weeksToPeak} sem` : (weeksToPeak > 0 ? `↗ pico en ${weeksToPeak} sem` : '↗ fase pico')}</span>
```

- [ ] **Step 5: Build + preview + persistencia**

Run: `cd frontend && npm run build` → PASS.
Preview: agendar comp para el atleta demo (ath_001) desde Coach → switch a rol ATL → el home muestra "🏆 {comp} en N sem" y la bandera en la semana de la comp. Reload (`location.reload()`) → la comp persiste (sessionStorage) y el countdown sigue.

- [ ] **Step 6: Commit + push**

```bash
git add frontend/src/pages/v2/AtletaHomeV2.tsx
git commit -m "feat(athlete): home muestra countdown a la competencia objetivo"
git push origin feat/api-first-refactor
```

---

## Notas de verificación final

- Build limpio en cada task (tsc -b atrapa unused/typos).
- Recorrido demo completo: agendar comp → insight de alineación → "Planificar" pre-selecciona S\* → asignar → deep-dive y home reflejan → reload persiste.
- Edge cases del spec: sin comp (estado vacío + fallback estructural), comp pasada (atenuada, `nextCompetition` la ignora), atleta sin macro (countdown sí, sin insight de pico), `compWeek` fuera de rango (early/late sin crash).
- NO inventar: competencias son input del coach; toda la matemática deriva de fechas/semanas reales del roster.
