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
