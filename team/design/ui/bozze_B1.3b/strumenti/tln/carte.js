// Forma breve delle carte (US-11 c.2): generata dai campi delle Azioni del motore, mai riscritta a mano.
// costo(azione) → riquadri di costo; effetto(azione) → frase breve; passive(carta) → segni accanto al nome.
'use strict';
const { ico } = require('./base');

const plur = (n, s, p) => (n === 1 ? s : p);

function costo(a) {
  const c = a.cost || {}, k = Object.keys(c);
  if (!k.length) return [{ t: 'Gratis', cls: 'gratis' }];
  const out = [];
  ['forza', 'fuoco', 'presagio'].forEach((t) => { if (c[t] != null) out.push({ n: c[t], ico: t, cls: 'c-' + t }); });
  if (c.pt != null) out.push({ t: '+' + c.pt + ' PT', cls: 'pt' });
  return out;
}
const BERS = { adj: 'adiacente', range: 'in gittata', any: 'ovunque', unit: '' };
function effetto(a) {
  switch (a.kind) {
    case 'attack': return a.dmg + ' ' + plur(a.dmg, 'Danno', 'Danni') + (a.dtype === 'fire' ? ' Fuoco' : '') + (a.push ? ' e Spingi ' + a.push : '') + ', ' + BERS[a.target];
    case 'draw': return 'Pesca ' + a.n;
    case 'shield': return '+' + a.n + ' Scudo';
    case 'jump': return '+' + a.n + ' PM Salto';
    case 'range': return '+' + a.n + ' Gittata';
    case 'direct': return 'X Danni Diretti, ovunque';
    case 'distort': return 'sposta un\'unità (non te) di X caselle, trappole attive';
    case 'vulnFire': return 'Vulnerabilità Fuoco, ' + BERS[a.target];
    case 'cone': return a.dmg + ' Danni Fuoco a cono, gittata ' + a.range;
    case 'stunPush': return 'Stordisci e Spingi ' + a.push + ', ' + BERS[a.target];
    default: return a.testo;
  }
}
// carte gratuite: un'unica riga dal tipo di effetto gratuito
const GRATIS = {
  infuse: 'un tuo dado non-Terrore diventa 🔥, +1 impulso',
  charge: '2 dadi vicini: carica in linea, danno = caselle',
  fate: '+1 PT: un tuo dado sulla faccia che vuoi',
};
// segni passivi accanto al nome (dai campi pre/post del motore)
function passive(c) {
  const p = [];
  if (c.baseRange) p.push('gittata ' + c.baseRange);
  if (c.id === 'ap') p.push('ti rende Vulnerabile');
  if (c.id === 'sc') p.push('aprendola peschi 1');
  if (c.id === 'as') p.push('alla chiusura: +1 PM o Scudo per danno');
  return p;
}
function righe(c) {
  if (c.free) return [{ costo: [{ t: 'Gratis', cls: 'gratis' }].concat(c.free === 'fate' ? [] : []), testo: GRATIS[c.free] }];
  return c.azioni.map((a) => ({ costo: costo(a), testo: effetto(a), intero: a.testo }));
}
function costoHTML(cs) {
  return cs.map((x) => x.ico ? `<span class="costo ${x.cls}">${x.n}${ico(x.ico)}</span>` : `<span class="costo ${x.cls}">${x.t}</span>`).join('');
}
function emoji(s) { // ✊ 🔥 🔮 dei testi interi → icone a inchiostro
  return s.replace(/✊/g, ico('forza')).replace(/🔥/g, ico('fuoco')).replace(/🔮/g, ico('presagio'));
}
function testoIntero(c) {
  const out = [];
  if (c.pre) out.push(c.pre);
  c.azioni.forEach((a) => out.push(a.testo));
  if (c.post) out.push(c.post);
  return out;
}
module.exports = { costo, effetto, righe, passive, costoHTML, emoji, testoIntero };
