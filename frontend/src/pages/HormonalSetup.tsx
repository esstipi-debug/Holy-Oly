import React, { useEffect, useState } from 'react';
import { useNav } from '../context/NavigationContext';
import { hormonalApi, PHASE_COLORS, type HormonalCurrent } from '../lib/hormonal';

/**
 * Engine 13 · Setup + management de tracking hormonal.
 *
 * Flow:
 *  - Si ya hay tracking activo · muestra current phase + opciones (reconfigurar / desactivar)
 *  - Si no · formulario opt-in con cycle_start_date + length + disclaimer privacy
 *
 * Privacidad: nada de gender flag obligatorio en signup. Solo se setea acá si la
 * atleta lo activa explícitamente. La data se elimina con delete account.
 */
const HormonalSetup: React.FC = () => {
  const { back } = useNav();
  const [current, setCurrent] = useState<HormonalCurrent | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7); // sugerencia · una semana atrás
    return d.toISOString().slice(0, 10);
  });
  const [cycleLength, setCycleLength] = useState<number>(28);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    setLoading(true);
    hormonalApi.current()
      .then((c) => { setCurrent(c); setStartDate(c.cycle_start_date); setCycleLength(c.cycle_length_days); })
      .catch(() => setCurrent(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await hormonalApi.setup({
        cycle_start_date: startDate,
        cycle_length_days: cycleLength,
        source: 'manual',
      });
      setEditing(false);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDisable = async () => {
    if (!window.confirm('¿Desactivar tracking hormonal?\n\nTus logs históricos quedan guardados · podés reactivar cuando quieras. Para borrar todo, usá "Eliminar cuenta" en Perfil.')) return;
    setSaving(true);
    try {
      await hormonalApi.disable();
      setCurrent(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos desactivar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, color: 'var(--text-secondary)' }}>Cargando…</div>
    );
  }

  // Vista CONFIGURADO · muestra fase actual + opciones
  if (current && !editing) {
    const colors = PHASE_COLORS[current.phase];
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100%', paddingBottom: 90 }}>
        <Header onBack={back} title="Ciclo hormonal" />
        <div style={{ padding: '0 20px' }}>
          <div style={{
            background: colors.bg,
            border: `1px solid ${colors.primary}55`,
            borderRadius: 20,
            padding: 20,
            marginBottom: 16,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{colors.emoji}</div>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.14em', color: colors.primary, textTransform: 'uppercase', margin: 0 }}>
              Fase actual
            </p>
            <h2 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text)', margin: '4px 0' }}>{colors.label}</h2>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
              Día <strong style={{ color: colors.primary }}>{current.day_of_cycle}</strong> de {current.cycle_length_days} · Próxima fase en {current.days_until_next_period}d
            </p>
          </div>

          <RecommendationsCard current={current} />

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button
              onClick={() => setEditing(true)}
              className="btn-press"
              style={{
                flex: 1, padding: '13px 0', borderRadius: 14,
                background: 'var(--surface)', border: '1px solid var(--card-border)',
                color: 'var(--text)', fontSize: 12, fontWeight: 800,
                cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '.04em',
              }}
            >Reconfigurar</button>
            <button
              onClick={handleDisable}
              disabled={saving}
              className="btn-press"
              style={{
                flex: 1, padding: '13px 0', borderRadius: 14,
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                color: '#f87171', fontSize: 12, fontWeight: 800,
                cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '.04em',
              }}
            >Desactivar</button>
          </div>
        </div>
      </div>
    );
  }

  // Vista FORMULARIO · opt-in o reconfigurar
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%', paddingBottom: 90 }}>
      <Header onBack={() => editing ? setEditing(false) : back()} title={current ? 'Reconfigurar ciclo' : 'Activar tracking hormonal'} />
      <div style={{ padding: '0 20px' }}>

        {!current && (
          <div style={{
            background: 'rgba(124,92,255,0.08)',
            border: '1px solid rgba(124,92,255,0.25)',
            borderRadius: 16, padding: '14px 16px', marginBottom: 16,
          }}>
            <p style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5, margin: 0 }}>
              Adapta tus entrenamientos a tu ciclo. Las cargas se ajustan automáticamente entre <strong>-15%</strong> (menstruación) y <strong>+10%</strong> (ovulación) según la fase actual.
            </p>
            <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.5 }}>
              <strong>Privacidad:</strong> tu data es privada. Sólo vos la ves. El coach no accede sin tu consentimiento explícito. Si eliminás tu cuenta, esta info se borra completa.
            </p>
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
            Primer día de tu último período
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            max={new Date().toISOString().slice(0, 10)}
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 12,
              background: 'var(--surface)', border: '1px solid var(--card-border)',
              color: 'var(--text)', fontSize: 14, fontFamily: 'inherit',
            }}
          />
          <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 6 }}>
            El primer día de sangrado de tu último ciclo. Aproximado está OK · podés reconfigurar después.
          </p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
            Largo del ciclo (días)
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="range" min={21} max={45} value={cycleLength}
              onChange={(e) => setCycleLength(Number(e.target.value))}
              style={{ flex: 1, accentColor: '#7C5CFF' }}
            />
            <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--text)', minWidth: 50, textAlign: 'right' }}>
              {cycleLength}d
            </span>
          </div>
          <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 6 }}>
            Promedio típico: 28 días. Rango normal: 21-35.
          </p>
        </div>

        {error && (
          <p style={{ color: '#f87171', fontSize: 12, marginBottom: 12, textAlign: 'center' }}>{error}</p>
        )}

        <button
          onClick={handleSave}
          disabled={saving || !startDate}
          className="btn-press"
          style={{
            width: '100%', padding: '14px 0', borderRadius: 14,
            background: saving ? 'var(--surface)' : 'linear-gradient(135deg, #7C5CFF, #A88BFF)',
            color: '#07070F', border: 'none',
            fontSize: 13, fontWeight: 900, letterSpacing: '.04em', textTransform: 'uppercase',
            cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit',
            opacity: saving ? 0.6 : 1,
            boxShadow: '0 8px 24px rgba(124,92,255,0.30)',
          }}
        >
          {saving ? 'Guardando…' : current ? 'Actualizar' : 'Activar tracking'}
        </button>
      </div>
    </div>
  );
};

