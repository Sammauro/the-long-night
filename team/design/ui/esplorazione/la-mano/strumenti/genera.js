// Genera i due mockup statici del concetto "La mano" (844x390) dai dati veri del motore.
// Uso: node genera.js   (legge ../../../bozze_B1.3b/strumenti/dati_mockup.json, scrive ../*.html)
'use strict';
const fs = require('fs');
const path = require('path');
const D = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../bozze_B1.3b/strumenti/dati_mockup.json'), 'utf8'));
const OUT = path.join(__dirname, '..');

const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
  '<link href="https://fonts.googleapis.com/css2?family=Asap+Condensed:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Grenze+Gotisch:wght@400;500;600;700&display=swap" rel="stylesheet">';

// ---------- icone (24x24) ----------
const P = {
  forza: 'M3.200 9.500a2 2 0 014 0V12h.700V8a2 2 0 014 0v4h.700V8.300a2 2 0 014 0V12h.700v-1.700a1.850 1.850 0 013.700 0v5.200a6 6 0 01-6 6H9.200a6 6 0 01-6-6z',
  fuoco: 'M12 2c1 4 5.5 5.5 5.5 11a5.5 5.5 0 01-11 0c0-2 1-3.6 2.2-4.6.3 1.6 1 2.4 2 2.6C10.3 8 11 4.6 12 2z',
  presagio: 'M1.5 12S5.3 5.5 12 5.5 22.5 12 22.5 12 18.7 18.5 12 18.5 1.5 12 1.5 12zm10.5 3.4a3.4 3.4 0 100-6.8 3.4 3.4 0 000 6.8z',
  luce: 'M12 1l2.2 8.8L23 12l-8.8 2.2L12 23l-2.2-8.8L1 12l8.8-2.2z',
  pm: 'M3 5h4.5l6 7-6 7H3l6-7zm8.5 0H16l6 7-6 7h-4.500l6-7z',
  hp: 'M12 21S3.5 15.6 3.5 9.6A4.7 4.700 0 0112 6.900a4.700 4.700 0 018.500 2.700C20.500 15.600 12 21 12 21z',
  pt: 'M12 2a10 10 0 100 20 10 10 0 000-20zm0 3.200a6.800 6.800 0 016.800 6.800h-2.600A4.200 4.200 0 1012 16.200v2.600a6.800 6.800 0 010-13.600zm0 5a1.800 1.800 0 110 3.600 1.800 1.800 0 010-3.600z',
  scudo: 'M12 2l8 3v6c0 5-3.400 9-8 11-4.600-2-8-6-8-11V5z',
  stordito: 'M12 1.500l2.300 6.300 6.700-.600-4.800 4.800 3.600 5.700-6.300-2.300L12 22.500l-1.500-7.100-6.300 2.300 3.600-5.700L3 7.200l6.700.600z',
  espandi: 'M3 3h7v2.500H7.200l4 4-1.700 1.700-4-4V10H3zm18 18h-7v-2.500h2.800l-4-4 1.700-1.700 4 4V14H21z'
};
const ico = (n, cls) => `<svg class="ico ${cls || ''}" viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="${P[n]}"/></svg>`;
const TIPO = { vigore: 'forza', fuoco: 'fuoco', terrore: 'presagio' };
const NOME_TIPO = { vigore: 'Vigore', fuoco: 'Fuoco', terrore: 'Terrore' };
const RESA = { vigore: '+1 PM', fuoco: '+1 Luce', terrore: '+1 PT' };

// ---------- dadi ----------
// Forma diversa per tipo, leggibile anche in grigio: Vigore quadrato, Fuoco triangolo, Terrore rombo, nemico lapide.
function dado(kind, val, lato, stato) {
  const s = lato, h = s / 2;
  let forma, ty = h + s * 0.17, tx = h, fs_ = s * 0.56, gx = s * 0.62, gy = s * 0.60, gs = s * 0.31;
  if (kind === 'vigore') forma = `<rect x="2" y="2" width="${s - 4}" height="${s - 4}" rx="${s * 0.12}"/>`;
  if (kind === 'fuoco') { forma = `<path d="M${h} 2 L${s - 1.500} ${s - 3} L1.500 ${s - 3} Z" stroke-linejoin="round"/>`; ty = s * 0.82; fs_ = s * 0.48; gx = s * 0.60; gy = s * 0.60; gs = s * 0.2; }
  if (kind === 'terrore') { forma = `<path d="M${h} 1.500 L${s - 1.500} ${h} L${h} ${s - 1.500} L1.500 ${h} Z" stroke-linejoin="round"/>`; fs_ = s * 0.46; ty = h + s * 0.14; gx = h - gs / 2; gy = s * 0.68; }
  const glifo = `<svg x="${gx}" y="${gy}" width="${gs}" height="${gs}" viewBox="0 0 24 24"><path fill-rule="evenodd" d="${P[TIPO[kind]]}"/></svg>`;
  return `<svg class="dado d-${kind} ${stato || ''}" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">${forma}` +
    `<text x="${kind === 'vigore' ? h - s * 0.13 : tx}" y="${kind === 'fuoco' ? ty : ty}" text-anchor="middle" font-size="${fs_}">${val}</text>` +
    (kind === 'terrore' ? '' : glifo) + `</svg>`;
}
function lapide(id, w, stato) {
  const h = Math.round(w * 1.12);
  return `<svg class="dado d-nemico ${stato || ''}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<path d="M2 ${h - 2} V${w * 0.46} a${w / 2 - 2} ${w / 2 - 2} 0 0 1 ${w - 4} 0 V${h - 2} Z"/>` +
    `<text x="${w / 2}" y="${h * 0.68}" text-anchor="middle" font-size="${w * 0.42}">${id}</text>` +
    (stato === 'saltato' ? `<path class="croce" d="M6 ${h - 8} L${w - 6} 12"/>` : '') + `</svg>`;
}

