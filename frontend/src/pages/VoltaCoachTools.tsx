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

export type Tab = 'templates' | 'comparativa' | 'tendencias' | 'macro' | 'calendario' | 'notas' | 'bulk' | 'progresion' | 'inventario' | 'viral';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'progresion', label: 'Progresión',    icon: '🎚️' },
  { id: 'templates',  label: 'Templates',     icon: '📋' },
  { id: 'viral',      label: 'Viral',         icon: '📢' },
  { id: 'bulk',       label: 'Masiva',        icon: '⚡' },
  { id: 'comparativa',label: 'Comparar',      icon: '⚖️' },
  { id: 'tendencias', label: 'Tendencias',    icon: '📈' },
  { id: 'macro',      label: 'Eval Macro',    icon: '🎯' },
  { id: 'inventario', label: 'Inventario',    icon: '📦' },
  { id: 'calendario', label: 'Calendario',    icon: '📅' },
  { id: 'notas',      label: 'Notas',         icon: '💬' },
];

const INVENTORY: { icon: string; label: string; count: number; total: number; category: 'Barras' | 'Plates' | 'Gymnastics' | 'Cardio' | 'Accesorios' }[] = [
  { icon: '🏋️', label: 'Barras Olímpicas 20kg',  count: 10, total: 12, category: 'Barras' },
  { icon: '🏋️', label: 'Barras Olímpicas 15kg',  count: 4,  total: 4,  category: 'Barras' },
  { icon: '⚪', label: 'Bumpers 25kg (par)',     count: 6,  total: 8,  category: 'Plates' },
  { icon: '⚪', label: 'Bumpers 20kg (par)',     count: 8,  total: 8,  category: 'Plates' },
  { icon: '⚪', label: 'Bumpers 15kg (par)',     count: 10, total: 10, category: 'Plates' },
  { icon: '⚪', label: 'Bumpers 10kg (par)',     count: 12, total: 12, category: 'Plates' },
  { icon: '🥊', label: 'Kettlebells 16-24kg',    count: 16, total: 20, category: 'Accesorios' },
  { icon: '🪢', label: 'Cuerdas para saltar',    count: 18, total: 20, category: 'Gymnastics' },
  { icon: '📦', label: 'Cajones plyo 24"',       count: 8,  total: 8,  category: 'Gymnastics' },
  { icon: '💍', label: 'Anillas',                count: 6,  total: 8,  category: 'Gymnastics' },
  { icon: '🚣', label: 'Rowers Concept2',        count: 4,  total: 6,  category: 'Cardio' },
  { icon: '🚴', label: 'Assault Bikes',          count: 3,  total: 4,  category: 'Cardio' },
  { icon: '⚪', label: 'Wall balls 9/14kg',      count: 10, total: 12, category: 'Accesorios' },
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

interface VoltaCoachToolsProps {
  initialTab?: Tab;
}

const VoltaCoachTools: React.FC<VoltaCoachToolsProps> = ({ initialTab = 'progresion' }) => {
  const { navigate } = useNav();
  const [tab, setTab] = useState<Tab>(initialTab);
  // Sync tab when navigating between VOLTA_COACH_MACRO / _INVENTORY / _TOOLS routes
  React.useEffect(() => { setTab(initialTab); }, [initialTab]);
  const [selA, setSelA] = useState<string | null>('m1');
  const [selB, setSelB] = useState<string | null>('m4');
  const [selectedAthletes, setSelectedAthletes] = useState<Set<string>>(new Set(['m1', 'm2', 'm4']));

  // Inventario editable (state local, en producción persiste en backend)
  const [inventory, setInventory] = useState(INVENTORY);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ label: '', count: '', total: '', category: 'Accesorios' as typeof INVENTORY[number]['category'], icon: '📦' });

  const adjustCount = (idx: number, delta: number) => {
    setInventory(prev => prev.map((it, i) => i === idx
      ? { ...it, count: Math.max(0, Math.min(it.total, it.count + delta)) }
      : it
    ));
  };
  const adjustTotal = (idx: number, delta: number) => {
    setInventory(prev => prev.map((it, i) => i === idx
      ? { ...it, total: Math.max(0, it.total + delta), count: Math.min(it.count, Math.max(0, it.total + delta)) }
      : it
    ));
  };
  const removeItem = (idx: number) => {
    setInventory(prev => prev.filter((_, i) => i !== idx));
  };
  const addItem = () => {
    const count = Number(newItem.count);
    const total = Number(newItem.total);
    if (!newItem.label.trim() || total <= 0 || count < 0 || count > total) return;
    setInventory(prev => [...prev, {
      icon: newItem.icon, label: newItem.label.trim(),
      count, total, category: newItem.category,
    }]);
    setNewItem({ label: '', count: '', total: '', category: 'Accesorios', icon: '📦' });
    setShowAddForm(false);
  };

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
            onClick={() => t.id === 'viral' ? navigate('COACH_VIRAL_TOOLS') : setTab(t.id)}
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

        {/* EVAL MACRO — REDISEÑADO */}
        {tab === 'macro' && (() => {
          const criteria = [
            { label: 'Adherencia',   icon: '✓',  value: 71, target: 80, unit: '%', status: 'warning' as const, hint: '9% bajo target' },
            { label: 'PRs acum.',    icon: '🏆', value: 8,  target: 6,  unit: '',  status: 'good'    as const, hint: '+2 sobre target' },
            { label: 'Lesiones',     icon: '🩹', value: 0,  target: 0,  unit: '',  status: 'good'    as const, hint: 'En meta' },
            { label: 'Carga rel.',   icon: '⚡', value: 88, target: 90, unit: '%', status: 'good'    as const, hint: '2% bajo target' },
            { label: 'V-Form rojo',  icon: '🚨', value: 1,  target: 0,  unit: '',  status: 'warning' as const, hint: 'Pablo I.' },
            { label: 'HRV crítico',  icon: '💔', value: 1,  target: 0,  unit: '',  status: 'warning' as const, hint: 'Pablo I.' },
          ];
          const warnings = criteria.filter(c => c.status === 'warning').length;
          const verdict = warnings === 0
            ? { color: C.green, label: 'EN TRACK', desc: 'Bloque sin alertas — seguí plan original.' }
            : warnings <= 2
              ? { color: C.amber, label: 'AJUSTAR', desc: `${warnings} criterios sub-target — revisá adherencia y atletas en rojo.` }
              : { color: C.red, label: 'CRÍTICO', desc: 'Múltiples desvíos — considerá deload o cambio de macro.' };

          const weekPct = (4 / 8) * 100;

          return (
            <>
              {/* Link a vista friendly del macrociclo */}
              <button
                onClick={() => navigate('COACH_MACRO_VIEW')}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 12,
                  background: 'rgba(0,229,255,0.06)',
                  border: '1px solid rgba(0,229,255,0.25)',
                  color: C.cyan, fontSize: 11, fontWeight: 800,
                  letterSpacing: '.04em', textAlign: 'left',
                  cursor: 'pointer', fontFamily: 'inherit',
                  marginBottom: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                }}
              >
                <span>📅 Vista friendly del macrociclo</span>
                <span style={{ fontSize: 14 }}>→</span>
              </button>

              {/* HERO: progress + verdict */}
              <div style={{
                background: C.surface, border: `1px solid ${C.line}`,
                borderRadius: 16, padding: 16, marginBottom: 14,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                      Macrociclo activo
                    </p>
                    <p style={{ fontSize: 15, fontWeight: 900, color: C.text, marginTop: 2 }}>
                      CF Open Prep · Q2
                    </p>
                    <p style={{ fontSize: 10, color: C.cyan, fontWeight: 700, marginTop: 2 }}>
                      Conditioning Block
                    </p>
                  </div>
                  <span style={{
                    padding: '5px 11px', borderRadius: 999,
                    background: `${verdict.color}1a`, color: verdict.color,
                    border: `1px solid ${verdict.color}55`,
                    fontSize: 11, fontWeight: 900, letterSpacing: '.08em',
                  }}>{verdict.label}</span>
                </div>

                {/* Week timeline */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 10, color: C.muted, fontWeight: 700 }}>SEMANA 4 / 8</span>
                    <span style={{ fontSize: 10, color: verdict.color, fontWeight: 800 }}>{Math.round(weekPct)}%</span>
                  </div>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(w => {
                      const done = w <= 4;
                      const current = w === 4;
                      return (
                        <div key={w} style={{
                          flex: 1, height: 8, borderRadius: 2,
                          background: current
                            ? verdict.color
                            : done
                              ? `${C.cyan}cc`
                              : C.line,
                          boxShadow: current ? `0 0 6px ${verdict.color}` : 'none',
                        }} />
                      );
                    })}
                  </div>
                  <p style={{ fontSize: 10, color: C.muted, marginTop: 8, lineHeight: 1.5 }}>
                    <strong style={{ color: verdict.color }}>{verdict.desc}</strong>
                  </p>
                </div>
              </div>

              {/* CRITERIOS — 2 columnas, icon + valor grande */}
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 8 }}>
                Criterios · {criteria.length}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                {criteria.map(c => {
                  const color = c.status === 'good' ? C.green : c.status === 'warning' ? C.amber : C.red;
                  const tgt = c.target === 0 && c.value > 0 ? 'over' : c.value >= c.target ? 'met' : 'under';
                  const arrow = tgt === 'met' ? '▲' : tgt === 'over' ? '▲' : '▼';
                  return (
                    <div key={c.label} style={{
                      background: C.surface, border: `1px solid ${color}55`,
                      borderRadius: 12, padding: 12,
                      position: 'relative', overflow: 'hidden',
                    }}>
                      {/* Tinted accent strip */}
                      <div style={{
                        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                        background: color,
                      }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <span style={{ fontSize: 14 }}>{c.icon}</span>
                        <span style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase' }}>
                          {c.label}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                        <span style={{ fontSize: 22, fontWeight: 900, color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                          {c.value}{c.unit}
                        </span>
                        <span style={{ fontSize: 9, color: C.muted, fontWeight: 700 }}>
                          /{c.target}{c.unit}
                        </span>
                      </div>
                      <p style={{ fontSize: 9, color, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <span style={{ fontSize: 8 }}>{arrow}</span> {c.hint}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* ACTIONS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  onClick={() => navigate('ASSIGN_MACRO')}
                  style={{
                    width: '100%', padding: '14px 0',
                    background: C.cyan, color: '#07070F', border: 'none',
                    borderRadius: 14, fontSize: 13, fontWeight: 800,
                    letterSpacing: '.04em', textTransform: 'uppercase',
                    cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: '0 4px 14px rgba(0,229,255,.2)',
                  }}
                >Cambiar de macrociclo (21 sistemas)</button>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    style={{
                      flex: 1, padding: '12px 0',
                      background: 'transparent', color: C.amber,
                      border: `1px solid ${C.amber}55`,
                      borderRadius: 12, fontSize: 11, fontWeight: 800,
                      letterSpacing: '.04em', textTransform: 'uppercase',
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >Marcar deload</button>
                  <button
                    style={{
                      flex: 1, padding: '12px 0',
                      background: 'transparent', color: C.muted,
                      border: `1px solid ${C.line}`,
                      borderRadius: 12, fontSize: 11, fontWeight: 800,
                      letterSpacing: '.04em', textTransform: 'uppercase',
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >Exportar review</button>
                </div>
              </div>
            </>
          );
        })()}

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

        {/* INVENTARIO */}
        {tab === 'inventario' && (
          <>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 10 }}>
              Equipamiento del box · {inventory.length} items
            </p>

            {/* TOTALS BAR */}
            {(() => {
              const totalItems = inventory.reduce((acc, it) => acc + it.total, 0) || 1;
              const availableItems = inventory.reduce((acc, it) => acc + it.count, 0);
              const ratio = Math.round((availableItems / totalItems) * 100);
              const ratioColor = ratio >= 90 ? C.green : ratio >= 70 ? C.amber : C.red;
              return (
                <div style={{
                  background: C.surface, border: `1px solid ${C.line}`,
                  borderRadius: 14, padding: 14, marginBottom: 14,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>Disponibilidad</span>
                    <span style={{ fontSize: 18, fontWeight: 900, color: ratioColor }}>{ratio}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: C.line, overflow: 'hidden', marginBottom: 6 }}>
                    <div style={{ height: '100%', width: `${ratio}%`, background: ratioColor, transition: 'width .3s ease' }} />
                  </div>
                  <p style={{ fontSize: 10, color: C.muted }}>
                    <strong style={{ color: C.text }}>{availableItems}</strong> de {totalItems} unidades disponibles
                  </p>
                </div>
              );
            })()}

            {/* AGRUPADO POR CATEGORÍA — EDITABLE INLINE */}
            {(['Barras', 'Plates', 'Gymnastics', 'Cardio', 'Accesorios'] as const).map(cat => {
              const items = inventory.map((it, idx) => ({ ...it, _idx: idx })).filter(it => it.category === cat);
              if (items.length === 0) return null;
              return (
                <div key={cat} style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: C.cyan, marginBottom: 6, paddingLeft: 4 }}>
                    {cat}
                  </p>
                  <div style={{
                    background: C.surface, border: `1px solid ${C.line}`,
                    borderRadius: 14, overflow: 'hidden',
                  }}>
                    {items.map((it, j) => {
                      const ratio = it.total > 0 ? it.count / it.total : 0;
                      const status = ratio >= 0.9 ? C.green : ratio >= 0.6 ? C.amber : C.red;
                      return (
                        <div key={it._idx} style={{
                          padding: '12px 14px',
                          borderBottom: j < items.length - 1 ? `1px solid ${C.line}` : 'none',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <span style={{ fontSize: 22 }}>{it.icon}</span>
                            <p style={{ flex: 1, fontSize: 12, fontWeight: 700, color: C.text }}>{it.label}</p>
                            <button
                              onClick={() => {
                                if (window.confirm(`¿Eliminar "${it.label}" del inventario?\nEsta acción no se puede deshacer.`)) {
                                  removeItem(it._idx);
                                }
                              }}
                              style={{
                                width: 24, height: 24, borderRadius: 6,
                                background: 'rgba(255,61,0,0.08)', color: C.red,
                                border: '1px solid rgba(255,61,0,0.2)',
                                cursor: 'pointer', fontSize: 11, fontFamily: 'inherit', padding: 0,
                              }}
                              aria-label="Eliminar item"
                            >×</button>
                          </div>
                          <div style={{ height: 3, borderRadius: 2, background: C.line, overflow: 'hidden', marginBottom: 8 }}>
                            <div style={{ height: '100%', width: `${ratio * 100}%`, background: status, transition: 'width .2s ease' }} />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {/* Disponibles -/+ */}
                            <span style={{ fontSize: 9, color: C.muted, fontWeight: 700, textTransform: 'uppercase' }}>Disp.</span>
                            <button
                              onClick={() => adjustCount(it._idx, -1)}
                              disabled={it.count <= 0}
                              style={{
                                width: 24, height: 24, borderRadius: 6,
                                background: C.surface2, color: C.text,
                                border: `1px solid ${C.line}`,
                                cursor: it.count > 0 ? 'pointer' : 'not-allowed',
                                fontSize: 13, fontFamily: 'inherit', padding: 0,
                                opacity: it.count > 0 ? 1 : 0.4,
                              }}
                            >−</button>
                            <span style={{ fontSize: 13, fontWeight: 900, color: status, minWidth: 24, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{it.count}</span>
                            <button
                              onClick={() => adjustCount(it._idx, 1)}
                              disabled={it.count >= it.total}
                              style={{
                                width: 24, height: 24, borderRadius: 6,
                                background: C.surface2, color: C.text,
                                border: `1px solid ${C.line}`,
                                cursor: it.count < it.total ? 'pointer' : 'not-allowed',
                                fontSize: 13, fontFamily: 'inherit', padding: 0,
                                opacity: it.count < it.total ? 1 : 0.4,
                              }}
                            >+</button>
                            <span style={{ marginLeft: 8, fontSize: 10, color: C.muted, fontWeight: 700 }}>/</span>
                            {/* Total -/+ */}
                            <span style={{ fontSize: 9, color: C.muted, fontWeight: 700, textTransform: 'uppercase' }}>Total</span>
                            <button
                              onClick={() => adjustTotal(it._idx, -1)}
                              disabled={it.total <= 0}
                              style={{
                                width: 24, height: 24, borderRadius: 6,
                                background: 'transparent', color: C.muted,
                                border: `1px solid ${C.line}`,
                                cursor: it.total > 0 ? 'pointer' : 'not-allowed',
                                fontSize: 13, fontFamily: 'inherit', padding: 0,
                                opacity: it.total > 0 ? 1 : 0.4,
                              }}
                            >−</button>
                            <span style={{ fontSize: 12, fontWeight: 700, color: C.muted, minWidth: 22, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{it.total}</span>
                            <button
                              onClick={() => adjustTotal(it._idx, 1)}
                              style={{
                                width: 24, height: 24, borderRadius: 6,
                                background: 'transparent', color: C.muted,
                                border: `1px solid ${C.line}`,
                                cursor: 'pointer',
                                fontSize: 13, fontFamily: 'inherit', padding: 0,
                              }}
                            >+</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* ADD FORM */}
            {showAddForm ? (
              <div style={{
                background: C.surface, border: `1px solid ${C.cyan}55`,
                borderRadius: 14, padding: 14, marginTop: 6,
                display: 'flex', flexDirection: 'column', gap: 10,
              }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: C.cyan, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                  Nuevo item
                </p>
                <input
                  value={newItem.label}
                  onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
                  placeholder="Ej. Mancuernas 10kg"
                  style={{
                    padding: '10px 12px', borderRadius: 10,
                    background: C.surface2, border: `1px solid ${C.line}`,
                    color: C.text, fontSize: 13, fontFamily: 'inherit', outline: 'none',
                  }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <input
                    type="number"
                    value={newItem.count}
                    onChange={(e) => setNewItem({ ...newItem, count: e.target.value })}
                    placeholder="Disponibles"
                    style={{
                      padding: '10px 12px', borderRadius: 10,
                      background: C.surface2, border: `1px solid ${C.line}`,
                      color: C.text, fontSize: 13, fontFamily: 'inherit', outline: 'none',
                    }}
                  />
                  <input
                    type="number"
                    value={newItem.total}
                    onChange={(e) => setNewItem({ ...newItem, total: e.target.value })}
                    placeholder="Total"
                    style={{
                      padding: '10px 12px', borderRadius: 10,
                      background: C.surface2, border: `1px solid ${C.line}`,
                      color: C.text, fontSize: 13, fontFamily: 'inherit', outline: 'none',
                    }}
                  />
                </div>
                <div className="scroll-x-no-bar" style={{ display: 'flex', gap: 5, overflowX: 'auto' }}>
                  {(['Barras', 'Plates', 'Gymnastics', 'Cardio', 'Accesorios'] as const).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setNewItem({ ...newItem, category: cat })}
                      style={{
                        flexShrink: 0, padding: '6px 12px', borderRadius: 999,
                        background: newItem.category === cat ? C.cyan : 'transparent',
                        color: newItem.category === cat ? '#07070F' : C.muted,
                        border: `1px solid ${newItem.category === cat ? C.cyan : C.line}`,
                        fontSize: 10, fontWeight: 800,
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >{cat}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => { setShowAddForm(false); setNewItem({ label: '', count: '', total: '', category: 'Accesorios', icon: '📦' }); }}
                    style={{
                      flex: 1, padding: '11px 0', borderRadius: 12,
                      background: 'transparent', color: C.muted,
                      border: `1px solid ${C.line}`,
                      fontSize: 12, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >Cancelar</button>
                  <button
                    onClick={addItem}
                    disabled={!newItem.label.trim() || !newItem.total || !newItem.count}
                    style={{
                      flex: 2, padding: '11px 0', borderRadius: 12,
                      background: C.cyan, color: '#07070F',
                      border: 'none',
                      fontSize: 12, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
                      cursor: 'pointer', fontFamily: 'inherit',
                      opacity: (!newItem.label.trim() || !newItem.total || !newItem.count) ? 0.4 : 1,
                    }}
                  >Agregar item</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                style={{
                  width: '100%', marginTop: 6, padding: '14px 0',
                  background: C.cyan, color: '#07070F', border: 'none',
                  borderRadius: 14, fontSize: 13, fontWeight: 800,
                  letterSpacing: '.04em', textTransform: 'uppercase',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >+ Agregar item</button>
            )}
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

      <WiseAssistant context={`Coach Tools · ${TABS.find(t => t.id === tab)?.label}`} bottomOffset={200} />
    </div>
  );
};

export default VoltaCoachTools;
