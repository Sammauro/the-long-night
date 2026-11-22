// Parti comuni dei mockup B1.3a: token, icone, dati della stanza 1 (seed 7), geometria esagonale.
// Dati presi dal motore: createRun({seed:7, start:'r1'}), E.ai.preview e E.dice.selectionPlan (vedi DIREZIONE.md §Dati).
'use strict';

const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
  '<link href="https://fonts.googleapis.com/css2?family=Alegreya+Sans:wght@400;500;700;800&family=IM+Fell+English:ital@0;1&display=swap" rel="stylesheet">';

// Palette CLAUDE.md §7 + estensioni motivate in DIREZIONE.md
const TOKENS = `
:root{
  --notte:#151519; --scheda:#16141c; --pietra:#1c1a24; --filo:#2e2a3e;
  --osso:#e8e0d0; --cenere:#9a90a8; --oro:#c9a84c; --sangue:#b84040; --scudo:#4a8fbd;
  /* estensioni */
  --sangue-vivo:#e2705f;   /* rosso per testo piccolo su fondo scuro (contrasto >= 4.5) */
  --oro-cupo:#7d6526;      /* oro ossidato: bordi, filo del rosario */
  --carta:#cdbd97;         /* carta consunta delle carte in mano */
  --carta-scura:#b3a27b;   /* matrice dell'Eco */
  --inchiostro:#2a2017;    /* inchiostro su carta */
  --vigore:#e8e0d0; --fuoco:#e58a45; --terrore:#a68ae0;
  --f-titolo:'IM Fell English', 'Lora', Georgia, serif;
  --f-testo:'Alegreya Sans', 'Inter', system-ui, sans-serif;
}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#0c0b0e}
body{font-family:var(--f-testo);font-variant-numeric:lining-nums tabular-nums;color:var(--osso);-webkit-font-smoothing:antialiased}
.palco{position:relative;width:844px;height:390px;overflow:hidden;background:var(--notte);margin:0 auto}
.num{font-family:var(--f-testo)}
*{font-variant-numeric:lining-nums!important}
.ico{display:inline-block;width:1em;height:1em;vertical-align:-0.14em;fill:currentColor}
`;

