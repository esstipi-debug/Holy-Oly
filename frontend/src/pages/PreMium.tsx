import React, { useEffect, useState } from 'react';
import { useNav } from '../context/NavigationContext';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../context/RoleContext';
import { api } from '../lib/api';
import '../styles/v2/premium.css';

/**
 * Premium · pantalla de planes con MP Subscriptions.
 * Estilo V2 dark "Macrociclos" · scoped bajo `.prem-root` · acento oro
 * (--engine-belt, identidad premium/XP). Se monta dentro de PhoneLayout
 * (chrome + bottom nav) → no dibuja chrome propio. Lógica intacta: fetch
 * de planes, filtro por audiencia, toggle período, intent de pago y
 * redirección a MP se preservan; solo cambia la presentación. El color de
 * acento varía por audiencia (coach oro · atleta violeta) vía `--c` inline.
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

  // Acento dinámico por audiencia: coach oro (XP/belt) · atleta violeta (adapt).
  const accentColor = audience === 'coach' ? '#F5C518' : '#7C5CFF';

  return (
    <div className="prem-root anim-fade-in" style={{ '--c': accentColor } as React.CSSProperties}>
      <div className="prem-scroll">
        {/* Header */}
        <div className="prem-head">
          <button className="prem-back btn-press" onClick={back} aria-label="Volver">←</button>
          <p className="prem-eyebrow">Plan Pro · {audience === 'coach' ? 'Coach' : 'Atleta'}</p>
          <h1 className="prem-title">Suscribite a Holy Oly</h1>
          {trialDays != null && trialDays > 0 && (
            <p className="prem-trial">
              🎁 {trialDays} días restantes de trial · suscribite y los conservás
            </p>
          )}
        </div>

        {/* Toggle Mensual / Anual */}
        <div className="prem-toggle-wrap">
          <div className="prem-toggle">
            <button
              className="prem-toggle-btn btn-press"
              data-active={period === 'monthly'}
              onClick={() => setPeriod('monthly')}
            >Mensual</button>
            <button
              className="prem-toggle-btn btn-press"
              data-active={period === 'yearly'}
              onClick={() => setPeriod('yearly')}
            >
              Anual
              {yearlyDiscountPct != null && yearlyDiscountPct > 0 && (
                <span className="prem-toggle-badge">-{yearlyDiscountPct}%</span>
              )}
            </button>
          </div>
        </div>

        {/* Hero Plan Card */}
        {active && (
          <div className="prem-hero">
            <p className="prem-hero-label">{active.label}</p>
            <div className="prem-hero-row">
              <span className="prem-hero-price">{formatCLP(active.amount)}</span>
              <span className="prem-hero-period">{period === 'monthly' ? '/ mes' : '/ año'}</span>
            </div>
            {period === 'yearly' && monthly && (
              <p className="prem-hero-equiv">
                Equivale a {formatCLP(Math.round(active.amount / 12))} / mes
              </p>
            )}
            <p className="prem-hero-fine">
              Renovación automática · cancelás cuando quieras
            </p>
          </div>
        )}

        {!plans && !error && (
          <p className="prem-loading">Cargando planes...</p>
        )}

        {/* Features */}
        {active && (
          <div className="prem-features">
            <p className="prem-features-title">Incluye:</p>
            <div className="prem-features-list">
              {FEATURES_BY_AUDIENCE[audience].map((f) => (
                <div key={f.label} className="prem-feature">
                  <span className="prem-feature-check">✓</span>
                  <span className="prem-feature-label">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="prem-error">{error}</div>
        )}
      </div>

      {/* CTA */}
      <footer className="prem-cta">
        <button
          className="prem-cta-btn btn-press"
          onClick={handleSubscribe}
          disabled={!active || loading != null}
        >
          {loading
            ? 'Conectando con MercadoPago...'
            : active
              ? `Suscribirme — ${formatCLP(active.amount)}${period === 'monthly' ? '/mes' : '/año'}`
              : 'Cargando...'}
        </button>
        <p className="prem-cta-fine">
          🔒 Cobro seguro vía MercadoPago · podés cancelar en cualquier momento
        </p>
      </footer>
    </div>
  );
};

export default PreMium;
