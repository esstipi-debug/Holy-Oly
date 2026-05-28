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

  // Cerrar una notificación manualmente (botón X o swipe).
  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(x => x.id !== id));
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
          {toasts.map(t => {
            const dark = t.variant !== 'info';
            return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.18 } }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              whileDrag={{ cursor: 'grabbing' }}
              onDragEnd={(_e, info) => {
                // Swipe (deslizar) para borrar · umbral por distancia o velocidad
                if (Math.abs(info.offset.x) > 80 || Math.abs(info.velocity.x) > 500) dismiss(t.id);
              }}
              role="status"
              style={{
                pointerEvents: 'auto',
                display: 'flex', alignItems: 'center', gap: 10,
                cursor: 'grab', touchAction: 'pan-y',
                background: t.variant === 'success' ? 'rgba(34,197,94,0.95)'
                          : t.variant === 'error'   ? 'rgba(239,68,68,0.95)'
                          : t.variant === 'warning' ? 'rgba(245,158,11,0.95)'
                          : 'rgba(15,15,28,0.95)',
                color: dark ? '#07070F' : 'var(--text)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                padding: '10px 10px 10px 18px',
                borderRadius: 14,
                fontSize: 12, fontWeight: 700,
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                maxWidth: '90%',
              }}
            >
              <span style={{ flex: 1 }}>{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                onPointerDownCapture={(e) => e.stopPropagation()}
                aria-label="Cerrar notificación"
                style={{
                  flexShrink: 0,
                  width: 22, height: 22,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 999, border: 'none',
                  background: dark ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.12)',
                  color: 'inherit',
                  fontSize: 15, lineHeight: 1, fontWeight: 800,
                  cursor: 'pointer',
                }}
              >×</button>
            </motion.div>
          );})}
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
