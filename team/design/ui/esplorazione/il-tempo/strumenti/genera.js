// Genera i due mockup statici di "Le Ore" (esplorazione il-tempo).
// Uso: FONT_DIR=<cartella con node_modules/@fontsource> node genera.js
// I font sono incorporati in base64: gli HTML prodotti sono autonomi.
'use strict';
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, '..');
const FONT_DIR = process.env.FONT_DIR || path.join(process.cwd(), 'node_modules');

function face(fam, pkg, w, style) {
  const f = path.join(FONT_DIR, '@fontsource', pkg, 'files', `${pkg}-latin-${w}-${style}.woff2`);
  const b = fs.readFileSync(f).toString('base64');
  return `@font-face{font-family:'${fam}';font-style:${style};font-weight:${w};font-display:block;src:url(data:font/woff2;base64,${b}) format('woff2');}`;
}
const FONTS = [
  face('Grenze Gotisch', 'grenze-gotisch', 700, 'normal'), face('Almendra', 'almendra', 400, 'normal'), face('Almendra', 'almendra', 700, 'normal'),
  face('Alegreya Sans', 'alegreya-sans', 400, 'normal'), face('Alegreya Sans', 'alegreya-sans', 500, 'normal'),
  face('Alegreya Sans', 'alegreya-sans', 700, 'normal'), face('Alegreya Sans', 'alegreya-sans', 800, 'normal'),
  face('Alegreya Sans', 'alegreya-sans', 400, 'italic'),
].join('');

// ---------- glifi (niente emoji: il disegno resta uguale su ogni telefono) ----------
const G = {
  forza: '<path d="M3 8V5.4a1.2 1.2 0 0 1 2.4 0V4.3a1.2 1.2 0 0 1 2.4 0V4a1.2 1.2 0 0 1 2.4 0v.9a1.2 1.2 0 0 1 2.4 0V10c0 2.6-1.9 4.6-4.7 4.6S3 12.9 3 10.4z"/><path d="M3.4 9.4h5.2" stroke="var(--g-taglio,#1b151a)" stroke-width="1.1" fill="none"/>',
  fuoco: '<path d="M8.2 1.2c.5 2.6 3.7 4 3.7 7.7A3.8 3.8 0 0 1 8 14.8a3.8 3.8 0 0 1-3.9-3.9c0-.8.2-1.5.5-2 .4.9 1 1.3 1.6 1.2C5.7 7.5 7.6 5 8.2 1.2z"/>',
  presagio: '<circle cx="8" cy="7" r="5" fill="none" stroke="currentColor" stroke-width="1.7"/><ellipse cx="8" cy="7" rx="1.2" ry="2.9"/><path d="M4.6 14.6h6.8" stroke="currentColor" stroke-width="1.7" fill="none"/>',
};
const glifo = (k, cls = '') => `<svg class="gl gl-${k} ${cls}" viewBox="0 0 16 16" aria-hidden="true">${G[k]}</svg>`;
const NOME_IMPULSO = { vigore: 'forza', fuoco: 'fuoco', terrore: 'presagio' };

// ---------- dadi ----------
function dado(kind, value, opt = {}) {
  const s = opt.scartato;
  const stroke = 'stroke="#1b151a" stroke-width="1.6" stroke-linejoin="round"' + (s ? ' stroke-dasharray="3 2.5"' : '');
  let forma, ty = 23.5;
  if (kind === 'vigore') forma = `<rect x="3" y="3" width="28" height="28" rx="4" fill="${s ? 'none' : '#efe6d0'}" ${stroke}/>`;
  if (kind === 'fuoco') { forma = `<polygon points="17,2 32.5,31 1.5,31" fill="${s ? 'rgba(200,105,31,.16)' : '#c8691f'}" ${stroke}/>`; ty = 27.5; }
  if (kind === 'terrore') forma = `<polygon points="17,1 33,17 17,33 1,17" fill="${s ? 'none' : '#4d3a72'}" ${stroke}/>`;
  const col = s ? '#4a3d36' : (kind === 'terrore' ? '#efe6d0' : '#1b151a');
  const barra = '';
  return `<svg class="dado" viewBox="0 0 34 34" width="34" height="34" aria-hidden="true">${forma}<text x="17" y="${ty}" text-anchor="middle" font-family="Grenze Gotisch" font-weight="700" font-size="${kind === 'fuoco' ? 17 : 20}" fill="${col}">${value}</text>${barra}</svg>`;
}
function sigillo(id, opt = {}) {
  const spento = opt.spento;
  return `<svg class="dado" viewBox="0 0 34 34" width="34" height="34" aria-hidden="true"><circle cx="17" cy="17" r="15" fill="${spento ? 'none' : '#1b151a'}" stroke="#8a1f2a" stroke-width="2.2"${spento ? ' stroke-dasharray="3 2.5"' : ''}/><text x="17" y="22" text-anchor="middle" font-family="Alegreya Sans" font-weight="800" font-size="14" fill="${spento ? '#5a4c44' : '#efe6d0'}">${id}</text></svg>`;
}

