# Mobility Test Logic (MVP)

Este archivo describe el flujo de pantalla para la evaluación inicial (Onboarding) de movilidad, replicando el test de GOWOD.

## Pantalla 1: Bienvenida al Test
*   **Título:** Conoce tus limitaciones. Libera tu potencial.
*   **Subtítulo:** Realizaremos 4 pruebas simples para identificar tus bloqueos y personalizar tus rutinas diarias.
*   **Acción:** Botón "Comenzar Test".

## Prueba 1: Tobillo (Dorsiflexión)
*   **Instrucción:** Test de la rodilla a la pared.
*   **Gráfico/Concepto:** Posición de caballero a un palmo (10cm) de la pared.
*   **Pregunta al usuario:** ¿Puedes tocar la pared con la rodilla sin despegar el talón izquierdo?
*   **Respuestas (UI):**
    *   [ ] Sí, sin dolor (Score = 100)
    *   [ ] Sí, pero con molestia / justo (Score = 75)
    *   [ ] No, el talón se levanta (Score = 50)
*   *(Repetir para tobillo derecho)*

## Prueba 2: Hombros y Torácica (Sobrecabeza)
*   **Instrucción:** Acuéstate boca arriba, piernas flexionadas, lumbar neutra. Toma un palo de escoba / pica con agarre de Snatch y llévalo hacia atrás.
*   **Pregunta al usuario:** ¿La pica toca el suelo manteniendo los codos completamente bloqueados y sin arquear la espalda baja?
*   **Respuestas (UI):**
    *   [ ] Toca el suelo sin esfuerzo (Score = 100)
    *   [ ] Toca con mucho esfuerzo (Score = 75)
    *   [ ] No toca, codos se doblan o espalda se arquea (Score = 50)

## Prueba 3: Cadera (Overhead Squat Profundo)
*   **Instrucción:** Realiza una Overhead Squat con pica, bajando lo máximo posible.
*   **Pregunta al usuario:** ¿Puedes romper el paralelo manteniendo el pecho alto y la pica sobre el centro del pie?
*   **Respuestas (UI):**
    *   [ ] Totalmente estable (Score = 100)
    *   [ ] Rompo paralelo pero me inclino mucho al frente (Score = 75)
    *   [ ] No puedo romper el paralelo o pierdo el equilibrio (Score = 50)

## Pantalla Final: Resultados
*   **Cálculo:** Se guarda el perfil en `user_mobility_profiles`.
*   **Visualización:** Gráfico de radar (Radar Chart) mostrando el porcentaje en Tobillos, Cadera, Hombros y Columna.
*   **Mensaje:** "Tu eslabón más débil es [X]. Tu rutina de Mantenimiento se centrará en esto."
