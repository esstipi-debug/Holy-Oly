---
tags: [ux, coach, decisions, ronda-2]
type: specification
status: approved-by-founder
updated: 2026-04-18
parent: "[[COACH_FLOW_DECISIONS]]"
---

# 🎯 Coach Flow — Ronda 2 Decisiones

**Fecha cierre:** 2026-04-18
**Modo:** Founder otorga control total. Defaults aplicados según recomendación Claude Code.
**Estado:** ✅ 24/24 decisiones cerradas

---

## 🔍 Bloque 1 — C4 Athlete Deep Dive

| # | Decisión |
|---|---|
| 33 | **5 tabs aprobadas:** Resumen · Performance · Stress · Adherencia · Notas. Tab Lesiones integrado en Resumen (evita fragmentación). |
| 34 | **Notas privadas coach:** invisibles al atleta siempre. Borradas al eliminar cuenta coach. Tags permitidos (`#lesion`, `#tecnica`, `#motivacion`, `#psicologico`). |
| 35 | **Comparar atletas:** scope MVP — 1 atleta a la vez. Feature "comparar 2" en backlog V2. |
| 36 | **Export data:** PDF resumido (1-2 págs) + Excel crudo. Coach exporta con notificación automática al atleta. Atleta siempre puede exportar su propia data (GDPR portabilidad). |
| 37 | **Cambiar macrociclo desde C4:** botón visible con confirmación doble ("¿Estás seguro? Perderás planificación futura"). |
| 38 | **Timeline lesiones:** integrado en tab Resumen como cronología. Alerta automática al coach si dolor reportado >7 días sin resolver. Coach marca "Resuelta" manual. |

---

## 🆕 Bloque 2 — C5/C6 Add Athlete + Assign Macrocycle

| # | Decisión |
|---|---|
| 39 | **Campos obligatorios:** Nombre · Apellido · Email · WhatsApp · Fecha nacimiento · Sexo biológico · Peso corporal · Altura · 1RM Snatch · 1RM C&J. **Opcionales:** Categoría IWF · Años entrenando · Lesiones previas · Foto · Club · País (default Chile). |
| 40 | **Atleta sin 1RM:** Opción E híbrida — coach ingresa 5RM o 3RM, sistema calcula 1RM estimado vía Epley/Brzycki, recalibra al primer test real. Flag "estimado" visible primeras 2 semanas. |
| 41 | **Selector macrociclo:** Opción B — filtro por escuela primero (9 escuelas), luego programas de esa escuela. Tarjetas visuales con preview volumen/intensidad/duración (combina B + D). |
| 42 | **Duración + pausas:** fecha inicio manual → fin auto-calculada. Pausar con motivo (dropdown: lesión/viaje/competencia/otro). Al reanudar continúa donde quedó. Terminar anticipado requiere confirmación doble. |
| 43 | **Preview antes de confirmar:** mostrar duración total + semanas + volumen promedio + intensidad promedio + fases + días/semana + ejercicios principales. Gráfico volumen/intensidad por semana. |
| 44 | **Bulk assignment:** Opción A — bulk siempre disponible con checkbox múltiple. Sistema advierte si atletas del grupo tienen nivel muy dispar (Sinclair spread >30%). |

---

## 🚪 Bloque 3 — D0 Onboarding Coach

| # | Decisión |
|---|---|
| 45 | **6 pasos registro:** 1) Email + password + nombre · 2) RUT/pasaporte + teléfono WhatsApp · 3) Foto perfil (opcional) + país (solo Chile activo) · 4) T&C checkbox con declaración explícita de responsabilidad profesional · 5) Tutorial interactivo 30 seg (agregar primer atleta) · 6) Dashboard con CTA "Agregar primer atleta". |
| 46 | **Email verification:** puede empezar a usar app, pero debe verificar email en 24h o se bloquea creación de atletas (se mantiene solo lectura). |
| 47 | **Trial 45 días:** cuenta desde **primer atleta agregado** (no desde registro). Evita perder trial por coach que se registra y no usa. |
| 48 | **Tutorial onboarding:** interactivo con tooltips guiados + skip permitido en cualquier momento. Video 2 min opcional accesible siempre desde Settings. |

---

## 💳 Bloque 4 — Billing Coach

