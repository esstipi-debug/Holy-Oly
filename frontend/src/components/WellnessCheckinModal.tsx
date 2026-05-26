import React, { useState } from 'react';
import BottomSheet from './BottomSheet';
import { wellness, type WellnessCheckinResponse } from '../lib/wellness';

/**
 * WellnessCheckinModal · bottom-sheet con form de check-in diario.
 * Sliders/inputs amigables para sueño, soreness, motivación, life stress,
 * cafeína, hidratación y HRV. Submit → POST /v1/wellness/checkin.
 *
 * Confirmación inline "✓ Check-in guardado" antes de cerrar (1.2s).
 */

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: (data: WellnessCheckinResponse) => void;
}

interface SliderRowProps {
  label: string;
  emoji: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
  /** Hint corto bajo el slider */
  hint?: string;
  /** Color accent override (default gold) */
  accent?: string;
}

const ACCENT = '#F5C518';

const SliderRow: React.FC<SliderRowProps> = ({
  label, emoji, value, min, max, step = 1, unit, onChange, hint, accent = ACCENT,
}) => (
  <div style={{ marginBottom: 18 }}>
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
        <span style={{ marginRight: 6 }}>{emoji}</span>{label}
      </span>
      <span style={{
        fontSize: 16, fontWeight: 900, color: accent,
        fontVariantNumeric: 'tabular-nums', fontStyle: 'italic',
      }}>
        {value}{unit ?? ''}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      style={{
        width: '100%',
        accentColor: accent,
        cursor: 'pointer',
      }}
    />
    {hint && (
      <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>
        {hint}
      </div>
    )}
  </div>
);

const WellnessCheckinModal: React.FC<Props> = ({ open, onClose, onSaved }) => {
  const [sleepHours, setSleepHours] = useState(7.5);
  const [sleepQuality, setSleepQuality] = useState(3);
  const [soreness, setSoreness] = useState(3);
  const [motivation, setMotivation] = useState(7);
  const [lifeStress, setLifeStress] = useState(4);
  const [caffeineMg, setCaffeineMg] = useState(0);
  const [hydrationL, setHydrationL] = useState(2);
  const [hrv, setHrv] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await wellness.create({
        sleep_hours: sleepHours,
        sleep_quality: sleepQuality,
        soreness,
        motivation,
        life_stress: lifeStress,
        caffeine_mg: caffeineMg,
        hydration_liters: hydrationL,
        hrv: hrv === '' ? null : Number(hrv),
        notes: notes.trim() || null,
      });
      setSaved(true);
      onSaved?.(res);
      window.setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1200);
    } catch (err) {
      // El fallback offline ya escribió a localStorage en lib/wellness.ts ·
      // mostramos el éxito al usuario y avisamos del modo offline.
      const msg = err instanceof Error ? err.message : 'Error de red';
      setError(`Guardado local (sin conexión): ${msg.slice(0, 80)}`);
      setSaved(true);
      onSaved?.({
        id: `local-${Date.now()}`,
        user_id: 'local',
        sleep_hours: sleepHours,
        sleep_quality: sleepQuality,
        soreness,
        motivation,
        life_stress: lifeStress,
        caffeine_mg: caffeineMg,
        hydration_liters: hydrationL,
        hrv: hrv === '' ? null : Number(hrv),
        notes: notes.trim() || null,
        created_at: new Date().toISOString(),
      });
      window.setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1600);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomSheet open={open} onClose={submitting ? () => undefined : onClose} title="Check-in de hoy">
      {saved ? (
        <div style={{ textAlign: 'center', padding: '24px 0 12px' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>✓</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: ACCENT, marginBottom: 4 }}>
            Check-in guardado
          </div>
          {error && (
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>
              {error}
            </div>
          )}
        </div>
      ) : (
        <>
          <SliderRow
            emoji="😴"
            label="Horas de sueño"
            value={sleepHours}
            min={0}
            max={12}
            step={0.5}
            unit="h"
            onChange={setSleepHours}
            hint="Total reales, ignorando despertares cortos."
          />
          <SliderRow
            emoji="⭐"
            label="Calidad del sueño"
            value={sleepQuality}
            min={1}
            max={5}
            onChange={setSleepQuality}
            hint="1 = pésimo · 5 = perfecto"
          />
          <SliderRow
            emoji="💪"
            label="Soreness muscular"
            value={soreness}
            min={1}
            max={10}
            onChange={setSoreness}
            hint="1 = fresco · 10 = todo duele"
          />
          <SliderRow
            emoji="🔥"
            label="Motivación"
            value={motivation}
            min={1}
            max={10}
            onChange={setMotivation}
            hint="1 = arrastrarte · 10 = romper el día"
          />
          <SliderRow
            emoji="🧠"
            label="Life stress"
            value={lifeStress}
            min={1}
            max={10}
            onChange={setLifeStress}
            hint="Trabajo / familia / cabeza"
          />
          <SliderRow
            emoji="☕"
            label="Cafeína hoy"
            value={caffeineMg}
            min={0}
            max={600}
            step={25}
            unit="mg"
            onChange={setCaffeineMg}
            hint="Café espresso ≈ 80mg · taza ≈ 100mg"
          />
          <SliderRow
            emoji="💧"
            label="Hidratación"
            value={hydrationL}
            min={0}
            max={6}
            step={0.25}
            unit="L"
            onChange={setHydrationL}
            hint="Agua + infusiones (no contar mate cocido)"
          />

          {/* HRV opcional · campo libre porque no todos tienen device */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                <span style={{ marginRight: 6 }}>💓</span>HRV (opcional)
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>ms</span>
            </label>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={200}
              placeholder="Ej. 65"
              value={hrv}
              onChange={e => {
                const v = e.target.value;
                setHrv(v === '' ? '' : Math.max(0, Math.min(200, Number(v))));
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--surface, rgba(255,255,255,0.04))',
                border: '1px solid var(--card-border, rgba(255,255,255,0.1))',
                borderRadius: 10,
                color: 'var(--text)',
                fontSize: 14,
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
              <span style={{ marginRight: 6 }}>📝</span>Notas (opcional)
            </label>
            <textarea
              maxLength={500}
              rows={2}
              placeholder="Algo que el coach debería saber…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--surface, rgba(255,255,255,0.04))',
                border: '1px solid var(--card-border, rgba(255,255,255,0.1))',
                borderRadius: 10,
                color: 'var(--text)',
                fontSize: 13,
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
            <div style={{ fontSize: 9, color: 'var(--text-secondary)', textAlign: 'right', marginTop: 2 }}>
              {notes.length}/500
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              width: '100%',
              padding: '14px 0',
              background: submitting ? `${ACCENT}66` : ACCENT,
              color: '#0A0A14',
              border: 'none',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 900,
              letterSpacing: '.02em',
              cursor: submitting ? 'wait' : 'pointer',
              fontFamily: 'inherit',
              boxShadow: submitting ? 'none' : `0 4px 18px ${ACCENT}55`,
              transition: 'all .15s ease',
            }}
          >
            {submitting ? 'Guardando…' : 'Guardar check-in'}
          </button>
        </>
      )}
    </BottomSheet>
  );
};

export default WellnessCheckinModal;
