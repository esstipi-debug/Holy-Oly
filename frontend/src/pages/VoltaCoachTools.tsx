import React, { useState } from 'react';
import { useNav } from '../context/NavigationContext';
import WiseAssistant from '../components/WiseAssistant';
import { MOVEMENTS } from '../data/movements';

const C = {
  bg: '#07070F',
  surface: '#0F0F1C',
  surface2: '#161626',
  line: '#1E1E32',
  text: '#EAEAF5',
  muted: '#52527A',
  cyan: '#00E5FF',
  amber: '#FFB300',
  red: '#FF3D00',
  green: '#00E676',
  purple: '#A855F7',
};

type Tab = 'templates' | 'comparativa' | 'tendencias' | 'macro' | 'calendario' | 'notas' | 'bulk' | 'progresion';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'progresion', label: 'Progresión',    icon: '🎚️' },
  { id: 'templates',  label: 'Templates',     icon: '📋' },
  { id: 'bulk',       label: 'Masiva',        icon: '⚡' },
  { id: 'comparativa',label: 'Comparar',      icon: '⚖️' },
  { id: 'tendencias', label: 'Tendencias',    icon: '📈' },
  { id: 'macro',      label: 'Eval Macro',    icon: '🎯' },
  { id: 'calendario', label: 'Calendario',    icon: '📅' },
  { id: 'notas',      label: 'Notas',         icon: '💬' },
];

// Matriz de progresión: nivel por atleta y movimiento (sample)
const PROG_MATRIX: Record<string, Record<string, 1 | 2 | 3 | 4 | 5>> = {
  m1: { pullup: 3, hspu: 2, du: 4, snatch: 3, cleanjerk: 3, backsquat: 3, row: 4, boxjump: 3 },
  m2: { pullup: 4, hspu: 3, du: 5, snatch: 4, cleanjerk: 4, backsquat: 4, row: 4, boxjump: 4 },
  m3: { pullup: 2, hspu: 2, du: 2, snatch: 2, cleanjerk: 2, backsquat: 3, row: 3, boxjump: 3 },
  m4: { pullup: 5, hspu: 4, du: 5, snatch: 4, cleanjerk: 5, backsquat: 4, row: 5, boxjump: 4 },
  m5: { pullup: 1, hspu: 1, du: 2, snatch: 2, cleanjerk: 2, backsquat: 2, row: 2, boxjump: 2 },
  m6: { pullup: 3, hspu: 3, du: 3, snatch: 3, cleanjerk: 3, backsquat: 4, row: 3, boxjump: 3 },
};

const levelColor = (l: number) => l >= 5 ? '#22C55E' : l >= 4 ? '#00E5FF' : l >= 3 ? '#F59E0B' : l >= 2 ? '#A855F7' : '#EF4444';

const WOD_TEMPLATES = [
  { kind: 'Girls', name: 'Fran',  desc: '21-15-9 Thrusters (95/65) · Pull-ups', intensity: 5 },
  { kind: 'Girls', name: 'Grace', desc: '30 C&J for time (135/95)',             intensity: 5 },
  { kind: 'Girls', name: 'Helen', desc: '3 RFT · 400m run · 21 KBS · 12 PU',   intensity: 4 },
  { kind: 'Girls', name: 'Karen', desc: '150 Wall Balls for time (20/14)',     intensity: 4 },
  { kind: 'Hero',  name: 'Murph', desc: '1mi run · 100PU · 200PuU · 300 air sq · 1mi', intensity: 5 },
  { kind: 'Hero',  name: 'DT',    desc: '5 RFT · 12 DL · 9 hang clean · 6 push jerk (155/105)', intensity: 5 },
  { kind: 'Hero',  name: 'JT',    desc: '21-15-9 HSPU · Ring dips · Push-ups',  intensity: 4 },
  { kind: 'Custom',name: 'Box Mix', desc: 'AMRAP 12 · 10 thrusters · 15 box jumps', intensity: 3 },
];

