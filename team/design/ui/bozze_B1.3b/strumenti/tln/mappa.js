// Mappa: geometria esagonale (come la camera del gioco, punta in su, righe dispari spostate a destra),
// segni sopra la mappa (minacce, arrivi, percorsi, caselle raggiungibili, spinte) e posizionamento automatico
// delle etichette di minaccia senza coprire unità, arrivi, percorsi, costi o altre etichette (SPEC §5.4).
'use strict';
const { ico, sigillo, hexPoly, svgPerso, AZ_ICO, AZ_BREVE } = require('./base');

function geo(rect, W, S) {
  const HN = W * 2 / Math.sqrt(3), RS = 0.75 * HN;
  const gw = 6.5 * W, gh = (7 * RS + HN) * S;
  const X0 = (rect.w - gw) / 2, Y0 = rect.h - gh - rect.basso;
  const cx = (R, E) => X0 + (E - 1) * W + W / 2 + (R % 2 ? W / 2 : 0);
  const cy = (R) => Y0 + ((8 - R) * RS + HN / 2) * S;
  const box = (R, E) => ({ x: cx(R, E) - W / 2, y: cy(R) - HN / 2 * S, w: W, h: HN * S });
  return { W, HN, S, X0, Y0, gw, gh, cx, cy, box, sc: W / 60, rect };
}
const same = (a, b) => a && b && a[0] === b[0] && a[1] === b[1];
const area = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

// contenuto di un'etichetta di minaccia (anteprima in ordine di Sequenza, DM1)
function etichetta(a, n, P) {
  const r = { id: n.id, righe: [], cls: 'debole' };
  const nome = a && a.action ? AZ_BREVE[a.action] : null;
  r.testa = nome ? `${ico(AZ_ICO[a.action])}<span class="az">${nome}</span>` : `<span class="az spenta">ha agito</span>`;
  if (a && a.spento === 'stordito') { r.cls = 'spento'; r.righe.push('<span class="manca">Stordito: salta il dado</span>'); }
  else if (a && a.reach && (a.dmg || a.absorbed)) {
    r.cls = 'forte';
    r.righe.push(`<b class="danno">−${a.dmg} HP</b><span class="a-te">a te</span>${a.absorbed ? `<span class="scudo-a">${ico('scudo')}−${a.absorbed}</span>` : ''}`);
    const sp = [];
    if (a.orda) sp.push(`${a.base} + ${a.orda.length} Orda: ${a.orda.join(', ')} accanto`);
    if (P.stati.vuln && a.raw) sp.push(`${a.raw} ×2: sei Vulnerabile`);
    if (a.cura) sp.push(`si cura ${a.cura}`);
    if (a.contrattacco) sp.push(`Contrattacco: ${a.contrattacco} a ${n.id}`);
    if (sp.length) r.righe.push(`<span class="spiega">${sp.join('; ')}</span>`);
  } else if (a && a.shield) r.righe.push(`<span class="scudi">${ico('scudo')} +${a.shield} Scudi a sé</span>`);
  else if (a && a.trappola) r.righe.push(`<span class="manca">sulla trappola: −${a.trappola} a sé</span>`);
  else if (a) r.righe.push('<span class="manca">non ti raggiunge</span>');
  const st = statiNemico(n);
  if (st) r.righe.push(`<span class="stati">${st}</span>`);
  return r;
}
function statiNemico(n) {
  const s = n.stati || {}, out = [];
  const tot = (k) => (s[k] ? s[k][0] + s[k][1] : 0);
  if (tot('shield')) out.push(`${ico('scudo')}${tot('shield')} Scudi`);
  if (tot('vulnFire')) out.push(`${ico('vuln')}Vuln. Fuoco`);
  if (tot('vuln')) out.push(`${ico('vuln')}Vulnerabile`);
  if (tot('stun')) out.push(`${ico('stordito')}Stordito`);
  return out.join(' ');
}

