# COMPETITION BRAIN — Holy Oly + Axon
> Sinclair, taper, peak day y readiness pre-competición.
> Holy Oly (Weightlifting) y Axon (Hyrox). Diferencias explícitas por deporte.

---

## 1. Sinclair — Holy Oly

### Coeficientes vigentes 2021-2024

| Género | A | b (peso máximo kg) |
|--------|---|-------------------|
| Hombres | 0.722762521 | 193.609 |
| Mujeres | 0.787004341 | 153.757 |

> Válidos hasta diciembre 2024. Coeficientes 2025-2028 pendientes de publicación oficial IWF.

### Fórmula

```
Si peso corporal ≤ b:
    X = log10(peso_corporal / b)
    SC = 10^(A × X²)

Si peso corporal > b:
    SC = 1.0

Total Sinclair = Total_Real × SC
```

### Ejemplo (hombre 61.9 kg, total 320 kg)
```
X = log10(61.9 / 193.609) = -0.4488
SC = 10^(0.7228 × (-0.4488)²) = 1.2575
Total Sinclair = 320 × 1.2575 = 402 kg
```

### Notas
- Alternativa: **Robi Points** — algunas federaciones lo usan junto a Sinclair
- El Sinclair femenino usa los mismos principios con A y b distintos

---

## 2. Taper — duración y estructura

### Duración óptima por deporte
| Deporte | Taper total | Taper agresivo |
|---------|------------|----------------|
| Holy Oly | 2–4 semanas | Últimas 2 semanas |
| Hyrox (alto volumen) | 10–14 días | Última semana |
| Hyrox (volumen moderado) | 7–10 días | Últimos 5 días |

### Reducción de volumen por semana
| Semana | Reducción de volumen | Intensidad |
|--------|---------------------|------------|
| Semana -2 (días 14-8) | –30 a –40% | Se mantiene o sube |
| Semana -1 (días 7-1) | –40 a –70% del total | Se mantiene o sube |

> **Regla crítica:** La intensidad SUBE o se MANTIENE. Nunca baja durante el taper.  
> Bajar intensidad a <30% 1RM perjudica el rendimiento en fuerza.

### Principio del taper
- Reducir reps, mantener carga: ej. 2 sets × 5 reps @90% en vez de 4 sets × 10 reps @75%
- Mantener frecuencia de sesiones (3-4/sem), reducir duración
- Sesiones más cortas, más específicas

---

## 3. Taper por deporte — detalle

### Holy Oly
- Frecuencia: 3-4 días/semana, sesiones más cortas
- Énfasis: singles pesados sobre volumen
- Semana final: singles a 80-85% máximo 1-2 veces, resto 60-75%
- Snatch: fatiga menos que C&J → puede entrenarse más cercano a competición

### Hyrox
**Semana -2 (días 14-8):**
- Running: –30% volumen. Mantener intervalos race-pace pero más cortos (4×400m en vez de 8×400m)
- Estaciones: –30-40% sets. Mantener carga e intensidad
- Frecuencia: igual (4-5 sesiones) pero duración –30%

**Semana -1 (días 7-1):**
- Días 7-5: 50-60% del volumen normal. Intervalos 2-3 millas, station EMOM 30s on/30s off
- Días 4-2: Sesiones cortas de activación (20-30 min). Técnica sin fatiga
- Día previo: Descanso completo o activación muy ligera (15-20 min movilidad + 2-3 strides)

---

## 4. Último test pesado antes de competición

| Deporte | Movimiento | Días antes |
|---------|-----------|-----------|
| Holy Oly | C&J + Back Squat | 10–14 días |
| Holy Oly | Snatch | 7–10 días |
| Hyrox | Sesión dura / race simulation | 7–14 días |
| Hyrox | Última sesión de fuerza pesada | 5–7 días |
| Hyrox | 48h antes | Solo activación (<30 min, RPE 6) |

---

## 5. ACWR target semana de competición

