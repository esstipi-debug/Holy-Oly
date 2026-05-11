import React, { useState, useMemo } from 'react';
import { useProduct } from '../context/ProductContext';
import { MOVEMENTS, CATEGORIES, getMovement, getProgress, type MovementCategory, type MovementFamily, type MovementTier } from '../data/movements';

const C = {
  bg: '#07070F',
  surface: '#0F0F1C',
  surface2: '#161626',
  line: '#1E1E32',
  text: '#EAEAF5',
  muted: '#52527A',
};

// ─── TIER LADDER (visual de 5 niveles) ──────────────────────────────────
const TierLadder: React.FC<{ tiers: MovementTier[]; current: number; accent: string }> = ({ tiers, current, accent }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    {tiers.slice().reverse().map((t) => {
      const reached = t.level <= current;
      const isCurrent = t.level === current;
      return (
        <div key={t.level} style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          padding: '10px 12px', borderRadius: 12,
          background: isCurrent ? `${accent}15` : reached ? C.surface : C.surface2,
          border: `1px solid ${isCurrent ? accent : reached ? `${accent}30` : C.line}`,
          opacity: reached ? 1 : 0.55,
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: 8,
            background: reached ? accent : C.line,
            color: reached ? '#07070F' : C.muted,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 900, flexShrink: 0,
          }}>L{t.level}</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: reached ? C.text : C.muted, marginBottom: 2 }}>
              {t.name}
              {isCurrent && <span style={{ fontSize: 9, color: accent, marginLeft: 8, letterSpacing: '.08em' }}>● ACTUAL</span>}
            </p>
            <p style={{ fontSize: 10, color: C.muted, lineHeight: 1.4 }}>{t.reqs}</p>
            {t.unlocks && reached && (
              <p style={{ fontSize: 9, color: accent, marginTop: 4, fontWeight: 700 }}>
                ✓ Desbloquea: {t.unlocks}
              </p>
            )}
          </div>
        </div>
      );
    })}
  </div>
);

