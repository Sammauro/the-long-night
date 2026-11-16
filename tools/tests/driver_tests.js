// M6 — il driver del tutorial lascia passare solo il comando atteso e avanza fino alla Soglia
var path = require('path'), fs = require('fs'), vm = require('vm');
module.exports = function (TLN, check, section) {
  var root = path.join(__dirname, '..', '..');
  ['src/input/command_bus.js', 'src/input/tutorial_driver.js'].forEach(function (f) {
    if (!TLN.input || !TLN.input.createTutorialDriver) vm.runInThisContext('(function(globalThis){' + fs.readFileSync(path.join(root, f), 'utf8') + '})')({ TLN: TLN });
  });
  if (!TLN.input.createCommandBus) vm.runInThisContext('(function(globalThis){' + fs.readFileSync(path.join(root, 'src/input/command_bus.js'), 'utf8') + '})')({ TLN: TLN });
  var E = TLN.engine, S = E.state, T = TLN.data.tutorialScript;
  section('Driver del tutorial');
  var run = E.run.createRun({ seed: 5, start: 'r0' }), G = run.game;
  var bus = TLN.input.createCommandBus();
  ['SEL_TOGGLE', 'SEL_CONFIRM', 'INSPECT_DIE', 'ECO_DISCARD', 'ECO_DONE', 'OPEN_CARD', 'USE_ACTION', 'CLOSE_CARD', 'CANCEL_CARD', 'FREE_CARD', 'MOVE', 'UNDO_MOVE', 'MANEUVER', 'ADVANCE', 'SOGLIA_CHOOSE']
    .forEach(function (t) { bus.register(t, function (c) { return E.run.execute(run, c); }); });
  var drv = TLN.input.createTutorialDriver(run, bus, T);
  function ex(c) { return bus.execute(c); }
  function die(tok, n) { var p = tok.split(':'); return G.seq.filter(function (d) { return d.kind === p[0] && d.value === +p[1]; })[n || 0].uid; }
  function card(id) { return G.hand.filter(function (h) { return h.id === id; })[0].uid; }
  check(!ex({ type: 'SEL_CONFIRM' }).ok, 'passo 1: la conferma è bloccata');
  ex({ type: 'INSPECT_DIE', die: G.seq.filter(function (d) { return d.kind === 'ai'; })[0].uid });
  check(drv.step().id === 2, 'toccare un teschio porta al passo 2');
  ['vigore:2', 'vigore:1', 'fuoco:2'].forEach(function (t) { ex({ type: 'SEL_TOGGLE', die: die(t) }); });
  check(drv.step().id === 3, 'tenuti i tre dadi: passo 3');
  ex({ type: 'SEL_CONFIRM' }); ex({ type: 'ADVANCE' });
  check(!ex({ type: 'MOVE', to: [2, 3] }).ok, 'passo 4: movimento in un\'altra casella bloccato');
  ex({ type: 'MOVE', to: [2, 4] });
  ex({ type: 'OPEN_CARD', card: card('ab') });
  ex({ type: 'USE_ACTION', action: 0, target: 'Z1' }); ex({ type: 'USE_ACTION', action: 1, target: 'Z1' }); ex({ type: 'USE_ACTION', action: 1, target: 'Z1' });
  check(drv.step().id === 6, 'Z1 caduto: passo 6');
  for (var i = 0; i < 4 && drv.step().id === 6; i++) ex({ type: 'ADVANCE' });
  ex({ type: 'MANEUVER', kind: 'ranged', target: 'Z2' }); ex({ type: 'MANEUVER', kind: 'ranged', target: 'Z2' });
  for (i = 0; i < 4 && !(G.res.active && G.seq[G.res.cursor].kind === 'vigore'); i++) ex({ type: 'ADVANCE' });
  ex({ type: 'OPEN_CARD', card: card('pa') }); ex({ type: 'USE_ACTION', action: 0 });
  for (i = 0; i < 6 && G.phase !== 'FINE_TURNO'; i++) ex({ type: 'ADVANCE' });
  check(drv.step().id === 10, 'fine turno 1: passo 10 (' + drv.step().id + ')');
  check(!ex({ type: 'ECO_DISCARD', card: card('ds') }).ok, 'passo 10: scartare un\'altra carta è bloccato');
  ex({ type: 'ECO_DISCARD', card: card('sc') }); ex({ type: 'ECO_DONE' });
  check(!ex({ type: 'SEL_CONFIRM' }).ok, 'passo 11: conferma bloccata finché i dadi non sono quelli indicati');
  ['vigore:3', 'vigore:1', 'fuoco:2'].forEach(function (t) { ex({ type: 'SEL_TOGGLE', die: die(t) }); });
  ex({ type: 'SEL_CONFIRM' }); ex({ type: 'ADVANCE' });
  ex({ type: 'OPEN_CARD', card: card('ds') });
  check(!ex({ type: 'USE_ACTION', action: 0, target: 'Z2', push: [4, 4] }).ok, 'passo 12: spinta nella casella sbagliata bloccata');
  ex({ type: 'USE_ACTION', action: 0, target: 'Z2', push: [4, 5] }); ex({ type: 'USE_ACTION', action: 0, target: 'Z2', push: [4, 5] });
  ex({ type: 'CLOSE_CARD' });
  for (i = 0; i < 12 && G.phase !== 'SELEZIONE'; i++) { if (G.phase === 'FINE_TURNO') ex({ type: 'ECO_DONE' }); else ex({ type: 'ADVANCE' }); }
  check(drv.step().id === 14 && G.turn === 3, 'turno 3 in Selezione: passo 14');
  ex({ type: 'SEL_TOGGLE', die: die('vigore:2', 0) });
  check(!ex({ type: 'SEL_CONFIRM' }).ok, 'passo 14: serve tenere entrambi i ✊');
  ex({ type: 'SEL_TOGGLE', die: die('vigore:2', 1) }); ex({ type: 'SEL_CONFIRM' });
  check(drv.step().id === 15, 'passo 15: gioco libero');
  S.aliveEnemies(G).forEach(function (e) { E.combat.damage(G, e, 99, { direct: true }); });
  E.run.sync(run); drv.check();
  check(run.phase === 'SOGLIA' && drv.step().id === 16, 'stanza vinta: passo 16 alla Soglia');
  ex({ type: 'SOGLIA_CHOOSE', rests: ['bendarsi'] });
  check(!drv.active && run.game.room.id === 'r1', 'dopo la Soglia il tutorial è finito e si entra nella Cripta');
};
