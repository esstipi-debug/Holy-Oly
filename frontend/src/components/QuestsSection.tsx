import React from 'react';
import { getActiveQuests, getMonthlyQuest, type Quest } from '../data/quests';
import type { Product } from '../data/levels';

/**
 * Sección de quests semanales para mostrar en Home.
 *
 * Recibe el progreso actual del atleta (sessions/PRs/streak/etc) y calcula
 * cuánto le falta para completar cada quest.
 */

export interface QuestProgress {
  sessionsThisWeek: number;
  rxThisWeek: number;
  prsThisWeek: number;
  tonelajeKg: number;
  skippedThisWeek: number;
  mobilityDays: number;
  sleepDays: number;
  hrvDays: number;
  waterDays: number;
  foamDays: number;
  preCheckCount: number;
  benchmarkDone: boolean;
  teamWodDone: boolean;
  skillPrDone: boolean;
}

interface Props {
  product: Product;
  progress: QuestProgress;
  /** Semana del año actual (1-52). */
  weekOfYear: number;
}

function progressFor(quest: Quest, p: QuestProgress): number {
  const id = quest.id;
  if (id.includes('-3-sessions') || id === 'ho-w-3-sessions') return Math.min(quest.target, p.sessionsThisWeek);
  if (id.includes('-4-wods'))    return Math.min(quest.target, p.sessionsThisWeek);
  if (id.includes('-2-rx'))      return Math.min(quest.target, p.rxThisWeek);
  if (id.includes('-1-pr'))      return Math.min(quest.target, p.prsThisWeek);
  if (id.includes('-tonelaje'))  return Math.min(quest.target, p.tonelajeKg);
  if (id.includes('-no-skip'))   return p.skippedThisWeek === 0 ? quest.target : 0;
  if (id.includes('-mobility'))  return Math.min(quest.target, p.mobilityDays);
  if (id.includes('-sleep'))     return Math.min(quest.target, p.sleepDays);
  if (id.includes('-hrv'))       return Math.min(quest.target, p.hrvDays);
  if (id.includes('-water'))     return Math.min(quest.target, p.waterDays);
  if (id.includes('-foam'))      return Math.min(quest.target, p.foamDays);
  if (id.includes('-pre-check')) return Math.min(quest.target, p.preCheckCount);
  if (id.includes('-benchmark')) return p.benchmarkDone ? 1 : 0;
  if (id.includes('-team-wod'))  return p.teamWodDone ? 1 : 0;
  if (id.includes('-pr-skill'))  return p.skillPrDone ? 1 : 0;
  return 0;
}

const QuestsSection: React.FC<Props> = ({ product, progress, weekOfYear }) => {
  const quests = getActiveQuests(product, weekOfYear, 4);
  const monthly = getMonthlyQuest(product);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <p style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' }}>
          Quests · Semana {weekOfYear}
        </p>
        <span style={{ fontSize: 9, color: 'var(--text-secondary)' }}>
          {quests.length} activas
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {quests.map(q => {
          const value = progressFor(q, progress);
          const pct = q.target === 0 ? (value > 0 ? 1 : 0) : value / q.target;
          const done = pct >= 1;
          return (
            <div
              key={q.id}
              style={{
                background: done ? 'rgba(34,197,94,0.08)' : 'var(--surface)',
                border: `1px solid ${done ? 'rgba(34,197,94,0.3)' : 'var(--card-border)'}`,
                borderRadius: 14, padding: '12px 14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 22 }}>{q.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)' }}>{q.name}</p>
                  <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {q.description}
                  </p>
                </div>
                <span style={{
                  fontSize: 9, fontWeight: 900, color: done ? '#22C55E' : 'var(--primary)',
                  background: done ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.10)',
                  padding: '3px 8px', borderRadius: 8,
                  letterSpacing: '.04em',
                }}>+{q.xpReward} XP</span>
              </div>
              {/* Progress bar */}
              <div style={{
                height: 4, background: 'var(--bg)', borderRadius: 2,
                overflow: 'hidden', marginTop: 10,
              }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, pct * 100)}%`,
                  background: done ? '#22C55E' : 'var(--primary)',
                  transition: 'width .4s ease',
                }} />
              </div>
              <p style={{ fontSize: 9, color: 'var(--text-secondary)', marginTop: 4, textAlign: 'right' }}>
                {value} / {q.target} {q.unit}
              </p>
            </div>
          );
        })}
      </div>

      {monthly && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(168,85,247,0.10), rgba(59,130,246,0.05))',
          border: '1px solid rgba(168,85,247,0.25)',
          borderRadius: 14, padding: '12px 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22 }}>{monthly.icon}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 9, color: '#A855F7', fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase' }}>
                Quest mensual
              </p>
              <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)', marginTop: 2 }}>{monthly.name}</p>
              <p style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{monthly.description}</p>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 900, color: '#A855F7',
              background: 'rgba(168,85,247,0.15)',
              padding: '4px 10px', borderRadius: 8,
            }}>+{monthly.xpReward} XP</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestsSection;
