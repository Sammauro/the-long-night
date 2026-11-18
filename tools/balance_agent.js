// THE LONG NIGHT — agente di bilanciamento "prudente" (stessa logica del modello del design doc).
// Non è un test: misura quanto è difficile la demo per un giocatore regolare (non un esperto).
// Uso:  node tools/balance_agent.js [N=200] [stanze=r1] [equip=demo]
//   es. node tools/balance_agent.js 400 r1,r2,r3      → run completa
//       node tools/balance_agent.js 400 r2 rev11      → solo Corridoio, slot rev.11
var path = require('path');
var load = require(path.join(__dirname, 'load.js'));
var TLN = load.loadTLN();
var E = TLN.engine, S = E.state;
var N = +process.argv[2] || 200;
var ROOMS = (process.argv[3] || 'r1').split(',');
var EQUIP = process.argv[4] || 'demo';

function key(c) { return c[0] + ',' + c[1]; }

function make(run) {
  function G() { return run.game; }
  function ex(c) {
    var r = E.run.execute(run, c);
    if (!r.ok) throw new Error('rifiutato ' + JSON.stringify(c) + ' → ' + r.error);
    return r;
  }
  function tryEx(c) { return !E.run.check(run, c) ? (E.run.execute(run, c), true) : false; }
  function alive() { return S.aliveEnemies(G()); }
  function dist(a, b) { return G().grid.distance(a, b); }
  function eff(e) { return e.hp + S.statusCount(e, 'shield'); }
  function weight(e) { return { zombie: 2, sussurratore: 3, falena: 2.5, custode: 1.5 }[e.type]; }

  // danno atteso dai dadi IA ancora da risolvere se il giocatore fosse in pos
  function incoming(pos) {
    var g = G(), p = g.player, old = p.pos, tot = 0;
    p.pos = pos;
    var from = g.res ? g.res.cursor : 0;
    for (var i = from; i < g.seq.length; i++) {
      var d = g.seq[i];
      if (d.owner === 'P' || d.state !== 'pending') continue;
      var e = S.unitById(g, d.owner);
      if (!e || !e.alive || S.statusCount(e, 'stun')) continue;
      var pv = E.ai.preview(g, e, d.actionId);
      tot += (pv.raw ? pv.raw * Math.pow(2, S.statusCount(p, 'vuln')) : 0) + (pv.ptLoss || 0) * 1.3 + (pv.steal || 0) * 0.5;
    }
    p.pos = old;
    return tot - S.statusCount(p, 'shield');
  }
  function pendingActsOf(e) {
    var g = G();
    return g.seq.some(function (d, i) { return i >= (g.res ? g.res.cursor : 0) && d.owner === e.id && d.state === 'pending'; });
  }
  function tscore(e, pot) {
    return weight(e) + (eff(e) <= pot ? 10 : 0) + (pendingActsOf(e) ? 2 : 0) - 0.15 * eff(e);
  }
  function hand(id) { return G().hand.filter(function (h) { return h.id === id; })[0]; }
  function reach() { return E.resolution.reachable(G()); }
  function adjEnemies(pos) { return S.adjacentEnemies(G(), pos); }

  function moveTo(cell) { return tryEx({ type: 'MOVE', to: cell }); }

  function approach(pot) {
    var p = G().player;
    if (adjEnemies(p.pos).length) return true;
    var R = reach(), best = null, bs = -1e9;
    Object.keys(R).forEach(function (k) {
      var r = R[k];
      if (r.trap) return;
      var adj = adjEnemies(r.cell);
      if (!adj.length) return;
      var sc = Math.max.apply(null, adj.map(function (e) { return tscore(e, pot); })) - 0.6 * (adj.length - 1) - 0.1 * r.pm - 0.3 * Math.max(0, incoming(r.cell));
      if (sc > bs) { bs = sc; best = r.cell; }
    });
    if (best) return moveTo(best);
    return false;
  }
  function evade() {
    var p = G().player;
    if (p.pm <= 0) return;
    var cur = Math.max(0, incoming(p.pos));
    if (cur < 1) return;
    var R = reach(), best = null, bs = cur;
    Object.keys(R).forEach(function (k) {
      var r = R[k];
      if (r.trap) return;
      var sc = Math.max(0, incoming(r.cell)) + 0.2 * r.pm;
      if (sc < bs - 0.5) { bs = sc; best = r.cell; }
    });
    if (best) moveTo(best);
  }

  function pool() { return G().res.pool; }
  function openCard(id) { var h = hand(id); return h && tryEx({ type: 'OPEN_CARD', card: h.uid }); }
  function use(i, extra) { return tryEx(Object.assign({ type: 'USE_ACTION', action: i }, extra || {})); }
  function close() { if (G().res && G().res.open) { var o = G().res.open; tryEx({ type: 'CLOSE_CARD', reward: E.cardFx.needsChoice(G()) ? { pm: 0 } : undefined }); } }
  function bestAdj(pot) {
    var adj = adjEnemies(G().player.pos);
    if (!adj.length) return null;
    return adj.sort(function (a, b) { return tscore(b, pot) - tscore(a, pot); })[0];
  }
  function pushCell(t) {
    var opts = E.combat.pushOptions(G(), G().player.pos, t);
    var col = opts.filter(function (o) { return o.status !== 'free'; })[0];
    var trap = opts.filter(function (o) { return o.status === 'free' && S.hasTrap(G(), o.cell); })[0];
    return (trap || col || opts[0]).cell;
  }

  // spende impulsi forza (o fuoco con amplificazione) in attacchi corpo a corpo
  function melee(payer) {
    var guard = 0;
    while (guard++ < 15 && !G().over) {
      var n = pool()[payer];
      var t = bestAdj(n + 1);
      if (!t) break;
      var pay = payer === 'fuoco' ? 'fuoco' : undefined;
      if (hand('ab')) {
        openCard('ab'); use(0, { target: t.id });
        while (t.alive && pool()[payer] > 0 && use(1, { target: t.id, pay: pay })) {}
        close(); continue;
      }
      if (n <= 0) break;
      var threat = alive().filter(function (e) { return dist(e.pos, G().player.pos) <= 3; }).length;
      if (hand('ap') && (2 * n >= eff(t) || t.type === 'custode') && threat <= 2 && openCard('ap')) {
        while (t.alive && pool()[payer] > 0 && use(0, { target: t.id, pay: pay })) {}
        close(); continue;
      }
      if (hand('as') && openCard('as')) {
        while (t.alive && pool()[payer] > 0 && use(0, { target: t.id, pay: pay })) {}
        close(); continue;
      }
      if (hand('ds') && openCard('ds')) {
        while (t.alive && dist(t.pos, G().player.pos) === 1 && pool()[payer] > 0 && use(0, { target: t.id, pay: pay, push: pushCell(t) })) {}
        close(); continue;
      }
      if (hand('tm') && payer === 'forza' && openCard('tm')) {
        while (t.alive && pool()[payer] > 0 && use(1, { target: t.id })) {}
        close(); continue;
      }
      break;
    }
  }
  function leftovers(payer) {
    if (G().over) return;
    var inc = incoming(G().player.pos);
    if (pool()[payer] > 0 && hand('pa') && inc >= 1 && openCard('pa')) {
      while (pool()[payer] > 0 && inc-- > 0 && use(0, { pay: payer === 'fuoco' ? 'fuoco' : undefined })) {}
      if (pool()[payer] > 0) use(1, { pay: payer === 'fuoco' ? 'fuoco' : undefined });
      close();
    }
    if (payer === 'forza') while (pool().forza > 0 && tryEx({ type: 'MANEUVER', kind: 'tactical' })) {}
  }
  function ranged() {
    var guard = 0;
    while (pool().fuoco > 0 && guard++ < 10) {
      var inr = alive().filter(function (e) { return dist(e.pos, G().player.pos) <= 3; });
      if (!inr.length) break;
      var t = inr.sort(function (a, b) { return tscore(b, pool().fuoco) - tscore(a, pool().fuoco); })[0];
      if (!tryEx({ type: 'MANEUVER', kind: 'ranged', target: t.id })) break;
    }
  }
  function coneBest() {
    var g = G(), best = null, bn = 0;
    for (var d = 0; d < 6; d++) {
      var cells = g.grid.cone(g.player.pos, d, 3);
      var n = cells.filter(function (c) { var u = S.unitAt(g, c); return u && u.kind === 'enemy'; }).length;
      if (n > bn) { bn = n; best = d; }
    }
    return { dir: best, n: bn };
  }

  function playerDie(d) {
    var g = G(), p = g.player;
    if (d.kind === 'terrore') return terror();
    if (d.kind === 'fuoco') {
      var cb = coneBest();
      if (pool().fuoco >= 2 && hand('cf') && cb.n >= 2 && openCard('cf')) { use(0, { dir: cb.dir }); close(); }
      if (pool().fuoco > 0 && (hand('af') || hand('ab'))) approach(pool().fuoco * 2);
      if (pool().fuoco > 0 && adjEnemies(p.pos).length && hand('af') && !hand('ab') && openCard('af')) {
        var t = bestAdj(2 * pool().fuoco);
        while (t.alive && pool().fuoco > 0 && use(0, { target: t.id })) {}
        if (pool().fuoco > 0 && t.alive) use(1, { target: t.id });
        close();
      }
      if (pool().fuoco > 0 && adjEnemies(p.pos).length) melee('fuoco');
      ranged();
      leftovers('fuoco');
      return;
    }
    // vigore
    var atk = ['ab', 'ap', 'as', 'ds', 'tm'].some(function (id) { return hand(id); });
    var inc0 = incoming(p.pos);
    if (hand('pa') && inc0 >= 2 && openCard('pa')) {
      var k = Math.min(pool().forza, Math.ceil(inc0));
      while (k-- > 0 && use(0)) {}
      close();
    }
    if (atk && pool().forza > 0) {
      if (!approach(pool().forza + 1)) {
        // converte impulsi in PM se serve ad arrivare
        for (var c = 1; c < pool().forza; c++) {
          var save = p.pm;
          if (!tryEx({ type: 'MANEUVER', kind: 'tactical' })) break;
          if (approach(pool().forza + 1)) break;
        }
      }
      if (adjEnemies(p.pos).length) melee('forza');
      else if (hand('tm') && openCard('tm')) {
        var tg = alive().sort(function (a, b) { return dist(a.pos, p.pos) - dist(b.pos, p.pos); })[0];
        var ext = Math.max(0, dist(tg.pos, p.pos) - 2);
        if (ext < pool().forza) { for (var i = 0; i < ext; i++) use(0); while (tg.alive && pool().forza > 0 && use(1, { target: tg.id })) {} }
        close();
      }
    }
    leftovers('forza');
  }
  function terror() {
    var g = G(), p = g.player, n = pool().presagio, floor = 3;
    if (hand('pm')) {
      var c = alive().filter(function (e) { return e.hp <= n && p.pt - e.hp >= floor; });
      if (c.length) {
        var t = c.sort(function (a, b) { return weight(b) - weight(a) || b.hp - a.hp; })[0];
        if (openCard('pm')) { use(0, { target: t.id, x: t.hp }); close(); return; }
      }
      var cu = alive().filter(function (e) { return e.type === 'custode'; })[0];
      var x = Math.min(n, p.pt - floor);
      if (cu && x >= 2 && openCard('pm')) { use(0, { target: cu.id, x: x }); close(); }
    }
  }

  function selection() {
    var g = G(), p = g.player;
    var plan = E.dice.selectionPlan(g, {});
    var wantT = p.pt >= 3 && !!hand('pm');
    var wh = alive().filter(function (e) { return e.type === 'sussurratore'; });
    var tv = 0; g.seq.forEach(function (d) { if (d.kind === 'terrore') tv = d.value; });
    if (wh.length && p.pt <= 4) wantT = !!hand('pm') && wh.some(function (e) { return e.hp <= tv && p.pt - e.hp >= 2; });
    var mine = g.seq.filter(function (d) { return d.owner === 'P'; });
    // ordine: vigore per valore, fuoco migliore, terrore
    var order = mine.slice().sort(function (a, b) { return b.value - a.value; });
    order.forEach(function (d) {
      if (d.kind === 'terrore' && !wantT) return;
      ex({ type: 'SEL_TOGGLE', die: d.uid });
      var pl = E.dice.selectionPlan(g);
      var info = pl.dice[d.uid];
      if (!pl.ok || !pl.affordable) { ex({ type: 'SEL_TOGGLE', die: d.uid }); return; }
      if (info.cost && d.kind === 'terrore' && !wantT) ex({ type: 'SEL_TOGGLE', die: d.uid });
    });
    ex({ type: 'SEL_CONFIRM' });
  }

  function endTurn() {
    var g = G(), p = g.player;
    var std = E.cards.entries(g).filter(function (e) { return e.cd > 0; }).length;
    var threatened = alive().filter(function (e) { return dist(e.pos, p.pos) <= 3; }).length;
    var keep = { ab: true };
    g.hand.slice().forEach(function (h) {
      var id = h.id, k = false;
      if (id === 'ab') k = true;
      else if (id === 'pa') k = threatened >= 2;
      else if (id === 'pm') k = p.pt >= 4 && alive().some(function (e) { return e.type === 'sussurratore' || e.type === 'custode' || e.hp <= 3; });
      else if (['ds', 'ap', 'as'].indexOf(id) >= 0) k = std < 3;
      else if (['af', 'cf'].indexOf(id) >= 0) k = !g.plancia.fire || std < 3;
      else if (id === 'ie') k = false;
      if (!k) {
        var c = { type: 'ECO_DISCARD', card: h.uid };
        var t = E.cards.defaultRotateTarget(g); if (t) c.rotate = t;
        tryEx(c);
      }
    });
    ex({ type: 'ECO_DONE' });
  }

  function retreat() {
    var p = G().player;
    if (!alive().length || p.pm <= 0) return;
    function exp(pos) {
      var tot = 0;
      alive().forEach(function (e) {
        var def = TLN.data.enemies[e.type];
        var r = def.range || 1, m = def.fly ? def.mov + 1 : def.mov;
        if (dist(e.pos, pos) <= r + m) tot += e.type === 'custode' ? 1.5 : e.type === 'sussurratore' ? 1 : 1;
      });
      return tot;
    }
    var cur = exp(p.pos), R = reach(), best = null, bs = cur;
    Object.keys(R).forEach(function (k) {
      var r = R[k]; if (r.trap) return;
      var sc = exp(r.cell) + 0.3 * r.pm;
      if (sc < bs - 0.7) { bs = sc; best = r.cell; }
    });
    if (best) moveTo(best);
  }

  function resolution() {
    var g = G(), guard = 0;
    while (g.phase === 'RISOLUZIONE' && !g.over && guard++ < 200) {
      if (g.res.active) {
        var d = g.seq[g.res.cursor];
        try { playerDie(d); } catch (e) { if (!/rifiutato/.test(e.message)) throw e; }
        close();
        if (g.over || g.phase !== 'RISOLUZIONE') break;
        ex({ type: 'ADVANCE' });
        continue;
      }
      // finestra libera: guarda il prossimo dado
      var nx = null;
      for (var i = g.res.cursor; i < g.seq.length; i++) if (g.seq[i].state === 'pending') { nx = g.seq[i]; break; }
      if (!nx) { retreat(); ex({ type: 'ADVANCE' }); break; }
      if (nx.owner !== 'P') evade();
      else if (nx.kind === 'vigore' && hand('ie') && alive().some(function (e) { return dist(e.pos, g.player.pos) <= 3 + g.player.pm; })) {
        tryEx({ type: 'FREE_CARD', card: hand('ie').uid, die: nx.uid });
      }
      ex({ type: 'ADVANCE' });
    }
  }

  function step() {
    if (run.phase === 'SOGLIA') {
      var c = run.carry, order = [];
      if (c.hp <= 7) order.push('bendarsi');
      if (c.pt <= 4) order.push('raccogliersi');
      ['lanterna', 'bendarsi', 'raccogliersi'].forEach(function (x) { if (order.indexOf(x) < 0) order.push(x); });
      ex({ type: 'SOGLIA_CHOOSE', rests: order.slice(0, run.restsAllowed) });
      return;
    }
    var g = G();
    if (g.phase === 'FINE_TURNO') endTurn();
    else if (g.phase === 'SELEZIONE') selection();
    else if (g.phase === 'RISOLUZIONE') resolution();
    else throw new Error('fase ' + g.phase);
  }
  return { step: step };
}