// ---------- stanza (coricata: le 8 righe corrono in orizzontale, il giocatore entra da sinistra) ----------
function geo(s, x0, y0) {
  const H = Math.sqrt(3) * s;
  const c = ([r, e]) => [x0 + s + (r - 1) * 1.5 * s, y0 + H / 2 + (e - 1) * H + (r % 2 ? H / 2 : 0)];
  const esa = (cx, cy, k) => { k = k || 1; let p = []; for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i; p.push((cx + s * k * Math.cos(a)).toFixed(1) + ',' + (cy + s * k * Math.sin(a)).toFixed(1)); } return p.join(' '); };
  return { c, esa, H, w: 12.5 * s, h: 6.5 * H };
}
function stanza(st, o) {
  const g = geo(o.s, o.x0, o.y0), big = !!o.big, s = o.s;
  let out = `<svg class="mappa ${big ? 'grande' : 'piccola'}" width="${o.W}" height="${o.Hh}" viewBox="0 0 ${o.W} ${o.Hh}">`;
  out += `<defs><pattern id="tratteggio" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#1d190f"/><rect width="2" height="6" fill="#4a3f2b"/></pattern></defs>`;
  const ter = {}; st.terreno.forEach(t => ter[t.at.join()] = t.tipo);
  for (let r = 1; r <= 8; r++) for (let e = 1; e <= 6; e++) {
    const [cx, cy] = g.c([r, e]), t = ter[r + ',' + e];
    out += `<polygon class="cas ${t || ''}" points="${g.esa(cx, cy, 0.94)}"/>`;
    if (t === 'trap') out += `<path class="trappola" d="M${cx - s * .32} ${cy + s * .3} L${cx} ${cy - s * .36} L${cx + s * .32} ${cy + s * .3} Z"/>` + (big ? `<text class="t12 scuro" x="${cx}" y="${cy + s * .24}" text-anchor="middle">3</text>` : '');
  }
  // spinte (solo vista grande)
  if (big && o.spinta) o.spinta.forEach(sp => {
    const [cx, cy] = g.c(sp.cell);
    if (sp.status === 'wall') out += `<polygon class="spinta muro" points="${g.esa(cx, cy, 0.94)}"/><text class="t13 forte ottone" x="${cx}" y="${cy - 3}" text-anchor="middle">muro</text><text class="t12 ottone" x="${cx}" y="${cy + 11}" text-anchor="middle">1 danno</text>`;
    else out += `<polygon class="spinta libera" points="${g.esa(cx, cy, 0.94)}"/><text class="t13 forte ottone" x="${cx}" y="${cy + 4}" text-anchor="middle">libera</text>`;
  });
  // percorsi e arrivi dei nemici
  (st.anteprima || []).forEach(a => {
    if (!a.path || !a.path.length) return;
    if (big && !a.reach) return;
    const pts = [a.from].concat(a.path).map(g.c);
    out += `<polyline class="percorso ${a.reach ? 'colpisce' : ''}" points="${pts.map(p => p.map(n => n.toFixed(1)).join(',')).join(' ')}"/>`;
    const [ex, ey] = g.c(a.end);
    out += `<circle class="arrivo ${a.reach ? 'colpisce' : ''}" cx="${ex}" cy="${ey}" r="${big ? 9 : 5}"/>`;
    if (big) out += `<text class="t12 forte sangue" x="${ex}" y="${ey + 4}" text-anchor="middle">${a.owner.slice(1)}</text>`;
  });
  // giocatore
  const [px, py] = g.c(st.giocatore.pos), rt = big ? 15 : 11;
  out += `<circle class="tu" cx="${px}" cy="${py - (big ? 4 : 0)}" r="${rt}"/><text class="${big ? 't14' : 't12'} forte scuro" x="${px}" y="${py + (big ? 1 : 4)}" text-anchor="middle">Tu</text>`;
  
  // nemici
  const prev = {}; (st.anteprima || []).forEach(a => prev[a.owner] = a);
  st.nemici.filter(n => n.vivo).forEach(n => {
    const [cx, cy] = g.c(n.pos), a = prev[n.id] || {}, colp = a.reach && a.dmg > 0;
    const valido = !o.bersagli || o.bersagli.indexOf(n.id) >= 0, scelto = o.scelto === n.id;
    out += `<g class="nem ${colp ? 'colpisce' : ''} ${valido ? '' : 'lontano'} ${scelto ? 'scelto' : ''}">`;
    if (scelto) out += `<polygon class="alone" points="${g.esa(cx, cy, 0.94)}"/>`;
    out += `<circle cx="${cx}" cy="${cy - (big ? 4 : 0)}" r="${rt}"/><text class="${big ? 't14' : 't12'} forte" x="${cx}" y="${cy + (big ? 1 : 4)}" text-anchor="middle">${n.id}</text>`;
    if (big) {
      const sh = n.stati.shield ? n.stati.shield[0] + n.stati.shield[1] : 0;
      const st1 = sh ? ['sc', 'scudo', sh] : n.stati.stun ? ['st', 'stordito', ''] : n.stati.vulnFire ? ['vf', 'fuoco', '×2'] : null;
      const dx = st1 ? (st1[2] === '' ? 8 : 13) : 0;
      out += `<text class="t12 hp" x="${cx - dx}" y="${cy + 21}" text-anchor="middle">${n.hp}/${n.hpMax}</text>`;
      if (st1) out += `<g class="stato ${st1[0]}"><svg x="${cx - dx + 10}" y="${cy + 10.500}" width="12" height="12" viewBox="0 0 24 24"><path d="${P[st1[1]]}"/></svg><text class="t12 forte" x="${cx - dx + 23}" y="${cy + 21}">${st1[2]}</text></g>`;
      if (colp) out += `<g class="danno"><rect x="${cx - 30}" y="${cy - 25}" width="25" height="16" rx="2"/><text class="t13 forte" x="${cx - 17.500}" y="${cy - 12.500}" text-anchor="middle">−${a.dmg}</text></g>`;
    }
    out += `</g>`;
  });
  return out + `</svg>`;
}

