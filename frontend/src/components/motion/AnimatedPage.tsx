import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * Wrapper para envolver pantallas y darles fade-in + slide-up al montar.
 */

interface Props {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const AnimatedPage: React.FC<Props> = ({ children, className, style }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    className={className}
    style={style}
  >
    {children}
  </motion.div>
);

export default AnimatedPage;
