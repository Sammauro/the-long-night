// Concetto "Il Lume" (B1.3c) · genera team/design/ui/concetto/prototipo.html
// Un solo file autonomo (CSS e JS in linea, unica dipendenza Google Fonts) con tre dinamiche a passi:
//   A · Selezione: messa a fuoco di una minaccia e rifiuto scritto sul filo   (SP1, seed 7, turno 1)
//   B · Dado nemico: annuncio, atto, verdetto                                  (seed 7, turno 3, Morso di Z1)
//   C · Il mio dado: la mano risponde, la carta diventa carta, puntamento      (SP3 + Diniego Sismico su Z1)
// Tutti i numeri vengono da bozze_B1.3b/strumenti/dati_mockup.json (motore) e da dati_diniego.json.
// Uso: node team/design/ui/concetto/strumenti/genera.js
'use strict';
const fs = require('fs');
const path = require('path');
const UI = path.join(__dirname, '..', '..');
const D = require(path.join(UI, 'bozze_B1.3b', 'strumenti', 'dati_mockup.json'));
const DS = require('./dati_diniego.json');
const B = require(path.join(UI, 'bozze_B1.3b', 'strumenti', 'tln', 'base.js'));
const C = require(path.join(UI, 'bozze_B1.3b', 'strumenti', 'tln', 'carte.js'));
const L = require(path.join(UI, 'strumenti', 'lib.js'));
const { ico, sigillo } = B;

// ── geometria: telefono 844×390, camera della direzione A ────────────────────────────
const MX = 128, MY = 24, MW = 430, MH = 270;          // riquadro (invisibile) della stanza
const X0 = 164, Y0 = 271, DX = 60, DY = 32, HR = 21.33; // centri delle caselle
const cx = (r, e) => X0 + (e - 1) * DX + (r % 2 ? 30 : 0);
const cy = (r) => Y0 - (r - 1) * DY;
const P = (c) => [cx(c[0], c[1]), cy(c[0])];
const lx = (x) => x - MX, ly = (y) => y - MY;         // coordinate dentro #mappa
const FILO_Y = 344, PASSO = 57, PRIMO = 38;
const gx = (i) => PRIMO + i * PASSO;

// ── passi: classi e stili che cambiano da un passo all'altro ─────────────────────────
const S = (o) => (o ? ` data-s="${Object.entries(o).map(([k, v]) => k + ':' + v).join('|')}"` : '');
const ST = (o) => (o ? ` data-st="${Object.entries(o).map(([k, v]) => k + '=' + v).join('|')}"` : '');
const emo = (s) => C.emoji(s);
const nf = (s) => String(s).replace(/\d+/g, (d) => '<span class="c">' + d + '</span>'); // cifre leggibili dentro IM Fell
const hexPts = (x, y) => [[0, -HR], [30, -HR / 2], [30, HR / 2], [0, HR], [-30, HR / 2], [-30, -HR / 2]].map((p) => (lx(x) + p[0]).toFixed(1) + ',' + (ly(y) + p[1]).toFixed(1)).join(' ');

function griglia(st) {
  let h = '';
  for (let r = 8; r >= 1; r--) for (let e = 1; e <= 6; e++) h += `<polygon class="casella" data-casella="R${r}E${e}" points="${hexPts(cx(r, e), cy(r))}"/>`;
  const terr = st.terreno.map((t) => {
    const [x, y] = P(t.at);
    if (t.tipo === 'column') return `<g class="colonna" transform="translate(${lx(x)},${ly(y)})"><ellipse cx="0" cy="3" rx="13" ry="5"/><rect x="-8" y="-30" width="16" height="33"/><rect x="-11" y="-33" width="22" height="5"/></g>`;
    return `<g class="trappola" transform="translate(${lx(x)},${ly(y)})"><path d="M-12 5l4-10 3 6 5-11 5 11 3-6 4 10z"/></g>`;
  }).join('');
  return `<svg class="pavimento" width="${MW}" height="${MH}" viewBox="0 0 ${MW} ${MH}">${h}${terr}</svg>`;
}
// figura segnaposto (gli sprite veri non si progettano qui) + punti vita sotto i piedi
function unita(id, pos, o) {
  o = o || {};
  const [x, y] = P(pos);
  const fig = L.svgPerso(0, 0, 1, id === 'P' ? 'giocatore' : 'zombie');
  const pv = o.hp != null && id !== 'P' ? `<span class="pv" aria-label="HP ${o.hp} di ${o.max}">${Array.from({ length: o.max }, (_, i) => `<i class="${i < o.hp ? 'p' : ''}"></i>`).join('')}</span>` : '';
  return `<div class="unita ${id === 'P' ? 'io' : 'loro'}" id="${o.dom || 'u-' + id}" style="left:${lx(x) - 22}px;top:${ly(y) - 48}px"${S(o.s)}${ST(o.st)}>
    <svg width="44" height="56" viewBox="-22 -48 44 56">${fig}</svg>${pv}</div>`;
}
const posSt = (pos) => { const [x, y] = P(pos); return `left:${lx(x) - 22}px;top:${ly(y) - 48}px`; };

