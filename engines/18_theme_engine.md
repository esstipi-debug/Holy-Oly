# 18. Theme Engine — Visual Customization System

**Purpose:** Manage light/dark/sport-specific visual themes for personalized UI experience

**Status:** User preference system  
**Update Frequency:** On change (real-time)  
**Performance:** O(1) theme lookup + CSS injection

---

## Available Themes

### Classic (Default)

```json
{
  "code": "classic",
  "name": "Holy Oly Classic",
  "isPremium": false,
  "colors": {
    "bg": "#0B1326",
    "primary": "#22C55E",
    "accent": "#22C55E",
    "text": "#FFFFFF",
    "border": "#1E293B"
  },
  "description": "El estilo original. Limpio, funcional y enfocado."
}
```

### Dark Themes

**Arctic Chill (Cold)**
```
Primary: #14B8A6 (Turquoise)
Accent: #14B8A6
Feeling: Cool, focused
```

**Inferno (Fire)**
```
Primary: #84CC16 (Lime)
Accent: #84CC16
Feeling: Energetic, intense
```

### Premium Themes

**Olympic Gold** 💎
```json
{
  "code": "lux",
  "name": "Olympic Gold",
  "isPremium": true,
  "colors": {
    "primary": "#FACC15",
    "accent": "#FACC15",
    "secondary": "#0081C8"
  },
  "description": "Edición limitada de lujo. Solo para campeones."
}
```

**Carbon Stealth** 💎
```json
{
  "code": "carbon",
  "name": "Carbon Stealth",
  "isPremium": true,
  "colors": {
    "primary": "#B4C5FF",
    "accent": "#B4C5FF"
  },
  "description": "Diseño industrial minimalista inspirado en fibra de carbono."
}
```

**Cyber Neon** 💎
```json
{
  "code": "cyber",
  "name": "Cyber Neon",
  "isPremium": true,
  "colors": {
    "primary": "#22D3EE",
    "accent": "#22D3EE"
  },
  "description": "Estética futurista con luces de neón."
}
```

---

## Theme Selection

### Athlete Changes Theme

```
Settings → Appearance → Select Theme

[Classic]  [Arctic]  [Inferno]  [Olympic 💎]  [Carbon 💎]  [Cyber 💎]

Current: Classic ✓
```

### Implementation

```javascript
async function updateUserTheme(userId, themeCode) {
  // Validate theme exists
  const theme = await prisma.theme.findUnique({ where: { code: themeCode } });
  if (!theme) throw new Error("Theme not found");
  
  // Check premium access if theme is premium
  if (theme.isPremium) {
    const hasPremium = await userHasPremium(userId);
    if (!hasPremium) throw new Error("Premium required");
  }
  
  // Update user preference
  await prisma.user.update({
    where: { id: userId },
    data: { themeCode }
  });
  
  // Store in user preferences cache
  await cache.set(`theme:${userId}`, themeCode);
  
  return { success: true, theme: themeCode };
}
```

---

## Frontend Application

### CSS Variables Injection

```javascript
// frontend/src/App.jsx

function App() {
  const { user } = useAuth();
  const theme = useTheme(user.themeCode);
  
  useEffect(() => {
    // Set CSS variables on root
    const root = document.documentElement;
    root.style.setProperty('--color-bg', theme.colors.bg);
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-accent', theme.colors.accent);
    root.style.setProperty('--color-text', theme.colors.text);
    root.style.setProperty('--color-border', theme.colors.border);
  }, [theme]);
  
  return (
    <div className="app">
      {/* All components use CSS variables */}
    </div>
  );
}
```

### CSS Example

```css
/* Global styles use CSS variables */
:root {
  --color-bg: #0B1326;
  --color-primary: #22C55E;
  --color-accent: #22C55E;
  --color-text: #FFFFFF;
  --color-border: #1E293B;
}

body {
  background-color: var(--color-bg);
  color: var(--color-text);
}

.button-primary {
  background-color: var(--color-primary);
  color: var(--color-text);
}

.card {
  border: 1px solid var(--color-border);
  background-color: var(--color-bg);
}
```

