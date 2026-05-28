import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  SUBJECTS, SKILLS,
  isSkillUnlocked, isSkillMastered, isSkillInProgress, countMastered, getPath,
  type SubjectId, type Skill, type SkillProgress,
} from '../data/skillTree';
import BottomSheet from '../components/BottomSheet';
import { skillFocus, type SkillFocusResponse } from '../lib/skillFocus';
import {
  skillEvaluation,
  type SkillEvaluationResponse,
  type SkillEvaluationLevel,
} from '../lib/skillEvaluation';
import { useToast } from '../components/Toast';
import { useProduct } from '../context/ProductContext';

/**
 * Movement Progression — Skill Tree CrossFit con 95 movimientos.
 *
 * Dos vistas:
 * - Lista: cards por tier con prereqs visibles (mobile-friendly)
 * - Árbol: SVG hexagonal con conexiones curvas entre prereqs (visual)
 *
 * Sidebar lateral con tier-jump para navegar largo.
 */

const C = {
  bg: '#07070F',
  surface: '#0F0F1C',
  surface2: '#161626',
  line: '#1E1E32',
  text: '#EAEAF5',
  muted: '#52527A',
  gold: '#F59E0B',
  green: '#22C55E',
};

const TIER_LABELS = ['Fundamentos', 'Principiante', 'Intermedio', 'Avanzado', 'Élite'];
const TIER_COLORS = ['#94A3B8', '#3B82F6', '#A855F7', '#F59E0B', '#EF4444'];

const STORAGE_KEY = 'skillTree:progress';

function loadProgress(): SkillProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProgress(p: SkillProgress) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch { /* ignore */ }
}

type ViewMode = 'list' | 'tree';

// ─── SKILL CARD (LIST VIEW) ─────────────────────────────
interface SkillCardProps {
  skill: Skill;
  progress: SkillProgress;
  accent: string;
  highlighted?: boolean;
  faded?: boolean;
  /** Si tiene un foco activo del coach: nota técnica para mostrar inline */
  coachFocusNote?: string | null;
  /** Nombre del coach que asignó el foco */
  coachFocusName?: string | null;
  /** Evaluación formal del coach (1-5 stars) sobre este movimiento */
  coachEvaluation?: SkillEvaluationResponse | null;
  onClick: () => void;
}

const STAR_GOLD = '#FBBF24';
const LEVEL_LABELS: Record<SkillEvaluationLevel, string> = {
  1: 'novato',
  2: 'básico',
  3: 'funcional',
  4: 'sólido',
  5: 'maestría',
};

