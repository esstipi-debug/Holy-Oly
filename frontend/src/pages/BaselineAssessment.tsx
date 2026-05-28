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
import '../styles/v2/baseline-assessment.css';

/**
 * Tests de Referencia · base sobre la que se calculan cargas y volúmenes.
 *
 * Cada test completado afina la personalización. 4 tiers:
 *   0%   → Plantilla genérica
 *   25%  → Calibración básica
 *   60%  → Cargas personalizadas
 *   100% → Plan inteligente
 *
 * Estilo V2 dark "Macrociclos" · scoped bajo `.base-root` · acento cyan
 * (--engine-stress, identidad medición / analytics). Se monta dentro de
 * PhoneLayout. Lógica intacta: sync backend↔localStorage offline-first,
 * progreso, tiers, abrir/cerrar sheet, guardar/borrar; solo cambia la
 * presentación. El LogTestSheet usa el BottomSheet compartido.
 *
 * Persistencia local (`baseline:results`) con merge backend (Fase 2).
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
    <div className="base-root anim-fade-in">
      <div className="base-scroll">
        {/* HEADER */}
        <div className="base-head">
          <button onClick={back} className="base-back btn-press" aria-label="Volver">←</button>
          <div className="base-head-titles">
            <p className="base-eyebrow">Base · CompTrain</p>
            <h1 className="base-title">Tests de Referencia</h1>
          </div>
          <SyncBadge state={syncState} />
        </div>

        {/* HERO · progress ring + tier */}
        <div className="base-hero">
          <div className="base-hero-ring">
            <ProgressRing pct={overall.pct} />
          </div>
          <div className="base-hero-meta">
            <p className="base-hero-tier">Nivel {tier.tier}/3 · {tier.label}</p>
            <p className="base-hero-count">
              {overall.done} <span>/ {overall.total} tests</span>
            </p>
            <p className="base-hero-perk">{tier.perk}</p>
          </div>
        </div>

        {/* Tier ladder */}
        <div className="base-ladder">
          {[
            { pct: 0,   label: 'Plantilla' },
            { pct: 25,  label: 'Básica' },
            { pct: 60,  label: 'Personalizada' },
            { pct: 100, label: 'Inteligente' },
          ].map((step, i) => {
            const reached = overall.pct >= step.pct;
            return (
              <div key={i} className="base-step" data-reached={reached}>
                <p className="base-step-pct">{step.pct}%</p>
                <p className="base-step-label">{step.label}</p>
              </div>
            );
          })}
        </div>

        {/* CATEGORIES */}
        <div className="base-cats">
          {cats.map(({ category, done, total, pct }) => {
            const isOpen = expanded === category.id;
            const tests = TESTS.filter(t => t.category === category.id);
            return (
              <div
                key={category.id}
                className="base-cat"
                data-complete={pct === 100}
                style={{ '--c': category.color } as React.CSSProperties}
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : category.id)}
                  className="base-cat-head btn-press"
                >
                  <span className="base-cat-icon">{category.icon}</span>
                  <span className="base-cat-main">
                    <p className="base-cat-name">{category.name}</p>
                    <p className="base-cat-blurb">{category.blurb}</p>
                    <span className="base-cat-progress">
                      <span className="base-bar">
                        <span className="base-bar-fill" style={{ width: `${pct}%` }} />
                      </span>
                      <span className="base-cat-count">{done}/{total}</span>
                    </span>
                  </span>
                  <span className="base-cat-chevron" data-open={isOpen}>›</span>
                </button>

                {isOpen && (
                  <div className="base-cat-body">
                    <p className="base-unlocks">
                      🔓 <strong>Lo que desbloquea:</strong> {category.unlocks}
                    </p>
                    <div className="base-tests">
                      {tests.map(t => {
                        const r = results[t.id];
                        return (
                          <button
                            key={t.id}
                            onClick={() => setActiveTest(t)}
                            className="base-test btn-press"
                            data-done={!!r}
                          >
                            <span className="base-test-mark">{r ? '✓' : '+'}</span>
                            <span className="base-test-main">
                              <p className="base-test-name">{t.name}</p>
                              {r ? (
                                <p className="base-test-sub">
                                  {new Date(r.date).toLocaleDateString('es', { day: '2-digit', month: 'short' })} · retest en {t.retestDays}d
                                </p>
                              ) : (
                                <p className="base-test-sub empty">Sin registrar</p>
                              )}
                            </span>
                            <span className="base-test-val">{r ? formatValue(r.value, r.unit) : '—'}</span>
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
  if (state === 'syncing') {
    return (
      <span className="base-sync" data-state="syncing" aria-label="Sincronizando">
        <span className="base-sync-dot" />
        Sync
      </span>
    );
  }
  if (state === 'ok') {
    return (
      <span className="base-sync" data-state="ok" aria-label="Sincronizado">✓</span>
    );
  }
  // offline
  return (
    <span className="base-sync" data-state="offline" aria-label="Sin conexión">⚠ Offline</span>
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
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--base-accent)" strokeWidth={stroke}
        strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset .6s ease' }}
      />
      <text x={size / 2} y={size / 2 + 6} textAnchor="middle" fontSize="20" fontWeight="700" fill="var(--text-hi)" fontFamily="var(--font-display)">{pct}%</text>
    </svg>
  );
};

export default BaselineAssessment;