// ---------- carte ----------
function costo(c) {
  const k = Object.keys(c || {});
  if (!k.length) return `<span class="costo gratis">0</span>`;
  return `<span class="costo">` + k.map(x => x === 'pt' ? `<b class="c-pt">${c[x]}${ico('pt')}</b>` : `<b class="c-${x}">${c[x]}${ico(x)}</b>`).join('') + `</span>`;
}
const senzaCosto = t => t.replace(/^[^:]+:\s*/, '').replace(/^./, m => m.toUpperCase());
const BREVE_PRE = { // forma breve dei testi liberi lunghi (mano); il testo intero sta sulla carta ingrandita
  cu: 'Gratis, senza nemici adiacenti. Consuma 2 tuoi dadi vicini: corri dritto fino alla loro somma. Danni = caselle.'
};
function carta(c, o) {
  o = o || {};
  const fam = c.family === 'free' ? 'libera' : c.family;
  const gl = { vigore: 'forza', fuoco: 'fuoco', terrore: 'presagio', free: 'luce' }[c.family];
  let az = '';
  const pre = o.intera ? c.pre : (BREVE_PRE[c.id] || c.pre);
  if (pre) az += `<p class="pre">${pre}</p>`;
  (o.azioni || c.azioni).forEach((a, i) => {
    const info = o.info ? o.info[i] : null;
    az += `<div class="az ${info ? info.cls : ''}">${costo(a.cost || (c.azioni[i] && c.azioni[i].cost))}<span class="eff">${senzaCosto(a.testo)}${info && info.nota ? `<em class="nota">${info.nota}</em>` : ''}</span></div>`;
  });
  if (c.post) az += `<p class="pre">${c.post}</p>`;
  const eco = c.eco.split(' · ').map(e => `<b>${e}</b>`).join('');
  return `<article class="carta f-${fam} ${o.cls || ''}" style="${o.style || ''}">` +
    `<header><span class="sigillo">${ico(gl)}</span><span class="cd" title="Cooldown">CD ${c.cd}</span><h3>${c.nome}</h3></header>` +
    `<div class="corpo">${az}</div>${o.extra || ''}` +
    `<footer><i>Eco</i>${eco}</footer></article>`;
}

// ---------- risorse ----------
function risorse(g, dopo) {
  const r = (n, lab, v, cls) => `<span class="ris ${cls || ''}">${ico(n)}<b>${v}</b><i>${lab}</i></span>`;
  return `<div class="risorse">` + r('hp', 'HP', g.hp + '/' + g.hpMax, 'r-hp') + r('pt', 'PT', g.pt, 'r-pt') + r('pm', 'PM', g.pm, 'r-pm') +
    r('luce', 'Luce', dopo && dopo.luce !== g.luce ? `${g.luce}<u>→ ${dopo.luce}</u>` : g.luce, 'r-luce') +
    (g.stati && g.stati.vuln ? `<span class="ris r-stato"><b>Vulnerabile ×2</b></span>` : '') + `</div>`;
}

