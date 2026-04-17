# Kinetic Volt Design System

## 1. Overview & Creative North Star
**Creative North Star: The Cybernetic Athlete**
Kinetic Volt is a high-performance editorial system designed for peak physical and digital performance. It avoids the soft "lifestyle" aesthetics of typical fitness apps in favor of a technical, high-contrast, and aggressive visual language. The system breaks the standard mobile grid through the use of neon accents, oversized typography, and depth created by overlapping semi-transparent layers. It feels like a heads-up display (HUD) for elite performance.

## 2. Colors
The palette is built on a "Deep Space" foundation (rich blacks and charcoal) punctuated by "Volt Green" and "Cyber Purple."

*   **Primary (Volt Green):** Used for critical actions, status indicators, and brand identity. It represents energy and "go" states.
*   **Secondary (Cyber Purple):** Used for depth, specialized categories (like CNS impact), and active selections.
*   **The "No-Line" Rule:** Do not use 1px solid borders to separate sections. Use shifts between `surface-container-low` (#1C1B1B) and `surface-container-high` (#2A2A2A) to define boundaries.
*   **Surface Hierarchy:**
    *   **Lowest:** App Background (#0E0E0E).
    *   **Low:** Primary card background.
    *   **High/Highest:** Interactive states and nested metadata tags.
*   **Glass & Gradient Rule:** Navigation bars and sticky headers must use `backdrop-blur-xl` with a 60% opacity surface fill to maintain context of the content scrolling beneath.

## 3. Typography
The typography scale utilizes a brutalist "Space Grotesk" for headers and a utilitarian "Inter" for data-heavy body text.

*   **Display/Title (Space Grotesk):** Set with tight tracking (-0.02em) and uppercase styling for brand elements. 
*   **Headline Scale:** 1.25rem (20px) for primary card titles; 1.125rem (18px) for secondary titles.
*   **Body & Label Scale:** 0.875rem (14px) for standard text; 0.75rem (12px) for metadata; and a specialized 10px "Micro-Label" for chart axis and intensity curves.
*   **Hierarchy:** The use of "Space Grotesk" is reserved for high-impact moments. Inter is used for all functional labels to ensure readability during high-intensity use cases.

## 4. Elevation & Depth
Depth is communicated through light emission rather than physical shadow.

*   **Tonal Layering:** Objects closer to the user are lighter in hex value (`surface-container-high`).
*   **Ambient Shadows:** Use shadows only to create "Glow" effects. Primary CTA buttons use a `0 0 20px rgba(57, 255, 20, 0.3)` glow instead of a traditional drop shadow.
*   **The Layering Principle:** Hero elements (like the Athlete Header) should feature a subtle border-variant with 15% opacity to hint at structure without creating visual noise.
*   **Glassmorphism:** Navigation components use `131313/60` opacity with high-intensity blur to create a "suspended" effect.

## 5. Components
*   **Action Buttons:** Large, edge-to-edge (or full-width) gradients from `primary-fixed` to `primary-container`. Typography must be bold, uppercase, and highly tracked.
*   **Filter Chips:** Pill-shaped. Active state is solid `primary-container`. Inactive state is `surface-container-low` with a subtle `outline-variant` border.
*   **Program Cards:** Rounded (12px/xl) containers with a 2px stroke used *only* for the "Selected" state. Include a "mini-sparkline" intensity curve to visualize data at a glance.
*   **Search Input:** Inset icons with `on-surface-variant` coloring. Background should be `surface-container-low` to recede from the main content cards.

## 6. Do's and Don'ts
*   **Do:** Use high-contrast "Volt Green" for success states and active selections.
*   **Do:** Use uppercase labels for all technical metadata to maintain the HUD aesthetic.
*   **Don't:** Use standard blue for links; all interactive highlights must be in the Primary or Secondary brand colors.
*   **Don't:** Use large border radii for buttons. Use the "DEFAULT" (0.125rem) or "lg" (0.25rem) to maintain a technical, engineered feel.
*   **Do:** Ensure accessibility by keeping `on-surface` text at high contrast against the dark backgrounds.