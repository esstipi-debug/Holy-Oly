# Volta — Badges y Alertas UI Spec

**Propósito:** Definir dónde, cómo y en qué orden aparecen las alertas de los engines wellness (Caffeine, Sleep, Alcohol, HRV, V-Stress) en la UI de Volta. Diseño coherente con la identidad Volta (CrossFit, Electric Cyan, atleta híbrido explosivo).

**Fecha:** 2026-04-29

---

## Taxonomía de alertas

Volta hereda los engines 25-29 compartidos. Las alertas se clasifican en 4 niveles:

| Nivel | Color | Ícono | Cuándo |
|-------|-------|-------|--------|
| **INFO** | Cyan `#00E5FF` | `ⓘ` | Dato relevante sin impacto en sesión |
| **WARNING** | Amber `#FFB300` | `⚠` | Impacto parcial — sesión degradada |
| **CRITICAL** | Red `#FF3D00` | `🔴` | Bloqueo de alta intensidad activo |
| **POSITIVE** | Green `#00E676` | `✓` | Supercompensación / estado óptimo |

---

## Fuentes de alertas por engine

| Engine | Alertas posibles | Nivel máx |
|--------|-----------------|-----------|
| **HRV/RHR (28)** | Zscore bajo, tendencia declining, supercompensación | CRITICAL |
| **Sleep (26)** | Agudo, crónico, tolerancia cafeína+sueño | CRITICAL |
| **Caffeine (25)** | C_residual alto, enmascaramiento, washout | CRITICAL |
| **Alcohol (29)** | Daño moderado, daño alto, recuperación activa | CRITICAL |
| **V-Stress** | Forma roja (fatiga > fitness), sobrecarga semanal | WARNING |
| **Wise Score** | Sub-índice débil, mejora reciente | INFO / POSITIVE |

---

## Reglas de stacking (múltiples alertas activas)

```javascript
// Prioridad de visualización cuando coexisten alertas
const ALERT_PRIORITY = {
  CRITICAL:  1,
  WARNING:   2,
  INFO:      3,
  POSITIVE:  4,  // Positivos solo si no hay CRITICAL/WARNING activos
};

function stackAlerts(alerts) {
  // 1. Ordenar por prioridad
  const sorted = alerts.sort((a, b) =>
    ALERT_PRIORITY[a.level] - ALERT_PRIORITY[b.level]
  );

  // 2. Máximo 3 alertas visibles en cualquier superficie
  const visible = sorted.slice(0, 3);

  // 3. Si hay 2+ CRITICAL: colapsar en "Múltiples alertas activas"
  const criticals = visible.filter(a => a.level === 'CRITICAL');
  if (criticals.length >= 2) {
    return [{
      level: 'CRITICAL',
      icon: '🔴',
      msg: `${criticals.length} alertas críticas activas`,
      expandable: true,
      alerts: criticals,
    }];
  }

  return visible;
}
```

---

## Superficies de aparición

### 1. Dashboard principal (equivalente B1 en Volta)

**Header strip** — barra de alertas en la parte superior del dashboard.

```
┌─────────────────────────────────────────────┐
│  VOLTA                              [avatar] │
├─────────────────────────────────────────────┤
│  ⚠ HRV bajo   🔴 Sueño crónico   ⓘ Café   │  ← Alert strip
├─────────────────────────────────────────────┤
│                                             │
│   Wise Score        V-Form (forma hoy)      │
│     [72]              🟡 AMARILLO           │
│                                             │
│   Próximo WOD   ────────────────────────    │
│   ...                                       │
└─────────────────────────────────────────────┘
```

**Comportamiento:**
- Tap en un badge → bottom sheet con detalle del engine
- Máximo 3 badges — overflow colapsado en "+N"
- Orden: CRITICAL → WARNING → INFO (izquierda a derecha)
- Badges POSITIVE solo si cero alertas negativas

---

### 2. Pre-WOD check (antes de iniciar sesión)

Pantalla de confirmación antes de arrancar un WOD. Muestra el estado real del atleta.

