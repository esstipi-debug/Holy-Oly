/**
 * insight · motor de lectura automática (spec §2 principio 5: "insight sobre cada
 * número/gráfico"). Dado un valor + contexto devuelve una línea en lenguaje claro
 * coloreada por severidad. Lo consumen los gráficos del coach.
 */
export type Severity = 'ok' | 'watch' | 'alert';

export interface Insight {
  text: string;
  severity: Severity;
}

export const SEVERITY_COLOR: Record<Severity, string> = {
  ok: '#22C55E',
  watch: '#F59E0B',
  alert: '#EF4444',
};

/** IMR vs banda esperada de la fase. */
export function imrInsight(imr: number, lo: number, hi: number, phase: string): Insight {
  if (imr > hi) {
    const over = Math.round(imr - hi);
    return { severity: 'alert', text: `IMR ${imr}% vs esperado <${hi}% (${phase}) → sobrecarga ~${over}pts. Bajá volumen ~10%.` };
  }
  if (imr < lo) {
    const under = Math.round(lo - imr);
    return { severity: 'watch', text: `IMR ${imr}% vs esperado >${lo}% (${phase}) → subcarga ~${under}pts. Hay margen para exigir.` };
  }
  return { severity: 'ok', text: `IMR ${imr}% dentro de banda ${lo}-${hi}% (${phase}). En plan.` };
}

/** ACWR (agudo:crónico). Zona segura 0.8-1.3. */
export function acwrInsight(acwr: number): Insight {
  if (acwr > 1.3) return { severity: 'alert', text: `ACWR ${acwr.toFixed(2)} → zona de riesgo de lesión, considerá deload.` };
  if (acwr < 0.8) return { severity: 'watch', text: `ACWR ${acwr.toFixed(2)} → carga baja, hay margen para progresar.` };
  return { severity: 'ok', text: `ACWR ${acwr.toFixed(2)} en zona segura (0.8-1.3).` };
}

/** Readiness (0-10). */
export function readinessInsight(r: number): Insight {
  if (r < 4) return { severity: 'alert', text: `Readiness ${r.toFixed(1)} → crítico, priorizá recuperación.` };
  if (r < 6.5) return { severity: 'watch', text: `Readiness ${r.toFixed(1)} → monitoreá la carga de hoy.` };
  return { severity: 'ok', text: `Readiness ${r.toFixed(1)} → listo para entrenar.` };
}
