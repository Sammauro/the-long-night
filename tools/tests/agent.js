// Giocatore casuale: sceglie a caso tra le mosse legali (BRIEF 11, M2).
// Con weighted = true preferisce le mosse che fanno danno: serve solo a esplorare più a fondo
// (vittorie, Soglia, stanze successive). Non è un'IA di bilanciamento.
module.exports = function makeAgent(TLN, seed, weighted) {
  var E = TLN.engine;
  var rng = E.createRng(seed);
  var PROGRESS = { ADVANCE: 1, SEL_CONFIRM: 1, ECO_DONE: 1 };
  var W = { USE_ACTION: 8, MANEUVER: 5, OPEN_CARD: 4, FREE_CARD: 3, MOVE: 2, ECO_DISCARD: 1, SEL_TOGGLE: 2, CLOSE_CARD: 1, UNDO_MOVE: 0.2, CANCEL_CARD: 0.2 };
  function choose(run) {
    if (run.phase === 'SOGLIA') {
      var ids = Object.keys(TLN.data.runConfig.rests);
      rng.shuffle(ids);
      return { type: 'SOGLIA_CHOOSE', rests: ids.slice(0, run.restsAllowed) };
    }
    var legal = E.legal.legal(run.game, rng);
    if (!legal.length) return null;
    var prog = legal.filter(function (c) { return PROGRESS[c.type]; });
    if (!weighted) {
      if (prog.length && rng.next() < 0.3) return rng.pick(prog);
      return rng.pick(legal);
    }
    var others = legal.filter(function (c) { return !PROGRESS[c.type]; });
    if (!others.length || (prog.length && rng.next() < 0.15)) return rng.pick(prog.length ? prog : legal);
    var tot = 0;
    others.forEach(function (c) { tot += W[c.type] || 1; });
    var r = rng.next() * tot;
    for (var i = 0; i < others.length; i++) { r -= W[others[i].type] || 1; if (r <= 0) return others[i]; }
    return others[others.length - 1];
  }
  return { choose: choose, rng: rng };
};
