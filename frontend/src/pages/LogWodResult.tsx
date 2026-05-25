import React, { useState } from 'react';
import { useNav } from '../context/NavigationContext';
import {
  BENCHMARKS, saveResult, detectPR, packRoundsReps,
  type WodResult, type WodScale, type WodScoreType,
} from '../data/wodResults';

/**
 * LogWodResult · pantalla para loggear el resultado de un WOD post-sesión.
 *
 * Flow:
 *  1. Elegir si es benchmark conocido (Fran, Helen, etc.) o WOD custom
 *  2. Auto-detecta scoreType según benchmark, o el atleta elige (time/rounds+reps/max load)
 *  3. Inputs según scoreType
 *  4. Escala (Rx+/Rx/Scaled/Beginner)
 *  5. Notas opcionales
 *  6. Save → si es PR de benchmark, navega a SOCIAL con celebration auto-prefilled
 */

const C = {
  bg: '#07070F', surface: '#0F0F1C', line: '#1E1E32',
  text: '#EAEAF5', muted: '#94A3B8', dim: '#52527A',
  cyan: '#00E5FF', green: '#22C55E', amber: '#FFB300', primary: '#7C5CFF',
};

const LogWodResult: React.FC = () => {
  const { navigate, back } = useNav();

  const [mode, setMode] = useState<'benchmark' | 'custom'>('benchmark');
  const [selectedBenchmark, setSelectedBenchmark] = useState<string>('fran');
  const [customName, setCustomName] = useState('');
  const [scoreType, setScoreType] = useState<WodScoreType>('time');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [rounds, setRounds] = useState('');
  const [extraReps, setExtraReps] = useState('');
  const [singleNum, setSingleNum] = useState('');
  const [scale, setScale] = useState<WodScale>('Rx');
  const [notes, setNotes] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const benchmark = BENCHMARKS.find(b => b.id === selectedBenchmark);
  const effectiveScoreType: WodScoreType = mode === 'benchmark' && benchmark ? benchmark.scoreType : scoreType;
  const wodName = mode === 'benchmark' ? (benchmark?.name ?? '') : customName.trim();

  const canSave = (() => {
    if (!wodName) return false;
    if (effectiveScoreType === 'time') {
      const total = (parseInt(minutes || '0', 10) * 60) + parseInt(seconds || '0', 10);
      return total > 0;
    }
    if (effectiveScoreType === 'rounds_reps') {
      return parseInt(rounds || '0', 10) >= 0 && parseInt(extraReps || '0', 10) >= 0 && (parseInt(rounds || '0', 10) + parseInt(extraReps || '0', 10) > 0);
    }
    return parseFloat(singleNum || '0') > 0;
  })();

  const handleSave = () => {
    let scoreValue = 0;
    let scoreDisplay = '';

    if (effectiveScoreType === 'time') {
      const m = parseInt(minutes || '0', 10);
      const s = parseInt(seconds || '0', 10);
      scoreValue = m * 60 + s;
      scoreDisplay = `${m}:${String(s).padStart(2, '0')}`;
    } else if (effectiveScoreType === 'rounds_reps') {
      const r = parseInt(rounds || '0', 10);
      const er = parseInt(extraReps || '0', 10);
      scoreValue = packRoundsReps(r, er);
      scoreDisplay = `${r}+${er}`;
    } else {
      const v = parseFloat(singleNum);
      scoreValue = v;
      scoreDisplay = effectiveScoreType === 'max_load' ? `${v}kg` : effectiveScoreType === 'calories' ? `${v} cal` : `${v} reps`;
    }

    const result: WodResult = {
      id: `wod_${Date.now().toString(36)}`,
      name: wodName,
      benchmark: mode === 'benchmark' ? selectedBenchmark : undefined,
      scoreType: effectiveScoreType,
      scoreValue,
      scoreDisplay,
      scale,
      notes: notes.trim() || undefined,
      performedAt: new Date().toISOString(),
    };

    saveResult(result);
    const pr = detectPR(result);

    if (pr.isPR && mode === 'benchmark') {
      // Pre-cargar celebration de tipo wod_benchmark para auto-trigger
      localStorage.setItem('social:preferred_celebration', 'wod_fran'); // genérico — celebrations.ts ya tiene wod_fran
      localStorage.setItem('social:preferred_variant', 'stadium');
      setFeedback(`🔥 PR · ${pr.deltaDisplay ?? ''} · llevándote a compartir...`);
      setTimeout(() => navigate('SOCIAL'), 1400);
    } else if (pr.isPR) {
      setFeedback(`✓ Primer registro guardado`);
      setTimeout(() => back(), 1200);
    } else {
      setFeedback(`✓ Resultado guardado · no es PR (sigue probando)`);
      setTimeout(() => back(), 1500);
    }
  };

  return (
    <div className="anim-fade-in" style={{ background: C.bg, minHeight: '100%', color: C.text, paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px' }}>
        <button onClick={back} aria-label="Volver"
          style={{ background: 'transparent', border: 'none', color: C.text, fontSize: 22, padding: 4, cursor: 'pointer' }}>←</button>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.12em', color: C.cyan, textTransform: 'uppercase' }}>POST-WOD</p>
          <h1 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-.02em', margin: 0 }}>Loggear resultado</h1>
        </div>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 8 }}>
          <ModeChip active={mode === 'benchmark'} onClick={() => setMode('benchmark')} label="Benchmark" />
          <ModeChip active={mode === 'custom'} onClick={() => setMode('custom')} label="WOD custom" />
        </div>

        {/* Benchmark picker */}
        {mode === 'benchmark' && (
          <Section title="¿Qué benchmark?">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
              {BENCHMARKS.map(b => (
                <button key={b.id} onClick={() => setSelectedBenchmark(b.id)} className="btn-press"
                  style={{
                    padding: '8px 10px', borderRadius: 12,
                    background: selectedBenchmark === b.id ? `${C.cyan}1A` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${selectedBenchmark === b.id ? C.cyan : 'rgba(255,255,255,0.08)'}`,
                    color: selectedBenchmark === b.id ? C.cyan : C.text,
                    fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                    textAlign: 'left',
                  }}>{b.name}</button>
              ))}
            </div>
            {benchmark && (
              <p style={{ fontSize: 11, color: C.muted, marginTop: 10, lineHeight: 1.4 }}>
                {benchmark.description}<br/>
                <span style={{ color: C.amber, fontWeight: 700 }}>Standard RX: {benchmark.rxStandard}</span>
              </p>
            )}
          </Section>
        )}

        {/* Custom name */}
        {mode === 'custom' && (
          <Section title="Nombre del WOD">
            <input
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              placeholder="Ej: AMRAP 20 Burpees · Heavy DT"
              style={inputStyle}
              autoFocus
            />
            <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(['time','rounds_reps','max_load','reps','calories'] as WodScoreType[]).map(t => (
                <button key={t} onClick={() => setScoreType(t)} className="btn-press"
                  style={{
                    padding: '5px 10px', borderRadius: 14, fontSize: 10, fontWeight: 800,
                    background: scoreType === t ? `${C.primary}1F` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${scoreType === t ? C.primary : 'rgba(255,255,255,0.08)'}`,
                    color: scoreType === t ? '#A88BFF' : C.muted,
                    cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase',
                  }}>{t.replace('_', ' ')}</button>
              ))}
            </div>
          </Section>
        )}

        {/* Score input */}
        <Section title="Tu resultado">
          {effectiveScoreType === 'time' && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="number" inputMode="numeric" value={minutes} onChange={e => setMinutes(e.target.value)}
                placeholder="min" style={{ ...inputStyle, textAlign: 'center', maxWidth: 90 }} />
              <span style={{ fontSize: 26, fontWeight: 900 }}>:</span>
              <input type="number" inputMode="numeric" value={seconds} onChange={e => setSeconds(e.target.value)}
                placeholder="seg" style={{ ...inputStyle, textAlign: 'center', maxWidth: 90 }} />
            </div>
          )}

          {effectiveScoreType === 'rounds_reps' && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="number" inputMode="numeric" value={rounds} onChange={e => setRounds(e.target.value)}
                placeholder="rondas" style={{ ...inputStyle, textAlign: 'center', maxWidth: 110 }} />
              <span style={{ fontSize: 22, fontWeight: 900, color: C.cyan }}>+</span>
              <input type="number" inputMode="numeric" value={extraReps} onChange={e => setExtraReps(e.target.value)}
                placeholder="reps" style={{ ...inputStyle, textAlign: 'center', maxWidth: 110 }} />
            </div>
          )}

          {(effectiveScoreType === 'max_load' || effectiveScoreType === 'reps' || effectiveScoreType === 'calories') && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input type="number" inputMode="decimal" value={singleNum} onChange={e => setSingleNum(e.target.value)}
                placeholder={effectiveScoreType === 'max_load' ? 'kg' : effectiveScoreType === 'calories' ? 'cal' : 'reps'}
                style={{ ...inputStyle, flex: 1 }} />
              <span style={{ fontSize: 14, fontWeight: 800, color: C.muted, minWidth: 50 }}>
                {effectiveScoreType === 'max_load' ? 'kg' : effectiveScoreType === 'calories' ? 'cal' : 'reps'}
              </span>
            </div>
          )}
        </Section>

        {/* Scale */}
        <Section title="Escala">
          <div style={{ display: 'flex', gap: 6 }}>
            {(['Rx+','Rx','Scaled','Beginner'] as WodScale[]).map(s => (
              <button key={s} onClick={() => setScale(s)} className="btn-press"
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 10, fontSize: 12, fontWeight: 800,
                  background: scale === s ? scaleColor(s) + '22' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${scale === s ? scaleColor(s) : 'rgba(255,255,255,0.08)'}`,
                  color: scale === s ? scaleColor(s) : C.muted,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>{s}</button>
            ))}
          </div>
        </Section>

        {/* Notes */}
        <Section title="Notas (opcional)">
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="¿Cómo te sentiste? Algo para recordar..."
            rows={3}
            style={{ ...inputStyle, resize: 'vertical', minHeight: 60, fontSize: 13, fontWeight: 500, textAlign: 'left' }} />
        </Section>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="btn-press"
          style={{
            padding: '14px', borderRadius: 14,
            background: canSave ? `linear-gradient(135deg, ${C.cyan}, ${C.primary})` : 'rgba(255,255,255,0.05)',
            color: canSave ? '#07070F' : C.dim,
            fontSize: 13, fontWeight: 900, letterSpacing: '.05em', textTransform: 'uppercase',
            border: 'none', cursor: canSave ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
            boxShadow: canSave ? `0 8px 24px ${C.cyan}40` : 'none',
            marginTop: 8,
          }}
        >Guardar resultado</button>

        {feedback && (
          <p style={{ fontSize: 12, textAlign: 'center', color: feedback.includes('🔥') ? C.amber : C.green, fontWeight: 700, marginTop: 4 }}>
            {feedback}
          </p>
        )}
      </div>
    </div>
  );
};

function scaleColor(s: WodScale): string {
  if (s === 'Rx+') return '#F5C518';
  if (s === 'Rx') return '#22C55E';
  if (s === 'Scaled') return '#56CCF2';
  return '#94A3B8';
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{
    background: C.surface, border: `1px solid ${C.line}`,
    borderRadius: 16, padding: 14,
  }}>
    <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', color: C.muted, textTransform: 'uppercase', margin: 0, marginBottom: 10 }}>{title}</p>
    {children}
  </div>
);

const ModeChip: React.FC<{ active: boolean; onClick: () => void; label: string }> = ({ active, onClick, label }) => (
  <button onClick={onClick} className="btn-press"
    style={{
      flex: 1, padding: '8px 0', borderRadius: 10, fontSize: 12, fontWeight: 800,
      background: active ? `${C.cyan}1A` : 'rgba(255,255,255,0.02)',
      border: `1px solid ${active ? C.cyan : 'rgba(255,255,255,0.08)'}`,
      color: active ? C.cyan : C.muted,
      cursor: 'pointer', fontFamily: 'inherit',
    }}>{label}</button>
);

const inputStyle: React.CSSProperties = {
  padding: '10px 12px', borderRadius: 10,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.10)',
  color: C.text,
  fontSize: 18, fontWeight: 900, textAlign: 'center',
  outline: 'none', fontFamily: 'inherit',
  width: '100%',
};

export default LogWodResult;
