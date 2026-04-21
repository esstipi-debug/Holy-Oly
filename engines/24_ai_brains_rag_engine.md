# 24. AI Brains & RAG Engine — Conocimiento Deportivo y Transversal

**Propósito:** Definir la arquitectura de conocimiento (Cerebros IA) que consumen los algoritmos predictivos y el sistema RAG (Retrieval-Augmented Generation) de Peak Qual. Esto permite que la IA entienda qué deporte practica el atleta y cómo aplicar los protocolos de recuperación transversales de estilo de vida de manera hiper-personalizada.

**Status:** Arquitectura Core Documentada.
**Relación:** Alimenta al `15_pildoras_engine.md` (Píldoras) y trabaja en conjunto con el `22_imr_engine.md` (Intensidad y Fatiga).

---

## 1. Arquitectura de los 4 Cerebros

La plataforma divide su base de conocimientos en **3 Cerebros Deportivos** (Metodológicos) y **1 Cerebro Transversal** (Salud/Recuperación). La IA nunca mezcla prescripciones deportivas entre disciplinas, pero usa el cerebro transversal para potenciar a todos.

### 🧠 Cerebro Deportivo 1: Halterofilia (Weightlifting)
*   **Dominio:** Fuerza explosiva, potencia máxima, Sistema Nervioso Central (SNC).
*   **Vía Energética:** Anaeróbica aláctica.
*   **Tipo de Fatiga:** Fatiga Neural.
*   **Enfoque de IA:** Maximizar la técnica, preservar el sistema nervioso, movilidad articular extrema (Overhead, deep squat). Si el atleta falla, la recomendación se orienta a resetear el SNC y corregir mecánicas.

### 🧠 Cerebro Deportivo 2: CrossFit (Hybrid Power)
*   **Dominio:** Potencia sostenida bajo fatiga general, gimnasia, resistencia muscular.
*   **Vía Energética:** Glucolítica y metabólica extrema.
*   **Tipo de Fatiga:** Cortisol alto, acumulación sistémica, inflamación muscular constante.
*   **Enfoque de IA:** Manejo de cargas dinámicas (AMRAPs, For Time), prevención de lesiones por técnica deteriorada bajo volumen alto (ej. fallar tirones altos).

### 🧠 Cerebro Deportivo 3: Hyrox (Functional Endurance)
*   **Dominio:** Resistencia cardiovascular masiva, fuerza híbrida baja-complejidad técnica.
*   **Vía Energética:** Aeróbica dominante + Glucolítica continua.
*   **Tipo de Fatiga:** Depleción de Glucógeno y fatiga periférica muscular severa en piernas/caderas.
*   **Enfoque de IA:** Ritmo (Pacing), resistencia al lactato, reposición intra y pre-entrenamiento de carbohidratos, y mitigación de impacto articular crónico.

---

## 2. El Cerebro Transversal: Andrew Huberman (Salud y Lifestyle)

A diferencia de los tres anteriores, **Huberman no es un deporte**. Es un motor ético de **Performance y Biología Humana** que inyecta *Insights* a través del sistema de **Píldoras (Píldoras Engine)**.

*   **Regla Core:** La IA no usa a Huberman para enseñarte a levantar pesas. Usa a Huberman para asegurarse de que tu cuerpo esté preparado biológicamente para hacerlo al día siguiente.

### Lógica de Etiquetado (Tagging System)
Se utilizan métricas de Readiness o reportes del atleta para asignar `TAGS` invisibles que disparan Píldoras predictivas:

*   **Caso 1: `#Sleep_Deprivation` (Falta de sueño)**
    *   *Trigger:* Atleta marca baja calidad de sueño en el check-in (o dispositivo detecta < 6h).
    *   *Respuesta de la IA (Huberman Brain):* Ignora los tips de Halterofilia hoy y en el feed prioriza: *"Píldora del Sueño: Prueba 10 min de NSDR antes de dormir o limita cafeína a 10 horas antes de acostarte."*
*   **Caso 2: `#High_Inflammation` (Soreness extremo)**
    *   *Trigger:* Atleta marca 9/10 en dolor muscular luego de una sesión Hyrox.
    *   *Respuesta de la IA (Huberman Brain):* *"Aplica inmersión en agua fría por 3-5 minutos para bajar la fiebre sistemático del impacto."* 
    *   *Excepción IA:* Si el atleta es de Halterofilia y está en fase de fuerza, la IA bloquea el frío para no matar la hipertrofia y sugiere contraste solo con calor.
*   **Caso 3: `#Alcohol_Toxicity` (Control de Daños por Alcohol y Resaca)**
    *   *Trigger:* Atleta registra consumo de alcohol en su Lifestyle Log, o el sistema detecta un desplome del HRV con aumento de la frecuencia cardíaca en reposo pos-fin de semana.
    *   *Respuesta de la IA (Huberman Brain):* *"Píldora SOS: Frena la acidosis metabólica y la irritación gástrica bebiendo 1/2 vaso de agua con 1/2 cucharadita de bicarbonato de sodio y limón al despertar. Desayuna huevos (la cisteína limpia el acetaldehído de tu hígado) y consume kéfir para repoblar tu flora intestinal destruida. Tu cuerpo no retendrá agua sola sin electrolitos."*

## 3. Recomendaciones Activas (El Rol del Smart Coach IA)
El sistema no es solo pasivo ("lee esta pequeña historia"). Se vuelve activo.
Si la IA detecta una racha (Streak) negativa de sueño:
1. Pone notificación *Urgent* al Coach humano: "Alerta: Tu atleta lleva 3 días seguidos durmiendo mal. Su CNS corre peligro hoy al tirar Clean & Jerks".
2. Corta temporalmente del feed las Píldoras de Técnica (por ejemplo de cómo mejorar el Snatch) porque el problema raíz actual del atleta no es el Snatch, es el estrés de estilo de vida.

---

**Resumen de Data Flow IA:**
[Data de Desempeño] -> Match con (Cerebro Deportivo: Halterofilia/CF/Hyrox) -> [Data de Readiness Vital] -> Match con (Cerebro Transversal: Huberman) -> *Output = Plan Seguro y Píldora Relevante.*
