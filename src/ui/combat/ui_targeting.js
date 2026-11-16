// THE LONG NIGHT — puntamento: caselle raggiungibili, bersagli, spinte, cono, percorsi, carte gratuite (BRIEF 7)
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  var UI = TLN.ui = TLN.ui || {};
  var u = UI.util, E = function () { return TLN.engine; }, S = function () { return TLN.engine.state; };
  var key = function (c) { return c[0] + ',' + c[1]; };

  function G() { return UI.st.G; }
  function act() { var m = UI.st.mode; return m && m.kind === 'action' ? G().res.open.def.actions[m.i] : null; }
  function payOpt() { return UI.st.payFire ? 'fuoco' : undefined; }
  function enemies() { return S().aliveEnemies(G()); }
  function legal(cmd) { return !E().check(G(), cmd); }

  // ── avvio delle modalità ──
  function start(mode) { UI.st.mode = mode; UI.refresh(); }
  function cancel() { UI.st.mode = null; UI.refresh(); }
  function startAction(i) {
    var a = G().res.open.def.actions[i];
    if (!a.target && a.kind !== 'cone') { UI.send({ type: 'USE_ACTION', action: i, pay: payOpt() }); return; }
    start({ kind: 'action', i: i, step: a.kind === 'cone' ? 'cone' : 'target', path: [] });
  }

  // Bersagli validi per la modalità corrente
  function targets() {
    var m = UI.st.mode, g = G();
    if (!m) return [];
    if (m.kind === 'ranged') return enemies().filter(function (e) { return legal({ type: 'MANEUVER', kind: 'ranged', target: e.id }); });
    if (m.kind === 'action' && m.step === 'target') {
      var a = act();
      return enemies().filter(function (e) {
        var c = { type: 'USE_ACTION', action: m.i, target: e.id, pay: payOpt(), x: 1 };
        if (a.kind === 'distort') { var n = g.grid.neighbors(e.pos).filter(function (x) { return S().isFree(g, x); })[0]; if (!n) return false; c.path = [n]; }
        return legal(c);
      });
    }
    return [];
  }
  function pushCells() {
    var m = UI.st.mode; if (!m || m.step !== 'push') return [];
    return E().combat.pushOptions(G(), G().player.pos, S().unitById(G(), m.target));
  }
  function coneDirFor(cell) {
    var g = G(), best = -1;
    for (var d = 0; d < 6; d++) if (g.grid.cone(g.player.pos, d, 3).some(function (c) { return c[0] === cell[0] && c[1] === cell[1]; })) {
      if (best < 0 || g.grid.distance(cell, g.grid.step(g.player.pos, d)) < g.grid.distance(cell, g.grid.step(g.player.pos, best))) best = d;
    }
    return best;
  }
  function chargeLines() {
    var m = UI.st.mode, g = G(), out = [];
    var a = E().freeCards.seqDie(g, m.dice[0]), b = E().freeCards.seqDie(g, m.dice[1]);
    var sum = E().dice.impulses(a) + E().dice.impulses(b);
    for (var d = 0; d < 6; d++) E().freeCards.chargeLine(g, d, sum).forEach(function (c, i) { out.push({ cell: c, dir: d, dist: i + 1 }); });
    return out;
  }

  // ── evidenziazioni sulla griglia ──
  function highlights() {
    var g = G(), m = UI.st.mode, list = [], labels = [];
    if (!g) return { list: list, labels: labels };
    if (g.phase === 'RISOLUZIONE' && !m) {
      var reach = E().resolution.reachable(g);
      Object.keys(reach).forEach(function (k) { var r = reach[k]; list.push({ cell: r.cell, kind: r.trap ? 'danger' : 'reach' }); labels.push({ cell: r.cell, text: (r.pm ? r.pm : '') + (r.jump ? '⤴' + r.jump : ''), cls: 'cost' }); });
    }
    targets().forEach(function (e) { list.push({ cell: e.pos, kind: 'target' }); });
    pushCells().forEach(function (o) {
      if (o.status !== 'wall') list.push({ cell: o.cell, kind: 'push' });
      labels.push({ cell: o.cell, text: o.status === 'free' ? 'spingi' : 'Collisione', cls: o.status === 'free' ? 'push' : 'coll' });
    });
    if (m && m.step === 'cone' && m.dir != null) G().grid.cone(g.player.pos, m.dir, 3).forEach(function (c) { list.push({ cell: c, kind: 'cone' }); });
    if (m && m.step === 'path') {
      m.path.forEach(function (c, i) { list.push({ cell: c, kind: 'path' }); labels.push({ cell: c, text: String(i + 1), cls: 'cost' }); });
      if (m.path.length < g.res.pool.presagio) pathNext().forEach(function (c) { list.push({ cell: c, kind: 'reach' }); });
    }
    if (m && m.kind === 'free' && m.step === 'dir') chargeLines().forEach(function (l) { list.push({ cell: l.cell, kind: 'reach' }); labels.push({ cell: l.cell, text: String(l.dist), cls: 'cost' }); });
    var pv = UI.sequence.previewInfo();
    if (pv && pv.enemy) {
      list.push({ cell: pv.enemy.pos, kind: 'select' });
      pv.pv.path.forEach(function (c) { list.push({ cell: c, kind: 'path' }); });
      if (pv.pv.reach && (pv.pv.dmg || pv.pv.ptLoss || pv.pv.steal)) list.push({ cell: g.player.pos, kind: 'danger' });
    }
    return { list: list, labels: labels };
  }
  function pathNext() {
    var m = UI.st.mode, g = G(), t = S().unitById(g, m.target), end = m.path.length ? m.path[m.path.length - 1] : t.pos;
    return g.grid.neighbors(end).filter(function (c) {
      var o = S().unitAt(g, c);
      return !S().blocking(g, c) && (!o || o === t) && !(c[0] === t.pos[0] && c[1] === t.pos[1]) && !m.path.some(function (x) { return x[0] === c[0] && x[1] === c[1]; });
    });
  }

  // ── clic su casella / unità / dado ──
  function onCell(c) {
    var g = G(), m = UI.st.mode; if (!g || UI.st.busy) return;
    var unit = S().unitAt(g, c);
    if (!m) {
      // al tocco la scheda si apre solo con il tocco prolungato (input_handler.js)
      if (unit && unit.kind === 'enemy') { if (!UI.st.touch) { UI.st.selectedEnemy = unit.id; UI.refresh(); } return; }
      if (g.phase === 'RISOLUZIONE' && E().resolution.reachable(g)[key(c)]) {
        if (E().cardFx.needsChoice(g)) { UI.cards.askReward(); return; }
        UI.send({ type: 'MOVE', to: c });
      }
      return;
    }
    if (unit && unit.kind === 'enemy' && (m.kind === 'ranged' || m.step === 'target')) { onUnit(unit.id); return; }
    if (m.step === 'push') {
      var o = pushCells().filter(function (x) { return x.cell[0] === c[0] && x.cell[1] === c[1]; })[0];
      if (o) UI.send({ type: 'USE_ACTION', action: m.i, target: m.target, push: c, pay: payOpt() });
      return;
    }
    if (m.step === 'cone') {
      var d = coneDirFor(c); if (d < 0) return;
      if (m.dir === d || !UI.st.touch) UI.send({ type: 'USE_ACTION', action: m.i, dir: d }); else { m.dir = d; UI.refresh(); }
      return;
    }
    if (m.step === 'path') {
      if (!pathNext().some(function (x) { return x[0] === c[0] && x[1] === c[1]; })) return;
      if (m.path.length >= g.res.pool.presagio) return;
      m.path.push(c); UI.refresh();
      return;
    }
    if (m.kind === 'free' && m.step === 'dir') {
      var l = chargeLines().filter(function (x) { return x.cell[0] === c[0] && x.cell[1] === c[1]; })[0]; if (!l) return;
      var end = l.cell, adj = enemies().filter(function (e) { return g.grid.distance(e.pos, end) === 1; });
      var send = function (t) { UI.send({ type: 'FREE_CARD', card: m.card, dice: m.dice, dir: l.dir, dist: l.dist, target: t }); };
      if (adj.length > 1) UI.choose('Chi colpisci alla fine della Carica?', adj.map(function (e) { return { label: u.unitName(e.id), fn: function () { send(e.id); } }; }));
      else send(adj[0] ? adj[0].id : undefined);
    }
  }
  function onUnit(id) {
    var m = UI.st.mode, g = G();
    if (!m) { UI.st.selectedEnemy = id; UI.refresh(); return; }
    if (!targets().some(function (e) { return e.id === id; })) return;
    if (m.kind === 'ranged') { UI.send({ type: 'MANEUVER', kind: 'ranged', target: id }); return; }
    var a = act();
    if (a.push) { m.target = id; m.step = 'push'; UI.refresh(); return; }
    if (a.kind === 'distort') { m.target = id; m.step = 'path'; m.path = []; UI.refresh(); return; }
    if (a.kind === 'direct') {
      var n = g.res.pool.presagio, opts = [];
      for (var x = 1; x <= n; x++) (function (x) { opts.push({ label: x + ' 🔮 + ' + x + ' PT → ' + x + ' Danni', fn: function () { UI.confirmPT(x, function () { UI.send({ type: 'USE_ACTION', action: m.i, target: id, x: x }); }); } }); })(x);
      opts.push({ label: 'Annulla', cls: 'ghost', fn: cancel });
      UI.choose('Profondità Mente su ' + u.unitName(id), opts);
      return;
    }
    UI.send({ type: 'USE_ACTION', action: m.i, target: id, pay: payOpt() });
  }
  function confirmPath() {
    var m = UI.st.mode; if (!m || !m.path.length) return;
    UI.confirmPT(1, function () { UI.send({ type: 'USE_ACTION', action: m.i, target: m.target, path: m.path }); });
  }

  function wantsDie(d) {
    var m = UI.st.mode; if (!m || m.kind !== 'free' || d.owner !== 'P' || d.state !== 'pending') return false;
    if (m.free === 'infuse') return d.kind !== 'terrore';
    if (m.free === 'fate') return true;
    if (m.free === 'charge') {
      if (m.step === 'dir') return false;
      var pairs = E().freeCards.chargePairs(G());
      if (!m.first) return pairs.some(function (p) { return p[0] === d.uid || p[1] === d.uid; });
      return pairs.some(function (p) { return (p[0] === m.first && p[1] === d.uid) || (p[1] === m.first && p[0] === d.uid); });
    }
    return false;
  }
  function onDie(d) {
    var m = UI.st.mode;
    if (m.free === 'infuse') { UI.send({ type: 'FREE_CARD', card: m.card, die: d.uid }); return; }
    if (m.free === 'fate') {
      var faces = TLN.data.dice.types[d.infused ? d.baseKind : d.kind].faces.filter(function (f, i, a) { return a.indexOf(f) === i; });
      UI.choose('Manipolazione Destino (1 PT): faccia per ' + u.dieText(d), faces.map(function (f) {
        return { label: String(f), fn: function () { UI.confirmPT(1, function () { UI.send({ type: 'FREE_CARD', card: m.card, die: d.uid, face: f }); }); } };
      }).concat([{ label: 'Annulla', cls: 'ghost', fn: cancel }]));
      return;
    }
    if (m.free === 'charge') {
      if (!m.first) { m.first = d.uid; UI.refresh(); return; }
      var idx = function (uid) { return G().seq.map(function (x) { return x.uid; }).indexOf(uid); };
      m.dice = idx(m.first) < idx(d.uid) ? [m.first, d.uid] : [d.uid, m.first];
      m.step = 'dir'; UI.refresh();
    }
  }

  function instructions() {
    var m = UI.st.mode; if (!m) return null;
    if (m.kind === 'ranged') return 'Colpo a Distanza: scegli un nemico entro 3 caselle.';
    if (m.kind === 'ecoRotate') return 'Scegli la carta in Plancia da ruotare.';
    if (m.kind === 'free') {
      if (m.free === 'infuse') return 'Infusione Elementale: tocca un tuo dado non-Terrore non risolto.';
      if (m.free === 'fate') return 'Manipolazione Destino: tocca un tuo dado non risolto.';
      if (m.step === 'dir') return 'Carica Furiosa: tocca la casella d\'arrivo su una delle sei linee.';
      return m.first ? 'Carica Furiosa: tocca il secondo dado, adiacente al primo.' : 'Carica Furiosa: tocca due tuoi dadi adiacenti nella Sequenza.';
    }
    if (m.step === 'push') return 'Scegli dove spingere (Collisione se occupata o muro).';
    if (m.step === 'cone') return UI.st.touch ? 'Tocca una casella per orientare il cono, tocca di nuovo per confermare.' : 'Muovi il puntatore per orientare il cono, clic per confermare.';
    if (m.step === 'path') return 'Distorsione: traccia il percorso, una casella alla volta (' + m.path.length + '/' + G().res.pool.presagio + ').';
    return 'Scegli il bersaglio.';
  }
  function onHover(c) {
    var m = UI.st.mode;
    if (m && m.step === 'cone' && c) { var d = coneDirFor(c); if (d >= 0 && d !== m.dir) { m.dir = d; UI.refreshGrid(); } }
  }

  UI.targeting = { start: start, cancel: cancel, startAction: startAction, highlights: highlights, onCell: onCell, onUnit: onUnit,
    wantsDie: wantsDie, onDie: onDie, instructions: instructions, onHover: onHover, confirmPath: confirmPath, targets: targets };
})(typeof window !== 'undefined' ? window : globalThis);