// ---------- stanza (ruotata: tu a sinistra, loro arrivano da destra, come il tempo) ----------
const H = 44, W = H * 2 / Math.sqrt(3), PX = W * 0.75;
function centro(r, e) {
  const eff = e + (r % 2 ? 0.5 : 0);
  return [W / 2 + (r - 1) * PX, H / 2 + (6.5 - eff) * H];
}
function esagono(cx, cy, k = 1) {
  const w = W / 2 * k, h = H / 2 * k;
  return [[cx - w, cy], [cx - w / 2, cy - h], [cx + w / 2, cy - h], [cx + w, cy], [cx + w / 2, cy + h], [cx - w / 2, cy + h]]
    .map(p => p.map(n => n.toFixed(1)).join(',')).join(' ');
}
function stanza(d) {
  let svg = '', html = '';
  const speciali = {};
  (d.terreno || []).forEach(t => { speciali[t.at.join()] = t.tipo; });
  const segnate = {};
  (d.caselle || []).forEach(c => { segnate[c.at.join()] = c; });
  for (let r = 1; r <= 8; r++) for (let e = 1; e <= 6; e++) {
    const [x, y] = centro(r, e), tipo = speciali[[r, e].join()], seg = segnate[[r, e].join()];
    svg += `<polygon class="cas${tipo ? ' ' + tipo : ''}${seg ? ' ' + seg.cls : ''}" points="${esagono(x, y, 0.94)}"/>`;
    if (tipo === 'column') svg += `<circle cx="${x}" cy="${y}" r="13" class="col1"/><circle cx="${x}" cy="${y}" r="7.5" class="col2"/>`;
    if (tipo === 'trap') {
      svg += `<polygon class="trapin" points="${esagono(x, y, 0.72)}"/>`;
      html += `<div class="trapt" style="left:${x}px;top:${y}px">Trappola<br><b>3 danni</b></div>`;
    }
    if (seg && seg.testo) html += `<div class="cast ${seg.cls}" style="left:${x}px;top:${y}px"${seg.tocco ? ' data-tocco' : ''}>${seg.testo}</div>`;
  }
  (d.percorsi || []).forEach(p => {
    const pts = [p.da, ...p.via].map(c => centro(c[0], c[1]));
    svg += `<polyline class="perc${p.colpisce ? ' colp' : ''}" points="${pts.map(q => q.map(n => n.toFixed(1)).join(',')).join(' ')}"/>`;
    const f = pts[pts.length - 1];
    svg += `<circle class="arrivo${p.colpisce ? ' colp' : ''}" cx="${f[0]}" cy="${f[1]}" r="12.5"/>`;
    html += `<div class="arrt${p.colpisce ? ' colp' : ''}" style="left:${f[0]}px;top:${f[1]}px">${p.id}</div>`;
  });
  (d.unita || []).forEach(u => {
    const [x, y] = centro(u.pos[0], u.pos[1]);
    html += `<div class="un ${u.cls || ''}" style="left:${x}px;top:${y}px" data-tocco><span class="pd">${u.id}</span><span class="hp">${u.hp} HP</span></div>`;
    if (u.cart) {
      const [dx, dy] = u.off || [20, -22];
      html += `<div class="cart ${u.cartCls || ''}" style="left:${x + dx}px;top:${y + dy}px">${u.cart}</div>`;
    }
    (u.stati || []).forEach((s, i) => {
      const [dx, dy] = (u.soff || [20, 2]);
      html += `<div class="stato ${s.cls || ''}" style="left:${x + dx}px;top:${y + dy + i * 16}px">${s.t}</div>`;
    });
  });
  return `<div class="stanza"><svg width="${(7 * PX + W).toFixed(0)}" height="${6.5 * H}" viewBox="0 0 ${(7 * PX + W).toFixed(1)} ${6.5 * H}">${svg}</svg>${html}</div>`;
}

// ---------- carte ----------
function rigo(marks) {
  // marks: per ogni momento del turno: 'l' loro · 'm' mio, non serve alla carta · 'M' si gioca qui · 'c' si gioca qui pagando (Conversione/Amplificazione) · 'x' dado scartato
  // un '|' prima di un momento = finestra libera in cui la carta gratuita si può giocare
  let out = '';
  marks.forEach(m => {
    const fin = m[0] === '|'; const k = fin ? m.slice(1) : m;
    out += `<i class="rg rg-${k}${fin ? ' fin' : ''}"></i>`;
  });
  return `<span class="rigo" aria-hidden="true">${out}</span>`;
}
function carta(c) {
  const az = (c.azioni || []).map(a => `<p class="az${a.cls ? ' ' + a.cls : ''}">${a.costo ? `<span class="costo">${a.costo}</span> ` : ''}${a.t}${a.nota ? `<span class="nota">${a.nota}</span>` : ''}</p>`).join('');
  return `<article class="carta fam-${c.family} ${c.cls || ''}" style="${c.style || ''}" data-tocco>
    ${rigo(c.rigo)}<span class="quando">${c.quando}</span>
    <h3>${c.nome}</h3>${c.pre ? `<p class="pre">${c.pre}</p>` : ''}
    <div class="azioni">${az}</div>
    ${c.extra || ''}
    ${c.eco ? `<footer><span class="ecol">Eco</span> ${c.eco}${c.cd ? `<span class="cd" title="Cooldown">CD ${c.cd}</span>` : ''}</footer>` : ''}
  </article>`;
}

