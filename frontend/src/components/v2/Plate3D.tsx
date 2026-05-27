/**
 * Plate3D · React wrapper del custom element <plate-3d>.
 * Importa side-effect el JS standalone una vez.
 */
import React from 'react';
import '../../lib/web-components';

export type PlateTier = 0 | 1 | 2 | 3 | 4;

interface Plate3DProps {
  tier: PlateTier;
  size?: number;       // px · default 96
  animate?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const Plate3D: React.FC<Plate3DProps> = ({
  tier, size = 96, animate = false, className, style,
}) => {
  return (
    <plate-3d
      tier={String(tier)}
      size={String(size)}
      {...(animate ? { animate: '' } : {})}
      className={className}
      style={style as any}
    />
  );
};

export default Plate3D;
