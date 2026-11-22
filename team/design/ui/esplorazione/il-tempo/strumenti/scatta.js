// Scatta i PNG dei due mockup (844×390, deviceScaleFactor 2) e misura testo e bersagli di tocco.
// Uso: NODE_PATH=<node_modules con playwright> node scatta.js
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const DIR = path.join(__dirname, '..');
const FILES = ['selezione_telefono', 'risoluzione_carta_telefono'];

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const misure = {};
  for (const f of FILES) {
    const page = await ctx.newPage();
    await page.goto('file://' + path.join(DIR, f + '.html'));
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(DIR, f + '.png') });
    misure[f] = await page.evaluate(() => {
      const piccoli = [];
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n, tot = 0;
      while ((n = w.nextNode())) {
        if (!n.textContent.trim()) continue;
        const el = n.parentElement; if (el.closest('svg.dado')) continue; // i numeri dei dadi sono ≥ 14 px
        tot++;
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (fs < 12) piccoli.push(n.textContent.trim().slice(0, 20) + ' ' + fs);
      }
      const stretti = [];
      document.querySelectorAll('[data-tocco]').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width < 44 || r.height < 44) stretti.push((el.className + ' ' + el.textContent.trim().slice(0, 14)) + ' ' + Math.round(r.width) + '×' + Math.round(r.height));
      });
      const fuori = [];
      document.querySelectorAll('body *').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width && (r.right > 844.5 || r.bottom > 390.5 || r.left < -0.5 || r.top < -0.5)) fuori.push(el.className + ' ' + Math.round(r.right) + ',' + Math.round(r.bottom));
      });
      return { testi: tot, testiSotto12: piccoli, bersagli: document.querySelectorAll('[data-tocco]').length, bersagliSotto44: stretti, fuoriSchermo: fuori.slice(0, 12) };
    });
    await page.close();
  }
  await browser.close();
  fs.writeFileSync(path.join(__dirname, 'misura_risultato.json'), JSON.stringify(misure, null, 2));
  console.log(JSON.stringify(misure, null, 2));
})();
