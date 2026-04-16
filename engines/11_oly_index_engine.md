# 11. OLY Index Engine — Competitive Strength Ranking

**Purpose:** Normalize and rank athlete strength across bodyweights using international competition categories

**Status:** Core ranking system, feeds leaderboard + belt progression  
**Update Frequency:** Daily (after PR entry)  
**Performance:** O(1) lookup from cache

---

## Overview

Olympic weightlifting has 9 competition bodyweight categories. OLY Index normalizes strength across all bodyweights, enabling fair comparison of athletes lifting at different bodyweights.

**Formula:**
```
OLY_Index = (Snatch_PR_kg + Clean_Jerk_PR_kg) / Bodyweight_kg × category_factor
```

---

## Competition Categories

| Category | Weight Range | Category Factor |
|----------|--------------|-----------------|
| **55kg** | ≤55kg | 0.95 (females lighter) |
| **61kg** | 55-61kg | 0.98 |
| **67kg** | 61-67kg | 1.00 |
| **73kg** | 67-73kg | 1.02 |
| **81kg** | 73-81kg | 1.05 |
| **89kg** | 81-89kg | 1.07 |
| **96kg** | 89-96kg | 1.09 |
| **102kg** | 96-102kg | 1.10 |
| **109kg** | >102kg | 1.11 |

**Why Category Factor?**
- Lighter athletes (55kg) need smaller absolute weights to achieve high OLY Index
- Heavier athletes have gravity advantage but need proportionally more strength
- Category factor normalizes the playing field

---

## Calculation Examples

### Example 1: Lightweight (67kg)

```
Athlete: Maria
Bodyweight: 62kg (67kg category)
Snatch PR: 85kg
Clean & Jerk PR: 110kg

OLY_Index = (85 + 110) / 62 × 1.00
          = 195 / 62 × 1.00
          = 3.145 × 1.00
          = 3.145 (×100 for display: 314.5)

Ranking: Intermediate
```

### Example 2: Heavyweight (89kg)

```
Athlete: João
Bodyweight: 85kg (89kg category)
Snatch PR: 140kg
Clean & Jerk PR: 175kg

OLY_Index = (140 + 175) / 85 × 1.07
          = 315 / 85 × 1.07
          = 3.706 × 1.07
          = 3.965 (×100 for display: 396.5)

Ranking: Advanced (higher absolute lifts, but normalized category factor)
```

---

## Ranking Tiers

```
0-200      Novice           (beginner, <3 months)
200-300    Intermediate     (3-6 months)
300-400    Advanced         (6-12 months)
400-500    Elite            (12+ months, competition)
500+       Master/Legend    (rare, world-class)
```

---

## API Response

```json
{
  "athlete_id": "uuid",
  "bodyweight_kg": 85,
  "category": "89kg",
  "category_factor": 1.07,
  "snatch_pr_kg": 140,
  "clean_jerk_pr_kg": 175,
  "total_kg": 315,
  "oly_index": 396.5,
  "ranking": {
    "global_rank": 342,
    "global_percentile": 65,
    "club_rank": 5,
    "club_percentile": 92
  },
  "trend": {
    "change_last_month": 12.3,
    "change_rate": "+12.3 pts/month",
    "projection_3m": 433.4
  },
  "updated_at": "2026-04-10T15:22:00Z"
}
```

---

## Algorithm

### Step 1: Get Latest PRs

```javascript
async function getLatestPRs(athleteId) {
  const snatchPR = await prisma.rmRecord.findFirst({
    where: { athleteId, exercise: { name: { contains: 'Snatch' } }, isCurrent: true }
  });
  
  const cleanPR = await prisma.rmRecord.findFirst({
    where: { athleteId, exercise: { name: { contains: 'Clean & Jerk' } }, isCurrent: true }
  });
  
  return { snatchPR: snatchPR.weightKg, cleanPR: cleanPR.weightKg };
}
```

### Step 2: Calculate OLY Index

```javascript
function calculateOLYIndex(snatchKg, cleanKg, bodyweightKg, categoryFactor = 1.0) {
  const total = snatchKg + cleanKg;
  const index = (total / bodyweightKg) * categoryFactor;
  return Math.round(index * 10) / 10;  // 1 decimal place
}
```

