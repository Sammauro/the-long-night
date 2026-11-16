// THE LONG NIGHT — avvio dell'applicazione
// M3: visualizzatore della scena. Parametri: ?view=r0..r3 &luce=N &dark=1 &won=1
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  TLN.ui = TLN.ui || {};
  TLN.ui.boot = function () {
    var q = new URLSearchParams(location.search);
    document.getElementById('boot').style.display = 'none';
    var canvas = document.getElementById('gc');
    TLN.render.scene.init(canvas);
    TLN.render.fx.init(document.getElementById('fx-layer'));
    var run = TLN.engine.run.createRun({ seed: 7, start: q.get('view') || 'r1', only: true, noScript: true });
    var G = run.game;
    if (q.get('luce')) G.player.luce = +q.get('luce');
    TLN.render.scene.loadRoom(G);
    TLN.render.lights.setDark(null, q.get('dark') === '1');
    TLN.render.shell.setDoorOpen(q.get('won') === '1');
    TLN.debug = { run: run, G: G };
  };
})(typeof window !== 'undefined' ? window : globalThis);
