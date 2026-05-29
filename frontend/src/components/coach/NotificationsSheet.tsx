import React, { useState } from 'react';
import BottomSheet from '../BottomSheet';
import { deriveInbox, itemState, setItemState, type InboxItem, type InboxState } from '../../data/coachInbox';
import type { AthleteProfile } from '../../data/athletes';

/**
 * NotificationsSheet · la bandeja del coach (spec §3.5 + revisión §3.4).
 * Items derivados del roster real; el coach revisa post-hoc: Revisar (entra al
 * atleta) · Confirmar · Revertir. El estado persiste en sessionStorage.
 */
interface Props {
  open: boolean;
  onClose: () => void;
  roster: AthleteProfile[];
  onOpenAthlete: (id: string) => void;
}

const SEV_COLOR = { alert: '#EF4444', watch: '#F59E0B' } as const;

const NotificationsSheet: React.FC<Props> = ({ open, onClose, roster, onOpenAthlete }) => {
  const [, force] = useState(0);
  const items = deriveInbox(roster);
  const act = (id: string, state: InboxState) => { setItemState(id, state); force(n => n + 1); };

  const visible = items.filter(it => itemState(it.id) !== 'seen');
  const pending = visible.filter(i => itemState(i.id) === 'pending').length;

  return (
    <BottomSheet open={open} onClose={onClose} title={`Bandeja · ${pending} pendiente${pending === 1 ? '' : 's'}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {visible.length === 0 && (
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', padding: 20 }}>Sin pendientes · roster al día.</p>
        )}
        {visible.map((it: InboxItem) => {
          const st = itemState(it.id);
          const c = SEV_COLOR[it.severity];
          return (
            <div key={it.id} style={{ padding: 12, borderRadius: 10, background: 'var(--surface)', border: `1px solid ${st === 'pending' ? `${c}55` : 'var(--card-border)'}`, opacity: st === 'pending' ? 1 : 0.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)' }}>{it.title}</p>
                {st !== 'pending' && (
                  <span style={{ fontSize: 9, color: c, fontWeight: 800, textTransform: 'uppercase' }}>
                    {st === 'confirmed' ? '✓ confirmado' : st === 'reverted' ? '↺ revertido' : ''}
                  </span>
                )}
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>{it.detail}</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button onClick={() => { onClose(); onOpenAthlete(it.athleteId); }} style={btn('var(--engine-stress)')}>Revisar →</button>
                <button onClick={() => act(it.id, 'confirmed')} style={btn('#22C55E')}>Confirmar</button>
                <button onClick={() => act(it.id, 'reverted')} style={btn('var(--text-secondary)')}>Revertir</button>
              </div>
            </div>
          );
        })}
      </div>
    </BottomSheet>
  );
};

function btn(color: string): React.CSSProperties {
  return { flex: 1, padding: '8px 0', borderRadius: 8, background: 'transparent', border: `1px solid ${color}55`, color, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit' };
}

export default NotificationsSheet;