// ---------- la pagina del turno ----------
function battuta(b, i) {
  const n = `<span class="num">${i + 1}${b.ora ? ' <em>adesso</em>' : ''}</span>`;
  const cls = ['bat', b.loro ? 'loro' : 'mio', b.ora ? 'ora' : '', b.cls || ''].join(' ');
  const st = b.w ? ` style="flex:0 0 ${b.w}px"` : '';
  if (b.loro) return `<div class="${cls}"${st} data-tocco><span class="alto">${sigillo(b.id, { spento: b.spento })}</span>${n}<span class="basso et">${b.et}</span></div>`;
  return `<div class="${cls}"${st} data-tocco><span class="alto et">${b.et}</span>${n}<span class="basso">${glifo(NOME_IMPULSO[b.kind], 'ink')}${dado(b.kind, b.value, { scartato: b.scartato })}${b.extra || ''}</span></div>`;
}
function pagina(p) {
  const pips = Array.from({ length: p.vegliaMax }, (_, i) => `<i class="${i < p.veglia ? 'on' : ''}"></i>`).join('');
  const ris = r => `<span class="ris ${r.cls || ''}"><small>${r.k}</small><b>${r.v}</b></span>`;
  return `<header class="pagina"><div class="carta-pagina">
    <div class="testa"><strong>Turno ${p.turno}</strong><span class="veglia">Veglia ${p.veglia} di ${p.vegliaMax}</span><span class="pips">${pips}</span>
      <div class="risorse">${p.adesso.map(ris).join('')}</div>${p.statoTesta ? `<span class="statot">${p.statoTesta}</span>` : ''}</div>
    <div class="battute">${p.battute.map(battuta).join('')}</div>
    <div class="coda"><span class="codat">${p.codaTitolo}</span><div class="risorse">${p.fine.map(ris).join('')}</div>${p.codaNota ? `<span class="codan">${p.codaNota}</span>` : ''}</div>
  </div></header>`;
}

