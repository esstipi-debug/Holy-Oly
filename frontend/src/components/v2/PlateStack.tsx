// @ts-nocheck — Custom element <plate-stack> requires inline JSX declaration that conflicts with TS strict
/**
 * PlateStack · React wrapper del custom element <plate-stack>.
 *
 * Acumulación visual de discos halterofilia.
 *  - Row (default): discos apilados horizontal con overlap suave
 *  - Column: stack vertical estilo barra cargada
 *
 * Props mapean 1:1 con atributos del custom element (ver plate-stack.js).
 * `weight` y `animateIn` son booleanos → atributo presente/ausente.
 */
import React from 'react';
import '../../lib/web-components';
import type { PlateTier } from './Plate3D';

interface PlateStackProps {
  tiers: PlateTier[];              // ej [1,1,2,3] · left/bottom = oldest, right/top = newest
  size?: number;                   // px por disco · default 64
  orientation?: 'row' | 'column';  // default row
  overlap?: number;                // 0..1 · default 0.18 (row) / 0.80 (column)
  weight?: boolean;                // mostrar suma de kg debajo
  label?: string;                  // texto sobre el peso (uppercase mono)
  animateIn?: boolean;             // cascada de entrada con stagger 80ms
  className?: string;
  style?: React.CSSProperties;
}

export const PlateStack: React.FC<PlateStackProps> = ({
  tiers,
  size = 64,
  orientation = 'row',
  overlap,
  weight,
  label,
  animateIn,
  className,
  style,
}) => {
  const csv = tiers.join(',');
  return (
    <plate-stack
      tiers={csv}
      size={String(size)}
      orientation={orientation}
      {...(overlap !== undefined ? { overlap: String(overlap) } : {})}
      {...(weight ? { weight: '' } : {})}
      {...(label ? { label } : {})}
      {...(animateIn ? { 'animate-in': '' } : {})}
      className={className}
      style={style as any}
    />
  );
};

export default PlateStack;