| ACWR | Zona | Acción |
|------|------|--------|
| < 0.7 | Detraining risk | Si persiste >7 días: insertar sesión de activación |
| 0.7–0.8 | Suave | OK si es solo 1-2 días |
| **0.8–1.0** | **Zona ideal** | **Target para semana de competición** |
| 1.0–1.3 | Aceptable | Monitorear |
| > 1.3 | Warning | Reducir carga inmediatamente |
| > 2.0 | Peligro | Riesgo de lesión 3.7× mayor. Nunca llegar aquí |

**Cómo lograrlo:**
- Reducir workload semanal a 30-50% del promedio de las 4 semanas previas
- Mantener frecuencia (3-4 sesiones) pero reducir duración y volumen drásticamente

> Nota: ACWR sirve para prevenir lesión, no para predecir rendimiento peak. Para readiness usar VBT + HRV.

---

## 6. Métricas de readiness — Peak Day

### Holy Oly (potencia neuromuscular)
| Métrica | Señal verde | Señal roja |
|---------|------------|-----------|
| VBT warm-up | Velocidad ≥ baseline personal @60% | Drop >10% vs baseline |
| HRV | Dentro o sobre rango normal (3 meses) | Por debajo del rango |
| RPE post-calentamiento | < 6/10 | ≥ 7/10 |
| Singles 80% | Se sienten "livianos", timing correcto | Pesados, técnica insegura |
| DOMS | 0-1/10 | ≥ 3/10 |

### Hyrox (dual-system: aeróbico + muscular)
| Métrica | Señal verde | Señal roja |
|---------|------------|-----------|
| HRV | ≥ rango normal + HR matutino estable ±3-5 bpm | HRV bajo + RHR elevada |
| VBT estaciones | Velocidad en wall balls/thrusters ≥ baseline | Drop >10% |
| Race-pace 1-2km warm-up | RPE ≤ 6 | RPE > 7 |
| Sueño últimas 3 noches | >7/10 | <6/10 |
| Estrés percibido | <4/10 | ≥6/10 |

**Diferencia clave:**
- Hyrox → monitorear fatiga **aeróbica + muscular** simultáneamente
- Holy Oly → solo necesita **potencia neuromuscular + técnica**

---

## 7. Qué puede fallar y cómo mitigarlo

| Riesgo | Solución |
|--------|----------|
| Taper demasiado largo → detraining | No exceder 14 días. Si ACWR <0.7 en día -3, 1 sesión activación (3-5 singles @80%) |
| Bajar intensidad → pérdida de potencia | Mantener singles @80-95% aunque sea 1 set. Intervalos race-pace aunque sean 400m |
| Sin métricas → entrar fatigado o destrained | HRV 3-4 días/semana durante taper + VBT cada sesión. Ajustar volumen día a día |
| Última sesión pesada demasiado cerca | Holy Oly: C&J/squat 10-14 días antes. Hyrox: sesión dura 7+ días antes |

---

## 8. Integración con otros engines

| Engine | Interacción |
|--------|-------------|
| **Stress Engine** | Fitness/Fatigue EMA confirma si el taper está funcionando (Fatigue bajando, Fitness manteniéndose) |
| **Session Adaptation** | Risk Score debe llegar a GREEN en los 3 días previos a competición |
| **Movement Volume** | INOL semanal debe estar en zona "easy" (<2.0) en semana de competición |
| **Nutrition** | Cero déficit en peaking. Carbos altos para glucógeno pleno |
| **Sleep Engine** | Sleep Score >85 en 3 días previos = señal verde de readiness |
| **Caffeine Engine** | Caffeine curfew estricto semana de competición para proteger HRV |

---

## 9. Fuentes
- IWF: Sinclair Coefficients 2021-2024
- Everett, G.: Programming The Last Weeks Before a Meet (Catalyst Athletics)
- Gabbett, T.J. (2016): ACWR and injury risk (BJSM)
- GymAware: Velocity-Based Training and daily readiness
- Kubios: HRV-guided training
- RMR Training: How to taper for a Hyrox race
- Endurox: The Hyrox Taper — How to Peak When It Counts
- J2Fit: Mastering the Art of Peaking for Olympic Weightlifting
