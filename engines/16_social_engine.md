# 16. Social Engine — Shareable Athletic Cards & Viral Mechanics

**Purpose:** Generate shareable cards for Instagram/WhatsApp to create viral moments and community engagement

**Status:** Gamification + virality driver  
**Update Frequency:** On demand (when PR/milestone achieved)  
**Performance:** O(1) card generation

---

## Overview

When athletes achieve PRs, hit milestones, or win challenges, Social Engine generates beautiful shareable cards that drive virality. Friends see the cards, get motivated, train harder.

---

## Card Types

### 1. PR Card (Personal Record)

```json
{
  "card_type": "pr",
  "title": "New Personal Record!",
  "athlete_name": "João",
  "achievement": "Snatch 145kg",
  "previous_pr": "140kg",
  "improvement": "+5kg",
  "improvement_pct": "+3.6%",
  "date": "2026-04-10",
  "photo_url": "session_photo.jpg",
  "club": "Olympic Strikers",
  "template": "modern_gradient_blue",
  "sharing_prompt": "Crushed my PR today! 💪 145kg Snatch. Who's next?"
}
```

**Visual:**
```
╔════════════════════════════════════╗
║  🏋️ NEW PERSONAL RECORD           ║
║                                    ║
║  João                              ║
║                                    ║
║  SNATCH: 145kg                     ║
║  Previous: 140kg  +5kg (+3.6%)    ║
║                                    ║
║  [Athlete Photo]                   ║
║                                    ║
║  Olympic Strikers                  ║
║  2026-04-10                        ║
╚════════════════════════════════════╝
```

### 2. Club Entry Card (Strength Club)

```json
{
  "card_type": "club_entry",
  "athlete_name": "Maria",
  "club_name": "150kg Clean Club",
  "club_threshold": "150kg",
  "achievement_lift": "150kg Clean & Jerk",
  "date": "2026-04-10",
  "club_members": 12,
  "template": "gold_badge",
  "sharing_prompt": "I just joined the 150kg Club! 🥇 Welcome to the elite!"
}
```

**Visual:**
```
╔════════════════════════════════════╗
║  🥇 CLUB ACHIEVEMENT               ║
║                                    ║
║  Maria                             ║
║                                    ║
║  JOINED THE                        ║
║  150kg Clean Club                  ║
║                                    ║
║  150kg C&J                         ║
║  (12 members strong)               ║
║                                    ║
║  2026-04-10                        ║
╚════════════════════════════════════╝
```

### 3. Belt Promotion Card

```json
{
  "card_type": "belt_promotion",
  "athlete_name": "Carlos",
  "old_belt": "Yellow",
  "new_belt": "Orange",
  "date": "2026-04-10",
  "template": "gradient_orange",
  "sharing_prompt": "Orange Belt achieved! 🟠 The journey continues..."
}
```

### 4. Streak Milestone Card

```json
{
  "card_type": "streak",
  "athlete_name": "Helena",
  "milestone_days": 90,
  "current_streak": 90,
  "template": "fire_animation",
  "sharing_prompt": "90 DAYS STRAIGHT! 🔥 Consistency is everything."
}
```

### 5. Challenge Victory Card

```json
{
  "card_type": "challenge_victory",
  "athlete_name": "Kristina",
  "challenge_name": "EMOM 12 min: Weighted Pull-ups",
  "result": "8 rounds",
  "rank": "#1 in club",
  "xp_earned": 425,
  "template": "modern_blue",
  "sharing_prompt": "Dominated the Pulse Challenge this week! 🎯"
}
```

---

## Viral Mechanic

### Head-to-Head Comparison Card

```json
{
  "card_type": "head_to_head",
  "athlete_1": {
    "name": "João",
    "snatch": 145,
    "status": "just achieved"
  },
  "athlete_2": {
    "name": "Carlos (friend)",
    "snatch": 140,
    "status": "current"
  },
  "message": "João beat Carlos by 5kg!",
  "call_to_action": "Carlos, time to lift heavier 💪",
  "sharing_url": "app.holyoly.com/challenge/carlos"
}
```

**Viral Loop:**
```
João achieves 145kg Snatch
  → Card shows: "Beat Carlos by 5kg!"
  → Shares to WhatsApp
  → Carlos sees: "João just beat you!"
  → Motivation spike
  → Carlos trains harder
  → Carlos achieves 148kg (new PR)
  → Loop restarts
```

---

## Card Generation & Sharing

### Step 1: Detect Achievement

```javascript
async function onSessionCompleted(athleteId, sessionId) {
  const session = await prisma.macrocycleSession.findUnique(...);
  
  for (const exercise of session.exercises) {
    // Check if this is new PR
    const oldPR = await getOldPR(athleteId, exercise.id);
    const newWeight = session.recordedWeight;
    
    if (newWeight > oldPR.weight) {
      // New PR! Generate card
      const card = await generatePRCard(athleteId, exercise, newWeight, oldPR);
      await notifyAthlete(athleteId, card);
    }
  }
  
  // Check if club entry achieved
  const clubs = await getApplicableClubs(athleteId, exercise, newWeight);
  for (const club of clubs) {
    const card = await generateClubEntryCard(athleteId, club);
    await notifyAthlete(athleteId, card);
  }
}
```