### Step 3: Determine Ranking

```javascript
function getRanking(olyIndex) {
  if (olyIndex < 200) return "Novice";
  if (olyIndex < 300) return "Intermediate";
  if (olyIndex < 400) return "Advanced";
  if (olyIndex < 500) return "Elite";
  return "Master";
}
```

### Step 4: Global & Club Percentiles

```javascript
async function getPercentile(athleteId, olyIndex) {
  // Count how many athletes have lower OLY Index
  const betterCount = await prisma.olyIndex.count({
    where: { olyIndex: { gt: olyIndex } }
  });
  
  const totalAthletes = await prisma.athlete.count();
  const globalPercentile = Math.round((totalAthletes - betterCount) / totalAthletes * 100);
  
  // Same for club
  const athlete = await prisma.athlete.findUnique({ where: { id: athleteId }, select: { clubId } });
  const betterInClub = await prisma.olyIndex.count({
    where: { 
      athlete: { clubId: athlete.clubId },
      olyIndex: { gt: olyIndex }
    }
  });
  
  const clubSize = await prisma.athlete.count({ where: { clubId: athlete.clubId } });
  const clubPercentile = Math.round((clubSize - betterInClub) / clubSize * 100);
  
  return { globalPercentile, clubPercentile };
}
```

---

## Trend Calculation

### Monthly Progression

```javascript
async function getTrend(athleteId, timeframe_days = 30) {
  const today = new Date();
  const pastDate = new Date(today.getTime() - timeframe_days * 24 * 60 * 60 * 1000);
  
  // Get OLY Index from 30 days ago
  const oldIndex = await prisma.olyIndexHistory.findFirst({
    where: { athleteId, dateCalculated: { gte: pastDate, lte: today } },
    orderBy: { dateCalculated: 'asc' }
  });
  
  // Get current OLY Index
  const currentIndex = await prisma.olyIndex.findUnique({ where: { athleteId } });
  
  const change = currentIndex.value - oldIndex.value;
  const rate = (change / timeframe_days).toFixed(1);
  
  // Project 3 months if trend continues
  const projection_3m = currentIndex.value + (rate * 90);
  
  return {
    change_last_month: change.toFixed(1),
    rate_per_day: rate,
    rate_per_month: (rate * 30).toFixed(1),
    projection_3m: projection_3m.toFixed(1)
  };
}
```

---

## Leaderboard Integration

### Global OLY Index Leaderboard

```json
{
  "leaderboard_id": "global_oly_index_2026",
  "last_updated": "2026-04-10T01:00:00Z",
  "entries": [
    {
      "rank": 1,
      "athlete_name": "Kristina",
      "bodyweight_kg": 64,
      "category": "67kg",
      "oly_index": 512.3,
      "snatch": 110,
      "clean_jerk": 142,
      "total": 252,
      "club": "Olympic Academy"
    },
    {
      "rank": 2,
      "athlete_name": "João",
      "bodyweight_kg": 85,
      "category": "89kg",
      "oly_index": 496.5,
      "snatch": 140,
      "clean_jerk": 175,
      "total": 315,
      "club": "Olympic Strikers"
    }
  ]
}
```

---

## Belt Progression Integration

### OLY Index Requirement for Belts

```
White Belt:      OLY Index ≥ 150
Yellow Belt:     OLY Index ≥ 200
Orange Belt:     OLY Index ≥ 250
Green Belt:      OLY Index ≥ 300
Blue Belt:       OLY Index ≥ 350
Purple Belt:     OLY Index ≥ 400
Brown Belt:      OLY Index ≥ 450
Red Belt:        OLY Index ≥ 500
Gold Belt:       OLY Index ≥ 550 + other criteria
```

**System Check (Daily):**
```javascript
// If OLY Index improved to meet next belt requirement
if (newOLYIndex >= 350 && oldOLYIndex < 350) {
  // Athlete unlocked Blue Belt requirement
  // Coach can promote if other criteria also met
}
```

---

## Data Storage