const CSS = `
:root{
  --rame-nero:#0b1110; --tavolo:#121b19; --tavolo-chiaro:#1b2825; --riga:#2f423d;
  --osso:#ece2c8; --spento:#98a69f;
  --ottone:#c8a655; --ottone-scuro:#6e5b2c; --verderame:#6cbca8;
  --sangue:#ec6249; --putrido:#bccb62;
  --fuoco:#f08d3e; --terrore:#b094ee; --luce:#f7efb6;
  --carta:#e6dcc2; --carta-ombra:#cdc1a2; --inchiostro:#1a1714;
  --f-nome:'Grenze Gotisch','IM Fell English',Georgia,serif;
  --f-testo:'Asap Condensed','Arial Narrow',system-ui,sans-serif;
}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#050807}
body{font-family:var(--f-testo);font-size:13px;line-height:1.15;color:var(--osso);font-variant-numeric:lining-nums;-webkit-font-smoothing:antialiased}
.palco{position:relative;width:844px;height:390px;overflow:hidden;margin:0 auto;
  background:radial-gradient(120% 90% at 30% 110%, #1c2a26 0%, var(--tavolo) 45%, var(--rame-nero) 100%)}
.palco::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(94deg,rgba(255,255,255,.012) 0 2px,transparent 2px 7px);pointer-events:none}
.ico{width:1em;height:1em;fill:currentColor;vertical-align:-.12em;flex:none}
i,em{font-style:normal}

/* riga di orientamento */
.dove{position:absolute;left:12px;top:5px;height:24px;display:flex;align-items:baseline;gap:10px;white-space:nowrap}
.dove h1{font-family:var(--f-nome);font-weight:600;font-size:21px;line-height:24px;color:var(--osso);letter-spacing:.2px}
.dove .turno{font-size:13px;color:var(--spento)}
.dove .fai{font-size:13px;color:var(--osso)}
.risorse{position:absolute;top:6px;height:22px;display:flex;gap:12px;align-items:center;white-space:nowrap}
.ris{display:inline-flex;align-items:baseline;gap:3px;font-size:13px}
.ris .ico{font-size:13px;align-self:center}
.ris b{font-size:16px;font-weight:700}
.ris i{font-size:12px;color:var(--spento)}
.ris u{text-decoration:none;color:var(--luce);margin-left:3px}
.r-hp .ico{color:var(--sangue)} .r-pt .ico{color:var(--terrore)} .r-pm .ico{color:var(--osso)} .r-luce .ico{color:var(--luce)}
.r-stato b{font-size:13px;color:var(--sangue)} .r-stato i{color:var(--sangue)}

/* dadi */
.dado{display:block;overflow:visible}
.dado text{font-family:var(--f-testo);font-weight:700}
.d-vigore rect{fill:var(--osso);stroke:#fff8e2;stroke-width:1}
.d-vigore text,.d-vigore svg{fill:var(--inchiostro)}
.d-fuoco>path{fill:var(--fuoco);stroke:#ffc58a;stroke-width:1}
.d-fuoco text,.d-fuoco svg{fill:var(--inchiostro)}
.d-terrore>path{fill:#3b2c66;stroke:var(--terrore);stroke-width:1.500}
.d-terrore text{fill:#f1eaff}
.d-nemico>path{fill:#070a09;stroke:var(--putrido);stroke-width:1.500}
.d-nemico text{fill:var(--putrido)}
.d-nemico .croce{stroke:var(--spento);stroke-width:2;fill:none}
.d-nemico.saltato>path{stroke:var(--spento);stroke-dasharray:3 3}
.d-nemico.saltato text{fill:var(--spento)}
.dado.scartato rect,.dado.scartato>path{fill:none;stroke:var(--spento);stroke-dasharray:4 3;stroke-width:1.500}
.dado.scartato text,.dado.scartato svg{fill:var(--spento)}

/* Sequenza Vincolata */
.sequenza{position:absolute;left:12px;display:flex}
.posto{position:relative;flex:none;text-align:center;white-space:nowrap}
.posto .su,.posto .giu{position:absolute;left:-4px;right:-4px;font-size:12px;line-height:14px}
.posto .dado{position:absolute;left:50%;transform:translateX(-50%)}

.fase-sel .sequenza{top:34px;height:118px}
.fase-sel .posto{width:71px;height:118px}
.fase-sel .posto .su{top:0} .fase-sel .posto .giu{top:102px}
.fase-sel .mio .dado{top:17px}
.fase-sel .mio.via .dado{top:38px;transform:translateX(-50%) rotate(-9deg)}
.fase-sel .mio .su{color:var(--verderame);font-weight:600}
.fase-sel .mio .giu{color:var(--spento)}
.fase-sel .mio.via .su{color:var(--sangue);font-weight:500}
.fase-sel .mio.via .giu{color:var(--inchiostro);font-weight:700}
.fase-sel .mio.via .giu span{background:var(--luce);padding:0 5px;display:inline-block}
.fase-sel .mio:not(.via)::after{content:"";position:absolute;left:8px;right:8px;top:77px;height:3px;background:var(--verderame)}
.fase-sel .loro .dado{top:26px}
.fase-sel .loro .su{color:var(--putrido);font-weight:600}
.fase-sel .loro .giu{font-size:14px;font-weight:700;color:var(--sangue)}
.fase-sel .loro .giu.no{font-size:12px;font-weight:500;color:var(--spento)}
.fase-sel .loro .giu.sc{font-size:12px;font-weight:600;color:var(--verderame)}
.verso{position:absolute;left:12px;top:153px;font-size:12px;color:var(--spento);white-space:nowrap}

/* pulsante primario: uno solo per schermata */
.primo{position:absolute;display:block;border:0;font-family:var(--f-testo);color:var(--inchiostro);background:var(--ottone);
  clip-path:polygon(9px 0,100% 0,100% calc(100% - 9px),calc(100% - 9px) 100%,0 100%,0 9px);text-align:left;padding:9px 10px 8px 12px}
.primo strong{display:block;font-family:var(--f-nome);font-weight:700;font-size:21px;line-height:22px}
.primo span{display:block;font-size:13px;line-height:15px;font-weight:600;margin-top:4px}
.secondo{position:absolute;display:block;background:none;border:1.500px solid var(--ottone-scuro);color:var(--osso);font-family:var(--f-testo);font-size:14px;font-weight:600;text-align:center}

/* carte: carta chiara stampata, Eco sempre al piede */
.carta{position:absolute;background:var(--carta);color:var(--inchiostro);border-radius:5px;display:flex;flex-direction:column;
  box-shadow:0 0 0 1px #000,0 3px 0 #000,0 10px 18px rgba(0,0,0,.55);overflow:hidden}
.carta::after{content:"";position:absolute;inset:3px;border:1px solid rgba(26,23,20,.28);border-radius:3px;pointer-events:none}
.carta header,.carta footer{flex:none}
.carta header{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:3px 4px;padding:6px 7px 5px 6px}
.carta .sigillo{width:18px;height:18px;border-radius:50%;display:grid;place-items:center;background:var(--inchiostro);color:var(--carta);font-size:12px;flex:none;margin-top:1px}
.carta h3{font-family:var(--f-nome);font-weight:600;font-size:17px;line-height:16px;flex:none;width:100%;letter-spacing:.1px}
.carta .cd{font-size:12px;font-weight:700;line-height:13px;border:1px solid var(--inchiostro);padding:1px 3px;white-space:nowrap;flex:none}
.carta .corpo{flex:1;padding:0 6px;display:flex;flex-direction:column;gap:5px}
.carta .pre{font-size:12px;line-height:13.500px;font-style:italic}
.carta .az{display:flex;gap:5px;align-items:flex-start;font-size:12.500px;line-height:13.500px}
.carta .costo{flex:none;min-width:25px;display:inline-flex;flex-direction:column;gap:1px}
.carta .costo b{display:inline-flex;align-items:center;justify-content:center;gap:1px;height:17px;padding:0 3px;font-size:13px;font-weight:700;color:var(--carta);background:var(--inchiostro)}
.carta .costo .ico{font-size:11px}
.carta .costo .c-fuoco{background:#a8480f} .carta .costo .c-presagio,.carta .costo .c-pt{background:#4a3684}
.carta .costo.gratis{height:17px;align-items:center;justify-content:center;border:1px solid var(--inchiostro);font-size:13px;font-weight:700}
.carta .eff{flex:1;font-weight:500}
.carta footer{background:#1b2a27;color:var(--osso);padding:4px 6px 5px;display:flex;flex-wrap:wrap;gap:1px 7px;align-items:baseline;font-size:12.500px;line-height:14px;position:relative}
.carta footer i{font-family:var(--f-nome);font-size:14px;color:var(--ottone);width:100%;line-height:13px}
.carta footer b{font-weight:600;white-space:nowrap}
.f-fuoco .sigillo{background:#a8480f} .f-terrore .sigillo{background:#4a3684} .f-libera .sigillo{background:#1b2a27;color:var(--luce)}
.f-fuoco{background:linear-gradient(#ecd3b2,var(--carta) 46px)} .f-terrore{background:linear-gradient(#d9cfe6,var(--carta) 46px)} .f-libera{background:linear-gradient(#d3ddd0,var(--carta) 46px)}

/* la mano a ventaglio */
.mano .carta{width:110px;height:208px;transform-origin:50% 100%}

/* la stanza: finestra piccola che cresce quando serve */
.stanza{position:absolute;background:#070b0a;border:1px solid var(--ottone-scuro);box-shadow:inset 0 0 0 3px #070b0a,inset 0 0 0 4px rgba(200,166,85,.18)}
.stanza .targa{position:absolute;left:8px;right:8px;display:flex;justify-content:space-between;align-items:baseline;white-space:nowrap}
.stanza .targa h2{font-family:var(--f-nome);font-weight:500;font-size:16px;color:var(--osso)}
.stanza .targa span{font-size:12px;color:var(--ottone)}
.mappa{position:absolute;left:0;top:0}
.mappa text{font-family:var(--f-testo)}
.t12{font-size:12px} .t13{font-size:13px} .t14{font-size:14px} .forte{font-weight:700}
.scuro{fill:var(--inchiostro)} .ottone{fill:var(--ottone)} .sangue{fill:var(--sangue)}
.cas{fill:#16211e;stroke:#2a3b36;stroke-width:1}
.cas.column{fill:#39413c;stroke:#6b756e}
.cas.trap{fill:#2a1d18;stroke:#8a4a3a}
.trappola{fill:var(--sangue)}
.tu{fill:var(--osso);stroke:#fff;stroke-width:1.500}
.nem circle{fill:#070a09;stroke:var(--putrido);stroke-width:1.500}
.nem text{fill:var(--putrido)}
.nem.colpisce circle{stroke:var(--sangue);stroke-width:2.500}
.nem .hp{fill:var(--osso)}
.nem.lontano{opacity:.62}
.nem .alone{fill:rgba(200,166,85,.2);stroke:var(--ottone);stroke-width:2.500}
.nem.scelto circle{stroke:var(--ottone);stroke-width:2.500}
.stato rect{fill:#0b1110;stroke:var(--spento);stroke-width:1}
.stato path{fill:var(--osso)} .stato text{fill:var(--osso)}
.stato.vf path{fill:var(--fuoco)} .stato.sc path{fill:var(--verderame)}
.danno rect{fill:var(--sangue)} .danno text{fill:#190806}
.percorso{fill:none;stroke:var(--putrido);stroke-width:1.500;stroke-dasharray:2 4;opacity:.75}
.percorso.colpisce{stroke:var(--sangue);stroke-dasharray:none;stroke-width:2;opacity:1}
.arrivo{fill:#0b1110;stroke:var(--putrido);stroke-width:1.500;stroke-dasharray:2 2}
.arrivo.colpisce{stroke:var(--sangue);stroke-dasharray:none;stroke-width:2}
.spinta.libera{fill:rgba(200,166,85,.22);stroke:var(--ottone);stroke-width:2.500}
.spinta.muro{fill:url(#tratteggio);stroke:var(--ottone);stroke-width:2.500}
.mappa.grande .cas{stroke:#33463f}

.nota-pie{position:absolute;font-size:12px;color:var(--spento);white-space:nowrap}
`;

