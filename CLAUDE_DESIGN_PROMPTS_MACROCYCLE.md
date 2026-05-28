# Claude Design · Prompts Macrociclo

> **Contexto compartido** (pegar al inicio de cada prompt en Claude Design):
>
> **Producto:** PeakQual · 3 verticales (Holy Oly halterofilia · Volta CrossFit · Axon HYROX futuro)
> **Lema:** "Smart Training Zero Burnout"
> **Misión:** Ganar conciencia de salud al entrenar · IA explica · cuando se equivoca acompaña ("Control de Daños")
> **Visual style:** FIFA Modo Leyenda + Bento grid + Tactical HUD · NO glassmorphism · NO neumorfismo
> **Progresión Holy Oly:** Discos halterofilia (Verde 10kg · Amarillo 15kg · Azul 20kg · Rojo 25kg) · NO cinturones
> **Tema:** Dark mode default · acentos neón (verde lima, azul eléctrico, rojo alerta)
> **Tipografía:** Sans condensada display (Inter/Manrope) · números tabular monospace
> **Stack output:** React 19 + TypeScript + Tailwind 4 + componentes shadcn/ui · CSS variables del tokens v2
> **Mobile-first:** iOS safe-area top/bottom · bottom-nav 76px · CTAs respetan safe-area
> **Tono copy:** Coach que respeta · datos crudos sin paternalismo · español neutro

---

## 1 · Volta · Macrociclo Atleta (vista calendario + bloque actual)

```
Diseña una pantalla mobile-first para un atleta CrossFit (Volta) que muestra su
MACROCICLO DE 12 SEMANAS activo · contexto: chileno entrenando temporada 2026.

ESTRUCTURA EN 4 ZONAS VERTICALES (scroll natural):

ZONA A · HEADER COMPACTO (sticky top, 88px alto)
- Avatar atleta circular 40px + nombre + nivel (RX / Scaled / Intermediate)
- Tag bloque actual: "BLOQUE 3 / 6 · CAPACIDAD AERÓBICA" (badge color amarillo neón)
- Progreso macrociclo: barra horizontal segmentada en 12 (semanas) · semanas pasadas verde · actual pulsando · futuras gris
- Botón discreto top-right: "Ver plan completo" (drawer)

ZONA B · CARD BLOQUE ACTUAL (hero, ~320px alto, FIFA card style)
- Fondo dark con gradiente diagonal sutil
- Top: nombre bloque grande "CAPACIDAD AERÓBICA · S3"
- Centro: 3 KPIs en grid (tactical HUD):
  · Volumen semanal · "247 min" + delta vs S2
  · Intensidad promedio · "RPE 6.8" + flecha
  · Adherencia · "6/7 sesiones" + ring progress
- Footer card: próxima sesión "Mañana · 18:00 · MetCon 22min · Fran-style"
  + CTA primario "Ver detalle WOD" (verde lima neón)

ZONA C · CALENDARIO 6 BLOQUES (timeline horizontal scroll)
- Cada bloque = card vertical 140x180 con:
  · Número bloque circular grande
  · Nombre corto ("FUERZA BASE", "POTENCIA", "AERÓBICO", "ESPECIALIZACIÓN", "COMPETITIVO", "DELOAD")
  · Semanas asignadas (S1-S2, S3-S4, etc.)
  · Estado visual: ✓ completado · ▶ actual (glow) · ◌ futuro
- Bloque actual con borde animado tactical HUD

ZONA D · DOMINIOS CUBIERTOS (bento 2x4 abajo)
- 7 dominios CrossFit: Aerobic Cap · Strength · Gymnastics · Olympic Lift · Stamina · Power · Mobility
- Cada celda: ícono + % cubierto este macrociclo + mini sparkline 12 semanas
- Celda "weakest" destacada con borde rojo sutil + tooltip "Foco recomendado"

INTERACCIONES:
- Tap bloque del timeline → expande detalle inline (acordeón)
- Long-press card hero → modal "Solicitar ajuste a coach"
- Pull-to-refresh: re-fetch progreso semana

ESTADOS:
- Loading: skeleton tactical (líneas neón sutiles)
- Empty (sin macrociclo asignado): ilustración + "Tu coach aún no asigna macrociclo · contactar"
- Error: toast bottom + retry inline

ACCESIBILIDAD:
- Contraste AA min en todos los textos sobre fondos oscuros
- Iconos con aria-label
- Timeline navegable por teclado (left/right arrows)
- Reduce-motion: desactivar glow/pulso

OUTPUT:
- JSX completo en un archivo `VoltaMacrocycleAthlete.tsx`
- Comentarios de implementación donde se consume API (`GET /v1/volta/macrocycle/me`)
- CSS-in-tailwind · usar variables --color-neon-lime, --color-tactical-amber del design system v2
- Mock data inline al final como `mockMacrocycle` para preview

REFERENCIAS VISUALES:
- FIFA 24 Modo Carrera (cards jugador con stats)
- Garmin Connect (training load semanal)
- Apple Fitness+ (timeline programa)
- CS2 HUD (barras tactical, números monospace)
```

---

## 2 · Holy Oly · Macrociclo Atleta (vista bloques halterofilia + RPE)

