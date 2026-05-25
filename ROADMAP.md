# ROADMAP · Holy Oly + Volta

> Documento único de verdad. Reemplaza HANDOFF, PLAN_TRABAJO Fase 3.5 y los
> planes flotantes de los últimos chats. Si algo no está acá, no es prioridad.

---

## 1. ¿Qué métrica es "primaria" en cada deporte?

Confusión raíz: estuve mezclando métricas de halterofilia con CrossFit. Son
deportes distintos, métricas distintas, jerarquía distinta.

### Holy Oly · halterofilia olímpica (atleta)

| Tier | Métrica | Por qué importa |
|---|---|---|
| **PRIMARIA** | **1RM** por levantamiento (Snatch, C&J) | Es la identidad del halterofilo |
| **PRIMARIA** | **Volumen sesión** (tonelaje = sets × reps × peso) | Calidad del entreno |
| **PRIMARIA** | **Intensidad** (%1RM medio) | Define la fase del mesociclo |
| **SECUNDARIA** | Squats (Back/Front) | Base de fuerza para olímpicos |
| **SECUNDARIA** | Ratios fuerza (Sn/CJ, Sq/CJ) | Detecta desequilibrios |
| **SECUNDARIA** | Adherencia macrociclo | Disciplina |
| **WELLNESS** | HRV, sueño, fatiga (CTL/ATL) | Readiness y burnout |

### Volta · CrossFit (atleta)

| Tier | Métrica | Por qué importa |
|---|---|---|
| **PRIMARIA** | **Tiempo/Rounds del WOD** (RX vs Scaled) | Resultado de cada sesión |
| **PRIMARIA** | **Benchmarks** (Fran, Helen, Grace, Murph) | Comparación universal |
| **PRIMARIA** | **Volumen semanal** (tonelaje + WODs/sem) | Carga acumulada |
| **SECUNDARIA** | Skills (pull-ups, MU, HSPU, DU) | Progresión técnica |
| **SECUNDARIA** | Distribución tipo (Cardio/Strength/Gym/Mixed) | Balance del programa |
| **SECUNDARIA** | Adherencia WODs/semana | Consistencia |
| **WELLNESS** | HRV, sueño, V-Form, cafeína | Readiness diaria + WOD auto-modificado |

### Cross-cutting (ambos)

- Racha de días consecutivos
- Baseline / Tests de referencia (1RM máx, VO2max, gimnasia, etc.)
- Pildoras educativas
- Compartir logros (viral)
- Pago / tier PRO

---

## 2. Estado actual (auditoría honesta)

### Construido ✅
- **Frontend**
  - SocialCard: 3 variantes × 14 celebraciones × 5 charts + selector + hide + PNG export 9:16
  - BaselineAssessment: 28 tests × 6 cats × 4 tiers personalización + persistencia local
  - VoltaStats: hero tonelaje + sparkline 14d + ring adherencia + heatmap + distribución + benchmarks list
  - VoltaDashboard: prompts para Baseline y Volumen con alert si baja >15%
- **Backend** (local, no en Render)
  - `/v1/auth/register` persiste en Postgres o cae a MOCK
  - `/v1/baseline/results` GET/POST/DELETE
  - `/v1/social/screenshots` POST
  - `/v1/payments/intents` POST/GET con código único + planes + datos bancarios
  - `/v1/payments/intents/{code}/verify` para watcher de email
  - Migración `000_init.sql` idempotente (users, baseline, social, payments)
- **Infra**
  - `render.yaml` actualizado, `OPS_RENDER.md` con runbook

### Falta — por categoría

| Categoría | Item | Sport | Bloqueante |
|---|---|---|---|
| **Auth real** | Register/Login UI → backend en vivo | Ambos | Render up |
| **Pago** | Pantalla Plan PRO + transferencia + estado pendiente | Ambos | Render up |
| **Pago** | Watcher email IMAP → parser bancario | Ambos | Credenciales + emails muestra |
| **HO atleta** | 1RM tracking + auto-PR detection in-session | HO | Sin bloqueo |
| **HO atleta** | HoStats (volumen + intensidad + mesociclo) | HO | Sin bloqueo |
| **HO atleta** | Radar de fuerza (Sn/CJ/Squat ratios) | HO | Sin bloqueo |
| **VOL atleta** | WOD result log (post-WOD: time/rounds/RX) | VOL | Sin bloqueo |
| **VOL atleta** | Radar 5 dim (Str/Eng/Gym/Bench/Cons) | VOL | Sin bloqueo |
| **Wellness** | Push notifications contextuales (HRV bajo, racha, PR) | Ambos | Service Worker + permisos |
| **Coach HO** | Tarjetas viral del coach (atleta del mes, club PRs) | HO | Sin bloqueo |
| **Coach VOL** | Compartir estado del box, WOD del día | VOL | Sin bloqueo |
| **Viral auto** | Auto-trigger SOCIAL post-PR / post-WOD / milestone | Ambos | Sin bloqueo |
| **WISE LLM** | Reemplazar pattern matching local por Gemini real | Ambos | API key |

---

## 3. Orden propuesto (por dependencia, NO por entusiasmo)

### Bloque A · Operatividad (la app funciona como producto)
**Sin esto, no hay nada que vender.**

1. **Render up + auth real** (espera tu acción en dashboard)
2. **Frontend conectado a backend real** (register, login, baseline, social tracking)
3. **Pantalla Plan PRO + flujo de transferencia** (frontend para el endpoint ya construido)
4. **Watcher email + activación auto** (cuando me pases credenciales + 2-3 emails muestra)

