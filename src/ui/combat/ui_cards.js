// THE LONG NIGHT — mano (Azioni sopra, Eco sotto), carta aperta, scarti di Fine Turno (BRIEF 7, 6.5)
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  var UI = TLN.ui = TLN.ui || {};
  var u = UI.util, E = function () { return TLN.engine; };

  function cardEl(def, opts) {
    var el = u.h('div', 'card' + (def.cd ? ' has-cd' : '') + (def.fireSlot ? ' fire' : '') + (opts.cls ? ' ' + opts.cls : ''));
    var acts = (def.preText ? '<p class="pre">' + def.preText + '</p>' : '') +
      def.actions.map(function (a, i) { return '<p class="act a' + i + '">' + a.text + '</p>'; }).join('') +
      (def.postText ? '<p class="pre">' + def.postText + '</p>' : '');
    el.innerHTML = '<div class="hd"><span class="nm">' + def.name + '</span>' + (def.cd ? '<span class="cdb">CD ' + def.cd + '</span>' : '') + '</div>' +
      '<div class="acts">' + acts + '</div><div class="eco"><span>Eco</span> ' + def.ecoText + '</div>';
    return el;
  }

  function playable(G, inst) {
    var def = TLN.data.cards.byId[inst.id];
    if (G.phase !== 'RISOLUZIONE') return false;
    if (def.free) return !G.res.open && E().cardFx.spotAfterClose(G, def) !== null; // Q3
    return !E().check(G, { type: 'OPEN_CARD', card: inst.uid });
  }

  function onCard(inst) {
    var G = UI.st.G, def = TLN.data.cards.byId[inst.id];
    if (G.phase === 'FINE_TURNO') { stage(inst, def); return; }
    if (G.phase !== 'RISOLUZIONE') return;
    if (def.free) { UI.targeting.start({ kind: 'free', card: inst.uid, free: def.free }); return; }
    UI.send({ type: 'OPEN_CARD', card: inst.uid });
  }

  // ── Fine Turno: scelta degli scarti, nell'ordine in cui si toccano ──
  function stage(inst, def) {
    var st = UI.st, i = st.staged.map(function (s) { return s.uid; }).indexOf(inst.uid);
    if (i >= 0) { st.staged.splice(i, 1); st.mode = null; UI.refresh(); return; }
    var entry = { uid: inst.uid, rotate: null };
    st.staged.push(entry);
    var rot = def.eco.some(function (fx) { return fx.rotate; });
    var targets = E().cards.entries(UI.st.G).filter(function (e) { return e.cd > 0; });
    if (rot && targets.length) {
      entry.rotate = E().cards.defaultRotateTarget(UI.st.G);
      if (targets.length > 1) { st.mode = { kind: 'ecoRotate', idx: st.staged.length - 1 }; UI.toast('Tocca la carta in Plancia da ruotare'); }
    }
    UI.refresh();
  }
  function setRotateTarget(pid) {
    var m = UI.st.mode; if (!m || m.kind !== 'ecoRotate') return;
    UI.st.staged[m.idx].rotate = pid;
    UI.st.mode = null; UI.refresh();
  }

  function renderHand() {
    var G = UI.st.G, box = u.$('hand'); if (!G || !box) return;
    box.innerHTML = '';
    G.hand.forEach(function (inst) {
      var def = TLN.data.cards.byId[inst.id];
      var si = UI.st.staged.map(function (s) { return s.uid; }).indexOf(inst.uid);
      var cls = G.phase === 'FINE_TURNO' ? (si >= 0 ? 'staged' : 'discardable') : playable(G, inst) ? 'playable' : 'idle';
      var el = cardEl(def, { cls: cls });
      if (si >= 0) el.appendChild(u.h('span', 'order', String(si + 1)));
      el.onclick = function () { if (el._long) { el._long = false; return; } onCard(inst); };
      // tocco prolungato (o tasto destro) = dettaglio della carta
      var t = null;
      el.addEventListener('pointerdown', function () { t = setTimeout(function () { el._long = true; showCard(def); }, 450); });
      el.addEventListener('pointerup', function () { clearTimeout(t); });
      el.addEventListener('pointerleave', function () { clearTimeout(t); });
      el.addEventListener('contextmenu', function (e) { e.preventDefault(); clearTimeout(t); el._long = false; showCard(def); });
      box.appendChild(el);
    });
    box.classList.toggle('empty', !G.hand.length);
  }

  // ── carta aperta ──
  function actionState(G, o, i) {
    var a = o.def.actions[i];
    var free = !a.cost || !Object.keys(a.cost).length;
    if (i < o.next || (free && o.usedOnce[i])) return 'used';
    var c = E().cardFx.costOf(G, o.def, a, { x: 1, pay: UI.st.payFire ? 'fuoco' : undefined });
    return c.error ? 'locked' : 'ok';
  }
  function renderOpen() {
    var G = UI.st.G, box = u.$('open-card'); if (!G || !box) return;
    var o = G.res && G.res.open;
    box.innerHTML = ''; box.classList.toggle('on', !!o);
    if (!o) return;
    box.appendChild(u.h('div', 'oc-t', o.def.name + (o.def.baseRange ? ' · gittata ' + o.range : '') + (o.hpDamage ? ' · danni agli HP ' + o.hpDamage : '')));
    var amp = TLN.data.cards.amplifiable.indexOf(o.def.id) >= 0 && G.res.pool.fuoco > 0;
    if (amp) {
      var t = u.h('label', 'amp', '<input type="checkbox"' + (UI.st.payFire ? ' checked' : '') + '> paga con 🔥 (danno Fuoco +1)');
      t.querySelector('input').onchange = function (e) { UI.st.payFire = e.target.checked; UI.refresh(); };
      box.appendChild(t);
    } else UI.st.payFire = false;
    o.def.actions.forEach(function (a, i) {
      var s = actionState(G, o, i);
      var c = s === 'ok' ? E().cardFx.costOf(G, o.def, a, { x: 1, pay: UI.st.payFire ? 'fuoco' : undefined }) : null;
      var viaFire = c && c.payer === 'fuoco' && a.cost && a.cost.forza;
      var b = u.h('button', 'act-btn ' + s, '<b>A' + (i + 1) + '</b> ' + a.text + (viaFire ? ' <em class="via">· paghi 🔥, danno Fuoco</em>' : ''));
      b.disabled = s !== 'ok';
      b.onclick = function () { UI.targeting.startAction(i); };
      box.appendChild(b);
    });
    var row = u.h('div', 'oc-row');
    row.appendChild(UI.controls.btn('Chiudi carta', '', function () { closeCard(); }));
    if (!o.usedAny && !o.drew) row.appendChild(UI.controls.btn('Rimetti in mano', 'ghost', function () { UI.send({ type: 'CANCEL_CARD' }); }));
    box.appendChild(row);
  }
  function closeCard() {
    if (E().cardFx.needsChoice(UI.st.G)) askReward(); else UI.send({ type: 'CLOSE_CARD' });
  }
  // Attacco Strategico: per ogni danno agli HP, +1 PM oppure +1 Scudo
  function askReward() {
    var n = UI.st.G.res.open.hpDamage, opts = [];
    for (var k = n; k >= 0; k--) (function (k) {
      opts.push({ label: (k ? k + ' PM' : '') + (k && n - k ? ' + ' : '') + (n - k ? (n - k) + ' Scudi' : ''), fn: function () { UI.send({ type: 'CLOSE_CARD', reward: { pm: k } }); } });
    })(k);
    UI.choose('Attacco Strategico: ' + n + ' danni agli HP. Scegli la ricompensa.', opts);
  }

  function showCard(def) {
    var m = u.$('modal'); m.innerHTML = '';
    var box = u.h('div', 'mbox card-detail'); box.appendChild(cardEl(def, {}));
    m.appendChild(box); m.classList.add('on');
    m.onclick = function () { m.classList.remove('on'); m.onclick = null; };
  }
  function render() { renderHand(); renderOpen(); }

  UI.cards = { render: render, cardEl: cardEl, setRotateTarget: setRotateTarget, askReward: askReward, closeCard: closeCard };
})(typeof window !== 'undefined' ? window : globalThis);
