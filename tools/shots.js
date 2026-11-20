// Schermate di confronto: base / b / c, desktop e telefono orizzontale, stanza La Cripta (r1)
// Uso: avvia un server nella cartella del gioco (python -m http.server 8765), poi: node tools/shots.js <cartella_uscita> [stili]
// Richiede: npm i -D playwright && npx playwright install chromium
const { chromium } = require('playwright');
const OUT = process.argv[2] || 'docs/style_test';
const STYLES = (process.argv[3] || 'base,b,c').split(',');
const ROOT = 'http://127.0.0.1:8765/index.html';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const views = [{ n: 'desktop', w: 1400, h: 850, dpr: 1 }, { n: 'phone', w: 844, h: 390, dpr: 2 }];
  for (const st of STYLES) for (const v of views) {
    const p = await b.newPage({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: v.dpr });
    await p.route(/cdnjs.*three/, r => r.abort());
    const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    const q = '?seed=7&room=r1' + (st === 'base' ? '' : '&style=' + st);
    await p.goto(ROOT + q); await p.waitForTimeout(2500);
    const skip = p.getByText(/Salta il tutorial/i).first();
    if (await skip.count()) { await skip.click(); await p.waitForTimeout(1500); }
    await p.waitForTimeout(1500);
    await p.screenshot({ path: `${OUT}/${st}_${v.n}.png` });
    // Luce alta: per vedere come cambia il dithering con la Luce
    if (st === 'c' && v.n === 'desktop') {
      await p.evaluate(() => { const G = TLN.ui.st.run.game; G.player.luce = 5; TLN.render.lights.setLuce(null, 5); });
      await p.waitForTimeout(1500); await p.screenshot({ path: `${OUT}/c_desktop_luce5.png` });
      await p.evaluate(() => TLN.render.lights.setDark(null, true));
      await p.waitForTimeout(1500); await p.screenshot({ path: `${OUT}/c_desktop_buio.png` });
    }
    console.log(st, v.n, 'errori:', errs.length, errs.slice(0, 3));
    await p.close();
  }
  await b.close();
})();
