import React from 'react';

interface Props {
  width?: number | string;
  height?: number | string;
  rounded?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Skeleton loader con shimmer animation.
 * Usar para placeholders mientras carga data del backend.
 */
const Skeleton: React.FC<Props> = ({
  width = '100%',
  height = 16,
  rounded = 8,
  className = '',
  style,
}) => (
  <div
    className={`skeleton ${className}`}
    style={{
      width,
      height,
      borderRadius: rounded,
      ...style,
    }}
  />
);

export default Skeleton;
