import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Bottom sheet modal con animación de slide-up + backdrop.
 *
 * Uso:
 *   <BottomSheet open={open} onClose={() => setOpen(false)} title="Mi título">
 *     <div>contenido…</div>
 *   </BottomSheet>
 */

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Si true, deshabilita el handle. */
  noHandle?: boolean;
}

const BottomSheet: React.FC<Props> = ({ open, onClose, title, children, noHandle = false }) => (
  <AnimatePresence>
    {open && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 500,
            background: 'var(--bg)',
            borderTopLeftRadius: 24, borderTopRightRadius: 24,
            borderTop: '1px solid var(--card-border)',
            paddingBottom: 32,
            maxHeight: '85%', overflowY: 'auto',
          }}
        >
          {!noHandle && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--card-border)' }} />
            </div>
          )}
          {title && (
            <div style={{ padding: '8px 20px 16px', borderBottom: '1px solid var(--card-border)' }}>
              <h2 className="type-heading-md" style={{ color: 'var(--text)' }}>{title}</h2>
            </div>
          )}
          <div style={{ padding: '16px 20px' }}>
            {children}
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default BottomSheet;