// Icone a inchiostro (niente emoji: rese uguali su ogni telefono)
const ICONS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<symbol id="i-forza" viewBox="0 0 24 24"><rect x="5" y="4.5" width="3.6" height="8" rx="1.8"/><rect x="9.1" y="3.5" width="3.6" height="9" rx="1.8"/><rect x="13.2" y="4" width="3.6" height="8.5" rx="1.8"/><rect x="17.3" y="5.5" width="3.4" height="7.5" rx="1.7"/><path d="M4.6 11.5h16.2v3.2c0 4.1-3 6.8-7 6.8h-1.6c-4.3 0-7.6-2.9-7.6-6.6z"/><path d="M3.2 11.2c0-1.1.9-1.7 1.9-1.6l6.6.9c1.1.2 1.6 1 1.5 2l-.2 1.1c-.2.9-1 1.4-1.9 1.3L5 14.1c-1.1-.2-1.8-1.2-1.8-2.3z" fill-opacity=".72"/></symbol>
<symbol id="i-fuoco" viewBox="0 0 24 24"><path d="M12.6 2c.6 3.4 5.9 5.6 5.9 11.4A6.5 6.5 0 0 1 5.5 14c0-3 1.7-4.9 3-6.6.2 2.4 1.2 3.6 2.4 4 .5-3.5-.2-6.6 1.7-9.4z"/><path d="M12 21c-1.9 0-3.2-1.3-3.2-3.1 0-1.7 1.2-2.6 2.1-3.8.2 1.4.9 2 1.6 2.2.4-1 .3-1.9.9-2.8 1 1.3 1.9 2.6 1.9 4 0 2.1-1.4 3.5-3.3 3.5z" fill="#000" fill-opacity=".35"/></symbol>
<symbol id="i-presagio" viewBox="0 0 24 24"><path d="M1.5 12C4.3 7 8 4.8 12 4.8S19.7 7 22.5 12c-2.8 5-6.5 7.2-10.5 7.2S4.3 17 1.5 12z"/><circle cx="12" cy="12" r="4.4" fill="#000" fill-opacity=".55"/><circle cx="12" cy="12" r="1.9"/></symbol>
<symbol id="i-artigli" viewBox="0 0 24 24"><path d="M5 3.5c3.2 4.6 4.3 10 3.2 17l-1.5.2C7.3 14 6.6 8.6 5 3.5zM11.2 2.5c3 5 3.8 11.2 2.4 18.6l-1.6.1c.9-7.2.6-13.3-.8-18.7zM17.3 4c2.6 4.5 3.1 9.8 1.6 15.8l-1.5 0c1-5.7.8-10.9-.1-15.8z"/></symbol>
<symbol id="i-scudo" viewBox="0 0 24 24"><path d="M12 2.2l8.2 3v6.1c0 5.2-3.4 9-8.2 10.6-4.8-1.6-8.2-5.4-8.2-10.6V5.2z"/></symbol>
<symbol id="i-hp" viewBox="0 0 24 24"><path d="M12 2.5c3.3 5 6.6 8.6 6.6 12.4A6.6 6.6 0 0 1 5.4 14.9C5.4 11.1 8.7 7.5 12 2.5z"/></symbol>
<symbol id="i-pt" viewBox="0 0 24 24"><path d="M12 3.2a8.8 8.8 0 1 0 8.8 8.8h-2.2A6.6 6.6 0 1 1 12 5.4c2.7 0 4.8 2 4.8 4.6 0 2-1.6 3.6-3.6 3.6-1.5 0-2.6-1.1-2.6-2.5 0-1.1.8-1.9 1.8-1.9V7c-2.3 0-4 1.8-4 4.1 0 2.6 2.1 4.7 4.8 4.7 3.2 0 5.8-2.6 5.8-5.8C19 6.2 15.9 3.2 12 3.2z"/></symbol>
<symbol id="i-pm" viewBox="0 0 24 24"><path d="M8.2 3c1.8 0 2.8 1.9 2.8 4.4 0 2.3-.9 4-1 5.6H5.6C5.4 11 5 9.5 5 7.6 5 5 6.3 3 8.2 3zM5.7 14.4h4.1c0 1.6-.6 3-2 3-1.4 0-2.1-1.3-2.1-3zM15.8 7c1.9 0 3.2 2 3.2 4.6 0 1.9-.4 3.4-.6 5.4h-4.4c-.1-1.6-1-3.3-1-5.6C13 8.9 14 7 15.8 7zM14.2 18.4h4.1c0 1.7-.7 3-2.1 3s-2-1.4-2-3z"/></symbol>
<symbol id="i-luce" viewBox="0 0 24 24"><path d="M9 2.5h6v2H9zM7.5 5.5h9l1.2 3.2v9.3l-1.7 3.5H8l-1.7-3.5V8.7z" fill-opacity=".35"/><path d="M12 8.3c.6 2 2.6 3 2.6 5.6a2.6 2.6 0 0 1-5.2 0c0-1.6 1-2.4 1.6-3.4.3 1 .6 1.4 1 1.5.1-1.3-.4-2.4 0-3.7z"/></symbol>
<symbol id="i-salto" viewBox="0 0 24 24"><path d="M3 18.5c3.2-9.5 13.8-9.5 18 0l-2 .4C15.8 11.6 8.2 11.6 5 18.9z"/><path d="M17.2 13.2l4.3 5.3-6.5.9z"/></symbol>
<symbol id="i-colonna" viewBox="0 0 24 24"><path d="M5 3h14v2.5H5zM6.5 6h11v1.8h-11zM7.6 8.3h1.9v10.4H7.6zM11 8.3h2v10.4h-2zM14.5 8.3h1.9v10.4h-1.9zM6.5 19.2h11V21h-11zM5 21.3h14V23H5z"/></symbol>
<symbol id="i-trappola" viewBox="0 0 24 24"><path d="M2 16l3-7 2.4 4.2L10 6l2 6.8L14 6l2.6 7.2L19 9l3 7z"/><path d="M2 17h20v2.4H2z"/></symbol>
<symbol id="i-eco" viewBox="0 0 24 24"><path d="M12 4a8 8 0 1 0 8 8h-2.4A5.6 5.6 0 1 1 12 6.4V9l4-3.6L12 1.8z"/></symbol>
</defs></svg>`;

const ico = (id, cls) => `<svg class="ico ${cls || ''}" aria-hidden="true"><use href="#i-${id}"/></svg>`;

// --- Dati SP1: stanza 1 La Cripta, turno 1, seed 7 ---------------------------------
const TIPI = { vigore: { ico: 'forza', nome: 'Vigore', imp: '✊' }, fuoco: { ico: 'fuoco', nome: 'Fuoco' }, terrore: { ico: 'presagio', nome: 'Terrore' } };
// Sequenza Vincolata (G.seq) nell'ordine del motore
const SEQ = [
  { uid: 'd8', owner: 'Z1', value: 1, action: 'orda' },
  { uid: 'd2', owner: 'P', kind: 'vigore', value: 1, face: 'd6' },
  { uid: 'd4', owner: 'P', kind: 'fuoco', value: 1, face: 'd4' },
  { uid: 'd9', owner: 'Z2', value: 1, action: 'orda' },
  { uid: 'd10', owner: 'Z3', value: 1, action: 'orda' },
  { uid: 'd6', owner: 'Z4', value: 1, action: 'orda' },
  { uid: 'd1', owner: 'P', kind: 'vigore', value: 2, face: 'd6' },
  { uid: 'd7', owner: 'Z5', value: 4, action: 'incassare' },
  { uid: 'd5', owner: 'P', kind: 'terrore', value: 4, face: 'd8' },
  { uid: 'd3', owner: 'P', kind: 'fuoco', value: 2, face: 'd4' },
];
// selectionPlan: proposta iniziale (tutti i dadi con uno slot libero tenuti; tra i due 🔥 il più alto)
const PIANI = {
  proposta: {
    keep: { d2: true, d1: true, d3: true, d5: true },
    dice: { d2: { slot: 1 }, d1: { slot: 3 }, d3: { slot: 4 }, d5: { slot: 2 }, d4: { gain: '+1 Luce', label: 'nessuno slot' } },
    ok: true, luce: [0, 1], pm: [2, 2], pt: [6, 6], tieni: 4, scarti: 1, guadagno: '+1 Luce',
  },
  rifiuto: { // il giocatore tocca anche il 🔥1: due 🔥 per uno slot
    keep: { d2: true, d1: true, d3: true, d5: true, d4: true },
    dice: { d2: { slot: 1 }, d1: { slot: 3 }, d4: { slot: 4 }, d5: { slot: 2 }, d3: { label: 'nessuno slot', nessuno: true } },
    ok: false, luce: [0, 0], pm: [2, 2], pt: [6, 6], tieni: 5, scarti: 0,
    motivo: 'Troppi dadi per gli slot: il dado Fuoco 2 non ha uno slot. Scarta uno dei due dadi Fuoco.',
  },
};
const SCARTO = { vigore: '+1 PM', fuoco: '+1 Luce', terrore: '+1 PT' };
const SLOT_TIPO = { 1: 'vigore', 2: 'terrore', 3: 'vigore', 4: 'fuoco' };

// Nemici e anteprima E.ai.preview (stato attuale, "se nulla cambia")
const NEMICI = {
  Z1: { at: [4, 3], hp: 6, azione: 'Orda', ico: 'artigli', path: [[3, 3], [2, 4]], reach: true, dmg: 1 },
  Z2: { at: [4, 6], hp: 6, azione: 'Orda', ico: 'artigli', path: [[3, 5], [2, 5]], reach: true, dmg: 1 },
  Z3: { at: [6, 2], hp: 6, azione: 'Orda', ico: 'artigli', path: [[5, 2], [5, 3]], reach: false },
  Z4: { at: [6, 6], hp: 6, azione: 'Orda', ico: 'artigli', path: [[5, 5], [5, 4]], reach: false },
  Z5: { at: [7, 4], hp: 6, azione: 'Incassare', ico: 'scudo', path: [], reach: false, scudi: 2 },
};
const GIOCATORE = { at: [1, 4], hp: 10, hpMax: 10, pt: 6, pm: 2, salto: 0, luce: 0 };
const TERRENO = { colonne: [[4, 5], [6, 4]], trappole: [[5, 3]] };

// Carte in mano (cards.js rev.11): forma breve dalle Azioni
const MANO = [
  { nome: 'Attacco di Fuoco', cd: 1, az: [{ c: [['fuoco', 1]], t: '2 Danni Fuoco, adiacente' }, { c: [['fuoco', 1]], t: 'Vulnerabilità Fuoco, adiacente' }], eco: '+1 PM · +1 Luce', fam: 'fuoco' },
  { nome: 'Diniego Sismico', cd: 1, az: [{ c: [['forza', 1]], t: '1 Danno e Spingi 1, adiacente' }], eco: '+1 PM · Ruota 1 CD', fam: 'vigore' },
  { nome: 'Distorsione', cd: 1, az: [{ c: [['presagio', 'X'], ['pt', 1]], t: 'sposta un\'unità (non te) fino a X caselle; trappole attive' }], eco: '+1 PM · Pesca 1', fam: 'terrore' },
  { nome: 'Parata', cd: 0, az: [{ c: [['forza', 1]], t: '+1 Scudo' }, { c: [['forza', 1]], t: 'Pesca 1 carta' }], eco: '+1 Contrattacco', fam: 'vigore' },
  { nome: 'Carica Furiosa', cd: 2, az: [{ c: 'Gratis', t: '2 dadi vicini in Sequenza: carica in linea retta, danno = caselle' }], eco: '+1 Luce', fam: 'free' },
];

const costo = (c) => {
  if (typeof c === 'string') return `<span class="costo gratis">${c}</span>`;
  return c.map(([k, n]) => k === 'pt' ? `<span class="costo pt">+${n} PT</span>` : `<span class="costo c-${k}">${n}${ico(k)}</span>`).join('');
};

// Sigilli dei nemici: lettera + forma diversa per unità (US-07 criterio 2)
const FORME = {
  Z1: 'circle', Z2: 'square', Z3: 'diamond', Z4: 'shield', Z5: 'hex',
};
function sigillo(id, size, opts) {
  opts = opts || {};
  const s = size || 26, h = s / 2;
  let shape;
  switch (FORME[id]) {
    case 'circle': shape = `<circle cx="${h}" cy="${h}" r="${h - 1.2}"/>`; break;
    case 'square': shape = `<rect x="1.8" y="1.8" width="${s - 3.6}" height="${s - 3.6}"/>`; break;
    case 'diamond': shape = `<path d="M${h} 0.8L${s - 0.8} ${h}L${h} ${s - 0.8}L0.8 ${h}z"/>`; break;
    case 'shield': shape = `<path d="M1.5 1.5H${s - 1.5}V${h + 1}C${s - 1.5} ${s - 4} ${h + 3} ${s - 1} ${h} ${s - 0.8}C${h - 3} ${s - 1} 1.5 ${s - 4} 1.5 ${h + 1}z"/>`; break;
    case 'hex': shape = `<path d="M${s * .25} 1.5H${s * .75}L${s - 0.8} ${h}L${s * .75} ${s - 1.5}H${s * .25}L0.8 ${h}z"/>`; break;
  }
  const cls = opts.cls || '';
  return `<svg class="sigillo ${cls}" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" aria-label="${id}"><g class="forma">${shape}</g><text x="${h}" y="${h + 4.3}" text-anchor="middle">${id}</text></svg>`;
}