### Step 2: Card Display & Sharing

```
┌─ Your New PR! ────────────────────┐
│                                    │
│  🏋️ SNATCH 145kg                  │
│  Previous: 140kg                   │
│                                    │
│  [Beautiful gradient card design]  │
│                                    │
│  [ Share to Instagram ]            │
│  [ Share to WhatsApp ]             │
│  [ Share to Friends ]              │
│  [ Save for Later ]                │
│                                    │
│  [ Keep Private ]                  │
│                                    │
└────────────────────────────────────┘
```

### Step 3: Share & Track

When athlete shares:
- Card includes unique sharing link
- Friends click link → see comparison vs them
- Friends invited to app
- Analytics track shares (viral coefficient)

---

## Card Templates (Visual Library)

```
Available Templates:
  • Modern Gradient (Blue, Green, Gold)
  • Fire Animation (Streaks)
  • Badge Gold (Club entries)
  • Minimalist (Clean look)
  • Dark Premium (Elite athletes)
  • Rainbow (Diversity themes)
```

Each template can be customized:
- Club colors/branding
- Custom background photos
- Athlete name positioning
- Font selection

---

## Coach Perspective

### Coach Can Create Custom Cards

```
Scenario: Coach celebrates team milestone

Coach Action:
  1. Click "Create Team Card"
  2. Title: "Best Week Ever!"
  3. Stats: "8 PRs, 5 club entries, 100% attendance"
  4. Design: Select "Gold Premium"
  5. Add team photo
  6. Publish

Result:
  Card shared with entire team
  Athletes can share to social media
  XP bonus for sharing (+50 XP)
```

---

## Analytics

### Social Engagement Tracking

```
SOCIAL METRICS (Last 30 Days)
═════════════════════════════════════════════

Cards Generated:
  PR Cards: 24 ✅
  Club Entry: 8
  Belt Promo: 3
  Streak Milestones: 15
  Total: 50 cards

Sharing Activity:
  Unique Shares: 38 (76% share rate)
  WhatsApp: 20 shares
  Instagram: 12 shares
  Direct Friends: 6 shares

Viral Metrics:
  Views per share: 8 avg
  Click-through rate: 35%
  App Installs from links: 4
  Friend invites accepted: 3

Trending Cards (Most Shared):
  1. "90-day streak" - 8 shares
  2. "Snatch 145kg" - 6 shares
  3. "Orange Belt" - 4 shares
```

---

## Opt-In/Opt-Out

Athletes can control:
- [ ] Share PRs automatically
- [ ] Share milestones automatically
- [ ] Enable head-to-head comparisons
- [ ] Which friends can see cards
- [ ] Club visibility (public/private)
- [ ] Anonymous sharing option

**Default:** Athletes must opt-in to each share (not auto-posted)

---

## Data Storage

```sql
CREATE TABLE "SocialCard" (
  "id" UUID PRIMARY KEY,
  "athleteId" UUID,
  "cardType" VARCHAR,       -- pr|club|belt|streak|challenge|custom
  "title" VARCHAR,
  "content" JSON,
  "templateId" VARCHAR,
  "generatedAt" TIMESTAMP,
  "sharedAt" TIMESTAMP,
  "shareCount" INT,
  "viewCount" INT
);

CREATE TABLE "CardShare" (
  "id" UUID PRIMARY KEY,
  "cardId" UUID,
  "platform" VARCHAR,       -- instagram|whatsapp|direct|link
  "sharedBy" UUID,
  "sharedAt" TIMESTAMP,
  "views" INT,
  "clicks" INT
);
```

---

## Integration Points

**Feeds Into:**
- **Notifications** → "Your PR card was shared X times!"
- **Gamification** → XP for sharing (+50)
- **Smart Coach** → Track social engagement as engagement metric

**Receives From:**
- **Session Log** → PR achievements
- **Gamification** → Belt/club/streak milestones
- **Club System** → Club entry thresholds

---

## Testing Checklist

- [ ] PR card generates when session weight > old PR
- [ ] Club entry card generates when threshold reached
- [ ] Belt promotion card generates on belt unlock
- [ ] Head-to-head card shows correct comparison
- [ ] Sharing links work and track views
- [ ] Analytics track shares per platform
- [ ] Athlete can opt-in/opt-out
- [ ] Coach can create custom cards
- [ ] Card templates render correctly

---

**Generated:** 2026-04-10  
**Source:** Extracted from social_engine.js  
**Integration Status:** ✅ Complete (sharing + analytics)
