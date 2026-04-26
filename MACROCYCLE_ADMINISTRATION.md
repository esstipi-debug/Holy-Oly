# 🎯 Macrocycle Administration — Manual Operacional Unificado

> **Propósito:** Documento master que conecta `macrocycle_engine` + `session_adaptation_engine` + `stress_engine` en un flujo único de administración.
> **Destinatarios:** Coach (UX), Atleta (visibilidad), Antigravity (lógica automática).
> **Fecha:** 2026-04-20

---

## 1. Roles y autoridad (RACI)

| Acción | Coach | Atleta | Sistema |
|---|---|---|---|
| Seleccionar macrociclo base | **R** (responsable) | C (consultado) | A (asiste sugiriendo) |
| Asignar a atleta | **R** | I | A |
| Ajustar carga semanal | **R** | C | A (recomienda) |
| Ajustar sesión diaria | A (aprueba) | C | **R** (auto si CNS/stress) |
| Sustituir ejercicio | A (aprueba) | C | **R** (chain automático) |
| Detener macrociclo | **R** | C | A (alerta forzada si RED zone) |
| Deload programado | A | I | **R** (auto cada 4 semanas) |

**R** = Responsible · **A** = Accountable · **C** = Consulted · **I** = Informed

---

## 2. Ciclo de vida del macrociclo

```
[SELECT] → [ASSIGN] → [EXECUTE] → [MONITOR] → [ADJUST] → [COMPLETE]
   ↑                                   ↓
   └────────── [ABORT] ←── RED zone ───┘
```

### Fase 1: SELECT (Coach)
- Coach elige 1 de 23 macrociclos (ver `03_macrocycle_engine.md §22-67`)
- Filtro asistido: nivel atleta, objetivo, duración disponible, historial lesiones
- Sistema muestra compatibility score (0-100) basado en perfil atleta

### Fase 2: ASSIGN (Sistema)
- Genera `macrocycleSession[]` personalizadas (pesos según PRs atleta)
- Calcula % 1RM por sesión → valor absoluto en kg
- Valida: 0 ejercicios prohibidos por historial lesiones
- Crea notificación a atleta: "Nuevo bloque iniciado: {nombre}, {X} semanas"

### Fase 3: EXECUTE (Atleta)
- Atleta ve sesión del día en app
- Warmup generado (`08_warmup_engine.md`)
- Ejecución + log RPE por set
- Feedback post-sesión: soreness, sleep, readiness

### Fase 4: MONITOR (Sistema continuo)
Emite métricas en cada sesión:
- CNS Score (0-100)
- ACWR (Acute:Chronic Workload Ratio)
- RPE divergence (RPE esperado vs reportado)
- Velocity drop (si hay sensor)

### Fase 5: ADJUST (3 niveles — ver §4)
### Fase 6: COMPLETE / ABORT

---

## 3. Catálogo de advertencias (triggers numéricos)

### 🟢 GREEN (info, sin acción)
| Trigger | Condición | Acción sistema |
|---|---|---|
| Buen progreso | PR estimado +2.5% vs baseline 30d | Notificación motivacional |
| Adherencia 100% | 7/7 sesiones completadas semana | Badge + gamification |
| CNS estable | CNS Score > 75 por 5 días | — |

### 🟡 YELLOW (warning, proponer ajuste)
| Trigger | Condición | Acción sistema |
|---|---|---|
| Fatiga acumulada | CNS Score 50-75 por 3 días | Propone bajar 10% volumen |
| ACWR alto | ratio > 1.3 | Propone deload 1 día |
| Sueño bajo | < 6h promedio 5 días | Propone mover sesión pesada +24h |
| RPE divergence | +2 puntos vs plan en 2 sesiones | Propone recalibrar 1RM |
| Soreness localizado | > 7/10 en zona X, 2 sesiones | Sustitución ejercicio vía chain |

