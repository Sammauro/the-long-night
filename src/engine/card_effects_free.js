// THE LONG NIGHT — carte gratuite da finestra libera: Infusione, Manipolazione Destino, Carica Furiosa (BRIEF 5.3, 6.4)
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  var E = TLN.engine = TLN.engine || {};
  var S = E.state, C = E.combat, hex = E.hex;

  function seqDie(G, uid) { return G.seq.filter(function (d) { return d.uid === uid; })[0] || null; }
  function unresolvedPlayerDie(d) { return d && d.owner === 'P' && d.state === 'pending'; }

  // Carica Furiosa: due dadi giocatore non risolti, consecutivi nella Sequenza attuale
  function chargePairs(G) {
    var out = [];
    for (var i = 0; i + 1 < G.seq.length; i++) {
      var a = G.seq[i], b = G.seq[i + 1];
      if (unresolvedPlayerDie(a) && unresolvedPlayerDie(b)) out.push([a.uid, b.uid]);
    }
    return out;
  }
  // Caselle percorribili in linea retta (solo caselle libere; le trappole sono attraversabili e scattano)
  function chargeLine(G, dir, max) {
    var out = [], c = G.player.pos;
    for (var i = 0; i < max; i++) {
      c = G.grid.step(c, dir);
      if (!S.isFree(G, c)) break;
      out.push(c);
    }
    return out;
  }

  function checkFree(G, c) {
    if (G.phase !== 'RISOLUZIONE') return 'Non è la Risoluzione';
    // Q3: giocabili anche con un dado attivo, purché nessuna carta sia aperta
    if (G.res.open) return 'Completa prima la carta aperta';
    var inst = E.cardFx.inHand(G, c.card);
    if (!inst) return 'Carta non in mano';
    var def = E.cards.def(inst);
    if (!def.free) return 'Non è una carta gratuita';
    if (E.cardFx.needsChoice(G)) return 'Chiudi prima la carta aperta';
    if (E.cardFx.spotAfterClose(G, def) === null) return 'Nessun posto libero in Plancia';
    var d;
    if (def.free === 'infuse') {
      d = seqDie(G, c.die);
      if (!unresolvedPlayerDie(d) || d.kind === 'terrore') return 'Serve un tuo dado non-Terrore non risolto';
    } else if (def.free === 'fate') {
      d = seqDie(G, c.die);
      if (!unresolvedPlayerDie(d)) return 'Serve un tuo dado non risolto';
      var faces = TLN.data.dice.types[d.infused ? d.baseKind : d.kind].faces;
      if (faces.indexOf(c.face) < 0) return 'Faccia non valida';
    } else if (def.free === 'charge') {
      if (S.adjacentEnemies(G, G.player.pos).length) return 'Sei adiacente a un nemico';
      var pair = c.dice || [];
      var ok = chargePairs(G).some(function (p) { return p[0] === pair[0] && p[1] === pair[1]; });
      if (!ok) return 'Servono due tuoi dadi adiacenti e non risolti';
      if (!(c.dir >= 0 && c.dir < 6)) return 'Direzione non valida';
      var sum = E.dice.impulses(seqDie(G, pair[0])) + E.dice.impulses(seqDie(G, pair[1]));
      var line = chargeLine(G, c.dir, sum);
      if (!(c.dist >= 1 && c.dist <= line.length)) return 'Distanza non valida';
      if (c.target) {
        var t = S.unitById(G, c.target), end = line[c.dist - 1];
        if (!t || !t.alive || t.kind !== 'enemy' || G.grid.distance(t.pos, end) !== 1) return 'Bersaglio non adiacente all\'arrivo';
      }
    }
    return null;
  }

  E.defineCommand('FREE_CARD', {
    check: checkFree,
    run: function (G, c) {
      E.cardFx.autoClose(G);
      var inst = E.cardFx.inHand(G, c.card), def = E.cards.def(inst), p = G.player;
      G.hand.splice(G.hand.indexOf(inst), 1);
      G.res.lastMove = null;
      G.bus.emit('CARD_OPEN', { card: inst.uid, id: def.id, free: true });
      var d;
      if (def.free === 'infuse') {
        // BRIEF 3 — il dado convertito è un dado Fuoco a tutti gli effetti
        d = seqDie(G, c.die);
        d.baseKind = d.infused ? d.baseKind : d.kind;
        d.kind = 'fuoco'; d.infused = true; d.bonus += def.bonus;
        G.bus.emit('DIE_CHANGED', { die: d.uid, kind: d.kind, value: d.value, bonus: d.bonus, cause: def.name });
      } else if (def.free === 'fate') {
        d = seqDie(G, c.die);
        d.value = c.face;
        G.bus.emit('DIE_CHANGED', { die: d.uid, kind: d.kind, value: d.value, bonus: d.bonus, cause: def.name });
        S.changeRes(G, 'pt', -def.ptCost, def.name);
      } else if (def.free === 'charge') {
        var a = seqDie(G, c.dice[0]), b = seqDie(G, c.dice[1]);
        var sum = E.dice.impulses(a) + E.dice.impulses(b);
        a.state = 'consumed'; b.state = 'consumed';
        G.bus.emit('DIE_CONSUMED', { dice: [a.uid, b.uid], cause: def.name });
        var path = chargeLine(G, c.dir, sum).slice(0, c.dist);
        C.moveAlong(G, p, path, 'charge');
        if (p.alive && !G.over) {
          var adj = S.adjacentEnemies(G, p.pos);
          var t = c.target ? S.unitById(G, c.target) : adj[0];
          if (t && t.alive && G.grid.distance(t.pos, p.pos) === 1) {
            C.damage(G, t, path.length, { dtype: 'normal', source: p, cause: def.name });
          }
        }
      }
      E.cards.place(G, inst);
      G.bus.emit('CARD_CLOSE', { card: inst.uid, id: def.id, toPlancia: true });
    }
  });

  E.freeCards = { chargePairs: chargePairs, chargeLine: chargeLine, seqDie: seqDie, unresolvedPlayerDie: unresolvedPlayerDie };
})(typeof window !== 'undefined' ? window : globalThis);
