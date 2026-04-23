# HolyOly - Pendientes y Roadmap

> Última actualización: 2026-04-23

---

## ✅ Completado

| Item | Estado | Fecha |
|------|--------|-------|
| Wireframes 27+ | ✅ | 2026-04-22 |
| C1 toggle (Hoy/Semana/28d) | ✅ | 2026-04-23 |
| B10 toggle semana | ✅ | 2026-04-23 |
| C6b Edit Macrocycle | ✅ | 2026-04-23 |
| DB Schema lifestyle | ✅ | 2026-04-23 |
| Engines reorganizados (4 grupos) | ✅ | 2026-04-22 |

---

## 🔴 Pendientes

### Alta Prioridad

| # | Item | Descripción |
|---|------|------------|
| 1 | Cafeína Engine | Implementar 4 módulos (filtro, multiplicador, castigo, alerta) |
| 2 | Sueño Engine | Cascada de alertas (agudo, crónico, tolerancia) |
| 3 | Wearable sync | Integrar Apple Health / Google Fit |
| 4 | HRV/RHR tracking | Métricas desde wearable |

### Media Prioridad

| # | Item | Descripción |
|---|------|------------|
| 5 | B10c standalone | Vista vida independiente |
| 6 | Calendar global | Vista club completa |
| 7 | Index actualizar | Agregar B10c si se crea |
| 8 | RAG ingest | Engines + exercises + macros |

### Baja Prioridad

| # | Item | Descripción |
|---|------|------------|
| 9 | Export reports | Feature fase 2 |
| 10 | Multi-coach | Fase 2+ |

---

## 📋 Cafeína Engine - Especificación

### 4 Módulos Definidos

```python
# Módulo 1: Filtro de Intensidad
THRESHOLD_1RM = 0.55  # 55% de 1RM
if lifted_pct >= THRESHOLD_1RM:
    calculate_caffeine_impact()

# Módulo 2: MultiplicadorEstrés Oculto
if dose_mg > 200 and time_since_consume < 2:
    rpe_corrected = rpe_reported * 1.2  # +20% stress

# Módulo 3: Castigo Readiness
C_residual = dose * (0.5 ** (t_hours / 6))
if C_residual > 40:
    readiness = min(readiness, 75)

# Módulo 4: Alerta Crónica
if caffeine_streak > 5 and sleep_debt_7d > 4:
    alert("SNC en riesgo")
```

### Métricas Usadas

| Métrica | Función |
|--------|--------|
| Dose mg | Dosis ingerida |
| T_consume | Hora consumo |
| T_bed | Hora dormir |
| C_residual | Cafeína circulante |
| RPE | Percepción esfuerzo |
| ACWR | Ratio carga |
| HRV | Variabilidad cardíaca |
| RHR | FC reposo |
| Sleep_debt_7d | Deuda sueño 7 días |
| Racha | Días consecutivos |

---

## 📋 Sueño Engine - Cascada

| Nivel | Condición | Alerta | Acción |
|-------|----------|--------|--------|
| 1. Agudo | Sueño < 6h (1-2 días) | ⚠️ Rendimiento afectado | Reducir carga 15% |
| 2. Crónico | Sueño deuda > 6h (3+ días) | 🔴 Overtraining riesgo | Forzar descarga |
| 3. Tolerancia | Racha cafe + deuda > 5 | 🚨 CNS riesgo | Caffeine taper 7-12 días |

---

## 🔜 siguiente

1. Implementar Cafeína Engine (4 módulos)
2. Crear tabla `caffeine_settings` en schema
3. Actualizar B10 UI con alertas

---

## 📎 Referencias

- Wireframes: `wireframes/`
- Engines: `engines/`
- Backend: `backend/src/`
- Schema: `backend/src/schema.sql`