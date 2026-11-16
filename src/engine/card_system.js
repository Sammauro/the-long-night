// THE LONG NIGHT — mazzo, mano, Plancia, Eco, Rotazione CD (BRIEF 6.2 Fasi 2–3, 6.5)
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  var E = TLN.engine = TLN.engine || {};
  var S = E.state;

  function def(inst) { return TLN.data.cards.byId[inst.id]; }

  function setupDeck(G) {
    var deck = [], n = 0;
    TLN.data.cards.list.forEach(function (c) {
      for (var i = 0; i < c.copies; i++) deck.push({ uid: 'c' + (++n), id: c.id });
    });
    G.rng.shuffle(deck);
    var sc = G.script;
    if (sc && sc.openingHand) {
      // BRIEF 9.1 — mano iniziale, poi la cima del mazzo nell'ordine; il resto mescolato
      var front = [];
      sc.openingHand.concat(sc.deckTop || []).forEach(function (id) {
        for (var i = 0; i < deck.length; i++) if (deck[i].id === id) { front.push(deck.splice(i, 1)[0]); return; }
      });
      deck = front.concat(deck);
    }
    G.deck = deck; G.hand = []; G.discard = []; G.plancia = { std: [], fire: null };
  }

  // BRIEF 6.5 — pesca dalla cima; se il mazzo è vuoto la pesca fallisce
  function draw(G, n, cause) {
    var got = 0;
    for (var i = 0; i < n; i++) {
      if (!G.deck.length) { G.bus.emit('DRAW_FAIL', { cause: cause || null }); break; }
      var c = G.deck.shift();
      G.hand.push(c); got++;
      G.bus.emit('DRAW', { card: c.uid, id: c.id, cause: cause || null });
    }
    return got;
  }
  function drawSpecific(G, ids, cause) {
    ids.forEach(function (id) {
      if (G.hand.length >= G.cfg.handLimit) return;
      for (var i = 0; i < G.deck.length; i++) {
        if (G.deck[i].id === id) {
          var c = G.deck.splice(i, 1)[0];
          G.hand.push(c);
          G.bus.emit('DRAW', { card: c.uid, id: c.id, cause: cause || null });
          return;
        }
      }
    });
  }
  // BRIEF 6.2 Fase 3 — pesca fino al limite, poi rimescola gli scarti nel mazzo
  function preparation(G) {
    var sd = G.script && G.turn <= G.script.scriptedTurns && G.script.draws && G.script.draws[G.turn];
    if (sd) drawSpecific(G, sd, 'Preparazione');
    if (G.hand.length < G.cfg.handLimit) draw(G, G.cfg.handLimit - G.hand.length, 'Preparazione');
    if (G.discard.length) {
      G.deck = G.rng.shuffle(G.deck.concat(G.discard));
      G.discard = [];
      G.bus.emit('RESHUFFLE', { deck: G.deck.length });
    }
  }

  // ── Plancia ──
  function entries(G) { return G.plancia.std.concat(G.plancia.fire ? [G.plancia.fire] : []); }
  function findEntry(G, pid) { return entries(G).filter(function (e) { return e.pid === pid; })[0] || null; }
  // BRIEF 6.5 — carta Fuoco: slot Fuoco se libero, altrimenti posto standard (max 3)
  function spotFor(G, cardDef, assumeStd) {
    if (!cardDef.cd) return 'none';
    var stdUsed = G.plancia.std.length + (assumeStd || 0);
    if (cardDef.fireSlot && !G.plancia.fire) return 'fire';
    if (stdUsed < TLN.data.equipment.standardSpots) return 'std';
    return null;
  }
  function newPid(G) { G.planciaSeq++; return 'pl' + G.planciaSeq; }
  function place(G, inst) {
    var cd = def(inst);
    var spot = spotFor(G, cd);
    var entry = { pid: newPid(G), kind: 'card', inst: inst, id: inst.id, cd: cd.cd, max: cd.cd };
    if (spot === 'fire') G.plancia.fire = entry; else G.plancia.std.push(entry);
    G.bus.emit('PLANCIA', { op: 'place', pid: entry.pid, card: inst.id, spot: spot, cd: entry.cd });
    if (G.plancia.std.length >= TLN.data.equipment.standardSpots) G.bus.emit('PLANCIA_FULL', {});
  }
  // BRIEF 5.4 — Sigillo: come una carta in CD residuo 1 tra le standard; uscendo sparisce
  function addSeal(G) {
    if (G.plancia.std.length >= TLN.data.equipment.standardSpots) return false;
    var entry = { pid: newPid(G), kind: 'seal', id: 'seal', cd: 1, max: 1 };
    G.plancia.std.push(entry);
    G.bus.emit('PLANCIA', { op: 'seal', pid: entry.pid, cd: 1 });
    return true;
  }
  // BRIEF 3 — "Ruota" e "Avanza" 1 carta in CD: −1 al CD residuo
  function rotateEntry(G, pid, cause) {
    var e = findEntry(G, pid);
    if (!e || e.cd <= 0) return false;
    e.cd -= 1;
    G.bus.emit('PLANCIA', { op: 'rotate', pid: pid, cd: e.cd, cause: cause || null });
    return true;
  }
  function defaultRotateTarget(G) {
    var best = null;
    entries(G).forEach(function (e) { if (e.cd > 0 && (!best || e.cd < best.cd)) best = e; });
    return best ? best.pid : null;
  }
  // BRIEF 6.2 Fase 2.4 — escono le voci a CD 0 (carte negli scarti, Sigilli spariscono), le altre scendono di 1
  function cdRotation(G) {
    function step(e) {
      if (e.cd <= 0) {
        if (e.kind === 'card') G.discard.push(e.inst);
        G.bus.emit('PLANCIA', { op: 'exit', pid: e.pid, card: e.id });
        return false;
      }
      e.cd -= 1;
      G.bus.emit('PLANCIA', { op: 'tick', pid: e.pid, cd: e.cd });
      return true;
    }
    G.plancia.std = G.plancia.std.filter(step);
    if (G.plancia.fire && !step(G.plancia.fire)) G.plancia.fire = null;
  }

  // ── Eco (BRIEF 6.2 Fase 2.2–2.3) ──
  function applyEco(G, inst, c) {
    var d = def(inst), out = [];
    d.eco.forEach(function (fx) {
      if (G.over) return;
      if (fx.pm) { S.changeRes(G, 'pm', fx.pm, 'Eco'); out.push('+' + fx.pm + ' PM'); }
      if (fx.luce) { S.changeRes(G, 'luce', fx.luce, 'Eco'); out.push('+' + fx.luce + ' Luce'); }
      if (fx.status) { S.addStatus(G, G.player, fx.status, fx.n, 'Eco'); out.push('+' + fx.n + ' ' + fx.status); }
      if (fx.draw) { draw(G, fx.draw, 'Eco'); out.push('pesca ' + fx.draw); }
      if (fx.rotate) {
        var pid = c.rotate || defaultRotateTarget(G);
        if (pid && rotateEntry(G, pid, 'Eco')) out.push('ruota ' + pid);
      }
      if (fx.rotateAll) { entries(G).forEach(function (e) { rotateEntry(G, e.pid, 'Eco'); }); out.push('ruota tutte'); }
    });
    return out;
  }

  E.defineCommand('ECO_DISCARD', {
    check: function (G, c) {
      if (G.phase !== 'FINE_TURNO') return 'Non è la Fine Turno';
      if (!G.hand.some(function (h) { return h.uid === c.card; })) return 'Carta non in mano';
      if (c.rotate && !findEntry(G, c.rotate)) return 'Voce di Plancia inesistente';
      return null;
    },
    run: function (G, c) {
      var i = G.hand.map(function (h) { return h.uid; }).indexOf(c.card);
      var inst = G.hand.splice(i, 1)[0];
      G.discard.push(inst);
      G.ecoDiscarded.push(inst.id);
      G.bus.emit('ECO_DISCARD', { card: inst.uid, id: inst.id });
      var fx = applyEco(G, inst, c);
      G.bus.emit('ECO', { card: inst.uid, id: inst.id, effects: fx });
    }
  });

  E.defineCommand('ECO_DONE', {
    check: function (G) { return G.phase !== 'FINE_TURNO' ? 'Non è la Fine Turno' : null; },
    run: function (G) {
      cdRotation(G);
      E.turn.afterEndTurn(G);
    }
  });

  E.cards = {
    def: def, setupDeck: setupDeck, draw: draw, preparation: preparation, entries: entries, findEntry: findEntry,
    spotFor: spotFor, place: place, addSeal: addSeal, rotateEntry: rotateEntry, cdRotation: cdRotation,
    defaultRotateTarget: defaultRotateTarget, applyEco: applyEco
  };
})(typeof window !== 'undefined' ? window : globalThis);
