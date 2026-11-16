// M2 — lo script del tutorial arriva agli stati attesi di BRIEF 9.1
module.exports = function (TLN, check, section) {
  var E = TLN.engine, S = E.state, T = TLN.data.tutorialScript, X = T.expect;
  var run = E.run.createRun({ seed: T.seed, start: 'r0' });
  var G = run.game, fail = [];
  function ex(c) { var r = E.run.execute(run, c); if (!r.ok) fail.push(c.type + ': ' + r.error); return r; }
  function keep(tokens) {
    var used = {};
    tokens.forEach(function (tok) {
      var p = tok.split(':');
      var d = G.seq.filter(function (x) { return x.kind === p[0] && x.value === +p[1] && !used[x.uid]; })[0];
      used[d.uid] = true;
      ex({ type: 'SEL_TOGGLE', die: d.uid });
    });
  }
  function card(id) { return G.hand.filter(function (h) { return h.id === id; })[0].uid; }

  section('Tutorial: turno 1');
  check(G.phase === 'SELEZIONE' && G.turn === 1, 'turno 1 in Selezione');
  check(G.hand.map(function (h) { return h.id; }).join() === T.openingHand.join(), 'mano iniziale ' + G.hand.map(function (h) { return h.id; }));
  check(G.seq.length === 8, 'Sequenza del turno 1 da 8 dadi');
  keep(['vigore:2', 'vigore:1', 'fuoco:2']);
  ex({ type: 'SEL_CONFIRM' });
  ex({ type: 'ADVANCE' });
  ex({ type: 'MOVE', to: [2, 4] });
  ex({ type: 'OPEN_CARD', card: card('ab') });
  ex({ type: 'USE_ACTION', action: 0, target: 'Z1' });
  ex({ type: 'USE_ACTION', action: 1, target: 'Z1' });
  ex({ type: 'USE_ACTION', action: 1, target: 'Z1' });
  check(!S.unitById(G, 'Z1').alive, 'Z1 cade con Attacco Base (3 danni)');
  ex({ type: 'ADVANCE' }); ex({ type: 'ADVANCE' });
  check(G.seq[1].state === 'off', 'il dado di Z1 è spento');
  ex({ type: 'ADVANCE' });
  ex({ type: 'MANEUVER', kind: 'ranged', target: 'Z2' });
  ex({ type: 'MANEUVER', kind: 'ranged', target: 'Z2' });
  ex({ type: 'ADVANCE' }); ex({ type: 'ADVANCE' });
  ex({ type: 'OPEN_CARD', card: card('pa') });
  ex({ type: 'USE_ACTION', action: 0 });
  ex({ type: 'ADVANCE' }); ex({ type: 'ADVANCE' }); ex({ type: 'ADVANCE' });
  var z2 = S.unitById(G, 'Z2'), p = G.player, e1 = X.endTurn1;
  check(z2.hp === e1.hp.Z2 && E.hex.same(z2.pos, e1.at.Z2), 'Z2 a 4 HP in R3E4 (' + z2.hp + ' in ' + z2.pos + ')');
  check(p.hp === e1.playerHp && p.pm === e1.pm && p.luce === e1.luce && p.pt === e1.pt,
    'fine T1: HP ' + p.hp + ' PM ' + p.pm + ' Luce ' + p.luce + ' PT ' + p.pt + ' (attesi 10/1/1/7)');

  section('Tutorial: turno 2');
  ex({ type: 'ADVANCE' });
  check(G.phase === 'FINE_TURNO' && G.turn === 2, 'turno 2 in Fine Turno');
  ex({ type: 'ECO_DISCARD', card: card('sc') });
  check(p.pm === 3, 'Eco di Scatto: +2 PM');
  ex({ type: 'ECO_DONE' });
  check(['ds', 'af', 'ab', 'pa', 'as'].every(function (id) { return G.hand.some(function (h) { return h.id === id; }); }), 'pesca del turno 2: Attacco Base, Parata, Attacco Strategico');
  keep(['vigore:3', 'vigore:1', 'fuoco:2']);
  ex({ type: 'SEL_CONFIRM' });
  ex({ type: 'ADVANCE' });
  ex({ type: 'OPEN_CARD', card: card('ds') });
  ex({ type: 'USE_ACTION', action: 0, target: 'Z2', push: [4, 5] });
  ex({ type: 'USE_ACTION', action: 0, target: 'Z2', push: [4, 5] });
  check(!z2.alive && G.res.pool.forza === X.afterStep12.impulsesLeft, 'passo 12: Z2 morto, 1 ✊ ancora da spendere');
  ex({ type: 'CLOSE_CARD' });
  var z2die = G.seq.filter(function (d) { return d.owner === 'Z2'; })[0];
  for (var i = 0; i < 20 && G.phase === 'RISOLUZIONE'; i++) ex({ type: 'ADVANCE' });
  check(z2die.state === 'off', 'il dado Morso di Z2 si spegne');

  section('Tutorial: turno 3');
  check(G.phase === 'FINE_TURNO' && G.turn === 3, 'turno 3 in Fine Turno');
  ex({ type: 'ECO_DONE' });
  var std = G.plancia.std;
  check(std.length === 1 && std[0].id === 'ds' && std[0].cd === 0, 'un solo posto standard: ds con CD residuo 0');
  keep(['vigore:2', 'vigore:2']);
  var plan = E.dice.selectionPlan(G);
  check(plan.cost === 2 && p.luce + plan.gains.luce >= X.step14.luceAtLeast, 'passo 14: un ✊ gratis, l\'altro 2 Luce; Luce ' + (p.luce + plan.gains.luce));
  var expectLuce = p.luce + plan.gains.luce - 2;
  ex({ type: 'SEL_CONFIRM' });
  check(G.phase === 'RISOLUZIONE' && p.luce === expectLuce, 'pagati 2 Luce');
  check(fail.length === 0, 'comandi rifiutati: ' + fail.join(' · '));
};
