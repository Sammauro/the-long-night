// Direzione A — "Il Rosario": colonne. Mappa diritta al centro, mano come registro di strisce a destra,
// Sequenza come rosario di dadi d'osso lungo tutto il bordo basso, Conferma in fondo al rosario.
'use strict';
const L = require('./lib');
const { ico, sigillo, hexPoly, svgPerso } = L;

// geometria: esagoni a punta in su, vista inclinata come la camera del gioco
const W = 60, HN = W * 2 / Math.sqrt(3), RS = 0.75 * HN, S = 0.62;
const MAP = { x: 104, y: 30, w: 442, h: 270 };
const X0 = MAP.x + (MAP.w - 6.5 * W) / 2, Y0 = MAP.y + 1;
const cx = (R, E) => X0 + (E - 1) * W + W / 2 + (R % 2 ? W / 2 : 0);
const cy = (R) => Y0 + ((8 - R) * RS + HN / 2) * S;

// posizione delle etichette di minaccia (angolo in alto a sinistra) e punto d'aggancio
const TAG = {
  Z1: { x: 150, y: 146 }, Z2: { x: 442, y: 196 }, Z3: { x: 106, y: 96 }, Z4: { x: 420, y: 38 }, Z5: { x: 254, y: 36 },
};

function mappa() {
  let cells = '', ter = '', dest = '', paths = '', figs = '', leaders = '';
  for (let R = 8; R >= 1; R--) for (let E = 1; E <= 6; E++) {
    cells += `<polygon class="casella" data-casella="R${R}E${E}" points="${hexPoly(cx(R, E), cy(R), HN / 2 - 1, S)}"/>`;
  }
  L.TERRENO.trappole.forEach(([R, E]) => {
    ter += `<polygon class="trappola" points="${hexPoly(cx(R, E), cy(R), HN / 2 - 6, S)}"/>` +
      `<use href="#i-trappola" class="ico-trappola" x="${cx(R, E) - 9}" y="${cy(R) - 8}" width="18" height="18"/>`;
  });
  L.TERRENO.colonne.forEach(([R, E]) => {
    ter += `<g class="colonna"><ellipse cx="${cx(R, E)}" cy="${cy(R) + 2}" rx="15" ry="6"/><rect x="${cx(R, E) - 9}" y="${cy(R) - 34}" width="18" height="36" rx="2"/><rect x="${cx(R, E) - 12}" y="${cy(R) - 38}" width="24" height="6"/></g>`;
  });
  Object.entries(L.NEMICI).forEach(([id, n]) => {
    const [R, E] = n.at;
    if (n.path.length) {
      const pts = [[R, E]].concat(n.path).map(([r, e]) => `${cx(r, e).toFixed(1)},${(cy(r) - 2).toFixed(1)}`).join(' ');
      paths += `<polyline class="percorso ${n.reach ? 'colpisce' : ''}" points="${pts}" marker-end="url(#freccia${n.reach ? 'R' : 'G'})"/>`;
      const [dr, de] = n.path[n.path.length - 1];
      dest += `<polygon class="arrivo ${n.reach ? 'colpisce' : ''}" points="${hexPoly(cx(dr, de), cy(dr), HN / 2 - 4, S)}"/>` +
        `<text class="arrivo-l ${n.reach ? 'colpisce' : ''}" x="${cx(dr, de) + (n.reach ? 0 : 0)}" y="${cy(dr) + 13}" text-anchor="middle">${id}</text>`;
    }
    figs += svgPerso(cx(R, E), cy(R), 1, 'zombie');
    // tacche HP sotto la figura (6/6)
    let pips = '';
    for (let i = 0; i < n.hp; i++) pips += `<rect x="${cx(R, E) - 15 + i * 5}" y="${cy(R) + 6}" width="4" height="3" class="pip"/>`;
    figs += pips;
    const t = TAG[id];
    
    leaders += `<line class="aggancio" x1="${Math.min(Math.max(cx(R, E), t.x + 8), t.x + 96)}" y1="${t.y + 17 < cy(R) - 20 ? t.y + 34 : t.y + 17}" x2="${cx(R, E)}" y2="${cy(R) - 20}"/>`;
  });
  const [pr, pe] = L.GIOCATORE.at;
  figs += `<circle cx="${cx(pr, pe) + 11}" cy="${cy(pr) - 12}" r="26" class="alone"/>` + svgPerso(cx(pr, pe), cy(pr), 1, 'giocatore');
  return `<svg class="mappa-svg" width="844" height="390" viewBox="0 0 844 390">
    <defs>
      <marker id="frecciaR" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="#e2705f"/></marker>
      <marker id="frecciaG" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="#8a7f9a"/></marker>
      <radialGradient id="lume" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#c9a84c" stop-opacity=".28"/><stop offset="1" stop-color="#c9a84c" stop-opacity="0"/></radialGradient>
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
    return `<div class="minaccia ${n.reach ? 'forte' : 'debole'}" style="left:${t.x - MAP.x}px;top:${t.y - MAP.y}px" data-tocco="nemico ${id}">
      <div class="m1">${sigillo(id, 24)}${ico(n.ico)}<span class="az">${n.azione}</span></div>
      <div class="m2">${riga2}</div></div>`;
  }).join('');
}

function rosario(piano) {
  const P = L.PIANI[piano];
  const cols = L.SEQ.map((d, i) => {
    if (d.owner !== 'P') {
      const n = L.NEMICI[d.owner];
      const sotto = n.reach ? `<span class="t-giu rosso">${n.azione} −${n.dmg}</span>` : `<span class="t-giu grigio">${n.azione}</span>`;
      return `<div class="perla nem ${n.reach ? 'colpisce' : ''}" data-tocco="dado ${d.owner}">
        <span class="t-su">${sigillo(d.owner, 22, { cls: 'piccolo' })}</span>
        <span class="faccia"><b>${d.value}</b>${ico(n.ico, 'angolo')}</span>${sotto}</div>`;
    }
    const kept = !!P.keep[d.uid], info = P.dice[d.uid] || {};
    const su = info.nessuno ? `<span class="t-su errore">nessuno slot</span>` : info.slot ? `<span class="t-su">Slot ${info.slot}</span>` : `<span class="t-su spento">${info.label || ''}</span>`;
    const giu = `<span class="t-giu ${kept ? 'spento' : 'resa'}">${L.SCARTO[d.kind]}</span>`;
    return `<div class="perla mio ${kept ? 'tenuto' : 'scartato'} ${info.nessuno ? 'conflitto' : ''} k-${d.kind}" data-tocco="dado ${d.uid}" role="button" aria-pressed="${kept}">
      ${su}<span class="faccia"><b>${d.value}</b>${ico(L.TIPI[d.kind].ico, 'angolo')}</span>${giu}</div>`;
  }).join('');
  const btn = P.ok
    ? `<button class="primario" data-tocco="conferma" data-primario>Conferma i dadi<small>tieni ${P.tieni}, scarti ${P.scarti}: ${P.guadagno}</small></button>`
    : `<div class="motivo" role="status">${P.motivo.replace('🔥 2', ico('fuoco') + ' 2').replace('due 🔥', 'due ' + ico('fuoco'))}</div>
       <button class="primario spento" data-tocco="conferma" data-primario aria-disabled="true">Conferma i dadi<small>non disponibile</small></button>`;
  return `<section class="rosario" data-pannello="sequenza"><div class="filo"></div><div class="perle">${cols}</div><div class="sigillo-fine">${btn}</div></section>`;
}

function risorse(piano) {
  const P = L.PIANI[piano];
  const luce = P.luce[0] === P.luce[1] ? `${P.luce[0]}` : `${P.luce[0]}<span class="poi"> → ${P.luce[1]}</span>`;
  const slots = [1, 2, 3, 4].map(n => {
    const uid = Object.keys(P.dice).find(u => P.dice[u].slot === n);
    const d = uid && L.SEQ.find(x => x.uid === uid);
    return `<div class="nicchia ${d ? 'piena' : ''} k-${L.SLOT_TIPO[n]}" data-tocco="slot ${n}">
      <span class="n">${n}</span>${ico(L.TIPI[L.SLOT_TIPO[n]].ico, 'tipo')}${d ? `<b>${d.value}</b>` : ''}</div>`;
  }).join('');
  return `<aside class="colonna-sx" data-pannello="risorse">
    <div class="ris hp">${ico('hp')}<span class="l">HP</span><b>10<span class="max">/10</span></b></div>
    <div class="ris pt">${ico('pt')}<span class="l">PT</span><b>${P.pt[1]}</b></div>
    <div class="ris pm">${ico('pm')}<span class="l">PM</span><b>${P.pm[1]}</b></div>
    <div class="ris salto">${ico('salto')}<span class="l">Salto</span><b>0</b></div>
    <div class="ris luce">${ico('luce')}<span class="l">Luce</span><b>${luce}</b></div>
    <div class="plancia"><span class="tit">Plancia</span><div class="nicchie">${slots}</div></div>
    <p class="legenda">Danni sulla mappa: se nulla cambia prima del loro turno</p>
  </aside>`;
}

function mano() {
  return `<section class="mano" data-pannello="mano">` + L.MANO.map(c => `
    <article class="striscia f-${c.fam}" data-tocco="carta ${c.nome}">
      <div class="corpo"><h3>${c.nome}<span class="cd" title="Cooldown">CD ${c.cd}</span></h3>
        ${c.az.map(a => `<p class="azione">${L.costo(a.c)} ${a.t}</p>`).join('')}</div>
      <div class="matrice">${ico('eco')}<span class="eco-t">Eco</span><span class="eco">${c.eco.replace(' · ', '<br>')}</span></div>
    </article>`).join('') + `</section>`;
}

function palco(piano) {
  return `<div class="palco st-${piano}" id="${piano}">
  <header class="orienta" data-pannello="orientamento">
    <span class="turno">Turno <span class="num">1</span></span><span class="fase">Selezione</span>
    <span class="istr">${piano === 'proposta' ? 'Scegli quali dadi tenere: tocca un dado per tenerlo o scartarlo.' : 'Due dadi Fuoco e un solo slot Fuoco: scartane uno.'}</span>
    <span class="veglia"><svg class="candela" width="76" height="16" viewBox="0 0 76 16">${[0, 1, 2, 3, 4, 5].map(i => `<rect x="${4 + i * 12}" y="5" width="11" height="7" class="${i === 0 ? 'arsa' : 'cera'}"/>`).join('')}<path d="M70 2c2 2 3 4 1 7-1 1-3 1-3-1 0-2 2-3 2-6z" class="fiamma"/></svg>
      <span>Veglia 1/6</span><span class="posta">entro la Veglia: 2 Soste</span></span>
  </header>
  ${risorse(piano)}
  <div id="mappa" data-pannello="mappa">${mappa()}${etichette()}</div>
  ${mano()}
  ${rosario(piano)}
</div>`;
}

const CSS = `
.orienta{position:absolute;left:0;top:0;width:844px;height:30px;display:flex;align-items:baseline;gap:8px;padding:6px 10px 0;border-bottom:1px solid var(--filo);background:linear-gradient(#1b1920,#151519)}
.orienta .turno{font-family:var(--f-titolo);font-size:16px;color:var(--oro)}
.orienta .fase{font-family:var(--f-titolo);font-size:16px}
.orienta .istr{font-size:13px;color:var(--osso);margin-left:6px}
.st-rifiuto .orienta .istr{color:var(--sangue-vivo)}
.veglia{margin-left:auto;display:flex;align-items:center;gap:6px;font-size:12px;color:var(--osso);align-self:center;margin-top:-4px}
.veglia .posta{color:var(--cenere)}
.candela .cera{fill:#d9cfb6}.candela .arsa{fill:#3a3340}.candela .fiamma{fill:var(--oro)}

.colonna-sx{position:absolute;left:0;top:30px;width:104px;height:272px;padding:8px 8px 0 10px;border-right:1px solid var(--filo)}
.ris{display:grid;grid-template-columns:18px 1fr auto;align-items:center;height:23px;font-size:12px;color:var(--cenere)}
.ris .ico{width:15px;height:15px}
.ris b{font-size:17px;color:var(--osso);font-weight:800}
.ris .max{font-size:12px;color:var(--cenere);font-weight:500}
.ris.hp .ico{color:var(--sangue-vivo)}.ris.pt .ico{color:var(--terrore)}.ris.pm .ico{color:var(--osso)}.ris.salto .ico{color:var(--cenere)}.ris.luce .ico{color:var(--oro)}
.ris.luce b{color:var(--oro)}.ris .poi{color:var(--oro)}
.plancia{margin-top:6px}
.plancia .tit{font-family:var(--f-titolo);font-style:italic;font-size:13px;color:var(--cenere)}
.nicchie{display:grid;grid-template-columns:44px 44px;gap:3px;margin-top:3px}
.nicchia{position:relative;height:44px;border:1px dashed #4a4258;display:flex;align-items:center;justify-content:center;color:#6d6380}
.nicchia .n{position:absolute;left:3px;top:1px;font-size:12px}
.nicchia .tipo{width:16px;height:16px;position:absolute;right:3px;top:3px}
.nicchia.piena{border:1px solid var(--oro-cupo);background:#211d17;color:var(--oro)}
.nicchia.piena b{font-size:20px;font-weight:800;color:var(--osso);margin-top:8px}
.nicchia.k-fuoco .tipo{color:var(--fuoco)}.nicchia.k-terrore .tipo{color:var(--terrore)}

#mappa{position:absolute;left:104px;top:30px;width:442px;height:272px}
#mappa .mappa-svg{position:absolute;left:-104px;top:-30px;pointer-events:none}
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
.alone{fill:url(#lume)}
.pip{fill:#b84040}

.minaccia{position:absolute;width:104px;padding:3px 5px 3px 4px;background:rgba(18,16,22,.94);border-left:3px solid #6b6178;line-height:1}
.minaccia.forte{border-left-color:var(--sangue-vivo);background:rgba(40,16,18,.95)}
.minaccia .m1{display:flex;align-items:center;gap:4px;height:24px}
.minaccia .m1 .ico{width:14px;height:14px;color:#b9aec8}
.minaccia .az{font-size:13px;font-weight:700}
.minaccia .m2{font-size:12px;height:15px;display:flex;align-items:baseline;gap:4px;padding-left:2px}
.minaccia .danno{font-size:15px;font-weight:800;color:var(--sangue-vivo)}
.minaccia .a-te{color:#d9a39a}
.minaccia .manca{color:var(--cenere)}
.minaccia .scudi{color:#8cc0e6}.minaccia .scudi .ico{width:12px;height:12px}
.sigillo{flex:none}
.sigillo .forma>*{fill:#3a1616;stroke:var(--sangue-vivo);stroke-width:1.3}
.sigillo text{font:800 12px var(--f-testo);fill:#f1d6cf}
.minaccia.debole .sigillo .forma>*{fill:#241f2b;stroke:#8a7f9a}
.minaccia.debole .sigillo text{fill:var(--osso)}
.legenda{margin-top:5px;font-size:12px;color:var(--cenere);font-style:italic;line-height:13px}

.mano{position:absolute;left:552px;top:31px;width:288px;height:270px;display:flex;flex-direction:column;gap:2px}
.striscia{position:relative;height:52px;display:flex;background:var(--carta);color:var(--inchiostro);clip-path:polygon(0 0,100% 0,100% 100%,3px 100%,0 92%,2px 70%,0 45%,2px 20%);filter:brightness(.82)}
.striscia .corpo{flex:1;padding:3px 6px 0 9px;min-width:0}
.striscia h3{font-family:var(--f-titolo);font-weight:400;font-size:14px;line-height:16px;display:flex;justify-content:space-between}
.striscia .cd{font-family:var(--f-testo);font-size:12px;font-weight:700;color:#5b4a33}
.azione{font-size:12px;line-height:14px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.f-terrore .azione,.f-free .azione{white-space:normal}
.costo{display:inline-flex;align-items:center;gap:1px;font-weight:800;padding:0 3px;margin-right:2px;border:1px solid #6e5b3e;border-radius:2px;line-height:12px}
.costo .ico{width:12px;height:12px}
.c-fuoco .ico{color:#b3501c}.c-forza .ico{color:#3b2f22}.c-presagio .ico{color:#5d3f9e}
.costo.gratis{font-weight:700;font-style:italic}
.costo.pt{color:#5d3f9e;border-color:#8c79b8}
.matrice{width:74px;border-left:1px dashed #7a6748;background:var(--carta-scura);padding:3px 5px;font-size:12px;line-height:14px;position:relative}
.matrice .ico{width:12px;height:12px;color:#5b4a33}
.matrice .eco-t{font-style:italic;color:#4e3f2b;margin-left:2px}
.matrice .eco{display:block;font-weight:700}

.rosario{position:absolute;left:0;top:302px;width:844px;height:88px;background:linear-gradient(#121116,#0e0d11);border-top:1px solid var(--oro-cupo)}
.filo{position:absolute;left:10px;width:574px;top:43px;height:2px;background:var(--oro-cupo)}
.perle{position:absolute;left:8px;top:0;display:flex;gap:2px}
.perla{position:relative;width:56px;height:88px;display:flex;flex-direction:column;align-items:center}
.perla .t-su,.perla .t-giu{font-size:12px;line-height:14px;height:16px;white-space:nowrap;display:flex;align-items:center}
.perla .t-su{margin-top:2px}
.faccia{position:relative;width:48px;height:48px;display:flex;align-items:center;justify-content:center;margin:2px 0}
.faccia b{font-size:28px;font-weight:800;line-height:1}
.faccia .angolo{position:absolute;right:3px;top:3px;width:13px;height:13px}
.mio .faccia{background:radial-gradient(circle at 35% 30%,#f3ecdd,#cfc3a8);color:#1b1610;border-radius:9px;box-shadow:inset 0 -3px 0 rgba(0,0,0,.18)}
.mio.k-fuoco .faccia .angolo{color:#b3501c}.mio.k-terrore .faccia .angolo{color:#5d3f9e}.mio.k-vigore .faccia .angolo{color:#3b2f22}
.mio.tenuto{transform:translateY(-3px)}
.mio.tenuto .faccia{outline:2px solid var(--oro);outline-offset:1px}
.mio.tenuto .t-su{color:var(--oro);font-weight:700}
.mio .t-giu.spento{color:#5f566c;text-decoration:line-through}
.mio.scartato{transform:translateY(5px)}
.mio.scartato .faccia{background:repeating-linear-gradient(135deg,#6e6656 0 3px,#575041 3px 6px);color:#d9d0bd;box-shadow:none}
.mio.scartato .t-su{color:#6d6380}
.mio .t-giu.resa{color:var(--oro);font-weight:700}
.mio.conflitto .faccia{outline:2px solid var(--sangue-vivo);outline-offset:1px}
.t-su.errore{color:var(--sangue-vivo)!important;font-weight:700}
.nem .faccia{background:#2a1517;border:1.5px solid #6a2b2b;color:#e9c9c2;border-radius:3px;width:44px;height:44px;margin:4px 0}
.nem.colpisce .faccia{border-color:var(--sangue-vivo)}
.nem .faccia .angolo{color:#c98f86}
.nem .t-giu.rosso{color:var(--sangue-vivo);font-weight:700}
.nem .t-giu.grigio{color:var(--cenere)}
.sigillo.piccolo text{font-size:12px}
.nem:not(.colpisce) .sigillo .forma>*{fill:#241f2b;stroke:#8a7f9a}
.nem:not(.colpisce) .sigillo text{fill:var(--osso)}
.sigillo-fine{position:absolute;left:596px;top:6px;width:240px;height:78px;display:flex;flex-direction:column;justify-content:flex-end;gap:4px}
.primario{width:240px;height:60px;border:0;background:var(--oro);color:#1a140a;font:700 17px var(--f-testo);display:flex;flex-direction:column;align-items:center;justify-content:center;clip-path:polygon(10px 0,100% 0,100% 100%,10px 100%,0 50%)}
.primario small{font-size:12px;font-weight:500}
.primario.spento{background:#2c2833;color:#9a90a8;height:44px;flex:none}
.motivo{font-size:12px;line-height:14px;color:#f0c2b9;background:#2a1517;border-left:3px solid var(--sangue-vivo);padding:2px 6px}
.motivo .ico{width:12px;height:12px;color:var(--fuoco)}
`;

function page() {
  return `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=844">
<title>TLN · Direzione A · Il Rosario · Selezione (telefono 844×390)</title>${L.FONTS}
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
  require('fs').writeFileSync(require('path').join(__dirname, '..', 'direzione_A_selezione_telefono.html'), page());
  console.log('scritto direzione_A_selezione_telefono.html');
}
