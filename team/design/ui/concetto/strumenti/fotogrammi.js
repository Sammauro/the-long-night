// Fotogrammi PNG del concetto (844×390, deviceScaleFactor 2) da prototipo.html?scena=…&passo=…&fermo=1
// Uso: FONTSOURCE_DIR=<node_modules con @fontsource> NODE_PATH=$(npm root -g) node team/design/ui/concetto/strumenti/fotogrammi.js
'use strict';
const path = require('path');
const { chromium } = require('playwright');
const { fontRoute } = require('../../strumenti/font_locali');
const DIR = path.join(__dirname, '..');
const FOTO = [
  ['A', 1, 'A1_selezione_riposo'], ['A', 2, 'A2_selezione_fuoco_a_meta'], ['A', 3, 'A3_selezione_a_fuoco_su_Z2'], ['A', 4, 'A4_selezione_rifiuto_sul_filo'],
  ['B', 1, 'B1_nemico_luce_larga'], ['B', 2, 'B2_nemico_annuncio'], ['B', 3, 'B3_nemico_atto'], ['B', 4, 'B4_nemico_verdetto'],
  ['C', 1, 'C1_dado_mio_la_mano_risponde'], ['C', 2, 'C2_carta_scelta'], ['C', 3, 'C3_carta_aperta_spinta'],
];
module.exports = { FOTO, DIR };
if (require.main === module) (async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const font = await fontRoute(ctx);
  if (!font) console.warn('attenzione: @fontsource non trovato, i font potrebbero essere di ripiego');
  for (const [s, n, nome] of FOTO) {
    if (process.argv[2] && !nome.startsWith(process.argv[2])) continue;
    const p = await ctx.newPage();
    await p.goto('file://' + path.join(DIR, 'prototipo.html') + `?scena=${s}&passo=${n}&fermo=1`);
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(250);
    await p.locator('#palco').screenshot({ path: path.join(DIR, 'fotogrammi', nome + '.png') });
    console.log('ok', nome);
    await p.close();
  }
  await b.close();
})();