```
┌─────────────────────────────────────────────┐
│  ← Volver          HOY: AMRAP 20min         │
├─────────────────────────────────────────────┤
│                                             │
│   Estado actual                             │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│   │  HRV     │  │  Sueño   │  │  Forma   │ │
│   │  ⚠ 68   │  │  ✓  82  │  │  🟡 +3   │ │
│   └──────────┘  └──────────┘  └──────────┘ │
│                                             │
│   ⚠ HRV bajo tu baseline — intensidad      │
│   cappada automáticamente a 80% 1RM hoy.   │
│                                             │
│   [  Continuar modificado  ]                │
│   [  Ver detalle           ]                │
│   [  Cancelar sesión       ]                │
└─────────────────────────────────────────────┘
```

**Lógica de botones:**
- CRITICAL activo → "Continuar modificado" (sesión degradada) o "Cancelar"
- WARNING → "Continuar" con badge visible en sesión activa
- INFO → solo informativo, no bloquea

---

### 3. Sesión activa — badge persistente

Durante el WOD, badge pequeño en esquina superior derecha que recuerda el estado.

```
┌─────────────────────────────────────────────┐
│  AMRAP 20min         12:34         [⚠ HRV] │  ← badge persistente
├─────────────────────────────────────────────┤
│                                             │
│   Ronda 4 / 20                             │
│   ...                                       │
└─────────────────────────────────────────────┘
```

---

### 4. Post-WOD / Victory Screen (equivalente B7/B8)

Después de completar el WOD, el summary muestra el impacto de las alertas activas.

```
┌─────────────────────────────────────────────┐
│                                             │
│   ✓ WOD COMPLETADO                         │
│                                             │
│   Wise Score  72 → 73  (+1)                │
│   Rondas: 8   Tiempo: 20:00                 │
│                                             │
│   ┌─────────────────────────────────────┐  │
│   │  ⚠ HRV bajo durante la sesión.     │  │
│   │  Protocolo NSDR recomendado         │  │
│   │  post-sesión (20 min).              │  │
│   │  [Ver protocolo →]                  │  │
│   └─────────────────────────────────────┘  │
│                                             │
│   [  Compartir resultado  ]                 │
└─────────────────────────────────────────────┘
```

---

### 5. Coach view — bandeja de atletas en riesgo

El coach ve en su dashboard los atletas con alertas activas, ordenados por severidad.

```
┌─────────────────────────────────────────────┐
│  COACH             [Equipo: CrossFit Norte] │
├─────────────────────────────────────────────┤
│  Alertas activas                    ver 12  │
│  ┌─────────────────────────────────────┐   │
│  │  🔴 Marco T.   Sueño crónico + HRV  │   │
│  │  ⚠  Carla V.   Alcohol moderado     │   │
│  │  ⚠  Diego S.   V-Stress rojo        │   │
│  └─────────────────────────────────────┘   │
├─────────────────────────────────────────────┤
│  Todos los atletas                          │
│  Marco T.    Wise 78  🔴  [ver →]           │
│  Carla V.    Wise 65  ⚠   [ver →]           │
│  Diego S.    Wise 71  ⚠   [ver →]           │
│  Paula M.    Wise 83  ✓   [ver →]           │
└─────────────────────────────────────────────┘
```

---

### 6. Athlete deep dive — panel wellness

Vista detallada de un atleta (equivalente C4). Panel wellness con los 5 engines activos.

```
┌─────────────────────────────────────────────┐
│  ← Marco T.           Wise Score: 72        │
├─────────────────────────────────────────────┤
│  WELLNESS STATUS                            │
│                                             │
│  HRV      ━━━━━━━━━━━━●──  68  ⚠ -1.7σ    │
│  Sueño    ━━━━━━━━━━━━━━●  85  ✓ OPTIMAL   │
│  Cafeína  ━━━━●──────────  C_res 95mg  ⚠   │
│  Alcohol  ──────────────●  Sin registro     │
│  V-Form   ━━━━━━━━●────── 🟡 +3 AMARILLO   │
│                                             │
│  Alerta activa:                             │
│  HRV bajo baseline 3 días consecutivos.     │
│  Revisar carga del macrociclo.              │
│  [Ajustar macrociclo →]  [Nota privada →]   │
└─────────────────────────────────────────────┘
```