// ─── SPARKLINE de reps recientes ─────────────────────────────────────────
const Sparkline: React.FC<{ values: number[]; color: string; height?: number }> = ({ values, color, height = 60 }) => {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(1, max - min);
  const W = 280, H = height;
  const stepX = W / (values.length - 1);

  const points = values.map((v, i) => {
    const x = i * stepX;
    const y = H - ((v - min) / range) * (H - 12) - 6;
    return `${x},${y}`;
  });

  const path = `M ${points.join(' L ')}`;
  const area = `${path} L ${W},${H} L 0,${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#grad-${color})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {values.map((_, i) => {
        const [x, y] = points[i].split(',');
        return <circle key={i} cx={x} cy={y} r="3" fill={color} />;
      })}
    </svg>
  );
};

// ─── DETAIL VIEW ─────────────────────────────────────────────────────────
const MovementDetail: React.FC<{ mov: MovementFamily; onBack: () => void; accent: string }> = ({ mov, onBack, accent }) => {
  const progress = getProgress(mov.id);
  const nextTier = mov.tiers.find(t => t.level === ((progress?.currentLevel ?? 1) + 1));

  const recentValues = progress?.recentReps?.slice().reverse().map(r => r.value) ?? [];
  const repsUnit = progress?.recentReps?.[0]?.unit ?? 'reps';

  return (
    <div style={{ padding: '0 16px 80px' }}>
      <button
        onClick={onBack}
        style={{
          marginBottom: 12, padding: '6px 10px', borderRadius: 8,
          background: C.surface, border: `1px solid ${C.line}`,
          color: C.muted, fontSize: 11, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit',
        }}
      >← Volver al listado</button>

      {/* Hero */}
      <div style={{
        background: `linear-gradient(135deg, ${accent}10, transparent)`,
        border: `1px solid ${accent}30`,
        borderRadius: 18, padding: 16, marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
          <div style={{
            width: 54, height: 54, borderRadius: 16,
            background: `${accent}20`, border: `1px solid ${accent}55`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28,
          }}>{mov.emoji}</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.1em', color: accent, textTransform: 'uppercase' }}>
              {mov.category}
            </p>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: C.text, letterSpacing: '-.02em' }}>{mov.name}</h2>
          </div>
          <div style={{
            padding: '6px 12px', borderRadius: 12,
            background: accent, color: '#07070F',
            fontSize: 14, fontWeight: 900,
          }}>L{progress?.currentLevel ?? 1}/5</div>
        </div>

        {/* Progress to next */}
        {nextTier && progress && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <p style={{ fontSize: 10, color: C.muted, fontWeight: 700 }}>
                Progreso hacia <strong style={{ color: accent }}>{nextTier.name}</strong>
              </p>
              <p style={{ fontSize: 10, color: accent, fontWeight: 800 }}>{progress.progressToNext}%</p>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: C.line, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${progress.progressToNext}%`,
                background: accent, borderRadius: 3, transition: 'width .8s ease',
              }} />
            </div>
            <p style={{ fontSize: 10, color: C.muted, marginTop: 8, fontStyle: 'italic' }}>
              💡 {progress.blockers}
            </p>
          </>
        )}
      </div>

      {/* SPARKLINE */}
      {recentValues.length > 1 && (
        <>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 8 }}>
            Últimas sesiones · {repsUnit}
          </p>
          <div style={{
            background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14,
            padding: 14, marginBottom: 18,
          }}>
            <Sparkline values={recentValues} color={accent} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              {progress!.recentReps!.slice().reverse().map((r, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 12, fontWeight: 800, color: accent }}>{r.value}</p>
                  <p style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{r.date}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* HISTORY OF LEVEL CHANGES */}
      {progress && progress.history.length > 0 && (
        <>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 8 }}>
            Evolución de nivel
          </p>
          <div style={{
            background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14,
            padding: 14, marginBottom: 18,
          }}>
            <div style={{ position: 'relative', height: 64, padding: '8px 8px 24px' }}>
              {/* horizontal axis */}
              <div style={{ position: 'absolute', bottom: 24, left: 0, right: 0, height: 1, background: C.line }} />
              {progress.history.map((h, i) => {
                const pct = (i / Math.max(1, progress.history.length - 1)) * 100;
                return (
                  <div key={i} style={{
                    position: 'absolute', left: `${pct}%`, bottom: 0,
                    transform: 'translateX(-50%)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: accent, color: '#07070F',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 900,
                      marginBottom: 4,
                    }}>L{h.level}</div>
                    <p style={{ fontSize: 9, color: C.muted, fontWeight: 700, whiteSpace: 'nowrap' }}>{h.date}</p>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 10 }}>
              {progress.history.filter(h => h.note).map((h, i) => (
                <p key={i} style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>
                  <span style={{ color: accent, fontWeight: 700 }}>{h.date}</span> · {h.note}
                </p>
              ))}
            </div>
          </div>
        </>
      )}

      {/* TIER LADDER */}
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 8 }}>
        Camino completo · 5 niveles
      </p>
      <TierLadder tiers={mov.tiers} current={progress?.currentLevel ?? 1} accent={accent} />
    </div>
  );
};

