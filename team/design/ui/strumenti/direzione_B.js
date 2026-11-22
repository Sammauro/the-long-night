// Direzione B — "Il Registro": strati. Mappa ruotata di lato (si avanza da sinistra a destra) in alto,
// Sequenza come striscia di pergamena a tutta larghezza nel mezzo, mano di carte scure in basso,
// colonna dell'altare a destra con risorse, Plancia e Conferma.
'use strict';
const L = require('./lib');
const { ico, sigillo, hexPoly, svgPerso } = L;

// geometria: esagoni a lato piatto, stanza ruotata di 90° (R1 a sinistra, E1 in alto), vista inclinata 0.44
const WV = 80, HF = WV * Math.sqrt(3) / 2, CS = 0.75 * WV, S = 0.44;
const MAP = { x: 0, y: 28, w: 512, h: 200 };
const X0 = 6, Y0 = 29;
const cx = (R) => X0 + (R - 1) * CS + WV / 2;
const cy = (R, E) => Y0 + ((E - 1) * HF + HF / 2 + (R % 2 ? HF / 2 : 0)) * S;

const TAG = { // angolo in alto a sinistra, coordinate dello schermo
  Z1: { x: 104, y: 64 }, Z2: { x: 40, y: 184 }, Z3: { x: 364, y: 31 }, Z4: { x: 364, y: 160 }, Z5: { x: 414, y: 104 },
};

function mappa() {
  let cells = '', ter = '', dest = '', paths = '', figs = '', leaders = '';
  for (let E = 1; E <= 6; E++) for (let R = 1; R <= 8; R++) {
    cells += `<polygon class="casella" data-casella="R${R}E${E}" points="${hexPoly(cx(R), cy(R, E), WV / 2 - 1.5, S, true)}"/>`;
  }
  L.TERRENO.trappole.forEach(([R, E]) => {
    ter += `<polygon class="trappola" points="${hexPoly(cx(R), cy(R, E), WV / 2 - 8, S, true)}"/>` +
      `<use href="#i-trappola" class="ico-trappola" x="${cx(R) - 9}" y="${cy(R, E) - 9}" width="18" height="18"/>`;
  });
  const items = [];
  L.TERRENO.colonne.forEach(([R, E]) => items.push({ y: cy(R, E), svg: `<g class="colonna"><ellipse cx="${cx(R)}" cy="${cy(R, E) + 2}" rx="15" ry="6"/><rect x="${cx(R) - 9}" y="${cy(R, E) - 32}" width="18" height="34" rx="2"/><rect x="${cx(R) - 12}" y="${cy(R, E) - 36}" width="24" height="6"/></g>` }));
  Object.entries(L.NEMICI).forEach(([id, n]) => {
    const [R, E] = n.at;
    if (n.path.length) {
      const pts = [[R, E]].concat(n.path).map(([r, e]) => `${cx(r).toFixed(1)},${(cy(r, e) - 1).toFixed(1)}`).join(' ');
      paths += `<polyline class="percorso ${n.reach ? 'colpisce' : ''}" points="${pts}" marker-end="url(#frecciaB${n.reach ? 'R' : 'G'})"/>`;
      const [dr, de] = n.path[n.path.length - 1];
      dest += `<polygon class="arrivo ${n.reach ? 'colpisce' : ''}" points="${hexPoly(cx(dr), cy(dr, de), WV / 2 - 5, S, true)}"/>` +
        `<text class="arrivo-l ${n.reach ? 'colpisce' : ''}" x="${cx(dr) + 22}" y="${cy(dr, de) + 5}" text-anchor="middle">${id}</text>`;
    }
    let pips = '';
    for (let i = 0; i < n.hp; i++) pips += `<rect x="${cx(R) - 15 + i * 5}" y="${cy(R, E) + 5}" width="4" height="3" class="pip"/>`;
    items.push({ y: cy(R, E), svg: svgPerso(cx(R), cy(R, E), 0.95, 'zombie') + pips });
    const t = TAG[id];
    const tx = t.x + (t.x > cx(R) ? 0 : (t.riga ? 150 : 96)), ty = t.y + (t.riga ? 14 : 17);
    leaders += `<line class="aggancio" x1="${tx}" y1="${ty}" x2="${cx(R) + (t.x > cx(R) ? 8 : -8)}" y2="${cy(R, E) - 16}"/>`;
  });
  const [pr, pe] = L.GIOCATORE.at;
  items.push({ y: cy(pr, pe), svg: `<circle cx="${cx(pr) + 10}" cy="${cy(pr, pe) - 12}" r="28" class="alone"/>` + svgPerso(cx(pr), cy(pr, pe), 0.95, 'giocatore') });
  items.sort((a, b) => a.y - b.y);
  figs = items.map(i => i.svg).join('');
  return `<svg class="mappa-svg" width="844" height="390" viewBox="0 0 844 390">
    <defs>
      <marker id="frecciaBR" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="#e2705f"/></marker>
      <marker id="frecciaBG" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="#8a7f9a"/></marker>
      <radialGradient id="lumeB" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#c9a84c" stop-opacity=".3"/><stop offset="1" stop-color="#c9a84c" stop-opacity="0"/></radialGradient>
      <linearGradient id="nebbia" x1="0" x2="1"><stop offset=".55" stop-color="#151519" stop-opacity="0"/><stop offset="1" stop-color="#151519" stop-opacity=".55"/></linearGradient>
    </defs>
    <g class="celle">${cells}</g>${ter}${dest}${paths}${leaders}${figs}</svg>`;
}

