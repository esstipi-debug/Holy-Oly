import React, { useState, useEffect, useRef } from 'react';
import { useNav } from '../context/NavigationContext';
import {
  TESTS,
  loadResults, saveResult, deleteResult,
  categoryProgress, overallProgress, personalizationTier, formatValue,
  type BaselineCategoryId, type BaselineResult, type BaselineTest,
} from '../data/baseline';
import LogTestSheet from '../components/baseline/LogTestSheet';
import { baselineApi, type BaselineResultsMap } from '../lib/api';
import { useToast } from '../components/Toast';

/**
 * Tests de Referencia · base sobre la que se calculan cargas y volúmenes.
 *
 * Cada test completado afina la personalización. 4 tiers:
 *   0%   → Plantilla genérica
 *   25%  → Calibración básica
 *   60%  → Cargas personalizadas
 *   100% → Plan inteligente
 *
 * Persistencia local (`baseline:results`) hasta que haya backend (Fase 2).
 */

type SyncState = 'idle' | 'syncing' | 'ok' | 'offline';

const BaselineAssessment: React.FC = () => {
  const { back } = useNav();
  const { showToast } = useToast();
  // Lectura inmediata desde localStorage (caché primario, offline-first).
  const [results, setResults] = useState<Record<string, BaselineResult>>(() => loadResults());
  const [activeTest, setActiveTest] = useState<BaselineTest | null>(null);
  const [expanded, setExpanded] = useState<BaselineCategoryId | null>('olympic');
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const okTimerRef = useRef<number | null>(null);

  const flashOk = () => {
    setSyncState('ok');
    if (okTimerRef.current) window.clearTimeout(okTimerRef.current);
    okTimerRef.current = window.setTimeout(() => setSyncState('idle'), 1500);
  };

  // Lazy load: merge backend → localStorage al montar. Backend wins en conflicto.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setSyncState('syncing');
      try {
        const remote: BaselineResultsMap = await baselineApi.list();
        if (cancelled) return;
        const local = loadResults();
        const merged: Record<string, BaselineResult> = { ...local };
        // Backend wins en conflicto
        for (const [testId, r] of Object.entries(remote)) {
          merged[testId] = { value: r.value, unit: r.unit, date: r.date };
        }
        // Persistir merge en localStorage
        for (const [testId, r] of Object.entries(merged)) {
          saveResult(testId, r);
        }
        setResults(merged);
        flashOk();
      } catch {
        if (cancelled) return;
        setSyncState('offline');
        // Mantener localStorage como source of truth; reintentará en próxima carga.
      }
    })();
    return () => {
      cancelled = true;
      if (okTimerRef.current) window.clearTimeout(okTimerRef.current);
    };
  }, []);

  const overall = overallProgress(results);
  const cats = categoryProgress(results);
  const tier = personalizationTier(overall.pct);

  const handleSave = (testId: string, r: BaselineResult) => {
    // 1) Optimistic local save
    saveResult(testId, r);
    setResults(loadResults());
    setActiveTest(null);
    // 2) Sync backend en background (no bloquea UI)
    setSyncState('syncing');
    baselineApi.upsert(testId, r.value, r.unit)
      .then(() => flashOk())
      .catch(() => {
        setSyncState('offline');
        showToast({ message: 'Sin conexión · guardado local', variant: 'warning' });
      });
  };

  const handleDelete = (testId: string) => {
    // 1) Optimistic local delete
    deleteResult(testId);
    setResults(loadResults());
    setActiveTest(null);
    // 2) Sync backend en background
    setSyncState('syncing');
    baselineApi.delete(testId)
      .then(() => flashOk())
      .catch(() => {
        setSyncState('offline');
        showToast({ message: 'Sin conexión · borrado local', variant: 'warning' });
      });
  };

  return (
    <div className="anim-fade-in" style={{ background: '#07070F', minHeight: '100%', color: '#EAEAF5', paddingBottom: 90 }}>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px' }}>
        <button
          onClick={back}
          className="btn-press"
          aria-label="Volver"
          style={{ background: 'transparent', border: 'none', color: '#EAEAF5', fontSize: 22, padding: 4, cursor: 'pointer' }}
        >←</button>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.12em', color: '#7C5CFF', textTransform: 'uppercase' }}>BASE · COMPTRAIN</p>
          <h1 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-.02em', margin: 0 }}>Tests de Referencia</h1>
        </div>
        <SyncBadge state={syncState} />
      </div>

      {/* HERO · progress ring + tier */}
      <div style={{ padding: '8px 16px 18px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #161626 0%, #0F0F1C 100%)',
          border: '1px solid rgba(124,92,255,0.25)',
          borderRadius: 22,
          padding: 18,
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          boxShadow: '0 0 24px rgba(124,92,255,0.08)',
        }}>
          <ProgressRing pct={overall.pct} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', color: '#7C5CFF', textTransform: 'uppercase' }}>
              Nivel {tier.tier}/3 · {tier.label}
            </p>
            <p style={{ fontSize: 22, fontWeight: 900, color: '#EAEAF5', letterSpacing: '-.02em', margin: '4px 0' }}>
              {overall.done} <span style={{ fontSize: 14, color: '#94A3B8' }}>/ {overall.total} tests</span>
            </p>
            <p style={{ fontSize: 11, color: '#94A3B8', lineHeight: 1.4 }}>{tier.perk}</p>
          </div>
        </div>

        {/* Tier ladder */}
        <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
          {[
            { pct: 0,   label: 'Plantilla' },
            { pct: 25,  label: 'Básica' },
            { pct: 60,  label: 'Personalizada' },
            { pct: 100, label: 'Inteligente' },
          ].map((step, i) => {
            const reached = overall.pct >= step.pct;
            return (
              <div key={i} style={{
                flex: 1, padding: '6px 4px', borderRadius: 10,
                background: reached ? 'rgba(124,92,255,0.18)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${reached ? 'rgba(124,92,255,0.5)' : 'rgba(255,255,255,0.08)'}`,
                textAlign: 'center',
              }}>
                <p style={{ fontSize: 9, fontWeight: 800, color: reached ? '#A88BFF' : '#52527A' }}>{step.pct}%</p>
                <p style={{ fontSize: 9, fontWeight: 700, color: reached ? '#EAEAF5' : '#52527A' }}>{step.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* CATEGORIES */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {cats.map(({ category, done, total, pct }) => {
          const isOpen = expanded === category.id;
          const tests = TESTS.filter(t => t.category === category.id);
          return (
            <div key={category.id} style={{
              background: '#0F0F1C',
              border: `1px solid ${pct === 100 ? `${category.color}66` : '#1E1E32'}`,
              borderRadius: 18,
              overflow: 'hidden',
            }}>
              <button
                onClick={() => setExpanded(isOpen ? null : category.id)}
                className="btn-press"
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: 14, background: 'transparent', border: 'none', color: '#EAEAF5',
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: `${category.color}1A`, border: `1px solid ${category.color}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, flexShrink: 0,
                }}>{category.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 900, color: '#EAEAF5', margin: 0 }}>{category.name}</p>
                  <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 6px' }}>{category.blurb}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 4, borderRadius: 2, background: '#1E1E32', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: category.color, transition: 'width .4s ease' }} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: category.color, minWidth: 32, textAlign: 'right' }}>{done}/{total}</span>
                  </div>
                </div>
                <span style={{ fontSize: 14, color: '#52527A', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }}>›</span>
              </button>

              {isOpen && (
                <div style={{ padding: '0 14px 14px', borderTop: '1px solid #1E1E32' }}>
                  <p style={{ fontSize: 11, color: '#94A3B8', padding: '12px 0 8px', lineHeight: 1.5 }}>
                    🔓 <span style={{ color: '#EAEAF5', fontWeight: 700 }}>Lo que desbloquea:</span> {category.unlocks}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {tests.map(t => {
                      const r = results[t.id];
                      return (
                        <button
                          key={t.id}
                          onClick={() => setActiveTest(t)}
                          className="btn-press"
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 12px',
                            background: r ? `${category.color}0F` : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${r ? `${category.color}33` : 'rgba(255,255,255,0.05)'}`,
                            borderRadius: 12, color: '#EAEAF5',
                            cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                          }}
                        >
                          <span style={{
                            width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                            background: r ? category.color : 'rgba(255,255,255,0.05)',
                            color: r ? '#07070F' : '#52527A',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 900,
                          }}>{r ? '✓' : '+'}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: '#EAEAF5', margin: 0 }}>{t.name}</p>
                            {r ? (
                              <p style={{ fontSize: 10, color: '#94A3B8', margin: '2px 0 0' }}>
                                {new Date(r.date).toLocaleDateString('es', { day: '2-digit', month: 'short' })} · retest en {t.retestDays}d
                              </p>
                            ) : (
                              <p style={{ fontSize: 10, color: '#52527A', margin: '2px 0 0' }}>Sin registrar</p>
                            )}
                          </div>
                          <span style={{
                            fontSize: 13, fontWeight: 900,
                            color: r ? category.color : '#52527A',
                            minWidth: 60, textAlign: 'right',
                          }}>{r ? formatValue(r.value, r.unit) : '—'}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <LogTestSheet
        test={activeTest}
        existing={activeTest ? (results[activeTest.id] ?? null) : null}
        onClose={() => setActiveTest(null)}
        onSave={(r) => activeTest && handleSave(activeTest.id, r)}
        onDelete={activeTest && results[activeTest.id] ? () => handleDelete(activeTest.id) : undefined}
      />
    </div>
  );
};

const SyncBadge: React.FC<{ state: SyncState }> = ({ state }) => {
  if (state === 'idle') return null;
  const common: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: '.06em',
    padding: '4px 8px',
    borderRadius: 999,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  };
  if (state === 'syncing') {
    return (
      <span
        aria-label="Sincronizando"
        style={{ ...common, background: 'rgba(124,92,255,0.15)', color: '#A88BFF', border: '1px solid rgba(124,92,255,0.35)' }}
      >
        <span
          style={{
            width: 10, height: 10, borderRadius: '50%',
            border: '2px solid rgba(168,139,255,0.3)',
            borderTopColor: '#A88BFF',
            display: 'inline-block',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        SYNC
      </span>
    );
  }
  if (state === 'ok') {
    return (
      <span
        aria-label="Sincronizado"
        style={{ ...common, background: 'rgba(34,197,94,0.15)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.35)' }}
      >
        ✓
      </span>
    );
  }
  // offline
  return (
    <span
      aria-label="Sin conexión"
      style={{ ...common, background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.35)' }}
    >
      ⚠ OFFLINE
    </span>
  );
};

const ProgressRing: React.FC<{ pct: number }> = ({ pct }) => {
  const size = 76;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.min(Math.max(pct / 100, 0), 1));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#7C5CFF" strokeWidth={stroke}
        strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset .6s ease' }}
      />
      <text x={size / 2} y={size / 2 + 6} textAnchor="middle" fontSize="22" fontWeight="900" fill="#EAEAF5" fontStyle="italic">{pct}%</text>
    </svg>
  );
};

export default BaselineAssessment;