// ─── PAGE PRINCIPAL ─────────────────────────────────────────────────────
const MovementProgression: React.FC = () => {
  const { product } = useProduct();
  const [filter, setFilter] = useState<MovementCategory | 'all'>('all');
  const [detailId, setDetailId] = useState<string | null>(null);

  const accent = product === 'volta' ? '#00E5FF' : '#22C55E';

  const movements = useMemo(() => {
    return MOVEMENTS
      .filter(m => m.product.includes(product))
      .filter(m => filter === 'all' || m.category === filter);
  }, [product, filter]);

  const stats = useMemo(() => {
    const myMovs = MOVEMENTS.filter(m => m.product.includes(product));
    const progresses = myMovs.map(m => getProgress(m.id)?.currentLevel ?? 1);
    const avg = progresses.reduce((a, b) => a + b, 0) / Math.max(1, progresses.length);
    return {
      total: myMovs.length,
      avgLevel: avg.toFixed(1),
      atL5: progresses.filter(l => l === 5).length,
      atL1: progresses.filter(l => l === 1).length,
    };
  }, [product]);

  const detail = detailId ? getMovement(detailId) : null;

  return (
    <div style={{ background: C.bg, minHeight: '100%', paddingBottom: 90, color: C.text }}>

      {/* HEADER */}
      <div style={{ padding: '48px 16px 12px' }}>
        <p style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: '.08em' }}>
          {product === 'volta' ? 'CROSSFIT' : 'HALTEROFILIA'} · SKILL TREE
        </p>
        <h1 style={{ fontSize: 21, fontWeight: 900, color: C.text, letterSpacing: '-.02em', marginTop: 2 }}>
          {detail ? detail.name : 'Mi progresión'}
        </h1>
      </div>

      {detail ? (
        <MovementDetail mov={detail} onBack={() => setDetailId(null)} accent={accent} />
      ) : (
        <>
          {/* STATS HERO */}
          <div style={{ padding: '0 16px 16px' }}>
            <div style={{
              background: `linear-gradient(135deg, ${accent}10, transparent)`,
              border: `1px solid ${accent}30`,
              borderRadius: 18, padding: 16,
              display: 'flex', justifyContent: 'space-between',
            }}>
              <div>
                <p style={{ fontSize: 9, color: C.muted, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase' }}>
                  Nivel promedio
                </p>
                <p style={{ fontSize: 32, fontWeight: 900, color: accent, letterSpacing: '-.03em', lineHeight: 1, marginTop: 4 }}>
                  {stats.avgLevel}<span style={{ fontSize: 14, color: C.muted, marginLeft: 4 }}>/ 5</span>
                </p>
              </div>
              <div style={{ width: 1, background: C.line }} />
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 9, color: C.muted, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase' }}>
                  Elite (L5)
                </p>
                <p style={{ fontSize: 22, fontWeight: 900, color: C.text, marginTop: 6 }}>{stats.atL5}</p>
              </div>
              <div style={{ width: 1, background: C.line }} />
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 9, color: C.muted, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase' }}>
                  Movs.
                </p>
                <p style={{ fontSize: 22, fontWeight: 900, color: C.text, marginTop: 6 }}>{stats.total}</p>
              </div>
            </div>
          </div>

          {/* CATEGORY FILTER */}
          <div className="scroll-x-no-bar" style={{
            display: 'flex', gap: 6,
            padding: '0 16px 14px',
            overflowX: 'auto',
          }}>
            <button
              onClick={() => setFilter('all')}
              style={{
                flexShrink: 0, padding: '7px 12px', borderRadius: 14,
                background: filter === 'all' ? C.text : C.surface,
                color: filter === 'all' ? C.bg : C.text,
                border: `1px solid ${filter === 'all' ? C.text : C.line}`,
                fontSize: 11, fontWeight: 800,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >Todos</button>
            {CATEGORIES.filter(c =>
              MOVEMENTS.some(m => m.product.includes(product) && m.category === c.id)
            ).map(c => (
              <button
                key={c.id}
                onClick={() => setFilter(c.id)}
                style={{
                  flexShrink: 0, padding: '7px 12px', borderRadius: 14,
                  background: filter === c.id ? c.color : C.surface,
                  color: filter === c.id ? '#07070F' : c.color,
                  border: `1px solid ${filter === c.id ? c.color : `${c.color}55`}`,
                  fontSize: 11, fontWeight: 800,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >{c.label}</button>
            ))}
          </div>

          {/* MOVEMENT LIST */}
          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {movements.map(m => {
              const prog = getProgress(m.id);
              const lvl = prog?.currentLevel ?? 1;
              const cat = CATEGORIES.find(c => c.id === m.category);
              const catColor = cat?.color ?? accent;

              return (
                <div
                  key={m.id}
                  onClick={() => setDetailId(m.id)}
                  style={{
                    background: C.surface, border: `1px solid ${C.line}`,
                    borderRadius: 14, padding: 12,
                    cursor: 'pointer',
                    borderLeft: `3px solid ${catColor}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 12,
                      background: `${catColor}15`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22, flexShrink: 0,
                    }}>{m.emoji}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{m.name}</p>
                      <p style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                        {m.tiers[lvl - 1]?.name ?? '—'}
                      </p>
                    </div>
                    <div style={{
                      padding: '4px 10px', borderRadius: 10,
                      background: catColor, color: '#07070F',
                      fontSize: 11, fontWeight: 900,
                    }}>L{lvl}/5</div>
                  </div>

                  {/* Mini tier bar */}
                  <div style={{ display: 'flex', gap: 3, marginTop: 10 }}>
                    {[1, 2, 3, 4, 5].map(t => (
                      <div key={t} style={{
                        flex: 1, height: 4, borderRadius: 2,
                        background: t <= lvl ? catColor : C.line,
                      }} />
                    ))}
                  </div>

                  {prog && prog.progressToNext > 0 && lvl < 5 && (
                    <p style={{ fontSize: 9, color: C.muted, marginTop: 6 }}>
                      → {prog.progressToNext}% hacia <span style={{ color: catColor, fontWeight: 700 }}>{m.tiers[lvl]?.name}</span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default MovementProgression;
