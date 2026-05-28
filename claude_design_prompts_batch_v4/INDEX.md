# Batch v4 · Master INDEX · 43 prompts Claude Design

> Generado: 2026-05-27 · Status: ready para envío a Claude Design (1 chat por prompt)

## Workflow recomendado

1. **Abrir [00_CONTEXTO_COMPARTIDO.md](00_CONTEXTO_COMPARTIDO.md)** y copiar al portapapeles
2. **Iniciar chat nuevo en Claude Design**
3. **Pegar contexto compartido** + el prompt específico del bloque
4. **Esperar generación** (HTML + CSS + JSX)
5. **Bajar zip** del proyecto
6. **Pasarme el zip** → yo porto a TSX en `frontend/src/pages/v3/`
7. **Repetir** con siguiente prompt

---

## 43 prompts organizados por archivo

### [01_AUTH_ONBOARDING.md](01_AUTH_ONBOARDING.md) · 5 prompts
- [ ] 01 · Landing (selector producto)
- [ ] 02 · Login
- [ ] 03 · Register (atleta)
- [ ] 04 · Onboarding Wizard (4 pasos)
- [ ] 05 · Premium paywall

### [02_HO_ATLETA.md](02_HO_ATLETA.md) · 18 prompts
**Stats (5):**
- [ ] 06 · OLY Index detail
- [ ] 07 · HoStats · halterofilia stats
- [ ] 08 · PerformanceDeepDive
- [ ] 09 · MovementProgression
- [ ] 10 · Profile (atleta + coach · 3 secciones críticas)

**Sesión (5):**
- [ ] 11 · SessionSchedule (calendario)
- [ ] 12 · WarmupGenerator
- [ ] 13 · ActiveSession (timer + sets + RPE)
- [ ] 14 · SessionSummaryPreview
- [ ] 15 · VictoryScreen (PR celebration)

**Wellness (4):**
- [ ] 16 · HormonalSetup
- [ ] 17 · BaselineAssessment
- [ ] 18 · KnowledgePills
- [ ] 19 · BeltCeremony refresh

**Social (4):**
- [ ] 20 · SocialCard
- [ ] 21 · SocialCardsGallery
- [ ] 22 · Leaderboard
- [ ] 23 · PulseHub (anaeróbico)

### [03_HO_COACH.md](03_HO_COACH.md) · 6 prompts
- [ ] 24 · CommandCenter · Coach HO Dashboard
- [ ] 25 · AthleteDeepDive
- [ ] 26 · AssignMacrocycle con Gantt timeline
- [ ] 27 · NewAthlete (form alta)
- [ ] 28 · CoachViralTools
- [ ] 29 · PrewodShare

### [04_VOLTA.md](04_VOLTA.md) · 10 prompts
**Volta Atleta (6):**
- [ ] 30 · VoltaDashboard (home Volta)
- [ ] 31 · VoltaPreWod (readiness)
- [ ] 32 · VoltaWarmup (Mayhem 3 fases)
- [ ] 33 · VoltaActiveWod (timer + reps live)
- [ ] 34 · VoltaWodSummary
- [ ] 35 · VoltaStats

**Volta Coach (4):**
- [ ] 36 · VoltaCoachDash
- [ ] 37 · VoltaCoachWod (builder)
- [ ] 38 · VoltaCoachMacro
- [ ] 39 · VoltaCoachInventory

### [05_COMPONENTES.md](05_COMPONENTES.md) · 4 prompts
- [ ] 40 · Alert Detail · BOTTOM SHEET DRAWER
- [ ] 41 · Notification Center
- [ ] 42 · Wearable Sync Card
- [ ] 43 · LogWodResult modal

---

## Estado portados v2 (3 ya hechos · drop anterior)

- [x] HolyOlyCatalogV2 · accesible `#ho_macro_catalog`
- [x] HolyOlyDetailV2 · accesible `#ho_macro_detail`
- [x] Plate Stack + Plate Badge components (wrappers ya existían)

Pendientes del drop anterior (no batch v4):
- [ ] HolyOlyMacrocycleAthlete (Atleta vista de su macro)
- [ ] VoltaMacrocycle
- [ ] Control de Daños
- [ ] AtletaHome V3 (refresh)
- [ ] CoachDash V3 (refresh)
- [ ] DailyCheckin V3 (refresh)
- [ ] SkillTree V3 (refresh)
- [ ] AthleteCard component

---

## Prioridad de envío sugerido

### Ola 1 · Demo flow (8 prompts críticos · 1 semana)
01 · 02 · 03 · 04 → Auth + Onboarding
06 · 10 · 11 · 13 → Atleta core sesión

### Ola 2 · Atleta completo (10 prompts · 1 semana)
05 · 07 · 08 · 09 · 12 · 14 · 15 · 16 · 17 · 19

### Ola 3 · Social + wellness (4 prompts · 3 días)
18 · 20 · 21 · 22 · 23

### Ola 4 · Coach (6 prompts · 1 semana)
24 · 25 · 26 · 27 · 28 · 29

### Ola 5 · Volta (10 prompts · 1.5 semanas)
30 · 31 · 32 · 33 · 34 · 35 · 36 · 37 · 38 · 39

### Ola 6 · Componentes (4 prompts · 3 días)
40 · 41 · 42 · 43

**Total estimado:** ~5 semanas calendario distribuido · ~30h trabajo mío total

---

## Notas para Boss

- Cada chat de Claude Design genera **1 zip · pasámelo en sesiones nuevas**
- Para mantener coherencia visual: **NO mezclar 2 prompts en 1 chat**
- Si Claude Design ofrece variations, **pedile la que sigue style FIFA/Strava híbrido del contexto**
- Si algo no encaja con la spec, **decime · yo ajusto el prompt antes de re-enviar**