---

## Theme Data Structure

```sql
CREATE TABLE "Theme" (
  "id" UUID PRIMARY KEY,
  "code" VARCHAR UNIQUE,        -- "classic", "arctic", "lux", etc.
  "name" VARCHAR,
  "nameEs" VARCHAR,
  "description" TEXT,
  "isPremium" BOOLEAN,
  "sortOrder" INT,
  
  "bgColor" VARCHAR,            -- Hex color code
  "primaryColor" VARCHAR,
  "accentColor" VARCHAR,
  "secondaryColor" VARCHAR,
  "textColor" VARCHAR,
  "borderColor" VARCHAR,
  "successColor" VARCHAR,
  "errorColor" VARCHAR,
  "warningColor" VARCHAR,
  
  "createdAt" TIMESTAMP
);
```

---

## User Preference Storage

```sql
CREATE TABLE "UserPreference" (
  "id" UUID PRIMARY KEY,
  "userId" UUID UNIQUE,
  "themeCode" VARCHAR,         -- References Theme.code
  "fontSize" VARCHAR,          -- "small" | "normal" | "large"
  "contrast" VARCHAR,          -- "normal" | "high"
  "reducedMotion" BOOLEAN,
  "language" VARCHAR,          -- "es" | "en" | "pt"
  "updatedAt" TIMESTAMP
);
```

---

## Premium Theme Unlock

### Purchase Flow

```
User selects premium theme → Needs premium subscription
  ↓
System shows: "Unlock with Premium ($2.99/month)"
  ↓
User taps purchase → Stripe checkout
  ↓
Payment successful → Theme unlocked permanently
  ↓
CSS immediately updated, theme applied
```

### Subscription Validation

```javascript
async function canAccessTheme(userId, themeCode) {
  const theme = await getTheme(themeCode);
  
  if (!theme.isPremium) return true;  // Free theme
  
  const subscription = await getUserActiveSubscription(userId);
  return subscription && subscription.status === 'active';
}
```

---

## Analytics

### Theme Adoption

```
THEME USAGE (Last 30 Days)
═════════════════════════════════════════════

Classic:      62% (default)
Arctic Chill: 18%
Inferno:      12%
Olympic Gold:  5% (premium)
Carbon:        2% (premium)
Cyber Neon:    1% (premium)

Premium Conversion: 8% of users
Premium Revenue: $120/month
Avg Premium Subscriber: $2.99/month
```

---

## Accessibility Considerations

### High Contrast Mode

```json
{
  "code": "high_contrast",
  "name": "High Contrast",
  "colors": {
    "bg": "#000000",
    "primary": "#FFFF00",
    "text": "#FFFFFF",
    "border": "#FFFFFF"
  },
  "description": "Maximum contrast for visual accessibility."
}
```

### Reduced Motion

```javascript
// If user has prefers-reduced-motion OS setting
if (prefersReducedMotion) {
  // Disable animations
  document.documentElement.style.setProperty('--animation-duration', '0s');
}
```

---

## Integration Points

**Feeds Into:**
- **Frontend** → CSS variables applied globally
- **Mobile App** → Theme applied on iOS/Android

**Receives From:**
- **User Preferences** → Theme selection
- **Subscription Status** → Premium theme access

---

## Testing Checklist

- [ ] Theme selection updates user preference
- [ ] CSS variables inject correctly on theme change
- [ ] Premium themes show lock icon for non-subscribers
- [ ] Purchase flow integrates with Stripe
- [ ] Theme persists across browser refresh
- [ ] Mobile theme selection works
- [ ] High contrast mode improves accessibility
- [ ] Reduced motion setting respected
- [ ] All 6 themes display correctly

---

**Generated:** 2026-04-10  
**Source:** Extracted from theme_engine.js  
**Integration Status:** ✅ Complete (user preferences + premium)
