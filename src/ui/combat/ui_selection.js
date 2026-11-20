// THE LONG NIGHT — pannello comandi: Selezione, Fine Turno, dado attivo, avanzamento (BRIEF 7, 6.3, 6.4)
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  var UI = TLN.ui = TLN.ui || {};
  var u = UI.util;

  function btn(label, cls, fn, disabled, title) {
    var b = u.h('button', 'btn ' + (cls || ''), label);
    b.disabled = !!disabled; if (title) b.title = title;
    b.onclick = function (e) { e.stopPropagation(); fn(); };
    return b;
  }

  function selection(G, box) {
    var plan = TLN.engine.dice.selectionPlan(G), p = G.player;
    var g = plan.gains;
    box.appendChild(u.h('div', 'sum',
      'Luce <b>' + p.luce + '</b>' + (g.luce ? ' +' + g.luce : '') + (plan.cost ? ' −' + plan.cost : '') + ' = <b class="' + (plan.luceAfter < 0 ? 'bad' : '') + '">' + plan.luceAfter + '</b>' +
      ' · PM <b>' + (p.pm + g.pm) + '</b> · PT <b>' + (p.pt + g.pt) + '</b>'));
    var why = !plan.ok ? 'Troppi dadi per gli slot' : !plan.affordable ? 'Luce insufficiente' : '';
    // nessun dado tenuto: lo diciamo prima della conferma (punto di confusione 1 del report di gioco)
    var mine = G.seq.filter(function (d) { return d.kind !== 'ai'; });
    var none = mine.length && !mine.some(function (d) { return G.sel.keep[d.uid]; });
    if (none) box.appendChild(u.h('div', 'sel-tip', 'Tocca un dado per tenerlo. Quelli non tenuti si scartano.'));
    box.appendChild(btn(none ? 'Conferma · scarti tutti i dadi' : 'Conferma', 'main', function () { UI.send({ type: 'SEL_CONFIRM' }); }, !!why, why));
    if (why) box.appendChild(u.h('div', 'warn', why));
  }

  function ecoSummary(G) {
    var tot = { pm: 0, luce: 0, shield: 0, counter: 0, rotate: 0, draw: 0, rotateAll: 0 };
    UI.st.staged.forEach(function (s) {
      var c = G.hand.filter(function (h) { return h.uid === s.uid; })[0]; if (!c) return;
      TLN.data.cards.byId[c.id].eco.forEach(function (fx) {
        if (fx.pm) tot.pm += fx.pm; if (fx.luce) tot.luce += fx.luce; if (fx.draw) tot.draw += fx.draw;
        if (fx.status) tot[fx.status] += fx.n; if (fx.rotate) tot.rotate += fx.rotate; if (fx.rotateAll) tot.rotateAll = 1;
      });
    });
    var out = [];
    if (tot.pm) out.push('+' + tot.pm + ' PM'); if (tot.luce) out.push('+' + tot.luce + ' Luce');
    if (tot.shield) out.push('+' + tot.shield + ' Scudo'); if (tot.counter) out.push('+' + tot.counter + ' Contrattacco');
    if (tot.rotate) out.push('ruota ' + tot.rotate + ' CD'); if (tot.rotateAll) out.push('ruota tutte le CD');
    if (tot.draw) out.push('pesca ' + tot.draw);
    return out.length ? out.join(' · ') : 'nessuno scarto';
  }
  function endTurn(G, box) {
    box.appendChild(u.h('div', 'sum', 'Scegli le carte da scartare per il loro Eco.<br>Eco: <b>' + ecoSummary(G) + '</b>'));
    if (UI.st.mode && UI.st.mode.kind === 'ecoRotate') box.appendChild(u.h('div', 'warn', 'Tocca in Plancia la carta da ruotare.'));
    box.appendChild(btn(UI.st.staged.length ? 'Scarta e prosegui' : 'Prosegui senza scartare', 'main', confirmDiscards));
  }
  function confirmDiscards() {
    var list = UI.st.staged.slice();
    UI.st.staged = [];
    var i = 0;
    (function next() {
      if (i < list.length) {
        var c = { type: 'ECO_DISCARD', card: list[i].uid }; if (list[i].rotate) c.rotate = list[i].rotate;
        i++;
        var r = UI.st.cmd.execute(c);
        if (!r.ok && !r.filtered) UI.toast(r.error);
        next(); return;
      }
      UI.send({ type: 'ECO_DONE' });
    })();
  }

  function nextLabel(G) {
    var r = G.res, i = r.cursor;
    if (r.active) return 'Dado successivo';
    while (i < G.seq.length && G.seq[i].state !== 'pending') i++;
    if (i >= G.seq.length) return 'Fine turno';
    var d = G.seq[i];
    return d.owner === 'P' ? 'Attiva ' + u.dieText(d) : 'Continua (' + d.owner + ')';
  }
  function resolution(G, box) {
    var r = G.res, pool = r.pool;
    if (r.active) {
      var d = G.seq[r.cursor];
      var imp = Object.keys(pool).filter(function (k) { return pool[k]; }).map(function (k) { return pool[k] + ' ' + u.ICON[k]; }).join(' + ') || 'nessuno';
      box.appendChild(u.h('div', 'sum', 'Dado attivo ' + u.dieText(d) + ' · impulsi: <b>' + imp + '</b>'));
      var m = u.h('div', 'man');
      if (pool.forza) m.appendChild(btn('Movimento Tattico<small>1 ✊ → +1 PM</small>', '', function () { UI.send({ type: 'MANEUVER', kind: 'tactical' }); }));
      if (pool.fuoco) m.appendChild(btn('Colpo a Distanza<small>1 🔥 → 1 Danno, gittata 3</small>', '', function () { UI.targeting.start({ kind: 'ranged' }); }));
      if (pool.presagio) {
        m.appendChild(btn('🔮 → ✊<small>+1 PT di costo</small>', '', function () { UI.confirmPT(1, function () { UI.send({ type: 'MANEUVER', kind: 'convert', to: 'forza' }); }); }));
        m.appendChild(btn('🔮 → 🔥<small>' + (r.convFire ? '1 PT' : 'gratis (1 PT, +1 PT)') + '</small>', '', function () { UI.send({ type: 'MANEUVER', kind: 'convert', to: 'fuoco' }); }));
      }
      box.appendChild(m);
    }
    var left = pool.forza + pool.fuoco + pool.presagio;
    var row = u.h('div', 'nav');
    if (r.lastMove) row.appendChild(btn('↶ Annulla movimento', 'ghost', function () { UI.send({ type: 'UNDO_MOVE' }); }));
    if (UI.st.mode) row.appendChild(btn('✕ Annulla scelta', 'ghost', function () { UI.targeting.cancel(); }));
    row.appendChild(btn(nextLabel(G) + ' <kbd>␣</kbd>', 'main', function () { advance(); }));
    box.appendChild(row);
    var ac = u.h('label', 'auto', '<input type="checkbox"' + (UI.st.autoContinue ? ' checked' : '') + '> continua da solo se non ho PM né carte gratuite');
    ac.querySelector('input').onchange = function (e) { UI.st.autoContinue = e.target.checked; };
    box.appendChild(ac);
    if (left && r.active) box.appendChild(u.h('div', 'hint-s', 'Impulsi non spesi: andranno persi.'));
  }

  function advance() {
    var G = UI.st.G;
    if (!G || G.phase !== 'RISOLUZIONE' || UI.st.busy) return;
    if (TLN.engine.cardFx.needsChoice(G)) { UI.cards.askReward(); return; }
    var pool = G.res.pool, left = pool.forza + pool.fuoco + pool.presagio;
    if (G.res.active && left && !UI.st.confirmedSkip) {
      UI.confirm('Restano ' + left + ' impulsi: passare al dado successivo?', function () { UI.st.confirmedSkip = true; advance(); });
      return;
    }
    UI.st.confirmedSkip = false;
    UI.send({ type: 'ADVANCE' });
  }

  function render() {
    var G = UI.st.G, box = u.$('controls'); if (!G || !box) return;
    box.innerHTML = '';
    if (G.phase === 'SELEZIONE') selection(G, box);
    else if (G.phase === 'FINE_TURNO') endTurn(G, box);
    else if (G.phase === 'RISOLUZIONE') resolution(G, box);
    var pv = UI.sequence.previewInfo();
    var pb = u.$('preview');
    if (pb) { pb.innerHTML = pv ? pv.text : ''; pb.classList.toggle('on', !!pv); }
  }

  UI.controls = { render: render, advance: advance, btn: btn };
})(typeof window !== 'undefined' ? window : globalThis);
