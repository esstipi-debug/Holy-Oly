/**
 * Push Notifications · Holy Oly / Volta
 *
 * Flujo completo:
 *  1. registerServiceWorker()      → registra /sw.js
 *  2. requestPermission()          → pide permiso de notificaciones
 *  3. subscribeToPush(swReg, key)  → crea PushSubscription con VAPID pública
 *  4. sendSubscriptionToServer()   → POST /v1/notifications/subscribe
 *
 * Para desactivar: unsubscribeFromPush(swReg) + DELETE al server.
 */

const API_URL =
  (import.meta as any).env?.VITE_API_URL ??
  ((import.meta as any).env?.DEV ? '' : 'https://holy-oly-3.onrender.com');

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Convierte VAPID public key (base64url) a Uint8Array que pide la Web Push API. */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/** Convierte un ArrayBuffer (PushSubscription keys) a base64url. */
function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function authHeader(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/* ------------------------------------------------------------------ */
/* Public API                                                         */
/* ------------------------------------------------------------------ */

/** True si el browser soporta SW + Push + Notification. */
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function getCurrentPermission(): NotificationPermission {
  if (typeof Notification === 'undefined') return 'denied';
  return Notification.permission;
}

/** Registra /sw.js. Devuelve el registration o null si no se soporta. */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    // Esperar a que esté ready (controlando la página)
    await navigator.serviceWorker.ready;
    return reg;
  } catch (err) {
    console.error('[push] SW register failed', err);
    return null;
  }
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  try {
    return await Notification.requestPermission();
  } catch (err) {
    console.error('[push] permission request failed', err);
    return 'denied';
  }
}

/** Lee la VAPID pública del env o la pide al server como fallback. */
export async function getVapidPublicKey(): Promise<string | null> {
  const envKey = (import.meta as any).env?.VITE_VAPID_PUBLIC_KEY as string | undefined;
  if (envKey && envKey.length > 0) return envKey;

  try {
    const res = await fetch(`${API_URL}/v1/notifications/vapid-public-key`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.publicKey ?? null;
  } catch (err) {
    console.error('[push] fetch vapid key failed', err);
    return null;
  }
}

/** Crea (o reutiliza) la PushSubscription contra el SW. */
export async function subscribeToPush(
  swReg: ServiceWorkerRegistration,
  vapidPublicKey: string,
): Promise<PushSubscription | null> {
  try {
    const existing = await swReg.pushManager.getSubscription();
    if (existing) return existing;

    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
    const sub = await swReg.pushManager.subscribe({
      userVisibleOnly: true,
      // Cast: TS lib types prefer BufferSource (ArrayBuffer), pero Uint8Array es
      // válido en runtime per PushSubscriptionOptionsInit spec.
      applicationServerKey: applicationServerKey as BufferSource,
    });
    return sub;
  } catch (err) {
    console.error('[push] subscribe failed', err);
    return null;
  }
}

export async function sendSubscriptionToServer(sub: PushSubscription): Promise<void> {
  const body = {
    endpoint: sub.endpoint,
    keys: {
      p256dh: arrayBufferToBase64(sub.getKey('p256dh')),
      auth: arrayBufferToBase64(sub.getKey('auth')),
    },
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 500) : null,
  };

  const res = await fetch(`${API_URL}/v1/notifications/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? 'No pudimos guardar la suscripción');
  }
}

export async function unsubscribeFromPush(swReg: ServiceWorkerRegistration): Promise<boolean> {
  try {
    const sub = await swReg.pushManager.getSubscription();
    if (!sub) return true;
    const endpoint = sub.endpoint;
    const ok = await sub.unsubscribe();
    // Avisamos al server (best-effort)
    try {
      await fetch(`${API_URL}/v1/notifications/subscribe`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader(),
        },
        body: JSON.stringify({ endpoint }),
      });
    } catch (_) {
      /* server error no debería bloquear el unsubscribe local */
    }
    return ok;
  } catch (err) {
    console.error('[push] unsubscribe failed', err);
    return false;
  }
}

/** Flujo completo · happy path. Devuelve true si quedó suscripto. */
export async function enablePushNotifications(): Promise<{
  ok: boolean;
  reason?: 'unsupported' | 'denied' | 'no-vapid' | 'subscribe-failed' | 'server-error';
}> {
  if (!isPushSupported()) return { ok: false, reason: 'unsupported' };

  const reg = await registerServiceWorker();
  if (!reg) return { ok: false, reason: 'unsupported' };

  const perm = await requestPermission();
  if (perm !== 'granted') return { ok: false, reason: 'denied' };

  const vapid = await getVapidPublicKey();
  if (!vapid) return { ok: false, reason: 'no-vapid' };

  const sub = await subscribeToPush(reg, vapid);
  if (!sub) return { ok: false, reason: 'subscribe-failed' };

  try {
    await sendSubscriptionToServer(sub);
    return { ok: true };
  } catch (err) {
    console.error('[push] server error', err);
    return { ok: false, reason: 'server-error' };
  }
}

export async function disablePushNotifications(): Promise<boolean> {
  if (!isPushSupported()) return false;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return true;
  return unsubscribeFromPush(reg);
}