// ---------- stile ----------
function bordoStrappato() {
  let s = 7, pts = ['0 0', '100% 0'];
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const xs = []; for (let x = 844; x >= 0; x -= 11 + Math.floor(rnd() * 9)) xs.push(x);
  xs.forEach(x => pts.push(`${x}px ${(97 + rnd() * 3).toFixed(1)}px`));
  pts.push('0 98px');
  return pts.join(',');
}
const CSS = `
${FONTS}
:root{
  --notte:#121016; --pietra:#1e1c27; --pietra-linea:#3a3547; --pietra-chiara:#2a2734;
  --pergamena:#cbbc96; --pergamena-scura:#a99769; --inchiostro:#1b151a; --inchiostro-tenue:#5a4c44;
  --osso:#ebe2ce; --osso-spento:#9d95a8;
  --oro:#c6a24a; --oro-scuro:#7d6426; --verderame:#6fa397;
  --sangue:#8a1f2a; --sangue-chiaro:#d76470; --brace:#c8691f; --viola:#4d3a72; --viola-chiaro:#a58fd0;
  --titoli:'Almendra',serif; --cifre:'Grenze Gotisch',serif; --testo:'Alegreya Sans',sans-serif;
}
*{box-sizing:border-box;margin:0;padding:0}
html{background:#000}
body{width:844px;height:390px;position:relative;overflow:hidden;background:var(--notte);color:var(--osso);font:500 13px/1.25 var(--testo);-webkit-font-smoothing:antialiased}
body::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 60% 70% at 20% 62%,rgba(70,62,96,.28),transparent 70%),radial-gradient(ellipse 50% 60% at 78% 70%,rgba(58,46,30,.22),transparent 70%);pointer-events:none}
.gl{width:14px;height:14px;fill:currentColor;flex:none;vertical-align:-2px}
.gl-forza{color:#d9cfb6}.gl-fuoco{color:#e08a3a}.gl-presagio{color:var(--viola-chiaro)}
.gl.ink.gl-forza{color:var(--inchiostro)}.gl.ink.gl-fuoco{color:#9a4a10}.gl.ink.gl-presagio{color:var(--viola)}
.gl-forza{--g-taglio:var(--notte)}.gl.ink.gl-forza{--g-taglio:var(--pergamena)}

/* la pagina del turno: l'unica superficie chiara dello schermo */
.pagina{position:absolute;left:0;top:0;width:844px;height:104px;filter:drop-shadow(0 3px 5px rgba(0,0,0,.65));z-index:3}
.carta-pagina{height:100px;display:flex;color:var(--inchiostro);clip-path:polygon(${bordoStrappato()});
  background:radial-gradient(ellipse 30% 90% at 9% 40%,rgba(122,92,40,.28),transparent 70%),radial-gradient(ellipse 22% 80% at 71% 85%,rgba(98,68,30,.24),transparent 70%),radial-gradient(ellipse 14% 60% at 44% 5%,rgba(98,68,30,.18),transparent 70%),linear-gradient(180deg,#d2c39d,#c6b68e 55%,#b5a379)}
.testa{flex:0 0 98px;padding:3px 6px 0 8px;border-right:3px double rgba(27,21,26,.55);display:flex;flex-direction:column}
.testa strong{font:700 18px/19px var(--titoli)}
.veglia{font-size:12px;line-height:13px;color:var(--inchiostro-tenue);font-weight:700}
.pips{display:flex;gap:3px;margin:2px 0 3px}.pips i{width:9px;height:5px;border:1px solid var(--inchiostro);}.pips i.on{background:var(--inchiostro)}
.risorse{display:grid;grid-template-columns:1fr 1fr;gap:0 4px}
.ris{display:flex;align-items:baseline;gap:3px;white-space:nowrap}
.ris small{font-size:12px;font-weight:700;color:var(--inchiostro-tenue)}.ris b{font:700 17px/16px var(--cifre)}
.ris.giu b{color:var(--sangue)}.ris.su b{color:#2f6b5e}.ris.fermo b{color:var(--inchiostro-tenue)}
.statot{font-size:12px;line-height:13px;font-weight:800;color:var(--sangue);margin-top:1px}
.battute{flex:1;display:flex}
.bat{flex:1 1 0;min-width:0;display:flex;flex-direction:column;align-items:center;border-right:1px dashed rgba(27,21,26,.38);position:relative;padding-top:4px}
.bat:last-child{border-right:0}
.alto,.basso{height:36px;display:flex;align-items:center;justify-content:center;gap:2px;width:100%}
.alto{align-items:flex-end}.basso{align-items:flex-start}
.num{font:700 13px/14px var(--cifre);color:var(--inchiostro-tenue);height:15px;margin:1px 0}
.num em{font:800 12px/14px var(--testo);font-style:normal;color:var(--inchiostro)}
.et{flex-direction:column;align-items:center !important;gap:0;font-size:12px;line-height:13px;text-align:center;color:var(--inchiostro-tenue);font-weight:500;white-space:nowrap}
.alto.et{justify-content:flex-end;padding-bottom:1px}.basso.et{justify-content:flex-start;padding-top:1px}
.et b{color:var(--inchiostro);font-weight:800}.et b.dan{color:var(--sangue);font-size:14px}.et s{color:var(--inchiostro-tenue)}
.et .ant{color:#2f6b5e;font-weight:800;border-bottom:1.5px dashed #2f6b5e}
.dado{display:block;flex:none}
.bat.scartato .num{text-decoration:line-through}
.bat.ora{background:linear-gradient(180deg,rgba(255,246,214,.75),rgba(255,240,200,.5));box-shadow:inset 0 0 0 2.5px var(--oro-scuro),inset 0 0 0 4px rgba(255,236,170,.6);border-right:0}
.bat.ora .basso{gap:5px;align-items:center;height:36px}
.pool{font-size:12px;line-height:13px;font-weight:800;text-align:left;color:var(--inchiostro)}
.pool small{display:block;font-weight:500;font-size:12px;color:var(--inchiostro-tenue)}
.coda{flex:0 0 88px;padding:3px 4px 0 7px;border-left:3px double rgba(27,21,26,.55)}
.codat{font:700 14px/16px var(--titoli);display:block}
.coda .risorse{margin-top:2px}
.codan{display:block;font-size:12px;line-height:12px;color:var(--inchiostro-tenue);font-style:italic;margin-top:1px}
.codan b{color:var(--sangue);font-style:normal}

/* la stanza */
.stanza{position:absolute;left:5px;top:102px;width:318px;height:286px}
.stanza svg{position:absolute;left:0;top:0;overflow:visible}
.cas{fill:var(--pietra);stroke:var(--pietra-linea);stroke-width:1}
.cas.column{fill:#0d0c11}.col1{fill:#2b2835;stroke:#4a4458}.col2{fill:#3a3646}
.cas.trap{fill:#22161b}.trapin{fill:none;stroke:var(--sangue-chiaro);stroke-width:1.2;stroke-dasharray:3 3}
.trapt{position:absolute;transform:translate(-50%,-50%);font-size:12px;line-height:12px;text-align:center;color:var(--sangue-chiaro)}
.cas.spinta{fill:#2a2a22;stroke:var(--oro);stroke-width:1.5;stroke-dasharray:4 3}
.cas.scelta{fill:#3b3520;stroke:var(--oro);stroke-width:2.5}
.cast{position:absolute;transform:translate(-50%,-50%);font-size:12px;line-height:12px;font-weight:700;text-align:center;color:var(--oro);width:46px;height:44px;display:flex;align-items:center;justify-content:center}
.cast.scelta{color:var(--osso);font-weight:800}
.perc{fill:none;stroke:#7b4750;stroke-width:1.6;stroke-dasharray:2 4;stroke-linecap:round}
.perc.colp{stroke:var(--sangue-chiaro);stroke-width:2.2;stroke-dasharray:5 4}
.arrivo{fill:rgba(18,16,22,.7);stroke:#7b4750;stroke-width:1.2;stroke-dasharray:3 3}.arrivo.colp{stroke:var(--sangue-chiaro);stroke-width:1.6}
.arrt{position:absolute;transform:translate(-50%,-50%);font-size:12px;font-weight:700;color:#a8707a}.arrt.colp{color:var(--sangue-chiaro)}
.un{position:absolute;transform:translate(-50%,-50%);width:44px;height:44px;display:flex;flex-direction:column;align-items:center;justify-content:center}
.un .pd{width:28px;height:26px;border-radius:50%;background:var(--inchiostro);border:2px solid var(--sangue-chiaro);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;color:var(--osso);line-height:1}
.un .hp{font-size:12px;line-height:12px;font-weight:700;color:var(--osso);margin-top:1px;text-shadow:0 0 3px #000,0 0 3px #000}
.un.tu .pd{background:#2a2414;border-color:var(--oro);color:var(--oro);box-shadow:0 0 0 3px rgba(198,162,74,.18)}
.un.mira .pd{box-shadow:0 0 0 2.5px var(--oro)}
.un.fioco{opacity:.5}
.cart{position:absolute;white-space:nowrap;background:linear-gradient(180deg,#d2c39d,#bcab82);color:var(--inchiostro);font-size:12px;line-height:14px;font-weight:700;padding:1px 5px 1px 3px;box-shadow:0 1px 3px rgba(0,0,0,.7);clip-path:polygon(0 0,100% 0,calc(100% - 3px) 50%,100% 100%,0 100%)}
.cart i{font-style:normal;font:700 13px/14px var(--cifre);background:var(--inchiostro);color:var(--pergamena);padding:0 3px;margin-right:4px;display:inline-block}
.cart b{color:var(--sangue);font-weight:800;font-size:13px}.cart s{color:var(--inchiostro-tenue);font-weight:500}
.cart.lontano{background:#4a4353;color:#d5cde0;box-shadow:none}.cart.lontano i{background:#211e29;color:#d5cde0}
.cart .ant{color:#245c50;font-weight:800;border-bottom:1.5px dashed #245c50}
.stato{position:absolute;white-space:nowrap;font-size:12px;line-height:14px;font-weight:700;color:var(--osso);background:rgba(18,16,22,.85);border:1px solid var(--pietra-linea);padding:0 4px}
.stato.oro{border-color:var(--oro);color:var(--oro)}.stato.rosso{border-color:var(--sangue-chiaro);color:var(--sangue-chiaro)}

/* la mano */
.guida{position:absolute;left:334px;top:104px;width:504px;font-size:13px;line-height:15px;color:var(--osso)}
.guida b{color:var(--oro);font-weight:700}.guida .tenue{color:var(--osso-spento)}
.mano{position:absolute;left:334px;top:146px;height:188px;display:flex;gap:6px}
.carta{position:relative;width:97px;height:188px;flex:none;background:linear-gradient(170deg,#2a2532,#1d1a24 70%);border:1px solid var(--oro-scuro);box-shadow:inset 0 0 0 2px #1a1720,inset 0 0 0 3px rgba(198,162,74,.28),0 3px 6px rgba(0,0,0,.6);padding:6px 6px 5px 8px;display:flex;flex-direction:column;color:var(--osso)}
.carta::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--fam)}
.fam-vigore{--fam:#d9cfb6}.fam-fuoco{--fam:var(--brace)}.fam-terrore{--fam:#7c63b0}.fam-free{--fam:var(--oro)}
.rigo{display:flex;align-items:center;height:11px;gap:0}
.rg{flex:1 1 0;height:11px;position:relative;display:block}
.rg::after{content:'';position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:2px;height:2px;background:#5c566a;border-radius:50%}
.rg-m::after{width:6px;height:6px;border-radius:0;background:none;border:1px solid #8a8398}
.rg-M::after{width:7px;height:7px;border-radius:0;background:var(--oro)}
.rg-c::after{width:6px;height:6px;border-radius:0;background:none;border:1.5px solid var(--oro)}
.rg-x::after{width:7px;height:1px;border-radius:0;background:#6d667a}
.rg.fin::before{content:'';position:absolute;left:-1px;top:0;width:2px;height:11px;background:var(--oro)}
.quando{font-size:12px;line-height:13px;color:var(--oro);font-weight:700;white-space:nowrap}
.carta h3{font:700 15px/15px var(--titoli);margin:2px 0 4px;color:var(--osso)}
.pre{font-size:12px;line-height:13px;font-style:italic;color:var(--osso-spento);margin-bottom:2px}
.azioni{flex:1;display:flex;flex-direction:column;gap:3px}
.az{font-size:12px;line-height:13px;font-weight:500}
.az .costo{font-weight:800;white-space:nowrap}
.az .nota{display:block;color:var(--osso-spento);font-style:italic}
.carta footer{border-top:1px solid rgba(198,162,74,.35);padding-top:2px;font-size:12px;line-height:13px;color:#cfc6b4;position:relative;min-height:28px}
.ecol{font:700 12px/13px var(--titoli);color:var(--oro)}
.cd{position:absolute;right:-3px;bottom:-2px;font-size:12px;font-weight:800;line-height:14px;color:var(--inchiostro);background:var(--oro);padding:0 3px}
.carta.nuova::after{content:'nuova';position:absolute;right:3px;top:-8px;font-size:12px;line-height:13px;font-weight:700;background:var(--verderame);color:#0d1a17;padding:0 4px}

/* fondo: plancia e azione principale */
.plancia{position:absolute;top:340px;height:46px;display:flex;align-items:center;gap:8px;font-size:12px;line-height:14px;color:var(--osso-spento);min-width:150px}
.plancia b{color:var(--osso);font-weight:700}
.posti{display:flex;gap:4px;align-items:center}
.posti i{width:20px;height:28px;border:1px dashed #5c566a;display:block}
.posti i.fuoco{border-color:#8a4a1c}
.posti i.piena{border:1px solid var(--oro-scuro);background:#2a2532;transform:rotate(-90deg)}
.primario{position:absolute;right:8px;top:338px;height:48px;min-width:196px;padding:0 14px;background:linear-gradient(180deg,#d2ae52,#a98432);color:#1b140a;border:0;box-shadow:inset 0 0 0 1px #f0d68a,inset 0 0 0 3px #a98432,0 2px 6px rgba(0,0,0,.7);font:700 18px/19px var(--titoli);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.primario small{font:700 12px/13px var(--testo);color:#3a2a0c}
`;

