// Esplorazione B1.3e · concetto "Il tavolo" · genera i due mockup statici 844×390.
// Uso: node team/design/ui/esplorazione/il-tavolo/strumenti/genera.js
// Dati: team/design/ui/bozze_B1.3b/strumenti/dati_mockup.json (stati sel_guida/sel_coperto e carta_aperta).
'use strict';
const fs = require('fs');
const path = require('path');
const QUI = path.join(__dirname, '..');
const UI = path.join(QUI, '..', '..');
const DATI = require(path.join(UI, 'bozze_B1.3b', 'strumenti', 'dati_mockup.json'));

// Icone a inchiostro già usate dal team (lib.js), più quelle nuove di questo concetto.
const lib = fs.readFileSync(path.join(UI, 'strumenti', 'lib.js'), 'utf8');
const simboli = (lib.match(/<symbol id="i-(?!luce)[\s\S]*?<\/symbol>/g) || []).join('\n');
const ICONE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
${simboli}
<symbol id="i-luce" viewBox="0 0 24 24"><path d="M12 1.5c.9 6.2 3.3 8.7 9.5 10.5-6.2 1.8-8.6 4.3-9.5 10.5-.9-6.2-3.3-8.7-9.5-10.5C8.7 10.2 11.1 7.7 12 1.5z"/></symbol>
<symbol id="i-morso" viewBox="0 0 24 24"><path d="M3 5h18l-1.6 6.5-2.2-3.6-2.1 5-2.1-5-2 5.4-2-5.4-2.1 5-2.2-3.6L5 11.5z"/><path d="M5 20l1.7-5 2.2 2.8 1.8-3.8 1.3 3.8 1.3-3.8 1.8 3.8 2.2-2.8L19 20z" fill-opacity=".7"/></symbol>
<symbol id="i-stordito" viewBox="0 0 24 24"><path d="M12 3c5 0 9 2.2 9 5s-4 5-9 5c-3.4 0-5.8-1.3-5.8-2.9 0-1.4 2-2.4 4.6-2.4 2 0 3.5.7 3.5 1.6h-2c0-.2-.6-.4-1.5-.4-1.6 0-2.6.6-2.6 1.2 0 .7 1.5 1.5 3.8 1.5 3.9 0 7-1.6 7-3.6S15.900 5 12 5 5 6.300 5 8H3c0-2.800 4-5 9-5z"/><circle cx="6" cy="17" r="1.800"/><circle cx="12" cy="19" r="1.800"/><circle cx="18" cy="17" r="1.800"/></symbol>
<symbol id="i-vuln" viewBox="0 0 24 24"><path d="M12 2.200l8.200 3v6.100c0 5.200-3.400 9-8.200 10.600l1.200-5.400-3.400-2.300 3.800-3.600-2.700-2.600 2.300-5.300L12 2.200z" fill-opacity=".45"/><path d="M11.300 2.400L3.800 5.200v6.100c0 5 3.100 8.700 7.600 10.400l1.100-5-3.600-2.400 3.900-3.700-2.700-2.600z"/></symbol>
</defs></svg>`;
const ico = (id, cls) => `<svg class="ico ${cls || ''}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
const ROMANI = { Z1: 'I', Z2: 'II', Z3: 'III', Z4: 'IV', Z5: 'V' };
const TIPO_ICO = { vigore: 'forza', fuoco: 'fuoco', terrore: 'presagio', free: 'eco' };
const AZ_ICO = { orda: 'artigli', morso: 'morso', incassare: 'scudo' };
const AZ_NOME = { orda: 'Orda', morso: 'Morso', incassare: 'Incassa' };

// ───────────────────────── stile
const CSS = `
:root{
  /* base CLAUDE.md §7 */
  --notte:#151519; --pietra:#1c1a24; --filo:#2e2a3e; --osso:#e8e0d0; --cenere:#a59bb0;
  --oro:#c9a84c; --sangue:#b84040; --scudo:#4a8fbd;
  /* il tavolo */
  --panno:#1a161f; --panno-chiaro:#231d2a; --tabellone:#27222f; --cuoio:#2a2022; --ottone:#7d6526; --verderame:#5d7d70;
  --carta:#d2c3a2; --carta-ombra:#b3a17b; --inchiostro:#241b13; --ruggine:#8a2f23;
  --sangue-vivo:#e57866; --vigore:#e8e0d0; --fuoco:#e08945; --terrore:#a78be2; --luce:#f3e7b8;
  --f-titolo:'IM Fell English',Georgia,serif; --f-testo:'Alegreya Sans',system-ui,sans-serif;
}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#09080b}
body{font-family:var(--f-testo);font-size:12px;line-height:13px;color:var(--osso);-webkit-font-smoothing:antialiased;font-variant-numeric:lining-nums}
.ico{display:inline-block;width:1em;height:1em;vertical-align:-.14em;fill:currentColor}
.tavolo{position:relative;width:844px;height:390px;overflow:hidden;margin:0 auto;background:
  radial-gradient(ellipse 620px 300px at 46% 52%,rgba(120,96,140,.13),transparent 70%),
  radial-gradient(ellipse 900px 420px at 50% 50%,transparent 55%,rgba(0,0,0,.5)),
  var(--panno)}
.tavolo::before{content:'';position:absolute;inset:0;opacity:.5;pointer-events:none;background-image:
  repeating-linear-gradient(47deg,rgba(255,255,255,.018) 0 1px,transparent 1px 3px),
  repeating-linear-gradient(-43deg,rgba(0,0,0,.14) 0 1px,transparent 1px 4px)}
.tavolo>*{position:absolute}
b,strong{font-weight:800}

/* ── il binario: la Sequenza Vincolata */
.piastra{left:8px;top:5px;width:160px;height:80px;padding:3px 0 0 2px}
.piastra .dove{color:var(--cenere);font-size:12px}
.piastra .fase{font-family:var(--f-titolo);font-size:23px;line-height:25px;color:var(--oro);letter-spacing:.2px}
.piastra .cosa{font-size:12.5px;line-height:14px;color:var(--osso);margin-top:2px}
.binario{left:172px;top:5px;width:666px;height:57px;border-radius:5px;background:linear-gradient(#0d0b10,#131017);
  box-shadow:inset 0 3px 6px rgba(0,0,0,.85),inset 0 -1px 0 rgba(201,168,76,.18),0 1px 0 rgba(125,101,38,.55),0 -1px 0 rgba(0,0,0,.6)}
.binario::before,.binario::after{content:'';position:absolute;top:22px;width:5px;height:12px;border-radius:2px;background:var(--ottone)}
.binario::before{left:-3px}.binario::after{right:-3px}
.posto{top:0;width:66px;height:88px;text-align:center}
.posto .dado{position:absolute;left:9px;top:9px;width:48px;height:48px}
.posto .dado svg{width:48px;height:48px;overflow:visible;display:block}
.posto .dice{position:absolute;left:-6px;right:-6px;top:63px;font-size:12px;line-height:12.5px;color:var(--cenere);white-space:nowrap}
.posto .dice b{color:var(--osso);font-weight:700}
.posto.nemico .dice b{color:var(--sangue-vivo)}
.posto.nemico .dice .num{font-family:var(--f-titolo);font-size:13px;color:var(--osso)}
.posto.mio .dice .ok{color:var(--oro)}
.posto.attivo .dado{transform:scale(1.2);transform-origin:50% 60%;filter:drop-shadow(0 0 7px rgba(201,168,76,.75))}
.posto.attivo .dice b{color:var(--oro)}
.posto.fatto .dado{opacity:.38}
.posto.spento .dado{opacity:.5}
.posto .croce{position:absolute;left:9px;top:9px;width:48px;height:48px}
.segno-attivo{top:59px;height:3px;background:var(--oro);border-radius:2px}

/* ── gettoni delle risorse */
.gettone{top:92px;width:59px;height:44px;display:flex;align-items:center;gap:4px}
.gettone .disco{flex:none;width:25px;height:25px;border-radius:50%;display:grid;place-items:center;font-size:14px;
  box-shadow:inset 0 -2px 0 rgba(0,0,0,.35),0 2px 3px rgba(0,0,0,.6)}
.gettone .n{font-size:17px;line-height:17px;font-weight:800;color:var(--osso);white-space:nowrap}
.gettone .n small{font-size:12px;font-weight:500;color:var(--cenere)}
.gettone .n .poi{color:var(--oro)}
.gettone .et{font-size:12px;line-height:12px;color:var(--cenere);margin-top:1px}
.g-hp .disco{background:#6b1e1e;color:#f0c9c0}.g-pt .disco{background:#3c2d63;color:#d6c8f5}
.g-pm .disco{background:#3b3a34;color:var(--osso)}.g-luce .disco{background:#4d4322;color:var(--luce)}

/* ── la Plancia: il tappetino con gli slot dei dadi */
.plancia{left:8px;top:140px;width:236px;height:106px;border-radius:4px;background:linear-gradient(160deg,#2f2426,#221a1d);
  box-shadow:inset 0 0 0 1px rgba(125,101,38,.55),inset 0 0 14px rgba(0,0,0,.55),0 3px 6px rgba(0,0,0,.55)}
.vano{position:absolute;width:118px;height:53px;padding:4px 0 0 5px;display:flex;gap:5px}
.vano+.vano{}
.vano .sede{flex:none;position:relative;width:44px;height:44px;border-radius:50%;background:#15101299;box-shadow:inset 0 2px 4px rgba(0,0,0,.8),0 1px 0 rgba(201,168,76,.16);display:grid;place-items:center}
.vano .sede svg.sagoma{width:30px;height:30px;overflow:visible}
.vano .sede .cartina{position:absolute;left:8px;top:2px;width:28px;height:40px;border-radius:2px;background:var(--carta);box-shadow:0 1px 3px rgba(0,0,0,.7);display:grid;place-items:center;color:var(--inchiostro);font-size:15px}
.vano .sede .moneta{position:absolute;right:-5px;bottom:-3px;min-width:25px;height:17px;padding:0 3px;border-radius:9px;background:#15101a;border:1px solid var(--ottone);color:var(--luce);font-size:12px;font-weight:800;line-height:15px;text-align:center;white-space:nowrap}
.vano .sede .moneta.pagata{background:var(--luce);color:var(--inchiostro);border-color:var(--luce)}
.vano .tx{min-width:0;font-size:12px;line-height:13px;color:var(--cenere);padding-top:1px}
.vano .tx b{display:block;color:var(--osso);font-weight:700}
.vano .tx .qui{color:var(--oro)}
.vano .tx i{font-family:var(--f-titolo);font-size:12.5px;color:var(--carta)}
.vano.usato .sede{box-shadow:inset 0 2px 4px rgba(0,0,0,.8),0 0 0 1.5px var(--oro)}

/* ── il centro: scheda del nemico (a riposo) */
.scheda{left:252px;top:92px;width:172px;height:154px;border-radius:5px;padding:7px 9px;background:linear-gradient(170deg,#19131a,#120e13);
  box-shadow:inset 0 0 0 1px #4a2326,0 3px 7px rgba(0,0,0,.6)}
.scheda h3{font-family:var(--f-titolo);font-weight:400;font-size:17px;line-height:19px;color:var(--osso)}
.scheda h3 small{font-family:var(--f-testo);font-size:12px;color:var(--cenere);margin-left:4px}
.scheda p{font-size:12px;line-height:13.5px;color:#cbbfc6;margin-top:5px;padding-left:19px;position:relative}
.scheda p .ico{position:absolute;left:0;top:1px;font-size:14px;color:var(--sangue-vivo)}
.scheda p b{color:var(--osso)}
.scheda p .f{font-weight:800;color:var(--sangue-vivo)}

/* ── le carte */
.mano{left:8px;top:250px;width:416px;height:140px}
.carta{position:absolute;width:94px;height:132px;border-radius:5px;color:var(--inchiostro);
  background:linear-gradient(175deg,#dccdab 0%,var(--carta) 45%,#c2b18b 100%);
  box-shadow:inset 0 0 0 1px rgba(36,27,19,.35),inset 0 0 12px rgba(120,90,40,.25),-3px 2px 5px rgba(0,0,0,.55);transform-origin:50% 160%}
.carta .testa{display:flex;gap:4px;padding:4px 4px 0 5px;height:33px}
.carta .angolo{flex:none;width:22px;text-align:center;font-size:15px;line-height:15px}
.carta .angolo small{display:block;font-size:12px;line-height:12px;font-weight:800;margin-top:2px;white-space:nowrap}
.carta .nome{font-family:var(--f-titolo);font-size:13.5px;line-height:14px}
.carta .corpo{padding:3px 4px 0 6px;font-size:12px;line-height:13px;width:82px}
.carta .corpo .pre{font-style:italic;margin-bottom:1px}
.carta .riga{position:relative;padding-left:16px;margin-top:1.5px}
.carta .riga .ico{position:absolute;left:0;top:1px;font-size:13px}
.carta .riga.gratis{padding-left:0}
.carta .riga.gratis u{text-decoration:none;font-weight:800}
.carta .eco{position:absolute;left:0;right:0;bottom:0;height:30px;border-radius:0 0 5px 5px;background:#2b2118;color:var(--carta);padding:2px 4px 0 6px;font-size:12px;line-height:13px}
.carta .eco b{font-family:var(--f-titolo);font-weight:400;font-size:12.5px;color:var(--oro);margin-right:3px}
.carta.fam-fuoco .angolo{color:#a8480f}.carta.fam-terrore .angolo{color:#5a3aa8}.carta.fam-free .angolo{color:#6a5416}

/* carta al centro: in gioco */
.gioco{left:252px;top:92px;width:172px;height:248px;border-radius:7px;color:var(--inchiostro);
  background:linear-gradient(175deg,#e0d2b1 0%,var(--carta) 50%,#c4b38d 100%);
  box-shadow:inset 0 0 0 1px rgba(36,27,19,.4),inset 0 0 18px rgba(120,90,40,.28),0 0 0 2px rgba(201,168,76,.9),0 6px 14px rgba(0,0,0,.7)}
.gioco .testa{display:flex;gap:7px;padding:7px 8px 0 9px;align-items:flex-start}
.gioco .angolo{flex:none;width:26px;text-align:center;font-size:19px;line-height:19px}
.gioco .angolo small{display:block;font-size:12px;line-height:12px;font-weight:800;margin-top:2px}
.gioco .nome{font-family:var(--f-titolo);font-size:18px;line-height:19px}
.gioco .pre{font-style:italic;font-size:12.5px;line-height:14px;padding:4px 9px 0}
.gioco .az{margin:5px 6px 0;padding:4px 5px 4px 27px;position:relative;font-size:13px;line-height:14.5px;border-radius:3px}
.gioco .az .costo{position:absolute;left:4px;top:4px;width:19px;height:19px;border-radius:50%;background:var(--inchiostro);color:var(--carta);display:grid;place-items:center;font-size:12px}
.gioco .az.chiusa{color:rgba(36,27,19,.62)}
.gioco .az.chiusa .costo{background:rgba(36,27,19,.45)}
.gioco .az.chiusa s{text-decoration-thickness:1px}
.gioco .az .perche{display:block;font-size:12px;line-height:13px;color:var(--ruggine);font-weight:700;margin-top:1px}
.gioco .az.ora{background:rgba(255,248,225,.55);box-shadow:inset 0 0 0 1.5px var(--inchiostro);min-height:44px}
.gioco .az.ora .fai{display:block;font-size:12px;line-height:13px;font-weight:800;margin-top:3px}
.gioco .az .speso{display:inline-grid;place-items:center;width:17px;height:17px;border-radius:50%;background:#8b7a55;color:#efe5c9;font-size:12px;vertical-align:-3px;margin-right:2px}
.gioco .dopo{position:absolute;left:9px;right:8px;bottom:36px;font-size:12px;line-height:13px;color:rgba(36,27,19,.85)}
.gioco .eco{position:absolute;left:0;right:0;bottom:0;height:31px;border-radius:0 0 7px 7px;background:#2b2118;color:#a5987c;padding:3px 8px 0 9px;font-size:12px;line-height:13px}
.gioco .eco b{font-family:var(--f-titolo);font-weight:400;color:#93803f;margin-right:3px}

/* zona liberata dalla mano abbassata */
.impulsi{left:10px;top:254px;width:234px;height:40px;display:flex;align-items:center;gap:7px;font-size:12.5px;line-height:14px;color:var(--osso)}
.impulsi .pedina{flex:none;width:34px;height:34px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#f6efdc,#cfc4a8);color:var(--inchiostro);display:grid;place-items:center;font-size:19px;box-shadow:0 0 0 2px var(--oro),0 3px 5px rgba(0,0,0,.7)}
.impulsi b{color:var(--oro)}
.cronaca{left:10px;top:298px;width:236px;font-size:12px;line-height:13.5px;color:var(--cenere)}
.cronaca b{color:var(--osso);font-weight:700}
.mano.bassa{top:344px}
.mano.bassa .carta{filter:brightness(.72)}
.nota-mano{left:10px;top:330px;width:236px;font-size:12px;color:var(--cenere);font-style:italic}

/* ── il tabellone */
.tabellone{left:426px;top:88px;width:338px;height:302px}
.tabellone svg{display:block;overflow:visible}
.tabellone text{font-family:var(--f-testo)}

/* ── bordo destro: mazzo, scarti, dadi scartati, sigillo */
.pila{top:92px;width:38px;height:44px;text-align:center;font-size:12px;line-height:12px;color:var(--cenere)}
.pila .dorso{position:relative;width:26px;height:27px;margin:0 auto 3px;border-radius:2px;background:#3a2c2e;box-shadow:inset 0 0 0 1px var(--ottone),2px 2px 0 #1d1618,3px 3px 0 #50403a;color:var(--osso);font-weight:800;font-size:13px;line-height:27px}
.pila.vuota .dorso{background:transparent;box-shadow:inset 0 0 0 1px rgba(125,101,38,.5);color:var(--cenere)}
.piattino{left:768px;top:144px;width:72px;height:134px;border-radius:36px/30px;background:radial-gradient(ellipse at 50% 40%,#120f15,#1d1822);box-shadow:inset 0 3px 7px rgba(0,0,0,.8),0 1px 0 rgba(125,101,38,.5);text-align:center;padding-top:7px;font-size:12px;line-height:13px;color:var(--cenere)}
.piattino .riga{display:flex;align-items:center;justify-content:center;gap:3px;margin-top:5px;color:var(--osso);font-weight:700;white-space:nowrap}
.piattino .riga svg{width:30px;height:30px;overflow:visible;flex:none}
.sigillo{left:764px;top:284px;width:80px;height:106px;text-align:center}
.sigillo .cera{width:62px;height:62px;margin:2px auto 0;display:block;overflow:visible}
.sigillo .dice{font-family:var(--f-titolo);font-size:14px;line-height:14.5px;color:var(--osso);margin-top:1px}
.sigillo.caldo .cera{filter:drop-shadow(0 0 8px rgba(226,112,95,.75))}
.sigillo.quieto .dice{color:var(--cenere)}
`;

const pagina = (titolo, corpo) => `<!doctype html>
<html lang="it"><head><meta charset="utf-8">
<meta name="viewport" content="width=844, initial-scale=1">
<title>${titolo}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Alegreya+Sans:ital,wght@0,400;0,500;0,700;0,800;1,400;1,500&family=IM+Fell+English:ital@0;1&display=swap" rel="stylesheet">
<style>${CSS}</style></head>
<body>${ICONE}
<main class="tavolo">
${corpo}
</main>
</body></html>
`;

// ───────────────────────── dadi (visti dall'alto: la forma dice il tipo)
// vigore d6 = quadrato avorio · fuoco d4 = triangolo brace · terrore d8 = rombo viola · dado nemico = triangolo rovesciato scuro
function dado(kind, value, o) {
  o = o || {};
  const fant = o.fantasma;
  const col = { vigore: '#e8e0d0', fuoco: '#e08945', terrore: '#a78be2', ai: '#4a1818' }[kind];
  const ink = kind === 'ai' ? '#e8e0d0' : '#1d150e';
  const forma = {
    vigore: '<rect x="6" y="6" width="36" height="36" rx="7"/>',
    fuoco: '<path d="M24 6 L43 40 L5 40 Z" stroke-linejoin="round" stroke-width="5"/>',
    terrore: '<path d="M24 3 L45 24 L24 45 L3 24 Z" stroke-linejoin="round" stroke-width="3"/>',
    ai: '<path d="M5 8 L43 8 L24 42 Z" stroke-linejoin="round" stroke-width="5"/>',
  }[kind];
  const pos = { vigore: [24, 31], fuoco: [24, 36], terrore: [24, 31], ai: [24, 21] }[kind];
  if (fant) {
    return `<svg viewBox="0 0 48 48"><g fill="none" stroke="${col}" stroke-opacity=".8" stroke-dasharray="3 3">${forma.replace(/stroke-width="\d"/, 'stroke-width="1.5"')}</g>
<text x="${pos[0]}" y="${pos[1]}" text-anchor="middle" font-size="${kind === 'fuoco' ? 15 : 19}" font-weight="800" fill="${col}" fill-opacity=".85" font-family="Alegreya Sans">${value}</text></svg>`;
  }
  let dentro;
  if (kind === 'ai') {
    dentro = `<svg x="14" y="9" width="20" height="20" viewBox="0 0 24 24" fill="${ink}"><use href="#i-${AZ_ICO[o.azione]}"/></svg>`;
  } else {
    dentro = `<text x="${pos[0]}" y="${pos[1]}" text-anchor="middle" font-size="${kind === 'fuoco' ? 17 : 22}" font-weight="800" fill="${ink}" font-family="Alegreya Sans">${value}</text>`;
  }
  const bordo = kind === 'ai' ? '#b84040' : col;
  return `<svg viewBox="0 0 48 48"><g transform="translate(1.500 2.500)" fill="#000" stroke="#000" opacity=".55">${forma}</g>
<g fill="${col}" stroke="${bordo}">${forma.replace('<rect', '<rect stroke-width="1"')}</g>
<g fill="rgba(255,255,255,.16)" stroke="none">${kind === 'vigore' ? '<rect x="8" y="7.500" width="32" height="9" rx="4"/>' : ''}</g>${dentro}</svg>`;
}

// ───────────────────────── binario
function binario(seq, etichette, opt) {
  opt = opt || {};
  let h = '<div class="binario" aria-label="Sequenza Vincolata"></div>';
  seq.forEach((d, i) => {
    const x = 176 + 66 * i;
    const e = etichette[d.uid] || {};
    const cls = ['posto', d.owner === 'P' ? 'mio' : 'nemico', e.cls || ''].join(' ');
    const svg = dado(d.kind, d.value, { azione: d.action, fantasma: e.fantasma });
    const tocco = d.owner === 'P' && opt.toccabili ? ' data-tocco="dado"' : (d.owner !== 'P' ? ' data-tocco="dado-nemico"' : '');
    h += `<div class="${cls}" style="left:${x}px"${tocco}><div class="dado">${svg}</div>${e.croce ? '<svg class="croce" viewBox="0 0 48 48"><path d="M10 10L38 38M38 10L10 38" stroke="#e8e0d0" stroke-width="2.500" stroke-linecap="round"/></svg>' : ''}<div class="dice">${e.r1 || ''}<br>${e.r2 || ''}</div></div>`;
    if (e.cls && e.cls.includes('attivo')) h += `<div class="segno-attivo" style="left:${x + 12}px;width:42px"></div>`;
  });
  return h;
}

// ───────────────────────── tabellone: la stanza ruotata, io a sinistra e loro a destra
const S = 26, H = Math.sqrt(3) * S, OX = 6, OY = 5;
const cx = (r) => OX + S + 1.5 * S * (r - 1);
const cy = (r, e) => OY + H / 2 + H * (e - 1) + (r % 2 ? H / 2 : 0);
const P = (c) => [cx(c[0]), cy(c[0], c[1])];
const esa = (x, y, s) => { s = s || S; const h = Math.sqrt(3) * s / 2; return [[x - s, y], [x - s / 2, y - h], [x + s / 2, y - h], [x + s, y], [x + s / 2, y + h], [x - s / 2, y + h]].map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' '); };
const f1 = (n) => n.toFixed(1);

function tabellone(st, extra) {
  extra = extra || {};
  let g = '';
  g += `<rect x="1" y="1" width="336" height="300" rx="5" fill="#27222f"/><rect x="1" y="1" width="336" height="300" rx="5" fill="none" stroke="#7d6526" stroke-opacity=".55"/>`;
  for (let r = 1; r <= 8; r++) for (let e = 1; e <= 6; e++) {
    g += `<polygon points="${esa(cx(r), cy(r, e), S - 1)}" fill="#1f1b27" stroke="#e8e0d0" stroke-opacity=".17" data-tocco="casella"/>`;
  }
  st.terreno.forEach((t) => {
    const [x, y] = P(t.at);
    if (t.tipo === 'column') g += `<polygon points="${esa(x, y, S - 1)}" fill="#14111a"/><circle cx="${f1(x)}" cy="${f1(y)}" r="15" fill="#3b3644" stroke="#5c5568" stroke-width="2"/><circle cx="${f1(x)}" cy="${f1(y)}" r="9" fill="#494353"/>`;
  });
  // bersagli e spinte (carta in uso)
  if (extra.validi) extra.validi.forEach((id) => { const n = st.nemici.find((z) => z.id === id); const [x, y] = P(n.pos); g += `<polygon points="${esa(x, y, S - 2)}" fill="rgba(201,168,76,.10)" stroke="#c9a84c" stroke-width="1.500" stroke-dasharray="4 3"/>`; });
  if (extra.scelto) { const n = st.nemici.find((z) => z.id === extra.scelto); const [x, y] = P(n.pos); g += `<polygon points="${esa(x, y, S - 2)}" fill="rgba(201,168,76,.20)" stroke="#c9a84c" stroke-width="2.500"/>`; }
  if (extra.spinte) {
    const n = st.nemici.find((z) => z.id === extra.scelto); const [x0, y0] = P(n.pos);
    extra.spinte.forEach((s) => {
      if (s.status === 'free') {
        const [x, y] = P(s.cell);
        g += `<polygon points="${esa(x, y, S - 3)}" fill="rgba(201,168,76,.26)" stroke="#c9a84c" stroke-width="2" data-tocco="spinta"/>`;
        g += `<line x1="${f1(x0 + (x - x0) * .42)}" y1="${f1(y0 + (y - y0) * .42)}" x2="${f1(x0 + (x - x0) * .8)}" y2="${f1(y0 + (y - y0) * .8)}" stroke="#c9a84c" stroke-width="3" stroke-linecap="round" marker-end="url(#freccia-oro)"/>`;
        g += `<text x="${f1(x + 2)}" y="${f1(y + 16)}" text-anchor="middle" font-size="12" font-weight="800" fill="#f0dc9a">qui</text>`;
      } else {
        // muro: fuori griglia, sotto la colonna; bersaglio di tocco 52×44 che sale sopra il bordo
        const x = cx(s.cell[0]), yb = cy(s.cell[0], 6) + H / 2;
        g += `<rect x="${f1(x - 26)}" y="${f1(yb - 18)}" width="52" height="44" fill="transparent" data-tocco="spinta-muro"/>`;
        g += `<rect x="${f1(x - 31)}" y="${f1(yb + 2)}" width="62" height="23" rx="3" fill="#3a2a16" stroke="#c9a84c" stroke-width="2"/>`;
        g += `<line x1="${f1(x0)}" y1="${f1(y0 + 13)}" x2="${f1(x)}" y2="${f1(yb - 3)}" stroke="#c9a84c" stroke-width="3" stroke-linecap="round" marker-end="url(#freccia-oro)"/>`;
        g += `<text x="${f1(x)}" y="${f1(yb + 18)}" text-anchor="middle" font-size="12" font-weight="800" fill="#f0dc9a">muro: +1 danno</text>`;
      }
    });
  }
  // intenti dei nemici: sempre visibili, nell'ordine del binario
  const [px, py] = P(st.giocatore.pos);
  st.anteprima.forEach((a) => {
    if (a.spento) return;
    const n = st.nemici.find((z) => z.id === a.owner);
    const punti = [n.pos].concat(a.path || []).map(P);
    if (a.action === 'incassare') return;
    if (punti.length > 1) {
      const d = punti.map((p, i) => (i ? 'L' : 'M') + f1(p[0] + (i ? 0 : 0)) + ' ' + f1(p[1])).join(' ');
      g += `<path d="${d}" fill="none" stroke="#b84040" stroke-width="2.500" stroke-linecap="round" stroke-linejoin="round" ${a.reach ? '' : 'stroke-dasharray="2 5"'} opacity=".95"/>`;
    }
    const fin = punti[punti.length - 1];
    if (a.reach) {
      const mx = fin[0] + (px - fin[0]) * .5, my = fin[1] + (py - fin[1]) * .5;
      g += `<line x1="${f1(fin[0])}" y1="${f1(fin[1])}" x2="${f1(fin[0] + (px - fin[0]) * .62)}" y2="${f1(fin[1] + (py - fin[1]) * .62)}" stroke="#b84040" stroke-width="3" stroke-linecap="round" marker-end="url(#freccia-sangue)"/>`;
      if (punti.length > 1) g += `<circle cx="${f1(fin[0])}" cy="${f1(fin[1])}" r="10" fill="#4a1818" stroke="#b84040" stroke-width="1.500"/><text x="${f1(fin[0])}" y="${f1(fin[1] + 4.500)}" text-anchor="middle" font-size="12.500" fill="#e8e0d0" style="font-family:'IM Fell English',serif">${ROMANI[a.owner]}</text>`;
      a._badge = [mx, my];
    } else if (punti.length > 1) {
      g += `<circle cx="${f1(fin[0])}" cy="${f1(fin[1])}" r="10" fill="#1f1b27" stroke="#b84040" stroke-width="1.500" stroke-dasharray="3 2.500"/><text x="${f1(fin[0])}" y="${f1(fin[1] + 4.500)}" text-anchor="middle" font-size="12.500" fill="#e57866" style="font-family:'IM Fell English',serif">${ROMANI[a.owner]}</text>`;
    }
  });
  // pedine
  st.nemici.forEach((n) => {
    const [x, y] = P(n.pos);
    const a = st.anteprima.find((q) => q.owner === n.id) || {};
    g += `<g data-tocco="nemico"><circle cx="${f1(x - 9)}" cy="${f1(y - 3)}" r="13.500" fill="#000" opacity=".5" transform="translate(1.500 2)"/><circle cx="${f1(x - 9)}" cy="${f1(y - 3)}" r="13.500" fill="#4a1818" stroke="#b84040" stroke-width="2"/>
<text x="${f1(x - 9)}" y="${f1(y + 2)}" text-anchor="middle" font-size="14" fill="#e8e0d0" style="font-family:'IM Fell English',serif">${ROMANI[n.id]}</text>
<svg x="${f1(x + 5)}" y="${f1(y - 19)}" width="21" height="21" viewBox="0 0 24 24" fill="#7a1f1f"><use href="#i-hp"/></svg>
<text x="${f1(x + 15.500)}" y="${f1(y - 2.500)}" text-anchor="middle" font-size="13" font-weight="800" fill="#fff">${n.hp}</text></g>`;
    // stati sotto la pedina
    const st2 = [];
    const sh = (n.stati.shield || [0, 0]).reduce((s, v) => s + v, 0) + (a.action === 'incassare' && !a.spento ? 0 : 0);
    if (sh) st2.push(['scudo', '#6fb0dd', sh]);
    if (n.stati.vulnFire) st2.push(['vuln', '#e08945', '']);
    if (n.stati.vuln) st2.push(['vuln', '#e8e0d0', '']);
    if (n.stati.stun) st2.push(['stordito', '#f0dc9a', '']);
    let sx = x - (st2.length * 11) + (st2.length > 1 ? 0 : 2);
    st2.forEach((s) => {
      g += `<svg x="${f1(sx)}" y="${f1(y + 9)}" width="13" height="13" viewBox="0 0 24 24" fill="${s[1]}"><use href="#i-${s[0]}"/></svg>`;
      if (s[2] !== '') g += `<text x="${f1(sx + 14)}" y="${f1(y + 20)}" font-size="12" font-weight="800" fill="${s[1]}">${s[2]}</text>`;
      sx += 24;
    });
    if (a.action === 'incassare' && !a.spento) {
      g += `<rect x="${f1(x - 21)}" y="${f1(y + 8)}" width="42" height="15" rx="7.500" fill="#16324a" stroke="#4a8fbd"/><svg x="${f1(x - 17)}" y="${f1(y + 9.500)}" width="12" height="12" viewBox="0 0 24 24" fill="#8cc4ea"><use href="#i-scudo"/></svg><text x="${f1(x + 6)}" y="${f1(y + 20)}" text-anchor="middle" font-size="12" font-weight="800" fill="#cfe6f7">+2</text>`;
    }
  });
  // io
  g += `<g data-tocco="io"><circle cx="${f1(px)}" cy="${f1(py - 2)}" r="14.500" fill="#000" opacity=".5" transform="translate(1.500 2)"/><circle cx="${f1(px)}" cy="${f1(py - 2)}" r="14.500" fill="#efe6d2" stroke="#c9a84c" stroke-width="3"/><text x="${f1(px)}" y="${f1(py + 2.500)}" text-anchor="middle" font-size="13" font-weight="800" fill="#241b13">Tu</text></g>`;
  if (st.giocatore.stati && st.giocatore.stati.vuln) {
    g += `<rect x="${f1(px - 24)}" y="${f1(py + 9)}" width="48" height="15" rx="7.500" fill="#3a1414" stroke="#e57866"/><svg x="${f1(px - 20)}" y="${f1(py + 10.500)}" width="12" height="12" viewBox="0 0 24 24" fill="#f0b4a8"><use href="#i-vuln"/></svg><text x="${f1(px + 6)}" y="${f1(py + 20.500)}" text-anchor="middle" font-size="12" font-weight="800" fill="#ffd9d0">×2</text>`;
  }
  // danni previsti: sopra tutto
  st.anteprima.forEach((a) => {
    if (!a._badge) return;
    const [mx, my] = a._badge;
    g += `<rect x="${f1(mx - 13)}" y="${f1(my - 9)}" width="26" height="18" rx="4" fill="#b84040" stroke="#12090a"/><text x="${f1(mx)}" y="${f1(my + 4.500)}" text-anchor="middle" font-size="13.500" font-weight="800" fill="#fff">−${a.dmg}</text>`;
  });
  if (extra.sopra) g += extra.sopra;
  return `<div class="tabellone"><svg width="338" height="302" viewBox="0 0 338 302" role="img" aria-label="La stanza">
<defs><marker id="freccia-sangue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4.500" markerHeight="4.500" orient="auto"><path d="M0 0L10 5L0 10z" fill="#b84040"/></marker>
<marker id="freccia-oro" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0L10 5L0 10z" fill="#c9a84c"/></marker></defs>
${g}</svg></div>`;
}

// ───────────────────────── risorse, plancia, carte
function gettoni(g, poi) {
  poi = poi || {};
  const v = (k, val) => (poi[k] != null ? `${val}<span class="poi">→${poi[k]}</span>` : val);
  const el = [
    ['hp', 'hp', `${g.hp}<small>/${g.hpMax}</small>`, 'HP'],
    ['pt', 'pt', v('pt', g.pt), 'PT'],
    ['pm', 'pm', v('pm', g.pm), 'PM'],
    ['luce', 'luce', v('luce', g.luce), 'Luce'],
  ];
  return el.map((e, i) => `<div class="gettone g-${e[0]}" style="left:${8 + 59 * i}px" data-tocco="risorsa"><span class="disco">${ico(e[1])}</span><span><div class="n">${e[2]}</div><div class="et">${e[3]}</div></span></div>`).join('');
}

function sagoma(tipo, pieno, val) {
  const col = { vigore: '#e8e0d0', fuoco: '#e08945', terrore: '#a78be2' }[tipo];
  const f = { vigore: '<rect x="4" y="4" width="22" height="22" rx="4"/>', fuoco: '<path d="M15 4L27 25H3z" stroke-linejoin="round"/>', terrore: '<path d="M15 2L28 15L15 28L2 15z" stroke-linejoin="round"/>' }[tipo];
  const ty = tipo === 'fuoco' ? 23 : 20;
  return `<svg class="sagoma" viewBox="0 0 30 30"><g fill="${pieno ? col : 'none'}" fill-opacity="${pieno ? '.22' : '0'}" stroke="${col}" stroke-opacity="${pieno ? 1 : .5}" stroke-width="1.500" ${pieno ? '' : 'stroke-dasharray="2.500 2.500"'}>${f}</g>${val != null ? `<text x="15" y="${ty}" text-anchor="middle" font-size="13" font-weight="800" fill="${col}" font-family="Alegreya Sans">${val}</text>` : ''}</svg>`;
}

// vani: [{slot, die, cost, carta (nome o null), dado (valore tenuto o null), pagato, escl}]
function plancia(vani) {
  const pos = [[0, 0], [118, 0], [0, 53], [118, 53]];
  return `<div class="plancia" aria-label="Plancia">` + vani.map((v, i) => {
    const sede = v.carta
      ? `<span class="cartina">${ico(TIPO_ICO[v.fam])}</span>${v.cost ? `<span class="moneta ${v.pagato ? 'pagata' : ''}">${v.cost}${ico('luce')}</span>` : ''}`
      : sagoma(v.die, v.dado != null, v.dado);
    let tx = `<b>Slot ${v.slot} ${ico(TIPO_ICO[v.die])}</b>`;
    if (v.carta) tx += `<i>${v.carta}</i>`; else tx += 'libero';
    if (v.riga) tx += `<br><span class="${v.rigaCls || ''}">${v.riga}</span>`;
    return `<div class="vano ${v.dado != null ? 'usato' : ''}" style="left:${pos[i][0]}px;top:${pos[i][1]}px" data-tocco="vano"><span class="sede">${sede}</span><span class="tx">${tx}</span></div>`;
  }).join('') + '</div>';
}

// forma breve delle carte in mano (scritta a mano per l'esplorazione; nel B2 va generata dai dati delle Azioni)
const BREVE = {
  ds: { righe: [['forza', '1 Danno + Spingi 1']] },
  cu: { righe: [['gratis', 'usa 2 dadi vicini: corri dritto, danni = caselle']] },
  ab: { righe: [['gratis', '1 Danno'], ['forza', '1 Danno'], ['forza', 'Pesca 1']] },
  tm: { pre: 'Gittata 2', righe: [['forza', '+1 Gittata'], ['forza', '1 Danno a gittata']] },
  ap: { pre: 'Ti rende Vulnerabile', righe: [['forza', '2 Danni'], ['forza', 'Stordisci + Spingi 1']] },
  pa: { righe: [['forza', '+1 Scudo'], ['forza', 'Pesca 1']] },
};
const ecoTesto = (e) => e.replace(/ · /g, ', ').replace('Ruota', 'ruota');
function carta(c) {
  const b = BREVE[c.id];
  const righe = b.righe.map((r) => r[0] === 'gratis'
    ? `<div class="riga gratis"><u>Gratis:</u> ${r[1]}</div>`
    : `<div class="riga">${ico(r[0])}${r[1]}</div>`).join('');
  const parole = c.nome.split(' ');
  const nome = parole.length > 1 ? parole.slice(0, -1).join(' ') + '<br>' + parole[parole.length - 1] : c.nome;
  return `<div class="testa"><span class="angolo">${ico(TIPO_ICO[c.family])}<small>CD${c.cd}</small></span><span class="nome">${nome}</span></div>
<div class="corpo">${b.pre ? `<div class="pre">${b.pre}</div>` : ''}${righe}</div>
<div class="eco"><b>Eco</b>${ecoTesto(c.eco)}</div>`;
}
function mano(carte, bassa) {
  const n = carte.length, passo = 80.5;
  return `<div class="mano ${bassa ? 'bassa' : ''}">` + carte.map((c, i) => {
    const k = i - (n - 1) / 2;
    const rot = k * 2.2, giu = Math.abs(k) * Math.abs(k) * 1.1;
    return `<div class="carta fam-${c.family}" style="left:${(passo * i).toFixed(1)}px;top:${(3 + giu).toFixed(1)}px;transform:rotate(${rot.toFixed(1)}deg);z-index:${i + 1}" data-tocco="carta">${carta(c)}</div>`;
  }).join('') + '</div>';
}

function bordo(o) {
  const cera = `<svg class="cera" viewBox="0 0 64 64"><path d="M32 3c6 0 8 4 13 5s10 1 12 6-1 9 0 14 5 8 3 13-7 5-10 9-3 9-8 10-8-3-13-3-9 3-13 0-4-8-7-12-8-6-7-11 5-7 6-12-1-10 3-13 9-1 13-3 5-3 8-3z" fill="${o.caldo ? '#a63232' : '#5a2a2c'}"/>
<path d="M32 8c5 0 7 3 11 4s8 1 9 5-1 8 0 12 4 7 3 11-6 4-9 7-3 8-7 9-6-3-10-3-8 3-11 0-3-7-6-10-6-5-5-9 4-6 4-10-1-8 2-11 8-1 11-2 5-3 8-3z" fill="none" stroke="${o.caldo ? '#d6594f' : '#7a4446'}" stroke-width="1.500"/>
<circle cx="32" cy="32" r="15" fill="none" stroke="${o.caldo ? '#f0c9a0' : '#a08a84'}" stroke-width="1.500"/>
<path d="M32 20l3.500 8.500L44 32l-8.500 3.500L32 44l-3.500-8.500L20 32l8.500-3.500z" fill="${o.caldo ? '#f0c9a0' : '#a08a84'}"/></svg>`;
  return `<div class="pila" style="left:768px"><div class="dorso">${o.mazzo}</div>Mazzo</div>
<div class="pila ${o.scarti ? '' : 'vuota'}" style="left:804px"><div class="dorso">${o.scarti}</div>Scarti</div>
<div class="piattino">Dadi<br>scartati${o.scartati.map((s) => `<div class="riga">${dado(s[0], s[1])}<span>${s[2]}</span></div>`).join('')}</div>
<div class="sigillo ${o.caldo ? 'caldo' : 'quieto'}" data-tocco="sigillo" role="button">${cera}<div class="dice">${o.dice}</div></div>`;
}

// ═════════════════════════ SCHERMATA 1 · Selezione (turno 2, SP10: proposta + 1 tocco sul dado Fuoco)
function selezione() {
  const st = JSON.parse(JSON.stringify(DATI.stati.sel_coperto));
  // Variante della Selezione: proposta iniziale (d12, d15) più un tocco su d13 (slot 4 coperto, 1 Luce).
  // Conti secondo dice_system.selectionPlan: guadagni +1 PM (d11) e +1 Luce (d14), costo 1 Luce → Luce 1+1−1 = 1.
  const et = {
    d12: { r1: '<b class="ok">tenuto</b>', r2: 'slot 3' },
    d19: { r1: '<span class="num">I</span> Orda', r2: 'non arriva' },
    d18: { r1: '<span class="num">II</span> Orda', r2: '<b>−1 a te</b>' },
    d13: { r1: '<b class="ok">tenuto</b>', r2: 'paghi 1 Luce' },
    d15: { r1: '<b class="ok">tenuto</b>', r2: 'slot 2' },
    d20: { r1: '<span class="num">III</span> Morso', r2: 'non arriva' },
    d17: { r1: '<span class="num">IV</span> Incassa', r2: '+2 Scudi' },
    d16: { r1: '<span class="num">V</span> Orda', r2: 'non arriva' },
    d11: { r1: 'scarto: <b>+1 PM</b>', r2: 'tenerlo: 2 Luce', fantasma: true },
    d14: { r1: 'scarto: <b>+1 Luce</b>', r2: 'nessuno slot', fantasma: true },
  };
  const vani = [
    { slot: 1, die: 'vigore', cost: 2, carta: 'Distorsione', fam: 'terrore', riga: 'esce a fine turno' },
    { slot: 2, die: 'terrore', dado: 1, riga: 'dado tenuto', rigaCls: 'qui' },
    { slot: 3, die: 'vigore', dado: 2, riga: 'dado tenuto', rigaCls: 'qui' },
    { slot: 4, die: 'fuoco', cost: 1, carta: 'Att. di Fuoco', fam: 'fuoco', pagato: true, riga: 'pagato: dado tenuto', rigaCls: 'qui' },
  ];
  const corpo = `
<div class="piastra"><div class="dove">La Cripta, turno ${st.turno} di ${st.stanza ? st.stanza.veglia : 6}</div><div class="fase">Selezione</div><div class="cosa">Tocca un tuo dado per tenerlo o scartarlo.</div></div>
${binario(st.seq, et, { toccabili: true })}
${gettoni(st.giocatore, { pm: 5, luce: 1 })}
${plancia(vani)}
<div class="scheda" data-tocco="scheda"><h3>Zombie <small>6 HP, muove di 2</small></h3>
<p>${ico('artigli')}<span class="f">1–2</span> <b>Orda.</b> Ti raggiunge: 1 danno, +1 per ogni altro zombie accanto a te.</p>
<p>${ico('morso')}<span class="f">3</span> <b>Morso.</b> Ti raggiunge: 2 danni, e si cura.</p>
<p>${ico('scudo')}<span class="f">4</span> <b>Incassa.</b> Fermo, +2 Scudi.</p></div>
${mano(st.mano)}
${tabellone(st)}
${bordo({ mazzo: st.mazzo, scarti: st.scarti, scartati: [['vigore', 2, '+1 PM'], ['fuoco', 1, '+1 Luce']], caldo: true, dice: 'Vincola la<br>Sequenza' })}
`;
  return pagina('Il tavolo · Selezione (telefono 844×390)', corpo);
}

// ═════════════════════════ SCHERMATA 2 · Risoluzione, carta in uso (SP4 con Attacco Poderoso)
function risoluzione() {
  const st = JSON.parse(JSON.stringify(DATI.stati.carta_aperta));
  const et = {
    d12: { cls: 'attivo', r1: '<b>tocca a te</b>', r2: 'resta 1 impulso' },
    d19: { r1: '<span class="num">I</span> Orda', r2: '<b>−6 a te</b>' },
    d18: { r1: '<span class="num">II</span> Orda', r2: '<b>−6 a te</b>' },
    d13: { r1: 'Fuoco', r2: '1 impulso' },
    d15: { r1: 'Terrore', r2: '1 impulso' },
    d20: { r1: '<span class="num">III</span> Morso', r2: 'non arriva' },
    d17: { cls: 'spento', croce: true, r1: '<span class="num">IV</span> stordito', r2: 'salta' },
    d16: { r1: '<span class="num">V</span> Orda', r2: 'non arriva' },
  };
  const vani = [
    { slot: 1, die: 'vigore', cost: 2, carta: 'Distorsione', fam: 'terrore', riga: 'esce a fine turno' },
    { slot: 2, die: 'terrore', dado: 1, riga: 'dado in Sequenza', rigaCls: '' },
    { slot: 3, die: 'vigore', dado: 2, riga: 'dado attivo', rigaCls: 'qui' },
    { slot: 4, die: 'fuoco', dado: 1, riga: 'dado in Sequenza', rigaCls: '' },
  ];
  const a = st.aperta;
  const corpo = `
<div class="piastra"><div class="dove">La Cripta, turno ${st.turno} di 6</div><div class="fase">Risoluzione</div><div class="cosa">Scegli dove spingere lo zombie IV.</div></div>
${binario(st.seq, et)}
${gettoni(st.giocatore)}
${plancia(vani)}
<div class="gioco" aria-label="Carta in gioco">
  <div class="testa"><span class="angolo">${ico('forza')}<small>CD2</small></span><span class="nome">Attacco Poderoso</span></div>
  <div class="pre">Usarla ti rende Vulnerabile.</div>
  <div class="az chiusa" data-tocco="azione"><span class="costo">${ico('forza')}</span><s>2 Danni a un adiacente.</s><span class="perche">${a.azioni[0].motivo}.</span></div>
  <div class="az ora" data-tocco="azione"><span class="costo">${ico('forza')}</span>Stordisci un adiacente + Spingi 1.<span class="fai"><span class="speso">${ico('forza')}</span>usata 1 volta su IV. Puoi ripeterla: resta 1 impulso.</span></div>
  <div class="dopo">Quando la chiudi va in Plancia per 2 turni.</div>
  <div class="eco"><b>Eco</b>+1 PM, +1 Luce<br>non in questo turno: è in gioco</div>
</div>
<div class="impulsi"><span class="pedina">${ico('forza')}</span><span><b>1 impulso di Forza</b> dal tuo dado.<br>Se passi oltre, va perso.</span></div>
<div class="cronaca"><b>Appena successo:</b> IV stordito e spinto contro il muro. Collisione, 1 danno. Tu sei Vulnerabile: i danni che subisci raddoppiano.</div>
${mano(st.mano, true)}
${tabellone(st, { validi: ['Z2', 'Z4'], scelto: 'Z4', spinte: a.spinta })}
${bordo({ mazzo: st.mazzo, scarti: st.scarti, scartati: [['vigore', 2, '+1 PM'], ['fuoco', 1, '+1 Luce']], caldo: false, dice: 'Chiudi<br>la carta' })}
`;
  return pagina('Il tavolo · Risoluzione, carta in uso (telefono 844×390)', corpo);
}

fs.writeFileSync(path.join(QUI, 'selezione_telefono.html'), selezione());
fs.writeFileSync(path.join(QUI, 'risoluzione_carta_telefono.html'), risoluzione());
console.log('ok: selezione_telefono.html, risoluzione_carta_telefono.html');
