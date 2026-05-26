import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAthlete } from '../context/AthleteContext';
import { useNav } from '../context/NavigationContext';
import { buildCelebrationCatalog } from '../data/celebrations';
import MinimalistCard from '../components/social/MinimalistCard';
import StadiumCard from '../components/social/StadiumCard';
import StatSheetCard from '../components/social/StatSheetCard';

/**
 * Social Card — pantalla full-screen optimizada para screenshot.
 *
 * Diseño viral: el atleta toma screenshot y lo comparte en sus redes.
 * El screenshot ES el share — por eso no hay botones share/save sobre la card.
 *
 * Esta iteración (Fase 3.5):
 * - Catálogo de "logros celebrables" (PR, racha, tier-up, benchmark, etc).
 * - 3 estilos visuales rotativos: Minimalist · Stadium · Stat Sheet.
 * - Selector arriba (◀ Estilo ▶ + ◀ Logro ▶) con persistencia en localStorage.
 *
 * Pendiente próxima iteración:
 * - 2 estilos más (Trophy, Progress before/after)
 * - Tracking de screenshots (visibilitychange + dwell time)
 * - A/B testing (random consistente por usuario)
 * - Auto-trigger desde Victory screen / PR log
 */

type VariantId = 'minimalist' | 'stadium' | 'statsheet';

const VARIANTS: Array<{ id: VariantId; label: string }> = [
  { id: 'minimalist', label: 'Minimalist' },
  { id: 'stadium', label: 'Stadium' },
  { id: 'statsheet', label: 'Stat Sheet' },
];

const STORAGE_VARIANT = 'social:preferred_variant';
const STORAGE_CELEBRATION = 'social:preferred_celebration';
const STORAGE_HIDDEN = 'social:hidden_celebrations';

function loadHidden(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_HIDDEN);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

function saveHidden(set: Set<string>) {
  localStorage.setItem(STORAGE_HIDDEN, JSON.stringify([...set]));
}