// posizionamento: prova posizioni intorno allo sprite e sceglie quella che copre meno
function piazza(g, items, ostacoli, dim) {
  const placed = [];
  const R = { x: 2, y: 2, w: g.rect.w - 4, h: g.rect.h - 4 };
  items.forEach((it) => {
    const w = dim.w, h = dim.riga1 + it.righe.length * dim.riga;
    const ux = it.x, uy = it.y - 40 * g.sc; // testa dello sprite
    const cand = [];
    [[-w - 14, -h - 6], [14, -h - 6], [-w / 2, -h - 30 * g.sc], [-w - 22, -h / 2], [22, -h / 2], [-w - 14, 18], [14, 18], [-w / 2, 34 * g.sc],
      [-w - 40, -h - 20], [40, -h - 20], [-w - 50, 0], [50, 0]].forEach(([dx, dy]) => cand.push({ x: ux + dx, y: uy + dy, w, h }));
    let best = null;
    cand.forEach((c) => {
      let cost = 0;
      const fuori = (R.x - c.x > 0 ? R.x - c.x : 0) + (c.x + c.w - R.x - R.w > 0 ? c.x + c.w - R.x - R.w : 0) + (R.y - c.y > 0 ? R.y - c.y : 0) + (c.y + c.h - R.y - R.h > 0 ? c.y + c.h - R.y - R.h : 0);
      cost += fuori * 400;
      ostacoli.forEach((o) => { cost += area(c, o) * (o.peso || 1); });
      placed.forEach((p) => { cost += area(c, p) * 6; });
      cost += Math.hypot(c.x + c.w / 2 - ux, c.y + c.h / 2 - uy) * 0.6;
      if (!best || cost < best.cost) best = Object.assign({ cost }, c);
    });
    best.x = Math.max(R.x, Math.min(best.x, R.x + R.w - w)); best.y = Math.max(R.y, Math.min(best.y, R.y + R.h - h));
    it.pos = best; placed.push(best);
  });
}