var res = {}, full = 0, errors = 0;
for (var i = 0; i < N; i++) {
  var run = E.run.createRun({ seed: 9000 + i * 7919, start: ROOMS[0], only: ROOMS.length === 1, noScript: true, equipPreset: EQUIP });
  if (ROOMS.length > 1) run.rooms = ROOMS.slice();
  var A = make(run), guard = 0;
  try {
    while (run.phase !== 'END' && guard++ < 3000) { A.step(); if (run.game && run.game.turn > 40) break; }
  } catch (e) { errors++; if (errors < 3) console.error(e.stack.split('\n').slice(0, 4).join('\n')); }
  run.history.forEach(function (h) {
    var r = res[h.room] = res[h.room] || { n: 0, win: 0, death: 0, madness: 0, turns: [], inV: 0 };
    r.n++; r[h.result]++; if (h.result === 'win') { r.turns.push(h.turns); if (h.inVeglia) r.inV++; }
  });
  if (run.result === 'victory' && ROOMS.length > 1) full++;
}
Object.keys(res).forEach(function (k) {
  var r = res[k], t = r.turns.sort(function (a, b) { return a - b; });
  console.log(k, 'entrano', r.n, 'vinte', (100 * r.win / r.n).toFixed(0) + '%', 'morte', r.death, 'follia', r.madness,
    'turni med', t[t.length >> 1], 'entro Veglia', (100 * r.inV / r.n).toFixed(0) + '%');
});
if (ROOMS.length > 1) console.log('run completa', (100 * full / N).toFixed(0) + '%');
console.log('errori', errors);
