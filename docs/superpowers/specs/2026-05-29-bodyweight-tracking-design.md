# Spec · Tracking de peso corporal + gestión de categoría

> Fecha: 2026-05-29 · branch `feat/api-first-refactor` · pendiente #3 (parte 2 de 2). Cierra la visión "administrador de macrociclos" junto con el calendario de competencias (Wave 3).

## Objetivo

Que el coach (y el atleta) registren pesajes, vean la tendencia y el límite de categoría, y sepan "hacer el peso" para la competencia (kg a bajar + días al meet). Se acopla con el calendario de competencias de Wave 3.

## Decisiones del Boss (vigentes)

- **Historial = solo peso actual + log.** Sin seed de historial. El punto de partida es el `body_weight` real del atleta; la serie crece solo con pesajes registrados (input). Persiste en sessionStorage (patrón Wave 1/3).
- **Superficie:** card en el deep-dive del coach + reflejo compacto en el home del atleta. Ambos pueden registrar pesajes.
- **"Hacer el peso"** atado a la próxima competencia (Wave 3): kg sobre/bajo el límite + días al meet.
- Fuera de alcance: alerta de make-weight en la bandeja del coach (posible follow-up).

## Modelo de datos

```ts
// data/bodyweight.ts
export interface WeighIn {
  id: string;
  athleteId: string;
  date: string;   // 'YYYY-MM-DD'
  kg: number;
}
```

Persistencia: `sessionStorage['ho:weighins']` → `WeighIn[]`. CRUD: load / add / remove + persist. Sobrevive reload (igual que `ho:competitions` / `ho:macroOverrides`). Sin backend.

## Helpers puros (data/bodyweight.ts)

```ts
loadWeighIns(): WeighIn[]
saveWeighIns(list): void
weighInsFor(list, athleteId): WeighIn[]            // ordenados por fecha asc
latestWeight(list, athlete): number                 // último log; si no hay, athlete.maxes.body_weight (punto actual real)
parseClassLimit(weight_class: string): number | null // '-73kg'→73, '+109kg'→109, '—'→null
makeWeight(athlete, nextComp, latestKg, today): {
  limit: number | null;
  current: number;
  delta: number;            // current − limit (+ = sobre el límite)
  daysToMeet: number | null;
  status: 'under' | 'on' | 'over' | 'no-class';
  message: string;
}
```

- `latestWeight`: el `body_weight` del atleta es el punto "actual" inicial; cada pesaje registrado lo sobreescribe como último. La serie del chart = pesajes registrados (sin el body_weight undated). Con <2 pesajes: mostrar el valor actual + "registrá pesajes para ver tendencia"; con ≥2: sparkline.
- `parseClassLimit`: extrae el primer número de `weight_class`; null si no hay (categoría '—' / sin asignar).
- `makeWeight.status`: `no-class` si limit null; `over` si delta > 0.05; `under` si delta < −0.05; `on` en el resto. `delta` redondeado a 0.1. `daysToMeet` = días hasta `nextComp.date` (null si no hay comp).
- `message` (legible): over **con** comp → `Bajar ${delta} kg para ${comp.name} · ${daysToMeet} días`; over **sin** comp → `${delta} kg sobre el límite (${limit}kg)`; under → `${-delta} kg de margen · límite ${limit}kg`; on → `En el límite (${limit}kg)`; no-class → `Categoría sin asignar`. (`daysToMeet`/`comp` solo se usan si `nextComp` no es null.)

## Componentes

1. **`data/bodyweight.ts`** — tipos + persistencia + helpers puros de arriba. Sin data inventada.
2. **`context/BodyweightContext.tsx`** — `weighIns` + `addWeighIn(Omit<WeighIn,'id'>)` + `removeWeighIn(id)` + persist + `useBodyweight()`. Montado junto a `CompetitionProvider` en `App.tsx`. Espejo de CompetitionContext.
3. **`components/coach/AddWeighInSheet.tsx`** — `BottomSheet` con form: fecha (default hoy) + kg (number). onSave → addWeighIn.
4. **`components/coach/BodyweightCard.tsx`** (en `AthleteDeepDive`, tras `CompetitionsCard`) — estilo `.add-card`:
   - Actual vs límite: `72.4 / 73 kg · 0.6 bajo el límite ✓` (verde) o `74.0 / 73 kg · 1.0 sobre ⚠` (rojo).
   - Tendencia: `<Chart kind="sparkline" values={…} />` (reusa `components/social/Chart`) si ≥2 pesajes; si no, el valor actual + prompt.
   - Make-weight (si hay comp): el `message` de `makeWeight`.
   - Lista de pesajes recientes con quitar (×). Botón "＋ Registrar pesaje" → AddWeighInSheet.
5. **`AtletaHomeV2`** — card compacta propia (estilo `ah-*`/`Card`, NO `.add-card`) tras la ROW del macro: actual/límite + make-weight si hay comp + "registrar" (reusa AddWeighInSheet). Lógica compartida vía `data/bodyweight.ts` + `useBodyweight`.

> Nota de presentación: la lógica (`makeWeight`, `latestWeight`) se comparte; la UI se renderiza por superficie (coach `.add-card` vs home `ah-*`) para respetar cada design system. No se comparte el componente visual.

## Flujo de datos

```
Coach (AthleteDeepDive) → BodyweightCard "Registrar" → AddWeighInSheet → addWeighIn()
   → BodyweightContext (estado + sessionStorage 'ho:weighins')
   → makeWeight(athlete, nextCompetition, latestWeight, today) → estado vs límite + días al meet
Atleta (AtletaHomeV2) → card compacta lee useBodyweight + makeWeight → mismo estado; puede registrar
```

`nextCompetition` viene del CompetitionContext de Wave 3 (per atleta).

## Manejo de errores / edge cases

- Sin pesajes → `latestWeight` = `body_weight`; chart muestra el valor + prompt (no sparkline).
- Categoría '—' / sin límite → `status: no-class`, sin make-weight (solo muestra el peso actual).
- Sin competencia → make-weight muestra solo actual vs límite (sin días/meet).
- kg inválido (≤0 o NaN) → botón guardar deshabilitado.
- sessionStorage no disponible → CRUD en memoria (try/catch silencioso).

## Verificación

- Build `tsc -b && vite build` limpio.
- Preview: deep-dive de un atleta → card de peso (actual vs límite); registrar pesaje → aparece en la lista + tendencia; con la comp de Wave 3 → make-weight ("bajar X kg · N días"); home del atleta refleja el estado y permite registrar; persiste tras reload.
- Commit por sub-bloque + push (Render auto-deploya).

## NO inventar

- Pesajes = input del coach/atleta (no se seedea historial). El único punto real de arranque es el `body_weight` existente. Límite de categoría parseado del `weight_class` real.
