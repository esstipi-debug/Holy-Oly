/* ============================================================
   PEAK QUAL · COMPONENT — PLATE 3D
   Isometric 3/4 view of a Rogue Competition Bumper Plate
   ------------------------------------------------------------
   Usage:
     <plate-3d tier="3" size="96"></plate-3d>
     <plate-3d tier="4" size="128" animate></plate-3d>

   Attrs:
     tier    = 0 | 1 | 2 | 3 | 4
     size    = px (defaults 96; supports 32 / 48 / 64 / 96 / 128 / 240)
     animate = present → glow pulse 2.4s
   ============================================================ */

(() => {
  // -------- Inject component CSS once --------
  if (!document.getElementById('__plate3d_css')) {
    const s = document.createElement('style');
    s.id = '__plate3d_css';
    s.textContent = `
      plate-3d {
        display: inline-block;
        vertical-align: middle;
        line-height: 0;
        filter:
          drop-shadow(0 0.08em 0.16em rgba(var(--tier-rgb), 0.50))
          drop-shadow(0 0      0.06em rgba(var(--tier-rgb), 0.65));
      }
      plate-3d > svg {
        width: 100%;
        height: 100%;
        display: block;
        overflow: visible;
      }
      @keyframes pb3dPulse {
        0%, 100% {
          filter:
            drop-shadow(0 0.08em 0.16em rgba(var(--tier-rgb), 0.45))
            drop-shadow(0 0      0.04em rgba(var(--tier-rgb), 0.55));
        }
        50% {
          filter:
            drop-shadow(0 0.10em 0.22em rgba(var(--tier-rgb), 0.70))
            drop-shadow(0 0      0.16em rgba(var(--tier-rgb), 0.90));
        }
      }
      plate-3d[data-animate="true"] {
        animation: pb3dPulse 2.4s ease-in-out infinite;
      }
      @keyframes pb3dT4Sparkle {
        0%, 60%, 100% { opacity: 0; transform-box: fill-box;
                        transform-origin: center; transform: scale(0.3); }
        72%           { opacity: 1; transform: scale(1.3); }
        82%           { opacity: 0.5; transform: scale(0.8); }
      }
      plate-3d[data-tier="4"][data-animate="true"] .t4-spark {
        animation: pb3dT4Sparkle 2.4s ease-in-out infinite;
        animation-delay: 0.8s;
      }
    `;
    document.head.appendChild(s);
  }

  const TIERS = {
    '0': { c:'#F5F5F7', light:'#FFFFFF', dark:'#B0B0B5', name:'STARTER',    kg:'0kg',
           rgb:'245, 245, 247' },
    '1': { c:'#22C55E', light:'#4ADE80', dark:'#166534', name:'INICIANTE',  kg:'10kg',
           rgb:'34, 197, 94' },
    '2': { c:'#FBBF24', light:'#FDE68A', dark:'#A16207', name:'INTERMEDIO', kg:'15kg',
           rgb:'251, 191, 36' },
    '3': { c:'#3B82F6', light:'#60A5FA', dark:'#1E40AF', name:'AVANZADO',   kg:'20kg',
           rgb:'59, 130, 246' },
    '4': { c:'#EF4444', light:'#FCA5A5', dark:'#7F1D1D', name:'ÉLITE',      kg:'25kg',
           rgb:'239, 68, 68' },
  };

  let SEQ = 0;

  class Plate3D extends HTMLElement {
    static get observedAttributes() { return ['tier', 'size', 'animate']; }

    connectedCallback()    { this.render(); }
    attributeChangedCallback() { if (this.isConnected) this.render(); }

    render() {
      const tier    = this.getAttribute('tier')   || '1';
      const size    = parseFloat(this.getAttribute('size')) || 96;
      const animate = this.hasAttribute('animate');
      const t       = TIERS[tier] || TIERS['1'];
      const id      = `p3d${++SEQ}`;

      // Sizing + glow scales with em
      this.style.width    = `${size}px`;
      this.style.height   = `${size}px`;
      this.style.fontSize = `${size}px`;
      this.style.setProperty('--tier-rgb',   t.rgb);
      this.style.setProperty('--tier-color', t.c);
      this.dataset.tier    = tier;
      this.dataset.animate = animate ? 'true' : 'false';

      // Sparkle is only meaningful when animating + T4
      const showT4Sparkle = animate && tier === '4';

      this.innerHTML = `
<svg viewBox="0 0 130 130" overflow="visible" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <!-- (a) shadow gradient -->
    <radialGradient id="${id}-shadow" cx="50%" cy="50%" r="50%">
      <stop offset="0"   stop-color="rgba(0,0,0,0.55)"/>
      <stop offset="0.7" stop-color="rgba(0,0,0,0.15)"/>
      <stop offset="1"   stop-color="rgba(0,0,0,0)"/>
    </radialGradient>

    <!-- (b) side band vertical gradient -->
    <linearGradient id="${id}-side" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0"   stop-color="${t.c}"/>
      <stop offset="0.55" stop-color="${t.dark}"/>
      <stop offset="1"   stop-color="${t.dark}"/>
    </linearGradient>

    <!-- (c) front face radial -->
    <radialGradient id="${id}-face" cx="34%" cy="28%" r="80%">
      <stop offset="0"    stop-color="${t.light}"/>
      <stop offset="0.50" stop-color="${t.c}"/>
      <stop offset="1"    stop-color="${t.dark}"/>
    </radialGradient>

    <!-- (g) chrome hub face -->
    <radialGradient id="${id}-hub" cx="36%" cy="28%" r="78%">
      <stop offset="0"    stop-color="#FFFFFF"/>
      <stop offset="0.35" stop-color="#E5E5E5"/>
      <stop offset="0.78" stop-color="#9A9A9A"/>
      <stop offset="1"    stop-color="#5A5A5A"/>
    </radialGradient>

    <!-- (f) chrome side band -->
    <linearGradient id="${id}-hubside" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0"   stop-color="#BFBFBF"/>
      <stop offset="0.5" stop-color="#6E6E6E"/>
      <stop offset="1"   stop-color="#2A2A2A"/>
    </linearGradient>

    <!-- (i) top arc highlight gradient (fades at ends) -->
    <linearGradient id="${id}-arc" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0"    stop-color="rgba(255,255,255,0)"/>
      <stop offset="0.2"  stop-color="rgba(255,255,255,0.55)"/>
      <stop offset="0.8"  stop-color="rgba(255,255,255,0.55)"/>
      <stop offset="1"    stop-color="rgba(255,255,255,0)"/>
    </linearGradient>
  </defs>

  <!-- (a) oval shadow below the plate -->
  <ellipse cx="65" cy="119" rx="50" ry="5.5" fill="url(#${id}-shadow)"/>

  <!-- (b) back of disc · creates colored side band visible at bottom -->
  <ellipse cx="65" cy="65" rx="50" ry="44" fill="url(#${id}-side)"/>

  <!-- (d) subtle black outer border on the back ellipse -->
  <ellipse cx="65" cy="65" rx="50" ry="44" fill="none"
           stroke="rgba(0,0,0,0.6)" stroke-width="0.7"/>

  <!-- (c) front face · radial gradient with bright top-left -->
  <ellipse cx="65" cy="58" rx="50" ry="44" fill="url(#${id}-face)"/>

  <!-- (d) front face outer border -->
  <ellipse cx="65" cy="58" rx="50" ry="44" fill="none"
           stroke="rgba(0,0,0,0.7)" stroke-width="0.8"/>

  <!-- (i) curved top highlight arc on rubber face -->
  <path d="M 22 50 Q 65 28 108 50" fill="none"
        stroke="url(#${id}-arc)" stroke-width="2.4"
        stroke-linecap="round"/>

  <!-- (e) black rubber ring around the hub · "where there is no color" -->
  <ellipse cx="65" cy="58" rx="23" ry="20.2" fill="#0a0a0a"/>
  <!-- subtle inner shadow under the rubber ring -->
  <ellipse cx="65" cy="58.5" rx="23" ry="20.2" fill="none"
           stroke="rgba(255,255,255,0.06)" stroke-width="0.4"/>

  <!-- (f) chrome side band · back of hub -->
  <ellipse cx="65" cy="61" rx="20" ry="17.6" fill="url(#${id}-hubside)"/>

  <!-- (h) thin black ring between hub and rubber (definition seam) -->
  <ellipse cx="65" cy="58" rx="20" ry="17.6" fill="none"
           stroke="rgba(0,0,0,0.85)" stroke-width="0.7"/>

  <!-- (g) chrome hub face · #FFF -> #5A5A5A -->
  <ellipse cx="65" cy="58" rx="20" ry="17.6" fill="url(#${id}-hub)"/>

  <!-- (j) top-left elliptical reflection on hub -->
  <ellipse cx="58.5" cy="50.5" rx="9" ry="3.4"
           fill="rgba(255,255,255,0.72)"
           transform="rotate(-30 58.5 50.5)"/>

  <!-- (k) sparkle point · 1.5px white -->
  <circle cx="73" cy="54" r="0.85" fill="#ffffff"/>

  <!-- (l) center hole 5px · black with subtle inner border -->
  <circle cx="65" cy="58.5" r="2.5" fill="#000000"/>
  <circle cx="65" cy="58.5" r="2.5" fill="none"
          stroke="rgba(255,255,255,0.18)" stroke-width="0.4"/>

  ${showT4Sparkle ? `
  <!-- T4 secondary sparkle on chrome (offset, animates) -->
  <g class="t4-spark" transform="translate(75 51)">
    <circle r="0.55" fill="#ffffff"/>
    <line x1="-2" y1="0" x2="2" y2="0" stroke="#ffffff" stroke-width="0.4" stroke-linecap="round"/>
    <line x1="0" y1="-2" x2="0" y2="2" stroke="#ffffff" stroke-width="0.4" stroke-linecap="round"/>
  </g>` : ''}
</svg>`;
    }
  }

  if (!customElements.get('plate-3d')) {
    customElements.define('plate-3d', Plate3D);
  }

  // expose tier table for the showcase
  window.PlateTiers = TIERS;
})();
