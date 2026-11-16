// THE LONG NIGHT — movimento e azioni dei nemici (BRIEF 5.4, 6.9)
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  var E = TLN.engine = TLN.engine || {};
  var S = E.state, C = E.combat, hex = E.hex;

  function first(arr) { return arr[0]; }
  function enemyDef(e) { return TLN.data.enemies[e.type]; }

  // BRIEF 6.9 — percorso più breve verso una casella valida; parità risolte con choose (rng o primo)
  function planApproach(G, e, choose) {
    var def = enemyDef(e), p = G.player.pos, range = def.range || 1;
    if (G.grid.distance(e.pos, p) <= range) return [];
    var dist = {}, start = hex.key(e.pos), queue = [e.pos], goals = [], gd = Infinity;
    dist[start] = 0;
    while (queue.length) {
      var cur = queue.shift(), dc = dist[hex.key(cur)];
      if (dc >= gd) break;
      G.grid.neighbors(cur).forEach(function (n) {
        var k = hex.key(n);
        if (dist[k] != null || !S.isFree(G, n)) return;
        dist[k] = dc + 1;
        if (G.grid.distance(n, p) <= range) { goals.push(n); gd = dc + 1; }
        queue.push(n);
      });
    }
    if (!goals.length) return null; // nessun percorso: non si muove
    var path = [choose(goals)];
    while (dist[hex.key(path[0])] > 1) {
      var d = dist[hex.key(path[0])];
      var prev = G.grid.neighbors(path[0]).filter(function (n) { return dist[hex.key(n)] === d - 1; });
      path.unshift(choose(prev));
    }
    return path.slice(0, def.mov);
  }

  // BRIEF 6.9 — "si allontana di N": ogni passo su una casella libera che aumenta la distanza
  function planRetreat(G, e, n, choose, fly) {
    var p = G.player.pos, pos = e.pos, path = [];
    for (var i = 0; i < n; i++) {
      var d0 = G.grid.distance(pos, p), best = -1, cands = [];
      G.grid.neighbors(pos).forEach(function (c) {
        if (!S.isFree(G, c) || path.some(function (x) { return hex.same(x, c); })) return;
        if (fly && S.hasTrap(G, c)) return;
        var d = G.grid.distance(c, p);
        if (d <= d0) return;
        if (d > best) { best = d; cands = [c]; } else if (d === best) cands.push(c);
      });
      if (!cands.length) break;
      pos = choose(cands); path.push(pos);
    }
    return path;
  }

  // BRIEF 5.4 — Volo: casella libera entro mov, la più vicina tra quelle adiacenti al giocatore
  function planFly(G, e, choose) {
    var def = enemyDef(e), p = G.player.pos;
    if (G.grid.distance(e.pos, p) === 1) return null;
    var cands = G.grid.allCells().filter(function (c) {
      return S.isFree(G, c) && !S.hasTrap(G, c) && G.grid.distance(e.pos, c) <= def.mov;
    });
    var adj = cands.filter(function (c) { return G.grid.distance(c, p) === 1; });
    var pool, best = Infinity;
    if (adj.length) {
      adj.forEach(function (c) { best = Math.min(best, G.grid.distance(e.pos, c)); });
      pool = adj.filter(function (c) { return G.grid.distance(e.pos, c) === best; });
    } else {
      var d0 = G.grid.distance(e.pos, p);
      cands.forEach(function (c) { best = Math.min(best, G.grid.distance(c, p)); });
      if (best >= d0) return null;
      pool = cands.filter(function (c) { return G.grid.distance(c, p) === best; });
    }
    return pool.length ? choose(pool) : null;
  }

  function otherZombiesAdjacent(G, e, at) {
    return S.aliveEnemies(G).filter(function (z) {
      return z !== e && z.type === 'zombie' && G.grid.distance(z.pos, G.player.pos) === 1;
    }).length;
  }
  function otherAlive(G, e) {
    return S.aliveEnemies(G).filter(function (z) { return z !== e && z.type === e.type; }).length;
  }

  // Anteprima per l'interfaccia (BRIEF 7): percorso previsto e danno che farebbe adesso. Non modifica nulla.
  function preview(G, e, actionId) {
    var def = enemyDef(e), act = def.actions[actionId], out = { action: actionId, name: act.name, path: [], end: e.pos, reach: false };
    if (act.move === 'approach') out.path = planApproach(G, e, first) || [];
    else if (act.move === 'fly') { var f = planFly(G, e, first); out.path = f ? [f] : []; out.flight = true; }
    else if (act.retreat) out.path = planRetreat(G, e, act.retreat, first, !!def.fly);
    if (out.path.length) out.end = out.path[out.path.length - 1];
    var d = G.grid.distance(out.end, G.player.pos);
    out.reach = d <= (def.range || 1);
    if (act.ptLoss) out.ptLoss = out.reach ? act.ptLoss + (act.choirBonus ? act.choirBonus * otherAlive(G, e) : 0) : 0;
    var raw = 0;
    if (out.reach && act.dmg != null) {
      raw = act.dmg + (act.hordeBonus ? act.hordeBonus * otherZombiesAdjacent(G, e) : 0);
      if (act.stealLight) { out.steal = G.player.luce > 0 ? act.stealLight : 0; if (!G.player.luce) raw = act.dmgNoLight; }
    }
    if (raw) { var dc = C.damageCalc(G.player, raw, {}); out.raw = raw; out.dmg = dc.hpLoss; out.absorbed = dc.absorbed; }
    if (act.seal) out.seal = G.plancia.std.length < TLN.data.equipment.standardSpots ? 'sigillo' : 'luce';
    if (act.shield) out.shield = act.shield;
    if (act.push && out.reach) out.push = true;
    return out;
  }

  // BRIEF 6.4 — il nemico legato al dado esegue la sua azione
  function act(G, e, die) {
    var def = enemyDef(e), a = def.actions[die.actionId], p = G.player, pick = G.rng.pick;
    G.bus.emit('AI_ACTION', { enemy: e.id, type: e.type, action: die.actionId, name: a.name, value: die.value });
    if (a.move === 'approach') {
      var forced = G.script && G.script.forcedPaths && G.script.forcedPaths[G.turn + ':' + e.id];
      // Il percorso fissato dallo script vale solo se è ancora percorribile
      var okForced = forced && forced.every(function (c, i) {
        return S.isFree(G, c) && G.grid.distance(i ? forced[i - 1] : e.pos, c) === 1;
      });
      var path = okForced ? forced.map(function (c) { return c.slice(); }) : planApproach(G, e, pick);
      if (path && path.length) C.moveAlong(G, e, path, 'walk');
    } else if (a.move === 'fly') {
      var dest = planFly(G, e, pick);
      if (dest) C.enterCell(G, e, dest, 'fly');
    }
    if (!e.alive || G.over) return;
    if (a.retreat) C.moveAlong(G, e, planRetreat(G, e, a.retreat, pick, !!def.fly), def.fly ? 'fly' : 'walk');
    if (!e.alive || G.over) return;
    if (a.shield) S.addStatus(G, e, 'shield', a.shield, a.name);
    var reach = G.grid.distance(e.pos, p.pos) <= (def.range || 1);
    if (a.ptLoss && reach) {
      var loss = a.ptLoss + (a.choirBonus ? a.choirBonus * otherAlive(G, e) : 0);
      G.bus.emit(a.choirBonus ? 'CHOIR' : 'WHISPER', { enemy: e.id, loss: loss });
      S.changeRes(G, 'pt', -loss, a.name); // non è danno (BRIEF 5.4)
    }
    if (a.stealLight != null && reach) {
      var dmg = a.dmg;
      if (p.luce > 0) { S.changeRes(G, 'luce', -a.stealLight, a.name); G.bus.emit('LIGHT_STOLEN', { enemy: e.id }); }
      else dmg = a.dmgNoLight;
      if (dmg && !G.over) C.damage(G, p, dmg, { source: e, attack: true, cause: a.name });
    } else if (a.dmg && reach) {
      var raw = a.dmg + (a.hordeBonus ? a.hordeBonus * otherZombiesAdjacent(G, e) : 0);
      var r = C.damage(G, p, raw, { source: e, attack: true, cause: a.name });
      if (a.lifesteal && r.hpLoss && e.alive) C.heal(G, e, r.hpLoss, a.name);
      if (a.push && p.alive && !G.over) {
        var cell = C.pushStraight(G, e.pos, p);
        if (cell) C.push(G, e, p, cell);
      }
    }
    if (a.seal) {
      if (E.cards.addSeal(G)) G.bus.emit('SEAL', { enemy: e.id });
      else if (p.luce > 0) S.changeRes(G, 'luce', -1, a.name);
    }
  }

  // BRIEF 5.4 — Corazza: nel Lancio, Scudi (Turno Attuale) fino ad arrivare al valore di Corazza
  function applyArmor(G) {
    S.aliveEnemies(G).forEach(function (e) {
      var armor = enemyDef(e).armor;
      if (!armor) return;
      var have = S.statusCount(e, 'shield');
      if (have < armor) S.addStatus(G, e, 'shield', armor - have, 'Corazza');
    });
  }

  E.ai = { planApproach: planApproach, planRetreat: planRetreat, planFly: planFly, preview: preview, act: act, applyArmor: applyArmor };
})(typeof window !== 'undefined' ? window : globalThis);
