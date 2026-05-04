# CAFFEINE BRAIN — Peak Qual Shared Protocol
> Fuente de verdad para el Caffeine Engine. Aplica a Holy Oly, Volta y Axon.

---

## 1. Qué es la cafeína en este sistema

La cafeína no es solo un estimulante — es una **variable de confusión fisiológica**.  
Enmascara fatiga en sesión, retrasa la detección de sobreentrenamiento 48-72h, y bloquea la recuperación autonómica nocturna.

El sistema la trata como señal activa que modifica tres engines:
- **Stress Engine** → ajusta CNS Score según C_residual
- **Session Adaptation Engine** → sube Risk Score si cafeína activa es alta
- **Macrocycle Engine** → reduce tonelaje automáticamente en OTS

---

## 2. Farmacocinética — Modelo de Bateman

### Fórmula base
```
C(t) = (D × F × ka) / (Vd × (ka - ke)) × (e^(-ke×t) - e^(-ka×t))
```

| Parámetro | Valor default | Descripción |
|-----------|--------------|-------------|
| `D` | dosis en mg | Input del atleta |
| `F` | 0.99 | Biodisponibilidad oral |
| `ka` | 0.023 /min | Velocidad absorción GI (Cmax ~45-60 min) |
| `ke` | 0.0058 /min | Velocidad eliminación (T½ ~5.5h promedio) |
| `Vd` | 0.6 L/kg | Volumen distribución |

### Múltiples dosis
Superposición lineal con función Heaviside:
```
C_total(t) = Σ C_i(t - t_i) × H(t - t_i)
```

### Ajuste por genotipo CYP1A2
| Genotipo | Metabolismo | ke multiplicador |
|----------|-------------|-----------------|
| A/A | Rápido | 1.0x |
| A/C | Intermedio | 0.75x |
| C/C | Lento | 0.55x |

---

## 3. Cuándo SÍ usar cafeína (ergogénico legítimo)

- Dosis ≤ 200mg, timing 30-60 min antes de sesión
- C_residual < 50mg en ventana de sueño
- Consumo diario < 2.0 mg/kg
- HRV matutina dentro de baseline ±10%
- ACWR < 1.3
- Sin señales de enmascaramiento (RPE coherente con tonelaje)

**Resultado esperado:** +3-7% rendimiento en fuerza máxima, mayor concentración técnica.

---

## 3b. Dosis útil para rendimiento

Para la mayoría de los adultos sanos, **1–3 mg/kg** de peso es el rango que aumenta fuerza, potencia y percepción de esfuerzo sin tanto "cafeínado" innecesario.

Ejemplo: 70 kg ≈ 70–210 mg por sesión.

Más allá de unos ~400 mg/día se empieza a subir el riesgo de ansiedad, temblor, insomnio y arritmias, sin que el beneficio aumente linealmente.

### Timing alrededor del entrenamiento
- Tomarla **30–60 minutos antes** del entrenamiento te da el pico de concentración/activación cuando empiezas.
- Evita dosis importantes a **< 6 horas** de la hora de dormir, porque retrasa el sueño, reduce la fase profunda y baja la calidad de recuperación.
- Si entrenas en la noche, mejor dosis baja o nula; si no, jugamos con más estrés y menos anabolismo adormilado.

### Dónde te bloquea el rendimiento
- Mezclar alta cafeína con poco sueño, mucha carga de estrés crónico o mucha carga de entrenamiento te hace más "nervioso" que más fuerte: peor control técnico, más riesgo de error y peor recuperación.
- Si el entrenamiento es muy intenso, una cafeína alta puede empujar la frecuencia cardiaca a límites incómodos, aumentar percepción de fatiga y reducir la capacidad de escuchar a tu cuerpo.

### Cuándo NO tomar cafeína
- Si ya tienes ansiedad, trastornos de ritmo cardiaco, hipertensión poco controlada o alteraciones de sueño importantes, la cafeína suele empeorar más de lo que ayuda.
- Si llevas varios días seguidos de mala noche + alta carga de entrenamiento, una dosis grande puede tirarte del lado del sobrecalentamiento y de la fatiga redundante.
- Si el objetivo del día es recovery, técnica o sesiones muy largas y de bajo volumen, la cafeína puede ser innecesaria y solo te dejará más revuelto después.

