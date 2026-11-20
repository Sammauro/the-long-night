// Riproduce nel browser, con clic o tocchi veri, un piano di comandi prodotto da twin_plan.js.
// Uso: node tools/tests/ui_replay.js <piano.json> <cartellaSchermate> [--style=b|c] [--phone] [--maxroom=3] [--tag=nome] [--base=http://127.0.0.1:8765]
// Serve un server statico sulla radice del repo. Non modifica il codice di gioco.
var fs = require('fs'), path = require('path');
var playwright = require(path.join(__dirname, '..', '..', 'node_modules', 'playwright'));

var args = process.argv.slice(2);
var planFile = args[0], OUT = args[1];
var opt = {};
args.slice(2).forEach(function (a) { var m = /^--([^=]+)(?:=(.*))?$/.exec(a); if (m) opt[m[1]] = m[2] === undefined ? true : m[2]; });
var STYLE = opt.style || '', PHONE = !!opt.phone, MAXROOM = +(opt.maxroom || 3), TAG = opt.tag || ((STYLE || 'base') + (PHONE ? '_phone' : '_desk'));
var BASE = opt.base || 'http://127.0.0.1:8765/index.html';
var plan = JSON.parse(fs.readFileSync(planFile, 'utf8'));
fs.mkdirSync(OUT, { recursive: true });

var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
var issues = [], consoleErrs = [], shots = 0, seenKinds = {};