function pagina(titolo, cls, corpo, extraCss) {
  return `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=844,initial-scale=1">` +
    `<title>${titolo}</title>${FONTS}<style>${CSS}${extraCss || ''}</style></head><body><main class="palco ${cls}">${corpo}</main></body></html>`;
}

// =====================================================================
// SELEZIONE (SP1 con proposta iniziale)
// =====================================================================
function selezione() {
  const st = D.stati.sel_proposta, plan = st.selezione.plan, prev = {};
  st.anteprima.forEach(a => prev[a.uid] = a);
  let seq = '';
  st.seq.forEach(d => {
    if (d.kind === 'ai') {
      const a = prev[d.uid];
      let giu = a.shield ? `<div class="giu sc">+${a.shield} Scudi</div>` : (a.reach && a.dmg > 0 ? `<div class="giu">−${a.dmg} HP</div>` : `<div class="giu no">non arriva</div>`);
      seq += `<div class="posto loro"><div class="su">${d.nome.replace('Attacco ', '')}</div>${lapide(d.owner, 46)}${giu}</div>`;
    } else {
      const p = plan.dice[d.uid], via = !p.kept;
      const su = via ? 'nessuno slot' : `slot ${p.slot} ${p.cost ? p.cost + ' Luce' : 'libero'}`;
      seq += `<div class="posto mio ${via ? 'via' : ''}"><div class="su">${su}</div>${dado(d.kind, d.value, 56, via ? 'scartato' : '')}` +
        `<div class="giu"><span>scarto ${RESA[d.kind]}</span></div></div>`;
    }
  });
  const tenuti = Object.values(plan.dice).filter(x => x.kept).length, scartati = Object.values(plan.dice).length - tenuti;
  const guad = Object.entries(plan.gains).filter(([, v]) => v).map(([k, v]) => `+${v} ${{ pm: 'PM', luce: 'Luce', pt: 'PT' }[k]}`).join(', ');
  const rot = [-4, -2, 0, 2, 4], giu = [9, 3, 0, 3, 9];
  let mano = '';
  st.mano.forEach((c, i) => { mano += carta(c, { style: `left:${20 + i * 110}px;top:${168 + giu[i]}px;transform:rotate(${rot[i]}deg)` }); });
  const S = 16.5, W = 246, Hh = 222;
  const corpo =
    `<div class="dove"><h1>Selezione</h1><span class="turno">turno ${st.turno}, Veglia fino al ${st.stanza.veglia}</span>` +
    `<span class="fai">Tocca un tuo dado per tenerlo o scartarlo.</span><span class="turno">Mazzo ${st.mazzo}, Plancia vuota</span></div>` +
    risorse(st.giocatore, { luce: plan.luceAfter }).replace('class="risorse"', 'class="risorse" style="right:12px"') +
    `<div class="sequenza">${seq}</div>` +
    `<button class="primo" style="left:734px;top:44px;width:100px;height:98px"><strong>Conferma</strong><span>tieni ${tenuti}, scarti ${scartati}</span><span>${guad}</span></button>` +
    `<div class="mano">${mano}</div>` +
    `<section class="stanza" style="left:588px;top:162px;width:${W}px;height:${Hh}px">` +
    stanza(st, { s: S, x0: (W - 12.5 * S) / 2, y0: 28, W, Hh }) +
    `<div class="targa" style="top:4px"><h2>${st.stanza.nome}</h2><span>${ico('espandi')} tocca per ingrandire</span></div></section>`;
  const extra = `.fase-sel .dove .fai{margin-left:4px}`;
  return pagina('The Long Night · La mano · Selezione', 'fase-sel', corpo, extra);
}

