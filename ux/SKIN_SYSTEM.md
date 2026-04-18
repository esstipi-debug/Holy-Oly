# 🎨 Holy Oly Skin System

**Fecha:** 2026-04-18
**Estado:** ✅ 7 decisiones cerradas · Pendiente wireframe B16 Skin Store + Engine 23
**Referencia visual:** `assets/references/konami_pes_card_reference.png` (PES/eFootball — NO copiar, solo inspiración layout densa)
**Archivos relacionados:** [[COACH_FLOW_DECISIONS]] · [[../VIRAL_CARD]] · [[../wireframes/B9d_hybrid_card_stitch]]

---

## 🎯 Concepto core

**Skin = capa cosmética digital** que modifica superficies visuales del atleta sin afectar datos, cálculos ni engines.

**Monetización:** ventas limitadas (drops temporales, ediciones numeradas o seasonal pass). Valor percibido por escasez + personalización.

**Inspiración visual:** Konami PES/eFootball player cards — densidad informativa, stats radar, skill tags, player avatar. **Crear aesthetic propio**, no copiar layout (riesgo legal).

---

## 🔀 Diferenciación Tema vs Skin

| Concepto | Qué es | Precio | Disponibilidad |
|---|---|---|---|
| **Tema app** | Paleta completa UI (colores, tipografía, surfaces) | Incluido en Premium | 4 temas siempre disponibles |
| **Skin** | Edición limitada Victory Screen + Viral Card + Avatar | Pago adicional o drop | Temporada, números limitados |

**Separación necesaria.** Tema afecta toda la app. Skin afecta momentos de celebración + compartir.

---

## 🎮 Mecánicas de escasez — 4 opciones

### Opción 1 — Drops temporales (modelo Fortnite)
- Skin disponible 14 días/mes.
- Desaparece después, irrecuperable.
- Pro: FOMO fuerte. Con: frustración atletas nuevos.

### Opción 2 — Ediciones numeradas (NFT sin blockchain)
- 500 unidades máximo.
- Número #347/500 visible en carta.
- Pro: coleccionable real. Con: complejidad técnica, tracking inventario.

### Opción 3 — Seasonal pass (modelo Battle Pass)
- 4 temporadas/año (3 meses c/u).
- Skin exclusiva por temporada, luego archivada.
- Pro: retención sostenida. Con: requiere content pipeline constante.

### Opción 4 — Hitos + drops (HÍBRIDO RECOMENDADO)
- Skins básicas: unlock gratis por hito (1er PR, 1er macro completo).
- Skins premium: ediciones limitadas pagas.
- Pro: engagement free + monetización paga. Con: más sistemas.

---

## 💰 Modelo precio propuesto

| Tipo | Precio USD | Ejemplo | Mecánica |
|---|---|---|---|
| **Hito unlock** | Gratis | "First Blood" (1er PR) | Gamificación |
| **Seasonal drop** | $4.99 | "Verano Chile 2026" | 3 meses disponible |
| **Edición limitada** | $9.99 | "Olympic Tokyo Memorial" | 500 unidades únicas |
| **Colaboración oficial** | $14.99 | "World Championship IWF" | Licenciado, escasez alta |

**Benchmark conversión skins mercado gaming:** 3-8% usuarios compran.

**Proyección conservadora (1.000 atletas activos):**
- 30-80 compradores/mes
- ARPU skin: $5-10
- Ingreso extra: $150-800 USD/mes

Monetización modesta hasta escala 5k+ usuarios.

---

## 📐 Superficies afectadas por Skin

### 1. Victory Screen post-sesión
- Fondo + paleta
- Iconografía
- Animación entrada
- SFX opcional

### 2. Viral Card (B9 ecosystem)
- Marco + textura + efectos
- Avatar pixel art con skin
- Badge "Edición 2026" visible
- Layout estructural NO cambia (mantiene B9d como base)

### 3. Avatar atleta en perfil
- Ropa, malla, accesorios pixel art
- Opcional: equipo competición

### 4. Badge en dashboard
- Indicador discreto "skin activa"

**NO afecta:**
- Radar stats
- Cálculos Banister / IMR / Golden Ratio
- Flujos funcionales coach/atleta
- UI admin coach

---

## 🏆 Sistema rareza dentro de skin

Cada skin tiene **3 variantes visuales** según performance de la sesión:

