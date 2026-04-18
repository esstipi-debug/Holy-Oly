# 🎯 Coach Flow — Decisiones UX Afinadas

**Fecha:** 2026-04-18
**Sesión:** Refinamiento UX Coach previo a desarrollo UI alta fidelidad
**Metodología:** Entrevista iterativa — PM crítico, UX senior, founder escéptico, analista negocio
**Estado:** Bloque Coach — Ronda 1 cerrada · Ronda 2 preguntas 33-56 pendientes

---

## 📌 Contexto estratégico

### Cambios de rumbo confirmados

- **No MVP.** Se construye producto terminado.
- **Orden correcto:** UX afinado → UI alta fidelidad → Design system → Backend → Integración.
- **Geografía lanzamiento:** Solo Chile inicial. México/Colombia/Argentina/España/Brasil/Australia pospuestos.
- **Kill criteria:** Atletas/coaches dejan de usarlo porque no aporta valor (sin número específico definido aún).
- **Ventas existentes:** 4 ventas "esperando" + 9 coaches consultados. Ninguno confirmó precio $29 USD.

### Renombramiento crítico

**"IA / Inteligencia Artificial" → "Recomendación Smart / Sistema Smart"**
- Razón: no hay IA real. Engines son determinísticos (reglas + fórmulas Banister).
- Aplicar en: C2 Intervention Modal, C3 Adjustment Hub, documentación, marketing.
- Marketing honesto > overpromise.

### Posicionamiento

> HolyOly funciona como **cuaderno digital del coach**, imprescindible en su día a día.
> Específico halterofilia. Mide parámetros clave para no sobreentrenar. Facilita seguimiento de 30+ atletas. Métricas tiempo real sin esfuerzo. Decisiones diarias informadas.

---

## 🏛️ Modelo de negocio — Decisiones

| # | Tema | Decisión |
|---|---|---|
| M1 | Trial | 45 días gratis para coach + sus atletas |
| M2 | Precio coach | $29 USD/mes (no validado, ajustable) |
| M3 | Moneda | USD único global. Chile cobra equivalente CLP vía Flow |
| M4 | Pago Chile | Lemon Squeezy + Flow |
| M5 | Pago resto del mundo | Pospuesto. Solo Chile por ahora |
| M6 | Coach cancela | 3 días gracia. Luego bloqueo. Oferta anual -20% al cancelar |
| M7 | Atleta sin coach pagando | Acceso restringido. Debe pagar Premium directo |
| M8 | Coach paga + atleta no paga | Atleta queda en acceso restringido, no Elite |
| M9 | Data retention | Máximo 2 años (los últimos). Anteriores se pierden |
| M10 | Upsell retention extra | Comunicado al registro como "mantención histórico + cálculos extras" |
| M11 | Verificación coach | Solo RUT o pasaporte. Sin validar certificado IWF |
| M12 | Responsabilidad legal | Del coach. Obligatorio T&C al registro |

---

## 🎯 C1 — Command Center Coach (Radar)

| # | Tema | Decisión |
|---|---|---|
| C1.1 | Atletas visibles en radar alertas | Solo 3 en pantalla principal |
| C1.2 | Resto pendientes | Aparecen como notificación al coach; nuevos emergen a medida que apaga fuegos |
| C1.3 | Lista completa | Botón pequeño acceso lista completa, paginada 5 por página |
| C1.4 | Búsqueda | Botón búsqueda al inicio. Por nombre + por nivel/grupo |
| C1.5 | Trial status en radar | **NO mostrar.** No afecta rendimiento. Ir a sección billing aparte |
| C1.6 | Actualización readiness | Cada 1 hora (optimizar si posible) |
| C1.7 | Push cambios urgentes | Inmediato atleta→coach (check-in, dolor, lesión) + recálculo Banister background cada hora |
| C1.8 | Atleta sin check-in | Una oportunidad más con fecha pasada. Si aún así no rellena, usar promedio 7 días como fallback + flag "data estimada" |
| C1.9 | Grupos atletas | Auto-clasificación por ratio peso corporal / carga movida (Sinclair simplificado) |

