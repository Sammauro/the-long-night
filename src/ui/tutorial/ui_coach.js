// THE LONG NIGHT — riquadro guida del tutorial e suggerimenti contestuali (BRIEF 9)
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  var UI = TLN.ui = TLN.ui || {};
  var u = UI.util;

  var C = { driver: null, hintQueue: [], hint: null, seen: {} };
  var KEY = 'tln_hints_seen';
  function loadSeen() {
    try {
      if (/[?&]hints=reset/.test(location.search)) localStorage.removeItem(KEY);
      C.seen = JSON.parse(localStorage.getItem(KEY) || '{}');
    } catch (e) { C.seen = C.seen || {}; }
  }
  function markSeen(id) { C.seen[id] = 1; try { localStorage.setItem(KEY, JSON.stringify(C.seen)); } catch (e) { /* solo in memoria */ } }

  // ── tutorial ──
  function onRunStart(run, opts) {
    if (C.driver) C.driver.stop();
    C.driver = null; C.hint = null; C.hintQueue = [];
    if (run.game.room.tutorial && !run.noScript) {
      C.driver = TLN.input.createTutorialDriver(run, UI.st.cmd, TLN.data.tutorialScript);
      C.driver.onStep(function () { UI.refresh(); });
    }
  }
  function skip() {
    if (C.driver) C.driver.stop();
    C.driver = null;
    UI.screens.start(TLN.data.runConfig.skipTutorialStart);
  }
  function blocking() { return !!(C.driver && C.driver.active && C.driver.guided()); }
  function highlights() {
    var s = C.driver && C.driver.active && C.driver.due() ? C.driver.step() : null;
    return s && s.highlight ? [{ cell: s.highlight, kind: 'select' }] : [];
  }

  // ── suggerimenti (una volta sola) ──
  var HINT_EVENTS = { WHISPER: 'firstWhisper', CHOIR: 'firstChoir', LIGHT_STOLEN: 'lightStolen', SEAL: 'firstSeal', ARMOR_ABSORB: 'armorAbsorb', VEGLIA_LAST: 'lastVeglia', PLANCIA_FULL: 'planciaFull' };
  function queueHint(id) {
    if (C.seen[id] || C.hintQueue.indexOf(id) >= 0 || (C.hint && C.hint === id)) return;
    C.hintQueue.push(id);
  }
  function onEngineEvent(ev) {
    var G = UI.st.run && UI.st.run.game;
    // un suggerimento non chiuso non passa alla stanza successiva (BUG-3): resta "visto", la coda riparte
    if (ev.type === 'ROOM_START') { C.hint = null; C.hintQueue = []; }
    if (HINT_EVENTS[ev.type]) queueHint(HINT_EVENTS[ev.type]);
    if (ev.type === 'SELECTION_START' && G && !G.room.tutorial && ev.data.turn > 0) {
      var cov = ev.data.coverage, any = Object.keys(cov).some(function (k) { return cov[k]; });
      if (any) queueHint('slotCovered');
      else if (C.hint === 'slotCovered') C.hint = null; // nessun dado bloccato: il suggerimento non serve più
    }
  }
  function checkStateHints() {
    var G = UI.st.G; if (!G || G.room.tutorial) return;
    var whisp = TLN.engine.state.aliveEnemies(G).some(function (e) { return e.type === 'sussurratore'; });
    if (whisp && G.hand.some(function (h) { return h.id === 'pm' || h.id === 'di'; })) queueHint('terrorCard');
  }
  function hintText(id) { return TLN.data.hints.filter(function (h) { return h.id === id; })[0].text; }

  function render() {
    var box = u.$('coach'); if (!box) return;
    checkStateHints();
    if (!C.hint && C.hintQueue.length && !UI.st.busy) { C.hint = C.hintQueue.shift(); markSeen(C.hint); }
    box.innerHTML = '';
    var run = UI.st.run, inTut = C.driver && C.driver.active && run && (run.game.room.tutorial || run.phase === 'SOGLIA');
    if (inTut) {
      var s = C.driver.step();
      var w = u.h('div', 'coach-box tut');
      if (C.driver.due()) w.innerHTML = '<div class="ct">Tutorial · passo ' + s.id + '/' + C.driver.total + '</div><p>' + s.text + '</p>';
      else w.innerHTML = '<div class="ct">Tutorial</div><p>Gioca liberamente il resto del turno.</p>';
      if (C.err && C.err.step === s) w.appendChild(u.h('p', 'tut-err', C.err.msg));
      var sk = u.h('button', 'btn ghost skip', 'Salta tutorial'); sk.onclick = skip; w.appendChild(sk);
      box.appendChild(w);
    }
    if (C.hint) {
      var hb = u.h('div', 'coach-box hint', '<div class="ct">Suggerimento</div><p>' + hintText(C.hint) + '</p>');
      var ok = u.h('button', 'btn', 'Ho capito'); ok.onclick = function () { C.hint = null; render(); };
      hb.appendChild(ok); box.appendChild(hb);
    }
    box.classList.toggle('on', !!box.firstChild);
    place(box);
  }
  // Colonna sinistra, subito sotto l'HUD (la cui altezza cambia con gli stati) e sopra la Plancia (BUG-3)
  function place(box) {
    var hud = u.$('hud'), pl = u.$('plancia'), hb = hud && hud.getBoundingClientRect();
    if (!box.classList.contains('on') || !hb || !hb.height) { box.style.top = ''; box.style.maxHeight = ''; return; }
    var pb = pl && pl.getBoundingClientRect(), top = Math.round(hb.bottom + 6);
    var bottom = pb && pb.height ? pb.top - 6 : window.innerHeight - 10;
    box.style.top = top + 'px';
    box.style.maxHeight = Math.max(80, Math.round(bottom - top)) + 'px';
  }
  if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('resize', function () { var b = u && u.$('coach'); if (b) place(b); });
  // Comando rifiutato dal tutorial: prima scuoteva solo il riquadro, senza dire perché (segnalazione dal telefono)
  function flash(msg) {
    var b = document.querySelector('#coach .coach-box.tut');
    if (b) {
      b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
      var e = b.querySelector('.tut-err') || b.insertBefore(u.h('p', 'tut-err', ''), b.querySelector('.skip'));
      e.textContent = msg;
    }
    C.err = { msg: msg, step: C.driver && C.driver.step() };
    UI.toast(msg);
  }
  // Dadi che il passo corrente chiede di tenere: uid → true (per evidenziarli nella Sequenza)
  function wantedDice(G) {
    var dr = C.driver; if (!dr || !dr.active || !dr.due()) return null;
    var s = dr.step(), tokens = s.keepLocked || s.keepRequired || (s.done && s.done.keep);
    if (!tokens) return null;
    var left = tokens.slice(), out = {};
    G.seq.forEach(function (x) { var k = x.kind + ':' + x.value, i = left.indexOf(k); if (x.kind !== 'ai' && i >= 0) { left.splice(i, 1); out[x.uid] = true; } });
    return { want: out, exact: !!(s.keepLocked || (s.done && s.done.keep)) };
  }
  // Il passo chiede di toccare un dado nemico?
  function wantsAiInspect() {
    var dr = C.driver; if (!dr || !dr.active || !dr.due()) return false;
    return (dr.step().allow || []).some(function (a) { return a.type === 'INSPECT_DIE' && a.ai; }) && dr.step().done && dr.step().done.cmd === 'INSPECT_DIE';
  }

  loadSeen();
  UI.onRunStart = onRunStart;
  UI.onEngineEvent = onEngineEvent;
  UI.coach = { render: render, blocking: blocking, highlights: highlights, skip: skip, flash: flash, wantedDice: wantedDice, wantsAiInspect: wantsAiInspect, state: C };
})(typeof window !== 'undefined' ? window : globalThis);