```sql
CREATE TABLE "OLYIndex" (
  "id" UUID PRIMARY KEY,
  "athleteId" UUID UNIQUE,
  "bodyweightKg" DECIMAL,
  "snatchPrKg" DECIMAL,
  "cleanJerkPrKg" DECIMAL,
  "totalKg" DECIMAL,
  "category" VARCHAR,         -- "55kg", "61kg", "67kg", etc.
  "categoryFactor" DECIMAL,   -- 0.95 to 1.11
  "olyIndexValue" DECIMAL,    -- Calculated value
  "globalRank" INT,
  "globalPercentile" INT,
  "clubRank" INT,
  "clubPercentile" INT,
  "calculatedAt" TIMESTAMP,
  "updatedAt" TIMESTAMP
);

CREATE TABLE "OLYIndexHistory" (
  "id" UUID PRIMARY KEY,
  "athleteId" UUID,
  "dateCalculated" DATE,
  "olyIndexValue" DECIMAL,
  "snatchKg" DECIMAL,
  "cleanJerkKg" DECIMAL
);
```

---

## Cron Update (Daily at 01:00 UTC)

```javascript
async function updateOLYIndexDaily() {
  const athletes = await prisma.athlete.findMany();
  
  for (const athlete of athletes) {
    // Get current PRs
    const prs = await getLatestPRs(athlete.id);
    
    // Calculate new index
    const categoryFactor = getCategoryFactor(athlete.bodyweightKg);
    const newIndex = calculateOLYIndex(prs.snatch, prs.clean, athlete.bodyweightKg, categoryFactor);
    
    // Get percentiles
    const percentiles = await getPercentile(athlete.id, newIndex);
    
    // Store in history
    await prisma.olyIndexHistory.create({
      data: {
        athleteId: athlete.id,
        dateCalculated: new Date(),
        olyIndexValue: newIndex,
        snatchKg: prs.snatch,
        cleanJerkKg: prs.clean
      }
    });
    
    // Update main record
    await prisma.olyIndex.upsert({
      where: { athleteId: athlete.id },
      create: {
        athleteId: athlete.id,
        bodyweightKg: athlete.bodyweightKg,
        snatchPrKg: prs.snatch,
        cleanJerkPrKg: prs.clean,
        totalKg: prs.snatch + prs.clean,
        category: getCategory(athlete.bodyweightKg),
        categoryFactor,
        olyIndexValue: newIndex,
        globalRank: null,  // Recalculated below
        globalPercentile: percentiles.globalPercentile
      },
      update: {
        bodyweightKg: athlete.bodyweightKg,
        snatchPrKg: prs.snatch,
        cleanJerkPrKg: prs.clean,
        olyIndexValue: newIndex,
        globalPercentile: percentiles.globalPercentile,
        updatedAt: new Date()
      }
    });
  }
  
  // Recalculate global rankings
  const sorted = await prisma.olyIndex.findMany({ orderBy: { olyIndexValue: 'desc' } });
  for (let i = 0; i < sorted.length; i++) {
    await prisma.olyIndex.update({
      where: { id: sorted[i].id },
      data: { globalRank: i + 1 }
    });
  }
}
```

---

## Integration Points

**Feeds Into:**
- **Leaderboard Cache** → Global OLY Index rankings
- **Belt Engine** → OLY Index requirement for belt progression
- **Smart Coach** → Alerts based on improvement
- **Social Engine** → Shareable OLY Index improvement cards

**Receives From:**
- **RM Records** → Latest Snatch + C&J PRs
- **Athlete Profile** → Bodyweight, category

---

## Testing Checklist

- [ ] Category factor applied correctly per bodyweight
- [ ] OLY Index formula: (Snatch + Clean) / BW × factor
- [ ] Ranking tiers assigned correctly (Novice, Intermediate, etc.)
- [ ] Global percentile calculated correctly
- [ ] Club percentile isolated to club members
- [ ] Trend calculation accurate (change per day, month)
- [ ] Projection 3m assumes linear trend
- [ ] Daily cron recalculates all athletes
- [ ] History table records each daily update
- [ ] Leaderboard sorted descending by OLY Index

---

**Generated:** 2026-04-10  
**Source:** Extracted from leaderboard_engine.js + oly_index.js  
**Integration Status:** ✅ Complete (rankings + belt progression)