const SkillCard: React.FC<SkillCardProps> = ({ skill, progress, accent, highlighted, faded, coachFocusNote, coachFocusName, coachEvaluation, onClick }) => {
  const unlocked = isSkillUnlocked(skill, progress);
  const mastered = isSkillMastered(skill, progress);
  const inProgress = isSkillInProgress(skill, progress);

  const prereqs = skill.prerequisites.map(pid => SKILLS.find(s => s.id === pid)).filter(Boolean) as Skill[];
  const hasCoachFocus = !!coachFocusNote || coachFocusNote === '';
  const focusGlow = hasCoachFocus;

  return (
    <button
      onClick={onClick}
      className={`btn-press${focusGlow ? ' anim-pulse' : ''}`}
      style={{
        width: '100%',
        background: focusGlow
          ? `linear-gradient(135deg, ${C.gold}1f, ${C.gold}08)`
          : mastered
            ? `linear-gradient(135deg, ${accent}25, ${accent}08)`
            : inProgress
              ? `${accent}10`
              : unlocked
                ? C.surface
                : 'rgba(255,255,255,0.02)',
        border: `1px solid ${
          focusGlow ? C.gold :
          highlighted ? C.gold :
          mastered ? `${accent}80` :
          inProgress ? `${accent}50` :
          C.line
        }`,
        borderRadius: 14,
        padding: '12px 14px',
        opacity: faded ? 0.3 : (unlocked ? 1 : 0.6),
        position: 'relative',
        cursor: 'pointer',
        fontFamily: 'inherit',
        textAlign: 'left',
        boxShadow: focusGlow
          ? `0 0 18px ${C.gold}66, inset 0 0 0 1px ${C.gold}33`
          : highlighted ? `0 0 16px ${C.gold}50` : 'none',
        transition: 'all .25s ease',
      }}
    >
      <div style={{ position: 'absolute', top: 10, right: 12, fontSize: 14 }}>
        {mastered ? <span style={{ color: accent, fontWeight: 900 }}>✓</span>
         : inProgress ? <span style={{ color: accent, fontSize: 11, fontWeight: 800 }}>●</span>
         : !unlocked ? <span style={{ opacity: 0.5 }}>🔒</span> : null}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, paddingRight: 22 }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: unlocked ? C.text : C.muted, flex: 1 }}>{skill.name}</p>
        <span style={{
          fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 6,
          background: `${TIER_COLORS[skill.tier - 1]}20`, color: TIER_COLORS[skill.tier - 1],
          letterSpacing: '.04em', flexShrink: 0,
        }}>T{skill.tier}</span>
      </div>
      {hasCoachFocus && (
        <div style={{
          background: `${C.gold}14`, border: `1px solid ${C.gold}55`,
          borderRadius: 10, padding: '6px 8px', marginBottom: 8,
          display: 'flex', alignItems: 'flex-start', gap: 6,
        }}>
          <span style={{ fontSize: 11 }}>🎯</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 9, color: C.gold, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase' }}>
              Foco coach{coachFocusName ? ` · ${coachFocusName}` : ''}
            </p>
            {coachFocusNote && (
              <p style={{ fontSize: 10, color: C.text, lineHeight: 1.4, marginTop: 2, fontStyle: 'italic' }}>
                "{coachFocusNote}"
              </p>
            )}
          </div>
        </div>
      )}
      {coachEvaluation && (() => {
        const lv = coachEvaluation.level;
        const isSolid = lv >= 4;
        const needsWork = lv <= 2;
        const badgeColor = isSolid ? '#4ade80' : needsWork ? '#f87171' : STAR_GOLD;
        const badgeBg = isSolid
          ? 'rgba(34,197,94,0.10)'
          : needsWork
            ? 'rgba(239,68,68,0.10)'
            : `${STAR_GOLD}14`;
        return (
          <div style={{
            background: badgeBg, border: `1px solid ${badgeColor}55`,
            borderRadius: 10, padding: '6px 8px', marginBottom: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ display: 'inline-flex', gap: 1 }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <span key={i} style={{
                    fontSize: 11, lineHeight: 1,
                    color: i <= lv ? STAR_GOLD : C.line,
                  }}>★</span>
                ))}
              </span>
              <span style={{
                fontSize: 9, fontWeight: 800, color: badgeColor,
                letterSpacing: '.04em', textTransform: 'uppercase',
              }}>
                {LEVEL_LABELS[lv]}
              </span>
              {coachEvaluation.coach_name && (
                <span style={{ fontSize: 9, color: C.muted, marginLeft: 'auto' }}>
                  · {coachEvaluation.coach_name}
                </span>
              )}
            </div>
            {isSolid && (
              <p style={{ fontSize: 9, color: '#4ade80', fontWeight: 700, marginTop: 3 }}>
                ✓ Evaluado por coach · sólido
              </p>
            )}
            {needsWork && (
              <p style={{ fontSize: 9, color: '#f87171', fontWeight: 700, marginTop: 3 }}>
                Tu coach indica trabajo extra · revisá los focos
              </p>
            )}
          </div>
        );
      })()}
      <p style={{ fontSize: 10, color: C.muted, lineHeight: 1.4, marginBottom: 6 }}>{skill.description}</p>
      <p style={{ fontSize: 9, color: accent, fontWeight: 700, letterSpacing: '.04em', marginBottom: prereqs.length ? 8 : 0 }}>📊 {skill.volume}</p>
      {prereqs.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, paddingTop: 8, borderTop: `1px dashed ${C.line}` }}>
          <span style={{ fontSize: 8, color: C.muted, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', alignSelf: 'center', marginRight: 2 }}>Requiere:</span>
          {prereqs.map(p => {
            const ok = isSkillMastered(p, progress);
            return (
              <span key={p.id} style={{
                fontSize: 9, padding: '2px 6px', borderRadius: 6,
                background: ok ? `${accent}20` : C.surface2, color: ok ? accent : C.muted,
                border: `1px solid ${ok ? `${accent}40` : C.line}`, fontWeight: 700,
              }}>{ok ? '✅' : '○'} {p.name}</span>
            );
          })}
        </div>
      )}
      {skill.unlocks.length > 0 && (
        <p style={{ fontSize: 9, color: C.muted, marginTop: 6, fontStyle: 'italic' }}>
          → Desbloquea {skill.unlocks.length} skill{skill.unlocks.length === 1 ? '' : 's'}
        </p>
      )}
    </button>
  );
};

// ─── TREE VIEW (SVG) ────────────────────────────────────
interface TreeViewProps {
  skills: Skill[];
  progress: SkillProgress;
  accent: string;
  highlightedPath: { upstream: Set<string>; downstream: Set<string> } | null;
  modalSkillId: string | null;
  onSkillClick: (skill: Skill) => void;
  subjectAccent: (s: Skill) => string;
}

const HEX_W = 62;
const HEX_H = 54;
const TIER_HEIGHT = 100;
const COL_WIDTH = 78;

