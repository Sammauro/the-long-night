// Sonda: la spinta contro il muro (Collisione) si può scegliere con un clic? Uso: ui_replay.js piano.json out --stopat=189 --probe=tools/tests/probe_wall_push.js
module.exports = async function (page, h) {
  var c = h.cmds[h.i].c;
  console.log('SONDA comando', JSON.stringify(c));
  await h.press(page.locator('#open-card .act-btn').nth(c.action)); await h.sleep(200);
  var tp = await page.evaluate(function (id) { return TLN.engine.state.unitById(TLN.ui.st.G, id).pos; }, c.target);
  await h.clickCell(tp, 'nemico'); await h.sleep(300);
  var info = await page.evaluate(function () {
    var m = TLN.ui.st.mode, g = TLN.ui.st.G, o = TLN.engine.combat.pushOptions(g, g.player.pos, TLN.engine.state.unitById(g, m.target));
    return { step: m.step, opts: o.map(function (x) { return { cell: x.cell, status: x.status, inGrid: g.grid.inGrid(x.cell) }; }) };
  });
  console.log('OPZIONI SPINTA', JSON.stringify(info));
  await h.shot('sonda_spinta_opzioni');
  var wall = info.opts.filter(function (o) { return o.status === 'wall'; })[0];
  if (!wall) { console.log('nessuna opzione muro in questo stato'); return; }
  // il muro si sceglie con il pulsante nella barra del modo (clic o tocco veri)
  var btnN = await page.locator('#modebar .wall-push').count();
  console.log('Pulsanti "Collisione col muro":', btnN);
  if (!btnN) throw new Error('BUG-1: nessun pulsante per la Collisione col muro');
  var hp0 = await page.evaluate(function () { return TLN.ui.st.G.enemies.map(function (e) { return e.hp; }); });
  await h.shot('sonda_spinta_pulsante');
  await h.press(page.locator('#modebar .wall-push').first()); await h.sleep(600);
  var after = await page.evaluate(function () { var m = TLN.ui.st.mode; return { mode: m ? m.step : null, hp: TLN.ui.st.G.enemies.map(function (e) { return e.hp; }) }; });
  console.log('Dopo il clic sul pulsante:', JSON.stringify(after), 'HP prima', JSON.stringify(hp0));
  await h.shot('sonda_spinta_dopo_clic');
  if (after.mode) throw new Error('BUG-1: la spinta non e stata eseguita'); 
};
