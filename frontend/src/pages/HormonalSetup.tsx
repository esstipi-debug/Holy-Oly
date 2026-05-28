import React, { useEffect, useState } from 'react';
import { useNav } from '../context/NavigationContext';
import { hormonalApi, PHASE_COLORS, type HormonalCurrent } from '../lib/hormonal';
import '../styles/v2/hormonal-setup.css';

/**
 * Engine 13 · Setup + management de tracking hormonal.
 * Estilo V2 dark "Macrociclos" · scoped bajo `.horm-root` · acento rosa
 * (--engine-hormonal, identidad ciclo). Se monta dentro de PhoneLayout.
 * Lógica intacta: todo el flujo (current/setup/disable, fase, fecha,
 * largo de ciclo) se preserva; solo cambia la presentación. Los colores
 * por fase vienen de PHASE_COLORS y se inyectan via `--c` inline.
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
      <div className="horm-root">
        <div className="horm-loading">Cargando…</div>
      </div>
    );
  }

  // Vista CONFIGURADO · muestra fase actual + opciones
  if (current && !editing) {
    const colors = PHASE_COLORS[current.phase];
    return (
      <div className="horm-root anim-fade-in">
        <div className="horm-scroll">
          <Header onBack={back} title="Ciclo hormonal" />

          <div className="horm-phase-hero" style={{ '--c': colors.primary } as React.CSSProperties}>
            <div className="horm-phase-emoji">{colors.emoji}</div>
            <p className="horm-phase-eyebrow">Fase actual</p>
            <h2 className="horm-phase-name">{colors.label}</h2>
            <p className="horm-phase-meta">
              Día <strong>{current.day_of_cycle}</strong> de {current.cycle_length_days} · Próxima fase en {current.days_until_next_period}d
            </p>
          </div>

          <RecommendationsCard current={current} />

          <div className="horm-actions">
            <button onClick={() => setEditing(true)} className="horm-btn-ghost btn-press">
              Reconfigurar
            </button>
            <button onClick={handleDisable} disabled={saving} className="horm-btn-danger btn-press">
              Desactivar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Vista FORMULARIO · opt-in o reconfigurar
  return (
    <div className="horm-root anim-fade-in">
      <div className="horm-scroll">
        <Header
          onBack={() => editing ? setEditing(false) : back()}
          title={current ? 'Reconfigurar ciclo' : 'Activar tracking'}
        />

        {!current && (
          <div className="horm-disclaimer">
            <p className="horm-disclaimer-lead">
              Adapta tus entrenamientos a tu ciclo. Las cargas se ajustan automáticamente entre <strong>-15%</strong> (menstruación) y <strong>+10%</strong> (ovulación) según la fase actual.
            </p>
            <p className="horm-disclaimer-priv">
              <strong>Privacidad:</strong> tu data es privada. Sólo vos la ves. El coach no accede sin tu consentimiento explícito. Si eliminás tu cuenta, esta info se borra completa.
            </p>
          </div>
        )}

        <div className="horm-field">
          <label className="horm-label">Primer día de tu último período</label>
          <input
            type="date"
            className="horm-input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            max={new Date().toISOString().slice(0, 10)}
          />
          <p className="horm-hint">
            El primer día de sangrado de tu último ciclo. Aproximado está OK · podés reconfigurar después.
          </p>
        </div>

        <div className="horm-field">
          <label className="horm-label">Largo del ciclo (días)</label>
          <div className="horm-range-row">
            <input
              type="range" min={21} max={45} value={cycleLength}
              className="horm-range"
              onChange={(e) => setCycleLength(Number(e.target.value))}
            />
            <span className="horm-range-val">{cycleLength}d</span>
          </div>
          <p className="horm-hint">Promedio típico: 28 días. Rango normal: 21-35.</p>
        </div>

        {error && <p className="horm-error">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving || !startDate}
          className="horm-save btn-press"
          data-saving={saving}
        >
          {saving ? 'Guardando…' : current ? 'Actualizar' : 'Activar tracking'}
        </button>
      </div>
    </div>
  );
};

const Header: React.FC<{ onBack: () => void; title: string }> = ({ onBack, title }) => (
  <div className="horm-head">
    <button onClick={onBack} className="horm-back btn-press" aria-label="Volver">←</button>
    <div className="horm-head-text">
      <p className="horm-eyebrow">Engine 13 · Ciclo</p>
      <h1 className="horm-title">{title}</h1>
    </div>
  </div>
);

const RecommendationsCard: React.FC<{ current: HormonalCurrent }> = ({ current }) => {
  const colors = PHASE_COLORS[current.phase];
  const r = current.recommendation;
  const pct = Math.round((r.load_multiplier - 1) * 100);
  return (
    <div className="horm-section">
      <p className="horm-sec-title">Recomendaciones de la fase</p>
      <div className="horm-rec-list">
        <Row label="Ajuste de carga" value={`${pct > 0 ? '+' : ''}${pct}%`} color={colors.primary} />
        <Row label="Intensidad" value={`${r.intensity_adjustment_pct > 0 ? '+' : ''}${r.intensity_adjustment_pct}%`} color={colors.primary} />
        <Row label="Volumen" value={`${r.volume_adjustment_pct > 0 ? '+' : ''}${r.volume_adjustment_pct}%`} color={colors.primary} />
        <Row label="Foco" value={r.focus.replace(/_/g, ' ')} />
      </div>
      <p className="horm-rec-note">{r.coach_note}</p>
      <p className="horm-rec-rest">💤 {r.rest_recommendation}</p>
    </div>
  );
};

const Row: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color }) => (
  <div className="horm-row">
    <span className="horm-row-label">{label}</span>
    <span className="horm-row-value" style={color ? ({ '--c': color } as React.CSSProperties) : undefined}>{value}</span>
  </div>
);

export default HormonalSetup;