### Cómo usarla como "herramienta", no como muleta
- Reserva la cafeína para sesiones clave: pesas pesadas, WODs de alta intensidad, pruebas de fuerza o competencias.
- Usa la dosis baja–media (por ejemplo, 1–2 mg/kg) y déjate un margen de seguridad en vez de siempre ir al máximo.
- Registra en tu app:
  - Dosis
  - Hora
  - Huella de sueño
  - Sensación de estrés
  - Rendimiento objetivo (kg movidos, tiempo completado, etc.)
  
  Así sabrás si realmente te está ayudando o solo te "revolviendo".

---

## 4. Cuándo NO usar cafeína

| Condición | Umbral | Razón |
|-----------|--------|-------|
| C_residual alto | > 100mg antes de dormir | Bloquea adenosina → suprime REM |
| Tolerancia alta | > 2.5 mg/kg/día sostenido | Upregulation receptores, ya no funciona |
| ACWR crítico | > 1.5 | Puede estar compensando daño periférico |
| HRV deprimida | Zscore < -1.5 | SNC ya comprometido |
| Post Red Flag | 48-72h | Periodo de restauración autonómica |

---

## 5. Alertas por nivel

### Nivel INFO (atleta y coach)
- "Cafeína activa alta. Tu percepción de esfuerzo puede estar subestimada."
- "Tomaste cafeína después de las 14:00. Sueño REM potencialmente afectado."

### Nivel WARNING (atleta y coach)
- "Tu HRV bajó X% esta mañana — coincide con C_residual de ayer noche."
- "Llevas X días con consumo > 2.5 mg/kg. Considera reducir."
- "RPE reportado no coincide con tonelaje real. Posible enmascaramiento activo."

### Nivel CRITICAL (coach únicamente)
- "Tolerancia metabólica detectada. Rendimiento estancado pese a estimulantes. Washout recomendado: 7-10 días."
- "Red Flag OTS: ACWR > 1.5 + HRV Zscore < -1.5 + patrón enmascaramiento. Descarga automática aplicada."

---

## 6. Reglas de intervención automática

### Caffeine Curfew
- Curfew estándar: 10h antes del sueño planificado
- Curfew estricto (post Red Flag): 12h antes
- Calculado dinámicamente según hora de sueño del atleta

### Washout neuroquímico
- Trigger: consumo promedio > 2.5 mg/kg/día por ≥ 7 días
- Protocolo: reducir a < 1.0 mg/kg/día por 7-10 días
- Durante washout: alertas de abstinencia esperadas (headache, fatigue)

### Descarga mecánica OTS
- Trigger: Red Flag (ACWR > 1.5 + HRV_Zscore < -1.5 + enmascaramiento)
- Acción: -20% a -35% tonelaje en macrociclo
- Duración: hasta que Readiness > 60 por 3 días consecutivos

---

## 7. Visualizaciones disponibles

| # | Gráfico | Vista | Muestra |
|---|---------|-------|---------|
| 1 | Curva Bateman diaria | Coach + Atleta | C(t) hora a hora |
| 2 | Superposición multi-dosis | Coach | Acumulado real del día |
| 3 | Scatter RPE vs Tonelaje | Coach | Enmascaramiento (color = cafeína) |
| 4 | Heatmap C_residual × HRV | Coach | Correlación noche-mañana |
| 5 | Timeline ACWR + Readiness + Cafeína | Coach | Cascada OTS |
| 6 | Heatmap semanal hora×día | Coach | Patrones de consumo |
| 7 | Tolerancia histórica mg/kg | Coach | Tendencia upregulation |
| 8 | Radar CNS con cafeína | Atleta | CNS factors visuales |

---

## 8. Cruces con otros engines

| Engine | Cómo interactúa con cafeína |
|--------|----------------------------|
| **Stress Engine** | CNS Score × suppression_factor(C_residual) |
| **Session Adaptation** | Risk Score += caffeine_risk_modifier |
| **Macrocycle Engine** | Tonelaje -= descarga_pct si Red Flag |
| **RAG (Huberman)** | Contexto científico para respuestas del agente |

---

## 9. Fuentes científicas
- Modelo de Bateman bicompartimental (farmacocinética clásica)
- Huberman Lab: caffeine-science (ingestado en RAG)
- CYP1A2 genotipado: literatura de farmacogenómica deportiva
- ACWR EWMA: Gabbett et al. (2016), British Journal of Sports Medicine