**Comportamiento YELLOW:** Notificación al coach + propuesta al atleta (opt-in). Sistema NO modifica sin aprobación.

### 🔴 RED (stop, ajuste forzado)
| Trigger | Condición | Acción sistema |
|---|---|---|
| CNS crítico | CNS Score < 50 | Session skip automático + deload forzado |
| ACWR peligroso | ratio > 1.5 | Bloquea sesión, notifica coach |
| Dolor articular | Atleta reporta "injury flag" | Stop ejercicio + referir fisio |
| Sueño crítico | < 4h por 3 días | Stop sesiones pesadas 48h |
| Alcohol flag | Reportado > 3 unidades noche previa | Restring intensidad < 70% 1RM |
| 3 YELLOW consecutivos | Cualquier combinación 72h | Auto-deload semana |

**Comportamiento RED:** Sistema ACTÚA sin pedir permiso. Notifica a coach simultáneamente. Atleta recibe mensaje empático ("Control de Daños").

---

## 4. Reglas de ajuste (AUTO vs PROPUESTA vs MANUAL)

### AUTO (sistema ejecuta, notifica después)
- Skip sesión si CNS < 50
- Reducir peso -10% si velocity drop > 20%
- Sustitución ejercicio vía `SUBSTITUTION_CHAINS.md` si dolor reportado
- Deload programado cada 4 semanas (última semana del bloque)
- Warmup extendido si soreness > 6/10

### PROPUESTA (sistema sugiere, atleta/coach aprueba)
- Cambio de macrociclo (si 2 semanas con ACWR > 1.3)
- Ajuste volumen semanal ± 15%
- Mover sesión pesada de día
- Cambio de variante (back squat → front squat)

### MANUAL (solo coach)
- Asignar nuevo macrociclo
- Modificar PRs baseline
- Añadir/eliminar ejercicios custom
- Override de advertencias RED (con justificación)
- Aprobar retorno post-lesión

---

## 5. Mecánica de ajuste en sesión activa

```
Atleta inicia sesión
    ↓
Sistema lee: CNS score, RPE última sesión, sleep último, soreness
    ↓
┌──────────────┬─────────────┬──────────────┐
│  CNS > 75    │ CNS 50-75   │  CNS < 50    │
│  GREEN       │ YELLOW      │  RED         │
│  ↓           │ ↓           │  ↓           │
│  Plan x1.0   │ Plan x0.9   │ Deload x0.6  │
│  RPE target  │ RPE -1      │ Solo técnica │
│  normal      │ Rest +30s   │ < 70% 1RM    │
└──────────────┴─────────────┴──────────────┘
    ↓
Durante sesión, si:
- RPE reportado > esperado +2 → reducir sets restantes
- Velocity drop > 25% → stop ejercicio, sustituir accesorio
- Atleta reporta dolor → injury flag → modal de decisión
```

---

## 6. Dashboard coach (advertencias visibles)

Panel `Command Center Coach` muestra por atleta:

```
┌─────────────────────────────────────────────┐
│ 🟡 María González — CrossFit — Semana 3/12  │
│                                             │
│ CNS: 62 ↓  ACWR: 1.35 ↑  Sleep: 5.8h ↓      │
│ Adherencia: 6/7 sesiones                    │
│                                             │
│ ⚠️ Alertas (2):                             │
│ • Fatiga acumulada 3 días → Propongo deload │
│ • ACWR subiendo 2 semanas → Revisar volumen │
│                                             │
│ [Aceptar ajuste] [Ver detalle] [Override]   │
└─────────────────────────────────────────────┘
```

---

## 7. Log inmutable de ajustes (auditoría)

Cada ajuste registrado en tabla `macrocycle_adjustment_log`:

