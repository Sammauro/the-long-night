// M2 — partite casuali per stanza, invarianti a ogni passo, determinismo (BRIEF 11, M2)
var makeAgent = require('./agent');
var invariants = require('./invariants');

function playRun(TLN, seed, opts, log) {
  var E = TLN.engine;
  var bus = E.createEventBus();
  if (log) bus.onAny(function (ev) { log.push(ev.type + JSON.stringify(ev.data)); });
  var run = E.run.createRun({ seed: seed, start: opts.start, only: opts.only, noScript: opts.noScript, bus: bus });
  var agent = makeAgent(TLN, seed ^ 0x5bd1e995, opts.weighted);
  var steps = 0, problems = [];
  while (run.phase !== 'END' && steps < 20000) {
    if (run.game && run.game.turn > 60) { problems.push('oltre 60 turni'); break; }
    var cmd = agent.choose(run);
    if (!cmd) { problems.push('nessuna mossa legale in fase ' + run.game.phase); break; }
    var r = E.run.execute(run, cmd);
    if (!r.ok) { problems.push('mossa legale rifiutata: ' + JSON.stringify(cmd) + ' → ' + r.error); break; }
    steps++;
    if (run.phase === 'COMBAT' || run.phase === 'END') {
      var errs = invariants(TLN, run.game);
      if (errs.length) { problems.push('passo ' + steps + ' ' + cmd.type + ': ' + errs.join('; ')); break; }
    }
  }
  return { run: run, steps: steps, problems: problems };
}

module.exports = function (TLN, check, section, opts) {
  var games = opts.games || 300;
  ['r0', 'r1', 'r2', 'r3'].forEach(function (room) {
    section('Partite casuali ' + room + ' × ' + games);
    var res = { win: 0, death: 0, madness: 0, turns: 0, errors: 0 };
    for (var i = 0; i < games; i++) {
      var seed = 1000 + i * 7919;
      var out;
      try { out = playRun(TLN, seed, { start: room, only: true, noScript: true }); }
      catch (e) { res.errors++; check(false, room + ' seed ' + seed + ': eccezione ' + e.stack.split('\n').slice(0, 3).join(' | ')); continue; }
      out.problems.forEach(function (p) { check(false, room + ' seed ' + seed + ': ' + p); });
      if (!out.problems.length) check(true, '');
      var h = out.run.history[out.run.history.length - 1];
      if (h) { res[h.result === 'win' ? 'win' : h.result]++; res.turns += h.turns; }
    }
    console.log('   vittorie ' + res.win + ' · morte ' + res.death + ' · follia ' + res.madness + ' · turni medi ' + (res.turns / games).toFixed(1));
  });

  section('Run completa casuale (Stanza 0 → 3) × 50');
  var full = { victory: 0, other: 0, maxRoom: 0 };
  for (var j = 0; j < 50; j++) {
    var o = playRun(TLN, 777 + j * 31, { start: 'r0' });
    o.problems.forEach(function (p) { check(false, 'run seed ' + (777 + j * 31) + ': ' + p); });
    if (o.run.result === 'victory') full.victory++; else full.other++;
    full.maxRoom = Math.max(full.maxRoom, o.run.roomIndex);
  }
  console.log('   run vinte ' + full.victory + '/50 · stanza più lontana raggiunta: indice ' + full.maxRoom);

  section('Esplorazione con giocatore pesato');
  var seenEv = {};
  [['r0', false], ['r1', true], ['r2', true], ['r3', true], ['r1', false]].forEach(function (cfg) {
    var wins = 0, N = 150;
    for (var k = 0; k < N; k++) {
      var lg = [], sd = 5000 + k * 13;
      var ow = playRun(TLN, sd, { start: cfg[0], only: cfg[1], weighted: true }, lg);
      ow.problems.forEach(function (p) { check(false, 'pesato ' + cfg[0] + ' seed ' + sd + ': ' + p); });
      lg.forEach(function (l) { seenEv[l.split('{')[0]] = 1; });
      if (ow.run.history.some(function (h) { return h.result === 'win'; })) wins++;
    }
    console.log('   ' + cfg[0] + (cfg[1] ? ' (sola)' : ' (run)') + ': almeno una stanza vinta in ' + wins + '/' + N);
  });
  var mustSee = ['TRAP', 'COLLISION', 'DIE_OFF', 'STUN_SKIP', 'ARMOR_ABSORB', 'BUIO', 'SOGLIA', 'SEAL', 'CHOIR', 'WHISPER', 'LIGHT_STOLEN', 'CONE', 'DIE_CHANGED', 'DIE_CONSUMED', 'ECO', 'HEAL', 'PLANCIA_FULL', 'RESHUFFLE', 'RUN_END'];
  mustSee.forEach(function (t) { check(!!seenEv[t], 'evento mai visto nell\'esplorazione: ' + t); });
  console.log('   eventi visti: ' + Object.keys(seenEv).length);

  section('Determinismo: stesso seed → stesso log');
  [11, 222, 3333].forEach(function (seed) {
    ['r1', 'r2', 'r3'].forEach(function (room) {
      var a = [], b = [];
      playRun(TLN, seed, { start: room, only: true, noScript: true }, a);
      playRun(TLN, seed, { start: room, only: true, noScript: true }, b);
      check(a.length > 0 && a.join('\n') === b.join('\n'), 'log diverso con seed ' + seed + ' in ' + room);
    });
  });
};
module.exports.playRun = playRun;
