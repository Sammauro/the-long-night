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
  // il giocatore vede l'etichetta "Collisione" nel punto dello schermo della casella-muro
  var xy = await page.evaluate(function (cell) { var s = TLN.render.scene.cellToScreen(cell, 0.4); return { x: s.x, y: s.y, pick: TLN.render.scene.pick(s.x, s.y) }; }, wall.cell);
  console.log('Etichetta Collisione a', JSON.stringify(xy));
  await h.pressXY(xy.x, xy.y); await h.sleep(400);
  var after = await page.evaluate(function () { var m = TLN.ui.st.mode; return m ? { step: m.step } : null; });
  console.log('Dopo il clic sull\'etichetta: modalita', JSON.stringify(after));
  await h.shot('sonda_spinta_dopo_clic');
  // provo anche a cliccare in una griglia di punti attorno
  var found = await page.evaluate(function (cell) { var out = []; for (var x = 300; x < 1200; x += 20) for (var y = 150; y < 600; y += 20) { var p = TLN.render.scene.pick(x, y); if (p && p[0] === cell[0] && p[1] === cell[1]) out.push([x, y]); } return out.length; }, wall.cell);
  console.log('Punti dello schermo che selezionano la casella-muro con pick():', found);
  var eng = await page.evaluate(function (cell) { var r = TLN.ui.targeting.onCell(cell); var m = TLN.ui.st.mode; return { modeAfterDirectCall: m ? m.step : null, hp: TLN.ui.st.G.enemies.map(function (e) { return e.hp; }) }; }, wall.cell);
  console.log('Chiamata diretta onCell sulla casella-muro (solo per verifica):', JSON.stringify(eng));
};