const ATHLETES = [
  { id: 'm1', name: 'Marco Torres',   cf: 72, vform: 'A', hrv: 52,  adher: 64, lastPr: 'C&J +5kg · 3d' },
  { id: 'm2', name: 'Lucía Ramos',    cf: 81, vform: 'V', hrv: 78,  adher: 88, lastPr: 'Snatch +2kg · 1d' },
  { id: 'm3', name: 'Diego Suárez',   cf: 64, vform: 'A', hrv: 65,  adher: 52, lastPr: '—' },
  { id: 'm4', name: 'Camila Vega',    cf: 89, vform: 'V', hrv: 82,  adher: 94, lastPr: 'Snatch +3kg · 1d' },
  { id: 'm5', name: 'Pablo Iglesias', cf: 58, vform: 'R', hrv: 48,  adher: 38, lastPr: '—' },
  { id: 'm6', name: 'Sofía Méndez',   cf: 76, vform: 'V', hrv: 70,  adher: 71, lastPr: 'BS +5kg · 5d' },
];

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const futureDate = (offsetDays: number) => {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return `${d.getDate().toString().padStart(2, '0')} ${MONTHS_ES[d.getMonth()]}`;
};
const COMPETITIONS = [
  { date: futureDate(34),  name: 'Open Local Buenos Aires', tier: 'Local',         athletes: 4, status: 'confirmed' },
  { date: futureDate(71),  name: 'Throwdown Córdoba',       tier: 'Regional',      athletes: 2, status: 'tentative' },
  { date: futureDate(92),  name: 'CrossFit Games Open',     tier: 'Internacional', athletes: 6, status: 'planning'  },
  { date: futureDate(146), name: 'Sudamericano Lima',       tier: 'Regional',      athletes: 1, status: 'tentative' },
];

