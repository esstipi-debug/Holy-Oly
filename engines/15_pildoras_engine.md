# 15. Píldoras Engine — Daily Coaching Tips

**Purpose:** Deliver context-aware daily coaching tips (technique, recovery, mentality, periodization)

**Status:** Gamification + notification system  
**Update Frequency:** Daily (generated once per day)  
**Performance:** O(1) tip selection

---

## Overview

Píldoras (Spanish for "pills" — small doses of wisdom) are short daily tips delivered to athletes at optimal times. Each tip is context-aware: different for different athletes based on their phase, readiness, streak, etc.

---

## Tip Categories

### 1. Technique Tips

```json
{
  "category": "technique",
  "format": "Video link + 30-second coaching cue",
  "examples": [
    {
      "title": "Perfect Your Snatch Position",
      "video_link": "youtube.com/watch?v=xyz",
      "cue": "Keep bar close from floor to knees. Shift shoulders slightly forward.",
      "when": "In peaking phase AND readiness > 60"
    },
    {
      "title": "Clean Foot Placement",
      "video_link": "youtube.com/watch?v=abc",
      "cue": "Feet move out ~12 inches wider. Landing must be stable.",
      "when": "Novice athlete OR form flagged in last 2 sessions"
    }
  ]
}
```

### 2. Recovery Tips

```json
{
  "category": "recovery",
  "format": "Science-backed sleep/nutrition advice",
  "examples": [
    {
      "title": "Sleep 8+ Hours Tonight",
      "message": "Your readiness is low (38). Aim for 8-10 hours sleep. It's the best recovery tool.",
      "when": "readiness < 40"
    },
    {
      "title": "Protein + Carbs Post-Session",
      "message": "Right after training: 30g protein + 60g carbs. Within 30 minutes for best recovery.",
      "when": "After high-intensity session OR low readiness"
    },
    {
      "title": "Hydration Check",
      "message": "You've trained hard. Drink water for 2 hours post-session. Check urine color (should be pale).",
      "when": "After session"
    }
  ]
}
```

### 3. Mentality Tips

```json
{
  "category": "mentality",
  "format": "Motivation + mindset coaching",
  "examples": [
    {
      "title": "You're Building Unstoppable Habits",
      "message": "15-day streak! You're not just getting stronger — you're building discipline. That's gold.",
      "when": "streak >= 7 AND streak % 7 == 0"
    },
    {
      "title": "Failure is Progress",
      "message": "Missed that rep today? That's where growth happens. Champions embrace discomfort.",
      "when": "After failed attempt"
    },
    {
      "title": "Celebrate Small Wins",
      "message": "You nailed your technique today. That's progress. Don't wait for 1RMs to celebrate.",
      "when": "Good session + form noted as good"
    }
  ]
}
```

### 4. Periodization Tips

```json
{
  "category": "periodization",
  "format": "Phase-specific training guidance",
  "examples": [
    {
      "title": "You're in Peaking Phase",
      "message": "This week: heavy singles, lots of rest between sets. Save energy for competition.",
      "when": "in peaking phase"
    },
    {
      "title": "Power Phase Coming Up",
      "message": "Next week shifts to explosive work. Prepare mentally for 3-5 rep sets at 75-85%.",
      "when": "1 week before power phase"
    },
    {
      "title": "Deload Week: Active Recovery",
      "message": "This is deload week. 50-70% loads, technique focus, mobility work. Recovery is the goal.",
      "when": "in deload week"
    }
  ]
}
```

---

## Selection Algorithm

### Step 1: Determine Context

```javascript
function getDailyPildora(athlete) {
  const context = {
    readiness: await getReadiness(athlete.id),
    phase: getMacrocyclePhase(athlete.id),
    streak_days: await getStreak(athlete.id),
    last_session_form: await getLastSessionForm(athlete.id),
    last_session_type: await getLastSessionType(athlete.id),
    category: await getSmartCoachCategory(athlete.id),
    time_of_day: getCurrentTime()
  };
  
  return context;
}
```

### Step 2: Match Tip to Context

```javascript
function selectPildora(context) {
  const candidates = [];
  
  // Low readiness → recovery tips
  if (context.readiness < 40) {
    candidates.push(...getRecoveryTips());
  }
  
  // Peaking phase → competition/technique tips
  if (context.phase === 'peaking') {
    candidates.push(...getTechniqueTips());
    candidates.push(...getMentalityTips());
  }
  
  // Streak milestones → mentality motivation
  if (context.streak_days % 7 === 0 && context.streak_days > 0) {
    candidates.push(...getMentalityTips());
  }
  
  // Good form → celebrate
  if (context.last_session_form === 'good') {
    candidates.push(...getMentalityTips('positive'));
  }
  
  // Novice category → technique focus
  if (context.category === 'novice') {
    candidates.push(...getTechniqueTips('beginner'));
  }
  
  // Select random from candidates
  return selectRandom(candidates);
}
```

### Step 3: Deliver at Optimal Time

```javascript
// Morning: Mentality + periodization (prep for training)
// Pre-workout: Technique (right before session)
// Post-workout: Recovery (right after training)
// Evening: Sleep tips (before bed)

function selectDeliveryTime(athlete, pildora_type) {
  if (athlete.typically_trains_morning) {
    return "06:30 AM (before training)";
  } else {
    return "05:30 PM (before evening training)";
  }
}
```

