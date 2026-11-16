// THE LONG NIGHT — sequenza delle stanze, Veglia, Soglia (BRIEF 5.7, 6.1; decisioni D2, D3, D4)
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  var E = TLN.engine = TLN.engine || {};

  function roomById(id) { return TLN.data.rooms.list.filter(function (r) { return r.id === id; })[0]; }

  // opts: { seed, start: 'r0'|'r1'|..., equipPreset, noScript, bus }
  function createRun(opts) {
    opts = opts || {};
    var cfg = TLN.data.runConfig;
    var seq = cfg.sequence.slice(cfg.sequence.indexOf(opts.start || cfg.sequence[0]));
    var run = {
      seed: opts.seed >>> 0, rng: E.createRng(opts.seed), bus: opts.bus || E.createEventBus(),
      cfg: cfg, equipPreset: opts.equipPreset || cfg.equipPreset, rooms: seq, roomIndex: -1,
      carry: { hp: cfg.hpStart, pt: cfg.ptStart, luceBonus: 0 }, phase: 'INIZIO', game: null,
      history: [], restsAllowed: 0, result: null, noScript: !!opts.noScript, only: !!opts.only
    };
    run.bus.emit('RUN_START', { seed: run.seed, rooms: seq.slice(), equip: run.equipPreset });
    nextRoom(run);
    return run;
  }

  function nextRoom(run) {
    run.roomIndex++;
    var room = roomById(run.rooms[run.roomIndex]);
    var cfg = run.cfg, c = run.carry;
    // D2/D3 — HP e PT restano (PT con tetto in ingresso); Luce torna a 0 salvo la Sosta "Lanterna"
    var carry = {
      hp: cfg.persist.hp ? c.hp : cfg.hpStart,
      pt: cfg.persist.pt ? Math.min(c.pt, cfg.ptCapOnEnter) : cfg.ptStart,
      luceBonus: (cfg.persist.luce ? (c.luce || 0) : 0) + (c.luceBonus || 0)
    };
    run.carry.luceBonus = 0;
    var script = room.tutorial && !run.noScript ? TLN.data.tutorialScript : null;
    run.game = E.state.createGame({
      room: room, bus: run.bus, rng: run.rng, script: script, equipPreset: run.equipPreset, carry: carry
    });
    run.phase = 'COMBAT';
    E.turn.startRoom(run.game);
    if (run.game.over) onRoomEnd(run);
  }

  function onRoomEnd(run) {
    var G = run.game, o = G.over, p = G.player;
    var rec = { room: G.room.id, name: G.room.name, turns: G.turn, veglia: G.room.veglia, inVeglia: o.inVeglia, result: o.result, rests: [], lightPaid: G.stats.lightPaid };
    run.history.push(rec);
    run.carry.hp = p.hp; run.carry.pt = p.pt; run.carry.luce = p.luce;
    if (o.result !== 'win') { finish(run, o.result); return; }
    if (run.only || run.roomIndex >= run.rooms.length - 1) { finish(run, 'victory'); return; }
    run.phase = 'SOGLIA';
    run.restsAllowed = o.inVeglia ? run.cfg.restsInVeglia : run.cfg.restsBase;
    var next = roomById(run.rooms[run.roomIndex + 1]);
    run.bus.emit('SOGLIA', {
      from: G.room.id, inVeglia: o.inVeglia, rests: run.restsAllowed, hp: p.hp, pt: p.pt,
      next: { id: next.id, name: next.name, veglia: next.veglia, enemies: next.enemies.map(function (e) { return e.type; }) }
    });
  }

  function finish(run, result) {
    run.phase = 'END';
    run.result = result;
    run.bus.emit('RUN_END', { result: result, history: run.history, hp: run.carry.hp, pt: run.carry.pt });
  }

  function checkSoglia(run, c) {
    if (run.phase !== 'SOGLIA') return 'Non sei alla Soglia';
    var rs = c.rests || [], seen = {};
    if (rs.length !== run.restsAllowed) return 'Scegli ' + run.restsAllowed + (run.restsAllowed > 1 ? ' Soste diverse' : ' Sosta');
    for (var i = 0; i < rs.length; i++) {
      if (!run.cfg.rests[rs[i]] || seen[rs[i]]) return 'Soste non valide';
      seen[rs[i]] = true;
    }
    return null;
  }
  function applyRests(run, rests) {
    var cfg = run.cfg, c = run.carry;
    rests.forEach(function (id) {
      var r = cfg.rests[id];
      if (r.hp) c.hp = Math.min(cfg.hpMax, c.hp + r.hp);
      if (r.pt) c.pt = Math.max(c.pt, Math.min(r.ptMax, c.pt + r.pt));
      if (r.luceNext) c.luceBonus += r.luceNext;
    });
    run.history[run.history.length - 1].rests = rests.slice();
    run.bus.emit('SOGLIA_CHOSEN', { rests: rests.slice(), hp: c.hp, pt: c.pt, luceBonus: c.luceBonus });
  }

  // Se la stanza si è chiusa fuori da un comando (test, script), passa alla Soglia o alla fine
  function sync(run) { if (run.phase === 'COMBAT' && run.game && run.game.over) onRoomEnd(run); }
  function check(run, c) {
    sync(run);
    if (c.type === 'SOGLIA_CHOOSE') return checkSoglia(run, c);
    if (run.phase !== 'COMBAT') return 'Nessun combattimento in corso';
    return E.check(run.game, c);
  }
  function execute(run, c) {
    var err = check(run, c);
    if (err) return { ok: false, error: err };
    if (c.type === 'SOGLIA_CHOOSE') { applyRests(run, c.rests); nextRoom(run); return { ok: true }; }
    var r = E.execute(run.game, c);
    if (run.game.over && run.phase === 'COMBAT') onRoomEnd(run);
    return r;
  }

  E.run = { createRun: createRun, execute: execute, check: check, sync: sync, roomById: roomById };
})(typeof window !== 'undefined' ? window : globalThis);
