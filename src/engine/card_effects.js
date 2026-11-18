// THE LONG NIGHT — aprire, usare, chiudere le carte (BRIEF 6.5, 5.3, 3 "altre regole chiarite")
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  var E = TLN.engine = TLN.engine || {};
  var S = E.state, C = E.combat, hex = E.hex;

  function inHand(G, uid) { return G.hand.filter(function (h) { return h.uid === uid; })[0] || null; }
  function amplifiable(def) { return TLN.data.cards.amplifiable.indexOf(def.id) >= 0; }

  // Quanto costa un'Azione e con quale impulso si paga. Restituisce { payer, n, pt } o { error }
  function costOf(G, def, act, c) {
    var cost = act.cost || {}, pool = G.res.pool, out = { payer: null, n: 0, pt: 0 };
    var x = c && c.x ? Math.floor(c.x) : 1;
    ['forza', 'fuoco', 'presagio'].forEach(function (k) {
      if (cost[k] == null) return;
      out.payer = k; out.n = cost[k] === 'X' ? x : cost[k];
    });
    if (cost.pt != null) out.pt = cost.pt === 'X' ? x : cost.pt;
    if (!out.payer) return out;
    if (out.n < 1) return { error: 'X deve essere almeno 1' };
    // BRIEF 5.3 — Amplificazione Elementale: le carte Vigore si pagano anche con 🔥
    if (out.payer === 'forza' && amplifiable(def)) {
      var want = c && c.pay;
      if (want === 'fuoco' || (!want && pool.forza < out.n && pool.fuoco >= out.n)) out.payer = 'fuoco';
    }
    if (!G.res.active || pool[out.payer] < out.n) return { error: 'Impulsi insufficienti' };
    return out;
  }
  function canPayAny(G, def) {
    if (!G.res.active) return false;
    return def.actions.some(function (a) { return !costOf(G, def, a, { x: 1 }).error; });
  }
  function hasFreeAction(def) {
    return def.actions.some(function (a) { return !a.cost || !Object.keys(a.cost).length; });
  }
  // Serve una scelta (Attacco Strategico) prima che la carta si chiuda da sé
  function needsChoice(G) {
    var o = G.res && G.res.open;
    return !!(o && o.def.onClose === 'strategicReward' && o.hpDamage > 0);
  }
  // Posto in Plancia per una nuova carta, tenendo conto della carta aperta che verrà chiusa
  function spotAfterClose(G, def) {
    var o = G.res.open, assumeStd = 0, fireTaken = false;
    if (o && o.def.cd) {
      var s = E.cards.spotFor(G, o.def);
      if (s === 'fire') fireTaken = true; else assumeStd = 1;
    }
    if (!def.cd) return 'none';
    if (def.fireSlot && !G.plancia.fire && !fireTaken) return 'fire';
    return G.plancia.std.length + assumeStd < TLN.data.equipment.standardSpots ? 'std' : null;
  }

  function closeCard(G, reward) {
    var o = G.res.open;
    if (!o) return;
    if (o.def.onClose === 'strategicReward' && o.hpDamage > 0) {
      var pm = reward ? reward.pm || 0 : 0, sh = o.hpDamage - pm;
      if (pm) S.changeRes(G, 'pm', pm, o.def.name);
      if (sh) S.addStatus(G, G.player, 'shield', sh, o.def.name);
    }
    G.res.open = null;
    if (o.def.cd) E.cards.place(G, o.inst); else G.discard.push(o.inst);
    G.bus.emit('CARD_CLOSE', { card: o.inst.uid, id: o.def.id, toPlancia: !!o.def.cd });
  }
  function autoClose(G) { if (G.res && G.res.open) closeCard(G, null); }

  E.defineCommand('OPEN_CARD', {
    check: function (G, c) {
      if (G.phase !== 'RISOLUZIONE') return 'Non è la Risoluzione';
      var inst = inHand(G, c.card);
      if (!inst) return 'Carta non in mano';
      var def = E.cards.def(inst);
      if (def.free) return 'Carta gratuita: si gioca direttamente';
      if (needsChoice(G)) return 'Chiudi prima la carta aperta';
      if (spotAfterClose(G, def) === null) return 'Nessun posto libero in Plancia';
      if (!hasFreeAction(def) && !canPayAny(G, def)) return 'Serve un dado attivo con impulsi adatti';
      return null;
    },
    run: function (G, c) {
      autoClose(G);
      var inst = inHand(G, c.card), def = E.cards.def(inst);
      G.hand.splice(G.hand.indexOf(inst), 1);
      G.res.open = { inst: inst, def: def, next: 0, usedOnce: {}, usedAny: false, range: def.baseRange || 0, hpDamage: 0, selfVuln: false, drew: false };
      G.res.lastMove = null;
      G.bus.emit('CARD_OPEN', { card: inst.uid, id: def.id });
      if (def.onOpen && def.onOpen.draw) { E.cards.draw(G, def.onOpen.draw, def.name); G.res.open.drew = true; }
    }
  });

  function targetError(G, o, act, c) {
    var p = G.player, t = c.target ? S.unitById(G, c.target) : null;
    if (act.kind === 'attack' || act.kind === 'vulnFire' || act.kind === 'stunPush' || act.kind === 'direct' || act.kind === 'distort') {
      if (!t || !t.alive || t.kind !== 'enemy') return 'Bersaglio non valido';
      var d = G.grid.distance(p.pos, t.pos);
      if (act.target === 'adj' && d !== 1) return 'Il bersaglio deve essere adiacente';
      if (act.target === 'range' && d > o.range) return 'Bersaglio fuori gittata';
    }
    if (act.push && c.push) {
      var ok = C.pushOptions(G, p.pos, t).some(function (x) { return hex.same(x.cell, c.push); });
      if (!ok) return 'Casella di spinta non valida';
    }
    if (act.kind === 'cone' && !(c.dir >= 0 && c.dir < 6)) return 'Orientamento del cono non valido';
    if (act.kind === 'distort') {
      var path = c.path || [];
      if (!path.length || path.length !== (c.x || path.length)) return 'Percorso non valido';
      var prev = t.pos, seen = {};
      for (var i = 0; i < path.length; i++) {
        var cell = path[i], k = hex.key(cell);
        if (G.grid.distance(prev, cell) !== 1 || seen[k]) return 'Percorso non valido';
        var u = S.unitAt(G, cell);
        if (!G.grid.inGrid(cell) || S.blocking(G, cell) || (u && u !== t)) return 'Casella occupata sul percorso';
        seen[k] = true; prev = cell;
      }
    }
    return null;
  }
  function defaultPush(G, t) {
    var opts = C.pushOptions(G, G.player.pos, t);
    var free = opts.filter(function (o) { return o.status === 'free'; })[0];
    return (free || opts[0]).cell;
  }

  E.defineCommand('USE_ACTION', {
    check: function (G, c) {
      var o = G.res && G.res.open;
      if (G.phase !== 'RISOLUZIONE' || !o) return 'Nessuna carta aperta';
      var act = o.def.actions[c.action];
      if (!act) return 'Azione inesistente';
      if (c.action < o.next) return 'Non si torna a un\'Azione precedente';
      var free = !act.cost || !Object.keys(act.cost).length;
      if (free && o.usedOnce[c.action]) return 'Azione gratuita già usata';
      if (act.kind === 'distort') c = Object.assign({}, c, { x: (c.path || []).length });
      var cost = costOf(G, o.def, act, c);
      if (cost.error) return cost.error;
      return targetError(G, o, act, c);
    },
    run: function (G, c) {
      var o = G.res.open, def = o.def, act = def.actions[c.action], p = G.player;
      if (act.kind === 'distort') c = Object.assign({}, c, { x: c.path.length });
      var cost = costOf(G, def, act, c);
      var free = !act.cost || !Object.keys(act.cost).length;
      if (cost.payer) { G.res.pool[cost.payer] -= cost.n; G.bus.emit('POOL', { pool: Object.assign({}, G.res.pool) }); }
      o.next = free ? c.action + 1 : c.action;
      if (free) o.usedOnce[c.action] = true;
      o.usedAny = true;
      G.res.lastMove = null;
      G.bus.emit('CARD_ACTION', { card: o.inst.uid, id: def.id, action: c.action, target: c.target || null, payer: cost.payer, n: cost.n });
      if (cost.pt) S.changeRes(G, 'pt', -cost.pt, def.name);
      if (G.over) return;
      // Attacco Poderoso: Vulnerabilità su di te, una volta per attivazione
      if (def.selfVuln && !o.selfVuln) { o.selfVuln = true; S.addStatus(G, p, 'vuln', 1, def.name); }
      var t = c.target ? S.unitById(G, c.target) : null;
      var amp = cost.payer === 'fuoco' && amplifiable(def) && !o.ampUsed;
      if (amp && act.kind === 'attack') o.ampUsed = true;
      switch (act.kind) {
        case 'attack': {
          var dmg = act.dmg + (amp ? TLN.data.cards.amplifyBonus : 0);
          var r = C.damage(G, t, dmg, { dtype: amp ? 'fire' : (act.dtype || 'normal'), source: p, cause: def.name });
          if (def.onClose === 'strategicReward') o.hpDamage += r.hpLoss;
          if (act.push && t.alive && !G.over) C.push(G, p, t, c.push || defaultPush(G, t));
          break;
        }
        case 'draw': E.cards.draw(G, act.n, def.name); break;
        case 'shield': S.addStatus(G, p, 'shield', act.n, def.name); break;
        case 'jump': S.changeRes(G, 'jump', act.n, def.name); break;
        case 'range': o.range += act.n; G.bus.emit('CARD_RANGE', { range: o.range }); break;
        case 'direct': C.damage(G, t, cost.n, { direct: true, source: p, cause: def.name }); break;
        case 'vulnFire': S.addStatus(G, t, 'vulnFire', 1, def.name); break;
        case 'stunPush':
          S.addStatus(G, t, 'stun', 1, def.name);
          C.push(G, p, t, c.push || defaultPush(G, t));
          break;
        case 'distort': C.moveAlong(G, t, c.path, 'distort'); break; // D9: nessuna Collisione
        case 'cone': {
          var cells = G.grid.cone(p.pos, c.dir, act.range);
          G.bus.emit('CONE', { from: p.pos.slice(), dir: c.dir, cells: cells });
          cells.forEach(function (cell) {
            var u = S.unitAt(G, cell);
            if (u && u.kind === 'enemy' && !G.over) C.damage(G, u, act.dmg, { dtype: 'fire', source: p, cause: def.name });
          });
          break;
        }
      }
    }
  });

  E.defineCommand('CLOSE_CARD', {
    check: function (G, c) {
      if (!G.res || !G.res.open) return 'Nessuna carta aperta';
      var o = G.res.open;
      if (needsChoice(G) && c.reward) {
        var pm = c.reward.pm || 0;
        if (pm < 0 || pm > o.hpDamage) return 'Scelta non valida';
      }
      return null;
    },
    run: function (G, c) { closeCard(G, c.reward || { pm: 0 }); }
  });

  E.defineCommand('CANCEL_CARD', {
    check: function (G) {
      var o = G.res && G.res.open;
      if (!o) return 'Nessuna carta aperta';
      if (o.usedAny || o.drew) return 'La carta è già stata usata';
      return null;
    },
    run: function (G) {
      var o = G.res.open;
      G.res.open = null;
      G.hand.push(o.inst);
      G.bus.emit('CARD_CANCEL', { card: o.inst.uid, id: o.def.id });
    }
  });

  E.cardFx = { costOf: costOf, canPayAny: canPayAny, needsChoice: needsChoice, closeCard: closeCard, autoClose: autoClose, spotAfterClose: spotAfterClose, defaultPush: defaultPush, inHand: inHand };
})(typeof window !== 'undefined' ? window : globalThis);