```
Diseña una pantalla mobile-first para un atleta de HALTEROFILIA OLÍMPICA
(Holy Oly) que muestra su MACROCICLO PERIODIZADO con foco en Sn/CnJ.

CONTEXTO ESPECÍFICO HOLY OLY:
- Levantamientos primarios: Snatch (Sn), Clean & Jerk (C&J), Front Squat (FS), Back Squat (BS)
- Sistema progresión por DISCOS de color (NO cinturones):
  Verde 10kg · Amarillo 15kg · Azul 20kg · Rojo 25kg
- Bloques típicos: Volumen → Intensidad → Tapering → Test PR

ESTRUCTURA EN 5 ZONAS:

ZONA A · HEADER ATLETA (sticky, 96px)
- Avatar + nombre
- DiscoBadge actual (componente PlateBadge existente) mostrando disco color + kg dominados
- Macrociclo activo: "PEAKING SNATCH · S5 de 8" (badge azul eléctrico)
- Coach asignado + chat ícono

ZONA B · DUAL HERO CARDS (lado a lado, 50/50)
Card izq · SNATCH:
- Plate3D visual stack mostrando 1RM actual ej: "92 kg" (suma de discos)
- Delta vs inicio macrociclo: "+4 kg" (verde) o "-2 kg" (rojo)
- Mini gráfico líneas últimos 8 sesiones
- RPE promedio último entreno: "8.2"

Card der · CLEAN & JERK:
- Misma estructura, 1RM "115 kg"
- Delta y trend
- RPE prom

ZONA C · TIMELINE BLOQUES (vertical, no horizontal — halterofilia es más lineal)
4-5 bloques apilados verticales con:
- Bloque card 100% width, 88px alto
- Izq: número bloque grande + nombre ("VOLUMEN GENERAL", "INTENSIDAD", "TAPERING", "PEAK TEST")
- Centro: rangos % 1RM trabajados ("70-80%" · "85-92%" · "60-70%" · "95-105%")
- Der: estado (✓ done · ▶ actual · ◌ futuro) + semanas
- Bloque actual con borde glow azul eléctrico + chevron expandible
- Tap expande: lista sesiones de la semana actual con peso prescrito + RPE objetivo

ZONA D · CARGA SEMANAL (gráfico)
- Bar chart vertical 7 días (lun-dom)
- Cada barra dividida: Sn (azul) · C&J (rojo) · Accesorios (gris)
- Tonelaje total semana abajo: "12.840 kg"
- ACWR indicator: ring 0-2 · zona verde 0.8-1.3 · amarilla 1.3-1.5 · roja >1.5
- Si ACWR > 1.3: alerta suave "Carga alta · considera deload"

ZONA E · CONTROL DE DAÑOS (collapsible, solo si aplica)
- Solo visible si hubo session skip/ajuste auto por CNS/sueño
- Tono empático: "Esta semana ajustamos -10% volumen por sueño bajo · todo bien"
- Sin culpa · ofrece "Ver explicación detallada IA" → modal con razonamiento

INTERACCIONES:
- Tap card Sn o C&J → drawer histórico PRs últimos 12m
- Tap bloque timeline → expande sesiones semana
- Pull-to-refresh: re-fetch progreso
- Long press disco header → modal "Cómo subir de disco"

ESTADOS ESPECIALES:
- Atleta nuevo sin 1RM: cards muestran "Test inicial pendiente · agendar"
- Macrociclo completado: confetti sutil + CTA "Solicitar nuevo bloque a coach"
- Lesión flag activa: banner top rojo "Modo recuperación · macrociclo pausado"

ACCESIBILIDAD:
- Plate3D con aria-label describiendo composición ("92kg: 2 discos rojos + 1 azul + 1 amarillo + 1 verde")
- Gráficos con tabla equivalente accesible (sr-only)
- Color NO único portador de info (íconos + texto en todos los estados)

OUTPUT:
- JSX completo en `HolyOlyMacrocycleAthlete.tsx`
- Reutiliza componentes existentes: <PlateBadge />, <Plate3D />, <PlateStack />
- API endpoint comentado: `GET /v1/holyoly/macrocycle/me`
- Mock data inline `mockHolyOlyMacrocycle`
- CSS-in-tailwind con tokens v2 (--color-disc-red, --color-disc-blue, etc.)

TONO COPY (ejemplos):
- ✅ "Subiste 4kg en Snatch este bloque"
- ✅ "Carga semanal alta · revisa con tu coach"
- ❌ "¡WOW INCREÍBLE PR!" (evitar exclamaciones)
- ❌ "No descansaste lo suficiente, debes mejorar" (evitar paternalismo)

REFERENCIAS VISUALES:
- FIFA Ultimate Team (dual card comparativa)
- WHOOP app (carga semanal + ACWR)
- Hookgrip Olympic Weightlifting tracker (foco Sn/C&J)
- Tactical HUD militar (timeline vertical bloques)
```

---

## Notas para Boss

- Estos 2 prompts son **autocontenidos**: pegar tal cual en Claude Design (con el contexto compartido del header).
- Output esperado: 1 archivo `.tsx` por prompt · listos para portar a `frontend/src/pages/v2/`.
- Después de iterar visualmente en Claude Design, mover a worktree y conectar al endpoint real.
- Los 12 prompts restantes los entrego en archivo aparte tras filtrar necesidad real (algunos del listado original ya están parcialmente en código).