→ Al cerrar A: alguien puede registrarse, pagar, activarse y usar la app contra DB real.

### Bloque B · Métricas primarias por deporte
**Las pantallas que el atleta abre todos los días.**

5. **HO atleta · HoStats** análogo a VoltaStats:
   - Hero: tonelaje semanal + intensidad media (%1RM)
   - Sparkline 14d volumen
   - Zona principal de la semana (Liviano/Técnico/Fuerza/Máximo)
   - Distribución intensidad
   - Mesociclo: semana X/Y + fase + adherencia al plan
   - 1RM list por ejercicio
6. **HO atleta · 1RM tracking + auto-PR** durante ActiveSession:
   - Al loggear set, comparar contra `users.maxes` o `baseline_results`
   - Si supera → trigger celebration → SocialCard auto-abre con `pr_clean`/`pr_snatch`
7. **VOL atleta · WOD result log** post-WOD:
   - Pantalla post-WoD con campos: tiempo, rounds, reps extra, escala (RX/Scaled/RX+), notas
   - Trigger SocialCard auto si es PR de benchmark
8. **VOL atleta · Radar habilidades** 5 dim (en VoltaStats nueva tab "Perfil")

→ Al cerrar B: HO y VOL tienen sus pantallas core. Atleta entiende su progreso.

### Bloque C · Loop viral activado
**Convertir momentos en shares automáticos.**

9. **Auto-trigger SOCIAL** post-PR, post-WOD, milestone (7/30/100 días)
10. **PreWOD share** (VOL): botón share + tarjeta 9:16 con HRV+VForm+WOD modificado
11. **Belt ceremony** (HO): pantalla fullscreen con partículas al subir tier
12. **WISE LLM real** con system prompt viral del spec (frases memorables 140 chars)
13. **Push notifications** programadas (trial reminder) + contextual (PR, racha, HRV bajo)

→ Al cerrar C: cada momento de gloria genera screenshot/share, FOMO en redes.

### Bloque D · Coach + crecimiento
**Herramientas para que el coach genere contenido viral.**

14. Coach HO: "Atleta del mes", "PRs colectivos del club"
15. Coach VOL: "Estado del box hoy", "WOD del día para stories"
16. Motor de referidos universal
17. Leaderboard atleta (VOL: del box, HO: por OLY Index)
18. Comparativa Yo vs Yo (1m / 3m / 6m / 1y)

→ Al cerrar D: viralidad escala via coaches + competencia social.

### Bloque E · Profundidad técnica (futuro)
- Radar de fuerza HO + alertas de desequilibrio
- Heatmap anual 365 días (lo más "Instagrammable" del spec)
- Volumen acumulado vs plan (HO con curva del macrociclo)
- A/B testing entre variantes de SocialCard
- ATL/CTL para atleta avanzado
- Integración wearables (HRV real desde Apple Health / Garmin)
- Stripe / MercadoPago (reemplazar transferencia manual)

---

## 4. Qué ataco YO ahora (sin esperar)

De los bloques de arriba, lo que puedo hacer ya **sin Render up** y **sin tus credenciales bancarias**:

| # | Item | Tiempo | Bloque |
|---|---|---|---|
| 1 | Frontend pantalla **Plan PRO + transferencia + estado pendiente** | 2-3h | A.3 |
| 2 | **HoStats** (análogo a VoltaStats, para halterofilia) | 3h | B.5 |
| 3 | **WOD result log** post-WOD para Volta | 2h | B.7 |
| 4 | **Auto-trigger SocialCard** desde PR / WOD / milestone | 2h | C.9 |
| 5 | **Radar HO** (Snatch/CJ/Squat/Front) con ratios ideales | 3h | E |
| 6 | **Radar VOL** (5 dim) en tab Perfil de VoltaStats | 2h | B.8 |

Total ~14h. Cuando consigamos Render up + credenciales, los items A.2 + A.4 son rápidos (3h cada uno).

---

## 5. Qué necesito de vos (en orden de impacto)

### CRÍTICO
1. **Render dashboard** — pegame los logs del último deploy o confirmá status del servicio `holy-oly-3`. Sin esto no hay register/login/persistencia real.
2. **CBU/Alias** real de la cuenta receptora → puedo dejar las pantallas con datos reales, no placeholders.

### IMPORTANTE
3. **2-3 emails muestra del banco** (forward o pegados en gist) → diseño el parser regex.
4. **Email + app password** de la casilla que recibe los emails del banco → arranco el watcher.
5. **Decisiones de pricing**: ¿$5.990 ARS/mes está bien? ¿Trial 45 días? ¿Plan elite?

### NICE TO HAVE
6. API key de Gemini (o Claude) si querés WISE real este sprint.
7. Acceso a Apple Health / Garmin Connect para wellness real.

---

## 6. Reglas que me impongo a partir de ahora

1. **Una sesión = un bloque del roadmap, no jumping**.
2. **Sport-aware siempre**: si toco una métrica, identifico si es HO/VOL/ambos antes de codear.
3. **No agregar pantallas nuevas sin confirmar que cierran un item de la lista** — si surge una idea fuera del roadmap, va al final como "futuro".
4. **Verificación obligatoria** post-cambio (smoke test + preview).
5. **Resumen tight al final** — no monólogos.

---

**Fecha:** 2026-05-25
**Próximo paso:** decidí qué item del bloque "Qué ataco YO ahora" arranco. Yo recomiendo en este orden: **B.5 (HoStats) → B.7 (WOD result log) → A.3 (Plan PRO) → C.9 (auto-trigger)**.