// opts: minacce, raggiungibili, cella (toccata), spinta, bersagli, attivo, tracciato, evidenzia, morti, spenta
function scena(st, g, opts, dim) {
  opts = opts || {};
  const P = st.giocatore;
  let cells = '', ter = '', marks = '', paths = '', figs = '', segni = '';
  const ost = [];
  for (let R = 8; R >= 1; R--) for (let E = 1; E <= 6; E++) cells += `<polygon class="casella" data-casella="R${R}E${E}" points="${hexPoly(g.cx(R, E), g.cy(R), g.HN / 2 - 1, g.S)}"/>`;
  (st.terreno || []).forEach(({ at: [R, E], tipo }) => {
    if (tipo === 'trap') ter += `<polygon class="trappola" points="${hexPoly(g.cx(R, E), g.cy(R), g.HN / 2 - 5, g.S)}"/><use href="#i-trappola" class="ico-trappola" x="${g.cx(R, E) - 9 * g.sc}" y="${g.cy(R) - 8 * g.sc}" width="${18 * g.sc}" height="${18 * g.sc}"/>`;
    if (tipo === 'column') { const x = g.cx(R, E), y = g.cy(R), s = g.sc; ter += `<g class="colonna"><ellipse cx="${x}" cy="${y + 2}" rx="${15 * s}" ry="${6 * s}"/><rect x="${x - 9 * s}" y="${y - 34 * s}" width="${18 * s}" height="${36 * s}" rx="2"/><rect x="${x - 12 * s}" y="${y - 38 * s}" width="${24 * s}" height="${6 * s}"/></g>`; ost.push({ x: x - 12 * s, y: y - 38 * s, w: 24 * s, h: 40 * s, peso: 1 }); }
  });
  const ant = {}; (st.anteprima || []).forEach((a) => { if (!ant[a.owner]) ant[a.owner] = a; });
  // caselle raggiungibili con il costo in PM
  (opts.raggiungibili || []).forEach((r) => {
    const [R, E] = r.cell, sel = same(r.cell, opts.cella);
    marks += `<polygon class="ragg ${sel ? 'sel' : ''}" points="${hexPoly(g.cx(R, E), g.cy(R), g.HN / 2 - 3, g.S)}"/>`;
    marks += `<text class="costo-pm ${sel ? 'sel' : ''}" x="${g.cx(R, E)}" y="${g.cy(R) + 5 * g.sc}" text-anchor="middle">${r.pm}</text>`;
    ost.push(Object.assign(g.box(R, E), { peso: 3 }));
  });
  if (opts.cella && opts.raggiungibili) {
    const r = opts.raggiungibili.find((x) => same(x.cell, opts.cella));
    const pts = [P.pos].concat(r.passi.map((p) => p.cell)).map(([R, E]) => `${g.cx(R, E)},${g.cy(R)}`).join(' ');
    paths += `<polyline class="percorso mio" points="${pts}"/>`;
  }
  // spinte
  if (opts.spinta) opts.spinta.forEach((s) => {
    const [R, E] = s.cell, x = g.cx(R, E), y = g.cy(R);
    marks += `<polygon class="spinta ${s.status}" points="${hexPoly(x, y, g.HN / 2 - 3, g.S)}" data-tocco="spinta R${R}E${E}"/>`;
    ost.push(Object.assign(g.box(R, E), { peso: 4 }));
  });
  // nemici
  const items = [];
  st.nemici.forEach((n) => {
    if (!n.vivo) return;
    const [R, E] = n.pos, x = g.cx(R, E), y = g.cy(R), a = ant[n.id];
    const mostra = opts.minacce !== false;
    if (a && a.path && a.path.length && mostra && !a.spento) {
      const pts = [n.pos].concat(a.path).map(([r, e]) => `${g.cx(r, e).toFixed(1)},${(g.cy(r) - 2).toFixed(1)}`).join(' ');
      paths += `<polyline class="percorso ${a.reach ? 'colpisce' : ''} ${opts.attivo === n.id ? 'attivo' : ''}" points="${pts}" marker-end="url(#freccia${a.reach ? 'R' : 'G'})"/>`;
      const [dr, de] = a.end;
      marks += `<polygon class="arrivo ${a.reach ? 'colpisce' : ''}" points="${hexPoly(g.cx(dr, de), g.cy(dr), g.HN / 2 - 4, g.S)}"/><text class="arrivo-l ${a.reach ? 'colpisce' : ''}" x="${g.cx(dr, de)}" y="${g.cy(dr) + 13 * g.sc}" text-anchor="middle">${n.id}</text>`;
      ost.push(Object.assign(g.box(dr, de), { peso: 3 }));
      a.path.forEach(([r, e]) => ost.push({ x: g.cx(r, e) - 6, y: g.cy(r) - 6, w: 12, h: 12, peso: 2 }));
    }
    if (opts.tracciato && opts.tracciato.id === n.id) {
      const pts = opts.tracciato.path.map(([r, e]) => `${g.cx(r, e)},${g.cy(r) - 2}`).join(' ');
      paths += `<polyline class="percorso colpisce fatto" points="${pts}" marker-end="url(#frecciaR)"/>`;
    }
    const valido = opts.bersagli && opts.bersagli[n.id];
    if (opts.bersagli) segni += `<ellipse class="${valido === null ? 'bers-ok' : 'bers-no'} ${opts.bersaglio === n.id ? 'scelto' : ''}" cx="${x}" cy="${y + 1}" rx="${20 * g.sc}" ry="${8 * g.sc}"/>`;
    if (opts.attivo === n.id || opts.evidenzia === n.id) segni += `<ellipse class="agisce" cx="${x}" cy="${y + 1}" rx="${22 * g.sc}" ry="${9 * g.sc}"/>`;
    figs += svgPerso(x, y, g.sc, 'zombie');
    let pips = '';
    for (let i = 0; i < n.hpMax; i++) pips += `<rect x="${x - 15 * g.sc + i * 5 * g.sc}" y="${y + 6 * g.sc}" width="${4 * g.sc}" height="${3 * g.sc}" class="pip ${i < n.hp ? '' : 'vuoto'}"/>`;
    figs += pips;
    figs += `<g transform="translate(${x + 9 * g.sc},${y - 38 * g.sc})">${sigilloSvg(n.id, 16 * g.sc + 2, a && a.reach && (a.dmg || a.absorbed))}</g>`;
    ost.push({ x: x - 16 * g.sc, y: y - 44 * g.sc, w: 38 * g.sc, h: 54 * g.sc, peso: 4 });
    if (mostra && (a || statiNemico(n))) items.push(Object.assign(etichetta(a, n, P), { x, y }));
  });
  // giocatore
  const [pr, pe] = P.pos, px = g.cx(pr, pe), py = g.cy(pr);
  figs += `<circle cx="${px + 11 * g.sc}" cy="${py - 12 * g.sc}" r="${26 * g.sc}" class="alone"/>` + svgPerso(px, py, g.sc, 'giocatore');
  ost.push({ x: px - 20 * g.sc, y: py - 50 * g.sc, w: 44 * g.sc, h: 58 * g.sc, peso: 6 });
  // etichette
  items.sort((a, b) => (a.cls === 'forte' ? 0 : 1) - (b.cls === 'forte' ? 0 : 1));
  piazza(g, items, ost, dim);
  let html = '', leaders = '';
  items.forEach((it) => {
    const p = it.pos, cxl = Math.max(p.x, Math.min(it.x, p.x + p.w)), cyl = it.y - 44 * g.sc < p.y ? p.y : p.y + p.h;
    leaders += `<line class="aggancio ${it.cls}" x1="${cxl}" y1="${Math.max(p.y, Math.min(it.y - 44 * g.sc, p.y + p.h))}" x2="${it.x}" y2="${it.y - 36 * g.sc}"/>`;
    void cyl;
    html += `<div class="minaccia ${it.cls} ${opts.attivo === it.id ? 'attiva' : ''}" style="left:${p.x.toFixed(0)}px;top:${p.y.toFixed(0)}px" data-tocco="nemico ${it.id}">
      <div class="m1">${sigillo(it.id, dim.sig, it.cls === 'forte' ? '' : 'grigio')}${it.testa}</div>${it.righe.map((r) => `<div class="m2">${r}</div>`).join('')}</div>`;
  });
  // bersagli di tocco delle unità (≥ 44 px) sopra gli sprite
  st.nemici.forEach((n) => { if (!n.vivo) return; const [R, E] = n.pos; html += `<div class="tocca-unita" style="left:${(g.cx(R, E) - 22 * Math.max(1, g.sc)).toFixed(0)}px;top:${(g.cy(R) - 46 * g.sc).toFixed(0)}px" data-tocco="sprite ${n.id}" aria-label="${n.id}"></div>`; });
  if (opts.spinta) opts.spinta.forEach((s) => { const [R, E] = s.cell; html += `<div class="spinta-l ${s.status}" style="left:${(g.cx(R, E)).toFixed(0)}px;top:${(g.cy(R)).toFixed(0)}px">${s.status === 'wall' ? 'muro' : s.status === 'free' ? 'entra' : 'urta'}</div>`; });
  const svg = `<svg class="mappa-svg" width="${g.rect.w}" height="${g.rect.h}" viewBox="0 0 ${g.rect.w} ${g.rect.h}">
    <defs>
      <marker id="frecciaR" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="#e2705f"/></marker>
      <marker id="frecciaG" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="#8a7f9a"/></marker>
      <radialGradient id="lume" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#c9a84c" stop-opacity=".28"/><stop offset="1" stop-color="#c9a84c" stop-opacity="0"/></radialGradient>
    </defs><g class="celle">${cells}</g>${ter}${marks}${segni}${paths}${leaders}${figs}</svg>`;
  return { svg, html };
}
function sigilloSvg(id, s, forte) {
  return sigillo(id, Math.round(s), forte ? 'sul-campo forte' : 'sul-campo');
}

