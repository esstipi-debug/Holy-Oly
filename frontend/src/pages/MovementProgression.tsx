import React, { useState, useMemo } from 'react';
import {
  SUBJECTS, SKILLS,
  isSkillAccomplished, isSkillUnlocked, getSkillPercent, countAccomplished,
  type SubjectId, type Skill, type SkillProgress,
} from '../data/skillTree';

/**
 * Movement Progression como Skill Tree (modelo NSA SkillTree).
 *
 * Subjects (Gymnastics / Halterofilia / Conditioning) → Skills con prerequisites.
 * Cada skill tiene 3 estados: locked (prereqs no cumplidos) / in-progress / accomplished.
 */

const C = {
  bg: '#07070F',
  surface: '#0F0F1C',
  surface2: '#161626',
  line: '#1E1E32',
  text: '#EAEAF5',
  muted: '#52527A',
};

// Mock progress del atleta — en prod vendría del backend
const MOCK_PROGRESS: SkillProgress = {
  'jumping-pullup': 20,
  'strict-pullup': 5,
  'kipping-pullup': 15,
  'c2b-pullup': 6,
  'ring-dip': 8,
  'pike-pushup': 15,
  'wall-walk': 5,
  'kipping-hspu': 2,
  'single-under-100': 100,
  'double-under-10': 10,
  'double-under-50': 28,
  'front-squat': 1,
  'power-clean': 5,
  'squat-clean': 1,
};

const TIER_LABELS = ['Foundation', 'Beginner', 'Intermediate', 'Advanced', 'Elite'];

interface SkillCardProps {
  skill: Skill;
  progress: SkillProgress;
  accent: string;
}

const SkillCard: React.FC<SkillCardProps> = ({ skill, progress, accent }) => {
  const unlocked = isSkillUnlocked(skill, progress);
  const accomplished = isSkillAccomplished(skill, progress);
  const pct = getSkillPercent(skill, progress);
  const current = progress[skill.id] ?? 0;

  const prereqs = skill.prerequisites.map(pid => SKILLS.find(s => s.id === pid)).filter(Boolean) as Skill[];

  return (
    <div style={{
      background: accomplished ? `${accent}10` : unlocked ? C.surface : 'rgba(255,255,255,0.02)',
      border: `1px solid ${accomplished ? `${accent}50` : unlocked ? C.line : C.line}`,
      borderRadius: 14, padding: 12,
      opacity: unlocked ? 1 : 0.55,
      position: 'relative',
    }}>
      {/* Lock overlay */}
      {!unlocked && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          fontSize: 12, color: C.muted,
        }}>🔒</div>
      )}
      {accomplished && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          fontSize: 14, color: accent, fontWeight: 900,
        }}>✓</div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: unlocked ? C.text : C.muted }}>{skill.name}</p>
        <span style={{
          fontSize: 9, fontWeight: 700, color: accent,
          padding: '2px 6px', borderRadius: 6,
          background: `${accent}15`, letterSpacing: '.04em',
        }}>T{skill.tier}</span>
      </div>

      <p style={{ fontSize: 10, color: C.muted, lineHeight: 1.4, marginBottom: 8 }}>
        {skill.description}
      </p>

      {/* Progress bar (solo si está desbloqueado) */}
      {unlocked && (
        <>
          <div style={{
            height: 4, background: C.bg, borderRadius: 2,
            overflow: 'hidden', marginBottom: 4,
          }}>
            <div style={{
              height: '100%', width: `${pct * 100}%`,
              background: accomplished ? accent : `${accent}80`,
              transition: 'width .4s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: C.muted }}>
            <span>{current} / {skill.occurrences} {skill.unit}</span>
            <span style={{ color: accomplished ? accent : C.muted, fontWeight: accomplished ? 800 : 600 }}>
              {accomplished ? '✓ Logrado' : `+${skill.xpReward} XP`}
            </span>
          </div>
        </>
      )}

      {/* Prereqs chips */}
      {!unlocked && prereqs.length > 0 && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${C.line}` }}>
          <p style={{ fontSize: 8, color: C.muted, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>
            Requiere
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {prereqs.map(p => {
              const ok = isSkillAccomplished(p, progress);
              return (
                <span key={p.id} style={{
                  fontSize: 9, padding: '2px 6px', borderRadius: 6,
                  background: ok ? `${accent}20` : C.surface2,
                  color: ok ? accent : C.muted,
                  border: `1px solid ${ok ? `${accent}40` : C.line}`,
                  fontWeight: 700,
                }}>
                  {ok ? '✓' : '○'} {p.name}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Drills (cuando in-progress, no accomplished) */}
      {unlocked && !accomplished && skill.drills && skill.drills.length > 0 && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${C.line}` }}>
          <p style={{ fontSize: 8, color: C.muted, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>
            Drills sugeridos
          </p>
          <p style={{ fontSize: 10, color: C.text, lineHeight: 1.4 }}>
            {skill.drills.join(' · ')}
          </p>
        </div>
      )}
    </div>
  );
};

