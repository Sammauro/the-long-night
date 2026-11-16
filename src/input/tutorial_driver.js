// THE LONG NIGHT — guida della Stanza 0: lascia passare solo il comando atteso a ogni passo (BRIEF 9.1)
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  TLN.input = TLN.input || {};

  function same(a, b) { return !!a && !!b && a[0] === b[0] && a[1] === b[1]; }

  // run: la run in corso · cmdBus: il bus dei comandi · script: TLN.data.tutorialScript
  function createDriver(run, cmdBus, script) {
    var S = TLN.engine.state;
    var d = { index: 0, active: true, lastCmd: null, listeners: [] };
    var steps = script.steps;
    function G() { return run.game; }
    function step() { return d.active ? steps[d.index] : null; }

    function dieTokens(keep) {
      return G().seq.filter(function (x) { return keep[x.uid]; }).map(function (x) { return x.kind + ':' + x.value; }).sort().join(',');
    }
    function keepIs(tokens) { return dieTokens(G().sel.keep) === tokens.slice().sort().join(','); }
    function hasKept(tokens) {
      var kept = G().seq.filter(function (x) { return G().sel.keep[x.uid]; }).map(function (x) { return x.kind + ':' + x.value; });
      return tokens.every(function (t) { var i = kept.indexOf(t); if (i < 0) return false; kept.splice(i, 1); return true; });
    }
    // Il passo è "in attesa" finché non arriva il suo momento (fase/turno, Soglia)
    function due(s) {
      if (!s) return false;
      if (d.latch === d.index) return true; // un passo iniziato resta attivo finché non è completato
      var ok = dueNow(s);
      if (ok) d.latch = d.index;
      return ok;
    }
    function dueNow(s) {
      if (s.at === 'SOGLIA') return run.phase === 'SOGLIA';
      if (run.phase !== 'COMBAT') return false;
      if (s.turn && G().turn !== s.turn) return false;
      if (s.phase && G().phase !== s.phase) return false;
      return true;
    }
    function done(s) {
      var c = s.done, g = G();
      if (c.cmd) return d.lastCmd === c.cmd;
      if (c.keep) return keepIs(c.keep);
      if (c.phase === 'WON') return run.history.some(function (h) { return h.room === script.roomId && h.result === 'win'; });
      if (c.phase) return g.phase === c.phase && (!c.turn || g.turn === c.turn);
      if (c.playerAt) return same(g.player.pos, c.playerAt);
      if (c.dead) return !S.unitById(g, c.dead).alive;
      if (c.activeKind) return g.res && g.res.active && g.seq[g.res.cursor].kind === c.activeKind;
      if (c.hp) return S.unitById(g, c.hp[0]).hp <= c.hp[1];
      if (c.playerShield) return S.statusCount(g.player, 'shield') >= c.playerShield;
      if (c.discarded) return g.ecoDiscarded.indexOf(c.discarded) >= 0;
      if (c.planciaHas) return TLN.engine.cards.entries(g).some(function (e) { return e.id === c.planciaHas; });
      return false;
    }
    // Il comando corrisponde a una delle voci "allow" del passo?
    function matches(cmd, a) {
      var g = G();
      if (a.type !== cmd.type) return false;
      if (a.ai && !g.seq.some(function (x) { return x.uid === cmd.die && x.kind === 'ai'; })) return false;
      if (a.card) {
        var h = g.hand.filter(function (x) { return x.uid === cmd.card; })[0];
        if (!h || h.id !== a.card) return false;
      }
      if (a.target && cmd.target !== a.target) return false;
      if (a.push && !same(cmd.push, a.push)) return false;
      if (a.to && !same(cmd.to, a.to)) return false;
      if (a.kind && cmd.kind !== a.kind) return false;
      if (a.action != null && cmd.action !== a.action) return false;
      if (a.untilActive != null && (g.res.active || g.res.cursor > a.untilActive)) return false;
      if (a.untilActiveKind && g.res.active && g.seq[g.res.cursor].kind === a.untilActiveKind) return false;
      return true;
    }
    function guided() { var s = step(); return !!s && due(s) && !s.free; }

    function filter(cmd) {
      var s = step();
      if (!s || !due(s) || s.free) return null;
      if (cmd.type === 'SEL_CONFIRM' && s.keepLocked && !keepIs(s.keepLocked)) return 'Tieni esattamente i dadi indicati';
      if (cmd.type === 'SEL_CONFIRM' && s.keepRequired && !hasKept(s.keepRequired)) return 'Tieni entrambi i dadi ✊';
      if ((s.allow || []).some(function (a) { return matches(cmd, a); })) return null;
      return 'Segui il passo del tutorial';
    }
    function check() {
      var moved = false;
      while (d.active) {
        var s = step();
        var byCmd = s.done.cmd && d.lastCmd === s.done.cmd;
        if (!byCmd && (!due(s) || !done(s))) break;
        d.index++; moved = true; d.lastCmd = null;
        if (d.index >= steps.length) d.active = false;
      }
      if (moved) d.listeners.forEach(function (fn) { fn(step()); });
    }
    var off = cmdBus.addFilter(filter);
    cmdBus.onExecuted(function (cmd, res) {
      if (!d.active || !res.ok) return;
      d.lastCmd = cmd.type;
      check();
    });

    d.step = step;
    d.due = function () { return due(step()); };
    d.guided = guided;
    d.check = check;
    d.onStep = function (fn) { d.listeners.push(fn); };
    d.stop = function () { d.active = false; off(); };
    d.total = steps.length;
    return d;
  }

  TLN.input.createTutorialDriver = createDriver;
})(typeof window !== 'undefined' ? window : globalThis);
