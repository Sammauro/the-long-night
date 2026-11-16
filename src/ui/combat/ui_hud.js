// THE LONG NIGHT — HUD sinistro: HP, PT, PM (e PM Salto), Luce, candela della Veglia, turno (BRIEF 7)
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  var UI = TLN.ui = TLN.ui || {};
  var u = UI.util;

  var PHASE = { LANCIO: 'Lancio', FINE_TURNO: 'Fine Turno', PREPARAZIONE: 'Preparazione', SELEZIONE: 'Selezione', RISOLUZIONE: 'Risoluzione', WON: 'Stanza libera', LOST: 'Sconfitta' };

  function bar(val, max, cls) {
    var pct = Math.max(0, Math.min(100, val / max * 100));
    return '<div class="bar ' + cls + '"><i style="width:' + pct + '%"></i></div>';
  }
  function pips(n, cls, cap) {
    var s = '';
    for (var i = 0; i < Math.min(n, cap || 12); i++) s += '<b class="pip ' + cls + '"></b>';
    if (n > (cap || 12)) s += '<small>+' + (n - (cap || 12)) + '</small>';
    return s;
  }
  function candle(G) {
    var v = G.room.veglia;
    if (v == null) return '<div class="veglia none">Nessuna Veglia</div>';
    var burned = Math.min(G.turn, v), s = '';
    for (var i = 1; i <= v; i++) s += '<b class="notch' + (i <= burned ? ' burnt' : '') + (i === burned ? ' now' : '') + '"></b>';
    var dark = G.turn > v;
    return '<div class="veglia' + (dark ? ' dark' : '') + '" title="Veglia: ' + v + ' turni"><span class="flame">' + (dark ? '·' : '🕯') + '</span>' + s +
      '<em>' + (dark ? 'Buio · −1 PT a turno' : 'Veglia ' + burned + '/' + v) + '</em></div>';
  }

  function render() {
    var G = UI.st.G, el = u.$('hud'); if (!G || !el) return;
    var p = G.player, S = TLN.engine.state;
    var sts = S.STATUS_KINDS.filter(function (k) { return S.statusCount(p, k); }).map(function (k) {
      return '<span class="st" title="' + u.STATUS_NAME[k] + '">' + u.STATUS_ICON[k] + S.statusCount(p, k) + '</span>';
    }).join('');
    el.innerHTML =
      '<div class="who">Indagatore <span class="room">' + u.esc(G.room.name) + '</span></div>' +
      '<div class="row"><span class="k">HP</span>' + bar(p.hp, p.hpMax, 'hp') + '<span class="v">' + p.hp + '/' + p.hpMax + '</span></div>' +
      '<div class="row"><span class="k">PT</span>' + bar(p.pt, 6, 'pt') + '<span class="v">' + p.pt + '</span></div>' +
      '<div class="row"><span class="k">PM</span><span class="pips">' + pips(p.pm, 'pm') + pips(p.jump, 'jump') + '</span><span class="v">' + p.pm + (p.jump ? ' +' + p.jump + ' Salto' : '') + '</span></div>' +
      '<div class="row"><span class="k">Luce</span><span class="pips">' + pips(p.luce, 'luce') + '</span><span class="v">' + p.luce + '</span></div>' +
      (sts ? '<div class="row sts">' + sts + '</div>' : '') +
      candle(G) +
      '<div class="turn">Turno ' + G.turn + ' · <b>' + (PHASE[G.phase] || G.phase) + '</b></div>';
    document.body.classList.toggle('pt-low', p.pt <= 2);
  }

  UI.hud = { render: render };
})(typeof window !== 'undefined' ? window : globalThis);
