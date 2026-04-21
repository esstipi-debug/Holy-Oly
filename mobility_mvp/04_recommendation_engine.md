# Motor de Recomendación (El Cerebro MVP)

Para generar la rutina exacta todos los días sin que el usuario tenga que pensar, el sistema utiliza esta lógica de cruce de datos:

## 1. Rutina Pre-WOD (Activación - 5 a 8 minutos)
**Objetivo:** Preparar el sistema nervioso y las articulaciones para la sesión específica de halterofilia de hoy.
*   **Regla:** Leer la sesión del día (ej. Snatch & Back Squat).
*   **Mapeo:** Snatch demanda = `Hombros`, `Torácica`, `Cadera`.
*   **Filtro SQL:**
    ```sql
    SELECT * FROM mobility_exercises
    WHERE phase_type = 'Pre-WOD'
    AND target_zone IN ('Hombros', 'Torácica', 'Cadera')
    ORDER BY RANDOM() LIMIT 4;
    ```
*   **Ajuste de Personalización:** Si el test del atleta dice que sus `Tobillos` son su peor debilidad (< 60%), *siempre* se fuerza al menos 1 ejercicio dinámico de tobillo en el Pre-WOD, aunque el bloque principal no demande tobillos.

## 2. Rutina Post-WOD (Recuperación - 8 a 12 minutos)
**Objetivo:** Down-regulation (sistema parasimpático). Estiramientos estáticos profundos, respiración prolongada.
*   **Regla:** Leer metabolismo del entrenamiento (si fue muy pesado en piernas o carga axial).
*   **Filtro SQL:** Similar al Pre-WOD, pero usando `phase_type = 'Post-WOD'`. Posiciones sostenidas mínimo 120 segundos.

## 3. Rutina Diaria / Mantenimiento (Rest Day - 15 a 20 minutos)
**Objetivo:** Reparar los eslabones débiles (Assessment).
*   **Regla:** Mirar el `user_mobility_profiles` más reciente.
*   **Selección:** Seleccionar automáticamente la zona con la puntuación más baja (ej. `Torácica = 50`).
*   **Generador:** 
    *   40% del tiempo a la peor debilidad (`Torácica`).
    *   30% a la segunda peor debilidad.
    *   30% general (Cuerpo completo).
*   Se seleccionan ejercicios etiquetados como `Mantenimiento`.

## UX de Ejecución
Una vez generada la lista de ejercicios, se envían al frontend en un array.
El frontend reproduce un componente tipo "Cinta de opciones" (Carousel timer), donde el timer central cuenta regresivamente 120.. 119.. 118.. con el GIF/loop visualizando la técnica, sin necesidad de dar clic en "siguiente".
