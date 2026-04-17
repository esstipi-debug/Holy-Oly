# 🦾 HolyOly — Elite UI Prompting Guide (Stitch)

This guide translates the 21 backend engines (Banister, Macrocycle, Gamification) and the B2B2C UX flow into high-fidelity Stitch UI prompts. Maintain the "Obsidian Kinetic" aesthetic.

---

## 1. El ADN Visual (Incluir siempre en tus prompts de Stitch)

> **Brand Identity:** HolyOly — An elite Weightlifting (Halterofilia) management app. For Coaches, it manages multiple athletes and sessions; for Athletes, it monitors fatigue and body stress.
> **Design Philosophy:** "The Obsidian Kinetic." A cinematic, high-stakes aesthetic like a luxury training HUD.
> **Theme:** Deep Dark Mode (Background: #07070F, Surface: #0F111A).
> **Accents:** Electric Green (#22C55E) for good readiness/fitness, Holy Gold (#F59E0B) for PRs/Warnings, and Holy Cyan (#06B6D4) for Coaching analytics/Smart shields.
> **Typography:** Space Grotesk (Headers/Numbers) and Inter (Body). Use extreme scale contrast.
> **Structure:** NO 1px BORDERS. Use background tonal shifts. Corners: Brutal 0px or rigid 8px.

---

## 2. Pantalla: Dashboard Atleta (B1 - Diagnostic)
**Prompt:**
> Generate a mobile dashboard for HolyOly called "Athlete Diagnostic". Focus on the Stress Engine outputs and Gamification.
> - **Header:** Athlete name, Avatar, and a "Cinturón Azul" badge (Belt System loop). Include a top horizontal scroll for "Píldoras" (Daily tips).
> - **Stress Engine Metrics:** Oversized "Readiness Score" (78/VERDE) using Space Grotesk inside a glowing ring.
> - **Performance Metrics:** "OLY Index" block showing a score of 7.4 (Top 23%). Active "Racha" (Streak) showing 14 days.
> - **Gamification:** Belt Progress bar (88,400 / 100,000 XP towards Purple Belt).
> - **Next Mission:** A "Session of the day" summary block showing the Macrocycle (Colombian 5D) and an "Iniciar Sesión" heavy CTA button.

---

## 3. Pantalla: Session Preview (B4 - The Briefing)
**Prompt:**
> Generate a "Session Preview" mobile screen for an Olympic Weightlifter in HolyOly.
> - **Hero Section:** "Colombiano 5D - Fuerza Máxima" with glassmorphism statistic pills: Estimated Time (75 min), Blocks (5), Intensity (85%).
> - **Tactical Coach Note:** A highlighted box with an orange accent containing the Coach's tactical instruction for the day.
> - **Exercise List:** Vertical list of exercises (e.g., Arrancada, Dos Tiempos). Show sets and reps with target weight calculated by 1RM (e.g., "5x3 @ 80kg - 85% 1RM"). Highlight main lifts with a gold star.
> - **Action:** A sticky bottom area fading to black with a massive green "Comenzar Sesion" block button.

---

## 4. Pantalla: Active Session (B6 - Tactical Logging)
**Prompt:**
> Generate a highly focused "Active Session" screen for HolyOly. 
> - **Header:** Progress bar (Exercise 1 of 5) and a large tactical timer (34:12) in Space Grotesk.
> - **Active Block:** "Arrancada" (Snatch). Show Current 1RM (94 kg).
> - **Gamification Alert:** A glowing "PR Flash" (Personal Record) card indicating a new PR was hit during Set 3. Use Holy Gold (#F59E0B).
> - **Logging Loop:** A grid-like list of sets showing [Set Number], [Weight], [Reps]. Past sets have a check. The active set is highlighted.
> - **Interaction:** Inputs have "Ghost Borders" that activate on focus. Include a "Siguiente Ejercicio" monolithic button.

---

## 5. Pantalla: RPE & Smart Victory (B7 - Adaptation & XP)
**Prompt:**
> Generate a "Session Summary & Victory Screen" for HolyOly.
> - **RPE Check-in:** A bottom drawer asking for "RPE de este bloque" (1 to 10 scale). 
> - **Victory Identity:** The "Smart Victory / Longevity Protocol" view using Holy Cyan colors. The main message: "Hoy ganaste la batalla contra tu ego." 
> - **Metrics:** Large digital blocks showing "Daño Evitado: +18%" and "Adherencia: 100%".
> - **Gamification Panel:** XP breakdown logic (Sesión +100, Damage Control +200, Streak +50) summing to a glowing +350 XP.
> - **Social CTA:** A heavy button to "Compartir Smart Card".

---

## 6. Pantalla: Coach Command Center (C1 - The Radar)
**Prompt:**
> Generate a "Coach Command Center" for HolyOly handling 45 athletes. 
> - **Dashboard Stats:** Top strip showing (45 Atletas, 12 Premium, 94% Longevidad) in Cyan.
> - **Risk Radar (Session Adaptation Engine):**
>   - **Riesgo Alto Section:** Athletes with red glowing outlines. Show "Readiness 22", "Overreaching" tags, and AI diagnosis ("4h sueño, Dolor rodilla").
>   - **IA Suggestion Modal Prompt:** Include an overlay suggestion from the AI: "Change Snatch to Power Snatch, reduce load -15%".
> - **Pulse Engine Action:** A block suggesting an Anaerobic protocol (AirBike) for 3 athletes missing conditioning.
> - **Aesthetic:** Surgical precision, dark grey layers, military HUD feel.