const SocialCard: React.FC = () => {
  const { athlete } = useAthlete();
  const { navigate } = useNav();
  const fullCatalog = useMemo(() => buildCelebrationCatalog(athlete), [athlete]);

  const [hidden, setHidden] = useState<Set<string>>(() => loadHidden());

  // Catálogo visible = todo lo NO oculto. Si todo está oculto, mostramos el primero igual.
  const catalog = useMemo(() => {
    const visible = fullCatalog.filter(c => !hidden.has(c.id));
    return visible.length > 0 ? visible : fullCatalog;
  }, [fullCatalog, hidden]);

  const [variantIdx, setVariantIdx] = useState(0);
  const [celebrationIdx, setCelebrationIdx] = useState(0);

  // Cargar preferencias del usuario
  useEffect(() => {
    const v = localStorage.getItem(STORAGE_VARIANT);
    if (v) {
      const idx = VARIANTS.findIndex(x => x.id === v);
      if (idx >= 0) setVariantIdx(idx);
    }
    const c = localStorage.getItem(STORAGE_CELEBRATION);
    if (c) {
      const idx = catalog.findIndex(x => x.id === c);
      if (idx >= 0) setCelebrationIdx(idx);
    }
  }, [catalog]);

  // Persistir
  useEffect(() => {
    localStorage.setItem(STORAGE_VARIANT, VARIANTS[variantIdx].id);
  }, [variantIdx]);
  useEffect(() => {
    if (catalog[celebrationIdx]) {
      localStorage.setItem(STORAGE_CELEBRATION, catalog[celebrationIdx].id);
    }
  }, [celebrationIdx, catalog]);

  const cycle = (delta: number, len: number, idx: number) => (idx + delta + len) % len;

  const name = athlete?.name.toUpperCase() ?? 'ATLETA';
  const club = athlete?.club.toUpperCase() ?? 'HOLY OLY CLUB';
  const celebration = catalog[celebrationIdx] ?? catalog[0];
  const variant = VARIANTS[variantIdx];

  // Ref por si en el futuro se quiere reactivar export PNG vía useShareCard.
  // Por ahora el atleta toma screenshot nativo del dispositivo (más rápido + sin botón que estorbe).
  const cardRef = useRef<HTMLDivElement | null>(null);

  const hideCurrent = () => {
    const next = new Set(hidden); next.add(celebration.id); saveHidden(next); setHidden(next);
    // Saltamos al siguiente disponible: si era el último, ajustamos el índice
    setCelebrationIdx(i => Math.min(i, Math.max(0, catalog.length - 2)));
  };

  const restoreAll = () => {
    saveHidden(new Set()); setHidden(new Set());
  };

  return (
    <div className="flex flex-col h-full bg-holy-bg">
      {/* Galería link · chip discreto arriba */}
      <div className="px-4 pt-2 flex justify-end z-20 shrink-0">
        <button
          onClick={() => navigate('SOCIAL_GALLERY')}
          className="text-[10px] font-black uppercase tracking-wider text-holy-text-secondary hover:text-holy-primary active:scale-95 transition bg-white/[0.04] border border-white/10 rounded-full px-3 py-1"
        >
          Ver galería completa →
        </button>
      </div>

      {/* Selector chips — fuera del área de screenshot */}
      <div className="px-4 pt-3 pb-1 flex gap-2 bg-holy-bg/95 backdrop-blur z-20 shrink-0">
        <Pager
          label="Estilo"
          value={variant.label}
          onPrev={() => setVariantIdx(i => cycle(-1, VARIANTS.length, i))}
          onNext={() => setVariantIdx(i => cycle(+1, VARIANTS.length, i))}
        />
        <Pager
          label="Logro"
          value={celebration.title}
          onPrev={() => setCelebrationIdx(i => cycle(-1, catalog.length, i))}
          onNext={() => setCelebrationIdx(i => cycle(+1, catalog.length, i))}
        />
      </div>

      {/* Hide / Restore row · acción discreta */}
      <div className="px-4 pb-2 flex items-center justify-between text-[10px] z-20 shrink-0">
        <button
          onClick={hideCurrent}
          className="text-holy-text-secondary hover:text-red-300 font-bold tracking-wider uppercase active:scale-95 transition"
          aria-label="Ocultar este logro"
        >
          ✕ Ocultar este logro
        </button>
        {hidden.size > 0 && (
          <button
            onClick={restoreAll}
            className="text-holy-text-secondary hover:text-holy-primary font-bold tracking-wider uppercase active:scale-95 transition"
          >
            ↺ Restaurar ({hidden.size})
          </button>
        )}
      </div>

      {/* Área shareable · CERO overlays para screenshot limpio del atleta */}
      <div ref={cardRef} className="flex-1 flex flex-col">
        {variant.id === 'minimalist' && (
          <MinimalistCard celebration={celebration} athleteName={name} club={club} />
        )}
        {variant.id === 'stadium' && (
          <StadiumCard celebration={celebration} athleteName={name} club={club} />
        )}
        {variant.id === 'statsheet' && (
          <StatSheetCard celebration={celebration} athleteName={name} club={club} />
        )}
      </div>
    </div>
  );
};

interface PagerProps {
  label: string;
  value: string;
  onPrev: () => void;
  onNext: () => void;
}

const Pager: React.FC<PagerProps> = ({ label, value, onPrev, onNext }) => (
  <div className="flex-1 flex items-center justify-between bg-white/[0.04] border border-white/10 rounded-full px-2 py-1.5">
    <button
      onClick={onPrev}
      className="w-7 h-7 flex items-center justify-center text-holy-text-secondary hover:text-holy-text text-sm rounded-full active:scale-90 transition"
      aria-label={`${label} anterior`}
    >
      ◀
    </button>
    <div className="text-center leading-none">
      <p className="text-holy-text-secondary text-[8px] font-black uppercase tracking-widest">{label}</p>
      <p className="text-holy-text text-[11px] font-black uppercase tracking-tight mt-0.5">{value}</p>
    </div>
    <button
      onClick={onNext}
      className="w-7 h-7 flex items-center justify-center text-holy-text-secondary hover:text-holy-text text-sm rounded-full active:scale-90 transition"
      aria-label={`${label} siguiente`}
    >
      ▶
    </button>
  </div>
);

export default SocialCard;
