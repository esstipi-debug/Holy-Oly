import React, { useEffect, useState } from 'react';
import { useNav } from '../context/NavigationContext';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../context/RoleContext';
import { api } from '../lib/api';

/**
 * Premium · pantalla de planes con MP Subscriptions.
 *
 * Flow:
 *   1. Fetch /v1/payments/plans → 4 planes con precios reales
 *   2. Filtra por audiencia (atleta o coach) según role del user logueado
 *   3. Toggle Mensual vs Anual
 *   4. Click "Suscribirme" → POST /v1/payments/intents { plan }
 *      → backend crea preapproval en MP
 *      → devuelve init_point (URL de MP-hosted checkout)
 *      → redirigimos al user con window.location.href
 *   5. Tras pagar en MP, MP redirige a FRONTEND_URL + webhook activa tier=pro
 */

interface Plan {
  id: string;
  label: string;
  amount: number;
  frequency: number;
  frequency_type: string;
  days: number;
  tier: string;
  audience: 'athlete' | 'coach';
}

interface PlansResponse {
  plans: Plan[];
  provider: string;
  currency: string;
  country: string;
  mp_public_key: string | null;
}

interface IntentResponse {
  id: string;
  code: string;
  plan: string;
  amount: number;
  currency: string;
  status: string;
  init_point?: string;
  preapproval_id?: string;
}

const FEATURES_BY_AUDIENCE: Record<'athlete' | 'coach', { label: string; pro: boolean }[]> = {
  athlete: [
    { label: 'Tracking ilimitado de PRs', pro: true },
    { label: 'Baseline / Tests de referencia · 28 tests', pro: true },
    { label: 'VoltaStats / HoStats · volumen + intensidad', pro: true },
    { label: 'Social Cards 9:16 viral · 14 celebraciones', pro: true },
    { label: 'WISE AI Coach contextual', pro: true },
    { label: 'Pildoras educativas ilimitadas', pro: true },
    { label: 'Sync entre dispositivos', pro: true },
    { label: 'Sin anuncios', pro: true },
  ],
  coach: [
    { label: 'Roster ilimitado de atletas', pro: true },
    { label: 'Asignar macrociclos · Ruso, Búlgaro, Cubano', pro: true },
    { label: 'Stats agregados del club · tonelaje, PRs', pro: true },
    { label: 'Toolbox 7 herramientas (deload, exportar, etc)', pro: true },
    { label: 'Inventario del box', pro: true },
    { label: 'Tarjetas viral para promo del club', pro: true },
    { label: 'Soporte prioritario', pro: true },
  ],
};

