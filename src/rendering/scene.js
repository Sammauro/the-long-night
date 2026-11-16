// THE LONG NIGHT — scena Three.js: renderer, ciclo di disegno, coordinate, selezione (BRIEF 8.1)
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  var R = TLN.render = TLN.render || {};

  var SQ3 = Math.sqrt(3);
  // [R, E] → coordinate di mondo. R1 vicino alla camera, R8 sul lato lontano (porta).
  function cellToWorld(c) {
    var s = R.theme.hex.size, w = SQ3 * s;
    var rows = TLN.data.rooms.grid.rows, cols = TLN.data.rooms.grid.cols;
    var x = (c[1] - 1 + ((c[0] & 1) ? 0.5 : 0)) * w - (cols - 0.5) * w / 2;
    var z = ((rows - 1) * 1.5 * s) / 2 - (c[0] - 1) * 1.5 * s;
    return { x: x, z: z };
  }

  var ctx = { updaters: [], clock: null, renderer: null, scene: null, camera: null, room: null, t: 0, frames: 0, fpsT: 0, fps: 0 };

  function init(canvas) {
    var th = R.theme;
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setClearColor(th.clear, 1);
    var scene = new THREE.Scene();
    scene.fog = new THREE.Fog(th.fog.color, th.fog.near, th.fog.far);
    ctx.renderer = renderer; ctx.scene = scene; ctx.canvas = canvas;
    ctx.clock = new THREE.Clock();
    ctx.camera = R.camera.create(ctx);
    R.lights.create(ctx);
    resize();
    window.addEventListener('resize', resize);
    loop();
    return ctx;
  }
  function resize() {
    var w = ctx.canvas.clientWidth || window.innerWidth, h = ctx.canvas.clientHeight || window.innerHeight;
    ctx.renderer.setSize(w, h, false);
    ctx.w = w; ctx.h = h;
    R.camera.fit(ctx);
  }
  function onUpdate(fn) { ctx.updaters.push(fn); }
  function loop() {
    requestAnimationFrame(loop);
    var dt = Math.min(0.05, ctx.clock.getDelta());
    ctx.t += dt;
    ctx.frames++; ctx.fpsT += dt;
    if (ctx.fpsT >= 1) { ctx.fps = ctx.frames / ctx.fpsT; ctx.frames = 0; ctx.fpsT = 0; }
    for (var i = 0; i < ctx.updaters.length; i++) ctx.updaters[i](dt, ctx.t);
    ctx.renderer.render(ctx.scene, ctx.camera);
  }

  // Costruisce la stanza dallo stato del motore (solo lettura)
  function loadRoom(G) {
    if (ctx.room) { ctx.scene.remove(ctx.room); }
    ctx.room = new THREE.Group();
    ctx.scene.add(ctx.room);
    ctx.G = G;
    R.hexes.build(ctx, G);
    R.props.build(ctx, G);
    R.shell.build(ctx, G);
    R.units.build(ctx, G);
    R.lights.setLuce(ctx, G.player.luce, true);
    R.lights.setDark(ctx, false);
    R.camera.fit(ctx);
  }

  // Selezione di una casella dal punto dello schermo
  var ray = null, ndc = null;
  function pick(clientX, clientY) {
    if (!ctx.camera || !R.hexes.pickables) return null;
    ray = ray || new THREE.Raycaster(); ndc = ndc || new THREE.Vector2();
    var rect = ctx.canvas.getBoundingClientRect();
    ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    ray.setFromCamera(ndc, ctx.camera);
    var hit = ray.intersectObjects(R.hexes.pickables(), false)[0];
    return hit ? hit.object.userData.cell : null;
  }
  // Coordinate di schermo (px) di un punto di mondo
  var v3 = null;
  function toScreen(x, y, z) {
    v3 = v3 || new THREE.Vector3();
    v3.set(x, y, z).project(ctx.camera);
    return { x: (v3.x + 1) / 2 * ctx.w, y: (1 - v3.y) / 2 * ctx.h };
  }
  function cellToScreen(c, y) { var p = cellToWorld(c); return toScreen(p.x, y || 0.5, p.z); }

  R.cellToWorld = cellToWorld;
  R.scene = { ctx: ctx, init: init, resize: resize, onUpdate: onUpdate, loadRoom: loadRoom, pick: pick, toScreen: toScreen, cellToScreen: cellToScreen };
})(typeof window !== 'undefined' ? window : globalThis);