const CSS = `
.mappa{position:absolute}
.mappa .mappa-svg{position:absolute;left:0;top:0;pointer-events:none}
.casella{fill:#1d1b22;stroke:#34303f;stroke-width:1}
.trappola{fill:none;stroke:#6b5a3a;stroke-width:1.2;stroke-dasharray:3 2}
.ico-trappola{fill:#8b7448}
.colonna ellipse{fill:#0e0d10}.colonna rect{fill:#3b3644;stroke:#4c4656}
.arrivo{fill:none;stroke:#7d7290;stroke-width:1.5;stroke-dasharray:4 3}
.arrivo.colpisce{stroke:var(--sangue-vivo);fill:rgba(184,64,64,.16)}
.arrivo-l{font:700 12px var(--f-testo);fill:#a59bb5}
.fmt-desk .arrivo-l{font-size:14px}
.arrivo-l.colpisce{fill:var(--sangue-vivo)}
.percorso{fill:none;stroke:#8a7f9a;stroke-width:1.6;stroke-dasharray:2 4;stroke-linecap:round}
.percorso.colpisce{stroke:var(--sangue-vivo)}
.percorso.attivo{stroke-width:2.6;stroke-dasharray:6 4}
.percorso.fatto{stroke-dasharray:none;stroke-width:2.4;opacity:.9}
.percorso.mio{stroke:var(--oro);stroke-dasharray:5 4;stroke-width:2}
.ragg{fill:rgba(201,168,76,.10);stroke:#7d6526;stroke-width:1}
.ragg.sel{fill:rgba(201,168,76,.28);stroke:var(--oro);stroke-width:2}
.costo-pm{font:800 14px var(--f-testo);fill:var(--oro)}
.fmt-desk .costo-pm{font-size:18px}
.spinta{fill:rgba(201,168,76,.12);stroke:var(--oro);stroke-width:1.6;stroke-dasharray:5 3}
.spinta.wall{fill:rgba(226,112,95,.14);stroke:var(--sangue-vivo);stroke-dasharray:none;stroke-width:2}
.spinta-l{position:absolute;transform:translate(-50%,-50%);font:700 12px var(--f-testo);color:var(--oro);pointer-events:none}
.fmt-desk .spinta-l{font-size:15px}
.spinta-l.wall{color:#ffd5cc;background:#5a1a16;padding:1px 4px}
.bers-ok{fill:none;stroke:var(--oro);stroke-width:2}
.bers-ok.scelto{stroke-width:3;fill:rgba(201,168,76,.18)}
.bers-no{fill:none;stroke:#5d5468;stroke-width:1;stroke-dasharray:2 3}
.agisce{fill:rgba(226,112,95,.2);stroke:var(--sangue-vivo);stroke-width:2.5}
.aggancio{stroke:#5d5468;stroke-width:1}
.aggancio.forte{stroke:#9a4a42}
.figura .ombra{fill:#000;opacity:.55}
.zombie .corpo{fill:#3d4a38}.zombie .testa{fill:#4c5a45}.zombie .occhio{fill:#ff5a4a}
.giocatore .corpo{fill:#4b4560}.giocatore .testa{fill:#d8c7a8}.giocatore .cappello{fill:#25222e}.giocatore .lanterna{fill:#f3c45b}
.alone{fill:url(#lume)}
.pip{fill:#b84040}.pip.vuoto{fill:#3a3340}
.sigillo{flex:none}
.sigillo .forma>*{fill:#3a1616;stroke:var(--sangue-vivo);stroke-width:1.3}
.sigillo text{font:800 12px var(--f-testo);fill:#f1d6cf}
.fmt-desk .sigillo text{font-size:14px}
.sigillo.grigio .forma>*,.sigillo.sul-campo .forma>*{fill:#241f2b;stroke:#8a7f9a}
.sigillo.grigio text,.sigillo.sul-campo text{fill:var(--osso)}
.sigillo.sul-campo.forte .forma>*{fill:#3a1616;stroke:var(--sangue-vivo)}
.sigillo.sul-campo text{font-size:11px}
.fmt-desk .sigillo.sul-campo text{font-size:13px}
.tocca-unita{position:absolute;width:44px;height:52px}
.fmt-desk .tocca-unita{width:56px;height:64px}

.minaccia{position:absolute;width:var(--et-w);padding:2px 5px 3px 4px;background:rgba(18,16,22,.95);border-left:3px solid #6b6178;line-height:1}
.minaccia.forte{border-left-color:var(--sangue-vivo);background:rgba(42,16,18,.96)}
.minaccia.spento{border-left-color:#4a4258;opacity:.92}
.minaccia.attiva{outline:2px solid var(--sangue-vivo)}
.minaccia .m1{display:flex;align-items:center;gap:4px;height:var(--et-r1)}
.minaccia .m1 .ico{width:14px;height:14px;color:#b9aec8}
.fmt-desk .minaccia .m1 .ico{width:18px;height:18px}
.minaccia .az{font-size:var(--t13);font-weight:700}
.minaccia .az.spenta{color:var(--cenere);font-weight:500}
.minaccia .m2{font-size:var(--t12);min-height:var(--et-r);display:flex;align-items:baseline;gap:4px;padding-left:2px;line-height:1.15}
.minaccia .danno{font-size:var(--t16);font-weight:800;color:var(--sangue-vivo)}
.minaccia .a-te{color:#d9a39a}
.minaccia .scudo-a{color:#8cc0e6;margin-left:2px}.minaccia .scudo-a .ico{width:11px;height:11px}
.minaccia .spiega{color:#d9c2bb}
.minaccia .manca{color:var(--cenere)}
.minaccia .scudi{color:#8cc0e6}.minaccia .scudi .ico{width:12px;height:12px}
.minaccia .stati{color:#cfc3dc;display:flex;gap:6px;flex-wrap:wrap}
.minaccia .stati .ico{width:12px;height:12px;margin-right:1px;color:#8cc0e6}
.fmt-tel{--et-w:118px;--et-r1:22px;--et-r:15px}
.fmt-desk{--et-w:178px;--et-r1:30px;--et-r:20px}
`;
const DIM = { tel: { w: 118, riga1: 25, riga: 15, sig: 22 }, desk: { w: 178, riga1: 35, riga: 20, sig: 28 } };
module.exports = { geo, scena, CSS, DIM, statiNemico, etichetta };
