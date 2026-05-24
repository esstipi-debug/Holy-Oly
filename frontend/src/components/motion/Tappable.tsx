import { motion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * Botón animado con scale on press + hover brightness.
 * Drop-in replacement de <button> con micro-interactions premium.
 */

interface TappableProps extends Omit<HTMLMotionProps<'button'>, 'whileTap' | 'whileHover'> {
  children: ReactNode;
  /** Intensidad del scale on press (0.94 = sutil, 0.90 = pronunciado). */
  scale?: number;
  /** Si true, deshabilita la animación on hover. */
  noHover?: boolean;
}

const Tappable: React.FC<TappableProps> = ({
  children, scale = 0.96, noHover = false, disabled, ...rest
}) => (
  <motion.button
    {...rest}
    disabled={disabled}
    whileTap={disabled ? undefined : { scale }}
    whileHover={disabled || noHover ? undefined : { filter: 'brightness(1.08)' }}
    transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
  >
    {children}
  </motion.button>
);

export default Tappable;
