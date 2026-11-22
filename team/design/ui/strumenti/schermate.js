// Schermate PNG dei mockup a 844×390, deviceScaleFactor 2.
// Uso: NODE_PATH=$(npm root -g) node team/design/ui/strumenti/schermate.js [cartella-fontsource]
// Se Google Fonts non è raggiungibile (rete chiusa), i font vengono serviti dai pacchetti @fontsource locali.
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const { fontRoute } = require('./font_locali');

const UI = path.join(__dirname, '..');
const OUT = path.join(UI, 'schermate');
const JOBS = [
  ['direzione_A_selezione_telefono.html', 'proposta', 'direzione_A_selezione_telefono.png'],
  ['direzione_A_selezione_telefono.html', 'rifiuto', 'direzione_A_selezione_telefono_rifiuto.png'],
  ['direzione_B_selezione_telefono.html', 'proposta', 'direzione_B_selezione_telefono.png'],
  ['direzione_B_selezione_telefono.html', 'rifiuto', 'direzione_B_selezione_telefono_rifiuto.png'],
];

(async () => {
  const only = process.argv[2];
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  await fontRoute(ctx);
  for (const [file, stato, png] of JOBS) {
    if (only && !file.includes(only)) continue;
    if (!fs.existsSync(path.join(UI, file))) continue;
    const p = await ctx.newPage();
    await p.goto('file://' + path.join(UI, file) + '?stato=' + stato);
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(300);
    await p.screenshot({ path: path.join(OUT, png) });
    console.log('ok', png);
    await p.close();
  }
  await b.close();
})();
