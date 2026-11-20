// Esplorazione da giocatore: menu, tutorial, anteprima dado IA, dettaglio carta, scheda nemico, tocco prolungato. Uso: node tools/tests/probe_esplora.js <outDir> [--phone] [--style=b|c]
var fs = require('fs'), path = require('path');
var pw = require(path.join(__dirname, '..', '..', 'node_modules', 'playwright'));
var OUT = process.argv[2], PHONE = process.argv.indexOf('--phone') > 0, style = (process.argv.filter(function (a) { return /^--style=/.test(a); })[0] || '').slice(8);
var TAG = 'esplora_' + (style || 'base') + (PHONE ? '_phone' : '_desk');
var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
(async function () {
  var b = await pw.chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  var ctx = await b.newContext(PHONE ? { viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true } : { viewport: { width: 1440, height: 900 } });
  var p = await ctx.newPage(), errs = [];
  p.on('pageerror', function (e) { errs.push(String(e)); }); p.on('console', function (m) { if (m.type() === 'error') errs.push(m.text()); });
  var shot = async function (n) { await p.screenshot({ path: path.join(OUT, TAG + '_' + n + '.png') }); };
  var tap = async function (loc) { if (PHONE) await loc.tap(); else await loc.click(); };
  await p.goto('http://127.0.0.1:8765/index.html?seed=7' + (style ? '&style=' + style : '')); await sleep(2000);
  // 1) tutorial
  await tap(p.getByText(/Inizia/).first()); await sleep(2500); await shot('tutorial_1');
  var coach = await p.evaluate(function () { return (document.getElementById('coach').innerText || '').slice(0, 300); });
  console.log('TUTORIAL passo 1:', JSON.stringify(coach));
  // prova un comando sbagliato: clic su una carta al passo 1
  await tap(p.locator('#hand .card').first()); await sleep(400);
  console.log('Dopo clic su carta durante il passo 1: toast =', JSON.stringify(await p.evaluate(function () { return document.getElementById('toast').innerText; })), 'coach =', JSON.stringify(await p.evaluate(function () { return (document.getElementById('coach').innerText || '').slice(0, 160); })));
  await shot('tutorial_clic_sbagliato');
  await tap(p.getByText(/Salta tutorial/i).first()); await sleep(2000);
  await shot('dopo_salta_tutorial');
  console.log('Dopo Salta tutorial: stanza', await p.evaluate(function () { return TLN.ui.st.run.game.room.id + ' fase ' + TLN.ui.st.run.game.phase; }));
  // 2) selezione: chiudo i suggerimenti, tengo tutti i dadi e confermo
  var hint = p.getByText(/Ho capito/i); if (await hint.count()) { await tap(hint.first()); await sleep(200); }
  await shot('selezione_di_partenza');
  console.log('Stato di partenza della selezione (dadi tenuti):', JSON.stringify(await p.evaluate(function () { return TLN.ui.st.G.sel.keep; })), 'testo comando:', JSON.stringify(await p.evaluate(function () { return document.getElementById('controls').innerText; })));
  var dice = p.locator('#seq .die.k-vigore, #seq .die.k-fuoco, #seq .die.k-terrore');
  var n = await dice.count(); console.log('dadi del giocatore:', n);
  for (var i = 0; i < Math.min(n, 3); i++) { await tap(dice.nth(i)); await sleep(150); }
  await shot('selezione_tre_dadi');
  console.log('Dopo 3 dadi tenuti:', JSON.stringify(await p.evaluate(function () { return document.getElementById('controls').innerText; })));
  await tap(p.locator('#controls button', { hasText: /Conferma/ })); await sleep(2500);
  // 3) anteprima dado IA
  var ai = p.locator('#seq .die.k-ai'); console.log('dadi IA:', await ai.count());
  if (PHONE) { await tap(ai.first()); } else { await ai.first().hover(); }
  await sleep(500); await shot('anteprima_dado_ia');
  console.log('Anteprima dado IA:', JSON.stringify(await p.evaluate(function () { return document.getElementById('preview').innerText; })));
  // 4) dettaglio carta (tocco prolungato / tasto destro)
  var card = p.locator('#hand .card').first();
  if (PHONE) { var bb = await card.boundingBox(); await p.touchscreen.tap(bb.x + 5, bb.y + 5); } // niente long-press nativo: uso contextmenu
  await card.click({ button: 'right' }).catch(function () {}); await sleep(400); await shot('dettaglio_carta');
  console.log('Dettaglio carta aperto:', await p.evaluate(function () { return document.getElementById('modal').classList.contains('on'); }));
  await p.keyboard.press('Escape'); await sleep(200);
  // 5) scheda nemico: clic (desktop) sul nemico dalla lista
  var en = p.locator('#enemies .en, #enemies > div > div').first();
  await p.evaluate(function () { var e = TLN.engine.state.aliveEnemies(TLN.ui.st.G)[0]; TLN.ui.st.selectedEnemy = e.id; TLN.ui.refresh(); }); await sleep(400); await shot('scheda_nemico');
  // 6) DOM e risorse
  console.log('DOM:', JSON.stringify(await p.evaluate(function () { return { nodi: document.getElementsByTagName('*').length, fx: document.getElementById('fx-layer').children.length, labels: document.getElementById('cell-labels').children.length }; })));
  // 7) verticale
  if (PHONE) { await p.setViewportSize({ width: 390, height: 844 }); await sleep(600); await shot('verticale'); console.log('Avviso rotazione visibile:', await p.evaluate(function () { return getComputedStyle(document.getElementById('rotate-hint')).display; })); }
  console.log('ERRORI', JSON.stringify(errs));
  await b.close();
})().catch(function (e) { console.error('CRASH', e); process.exit(1); });
