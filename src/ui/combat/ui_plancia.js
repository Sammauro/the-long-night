// THE LONG NIGHT — Plancia: 4 slot con dado e costo, carte in CD ruotate, Sigilli, anteprima del prossimo turno (BRIEF 7)
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  var UI = TLN.ui = TLN.ui || {};
  var u = UI.util;

  function entryEl(e) {
    var el = u.h('div', 'pl-card ' + (e.kind === 'seal' ? 'seal' : '') + ' cd' + e.cd);
    el.dataset.pid = e.pid;
    if (e.kind === 'seal') el.innerHTML = '<span class="glyph">⛬</span><span class="nm">Sigillo</span>';
    else el.innerHTML = '<span class="nm">' + TLN.data.cards.byId[e.id].name + '</span>';
    el.appendChild(u.h('span', 'cdv', 'CD ' + e.cd));
    // la carta è ruotata davvero: 90° per ogni punto di CD residuo
    el.style.transform = 'rotate(' + (e.cd * 90) + 'deg)';
    if (UI.st.mode && UI.st.mode.kind === 'ecoRotate' && e.cd > 0) {
      el.classList.add('pickable');
      el.onclick = function () { UI.cards.setRotateTarget(e.pid); };
    }
    var staged = UI.st.staged.some(function (s) { return s.rotate === e.pid; });
    if (staged) el.classList.add('will-rotate');
    return el;
  }

  // Slot coperti al prossimo turno (dopo la Rotazione CD), contando la carta aperta che finirà in Plancia
  function nextCoverage(G) {
    var std = G.plancia.std.filter(function (e) { return e.cd >= 1; }).length;
    var fire = G.plancia.fire && G.plancia.fire.cd >= 1;
    var o = G.res && G.res.open;
    if (o && o.def.cd) { var s = TLN.engine.cards.spotFor(G, o.def); if (s === 'fire') fire = true; else std++; }
    var slots = G.equip.filter(function (s) { return s.kind === 'standard'; }).slice().sort(function (a, b) { return a.order - b.order; });
    var out = slots.slice(0, std).map(function (s) { return s.slot; });
    if (fire) out.push(G.equip.filter(function (s) { return s.kind === 'fire'; })[0].slot);
    return out;
  }

  function render() {
    var G = UI.st.G, box = u.$('plancia'); if (!G || !box) return;
    box.innerHTML = '<div class="ttl">Plancia</div>';
    var cov = TLN.engine.dice.coverage(G);
    var std = G.equip.filter(function (s) { return s.kind === 'standard'; }).slice().sort(function (a, b) { return a.order - b.order; });
    var row = u.h('div', 'pl-row');
    var bySlot = {};
    std.forEach(function (s, i) { bySlot[s.slot] = G.plancia.std[i] || null; });
    var fireSlot = G.equip.filter(function (s) { return s.kind === 'fire'; })[0];
    bySlot[fireSlot.slot] = G.plancia.fire;
    G.equip.forEach(function (s) {
      var col = u.h('div', 'pl-col' + (s.kind === 'fire' ? ' fire' : '') + (cov[s.slot] ? ' covered' : ''));
      var spot = u.h('div', 'pl-spot');
      if (bySlot[s.slot]) spot.appendChild(entryEl(bySlot[s.slot]));
      col.appendChild(spot);
      col.appendChild(u.h('div', 'pl-slot k-' + s.die, '<span class="n">Slot ' + s.slot + '</span><span class="ic">' + u.ICON[s.die] + '</span><span class="c">' + (cov[s.slot] ? '🔒 ' : '') + s.cost + ' Luce</span>'));
      row.appendChild(col);
    });
    box.appendChild(row);
    var nx = nextCoverage(G);
    var txt = nx.length ? 'Prossimo turno: bloccati ' + nx.map(function (n) { var s = G.equip.filter(function (e) { return e.slot === n; })[0]; return 'Slot ' + n + ' ' + u.ICON[s.die]; }).join(', ') : 'Prossimo turno: nessuno slot bloccato';
    box.appendChild(u.h('div', 'pl-next' + (nx.length ? ' warn' : ''), txt));
  }

  UI.plancia = { render: render, nextCoverage: nextCoverage };
})(typeof window !== 'undefined' ? window : globalThis);