| # | Decisión |
|---|---|
| 49 | **Flujo día 46 post-trial:** Día 42 banner "3 días para fin de trial. Configurar pago →" · Día 44 email + push · Día 45 modal bloqueante al abrir app · Día 46 bloqueo total (solo lectura, sin nuevos atletas ni ajustes). |
| 50 | **Métodos pago Flow:** tarjeta crédito/débito + WebPay + transferencia bancaria. Recurrente automático. |
| 51 | **Boleta electrónica:** emisión automática vía API SII Chile con RUT registrado. Envío por email al coach. Historial descargable en Settings. |
| 52 | **Cambio mensual → anual:** prorrateo automático (crédito días restantes mes). Mostrar ahorro en $ USD absoluto ("Ahorras $69.60 USD al año"). Descuento 20% como promesa del plan anual. |
| 53 | **Fallo pago:** Retry automático 3 veces (día 1, 3, 7). Email + push cada intento. Día 7 sin éxito → bloqueo hasta pagar. Oferta anual -20% aparece en pantalla bloqueo. |

---

## ⚙️ Bloque 5 — Coach Settings

| # | Decisión |
|---|---|
| 54 | **Configuraciones imprescindibles:** Notificaciones (push on/off + horario silencio nocturno 22:00-08:00 default) · Idioma (solo español V1) · Zona horaria (auto Chile) · Unidades (kg default, opción lb) · Recomendaciones Smart (on/off global + por atleta) · Gestión suscripción · Historial boletas · Contacto soporte · Cerrar sesión · Eliminar cuenta. |
| 55 | **Eliminar cuenta coach:** periodo 30 días para migrar atletas (invitar a otro coach o descargar data). Post 30 días: atletas quedan con histórico read-only en su cuenta + CTA upgrade a Elite directo. Coach pierde acceso total. |
| 56 | **Notificaciones por tipo silenciables:** Atleta riesgo alto · Nuevo PR · Atleta completó sesión · Atleta no reportó · Recomendación Smart pendiente · Billing (pagos/fallos) · Lesión reportada. Cada una toggleable independiente. Riesgo alto + Lesión no pueden silenciarse (crítico). |

---

## 🚨 Ambigüedades originales (de ROLES_VISIBILITY) — resueltas

| # | Tema | Resolución |
|---|---|---|
| A1 | Atleta sin coach vinculado día 1 | Ve dashboard "estéril" (D2) con CTA permanente a vincular coach o pagar Elite directo |
| A2 | Coach ve skin de atleta | Ve versión base (sin skin). Skin personal del atleta, visible solo en su propia UI + Viral Card compartida |
| A3 | Atleta cambia coach | Coach anterior recibe notificación push al desvincular. Pierde acceso C4 inmediato. Conserva histórico de interacciones hasta purge por retention (2 años). |
| A4 | Leaderboard interno equipo | **Mantener eliminado** (C8 Longevity ya eliminado). No agregar nuevo leaderboard. Evita ansiedad comparativa entre atletas del mismo coach. |

---

## 📊 Resumen bloque Coach

- **Ronda 1:** 32 decisiones ✅
- **Ronda 2:** 24 decisiones ✅
- **Ambigüedades cruzadas:** 4 resueltas ✅
- **Total bloque Coach:** **60 decisiones cerradas**

---

## 📋 Acciones consecuentes

### Wireframes pendientes de crear
- **D0.1-D0.6** Onboarding Coach (6 pasos)
- **B16** Skin Store (atleta)
- **C10** Coach Settings
- **C11** Billing / Subscription management
- **C12** Export athlete data (modal)

### Engines pendientes especificar
- **Engine 23** Skin Engine

### Integraciones pendientes validar
- API SII Chile (boleta electrónica automática)
- Flow API recurrente + WebPay
- Lemon Squeezy: confirmar soporte microtransacciones one-time para skins

---

## 🔗 Docs relacionados

- [[COACH_FLOW_DECISIONS]] — Ronda 1 (32 decisiones)
- [[ROLES_VISIBILITY]] — Matriz coach vs atleta
- [[SKIN_SYSTEM]] — Holy Oly Card System
- [[AI_STRATEGY]] — Vector DB + RAG roadmap
- [[../MEMORY]] — Histórico sesiones
- [[../PLAN]] — Roadmap fases

---

**Última actualización:** 2026-04-18
**Responsable:** Claude Code session · founder Stipi otorga control total
**Siguiente bloque:** Atleta (D1, B1, B6, B7, B10-B15) + Flujo Viral
