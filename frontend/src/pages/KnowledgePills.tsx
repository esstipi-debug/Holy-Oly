import React, { useState } from 'react';
import { useNav } from '../context/NavigationContext';
import '../styles/v2/knowledge-pills.css';

/**
 * KnowledgePills · reader inmersivo tipo "stories" de píldoras técnicas (+XP).
 * Estilo V2 dark · scoped bajo `.kp-root` · acento violeta (--engine-adapt).
 * Backdrop con tokens (sin imagen externa). Lógica intacta: idx + tap zones.
 */

interface Pill {
  title: string;
  body: string;
  xp: number;
}

const PILLS: Pill[] = [
  {
    title: 'El "hook grip" y la estabilidad del codo',
    body: 'El agarre de gancho no solo asegura la barra; activa la cadena cinética del brazo para evitar el "arm-bend" prematuro en el segundo tirón.',
    xp: 50,
  },
  {
    title: 'Triple extensión: timing es todo',
    body: 'Caderas, rodillas y tobillos extienden en secuencia rápida. Si la cadera abre antes que la rodilla termine, perdés potencia vertical.',
    xp: 50,
  },
  {
    title: 'La posición overhead',
    body: 'Bloqueo activo con escápulas elevadas y cabeza neutra. Si te falta movilidad torácica, ningún snatch va a ser estable.',
    xp: 50,
  },
  {
    title: 'El primer tirón es paciente',
    body: 'Del piso a la rodilla la barra sube despacio y constante, hombros por delante de la barra. Apurar el primer tirón arruina la posición para el segundo.',
    xp: 50,
  },
  {
    title: 'Barra pegada al cuerpo',
    body: 'En tirones y cargadas la barra roza muslo y cadera. Cuanto más cerca de tu centro de masa, menos brazo de palanca y más eficiente el levantamiento.',
    xp: 60,
  },
  {
    title: 'El "dip & drive" del envión',
    body: 'El dip es corto, vertical y con el torso erguido. Si las rodillas se van adelante o el pecho cae, la barra sale del eje y el jerk se va al frente.',
    xp: 60,
  },
  {
    title: 'Recepción agresiva, no pasiva',
    body: 'No esperás a que la barra baje: te metés activamente debajo. La velocidad para meterte (turnover) define cuánto podés levantar, no solo tu fuerza.',
    xp: 60,
  },
  {
    title: 'Qué es la IMR y por qué importa',
    body: 'Intensidad Media Relativa = peso medio levantado ÷ tu 1RM. Es la brújula de la periodización: la misma IMR significa cosas distintas según la fase del macrociclo.',
    xp: 70,
  },
  {
    title: 'El deload no es debilidad',
    body: 'Bajar carga ~40% cada 3-4 semanas deja que la fatiga caiga y la forma suba. Los PRs aparecen DESPUÉS de la descarga, no durante la acumulación.',
    xp: 70,
  },
  {
    title: 'Dormís para levantar',
    body: 'El SNC se recupera con sueño. Menos de 7h baja readiness y velocidad de barra al día siguiente: el mejor accesorio de fuerza es la almohada.',
    xp: 70,
  },
];

const KnowledgePills: React.FC = () => {
  const { navigate } = useNav();
  const [idx, setIdx] = useState(0);
  const pill = PILLS[idx];
  const isLast = idx === PILLS.length - 1;

  const next = () => {
    if (isLast) navigate('HOME');
    else setIdx(idx + 1);
  };

  return (
    <div className="kp-root">
      <div className="kp-backdrop" />

      {/* Progress bars */}
      <div className="kp-progress">
        {PILLS.map((_, i) => (
          <div key={i} className="kp-bar" data-state={i < idx ? 'done' : i === idx ? 'active' : 'pending'}>
            <div className="kp-bar-fill" />
          </div>
        ))}
      </div>

      {/* Tap zones */}
      <button
        onClick={() => idx > 0 && setIdx(idx - 1)}
        className="kp-tap kp-tap-left"
        aria-label="Anterior"
      />
      <button
        onClick={next}
        className="kp-tap kp-tap-right"
        aria-label="Siguiente"
      />

      {/* Content */}
      <div className="kp-content">
        <span className="kp-pill-badge">Píldora {idx + 1}/{PILLS.length}</span>
        <h1 className="kp-title">{pill.title}</h1>
        <p className="kp-body">{pill.body}</p>

        <div className="kp-reward">
          <div className="kp-reward-xp">+{pill.xp}</div>
          <div>
            <p className="kp-reward-title">Recompensa de lectura</p>
            <p className="kp-reward-sub">XP acreditada al finalizar</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="kp-footer">
        <button className="kp-next btn-press" onClick={next}>
          {isLast ? 'Finalizar · reclamar XP →' : 'Siguiente tip →'}
        </button>
        <button className="kp-close" onClick={() => navigate('HOME')}>
          Cerrar píldora
        </button>
      </footer>
    </div>
  );
};

export default KnowledgePills;
