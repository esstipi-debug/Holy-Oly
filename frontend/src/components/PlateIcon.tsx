import React, { useId } from 'react';

/**
 * PlateIcon · iconos de discos HOLY OLY (handoff Claude Design · paquete "discos").
 * Port FIEL del prototipo `Holy Oly Plate Icons.html` (mismas fórmulas SVG → pixel-perfect).
 *
 * 24 variantes = 4 pesos × 2 vistas (¾ perspectiva / flat) × 3 tamaños (L/M/S).
 * Colores IWF · 10 verde · 15 amarillo · 20 azul · 25 rojo.
 * Tamaño S quita todo el texto de marca (solo el número), como pidió el Boss.
 *
 * Requiere fuentes Saira / Saira Condensed (cargadas en index.html).
 */

export type PlateWeight = 10 | 15 | 20 | 25;
export type PlateView = 'iso' | 'flat';
export type PlateSize = 'L' | 'M' | 'S';

const C = 130; // centro en el viewBox 260×260

interface PlateDef { w: string; color: string; edge: string; dark: string; light: string; }
const PLATES: Record<PlateWeight, PlateDef> = {
  10: { w: '10', color: '#3eb24a', edge: '#2c8a37', dark: '#1f6b29', light: '#7fd07f' },
  15: { w: '15', color: '#f3c200', edge: '#c79c00', dark: '#9a7800', light: '#ffe46b' },
  20: { w: '20', color: '#2f6fa8', edge: '#1d4f7e', dark: '#123857', light: '#6fa3cf' },
  25: { w: '25', color: '#d5232b', edge: '#a4161d', dark: '#760e14', light: '#ec6b6f' },
};
const SIZE_PX: Record<PlateSize, number> = { L: 170, M: 108, S: 58 };
type Detail = 'full' | 'mid' | 'min';
const SIZE_DETAIL: Record<PlateSize, Detail> = { L: 'full', M: 'mid', S: 'min' };

const FONT = "'Saira Condensed',sans-serif";
const ST_WORD = `font-family:${FONT};font-weight:700;font-size:23px;letter-spacing:.5px;fill:#fff;`;
const ST_NUM = `font-family:${FONT};font-weight:800;fill:#fff;dominant-baseline:central;`;
const ST_KG = `font-family:${FONT};font-weight:700;font-size:15px;letter-spacing:1px;fill:#fff;`;