const TreeView: React.FC<TreeViewProps> = ({ skills, progress, accent, highlightedPath, modalSkillId, onSkillClick, subjectAccent }) => {
  // Layout: agrupar por tier vertical, distribuir horizontal
  const layout = useMemo(() => {
    const byTier: Record<number, Skill[]> = {};
    skills.forEach(s => {
      if (!byTier[s.tier]) byTier[s.tier] = [];
      byTier[s.tier].push(s);
    });

    // Calcular posición x/y de cada skill
    const positions: Record<string, { x: number; y: number; skill: Skill }> = {};
    let maxCols = 0;

    [1, 2, 3, 4, 5].forEach(tier => {
      const list = byTier[tier] || [];
      maxCols = Math.max(maxCols, list.length);
    });

    const totalWidth = Math.max(maxCols * COL_WIDTH + 40, 600);

    [1, 2, 3, 4, 5].forEach(tier => {
      const list = byTier[tier] || [];
      const tierY = (tier - 1) * TIER_HEIGHT + 60;
      // Center horizontally
      const spacing = totalWidth / (list.length + 1);
      list.forEach((skill, i) => {
        positions[skill.id] = {
          x: spacing * (i + 1),
          y: tierY,
          skill,
        };
      });
    });

    return { positions, totalWidth, totalHeight: 5 * TIER_HEIGHT + 80 };
  }, [skills]);

  // Generar edges entre prereqs
  const edges = useMemo(() => {
    const result: Array<{ from: { x: number; y: number }; to: { x: number; y: number }; mastered: boolean; highlighted: boolean }> = [];
    skills.forEach(skill => {
      const target = layout.positions[skill.id];
      if (!target) return;
      skill.prerequisites.forEach(pid => {
        const source = layout.positions[pid];
        if (!source) return;
        const fromMastered = progress[pid] === 'mastered';
        const inPath = highlightedPath && (
          highlightedPath.upstream.has(skill.id) || highlightedPath.upstream.has(pid) ||
          modalSkillId === skill.id || modalSkillId === pid
        );
        result.push({
          from: { x: source.x, y: source.y + HEX_H / 2 },
          to: { x: target.x, y: target.y - HEX_H / 2 },
          mastered: fromMastered,
          highlighted: !!inPath,
        });
      });
    });
    return result;
  }, [skills, layout, progress, highlightedPath, modalSkillId]);

  return (
    <div style={{ width: '100%', overflow: 'auto', position: 'relative', paddingBottom: 20 }} className="scroll-x-no-bar">
      <svg
        width={layout.totalWidth}
        height={layout.totalHeight}
        style={{ display: 'block' }}
      >
        {/* Tier guide lines */}
        {[1, 2, 3, 4, 5].map(tier => {
          const y = (tier - 1) * TIER_HEIGHT + 60;
          const tColor = TIER_COLORS[tier - 1];
          return (
            <g key={`tier-${tier}`}>
              <line x1={0} y1={y} x2={layout.totalWidth} y2={y}
                stroke={tColor} strokeOpacity={0.08} strokeDasharray="4 4" />
              <text x={10} y={y - 6} fill={tColor} fontSize={9} fontWeight={800} letterSpacing="1">
                T{tier} · {TIER_LABELS[tier - 1].toUpperCase()}
              </text>
            </g>
          );
        })}

        {/* Edges (debajo de los nodos) */}
        {edges.map((e, i) => {
          const midY = (e.from.y + e.to.y) / 2;
          const path = `M ${e.from.x} ${e.from.y} C ${e.from.x} ${midY}, ${e.to.x} ${midY}, ${e.to.x} ${e.to.y}`;
          return (
            <path key={`edge-${i}`}
              d={path}
              fill="none"
              stroke={e.highlighted ? C.gold : e.mastered ? accent : C.line}
              strokeWidth={e.highlighted ? 2.2 : 1.2}
              opacity={e.highlighted ? 1 : e.mastered ? 0.55 : 0.35}
              strokeLinecap="round"
            />
          );
        })}

        {/* Nodes hexagonales */}
        {Object.values(layout.positions).map(({ x, y, skill }) => {
          const unlocked = isSkillUnlocked(skill, progress);
          const mastered = isSkillMastered(skill, progress);
          const inProgress = isSkillInProgress(skill, progress);
          const inPath = highlightedPath && (
            highlightedPath.upstream.has(skill.id) ||
            highlightedPath.downstream.has(skill.id) ||
            modalSkillId === skill.id
          );
          const faded = highlightedPath !== null && !inPath;
          const sAccent = subjectAccent(skill);

          // Hexagon points (flat-top)
          const hexPts = [
            [x - HEX_W / 2, y],
            [x - HEX_W / 4, y - HEX_H / 2],
            [x + HEX_W / 4, y - HEX_H / 2],
            [x + HEX_W / 2, y],
            [x + HEX_W / 4, y + HEX_H / 2],
            [x - HEX_W / 4, y + HEX_H / 2],
          ].map(p => p.join(',')).join(' ');

          return (
            <g key={skill.id}
              onClick={() => onSkillClick(skill)}
              style={{ cursor: 'pointer', opacity: faded ? 0.3 : 1, transition: 'opacity .3s' }}
            >
              <polygon
                points={hexPts}
                fill={mastered ? sAccent : inProgress ? `${sAccent}25` : unlocked ? C.surface : C.surface2}
                stroke={inPath ? C.gold : mastered ? sAccent : inProgress ? sAccent : unlocked ? C.line : C.line}
                strokeWidth={inPath ? 2.5 : 1.5}
                style={{
                  filter: inPath ? `drop-shadow(0 0 8px ${C.gold}80)` :
                          mastered ? `drop-shadow(0 0 6px ${sAccent}50)` : 'none',
                }}
              />
              <text
                x={x} y={y - 4}
                textAnchor="middle"
                fill={mastered ? '#07070F' : unlocked ? C.text : C.muted}
                fontSize={8.5}
                fontWeight={800}
                style={{ pointerEvents: 'none' }}
              >
                {skill.name.length > 14 ? skill.name.slice(0, 12) + '…' : skill.name}
              </text>
              <text
                x={x} y={y + 9}
                textAnchor="middle"
                fill={mastered ? '#07070F' : sAccent}
                fontSize={8}
                fontWeight={700}
                style={{ pointerEvents: 'none' }}
              >
                {mastered ? '✓' : inProgress ? '●' : !unlocked ? '🔒' : `T${skill.tier}`}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ─── MAIN PAGE ──────────────────────────────────────────
const MovementProgression: React.FC = () => {
  const [view, setView] = useState<ViewMode>(() => (localStorage.getItem('skillTree:view') as ViewMode) || 'list');
  const [subjectFilter, setSubjectFilter] = useState<SubjectId | 'all'>('all');
  const [progress, setProgress] = useState<SkillProgress>(() => loadProgress());
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null); // skill resaltada (rama visible)
  const [modalSkill, setModalSkill] = useState<Skill | null>(null);       // skill abierta en BottomSheet
  const [highlightedPath, setHighlightedPath] = useState<{ upstream: Set<string>; downstream: Set<string> } | null>(null);
  const [coachFocuses, setCoachFocuses] = useState<SkillFocusResponse[]>([]);
  const [coachEvaluations, setCoachEvaluations] = useState<SkillEvaluationResponse[]>([]);
  const [markingDominated, setMarkingDominated] = useState<boolean>(false);
  const { showToast } = useToast();
  const { product } = useProduct();

  // Fetch focos del coach (best-effort · si no hay backend o usuario no es atleta, queda vacío)
  useEffect(() => {
    let cancelled = false;
    skillFocus.list()
      .then((list) => { if (!cancelled) setCoachFocuses(list); })
      .catch(() => { /* sin sesión / no atleta · ignoramos */ });
    return () => { cancelled = true; };
  }, []);

  // Fetch evaluaciones formales del coach (best-effort)
  useEffect(() => {
    let cancelled = false;
    skillEvaluation.listMe()
      .then((list) => { if (!cancelled) setCoachEvaluations(list); })
      .catch(() => { /* sin sesión / no atleta · ignoramos */ });
    return () => { cancelled = true; };
  }, []);

  const evaluationByMovement = useMemo(() => {
    const m = new Map<string, SkillEvaluationResponse>();
    for (const e of coachEvaluations) m.set(e.movement_id, e);
    return m;
  }, [coachEvaluations]);

  const focusByMovement = useMemo(() => {
    const m = new Map<string, SkillFocusResponse>();
    for (const f of coachFocuses) {
      if (f.status === 'active') m.set(f.movement_id, f);
    }
    return m;
  }, [coachFocuses]);

  // Scroll automático al primer movimiento focused la primera vez que cargan focos.
  const didScrollFocusRef = useRef(false);
  useEffect(() => {
    if (didScrollFocusRef.current) return;
    if (coachFocuses.length === 0) return;
    const first = coachFocuses.find(f => f.status === 'active');
    if (!first) return;
    didScrollFocusRef.current = true;
    // Pequeño defer para que el DOM termine de pintar las cards
    window.setTimeout(() => {
      const el = document.querySelector(`[data-skill-id="${first.movement_id}"]`) as HTMLElement | null;
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  }, [coachFocuses]);

  const tierRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => { saveProgress(progress); }, [progress]);
  useEffect(() => { localStorage.setItem('skillTree:view', view); }, [view]);

  // Tree view requiere un subject único (95 nodos en 'all' es ilegible)
  useEffect(() => {
    if (view === 'tree' && subjectFilter === 'all') {
      setSubjectFilter('gymnastics');
    }
  }, [view, subjectFilter]);

  const totalStats = useMemo(() => countMastered(undefined, progress), [progress]);
  const subjectStats = useMemo(() => {
    return SUBJECTS.reduce((acc, s) => {
      acc[s.id] = countMastered(s.id, progress);
      return acc;
    }, {} as Record<SubjectId, { done: number; total: number }>);
  }, [progress]);

  const skillsToShow = subjectFilter === 'all'
    ? SKILLS
    : SKILLS.filter(s => s.subject === subjectFilter);

  const skillsByTier = useMemo(() => {
    const map: Record<number, Skill[]> = {};
    skillsToShow.forEach(s => {
      if (!map[s.tier]) map[s.tier] = [];
      map[s.tier].push(s);
    });
    return map;
  }, [skillsToShow]);

  const activeSubject = subjectFilter === 'all' ? null : SUBJECTS.find(s => s.id === subjectFilter);
  const accent = activeSubject?.color ?? '#00E5FF';
  const subjectAccent = (s: Skill) => SUBJECTS.find(x => x.id === s.subject)?.color ?? accent;

  const handleSkillClick = (skill: Skill) => {
    // 2do click sobre el mismo skill → abre modal de detalle
    if (selectedSkill?.id === skill.id) {
      setModalSkill(skill);
      return;
    }
    // 1er click → solo ilumina la rama (sin modal)
    setSelectedSkill(skill);
    const path = getPath(skill.id);
    setHighlightedPath({
      upstream: new Set(path.upstream),
      downstream: new Set(path.downstream),
    });
  };

  const closeModal = () => {
    setModalSkill(null);
    // selectedSkill + highlightedPath se mantienen para que el usuario siga viendo la rama
  };

  const clearSelection = () => {
    setSelectedSkill(null);
    setHighlightedPath(null);
    setModalSkill(null);
  };

  const openDetailFromSelection = () => {
    if (selectedSkill) setModalSkill(selectedSkill);
  };

  const toggleSkillProgress = (id: string) => {
    setProgress(prev => {
      const next = { ...prev };
      const current = next[id];
      if (!current) next[id] = 'in_progress';
      else if (current === 'in_progress') next[id] = 'mastered';
      else delete next[id];
      return next;
    });
  };

  const jumpToTier = (tier: number) => {
    const el = tierRefs.current[tier];
    if (!el) return;
    // Buscar el contenedor scrollable más cercano (el overflow-y-auto del PhoneLayout)
    let scroller: HTMLElement | null = el.parentElement;
    while (scroller && scroller !== document.body) {
      const overflow = getComputedStyle(scroller).overflowY;
      if (overflow === 'auto' || overflow === 'scroll') break;
      scroller = scroller.parentElement;
    }
    if (!scroller) return;
    const scrollerRect = scroller.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const targetTop = scroller.scrollTop + (elRect.top - scrollerRect.top) - 12;
    scroller.scrollTo({ top: targetTop, behavior: 'smooth' });
  };

  // Skill Tree = 95 movimientos CrossFit · contenido propio de Volta.
  // En Holy Oly (halterofilia) no aplica · estado neutral en vez del árbol
  // para no exponer contenido del otro producto. (product-aware guard)
  if (product === 'holy-oly') {
    return (
      <div style={{ background: C.bg, minHeight: '100%', color: C.text, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 14, padding: '48px 28px' }} className="anim-fade-in">
        <div style={{ fontSize: 34, opacity: 0.7 }}>🌳</div>
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: C.text }}>Skill Tree · exclusivo de Volta</h2>
        <p style={{ fontSize: 13, color: C.muted, maxWidth: 280, lineHeight: 1.5, margin: 0 }}>
          El árbol de 95 movimientos es de CrossFit. En Holy Oly tu progreso de halterofilia vive en tus Stats y macrociclos.
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: '100%', paddingBottom: 90, color: C.text, position: 'relative' }} className="anim-fade-in">
      {/* HEADER */}
      <div style={{ padding: '20px 16px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' }}>
              CrossFit · Skill Tree
            </p>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: C.text, marginTop: 4 }}>Mi progresión</h1>
            <p style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>
              {totalStats.done} / {totalStats.total} dominados · {SKILLS.length - totalStats.done} por desbloquear
            </p>
          </div>
          {/* View toggle */}
          <div style={{ display: 'flex', gap: 0, background: C.surface, border: `1px solid ${C.line}`, borderRadius: 10, padding: 2 }}>
            <button
              onClick={() => setView('list')}
              className="btn-press"
              style={{
                padding: '6px 10px', borderRadius: 8,
                background: view === 'list' ? accent : 'transparent',
                color: view === 'list' ? '#07070F' : C.muted,
                border: 'none', fontSize: 10, fontWeight: 800,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >☰ Lista</button>
            <button
              onClick={() => setView('tree')}
              className="btn-press"
              style={{
                padding: '6px 10px', borderRadius: 8,
                background: view === 'tree' ? accent : 'transparent',
                color: view === 'tree' ? '#07070F' : C.muted,
                border: 'none', fontSize: 10, fontWeight: 800,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >⋔ Árbol</button>
          </div>
        </div>

        {/* Global progress bar */}
        <div style={{ height: 5, background: C.surface, borderRadius: 3, overflow: 'hidden', marginTop: 10 }}>
          <div style={{
            height: '100%', width: `${(totalStats.done / totalStats.total) * 100}%`,
            background: 'linear-gradient(90deg, #A855F7, #00E5FF, #F59E0B, #EF4444)',
            transition: 'width .5s ease',
          }} />
        </div>
      </div>

      {/* SUBJECT TABS · wrap a múltiples líneas (no scroll horizontal) */}
      <div style={{ padding: '0 16px 14px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {view === 'list' && (
          <button
            onClick={() => setSubjectFilter('all')}
            className="btn-press"
            style={{
              padding: '8px 14px', borderRadius: 12, flexShrink: 0,
              background: subjectFilter === 'all' ? C.text : C.surface,
              color: subjectFilter === 'all' ? '#07070F' : C.muted,
              border: `1px solid ${subjectFilter === 'all' ? C.text : C.line}`,
              fontSize: 11, fontWeight: 800, letterSpacing: '.04em',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >Todos · {totalStats.done}/{totalStats.total}</button>
        )}
        {SUBJECTS.map(s => {
          const active = subjectFilter === s.id;
          const stats = subjectStats[s.id];
          return (
            <button
              key={s.id}
              onClick={() => setSubjectFilter(s.id)}
              className="btn-press"
              style={{
                padding: '8px 14px', borderRadius: 12, flexShrink: 0,
                background: active ? s.color : C.surface,
                color: active ? '#07070F' : C.muted,
                border: `1px solid ${active ? s.color : C.line}`,
                fontSize: 11, fontWeight: 800, letterSpacing: '.04em',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >{s.icon} {s.name} · {stats.done}/{stats.total}</button>
          );
        })}
      </div>

      {/* CONTENIDO según vista */}
      {view === 'list' ? (
        <>
          {/* TIER JUMP SIDEBAR (sticky dentro del scroll del phone frame) */}
          <div style={{
            position: 'sticky', top: 220, marginLeft: 'auto', marginRight: 4,
            width: 30, height: 0, // height 0 + overflow visible permite que los botones se vean
            zIndex: 30,
          }}>
            <div style={{
              position: 'absolute', right: 0, top: 0,
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
            {[1, 2, 3, 4, 5].map(tier => {
              const tierColor = TIER_COLORS[tier - 1];
              const tierSkills = skillsByTier[tier] || [];
              const tierDone = tierSkills.filter(s => isSkillMastered(s, progress)).length;
              return (
                <button
                  key={tier}
                  onClick={() => jumpToTier(tier)}
                  className="btn-press"
                  title={`${TIER_LABELS[tier - 1]} · ${tierDone}/${tierSkills.length}`}
                  style={{
                    width: 24, height: 24, borderRadius: 8,
                    background: tierSkills.length > 0 ? `${tierColor}25` : 'transparent',
                    border: `1px solid ${tierSkills.length > 0 ? `${tierColor}60` : C.line}`,
                    color: tierColor, fontSize: 9, fontWeight: 900,
                    cursor: tierSkills.length > 0 ? 'pointer' : 'default',
                    fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: tierSkills.length > 0 ? 1 : 0.3,
                  }}
                >T{tier}</button>
              );
            })}
            </div>
          </div>

          {activeSubject && (
            <div style={{ padding: '0 16px 12px' }}>
              <p style={{ fontSize: 11, color: C.muted, lineHeight: 1.4 }}>{activeSubject.description}</p>
            </div>
          )}

          {/* LIST */}
          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1, 2, 3, 4, 5].map(tier => {
              const skillsInTier = skillsByTier[tier];
              if (!skillsInTier || skillsInTier.length === 0) return null;
              const tierColor = TIER_COLORS[tier - 1];
              return (
                <div key={tier} ref={(el) => { tierRefs.current[tier] = el; }} style={{ scrollMarginTop: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 900, color: tierColor,
                      padding: '3px 10px', borderRadius: 8,
                      background: `${tierColor}15`, letterSpacing: '.06em',
                      border: `1px solid ${tierColor}30`,
                    }}>T{tier}</span>
                    <p style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' }}>
                      {TIER_LABELS[tier - 1]} · {skillsInTier.length} skills
                    </p>
                    <div style={{ flex: 1, height: 1, background: C.line }} />
                  </div>

                  <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {skillsInTier.map(skill => {
                      const inUp = highlightedPath?.upstream.has(skill.id);
                      const inDown = highlightedPath?.downstream.has(skill.id);
                      const isActive = selectedSkill?.id === skill.id;
                      const highlighted = isActive || inUp || inDown;
                      const faded = highlightedPath !== null && !highlighted;
                      const focus = focusByMovement.get(skill.id);
                      const evaluation = evaluationByMovement.get(skill.id);
                      return (
                        <div key={skill.id} data-skill-id={skill.id}>
                          <SkillCard
                            skill={skill}
                            progress={progress}
                            accent={subjectAccent(skill)}
                            highlighted={highlighted}
                            faded={faded}
                            coachFocusNote={focus?.note ?? null}
                            coachFocusName={focus?.coach_name ?? null}
                            coachEvaluation={evaluation ?? null}
                            onClick={() => handleSkillClick(skill)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div style={{ padding: '0 0 20px 0' }}>
          <p style={{ fontSize: 10, color: C.muted, textAlign: 'center', marginBottom: 10, padding: '0 16px' }}>
            👆 1er tap: ver rama · 2do tap o "Ver detalle": abrir info
          </p>
          <TreeView
            skills={skillsToShow}
            progress={progress}
            accent={accent}
            highlightedPath={highlightedPath}
            modalSkillId={selectedSkill?.id ?? null}
            onSkillClick={handleSkillClick}
            subjectAccent={subjectAccent}
          />
        </div>
      )}

      {/* FLOATING ACTION cuando hay skill seleccionada (no modal abierto) */}
      {selectedSkill && !modalSkill && (() => {
        const subj = SUBJECTS.find(s => s.id === selectedSkill.subject)!;
        return (
          <div style={{
            position: 'absolute', bottom: 90, left: 16, right: 16, zIndex: 40,
            display: 'flex', gap: 8,
            background: `linear-gradient(to top, ${C.bg} 60%, transparent)`,
            padding: '14px 0 4px',
          }} className="anim-fade-up">
            <button
              onClick={clearSelection}
              className="btn-press"
              style={{
                padding: '12px 14px', borderRadius: 12,
                background: C.surface2, color: C.muted,
                border: `1px solid ${C.line}`,
                fontSize: 11, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >✕ Limpiar</button>
            <button
              onClick={openDetailFromSelection}
              className="btn-press"
              style={{
                flex: 1, padding: '12px 0', borderRadius: 12,
                background: subj.color, color: '#07070F',
                border: 'none',
                fontSize: 12, fontWeight: 900, letterSpacing: '.04em', textTransform: 'uppercase',
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: `0 6px 20px ${subj.color}40`,
              }}
            >Ver detalle de "{selectedSkill.name.length > 20 ? selectedSkill.name.slice(0, 18) + '…' : selectedSkill.name}"</button>
          </div>
        );
      })()}

      {/* DETAIL MODAL */}
      <BottomSheet open={modalSkill !== null} onClose={closeModal} title={modalSkill?.name}>
        {modalSkill && (() => {
          const subj = SUBJECTS.find(s => s.id === modalSkill.subject)!;
          const status = progress[modalSkill.id];
          const unlocked = isSkillUnlocked(modalSkill, progress);
          const prereqs = modalSkill.prerequisites.map(pid => SKILLS.find(s => s.id === pid)).filter(Boolean) as Skill[];
          const unlocks = modalSkill.unlocks.map(uid => SKILLS.find(s => s.id === uid)).filter(Boolean) as Skill[];

          return (
            <div style={{ color: C.text, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 8,
                  background: `${subj.color}20`, color: subj.color, border: `1px solid ${subj.color}40`,
                }}>{subj.icon} {subj.name}</span>
                <span style={{
                  fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 8,
                  background: `${TIER_COLORS[modalSkill.tier - 1]}20`,
                  color: TIER_COLORS[modalSkill.tier - 1],
                  border: `1px solid ${TIER_COLORS[modalSkill.tier - 1]}40`,
                }}>T{modalSkill.tier} · {TIER_LABELS[modalSkill.tier - 1]}</span>
                {!unlocked && (
                  <span style={{
                    fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 8,
                    background: 'rgba(255,255,255,0.06)', color: C.muted,
                  }}>🔒 Bloqueado</span>
                )}
              </div>

              <p style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{modalSkill.description}</p>

              <div style={{
                background: C.surface, border: `1px solid ${C.line}`,
                borderRadius: 12, padding: '12px 14px',
              }}>
                <p className="type-caption" style={{ color: C.muted }}>📊 Volumen recomendado</p>
                <p style={{ fontSize: 13, fontWeight: 800, color: subj.color, marginTop: 4 }}>{modalSkill.volume}</p>
              </div>

              <div>
                <p className="type-caption" style={{ color: C.muted, marginBottom: 8 }}>🎯 Cómo progresarlo</p>
                <ol style={{ paddingLeft: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {modalSkill.progression.map((step, i) => (
                    <li key={i} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      background: C.surface, border: `1px solid ${C.line}`,
                      borderRadius: 10, padding: '10px 12px',
                    }}>
                      <span style={{
                        width: 20, height: 20, borderRadius: '50%',
                        background: `${subj.color}25`, color: subj.color,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 900, flexShrink: 0,
                      }}>{i + 1}</span>
                      <span style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {prereqs.length > 0 && (
                <div>
                  <p className="type-caption" style={{ color: C.muted, marginBottom: 8 }}>⬇ Requiere</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {prereqs.map(p => {
                      const ok = isSkillMastered(p, progress);
                      return (
                        <button key={p.id}
                          onClick={() => { closeModal(); setTimeout(() => handleSkillClick(p), 250); }}
                          className="btn-press"
                          style={{
                            background: ok ? `${subj.color}10` : C.surface,
                            border: `1px solid ${ok ? `${subj.color}30` : C.line}`,
                            borderRadius: 10, padding: '8px 12px',
                            display: 'flex', alignItems: 'center', gap: 10,
                            cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                          }}
                        >
                          <span style={{ fontSize: 14 }}>{ok ? '✅' : '○'}</span>
                          <span style={{ fontSize: 12, color: ok ? C.text : C.muted, fontWeight: ok ? 700 : 500, flex: 1 }}>
                            {p.name}
                          </span>
                          <span style={{ fontSize: 9, color: C.muted }}>Ver →</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {unlocks.length > 0 && (
                <div>
                  <p className="type-caption" style={{ color: C.muted, marginBottom: 8 }}>⬆ Te desbloquea</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {unlocks.map(u => (
                      <button key={u.id}
                        onClick={() => { closeModal(); setTimeout(() => handleSkillClick(u), 250); }}
                        className="btn-press"
                        style={{
                          fontSize: 11, padding: '6px 10px', borderRadius: 8,
                          background: C.surface, border: `1px solid ${C.line}`,
                          color: C.text, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >{u.name} →</button>
                    ))}
                  </div>
                </div>
              )}

              {(() => {
                const focus = focusByMovement.get(modalSkill.id);
                if (!focus) return null;
                const handleMarkDominated = async () => {
                  setMarkingDominated(true);
                  try {
                    await skillFocus.markDominated(focus.id);
                    setCoachFocuses(prev => prev.filter(f => f.id !== focus.id));
                    setProgress(prev => ({ ...prev, [modalSkill.id]: 'mastered' }));
                    showToast({
                      message: `Avisamos al coach: dominaste ${modalSkill.name}`,
                      variant: 'success',
                    });
                    closeModal();
                  } catch (e) {
                    const msg = e instanceof Error ? e.message : 'No pudimos avisar al coach';
                    showToast({ message: msg, variant: 'error' });
                  } finally {
                    setMarkingDominated(false);
                  }
                };
                return (
                  <div style={{
                    background: `${C.gold}14`, border: `1px solid ${C.gold}55`,
                    borderRadius: 12, padding: 12, marginTop: 4,
                  }}>
                    <p style={{ fontSize: 10, color: C.gold, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                      🎯 Foco del coach{focus.coach_name ? ` · ${focus.coach_name}` : ''}
                    </p>
                    {focus.note && (
                      <p style={{ fontSize: 11, color: C.text, marginTop: 6, fontStyle: 'italic', lineHeight: 1.5 }}>
                        "{focus.note}"
                      </p>
                    )}
                    <button
                      onClick={handleMarkDominated}
                      disabled={markingDominated}
                      className="btn-press"
                      style={{
                        width: '100%', marginTop: 10, padding: '12px 0', borderRadius: 10,
                        background: C.gold, color: '#000', border: 'none',
                        fontSize: 11, fontWeight: 900, letterSpacing: '.06em', textTransform: 'uppercase',
                        cursor: markingDominated ? 'wait' : 'pointer', fontFamily: 'inherit',
                        opacity: markingDominated ? 0.6 : 1,
                      }}
                    >
                      {markingDominated ? 'Avisando…' : 'Marcar dominado · avisar coach'}
                    </button>
                  </div>
                );
              })()}

              <button
                onClick={() => toggleSkillProgress(modalSkill.id)}
                className="btn-press"
                disabled={!unlocked}
                style={{
                  padding: '12px 0', borderRadius: 12, marginTop: 4,
                  background: status === 'mastered' ? subj.color
                            : status === 'in_progress' ? `${subj.color}30`
                            : unlocked ? C.surface : 'rgba(255,255,255,0.04)',
                  color: status === 'mastered' ? '#07070F' : C.text,
                  border: `1px solid ${unlocked ? subj.color : C.line}`,
                  fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em',
                  cursor: unlocked ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
                  opacity: unlocked ? 1 : 0.5,
                }}
              >
                {status === 'mastered' ? '✓ Dominado · Click para resetear' :
                 status === 'in_progress' ? '● En progreso · Click para marcar dominado' :
                 '○ Empezar a entrenar'}
              </button>
            </div>
          );
        })()}
      </BottomSheet>
    </div>
  );
};

export default MovementProgression;
