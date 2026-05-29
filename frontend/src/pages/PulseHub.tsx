import React from 'react';
import { useNav } from '../context/NavigationContext';
import { useAthlete } from '../context/AthleteContext';
import type { AthleteProfile } from '../data/athletes';
import '../styles/v2/pulse-hub.css';

/**
 * PulseHub · feed social en vivo del club (reto del día + actividad reciente).
 * Estilo V2 dark · scoped bajo `.plh-root` · acento rojo (--engine-pulse).
 * Se monta dentro de PhoneLayout. Lógica intacta: feed derivado de allAthletes.
 */

const TIMES = ['2m', '15m', '1h', '3h', '5h'];
// Colores de avatar (hex · antes Tailwind bg-*-500)
const COLORS = ['#6366F1', '#EC4899', '#F59E0B', '#10B981', '#8B5CF6'];

const initialsOf = (name: string) => name.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase();

// Acción del feed derivada de señales REALES del atleta (última sesión con nota /
// racha de completadas / sesión más pesada / semana de su macro). No inventa.
function feedAction(a: AthleteProfile): string {
  const done = a.sessions_last_7.filter(s => s.completed);
  const lastDone = [...a.sessions_last_7].reverse().find(s => s.completed);
  if (lastDone?.notes) return `registró · ${lastDone.notes}`;
  if (done.length >= 4) return `racha de ${done.length} sesiones · ${a.macrocycle.focus}`;
  const heaviest = done.reduce<typeof done[number] | undefined>((m, s) => (s.load > (m?.load ?? 0) ? s : m), undefined);
  if (heaviest?.load) return `sesión pesada · ${(heaviest.load / 1000).toFixed(1)}k de carga`;
  return `Sem ${a.macrocycle.week} · ${a.macrocycle.program_name}`;
}

const PulseHub: React.FC = () => {
  const { navigate } = useNav();
  const { athlete, allAthletes } = useAthlete();
  const others = allAthletes.filter(a => a.id !== athlete?.id).slice(0, 5);
  const feed = others.map((a, i) => ({
    user: `${a.name.split(' ')[0]} ${a.name.split(' ')[1]?.[0] ?? ''}.`,
    action: feedAction(a),
    time: TIMES[i % TIMES.length],
    color: COLORS[i % COLORS.length],
  }));

  return (
    <div className="plh-root">
      <div className="plh-scroll">
        <header className="plh-head">
          <div>
            <h1 className="plh-title">Pulse Hub</h1>
            <span className="plh-online"><span className="live-dot" />{others.length} atletas online</span>
          </div>
          <div className="plh-radar">📡</div>
        </header>

        {/* Live challenge */}
        <section>
          <h3 className="plh-sec-label">Retos del club · Halterofilia</h3>
          <div className="plh-challenge">
            <div className="plh-ch-head">
              <div style={{ minWidth: 0 }}>
                <h4 className="plh-ch-name">Max Snatch del día</h4>
                <p className="plh-ch-window">Ventana: 12:00 PM – 18:00</p>
              </div>
              <div className="plh-ch-timer">
                <p className="plh-ch-count">14:25</p>
                <p className="plh-ch-count-label">para cierre</p>
              </div>
            </div>
            <div className="plh-ch-body">
              <div className="plh-avatars">
                {others.slice(0, 4).map((a, x) => <div key={x} className="av">{initialsOf(a.name)}</div>)}
                {others.length > 4 && <div className="av more">+{others.length - 4}</div>}
              </div>
              <button className="plh-join btn-press" onClick={() => navigate('SESSION')}>Unirse al pulse</button>
            </div>
          </div>
        </section>

        {/* Activity feed */}
        <section>
          <h3 className="plh-sec-label">Actividad reciente</h3>
          <div className="plh-feed">
            {feed.map((post, i) => (
              <div key={i} className="plh-post">
                <div className="plh-post-av" style={{ '--av': post.color } as React.CSSProperties}>
                  {post.user[0]}
                </div>
                <div className="plh-post-body">
                  <p className="plh-post-text">
                    {post.user} <span className="act">{post.action}</span>
                  </p>
                  <p className="plh-post-time">{post.time} ago</p>
                </div>
                <span className="plh-post-clap">👏</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default PulseHub;
