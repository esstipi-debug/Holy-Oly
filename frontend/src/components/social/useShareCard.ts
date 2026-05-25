/**
 * useShareCard · convierte un nodo DOM (la card 9:16) en PNG y lo comparte.
 *
 * Flujo:
 *   1. Renderiza el nodo a canvas con html2canvas-pro (soporta oklch/CSS vars).
 *   2. Convierte canvas → Blob PNG.
 *   3. Intenta navigator.share({ files: [file] }) — share sheet nativo.
 *   4. Fallback: descarga PNG + copia mensaje sugerido al portapapeles.
 *
 * Tracking: dispara POST /v1/social/screenshots (fire-and-forget) cuando
 * el usuario realmente comparte.
 */
import { useCallback, useState } from 'react';

interface ShareOptions {
  /** Nodo a renderizar (la card sin selector ni nav) */
  node: HTMLElement | null;
  /** Texto sugerido para acompañar */
  message: string;
  /** Filename base sin extensión */
  filename?: string;
  /** Metadata para analytics */
  variant: string;
  achievementType: string;
  achievementId?: string;
  /** Backend opcional */
  apiBase?: string;
  authToken?: string;
}

export interface ShareState {
  status: 'idle' | 'rendering' | 'sharing' | 'downloaded' | 'shared' | 'error';
  error?: string;
}

export function useShareCard() {
  const [state, setStateRaw] = useState<ShareState>({ status: 'idle' });

  /**
   * Setter envuelto: cuando llega a un estado "terminal" (shared/downloaded/error)
   * auto-resetea a idle tras 1.8s — el botón vuelve a "COMPARTIR · GENERAR PNG"
   * sin que el usuario tenga que dismissar nada.
   */
  const setState = useCallback((s: ShareState) => {
    setStateRaw(s);
    if (s.status === 'shared' || s.status === 'downloaded' || s.status === 'error') {
      setTimeout(() => setStateRaw({ status: 'idle' }), 1800);
    }
  }, []);

  const share = useCallback(async (opts: ShareOptions) => {
    if (!opts.node) {
      setState({ status: 'error', error: 'No hay nada para compartir' });
      return;
    }
    setState({ status: 'rendering' });

    try {
      // Import dinámico — no carga ~50KB de html2canvas hasta que se necesita
      const { default: html2canvas } = await import('html2canvas-pro');

      const canvas = await html2canvas(opts.node, {
        backgroundColor: null,
        scale: 2, // 2x para retina + IG Stories
        useCORS: true,
        logging: false,
      });

      const blob: Blob = await new Promise((res, rej) => {
        canvas.toBlob(b => (b ? res(b) : rej(new Error('blob null'))), 'image/png', 0.95);
      });

      const filename = `${opts.filename ?? 'holyoly'}-${Date.now()}.png`;
      const file = new File([blob], filename, { type: 'image/png' });

      setState({ status: 'sharing' });

      // 1. Web Share API con archivos (mobile)
      const nav: any = navigator;
      if (nav.canShare && nav.canShare({ files: [file] })) {
        try {
          await nav.share({
            files: [file],
            text: opts.message,
            title: 'Holy Oly',
          });
          trackShare(opts);
          setState({ status: 'shared' });
          return;
        } catch (e: any) {
          if (e?.name === 'AbortError') {
            setState({ status: 'idle' });
            return;
          }
          // Si share falla, caemos al download
        }
      }

      // 2. Fallback: descarga + copia mensaje
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      try { await navigator.clipboard.writeText(opts.message); } catch { /* ignore */ }

      trackShare(opts);
      setState({ status: 'downloaded' });
    } catch (e: any) {
      console.error('[useShareCard] failed', e);
      setState({ status: 'error', error: e?.message ?? 'Error desconocido' });
    }
  }, []);

  const reset = useCallback(() => setState({ status: 'idle' }), []);

  return { state, share, reset };
}

function trackShare(opts: ShareOptions): void {
  const base = opts.apiBase ?? (import.meta as any).env?.VITE_API_BASE_URL;
  if (!base) return;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.authToken) headers['Authorization'] = `Bearer ${opts.authToken}`;
  fetch(`${base}/v1/social/screenshots`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      card_variant: opts.variant,
      achievement_type: opts.achievementType,
      achievement_id: opts.achievementId,
      detection_method: 'manual',
    }),
    keepalive: true,
  }).catch(() => { /* fire-and-forget */ });
}
