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
    if (HINT_EVENTS[ev.type]) queueHint(HINT_EVENTS[ev.type]);
    if (ev.type === 'SELECTION_START' && G && !G.room.tutorial && ev.data.turn > 0) {
      var cov = ev.data.coverage; if (Object.keys(cov).some(function (k) { return cov[k]; })) queueHint('slotCovered');
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
      var sk = u.h('button', 'btn ghost skip', 'Salta tutorial'); sk.onclick = skip; w.appendChild(sk);
      box.appendChild(w);
    }
    if (C.hint) {
      var hb = u.h('div', 'coach-box hint', '<div class="ct">Suggerimento</div><p>' + hintText(C.hint) + '</p>');
      var ok = u.h('button', 'btn', 'Ho capito'); ok.onclick = function () { C.hint = null; render(); };
      hb.appendChild(ok); box.appendChild(hb);
    }
    box.classList.toggle('on', !!box.firstChild);
  }
  function flash(msg) {
    var b = document.querySelector('#coach .coach-box.tut');
    if (b) { b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); }
    else UI.toast(msg);
  }

  loadSeen();
  UI.onRunStart = onRunStart;
  UI.onEngineEvent = onEngineEvent;
  UI.coach = { render: render, blocking: blocking, highlights: highlights, skip: skip, flash: flash, state: C };
})(typeof window !== 'undefined' ? window : globalThis);
