import React from 'react';
import { useNav } from '../context/NavigationContext';
import { PlateBadge, type PlateTier } from '../components/PlateBadge';
import '../styles/v2/session-summary.css';

const SessionSummaryPreview: React.FC = () => {
  const { navigate } = useNav();
  const workout = {
    title: 'Snatch Day: Speed Focus',
    tags: ['Olympic', 'Technical', 'High Speed'],
    blocks: [
      { id: 'A', name: 'Snatch Balance', details: '3x3 @ 75%', tier: 'yellow' as PlateTier },
      { id: 'B', name: 'Power Snatch', details: '5x2 @ 80%', tier: 'blue' as PlateTier },
      { id: 'C', name: 'Snatch Drills', details: 'Accessory', tier: 'green' as PlateTier },
    ]
  };

  // Color del tier del disco · alimenta la barra de acento lateral y el target.
  const TIER_COLOR: Record<PlateTier, string> = {
    white: '#F5F5F7', green: '#22C55E', yellow: '#FBBF24', blue: '#3B82F6', red: '#EF4444',
  };

  return (
    <div className="ssp-root">
      <div className="ssp-scroll">
        {/* Header */}
        <header className="ssp-header">
          <span className="ssp-status">
            <span className="dot" />
            Sesión Programada
          </span>
          <h1 className="ssp-title">{workout.title}</h1>
          <div className="ssp-tags">
            {workout.tags.map(t => <span key={t} className="ssp-tag">#{t}</span>)}
          </div>
        </header>

        {/* Coach Voice Section */}
        <div className="ssp-card ssp-coach">
          <div className="ssp-coach-head">
            <div className="ssp-coach-avatar">👨‍🏫</div>
            <div>
              <p className="ssp-coach-name">Coach B.</p>
              <p className="ssp-coach-role">Instrucción Técnica</p>
            </div>
          </div>
          <p className="ssp-coach-quote">
            "Hoy no buscamos kilos máximos. Buscamos <span className="accent">violencia</span> en la extensión. Si la barra no suena al caer, estás yendo lento."
          </p>
        </div>

        {/* Block List */}
        <div>
          <h3 className="ssp-section-head">Estructura del MDW</h3>
          <div className="ssp-blocks">
            {workout.blocks.map(block => (
              <div
                key={block.id}
                className="ssp-card ssp-block"
                style={{ ['--block-c' as string]: TIER_COLOR[block.tier] }}
              >
                {/* Disco halterofilia · tier marca la carga del bloque */}
                <span className="ssp-block-disc" aria-hidden="true">
                  <PlateBadge tier={block.tier} size={44} />
                </span>
                <div className="ssp-block-main">
                  <p className="ssp-block-tag">Bloque {block.id}</p>
                  <p className="ssp-block-name">{block.name}</p>
                </div>
                <div className="ssp-block-target">
                  <p className="ssp-block-detail">{block.details}</p>
                  <p className="ssp-block-label">Target</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Requirements */}
        <div className="ssp-reqs">
          <div className="ssp-card ssp-req">
            <p className="ssp-req-icon">⏱️</p>
            <p className="ssp-req-value">90 min</p>
            <p className="ssp-req-label">Duración Est.</p>
          </div>
          <div className="ssp-card ssp-req">
            <p className="ssp-req-icon">🔥</p>
            <p className="ssp-req-value">750 kCal</p>
            <p className="ssp-req-label">Esfuerzo Est.</p>
          </div>
        </div>
      </div>

      {/* Footer CTA sticky con backdrop · 76px se reserva para la bottom nav del PhoneLayout */}
      <footer className="ssp-footer">
        <button className="ssp-cta" onClick={() => navigate('WARMUP')}>
          <span>Empezar Calentamiento</span>
        </button>
      </footer>
    </div>
  );
};

export default SessionSummaryPreview;