// arrivo: contorno tratteggiato della casella + sigillo (sempre); percorso: solo a fuoco
function arrivo(id, cell, o) {
  o = o || {};
  const [x, y] = P(cell);
  return `<div class="arrivo ${o.cls || ''}" style="left:${lx(x) - 30}px;top:${ly(y) - 22}px"${S(o.s)}>
    <svg width="60" height="44" viewBox="-30 -22 60 44"><polygon points="0,-19.5 27,-10 27,10 0,19.5 -27,10 -27,-10"/></svg>${sigillo(id, 22, 'mini')}</div>`;
}
function percorso(from, path, o) {
  o = o || {};
  const pts = [from].concat(path).map(P).map(([x, y]) => lx(x) + ',' + ly(y)).join(' ');
  return `<svg class="percorso ${o.cls || ''}" width="${MW}" height="${MH}"${S(o.s)}><polyline points="${pts}"/></svg>`;
}
// etichetta di minaccia: sigillo, azione, e il numero che conta. Niente riquadro: alone d'inchiostro.
function minaccia(a, x, y, o) {
  o = o || {};
  const colp = a.reach && a.dmg > 0;
  let corpo;
  if (o.html) corpo = o.html;
  else if (colp) corpo = `<span class="az">${ico(B.AZ_ICO[a.action])} ${B.AZ_BREVE[a.action]}</span><b class="n">−${a.dmg}</b>${a.absorbed ? `<span class="nota">Scudo −${a.absorbed}</span>` : ''}`;
  else if (a.shield) corpo = `<span class="az">${ico('scudo')} ${B.AZ_BREVE[a.action]}</span><span class="nota bene">+${a.shield} Scudi</span>`;
  else corpo = `<span class="az">${ico(B.AZ_ICO[a.action])} ${B.AZ_BREVE[a.action]}</span><span class="nota">non ti raggiunge</span>`;
  return `<button class="minaccia ${colp ? 'colpisce' : 'quieta'} ${o.r ? 'a-destra' : ''} ${o.cls || ''}" data-tocco="minaccia-${a.owner}" style="${o.r ? 'right:' + (MW - lx(x)) : 'left:' + lx(x)}px;top:${ly(y)}px"${S(o.s)}>
    ${sigillo(a.owner, 22, colp ? 'rosso' : 'grigio')}<span class="t">${corpo}</span></button>`;
}
function lume(st) { return `<div class="lume"${ST(st)}></div>`; }
const luce = (x, y, rx, ry, d) => `--lx:${lx(x)}px;--ly:${ly(y)}px;--rx:${rx}px;--ry:${ry}px;--d:${d}`;
const LARGA = luce(350, 180, 330, 230, 0.5);

// ── il filo: la Sequenza Vincolata ───────────────────────────────────────────────────
function grano(d, i, o) {
  o = o || {};
  const x = gx(i);
  const mio = d.owner === 'P';
  const sopra = o.sopra != null ? `<span class="sopra">${o.sopra}</span>` : '';
  const sotto = o.sotto != null ? `<span class="sotto">${o.sotto}</span>` : '';
  const faccia = mio
    ? `<span class="osso t-${d.kind}"><b>${d.value}</b>${ico(B.TIPO_ICO[d.kind])}</span>`
    : `<span class="sigillo-cera"><b>${d.value}</b>${ico(B.AZ_ICO[d.action])}</span>`;
  return `<button class="grano ${mio ? 'mio' : 'suo'} ${o.cls || ''}" data-tocco="dado-${d.uid}" style="left:${x - 28}px"${S(o.s)}>${sopra}${faccia}${sotto}</button>`;
}
function filo(html, extra) {
  return `<div class="filo" data-pannello="sequenza"><i class="corda"></i>${html}${extra || ''}</div>`;
}
function nodo(passi) { // l'unico pulsante primario: il nodo in fondo al filo. passi = {n: {t, s, cls}}
  const k = Object.keys(passi);
  return `<button class="nodo" data-primario data-tocco="primario"${S(Object.fromEntries(k.map((n) => [n, passi[n].cls || ''])))}>` +
    k.map((n) => `<span class="faccia-nodo"${S({ [n]: 'su' })}><b>${nf(passi[n].t)}</b><small>${passi[n].s || ''}</small></span>`).join('') + `</button>`;
}
// filo teso: lega il dado alla sua unità quando è a fuoco (al posto di una legenda)
function teso(i, pos, o) {
  const [x, y] = P(pos);
  const x0 = gx(i), y0 = FILO_Y - 30;
  return `<svg class="teso" width="844" height="390"${S(o)}><path d="M${x0} ${y0} C ${x0} ${y0 - 40}, ${x} ${y + 50}, ${x} ${y + 6}"/></svg>`;
}

// ── margine sinistro: la candela (Veglia) e i miei numeri ────────────────────────────
function candela(turno, veglia) {
  const restano = Math.max(0, veglia - turno + 1), H = 150, seg = H / veglia, h = restano * seg, top = 46 + (H - h);
  const tacche = Array.from({ length: restano - 1 }, (_, i) => `<path d="M3 ${top + (i + 1) * seg}h7" />`).join('');
  return `<svg class="candela" width="34" height="210" viewBox="0 0 34 210" aria-hidden="true">
    <ellipse class="alone" cx="17" cy="${top - 12}" rx="15" ry="18"/>
    <path class="fiamma" d="M17 ${top - 24}c5 7 7 10 7 14a7 7 0 0 1-14 0c0-4 2-7 7-14z"/>
    <path class="stoppino" d="M17 ${top - 5}v6"/>
    <rect class="cera" x="8" y="${top}" width="18" height="${h}"/><g class="tacche">${tacche}</g>
    <path class="piatto" d="M2 ${46 + H}h30l-4 8H6z"/></svg>`;
}
function numero(k, v, nome, o) {
  o = o || {};
  return `<div class="num n-${k} ${o.cls || ''}"${S(o.s)}>${ico(k)}<b>${v}</b><span>${nome}</span>${o.extra || ''}</div>`;
}
function margine(st, righe, sotto) {
  return `<div class="margine" data-pannello="margine">${candela(st.turno, st.stanza.veglia)}
    <div class="veglia">Veglia ${st.turno} di ${st.stanza.veglia}</div>
    <div class="numeri">${righe}</div>${sotto || ''}</div>`;
}

