// M2 — casi mirati (BRIEF 11, M2)
var H = require('./helpers');

module.exports = function (TLN, check, section) {
  var E = TLN.engine, S = E.state;
  function ex(G, c) { var r = E.execute(G, c); if (!r.ok) console.log('    (rifiutato ' + c.type + ': ' + r.error + ')'); return r; }
  function hpOf(G, id) { return S.unitById(G, id).hp; }

  section('Collisione: colonna, bordo, unità');
  var G = H.custom(TLN, { player: [2, 4], enemies: [{ type: 'zombie', at: [3, 4] }], terrain: [{ type: 'column', at: [4, 5] }], pool: { forza: 3 } });
  var ds = H.give(TLN, G, 'ds');
  ex(G, { type: 'OPEN_CARD', card: ds });
  ex(G, { type: 'USE_ACTION', action: 0, target: 'Z1', push: [4, 5] });
  check(hpOf(G, 'Z1') === 4 && G.ofType('COLLISION').length === 1, 'colonna: Z1 a ' + hpOf(G, 'Z1') + ' HP, atteso 4');
  check(E.hex.same(S.unitById(G, 'Z1').pos, [3, 4]), 'colonna: il bersaglio resta dov\'è');

  G = H.custom(TLN, { player: [2, 1], enemies: [{ type: 'zombie', at: [2, 2] }], pool: { forza: 2 } });
  var ds2 = H.give(TLN, G, 'ds');
  ex(G, { type: 'OPEN_CARD', card: ds2 });
  var wall = E.combat.pushOptions(G, G.player.pos, S.unitById(G, 'Z1')).filter(function (o) { return o.status === 'wall'; });
  check(wall.length === 0, 'in (2,2) spinto da (2,1) nessuna casella è fuori griglia');
  G = H.custom(TLN, { player: [2, 5], enemies: [{ type: 'zombie', at: [2, 6] }], pool: { forza: 2 } });
  ex(G, { type: 'OPEN_CARD', card: H.give(TLN, G, 'ds') });
  var opts = E.combat.pushOptions(G, G.player.pos, S.unitById(G, 'Z1'));
  var w = opts.filter(function (o) { return o.status === 'wall'; })[0];
  check(!!w, 'bordo: esiste una casella di spinta fuori griglia');
  ex(G, { type: 'USE_ACTION', action: 0, target: 'Z1', push: w.cell });
  check(hpOf(G, 'Z1') === 4, 'bordo (D7): Collisione, Z1 a ' + hpOf(G, 'Z1'));

  G = H.custom(TLN, { player: [2, 4], enemies: [{ type: 'zombie', at: [3, 4] }, { type: 'zombie', at: [4, 4] }], pool: { forza: 2 } });
  ex(G, { type: 'OPEN_CARD', card: H.give(TLN, G, 'ds') });
  ex(G, { type: 'USE_ACTION', action: 0, target: 'Z1', push: [4, 4] });
  check(hpOf(G, 'Z1') === 4 && hpOf(G, 'Z2') === 5, 'unità: Z1 ' + hpOf(G, 'Z1') + ' (4), Z2 ' + hpOf(G, 'Z2') + ' (5)');

  section('Braciere');
  G = H.custom(TLN, { player: [4, 3], enemies: [{ type: 'zombie', at: [4, 4] }], terrain: [{ type: 'brazier', at: [4, 5] }], pool: { forza: 1 } });
  ex(G, { type: 'OPEN_CARD', card: H.give(TLN, G, 'ds') });
  ex(G, { type: 'USE_ACTION', action: 0, target: 'Z1', push: [4, 5] });
  check(S.statusCount(S.unitById(G, 'Z1'), 'vulnFire') === 1, 'Collisione contro Braciere → Vulnerabilità Fuoco');

  section('Trappola: spinta e Distorsione');
  G = H.custom(TLN, { player: [4, 3], enemies: [{ type: 'zombie', at: [4, 4] }], terrain: [{ type: 'trap', at: [4, 5] }], pool: { forza: 1 } });
  ex(G, { type: 'OPEN_CARD', card: H.give(TLN, G, 'ds') });
  ex(G, { type: 'USE_ACTION', action: 0, target: 'Z1', push: [4, 5] });
  check(hpOf(G, 'Z1') === 2 && !S.hasTrap(G, [4, 5]), 'spinta su trappola: 1 + 3 Diretti, trappola rimossa (HP ' + hpOf(G, 'Z1') + ')');
  G = H.custom(TLN, { player: [1, 1], enemies: [{ type: 'sussurratore', at: [7, 2] }, { type: 'zombie', at: [8, 6] }], terrain: [{ type: 'trap', at: [5, 2] }], pool: { presagio: 3 } });
  ex(G, { type: 'OPEN_CARD', card: H.give(TLN, G, 'di') });
  var pt0 = G.player.pt;
  ex(G, { type: 'USE_ACTION', action: 0, target: 'S1', path: [[6, 2], [5, 2]] });
  check(!S.unitById(G, 'S1').alive && G.player.pt === pt0 - 1 && G.res.pool.presagio === 1, 'Distorsione su trappola: Sussurratore ucciso, 2 🔮 + 1 PT');

  section('Vulnerabilità prima degli Scudi; Danno Diretto');
  G = H.custom(TLN, { player: [2, 4], enemies: [{ type: 'zombie', at: [3, 4] }], pool: { forza: 1 } });
  var z = S.unitById(G, 'Z1');
  S.addStatus(G, z, 'vuln', 1); S.addStatus(G, z, 'shield', 1);
  E.combat.damage(G, z, 1, { source: G.player });
  check(z.hp === 5, 'Vuln ×2 poi Scudo: 1 → 2 − 1 = 1 agli HP (HP ' + z.hp + ')');
  S.addStatus(G, z, 'shield', 2);
  E.combat.damage(G, z, 2, { direct: true });
  check(z.hp === 3 && S.statusCount(z, 'shield') === 2, 'Danno Diretto ignora Scudi e Vulnerabilità');
  E.combat.damage(G, z, 1, { dtype: 'fire' });
  check(z.hp === 3, 'Vulnerabilità generica non vale per il Fuoco (assorbito dagli Scudi)');

  section('Contrattacco');
  G = H.custom(TLN, { player: [2, 4], enemies: [{ type: 'zombie', at: [3, 4] }] });
  S.addStatus(G, G.player, 'counter', 1);
  E.ai.act(G, S.unitById(G, 'Z1'), { actionId: 'orda', value: 1 });
  check(G.player.hp === 9 && hpOf(G, 'Z1') === 5, 'Contrattacco: Z1 subisce lo stesso danno (HP ' + hpOf(G, 'Z1') + ')');

  section('Dado IA spento');
  var run = E.run.createRun({ seed: 9, start: 'r1', only: true, noScript: true });
  G = run.game;
  while (G.phase === 'SELEZIONE') E.execute(G, { type: 'SEL_CONFIRM' });
  var aiIdx = G.seq.map(function (d) { return d.kind; }).indexOf('ai');
  var target = S.unitById(G, G.seq[aiIdx].owner);
  E.combat.damage(G, target, 99, { direct: true });
  for (var i = 0; i < 30 && G.res.cursor <= aiIdx; i++) E.execute(G, { type: 'ADVANCE' });
  check(G.seq[aiIdx].state === 'off', 'il dado del nemico morto si spegne (stato ' + G.seq[aiIdx].state + ')');

  section('Corazza');
  run = E.run.createRun({ seed: 3, start: 'r3', only: true, noScript: true });
  G = run.game;
  var cu = S.unitById(G, 'C1');
  check(S.statusCount(cu, 'shield') === 2, 'Custode a 2 Scudi dal turno 1');
  S.consumeStatus(cu, 'shield', 1);
  E.ai.applyArmor(G);
  check(S.statusCount(cu, 'shield') === 2, 'Corazza ricarica fino a 2');
  S.addStatus(G, cu, 'shield', 3);
  E.ai.applyArmor(G);
  check(S.statusCount(cu, 'shield') === 5, 'Corazza non toglie Scudi in eccesso');

  section('Sigillo');
  G = H.custom(TLN, { player: [1, 1], enemies: [{ type: 'custode', at: [6, 3] }] });
  G.player.luce = 2;
  E.ai.act(G, S.unitById(G, 'C1'), { actionId: 'sigillo', value: 3 });
  check(G.plancia.std.length === 1 && G.plancia.std[0].kind === 'seal' && G.plancia.std[0].cd === 1, 'Sigillo con Plancia libera: CD 1');
  E.ai.act(G, S.unitById(G, 'C1'), { actionId: 'sigillo', value: 3 });
  E.ai.act(G, S.unitById(G, 'C1'), { actionId: 'sigillo', value: 3 });
  E.ai.act(G, S.unitById(G, 'C1'), { actionId: 'sigillo', value: 3 });
  check(G.plancia.std.length === 3 && G.player.luce === 1, 'Sigillo con Plancia piena: −1 Luce');
  check(E.dice.coverage(G)[1] && E.dice.coverage(G)[2] && E.dice.coverage(G)[3], 'tre Sigilli coprono i tre slot standard');
  E.cards.cdRotation(G); E.cards.cdRotation(G);
  check(G.plancia.std.length === 0 && G.discard.length === 0, 'il Sigillo esce dopo due Rotazioni e non va negli scarti');

  section('Buio');
  run = E.run.createRun({ seed: 5, start: 'r1', only: true, noScript: true });
  G = run.game;
  G.turn = 6; var ptB = G.player.pt;
  E.turn.startTurn(G);
  check(G.player.pt === ptB - 1, 'turno 7 oltre Veglia 6: −1 PT');

  section('Tetto PT alla Soglia');
  run = E.run.createRun({ seed: 6, start: 'r1', noScript: true });
  run.game.player.pt = 9;
  S.aliveEnemies(run.game).forEach(function (e) { E.combat.damage(run.game, e, 99, { direct: true }); });
  E.run.execute(run, { type: 'ADVANCE' });
  check(run.phase === 'SOGLIA' && run.restsAllowed === 2, 'stanza chiusa entro la Veglia: 2 Soste');
  var r = E.run.execute(run, { type: 'SOGLIA_CHOOSE', rests: ['bendarsi'] });
  check(!r.ok, 'servono esattamente 2 Soste diverse');
  E.run.execute(run, { type: 'SOGLIA_CHOOSE', rests: ['bendarsi', 'lanterna'] });
  check(run.game.room.id === 'r2' && run.game.player.pt === 6 && run.game.player.luce === 2 && run.game.player.pm === 2, 'nuova stanza: PT 6 (tetto), Luce 2 (Lanterna), PM 2');

  require('./case_tests2')(TLN, check, section);
};
