// THE LONG NIGHT — stato dell'interfaccia, invio comandi, riproduzione degli eventi (BRIEF 4, 7)
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  var UI = TLN.ui = TLN.ui || {};

  var st = UI.st = {
    run: null, G: null, bus: null, cmd: null,
    mode: null,            // modalità di puntamento (ui_targeting.js)
    preview: null,         // uid del dado IA in anteprima
    staged: [],            // Fine Turno: carte scelte per lo scarto [{uid, rotate}]
    busy: false, fast: false, queue: [],
    autoContinue: true, selectedEnemy: null, payFire: false
  };

  // ── helper DOM ──
  function $(id) { return document.getElementById(id); }
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }

  var ICON = { forza: '✊', fuoco: '🔥', presagio: '🔮', vigore: '✊', terrore: '🔮' };
  var STATUS_NAME = { shield: 'Scudo', vuln: 'Vulnerabile', vulnFire: 'Vuln. Fuoco', stun: 'Stordito', counter: 'Contrattacco' };
  var STATUS_ICON = { shield: '🛡', vuln: '💢', vulnFire: '🔥💢', stun: '💫', counter: '↩' };
  function unitName(id) {
    if (id === 'P') return 'Indagatore';
    var u = st.G && TLN.engine.state.unitById(st.G, id);
    return u ? TLN.data.enemies[u.type].name + ' ' + id.slice(1) : id;
  }
  function dieText(d) { return d.kind === 'ai' ? '☠' + d.value : ICON[d.kind] + (d.value + (d.bonus || 0)); }

  // ── comandi ──
  function send(cmd, opts) {
    if (st.busy) return { ok: false, error: 'Attendi' };
    var r = st.cmd.execute(cmd);
    if (!r.ok) {
      if (!r.filtered) UI.toast(r.error);
      UI.refresh();
      return r;
    }
    if (!opts || !opts.keepMode) st.mode = null;
    play();
    return r;
  }
  UI.send = send;

  // ── riproduzione degli eventi: il motore li ha già prodotti, qui li mostriamo con i loro tempi ──
  function wait(s) { return st.fast ? 0 : s; }
  function cellOf(id) { var u = TLN.engine.state.unitById(st.G, id); return u ? u.pos : null; }
  var R = function () { return TLN.render; };
  var HANDLERS = {
    MOVE: function (d) { return d.how === 'undo' ? (R().units.moveTo(d.unit, d.to, 0.01), 0) : wait(R().units.moveTo(d.unit, d.to, d.how === 'push' ? 0.12 : R().theme.moveStepTime)); },
    AI_ACTION: function (d) { UI.banner(unitName(d.enemy) + ' — ' + d.name); return wait(0.45); },
    DAMAGE: function (d) {
      var t = 0, at = cellOf(d.target);
      if (d.source && d.source !== d.target && d.cause !== 'Collisione' && d.cause !== 'Contrattacco') { var sc = cellOf(d.source); if (sc) t = R().units.lunge(d.source, at) * 0.5; }
      R().units.hit(d.target);
      if (at) {
        if (d.hpLoss) R().fx.label(at, '−' + d.hpLoss, d.dtype === 'fire' ? 'fire' : 'dmg');
        if (d.absorbed) R().fx.label(at, '🛡' + d.absorbed, 'shield');
        if (!d.hpLoss && !d.absorbed) R().fx.label(at, '0', 'shield');
      }
      if (d.target === 'P' && d.hpLoss) R().camera.shake(1);
      return wait(0.28 + t);
    },
    HEAL: function (d) { var at = cellOf(d.unit); if (at) R().fx.label(at, '+' + d.amount, 'heal'); return wait(0.2); },
    DIED: function (d) { return wait(R().units.die(d.unit) * 0.6); },
    TRAP: function (d) { R().props.removeTrap(d.at); R().fx.label(d.at, 'Trappola!', 'dmg'); return wait(0.2); },
    COLLISION: function (d) { var at = cellOf(d.target); if (at) R().fx.label(at, 'Collisione', 'dmg'); R().camera.shake(0.6); return wait(0.15); },
    RESOURCE: function (d) {
      var P = st.G.player;
      if (d.res === 'pt' && d.delta < 0) R().fx.label(P.pos, d.delta + ' PT', 'pt');
      if (d.res === 'pt' && d.delta > 0 && d.cause !== 'Scarto dado') R().fx.label(P.pos, '+' + d.delta + ' PT', 'pt');
      if (d.res === 'luce') { R().lights.setLuce(null, d.value); if (d.cause !== 'Scarto dado' && d.cause !== 'Recupero slot') R().fx.label(P.pos, (d.delta > 0 ? '+' : '') + d.delta + ' Luce', 'luce'); }
      return 0;
    },
    STATUS: function (d) { var at = cellOf(d.unit); if (at && d.delta > 0) R().fx.label(at, '+' + (STATUS_ICON[d.status] || '') + ' ' + STATUS_NAME[d.status], 'shield'); return wait(0.1); },
    CONE: function (d) { R().hexes.setHighlights(d.cells.map(function (c) { return { cell: c, kind: 'cone' }; })); return wait(0.35); },
    TURN_START: function (d) { UI.banner('Turno ' + d.turn); return 0; },
    BUIO: function () { UI.banner('Buio: −1 PT'); R().lights.setDark(null, true); return wait(0.6); },
    ROOM_WON: function () { R().shell.setDoorOpen(true); UI.banner('La stanza è libera'); return wait(0.6); },
    DEFEAT: function (d) { UI.banner(d.result === 'death' ? 'Morte' : 'Follia'); return wait(0.8); },
    STUN_SKIP: function (d) { UI.banner(unitName(d.enemy) + ' è stordito'); return wait(0.4); },
    DIE_OFF: function (d) { UI.banner('Il dado di ' + unitName(d.enemy) + ' si spegne'); return wait(0.35); },
    SEAL: function () { UI.banner('Un Sigillo copre uno slot'); return wait(0.4); },
    LIGHT_STOLEN: function () { return wait(0.15); }
  };

  function play() {
    if (st.busy) return;
    st.busy = true;
    document.body.classList.add('busy');
    R().hexes.setHighlights([]);
    (function step() {
      if (!st.queue.length) {
        st.busy = false; st.fast = false;
        document.body.classList.remove('busy');
        if (st.G && st.run.game === st.G) R().units.sync(st.G);
        UI.refresh();
        UI.afterPlay && UI.afterPlay();
        return;
      }
      var ev = st.queue.shift(), fn = HANDLERS[ev.type], t = 0;
      try { t = fn ? fn(ev.data) || 0 : 0; } catch (e) { console.error(e); }
      if (t > 0) setTimeout(step, t * 1000); else step();
    })();
  }
  UI.play = play;

  function toast(msg) {
    var el = $('toast'); if (!el) return;
    el.textContent = msg; el.classList.add('on');
    clearTimeout(toast.t); toast.t = setTimeout(function () { el.classList.remove('on'); }, 1800);
  }
  function banner(msg) {
    var el = $('banner'); if (!el) return;
    el.textContent = msg; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  }
  UI.toast = toast; UI.banner = banner;

  // ── finestre di scelta ──
  function choose(title, options) {
    var m = $('modal'); if (!m) return;
    m.innerHTML = '';
    var box = h('div', 'mbox', '<div class="mt">' + title + '</div>');
    var row = h('div', 'mopts');
    options.forEach(function (o) {
      var b = h('button', 'btn ' + (o.cls || ''), o.label);
      b.onclick = function () { m.classList.remove('on'); if (o.fn) o.fn(); };
      row.appendChild(b);
    });
    box.appendChild(row); m.appendChild(box); m.classList.add('on');
  }
  function confirm(msg, yes) { choose(msg, [{ label: 'Sì', cls: 'main', fn: yes }, { label: 'No', cls: 'ghost' }]); }
  // BRIEF 6.1 — un pagamento in PT che porterebbe a 0 è consentito ma chiede conferma
  function confirmPT(n, fn) {
    if (st.G.player.pt - n <= 0) confirm('Pagare ' + n + ' PT ti porta a 0: è Follia. Procedere?', fn); else fn();
  }
  UI.choose = choose; UI.confirm = confirm; UI.confirmPT = confirmPT;

  UI.util = { $: $, h: h, esc: esc, ICON: ICON, STATUS_NAME: STATUS_NAME, STATUS_ICON: STATUS_ICON, unitName: unitName, dieText: dieText };
})(typeof window !== 'undefined' ? window : globalThis);
