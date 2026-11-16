// THE LONG NIGHT — avvio: collega motore, comandi, eventi, scena e interfaccia (BRIEF 4)
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  var UI = TLN.ui = TLN.ui || {};
  var u = UI.util;

  var COMMANDS = ['SEL_TOGGLE', 'SEL_CONFIRM', 'INSPECT_DIE', 'ECO_DISCARD', 'ECO_DONE', 'OPEN_CARD', 'USE_ACTION', 'CLOSE_CARD', 'CANCEL_CARD',
    'FREE_CARD', 'MOVE', 'UNDO_MOVE', 'MANEUVER', 'ADVANCE', 'SOGLIA_CHOOSE'];

  function params() {
    var q = new URLSearchParams(location.search);
    return { equip: q.get('equip') === 'rev11' ? 'rev11' : null, seed: q.get('seed') ? +q.get('seed') : null, room: q.get('room') };
  }

  // Avvia una run: start = 'r0' (con tutorial) o 'r1'
  function startRun(start, opts) {
    opts = opts || {};
    var p = params(), st = UI.st;
    var bus = TLN.engine.createEventBus();
    bus.onAny(function (ev) {
      st.queue.push(ev);
      UI.log.onEvent(ev);
      if (ev.type === 'DICE_ROLLED') st.justRolled = true;
      if (ev.type === 'ROOM_START') st.roomChanged = true;
      UI.onEngineEvent && UI.onEngineEvent(ev);
    });
    UI.log.clear();
    UI.collector = TLN.balancing.createCollector().attach(bus);
    var cmd = TLN.input.createCommandBus();
    COMMANDS.forEach(function (t) { cmd.register(t, function (c) { return TLN.engine.run.execute(st.run, c); }); });
    st.cmd = cmd; st.bus = bus; st.mode = null; st.staged = []; st.preview = null; st.pinned = false; st.selectedEnemy = null;
    var seed = opts.seed || p.seed || TLN.engine.freshSeed();
    st.run = TLN.engine.run.createRun({ seed: seed, start: start, equipPreset: p.equip || undefined, bus: bus, only: !!opts.only });
    enterRoom();
    if (UI.onRunStart) UI.onRunStart(st.run, opts);
    play();
  }
  function enterRoom() {
    var st = UI.st;
    st.G = st.run.game; st.roomChanged = false;
    st.queue = st.queue.filter(function (ev) { return ev.type !== 'MOVE'; });
    TLN.render.scene.loadRoom(st.G);
    TLN.render.lights.setDark(null, st.G.room.veglia != null && st.G.turn > st.G.room.veglia);
    TLN.render.shell.setDoorOpen(false);
    u.$('game').classList.add('on');
  }
  function play() { UI.play(); }

  // ── ridisegno ──
  function refreshGrid() {
    var hl = UI.targeting.highlights();
    TLN.render.hexes.setHighlights(hl.list);
    var box = u.$('cell-labels'); if (!box) return;
    box.innerHTML = '';
    hl.labels.forEach(function (l) {
      var s = TLN.render.scene.cellToScreen(l.cell, 0.4);
      var el = u.h('span', 'cl ' + (l.cls || ''), u.esc(l.text));
      el.style.left = s.x + 'px'; el.style.top = s.y + 'px';
      box.appendChild(el);
    });
  }
  function refresh() {
    var st = UI.st;
    if (!st.G || st.run.phase === 'END') { if (UI.screens) UI.screens.render(); return; }
    if (st.run.game !== st.G && st.run.phase === 'COMBAT') enterRoom();
    UI.hud.render(); UI.sequence.render(); UI.controls.render(); UI.plancia.render(); UI.cards.render(); UI.enemyPanel.render();
    refreshGrid();
    var mb = u.$('modebar'), ins = UI.targeting.instructions();
    mb.innerHTML = '';
    if (ins) {
      mb.appendChild(u.h('span', '', ins));
      if (st.mode.step === 'path' && st.mode.path.length) mb.appendChild(UI.controls.btn('Conferma (' + st.mode.path.length + ' 🔮 + 1 PT)', 'main', UI.targeting.confirmPath));
      mb.appendChild(UI.controls.btn('Annulla', 'ghost', UI.targeting.cancel));
    }
    mb.classList.toggle('on', !!ins);
    if (UI.screens) UI.screens.render();
    if (UI.coach) UI.coach.render();
  }
  UI.refresh = refresh;
  UI.refreshGrid = refreshGrid;
  UI.refreshPreview = function () { refreshGrid(); UI.controls.render(); UI.sequence.render(); };

  // ── avanzamento automatico (BRIEF 7: "continua da solo se non ho PM né carte gratuite") ──
  function hasFreeOptions(G) {
    var p = G.player;
    if (p.pm + p.jump > 0) return true;
    return G.hand.some(function (h) {
      var d = TLN.data.cards.byId[h.id];
      if (d.free) return TLN.engine.cardFx.spotAfterClose(G, d) !== null;
      return d.id === 'ab' && TLN.engine.state.adjacentEnemies(G, p.pos).length > 0;
    });
  }
  function nextPending(G) {
    var i = G.res.cursor;
    while (i < G.seq.length && G.seq[i].state !== 'pending') i++;
    return G.seq[i] || null;
  }
  UI.afterPlay = function () {
    var st = UI.st, G = st.G;
    if (!G || G.phase !== 'RISOLUZIONE' || G.res.active || G.res.open || st.mode || (UI.coach && UI.coach.blocking())) return;
    var d = nextPending(G);
    if (!d) return;
    if (d.owner === 'P') {
      if (!hasFreeOptions(G)) setTimeout(function () { if (!st.busy && st.G === G && !G.res.active && G.phase === 'RISOLUZIONE') UI.send({ type: 'ADVANCE' }); }, 120);
      return;
    }
    if (st.autoContinue && !hasFreeOptions(G)) {
      var turn = G.turn, cur = G.res.cursor;
      setTimeout(function () { if (!st.busy && st.G === G && G.turn === turn && G.res.cursor === cur && !st.mode && G.phase === 'RISOLUZIONE') UI.send({ type: 'ADVANCE' }); }, 650);
    }
  };
  UI.keySpace = function () {
    var G = UI.st.G; if (!G) return;
    if (G.phase === 'RISOLUZIONE') UI.controls.advance();
    else if (G.phase === 'SELEZIONE') UI.send({ type: 'SEL_CONFIRM' });
  };

  UI.boot = function () {
    u.$('boot').style.display = 'none';
    var canvas = u.$('gc');
    TLN.render.scene.init(canvas);
    TLN.render.fx.init(u.$('fx-layer'));
    TLN.input.handler.init(canvas);
    UI.log.init();
    window.addEventListener('resize', function () { if (UI.st.G) refreshGrid(); });
    var p = params();
    if (UI.screens && !p.room) UI.screens.showMenu();
    else startRun(p.room || 'r1', { only: !!p.room });
  };
  UI.startRun = startRun;
})(typeof window !== 'undefined' ? window : globalThis);
