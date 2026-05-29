import React from 'react';
import { useNav } from '../context/NavigationContext';
import { useAthlete } from '../context/AthleteContext';
import { getWeekPlan } from '../data/macroDetail';
import '../styles/v2/session-schedule.css';

/**
 * SessionSchedule · planificación semanal del macrociclo del atleta.
 * Estilo V2 dark "Macrociclos" · scoped bajo `.ssch-root` · acento ámbar.
 * Se monta dentro de PhoneLayout (chrome + bottom nav). Lógica intacta:
 * cálculo de semana (lunes→domingo), status por día y filtro de próximas.
 */

const DAY_LABELS = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
const MONTH_LABELS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
// Horarios por día (Lun→Dom). Las sesiones se derivan del macro del atleta (getWeekPlan);
// el día de descanso se marca como '—' según el plan, no por índice fijo.
const WEEKDAY_TIMES = ['09:00 AM', '10:00 AM', '09:30 AM', '10:00 AM', '18:00 PM', '10:00 AM', '11:00 AM'];

const SessionSchedule: React.FC = () => {
  const { navigate } = useNav();
  const { athlete } = useAthlete();
  const macroLabel = athlete?.macrocycle.program_name ?? 'Sin macrociclo asignado';
  const macroWeek = athlete?.macrocycle.week ?? 1;
  const plan = getWeekPlan(athlete?.macrocycle.program_id ?? null);
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dow + 6) % 7));
  const days = plan.map((p, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const isPast = d.toDateString() !== today.toDateString() && d < today;
    const isToday = d.toDateString() === today.toDateString();
    return {
      day: DAY_LABELS[d.getDay()],
      date: d.getDate(),
      month: MONTH_LABELS[d.getMonth()],
      status: isToday ? 'ACTIVE' : isPast ? 'DONE' : 'PENDING',
      label: p.name,
      rest: p.rest,
      time: p.rest ? '—' : WEEKDAY_TIMES[i],
    };
  });
  const upcoming = days.filter(d => d.status === 'PENDING' || d.status === 'ACTIVE');

  return (
    <div className="ssch-root">
      <div className="ssch-scroll">
        <header className="ssch-head">
          <h1 className="ssch-title">Planificación</h1>
          <p className="ssch-eyebrow"><span className="pip" />Semana {macroWeek} · {macroLabel}</p>
        </header>

        {/* Calendar strip */}
        <div className="ssch-week">
          {days.map((d, i) => (
            <div key={i} className="ssch-daycell" data-status={d.status}>
              <p className="ssch-dow">{d.day}</p>
              <div className="ssch-daynum">{d.date}</div>
              {d.status === 'ACTIVE' && <span className="ssch-dot" />}
            </div>
          ))}
        </div>

        {/* Detailed list */}
        <h3 className="ssch-sec-label">Próximas sesiones</h3>
        <div className="ssch-list">
          {upcoming.map((d, i) => (
            <button
              key={i}
              className="ssch-session btn-press"
              data-active={d.status === 'ACTIVE'}
              data-rest={d.rest}
              onClick={() => navigate('WARMUP')}
            >
              <div className="ssch-session-main">
                <p className="ssch-session-title">{d.label}</p>
                <p className="ssch-session-meta">{d.day} {d.date} {d.month} · {d.time}</p>
              </div>
              {d.rest ? (
                <span className="ssch-rest-emoji">💤</span>
              ) : (
                <span className="ssch-log">Log</span>
              )}
            </button>
          ))}
        </div>

        <button className="ssch-cta btn-press" onClick={() => navigate('PROFILE')}>
          Solicitar reprogramación
        </button>
      </div>
    </div>
  );
};

export default SessionSchedule;
