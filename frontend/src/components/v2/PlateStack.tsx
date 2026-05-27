// @ts-nocheck — Custom element <plate-stack> requires inline JSX declaration that conflicts with TS strict
/**
 * PlateStack · React wrapper del custom element <plate-stack>.
 */
import React from 'react';
import '../../lib/web-components';
import type { PlateTier } from './Plate3D';

interface PlateStackProps {
  tiers: PlateTier[];        // ej [1,1,2,3]
  size?: number;             // default 64
  orientation?: 'row' | 'column';
  animate?: boolean;
  showTotal?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const PlateStack: React.FC<PlateStackProps> = ({
  tiers, size = 64, orientation = 'row', animate = false, showTotal, className, style,
}) => {
  const csv = tiers.join(',');
  return (
    <plate-stack
      tiers={csv}
      size={String(size)}
      orientation={orientation}
      {...(animate ? { animate: '' } : {})}
      className={className}
      style={style as any}
    />
  );
};

export default PlateStack;