const Header: React.FC<{ onBack: () => void; title: string }> = ({ onBack, title }) => (
  <div style={{ padding: '20px 20px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
    <button
      onClick={onBack}
      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 22, cursor: 'pointer', padding: 0, lineHeight: 1 }}
      aria-label="Volver"
    >←</button>
    <h1 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text)', margin: 0 }}>{title}</h1>
  </div>
);

const RecommendationsCard: React.FC<{ current: HormonalCurrent }> = ({ current }) => {
  const colors = PHASE_COLORS[current.phase];
  const r = current.recommendation;
  const pct = Math.round((r.load_multiplier - 1) * 100);
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--card-border)',
      borderRadius: 16, padding: 16,
    }}>
      <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 12 }}>
        Recomendaciones de la fase
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Row label="Ajuste de carga" value={`${pct > 0 ? '+' : ''}${pct}%`} color={colors.primary} />
        <Row label="Intensidad" value={`${r.intensity_adjustment_pct > 0 ? '+' : ''}${r.intensity_adjustment_pct}%`} color={colors.primary} />
        <Row label="Volumen" value={`${r.volume_adjustment_pct > 0 ? '+' : ''}${r.volume_adjustment_pct}%`} color={colors.primary} />
        <Row label="Foco" value={r.focus.replace(/_/g, ' ')} color="var(--text)" />
      </div>
      <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 12, lineHeight: 1.5, fontStyle: 'italic' }}>
        {r.coach_note}
      </p>
      <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.4 }}>
        💤 {r.rest_recommendation}
      </p>
    </div>
  );
};

const Row: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
    <span style={{ fontSize: 13, fontWeight: 800, color, textTransform: 'capitalize' }}>{value}</span>
  </div>
);

export default HormonalSetup;
