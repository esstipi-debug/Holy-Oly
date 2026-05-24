# Audit Lógica de Deporte · Holy Oly (Halterofilia) vs Volta (CrossFit)

## Resumen del problema

Cada producto debe tener terminología y flow propios:

| | Holy Oly | Volta |
|---|----------|-------|
| Deporte | Halterofilia olímpica | CrossFit |
| Ejercicios | Arrancada, Cargada, Envión, sentadillas | AMRAP/EMOM/For Time, Pull-ups, Box Jumps, Murph, Fran |
| Sesión | Sets × reps × %1RM con descanso | WOD cronometrado (tiempo objetivo o rondas) |
| Métricas | 1RM por levantamiento, tonelaje | CF Index, benchmark WODs, RX vs Scaled |
| Macrocicle | Búlgaro, Cubano, Ruso, Chino | CF Open Prep, Conditioning Block |

---

## Bug #1: PulseHub muestra terminología CrossFit en producto HO

**Archivo:** `frontend/src/pages/PulseHub.tsx` (línea 8-14, 43)

**Contenido actual (mezclado):**
```js
const ACTIONS = [
  'completó AMRAP 20 (Rx)',          // ❌ CrossFit en HO
  'alcanzó PR en Snatch (+2kg)',     // ✓ Halterofilia
  'inició sesión: Prep. Campeonato', // ✓ Genérico
  ...
];

// Título de sección
<h3>Retos Globales (EMOM/AMRAP)</h3>  // ❌ CrossFit en HO

// Reto destacado
"THE DROP-OFF CHALLENGE"
"Sincronizado: 12:00 PM"
```

**Fix propuesto:** Reemplazar acciones y título con terminología halterofilia:
- "completó AMRAP 20 (Rx)" → "completó complejo de Arrancada"
- "Retos Globales (EMOM/AMRAP)" → "Retos del Club · Halterofilia"
- "THE DROP-OFF CHALLENGE" → "MAX SNATCH DEL DÍA" (concepto: máximo del día)

---

## Bug #2 (CRÍTICO): Flow Atleta Volta usa pantallas de Holy Oly

**Archivos involucrados:**
- `WarmupGenerator.tsx` — solo tiene Snatch/Snatch Balance/OHS
- `ActiveSession.tsx` — set tracker Arrancada con %1RM
- `SessionSummaryPreview.tsx` — "Snatch Day: Speed Focus"

**Cómo se manifiesta:**

Atleta de Volta (CrossFit):
1. Click `VOLTA_HOME` "Iniciar WOD"
2. Va a `VOLTA_PREWOD` (Check HRV) ✓ CrossFit correcto
3. Click "Iniciar WOD (modificado)" → `navigate('WARMUP')`
4. **Ve calentamiento de Snatch** ❌ contenido olímpico
5. Click "FINALIZAR CALENTAMIENTO" → `navigate('SESSION')`
6. **Ve set tracker de Arrancada %1RM** ❌ debería ser AMRAP timer
7. `VICTORY` final ✓ genérico OK

**Routing actual en App.tsx (línea 187-207):**
```tsx
if (product === 'volta') {
  switch (currentView) {
    case 'VOLTA_COACH':           return <VoltaCoachDash />;
    case 'VOLTA_COACH_WOD':       return <VoltaCoachWod />;
    case 'VOLTA_PREWOD':          return <VoltaPreWod />;
    // ❌ WARMUP, SESSION, SUMMARY caen al default (HO)
    default:
      return role === 'coach' ? <VoltaCoachDash /> : <VoltaDashboard />;
  }
}
```

**Fixes posibles:**

### Opción A · Quick (1-2h)
Hacer `WarmupGenerator/ActiveSession/SessionSummaryPreview` product-aware:
- Detectan `useProduct().product`
- Si es `volta`, renderizan contenido CrossFit (AMRAP timer, movs CrossFit)
- Si es `holy-oly`, contenido olímpico actual

### Opción B · Limpio (4-6h)
Crear 3 pantallas Volta nuevas:
- `VoltaWarmup.tsx` — calentamiento CrossFit (movilidad general + activación)
- `VoltaActiveWod.tsx` — AMRAP/EMOM timer, contador de rondas
- `VoltaWodSummary.tsx` — recap: rondas/reps, RX vs Scaled, tiempo

Y rutearlas para Volta atleta.

### Recomendación
**Opción A primero** (rápido y resuelve el bug visible), después migrar a B en una iteración futura cuando se necesite UX más sofisticada (timer integrado, etc).

---

## Bug #3 (menor): SessionSummaryPreview tiene "Volta CrossFit" como tier Premium

**Archivo:** `frontend/src/pages/PreMium.tsx` (presumiblemente)

Premium tier ELITE menciona "Volta CrossFit ✓" como feature exclusiva. Eso implica que Volta es un add-on de HO, no un producto separado. Hay que decidir el modelo:
- **A)** Volta es un producto separado con su propia suscripción
- **B)** Volta es feature ELITE de Holy Oly

Si es A: borrar de la matriz comparativa. Si es B: cambiar branding/copy para reflejar que son sub-features del mismo producto.

---

## Bug #4 (verificación pendiente): Macrocycles cross-product

**Archivo:** `frontend/src/data/macrocycles.ts`

21 macrociclos definidos. ¿Están separados por deporte?
- Halterofilia: Búlgaro, Coreano, Chino, Cubano, Polaco, Ruso, Ucraniano, Colombiano, Híbridos, USA Weightlifting
- CrossFit: HYROX (?), CF Open Prep (?), Conditioning Block (?)

**Verificación:**
- AssignMacrocycle hoy se usa solo desde Coach HO. Si Coach Volta intenta entrar, los 21 macrociclos que ve son HO. Eso está mal si Volta debería ver solo CF macros.
- Actualmente AssignMacro es accesible desde Volta Coach (vía CommandCenter o NEW_ATHLETE flow).

**Fix propuesto:** filtrar macrociclos por producto en AssignMacrocycle.

---

## Plan de fix priorizado

| # | Bug | Prioridad | Esfuerzo |
|---|-----|-----------|----------|
| 1 | PulseHub terminología | 🔴 Alta | 10min |
| 2 | Atleta Volta → pantallas HO (Warmup/Session/Summary) | 🔴 Alta | 2-6h |
| 3 | Tier Premium "Volta CrossFit" | 🟡 Media | depende decisión modelo |
| 4 | Filtrar macrociclos por deporte | 🟡 Media | 30min |

---

## ¿Cómo seguimos?

Decime:
1. ¿Bug #2 vamos por **Opción A (quick)** o **Opción B (separar pantallas)**?
2. ¿Bug #3: Volta es producto separado o feature de HO?
3. ¿Arranco los fixes en orden de prioridad?
