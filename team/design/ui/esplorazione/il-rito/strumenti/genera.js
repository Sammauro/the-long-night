// Il Rito — genera i due mockup statici (844×390) con i font incorporati.
// Uso: FONTSOURCE_DIR=<node_modules con @fontsource/grenze e grenze-gotisch> node genera.js
'use strict';
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, '..');
const DATI = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../bozze_B1.3b/strumenti/dati_mockup.json'), 'utf8'));
const FD = process.env.FONTSOURCE_DIR || path.join(__dirname, 'node_modules');

function face(fam, pkg, w, style) {
  const f = path.join(FD, '@fontsource', pkg, 'files', `${pkg}-latin-${w}-${style}.woff2`);
  if (!fs.existsSync(f)) { console.warn('font mancante', f); return ''; }
  return `@font-face{font-family:'${fam}';font-style:${style};font-weight:${w};font-display:block;src:url(data:font/woff2;base64,${fs.readFileSync(f).toString('base64')}) format('woff2');}`;
}
const FONTS = [400, 500, 700].map(w => face('Grenze', 'grenze', w, 'normal')).join('') +
  face('Grenze', 'grenze', 400, 'italic') + [500, 700].map(w => face('Grenze Gotisch', 'grenze-gotisch', w, 'normal')).join('');

// ---------- geometria ----------
const C = { x: 34, y: 195 }, R = 166, RI = 110, RC = 137, RH = 86;
const pol = (r, deg) => { const a = deg * Math.PI / 180; return [C.x + r * Math.sin(a), C.y - r * Math.cos(a)]; };
const hx = Rr => 258 + 39 * (Rr - 1);
const hy = (Rr, E) => 56.5 + 45 * (E - 1) + (Rr % 2 ? 22.5 : 0);
const hc = c => [hx(c[0]), hy(c[0], c[1])];
const HEXP = '26,0 13,22.5 -13,22.5 -26,0 -13,-22.5 13,-22.5';
const f1 = n => Math.round(n * 10) / 10;
const sg = (id, cls) => `<svg class="sg ${cls || ''}" viewBox="0 0 16 16"><use href="#g-${id}"/></svg>`;
const KIND = { vigore: 'forza', fuoco: 'fuoco', terrore: 'presagio' };
const GAIN = { vigore: 'PM', fuoco: 'Luce', terrore: 'PT' };
const ACT = { orda: 'orda', morso: 'morso', incassare: 'scudo' };

