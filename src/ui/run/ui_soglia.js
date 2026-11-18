// THE LONG NIGHT — la Soglia tra le stanze: riepilogo, Soste, chi ti aspetta (BRIEF 5.7, design §6.2)
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  var UI = TLN.ui = TLN.ui || {};
  var u = UI.util;

  var picked = [];
  function enemyCard(type, count) {
    var def = TLN.data.enemies[type];
    var rows = [1, 2, 3, 4].map(function (v) { var a = def.actions[def.d4[v]]; return '<tr><td>' + v + '</td><td>' + a.icon + ' ' + a.name + '</td></tr>'; }).join('');
    return '<div class="sg-en"><img src="' + UI.sequence.portrait(type) + '"><div><b>' + def.name + ' ×' + count + '</b><br><small>HP ' + def.hp + ' · Mov ' + def.mov +
      (def.range > 1 ? ' · Gittata ' + def.range : '') + (def.fly ? ' · Volo' : '') + (def.armor ? ' · Corazza ' + def.armor : '') + '</small><table>' + rows + '</table></div></div>';
  }

  function render(box) {
    var run = UI.st.run, n = run.restsAllowed, c = run.carry, cfg = run.cfg;
    var next = TLN.engine.run.roomById(run.rooms[run.roomIndex + 1]);
    var last = run.history[run.history.length - 1];
    var counts = {};
    next.enemies.forEach(function (e) { counts[e.type] = (counts[e.type] || 0) + 1; });
    picked = picked.filter(function (id) { return cfg.rests[id]; }).slice(0, n);
    box.innerHTML = '';
    var w = u.h('div', 'scr soglia');
    w.innerHTML = '<h1>La Soglia</h1>' +
      '<p class="sub">' + u.esc(last.name) + ' è libera in ' + last.turns + ' turni' + (last.veglia ? (last.inVeglia ? ' — <b>entro la Veglia</b>: due Soste.' : ' — oltre la Veglia: una Sosta.') : '.') + '</p>' +
      '<p class="note">Mazzo, mano, Plancia e stati si azzerano. PM tornano a 2, Luce a 0. Restano HP <b>' + c.hp + '</b> e PT <b>' + c.pt + '</b> (al massimo ' + cfg.ptCapOnEnter + ' entrando).</p>';
    var rs = u.h('div', 'rests');
    Object.keys(cfg.rests).forEach(function (id) {
      var r = cfg.rests[id], on = picked.indexOf(id) >= 0;
      var el = u.h('div', 'rest' + (on ? ' on' : ''), '<b>' + r.name + '</b><span>' + r.text + '</span>');
      el.dataset.id = id;
      el.onclick = function () {
        var i = picked.indexOf(id);
        if (i >= 0) picked.splice(i, 1); else { picked.push(id); if (picked.length > n) picked.shift(); }
        render(box);
      };
      rs.appendChild(el);
    });
    w.appendChild(u.h('div', 'lbl', 'Scegli ' + (n > 1 ? n + ' Soste diverse' : '1 Sosta')));
    w.appendChild(rs);
    w.appendChild(u.h('div', 'lbl', 'Ti aspetta: ' + u.esc(next.name) + (next.veglia ? ' · Veglia ' + next.veglia + ' turni' : '')));
    // Decisione Soglia: di base non si vedono i nemici, solo un presagio (runConfig.soglia.showEnemies per riattivarli)
    var showEn = TLN.data.runConfig.soglia && TLN.data.runConfig.soglia.showEnemies;
    if (showEn) w.appendChild(u.h('div', 'sg-ens', Object.keys(counts).map(function (t) { return enemyCard(t, counts[t]); }).join('')));
    else if (next.omen) w.appendChild(u.h('div', 'sg-omen', '«' + u.esc(next.omen) + '»'));
    var b = UI.controls.btn('Attraversa la Soglia', 'main', function () {
      var rests = picked.slice(); picked = [];
      UI.send({ type: 'SOGLIA_CHOOSE', rests: rests });
    }, picked.length !== n);
    w.appendChild(b);
    box.appendChild(w);
  }

  UI.soglia = { render: render };
})(typeof window !== 'undefined' ? window : globalThis);
