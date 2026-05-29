# Tracking de peso corporal + categoría — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el coach/atleta registren pesajes y vean tendencia, límite de categoría y "hacer el peso" para la competencia (spec 2026-05-29-bodyweight-tracking-design.md).

**Architecture:** Espeja Wave 3 (competitions): módulo puro `data/bodyweight.ts` + `BodyweightContext` (sessionStorage `ho:weighins`) + UI en coach deep-dive y reflejo compacto en el home del atleta. Make-weight se ata a `nextCompetition` (Wave 3). Reusa `components/social/Chart` para el sparkline.

**Tech Stack:** React 19 + Vite + TS, sessionStorage. Sin backend, sin test runner → **verificación = `cd frontend && npm run build` + preview**. NO inventar: solo `body_weight` actual + log.

> Worktree: `C:/Users/Gamer/Desktop/Holy Oly 001/.claude/worktrees/compassionate-rhodes-7d48f8` · branch `feat/api-first-refactor`. Rutas relativas a `frontend/src/`.

---

## File structure

- **Create** `data/bodyweight.ts` — `WeighIn`, persistencia, helpers (`weighInsFor`, `latestWeight`, `parseClassLimit`, `makeWeight`).
- **Create** `context/BodyweightContext.tsx` — estado + add/remove + persist + `useBodyweight`.
- **Create** `components/coach/AddWeighInSheet.tsx` — BottomSheet form (fecha + kg).
- **Create** `components/coach/BodyweightCard.tsx` — card coach (actual vs límite + sparkline + make-weight + log).
- **Modify** `App.tsx` — montar `<BodyweightProvider>` dentro de `<CompetitionProvider>`.
- **Modify** `pages/AthleteDeepDive.tsx` — render `<BodyweightCard>` tras `<CompetitionsCard>`.
- **Modify** `pages/v2/AtletaHomeV2.tsx` — card compacta de peso + registrar (reusa AddWeighInSheet).

---

## Task 1: `data/bodyweight.ts`

**Files:** Create `frontend/src/data/bodyweight.ts`

- [ ] **Step 1: Escribir el módulo**

```ts
import type { AthleteProfile } from './athletes';
import type { Competition } from './competitions';
import { toDate } from './competitions';

/**
 * bodyweight · pesajes (input del coach/atleta) + gestión de categoría.
 * NO inventa historial: el punto de arranque es el body_weight real; la serie crece
 * con pesajes registrados. Persiste en sessionStorage (patrón Wave 1/3).
 */
export interface WeighIn { id: string; athleteId: string; date: string; kg: number; }

const KEY = 'ho:weighins';
export function loadWeighIns(): WeighIn[] {
  try { const raw = sessionStorage.getItem(KEY); if (raw) return JSON.parse(raw) as WeighIn[]; } catch { /* ignore */ }
  return [];
}
export function saveWeighIns(list: WeighIn[]): void {
  try { sessionStorage.setItem(KEY, JSON.stringify(list)); } catch { /* ignore */ }
}
export function weighInsFor(list: WeighIn[], athleteId: string): WeighIn[] {
  return list.filter(w => w.athleteId === athleteId).sort((a, b) => a.date.localeCompare(b.date));
}
export function latestWeight(list: WeighIn[], athlete: AthleteProfile): number {
  const own = weighInsFor(list, athlete.id);
  return own.length ? own[own.length - 1].kg : athlete.maxes.body_weight;
}
export function parseClassLimit(weightClass: string): number | null {
  const m = weightClass.match(/\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

const DAY = 86400000;
export type MakeWeightStatus = 'under' | 'on' | 'over' | 'no-class';
export interface MakeWeight {
  limit: number | null;
  current: number;
  delta: number;            // current − limit, redondeado 0.1
  daysToMeet: number | null;
  status: MakeWeightStatus;
  message: string;
}
export function makeWeight(athlete: AthleteProfile, nextComp: Competition | null, latestKg: number, today: Date): MakeWeight {
  const limit = parseClassLimit(athlete.weight_class);
  const current = Math.round(latestKg * 10) / 10;
  const daysToMeet = nextComp ? Math.max(0, Math.round((toDate(nextComp.date).getTime() - today.getTime()) / DAY)) : null;
  if (limit == null) {
    return { limit: null, current, delta: 0, daysToMeet, status: 'no-class', message: 'Categoría sin asignar' };
  }
  const delta = Math.round((current - limit) * 10) / 10;
  let status: MakeWeightStatus;
  let message: string;
  if (delta > 0.05) {
    status = 'over';
    message = nextComp ? `Bajar ${delta} kg para ${nextComp.name} · ${daysToMeet} días` : `${delta} kg sobre el límite (${limit}kg)`;
  } else if (delta < -0.05) {
    status = 'under';
    message = `${Math.abs(delta)} kg de margen · límite ${limit}kg`;
  } else {
    status = 'on';
    message = `En el límite (${limit}kg)`;
  }
  return { limit, current, delta, daysToMeet, status, message };
}
```

