// THE LONG NIGHT — stato di stanza, unità, stati, risorse, registro comandi (BRIEF 4, 6)
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  var E = TLN.engine = TLN.engine || {};
  var hex = E.hex;

  // ── Stati: [Turno Attuale, Prossimo Turno] (BRIEF 6.6) ──
  var STATUS_KINDS = ['shield', 'vuln', 'vulnFire', 'stun', 'counter'];
  function emptyStatus() {
    var s = {};
    STATUS_KINDS.forEach(function (k) { s[k] = [0, 0]; });
    return s;
  }
  function statusCount(u, k) { return u.status[k][0] + u.status[k][1]; }
  function addStatus(G, u, k, n, cause) {
    if (!n) return;
    u.status[k][0] += n;
    G.bus.emit('STATUS', { unit: u.id, status: k, delta: n, total: statusCount(u, k), cause: cause || null });
  }
  // Consuma n segnalini: prima "Prossimo Turno", poi "Turno Attuale" (BRIEF 6.6)
  function consumeStatus(u, k, n) {
    var used = 0;
    while (used < n && u.status[k][1] > 0) { u.status[k][1]--; used++; }
    while (used < n && u.status[k][0] > 0) { u.status[k][0]--; used++; }
    return used;
  }
  // BRIEF 6.2 Fase 2.1 — "Prossimo Turno" scade, "Turno Attuale" passa a "Prossimo Turno"
  function rotateStatus(u) {
    STATUS_KINDS.forEach(function (k) { u.status[k] = [0, u.status[k][0]]; });
  }

  function createGame(opts) {
    var D = TLN.data;
    var room = opts.room;
    var grid = hex.createGrid(D.rooms.grid.rows, D.rooms.grid.cols);
    var G = {
      bus: opts.bus, rng: opts.rng, grid: grid, room: room,
      script: opts.script || null,
      equip: D.equipment.presets[opts.equipPreset || D.runConfig.equipPreset],
      cfg: D.runConfig,
      turn: 0, phase: 'INIZIO', over: null,
      terrain: {}, // key → { type }
      player: null, enemies: [],
      deck: [], hand: [], discard: [], plancia: { std: [], fire: null }, planciaSeq: 0,
      seq: [], seqDropped: [], sel: { keep: {} },
      res: null, ecoDiscarded: [], stats: { lightPaid: 0 }
    };
    room.terrain.forEach(function (t) { G.terrain[hex.key(t.at)] = { type: t.type, at: t.at.slice() }; });
    var c = opts.carry || {};
    G.player = {
      id: 'P', kind: 'player', pos: room.player.slice(),
      hp: c.hp != null ? c.hp : D.runConfig.hpStart, hpMax: D.runConfig.hpMax,
      pt: c.pt != null ? c.pt : D.runConfig.ptStart,
      pm: D.runConfig.pmRoomStart, jump: 0,
      luce: D.runConfig.luceRoomStart + (c.luceBonus || 0),
      status: emptyStatus(), alive: true
    };
    var perType = {};
    room.enemies.forEach(function (e, i) {
      var def = D.enemies[e.type];
      perType[e.type] = (perType[e.type] || 0) + 1;
      G.enemies.push({
        id: def.letter + perType[e.type], kind: 'enemy', type: e.type, deploy: i + 1,
        pos: e.at.slice(), hp: e.hp || def.hp, hpMax: def.hp, status: emptyStatus(), alive: true
      });
    });
    return G;
  }

  // ── Occupazione ──
  function unitAt(G, c) {
    if (hex.same(G.player.pos, c) && G.player.alive) return G.player;
    for (var i = 0; i < G.enemies.length; i++) {
      var e = G.enemies[i];
      if (e.alive && hex.same(e.pos, c)) return e;
    }
    return null;
  }
  function terrainAt(G, c) { return G.terrain[hex.key(c)] || null; }
  function blocking(G, c) {
    var t = terrainAt(G, c);
    return !!t && TLN.data.terrain[t.type].blocks;
  }
  // Libera = in griglia, senza unità e senza ostacoli (le trappole sono attraversabili)
  function isFree(G, c) { return G.grid.inGrid(c) && !unitAt(G, c) && !blocking(G, c); }
  function hasTrap(G, c) { var t = terrainAt(G, c); return !!t && t.type === 'trap'; }
  function aliveEnemies(G) { return G.enemies.filter(function (e) { return e.alive; }); }
  function unitById(G, id) {
    if (id === 'P') return G.player;
    for (var i = 0; i < G.enemies.length; i++) if (G.enemies[i].id === id) return G.enemies[i];
    return null;
  }
  function adjacentEnemies(G, c) {
    return aliveEnemies(G).filter(function (e) { return G.grid.distance(e.pos, c) === 1; });
  }

  // ── Risorse del giocatore ──
  function changeRes(G, res, delta, cause) {
    if (!delta || G.over) return 0;
    var p = G.player, old = p[res];
    var nv = old + delta;
    if (res === 'luce' || res === 'pm' || res === 'jump') nv = Math.max(0, nv);
    if (res === 'hp') nv = Math.min(p.hpMax, nv);
    p[res] = nv;
    G.bus.emit('RESOURCE', { res: res, old: old, value: nv, delta: nv - old, cause: cause || null });
    checkOutcome(G);
    return nv - old;
  }

  // BRIEF 6.1 — vittoria e sconfitta, controllate dopo ogni variazione
  function checkOutcome(G) {
    if (G.over) return G.over;
    var p = G.player;
    if (p.hp <= 0) { G.over = { result: 'death' }; }
    else if (p.pt <= 0) { G.over = { result: 'madness' }; }
    else if (G.enemies.length && aliveEnemies(G).length === 0) { G.over = { result: 'win' }; }
    if (G.over) {
      G.over.turn = G.turn;
      G.over.inVeglia = G.room.veglia == null ? false : G.turn <= G.room.veglia;
      G.over.player = { hp: p.hp, pt: p.pt, luce: p.luce, pm: p.pm };
      G.phase = G.over.result === 'win' ? 'WON' : 'LOST';
      // I dadi rimasti in Sequenza si scartano senza effetto
      G.seq.forEach(function (d) { if (d.state === 'pending' || d.state === 'active') d.state = 'void'; });
      if (G.res) {
        if (G.res.open) { G.discard.push(G.res.open.inst); G.res.open = null; }
        G.res.pool = { forza: 0, fuoco: 0, presagio: 0 };
      }
      G.bus.emit(G.over.result === 'win' ? 'ROOM_WON' : 'DEFEAT', G.over);
    }
    return G.over;
  }

  // ── Registro dei comandi del motore: { check(G, cmd) → errore | null, run(G, cmd) } ──
  var commands = {};
  function defineCommand(type, def) { commands[type] = def; }
  function check(G, cmd) {
    var def = commands[cmd.type];
    if (!def) return 'Comando sconosciuto';
    if (G.over && !def.always) return 'Stanza conclusa';
    return def.check ? def.check(G, cmd) : null;
  }
  function execute(G, cmd) {
    var err = check(G, cmd);
    if (err) return { ok: false, error: err };
    var r = commands[cmd.type].run(G, cmd);
    return r || { ok: true };
  }

  E.state = {
    STATUS_KINDS: STATUS_KINDS, emptyStatus: emptyStatus, statusCount: statusCount, addStatus: addStatus,
    consumeStatus: consumeStatus, rotateStatus: rotateStatus, createGame: createGame,
    unitAt: unitAt, terrainAt: terrainAt, blocking: blocking, isFree: isFree, hasTrap: hasTrap,
    aliveEnemies: aliveEnemies, unitById: unitById, adjacentEnemies: adjacentEnemies,
    changeRes: changeRes, checkOutcome: checkOutcome
  };
  E.commands = commands;
  E.defineCommand = defineCommand;
  E.check = check;
  E.execute = execute;
})(typeof window !== 'undefined' ? window : globalThis);
