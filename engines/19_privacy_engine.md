# 19. Privacy Engine — Data Access Control

**Purpose:** Manage what data coaches/athletes/admins can see based on access tiers

**Status:** Core security system  
**Update Frequency:** Per relationship change  
**Performance:** O(1) permission lookup (cached)

---

## Overview

Privacy Engine enforces data visibility based on 4 access tiers:
1. **Solo** — Self only (no coach)
2. **Coached** — Coach + self
3. **Club** — Club members + coach + self
4. **Admin** — All athletes (system)

---

## Access Tiers

### Tier 1: Solo (Self Only)

```json
{
  "tier": "solo",
  "description": "Athlete trains alone, no coach",
  "readable_fields": [
    "metrics", "sessions", "readiness", "profile", "streaks", "xp", "achievements"
  ],
  "editable_fields": [
    "metrics", "profile", "lifestyle_log", "password"
  ],
  "visible_screens": [
    "dashboard", "metrics", "warmup", "session_log", "profile", "settings"
  ],
  "view_others": false
}
```

### Tier 2: Coached (Coach + Self)

```json
{
  "tier": "coached",
  "description": "Athlete has one coach",
  "coach_readable": [
    "readiness", "metrics", "macrocycle", "sessions", "lifestyle", "pre_check", "adaptation_suggestions", "rpe", "video"
  ],
  "coach_editable": [
    "macrocycle", "session_modifications", "alerts_created"
  ],
  "athlete_readable_from_coach": [
    "coaching_notes", "program_assignments", "alerts"
  ],
  "visible_to_coach_screens": [
    "athlete_dashboard", "metrics_detail", "session_history", "adaptation_log", "alerts"
  ]
}
```

**What Coach Can See:**
```
✅ Readiness & metrics
✅ Training sessions (exercises, weights, RPE)
✅ Macrocycle + periodization
✅ Pre-session checks
✅ Lifestyle factors
✅ Adaptation decisions
✅ Video recordings (if athlete uploads)
❌ Personal messages (only coaching notes)
❌ Billing information
❌ Other athletes' data
```

### Tier 3: Club (Club Members)

```json
{
  "tier": "club",
  "description": "Athletes in same club can see limited peer data",
  "peer_readable": [
    "name", "belt", "club_achievements", "streak_days", "xp_rank", "shared_pr_cards"
  ],
  "peer_editable": [],
  "hidden_from_peers": [
    "readiness", "metrics", "sessions", "macrocycle", "lifestyle", "messages"
  ]
}
```

**What Club Members Can See:**
```
✅ Names
✅ Belt levels
✅ Shared PR cards (if athlete opts-in)
✅ Club leaderboard rank
✅ Streak counts
✅ Club achievements
❌ Actual sessions
❌ Readiness data
❌ Personal metrics
❌ Macrocycle details
```

### Tier 4: Admin (System Wide)

```json
{
  "tier": "admin",
  "description": "System administrators only",
  "admin_readable": [
    "*"  // All data
  ],
  "admin_editable": [
    "user_suspension", "data_export", "compliance_reports"
  ]
}
```

---

## Implementation

### Permission Check Function

```javascript
async function canViewField(viewerId, targetAthleteId, field) {
  // Get relationship between viewer and athlete
  const relationship = await getRelationship(viewerId, targetAthleteId);
  
  // Self can see everything
  if (viewerId === targetAthleteId) return true;
  
  // Admin can see everything
  if (userRole(viewerId) === 'admin') return true;
  
  // Check tier-based permissions
  const tier = relationship.accessTier;
  const permissions = TIER_PERMISSIONS[tier];
  
  return permissions.readable_fields.includes(field);
}
```

### Middleware for API Routes

```javascript
// Express middleware
const requireFieldAccess = (field) => {
  return async (req, res, next) => {
    const viewerId = req.user.id;
    const targetAthleteId = req.params.athleteId;
    
    const hasAccess = await canViewField(viewerId, targetAthleteId, field);
    
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    next();
  };
};

// Usage
router.get('/athletes/:athleteId/metrics', 
  requireFieldAccess('metrics'),
  getAthleteMetrics
);
```

---

## Coach-Athlete Relationship

### Invite Link Flow

```
1. Coach generates invite code (auto-generated, unique)
2. Athlete gets code (email or manual entry)
3. Athlete enters code in app
4. System creates CoachAthlete relationship
5. Access tier becomes "coached"
6. Coach can now see athlete data
```

### Revoke Access

```
Coach clicks "Remove athlete" → relationship deleted
  ↓
Athlete loses access to coach dashboard
  ↓
Coach loses access to athlete data
  ↓
Sessions become coach-managed (coach can still see history)
```

---

## Frontend Enforcement

### Conditional Rendering

```jsx
// Example: Coach dashboard
function AthleteCard({ athlete, viewer }) {
  const canViewMetrics = checkPermission(viewer, athlete, 'metrics');
  const canViewReadiness = checkPermission(viewer, athlete, 'readiness');
  
  return (
    <div>
      <h3>{athlete.name}</h3>
      {canViewMetrics && <MetricsPanel athlete={athlete} />}
      {canViewReadiness && <ReadinessGauge athlete={athlete} />}
      {!canViewReadiness && <p>Hidden (privacy tier)</p>}
    </div>
  );
}
```

---

## Data Storage

```sql
CREATE TABLE "PrivacyTier" (
  "id" UUID PRIMARY KEY,
  "tierCode" VARCHAR UNIQUE,    -- "solo", "coached", "club", "admin"
  "description" TEXT,
  "readableFields" JSON,        -- Array of field names
  "editableFields" JSON
);

CREATE TABLE "FieldPermission" (
  "id" UUID PRIMARY KEY,
  "field" VARCHAR,              -- "readiness", "metrics", "sessions", etc.
  "tierCode" VARCHAR,
  "readable" BOOLEAN,
  "editable" BOOLEAN
);

CREATE TABLE "UserPrivacySettings" (
  "id" UUID PRIMARY KEY,
  "userId" UUID UNIQUE,
  "currentTier" VARCHAR,
  "shareClubAchievements" BOOLEAN,  -- Default true
  "sharePRCards" BOOLEAN,           -- Default true
  "shareLeaderboard" BOOLEAN,       -- Default true
  "updatedAt" TIMESTAMP
);
```

---

## Compliance & GDPR

### Data Export

Athletes can request full data export:
```
Settings → Privacy → "Download My Data"
  ↓
System generates JSON file with all personal data
  ↓
File encrypted + sent to email
  ↓
Logged in audit trail
```

### Data Deletion

```
Settings → Privacy → "Delete My Account"
  ↓
Warning: "This cannot be undone"
  ↓
Schedule deletion (7-day grace period)
  ↓
After 7 days: Account and all associated data deleted
  ↓
Coach can still see historical sessions (for record-keeping)
```

---

## Testing Checklist

- [ ] Solo athlete can see own data, no coach access
- [ ] Coach can see only "coached" tier fields
- [ ] Club members see only shared fields (names, belts)
- [ ] Admin access works for all data
- [ ] Invite code creates correct relationship
- [ ] Revoke access removes coach visibility
- [ ] Field permissions cached correctly
- [ ] Frontend hides restricted data
- [ ] Data export generates JSON correctly
- [ ] Deletion schedule works as expected

---

**Generated:** 2026-04-10  
**Source:** Extracted from privacy_engine.js  
**Integration Status:** ✅ Complete (tier enforcement + GDPR)