const VoltaCoachTools: React.FC = () => {
  const { navigate } = useNav();
  const [tab, setTab] = useState<Tab>('progresion');
  const [selA, setSelA] = useState<string | null>('m1');
  const [selB, setSelB] = useState<string | null>('m4');
  const [selectedAthletes, setSelectedAthletes] = useState<Set<string>>(new Set(['m1', 'm2', 'm4']));

  const toggleAthlete = (id: string) => {
    setSelectedAthletes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const ath = (id: string | null) => ATHLETES.find(a => a.id === id);
  const a = ath(selA), b = ath(selB);
  const vformColor = (v: string) => v === 'V' ? C.green : v === 'A' ? C.amber : C.red;

  return (
    <div style={{ background: C.bg, minHeight: '100%', paddingBottom: 110, color: C.text }}>

      {/* HEADER */}
      <div style={{ padding: '48px 20px 12px' }}>
        <p style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: '.08em' }}>COACH · TOOLBOX</p>
        <h1 style={{ fontSize: 21, fontWeight: 900, color: C.text, letterSpacing: '-.02em', marginTop: 2 }}>
          {TABS.find(t => t.id === tab)?.label}
        </h1>
      </div>

      {/* TABS */}
      <div className="scroll-x-no-bar" style={{
        display: 'flex', gap: 6,
        padding: '8px 16px 16px',
        overflowX: 'auto',
        borderBottom: `1px solid ${C.line}`,
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flexShrink: 0, padding: '8px 12px', borderRadius: 12,
              background: tab === t.id ? C.cyan : C.surface,
              color: tab === t.id ? '#07070F' : C.text,
              border: `1px solid ${tab === t.id ? C.cyan : C.line}`,
              fontSize: 11, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px' }}>

        {/* PROGRESIÓN — Matriz atletas × movimientos */}
        {tab === 'progresion' && (
          <>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>
              Skill Matrix · {ATHLETES.length} atletas × {MOVEMENTS.filter(m => m.product.includes('volta')).length} movimientos
            </p>
            <p style={{ fontSize: 10, color: C.muted, marginBottom: 12, lineHeight: 1.5 }}>
              Cada celda = nivel actual (1-5). Tap en la cabecera para ver detalles del movimiento.
            </p>

            {/* Leyenda */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
              {[1, 2, 3, 4, 5].map(l => (
                <div key={l} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '3px 8px', borderRadius: 8,
                  background: `${levelColor(l)}15`, border: `1px solid ${levelColor(l)}55`,
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: levelColor(l) }} />
                  <span style={{ fontSize: 9, color: levelColor(l), fontWeight: 800 }}>L{l}</span>
                </div>
              ))}
            </div>

            {/* Matriz scrollable */}
            <div style={{
              background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14,
              overflow: 'auto', marginBottom: 18,
            }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 11 }}>
                <thead>
                  <tr>
                    <th style={{
                      position: 'sticky', left: 0, top: 0, zIndex: 2,
                      background: C.surface2,
                      padding: '10px 12px', textAlign: 'left',
                      borderRight: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`,
                      fontWeight: 800, fontSize: 9, color: C.muted, letterSpacing: '.06em', textTransform: 'uppercase',
                    }}>Atleta</th>
                    {MOVEMENTS.filter(m => m.product.includes('volta')).map(m => (
                      <th key={m.id} style={{
                        padding: '10px 8px', textAlign: 'center',
                        borderRight: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`,
                        background: C.surface2,
                        fontWeight: 700, fontSize: 9, color: C.text,
                        minWidth: 50,
                      }}>
                        <div style={{ fontSize: 16 }}>{m.emoji}</div>
                        <div style={{ fontSize: 8, color: C.muted, marginTop: 2, whiteSpace: 'nowrap' }}>{m.name.slice(0, 8)}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ATHLETES.map(a => {
                    const row = PROG_MATRIX[a.id] ?? {};
                    const avg = Object.values(row).reduce((acc, v) => acc + v, 0) / Math.max(1, Object.values(row).length);
                    return (
                      <tr key={a.id}>
                        <td style={{
                          position: 'sticky', left: 0,
                          background: C.surface,
                          padding: '10px 12px',
                          borderRight: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`,
                          fontWeight: 700, color: C.text, fontSize: 11,
                          whiteSpace: 'nowrap',
                        }}>
                          {a.name.split(' ')[0]}
                          <span style={{ fontSize: 9, color: levelColor(avg), marginLeft: 6 }}>
                            ø {avg.toFixed(1)}
                          </span>
                        </td>
                        {MOVEMENTS.filter(m => m.product.includes('volta')).map(m => {
                          const lvl = row[m.id] ?? 1;
                          return (
                            <td key={m.id} style={{
                              padding: 6, textAlign: 'center',
                              borderRight: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`,
                            }}>
                              <div style={{
                                width: 28, height: 28, borderRadius: 8, margin: '0 auto',
                                background: levelColor(lvl),
                                color: '#07070F',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 11, fontWeight: 900,
                              }}>{lvl}</div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* CTA */}
            <div style={{
              background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.25)',
              borderRadius: 14, padding: 14, marginBottom: 12,
            }}>
              <p style={{ fontSize: 11, color: C.cyan, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                Detección automática
              </p>
              <p style={{ fontSize: 11, color: C.text, lineHeight: 1.5 }}>
                <strong style={{ color: '#EF4444' }}>Pablo I.</strong> tiene 6/8 movimientos en L1-L2 → considerá un macrociclo de fundamentos.{' '}
                <strong style={{ color: '#22C55E' }}>Camila V.</strong> en 6/8 movimientos L4-L5 → lista para Open prescribed.
              </p>
            </div>

            <button
              onClick={() => navigate('PROGRESSION')}
              style={{
                width: '100%', padding: '12px 0',
                background: C.cyan, color: '#07070F', border: 'none',
                borderRadius: 12, fontSize: 12, fontWeight: 800,
                letterSpacing: '.04em', textTransform: 'uppercase',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >Ver mi skill tree (atleta view)</button>
          </>
        )}

        {/* TEMPLATES */}
        {tab === 'templates' && (
          <>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 10 }}>
              Biblioteca · {WOD_TEMPLATES.length} templates
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {WOD_TEMPLATES.map(t => {
                const kindColor = t.kind === 'Girls' ? '#EC4899' : t.kind === 'Hero' ? C.amber : C.cyan;
                return (
                  <div
                    key={t.name}
                    onClick={() => navigate('VOLTA_COACH_WOD')}
                    style={{
                      background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14,
                      padding: 12, cursor: 'pointer',
                      borderLeft: `3px solid ${kindColor}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <div>
                        <span style={{ fontSize: 9, color: kindColor, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                          {t.kind}
                        </span>
                        <p style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{t.name}</p>
                      </div>
                      <div style={{ display: 'flex', gap: 2 }}>
                        {[1, 2, 3, 4, 5].map(x => (
                          <div key={x} style={{
                            width: 4, height: 12, borderRadius: 1,
                            background: x <= t.intensity ? (t.intensity >= 4 ? C.red : C.cyan) : C.line,
                          }} />
                        ))}
                      </div>
                    </div>
                    <p style={{ fontSize: 11, color: C.muted, lineHeight: 1.4 }}>{t.desc}</p>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => navigate('VOLTA_COACH_WOD')}
              style={{
                width: '100%', marginTop: 14, padding: '12px',
                background: 'rgba(0,229,255,0.08)', border: '1px dashed rgba(0,229,255,0.4)',
                borderRadius: 14, color: C.cyan,
                fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >+ Crear template propio</button>
          </>
        )}

        {/* BULK PROGRAMMING */}
        {tab === 'bulk' && (
          <>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 10 }}>
              Programación masiva · {selectedAthletes.size} seleccionados
            </p>
            <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 16, overflow: 'hidden', marginBottom: 14 }}>
              {ATHLETES.map((a, i) => {
                const sel = selectedAthletes.has(a.id);
                return (
                  <div
                    key={a.id}
                    onClick={() => toggleAthlete(a.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 14px',
                      borderBottom: i < ATHLETES.length - 1 ? `1px solid ${C.line}` : 'none',
                      cursor: 'pointer',
                      background: sel ? 'rgba(0,229,255,0.04)' : 'transparent',
                    }}
                  >
                    <div style={{
                      width: 22, height: 22, borderRadius: 6,
                      background: sel ? C.cyan : 'transparent',
                      border: `2px solid ${sel ? C.cyan : C.line}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#07070F', fontSize: 12, fontWeight: 900,
                    }}>{sel && '✓'}</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{a.name}</p>
                      <p style={{ fontSize: 10, color: C.muted }}>CF {a.cf} · HRV {a.hrv} · {a.adher}% adherencia</p>
                    </div>
                    <span style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: vformColor(a.vform),
                    }} />
                  </div>
                );
              })}
            </div>
            <div style={{
              background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.25)',
              borderRadius: 14, padding: 12, marginBottom: 14,
            }}>
              <p style={{ fontSize: 10, color: C.cyan, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                Escalado automático WISE
              </p>
              <p style={{ fontSize: 11, color: C.text, lineHeight: 1.5 }}>
                Marco (HRV 52) → <strong style={{ color: C.amber }}>80% intensidad</strong>. Pablo (V-Form rojo) → <strong style={{ color: C.red }}>solo movilidad</strong>. Resto Rx.
              </p>
            </div>
            <button
              onClick={() => navigate('VOLTA_COACH_WOD')}
              style={{
                width: '100%', padding: '14px 0',
                background: C.cyan, color: '#07070F', border: 'none',
                borderRadius: 14, fontSize: 13, fontWeight: 800,
                letterSpacing: '.04em', textTransform: 'uppercase',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >Asignar WOD a {selectedAthletes.size} atletas</button>
          </>
        )}

        {/* COMPARATIVA */}
        {tab === 'comparativa' && (
          <>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 10 }}>
              Atleta A vs Atleta B
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {[selA, selB].map((sel, idx) => (
                <select
                  key={idx}
                  value={sel ?? ''}
                  onChange={(e) => idx === 0 ? setSelA(e.target.value) : setSelB(e.target.value)}
                  style={{
                    flex: 1, padding: '10px 12px',
                    background: C.surface, border: `1px solid ${C.line}`,
                    borderRadius: 12, color: C.text, fontSize: 12, fontWeight: 700,
                    fontFamily: 'inherit', outline: 'none', appearance: 'none',
                  }}
                >
                  {ATHLETES.map(at => <option key={at.id} value={at.id}>{at.name}</option>)}
                </select>
              ))}
            </div>
            {a && b && (
              <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 16, overflow: 'hidden' }}>
                {[
                  { label: 'CF Index',   va: a.cf,    vb: b.cf,    higher: 'better' as const },
                  { label: 'HRV',        va: a.hrv,   vb: b.hrv,   higher: 'better' as const },
                  { label: 'Adherencia', va: a.adher, vb: b.adher, higher: 'better' as const, unit: '%' },
                ].map((row, i) => {
                  const aBetter = row.va > row.vb;
                  return (
                    <div key={i} style={{
                      display: 'grid', gridTemplateColumns: '1fr auto 1fr',
                      gap: 12, padding: '12px 14px',
                      borderBottom: `1px solid ${C.line}`,
                      alignItems: 'center',
                    }}>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 18, fontWeight: 900, color: aBetter ? C.green : C.muted }}>
                          {row.va}{row.unit ?? ''}
                        </p>
                      </div>
                      <p style={{ fontSize: 9, color: C.muted, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>
                        {row.label}
                      </p>
                      <div style={{ textAlign: 'left' }}>
                        <p style={{ fontSize: 18, fontWeight: 900, color: !aBetter ? C.green : C.muted }}>
                          {row.vb}{row.unit ?? ''}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center' }}>
                    <p style={{ fontSize: 10, color: C.cyan, fontWeight: 700, textAlign: 'right' }}>{a.lastPr}</p>
                    <p style={{ fontSize: 9, color: C.muted, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>Último PR</p>
                    <p style={{ fontSize: 10, color: C.cyan, fontWeight: 700, textAlign: 'left' }}>{b.lastPr}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* TENDENCIAS */}
        {tab === 'tendencias' && (
          <>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 10 }}>
              Pulso del box · 7 días
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              {[
                { label: 'Carga total', value: '4.2k', sub: '↑ 12% vs sem.', color: C.cyan },
                { label: 'Asistencia',  value: '78%',  sub: '→ estable',     color: C.green },
                { label: 'PRs nuevos',  value: '3',    sub: '↑ +1 vs sem.', color: C.amber },
                { label: 'Lesiones',    value: '0',    sub: 'Sin nuevas',    color: C.green },
              ].map(s => (
                <div key={s.label} style={{
                  background: C.surface, border: `1px solid ${C.line}`,
                  borderRadius: 14, padding: 12,
                }}>
                  <p style={{ fontSize: 9, color: C.muted, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                    {s.label}
                  </p>
                  <p style={{ fontSize: 22, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</p>
                  <p style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>{s.sub}</p>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 10 }}>
              Top performers
            </p>
            <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, overflow: 'hidden' }}>
              {[...ATHLETES].sort((x, y) => y.cf - x.cf).slice(0, 3).map((a, i) => (
                <div key={a.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 14px',
                  borderBottom: i < 2 ? `1px solid ${C.line}` : 'none',
                }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: 8,
                    background: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : '#CD7F32',
                    color: '#07070F',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 900, flexShrink: 0,
                  }}>{i + 1}</span>
                  <p style={{ flex: 1, fontSize: 12, fontWeight: 700, color: C.text }}>{a.name}</p>
                  <p style={{ fontSize: 13, fontWeight: 800, color: C.cyan, fontVariantNumeric: 'tabular-nums' }}>CF {a.cf}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* EVAL MACRO */}
        {tab === 'macro' && (
          <>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 10 }}>
              Review semanal · CF Open Prep Q2
            </p>
            <div style={{
              background: 'rgba(0,229,255,0.04)',
              border: '1px solid rgba(0,229,255,0.25)',
              borderRadius: 14, padding: 14, marginBottom: 14,
            }}>
              <p style={{ fontSize: 11, color: C.cyan, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                Sem 4/8 · Conditioning Block
              </p>
              <p style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>
                Estás a mitad del bloque. Pico planificado en 4 semanas. Adherencia 71% — por debajo del target 80%.
              </p>
            </div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 10 }}>
              Criterios de evaluación
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Adherencia',   value: 71, target: 80, status: 'warning' },
                { label: 'PRs (acum.)',  value: 8,  target: 6,  status: 'good',    unit: '' },
                { label: 'Lesiones',     value: 0,  target: 0,  status: 'good',    unit: '' },
                { label: 'Carga rel.',   value: 88, target: 90, status: 'good' },
                { label: 'V-Form rojo',  value: 1,  target: 0,  status: 'warning', unit: '' },
                { label: 'HRV crítico',  value: 1,  target: 0,  status: 'warning', unit: '' },
              ].map((c) => {
                const color = c.status === 'good' ? C.green : c.status === 'warning' ? C.amber : C.red;
                return (
                  <div key={c.label} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: C.surface, border: `1px solid ${C.line}`,
                    borderRadius: 12, padding: '10px 14px',
                  }}>
                    <p style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>{c.label}</p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{ fontSize: 16, fontWeight: 900, color }}>
                        {c.value}{c.unit ?? '%'}
                      </span>
                      <span style={{ fontSize: 10, color: C.muted }}>
                        / target {c.target}{c.unit ?? '%'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => navigate('VOLTA_COACH_MACRO')}
              style={{
                width: '100%', marginTop: 14, padding: '14px 0',
                background: C.cyan, color: '#07070F', border: 'none',
                borderRadius: 14, fontSize: 13, fontWeight: 800,
                letterSpacing: '.04em', textTransform: 'uppercase',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >Ajustar macrociclo</button>
          </>
        )}

        {/* CALENDARIO */}
        {tab === 'calendario' && (
          <>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 10 }}>
              Próximas competencias · {COMPETITIONS.length}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {COMPETITIONS.map((c, i) => {
                const statusColor = c.status === 'confirmed' ? C.green : c.status === 'tentative' ? C.amber : C.muted;
                return (
                  <div key={i} style={{
                    background: C.surface, border: `1px solid ${C.line}`,
                    borderRadius: 14, padding: 12,
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <div style={{
                      width: 50, textAlign: 'center',
                      padding: '8px 4px', borderRadius: 10,
                      background: C.surface2,
                      flexShrink: 0,
                    }}>
                      <p style={{ fontSize: 14, fontWeight: 900, color: C.cyan, letterSpacing: '-.02em', lineHeight: 1 }}>
                        {c.date.split(' ')[0]}
                      </p>
                      <p style={{ fontSize: 9, color: C.muted, fontWeight: 700, marginTop: 2 }}>
                        {c.date.split(' ')[1]}
                      </p>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.name}
                      </p>
                      <p style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                        {c.tier} · {c.athletes} atletas
                      </p>
                    </div>
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: '4px 8px', borderRadius: 8,
                      background: `${statusColor}1a`, color: statusColor,
                      border: `1px solid ${statusColor}55`,
                      textTransform: 'uppercase', letterSpacing: '.06em',
                    }}>{c.status === 'confirmed' ? 'OK' : c.status === 'tentative' ? '?' : 'plan'}</span>
                  </div>
                );
              })}
            </div>
            <button
              style={{
                width: '100%', marginTop: 14, padding: '12px',
                background: 'rgba(0,229,255,0.08)', border: '1px dashed rgba(0,229,255,0.4)',
                borderRadius: 14, color: C.cyan,
                fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >+ Agregar competencia</button>
          </>
        )}

        {/* NOTAS / MENSAJES */}
        {tab === 'notas' && (
          <>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 10 }}>
              Mensajes rápidos
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { athlete: 'Marco T.', msg: 'Hoy descanso activo, te quiero ver mañana sin override.', time: 'Hace 1h', unread: false },
                { athlete: 'Camila V.', msg: 'PR Snatch +3kg ayer. Sigue así, top 1 del box.', time: 'Hace 3h', unread: false },
                { athlete: 'Pablo I.', msg: '38% adherencia este mes. Hablemos esta semana.', time: '1 día', unread: true },
                { athlete: 'Box (todos)', msg: 'Hoy AMRAP 20 a las 19hs. Cap on 18:55.', time: '1 día', unread: false },
              ].map((m, i) => (
                <div key={i} style={{
                  background: m.unread ? 'rgba(0,229,255,0.04)' : C.surface,
                  border: `1px solid ${m.unread ? 'rgba(0,229,255,0.25)' : C.line}`,
                  borderRadius: 14, padding: 12,
                  display: 'flex', gap: 10,
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: m.unread ? C.cyan : 'transparent',
                    marginTop: 6, flexShrink: 0,
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{m.athlete}</p>
                      <p style={{ fontSize: 10, color: C.muted }}>{m.time}</p>
                    </div>
                    <p style={{ fontSize: 11, color: C.muted, lineHeight: 1.4 }}>{m.msg}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              style={{
                width: '100%', marginTop: 14, padding: '14px 0',
                background: C.cyan, color: '#07070F', border: 'none',
                borderRadius: 14, fontSize: 13, fontWeight: 800,
                letterSpacing: '.04em', textTransform: 'uppercase',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >+ Nuevo mensaje</button>
          </>
        )}
      </div>

      <WiseAssistant context={`Coach Tools · ${TABS.find(t => t.id === tab)?.label}`} />
    </div>
  );
};

export default VoltaCoachTools;
