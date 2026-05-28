import React from 'react';
import { useNav } from '../context/NavigationContext';
import { useAthlete } from '../context/AthleteContext';
import '../styles/v2/pulse-hub.css';

/**
 * PulseHub · feed social en vivo del club (reto del día + actividad reciente).
 * Estilo V2 dark · scoped bajo `.plh-root` · acento rojo (--engine-pulse).
 * Se monta dentro de PhoneLayout. Lógica intacta: feed derivado de allAthletes.
 */

const ACTIONS = [
  'completó complejo Arrancada (3+1)',
  'alcanzó PR en Snatch (+2kg)',
  'inició sesión: Prep. Campeonato',
  'logró 12 días de racha',
  'pasó a Cinturón Púrpura',
];
const TIMES = ['2m', '15m', '1h', '3h', '5h'];
// Colores de avatar (hex · antes Tailwind bg-*-500)
const COLORS = ['#6366F1', '#EC4899', '#F59E0B', '#10B981', '#8B5CF6'];

const PulseHub: React.FC = () => {
  const { navigate } = useNav();
  const { athlete, allAthletes } = useAthlete();
  const others = allAthletes.filter(a => a.id !== athlete?.id).slice(0, 5);
  const feed = others.map((a, i) => ({
    user: `${a.name.split(' ')[0]} ${a.name.split(' ')[1]?.[0] ?? ''}.`,
    action: ACTIONS[i % ACTIONS.length],
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
                {[1, 2, 3, 4].map(x => <div key={x} className="av">U{x}</div>)}
                <div className="av more">+4</div>
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
