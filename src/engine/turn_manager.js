// THE LONG NIGHT — le 5 fasi del turno (BRIEF 6.2; decisioni D4, D5)
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  var E = TLN.engine = TLN.engine || {};
  var S = E.state;

  function setPhase(G, ph) {
    G.phase = ph;
    G.bus.emit('PHASE', { phase: ph, turn: G.turn });
  }

  function startRoom(G) {
    E.cards.setupDeck(G);
    G.bus.emit('ROOM_START', {
      room: G.room.id, name: G.room.name, veglia: G.room.veglia,
      player: { hp: G.player.hp, pt: G.player.pt, pm: G.player.pm, luce: G.player.luce }
    });
    startTurn(G);
  }

  // Fase 1 — Lancio
  function startTurn(G) {
    if (G.over) return;
    G.turn++;
    G.ecoDiscarded = [];
    G.res = null;
    setPhase(G, 'LANCIO');
    G.bus.emit('TURN_START', { turn: G.turn, veglia: G.room.veglia });
    var v = G.room.veglia;
    if (v != null && G.turn === v) G.bus.emit('VEGLIA_LAST', { turn: G.turn });
    if (v != null && G.turn > v) {
      G.bus.emit('BUIO', { turn: G.turn });
      S.changeRes(G, 'pt', -G.cfg.darkPenaltyPT, 'Buio');
      if (G.over) return;
    }
    E.ai.applyArmor(G);
    E.dice.roll(G);
    if (G.turn === 1) { afterEndTurn(G); return; } // Fase 2 saltata al turno 1
    // Fase 2 — Fine Turno (D5, Q1 confermata 2026-11-18): Rotazione Stati → Scarto volontario ed Eco → escono le carte a 0° → le altre ruotano
    [G.player].concat(S.aliveEnemies(G)).forEach(S.rotateStatus);
    G.bus.emit('STATUS_ROTATED', {});
    setPhase(G, 'FINE_TURNO');
  }

  // Dopo Scarto/Eco (e Rotazione CD, fatta da ECO_DONE): Fase 3 Preparazione, poi Fase 4 Selezione
  function afterEndTurn(G) {
    if (G.over) return;
    setPhase(G, 'PREPARAZIONE');
    E.cards.preparation(G);
    if (G.over) return;
    setPhase(G, 'SELEZIONE');
    G.bus.emit('SELECTION_START', {
      turn: G.turn, coverage: E.dice.coverage(G), luce: G.player.luce,
      plancia: E.cards.entries(G).map(function (e) { return { id: e.id, kind: e.kind, cd: e.cd, spot: e === G.plancia.fire ? 'fire' : 'std' }; })
    });
  }

  // Fase 5 — Risoluzione
  function beginResolution(G) {
    if (G.over) return;
    E.resolution.initRes(G);
    setPhase(G, 'RISOLUZIONE');
  }

  function endTurn(G) {
    var p = G.player;
    if (p.jump) S.changeRes(G, 'jump', -p.jump, 'Fine turno'); // i PM Salto non usati si perdono
    G.bus.emit('TURN_END', {
      turn: G.turn, hp: p.hp, pt: p.pt, luce: p.luce, pm: p.pm,
      plancia: E.cards.entries(G).map(function (e) { return { id: e.id, cd: e.cd }; })
    });
    startTurn(G);
  }

  E.turn = { startRoom: startRoom, startTurn: startTurn, afterEndTurn: afterEndTurn, beginResolution: beginResolution, endTurn: endTurn, setPhase: setPhase };
})(typeof window !== 'undefined' ? window : globalThis);
