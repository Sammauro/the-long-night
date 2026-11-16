// THE LONG NIGHT — la Sequenza Vincolata e l'anteprima dei dadi IA (BRIEF 7)
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  var UI = TLN.ui = TLN.ui || {};
  var u = UI.util;

  var portraitCache = {};
  var SPRITE_OF = { zombie: 'zombie', sussurratore: 'sussurratore', falena: 'falena', custode: 'custode' };
  function portrait(type) {
    if (portraitCache[type]) return portraitCache[type];
    var def = TLN.render.sprites[SPRITE_OF[type]];
    var c = TLN.render.spriteFactory.frameCanvas(def, 0, 'full', 1);
    var out = document.createElement('canvas'); out.width = 24; out.height = 24;
    var g = out.getContext('2d'); g.imageSmoothingEnabled = false;
    var s = Math.min(24 / def.w, 24 / (def.h * 0.55)) * 1.0;
    g.drawImage(c, 0, 0, def.w, def.h * 0.55, (24 - def.w * s) / 2, 0, def.w * s, def.h * 0.55 * s);
    portraitCache[type] = out.toDataURL();
    return portraitCache[type];
  }

  function dieEl(G, d, plan) {
    var el = u.h('div', 'die k-' + d.kind + ' s-' + d.state);
    el.dataset.uid = d.uid;
    if (d.kind === 'ai') {
      var e = TLN.engine.state.unitById(G, d.owner), act = TLN.data.enemies[d.enemyType].actions[d.actionId];
      el.innerHTML = '<img class="por" src="' + portrait(d.enemyType) + '"><span class="ai-act">' + act.icon + '</span><span class="val">' + d.value + '</span><span class="own">' + d.owner + '</span>';
      el.title = u.unitName(d.owner) + ': ' + act.name + ' — ' + act.text;
      if (!e || !e.alive) el.classList.add('dead');
    } else {
      el.innerHTML = '<span class="ic">' + u.ICON[d.kind] + '</span><span class="val">' + (d.value + d.bonus) + '</span>' + (d.infused ? '<span class="inf">+1</span>' : '');
    }
    if (plan && d.kind !== 'ai') {
      var info = plan.dice[d.uid];
      el.classList.add(UI.st.G.sel.keep[d.uid] ? 'kept' : 'dropping');
      var lab = UI.st.G.sel.keep[d.uid] ? info.label : 'scarta: ' + rewardText(TLN.data.dice.types[d.kind].discard);
      el.appendChild(u.h('span', 'lab' + (info.label === 'nessuno slot' && UI.st.G.sel.keep[d.uid] ? ' bad' : ''), lab));
      if (!UI.st.G.sel.keep[d.uid]) el.appendChild(u.h('span', 'lab2', 'tieni: ' + info.label));
    }
    if (UI.st.preview === d.uid) el.classList.add('peek');
    if (UI.targeting.wantsDie && UI.targeting.wantsDie(d)) el.classList.add('pickable');
    el.onclick = function () { onDie(d); };
    el.onmouseenter = function () { if (d.kind === 'ai' && !UI.st.pinned) { UI.st.preview = d.uid; UI.refreshPreview(); } };
    el.onmouseleave = function () { if (d.kind === 'ai' && !UI.st.pinned && UI.st.preview === d.uid) { UI.st.preview = null; UI.refreshPreview(); } };
    return el;
  }
  function rewardText(r) { return Object.keys(r).map(function (k) { return '+' + r[k] + ' ' + { pm: 'PM', luce: 'Luce', pt: 'PT' }[k]; }).join(' '); }

  function onDie(d) {
    var G = UI.st.G;
    if (UI.targeting.wantsDie && UI.targeting.wantsDie(d)) { UI.targeting.onDie(d); return; }
    if (d.kind === 'ai') {
      UI.st.pinned = UI.st.preview === d.uid && UI.st.pinned ? false : true;
      UI.st.preview = UI.st.pinned ? d.uid : null;
      UI.send({ type: 'INSPECT_DIE', die: d.uid }, { keepMode: true });
      return;
    }
    if (G.phase === 'SELEZIONE') UI.send({ type: 'SEL_TOGGLE', die: d.uid });
  }

  function render() {
    var G = UI.st.G, box = u.$('seq'); if (!G || !box) return;
    box.innerHTML = '';
    var plan = G.phase === 'SELEZIONE' ? TLN.engine.dice.selectionPlan(G) : null;
    var cur = G.res ? G.res.cursor : -1;
    G.seq.forEach(function (d, i) {
      if (G.phase === 'RISOLUZIONE' && i === cur && !G.res.active) box.appendChild(u.h('div', 'cursor', '▸'));
      var el = dieEl(G, d, plan);
      if (UI.st.justRolled) el.classList.add('rolling');
      box.appendChild(el);
    });
    if (G.phase === 'RISOLUZIONE' && cur >= G.seq.length) box.appendChild(u.h('div', 'cursor', '▸'));
    if (G.seqDropped && G.seqDropped.length && G.phase !== 'SELEZIONE') {
      var dr = u.h('div', 'dropped', '<small>scartati</small>');
      G.seqDropped.forEach(function (d) { dr.appendChild(u.h('span', 'mini k-' + d.kind, u.ICON[d.kind] + d.value)); });
      box.appendChild(dr);
    }
    UI.st.justRolled = false;
  }

  // Anteprima del dado IA: evidenzia il nemico, il percorso previsto e il danno che farebbe adesso
  function previewInfo() {
    var G = UI.st.G, uid = UI.st.preview; if (!G || !uid) return null;
    var d = G.seq.filter(function (x) { return x.uid === uid; })[0];
    if (!d || d.kind !== 'ai') return null;
    var e = TLN.engine.state.unitById(G, d.owner);
    if (!e || !e.alive) return { die: d, dead: true, text: u.unitName(d.owner) + ' è morto: il dado è spento.' };
    var pv = TLN.engine.ai.preview(G, e, d.actionId), act = TLN.data.enemies[e.type].actions[d.actionId];
    var parts = [];
    if (pv.path.length) parts.push(pv.flight ? 'vola di fianco a te' : 'si muove di ' + pv.path.length);
    if (act.dmg != null || act.stealLight) {
      if (!pv.reach) parts.push('non ti raggiunge');
      else {
        if (pv.steal) parts.push('ruba ' + pv.steal + ' Luce');
        if (pv.raw) parts.push(pv.dmg + ' danni' + (pv.absorbed ? ' (' + pv.absorbed + ' assorbiti)' : ''));
        if (pv.push) parts.push('ti spinge');
      }
    }
    if (pv.ptLoss != null) parts.push(pv.reach ? '−' + pv.ptLoss + ' PT' : 'fuori gittata');
    if (pv.seal) parts.push(pv.seal === 'sigillo' ? 'Sigillo sulla Plancia' : '−1 Luce (Plancia piena)');
    if (pv.shield) parts.push('+' + pv.shield + ' Scudi');
    if (S().statusCount(e, 'stun')) parts = ['è stordito: salta'];
    return { die: d, enemy: e, pv: pv, text: '<b>' + u.unitName(e.id) + '</b> · ' + act.name + ': ' + parts.join(', ') };
  }
  function S() { return TLN.engine.state; }

  UI.sequence = { render: render, previewInfo: previewInfo, portrait: portrait };
})(typeof window !== 'undefined' ? window : globalThis);