const MovementProgression: React.FC = () => {
  const [subjectFilter, setSubjectFilter] = useState<SubjectId | 'all'>('all');
  const progress = MOCK_PROGRESS;

  const totalStats = useMemo(() => countAccomplished(undefined, progress), [progress]);
  const subjectStats = useMemo(() => {
    return SUBJECTS.reduce((acc, s) => {
      acc[s.id] = countAccomplished(s.id, progress);
      return acc;
    }, {} as Record<SubjectId, { done: number; total: number }>);
  }, [progress]);

  const skillsToShow = subjectFilter === 'all'
    ? SKILLS
    : SKILLS.filter(s => s.subject === subjectFilter);

  // Agrupar por tier
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

  return (
    <div style={{ background: C.bg, minHeight: '100%', paddingBottom: 90, color: C.text }}>
      {/* HEADER */}
      <div style={{ padding: '52px 16px 16px' }}>
        <p style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' }}>
          CrossFit · Skill Tree
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: C.text, marginTop: 4 }}>Mi progresión</h1>
        <p style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>
          {totalStats.done} / {totalStats.total} skills logrados · {SKILLS.length - totalStats.done} por desbloquear
        </p>
        {/* Global progress bar */}
        <div style={{
          height: 4, background: C.surface, borderRadius: 2,
          overflow: 'hidden', marginTop: 8,
        }}>
          <div style={{
            height: '100%',
            width: `${(totalStats.done / totalStats.total) * 100}%`,
            background: 'linear-gradient(90deg, #A855F7, #00E5FF, #F59E0B)',
            transition: 'width .5s ease',
          }} />
        </div>
      </div>

      {/* SUBJECT TABS */}
      <div style={{ padding: '0 16px 16px', display: 'flex', gap: 6, overflowX: 'auto' }}>
        <button
          onClick={() => setSubjectFilter('all')}
          style={{
            padding: '8px 14px', borderRadius: 12, flexShrink: 0,
            background: subjectFilter === 'all' ? C.text : C.surface,
            color: subjectFilter === 'all' ? '#07070F' : C.muted,
            border: `1px solid ${subjectFilter === 'all' ? C.text : C.line}`,
            fontSize: 11, fontWeight: 800, letterSpacing: '.04em',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >Todos · {totalStats.done}/{totalStats.total}</button>
        {SUBJECTS.map(s => {
          const active = subjectFilter === s.id;
          const stats = subjectStats[s.id];
          return (
            <button
              key={s.id}
              onClick={() => setSubjectFilter(s.id)}
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

      {/* SUBJECT DESCRIPTION */}
      {activeSubject && (
        <div style={{ padding: '0 16px 12px' }}>
          <p style={{ fontSize: 11, color: C.muted, lineHeight: 1.4 }}>
            {activeSubject.description}
          </p>
        </div>
      )}

      {/* SKILL TREE — agrupado por tier */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[1, 2, 3, 4, 5].map(tier => {
          const skillsInTier = skillsByTier[tier];
          if (!skillsInTier || skillsInTier.length === 0) return null;
          return (
            <div key={tier}>
              {/* Tier header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{
                  fontSize: 10, fontWeight: 900, color: accent,
                  padding: '3px 8px', borderRadius: 6,
                  background: `${accent}15`, letterSpacing: '.06em',
                }}>T{tier}</span>
                <p style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' }}>
                  {TIER_LABELS[tier - 1]}
                </p>
                <div style={{ flex: 1, height: 1, background: C.line }} />
              </div>

              {/* Skills en este tier */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {skillsInTier.map(skill => {
                  const subj = SUBJECTS.find(s => s.id === skill.subject)!;
                  return (
                    <SkillCard
                      key={skill.id}
                      skill={skill}
                      progress={progress}
                      accent={subjectFilter === 'all' ? subj.color : accent}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MovementProgression;