function doc(titolo, corpo, extraCss = '') {
  return `<!doctype html>
<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=844,height=390,initial-scale=1">
<title>${titolo}</title>
<style>${CSS}${extraCss}</style></head>
<body>
${corpo}
</body></html>
`;
}
const F = glifo('forza'), FU = glifo('fuoco'), PR = glifo('presagio');

// =====================================================================
// 1. SELEZIONE — turno 1, stato "sel_proposta" di dati_mockup.json
// =====================================================================
const sel = doc('Le Ore · Selezione (telefono 844×390)', [
  pagina({
    turno: 1, veglia: 1, vegliaMax: 6,
    adesso: [{ k: 'HP', v: 10 }, { k: 'PT', v: 6 }, { k: 'PM', v: 2 }, { k: 'Luce', v: 0 }],
    battute: [
      { loro: 1, id: 'Z1', et: 'Orda<b class="dan">−1 HP</b>' },
      { kind: 'vigore', value: 1, et: '<b>Tieni</b>2 carte' },
      { kind: 'fuoco', value: 1, scartato: 1, cls: 'scartato', et: '<b>Scarta</b>+1 Luce' },
      { loro: 1, id: 'Z2', et: 'Orda<b class="dan">−2 HP</b>' },
      { loro: 1, id: 'Z3', et: 'Orda<span>non arriva</span>' },
      { loro: 1, id: 'Z4', et: 'Orda<span>non arriva</span>' },
      { kind: 'vigore', value: 2, et: '<b>Tieni</b>2 carte' },
      { loro: 1, id: 'Z5', et: 'Si scuda<b>+2 Scudi</b>' },
      { kind: 'terrore', value: 4, et: '<b>Tieni</b>1 carta' },
      { kind: 'fuoco', value: 2, et: '<b>Tieni</b>3 carte' },
    ],
    codaTitolo: 'A fine turno',
    fine: [{ k: 'HP', v: 7, cls: 'giu' }, { k: 'PT', v: 6, cls: 'fermo' }, { k: 'PM', v: 2, cls: 'fermo' }, { k: 'Luce', v: 1, cls: 'su' }],
    codaNota: 'se non fai nulla',
  }),
  stanza({
    terreno: [{ at: [4, 5], tipo: 'column' }, { at: [6, 4], tipo: 'column' }, { at: [5, 3], tipo: 'trap' }],
    percorsi: [
      { id: 'Z1', da: [4, 3], via: [[3, 3], [2, 4]], colpisce: 1 },
      { id: 'Z2', da: [4, 6], via: [[3, 5], [2, 5]], colpisce: 1 },
      { id: 'Z3', da: [6, 2], via: [[5, 1], [4, 2]] },
      { id: 'Z4', da: [6, 6], via: [[5, 5], [4, 6]] },
    ],
    unita: [
      { id: 'Tu', hp: '10', pos: [1, 4], cls: 'tu' },
      { id: 'Z1', hp: '6', pos: [4, 3], cart: '<i>1</i>Orda <b>−1</b>', off: [18, 6] },
      { id: 'Z2', hp: '6', pos: [4, 6], cart: '<i>4</i>Orda <b>−2</b>', off: [-78, -20] },
      { id: 'Z3', hp: '6', pos: [6, 2], cart: '<i>5</i>Orda, non arriva', cartCls: 'lontano', off: [-22, 22] },
      { id: 'Z4', hp: '6', pos: [6, 6], cart: '<i>6</i>Orda, non arriva', cartCls: 'lontano', off: [-40, -36] },
      { id: 'Z5', hp: '6', pos: [7, 4], cart: '<i>8</i>Si scuda +2', cartCls: 'lontano', off: [-36, -38] },
    ],
  }),
  `<p class="guida"><b>Scegli i dadi del turno.</b> Tocca un tuo dado nella pagina per tenerlo o scartarlo: nulla è perso finché non confermi. <span class="tenue">${FU}1 è scartato perché lo slot Fuoco è uno solo e lo occupa ${FU}2: toccalo per scambiarli.</span></p>`,
  `<section class="mano">` + [
    carta({ nome: 'Attacco di Fuoco', family: 'fuoco', cd: 1, cls: 'nuova', quando: 'al 10°', rigo: ['l', 'm', 'x', 'l', 'l', 'l', 'm', 'l', 'c', 'M'],
      azioni: [{ costo: `1${FU}`, t: '2 Danni Fuoco' }, { costo: `1${FU}`, t: 'Vulnerabilità Fuoco', nota: 'a un adiacente' }], eco: '+1 PM<br>+1 Luce' }),
    carta({ nome: 'Diniego Sismico', family: 'vigore', cd: 1, cls: 'nuova', quando: 'al 2° e al 7°', rigo: ['l', 'M', 'x', 'l', 'l', 'l', 'M', 'l', 'c', 'c'],
      azioni: [{ costo: `1${F}`, t: '1 Danno e Spingi 1', nota: 'a un adiacente' }], eco: '+1 PM<br>Ruota 1 CD' }),
    carta({ nome: 'Distorsione', family: 'terrore', cd: 1, cls: 'nuova', quando: 'al 9°', rigo: ['l', 'm', 'x', 'l', 'l', 'l', 'm', 'l', 'M', 'm'],
      azioni: [{ costo: `X${PR} + 1 PT:`, t: 'sposta un’unità (non te) fino a X caselle', nota: 'le trappole scattano' }], eco: '+1 PM<br>Pesca 1' }),
    carta({ nome: 'Parata', family: 'vigore', cls: 'nuova', quando: 'al 2° e al 7°', rigo: ['l', 'M', 'x', 'l', 'l', 'l', 'M', 'l', 'c', 'c'],
      azioni: [{ costo: `1${F}`, t: '+1 Scudo' }, { costo: `1${F}`, t: 'pesca 1 carta' }], eco: '+1 Contrattacco' }),
    carta({ nome: 'Carica Furiosa', family: 'free', cd: 2, cls: 'nuova', quando: 'prima del 9°', rigo: ['|l', '|m', 'x', '|l', '|l', '|l', '|m', '|l', '|M', 'M'],
      azioni: [{ costo: 'Gratis:', t: 'consuma i dadi 9° e 10°: corri in linea fino a 6 caselle. Danni = caselle, se arrivi a un nemico' }], eco: '+1 Luce' }),
  ].join('') + `</section>`,
  `<div class="plancia" style="left:334px"><span class="posti"><i></i><i></i><i></i><i class="fuoco"></i></span><span><b>Plancia vuota</b><br>Mazzo 11, scarti 0</span></div>`,
  `<button class="primario" data-tocco>Conferma 4 dadi<small>scarti 1 Fuoco: +1 Luce</small></button>`,
].join('\n'));

