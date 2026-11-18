// M2 — casi mirati, seconda parte: carte, manovre, Selezione, nemici
var H = require('./helpers');

module.exports = function (TLN, check, section) {
  var E = TLN.engine, S = E.state;
  function ex(G, c) { var r = E.execute(G, c); if (!r.ok) console.log('    (rifiutato ' + c.type + ': ' + r.error + ')'); return r; }
  function hpOf(G, id) { return S.unitById(G, id).hp; }

  section('Cono: 9 caselle, 6 orientamenti');
  var grid = E.hex.createGrid(20, 20);
  for (var d = 0; d < 6; d++) check(grid.cone([10, 10], d, 3).length === 9, 'cono orientamento ' + d);

  section('Attacco Base, Amplificazione Elementale');
  var G = H.custom(TLN, { player: [2, 4], enemies: [{ type: 'zombie', at: [3, 4] }], pool: { forza: 1, fuoco: 1 } });
  var ab = H.give(TLN, G, 'ab');
  ex(G, { type: 'OPEN_CARD', card: ab });
  ex(G, { type: 'USE_ACTION', action: 0, target: 'Z1' });
  check(!E.execute(G, { type: 'USE_ACTION', action: 0, target: 'Z1' }).ok, 'Azione gratuita usabile una volta');
  ex(G, { type: 'USE_ACTION', action: 1, target: 'Z1', pay: 'fuoco' });
  check(hpOf(G, 'Z1') === 3 && G.ofType('DAMAGE').slice(-1)[0].data.dtype === 'fire', 'ab A2 pagata con 🔥: 2 Danni Fuoco');
  check(!E.execute(G, { type: 'USE_ACTION', action: 0, target: 'Z1' }).ok, 'non si torna a un\'Azione precedente');
  ex(G, { type: 'USE_ACTION', action: 2 });
  check(G.hand.length === 1, 'ab A3: pesca 1');

  // Amplificazione: +1 una volta per attivazione della carta, non per impulso
  G = H.custom(TLN, { player: [2, 4], enemies: [{ type: 'zombie', at: [3, 4] }], pool: { fuoco: 2 } });
  ab = H.give(TLN, G, 'ab');
  ex(G, { type: 'OPEN_CARD', card: ab });
  ex(G, { type: 'USE_ACTION', action: 1, target: 'Z1', pay: 'fuoco' });
  ex(G, { type: 'USE_ACTION', action: 1, target: 'Z1', pay: 'fuoco' });
  check(hpOf(G, 'Z1') === 3, 'Amplificazione: 2 🔥 su ab = 2 + 1 danni, +1 una sola volta (HP ' + hpOf(G, 'Z1') + ')');

  section('Manovre base e Conversione Oscura');
  G = H.custom(TLN, { player: [1, 1], enemies: [{ type: 'zombie', at: [3, 2] }], pool: { presagio: 3 } });
  var pt = G.player.pt;
  ex(G, { type: 'MANEUVER', kind: 'convert', to: 'fuoco' });
  ex(G, { type: 'MANEUVER', kind: 'convert', to: 'fuoco' });
  check(G.player.pt === pt - 3 && G.res.pool.fuoco === 2, 'conversione in 🔥: 1 PT per impulso + 1 PT una sola volta (PT ' + G.player.pt + ')');
  ex(G, { type: 'MANEUVER', kind: 'ranged', target: 'Z1' });
  check(hpOf(G, 'Z1') === 5, 'Colpo a Distanza: 1 Danno Fuoco');
  ex(G, { type: 'MANEUVER', kind: 'convert', to: 'forza' });
  var pm = G.player.pm;
  ex(G, { type: 'MANEUVER', kind: 'tactical' });
  check(G.player.pm === pm + 1, 'Movimento Tattico: +1 PM');

  section('Movimento: ogni passo da adiacente costa 2 (Q12); PM Salto');
  G = H.custom(TLN, { player: [2, 4], enemies: [{ type: 'zombie', at: [3, 4] }], terrain: [{ type: 'column', at: [2, 3] }] });
  G.player.pm = 2;
  var reach = E.resolution.reachable(G);
  check(reach['1,4'] && reach['1,4'].pm === 2 && !reach['1,2'] && !reach['2,6'], 'da adiacente: 1 casella con 2 PM');
  G.player.pm = 4;
  reach = E.resolution.reachable(G);
  check(reach['2,5'] && reach['2,5'].pm === 2 && reach['2,6'] && reach['2,6'].pm === 4, 'Q12: ogni passo che parte adiacente a un nemico costa 2 PM (2,6 = ' + (reach['2,6'] && reach['2,6'].pm) + ')');
  G.player.pm = 0; G.player.jump = 3;
  reach = E.resolution.reachable(G);
  check(!!reach['2,2'] && !reach['2,3'], 'PM Salto attraversa la colonna ma non ci si ferma');
  ex(G, { type: 'MOVE', to: [2, 2] });
  check(G.player.jump === 0, 'PM Salto spesi');
  ex(G, { type: 'UNDO_MOVE' });
  check(E.hex.same(G.player.pos, [2, 4]) && G.player.jump === 3, 'annulla movimento');

  section('Selezione: costi');
  var run = E.run.createRun({ seed: 12, start: 'r1', only: true, noScript: true });
  G = run.game;
  var vig = G.seq.filter(function (x) { return x.kind === 'vigore'; });
  E.cards.addSeal(G);
  vig.forEach(function (x) { G.sel.keep[x.uid] = true; });
  var plan = E.dice.selectionPlan(G);
  check(plan.cost === 2, 'slot 1 coperto: secondo ✊ costa 2 Luce (costo ' + plan.cost + ')');
  check(!plan.affordable || G.player.luce + plan.gains.luce >= 2, 'conferma valida solo con Luce sufficiente');
  var fu = G.seq.filter(function (x) { return x.kind === 'fuoco'; });
  fu.forEach(function (x) { G.sel.keep[x.uid] = true; });
  check(!E.dice.selectionPlan(G).ok, 'due d4 Fuoco con un solo slot: non valido');

  section('Carte gratuite');
  G = H.custom(TLN, { player: [1, 1], enemies: [{ type: 'zombie', at: [8, 6] }] });
  G.seq = [{ uid: 'a', kind: 'vigore', owner: 'P', value: 2, bonus: 0, state: 'pending' }, { uid: 'b', kind: 'terrore', owner: 'P', value: 1, bonus: 0, state: 'pending' }, { uid: 'c', kind: 'vigore', owner: 'P', value: 1, bonus: 0, state: 'pending' }];
  ex(G, { type: 'FREE_CARD', card: H.give(TLN, G, 'ie'), die: 'a' });
  check(G.seq[0].kind === 'fuoco' && G.seq[0].bonus === 1 && G.plancia.fire, 'Infusione: dado Fuoco +1, carta nello slot Fuoco');
  check(!E.execute(G, { type: 'FREE_CARD', card: H.give(TLN, G, 'md'), die: 'b', face: 5 }).ok, 'Manipolazione: faccia inesistente rifiutata');
  var md = G.hand.filter(function (h) { return h.id === 'md'; })[0].uid;
  ex(G, { type: 'FREE_CARD', card: md, die: 'b', face: 4 });
  check(G.seq[1].value === 4, 'Manipolazione Destino: dado sulla faccia scelta');
  ex(G, { type: 'FREE_CARD', card: H.give(TLN, G, 'cu'), dice: ['b', 'c'], dir: 5, dist: 4 });
  check(G.seq[1].state === 'consumed' && E.hex.same(G.player.pos, [5, 3]), 'Carica Furiosa: 4 caselle in linea retta (' + G.player.pos + ')');

  // Q3: carte gratuite anche con un dado attivo, ma non con una carta aperta
  G = H.custom(TLN, { player: [1, 1], enemies: [{ type: 'zombie', at: [8, 6] }] });
  G.seq = [{ uid: 'x', kind: 'vigore', owner: 'P', value: 2, bonus: 0, state: 'active' }, { uid: 'a', kind: 'vigore', owner: 'P', value: 2, bonus: 0, state: 'pending' }];
  G.res.active = true; G.res.cursor = 0; G.res.open = { fake: true };
  var ie2 = H.give(TLN, G, 'ie');
  check(!E.execute(G, { type: 'FREE_CARD', card: ie2, die: 'a' }).ok, 'Q3: carta gratuita rifiutata mentre una carta è aperta');
  G.res.open = null;
  check(E.execute(G, { type: 'FREE_CARD', card: ie2, die: 'a' }).ok && G.seq[1].kind === 'fuoco', 'Q3: carta gratuita giocabile con un dado attivo e nessuna carta aperta');
  check(!E.execute(G, { type: 'FREE_CARD', card: H.give(TLN, G, 'md'), die: 'x', face: 3 }).ok, 'Q3: il dado attivo non è un bersaglio (non è "non risolto")');

  section('Attacco Poderoso, Attacco Strategico, Scatto');
  G = H.custom(TLN, { player: [2, 4], enemies: [{ type: 'zombie', at: [3, 4] }], pool: { forza: 3 } });
  ex(G, { type: 'OPEN_CARD', card: H.give(TLN, G, 'ap') });
  ex(G, { type: 'USE_ACTION', action: 0, target: 'Z1' });
  ex(G, { type: 'USE_ACTION', action: 1, target: 'Z1' });
  check(S.statusCount(G.player, 'vuln') === 1 && S.statusCount(S.unitById(G, 'Z1'), 'stun') === 1, 'ap: Vulnerabile una volta, bersaglio Stordito');
  G = H.custom(TLN, { player: [2, 4], enemies: [{ type: 'zombie', at: [3, 4] }], pool: { forza: 2 } });
  ex(G, { type: 'OPEN_CARD', card: H.give(TLN, G, 'as') });
  ex(G, { type: 'USE_ACTION', action: 0, target: 'Z1' });
  ex(G, { type: 'USE_ACTION', action: 0, target: 'Z1' });
  check(!E.execute(G, { type: 'ADVANCE' }).ok, 'as: serve la scelta prima di chiudere');
  var pm0 = G.player.pm;
  ex(G, { type: 'CLOSE_CARD', reward: { pm: 1 } });
  check(G.player.pm === pm0 + 1 && S.statusCount(G.player, 'shield') === 1, 'as: 2 danni agli HP → +1 PM e +1 Scudo');
  G = H.custom(TLN, { player: [1, 1], enemies: [{ type: 'zombie', at: [8, 6] }], pool: { forza: 1 } });
  ex(G, { type: 'OPEN_CARD', card: H.give(TLN, G, 'sc') });
  check(G.hand.length === 1 && !E.execute(G, { type: 'CANCEL_CARD' }).ok, 'Scatto pesca all\'attivazione e non si annulla più');
  ex(G, { type: 'USE_ACTION', action: 0 });
  check(G.player.jump === 1, 'Scatto: +1 PM Salto');

  section('Nemici');
  G = H.custom(TLN, { player: [4, 3], enemies: [{ type: 'falena', at: [8, 3] }] });
  G.player.luce = 1;
  E.ai.act(G, S.unitById(G, 'F1'), { actionId: 'frenesia', value: 3 });
  check(G.player.luce === 0 && G.player.hp === 9 && G.grid.distance(S.unitById(G, 'F1').pos, [4, 3]) === 1, 'Frenesia: ruba 1 Luce e 1 Danno');
  E.ai.act(G, S.unitById(G, 'F1'), { actionId: 'divorare', value: 1 });
  check(G.player.hp === 8, 'Divorare senza Luce: 1 Danno');
  G = H.custom(TLN, { player: [1, 3], enemies: [{ type: 'sussurratore', at: [3, 3] }, { type: 'sussurratore', at: [8, 6] }] });
  var p0 = G.player.pt;
  E.ai.act(G, S.unitById(G, 'S1'), { actionId: 'coro', value: 3 });
  check(G.player.pt === p0 - 2, 'Coro con un altro Sussurratore vivo: −2 PT');
  G = H.custom(TLN, { player: [2, 4], enemies: [{ type: 'zombie', at: [3, 4], hp: 4 }] });
  E.ai.act(G, S.unitById(G, 'Z1'), { actionId: 'morso', value: 3 });
  check(G.player.hp === 8 && hpOf(G, 'Z1') === 6, 'Morso: 2 Danni, cura 2');
  G = H.custom(TLN, { player: [2, 4], enemies: [{ type: 'custode', at: [3, 4] }], terrain: [{ type: 'column', at: [1, 3] }] });
  E.ai.act(G, S.unitById(G, 'C1'), { actionId: 'maglio', value: 1 });
  check(G.player.hp === 6 && E.hex.same(G.player.pos, [2, 4]), 'Maglio: 3 Danni + spinta contro la colonna (Collisione)');

  section('Fine stanza e sconfitta');
  G = H.custom(TLN, { player: [2, 4], enemies: [{ type: 'zombie', at: [3, 4], hp: 1 }], pool: { forza: 1 } });
  ex(G, { type: 'OPEN_CARD', card: H.give(TLN, G, 'ab') });
  ex(G, { type: 'USE_ACTION', action: 0, target: 'Z1' });
  check(G.phase === 'WON' && G.over.result === 'win', 'ultimo nemico morto: la stanza finisce subito');
  G = H.custom(TLN, { player: [1, 1], enemies: [{ type: 'zombie', at: [8, 6] }], pool: { presagio: 2 } });
  G.player.pt = 1;
  ex(G, { type: 'OPEN_CARD', card: H.give(TLN, G, 'pm') });
  ex(G, { type: 'USE_ACTION', action: 0, target: 'Z1', x: 1 });
  check(G.over && G.over.result === 'madness', 'pagare PT fino a 0 è consentito ed è Follia');
  G = H.custom(TLN, { player: [1, 1], enemies: [{ type: 'zombie', at: [8, 6] }] });
  G.deck = [];
  E.cards.draw(G, 1);
  check(G.ofType('DRAW_FAIL').length === 1, 'pesca da mazzo vuoto fallisce');

  section('Eco');
  G = H.custom(TLN, { player: [1, 1], enemies: [{ type: 'zombie', at: [8, 6] }] });
  G.phase = 'FINE_TURNO';
  var dsI = { uid: 'x1', id: 'ds' }; E.cards.place(G, dsI);
  G.deck = G.deck.filter(function (c) { return c.id !== 'ds'; });
  var scU = H.give(TLN, G, 'sc');
  ex(G, { type: 'ECO_DISCARD', card: scU, rotate: G.plancia.std[0].pid });
  check(G.player.pm === 4 && G.plancia.std[0].cd === 0, 'Eco Scatto: +2 PM, ruota ds a 0');
};
