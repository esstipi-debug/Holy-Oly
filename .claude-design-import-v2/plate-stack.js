/* ============================================================
   PEAK QUAL · COMPONENT — PLATE STACK
   Acumulación visual de carga de discos halterofilia
   ------------------------------------------------------------
   Usage:
     <plate-stack tiers="1,1,2,3"
                  orientation="row"
                  size="64"
                  weight
                  label="Sesión 3"
                  animate-in></plate-stack>

   Attrs:
     tiers       = comma-separated tier ids ("1,2,3,4")
                   left = oldest, right/top = newest
     orientation = "row" (default) | "column"
     size        = px per disc (default 64)
     overlap     = 0..1 ; row default 0.18 · column default 0.80
     weight      = present → suma de kg debajo
     label       = string opcional sobre el peso
     animate-in  = present → cascada de entrada con stagger 80ms
   ============================================================ */

(() => {
  // -------- CSS (injected once) --------
  if (!document.getElementById('__platestack_css')) {
    const s = document.createElement('style');
    s.id = '__platestack_css';
    s.textContent = `
      plate-stack {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        gap: 14px;
      }
      plate-stack .stack-grp {
        position: relative;
      }
      plate-stack .stack-meta {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        text-align: center;
      }
      plate-stack .stack-label {
        font-family: var(--font-mono, ui-monospace, monospace);
        font-size: 10px;
        letter-spacing: 0.22em;
        color: var(--text-lo, #64748B);
        text-transform: uppercase;
      }
      plate-stack .stack-kg {
        font-family: var(--font-mono, ui-monospace, monospace);
        font-weight: 700;
        font-size: 22px;
        color: var(--text-hi, #F1F5F9);
        letter-spacing: -0.01em;
        font-variant-numeric: tabular-nums;
        line-height: 1;
      }
      plate-stack .stack-kg .u {
        font-size: 11px;
        color: var(--text-mid, #94A3B8);
        font-weight: 400;
        margin-left: 4px;
        letter-spacing: 0.08em;
      }
      plate-stack .stack-empty {
        font-family: var(--font-mono, ui-monospace, monospace);
        font-size: 11px;
        color: var(--text-lo, #64748B);
        letter-spacing: 0.15em;
        text-transform: uppercase;
        opacity: 0.5;
      }

      /* ---- entry animations ---- */
      @keyframes psRollIn {
        0%   { opacity: 0; transform: translateX(-1.5em) rotate(-180deg); }
        100% { opacity: 1; transform: translateX(0)      rotate(0);       }
      }
      @keyframes psDropIn {
        0%   { opacity: 0; transform: translateY(-0.8em) scale(0.92); }
        100% { opacity: 1; transform: translateY(0)      scale(1);    }
      }
      plate-stack[data-animate-in="true"] plate-3d {
        animation: psRollIn 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
      }
      plate-stack[data-animate-in="true"][data-orientation="column"] plate-3d {
        animation-name: psDropIn;
      }
    `;
    document.head.appendChild(s);
  }

  // -------- weight per tier --------
  const KG = { '0': 0, '1': 10, '2': 15, '3': 20, '4': 25 };

  // -------- the element --------
  class PlateStack extends HTMLElement {
    static get observedAttributes() {
      return ['tiers', 'size', 'orientation', 'overlap',
              'weight', 'label', 'animate-in'];
    }

    connectedCallback()       { this.render(); }
    attributeChangedCallback() { if (this.isConnected) this.render(); }

    render() {
      const tiers = (this.getAttribute('tiers') || '')
        .split(',').map(s => s.trim()).filter(Boolean);
      const size        = parseFloat(this.getAttribute('size'))    || 64;
      const orientation = this.getAttribute('orientation') === 'column'
                          ? 'column' : 'row';
      const overlap     = parseFloat(this.getAttribute('overlap'));
      const ov          = !isNaN(overlap) ? overlap
                          : (orientation === 'column' ? 0.80 : 0.18);
      const showWeight  = this.hasAttribute('weight');
      const label       = this.getAttribute('label');
      const animateIn   = this.hasAttribute('animate-in');

      const totalKg = tiers.reduce((s, t) => s + (KG[t] || 0), 0);

      const n        = tiers.length;
      const stepPx   = size * (1 - ov);
      const stackW   = orientation === 'row'
                        ? size + Math.max(0, n - 1) * stepPx
                        : size;
      const stackH   = orientation === 'column'
                        ? size + Math.max(0, n - 1) * stepPx
                        : size;

      this.dataset.orientation = orientation;
      this.dataset.animateIn   = animateIn ? 'true' : 'false';

      // build plates html
      let plates = '';
      if (n === 0) {
        plates = `<span class="stack-empty">— vacío —</span>`;
      } else {
        plates = tiers.map((t, i) => {
          const pos = orientation === 'row'
            ? `left:${i * stepPx}px; top:0;`
            : `bottom:${i * stepPx}px; left:0;`;
          const delay = animateIn ? `animation-delay:${i * 80}ms;` : '';
          return `<plate-3d tier="${t}" size="${size}"
                    style="position:absolute; ${pos} z-index:${i + 1}; ${delay}"></plate-3d>`;
        }).join('');
      }

      const meta = (showWeight || label) ? `
        <div class="stack-meta">
          ${label ? `<span class="stack-label">${label}</span>` : ''}
          ${showWeight ? `<span class="stack-kg">${totalKg}<span class="u">kg</span></span>` : ''}
        </div>` : '';

      this.innerHTML = `
        <div class="stack-grp" style="width:${stackW}px; height:${stackH}px;">
          ${plates}
        </div>
        ${meta}
      `;
    }

    /** Programmatic replay of the entry cascade (for demo / new plate added). */
    replay() {
      if (!this.hasAttribute('animate-in')) return;
      this.dataset.animateIn = 'false';
      // force reflow then re-enable
      void this.offsetWidth;
      requestAnimationFrame(() => {
        this.dataset.animateIn = 'true';
      });
    }
  }

  if (!customElements.get('plate-stack')) {
    customElements.define('plate-stack', PlateStack);
  }
})();