// ── margine destro: la mano (inchiostro sul buio; diventa carta solo la carta scelta) ─
function riga(c) {
  return C.righe(c).map((r) => `<span class="az">${C.costoHTML(r.costo)} ${emo(r.testo)}</span>`).join('');
}
function carta(c, o) {
  o = o || {};
  const eco = c.eco.replace(/ · /g, ', ');
  return `<button class="carta ${o.cls || ''}" data-tocco="carta-${c.id}"${S(o.s)}>
    <span class="testa"><span class="nome">${c.nome}</span><span class="cd">CD ${c.cd}</span><span class="eco">${ico('eco')} ${eco}</span></span>
    ${o.corpo || riga(c)}${o.sotto || ''}</button>`;
}

// ════════════════════════════════════════════════════════════════════════════════════
// A · SELEZIONE (SP1)
// ════════════════════════════════════════════════════════════════════════════════════
function scenaA() {
  const st = D.stati.sel_proposta, rf = D.stati.sel_rifiuto;
  const ant = Object.fromEntries(st.anteprima.map((a) => [a.owner, a]));
  const pl = st.selezione.plan, plR = rf.selezione.plan;
  const iZ2 = st.seq.findIndex((d) => d.owner === 'Z2');
  const prima = st.seq.slice(0, iZ2).filter((d) => d.owner === 'P'); // i miei dadi prima di Z2
  const tot = st.anteprima.reduce((s, a) => s + (a.reach ? a.dmg : 0), 0);

  // mappa. Passi: 1 riposo · 2 a metà (solo fotogramma) · 3 a fuoco su Z2 · 4 rifiuto sul filo
  const F = { 2: 'pen m', 3: 'pen' };
  let m = griglia(st) + lume({ 1: LARGA, 2: luce(405, 215, 215, 155, 0.72), 3: luce(412, 226, 128, 98, 0.9), 4: luce(350, 180, 330, 230, 0.7) });
  m += arrivo('Z1', ant.Z1.end, { cls: 'rosso' }) + arrivo('Z2', ant.Z2.end, { cls: 'rosso', s: { 3: 'fuoco' } });
  m += arrivo('Z3', ant.Z3.end, { s: F }) + arrivo('Z4', ant.Z4.end, { s: F });
  m += percorso(ant.Z2.from, ant.Z2.path, { cls: 'rosso', s: { 1: 'via', 2: 'm', 4: 'via' } });
  st.nemici.forEach((n) => { m += unita(n.id, n.pos, { hp: n.hp, max: n.hpMax }); });
  m += unita('P', st.giocatore.pos);
  // Z1 sarà accanto a Z2: fantasma nella casella d'arrivo, solo a fuoco
  m += `<div class="fantasma" style="${posSt(ant.Z1.end)}"${S({ 1: 'via', 2: 'm', 4: 'via' })}><svg width="44" height="56" viewBox="-22 -48 44 56">${L.svgPerso(0, 0, 1, 'zombie')}</svg></div>`;
  m += minaccia(ant.Z1, 304, 153, { s: { 2: 'pen m', 3: 'pen' } });
  m += minaccia(ant.Z2, 466, 186, { s: { 2: 'fuoco m', 3: 'fuoco' } });
  m += minaccia(ant.Z3, 244, 89, { s: F, cls: 'breve' });
  m += minaccia(ant.Z4, 484, 70, { s: F, cls: 'stretta' });
  m += minaccia(ant.Z5, 394, 30, { s: F });
  m += `<span class="scritta" style="left:${lx(232)}px;top:${ly(246)}px"${S({ 1: 'via', 2: 'via', 4: 'via' })}>${nf('Z1 sarà qui')}</span>`;

  // il filo
  let f = '';
  st.seq.forEach((d, i) => {
    if (d.owner === 'P') {
      const p = pl.dice[d.uid], r = plR.dice[d.uid];
      const scarto = B.SCARTO[d.kind];
      const etS = (q) => (q.kept ? (q.slot ? 'Slot ' + q.slot : 'nessuno slot') : q.label === 'nessuno slot' ? 'nessuno slot' : 'Slot libero');
      const tenuto = p.kept, tenutoR = r.kept, guasto = r.kept && !r.slot;
      const cls = { 1: tenuto ? 'tenuto' : 'scartato', 2: (tenuto ? 'tenuto' : 'scartato'), 3: (tenuto ? 'tenuto' : 'scartato') + (prima.includes(d) ? (tenuto ? ' prima' : ' prima') : ' pen'),
        4: (tenutoR ? 'tenuto' : 'scartato') + (guasto ? ' guasto' : '') + (d.uid === rf.toccato ? ' toccato' : '') };
      const sopra = `<span${S({ 4: 'via' })}>${etS(p)}</span><span${S({ 1: 'via', 2: 'via', 3: 'via' })}>${etS(r)}</span>`;
      f += grano(d, i, { s: cls, sopra, sotto: scarto });
    } else {
      const a = ant[d.owner], colp = a.reach && a.dmg > 0;
      f += grano(d, i, { s: d.owner === 'Z2' ? { 2: 'fuoco m', 3: 'fuoco' } : { 2: 'pen m', 3: 'pen' }, cls: colp ? 'colpisce' : '',
        sopra: sigillo(d.owner, 22, colp ? 'rosso' : 'grigio'), sotto: colp ? `${B.AZ_BREVE[d.action]} −${a.dmg}` : B.AZ_BREVE[d.action] });
    }
  });
  // l'arco del conflitto: due dadi Fuoco per lo stesso slot (passo 4)
  const i1 = st.seq.findIndex((d) => d.uid === 'd4'), i2 = st.seq.findIndex((d) => d.uid === 'd3');
  const arco = `<svg class="arco" width="620" height="30"${S({ 1: 'via', 2: 'via', 3: 'via' })}><path d="M${gx(i1)} 7 V3 H${gx(i2)} V7"/></svg>`;
  f = filo(f, arco) + nodo({
    1: { t: 'Conferma i dadi', s: `tieni ${Object.values(pl.dice).filter((x) => x.kept).length}, scarti 1: +${pl.gains.luce} Luce` },
    2: { t: 'Conferma i dadi', s: `tieni 4, scarti 1: +${pl.gains.luce} Luce` },
    3: { t: 'Conferma i dadi', s: `tieni 4, scarti 1: +${pl.gains.luce} Luce`, cls: 'pen' },
    4: { t: rf.selezione.motivo, s: `scarta un ${ico('fuoco')} per confermare`, cls: 'spento' },
  });

  const g = st.giocatore;
  const num = numero('hp', g.hp, 'HP', { extra: `<em class="poi"${S({ 4: 'via' })}>se non fai nulla<br>resti a <b>${g.hp - tot}</b></em>` }) + numero('pt', g.pt, 'PT') + numero('pm', g.pm, 'PM') +
    numero('luce', g.luce, 'Luce', { extra: `<em class="poi oro"${S({ 4: 'via' })}>diventa <b>${pl.luceAfter}</b></em><em class="poi"${S({ 1: 'via', 2: 'via', 3: 'via' })}>resta <b>${plR.luceAfter}</b></em>` });

  const mano = `<div class="mano" data-pannello="mano"${S({ 2: 'pen m', 3: 'via' })}>${st.mano.map((c) => carta(c)).join('')}</div>`;
  const z2 = ant.Z2;
  const voce = `<div class="voce" data-pannello="voce"${S({ 1: 'via', 2: 'via', 4: 'via' })}>
    <h2>${sigillo('Z2', 26, 'rosso')}<span>${nf('Z2')}, ${z2.name}</span></h2>
    <p class="grande">Ti toglie <b>${z2.dmg} HP</b>.</p>
    <p>${z2.base} di base, +${z2.dmg - z2.base} perché ${z2.orda.join(' e ')} gli sarà accanto.</p>
    <p class="oro">È il quarto dado. Prima di lui agisci con ${prima.filter((d) => pl.dice[d.uid].kept).map((d) => '<span class="nw">' + ico(B.TIPO_ICO[d.kind]) + ' ' + d.value + '</span>').join(', ')}${prima.filter((d) => !pl.dice[d.uid].kept).map((d) => `; <span class="nw">il ${ico(B.TIPO_ICO[d.kind])} ${d.value}</span> lo stai scartando`).join('')}.</p>
    <p class="piano">Tocca fuori dalla luce per tornare.</p></div>`;

  const orient = `<p class="orientamento" data-pannello="orientamento"><b>Turno ${nf(st.turno)}, Selezione.</b>
    <span${S({ 3: 'via', 4: 'via' })}>Tocca un dado per tenerlo o scartarlo.</span>
    <span${S({ 1: 'via', 2: 'via', 4: 'via' })}>Stai guardando Z2.</span>
    <span class="rosso"${S({ 1: 'via', 2: 'via', 3: 'via' })}>Hai tenuto due dadi Fuoco: lo Slot 4 ne regge uno.</span></p>`;

  return `<section class="scena" data-scena="A" data-passi="4">${orient}${margine(st, num)}
    <div class="mappa">${m}</div>${teso(iZ2, ant.Z2.from, { 1: 'via', 2: 'm', 4: 'via' })}${mano}${voce}${f}</section>`;
}

