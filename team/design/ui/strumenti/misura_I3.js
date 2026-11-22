// Misura automatica I3 (US-02 criteri 1–5, US-07 criterio 1, US-01 criterio 2) sui mockup del telefono.
// Uso: NODE_PATH=$(npm root -g) node team/design/ui/strumenti/misura_I3.js
// Convenzioni nei mockup: [data-tocco] = elemento interattivo, [data-casella] = casella della griglia,
// [data-pannello] = pannello, [data-primario] = pulsante primario.
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const { fontRoute } = require('./font_locali');

const UI = path.join(__dirname, '..');
const FILES = ['direzione_A_selezione_telefono.html', 'direzione_B_selezione_telefono.html'];
const STATI = ['proposta', 'rifiuto'];

function misura() {
  const vis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity !== 0; };
  const palco = document.querySelector('.palco.vis');
  const P = palco.getBoundingClientRect();
  const out = {};
  // 1. testo
  const walker = document.createTreeWalker(palco, NodeFilter.SHOW_TEXT);
  const sizes = []; let n;
  while ((n = walker.nextNode())) {
    if (!n.textContent.trim()) continue;
    const el = n.parentElement; if (!vis(el)) continue;
    let fs = parseFloat(getComputedStyle(el).fontSize);
    if (el instanceof SVGElement && el.getScreenCTM) { const m = el.getScreenCTM(); fs *= Math.sqrt(m.a * m.a + m.b * m.b) * (window.devicePixelRatio ? 1 : 1); }
    sizes.push({ t: n.textContent.trim().slice(0, 30), fs: Math.round(fs * 10) / 10 });
  }
  out.testo = { nodi: sizes.length, sotto12: sizes.filter(s => s.fs < 12).length, min: Math.min(...sizes.map(s => s.fs)), esempiSotto12: sizes.filter(s => s.fs < 12).slice(0, 5) };
  // 2. bersagli di tocco
  const tt = [...palco.querySelectorAll('[data-tocco]')].filter(vis).map(el => { const r = el.getBoundingClientRect(); return { id: el.dataset.tocco, w: Math.round(r.width), h: Math.round(r.height) }; });
  out.tocco = { elementi: tt.length, sotto44: tt.filter(t => t.w < 44 || t.h < 44).length, minW: Math.min(...tt.map(t => t.w)), minH: Math.min(...tt.map(t => t.h)), fuori: tt.filter(t => t.w < 44 || t.h < 44) };
  // 3. griglia
  const cells = [...palco.querySelectorAll('[data-casella]')].map(el => { const r = el.getBoundingClientRect(); return { id: el.dataset.casella, r }; });
  const inView = cells.filter(c => c.r.left >= P.left - 0.5 && c.r.right <= P.right + 0.5 && c.r.top >= P.top - 0.5 && c.r.bottom <= P.bottom + 0.5).length;
  const top = Math.min(...cells.map(c => c.r.top)), bottom = Math.max(...cells.map(c => c.r.bottom)), left = Math.min(...cells.map(c => c.r.left)), right = Math.max(...cells.map(c => c.r.right));
  let coperteDaPannello = 0, conMarcatore = 0;
  cells.forEach(c => {
    const x = c.r.left + c.r.width / 2, y = c.r.top + c.r.height / 2;
    const el = document.elementFromPoint(x, y);
    if (!el || !el.closest('#mappa')) coperteDaPannello++;
    else if (el.closest('.minaccia')) conMarcatore++;
  });
  const cw = cells.map(c => Math.max(c.r.width, c.r.height)), ch = cells.map(c => Math.min(c.r.width, c.r.height));
  out.griglia = { caselle: cells.length, dentroSchermo: inView, altezza: Math.round(bottom - top), larghezza: Math.round(right - left), quotaAltezza: Math.round((bottom - top) / P.height * 100) + '%',
    casellaMaggiore: Math.round(Math.min(...cw)), casellaMinore: Math.round(Math.min(...ch)), coperteDaPannello, centroSottoUnaEtichettaDiMinaccia: conMarcatore };
  // 4. pannelli sovrapposti
  const pans = [...palco.querySelectorAll('[data-pannello]')].filter(vis).map(el => ({ id: el.dataset.pannello, r: el.getBoundingClientRect() }));
  const over = [];
  for (let i = 0; i < pans.length; i++) for (let j = i + 1; j < pans.length; j++) {
    const a = pans[i].r, b = pans[j].r;
    const w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    if (w > 0.5 && h > 0.5) over.push(pans[i].id + '×' + pans[j].id + ' ' + Math.round(w) + '×' + Math.round(h));
  }
  // anche le etichette di minaccia non devono uscire dalla mappa
  const mappa = palco.querySelector('#mappa').getBoundingClientRect();
  const tagFuori = [...palco.querySelectorAll('.minaccia')].filter(el => { const r = el.getBoundingClientRect(); return r.left < mappa.left - 0.5 || r.right > mappa.right + 0.5 || r.top < mappa.top - 0.5 || r.bottom > mappa.bottom + 0.5; }).length;
  out.pannelli = { pannelli: pans.length, sovrapposti: over.length, dettaglio: over, etichetteMinacciaFuoriMappa: tagFuori };
  // 5. un solo primario; nessuna regola :hover
  out.primari = palco.querySelectorAll('[data-primario]').length;
  let hover = 0; for (const ss of document.styleSheets) { try { for (const r of ss.cssRules) if (r.selectorText && r.selectorText.includes(':hover')) hover++; } catch (e) { } }
  out.regoleHover = hover;
  // 6. peso della Sequenza (US-07 c.1): valore dei dadi più grande di ogni numero di carte, Plancia, pulsanti
  const fsOf = (sel) => [...palco.querySelectorAll(sel)].filter(vis).map(e => parseFloat(getComputedStyle(e).fontSize));
  const dadi = fsOf('.faccia b, .osso b, .sigillo-cera b');
  const altri = fsOf('[data-pannello="mano"] *, .nicchia b, .nicchia .n, [data-primario], [data-primario] small');
  const dadiR = [...palco.querySelectorAll('.faccia, .osso, .sigillo-cera')].map(e => e.getBoundingClientRect());
  out.sequenza = { dadi: dadiR.length, latoMinimo: Math.round(Math.min(...dadiR.map(r => Math.min(r.width, r.height)))), corpoValoreDadi: Math.min(...dadi), corpoMaxAltriNumeri: Math.max(...altri),
    unaRiga: new Set(dadiR.map(r => Math.round(r.top / 20))).size <= 2 };
  return out;
}

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  await fontRoute(ctx);
  const res = { data: new Date().toISOString().slice(0, 10), viewport: '844×390 touch', risultati: {} };
  for (const f of FILES) for (const st of STATI) {
    const p = await ctx.newPage();
    await p.goto('file://' + path.join(UI, f) + '?stato=' + st);
    await p.evaluate(() => document.fonts.ready);
    const r = await p.evaluate(misura);
    res.risultati[f.replace('_selezione_telefono.html', '') + ' · ' + st] = r;
    await p.close();
  }
  await b.close();
  fs.writeFileSync(path.join(__dirname, 'misura_I3_risultato.json'), JSON.stringify(res, null, 2));
  for (const [k, r] of Object.entries(res.risultati)) {
    console.log(`${k}: testo ${r.testo.nodi} nodi, <12px ${r.testo.sotto12} (min ${r.testo.min}) | tocco ${r.tocco.elementi}, <44 ${r.tocco.sotto44} (min ${r.tocco.minW}×${r.tocco.minH}) | griglia ${r.griglia.dentroSchermo}/${r.griglia.caselle} in vista, alta ${r.griglia.altezza}px (${r.griglia.quotaAltezza}), casella ${r.griglia.casellaMaggiore}×${r.griglia.casellaMinore}, coperte da pannello ${r.griglia.coperteDaPannello}, sotto etichetta ${r.griglia.centroSottoUnaEtichettaDiMinaccia} | pannelli sovrapposti ${r.pannelli.sovrapposti} ${r.pannelli.dettaglio.join(', ')}, etichette fuori mappa ${r.pannelli.etichetteMinacciaFuoriMappa} | primari ${r.primari} | :hover ${r.regoleHover} | dadi ${r.sequenza.dadi} lato ${r.sequenza.latoMinimo} corpo ${r.sequenza.corpoValoreDadi} vs altri ${r.sequenza.corpoMaxAltriNumeri}`);
  }
})();
