import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * Wrapper que aplica stagger animation a sus hijos directos.
 * Cada hijo aparece con fade-up con delay incremental.
 */

interface StaggerProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;     // delay inicial del primer hijo
  stagger?: number;   // tiempo entre hijos
}

const containerVariants = (stagger: number, delay: number) => ({
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: stagger,
      delayChildren: delay,
    },
  },
});

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  },
};

export const Stagger: React.FC<StaggerProps> = ({
  children, className, style, delay = 0.05, stagger = 0.06,
}) => (
  <motion.div
    variants={containerVariants(stagger, delay)}
    initial="hidden"
    animate="show"
    className={className}
    style={style}
  >
    {Array.isArray(children)
      ? children.map((c, i) => <motion.div key={i} variants={itemVariants}>{c}</motion.div>)
      : <motion.div variants={itemVariants}>{children}</motion.div>}
  </motion.div>
);

export const StaggerItem: React.FC<{ children: ReactNode; className?: string; style?: React.CSSProperties }> = ({ children, className, style }) => (
  <motion.div variants={itemVariants} className={className} style={style}>
    {children}
  </motion.div>
);

export default Stagger;