// ════════════════════════════════════════════════════════════════════════════════════
// B · DADO NEMICO (turno 3, Morso Rigenerante di Z1)
// ════════════════════════════════════════════════════════════════════════════════════
function scenaB() {
  const st = D.stati.nemico_anteprima, es = D.stati.nemico_esito;
  const ant = Object.fromEntries(st.anteprima.map((a) => [a.owner, a]));
  const dopo = Object.fromEntries(es.anteprima.map((a) => [a.owner, a]));
  const z1 = ant.Z1, ev = es.esito;
  const dmg = ev.find((e) => e.type === 'DAMAGE' && e.data.target === 'P').data;
  const contra = ev.find((e) => e.type === 'DAMAGE' && e.data.target === 'Z1').data;
  const cura = ev.find((e) => e.type === 'HEAL').data;
  const hp = ev.find((e) => e.type === 'RESOURCE' && e.data.res === 'hp').data;
  const z1prima = st.nemici.find((n) => n.id === 'Z1'), z1dopo = es.nemici.find((n) => n.id === 'Z1');
  const prossimo = es.seq[es.res.cursor];

  // Passi: 1 finestra larga · 2 annuncio a fuoco · 3 atto · 4 verdetto
  const O = { 2: 'pen', 3: 'pen', 4: '' };
  let m = griglia(st) + lume({ 1: LARGA, 2: luce(344, 238, 118, 92, 0.9), 3: luce(358, 254, 92, 74, 0.94), 4: luce(350, 215, 260, 190, 0.66) });
  m += arrivo('Z1', z1.end, { cls: 'rosso', s: { 2: 'fuoco', 3: 'via', 4: 'via' } });
  m += arrivo('Z3', ant.Z3.end, { cls: 'rosso', s: O }) + arrivo('Z5', ant.Z5.end, { s: O });
  m += percorso(z1.from, z1.path, { cls: 'rosso', s: { 1: 'via', 4: 'traccia' } });
  st.nemici.forEach((n) => {
    if (n.id === 'Z1') m += unita('Z1', n.pos, { hp: n.hp, max: n.hpMax, s: { 2: 'fuoco', 3: 'fuoco colpo', 4: '' }, st: { 3: posSt(z1.end), 4: posSt(z1.end) } });
    else m += unita(n.id, n.pos, { hp: n.hp, max: n.hpMax });
  });
  m += unita('P', st.giocatore.pos, { s: { 2: 'fuoco', 3: 'fuoco urto' } });
  m += minaccia(z1, 296, 150, { s: { 2: 'fuoco', 3: 'via', 4: 'via' }, r: 1 });
  m += minaccia(ant.Z3, 264, 222, { s: { 2: 'pen', 3: 'via' }, r: 1 });
  m += minaccia(ant.Z2, 424, 217, { s: O });
  m += minaccia(ant.Z4, 484, 136, { s: O, cls: 'stretta' });
  m += minaccia(ant.Z5, 394, 112, { s: { 2: 'pen', 3: 'via' }, cls: 'breve' });
  // l'atto: le cifre nascono sulla figura e partono verso il margine (passo 3)
  const [px, py] = P(st.giocatore.pos), [zx, zy] = P(z1.end);
  m += `<b class="cifra danno" style="left:${lx(px) - 16}px;top:${ly(py) - 114}px"${S({ 1: 'via', 2: 'via', 4: 'via' })}>−${dmg.hpLoss}</b>`;
  m += `<span class="scheggia" style="left:${lx(px) + 26}px;top:${ly(py) + 2}px"${S({ 1: 'via', 2: 'via', 4: 'via' })}>${ico('scudo')} Scudo −${dmg.absorbed}</span>`;
  m += `<b class="cifra contra" style="left:${lx(zx) - 40}px;top:${ly(zy) - 104}px"${S({ 1: 'via', 2: 'via', 4: 'via' })}>−${contra.hpLoss}</b>`;
  m += `<b class="cifra cura" style="left:${lx(zx) - 74}px;top:${ly(zy) - 62}px"${S({ 1: 'via', 2: 'via', 4: 'via' })}>+${cura.amount}</b>`;

  let f = '';
  st.seq.forEach((d, i) => {
    const corr = i === 0;
    if (d.owner === 'P') f += grano(d, i, { s: { 2: 'pen', 3: 'pen', 4: i === es.res.cursor ? 'prossimo' : '' } });
    else {
      const a = ant[d.owner], colp = a.reach && a.dmg > 0;
      f += grano(d, i, { cls: colp ? 'colpisce' : '', s: corr ? { 1: 'corrente', 2: 'corrente fuoco', 3: 'corrente fuoco', 4: 'risolto' } : { 2: 'pen', 3: 'pen' },
        sopra: sigillo(d.owner, 22, colp ? 'rosso' : 'grigio'), sotto: colp ? `${B.AZ_BREVE[d.action]} −${a.dmg}` : B.AZ_BREVE[d.action] });
    }
  });
  const fiamma = `<i class="cursore" style="left:0px"${S({ 2: 'via', 3: 'via' })}${ST({ 1: 'left:0px', 4: `left:${(gx(0) + gx(1)) / 2 - 7}px` })}>${ico('candela')}</i>`;
  f = filo(f, fiamma) + nodo({
    1: { t: 'Lascia agire Z1', s: `oppure muoviti: hai ${st.giocatore.pm} PM` },
    2: { t: 'Lascia agire Z1', s: `${z1.name}: −${z1.dmg} HP` },
    3: { t: 'Z1 sta agendo', s: 'tocca per saltare', cls: 'cavo' },
    4: { t: 'Avanti, tocca a te', s: `il tuo dado ${ico(B.TIPO_ICO[prossimo.kind])} ${prossimo.value}` },
  });

  const g = st.giocatore, g2 = es.giocatore;
  const num = `<div class="num n-hp"${S({ 3: 'gonfio', 4: 'cambiato' })}>${ico('hp')}<b><span${S({ 3: 'via', 4: 'via' })}>${g.hp}</span><span${S({ 1: 'via', 2: 'via' })}>${g2.hp}</span></b><span>HP</span><em class="poi rosso"${S({ 1: 'via', 2: 'via' })}>era ${hp.old}</em></div>` +
    numero('pt', g.pt, 'PT') + numero('pm', g.pm, 'PM') + numero('luce', g.luce, 'Luce');
  const stati = `<div class="stati"><span class="stato"${S({ 2: 'acceso', 3: 'rotto', 4: 'via' })}>${ico('scudo')} Scudo ${g.stati.shield[0]}</span>
    <span class="stato"${S({ 2: 'acceso', 3: 'acceso' })}>${ico('contra')} Contrattacco</span></div>`;

  const lib = st.mano.filter((c) => c.free && !c.motivoFree);
  const mano = `<div class="mano" data-pannello="mano"${S({ 2: 'via', 3: 'via', 4: 'via' })}>
    ${st.mano.map((c) => carta(c, { cls: c.free && !c.motivoFree ? 'pronta' : 'ferma', corpo: c.free && c.motivoFree ? `<span class="perche">${c.motivoFree}</span>` : undefined })).join('')}</div>`;

  const voce = `<div class="voce" data-pannello="voce"${S({ 1: 'via', 4: 'via' })}>
    <h2>${sigillo('Z1', 26, 'rosso')}<span>Tocca a ${nf('Z1')}</span></h2>
    <p class="sotto-titolo">${ico('morso')} ${z1.name}</p>
    <p class="grande"${S({ 3: 'detto' })}>Ti raggiunge e morde per ${nf(z1.raw)}.</p>
    <p${S({ 3: 'detto' })}>${ico('scudo')} Il tuo Scudo ne ferma ${z1.absorbed}: perdi <b class="rosso">${z1.dmg} HP</b>.</p>
    <p${S({ 3: 'adesso' })}>${ico('contra')} Contrattacco: gli rendi ${z1.contrattacco} danno.</p>
    <p${S({ 3: 'adesso' })}>${ico('hp')} Poi si cura ${z1.cura} HP, uno per ogni HP che perdi.</p></div>
  <div class="voce verdetto" data-pannello="verdetto"${S({ 1: 'via', 2: 'via', 3: 'via' })}>
    <h2>${sigillo('Z1', 26, 'grigio')}<span>${nf('Z1')} ti ha morso</span></h2>
    <p class="grande">HP ${nf(hp.old)} → <b class="rosso">${hp.value}</b></p>
    <p>${dmg.amount} danni, lo Scudo ne ha fermato ${dmg.absorbed}. Lo Scudo è consumato.</p>
    <p>Contrattacco: ${contra.hpLoss} danno a Z1, da ${z1prima.hp} a ${z1prima.hp - contra.hpLoss} HP.</p>
    <p>Il Morso lo ha curato di ${cura.amount}: Z1 è a ${z1dopo.hp} HP.</p>
    <p class="oro">Adesso ${dopo.Z3.owner} ti farebbe ${dopo.Z3.dmg}: non hai più Scudi.</p></div>`;

  const orient = `<p class="orientamento" data-pannello="orientamento"><b>Turno ${nf(st.turno)}, Risoluzione.</b>
    <span${S({ 2: 'via', 3: 'via', 4: 'via' })}>Il primo dado è di Z1. Puoi muoverti${lib.length ? ' o giocare ' + lib.map((c) => c.nome).join(', ') : ''}.</span>
    <span${S({ 1: 'via', 3: 'via', 4: 'via' })}>Tocca a Z1. Tocca fuori dalla luce per rivedere la stanza.</span>
    <span${S({ 1: 'via', 2: 'via', 4: 'via' })}>Z1 agisce.</span>
    <span${S({ 1: 'via', 2: 'via', 3: 'via' })}>Z1 ha agito. Prossimo: il tuo dado ${ico(B.TIPO_ICO[prossimo.kind])} ${prossimo.value}.</span></p>`;

  return `<section class="scena" data-scena="B" data-passi="4">${orient}${margine(st, num, stati)}
    <div class="mappa">${m}</div>${teso(0, z1.from, { 1: 'via', 3: 'via', 4: 'via' })}${mano}${voce}${f}</section>`;
}