(async function () {
  var browser = await playwright.chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  var ctx = await browser.newContext(PHONE ? { viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true } : { viewport: { width: 1440, height: 900 } });
  var page = await ctx.newPage();
  page.on('pageerror', function (e) { consoleErrs.push('pageerror: ' + e); });
  page.on('console', function (m) { if (m.type() === 'error' || (m.type() === 'warning' && !/GL Driver|CONTEXT_LOST/.test(m.text()))) consoleErrs.push(m.type() + ': ' + m.text()); });

  function issue(msg) { issues.push(msg); console.log('  !! ' + msg); }
  async function shot(name) { shots++; await page.screenshot({ path: path.join(OUT, TAG + '_' + name + '.png') }); }
  async function shotOnce(kind, name) { if (seenKinds[kind]) return; seenKinds[kind] = 1; await shot(name); }

  async function press(loc) { if (PHONE) await loc.tap({ timeout: 6000 }); else await loc.click({ timeout: 6000 }); }
  async function pressXY(x, y) { if (PHONE) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y); }
  async function idle() {
    try { await page.waitForFunction(function () { return !TLN.ui.st.busy; }, null, { timeout: 25000 }); } catch (e) { issue('busy bloccato oltre 25 s'); }
  }
  async function fp() {
    return page.evaluate(function () {
      var r = TLN.ui.st.run, g = r.game;
      return g ? { t: g.turn, ph: g.phase, cur: g.res ? g.res.cursor : -1, act: g.res ? !!g.res.active : false, hp: g.player.hp, pt: g.player.pt, pos: g.player.pos.join(), eh: g.enemies.map(function (e) { return e.alive ? e.hp : 0; }).join(), ri: r.roomIndex, rp: r.phase } : { rp: r.phase };
    });
  }
  function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

  async function cellXY(cell) {
    return page.evaluate(function (c) {
      var R = TLN.render, hx = R.hexes.pickables().filter(function (m) { return m.userData.cell[0] === c[0] && m.userData.cell[1] === c[1]; })[0];
      var s;
      if (hx) { hx.updateMatrixWorld(true); var b = new THREE.Box3().setFromObject(hx), cx = (b.min.x + b.max.x) / 2, cz = (b.min.z + b.max.z) / 2; s = R.scene.toScreen(cx, b.max.y, cz); }
      else s = R.scene.cellToScreen(c, 0.4);
      var best = s, ok = false, k, dx, dy;
      var tryP = function (x, y) { var p = R.scene.pick(x, y); return p && p[0] === c[0] && p[1] === c[1]; };
      if (tryP(s.x, s.y)) ok = true;
      else for (k = 2; k <= 24 && !ok; k += 2) for (dx = -k; dx <= k && !ok; dx += k) for (dy = -k; dy <= k && !ok; dy += k) if (tryP(s.x + dx, s.y + dy)) { best = { x: s.x + dx, y: s.y + dy }; ok = true; }
      var el = document.elementFromPoint(best.x, best.y);
      return { x: best.x, y: best.y, ok: ok, top: el ? (el.id || el.className || el.tagName) : null };
    }, cell);
  }
  async function clickCell(cell, what) {
    var p = await cellXY(cell);
    if (!p.ok) issue('Casella ' + what + ' [' + cell + '] non raggiungibile con pick() vicino al centro (' + Math.round(p.x) + ',' + Math.round(p.y) + ')');
    if (p.top && !/^(gc|cell-labels|fx-layer|vignette|cl)/.test(String(p.top))) issue('Casella ' + what + ' [' + cell + '] coperta da "' + p.top + '" (' + Math.round(p.x) + ',' + Math.round(p.y) + ')');
    await pressXY(p.x, p.y);
  }
  async function modalOn() { return page.evaluate(function () { return document.getElementById('modal').classList.contains('on'); }); }
  async function handleModal(re) {
    await sleep(120);
    for (var k = 0; k < 3 && await modalOn(); k++) {
      var btns = page.locator('#modal button'), n = await btns.count(), pick = -1, texts = [];
      for (var i = 0; i < n; i++) { var t = (await btns.nth(i).innerText()).trim(); texts.push(t); if (re && re.test(t) && pick < 0) pick = i; }
      if (pick < 0) { for (i = 0; i < n; i++) if (/^Sì/.test(texts[i])) pick = i; }
      if (pick < 0) { issue('Finestra inattesa: ' + texts.join(' | ')); pick = 0; }
      await shotOnce('modal:' + texts.join('|').slice(0, 30), 'modale_' + shots);
      await press(btns.nth(pick)); await sleep(200);
    }
  }
  async function btn(sel, re) {
    var loc = page.locator(sel, { hasText: re });
    var n = await loc.count();
    if (!n) throw new Error('pulsante non trovato: ' + sel + ' ' + re);
    await press(loc.first());
  }
  async function modeInfo() { return page.evaluate(function () { var m = TLN.ui.st.mode; return m ? { kind: m.kind, step: m.step, free: m.free } : null; }); }
  async function cellOfUnit(id) { return page.evaluate(function (i) { var u = TLN.engine.state.unitById(TLN.ui.st.G, i); return u ? u.pos : null; }, id); }
  async function handIndex(uid) { return page.evaluate(function (u) { return TLN.ui.st.G.hand.map(function (h) { return h.uid; }).indexOf(u); }, uid); }
  async function clickDie(uid) { await press(page.locator('#seq .die[data-uid="' + uid + '"]')); }

  async function doCmd(c) {
    switch (c.type) {
      case 'SEL_TOGGLE': await clickDie(c.die); break;
      case 'SEL_CONFIRM': await btn('#controls button', /Conferma/); break;
      case 'ECO_DISCARD': {
        var i = await handIndex(c.card); await press(page.locator('#hand .card').nth(i)); await sleep(100);
        var m = await modeInfo();
        if (m && m.kind === 'ecoRotate') { await shotOnce('eco-rotate', 'eco_rotate'); await press(page.locator('.pl-card[data-pid="' + c.rotate + '"]')); }
        break;
      }
      case 'ECO_DONE': await shotOnce('eco-done', 'fine_turno_scelta'); await btn('#controls button.main', /Scarta e prosegui|Prosegui senza scartare/); break;
      case 'OPEN_CARD': { var j = await handIndex(c.card); await press(page.locator('#hand .card').nth(j)); break; }
      case 'USE_ACTION': await useAction(c); break;
      case 'CLOSE_CARD': {
        await shotOnce('close-card', 'carta_aperta');
        await press(page.locator('#open-card button', { hasText: /Chiudi carta/ })); await sleep(150);
        if (await modalOn()) {
          var n = await page.evaluate(function () { var o = TLN.ui.st.G.res.open; return o ? o.hpDamage : 0; });
          var want = c.reward ? c.reward.pm : 0, idx = n - want;
          var bs = page.locator('#modal .mopts button'); await press(bs.nth(Math.max(0, idx)));
        }
        break;
      }
      case 'CANCEL_CARD': await press(page.locator('#open-card button', { hasText: /Rimetti/ })); break;
      case 'FREE_CARD': await freeCard(c); break;
      case 'MOVE': await clickCell(c.to, 'di movimento'); break;
      case 'UNDO_MOVE': await btn('#controls button', /Annulla movimento/); break;
      case 'MANEUVER':
        if (c.kind === 'tactical') await btn('#controls .man button', /Movimento Tattico/);
        else if (c.kind === 'ranged') { await btn('#controls .man button', /Colpo a Distanza/); await sleep(100); await clickCell(await cellOfUnit(c.target), 'bersaglio a distanza'); }
        else await btn('#controls .man button', c.to === 'forza' ? /🔮 → ✊/ : /🔮 → 🔥/);
        await handleModal(); break;
      case 'ADVANCE': await btn('#controls .nav button.main', /./); await handleModal(/^Sì/); break;
      case 'SOGLIA_CHOOSE':
        await shotOnce('soglia', 'soglia_' + (await page.evaluate(function () { return TLN.ui.st.run.roomIndex; })));
        for (var r = 0; r < c.rests.length; r++) { await press(page.locator('.rest[data-id="' + c.rests[r] + '"]')); await sleep(80); }
        await btn('.soglia button.main', /Attraversa/); break;
      default: throw new Error('comando non mappato ' + c.type);
    }
  }

  async function useAction(c) {
    if (c.pay) {
      var cb = page.locator('#open-card .amp input');
      if (await cb.count()) { var checked = await cb.isChecked(); if (checked !== (c.pay === 'fuoco')) await press(cb); }
    }
    var info = await page.evaluate(function (a) { var o = TLN.ui.st.G.res.open, ac = o.def.actions[a]; return { kind: ac.kind, target: !!ac.target, push: !!ac.push }; }, c.action);
    var b = page.locator('#open-card .act-btn').nth(c.action);
    await shotOnce('act:' + c.action, 'carta_azione_' + shots);
    await press(b); await sleep(150);
    var m = await modeInfo();
    if (!m) return;
    await shotOnce('mode:' + m.step, 'puntamento_' + m.step);
    if (m.step === 'cone') {
      var cell = await page.evaluate(function (d) { var g = TLN.ui.st.G; var all = []; for (var k = 0; k < 6; k++) all.push(g.grid.cone(g.player.pos, k, 3).map(function (c) { return c.join(); })); var cs = g.grid.cone(g.player.pos, d, 3); var ex = cs.filter(function (c) { return all.filter(function (a, k) { return k !== d && a.indexOf(c.join()) >= 0; }).length === 0; }); var pool = ex.length ? ex : cs; return pool[pool.length - 1]; }, c.dir);
      await clickCell(cell, 'cono'); if (PHONE) { await sleep(150); await clickCell(cell, 'cono (conferma)'); }
      return;
    }
    var tp = await cellOfUnit(c.target);
    if (!tp) { issue('USE_ACTION senza bersaglio noto in modalità ' + m.step); return; }
    await clickCell(tp, 'nemico ' + c.target); await sleep(150);
    m = await modeInfo();
    if (m && m.step === 'push') {
      await shotOnce('mode:push', 'puntamento_push'); await clickCell(c.push, 'spinta'); await sleep(250); await idle();
      var m2 = await modeInfo();
      if (m2) { var wall = await page.evaluate(function (p) { return !TLN.ui.st.G.grid.inGrid(p); }, c.push); issue('Spinta verso [' + c.push + ']: il clic non ha scelto la casella' + (wall ? ' (è il MURO, fuori griglia: non esiste una casella da toccare)' : '') + '; ripiego via bus'); await shot('push_bloccata_' + shots); await page.evaluate(function (cc) { TLN.ui.st.mode = null; return TLN.ui.send(cc); }, c); await idle(); }
      return;
    }
    if (m && m.step === 'path') {
      for (var i = 0; i < c.path.length; i++) { await clickCell(c.path[i], 'percorso Distorsione'); await sleep(100); }
      await shotOnce('mode:path2', 'distorsione_percorso');
      await btn('#modebar button', /Conferma/); await handleModal(); return;
    }
    if (await modalOn()) await handleModal(new RegExp('^' + c.x + ' 🔮'));
  }

  async function freeCard(c) {
    var j = await handIndex(c.card); await press(page.locator('#hand .card').nth(j)); await sleep(150);
    var m = await modeInfo();
    if (!m) { issue('FREE_CARD: nessuna modalità dopo il clic sulla carta'); return; }
    await shotOnce('free:' + m.free, 'carta_gratuita_' + m.free);
    if (m.free === 'infuse') { await clickDie(c.die); return; }
    if (m.free === 'fate') { await clickDie(c.die); await sleep(150); await handleModal(new RegExp('^' + c.face + '$')); await handleModal(); return; }
    if (m.free === 'charge') {
      await clickDie(c.dice[0]); await sleep(80); await clickDie(c.dice[1]); await sleep(120);
      var cell = await page.evaluate(function (a) { var g = TLN.ui.st.G, F = TLN.engine.freeCards; var sum = TLN.engine.dice.impulses(F.seqDie(g, a.dice[0])) + TLN.engine.dice.impulses(F.seqDie(g, a.dice[1])); return F.chargeLine(g, a.dir, sum)[a.dist - 1]; }, c);
      await clickCell(cell, 'arrivo Carica');
      await handleModal(); return;
    }
  }

  // ── avvio ──
  var url = BASE + '?seed=' + plan.seed + (STYLE ? '&style=' + STYLE : '');
  console.log('[' + TAG + '] ' + url);
  await page.goto(url); await sleep(2500);
  await shot('00_menu');
  await press(page.getByText(/Salta il tutorial/i).first()); await sleep(2500);
  await shot('01_inizio_r1');

  var cmds = plan.cmds, i = 0, t0 = Date.now(), lastRoom = 'r1', turnsByRoom = {}, fallbacks = 0, stop = false;
  var roomsDone = 0;
  var probe = opt.probe ? require(path.resolve(opt.probe)) : null;
  while (i < cmds.length && !stop) {
    if (opt.stopat && i === +opt.stopat) { await idle(); await sleep(300); if (probe) await probe(page, { press: press, pressXY: pressXY, clickCell: clickCell, cellXY: cellXY, shot: shot, sleep: sleep, doCmd: doCmd, cmds: cmds, i: i, idle: idle, issue: issue, PHONE: PHONE }); break; }
    var c = cmds[i], prev = i ? cmds[i - 1].fp : null;
    await idle(); await sleep(60);
    // il motore dell'interfaccia può aver già eseguito degli ADVANCE da solo (continua da solo): salta quelli già fatti
    if (c.c.type === 'ADVANCE') {
      var skipped = false, t1 = Date.now();
      while (Date.now() - t1 < 1000 && !skipped) {
        var f = await fp(), j = i;
        while (j < cmds.length && cmds[j].c.type === 'ADVANCE') { if (same(f, cmds[j].fp)) { skipped = true; i = j + 1; break; } j++; }
        if (!skipped) await sleep(150);
      }
      if (skipped) continue;
    }
    if (prev) {
      var cur = await fp();
      if (!same(cur, prev) && !(c.c.type === 'ADVANCE')) {
        await sleep(500); cur = await fp(); await idle();
        if (!same(cur, prev)) { issue('Stato del browser diverso dal piano prima di ' + JSON.stringify(c.c) + ': browser ' + JSON.stringify(cur) + ' atteso ' + JSON.stringify(prev)); await shot('divergenza_' + i); stop = true; break; }
      }
    }
    var ok = false, attempt = 0;
    while (!ok && attempt < 3) {
      attempt++;
      try { await doCmd(c.c); await idle(); await sleep(80); ok = true; }
      catch (e) { issue('Comando ' + JSON.stringify(c.c) + ' non eseguibile col clic (tentativo ' + attempt + '): ' + String(e.message).split('\n')[0]); await shot('errore_cmd_' + i + '_' + attempt); await idle(); await page.keyboard.press('Escape'); await sleep(200); }
    }
    if (!ok) { // ripiego: lo stesso comando passando dal bus, segnato come ripiego
      fallbacks++;
      issue('RIPIEGO via UI.send per ' + JSON.stringify(c.c));
      await page.evaluate(function (cc) { return TLN.ui.send(cc); }, c.c); await idle();
    }
    if (c.c.type !== 'ADVANCE' && c.c.type !== 'ECO_DISCARD') {
      await sleep(60);
      var after = await fp();
      var stable = function (a, b) { return ['t', 'hp', 'pt', 'pos', 'eh', 'ri', 'rp'].every(function (k) { return a[k] === b[k]; }); };
      if (!stable(after, c.fp) && ['SEL_TOGGLE', 'SEL_CONFIRM', 'ECO_DONE'].indexOf(c.c.type) < 0) {
        await sleep(700); await idle(); after = await fp();
        if (!stable(after, c.fp)) { issue('DIVERGENZA dopo ' + JSON.stringify(c.c) + ': browser ' + JSON.stringify(after) + ' piano ' + JSON.stringify(c.fp)); await shot('divergenza_' + i); stop = true; }
      }
    }
    // schermate di fase
    if (c.c.type === 'SEL_CONFIRM') { await sleep(500); await shotOnce('res-' + c.room + '-' + c.fp.t, 'risoluzione_' + c.room + '_t' + c.fp.t); }
    if (c.c.type === 'SEL_TOGGLE' && !seenKinds['sel-' + c.room]) { seenKinds['sel-' + c.room] = 1; await shot('selezione_' + c.room + '_t' + c.fp.t); }
    i++;
    // la stanza è finita?
    var nx = cmds[i];
    if (nx && nx.room !== c.room && c.c.type !== 'SOGLIA_CHOOSE') { /* passaggio di stanza gestito dalla Soglia */ }
    if (c.c.type === 'SOGLIA_CHOOSE') { await sleep(1500); await shot('inizio_' + (nx ? nx.room : 'fine')); roomsDone++; if (roomsDone >= MAXROOM) stop = true; }
    if (i % 10 === 0) { try { var mm = await page.evaluate(function () { var c = TLN.render.scene.ctx, m = c.renderer.info.memory, r = c.renderer.info.render; return { geo: m.geometries, tex: m.textures, calls: r.calls, heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null, fps: Math.round(c.fps), dom: document.getElementsByTagName('*').length }; }); console.log('  mem', JSON.stringify(mm)); } catch (e) { console.log('  mem n/d'); } }
    if (i % 40 === 0) console.log('  comando ' + i + '/' + cmds.length + ' stanza ' + c.room + ' turno ' + c.fp.t + ' (' + Math.round((Date.now() - t0) / 1000) + ' s)');
  }
  try { await page.waitForFunction(function () { return document.getElementById('screens').classList.contains('on'); }, null, { timeout: 8000 }); } catch (e) { issue('schermata finale non comparsa entro 8 s'); }
  await sleep(800);
  await shot('99_fine');
  var final = await page.evaluate(function () { var r = TLN.ui.st.run; return { phase: r.phase, result: r.result, seed: r.seed, history: r.history.map(function (h) { return { room: h.room, result: h.result, turns: h.turns }; }), screenText: (document.getElementById('screens').innerText || '').slice(0, 400) }; });
  console.log('FINE', JSON.stringify(final));
  var out = { tag: TAG, seed: plan.seed, style: STYLE || 'base', phone: PHONE, final: final, issues: issues, fallbacks: fallbacks, consoleErrs: consoleErrs, seconds: Math.round((Date.now() - t0) / 1000), planResult: plan.result, planHistory: plan.history };
  fs.writeFileSync(path.join(OUT, TAG + '_esito.json'), JSON.stringify(out, null, 1));
  console.log('ISSUES', issues.length, 'ERRORI CONSOLE', consoleErrs.length, 'RIPIEGHI', fallbacks);
  await browser.close();
})().catch(function (e) { console.error('CRASH', e); process.exit(1); });