---

## Response Format

```json
{
  "pildora_id": "pildora_2026_04_10_001",
  "title": "Sleep 8+ Hours Tonight",
  "category": "recovery",
  "message": "Your readiness is low (38). Aim for 8-10 hours sleep. It's your best recovery tool.",
  "video_link": null,
  "cue": "Consistent sleep schedule beats quantity. Go to bed at the same time nightly.",
  "action_link": null,
  "xp_if_confirmed": 50,
  "delivery_time": "2026-04-10T21:00:00Z",
  "athlete_id": "uuid"
}
```

---

## Athlete Interaction

### View Daily Píldora

```
┌─ Daily Coaching Píldora ──────────────┐
│                                        │
│  "Perfect Your Snatch Position"        │
│                                        │
│  [Video: 30-second tip]                │
│                                        │
│  Cue: "Keep bar close from floor      │
│  to knees. Shift shoulders slightly    │
│  forward."                             │
│                                        │
│  [ ✓ I'll do this ] [ Later ] [ Skip ] │
│                                        │
│  ⭐ +50 XP if you confirm             │
│                                        │
└────────────────────────────────────────┘
```

### Action: Athlete Confirms

When athlete confirms píldora:
- +50 XP awarded immediately
- Notification to coach: "Maria confirmed technique tip"
- Streak counter increments (if applicable)
- Technique logged for that session

---

## Coach Perspective

### Coach Can Generate Custom Píldoras

```
Scenario: Coach sees athlete struggling with form

Coach Action:
  1. Click "Generate Custom Píldora"
  2. Select athlete: João
  3. Category: Technique
  4. Topic: Snatch footwork
  5. Add cue: "Your feet aren't moving enough. Need 12-14 inch shift."
  6. Attach video: [Coach's own demo or YouTube link]
  7. Schedule: Tomorrow morning
  8. Send

Result:
  João gets personalized tip from his coach
  +100 XP when confirmed (coach content = more XP)
```

---

## Analytics

### Coach Can See Píldora Impact

```
PÍLDORA ENGAGEMENT (Last 30 Days)
═════════════════════════════════════════

Category Distribution:
  • Technique: 30%
  • Recovery: 35%
  • Mentality: 25%
  • Periodization: 10%

Confirmation Rate: 72%  ✅ (Good engagement)
  Athletes confirming: 18/25
  Avg XP per athlete: +360 this month

Top Performing Tips:
  1. "Sleep 8+ Hours" - 91% confirmation
  2. "You're building habits" - 88% confirm
  3. "Perfect Snatch position" - 82% confirm

Least Engaged:
  1. "Clean grip RDL form" - 34% confirm
     → Athlete understanding low?

Recommendation: Try video format for technical tips
```

---

## Data Storage

```sql
CREATE TABLE "Pildora" (
  "id" UUID PRIMARY KEY,
  "title" VARCHAR,
  "category" VARCHAR,       -- technique|recovery|mentality|periodization
  "message" TEXT,
  "videoLink" VARCHAR,
  "coachingCue" TEXT,
  "createdByCoachId" UUID,  -- null = system generated
  "isCustom" BOOLEAN,
  "createdAt" TIMESTAMP
);

CREATE TABLE "PildoraDelivery" (
  "id" UUID PRIMARY KEY,
  "athleteId" UUID,
  "pildoraId" UUID,
  "deliveryTime" TIMESTAMP,
  "deliveredAt" TIMESTAMP,
  "status" VARCHAR,         -- pending|delivered|confirmed|skipped
  "xpAwarded" INT,
  "confirmTime" TIMESTAMP
);
```

---

## Cron: Daily Píldora Generation (Every Day at 09:00 UTC)

```javascript
async function generateDailyPildoras() {
  const athletes = await prisma.athlete.findMany();
  
  for (const athlete of athletes) {
    const context = await getDailyPildoraContext(athlete.id);
    const pildora = selectPildora(context);
    const deliveryTime = selectDeliveryTime(athlete, pildora.category);
    
    await prisma.pildoraDelivery.create({
      data: {
        athleteId: athlete.id,
        pildoraId: pildora.id,
        deliveryTime,
        status: 'pending'
      }
    });
    
    // Schedule notification at delivery time
    scheduleNotification(athlete.id, pildora, deliveryTime);
  }
}
```

---

## Integration Points

**Feeds Into:**
- **Gamification Engine** → XP rewards (+50 for confirmation)
- **Notifications** → Delivered as push notifications
- **Social** → Can share tips (if athlete likes them)

**Receives From:**
- **Stress Engine** → Readiness determines tip type
- **Macrocycle Engine** → Phase determines tip relevance
- **Session Log** → Form + performance determine tips

---

## Testing Checklist

- [ ] Context detection works (readiness, phase, streak)
- [ ] Tip selection algorithm matches context appropriately
- [ ] Recovery tips appear when readiness < 40
- [ ] Technique tips appear in peaking phase
- [ ] Mentality tips on streak milestones
- [ ] XP awarded when athlete confirms
- [ ] Coach can generate custom píldoras
- [ ] Delivery time scheduled correctly
- [ ] Analytics track confirmation rates

---

**Generated:** 2026-04-10  
**Source:** Extracted from pildoras_engine.js  
**Integration Status:** ✅ Complete (daily delivery + XP)