// ════════════════════════════════════════════════════════════════════════════════════
// C · IL MIO DADO → CARTA (SP3, Diniego Sismico su Z1)
// ════════════════════════════════════════════════════════════════════════════════════
function scenaC() {
  const st = D.stati.dado_giocatore;
  const ant = Object.fromEntries(st.anteprima.map((a) => [a.owner, a]));
  const scelta = DS.esiti.find((e) => e.cell[0] === 3 && e.cell[1] === 3);
  const dmgZ1 = scelta.eventi.find((e) => e.type === 'DAMAGE').data;
  const z1 = st.nemici.find((n) => n.id === 'Z1');
  const z2dopo = +scelta.danniSeNonFaiAltro.find((x) => x.startsWith('Z2')).split('−')[1];
  const att = st.seq[st.res.cursor];
  const ds = st.mano.find((c) => c.id === 'ds');
  const serve = { fuoco: 'fuoco', terrore: 'presagio' };

  // Passi: 1 dado attivo · 2 carta scelta · 3 carta aperta, bersaglio e spinta scelti
  const O = { 2: 'pen', 3: 'pen' };
  let m = griglia(st) + lume({ 1: LARGA, 2: luce(346, 244, 118, 92, 0.88), 3: luce(340, 232, 128, 100, 0.88) });
  st.raggiungibili.forEach((r) => { const [x, y] = P(r.cell); m += `<span class="costo-pm" style="left:${lx(x) + 6}px;top:${ly(y) + 2}px"${S({ 2: 'via', 3: 'via' })}>${r.pm}${ico('pm')}</span>`; });
  m += arrivo('Z2', ant.Z2.end, { cls: 'rosso', s: { 3: 'via' } }) + arrivo('Z3', ant.Z3.end, { s: O }) + arrivo('Z4', ant.Z4.end, { s: O });
  DS.spinta.forEach((sp) => {
    const [x, y] = P(sp.cell), sel = sp.cell[0] === 3 && sp.cell[1] === 3;
    m += `<button class="spinta ${sel ? 'scelta' : ''}" data-tocco="spinta-R${sp.cell[0]}E${sp.cell[1]}" style="left:${lx(x) - 28}px;top:${ly(y) - 22}px"${S({ 1: 'via', 2: 'via' })}>
      <svg width="56" height="44" viewBox="-28 -22 56 44"><polygon points="0,-19 25,-9.5 25,9.5 0,19 -25,9.5 -25,-9.5"/></svg></button>`;
  });
  st.nemici.forEach((n) => {
    if (n.id === 'Z1') m += unita('Z1', n.pos, { hp: n.hp, max: n.hpMax, s: { 2: 'fuoco bersaglio', 3: 'fuoco bersaglio' } });
    else m += unita(n.id, n.pos, { hp: n.hp, max: n.hpMax });
  });
  m += unita('P', st.giocatore.pos, { s: { 2: 'fuoco', 3: 'fuoco' } });
  m += `<div class="fantasma" style="${posSt(scelta.cell)}"${S({ 1: 'via', 2: 'via' })}><svg width="44" height="56" viewBox="-22 -48 44 56">${L.svgPerso(0, 0, 1, 'zombie')}</svg></div>`;
  m += percorso(z1.pos, [scelta.cell], { cls: 'oro freccia', s: { 1: 'via', 2: 'via' } });
  const [zx, zy] = P(z1.pos);
  m += `<button class="minaccia quieta fatto a-destra" data-tocco="minaccia-Z1" style="right:${MW - lx(320)}px;top:${ly(217)}px"${S({ 2: 'fuoco', 3: 'via' })}>${sigillo('Z1', 22, 'grigio')}<span class="t"><span class="az">ha già agito</span><span class="nota"${S({ 1: 'via', 3: 'via' })}>unico bersaglio</span></span></button>`;
  m += `<b class="cifra colpo" style="left:${lx(zx) - 52}px;top:${ly(zy) - 78}px"${S({ 1: 'via', 2: 'via' })}>−${dmgZ1.hpLoss}</b>`;
  m += `<span class="scritta" style="right:${MW - lx(zx) + 62}px;top:${ly(zy) - 72}px"${S({ 1: 'via', 2: 'via' })}>${nf(`Z1 da ${z1.hp} a ${scelta.z1.hp} HP`)}</span>`;
  // la minaccia che cambia si ingrandisce da sola: Z2 senza Z1 accanto
  m += minaccia(ant.Z2, 466, 186, { s: { 2: 'pen', 3: 'fuoco cambia' },
    html: `<span class="az">${ico('artigli')} Orda</span><b class="n"><s${S({ 1: 'via', 2: 'via' })}>−${ant.Z2.dmg}</s><span${S({ 3: 'via' })}>−${ant.Z2.dmg}</span><span${S({ 1: 'via', 2: 'via' })}> −${z2dopo}</span></b><span class="nota"${S({ 1: 'via', 2: 'via' })}>senza Z1</span>` });
  m += minaccia(ant.Z3, 244, 89, { s: O, cls: 'breve' }) + minaccia(ant.Z4, 484, 70, { s: O, cls: 'stretta' }) + minaccia(ant.Z5, 394, 30, { s: O });

  let f = '';
  st.seq.forEach((d, i) => {
    if (d.owner === 'P') f += grano(d, i, { s: i === st.res.cursor ? { 1: 'corrente fuoco', 2: 'corrente fuoco', 3: 'corrente fuoco speso' } : O });
    else {
      const a = ant[d.owner], ris = d.state === 'resolved', colp = a && a.reach && a.dmg > 0;
      f += grano(d, i, { cls: (colp ? 'colpisce' : '') + (ris ? ' risolto' : ''), s: ris ? null : (d.owner === 'Z2' ? { 2: 'pen', 3: 'cambia' } : O),
        sopra: sigillo(d.owner, 22, colp ? 'rosso' : 'grigio'),
        sotto: ris ? 'fatto' : d.owner === 'Z2' ? `<span${S({ 3: 'via' })}>Orda −${a.dmg}</span><span${S({ 1: 'via', 2: 'via' })}>Orda −${z2dopo}</span>` : colp ? `${B.AZ_BREVE[d.action]} −${a.dmg}` : B.AZ_BREVE[d.action] });
    }
  });
  f = filo(f) + nodo({
    1: { t: 'Passa al prossimo dado', s: `perdi ${st.res.pool.forza} ${ico('forza')}`, cls: 'cavo' },
    2: { t: 'Apri Diniego Sismico', s: `con il dado ${ico('forza')} ${att.value}` },
    3: { t: 'Colpisci e spingi Z1', s: `spendi ${ico('forza')} 1: Z1 da ${z1.hp} a ${scelta.z1.hp} HP` },
  });

  const g = st.giocatore;
  const num = numero('hp', g.hp, 'HP', { extra: `<em class="poi"${S({ 3: 'via' })}>se non fai nulla<br>resti a <b>${g.hp - ant.Z2.dmg}</b></em><em class="poi oro"${S({ 1: 'via', 2: 'via' })}>con la spinta<br>resti a <b>${g.hp - z2dopo}</b></em>` }) +
    numero('pt', g.pt, 'PT') + numero('pm', g.pm, 'PM') + numero('luce', g.luce, 'Luce');

  // la mano risponde al dado: avanti le carte che questo dado apre, in un solo blocco quieto le altre
  const apribili = st.mano.filter((c) => !c.motivo), ferme = st.mano.filter((c) => c.motivo);
  const perche = (c) => (c.free ? c.motivoFree.toLowerCase() : `serve ${ico(serve[c.family])}`);
  const mano = `<div class="mano attiva" data-pannello="mano">
    <p class="capo"${S({ 3: 'via' })}>Hai <span class="tacca">${ico('forza')}</span> ${st.res.pool.forza} impulso da spendere.</p>
    ${apribili.map((c) => c.id === 'ds'
    ? carta(c, { cls: 'pronta', s: { 2: 'foglio', 3: 'foglio aperta' },
      corpo: `<span class="az breve"${S({ 2: 'via', 3: 'via' })}>${riga(c)}</span>
        <span class="az intera"${S({ 1: 'via', 3: 'ora' })}>${emo(c.azioni[0].testo)}</span>
        <span class="nota-carta"${S({ 1: 'via', 3: 'via' })}>Dopo l'uso va in Plancia per ${c.cd} turno.</span>
        <span class="nota-carta"${S({ 1: 'via', 2: 'via' })}>Bersaglio Z1, spinto in R${scelta.cell[0]} E${scelta.cell[1]}. Muoverti o passare chiude la carta.</span>` })
    : carta(c, { cls: 'pronta', s: { 2: 'pen', 3: 'via' } })).join('')}
    <button class="carta manovra" data-tocco="manovra"${S({ 2: 'via', 3: 'via' })}><span class="testa"><span class="nome">Movimento Tattico</span><span class="eco">manovra del dado</span></span>
      <span class="az"><span class="costo c-forza">1${ico('forza')}</span> +1 PM</span></button>
    <button class="carta gruppo" data-tocco="carte-ferme"${S({ 2: 'via', 3: 'via' })}><span class="testa"><span class="eco">Non con questo dado</span></span>
      ${ferme.map((c) => `<span class="az"><b>${c.nome}</b>, ${perche(c)}</span>`).join('')}</button>
    <button class="rimetti" data-tocco="rimetti"${S({ 1: 'via', 2: 'via' })}>Rimetti in mano <small>non l'hai ancora usata</small></button>
  </div>`;

  const orient = `<p class="orientamento" data-pannello="orientamento"><b>Turno ${nf(st.turno)}, Risoluzione.</b>
    <span${S({ 2: 'via', 3: 'via' })}>Usa il dado ${ico('forza')} ${att.value}: apri una carta, muoviti o passa.</span>
    <span${S({ 1: 'via', 3: 'via' })}>Diniego Sismico può colpire Z1. Toccala ancora per aprirla.</span>
    <span${S({ 1: 'via', 2: 'via' })}>Scegli dove spingere Z1, poi conferma.</span></p>`;
  void ds;
  return `<section class="scena" data-scena="C" data-passi="3">${orient}${margine(st, num)}
    <div class="mappa">${m}</div>${mano}${f}</section>`;
}

