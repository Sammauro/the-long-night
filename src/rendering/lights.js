// THE LONG NIGHT — luci: ambiente freddo, luna, lanterna legata alla Luce, Buio (BRIEF 8.1)
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  var R = TLN.render = TLN.render || {};

  var L = { luce: 0, target: null, cur: null, dark: false, darkK: 1 };

  function create(ctx) {
    var th = R.theme.lights, sc = ctx.scene;
    L.amb = new THREE.AmbientLight(th.ambient.color, th.ambient.intensity); sc.add(L.amb);
    L.hemi = new THREE.HemisphereLight(th.hemi.sky, th.hemi.ground, th.hemi.intensity); sc.add(L.hemi);
    L.moon = new THREE.DirectionalLight(th.moon.color, th.moon.intensity);
    L.moon.position.set(th.moon.pos[0], th.moon.pos[1], th.moon.pos[2]); sc.add(L.moon);
    var lt = R.theme.lantern;
    L.lantern = new THREE.PointLight(lt.color, 1, 6, 1.6); sc.add(L.lantern);
    L.cur = lt.curve(0); L.target = lt.curve(0);
    R.scene.onUpdate(function (dt, t) {
      var k = Math.min(1, dt * 3);
      ['distance', 'intensity', 'sight'].forEach(function (p) { L.cur[p] += (L.target[p] - L.cur[p]) * k; });
      var fl = 1 + Math.sin(t * 13.1) * lt.flicker * 0.5 + Math.sin(t * 7.3) * lt.flicker * 0.5;
      L.lantern.intensity = L.cur.intensity * fl;
      L.lantern.distance = L.cur.distance;
      L.darkK += ((L.dark ? th.darkScale : 1) - L.darkK) * k;
      L.amb.intensity = th.ambient.intensity * L.darkK;
      L.hemi.intensity = th.hemi.intensity * L.darkK;
      L.moon.intensity = th.moon.intensity * L.darkK;
      var p = R.units && R.units.worldPos('P');
      if (p) L.lantern.position.set(p.x + 0.35, R.theme.lantern.height, p.z + 0.1);
    });
  }
  function setLuce(ctx, luce, instant) {
    L.luce = luce;
    L.target = R.theme.lantern.curve(luce);
    if (instant) L.cur = R.theme.lantern.curve(luce);
  }
  function setDark(ctx, on) { L.dark = !!on; document.body.classList.toggle('buio', !!on); }
  function sight() { return L.cur ? L.cur.sight : 3; }

  R.lights = { create: create, setLuce: setLuce, setDark: setDark, sight: sight, state: L };
})(typeof window !== 'undefined' ? window : globalThis);