- [ ] **Step 2: Build** — `cd frontend && npm run build` → PASS.

---

## Task 2: `context/BodyweightContext.tsx` + montaje

**Files:** Create `frontend/src/context/BodyweightContext.tsx`; Modify `frontend/src/App.tsx`

- [ ] **Step 1: Crear el context**

```tsx
import { createContext, useContext, useState, type ReactNode } from 'react';
import { loadWeighIns, saveWeighIns, type WeighIn } from '../data/bodyweight';

interface BodyweightContextType {
  weighIns: WeighIn[];
  addWeighIn: (w: Omit<WeighIn, 'id'>) => WeighIn;
  removeWeighIn: (id: string) => void;
}
const BodyweightContext = createContext<BodyweightContextType | null>(null);

export function BodyweightProvider({ children }: { children: ReactNode }) {
  const [weighIns, setWeighIns] = useState<WeighIn[]>(() => loadWeighIns());
  const persist = (list: WeighIn[]) => { setWeighIns(list); saveWeighIns(list); };
  const addWeighIn = (w: Omit<WeighIn, 'id'>): WeighIn => {
    const wi: WeighIn = { ...w, id: `wi_${Date.now().toString(36)}` };
    persist([...weighIns, wi]);
    return wi;
  };
  const removeWeighIn = (id: string) => persist(weighIns.filter(w => w.id !== id));
  return (
    <BodyweightContext.Provider value={{ weighIns, addWeighIn, removeWeighIn }}>
      {children}
    </BodyweightContext.Provider>
  );
}
export function useBodyweight() {
  const ctx = useContext(BodyweightContext);
  if (!ctx) throw new Error('useBodyweight must be used within BodyweightProvider');
  return ctx;
}
```

- [ ] **Step 2: Importar en App.tsx** (junto a `CompetitionProvider`)

```tsx
import { BodyweightProvider } from './context/BodyweightContext';
```

- [ ] **Step 3: Montar** — envolver `<ProductProvider>` dentro de `<CompetitionProvider>`:

```tsx
          <CompetitionProvider>
            <BodyweightProvider>
              <ProductProvider>
                <RoleProvider>
                  <NavigationProvider>
                    <ToastProvider>
                      <AppInner />
                    </ToastProvider>
                  </NavigationProvider>
                </RoleProvider>
              </ProductProvider>
            </BodyweightProvider>
          </CompetitionProvider>
```

- [ ] **Step 4: Build** — `cd frontend && npm run build` → PASS. Preview: `?demo=1` monta sin error.

---

## Task 3: `components/coach/AddWeighInSheet.tsx`

**Files:** Create `frontend/src/components/coach/AddWeighInSheet.tsx`

- [ ] **Step 1: Crear el componente**

