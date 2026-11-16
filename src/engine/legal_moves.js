// THE LONG NIGHT — elenco delle mosse legali (serve al giocatore casuale dei test e, in futuro, al simulatore)
// Genera candidati e li filtra con il check del motore: nessuna regola è duplicata qui.
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  var E = TLN.engine = TLN.engine || {};
  var S = E.state, hex = E.hex;

  function candidates(G, rng) {
    var out = [];
    var p = G.player;
    if (G.phase === 'FINE_TURNO') {
      var pl = E.cards.entries(G);
      G.hand.forEach(function (h) {
        var c = { type: 'ECO_DISCARD', card: h.uid };
        if (pl.length) c.rotate = rng.pick(pl).pid;
        out.push(c);
      });
      out.push({ type: 'ECO_DONE' });
    } else if (G.phase === 'SELEZIONE') {
      G.seq.forEach(function (d) { if (d.owner === 'P') out.push({ type: 'SEL_TOGGLE', die: d.uid }); });
      out.push({ type: 'SEL_CONFIRM' });
    } else if (G.phase === 'RISOLUZIONE') {
      out.push({ type: 'ADVANCE' });
      Object.keys(E.resolution.reachable(G)).forEach(function (k) {
        out.push({ type: 'MOVE', to: k.split(',').map(Number) });
      });
      out.push({ type: 'UNDO_MOVE' });
      var enemies = S.aliveEnemies(G);
      out.push({ type: 'MANEUVER', kind: 'tactical' });
      enemies.forEach(function (e) { out.push({ type: 'MANEUVER', kind: 'ranged', target: e.id }); });
      out.push({ type: 'MANEUVER', kind: 'convert', to: 'forza' });
      out.push({ type: 'MANEUVER', kind: 'convert', to: 'fuoco' });
      G.hand.forEach(function (h) {
        var def = E.cards.def(h);
        if (!def.free) { out.push({ type: 'OPEN_CARD', card: h.uid }); return; }
        freeCandidates(G, h, def, rng).forEach(function (c) { out.push(c); });
      });
      var o = G.res.open;
      if (o) {
        o.def.actions.forEach(function (act, i) {
          var base = { type: 'USE_ACTION', action: i };
          var pays = [undefined, 'fuoco'];
          if (act.kind === 'cone') { for (var d = 0; d < 6; d++) out.push(Object.assign({}, base, { dir: d })); return; }
          if (!act.target) { pays.forEach(function (pay) { out.push(Object.assign({}, base, { pay: pay })); }); return; }
          enemies.forEach(function (e) {
            if (act.kind === 'distort') {
              out.push(Object.assign({}, base, { target: e.id, path: randomPath(G, e, 1 + rng.int(4), rng) }));
              return;
            }
            var x = act.cost && act.cost.presagio === 'X' ? 1 + rng.int(Math.max(1, G.res.pool.presagio)) : undefined;
            var push;
            if (act.push && G.grid.distance(p.pos, e.pos) === 1) push = rng.pick(E.combat.pushOptions(G, p.pos, e)).cell;
            pays.forEach(function (pay) { out.push(Object.assign({}, base, { target: e.id, x: x, push: push, pay: pay })); });
          });
        });
        var reward = E.cardFx.needsChoice(G) ? { pm: rng.int(o.hpDamage + 1) } : undefined;
        out.push({ type: 'CLOSE_CARD', reward: reward });
        out.push({ type: 'CANCEL_CARD' });
      }
    }
    return out;
  }

  function randomPath(G, u, n, rng) {
    var path = [], at = u.pos;
    for (var i = 0; i < n; i++) {
      var opts = G.grid.neighbors(at).filter(function (c) {
        var o = S.unitAt(G, c);
        return !S.blocking(G, c) && (!o || o === u) && !path.some(function (x) { return hex.same(x, c); }) && !hex.same(c, u.pos);
      });
      if (!opts.length) break;
      at = rng.pick(opts); path.push(at);
    }
    return path;
  }

  function freeCandidates(G, h, def, rng) {
    var out = [];
    var mine = G.seq.filter(E.freeCards.unresolvedPlayerDie);
    if (def.free === 'infuse') mine.forEach(function (d) { out.push({ type: 'FREE_CARD', card: h.uid, die: d.uid }); });
    if (def.free === 'fate') mine.forEach(function (d) {
      var faces = TLN.data.dice.types[d.infused ? d.baseKind : d.kind].faces;
      out.push({ type: 'FREE_CARD', card: h.uid, die: d.uid, face: rng.pick(faces) });
    });
    if (def.free === 'charge') E.freeCards.chargePairs(G).forEach(function (pair) {
      for (var dir = 0; dir < 6; dir++) out.push({ type: 'FREE_CARD', card: h.uid, dice: pair, dir: dir, dist: 1 + rng.int(4) });
    });
    return out;
  }

  function legal(G, rng) {
    return candidates(G, rng).filter(function (c) { return !E.check(G, c); });
  }

  E.legal = { candidates: candidates, legal: legal };
})(typeof window !== 'undefined' ? window : globalThis);
