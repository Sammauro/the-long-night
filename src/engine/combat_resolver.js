// THE LONG NIGHT — danni, stati, spinte, trappole (BRIEF 6.6, 6.8, 5.5; decisioni D7, D8)
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  var E = TLN.engine = TLN.engine || {};
  var S = E.state, hex = E.hex;

  // BRIEF 6.6 — calcolo puro (non modifica nulla): Vulnerabilità → Scudi → HP
  function damageCalc(u, amount, o) {
    o = o || {};
    if (o.direct) return { final: amount, absorbed: 0, hpLoss: Math.min(amount, Math.max(0, u.hp)), mult: 1 };
    var marks = S.statusCount(u, o.dtype === 'fire' ? 'vulnFire' : 'vuln');
    var mult = Math.pow(2, marks);
    var final = amount * mult;
    var absorbed = Math.min(S.statusCount(u, 'shield'), final);
    var rest = final - absorbed;
    return { final: final, absorbed: absorbed, hpLoss: Math.min(rest, Math.max(0, u.hp)), mult: mult };
  }

  // BRIEF 6.6 — applica un danno. o: { dtype: 'normal'|'fire', direct, source (unità), attack, cause }
  function damage(G, u, amount, o) {
    o = o || {};
    if (!u.alive || G.over || amount <= 0) return { final: 0, absorbed: 0, hpLoss: 0 };
    var c = damageCalc(u, amount, o);
    if (c.absorbed) S.consumeStatus(u, 'shield', c.absorbed);
    G.bus.emit('DAMAGE', {
      target: u.id, source: o.source ? o.source.id : null, amount: amount, final: c.final,
      absorbed: c.absorbed, hpLoss: c.hpLoss, dtype: o.dtype || 'normal', direct: !!o.direct, cause: o.cause || null
    });
    if (c.absorbed && u.kind === 'enemy' && TLN.data.enemies[u.type].armor) {
      G.bus.emit('ARMOR_ABSORB', { unit: u.id, absorbed: c.absorbed });
    }
    if (u.kind === 'player') {
      if (c.hpLoss) S.changeRes(G, 'hp', -c.hpLoss, o.cause || 'danno');
      else S.checkOutcome(G);
      // Contrattacco: per ogni segnalino, la fonte subisce lo stesso danno (normale)
      if (o.attack && o.source && o.source.alive && c.hpLoss > 0 && !G.over) {
        var n = S.statusCount(u, 'counter');
        for (var i = 0; i < n && o.source.alive && !G.over; i++) {
          damage(G, o.source, c.hpLoss, { dtype: 'normal', source: u, cause: 'Contrattacco' });
        }
      }
    } else {
      u.hp -= c.hpLoss;
      if (u.hp <= 0) {
        u.hp = 0; u.alive = false;
        G.bus.emit('DIED', { unit: u.id, at: u.pos.slice(), cause: o.cause || null });
      }
      S.checkOutcome(G);
    }
    return c;
  }

  function heal(G, u, n, cause) {
    if (!u.alive || n <= 0) return 0;
    var before = u.hp;
    if (u.kind === 'player') return S.changeRes(G, 'hp', n, cause);
    u.hp = Math.min(u.hpMax, u.hp + n);
    if (u.hp !== before) G.bus.emit('HEAL', { unit: u.id, amount: u.hp - before, cause: cause || null });
    return u.hp - before;
  }

  // BRIEF 5.5 — entrare in una casella. how: walk | push | distort | charge (attivano le trappole), fly | jump (no)
  function enterCell(G, u, c, how) {
    var from = u.pos;
    u.pos = c.slice();
    G.bus.emit('MOVE', { unit: u.id, from: from.slice(), to: c.slice(), how: how });
    var trig = how !== 'fly' && how !== 'jump' && S.hasTrap(G, c);
    if (trig) {
      delete G.terrain[hex.key(c)];
      G.bus.emit('TRAP', { unit: u.id, at: c.slice() });
      damage(G, u, TLN.data.terrain.trap.onEnter.direct, { direct: true, cause: 'Trappola' });
    }
    return trig;
  }
  function moveAlong(G, u, path, how) {
    var triggered = false;
    for (var i = 0; i < path.length; i++) {
      if (!u.alive || G.over) break;
      var how_i = typeof how === 'function' ? how(i) : how;
      if (enterCell(G, u, path[i], how_i)) triggered = true;
    }
    return triggered;
  }

  // BRIEF 6.8 — le tre caselle di allontanamento (anche fuori griglia: muro, D7)
  function pushOptions(G, srcPos, target) {
    var d0 = G.grid.distance(srcPos, target.pos);
    return G.grid.neighbors(target.pos, true).filter(function (n) {
      return G.grid.distance(srcPos, n) > d0;
    }).map(function (n) {
      var st = !G.grid.inGrid(n) ? 'wall' : (S.unitAt(G, n) || S.blocking(G, n)) ? 'occupied' : 'free';
      return { cell: n, status: st };
    });
  }
  // Spinta di un nemico: direzione opposta alla fonte, in linea retta
  function pushStraight(G, srcPos, target) {
    var d = G.grid.dirBetween(srcPos, target.pos);
    if (d < 0) return null;
    return G.grid.step(target.pos, d);
  }

  // BRIEF 6.8 — Spingi 1 verso la casella cell (libera: entra; occupata o muro: Collisione)
  function push(G, source, target, cell) {
    if (!target.alive || G.over) return;
    var free = G.grid.inGrid(cell) && S.isFree(G, cell);
    G.bus.emit('PUSH', { source: source ? source.id : null, target: target.id, to: cell.slice(), collision: !free });
    if (free) { enterCell(G, target, cell, 'push'); return; }
    var hitUnit = G.grid.inGrid(cell) ? S.unitAt(G, cell) : null;
    var ter = G.grid.inGrid(cell) ? S.terrainAt(G, cell) : null;
    G.bus.emit('COLLISION', { target: target.id, against: hitUnit ? hitUnit.id : (ter ? ter.type : 'wall'), at: cell.slice() });
    damage(G, target, 1, { dtype: 'normal', source: source, cause: 'Collisione' });
    if (hitUnit && hitUnit.alive && !G.over) damage(G, hitUnit, 1, { dtype: 'normal', source: source, cause: 'Collisione' });
    if (ter && TLN.data.terrain[ter.type].onCollision && target.alive && !G.over) {
      var oc = TLN.data.terrain[ter.type].onCollision;
      S.addStatus(G, target, oc.status, oc.n, 'Braciere');
    }
  }

  E.combat = {
    damageCalc: damageCalc, damage: damage, heal: heal, enterCell: enterCell, moveAlong: moveAlong,
    pushOptions: pushOptions, pushStraight: pushStraight, push: push
  };
})(typeof window !== 'undefined' ? window : globalThis);