---

### 7. Wise Score breakdown — badges por sub-índice

En la vista Wise Score del atleta, cada sub-índice muestra su estado.

```
┌─────────────────────────────────────────────┐
│                                             │
│         WISE SCORE   72                     │
│         Rx · Hombre · 28 años               │
│                                             │
│   Radar chart (pentagon)                    │
│        Strength ████████░░ 78               │
│        Engine   ██████░░░░ 62  ⚠ débil      │
│        Gymnastics████████░░ 80              │
│        Benchmark ███████░░░ 70              │
│        Consistency████████░ 76              │
│                                             │
│   💡 Engine Score es tu punto débil.        │
│   Incluye más WODs de capacidad larga       │
│   en tu semana.                             │
└─────────────────────────────────────────────┘
```

**Badge por sub-índice:**
- Score ≥ 75 → sin badge
- Score 50-74 → INFO cyan "mejorable"
- Score < 50 → WARNING amber "débil" + sugerencia automática

---

## Diseño visual Volta

### Tokens de color

```css
/* Alert badges — Volta */
--alert-info:     #00E5FF;   /* Electric Cyan */
--alert-warning:  #FFB300;   /* Amber */
--alert-critical: #FF3D00;   /* Red-Orange */
--alert-positive: #00E676;   /* Green */
--alert-bg:       rgba(0, 229, 255, 0.08); /* Cyan ghost bg */
```

### Badge component

```
[ícono] texto corto        → badge inline (header strip, lista)
╔══════════════════════╗   → card expanded (detail bottom sheet)
║  ⚠ HRV bajo          ║
║  Texto explicativo    ║
║  [Acción →]           ║
╚══════════════════════╝
```

### Diferenciación vs Holy Oly

| Aspecto | Holy Oly | Volta |
|---------|----------|-------|
| Color acento | Holy Gold `#FFD700` | Electric Cyan `#00E5FF` |
| Stat estrella badge | IMR score | Wise Score |
| Form indicator | Readiness gauge | V-Form semáforo + Forma numérica |
| Workout context | "Sesión" / "Pieza" | "WOD" / "Metcon" |
| Coach language | "Tonelaje" / "1RM" | "Rondas" / "Rx" |

---

## Notificaciones push

| Trigger | Mensaje | Timing |
|---------|---------|--------|
| HRV Zscore < -1.5 | "Tu HRV está bajo. Sesión de hoy adaptada automáticamente." | Mañana (al despertar) |
| Sleep cascade CRÍTICO | "Déficit de sueño acumulado. WOD de hoy reducido 20%." | Mañana |
| Alcohol daño ALTO | "Recuperación activa. Tu Wise Score no se penalizará si descansas hoy." | Mañana |
| V-Form ROJO | "V-Form en rojo. Técnica o descanso hoy — el sistema lo sabe." | Pre-sesión |
| Wise Score +1 | "Wise Score subió a [N]. [Componente] mejoró esta semana." | Tiempo real |
| HRV supercompensación | "HRV elevado. Ventana de rendimiento abierta — dale duro hoy." | Mañana |

---

## Lógica de no-spam

```javascript
// Máximo 1 notificación push por día por atleta
// Prioridad: CRITICAL > WARNING > POSITIVE > INFO
// Si ya hay una CRITICAL activa, suprimir las demás hasta que se resuelva

function shouldSendPush(athlete, alert) {
  const today = getToday();
  const lastPush = athlete.lastPushAt;

  if (isSameDay(lastPush, today)) return false; // ya recibió una hoy
  if (alert.level === 'INFO' && hasCriticalOrWarning(athlete)) return false;

  return true;
}
```

---

**Generado:** 2026-04-29  
**Aplica a:** Volta (CrossFit) — compartible con Holy Oly y Axon con tokens de color distintos  
**Status:** Spec completa — pendiente wireframe HTML
