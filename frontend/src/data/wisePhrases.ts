// Banco de frases virales WISE — usadas en fallback Lite o como inspiración del LLM.
// Tokens disponibles: {name}, {streak}, {pr}, {pr_weight}, {belt}, {hrv}, {sport}

export type PhraseContext =
  | 'pr'
  | 'streak'
  | 'hrv_low'
  | 'hrv_high'
  | 'belt'
  | 'vform_red'
  | 'vform_yellow'
  | 'vform_green'
  | 'tired'
  | 'first_session'
  | 'default';

export const WISE_PHRASES: Record<PhraseContext, string[]> = {
  pr: [
    'El hierro no miente. Hoy dijiste la verdad.',
    '{pr_weight}. Eso ya es tuyo para siempre.',
    '{name}, ese PR no te lo regalaron. Te lo ganaste kilo a kilo.',
    'La barra subió porque vos también.',
  ],
  streak: [
    '{streak} días atrás no podías. Hoy no podés parar.',
    'Racha viva, {name}. Eso ya no se compra.',
    '{streak} sesiones. La constancia es el atajo más largo.',
    'Lo difícil ya no es entrenar. Es parar.',
  ],
  hrv_low: [
    'Hoy gana el cuerpo. Mañana ganamos los dos.',
    'El descanso también es entrenamiento. Y hoy te toca.',
    'HRV abajo no es debilidad, es información. Bajá la carga.',
    'Hasta el campeón frena cuando el sistema lo pide.',
  ],
  hrv_high: [
    'Cuerpo verde, barra arriba. Hoy se puede.',
    'Sistema listo. La barra está esperando.',
    '{name}, hoy es de los días que te tenés que acordar.',
  ],
  belt: [
    'Cinturón nuevo. Mismo {name}, versión mejorada.',
    '{belt}. Eso pesa más que la medalla.',
    'Subiste de nivel. Ahora el nivel sube contigo.',
  ],
  vform_red: [
    'Rojo es pará. Mañana volvemos.',
    'Cuando el semáforo es rojo, hasta el campeón frena.',
    'Hoy el héroe es el que descansa.',
  ],
  vform_yellow: [
    'Amarillo no es rojo. Pero tampoco es verde.',
    'Amarillo: 80% técnica, 0% ego.',
    'Avanzá, pero sin meter quinta.',
  ],
  vform_green: [
    'Verde para vos, verde para la barra.',
    'Día verde, {name}. Ese es el plan.',
  ],
  tired: [
    'Cansado no es excusa. Es información. Hoy bajá un punto.',
    'El gym también se gana durmiendo.',
  ],
  first_session: [
    'Bienvenido al hierro, {name}. Lo demás es repetir.',
    'Día uno. Ya sos atleta.',
  ],
  default: [
    'Una sesión más, {name}. Esa es la diferencia.',
    'Lo que hagas hoy lo vas a tener mañana.',
    'Holy Oly. Que no se note la diferencia con el campeón.',
  ],
};

export interface PhraseVars {
  name?: string;
  streak?: number;
  pr?: string;
  pr_weight?: string;
  belt?: string;
  hrv?: number;
  sport?: string;
}

export function renderPhrase(template: string, vars: PhraseVars): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const v = (vars as Record<string, unknown>)[key];
    return v != null ? String(v) : '';
  });
}

export function pickPhrase(ctx: PhraseContext, vars: PhraseVars = {}): string {
  const bank = WISE_PHRASES[ctx] ?? WISE_PHRASES.default;
  const tpl = bank[Math.floor(Math.random() * bank.length)];
  return renderPhrase(tpl, { name: 'Atleta', ...vars });
}
