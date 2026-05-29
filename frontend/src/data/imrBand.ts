/**
 * imrBand · banda de IMR esperado por fase (spec §5) + serie semanal del macro.
 *
 * El macro (macroDetail.weekly) ya da fase (meso 1-4) e IMR planificado por semana.
 * Acá mapeamos meso→banda esperada y derivamos un IMR "real" determinístico por
 * atleta (planificado ± desvío seedeado) para el gráfico "IMR vs banda" (spec §4.1①).
 */
import { getMacroDetail } from './macroDetail';
import { seeded } from './derive';

// meso 1-4 = GPP/básico · Fuerza · SPP/precompetitivo · Peaking (spec §5 mapa fase→banda)
const PHASE_BAND: Array<{ lo: number; hi: number; name: string }> = [
  { lo: 60, hi: 72, name: 'GPP / básico' },
  { lo: 70, hi: 80, name: 'Fuerza' },
  { lo: 78, hi: 88, name: 'SPP / precompetitivo' },
  { lo: 85, hi: 95, name: 'Peaking' },
];

export interface ImrWeek {
  week: number;
  planned: number;   // IMR planificado (macro)
  real: number;      // IMR real (determinístico por atleta)
  lo: number;        // banda baja de la fase
  hi: number;        // banda alta de la fase
  phase: string;
  current: boolean;
}

/** Serie semana-a-semana de IMR planificado/real + banda de fase para un atleta. */
export function imrBandSeries(athleteId: string, programId: string | null, currentWeek: number): ImrWeek[] {
  const macro = getMacroDetail(programId);
  const rand = seeded(`${athleteId}:imrband`);
  return macro.weekly.map(w => {
    const band = PHASE_BAND[Math.max(0, Math.min(3, w.meso - 1))];
    // real = planificado ± hasta ~6pts (desvío determinístico)
    const drift = Math.round((rand() - 0.45) * 12);
    const real = Math.max(40, Math.min(102, w.imr + drift));
    return { week: w.w, planned: w.imr, real, lo: band.lo, hi: band.hi, phase: band.name, current: w.w === currentWeek };
  });
}