---

## 🤖 C2 — Intervention Modal (Recomendación Smart)

| # | Tema | Decisión |
|---|---|---|
| C2.1 | Etiqueta sugerencia | "Recomendación Smart" (antes "Sugerencia IA") |
| C2.2 | Coach rechaza | Sistema NO aprende (no hay IA). Sigue sugiriendo si persiste el contexto |
| C2.3 | Desactivar recomendaciones | Coach puede apagarlas (setting global) |
| C2.4 | Scope de adaptación | Solo sesión actual. Sesiones futuras del macrociclo NO se modifican |
| C2.5 | Notificación al atleta | Inmediata al aplicar cambio. Incluye explicación contextual |

---

## 🔁 C3 — Adjustment Hub (Bulk)

| # | Tema | Decisión |
|---|---|---|
| C3.1 | Botón "Aprobar todas" | Permitido con undo |
| C3.2 | Undo granularidad | Total, por atleta, por movimiento |
| C3.3 | Trazabilidad | Cada cambio aplicado queda registrado en timeline del atleta |

---

## 🔍 C4 — Athlete Deep Dive 360°

| # | Tema | Decisión |
|---|---|---|
| C4.1 | Rango temporal | Rodillo 7 / 14 / 28 días |
| C4.2 | Reset rodillo | 3 taps reinicia el rodillo |
| C4.3 | Tabs propuestas (pendiente aprobar) | Resumen · Performance · Stress · Adherencia · Notas |

**Pendiente tu respuesta (Ronda 2):**
- Notas coach privadas vs visibles al atleta
- Comparar 2 atletas lado a lado (MVP o después)
- Export PDF/Excel histórico (GDPR)
- Cambiar macrociclo desde C4 directo
- Timeline lesiones reportadas

---

## ➕ C5/C6 — Add Athlete + Assign Macrocycle

| # | Tema | Decisión |
|---|---|---|
| C56.1 | Código atleta | Se genera automático al registrar atleta (formato: anónimo, para analytics + ciclo menstrual privacy) |
| C56.2 | Link invitación | Código pre-llenado en link |
| C56.3 | Canales invitación | WhatsApp + email |
| C56.4 | Atleta existente con otro coach | Solo 1 coach permitido. Pop-up acepta nuevo coach. Botón discreto en perfil atleta para desvincular |
| C56.5 | Cambio macrociclo | Solo coach puede modificarlo |
| C56.6 | Progreso acumulado | Siempre se guarda (sujeto a retention 2 años máx, M9) |

**Pendiente tu respuesta (Ronda 2):**
- Campos mínimos obligatorios (nombre, email, teléfono, fecha nacimiento, sexo, peso, altura, 1RM Snatch, 1RM C&J)
- Qué hacer si atleta no tiene 1RM medido
- Selector macrociclo plano vs filtrado por escuela
- Duración macrociclo: fecha inicio auto-calcula fin, o manual
- Preview macrociclo antes de confirmar
- Asignación bulk (mismo macro a N atletas)

---

## 🏷️ C7/C8/C9 — Coach Tools

| # | Tema | Decisión |
|---|---|---|
| C7 | Pulse Approval | MANTENER si trabaja sistema anaeróbico con máquinas (AirBike). Pendiente confirmar scope |
| C8 | Longevity Leaderboard | **ELIMINAR** |
| C9 | Coach Profile | Privado. Solo sus atletas invitados lo ven. Muestra: cantidad atletas entrenados, años entrenando, macrociclos usados, tasa progreso por grupo (básico/medio/avanzado), competencias asistidas |

---

## 🧭 Empty States propuestos (aprobado)

### Coach día 1 — 0 atletas
```
[Ilustración radar vacío]
"Tu radar está listo."
Agrega tu primer atleta para empezar a ver readiness en tiempo real.
[+ AGREGAR PRIMER ATLETA]
¿Cómo funciona? (link video 2 min)
```

