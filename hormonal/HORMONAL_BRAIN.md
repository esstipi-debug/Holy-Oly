# HORMONAL BRAIN — Peak Qual Shared Protocol
> Fuente de verdad para el Hormonal Engine (Ciclo Femenino).
> Aplica a Holy Oly, Volta y Axon para atletas mujeres.
> Basado en: Sung et al. (2014), Sims (2016), Romero-Moraleda (2019)

---

## 1. Qué resuelve este engine

Alinea la carga de entrenamiento con el estado hormonal de la atleta.  
Sin este engine se ignoran:
- **Periodos de máximo potencial anabólico** → fase folicular tardía (perder PRs)
- **Periodos de riesgo de lesión** → fase ovulatoria (ligamentos laxos)
- **Periodos de descarga necesaria** → fase lútea tardía (RPE elevado, recuperación lenta)

---

## 2. Variables de entrada

| Variable | Unidad | Rango | Fuente | Requerida |
|----------|--------|-------|--------|-----------|
| Día del ciclo | días | 1 – 28/32 | Manual (tracking) | Sí |
| Fase actual | categoría | Folicular / Ovulatoria / Lútea | Calculado | Sí |
| Temperatura basal | °C | 36.1 – 37.2 | Wearable | No |
| RPE percibido | 1-10 | 1 – 10 | Manual | Sí |

---

## 3. Fases del ciclo y factores de ajuste

```
Intensidad_Ajustada = Base_1RM × Factor_Fase
```

| Fase | Días aprox | Factor 1RM | Estado hormonal | Qué hacer |
|------|-----------|------------|-----------------|-----------|
| **Folicular temprana** | 1 – 7 | 0.95 – 1.00 | Estrógenos subiendo | Construir base, recuperación activa |
| **Folicular tardía** | 8 – 13 | 1.00 – 1.05 | Pico estrogénico | **Máxima intensidad. PRs aquí.** |
| **Ovulatoria** | 14 – 16 | 0.95 – 1.00 | Pico LH + estrógenos | Precaución ligamentosa. Técnica > carga |
| **Lútea temprana** | 17 – 21 | 0.92 – 0.97 | Progesterona sube | Mantener fuerza, reducir volumen |
| **Lútea tardía** | 22 – 28 | 0.90 – 0.95 | Catabólica | **Descarga. Técnica y movilidad.** |

### Ajuste por uso de anticonceptivos orales
Si la atleta usa anticonceptivos orales → fluctuaciones hormonales atenuadas → perfil de carga más lineal → Factor_Fase = 1.0 constante, sin ajuste automático.

---

## 4. Riesgo ligamentoso en ovulación

El pico de estrógenos en la fase ovulatoria incrementa la laxitud del colágeno, elevando el riesgo de lesión en:
- Snatch (máxima demanda de estabilidad)
- Clean & Jerk (overhead instability)
- Cualquier movimiento unilateral o de alta velocidad

Intervención: calentamiento articular extendido + reducir carga máxima en estos movimientos específicamente.

---

## 5. Cuándo SÍ y cuándo NO

**Fase folicular tardía — MÁXIMO POTENCIAL:**
- Uso eficiente del glucógeno
- Mayor síntesis proteica
- Umbral de dolor más alto
- Ideal: PRs, test de 1RM, sesiones de alta intensidad

**Fase lútea tardía — REDUCIR:**
- RPE percibido más alto para misma carga objetiva
- Termorregulación afectada (temperatura corporal basal sube)
- Recuperación más lenta entre series
- PRs en esta fase → mayor tasa de fallo + tiempo de recuperación más largo

**Anticonceptivos orales:**
- Atenúan el potencial anabólico de la fase folicular
- También atenúan el riesgo de la fase ovulatoria
- El engine detecta esto y desactiva ajuste automático

---

## 6. Alertas

### Atleta
- **INFO**: "Fase folicular: Tu cuerpo está en modo construcción. ¡A por ello!"
- **WARNING**: "Fase ovulatoria: Asegura un calentamiento extra para tus articulaciones."
- **CRITICAL**: "Fase premenstrual: Es normal sentir más fatiga. Ajustamos pesos para mantener la técnica."

### Coach (adicional)
- **INFO**: "Atleta en fase folicular tardía. Buena ventana para test de intensidad."
- **WARNING**: "Atleta en fase ovulatoria. Priorizar técnica sobre carga máxima hoy."
- **CRITICAL**: "Atleta en fase lútea tardía. Aplicando descarga automática."

---

## 7. Intervenciones automáticas

| Fase | Acción | Duración |
|------|--------|----------|
| Folicular tardía | +5% intensidad habilitado (si readiness lo permite) | 3-5 días |
| Ovulatoria | Calentamiento extendido. Sin carga máxima en Snatch/C&J | 3 días |
| Lútea tardía | -5-10% intensidad + -20% volumen | 3-5 días de la fase crítica |

---

## 8. Integración con otros engines

| Engine | Interacción |
|--------|-------------|
| **Stress Engine** | Fase lútea puede elevar HRV basal → falsos negativos de recuperación. Engine lo corrige |
| **Session Adaptation** | Factor_Fase modifica weight_pct directamente en cada ejercicio |
| **Macrocycle Engine** | Macrociclo puede alinearse con ciclo: PRs en semana folicular tardía, descarga en semana lútea |
| **Nutrition Engine** (pendiente) | Fase lútea → +250 kcal + más carbohidratos para compensar gasto metabólico |
| **Sleep Engine** | Fase lútea puede reducir calidad de sueño → interacción bidireccional con Sleep Score |

---

## 9. Fuentes
- Sung, E., et al. (2014). Effects of follicular versus luteal phase-based strength training in young women. SpringerPlus.
- Sims, S.T. (2016). ROAR: Match Your Food and Fitness to Your Female Physiology.
- Romero-Moraleda, B. (2019). The Influence of the Menstrual Cycle on Muscle Strength. PMC.