// =====================================================================
// RISOLUZIONE con una carta in uso (Attacco Poderoso, Azione 2 su Z4)
// =====================================================================
function risoluzione() {
  const st = D.stati.carta_aperta, ap = st.aperta, prev = {};
  st.anteprima.forEach(a => prev[a.uid] = a);
  const def = D.carte.find(c => c.id === ap.id);
  let seq = '';
  st.seq.forEach(d => {
    if (d.kind === 'ai') {
      const a = prev[d.uid];
      if (a.spento) seq += `<div class="posto loro">${lapide(d.owner, 40, 'saltato')}<div class="giu no">stordito</div></div>`;
      else seq += `<div class="posto loro">${lapide(d.owner, 40)}` + (a.reach && a.dmg > 0 ? `<div class="giu">−${a.dmg} HP</div>` : `<div class="giu no">non arriva</div>`) + `</div>`;
    } else if (d.state === 'active') {
      seq += `<div class="posto mio ora">${dado(d.kind, d.value, 54)}<div class="giu">adesso</div></div>`;
    } else seq += `<div class="posto mio">${dado(d.kind, d.value, 44)}<div class="giu no">tuo</div></div>`;
  });
  // carta in uso, ingrandita
  const info = [
    { cls: 'passata', nota: ap.azioni[0].motivo },
    { cls: 'viva', nota: 'Fatta 1 volta su Z4. Resta 1 ✊: scegli la casella nella stanza.'.replace('✊', ico('forza')) }
  ];
  const grande = carta(def, { cls: 'in-uso', intera: true, info, style: 'left:12px;top:124px;width:192px;height:258px' });
  // il resto della mano: carte vere, infilate dietro
  let resto = '';
  st.mano.forEach((c, i) => {
    resto += carta(c, { cls: 'dietro', style: `left:${212 + i * 3}px;top:${124 + i * 47}px;width:112px;height:${i === 3 ? 96 : 150}px;z-index:${i + 1}` });
  });
  const voce = st.plancia.voci[0];
  const W = 364, Hh = 376, S = 26;
  const bers = ap.bersagli.filter(b => !b.motivo).map(b => b.id);
  const corpo =
    `<div class="dove"><h1>Risoluzione</h1><span class="turno">turno ${st.turno}</span></div>` +
    risorse(st.giocatore).replace('class="risorse"', 'class="risorse" style="left:160px"') +
    `<div class="sequenza">${seq}</div>` +
    grande + `<div class="mano-dietro">${resto}</div>` +
    `<p class="ferme">Ferme: una carta è aperta</p>` +
    `<aside class="pugno">` +
    `<div class="impulsi">${dado('vigore', 2, 50)}<div><span class="pip speso"></span><span class="pip"></span><p>resta <b>${st.res.pool.forza} ${ico('forza')}</b> di 2</p></div></div>` +
    `<div class="plancia"><span class="mini"></span><p><b>In Plancia</b>${voce.nome}: copre lo slot ${voce.slot}, torna a Fine Turno.</p></div>` +
    `<p class="avviso">Muoverti, aprire un'altra carta o passare al dado dopo la chiude.</p>` +
    `<button class="secondo" style="left:0;bottom:20px;width:124px;height:44px">Chiudi la carta</button>` +
    `<p class="perche">Già usata: non torna in mano.</p>` +
    `</aside>` +
    `<section class="stanza" style="left:472px;top:7px;width:${W}px;height:${Hh}px">` +
    stanza(st, { s: S, x0: (W - 12.5 * S) / 2, y0: 52, W, Hh, big: true, spinta: ap.spinta, bersagli: bers, scelto: ap.bersaglio }) +
    `<div class="chiede"><h2>Dove spingi ${ap.bersaglio}?</h2><p>Tocca una casella color ottone. Contro il muro è Collisione.</p></div>` +
    `<div class="nota-pie" style="right:10px;bottom:6px;text-align:right">${st.stanza.nome}. In rosso: danni<br>che subirai se nulla cambia.</div></section>`;
  const extra = `
.fase-ris .risorse{gap:9px}
.fase-ris .sequenza{top:34px;height:84px;left:12px}
.fase-ris .posto{width:56px;height:84px}
.fase-ris .posto .dado{top:14px}
.fase-ris .posto.ora .dado{top:6px}
.fase-ris .posto.loro .dado{top:16px}
.fase-ris .posto .giu{top:66px}
.fase-ris .posto .giu{font-size:13px;font-weight:700;color:var(--sangue)}
.fase-ris .posto .giu.no{font-size:12px;font-weight:500;color:var(--spento)}
.fase-ris .posto.ora .giu{color:var(--inchiostro);font-size:12px}
.fase-ris .posto.ora .giu{background:var(--ottone);left:6px;right:6px}
.fase-ris .posto.ora::before{content:"";position:absolute;left:-1px;right:-1px;top:0;bottom:-2px;border:1.500px solid var(--ottone);border-bottom:0;background:rgba(200,166,85,.1)}
.in-uso header{padding:8px 9px 5px;flex-wrap:nowrap;align-items:flex-start;justify-content:flex-start}
.in-uso h3{order:2;flex:1 !important;width:auto !important}
.in-uso .cd{order:3}
.in-uso h3{font-size:23px;line-height:21px}
.in-uso .sigillo{width:22px;height:22px;font-size:14px}
.in-uso .corpo{padding:0 9px;gap:6px}
.in-uso .pre{font-size:13px;line-height:15px}
.in-uso .az{font-size:13.500px;line-height:15px;padding:5px 5px 5px 5px;margin:0 -5px}
.in-uso .az .nota{display:inline-block;font-size:12px;line-height:13.500px;font-weight:500;margin-top:2px}
.in-uso .az.passata .eff{color:#6d6658}
.in-uso .az.passata .costo b{background:#8e8672}
.in-uso .az.passata .eff{text-decoration:line-through;text-decoration-color:#6d6658}
.in-uso .az.passata .nota{text-decoration:none;color:#5a2a1e;font-weight:600}
.in-uso .az.viva{background:#f7efd6;box-shadow:0 0 0 2px var(--inchiostro),3px 3px 0 var(--ottone-scuro)}
.in-uso .az.viva .nota .ico{font-size:11px}
.pugno .avviso{position:absolute;left:0;right:0;top:146px;font-size:12px;line-height:14px;color:var(--osso)}
.in-uso footer{opacity:.75}
.dietro{box-shadow:0 0 0 1px #000,0 -2px 8px rgba(0,0,0,.5)}
.dietro header{min-height:44px;flex-wrap:nowrap;align-items:flex-start;justify-content:flex-start}
.dietro h3{order:2;flex:1 !important;width:auto !important;font-size:16px !important;line-height:15px !important}
.dietro .cd{order:3}
.dietro footer{display:none}
.dietro{filter:brightness(.82)}
.ferme{position:absolute;left:214px;top:367px;width:118px;font-size:12px;color:var(--osso);background:#0b1110;padding:2px 5px;z-index:9;white-space:nowrap;border-left:3px solid var(--ottone-scuro)}
.pugno{position:absolute;left:341px;top:124px;width:124px;height:260px}
.impulsi{display:flex;gap:8px;align-items:center}
.impulsi .pip{display:inline-block;width:16px;height:16px;border-radius:50%;background:var(--osso);margin-right:5px;border:1.500px solid var(--osso)}
.impulsi .pip.speso{background:none;border-style:dashed;border-color:var(--spento)}
.impulsi p{font-size:13px;margin-top:3px;white-space:nowrap} .impulsi p b{font-size:15px}
.plancia{position:absolute;top:68px;left:0;right:0;display:flex;gap:9px;align-items:flex-start;border-top:1px solid var(--riga);padding-top:9px}
.plancia .mini{flex:none;width:22px;height:31px;margin:2px 2px 0 5px;background:var(--carta);border-radius:2px;box-shadow:0 0 0 1px #000;transform:rotate(0deg);background:linear-gradient(#d9cfe6 9px,var(--carta) 9px)}
.plancia p{font-size:12px;line-height:14px;color:var(--osso)}
.plancia b{display:block;font-family:var(--f-nome);font-weight:500;font-size:15px;color:var(--ottone)}
.pugno .perche{position:absolute;left:0;bottom:1px;white-space:nowrap;font-size:12px;color:var(--spento);line-height:13px}
.chiede{position:absolute;left:10px;top:7px;right:10px}
.chiede h2{font-family:var(--f-nome);font-weight:600;font-size:22px;line-height:22px;color:var(--ottone)}
.chiede p{font-size:13px;color:var(--osso);margin-top:1px}
`;
  return pagina('The Long Night · La mano · Risoluzione, carta in uso', 'fase-ris', corpo, extra);
}

fs.writeFileSync(path.join(OUT, 'selezione_telefono.html'), selezione());
fs.writeFileSync(path.join(OUT, 'risoluzione_carta_telefono.html'), risoluzione());
console.log('scritti: selezione_telefono.html, risoluzione_carta_telefono.html');
