// PNG dei due mockup a 844×390, deviceScaleFactor 2, più una misura rapida (testo ≥ 12 px, bersagli ≥ 44 px).
// Uso: FONTSOURCE_DIR=<cartella node_modules con @fontsource> NODE_PATH=<node_modules con playwright> node scatta.js
'use strict';
const path = require('path');
const { chromium } = require('playwright');
const { fontRoute } = require(path.join(__dirname, '..', '..', '..', 'strumenti', 'font_locali.js'));
const QUI = path.join(__dirname, '..');
const FILE = ['selezione_telefono', 'risoluzione_carta_telefono'];

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const fontOk = await fontRoute(ctx);
  for (const f of FILE) {
    const p = await ctx.newPage();
    await p.goto('file://' + path.join(QUI, f + '.html'));
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(300);
    await p.screenshot({ path: path.join(QUI, f + '.png') });
    const m = await p.evaluate(() => {
      const piccoli = [];
      const w = document.createTreeWalker(document.querySelector('.tavolo'), NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode(); n; n = w.nextNode()) {
        if (!n.textContent.trim()) continue;
        const fs = parseFloat(getComputedStyle(n.parentElement).fontSize);
        if (fs < 12) piccoli.push(n.textContent.trim().slice(0, 20) + ' ' + fs);
      }
      const stretti = [];
      document.querySelectorAll('[data-tocco]').forEach((e) => {
        const r = e.getBoundingClientRect();
        if (r.width < 44 || r.height < 44) stretti.push(e.getAttribute('data-tocco') + ' ' + Math.round(r.width) + '×' + Math.round(r.height));
      });
      const fuori = [];
      document.querySelectorAll('.tavolo > *').forEach((e) => { const r = e.getBoundingClientRect(); if (r.right > 845 || r.left < -1) fuori.push(e.className); });
      return { piccoli, stretti: [...new Set(stretti)], fuori, sw: document.documentElement.scrollWidth };
    });
    console.log(f, 'font locali:', fontOk, JSON.stringify(m));
    await p.close();
  }
  await b.close();
})();
