// Costruisce una stanza su misura per i casi mirati.
// spec: { player:[R,E], enemies:[{type, at, hp}], terrain:[{type, at}], veglia, pool:{forza,fuoco,presagio} }
module.exports.custom = function (TLN, spec) {
  var E = TLN.engine;
  var room = { id: 'test', name: 'Test', veglia: spec.veglia == null ? null : spec.veglia, player: spec.player || [1, 1],
    enemies: spec.enemies || [], terrain: spec.terrain || [] };
  var bus = E.createEventBus(), events = [];
  bus.onAny(function (ev) { events.push(ev); });
  var G = E.state.createGame({ room: room, bus: bus, rng: E.createRng(spec.seed || 42), carry: spec.carry });
  E.cards.setupDeck(G);
  G.turn = 1; G.phase = 'RISOLUZIONE';
  E.resolution.initRes(G);
  if (spec.pool) { G.res.active = true; G.res.pool = Object.assign({ forza: 0, fuoco: 0, presagio: 0 }, spec.pool); G.seq = [{ uid: 'dx', kind: 'vigore', owner: 'P', value: 3, bonus: 0, state: 'active' }]; }
  G.events = events;
  G.ofType = function (t) { return events.filter(function (e) { return e.type === t; }); };
  return G;
};
// Mette in mano una carta (dal mazzo) e la apre
module.exports.give = function (TLN, G, id) {
  for (var i = 0; i < G.deck.length; i++) if (G.deck[i].id === id) { var c = G.deck.splice(i, 1)[0]; G.hand.push(c); return c.uid; }
  return null;
};