// ════════════════════════════════════════════════════════════════════════════════════
const CSS = fs.readFileSync(path.join(__dirname, 'concetto.css'), 'utf8');
const JS = fs.readFileSync(path.join(__dirname, 'concetto_pagina.js'), 'utf8');
const html = `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=844">
<title>The Long Night · concetto dell'interfaccia: Il Lume</title>${L.FONTS}
<style>${B.TOKENS}${CSS}</style></head><body>
${B.ICONS}
<div class="palco fmt-tel vis" id="palco">${scenaA()}${scenaB()}${scenaC()}</div>
<div class="regia">
  <div class="scelte"><button data-vai="A">Selezione: guardare una minaccia</button><button data-vai="B">Dado nemico: annuncio, atto, verdetto</button><button data-vai="C">Il mio dado: dalla mano alla carta</button></div>
  <p class="didascalia" id="didascalia"></p>
  <div class="passi"><button id="indietro">Indietro</button><span id="conta"></span><button id="avanti">Avanti</button><button id="auto">Ferma</button></div>
  <p class="nota-regia">Prototipo del concetto, non del gioco: i passi sono già scritti, i numeri vengono dal motore (seed 7, La Cripta). Tocca la scena per avanzare.</p>
</div>
<script>${JS}</script></body></html>`;
fs.writeFileSync(path.join(__dirname, '..', 'prototipo.html'), html);
console.log('prototipo.html', (html.length / 1024).toFixed(0) + ' KB');