```tsx
import React, { useState, useEffect } from 'react';
import BottomSheet from '../BottomSheet';

interface Props {
  open: boolean;
  onClose: () => void;
  athleteName: string;
  defaultKg?: number;
  onSave: (input: { date: string; kg: number }) => void;
}
const ACCENT = 'var(--engine-stress)';

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const AddWeighInSheet: React.FC<Props> = ({ open, onClose, athleteName, defaultKg, onSave }) => {
  const [date, setDate] = useState(todayISO());
  const [kg, setKg] = useState('');
  useEffect(() => { if (open) { setDate(todayISO()); setKg(defaultKg != null ? String(defaultKg) : ''); } }, [open, defaultKg]);

  const kgNum = parseFloat(kg);
  const canSave = /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(kgNum) && kgNum > 0;
  const save = () => { if (!canSave) return; onSave({ date, kg: Math.round(kgNum * 10) / 10 }); onClose(); };

  return (
    <BottomSheet open={open} onClose={onClose} title={`Registrar pesaje · ${athleteName.split(' ')[0]}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Fecha"><input type="date" value={date} onChange={e => setDate(e.target.value)} style={inp()} /></Field>
        <Field label="Peso (kg)"><input type="number" inputMode="decimal" step="0.1" value={kg} onChange={e => setKg(e.target.value)} placeholder="72.4" style={inp()} /></Field>
        <button onClick={save} disabled={!canSave} style={cta(canSave)}>Guardar pesaje</button>
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
function cta(enabled: boolean): React.CSSProperties {
  return { marginTop: 4, width: '100%', padding: '11px 0', borderRadius: 10, background: enabled ? ACCENT : 'var(--card-border)', color: enabled ? '#0a0a0a' : 'var(--text-secondary)', border: 'none', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', cursor: enabled ? 'pointer' : 'default', fontFamily: 'inherit' };
}
export default AddWeighInSheet;
```

- [ ] **Step 2: Build** — `cd frontend && npm run build` → PASS.

---

## Task 4: `components/coach/BodyweightCard.tsx` + wiring en AthleteDeepDive

**Files:** Create `frontend/src/components/coach/BodyweightCard.tsx`; Modify `frontend/src/pages/AthleteDeepDive.tsx`

- [ ] **Step 1: Crear BodyweightCard**

```tsx
import React, { useState } from 'react';
import type { AthleteProfile } from '../../data/athletes';
import type { Competition } from '../../data/competitions';
import { useBodyweight } from '../../context/BodyweightContext';
import { weighInsFor, latestWeight, makeWeight, type MakeWeightStatus } from '../../data/bodyweight';
import Chart from '../social/Chart';
import AddWeighInSheet from './AddWeighInSheet';

interface Props { athlete: AthleteProfile; nextComp: Competition | null; }
const STATUS_COLOR: Record<MakeWeightStatus, string> = {
  under: '#22C55E', on: '#FBBF24', over: '#EF4444', 'no-class': 'var(--text-secondary)',
};

const BodyweightCard: React.FC<Props> = ({ athlete, nextComp }) => {
  const { weighIns, addWeighIn, removeWeighIn } = useBodyweight();
  const [adding, setAdding] = useState(false);
  const series = weighInsFor(weighIns, athlete.id);
  const current = latestWeight(weighIns, athlete);
  const mw = makeWeight(athlete, nextComp, current, new Date());
  const color = STATUS_COLOR[mw.status];

  return (
    <div className="add-section">
      <div className="add-section-head">
        <h3>Peso · categoría</h3>
        <button className="add-link-btn" onClick={() => setAdding(true)}>＋ Registrar</button>
      </div>
      <div className="add-card" style={{ borderLeft: `3px solid ${color}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
          <p style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)' }}>
            {current.toFixed(1)} <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>kg</span>
          </p>
          <p style={{ fontSize: 12, fontWeight: 700, color }}>{athlete.weight_class}</p>
        </div>
        <p style={{ fontSize: 11, fontWeight: 600, color, marginTop: 2, lineHeight: 1.4 }}>
          <span style={{ color: '#F5C518' }}>✦ </span>{mw.message}
        </p>
        {series.length >= 2 ? (
          <div style={{ marginTop: 8 }}>
            <Chart data={{ kind: 'sparkline', values: series.map(w => w.kg) }} color={color} width={300} height={48} />
          </div>
        ) : (
          <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 8 }}>Registrá pesajes para ver la tendencia.</p>
        )}
        {series.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
            {series.slice(-4).reverse().map(w => (
              <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-secondary)' }}>
                <span>{fmtDate(w.date)}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <strong style={{ color: 'var(--text)' }}>{w.kg.toFixed(1)} kg</strong>
                  <button onClick={() => removeWeighIn(w.id)} aria-label="Quitar" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>×</button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <AddWeighInSheet open={adding} onClose={() => setAdding(false)} athleteName={athlete.name} defaultKg={current}
        onSave={(input) => addWeighIn({ athleteId: athlete.id, ...input })} />
    </div>
  );
};

function fmtDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
}
export default BodyweightCard;
```

- [ ] **Step 2: Importar en AthleteDeepDive** (junto a `CompetitionsCard`)

```tsx
import BodyweightCard from '../components/coach/BodyweightCard';
```

- [ ] **Step 3: Render tras CompetitionsCard** — `AthleteDeepDive.tsx` ya tiene `nextComp` en scope (de Wave 3). Agregar después del `<CompetitionsCard … />`:

```tsx
      {/* PESO · CATEGORÍA · make-weight atado a la competencia */}
      <BodyweightCard athlete={a} nextComp={nextComp} />
```

- [ ] **Step 4: Build + preview**

Run: `cd frontend && npm run build` → PASS.
Preview (`?demo=1` → Coach HO → atleta → ATHLETE_DETAIL): card "Peso · categoría" con actual (body_weight) vs `weight_class`; "＋ Registrar" → sheet (fecha hoy + kg) → guardar → aparece en lista; con ≥2 pesajes → sparkline; con la comp de Wave 3 → make-weight ("Bajar X kg para … · N días" o margen). `sessionStorage['ho:weighins']` tiene el pesaje.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/data/bodyweight.ts frontend/src/context/BodyweightContext.tsx frontend/src/components/coach/AddWeighInSheet.tsx frontend/src/components/coach/BodyweightCard.tsx frontend/src/App.tsx frontend/src/pages/AthleteDeepDive.tsx
git commit -m "feat(coach): tracking de peso + límite de categoría + make-weight"
```

---

## Task 5: Card compacta de peso en AtletaHomeV2

**Files:** Modify `frontend/src/pages/v2/AtletaHomeV2.tsx`

- [ ] **Step 1: Imports**

```tsx
import { useBodyweight } from '../../context/BodyweightContext';
import { latestWeight, makeWeight } from '../../data/bodyweight';
import AddWeighInSheet from '../../components/coach/AddWeighInSheet';
```

- [ ] **Step 2: Estado + cómputo** — en el cuerpo de `App()`, junto a los otros hooks (antes del `if (!athlete) return null`):

```tsx
  const { weighIns, addWeighIn } = useBodyweight();
  const [logOpen, setLogOpen] = useState(false);
```
Y tras `const compWeeksAway = …;` (donde ya se calcula `nextComp`):

```tsx
  const bw = makeWeight(athlete, nextComp, latestWeight(weighIns, athlete), new Date());
  const BW_COLOR = { under: '#22C55E', on: '#FBBF24', over: '#EF4444', 'no-class': 'var(--text-secondary)' };
```

> Nota: `nextComp` ya existe en AtletaHomeV2 (Task 7 de Wave 3). Si no, agregar `const nextComp = nextCompetition(competitions, athlete.id, new Date());` con sus imports — pero ya está.

- [ ] **Step 3: Render de la card** — tras el `</div>` que cierra la ROW 2 (la que contiene `<MacroCard … />`), agregar una nueva fila:

```tsx
          {/* PESO · CATEGORÍA */}
          <div className="ah-row-2">
            <Card onClick={() => setLogOpen(true)} style={{ gridColumn: '1 / -1' }}>
              <div className="ah-eyebrow">PESO · CATEGORÍA</div>
              <div className="ah-macro-title">{bw.current.toFixed(1)} kg · {athlete.weight_class}</div>
              <div className="ah-macro-foot">
                <span style={{ color: BW_COLOR[bw.status] }}>{bw.message}</span>
                <span className="next">＋ registrar</span>
              </div>
            </Card>
          </div>
```

(`Card` acepta `children`, `style`, `onClick` — sin prop `fullWidth`; el ancho full se logra con `gridColumn: '1 / -1'`, igual que hace `MacroCard`.)

- [ ] **Step 4: Montar el sheet** — antes del cierre del JSX raíz del componente (junto a otros modales/sheets si los hay, o al final del return):

```tsx
      <AddWeighInSheet open={logOpen} onClose={() => setLogOpen(false)} athleteName={athlete.name} defaultKg={bw.current}
        onSave={(input) => addWeighIn({ athleteId: athlete.id, ...input })} />
```

> `Card({ critical, children, className, style, onClick })` ya se usa en este archivo (lo usa `MacroCard`). Full-width = `style={{ gridColumn: '1 / -1' }}`.

- [ ] **Step 5: Build + preview + persistencia**

Run: `cd frontend && npm run build` → PASS.
Preview: rol ATL → home → card "PESO · CATEGORÍA" con actual + `weight_class` + make-weight (si hay comp); tap → sheet → registrar → se refleja; reload (`location.reload()`) → persiste (`ho:weighins`).

- [ ] **Step 6: Commit + push**

```bash
git add frontend/src/pages/v2/AtletaHomeV2.tsx
git commit -m "feat(athlete): home refleja peso/categoría + registrar pesaje"
git push origin feat/api-first-refactor
```

---

## Notas de verificación final

- Build limpio en cada task.
- Recorrido demo: registrar pesajes → tendencia + estado vs categoría → con comp de Wave 3 → make-weight → home del atleta refleja + registra → persiste reload.
- Edge cases del spec: sin pesajes (usa body_weight + prompt), categoría '—' (no-class, sin make-weight), sin comp (solo actual vs límite), kg inválido (guardar deshabilitado).
- NO inventar: solo el body_weight real + lo que se registre.