```sql
- adjustmentId (uuid)
- athleteId
- macrocycleId
- sessionId (nullable)
- trigger (enum: cns_red, acwr_high, injury_flag, coach_manual, auto_deload)
- actionType (enum: skip, reduce_load, substitute_exercise, abort_block)
- oldValue (jsonb)
- newValue (jsonb)
- decidedBy (enum: system, coach, athlete)
- approvedBy (nullable, uuid coach)
- createdAt
- reason (text, nullable)
```

**Regla:** Nunca modificar sesiones pasadas. Ajustes solo aplican forward.

---

## 8. Escalamiento de advertencias

```
YELLOW 1x  → Notificación in-app atleta
YELLOW 2x  → Push notification + mail coach
YELLOW 3x  → Auto-downgrade a amarillo persistente + propuesta deload
RED 1x     → Push inmediato coach + atleta + bloqueo sesión
RED 2x     → Escalamiento: sugerir consulta médica/fisio
INJURY     → Stop macrociclo + modal retorno condicionado
```

---

## 9. Interacción con Gemini (LLM empático)

Todo mensaje YELLOW/RED al atleta pasa por Gemini 2.0 Pro con prompt "Control de Daños":

```
System: Eres coach empático. Nunca culpabilices. Explica el "porqué" 
científico breve. Da 1 acción concreta. Tono: firme pero cercano.

Context: {atleta_name}, {cns_score}, {trigger}, {macrocycle}, {próxima_sesión}

Generar mensaje < 80 palabras.
```

**Ejemplo output:**
> "María, tu sistema nervioso marca 58/100 — está pidiendo un respiro. Tres noches de < 6h le pasan factura a la fuerza explosiva. Hoy intercambiamos: snatch pesado → técnica al 60% + movilidad. Mañana volvemos con todo. 💪"

---

## 10. Advertencias específicas por deporte

### Holy Oly (Halterofilia)
- Alerta si > 4 sesiones/semana con snatch + clean max effort → sobrecarga técnica
- Flag si ratio front/back squat cambia > 10% → desbalance
- Velocity drop > 15% en primera serie → CNS no listo

### Volta (CrossFit)
- ACWR > 1.5 + metcon diario → riesgo rhabdo
- > 3 WODs seguidos con "quad dominant" → IT band flag
- Sleep < 6h + fran time > 10% peor → fatiga

### Axon (Hyrox)
- > 80 km running/semana sin rest → tibia stress
- Sled push + deadlift mismo día 2x semana → lumbar flag
- 6 semanas sin race simulation → desacondicionamiento aerobico

---

## 11. Checklist claridad operativa

- [x] Roles definidos (RACI §1)
- [x] Ciclo vida 6 fases (§2)
- [x] 18 triggers numéricos catalogados (§3)
- [x] Reglas AUTO/PROPOSE/MANUAL (§4)
- [x] Decisión en sesión activa (§5)
- [x] UX coach dashboard (§6)
- [x] Log auditable (§7)
- [x] Escalamiento niveles (§8)
- [x] LLM empático integrado (§9)
- [x] Advertencias por deporte (§10)

---

## 12. Pending

- [ ] Implementar `macrocycle_adjustment_log` schema en Drizzle/SQLAlchemy
- [ ] Endpoint `POST /v1/macrocycle/:id/adjust` (coach-facing)
- [ ] Endpoint `GET /v1/athlete/:id/warnings` (atleta)
- [ ] Job nightly: calcular ACWR + flags persistentes
- [ ] Tests fixture: 10 escenarios (green/yellow/red) con expected actions

---

**Ruta:** `C:\Users\Gamer\Desktop\Holy Oly 001\MACROCYCLE_ADMINISTRATION.md`
**Referencias cruzadas:**
- `engines/03_macrocycle_engine.md` (23 programas)
- `engines/02_session_adaptation_engine.md` (risk zones)
- `engines/01_stress_engine.md` (CNS score)
- `engines/14_smart_coach_engine.md` (LLM empático)
- `exercises/SUBSTITUTION_CHAINS.md` (cadenas sustitución)
