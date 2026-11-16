// THE LONG NIGHT — Risoluzione: finestre, dadi attivi, movimento, manovre base (BRIEF 6.4, 6.7)
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  var E = TLN.engine = TLN.engine || {};
  var S = E.state, C = E.combat, hex = E.hex;

  function emptyPool() { return { forza: 0, fuoco: 0, presagio: 0 }; }
  function initRes(G) {
    G.res = { cursor: 0, active: false, pool: emptyPool(), convFire: false, open: null, lastMove: null };
  }
  function currentDie(G) { return G.res.active ? G.seq[G.res.cursor] : null; }

  // BRIEF 6.7 — caselle raggiungibili: { key: { cell, pm, jump, path:[{cell, how}] } }
  // Se all'inizio sei adiacente a un nemico il primo passo costa 2 PM. I passi su caselle occupate
  // (unità, ostacoli, trappole) si pagano solo con PM Salto e non fanno scattare nulla.
  function reachable(G) {
    var p = G.player, out = {}, startKey = hex.key(p.pos);
    var firstCost = S.adjacentEnemies(G, p.pos).length ? 2 : 1;
    var seen = {}, queue = [{ cell: p.pos, n: 0, j: 0, path: [] }];
    seen[startKey + '|0|0'] = true;
    function better(a, b) { return !b || a.pm < b.pm || (a.pm === b.pm && a.jump < b.jump); }
    while (queue.length) {
      var st = queue.shift();
      if (st.path.length && st.path[st.path.length - 1].how === 'walkTrap') continue;
      var cost = st.path.length ? 1 : firstCost;
      G.grid.neighbors(st.cell).forEach(function (n) {
        if (hex.same(n, p.pos)) return;
        var occupied = !!S.unitAt(G, n) || S.blocking(G, n);
        var trap = S.hasTrap(G, n);
        var opts = [];
        if (occupied || trap) opts.push({ dn: 0, dj: cost, how: 'jump' });
        if (!occupied) {
          var walkHow = trap ? 'walkTrap' : 'walk';
          opts.push({ dn: cost, dj: 0, how: walkHow });
          if (!trap) opts.push({ dn: 0, dj: cost, how: 'jump' });
          if (!trap && cost === 2) opts.push({ dn: 1, dj: 1, how: 'walk' });
        }
        opts.forEach(function (o) {
          var nn = st.n + o.dn, nj = st.j + o.dj;
          if (nn > p.pm || nj > p.jump) return;
          var sk = hex.key(n) + '|' + nn + '|' + nj + '|' + (o.how === 'walkTrap' ? 't' : '');
          if (seen[sk]) return;
          seen[sk] = true;
          var ns = { cell: n, n: nn, j: nj, path: st.path.concat([{ cell: n, how: o.how }]) };
          queue.push(ns);
          var canStop = !occupied && (!trap || o.how === 'walkTrap');
          if (canStop) {
            var cand = { cell: n, pm: nn, jump: nj, path: ns.path, trap: trap };
            if (better(cand, out[hex.key(n)])) out[hex.key(n)] = cand;
          }
        });
      });
    }
    return out;
  }

  function inResolution(G) { return G.phase === 'RISOLUZIONE'; }

  E.defineCommand('MOVE', {
    check: function (G, c) {
      if (!inResolution(G)) return 'Non è la Risoluzione';
      if (E.cardFx.needsChoice(G)) return 'Chiudi prima la carta aperta';
      if (!c.to || !reachable(G)[hex.key(c.to)]) return 'Casella non raggiungibile';
      return null;
    },
    run: function (G, c) {
      var hadOpen = !!G.res.open;
      E.cardFx.autoClose(G);
      var r = reachable(G)[hex.key(c.to)], p = G.player, from = p.pos.slice();
      if (!r) return { ok: false, error: 'Casella non più raggiungibile' };
      if (r.pm) S.changeRes(G, 'pm', -r.pm, 'Movimento');
      if (r.jump) S.changeRes(G, 'jump', -r.jump, 'Movimento');
      var trig = C.moveAlong(G, p, r.path.map(function (s) { return s.cell; }), function (i) {
        return r.path[i].how === 'jump' ? 'jump' : 'walk';
      });
      // BRIEF 7 — annullabile finché non ha fatto scattare nulla
      G.res.lastMove = (trig || hadOpen) ? null : { from: from, pm: r.pm, jump: r.jump };
    }
  });

  E.defineCommand('UNDO_MOVE', {
    check: function (G) { return inResolution(G) && G.res.lastMove ? null : 'Niente da annullare'; },
    run: function (G) {
      var m = G.res.lastMove, p = G.player, at = p.pos.slice();
      G.res.lastMove = null;
      p.pos = m.from.slice();
      G.bus.emit('MOVE', { unit: 'P', from: at, to: m.from.slice(), how: 'undo' });
      if (m.pm) S.changeRes(G, 'pm', m.pm, 'Annulla');
      if (m.jump) S.changeRes(G, 'jump', m.jump, 'Annulla');
    }
  });

  // BRIEF 6.4 — manovre base
  E.defineCommand('MANEUVER', {
    check: function (G, c) {
      if (!inResolution(G) || !G.res.active) return 'Serve un dado attivo';
      var pool = G.res.pool;
      if (c.kind === 'tactical') return pool.forza >= 1 ? null : 'Serve 1 ✊';
      if (c.kind === 'ranged') {
        if (pool.fuoco < 1) return 'Serve 1 🔥';
        var t = S.unitById(G, c.target);
        if (!t || !t.alive || t.kind !== 'enemy') return 'Bersaglio non valido';
        return G.grid.distance(G.player.pos, t.pos) <= 3 ? null : 'Bersaglio oltre 3 caselle';
      }
      if (c.kind === 'convert') {
        if (pool.presagio < 1) return 'Serve 1 🔮';
        return c.to === 'forza' || c.to === 'fuoco' ? null : 'Scegli ✊ o 🔥';
      }
      return 'Manovra sconosciuta';
    },
    run: function (G, c) {
      var pool = G.res.pool, p = G.player;
      G.res.lastMove = null;
      G.bus.emit('MANEUVER', { kind: c.kind, target: c.target || null, to: c.to || null });
      if (c.kind === 'tactical') { pool.forza--; S.changeRes(G, 'pm', 1, 'Movimento Tattico'); }
      else if (c.kind === 'ranged') {
        pool.fuoco--;
        C.damage(G, S.unitById(G, c.target), 1, { dtype: 'fire', source: p, cause: 'Colpo a Distanza' });
      } else if (c.kind === 'convert') {
        pool.presagio--; pool[c.to]++;
        S.changeRes(G, 'pt', -1, 'Conversione Oscura');
        if (c.to === 'fuoco' && !G.res.convFire && !G.over) { G.res.convFire = true; S.changeRes(G, 'pt', 1, 'Conversione Oscura'); }
      }
      G.bus.emit('POOL', { pool: Object.assign({}, pool) });
    }
  });

  function deactivate(G) {
    var d = G.seq[G.res.cursor];
    d.state = 'resolved';
    G.res.active = false;
    G.res.pool = emptyPool();
    G.res.convFire = false;
    G.res.cursor++;
    G.bus.emit('DIE_RESOLVED', { die: d.uid });
  }

  // BRIEF 6.4 — avanza: chiude il dado attivo, oppure risolve il prossimo dado della Sequenza
  E.defineCommand('ADVANCE', {
    check: function (G) {
      if (!inResolution(G)) return 'Non è la Risoluzione';
      if (E.cardFx.needsChoice(G)) return 'Chiudi prima la carta aperta';
      return null;
    },
    run: function (G) {
      E.cardFx.autoClose(G);
      G.res.lastMove = null;
      if (G.res.active) { deactivate(G); return; }
      while (G.res.cursor < G.seq.length && G.seq[G.res.cursor].state !== 'pending') G.res.cursor++;
      if (G.res.cursor >= G.seq.length) { E.turn.endTurn(G); return; }
      var d = G.seq[G.res.cursor];
      if (d.owner === 'P') {
        d.state = 'active';
        G.res.active = true;
        var imp = TLN.data.dice.types[d.kind].impulse;
        G.res.pool[imp] = E.dice.impulses(d);
        G.bus.emit('DIE_ACTIVE', { die: d.uid, kind: d.kind, pool: Object.assign({}, G.res.pool) });
        return;
      }
      var e = S.unitById(G, d.owner);
      if (!e || !e.alive) {
        d.state = 'off'; G.res.cursor++;
        G.bus.emit('DIE_OFF', { die: d.uid, enemy: d.owner }); // D6: il dado si spegne
        return;
      }
      if (S.statusCount(e, 'stun') > 0) {
        S.consumeStatus(e, 'stun', 1);
        d.state = 'resolved'; G.res.cursor++;
        G.bus.emit('STUN_SKIP', { die: d.uid, enemy: e.id });
        return;
      }
      d.state = 'active';
      G.bus.emit('DIE_ACTIVE', { die: d.uid, kind: 'ai', enemy: e.id });
      E.ai.act(G, e, d);
      if (d.state === 'active') d.state = 'resolved';
      G.res.cursor++;
      G.bus.emit('DIE_RESOLVED', { die: d.uid });
    }
  });

  E.resolution = { initRes: initRes, reachable: reachable, currentDie: currentDie };
})(typeof window !== 'undefined' ? window : globalThis);
