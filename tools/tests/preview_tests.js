// M4 — l'anteprima di un dado IA (percorso, danno "adesso", PT, Luce) coincide con ciò che il nemico fa davvero
var makeAgent = require('./agent');
module.exports = function (TLN, check, section, opts) {
  var E = TLN.engine, S = E.state;
  section('Anteprima dei dadi IA');
  var n = 0, same = 0, diff = [];
  ['r1', 'r2', 'r3'].forEach(function (room) {
    for (var g = 0; g < 60; g++) {
      var bus = E.createEventBus(), evs = [];
      bus.onAny(function (ev) { evs.push(ev); });
      var run = E.run.createRun({ seed: 900 + g, start: room, only: true, noScript: true, bus: bus });
      var agent = makeAgent(TLN, 31 + g, true), k = 0;
      while (run.phase === 'COMBAT' && k++ < 3000) {
        var G = run.game, cmd = agent.choose(run);
        if (G.phase === 'RISOLUZIONE' && !G.res.active && cmd && cmd.type === 'ADVANCE') {
          var i = G.res.cursor; while (i < G.seq.length && G.seq[i].state !== 'pending') i++;
          var d = G.seq[i], e = d && d.owner !== 'P' && S.unitById(G, d.owner);
          if (e && e.alive && !S.statusCount(e, 'stun')) {
            var pv = E.ai.preview(G, e, d.actionId), p0 = { hp: G.player.hp, pt: G.player.pt, luce: G.player.luce };
            evs.length = 0;
            E.run.execute(run, cmd);
            var real = { dmg: 0, pt: 0, luce: 0 };
            evs.forEach(function (ev) {
              if (ev.type === 'DAMAGE' && ev.data.target === 'P' && ev.data.source === e.id && ev.data.cause !== 'Collisione') real.dmg += ev.data.hpLoss;
              if (ev.type === 'RESOURCE' && ev.data.res === 'pt' && ev.data.cause === TLN.data.enemies[e.type].actions[d.actionId].name) real.pt -= ev.data.delta;
              if (ev.type === 'LIGHT_STOLEN') real.luce++;
            });
            var trap = evs.some(function (ev) { return ev.type === 'TRAP'; });
            var want = { dmg: pv.dmg || 0, pt: pv.ptLoss || 0, luce: pv.steal || 0 };
            n++;
            if (want.dmg === real.dmg && want.pt === real.pt && want.luce === real.luce) same++;
            else if (!trap) diff.push(room + ' ' + e.id + ' ' + d.actionId + ' previsto ' + JSON.stringify(want) + ' reale ' + JSON.stringify(real));
            continue;
          }
        }
        if (!cmd) break;
        E.run.execute(run, cmd);
      }
    }
  });
  var rate = same / Math.max(1, n);
  console.log('   ' + same + '/' + n + ' anteprime esatte (' + (rate * 100).toFixed(1) + '%)' + (diff.length ? ' · esempi di differenza: ' + diff.slice(0, 3).join(' | ') : ''));
  check(n > 200 && rate >= 0.97, 'anteprima IA esatta solo nel ' + (rate * 100).toFixed(1) + '% dei casi');
};