const PreMium: React.FC = () => {
  const { back } = useNav();
  const { user } = useAuth();
  const { role } = useRole();

  const audience: 'athlete' | 'coach' = role === 'coach' ? 'coach' : 'athlete';

  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<PlansResponse>('/v1/payments/plans')
      .then(d => setPlans(d.plans))
      .catch(e => setError(e.message || 'Error cargando planes'));
  }, []);

  const audiencePlans = (plans ?? []).filter(p => p.audience === audience);
  const monthly = audiencePlans.find(p => p.frequency === 1);
  const yearly = audiencePlans.find(p => p.frequency === 12);
  const active = period === 'monthly' ? monthly : yearly;

  const trialEnds = (user as any)?.trial_ends_at as string | undefined;
  const trialDays = trialEnds
    ? Math.max(0, Math.ceil((new Date(trialEnds).getTime() - Date.now()) / 86400000))
    : null;

  const handleSubscribe = async () => {
    if (!active) return;
    if (!user) {
      setError('Iniciá sesión primero');
      return;
    }
    setLoading(active.id);
    setError(null);
    try {
      const intent = await api.post<IntentResponse>('/v1/payments/intents', { plan: active.id });
      if (intent.init_point) {
        // Redirige a MP checkout — el user paga y MP redirige a back_url cuando termina
        window.location.href = intent.init_point;
      } else {
        setError('MP no devolvió init_point · revisá MP_PLAN_ID_* en backend');
        setLoading(null);
      }
    } catch (e: any) {
      setError(e.message || 'Error creando suscripción');
      setLoading(null);
    }
  };

  const formatCLP = (n: number) => `$${n.toLocaleString('es-CL')}`;
  const yearlyDiscountPct = monthly && yearly
    ? Math.round((1 - yearly.amount / (monthly.amount * 12)) * 100)
    : null;

  const accentColor = audience === 'coach' ? '#F5C518' : '#7C5CFF';
  const accentBg = audience === 'coach' ? 'rgba(245,197,24,0.12)' : 'rgba(124,92,255,0.12)';
  const accentBorder = audience === 'coach' ? 'rgba(245,197,24,0.45)' : 'rgba(124,92,255,0.45)';

  return (
    <div className="flex flex-col min-h-full bg-holy-bg text-holy-text">
      {/* Header */}
      <header className="px-6 pt-8 pb-2 text-center relative">
        <button
          onClick={back}
          className="absolute left-4 top-7 text-holy-text-secondary text-xl"
          aria-label="Volver"
        >←</button>
        <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: accentColor }}>
          PLAN PRO · {audience === 'coach' ? 'COACH' : 'ATLETA'}
        </p>
        <h1 className="text-2xl font-black mt-1">Suscribite a Holy Oly</h1>
        {trialDays != null && trialDays > 0 && (
          <p className="text-[11px] mt-2 px-3 py-1 inline-block rounded-full"
            style={{ background: accentBg, color: accentColor, border: `1px solid ${accentBorder}` }}>
            🎁 {trialDays} días restantes de trial · suscribite y los conservás
          </p>
        )}
      </header>

      <div className="flex-1 px-4 pb-6 overflow-y-auto">
        {/* Toggle Mensual / Anual */}
        <div className="mt-6 mb-5 flex justify-center">
          <div className="inline-flex rounded-full p-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              onClick={() => setPeriod('monthly')}
              className="px-4 py-1.5 text-[11px] font-black tracking-wider uppercase rounded-full transition"
              style={{
                background: period === 'monthly' ? accentColor : 'transparent',
                color: period === 'monthly' ? '#07070F' : 'var(--text-secondary, #94A3B8)',
              }}
            >Mensual</button>
            <button
              onClick={() => setPeriod('yearly')}
              className="px-4 py-1.5 text-[11px] font-black tracking-wider uppercase rounded-full transition relative"
              style={{
                background: period === 'yearly' ? accentColor : 'transparent',
                color: period === 'yearly' ? '#07070F' : 'var(--text-secondary, #94A3B8)',
              }}
            >
              Anual
              {yearlyDiscountPct != null && yearlyDiscountPct > 0 && (
                <span className="absolute -top-2 -right-2 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-green-500 text-black">
                  -{yearlyDiscountPct}%
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Hero Plan Card */}
        {active && (
          <div
            className="rounded-3xl p-6 mb-5 text-center relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${accentBg} 0%, rgba(255,255,255,0.02) 100%)`,
              border: `1px solid ${accentBorder}`,
              boxShadow: `0 0 32px ${accentBg}`,
            }}
          >
            <p className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: accentColor }}>
              {active.label}
            </p>
            <div className="flex items-baseline justify-center gap-1 mt-2">
              <span className="text-5xl font-black italic tracking-tighter">{formatCLP(active.amount)}</span>
              <span className="text-sm font-bold text-holy-text-secondary">
                {period === 'monthly' ? '/ mes' : '/ año'}
              </span>
            </div>
            {period === 'yearly' && monthly && (
              <p className="text-[11px] text-holy-text-secondary mt-1">
                Equivale a {formatCLP(Math.round(active.amount / 12))} / mes
              </p>
            )}
            <p className="text-[10px] mt-3 opacity-70">
              Renovación automática · cancelás cuando quieras
            </p>
          </div>
        )}

        {!plans && !error && (
          <p className="text-center text-holy-text-secondary text-sm py-10">Cargando planes...</p>
        )}

        {/* Features */}
        {active && (
          <div className="rounded-2xl mb-5"
            style={{ background: '#0F0F1C', border: '1px solid #1E1E32' }}>
            <p className="px-4 pt-3 pb-2 text-[10px] font-black uppercase tracking-widest text-holy-text-secondary">
              Incluye:
            </p>
            <div className="px-4 pb-3 flex flex-col gap-2">
              {FEATURES_BY_AUDIENCE[audience].map((f) => (
                <div key={f.label} className="flex items-center gap-2">
                  <span style={{ color: accentColor }}>✓</span>
                  <span className="text-[12px] text-holy-text">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl p-3 mb-4 text-center text-[12px] font-bold"
            style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}>
            {error}
          </div>
        )}
      </div>

      {/* CTA */}
      <footer className="px-6 pb-8 space-y-3">
        <button
          onClick={handleSubscribe}
          disabled={!active || loading != null}
          className="w-full py-4 rounded-2xl font-black text-sm tracking-wider uppercase active:scale-95 transition disabled:opacity-50"
          style={{
            background: `linear-gradient(135deg, ${accentColor}, ${audience === 'coach' ? '#D4A800' : '#5B3FE8'})`,
            color: '#07070F',
            boxShadow: `0 10px 32px ${accentBg}`,
          }}
        >
          {loading
            ? 'Conectando con MercadoPago...'
            : active
              ? `Suscribirme — ${formatCLP(active.amount)}${period === 'monthly' ? '/mes' : '/año'}`
              : 'Cargando...'}
        </button>
        <p className="text-center text-[10px] text-holy-text-secondary">
          🔒 Cobro seguro vía MercadoPago · podés cancelar en cualquier momento
        </p>
      </footer>
    </div>
  );
};

export default PreMium;
