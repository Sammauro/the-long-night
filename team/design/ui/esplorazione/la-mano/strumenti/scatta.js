// Scatta i PNG dei due mockup a 844x390, deviceScaleFactor 2, e controlla testo >= 12 px e uscite dal palco.
// Uso: FONTSOURCE_DIR=<cartella con node_modules/@fontsource> node scatta.js
// Servono i pacchetti @fontsource/grenze-gotisch e @fontsource/asap-condensed (Google Fonts non passa dal proxy).
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const DIR = path.join(__dirname, '..');
const FS = process.env.FONTSOURCE_DIR || path.join(__dirname, 'node_modules');

function fontCss() {
  const face = (fam, pkg, w, st) => {
    const f = path.join(FS, '@fontsource', pkg, 'files', `${pkg}-latin-${w}-${st}.woff2`);
    if (!fs.existsSync(f)) return '';
    return `@font-face{font-family:'${fam}';font-style:${st};font-weight:${w};font-display:block;src:url(data:font/woff2;base64,${fs.readFileSync(f).toString('base64')}) format('woff2');}`;
  };
  return [400, 500, 600, 700].map(w => face('Asap Condensed', 'asap-condensed', w, 'normal') + face('Grenze Gotisch', 'grenze-gotisch', w, 'normal')).join('') +
    face('Asap Condensed', 'asap-condensed', 400, 'italic');
}

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 });
  const css = fontCss();
  await ctx.route(/fonts\.googleapis\.com/, r => r.fulfill({ status: 200, contentType: 'text/css', body: css }));
  await ctx.route(/fonts\.gstatic\.com/, r => r.abort());
  for (const n of ['selezione_telefono', 'risoluzione_carta_telefono']) {
    const p = await ctx.newPage();
    await p.goto('file://' + path.join(DIR, n + '.html'));
    await p.evaluate(() => document.fonts.ready);
    const rep = await p.evaluate(() => {
      const out = { piccoli: [], fuori: [], font: [...document.fonts].filter(f => f.status === 'loaded').length };
      document.querySelectorAll('.palco *').forEach(el => {
        const own = [...el.childNodes].some(c => c.nodeType === 3 && c.textContent.trim());
        if (!own) return;
        const fsz = parseFloat(getComputedStyle(el).fontSize), r = el.getBoundingClientRect();
        if (fsz < 12) out.piccoli.push(el.textContent.trim().slice(0, 30) + ' ' + fsz);
        if (r.right > 845 || r.bottom > 391 || r.left < -1 || r.top < -1) out.fuori.push(el.textContent.trim().slice(0, 30) + ' ' + [r.left, r.top, r.right, r.bottom].map(Math.round).join(','));
      });
      return out;
    });
    console.log(n, JSON.stringify(rep));
    await p.screenshot({ path: path.join(DIR, n + '.png') });
    await p.close();
  }
  await b.close();
})();