| Variante | Desbloqueo | Visual |
|---|---|---|
| **Plata** | Sesión completada con skin activa | Base skin, colores sobrios |
| **Oro** | IMR top + sin fallos técnicos | Versión dorada, glow leve |
| **Holográfica** | PR roto con skin activa | Animación holográfica, máxima rareza |

Misma skin, tres versiones. **Multiplica shareability** sin multiplicar assets.

---

## 🎨 Anatomía Holy Oly Card (layout propio)

Inspirado en PES pero reorganizado para evitar copyright:

```
┌─────────────────────────────────────────────────────┐
│ [AVATAR PIXEL]  [PAÍS] [GYM LOGO]                  │
│                                                     │
│                    ┌─────────┐   ┌──────────┐     │
│   A. CHEN          │  IMR    │   │ SKILLS    │    │
│   Lv 1/19          │   87    │   │ • Snatch  │    │
│                    │ (stat   │   │ • C&J     │    │
│   STATS PANEL:     │  estrella)   │ • Hook    │    │
│   • PWR 90         └─────────┘   └──────────┘    │
│   • TEC 90                                         │
│   • STA 95                                         │
│   • SPD 78              [HEXAGON RADAR]          │
│   • STR 90               PWR/TEC/STA              │
│   • BAL 90               SPD/STR/BAL              │
│                                                     │
│   POWER & TEC    PHYS & FORM    STR & END         │
│   [grid stats    [grid stats    [grid stats       │
│    0-99]          0-99]          0-99]             │
│                                                     │
│   EDICIÓN: Holy Oly Card · Temporada 2026-I       │
│   #347 / 500                                       │
└─────────────────────────────────────────────────────┘
```

**Diferencias vs PES (anti-licensing):**
- Stat estrella: **IMR** (Iron Brain) en lugar de "SNATCH 96"
- Métricas calculadas por Iron Brain, no arbitrarias
- Skills = logros reales (Hook Grip verificado, Snatch Tech calibrado)
- Typography Space Grotesk + Inter (no Konami font)
- Paleta Obsidian Kinetic con acentos Electric Green / Holy Gold / Holy Cyan
- Pixel art avatar 16-bits (consistente con Victory Screen)

---

## 📊 Stats y cálculos Iron Brain → Card

| Stat card | Fuente engine | Fórmula simplificada |
|---|---|---|
| **IMR** (estrella) | Engine 22 IMR | Intensity Maintenance Ratio de la sesión |
| **PWR (Power)** | Velocidad barra Snatch/C&J | m/s en triple extensión |
| **TEC (Technique)** | Fallos técnicos / sesión | 100 - (% failed reps) |
| **STA (Stamina)** | Volumen sostenido | Tonelaje vs programado |
| **SPD (Speed)** | Cadence sesión | Tiempo entre intentos |
| **STR (Strength)** | % 1RM promedio sesión | Load relative to max |
| **BAL (Balance)** | Golden Ratio proporción | Snatch/C&J ratio óptimo 0.80 |

**Reusa engines existentes.** No inventa nuevos.

---

## 🎁 Catálogo inicial propuesto (día 1)

**3 skins base lanzamiento:**

1. **"Obsidian Classic"** (free, default)
   - Paleta Obsidian Kinetic pura
   - Siempre disponible
   - Sin número edición

2. **"Andes Electric"** (seasonal drop Q2-2026, $4.99)
   - Homenaje Chile + Andes
   - Colores: negro + turquesa + oro cobrizo
   - 3 meses disponible, luego archivada

3. **"Olympic Legacy"** (edición limitada, $9.99)
   - Homenaje Olimpiadas 2028 LA
   - 500 unidades numeradas globalmente
   - Una vez vendidas, no regresa

---

## 🔴 Contradicciones con decisiones previas

### Conflicto 1: B9d "Definitiva" Viral Card
- **Memoria #91:** B9d ya shippeada como versión definitiva.
- **Resolución propuesta:** B9d se convierte en **base neutral** sobre la cual se aplican skins. No se invalida, se enriquece.

### Conflicto 2: 4 temas premium ya decididos
- **Memoria #54, #56:** 4 temas premium en Theme Engine 18.
- **Resolución propuesta:** **Separación de capas.**
  - Theme = paleta app completa (4 disponibles, incluidos Premium).
  - Skin = edición limitada Victory + Viral Card (pago extra).

