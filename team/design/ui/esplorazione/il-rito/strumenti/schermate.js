// PNG dei due mockup a 844×390, deviceScaleFactor 2. Uso: NODE_PATH=$(npm root -g) node schermate.js
'use strict';
const path = require('path');
const { chromium } = require('playwright');
const OUT = path.join(__dirname, '..');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  for (const n of ['selezione_telefono', 'risoluzione_carta_telefono']) {
    const p = await ctx.newPage();
    await p.goto('file://' + path.join(OUT, n + '.html'));
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(250);
    await p.screenshot({ path: path.join(OUT, n + '.png') });
    // misura: testo sotto 12 px
    const piccoli = await p.evaluate(() => { const out = []; document.querySelectorAll('#scena *').forEach(e => { if (![...e.childNodes].some(c => c.nodeType === 3 && c.textContent.trim())) return; const s = parseFloat(getComputedStyle(e).fontSize); if (s < 12) out.push(e.tagName + ':' + s + ':' + e.textContent.trim().slice(0, 20)); }); return out; });
    console.log('ok', n, 'testi < 12 px:', piccoli.length, piccoli.slice(0, 5));
    await p.close();
  }
  await b.close();
})();