function etichette() {
  return Object.entries(L.NEMICI).map(([id, n]) => {
    const t = TAG[id];
    let riga2;
    if (n.reach) riga2 = `<b class="danno">−${n.dmg} HP</b><span class="a-te">a te</span>`;
    else if (n.scudi) riga2 = `<span class="scudi">${ico('scudo')} +${n.scudi} Scudi</span>`;
    else riga2 = `<span class="manca">non ti raggiunge</span>`;
    if (t.riga) {
      return `<div class="minaccia riga ${n.reach ? 'forte' : 'debole'}" style="left:${t.x - MAP.x}px;top:${t.y - MAP.y}px" data-tocco="nemico ${id}">
        ${sigillo(id, 22)}${ico(n.ico)}<span class="az">${n.azione}</span>${riga2}</div>`;
    }
    return `<div class="minaccia ${n.reach ? 'forte' : 'debole'}" style="left:${t.x - MAP.x}px;top:${t.y - MAP.y}px" data-tocco="nemico ${id}">
      <div class="m1">${sigillo(id, 22)}${ico(n.ico)}<span class="az">${n.azione}</span></div>
      <div class="m2">${riga2}</div></div>`;
  }).join('');
}

function registro(piano) {
  const P = L.PIANI[piano];
  return `<section class="registro" data-pannello="sequenza">` + L.SEQ.map((d) => {
    if (d.owner !== 'P') {
      const n = L.NEMICI[d.owner];
      return `<div class="voce nem ${n.reach ? 'colpisce' : ''}" data-tocco="dado ${d.owner}">
        <span class="r-su">${sigillo(d.owner, 22, { cls: 'piccolo' })}</span>
        <span class="sigillo-cera"><b>${d.value}</b>${ico(n.ico, 'angolo')}</span>
        <span class="r-giu">${n.azione}${n.reach ? ` <b>−${n.dmg}</b>` : ''}</span></div>`;
    }
    const kept = !!P.keep[d.uid], info = P.dice[d.uid] || {};
    const tieni = info.nessuno ? 'nessuno slot' : info.slot ? `Slot ${info.slot}` : (info.label || '');
    return `<div class="voce mio ${kept ? 'tenuto' : 'scartato'} ${info.nessuno ? 'conflitto' : ''} k-${d.kind}" data-tocco="dado ${d.uid}" role="button" aria-pressed="${kept}">
      <span class="r-su ${kept ? 'scelto' : ''}">${tieni}</span>
      <span class="osso"><b>${d.value}</b>${ico(L.TIPI[d.kind].ico, 'angolo')}</span>
      <span class="r-giu ${kept ? '' : 'scelto'}">${L.SCARTO[d.kind]}</span></div>`;
  }).join('') + `</section>`;
}

