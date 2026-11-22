// Misura I3 sugli 11 fotogrammi del concetto, con la stessa funzione di strumenti/misura_I3.js.
// Uso: FONTSOURCE_DIR=… NODE_PATH=$(npm root -g) node team/design/ui/concetto/strumenti/misura_concetto.js
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { fontRoute } = require('../../strumenti/font_locali');
const { misura } = require('../../strumenti/misura_I3');
const { FOTO, DIR } = require('./fotogrammi');
// in più rispetto a I3: contrasto del testo in penombra (rischio del concetto) e posto dell'esito (US-10 c.7)
function extra() {
  const palco = document.querySelector('.palco.vis'), out = {};
  const lum = (c) => { const v = c.map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
  const rgb = (s) => s.match(/[\d.]+/g).slice(0, 3).map(Number);
  const bg = [9, 8, 12];
  let min = 99, chi = '';
  const w = document.createTreeWalker(palco, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) {
    if (!n.textContent.trim()) continue;
    let el = n.parentElement, op = 1, vis = true, chiaro = false;
    for (let e = el; e && e !== palco; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none') vis = false; op *= +cs.opacity; if (/osso|foglio|nodo/.test(e.getAttribute('class') || '')) chiaro = true; }
    if (!vis || op === 0 || chiaro || el.closest('svg')) continue;
    const c = rgb(getComputedStyle(el).color).map((x, i) => x * op + bg[i] * (1 - op));
    const r = (lum(c) + 0.05) / (lum(bg) + 0.05);
    if (r < min) { min = r; chi = n.textContent.trim().slice(0, 24) + ' (opacità ' + op.toFixed(2) + ')'; }
  }
  out.contrastoMinimoSuBuio = Math.round(min * 10) / 10; out.testoMenoContrastato = chi;
  const R = (el) => el.getBoundingClientRect(), tocca = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0.5 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0.5;
  const voce = [...palco.querySelectorAll('.voce')].find((v) => getComputedStyle(v).visibility !== 'hidden');
  if (voce) out.voceTocca = ['.filo', '.unita.fuoco', '.unita.io'].filter((s) => [...palco.querySelectorAll(s)].some((e) => tocca(R(voce), R(e))));
  return out;
}
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  await fontRoute(ctx);
  const res = { data: new Date().toISOString().slice(0, 10), viewport: '844×390 touch', strumento: 'strumenti/misura_I3.js (funzione misura) + controlli del concetto', risultati: {} };
  for (const [s, n, nome] of FOTO) {
    const p = await ctx.newPage();
    await p.goto('file://' + path.join(DIR, 'prototipo.html') + `?scena=${s}&passo=${n}&fermo=1`);
    await p.evaluate(() => document.fonts.ready);
    const r = await p.evaluate(misura); r.concetto = await p.evaluate(extra);
    res.risultati[nome] = r;
    console.log(`${nome}: testo ${r.testo.nodi} nodi <12px ${r.testo.sotto12} (min ${r.testo.min}) | tocco ${r.tocco.elementi} <44 ${r.tocco.sotto44} (min ${r.tocco.minW}×${r.tocco.minH}) | griglia ${r.griglia.dentroSchermo}/${r.griglia.caselle} alta ${r.griglia.altezza} (${r.griglia.quotaAltezza}) casella ${r.griglia.casellaMaggiore}×${r.griglia.casellaMinore} coperte ${r.griglia.coperteDaPannello} | pannelli sovr. ${r.pannelli.sovrapposti} ${r.pannelli.dettaglio.join(',')} etich. fuori ${r.pannelli.etichetteMinacciaFuoriMappa} | primari ${r.primari} | hover ${r.regoleHover} | dadi ${r.sequenza.dadi} lato ${r.sequenza.latoMinimo} corpo ${r.sequenza.corpoValoreDadi} vs ${r.sequenza.corpoMaxAltriNumeri} | contrasto min ${r.concetto.contrastoMinimoSuBuio} «${r.concetto.testoMenoContrastato}»${r.concetto.voceTocca ? ' | voce tocca: ' + (r.concetto.voceTocca.join(',') || 'niente') : ''}`);
    if (r.tocco.fuori.length) console.log('   fuori soglia:', JSON.stringify(r.tocco.fuori));
    if (r.testo.esempiSotto12.length) console.log('   testo:', JSON.stringify(r.testo.esempiSotto12));
    await p.close();
  }
  await b.close();
  fs.writeFileSync(path.join(__dirname, 'misura_I3_concetto.json'), JSON.stringify(res, null, 2));
})();
