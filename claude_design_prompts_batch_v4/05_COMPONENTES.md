# Batch v4 · Bloque 5 · Componentes y Modals (4 prompts)

> Componentes reutilizables · NO pantallas fullscreen.

---

### Prompt 40 · Alert Detail · BOTTOM SHEET DRAWER

```
Diseña ALERT DETAIL DRAWER (bottom sheet · NO pantalla fullscreen)
mobile-first para mostrar detalle de alerta cuando atleta tappa
una alerta en su feed.

CONTEXTO: alertas = triggers YELLOW/RED del sistema (CNS bajo · ACWR alto ·
sueño bajo · soreness localizado · etc.).

ESTRUCTURA DRAWER:
- Bottom sheet 75% viewport height
- Drag handle top · gesture swipe down close
- Backdrop tap-close

CONTENIDO:

ZONA A · SEVERITY HEADER
- Badge top (YELLOW pulse o RED solid)
- Título: "Carga aguda alta · ACWR 1.42"
- Sub: timestamp + "Detectado por Antigravity"

ZONA B · EXPLICACIÓN MISIÓN-CRITICAL (4 cards)

Card 1 · "Qué pasó"
- 2-3 líneas factual + tono coach
- Datos crudos

Card 2 · "Por qué importa"
- Explicación científica accesible
- Sin tecnicismos innecesarios

Card 3 · "Qué hacemos"
- Acción auto del sistema (deload · skip session · etc.)
- Lista bullet steps

Card 4 · "Cuándo vuelve a normal"
- Estimación con condiciones cumplibles
- "Si dormís >6h por 3 noches consecutivas"

ZONA C · MÉTRICAS RELACIONADAS (mini grid 2x2)
- Métrica afectada actual + ring
- Histórico 7 días sparkline
- Threshold zonas (verde/amarillo/rojo)
- Acción recomendada chip

ZONA D · ACCIONES BOTTOM
- CTA primario "Entendí, seguir plan ajustado" (cierra drawer)
- CTA secundario "Hablar con coach" (abre chat)
- Link discreto "Reportar falso positivo"

ESTADOS:
- Alerta resuelta: badge verde + timestamp resolución
- Alerta en curso: animación sutil pulse en severity

OUTPUT:
- AlertDetailDrawer.tsx (componente NO pantalla)
- Props: { alert: Alert, onClose, onActionClick }
- Tailwind + framer-motion para drawer animation
- Mock inline `mockAlert`
- Trigger desde cualquier pantalla con `<AlertDetailDrawer open={...} alert={...} />`
```

---

### Prompt 41 · Notification Center

```
Diseña NOTIFICATION CENTER mobile-first · panel persistente con
notificaciones in-app del atleta/coach.

USO: drawer right-side · trigger desde icon bell en header de cualquier pantalla.

ESTRUCTURA DRAWER:
- Right side drawer 90% viewport width
- Slide-in animation
- Backdrop tap close

CONTENIDO:

ZONA A · HEADER DRAWER
- "Notificaciones"
- Tag conteo unread: "12 nuevas"
- Botón "Marcar todas leídas"
- Botón ⚙️ → settings notif

ZONA B · FILTROS CHIPS (sticky)
- Todas · Coach · Sistema · Logros · Alertas

ZONA C · LISTA NOTIFICACIONES (scroll vertical)
- Cada item:
  · Avatar/icon por tipo (coach 👤 · sistema 🤖 · belt 🎖 · alert ⚠️)
  · Title + body 2-line preview
  · Timestamp relativo ("hace 2h")
  · Estado: unread dot · read sutil
  · Tap → acción correspondiente
  · Swipe izq → archive
  · Long-press → opciones (silenciar tipo · ver detalle)

ZONA D · GROUPS POR TIEMPO
- "Hoy" header sticky
- "Ayer"
- "Esta semana"
- "Más antiguas"

ZONA E · EMPTY STATE
- Si no hay: ilustración + "Estás al día · sin notificaciones"

ACCIONES POR TIPO:
- WOD asignado → tap navega al WOD
- Belt up → trigger BeltCeremony
- Alert YELLOW/RED → opens AlertDetailDrawer
- Coach mensaje → opens chat
- Sistema (release notes) → modal info

OUTPUT:
- NotificationCenter.tsx (drawer component)
- Props: { open, onClose, onItemTap }
- API: GET /v1/notifications/me?unread_only=false
- Push integration: subscribe FCM token al mount
```

---

### Prompt 42 · Wearable Sync Card

```
Diseña WEARABLE SYNC CARD mobile-first · componente que muestra
estado de sincronización con wearable + datos HRV.

USO: card en HOME del atleta · expandible · acceso quick a métricas wearable.

ESTRUCTURA CARD:

ZONA A · HEADER COMPACT (40px)
- Icono wearable (Apple Watch / Garmin / Whoop / etc.)
- "Apple Watch · sincronizado hace 2 min"
- Toggle expand

ZONA B · MÉTRICAS HOY (collapsed default)
- HRV current ms + delta vs baseline
- Resting HR · bpm
- Sleep score
- Strain score (si Whoop)

ZONA C · EXPANDED VIEW
- Sparklines 7d c/u metric
- Comparativa con baseline 30d
- Insights IA: "HRV bajo 3 días · CNS sub-óptimo"

ZONA D · CONFIG MINI
- Toggle "Auto-import readiness"
- "Cambiar dispositivo"
- "Sincronizar ahora" botón

ZONA E · ESTADO ERROR
- Si desconectado: banner red + "Reconectar"
- Si stale (>24h sin sync): warning + "Verifica wearable"

OUTPUT:
- WearableSyncCard.tsx (componente)
- Props: { wearable: 'apple'|'garmin'|'whoop'|null }
- API:
  · GET /v1/wearables/me/status
  · POST /v1/wearables/sync (force sync)
```

---

### Prompt 43 · LogWodResult modal

```
Diseña LOG WOD RESULT MODAL mobile-first · modal centered para
atleta loggear manualmente resultado WOD si NO usó ActiveWod en vivo.

USO: trigger desde feed "Te perdiste el WOD del día? Logguealo"

ESTRUCTURA MODAL:
- Tamaño: 90vw x 80vh
- Centered con backdrop
- Close X top-right

CONTENIDO:

ZONA A · HEADER
- "Logguear WOD"
- Sub: "{WOD name · date}"

ZONA B · RESULT INPUT
- Si For Time: time picker minutos:segundos
- Si AMRAP: rounds + reps extra
- Si EMOM: minutos completados
- Si Chipper: tiempo total + status

ZONA C · MODALIDAD
- Toggle: RX · Scaled · Modified
- Si Scaled · texto opcional "Qué escalaste"

ZONA D · CONTEXTO OPCIONAL
- Sentimiento emoji (5)
- Notas privadas

ZONA E · FOTO OPCIONAL
- Upload selfie post-WOD
- Sirve para SocialCard después

ZONA F · CTAs
- "Guardar resultado" primary
- "Cancelar"
- "Guardar Y generar social card" secondary

ESTADOS:
- Loading save: spinner + "Guardando..."
- Success: toast + close + refresh dashboard
- Error: inline retry

OUTPUT:
- LogWodResultModal.tsx
- Props: { wodId, defaultType, open, onClose, onSaved }
- API: POST /v1/volta/wods/{id}/log-manual
```

---

## Notas bloque componentes

- **Estos NO son páginas** · son componentes reutilizables que se invocan desde otras
- Cada uno debe ser **drop-in** · API clara via props
- Mobile-first y respeta safe-area iOS
- **Validar:** integración en pantallas existentes (Home, ActiveWod, etc.)
