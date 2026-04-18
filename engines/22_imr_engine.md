# 22. IMR Engine — Intensity Maintenance Ratio

**Propósito:** Cuantificar, graficar y analizar la capacidad del atleta para sostener intensidades altas a través de las series (Prescripción vs. Realidad). Cruzar esta data con el Macrociclo para generar insights accionables (etiquetados) basados en neurociencia y fisiología deportiva.

**Status:** Core gamification & coaching system (Integración con AI Agents).
**Frecuencia de generación:** Por sesión y promedio semanal (Microciclo).
**Relación:** `Macrocycle Engine` (Línea de base) + `Stress Engine` (Impacto).

---

## 1. Fundamento Matemático del IMR

El **IMR (Intensity Maintenance Ratio)** responde a la pregunta de un Coach: *"¿Qué tanto luchó el atleta por mantener los kilos en la barra cuando apareció la fatiga central?"*.

### 1.1 La Fórmula

Por cada bloque de ejercicio crítico (Snatch, C&J, Squats):
`IMR_Ejercicio = (Intensidad Media Sostenida / Intensidad Prescrita Pico) * 100`

**Ejemplo:**
- **Prescrito:** Back Squat 5 series de 3 repeticiones al 85% (ej. 100kg).
- **Esfuerzo Real:** 
    - Serie 1: 100kg (85%)
    - Serie 2: 100kg (85%)
    - Serie 3: 95kg (80%)  *(Autorregulación por fatiga)*
    - Serie 4: 90kg (76%)
    - Serie 5: 90kg (76%)
- **Cálculo:** (100+100+95+90+90) / 5 = 95kg media. (95 / 100) = **IMR de 95%**

### 1.2 Interpretación por Zonas (IMR Zones)
*   **🟢 Elite (96% - 100%):** Atleta tolera lactato y fatiga neural perfecto. 
*   **🟡 Normal (90% - 95%):** Drop-off esperado. Falla humana estándar.
*   **🔴 Riesgo Neural (< 90%):** El atleta se "apaga" rápido. Falta de combustible o SNC colapsado.

---

## 2. Visualización: IMR vs Macrocycle

Visualmente (Dashboard Coach), el IMR se grafica a manera de "sombra" o línea superpuesta sobre la gráfica de progresión del macrociclo.

*   **Eje X:** Semanas del Macrociclo (ej. Semanas 1 a 12).
*   **Eje Y (Barras Sólidas):** Volumen/Tonelaje del macrociclo exigido (Va subiendo semana a semana).
*   **Línea Dinámica Neón (Superpuesta):** Promedio del IMR semanal.

**Patrón Clásico a detectar:** A medida que las barras sólidas (volumen del macrociclo) llegan a la de acumulación profunda (Semanas 3-4), la línea del IMR suele desplomarse si la recuperación es pobre.

---

## 3. Sistema de Recomendaciones Etiquetadas (RAG / AI Ready)

Cuando el `IMR Engine` detecta una caída sostenida o abrupta, dispara alertas predictivas para Atleta y Coach de forma separada. Estas alertas incluyen `[TAGS]` para que el Frontend o los Agentes IA (Peak Qual / Huberman) inserten contenido científico automatizado.

### 3.1 Vistas y Tags Disponibles

| Tag Sistémico | Ángulo Fisiológico (Huberman/Science) | Disparador (Trigger del IMR) |
|---------------|---------------------------------------|------------------------------|
| `#CNS_Fatigue` | Impacto en Sistema Nervioso Central | Caída abrupta en ejercicios de potencia (Snatch/Clean) en < 15 min. |
| `#Glycogen` | Agotamiento de sustratos energéticos | El IMR es impecable al inicio pero colapsa al final de la sesión en Squats. |
| `#Sleep_Architecture`| Calidad REM/Deep sleep | Caída global del IMR durante toda la semana de acumulación. |
| `#Technical_Breakdown`| Disminución de eficiencia biomecánica | IMR cae a pesar de que el RPE percibido es bajo. |

### 3.2 Recomendaciones: Lado Coach (Dashboard Actionable)

> **"Atleta: João — IMR Drop-off Detectado (88%)"**
> 
> *   **Causa Posible:** `#Glycogen_Depletion`
> *   **Análisis:** João está perdiendo un 12% de intensidad al cruzar los 40 minutos de sesión (específicamente en Tirones y Sentadillas al final).
> *   **Acción Recomendada:**
>     - (Coach): Bajar el tonelaje accesorio un 15% esta semana o insertar intra-workout carbs. No cambiar el macrociclo primario todavía.

### 3.3 Recomendaciones: Lado Atleta (Viral / Gamification Push)

> **"¡Has peleado como titan, pero tu tanque se vació pronto!"**
> 
> *   **IMR de la Sesión:** 88% (Zona de Riesgo Neural)
> *   **Insights `#CNS_Fatigue` `#Sleep_Architecture`:**
>     - Perdiste potencia explosiva en los Clean & Jerks finales. Tu SNC te obligó a bajar kilos.
>     - **Protocolo de Recuperación (Peak Qual):** Implementa 20 min de *NSDR (Non-Sleep Deep Rest)* de Andrew Huberman post-sesión, y prioriza 8 horas de sueño esta noche con temperatura fría en la habitación. 

---

## 4. Estructura de Datos (Schema)

```json
{
  "imr_log": {
    "session_id": "uuid",
    "athlete_id": "uuid",
    "macrocycle_week": 4,
    "global_imr_score": 92.5,
    "exercise_breakdown": [
      {
        "exercise": "Snatch",
        "prescribed_intensity": 85,
        "actual_average": 84.5,
        "imr_score": 99.4
      },
      {
        "exercise": "Back Squat",
        "prescribed_intensity": 80,
        "actual_average": 71.0,
        "imr_score": 88.7,
        "tags_triggered": ["#Glycogen"]
      }
    ]
  }
}
```

---

## 5. Implementación a Futuro
- **Fase Coach Frontend:** Un Chart superpuesto con D3.js o Recharts mostrando `bars` para Volumen, `line` para IMR, y tooltips en los puntos de quiebre de la curva.
- **Fase AI Integración:** Leer la propiedad `tags_triggered` en la BD para "llamar" a los agentes de IA y popular los modales de "Injury Shield" o Píldoras Motivacionales con data de ciencia de Huberman.
