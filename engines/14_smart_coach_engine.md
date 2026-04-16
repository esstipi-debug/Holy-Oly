# 14. Smart Coach Engine — Athlete Intelligence & Categorization

**Purpose:** Categorize athletes by experience/state and generate intelligent coaching alerts and recommendations

**Status:** Core engine for coach dashboard + automated notifications  
**Update Frequency:** Hourly (metric recalculation)  
**Performance:** O(n) where n = number of active athletes

---

## Overview

Smart Coach automatically categorizes each athlete and generates contextual alerts. Coaches see notifications without having to monitor manually.

**5 Primary Categories:**
1. **Novice** — <3 months, learning fundamentals
2. **Progressing** — 3-12 months, steady improvement
3. **Elite** — 12+ months, advanced training
4. **Injured** — Medical status (limited/no training)
5. **Burnout-Risk** — Low readiness + high load (overtraining)

---

## Categorization Logic

### Category: Novice

```
IF athlete.training_age < 3 months:
  → NOVICE

Characteristics:
  • Just started training
  • PRs improving rapidly
  • Technique inconsistent
  • Recovery needs high
  • Form focus > load focus

Coaching Emphasis:
  • Video form feedback
  • Technique consistency
  • Simple periodization
  • Recovery education
```

### Category: Progressing

```
IF 3 months <= athlete.training_age <= 12 months:
  → PROGRESSING

Characteristics:
  • Solid fundamentals
  • PRs still improving steadily
  • Ready for harder training
  • Consistent attendance
  • Learning adaptation

Coaching Emphasis:
  • Gradual intensity increases
  • Competition prep (friendly meets)
  • Nutrition guidance
  • Mental training introduction
```

### Category: Elite

```
IF athlete.training_age > 12 months AND oly_index > 350:
  → ELITE

Characteristics:
  • Advanced technique
  • PRs growing slowly (requires precision)
  • Consistent high performance
  • Competition-ready
  • Self-motivated

Coaching Emphasis:
  • Competition peaking
  • Individual customization
  • Sports psychology
  • Small technical refinements
```

### Category: Injured

```
IF athlete.medical_status == "injured" OR injury_flagged:
  → INJURED

Characteristics:
  • Limited/no training allowed
  • Mobility + rehab focus
  • Clearance needed from coach
  • Return-to-training plan

Coaching Emphasis:
  • Mobility work
  • Pain-free ranges
  • Return-to-training progression
  • Psychological support
```

### Category: Burnout-Risk

```
IF readiness < 40 FOR 3+ consecutive days 
   AND (load_last_7d > normal OR streak_broken):
  → BURNOUT-RISK

Characteristics:
  • Exhausted despite training
  • Motivation dropping
  • Could be overtraining
  • Needs intervention

Coaching Emphasis:
  • Mandatory deload
  • Lifestyle assessment
  • Recovery prioritization
  • Check-in conversation
```

---

## Alert Examples

### Alert 1: Low Readiness Pattern

```
Athlete: João
Status: ⚠️ BURNOUT-RISK
Trigger: Low readiness (< 40) for 3 consecutive days

Alert Message:
"João's readiness has been low for 3 days (35, 38, 42). 
He's done 7/7 sessions this week. Recommend deload week."

Coach Actions:
[1] Suggest deload
[2] Check in on lifestyle
[3] Review sleep/stress
```

### Alert 2: High Consistency

```
Athlete: Maria
Status: ✅ ELITE
Trigger: 5/5 sessions completed, readiness stable (65+)

Alert Message:
"Maria's been consistent (5/5 sessions) with good readiness. 
Can increase intensity this week if she wants PR attempt."

Coach Actions:
[1] Increase macrocycle load
[2] Plan PR test day
[3] Acknowledge hard work
```

### Alert 3: Streak Milestone

```
Athlete: Helena
Status: ✅ PROGRESSING
Trigger: 30-day streak reached

Alert Message:
"Helena has trained 30 consecutive days! 
No mandatory rest, but offer deload week option."

Coach Actions:
[1] Celebrate milestone
[2] Explain benefits of planned recovery
[3] Adjust program if needed
```

### Alert 4: Form Degradation

```
Athlete: Carlos
Status: ⚠️ NOVICE
Trigger: 2 sessions in row marked "form poor" + readiness < 50

Alert Message:
"Carlos reports poor form in last 2 sessions (readiness 45-48). 
Recommend technique focus day + rest day."

Coach Actions:
[1] Record form feedback
[2] Schedule tech session
[3] Reduce load next session
```

### Alert 5: PR Opportunity

```
Athlete: Kristina
Status: ✅ ELITE
Trigger: OLY Index improved 15+ pts, readiness > 70, in peaking phase

Alert Message:
"Kristina's in peak form (readiness 78, OLY +15pts). 
Schedule max attempt day this week."

Coach Actions:
[1] Plan PR test
[2] Prepare athlete mentally
[3] Record video
```

---

## Algorithm

### Hourly Recalculation (Cron)