const DEFS = `
<svg width="0" height="0" style="position:absolute"><defs>
<symbol id="g-forza" viewBox="0 0 16 16"><path fill="currentColor" d="M3.3 7.4V5.3a1.25 1.25 0 0 1 2.5 0v-.8a1.25 1.25 0 0 1 2.5 0v.5a1.25 1.25 0 0 1 2.5 0v.9a1.1 1.1 0 0 1 2.2 0V10c0 2.7-1.9 4.6-4.8 4.6S3.3 12.9 3.3 10.4z"/><path d="M3.6 8.7h5.3c1 0 1 1.7 0 1.7H6.6" fill="none" stroke="#000" stroke-opacity=".55" stroke-width="1"/></symbol>
<symbol id="g-fuoco" viewBox="0 0 16 16"><path fill="currentColor" d="M8.4 1c.5 2.7 3.6 4.3 3.6 8.2A4 4 0 0 1 8 15a4 4 0 0 1-4-5.4c.2-1.7 1.1-2.6 1.8-3.8.3 1 .8 1.7 1.4 2C7 5.5 7.5 3.1 8.4 1z"/></symbol>
<symbol id="g-presagio" viewBox="0 0 16 16"><path d="M1 8c1.8-3 4.2-4.6 7-4.6S13.2 5 15 8c-1.8 3-4.2 4.6-7 4.6S2.8 11 1 8z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="8" cy="8" r="2.4" fill="currentColor"/></symbol>
<symbol id="g-luce" viewBox="0 0 16 16"><circle cx="8" cy="8" r="2.8" fill="currentColor"/><path d="M8 .8v2.6M8 12.6v2.6M.8 8h2.6M12.6 8h2.6M2.9 2.9l1.8 1.8M11.3 11.3l1.8 1.8M13.1 2.9l-1.8 1.8M4.7 11.3l-1.8 1.8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></symbol>
<symbol id="g-pm" viewBox="0 0 16 16"><ellipse cx="5" cy="10.6" rx="2.3" ry="3.7" fill="currentColor"/><ellipse cx="11" cy="5.4" rx="2.3" ry="3.7" fill="currentColor"/></symbol>
<symbol id="g-hp" viewBox="0 0 16 16"><path fill="currentColor" d="M8 14.2S1.8 10.2 1.8 5.9A3.3 3.3 0 0 1 8 4.3a3.3 3.3 0 0 1 6.2 1.6c0 4.3-6.2 8.3-6.2 8.3z"/></symbol>
<symbol id="g-pt" viewBox="0 0 16 16"><path d="M8.2 8.6a1.3 1.3 0 1 1 1.2-1.9 2.9 2.9 0 1 1-3.6-1.6 4.6 4.6 0 1 1 6.3 4.4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></symbol>
<symbol id="g-scudo" viewBox="0 0 16 16"><path fill="currentColor" d="M8 1.4l5.6 2v4.3c0 3.2-2.3 5.7-5.6 6.9-3.3-1.2-5.6-3.7-5.6-6.9V3.4z"/></symbol>
<symbol id="g-orda" viewBox="0 0 16 16"><path d="M3 13.5L6.2 2.5M7 13.5l3.2-11M11 13.5l3.2-11" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" fill="none"/></symbol>
<symbol id="g-morso" viewBox="0 0 16 16"><path fill="currentColor" d="M2 3h5l-2.5 10zM9 3h5l-2.5 10z"/></symbol>
<symbol id="g-stordito" viewBox="0 0 16 16"><path d="M8 1.5v13M2.4 4.7l11.2 6.6M13.6 4.7L2.4 11.3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></symbol>
<symbol id="g-gratis" viewBox="0 0 16 16"><circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" stroke-width="1.6"/></symbol>
<filter id="gesso" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.8"/></filter>
<filter id="grana"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="9"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 .95  0 0 0 0 .85  0 0 0 .5 -.18"/></filter>
<radialGradient id="lume"><stop offset="0" stop-color="#fff3c4" stop-opacity="1"/><stop offset=".45" stop-color="#f1d98a" stop-opacity=".55"/><stop offset="1" stop-color="#f1d98a" stop-opacity="0"/></radialGradient>
</defs></svg>`;

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --fumo:#111014; --pietra:#1b1a20; --lastra:#26242c; --lastra-bordo:#3a3742;
  --gesso:#ece5d4; --gesso-spento:#9d968a; --oro:#d2ae4f; --oro-scuro:#7c6526;
  --sangue:#b53a34; --sangue-chiaro:#f08f7e; --carta:#dccfb2; --carta-ombra:#c4b592; --inchiostro:#211b18;
  --vigore:#cdb682; --fuoco:#df6a2e; --terrore:#8a78c4; --lume:#f3dc8f; --scudo:#6aa3c9;
}
html,body{width:844px;height:390px;overflow:hidden;background:var(--fumo)}
body{font-family:'Grenze',Georgia,serif;font-size:13px;line-height:1.15;color:var(--gesso);-webkit-font-smoothing:antialiased}
#scena{position:relative;width:844px;height:390px;background:radial-gradient(520px 300px at 34px 195px,#24212a 0,#17161b 55%,var(--fumo) 100%)}
#scena>svg.strato{position:absolute;left:0;top:0;width:844px;height:390px}
.sg{width:13px;height:13px;vertical-align:-2px;display:inline-block}
.got{font-family:'Grenze Gotisch','Grenze',serif}
text{font-family:'Grenze',serif}
text.got{font-family:'Grenze Gotisch','Grenze',serif}
/* fascia domanda e voce, legate alla mappa */
#domanda{position:absolute;left:236px;top:3px;width:322px;height:28px;display:flex;align-items:baseline;justify-content:space-between;gap:8px;white-space:nowrap}
#domanda b{font-family:'Grenze Gotisch';font-weight:700;font-size:21px;color:var(--gesso);letter-spacing:.2px}
#domanda span{font-size:12px;color:var(--gesso-spento)}
#voce{position:absolute;left:236px;top:354px;width:322px;font-size:12.5px;line-height:15px;color:var(--gesso)}
#voce .r{color:var(--sangue-chiaro);font-weight:700}
#voce .o{color:var(--oro);font-weight:700}
#voce i{color:var(--gesso-spento)}
.tasca{position:absolute;font-size:12px;line-height:13.5px;color:var(--gesso-spento);font-style:italic}
/* lato destro: plancia, carte, sigillo */
#plancia{position:absolute;left:566px;top:3px;width:272px;height:44px;display:flex;align-items:center;gap:5px}
#plancia .et{width:76px;font-size:12px;line-height:13.5px;color:var(--gesso-spento)}
#plancia .et b{display:block;color:var(--gesso);font-weight:500;font-size:13px}
.posto{width:44px;height:44px;border:1.2px dashed #55505f;border-radius:2px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;color:#7d7788;position:relative;font-size:12px;line-height:12px}
.posto .sg{width:14px;height:14px}
.posto.pieno{border:1.2px solid var(--carta-ombra);color:var(--gesso)}
.posto.pieno i.mini{position:absolute;left:11px;top:15px;width:22px;height:15px;background:var(--carta);border-radius:1.5px;box-shadow:0 1px 0 #0008}
.posto.pieno b{position:relative;z-index:1;color:var(--inchiostro);font-size:12px;margin-top:1px}
.posto.futuro{border:1.2px dashed var(--oro);color:var(--oro)}
.posto small{font-size:12px;font-style:normal}
.carta{position:absolute;width:90px;height:134px;background:linear-gradient(168deg,#e6dabe 0,var(--carta) 45%,#cfc09f 100%);color:var(--inchiostro);border-radius:3px;box-shadow:0 0 0 1px #0009,2px 3px 0 #0007,inset 0 0 14px #8a744533;padding:5px 5px 0 6px;display:flex;flex-direction:column;overflow:hidden}
.carta::before{content:'';position:absolute;left:0;top:0;right:0;height:3px;background:var(--fam)}
.carta h3{font-size:13.5px;line-height:13.5px;font-weight:700;margin-top:2px;min-height:14px}
.carta .cd{float:right;margin:0 0 1px 3px;font-size:12px;font-weight:700;line-height:12px;width:19px;height:14px;text-align:center;border:1.2px solid var(--inchiostro);border-radius:2px;background:#efe5cc}
.carta .cd.c2{box-shadow:2px -2px 0 -0.5px #efe5cc,2px -2px 0 0.8px var(--inchiostro)}
.carta ul{list-style:none;margin-top:4px;flex:1}
.carta li{font-size:12px;line-height:13px;padding-left:17px;position:relative;margin-bottom:3px}
.carta li .pip{position:absolute;left:0;top:0;width:14px;height:14px;border-radius:50%;background:var(--inchiostro);color:var(--fam);display:flex;align-items:center;justify-content:center}
.carta li .pip .sg{width:10px;height:10px;vertical-align:0}
.carta li .pip.x{font-size:12px;font-weight:700;background:none;color:var(--inchiostro)}
.carta li.lib{padding-left:0}
.carta li em{font-style:normal;font-weight:700}
.carta .eco{margin:0 -5px 0 -6px;padding:2px 5px 3px 6px;background:#b9a981;border-top:1px solid #8d7d58;font-size:12px;line-height:13px}
.carta .eco i{font-style:italic;color:#5a4a2c;margin-right:3px}
.carta .nuova{position:absolute;right:0;bottom:0;width:0;height:0;border-style:solid;border-width:0 0 9px 9px;border-color:transparent transparent var(--oro-scuro) transparent}
.dorso{position:absolute;width:90px;height:134px}
.dorso i{position:absolute;width:74px;height:104px;border-radius:3px;background:#2a2230;border:1px solid #5b4f63;box-shadow:1px 1px 0 #000a}
.dorso i::after{content:'';position:absolute;inset:6px;border:1px solid #6d5f3a;border-radius:50%}
.dorso p{position:absolute;left:0;right:0;bottom:0;text-align:center;font-size:12px;color:var(--gesso-spento)}
.dorso p b{color:var(--gesso);font-weight:700}
#sigillo{position:absolute;left:566px;top:336px;width:272px;height:48px;background:linear-gradient(180deg,#dfbc5c,var(--oro) 60%,#b08f38);color:#1c1608;clip-path:polygon(8px 0,calc(100% - 8px) 0,100% 8px,100% calc(100% - 8px),calc(100% - 8px) 100%,8px 100%,0 calc(100% - 8px),0 8px);display:flex;flex-direction:column;align-items:center;justify-content:center;border:0;font-family:inherit}
#sigillo b{font-family:'Grenze Gotisch';font-weight:700;font-size:21px;line-height:21px}
#sigillo span{font-size:12px;line-height:14px;font-weight:500}
#sigillo.secondo{background:none;color:var(--gesso);box-shadow:inset 0 0 0 1.4px var(--gesso-spento);clip-path:none;border-radius:2px;top:292px;height:44px}
#sigillo.secondo b{font-size:18px;line-height:19px}
#sigillo.secondo span{color:var(--gesso-spento);font-weight:400}
/* carta aperta */
#aperta{position:absolute;left:566px;top:52px;width:272px;height:234px;background:linear-gradient(170deg,#e9ddc1 0,var(--carta) 50%,#cdbe9c 100%);color:var(--inchiostro);border-radius:3px;box-shadow:0 0 0 1px #000a,3px 4px 0 #0008,inset 0 0 22px #8a744540;padding:9px 11px 0 12px;overflow:hidden}
#aperta::before{content:'';position:absolute;left:0;top:0;right:0;height:4px;background:var(--vigore)}
#aperta h2{font-size:20px;line-height:21px;font-weight:700;display:flex;justify-content:space-between;align-items:baseline}
#aperta h2 small{font-size:12px;font-weight:500;color:#5a4a2c}
#aperta .resto{margin-top:3px;font-size:13px;line-height:17px;display:flex;align-items:center;gap:5px}
#aperta .imp{width:17px;height:17px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:var(--inchiostro);color:var(--vigore)}
#aperta .imp.speso{background:none;border:1.3px dashed #7b6a4b;color:#9b8a68}
#aperta .imp .sg{width:11px;height:11px;vertical-align:0}
#aperta .pre{font-size:12.5px;font-style:italic;color:#4a3d28;margin-top:2px}
.az{position:relative;margin:5px -11px 0 -12px;padding:5px 11px 5px 40px;min-height:46px;border-top:1px solid #a8976f}
.az .pip{position:absolute;left:12px;top:10px;width:21px;height:21px;border-radius:50%;background:var(--inchiostro);color:var(--vigore);display:flex;align-items:center;justify-content:center}
.az .pip .sg{width:13px;height:13px;vertical-align:0}
.az b{font-size:14.5px;line-height:16px;font-weight:700;display:block}
.az span{font-size:12px;line-height:14px;display:block}
.az.spenta b{color:#8b7c5e;text-decoration:line-through;text-decoration-thickness:1px}
.az.spenta .pip{background:#9b8a68;color:#d6c9a8}
.az.spenta span{color:#7a2a22;font-weight:500}
.az.ora{background:#f3e7c6;box-shadow:inset 5px 0 0 var(--oro-scuro),inset 0 0 0 1.5px var(--oro-scuro);min-height:56px}
.az.ora span{color:#3e3118}
.az.ora span u{text-decoration:none;font-weight:700;color:#6b4f08}
#aperta .piede{position:absolute;left:0;right:0;bottom:0;padding:5px 11px 6px 12px;background:#b9a981;border-top:1px solid #8d7d58;font-size:12px;line-height:14px;display:flex;justify-content:space-between;gap:10px}
#aperta .piede s{text-decoration:none;color:#6d5f44}
#aperta .piede s b{display:block;font-weight:500;text-decoration:line-through}
#aperta .piede p{text-align:right}
.cima{position:absolute;top:344px;width:64px;height:60px;background:linear-gradient(170deg,#a79d86,#958a73);color:#2c2520;border-radius:3px 3px 0 0;box-shadow:0 0 0 1px #000a;padding:4px 4px 0 5px;font-size:12px;line-height:12.5px;font-weight:700}
#attesa{position:absolute;left:566px;top:374px;width:272px;height:16px;background:#111014e6;font-size:12px;line-height:16px;font-style:italic;color:var(--gesso);text-align:center}
`;

// ---------- dadi ----------
function dadoMio(d, x, y, o) {
  o = o || {};
  const s = o.scala || 1, col = `var(--${d.kind})`;
  const forma = d.kind === 'fuoco' ? `<path d="M0,-27 L25,19 L-25,19 Z"/>`
    : d.kind === 'terrore' ? `<path d="M0,-27 L24,0 L0,27 L-24,0 Z"/>` : `<rect x="-21" y="-21" width="42" height="42" rx="4"/>`;
  const ty = d.kind === 'fuoco' ? 13 : 7;
  if (o.vuoto) return `<g transform="translate(${f1(x)},${f1(y)}) scale(${s})" fill="none" stroke="${col}" stroke-width="1.4" stroke-dasharray="3 4" opacity=".75">${forma}<text class="got" y="${ty}" text-anchor="middle" font-size="20" font-weight="500" fill="${col}" stroke="none">${d.value}</text></g>`;
  const spento = o.spento ? ' opacity=".38"' : '';
  const alone = o.attivo ? `<g transform="scale(1.24)" fill="#d2ae4f33" stroke="var(--oro)" stroke-width="2.2">${forma}</g>` : '';
  const g = KIND[d.kind];
  const gy = d.kind === 'fuoco' ? -8 : d.kind === 'terrore' ? -20 : -19, gx = d.kind === 'vigore' ? -18 : -5;
  return `<g transform="translate(${f1(x)},${f1(y)})"${spento}>${alone}<g transform="scale(${s})"><g fill="${col}" stroke="#0b0a0d" stroke-width="1.5">${forma}</g>` +
    `<g fill="none" stroke="#0005" stroke-width="1">${d.kind === 'terrore' ? '<path d="M-24,0 L24,0"/>' : d.kind === 'fuoco' ? '' : '<rect x="-17.5" y="-17.5" width="35" height="35" rx="2"/>'}</g>` +
    `<svg x="${gx}" y="${gy}" width="10" height="10" viewBox="0 0 16 16" color="#2a211c"><use href="#g-${g}"/></svg>` +
    `<text class="got" y="${ty + (d.kind === 'terrore' ? 3 : 2)}" text-anchor="middle" font-size="25" font-weight="700" fill="#17120f">${d.value}</text></g></g>`;
}
function dadoNemico(d, x, y, ant, o) {
  o = o || {};
  let riga = '', colore = 'var(--gesso-spento)';
  if (ant && ant.spento) { riga = `<text y="14" text-anchor="middle" font-size="12" fill="var(--gesso-spento)">salta</text>`; }
  else {
    let txt = '0';
    if (d.action === 'incassare') { txt = '+2'; colore = 'var(--scudo)'; }
    else if (ant && ant.dmg > 0) { txt = '−' + ant.dmg; colore = 'var(--sangue-chiaro)'; }
    riga = `<svg x="-15" y="3" width="12" height="12" viewBox="0 0 16 16" color="${colore}"><use href="#g-${ACT[d.action]}"/></svg><text x="6" y="14" text-anchor="middle" font-size="13" font-weight="700" fill="${colore}">${txt}</text>`;
  }
  const spento = ant && ant.spento;
  return `<g transform="translate(${f1(x)},${f1(y)})"${spento ? ' opacity=".5"' : ''}><circle r="21" fill="#221316" stroke="${spento ? '#5d5560' : 'var(--sangue)'}" stroke-width="1.6"/>` +
    `<text y="-3" text-anchor="middle" font-size="13.5" font-weight="700" fill="var(--gesso)">${d.owner}</text>${riga}${spento ? '<path d="M-15,-15 L15,15" stroke="var(--gesso-spento)" stroke-width="1.5"/>' : ''}</g>`;
}

// ---------- la ruota (Sequenza attorno all'officiante) ----------
function ruota(S, modo) {
  const seq = S.seq, n = seq.length, A0 = 5, passo = (180 - 2 * A0) / (n - 1);
  const ant = {}; (S.anteprima || []).forEach(a => ant[a.uid] = a);
  let s = '';
  // cerchio di gesso: confine tra Sequenza (fuori) e ciò che è stato scartato per sé (dentro)
  s += `<g filter="url(#gesso)" fill="none" stroke="var(--gesso)" opacity=".5"><circle cx="${C.x}" cy="${C.y}" r="${RC}" stroke-width="1.3"/><circle cx="${C.x}" cy="${C.y}" r="${RH}" stroke-width="1" stroke-dasharray="2 5"/></g>`;
  // verso orario: tre tacche a freccia sul cerchio
  [10, 70, 130].forEach(a => { const [x, y] = pol(RC, a + passo / 2 * 0 + 10); s += `<path transform="translate(${f1(x)},${f1(y)}) rotate(${a + 10})" d="M-4,-4 L3,0 L-4,4" fill="none" stroke="var(--gesso)" stroke-width="1.4" opacity=".6"/>`; });
  seq.forEach((d, i) => {
    const a = A0 + i * passo, [x, y] = pol(R, a), [ix, iy] = pol(RI, a);
    if (d.kind === 'ai') { s += dadoNemico(d, x, y, ant[d.uid]); return; }
    if (modo === 'selezione') {
      const p = S.selezione.plan.dice[d.uid];
      if (p.kept) {
        s += dadoMio(d, x, y);
        s += `<g transform="translate(${f1(ix)},${f1(iy)})"><circle r="16.5" fill="none" stroke="var(--${d.kind})" stroke-width="1" stroke-dasharray="2 3" opacity=".7"/><text y="-1" text-anchor="middle" font-size="12.5" font-weight="700" fill="var(--${d.kind})">+1</text><text y="11" text-anchor="middle" font-size="12" fill="var(--${d.kind})">${GAIN[d.kind]}</text></g>`;
      } else {
        s += dadoMio(d, x, y, { vuoto: true });
        s += dadoMio(d, ix, iy, { scala: .74 });
      }
    } else {
      const attivo = d.state === 'active';
      if (attivo) { const [bx, by] = pol(RH + 2, a), [ex, ey] = pol(R - 40, a); s += `<path d="M${f1(bx)},${f1(by)} L${f1(ex)},${f1(ey)}" stroke="var(--oro)" stroke-width="2.4" stroke-linecap="round"/><path transform="translate(${f1(ex)},${f1(ey)}) rotate(${a - 90})" d="M-6,-5 L3,0 L-6,5 Z" fill="var(--oro)"/>`; }
      s += dadoMio(d, x, y, { attivo });
      if (attivo && S.res) { const n = S.res.pool[KIND[d.kind]]; s += `<g transform="translate(${f1(ix + 4)},${f1(iy - 8)})"><rect x="-34" y="-10" width="68" height="20" rx="2" fill="#17161b" stroke="var(--oro)"/><text x="-8" y="4.5" text-anchor="middle" font-size="12.5" font-weight="700" fill="var(--oro)">resta ${n}</text><svg x="16" y="-6.5" width="13" height="13" viewBox="0 0 16 16" color="var(--oro)"><use href="#g-${KIND[d.kind]}"/></svg></g>`; }
    }
  });
  return s;
}

// ---------- l'officiante: corpo, mente, luce interiore, passi ----------
function officiante(S, extra) {
  const g = S.giocatore, e = extra || {};
  const riga = (y, num, et, col, piu) => `<text class="got" x="50" y="${y}" font-size="24" font-weight="700" fill="${col}">${num}</text><text x="${50 + (String(num).length > 1 ? 27 : 15)}" y="${y}" font-size="12.5" fill="var(--gesso)">${et}</text>${piu || ''}`;
  let s = '';
  // figura a gesso
  s += `<g filter="url(#gesso)" fill="none" stroke="var(--gesso)" stroke-width="1.3" opacity=".75"><circle cx="24" cy="124" r="9"/><path d="M24,133 L24,139 M10,150 Q24,134 38,150 L41,232 L33,232 L32,262 L26,262 L24,236 L22,262 L16,262 L15,232 L7,232 Z"/></g>`;
  // luce interiore: nasce nel petto, cresce con la Luce
  const lr = 9 + 5 * Math.min(g.luce + (e.lucePiu || 0), 4);
  s += `<circle cx="24" cy="202" r="${lr}" fill="url(#lume)" opacity="${g.luce + (e.lucePiu || 0) > 0 ? .95 : .25}"/>`;
  s += `<svg x="18" y="118" width="12" height="12" viewBox="0 0 16 16" color="var(--terrore)"><use href="#g-pt"/></svg>`;
  s += `<svg x="18" y="158" width="12" height="12" viewBox="0 0 16 16" color="var(--sangue-chiaro)"><use href="#g-hp"/></svg>`;
  s += `<svg x="17" y="195" width="14" height="14" viewBox="0 0 16 16" color="var(--lume)"><use href="#g-luce"/></svg>`;
  s += `<svg x="18" y="242" width="12" height="12" viewBox="0 0 16 16" color="var(--gesso)"><use href="#g-pm"/></svg>`;
  s += riga(133, g.pt, 'PT', 'var(--terrore)');
  s += riga(172, g.hp, 'HP', 'var(--gesso)', e.arrivo ? `<text x="50" y="186" font-size="12.5" font-weight="700" fill="var(--sangue-chiaro)">${e.arrivo}</text>` : '');
  s += riga(213 + (e.arrivo ? 3 : 0), g.luce, 'Luce', 'var(--lume)', e.lucePiu ? `<text x="97" y="213" font-size="13" font-weight="700" fill="var(--oro)">+${e.lucePiu}</text>` : '');
  s += riga(254, g.pm, 'PM', 'var(--gesso)');
  return s;
}

// ---------- mappa ----------
function mappa(S, o) {
  o = o || {};
  let s = '';
  const terr = {}; (S.terreno || []).forEach(t => terr[t.at.join()] = t.tipo);
  const oro = {}; (o.oro || []).forEach(c => oro[c.cell.join()] = c);
  for (let r = 1; r <= 8; r++) for (let e = 1; e <= 6; e++) {
    const [x, y] = hc([r, e]), t = terr[r + ',' + e], k = oro[r + ',' + e];
    if (t === 'column') s += `<g transform="translate(${x},${y})"><polygon points="${HEXP}" fill="#0e0d11" stroke="#4a4652" stroke-width="1.2"/><circle r="12" fill="#3b3842" stroke="#6a6573" stroke-width="1.2"/><circle r="6.5" fill="none" stroke="#6a6573"/></g>`;
    else s += `<g transform="translate(${x},${y})"><polygon points="${HEXP}" fill="${k ? '#5a4a1c' : 'var(--lastra)'}" stroke="${k ? 'var(--oro)' : 'var(--lastra-bordo)'}" stroke-width="${k ? 2 : 1}"/>` +
      (t === 'trap' ? `<path d="M-7,-16 L7,-4 M7,-16 L-7,-4" stroke="var(--sangue)" stroke-width="2"/><text y="10" text-anchor="middle" font-size="12" fill="var(--sangue-chiaro)">trappola</text>` : '') +
      (k ? `<text y="4" text-anchor="middle" font-size="13" font-weight="700" fill="var(--oro)">${k.testo}</text>` : '') + `</g>`;
  }
  // muro fuori griglia toccabile (spinta contro il muro)
  (o.muro || []).forEach(m => { const [x, y] = hc(m.cell); s += `<g transform="translate(${x},${y})"><polygon points="${HEXP}" fill="#3a2a12" stroke="var(--oro)" stroke-width="2" stroke-dasharray="5 3"/><text y="-3" text-anchor="middle" font-size="12.5" font-weight="700" fill="var(--oro)">muro</text><text y="10" text-anchor="middle" font-size="12" font-weight="700" fill="var(--sangue-chiaro)">${m.testo}</text></g>`; });
  // percorsi dei nemici
  const pos = {}; S.nemici.forEach(n => pos[n.id] = n.pos);
  (S.anteprima || []).forEach(a => {
    if (a.spento || !a.path || !a.path.length) return;
    const pts = [a.from].concat(a.path).map(hc), col = a.dmg > 0 ? 'var(--sangue-chiaro)' : '#8d8794';
    const [ex, ey] = pts[pts.length - 1];
    s += `<path d="M${pts.map(p => p.join(',')).join(' L')}" fill="none" stroke="${col}" stroke-width="2" stroke-dasharray="5 4" opacity=".9"/>`;
    s += `<circle cx="${ex}" cy="${ey}" r="13" fill="#17161b" fill-opacity=".8" stroke="${col}" stroke-width="1.5" stroke-dasharray="3 3"/><text x="${ex}" y="${ey + 4}" text-anchor="middle" font-size="12" font-weight="700" fill="${col}">${a.owner}</text>`;
  });
  // colpi previsti: tacca rossa dalla casella d'arrivo a te
  const [px, py] = hc(S.giocatore.pos);
  (S.anteprima || []).forEach(a => {
    if (a.spento || !(a.dmg > 0)) return;
    const [ex, ey] = hc(a.end), dx = px - ex, dy = py - ey, L = Math.hypot(dx, dy);
    s += `<path d="M${f1(ex + dx / L * 15)},${f1(ey + dy / L * 15)} L${f1(px - dx / L * 17)},${f1(py - dy / L * 17)}" stroke="var(--sangue)" stroke-width="4" stroke-linecap="round"/>`;
  });
  // tu
  s += `<g transform="translate(${px},${py})"><circle r="16" fill="#15131a" stroke="var(--oro)" stroke-width="2.2"/><text class="got" y="5.5" text-anchor="middle" font-size="16" font-weight="700" fill="var(--gesso)">Tu</text>` +
    (S.giocatore.stati && S.giocatore.stati.vuln ? `<g transform="translate(0,24)"><rect x="-13" y="-8" width="26" height="16" rx="2" fill="var(--sangue)" stroke="#0c0b0e"/><text y="4.5" text-anchor="middle" font-size="12.5" font-weight="700" fill="#fff">×2</text></g>` : '') + `</g>`;
  // nemici
  const ant = {}; (S.anteprima || []).forEach(a => ant[a.owner] = a);
  S.nemici.forEach(n => {
    const [x, y] = hc(n.pos), a = ant[n.id] || {}, st = n.stati || {};
    const bers = (o.bersagli || {})[n.id];
    let b = '';
    if (bers) b += `<polygon points="${HEXP}" fill="none" stroke="var(--oro)" stroke-width="${bers === 'scelto' ? 3 : 1.6}" ${bers === 'scelto' ? '' : 'stroke-dasharray="4 3"'}/>`;
    b += `<circle cx="0" cy="4" r="17" fill="${st.stun ? '#8f897b' : '#d3c9ae'}" stroke="#0c0b0e" stroke-width="1.5"/><text x="0" y="2" text-anchor="middle" font-size="13" font-weight="700" fill="#1b1512">${n.id}</text>`;
    b += `<svg x="-11" y="5" width="10" height="10" viewBox="0 0 16 16" color="#8f231f"><use href="#g-hp"/></svg><text x="5" y="15" text-anchor="middle" font-size="13" font-weight="700" fill="#1b1512">${n.hp}</text>`;
    // intento sopra la casella
    let txt, fill = '#221316', col = 'var(--gesso-spento)', gl = ACT[a.action] || 'orda';
    if (a.spento) { txt = 'salta'; gl = 'stordito'; }
    else if (a.action === 'incassare') { txt = '+' + a.shield; col = 'var(--scudo)'; }
    else if (a.dmg > 0) { txt = '−' + a.dmg; fill = 'var(--sangue)'; col = '#fff'; }
    else txt = '0';
    const w = txt.length > 2 ? 46 : 34;
    b += `<g transform="translate(0,-21)"><rect x="${-w / 2}" y="-8.5" width="${w}" height="17" rx="2" fill="${fill}" stroke="${fill === '#221316' ? '#5d5560' : '#0c0b0e'}"/><svg x="${-w / 2 + 3}" y="-6" width="12" height="12" viewBox="0 0 16 16" color="${col}"><use href="#g-${gl}"/></svg><text x="${-w / 2 + 17}" y="4.5" font-size="12.5" font-weight="700" fill="${col}">${txt}</text></g>`;
    // stati sotto la casella
    const chip = [];
    if (st.shield) chip.push(['scudo', st.shield[0] + st.shield[1], 'var(--scudo)']);
    if (st.vulnFire) chip.push(['fuoco', '×2', 'var(--fuoco)']);
    chip.forEach((c, i) => { b += `<g transform="translate(${i * 30},27)"><rect x="-15" y="-8" width="30" height="16" rx="2" fill="#17161b" stroke="${c[2]}"/><svg x="-13" y="-6" width="12" height="12" viewBox="0 0 16 16" color="${c[2]}"><use href="#g-${c[0]}"/></svg><text x="6" y="4.5" text-anchor="middle" font-size="12.5" font-weight="700" fill="${c[2]}">${c[1]}</text></g>`; });
    s += `<g transform="translate(${x},${y})">${b}</g>`;
  });
  return s;
}

// ---------- carte ----------
const FAM = { vigore: 'var(--vigore)', fuoco: 'var(--fuoco)', terrore: 'var(--terrore)', free: '#8d8576' };
function breve(a) {
  const t = { adj: '', range: ' in gittata', unit: '', any: ' ovunque' }[a.target] || '';
  switch (a.kind) {
    case 'attack': return `<em>${a.dmg} Dann${a.dmg > 1 ? 'i' : 'o'}</em>${a.dtype === 'fire' || /Fuoco/.test(a.testo) ? ' Fuoco' : ''}${a.push ? ` + Spingi ${a.push}` : ''}${t}`;
    case 'vulnFire': return 'Vulnerabile al Fuoco';
    case 'shield': return `<em>+${a.n} Scudo</em>`;
    case 'draw': return `Pesca ${a.n}`;
    case 'jump': return `+${a.n} PM Salto`;
    case 'range': return `+${a.n} Gittata`;
    case 'distort': return `sposta un'unità fino a <em>X</em> caselle`;
    case 'direct': return `<em>X Danni Diretti</em> ovunque`;
    case 'stunPush': return `Stordisci + Spingi ${a.push}`;
    case 'cone': return `<em>${a.dmg} Danni</em> Fuoco nel cono, gittata ${a.range}`;
  }
  return a.testo;
}
function pip(cost) {
  const k = Object.keys(cost);
  if (!k.length) return `<span class="pip">${sg('gratis')}</span>`;
  const g = { forza: 'forza', fuoco: 'fuoco', presagio: 'presagio' }[k[0]];
  return `<span class="pip">${sg(g)}</span>`;
}
const LIBERE = { cu: 'Senza dado. Consuma 2 dadi vicini: corri dritto, <em>danni = caselle</em>.' };
function carta(c, x, y, rot) {
  const righe = c.azioni.length ? c.azioni.map(a => {
    const extra = a.cost.presagio === 'X' ? `<b>X</b>${a.cost.pt ? ` e <b>${a.cost.pt} PT</b>` : ''}: ` : '';
    return `<li>${pip(a.cost)}${extra}${breve(a)}</li>`;
  }).join('') : `<li class="lib">${LIBERE[c.id] || c.pre}</li>`;
  const cd = c.cd ? `<span class="cd${c.cd === 2 ? ' c2' : ''}">${c.cd}</span>` : '';
  return `<div class="carta" style="left:${x}px;top:${y}px;transform:rotate(${rot}deg);--fam:${FAM[c.family]}"><h3>${cd}${c.nome}</h3><ul>${righe}</ul><div class="eco"><i>Eco</i>${c.eco.replace(/ · /g, ', ')}</div>${c.nuova ? '<span class="nuova"></span>' : ''}</div>`;
}
function plancia(posti, et) {
  return `<div id="plancia"><div class="et"><b>Plancia</b>${et}</div>${posti.map(p => `<div class="posto ${p.cls || ''}">${p.mini ? `<i class="mini" style="transform:rotate(${p.rot}deg)"></i>` : ''}${sg(p.g)}${p.t ? `<small>${p.t}</small>` : ''}</div>`).join('')}</div>`;
}

function pagina(titolo, corpo) {
  return `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=844,height=390"><title>${titolo}</title><style>${FONTS}${CSS}</style></head><body>${DEFS}<div id="scena">${corpo}</div></body></html>`;
}
const grana = `<svg class="strato" style="opacity:.5;mix-blend-mode:overlay;pointer-events:none"><rect width="844" height="390" filter="url(#grana)"/></svg>`;

// ================= SELEZIONE (SP1, proposta iniziale) =================
(function () {
  const S = DATI.stati.sel_proposta;
  const gi = { g: 'forza' }, slot = S.plancia.slot.map(p => ({ g: KIND[p.die] }));
  const m = S.mano;
  const X0 = 563, pos = [[X0, 54, -1.6], [X0 + 93, 55, .8], [X0 + 186, 54, 1.4], [X0, 195, 1.2], [X0 + 93, 194, -1.3]];
  const corpo = grana +
    `<svg class="strato" viewBox="0 0 844 390">${mappa(S)}${ruota(S, 'selezione')}${officiante(S, { arrivo: '−3 in arrivo', lucePiu: 1 })}</svg>` +
    `<div id="domanda"><b>Quali dadi tieni?</b><span>La Cripta, turno 1 di 6 di Veglia</span></div>` +
    `<div class="tasca" style="left:150px;top:5px;width:84px">fuori dal cerchio: in Sequenza</div>` +
    `<div class="tasca" style="left:150px;top:352px;width:84px">dentro: scartato, diventa tuo</div>` +
    `<div id="voce">In arrivo se nulla cambia: <span class="r">Z1 −1, Z2 −2</span> <i>(Orda: +1 con Z1 accanto)</i>.<br>Prima di Z2 hai ${sg('forza')} 1. Il ${sg('fuoco')} 1 è scartato: c'è un solo slot ${sg('fuoco')}.</div>` +
    plancia(slot, 'tutti i posti liberi') +
    m.map((c, i) => carta(c, pos[i][0], pos[i][1], pos[i][2])).join('') +
    `<div class="dorso" style="left:${X0 + 186}px;top:194px"><i style="left:6px;top:2px;transform:rotate(-3deg)"></i><i style="left:9px;top:5px;transform:rotate(1deg)"></i><i style="left:8px;top:8px;transform:rotate(3deg)"></i><p>Mazzo <b>${S.mazzo}</b>, scarti <b>${S.scarti}</b></p></div>` +
    `<button id="sigillo"><b>Conferma i dadi</b><span>4 in Sequenza, 1 scartato: +1 Luce</span></button>`;
  fs.writeFileSync(path.join(OUT, 'selezione_telefono.html'), pagina('Il Rito · Selezione', corpo));
})();

// ================= RISOLUZIONE, carta in uso (SP4-bis: Attacco Poderoso) =================
(function () {
  const S = DATI.stati.carta_aperta;
  const spinta = S.aperta.spinta;
  const oro = spinta.filter(c => c.status === 'free').map(c => ({ cell: c.cell, testo: 'qui' }));
  const muro = spinta.filter(c => c.status === 'wall').map(c => ({ cell: c.cell, testo: '1 danno' }));
  const posti = [
    { g: 'forza', cls: 'pieno', mini: 1, rot: 90, t: '' },
    { g: 'presagio', cls: 'futuro', t: '2 t.' },
    { g: 'forza' }, { g: 'fuoco' }];
  const altre = S.mano;
  const corpo = grana +
    `<svg class="strato" viewBox="0 0 844 390">${mappa(S, { oro, muro, bersagli: { Z4: 'scelto', Z2: 'valido' } })}${ruota(S, 'risoluzione')}${officiante(S, { arrivo: '−12 in arrivo' })}` +
    // i due dadi scartati in Selezione restano visibili dentro il cerchio (valori illustrativi: il JSON non li riporta)
    `${dadoMio({ kind: 'vigore', value: 1 }, ...pol(RI, 64), { scala: .7 })}${dadoMio({ kind: 'fuoco', value: 2 }, ...pol(RI, 116), { scala: .7 })}` +
        `</svg>` +
    `<div id="domanda"><b>Dove spingi Z4?</b><span>turno 2 di 6 di Veglia</span></div>` +
    `<div id="voce"><span class="o">Fatto:</span> Z4 stordito e spinto contro il muro, Collisione 1 danno.<br><span class="r">Sei Vulnerabile (×2): Z1 e Z2 ti farebbero 6 danni ciascuno.</span></div>` +
    plancia(posti, 'Distorsione esce a fine turno') +
    `<div id="aperta"><h2>Attacco Poderoso<small>CD 2</small></h2>` +
    `<div class="resto"><span class="imp speso">${sg('forza')}</span><span class="imp">${sg('forza')}</span> resta 1 impulso del dado 2</div>` +
    `<p class="pre">Usarla ti rende Vulnerabile.</p>` +
    `<div class="az spenta"><span class="pip">${sg('forza')}</span><b>2 Danni a un adiacente</b><span>Non si torna a un'Azione precedente</span></div>` +
    `<div class="az ora"><span class="pip">${sg('forza')}</span><b>Stordisci un adiacente + Spingi 1</b><span>Già usata su Z4. <u>Ora: tocca una casella dorata</u>, oppure Z2 per cambiare bersaglio.</span></div>` +
    `<div class="piede"><s><b>Rimetti in mano</b>La carta è già stata usata</s><p>Chiusa: in Plancia 2 turni,<br>copre lo slot ${sg('presagio')}</p></div></div>` +
    `<button id="sigillo" class="secondo"><b>Chiudi la carta</b></button>` +
    altre.map((c, i) => `<div class="cima" style="left:${568 + i * 68}px;transform:rotate(${[-1.5, 1, -.8, 1.4][i]}deg)">${c.nome}</div>`).join('') +
    `<div id="attesa">in mano: completa prima la carta aperta</div>`;
  fs.writeFileSync(path.join(OUT, 'risoluzione_carta_telefono.html'), pagina('Il Rito · Risoluzione, carta in uso', corpo));
})();
console.log('ok');
