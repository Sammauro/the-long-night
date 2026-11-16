// THE LONG NIGHT — camera ortografica inclinata, fissa, con respiro e scossa (BRIEF 8.1)
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  var R = TLN.render = TLN.render || {};

  var st = { shake: 0, base: null };

  function create(ctx) {
    var cam = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 200);
    var th = R.theme.camera, a = th.tilt * Math.PI / 180;
    st.base = new THREE.Vector3(0, Math.sin(a) * th.distance, Math.cos(a) * th.distance);
    cam.position.copy(st.base);
    cam.lookAt(0, 0, 0);
    R.scene.onUpdate(function (dt, t) {
      var b = th.breathe;
      var br = Math.sin(t * b.speed * Math.PI * 2) * b.amp;
      st.shake = Math.max(0, st.shake - dt * th.shake.decay * st.shake - dt * 0.05);
      var sx = (Math.random() - 0.5) * st.shake, sy = (Math.random() - 0.5) * st.shake;
      cam.position.set(st.base.x + sx + br * 0.6, st.base.y + sy + br, st.base.z);
      cam.lookAt(sx * 0.5, br * 0.5, 0);
    });
    return cam;
  }

  // Inquadra la griglia nello spazio lasciato libero dall'interfaccia
  function fit(ctx) {
    var cam = ctx.camera; if (!cam || !ctx.w) return;
    var th = R.theme.camera, m = th.margin;
    var narrow = ctx.w < 900;
    var side = narrow ? m.side * 0.7 : m.side, bottom = narrow ? m.bottom * 1.1 : m.bottom, top = m.top;
    var a = th.tilt * Math.PI / 180;
    var boardW = Math.sqrt(3) * 6.6, boardD = 1.5 * 8 + 1.2;
    var projH = boardD * Math.sin(a) + 2.4 * Math.cos(a);
    var availW = ctx.w * (1 - 2 * side), availH = ctx.h * (1 - top - bottom);
    var wpp = Math.max(boardW / availW, projH / availH);
    var yb = ctx.h * top + availH / 2;
    cam.left = -ctx.w / 2 * wpp; cam.right = ctx.w / 2 * wpp;
    cam.top = yb * wpp; cam.bottom = -(ctx.h - yb) * wpp;
    cam.updateProjectionMatrix();
  }

  function shake(k) { st.shake = Math.max(st.shake, R.theme.camera.shake.amp * (k || 1)); }

  R.camera = { create: create, fit: fit, shake: shake };
})(typeof window !== 'undefined' ? window : globalThis);