### Coach día normal — 0 alertas críticas
```
Header: "Buenos días, Coach · 45 atletas · Todos bajo control"
Card: "✅ Radar en verde · Ningún atleta en riesgo alto hoy"
Stats: "38 listos para entrenar · 7 en recuperación"
Sección Momentum del Equipo:
  - Mejor ratio semana: Juan (+12%)
  - Racha más larga: María (28 días)
  - PR reciente: Pedro (Snatch 105kg)
[Ver equipo completo →]
```

### Otros empty states pendientes definir:
- Coach sin macrociclos asignados
- Atleta sin check-in ayer (banner recordatorio)
- Búsqueda sin resultados (fuzzy match sugerido)
- Histórico atleta < 7 días data

---

## 📋 Pendientes decisión (Ronda 2 — preguntas 33-56)

### C4 Deep Dive
33. Tabs imprescindibles (propuesta: 5 tabs)
34. Notas coach: privadas o visibles a atleta
35. Comparar atletas lado a lado
36. Export data atleta (GDPR)
37. Cambiar macrociclo desde C4
38. Timeline lesiones reportadas

### C5/C6 Add Athlete
39. Campos mínimos obligatorios
40. Qué hacer si no hay 1RM
41. Selector macrociclo plano vs por escuela
42. Duración macrociclo + pausa
43. Preview antes de confirmar
44. Asignación bulk

### Onboarding Coach D0 (sin wireframe)
45. Pasos registro (6 pasos propuestos)
46. Email verification antes o después
47. Trial desde registro o desde primer atleta
48. Tutorial: interactivo, video, o skip

### Billing Coach (sin wireframe)
49. Flujo día 46 post-trial
50. Métodos pago Flow (crédito/débito/WebPay/transferencia)
51. Boleta electrónica SII Chile
52. Cambio mensual → anual prorrateo
53. Fallo pago: retry + gracia

### Coach Settings (sin wireframe)
54. Configuraciones imprescindibles
55. Eliminar cuenta coach: qué pasa con atletas
56. Notificaciones por tipo silenciables

---

## 🎯 Contradicciones detectadas (resueltas)

1. **Retention data:** "Progreso siempre se guarda + precio sube por data antigua" VS "2 años máximo, antes se pierde"
   → Resolución: **2 años máximo. Upsell futuro sobre mantención histórico extendido.**

2. **Readiness update:** "Cada hora" VS "Actualizaciones inmediatas"
   → Resolución: **Push crítico inmediato + recálculo Banister cada hora.**

3. **IA en documentación:** "Sugerencia IA" explícita en wireframes/prompts VS "no hay IA"
   → Resolución: **Renombrar a "Recomendación Smart" en todo el sistema.**

---

## 🚨 Riesgos abiertos

- Precio $29 USD sin validar con 0 coaches
- Trial 45 días sin mecanismo de captura pago anticipado
- Sin verificación certificación coach = riesgo reputación plataforma
- Retention 2 años puede frustrar atletas veteranos con histórico valioso
- Solo WhatsApp + email para invitación: sin fallback si atleta cambia número
- Smart Recommendations no aprende = mismos falsos positivos repetidos

---

## 📝 Próximos pasos

1. Responder preguntas 33-56 (Ronda 2 bloque coach)
2. Auditar bloque atleta (D1, B1, B6, B7, B10, B11, B12/13, B14, B15)
3. Auditar flujo viral (B9 social card + K-factor)
4. Consolidar en Obsidian vault
5. Una vez UX cerrado: UI alta fidelidad en Stitch
6. Design system tokens
7. Código React

---

**Última actualización:** 2026-04-18
**Autor:** Claude Code session · iteración UX con Stipi
**Archivo relacionado:** `../MEMORY.md`, `../PLAN.md`, `../wireframes/index.html`