### Conflicto 3: Scope producto terminado
- **Decisión estratégica:** No MVP, producto terminado antes de lanzar.
- **Riesgo:** sistema skin completo = +4 semanas desarrollo mínimo.
- **Mitigación:** lanzar con 3 skins base, agregar temporadas post-launch.

---

## 🛠️ Impacto técnico

### Nuevos engines/servicios requeridos

- **Skin Engine (nuevo — 23):** gestión catálogo, propiedad, aplicación runtime.
- **Inventory Service:** tracking ediciones numeradas, stock, sold-out.
- **Drop Scheduler:** cron para activar/desactivar seasonal drops.
- **Skin Asset Pipeline:** versiones Plata/Oro/Holo por skin × N skins = activos por generar.

### Nueva pantalla requerida

- **B16 — Skin Store** (no existe wireframe).
  - Catálogo disponible
  - Detalle skin + preview live en Victory Screen
  - Compra + confirmación
  - "Mi colección" (skins adquiridas + edición)

### Billing

- Flow/Lemon Squeezy debe soportar microtransacciones one-time (no solo suscripción).
- Validar: ¿soportan esto ambos? Confirmar antes de diseñar.

---

## 📋 Decisiones cerradas (7/7) ✅

| # | Pregunta | Decisión final (2026-04-18) |
|---|---|---|
| 1 | Tema vs Skin | **B — Separar capas.** Theme = paleta app (4 temas Premium). Skin = edición limitada Victory+Viral+Avatar |
| 2 | Mecánica escasez | **Opción 4 — Hitos + drops híbrido.** Gratis por hito + seasonal drops pagos + ediciones limitadas numeradas |
| 3 | Precio drop | **Tres tiers.** Seasonal $4.99 · Edición limitada $9.99 · Colaboración oficial $14.99 |
| 4 | Alcance skin | **4 superficies aprobadas.** Victory Screen + Viral Card + Avatar perfil + Badge dashboard |
| 5 | Rareza 3 variantes | **APROBADO.** Plata (completar) · Oro (IMR top + sin fallos) · Holográfica (PR roto con skin activa) |
| 6 | Timing lanzamiento | **Día 1 con 3 skins base.** Temporadas adicionales post-launch |
| 7 | Catálogo inicial | **3 skins día 1:** Obsidian Classic (free) · Andes Electric ($4.99 seasonal) · Olympic Legacy ($9.99 edición 500 numeradas) |

---

## 🚨 Riesgos y mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Licensing Konami si layout copiado | Alta | Fatal | Aesthetic propio, no calcar PES |
| Scope explota (10 productos en 1) | Alta | Alto | Fase 1 solo digital + 3 skins |
| Inflación rareza (todos tienen Holo) | Media | Medio | Reglas estrictas: solo PR verificado = Holo |
| Asset pipeline sin ilustrador | Media | Alto | Contratar freelance o usar sistema procedural |
| Conversión <3% vs benchmark | Media | Medio | Validar con piloto 10 atletas antes de escalar |
| Microtransacciones no soportadas por Flow | Baja | Alto | Confirmar API Flow + Lemon antes de diseñar |

---

## 📝 Notas estratégicas del founder

**Monetización multi-stream evaluada (del prompt original):**

| Stream | Decisión | Razón |
|---|---|---|
| Paywall estético Premium B2C | ✅ APROBADO | Coherente con suscripción Premium |
| Skins microtransacciones | ✅ APROBADO (este doc) | Ventas limitadas digitales |
| Marca blanca clubes B2B | ❌ POSPUESTO | TAM Chile insuficiente, validar con 3 gyms antes |
| Impresión física metal | ❌ RECHAZADO | Logística mata, margen bajo, scope brutal |
| Sponsorships ad-tech | ❌ POSPUESTO | Necesita 5k+ usuarios + equipo ventas |

---

**Última actualización:** 2026-04-18
**Autor:** Claude Code session con Stipi
**Próximos pasos confirmados:**
1. Crear wireframe **B16 Skin Store** (catálogo + detalle + compra + "Mi colección")
2. Especificar **Engine 23 Skin Engine** (gestión catálogo, inventory ediciones numeradas, drop scheduler)
3. Confirmar soporte microtransacciones one-time en Flow + Lemon Squeezy
4. Brief ilustración assets: avatar pixel art + marcos + animación holográfica × 3 skins
5. Integrar skin system al flujo B7/B8 Victory Screen + B9d Viral Card existentes