```javascript
async function recalculateAthleteCategories() {
  const athletes = await prisma.athlete.findMany();
  
  for (const athlete of athletes) {
    // Get metrics
    const readiness = await getLatestReadiness(athlete.id);
    const last3_readiness = await getReadiness(athlete.id, 3);
    const sessions_week = await getSessionsCompleted(athlete.id, 7);
    const trainingAge = calculateTrainingAge(athlete.createdAt);
    const olyIndex = await getOLYIndex(athlete.id);
    const load_week = await getTrainingLoad(athlete.id, 7);
    const normal_load = await getAverageLoad(athlete.id, 30);
    
    // Determine category
    let category;
    let alerts = [];
    
    // Injured overrides all
    if (athlete.medicalStatus === "injured") {
      category = "injured";
      alerts.push({ type: "injury", severity: "high" });
    }
    // Burnout check
    else if (last3_readiness.filter(r => r < 40).length >= 3 && load_week > normal_load) {
      category = "burnout_risk";
      alerts.push({ type: "overtraining", severity: "high" });
    }
    // Elite if 12+ months + high index
    else if (trainingAge >= 12 && olyIndex > 350) {
      category = "elite";
    }
    // Progressing if 3-12 months
    else if (trainingAge >= 3 && trainingAge < 12) {
      category = "progressing";
    }
    // Novice if <3 months
    else {
      category = "novice";
    }
    
    // Update athlete category
    await prisma.athlete.update({
      where: { id: athlete.id },
      data: {
        smartCoachCategory: category,
        lastCategoryRecalc: new Date()
      }
    });
    
    // Generate alerts
    for (const alert of generateAlerts(athlete, category, metrics)) {
      await prisma.notification.create({
        data: {
          userId: athlete.coachId,
          type: alert.type,
          title: alert.title,
          body: alert.message,
          severity: alert.severity
        }
      });
    }
  }
}
```

---

## Coach Dashboard View

### Athlete Status Overview

```
SMART COACH DASHBOARD
═══════════════════════════════════════════════════════

NOVICE (Learning Phase)
┌─ Carlos (0.5m) ────────────────────────────────────┐
│ Readiness: 45 ⚠️ (low) | Streak: 3 | Load: Normal  │
│ Alert: Form degradation last 2 sessions             │
│ Action: Schedule technique session, reduce load     │
└────────────────────────────────────────────────────┘

PROGRESSING (Steady Improvement)
┌─ Maria (6m) ────────────────────────────────────────┐
│ Readiness: 68 ✅ | Streak: 15 | Load: Normal        │
│ No alerts. Consistent training. Keep as-is.         │
└────────────────────────────────────────────────────┘
┌─ Helena (8m) ───────────────────────────────────────┐
│ Readiness: 55 ⚠️ | Streak: 30 ⭐ | Load: +10%      │
│ Alert: 30-day streak! Offer deload week option      │
│ Action: Celebrate, explain recovery benefits        │
└────────────────────────────────────────────────────┘

ELITE (Advanced)
┌─ Kristina (24m) ────────────────────────────────────┐
│ Readiness: 78 ✅✅ | Streak: 22 | Load: Normal      │
│ Alert: Peak form + OLY +15pts. PR opportunity!      │
│ Action: Schedule max attempt, prepare mentally      │
└────────────────────────────────────────────────────┘

BURNOUT-RISK (Intervention Needed)
┌─ João (14m) ────────────────────────────────────────┐
│ Readiness: 38 🔴 | Streak: 7/7 | Load: +25%        │
│ Alert: 3 consecutive low readiness days + overload  │
│ Action: MANDATORY deload week, lifestyle assessment │
└────────────────────────────────────────────────────┘

INJURED (Recovery)
┌─ None currently ────────────────────────────────────┐
└────────────────────────────────────────────────────┘
```

---

## Bulk Actions by Category

### Smart Coach Can Batch Actions

```javascript
// If 3+ athletes in "burnout_risk" this week
if (burnout_risk_count > 3) {
  // Recommendation: "Multiple athletes overtraining. 
  // Consider club-wide deload week."
}

// If 80%+ compliance in "progressing" 
if (progressing_compliance > 0.8) {
  // Recommendation: "High compliance in Progressing group.
  // Can increase macrocycle intensity."
}

// If all "elite" athletes performing well
if (elite_readiness_avg > 70) {
  // Recommendation: "Elite athletes in great form.
  // Plan competition/test week."
}
```

---

## Data Storage

```sql
CREATE TABLE "SmartCoachRecord" (
  "id" UUID PRIMARY KEY,
  "athleteId" UUID,
  "category" VARCHAR,               -- novice|progressing|elite|injured|burnout_risk
  "categoryChangedAt" TIMESTAMP,
  "lastReadiness" INT,
  "last3DaysReadiness" JSON,        -- [65, 60, 55]
  "sessionsThisWeek" INT,
  "burnoutRiskScore" DECIMAL,       -- 0-100 (how close to burnout)
  "recommendedAction" VARCHAR,
  "lastRecalcAt" TIMESTAMP
);
```

---

## Integration Points

**Feeds Into:**
- **Coach Dashboard** → Category display + alerts
- **Notifications** → Coach gets action items
- **Session Adaptation** → Category affects recommendations

**Receives From:**
- **Stress Engine** → Readiness data
- **Session Log** → Completion data
- **Athlete Profile** → Training age, injury status

---

## Testing Checklist

- [ ] Novice category assigned correctly (< 3 months)
- [ ] Progressing category assigned correctly (3-12 months)
- [ ] Elite category assigned correctly (12+ months + OLY > 350)
- [ ] Burnout-risk triggers on 3 consecutive low readiness days
- [ ] Injured status overrides all categories
- [ ] Alerts generate for each condition
- [ ] Coach dashboard displays all categories
- [ ] Bulk actions work across multiple athletes
- [ ] Hourly cron updates correctly

---

**Generated:** 2026-04-10  
**Source:** Extracted from smart_coach_engine.js  
**Integration Status:** ✅ Complete (dashboard + notifications)
