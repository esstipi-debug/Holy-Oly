# Kinetic Obsidian Design System

### 1. Overview & Creative North Star
**Creative North Star: The Cybernetic Athlete**
Kinetic Obsidian is a high-performance design system engineered for the intersection of human biology and technical precision. It rejects the friendly, rounded "SaaS" aesthetic in favor of a brutalist, high-contrast editorial style. The system is defined by "Electric Neon" accents against a "Void Black" foundation, utilizing intentional asymmetry and technical typography to create a sense of urgent, data-driven insight.

### 2. Colors
The palette is rooted in deep blacks and tactical greys, pierced by a high-visibility Electric Lime (#39FF14).
- **The "No-Line" Rule:** Do not use 1px solid borders for general sectioning. Elements are separated by shifting between `surface_container_low` and `surface_container_high`. If a boundary is essential, use `outline_variant` at 15% opacity to create a technical "ghost" edge.
- **Surface Hierarchy:** Depth is achieved through "stacking." A base of `surface` supports `surface_container_low` cards, which may house `surface_container_highest` headers.
- **The "Glass & Gradient" Rule:** Use `backdrop-blur-xl` (60% opacity) for top navigation and floating elements. Enhance biological or complex data with "Electric Shadow" bases—diffused glows of `secondary_container` at 20% opacity.
- **Signature Textures:** Incorporate subtle radial gradients for hero elements to simulate depth without traditional drop shadows.

### 3. Typography
The system uses a dual-font approach to balance technical aggression with readability.
- **Headline (Space Grotesk):** Used for primary headings and uppercase labels. It evokes a scientific, futuristic feel. Reference the **4.5rem (72px)** scale for hero numbers to emphasize performance metrics.
- **Body & Label (Inter):** High-legibility sans-serif for functional data.
- **Typography Scale (Extracted Ground Truth):**
    - **Display (Hero):** 4.5rem (72px) - Tight tracking, bold.
    - **Headline 1:** 1.875rem (30px) - Uppercase, tracking-tight.
    - **Title Large:** 1.25rem (20px) - Bold, tracking-widest.
    - **Body/Label:** 0.875rem (14px) and 0.75rem (12px) for supplemental data.
    - **Navigation Label:** 10px - Bold, uppercase, tracking-wider.

### 4. Elevation & Depth
Elevation is expressed through light emission and tonal shifts rather than physical height.
- **The Layering Principle:** Use `surface-container-low` (#1C1B1B) for the main card bodies and `surface-container-highest` (#353534) for header strips to create a "recessed" industrial look.
- **Ambient Shadows:** Standard shadows are replaced with color-tinted glows. Use `rgba(105, 11, 172, 0.05)` for subtle purple depth or `rgba(57, 255, 20, 0.05)` for active neon resonance.
- **Glassmorphism:** Navigation bars use 60% opacity with 20px-24px backdrop blurs to maintain context while ensuring legibility.

### 5. Components
- **Buttons:** Primary buttons are either full-bleed Electric Lime with black text or "Ghost" style (Outline at 50% error/primary color) for warnings.
- **Chips:** Rectangular with minimal rounding (2px-4px). Warning chips use 20% background opacity with 40% border opacity of the error color.
- **Readiness Rings:** Circular SVG gauges with `stroke-linecap: round` and a soft glow (`drop-shadow`) on the active progress segment.
- **Interaction Pulse:** Interactive "hotspots" on anatomy or maps should use a triple-layer: a core dot, a static ring, and an outer pulse ring at 20% opacity.

### 6. Do's and Don'ts
- **Do:** Use uppercase and wide tracking (0.1em - 0.2em) for labels to enhance the technical aesthetic.
- **Do:** Use "Electric Shadows" (blurs up to 60px) behind data visualizations to draw the eye.
- **Don't:** Use large corner radii. Keep `roundedness` at 1 (max 8px for cards, 2px for buttons) to maintain the sharp, performance-oriented feel.
- **Don't:** Use pure white text. Use `on_surface` (#E5E2E1) to reduce eye strain against the black background.
- **Do:** Use asymmetric grid layouts (e.g., 7-column / 5-column split) to break the "template" feel.