/**
 * Web Components loader · registra <plate-3d> y <plate-stack> custom elements.
 *
 * Importar 1 vez en main.tsx (o App boot) para que los tags estén disponibles
 * en cualquier JSX:
 *   import './lib/web-components';
 *   <plate-3d tier="3" size="96"></plate-3d>
 */

// Side-effect imports · ejecutan customElements.define()
import './plate-3d.js';
import './plate-stack.js';

// JSX types para que TypeScript no se queje
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'plate-3d': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          tier?: string | number;
          size?: string | number;
          animate?: boolean | '';
        },
        HTMLElement
      >;
      'plate-stack': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          tiers?: string;       // CSV "1,2,3"
          size?: string | number;
          orientation?: 'row' | 'column';
          animate?: boolean | '';
        },
        HTMLElement
      >;
    }
  }
}

export {};
