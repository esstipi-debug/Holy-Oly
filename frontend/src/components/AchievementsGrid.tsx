import React from 'react';
import { ACHIEVEMENTS_BY_PRODUCT, isUnlocked, type Achievement, type AthleteState } from '../data/achievements';
import type { Product } from '../data/levels';

/**
 * Grid de logros para mostrar en Profile.
 * Bloqueados se muestran en gris.
 */

interface Props {
  product: Product;
  state: AthleteState;
}

const DIFFICULTY_BORDER: Record<Achievement['difficulty'], string> = {
  bronze: '#92400E',
  silver: '#94A3B8',
  gold: '#F59E0B',
  platinum: '#A855F7',
};

const AchievementsGrid: React.FC<Props> = ({ product, state }) => {
  const list = ACHIEVEMENTS_BY_PRODUCT[product];
  const unlocked = list.filter(a => isUnlocked(a, state));

  // Ordenar: desbloqueados primero, luego por difficulty
  const sorted = [...list].sort((a, b) => {
    const ua = isUnlocked(a, state);
    const ub = isUnlocked(b, state);
    if (ua !== ub) return ua ? -1 : 1;
    const order: Achievement['difficulty'][] = ['platinum', 'gold', 'silver', 'bronze'];
    return order.indexOf(a.difficulty) - order.indexOf(b.difficulty);
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <p style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' }}>
          Logros · {unlocked.length}/{list.length}
        </p>
        <p style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 600 }}>
          {Math.round((unlocked.length / list.length) * 100)}% completado
        </p>
      </div>

      {/* Progress bar global */}
      <div style={{
        height: 4, background: 'var(--surface)', borderRadius: 2,
        overflow: 'hidden', marginBottom: 14,
      }}>
        <div style={{
          height: '100%',
          width: `${(unlocked.length / list.length) * 100}%`,
          background: 'linear-gradient(90deg, var(--primary), #F59E0B)',
          transition: 'width .5s ease',
        }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {sorted.map(a => {
          const ok = isUnlocked(a, state);
          return (
            <div
              key={a.id}
              title={`${a.name}: ${a.description}`}
              style={{
                aspectRatio: '1',
                background: ok ? 'var(--surface)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${ok ? DIFFICULTY_BORDER[a.difficulty] : 'var(--card-border)'}`,
                borderRadius: 12,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                position: 'relative',
                opacity: ok ? 1 : 0.4,
                filter: ok ? 'none' : 'grayscale(1)',
                cursor: 'help',
              }}
            >
              <span style={{ fontSize: 22 }}>{a.icon}</span>
              <span style={{
                fontSize: 7, fontWeight: 800, color: 'var(--text-secondary)',
                marginTop: 2, letterSpacing: '.04em', textTransform: 'uppercase',
                textAlign: 'center', lineHeight: 1.1, padding: '0 2px',
              }}>
                {a.name.length > 14 ? a.name.slice(0, 12) + '…' : a.name}
              </span>
              {ok && (
                <span style={{
                  position: 'absolute', top: 2, right: 4,
                  fontSize: 8, color: DIFFICULTY_BORDER[a.difficulty],
                  fontWeight: 900,
                }}>✓</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AchievementsGrid;