function altare(piano) {
  const P = L.PIANI[piano];
  const luce = P.luce[0] === P.luce[1] ? `${P.luce[0]}` : `${P.luce[0]}<i>→</i>${P.luce[1]}`;
  const slots = [1, 2, 3, 4].map(n => {
    const uid = Object.keys(P.dice).find(u => P.dice[u].slot === n);
    const d = uid && L.SEQ.find(x => x.uid === uid);
    return `<div class="nicchia ${d ? 'piena' : ''} k-${L.SLOT_TIPO[n]}" data-tocco="slot ${n}"><span class="n">Slot ${n}</span>${ico(L.TIPI[L.SLOT_TIPO[n]].ico, 'tipo')}${d ? `<b>${d.value}</b>` : ''}</div>`;
  }).join('');
  const azione = P.ok
    ? `<button class="primario" data-tocco="conferma" data-primario>Conferma i dadi<small>tieni ${P.tieni}, scarti ${P.scarti}: ${P.guadagno}</small></button>`
    : `<div class="motivo" role="status">${P.motivo.replace('🔥 2', ico('fuoco') + ' 2').replace('due 🔥', 'due ' + ico('fuoco'))}</div>
       <button class="primario spento" data-tocco="conferma" data-primario aria-disabled="true">Conferma i dadi<small>non disponibile</small></button>`;
  return `<aside class="altare" data-pannello="altare">
    <div class="risorse">
      <div class="r hp">${ico('hp')}<span>HP</span><b>10<small>/10</small></b></div>
      <div class="r pt">${ico('pt')}<span>PT</span><b>${P.pt[1]}</b></div>
      <div class="r pm">${ico('pm')}<span>PM</span><b>${P.pm[1]}</b></div>
      <div class="r salto">${ico('salto')}<span>Salto</span><b>0</b></div>
      <div class="r luce">${ico('luce')}<span>Luce</span><b>${luce}</b></div>
    </div>
    <div class="nicchie">${slots}</div>
    <p class="legenda">Danni sulla mappa: se nulla cambia prima del loro turno</p>
    <div class="az-principale">${azione}</div>
  </aside>`;
}

function mano() {
  return `<section class="mano" data-pannello="mano">` + L.MANO.map(c => `
    <article class="carta f-${c.fam}" data-tocco="carta ${c.nome}">
      <h3>${c.nome}<span class="cd">CD ${c.cd}</span></h3>
      <div class="azioni">${c.az.map(a => `<p class="azione">${L.costo(a.c)} ${a.t}</p>`).join('')}</div>
      <p class="eco">${ico('eco')}<i>Eco</i> ${c.eco}</p>
    </article>`).join('') + `</section>`;
}

function palco(piano) {
  return `<div class="palco st-${piano}" id="${piano}">
  <header class="orienta" data-pannello="orientamento">
    <span class="turno">Turno <span class="num">1</span></span><span class="fase">Selezione</span>
    <span class="istr">${piano === 'proposta' ? 'Scegli quali dadi tenere: tocca un dado per tenerlo o scartarlo.' : 'Due dadi Fuoco e un solo slot Fuoco: scartane uno.'}</span>
    <span class="veglia"><svg class="candela" width="20" height="22" viewBox="0 0 20 22"><rect x="6" y="8" width="8" height="14" class="cera"/><path d="M10 0c2 2.5 3 4.5 1 7-1 1-3 .8-3-1 0-2 2-3 2-6z" class="fiamma"/></svg>
      <span>Veglia 1/6</span><span class="posta">entro la Veglia: 2 Soste</span></span>
  </header>
  <div id="mappa" data-pannello="mappa">${mappa()}${etichette()}</div>
  ${altare(piano)}
  ${registro(piano)}
  ${mano()}
</div>`;
}