// --- geometria -----------------------------------------------------------------------
function hexPoly(cx, cy, r, s, flat) {
  const pts = [];
  for (let k = 0; k < 6; k++) {
    const a = (Math.PI / 180) * (flat ? 60 * k : 60 * k - 90);
    pts.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a) * s).toFixed(1));
  }
  return pts.join(' ');
}

function svgPerso(x, y, sc, kind) {
  // segnaposto delle figure (gli sprite veri restano quelli del gioco: qui non si progettano)
  sc = sc || 1;
  if (kind === 'giocatore') {
    return `<g class="figura giocatore" transform="translate(${x},${y}) scale(${sc})">
      <ellipse cx="0" cy="0" rx="15" ry="5" class="ombra"/>
      <path d="M-7 0 L-8 -22 Q-8 -28 -3 -29 L3 -29 Q8 -28 8 -22 L7 0z" class="corpo"/>
      <circle cx="0" cy="-33" r="5" class="testa"/>
      <path d="M-9 -36 H9 V-38 H5 V-44 H-5 V-38 H-9z" class="cappello"/>
      <circle cx="11" cy="-12" r="3.4" class="lanterna"/>
    </g>`;
  }
  return `<g class="figura zombie" transform="translate(${x},${y}) scale(${sc})">
    <ellipse cx="0" cy="0" rx="14" ry="4.5" class="ombra"/>
    <path d="M-7 0 L-6 -14 Q-9 -20 -6 -26 Q-2 -31 4 -29 Q9 -26 8 -18 L7 0z M5 -22 L15 -17 L14 -14 L5 -18z" class="corpo"/>
    <circle cx="1" cy="-31" r="5" class="testa"/>
    <circle cx="3" cy="-32" r="1.1" class="occhio"/><circle cx="-0.5" cy="-32" r="1.1" class="occhio"/>
  </g>`;
}

module.exports = { FONTS, TOKENS, ICONS, ico, TIPI, SEQ, PIANI, SCARTO, SLOT_TIPO, NEMICI, GIOCATORE, TERRENO, MANO, costo, sigillo, hexPoly, svgPerso };