// =====================================================================
// 2. RISOLUZIONE con carta in uso — turno 2, stato "carta_aperta"
//    Il giocatore ha toccato Z2 e poi la casella R1 E5: anteprima prima della conferma.
// =====================================================================
const cssRis = `
.guida{width:504px}
.aperta{position:absolute;left:334px;top:138px;width:178px;height:249px;padding:7px 9px 7px 11px;border-color:var(--oro);box-shadow:inset 0 0 0 2px #1a1720,inset 0 0 0 3px rgba(198,162,74,.55),0 4px 12px rgba(0,0,0,.8)}
.aperta h3{font-size:19px;line-height:20px;margin:1px 0 1px}
.aperta .az{font-size:13px;line-height:14px;padding:3px 0 3px 7px;border-left:3px solid transparent}
.aperta .az.ora{border-left-color:var(--oro);background:rgba(198,162,74,.1)}
.aperta .az.chiusa{color:#8d8698}.aperta .az.chiusa .gl{opacity:.6}
.aperta .az .nota{font-size:12px;line-height:13px}
.aperta .az.ora .nota{color:var(--verderame);font-style:normal;font-weight:700}
.chiudi{margin-top:auto;flex:none;height:44px;border:1px solid var(--oro-scuro);background:#211d29;color:var(--osso);font:700 15px/16px var(--titoli);display:flex;flex-direction:column;align-items:center;justify-content:center}
.chiudi small{font:500 12px/13px var(--testo);color:var(--osso-spento)}
.norim{font-size:12px;line-height:13px;color:var(--osso-spento);font-style:italic;margin-top:3px}
.attesa{position:absolute;left:522px;top:136px;font-size:12px;line-height:13px;color:var(--osso-spento);font-style:italic}
.mano.chiusa{left:520px;top:150px;gap:0;height:188px}
.mano.chiusa .carta{margin-right:-24px;padding-right:30px;filter:brightness(.8) saturate(.7);box-shadow:inset 0 0 0 2px #1a1720,inset 0 0 0 3px rgba(198,162,74,.28),-3px 0 6px rgba(0,0,0,.55)}
.mano.chiusa .carta:last-child{margin-right:0;padding-right:6px}
.mano.chiusa .carta footer .cd{right:-3px}
.mano.chiusa .carta:last-child footer .cd{right:-3px}
.primario{min-width:160px;padding:0 6px;font-size:17px}
.posti{gap:3px}.posti i{width:13px;height:22px}.posti i.piena{margin:0 5px}
`;
const ris = doc('Le Ore · Risoluzione, carta in uso (telefono 844×390)', [
  pagina({
    turno: 2, veglia: 2, vegliaMax: 6,
    adesso: [{ k: 'HP', v: 8 }, { k: 'PT', v: 5 }, { k: 'PM', v: 0 }, { k: 'Luce', v: 2 }],
    statoTesta: 'Vulnerabile ×2',
    battute: [
      { kind: 'vigore', value: 2, ora: 1, w: 142, et: '<b>Tocca a te</b>', extra: `<span class="pool">resta 1 ${glifo('forza', 'ink')}<small>di 2</small></span>` },
      { loro: 1, id: 'Z1', et: 'Orda<span><s>−6</s> <b class="ant">−4 HP</b></span>' },
      { loro: 1, id: 'Z2', et: '<s>Orda −6</s><b class="ant">salta</b>' },
      { kind: 'fuoco', value: 1, et: '3 carte' },
      { kind: 'terrore', value: 1, et: 'solo con<span>Conversione</span>' },
      { loro: 1, id: 'Z3', et: 'Morso<span>non arriva</span>' },
      { loro: 1, id: 'Z4', spento: 1, et: 'Stordito<b>salta</b>' },
      { loro: 1, id: 'Z5', et: 'Orda<span>non arriva</span>' },
    ],
    codaTitolo: 'A fine turno',
    fine: [{ k: 'HP', v: 4, cls: 'su' }, { k: 'PT', v: 5, cls: 'fermo' }, { k: 'PM', v: 0, cls: 'fermo' }, { k: 'Luce', v: 2, cls: 'fermo' }],
    codaNota: 'se non confermi: <b>morte al 3°</b>',
  }),
  stanza({
    terreno: [{ at: [4, 5], tipo: 'column' }, { at: [6, 4], tipo: 'column' }],
    caselle: [
      { at: [1, 5], cls: 'scelta', testo: 'Z2<br>qui', tocco: 1 },
      { at: [1, 4], cls: 'spinta', testo: 'libera', tocco: 1 },
      { at: [2, 4], cls: 'spinta', testo: 'libera', tocco: 1 },
    ],
    percorsi: [
      { id: 'Z1', da: [5, 3], via: [[4, 4], [3, 4]], colpisce: 1 },
      { id: 'Z3', da: [4, 2], via: [[3, 2], [2, 3]] },
      { id: 'Z5', da: [7, 4], via: [[6, 5], [5, 4]] },
    ],
    unita: [
      { id: 'Tu', hp: '8', pos: [3, 5], cls: 'tu', stati: [{ t: 'Vulnerabile', cls: 'rosso' }], soff: [-52, -38] },
      { id: 'Z2', hp: '4', pos: [2, 5], cls: 'mira' },
      { id: 'Z4', hp: '5', pos: [4, 6], cart: '<i>7</i>Stordito: salta', cartCls: 'lontano', off: [18, -20] },
      { id: 'Z1', hp: '3', pos: [5, 3], cart: '<i>2</i>Orda <s>−6</s> <b class="ant">−4</b>', off: [18, 6] },
      { id: 'Z3', hp: '6', pos: [4, 2], cart: '<i>6</i>Morso, non arriva', cartCls: 'lontano', off: [-30, 22] },
      { id: 'Z5', hp: '6', pos: [7, 4], cart: '<i>8</i>Orda, non arriva', cartCls: 'lontano', off: [-58, -56], stati: [{ t: '2 Scudi' }], soff: [-24, -39] },
    ],
  }),
  `<p class="guida"><b>Attacco Poderoso, seconda Azione su Z2.</b> Scegli dove spingerlo, poi conferma. <span class="tenue">Le scritte verdi tratteggiate sono l’anteprima: cosa cambia nel turno se confermi.</span></p>`,
  carta({ nome: 'Attacco Poderoso', family: 'vigore', cls: 'aperta', quando: 'in uso adesso, al 1° momento', rigo: ['M', 'l', 'l', 'c', 'c', 'l', 'l', 'l'],
    pre: 'Usarla ti rende Vulnerabile.',
    azioni: [
      { cls: 'chiusa', costo: `1${F}`, t: '2 Danni a un adiacente.', nota: 'Non si torna a un’Azione precedente.' },
      { cls: 'ora', costo: `1${F}`, t: 'Stordisci un adiacente + Spingi 1.', nota: 'Usata su Z4: Stordito, urto col muro, 1 danno.' },
    ],
    extra: `<button class="chiudi" data-tocco>Chiudi la carta<small>va in Plancia, riposa 2 turni</small></button><p class="norim">Già usata: non torna in mano.</p>` }),
  `<p class="attesa">Le altre carte aspettano: completa prima la carta aperta.</p>`,
  `<section class="mano chiusa">` + [
    carta({ nome: 'Carica Furiosa', family: 'free', cd: 2, quando: 'prima del 4°', rigo: ['m', '|l', '|l', '|M', 'M', 'l', 'l', 'l'],
      azioni: [{ costo: 'Gratis:', t: 'usa i dadi 4° e 5°, corri in linea' }], eco: '+1 Luce' }),
    carta({ nome: 'Attacco Base', family: 'vigore', quando: 'al 1°', rigo: ['M', 'l', 'l', 'c', 'c', 'l', 'l', 'l'],
      azioni: [{ costo: 'Gratis:', t: '1 Danno' }, { costo: `1${F}`, t: '1 Danno' }, { costo: `1${F}`, t: 'pesca 1' }], eco: '+1 PM<br>+1 Scudo' }),
    carta({ nome: 'Tiro Mirato', family: 'vigore', quando: 'al 1°', rigo: ['M', 'l', 'l', 'c', 'c', 'l', 'l', 'l'],
      pre: 'Gittata 2.', azioni: [{ costo: `1${F}`, t: '+1 Gittata' }, { costo: `1${F}`, t: '1 Danno' }], eco: '+2 PM<br>Ruota 1 CD' }),
    carta({ nome: 'Parata', family: 'vigore', quando: 'al 1°', rigo: ['M', 'l', 'l', 'c', 'c', 'l', 'l', 'l'],
      azioni: [{ costo: `1${F}`, t: '+1 Scudo' }, { costo: `1${F}`, t: 'pesca 1 carta' }], eco: '+1 Contrattacco' }),
  ].join('') + `</section>`,
  `<div class="plancia" style="left:520px;min-width:0;gap:5px"><span class="posti"><i class="piena"></i><i></i><i></i><i class="fuoco"></i></span><span><b>Plancia 1 di 3</b><br>Distorsione</span></div>`,
  `<button class="primario" data-tocco>Conferma la spinta<small>Z2 stordito e spinto</small></button>`,
].join('\n'), cssRis);

fs.writeFileSync(path.join(OUT, 'selezione_telefono.html'), sel);
fs.writeFileSync(path.join(OUT, 'risoluzione_carta_telefono.html'), ris);
console.log('scritti: selezione_telefono.html, risoluzione_carta_telefono.html');
