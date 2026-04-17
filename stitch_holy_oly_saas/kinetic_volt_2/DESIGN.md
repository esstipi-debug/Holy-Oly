# Kinetic Volt Design System

## 1. Overview & Creative North Star
**Creative North Star: "Hyper-Performance Noir"**

Kinetic Volt is a design system engineered for high-intensity athletic management. It rejects the "utility app" aesthetic in favor of a high-end editorial look that feels like a digital training facility at night. The system uses high-contrast "Electric Lime" accents against a "Deep Obsidian" foundation to create a sense of focused energy. It breaks away from rigid grids by using wide character tracking, uppercase labels, and asymmetric glow effects to guide the eye toward critical performance data.

## 2. Colors
The palette is dominated by dark neutrals with high-chroma signals for feedback and primary actions.

- **Primary (#39FF14):** Reserved for "Active State" signals, primary CTAs, and critical brand identifiers.
- **Secondary (#6A0DAD):** Used for "System Intelligence" and "Flow," appearing in data visualizations (intensity curves) and depth-inducing glows.
- **The "No-Line" Rule:** Sectioning is achieved through shifts between `surface-container-low` (#1C1B1B) and `surface-container-high` (#2A2A2A). Avoid 1px borders unless using `outline-variant` at 15% opacity for subtle definition in low-contrast zones.
- **Surface Hierarchy:** Use `surface-container-lowest` for the base canvas. Secondary elements (cards) sit on `surface-container-low`. Active or interactive elements hover on `surface-container-high`.
- **Glass & Gradient:** Navigation headers use a 60% opaque surface with a 20px blur to maintain context. Backgrounds should feature a top-down `secondary-container` gradient at 10% opacity to provide "ambient atmosphere."

## 3. Typography
The typography system uses a sharp, technical Headline font paired with a highly legible geometric Body font.

- **Display & Headlines (Space Grotesk):** High-impact, wide character tracking. Headlines are always bold and often uppercase to convey authority.
- **Body & Labels (Inter):** Clean, neutral, and optimized for data density.
- **Typography Scale:**
  - **XL Headlines:** 1.25rem (20px) — System-level headers.
  - **Card Titles:** 1.125rem (18px) — For primary entities like Programs or Athletes.
  - **Data Labels:** 0.875rem (14px) — Standard body and search input text.
  - **Micro-Labels:** 0.75rem (12px) / 10px — For metadata and uppercase tracking tags (e.g., "Intensity Curve").

## 4. Elevation & Depth
Depth is created through light emission and tonal stacking rather than physical shadows.

- **The Layering Principle:** Stack containers from `#0E0E0E` (base) to `#353534` (highest interactive).
- **Ambient Shadows:** Standard components use a subtle purple-tinted glow (`rgba(108,17,175,0.15)`) instead of black shadows to maintain the "Neon Noir" aesthetic.
- **Glow Accents:** Selected states for primary actions use a neon spread (`rgba(57,255,20,0.3)`) to simulate the interface emitting light.

## 5. Components
- **Buttons:** Primary buttons use a linear gradient from `primary-fixed` to `primary-container`. They should be uppercase with bold tracking and sharp (DEFAULT) corner radii.
- **Chips:** Pill-shaped, using `surface-container-low` for inactive and `primary-container` for active states.
- **Cards:** Defined by `surface-container-low` with a 15% `outline-variant` border. Selected cards utilize a 2px `secondary-container` border and a localized blur-glow.
- **Intensity Sparklines:** Vertical bar charts using variable opacity of `secondary-container` to represent data volume, with the peak value highlighted in `primary-container`.

## 6. Do's and Don'ts
### Do:
- Use uppercase and tracking for all labels and button text.
- Utilize "Pulse" animations on status indicators to show real-time connectivity.
- Lean into the contrast between the dark background and the neon primary color.
- Use `backdrop-blur` on all sticky or fixed navigation elements.

### Don't:
- Do not use fully rounded (pill) shapes for primary action buttons; keep them with subtle (2px) radii.
- Avoid using pure white for text; use `on-surface` (#E5E2E1) to reduce eye strain in high-contrast dark mode.
- Never use standard gray shadows; always tint shadows with the secondary or primary color at low opacity.