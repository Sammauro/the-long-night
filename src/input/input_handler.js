// THE LONG NIGHT — click, tocco e tastiera sulla griglia, trattati insieme (BRIEF 2, 7)
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  TLN.input = TLN.input || {};

  function init(canvas) {
    var UI = TLN.ui, down = null, longT = null;
    canvas.addEventListener('pointerdown', function (e) {
      UI.st.touch = e.pointerType === 'touch';
      down = { x: e.clientX, y: e.clientY, t: Date.now(), long: false };
      clearTimeout(longT);
      // tocco prolungato = dettaglio (scheda del nemico)
      longT = setTimeout(function () {
        if (!down) return;
        down.long = true;
        var c = TLN.render.scene.pick(down.x, down.y);
        var unit = c && TLN.engine.state.unitAt(UI.st.G, c);
        if (unit && unit.kind === 'enemy') { UI.st.selectedEnemy = unit.id; UI.refresh(); }
      }, 500);
    });
    canvas.addEventListener('pointerup', function (e) {
      clearTimeout(longT);
      if (!down || down.long) { down = null; return; }
      var moved = Math.hypot(e.clientX - down.x, e.clientY - down.y) > 12;
      down = null;
      if (moved) return;
      if (UI.st.busy) { UI.st.fast = true; return; } // un tocco durante le animazioni le accelera
      var c = TLN.render.scene.pick(e.clientX, e.clientY);
      if (c) UI.targeting.onCell(c);
    });
    canvas.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      var c = TLN.render.scene.pick(e.clientX, e.clientY);
      UI.targeting.onHover(c);
    });
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    window.addEventListener('keydown', function (e) {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (UI.st.busy) { UI.st.fast = true; return; }
        var m = document.getElementById('modal');
        if (m && m.classList.contains('on')) return;
        UI.keySpace && UI.keySpace();
      }
      if (e.code === 'Escape') {
        var md = document.getElementById('modal');
        if (md && md.classList.contains('on')) { md.classList.remove('on'); return; }
        if (UI.st.mode) UI.targeting.cancel();
        else if (UI.st.pinned) { UI.st.pinned = false; UI.st.preview = null; UI.refresh(); }
      }
    });
  }

  TLN.input.handler = { init: init };
})(typeof window !== 'undefined' ? window : globalThis);