function pt(deg: number, r: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
}
function arcTop(r: number): string {
  const [x1, y1] = pt(232, r);
  const [x2, y2] = pt(308, r);
  return `M${x1.toFixed(2)} ${y1.toFixed(2)} A${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

function gradients(p: PlateDef, uid: string): string {
  return `
    <radialGradient id="band${uid}" cx="42%" cy="35%" r="78%">
      <stop offset="0" stop-color="${p.light}"/>
      <stop offset="52%" stop-color="${p.color}"/>
      <stop offset="100%" stop-color="${p.edge}"/>
    </radialGradient>
    <linearGradient id="rim${uid}" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stop-color="${p.dark}"/>
      <stop offset="50%" stop-color="${p.edge}"/>
      <stop offset="100%" stop-color="${p.color}"/>
    </linearGradient>
    <radialGradient id="steel${uid}" cx="40%" cy="34%" r="82%">
      <stop offset="0" stop-color="#fdfefe"/>
      <stop offset="46%" stop-color="#dcdfe2"/>
      <stop offset="100%" stop-color="#a7abb0"/>
    </radialGradient>
    <radialGradient id="bore${uid}" cx="42%" cy="38%" r="78%">
      <stop offset="0" stop-color="#8e9298"/>
      <stop offset="100%" stop-color="#3a3c40"/>
    </radialGradient>`;
}

function faceContent(p: PlateDef, detail: Detail, uid: string): string {
  let s = '';
  s += `<circle cx="${C}" cy="${C}" r="104" fill="${p.edge}"/>`;
  s += `<circle cx="${C}" cy="${C}" r="100.5" fill="url(#band${uid})"/>`;
  s += `<circle cx="${C}" cy="${C}" r="100.5" fill="none" stroke="rgba(255,255,255,.10)" stroke-width="2"/>`;
  s += `<circle cx="${C}" cy="${C}" r="49" fill="none" stroke="rgba(0,0,0,.16)" stroke-width="2"/>`;
  s += `<circle cx="${C}" cy="${C}" r="46" fill="url(#steel${uid})" stroke="rgba(0,0,0,.14)" stroke-width="1"/>`;
  s += `<circle cx="${C}" cy="${C}" r="15" fill="url(#bore${uid})"/>`;
  s += `<circle cx="${C}" cy="${C}" r="15" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="1.4"/>`;

  if (detail !== 'min') {
    const pid = `holy${uid}`;
    s += `<path id="${pid}" d="${arcTop(77)}" fill="none"/>`;
    const word = `<text style="${ST_WORD}"><textPath href="#${pid}" startOffset="50%" text-anchor="middle">HOLY OLY</textPath></text>`;
    s += word;
    s += `<g transform="rotate(180 ${C} ${C})">${word}</g>`;
  }

  const numFs = detail === 'min' ? 40 : 42;
  const numR = detail === 'min' ? 74 : 75;
  const kg = detail === 'full' || detail === 'mid'
    ? `<text style="${ST_KG}" x="0" y="27" text-anchor="middle">KG</text>` : '';
  const lbl = `<g transform="translate(${C - numR} ${C})">`
    + `<text style="${ST_NUM}font-size:${numFs}px" x="0" y="0" text-anchor="middle">${p.w}</text>`
    + kg + `</g>`;
  s += lbl;
  s += `<g transform="rotate(180 ${C} ${C})">${lbl}</g>`;
  return s;
}

function plateSVG(p: PlateDef, view: PlateView, px: number, detail: Detail, uid: string): string {
  const defs = gradients(p, uid);
  const face = faceContent(p, detail, uid);
  let body: string;

  if (view === 'flat') {
    body = `<g>${face}</g>`;
  } else {
    // disco parado, girado hacia la cámara desde la IZQUIERDA (eje vertical):
    // la cara se escorza horizontal y el canto de caucho redondeado muestra a la izquierda.
    const sx = 0.80, sy = 0.97, R = -6;
    const T = `translate(${C} ${C}) rotate(${R}) scale(${sx} ${sy}) translate(${-C} ${-C})`;
    const ox = -22, oy = 5;
    const edge =
        `<g transform="translate(${ox} ${oy})"><g transform="${T}">`
      + `<circle cx="${C}" cy="${C}" r="104" fill="url(#rim${uid})"/>`
      + `</g></g>`
      + `<g transform="translate(${ox - 1} ${oy})"><g transform="${T}">`
      + `<circle cx="${C}" cy="${C}" r="104" fill="none" stroke="rgba(255,255,255,.16)" stroke-width="2"/>`
      + `</g></g>`;
    body = `${edge}<g transform="${T}">`
      + `<circle cx="${C}" cy="${C}" r="104" fill="none" stroke="rgba(0,0,0,.22)" stroke-width="1.5"/>`
      + face + `</g>`;
  }

  return `<svg width="${px}" height="${px}" viewBox="0 0 260 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="HOLY OLY ${p.w} KG ${view}">`
    + `<defs>${defs}</defs>${body}</svg>`;
}

export interface PlateIconProps {
  weight: PlateWeight;
  view?: PlateView;
  size?: PlateSize;
  className?: string;
  style?: React.CSSProperties;
}

const PlateIcon: React.FC<PlateIconProps> = ({ weight, view = 'iso', size = 'M', className, style }) => {
  const uid = 'p' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const p = PLATES[weight];
  const html = plateSVG(p, view, SIZE_PX[size], SIZE_DETAIL[size], uid);
  return (
    <span
      className={className}
      style={{ display: 'inline-block', lineHeight: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default PlateIcon;