const CSS = `
.orienta{position:absolute;left:0;top:0;width:844px;height:28px;display:flex;align-items:baseline;gap:8px;padding:5px 10px 0;border-bottom:1px solid var(--filo)}
.orienta .turno{font-family:var(--f-titolo);font-size:16px;color:var(--oro)}
.orienta .fase{font-family:var(--f-titolo);font-size:16px}
.orienta .istr{font-size:13px;margin-left:6px}
.st-rifiuto .orienta .istr{color:var(--sangue-vivo)}
.veglia{margin-left:auto;display:flex;align-items:center;gap:6px;font-size:12px;align-self:center;margin-top:-6px}
.veglia .posta{color:var(--cenere)}
.candela .cera{fill:#d9cfb6}.candela .fiamma{fill:var(--oro)}

#mappa{position:absolute;left:0;top:28px;width:512px;height:202px}
#mappa .mappa-svg{position:absolute;left:0;top:-28px;pointer-events:none}
.casella{fill:#1d1b22;stroke:#34303f;stroke-width:1}
.trappola{fill:none;stroke:#6b5a3a;stroke-width:1.2;stroke-dasharray:3 2}
.ico-trappola{fill:#8b7448}
.colonna ellipse{fill:#0e0d10}.colonna rect{fill:#3b3644;stroke:#4c4656}
.arrivo{fill:none;stroke:#7d7290;stroke-width:1.5;stroke-dasharray:4 3}
.arrivo.colpisce{stroke:var(--sangue-vivo);fill:rgba(184,64,64,.16)}
.arrivo-l{font:700 12px var(--f-testo);fill:#a59bb5}
.arrivo-l.colpisce{fill:var(--sangue-vivo)}
.percorso{fill:none;stroke:#8a7f9a;stroke-width:1.6;stroke-dasharray:2 4;stroke-linecap:round}
.percorso.colpisce{stroke:var(--sangue-vivo)}
.aggancio{stroke:#5d5468;stroke-width:1}
.figura .ombra{fill:#000;opacity:.55}
.zombie .corpo{fill:#3d4a38}.zombie .testa{fill:#4c5a45}.zombie .occhio{fill:#ff5a4a}
.giocatore .corpo{fill:#4b4560}.giocatore .testa{fill:#d8c7a8}.giocatore .cappello{fill:#25222e}.giocatore .lanterna{fill:#f3c45b}
.alone{fill:url(#lumeB)}
.pip{fill:#b84040}
.altare .legenda{margin-top:4px;font-size:12px;font-style:italic;color:var(--cenere)}

.minaccia{position:absolute;width:96px;min-height:44px;padding:2px 4px 3px 4px;background:rgba(18,16,22,.94);border-top:2px solid #6b6178;line-height:1}
.minaccia.forte{border-top-color:var(--sangue-vivo);background:rgba(40,16,18,.95)}
.minaccia .m1{display:flex;align-items:center;gap:4px;height:22px}
.minaccia .ico{width:13px;height:13px;color:#b9aec8}
.minaccia .az{font-size:13px;font-weight:700}
.minaccia .m2{font-size:12px;height:14px;display:flex;align-items:baseline;gap:4px}
.minaccia.riga{width:150px;display:flex;align-items:center;gap:4px;height:28px;padding:2px 6px 2px 3px;font-size:12px;white-space:nowrap}
.minaccia .danno{font-size:15px;font-weight:800;color:var(--sangue-vivo)}
.minaccia .a-te{color:#d9a39a}
.minaccia .manca{color:var(--cenere)}
.minaccia .scudi{color:#8cc0e6}.minaccia .scudi .ico{width:12px;height:12px;color:#8cc0e6}
.sigillo{flex:none}
.sigillo .forma>*{fill:#3a1616;stroke:var(--sangue-vivo);stroke-width:1.3}
.sigillo text{font:800 12px var(--f-testo);fill:#f1d6cf}
.minaccia.debole .sigillo .forma>*{fill:#241f2b;stroke:#8a7f9a}
.minaccia.debole .sigillo text{fill:var(--osso)}

.altare{position:absolute;left:516px;top:28px;width:328px;height:202px;padding:5px 8px 0 8px;display:flex;flex-direction:column;border-left:1px solid var(--filo);background:linear-gradient(90deg,#18161d,#151519)}
.risorse{display:grid;grid-template-columns:repeat(5,1fr);gap:2px}
.r{display:grid;grid-template-columns:auto 1fr;grid-template-rows:14px 24px;column-gap:3px;align-items:center;font-size:12px;color:var(--cenere)}
.r .ico{width:13px;height:13px}
.r b{grid-column:1 / 3;font-size:21px;font-weight:800;color:var(--osso);line-height:24px}
.r b small{font-size:12px;color:var(--cenere);font-weight:500}
.r b i{font-style:normal;color:var(--oro);font-size:15px;margin:0 2px}
.r.hp .ico{color:var(--sangue-vivo)}.r.pt .ico{color:var(--terrore)}.r.luce .ico,.r.luce b{color:var(--oro)}
.nicchie{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-top:4px}
.nicchia{position:relative;height:46px;border:1px dashed #4a4258;color:#6d6380;display:flex;align-items:flex-end;justify-content:center;padding-bottom:2px}
.nicchia .n{position:absolute;left:4px;top:2px;font-size:12px}
.nicchia .tipo{position:absolute;right:4px;top:3px;width:15px;height:15px}
.nicchia.piena{border:1px solid var(--oro-cupo);background:#211d17}
.nicchia.piena .n{color:var(--oro)}
.nicchia.piena b{font-size:22px;font-weight:800;color:var(--osso);line-height:26px}
.nicchia.k-fuoco .tipo{color:var(--fuoco)}.nicchia.k-terrore .tipo{color:var(--terrore)}.nicchia.k-vigore .tipo{color:var(--osso)}
.az-principale{margin-top:auto;padding-bottom:6px;display:flex;flex-direction:column;gap:4px}
.primario{height:56px;border:0;background:var(--oro);color:#1a140a;font:700 17px var(--f-testo);display:flex;flex-direction:column;align-items:center;justify-content:center}
.primario small{font-size:12px;font-weight:500}
.primario.spento{background:#2c2833;color:#9a90a8;height:44px;flex:none}
.motivo{font-size:12px;line-height:14px;color:#f0c2b9;background:#2a1517;border-left:3px solid var(--sangue-vivo);padding:3px 6px}
.motivo .ico{width:12px;height:12px;color:var(--fuoco)}

.registro{position:absolute;left:0;top:230px;width:844px;height:80px;display:flex;justify-content:space-between;padding:0 10px;
  background:linear-gradient(180deg,#d8c9a3,#cbb98f);color:var(--inchiostro);border-top:2px solid #8a7444;border-bottom:2px solid #8a7444}
.voce{width:78px;display:flex;flex-direction:column;align-items:center;padding-top:2px}
.voce .r-su,.voce .r-giu{font-size:12px;line-height:14px;height:16px;padding:0 4px;white-space:nowrap;display:flex;align-items:center;gap:3px}
.osso{flex:none;position:relative;width:46px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:6px;background:#f4eddc;border:1.5px solid #3a2e20;margin:1px 0}
.osso b,.sigillo-cera b{font-size:28px;font-weight:800;line-height:1}
.osso .angolo,.sigillo-cera .angolo{position:absolute;right:3px;top:3px;width:13px;height:13px}
.mio.k-fuoco .angolo{color:#b3501c}.mio.k-terrore .angolo{color:#5d3f9e}.mio.k-vigore .angolo{color:#3b2f22}
.mio .scelto{border:1.5px solid var(--inchiostro);font-weight:800;border-radius:8px}
.mio .r-su:not(.scelto),.mio .r-giu:not(.scelto){color:#6a5a40}
.mio.tenuto .osso{box-shadow:0 0 0 2px #8a6a1c}
.mio.scartato .osso{background:repeating-linear-gradient(135deg,#b9ab89 0 3px,#a89a77 3px 6px);border-style:dashed;color:#4a3f2e}
.mio.scartato .osso::after{content:'';position:absolute;inset:6px;background:linear-gradient(45deg,transparent 47%,#2a2017 47% 53%,transparent 53%)}
.mio.conflitto .osso{box-shadow:0 0 0 2px #a52b22}
.mio.conflitto .r-su{color:#8f1f16!important;border-color:#8f1f16}
.sigillo-cera{flex:none;position:relative;width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 40% 35%,#9c3a33,#6b201c);color:#f6e2d8;margin:1px 0;box-shadow:inset 0 0 0 3px rgba(0,0,0,.18)}
.nem:not(.colpisce) .sigillo-cera{background:radial-gradient(circle at 40% 35%,#6f5f6b,#463a45)}
.sigillo-cera .angolo{color:#f0c9bf;right:4px;top:4px;width:12px;height:12px}
.nem .r-giu{color:#5a4a39}
.nem.colpisce .r-giu{color:#8f1f16;font-weight:700}
.nem .r-giu b{font-weight:800}
.registro .sigillo .forma>*{fill:#7a231d;stroke:#4a120e}
.registro .sigillo text{fill:#fbe7df}
.registro .nem:not(.colpisce) .sigillo .forma>*{fill:#5c4f5a;stroke:#3a3038}

.mano{position:absolute;left:0;top:310px;width:844px;height:80px;display:flex;gap:4px;padding:3px 4px 0}
.carta{flex:1;min-width:0;height:76px;background:#201d27;border:1px solid #3a3446;border-top:2px solid #4a4256;padding:0 5px 0 6px;display:flex;flex-direction:column;color:#ddd5c4}
.carta h3{font-family:var(--f-titolo);font-weight:400;font-size:14px;line-height:16px;color:#e9dcb8;display:flex;justify-content:space-between;white-space:nowrap}
.carta .cd{font-family:var(--f-testo);font-size:12px;font-weight:700;color:var(--cenere)}
.azioni{height:42px;overflow:hidden}
.azione{font-size:12px;line-height:14px}
.costo{display:inline-flex;align-items:center;gap:1px;font-weight:800;padding:0 2px;margin-right:1px;border:1px solid #5a5068;line-height:12px}
.costo .ico{width:12px;height:12px}
.c-fuoco .ico{color:var(--fuoco)}.c-forza .ico{color:var(--osso)}.c-presagio .ico{color:var(--terrore)}
.costo.gratis{font-style:italic}.costo.pt{color:var(--terrore);border-color:#5d4a86}
.carta .eco{font-size:12px;line-height:15px;border-top:1px dashed #4a4256;color:#c9bfa9;white-space:nowrap;overflow:hidden}
.carta .eco i{color:var(--cenere);margin:0 3px 0 1px}
.carta .eco .ico{width:11px;height:11px;color:var(--cenere)}
`;

function page() {
  return `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=844">
<title>TLN · Direzione B · Il Registro · Selezione (telefono 844×390)</title>${L.FONTS}
<style>${L.TOKENS}${CSS}
.didascalia{width:844px;margin:14px auto 6px;font:500 13px var(--f-testo);color:#9a90a8}
body.solo .didascalia{display:none} body.solo .palco{display:none} body.solo .palco.vis{display:block}
</style></head><body>
${L.ICONS}
<p class="didascalia">Stato iniziale della Selezione (SP1): proposta già fatta, nessun dado con slot libero è scartato.</p>
${palco('proposta')}
<p class="didascalia">Dopo un tocco sul dado Fuoco 1: due dadi Fuoco per uno slot, Conferma spento con il motivo.</p>
${palco('rifiuto')}
<script>(function(){var q=new URLSearchParams(location.search).get('stato');if(q){document.body.classList.add('solo');var e=document.getElementById(q);if(e)e.classList.add('vis');}})();</script>
</body></html>`;
}

module.exports = { page };
if (require.main === module) {
  require('fs').writeFileSync(require('path').join(__dirname, '..', 'direzione_B_selezione_telefono.html'), page());
  console.log('scritto direzione_B_selezione_telefono.html');
}
