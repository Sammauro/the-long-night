// THE LONG NIGHT — pannello nemici: elenco con HP, Scudi, stati; scheda completa con la tabella d4 (BRIEF 7)
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  var UI = TLN.ui = TLN.ui || {};
  var u = UI.util;

  function statuses(e) {
    var S = TLN.engine.state;
    return S.STATUS_KINDS.filter(function (k) { return S.statusCount(e, k); }).map(function (k) {
      return '<span class="st" title="' + u.STATUS_NAME[k] + '">' + u.STATUS_ICON[k] + S.statusCount(e, k) + '</span>';
    }).join('');
  }
  function intent(G, e) {
    var d = G.seq.filter(function (x) { return x.owner === e.id; })[0];
    if (!d) return '';
    var a = TLN.data.enemies[e.type].actions[d.actionId];
    return '<span class="int s-' + d.state + '" title="' + a.text + '">' + a.icon + ' <span class="int-n">' + a.name + '</span></span>';
  }

  function render() {
    var G = UI.st.G, box = u.$('enemies'); if (!G || !box) return;
    box.innerHTML = '<div class="ttl">Nemici · ' + TLN.engine.state.aliveEnemies(G).length + '</div>';
    var targets = UI.targeting.targets().map(function (e) { return e.id; });
    G.enemies.forEach(function (e) {
      var def = TLN.data.enemies[e.type];
      var el = u.h('div', 'en' + (e.alive ? '' : ' dead') + (UI.st.selectedEnemy === e.id ? ' sel' : '') + (targets.indexOf(e.id) >= 0 ? ' target' : ''));
      el.innerHTML = '<img src="' + UI.sequence.portrait(e.type) + '"><div class="en-b"><div class="en-n"><span class="en-nm">' + def.name + '</span> <b>' + e.id + '</b>' + (def.armor ? ' <small>Corazza ' + def.armor + '</small>' : '') + '</div>' +
        '<div class="bar hp"><i style="width:' + (e.hp / e.hpMax * 100) + '%"></i></div>' +
        '<div class="en-s">' + e.hp + '/' + e.hpMax + ' ' + statuses(e) + ' ' + (e.alive ? intent(G, e) : '✝') + '</div></div>';
      if (e.alive) el.onclick = function () { UI.targeting.onUnit(e.id); if (!UI.st.mode) { UI.st.selectedEnemy = UI.st.selectedEnemy === e.id ? null : e.id; UI.refresh(); } };
      box.appendChild(el);
    });
    var sel = UI.st.selectedEnemy && TLN.engine.state.unitById(G, UI.st.selectedEnemy);
    var sheet = u.$('enemy-sheet');
    if (!sheet) return;
    if (!sel) { sheet.classList.remove('on'); return; }
    var def = TLN.data.enemies[sel.type];
    var rows = [1, 2, 3, 4].map(function (v) { var a = def.actions[def.d4[v]]; return '<tr><td>' + v + '</td><td>' + a.icon + ' <b>' + a.name + '</b><br><small>' + a.text + '</small></td></tr>'; }).join('');
    sheet.innerHTML = '<div class="sh-t">' + def.name + ' ' + sel.id + ' <button class="x">✕</button></div>' +
      '<div class="sh-s">HP ' + sel.hp + '/' + sel.hpMax + ' · Mov ' + def.mov + (def.range > 1 ? ' · Gittata ' + def.range : '') + (def.fly ? ' · Volo' : '') + (def.armor ? ' · Corazza ' + def.armor : '') + '</div>' +
      '<table>' + rows + '</table>';
    sheet.querySelector('.x').onclick = function () { UI.st.selectedEnemy = null; UI.refresh(); };
    // in modalità compatta la scheda è sovrapposta: un tocco la chiude
    sheet.onclick = function (e) { if (window.innerHeight <= 520) { e.stopPropagation(); UI.st.selectedEnemy = null; UI.refresh(); } };
    sheet.classList.add('on');
  }

  UI.enemyPanel = { render: render };
})(typeof window !== 'undefined' ? window : globalThis);
