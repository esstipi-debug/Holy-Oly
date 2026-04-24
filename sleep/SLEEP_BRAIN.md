# SLEEP QUALITY BRAIN — Peak Qual Shared Protocol
> Fuente de verdad para el Sleep Quality Engine. Aplica a Holy Oly, Volta y Axon.
> Basado en: Halson (2014), Walker (2003)

---

## 1. Qué resuelve este engine

Distingue si la fatiga o el estancamiento técnico se deben a:
- **Recuperación física deficiente** → falta de sueño profundo (N3)
- **Consolidación motora inadecuada** → falta de sueño REM

Sin este engine, sleep_hours = 7h puede ser una nota verde falsa. 7h con 10% N3 es peor que 6.5h con 22% N3.

---

## 2. Variables de entrada

| Variable | Unidad | Rango normal atleta fuerza | Fuente |
|----------|--------|---------------------------|--------|
| Horas totales | h | 7.5 – 9.5h | Wearable / Manual |
| % Sueño Profundo N3 | % | 15% – 25% | Wearable |
| % Sueño REM | % | 20% – 25% | Wearable |
| Eficiencia | % | > 85% | Calculado |
| Latencia | min | 10 – 20 min | Wearable / Manual |

---

## 3. Sleep Score — Fórmula

```
SleepScore = (0.4 × HorasNorm) + (0.3 × DeepREM_Norm) + (0.2 × Efficiency) + (0.1 × LatencyScore)
```

### Normalización
- **HorasNorm** = min(horas / 8.5, 1.0) × 100
- **DeepREM_Norm** = ((deep_pct / 20) × 0.5 + (rem_pct / 22.5) × 0.5) × 100
- **Efficiency** = efficiency_pct (ya es 0-100)
- **LatencyScore** = 100 si latencia 10-20 min / 70 si <10 min / penaliza progresivo >20 min

### Ventanas de análisis
- **Aguda**: última noche
- **Crónica**: media móvil 7 días

---

## 4. Zonas y umbrales

| Zona | Score | Significado |
|------|-------|-------------|
| **OPTIMAL** | > 85 | Recuperación completa. Alta intensidad y técnica compleja habilitadas |
| **WARNING** | 70 – 85 | Posible aumento RPE. Reducción leve de volumen recomendada |
| **CRITICAL** | < 70 | Riesgo elevado de lesión. Intervención automática activada |

---

## 5. Cuándo SÍ y cuándo NO

**El sueño profundo (N3) AYUDA:**
- Libera GH → recuperación neuromuscular
- Consolidación de adaptaciones estructurales

**El sueño REM AYUDA:**
- Consolida patrones motores aprendidos en sesión (técnica snatch, etc.)
- Crítico para atletas en fase de aprendizaje técnico

**Qué daña el sueño:**
- < 6h totales → reduce 1RM en multiarticulares hasta 15%
- Cafeína tardía → suprime REM (ver Caffeine Engine)
- Alcohol → fragmenta N3 (ver Alcohol Engine pendiente)
- Sobreentrenamiento → insomnio paradójico (enmascara necesidad real de sueño)

**Enmascaramientos:**
- Cafeína puede enmascarar fatiga percibida pero NO restaura velocidad de conducción nerviosa
- Score alto en horas pero bajo en N3/REM = falso positivo

---

## 6. Alertas

### Atleta
- **INFO**: "Sueño REM óptimo. Tu cerebro está listo para el trabajo técnico de hoy."
- **WARNING**: "Sueño profundo bajo (<15%). La recuperación muscular es incompleta. Escucha a tu cuerpo."
- **CRITICAL**: "Déficit acumulado grave. Hoy priorizamos la calidad sobre la cantidad. Intensidad reducida."

### Coach (adicional)
- **WARNING**: "Atleta con Sleep Score {score} (7d avg). RPE puede estar elevado hoy."
- **CRITICAL**: "Sleep Score < 70 por {days} días consecutivos. Revisar carga del macrociclo."

---

## 7. Intervenciones automáticas

| Nivel | Acción | Duración |
|-------|--------|----------|
| WARNING | -10% series accesorias | Hasta score > 80 (7d) |
| CRITICAL | -10-15% 1RM + -20% volumen total. Foco en movilidad | Hasta score > 80 (7d) |

---

## 8. Integración con otros engines

| Engine | Interacción |
|--------|-------------|
| **Stress Engine** | Déficit de sueño multiplica Fatigue Score. CNS Score ajustado por Deep% y REM% |
| **Session Adaptation** | Sleep Score < 70 → Risk Score sube directamente |
| **Caffeine Engine** | Si Sleep Score crónico bajo → Caffeine Engine adelanta curfew para proteger REM |
| **Hormonal Engine** | Fase lútea puede reducir calidad de sueño → interacción bidireccional |

---

## 9. Fuentes
- Halson, S.L. (2014). Sleep in elite athletes and nutritional interventions. Sports Medicine.
- Walker, M.P. (2003). Sleep and the Time Course of Motor Skill Learning. Neuron.
