import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Sistema de toasts globales con animación.
 *
 * Uso:
 *   const { showToast } = useToast();
 *   showToast({ message: 'Sesión guardada', variant: 'success' });
 */

type Variant = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: number;
  message: string;
  variant: Variant;
  duration: number;
}

interface ToastContextType {
  showToast: (options: { message: string; variant?: Variant; duration?: number }) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback(({ message, variant = 'info', duration = 2500 }: { message: string; variant?: Variant; duration?: number }) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, variant, duration }]);
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map(t => setTimeout(() => {
      setToasts(prev => prev.filter(x => x.id !== t.id));
    }, t.duration));
    return () => timers.forEach(clearTimeout);
  }, [toasts]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        style={{
          position: 'fixed', bottom: 90, left: 0, right: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 8, pointerEvents: 'none', zIndex: 1000,
        }}
      >
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              style={{
                pointerEvents: 'auto',
                background: t.variant === 'success' ? 'rgba(34,197,94,0.95)'
                          : t.variant === 'error'   ? 'rgba(239,68,68,0.95)'
                          : t.variant === 'warning' ? 'rgba(245,158,11,0.95)'
                          : 'rgba(15,15,28,0.95)',
                color: t.variant === 'info' ? 'var(--text)' : '#07070F',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                padding: '10px 18px',
                borderRadius: 14,
                fontSize: 12, fontWeight: 700,
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                maxWidth: '85%',
              }}
            >
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
}
