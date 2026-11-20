// THE LONG NIGHT — personaggi come billboard in pixel art, animati per trasformazione (BRIEF 8.2)
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  var R = TLN.render = TLN.render || {};

  var U = { views: {}, braziers: [] };
  var SPRITE_OF = { player: 'indagatore', zombie: 'zombie', sussurratore: 'sussurratore', falena: 'falena', custode: 'custode' };

  function makeView(ctx, u) {
    var th = R.theme.sprite, name = SPRITE_OF[u.kind === 'player' ? 'player' : u.type], def = R.sprites[name];
    var F = R.spriteFactory;
    var mat = new THREE.SpriteMaterial({ map: F.texture(name, 0, 'full'), transparent: true, alphaTest: 0.5, fog: false });
    var sp = new THREE.Sprite(mat);
    sp.center.set(0.5, 0);
    var px = def.pixel || th.pixel;
    sp.scale.set(def.w * px, def.h * px, 1);
    var gmat = new THREE.SpriteMaterial({ map: F.texture(name, 0, 'glow'), transparent: true, alphaTest: 0.5, fog: false, depthWrite: false });
    var gl = new THREE.Sprite(gmat);
    gl.center.set(0.5, 0); gl.scale.copy(sp.scale); gl.renderOrder = 2;
    var shadow = new THREE.Mesh(new THREE.CircleGeometry(0.5, 16), new THREE.MeshBasicMaterial({ color: th.shadow.color, transparent: true, opacity: th.shadow.opacity, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    var sw = Math.min(def.w * px, 1.6);
    shadow.scale.set(sw * th.shadow.scale, sw * 0.45, 1);
    var g = new THREE.Group();
    g.add(shadow); g.add(sp); g.add(gl);
    ctx.room.add(g);
    var p = R.cellToWorld(u.pos);
    var v = { id: u.id, name: name, def: def, group: g, sprite: sp, glow: gl, shadow: shadow,
      x: p.x, z: p.z, cell: u.pos.slice(), tween: null, flash: 0, alive: u.alive, fade: u.alive ? 1 : 0, phase: Math.random() * 6, lean: 0 };
    // prova di stile C: figura low-poly al posto dello sprite
    var fig = R.style && R.style.mode === 'c' ? R.style.figure(name) : null;
    if (fig) { sp.visible = false; gl.visible = false; g.add(fig); v.body = fig; }
    g.visible = u.alive;
    return v;
  }

  function build(ctx, G) {
    Object.keys(U.views).forEach(function (k) { delete U.views[k]; });
    [G.player].concat(G.enemies).forEach(function (u) { U.views[u.id] = makeView(ctx, u); });
    U.braziers = Object.keys(G.terrain).filter(function (k) { return G.terrain[k].type === 'brazier'; })
      .map(function (k) { return R.cellToWorld(G.terrain[k].at); });
    if (!U.reg) { U.reg = true; R.scene.onUpdate(update); }
  }

  var tint = null, white = null;
  function update(dt, t) {
    var th = R.theme.sprite;
    tint = tint || new THREE.Color(th.darkTint); white = white || new THREE.Color(1, 1, 1);
    var pv = U.views.P, sight = R.lights.sight();
    Object.keys(U.views).forEach(function (id) {
      var v = U.views[id], tw = v.tween;
      if (tw) {
        tw.t += dt;
        var k = Math.min(1, tw.t / tw.dur), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        if (tw.kind === 'move') { v.x = tw.x0 + (tw.x1 - tw.x0) * e; v.z = tw.z0 + (tw.z1 - tw.z0) * e; }
        if (tw.kind === 'lunge') { var s = Math.sin(k * Math.PI); v.x = tw.x0 + tw.dx * s; v.z = tw.z0 + tw.dz * s; }
        if (k >= 1) { v.tween = null; if (tw.kind === 'lunge') { v.x = tw.x0; v.z = tw.z0; } }
      }
      if (!v.alive) { v.fade = Math.max(0, v.fade - dt / th.deathTime); if (v.fade <= 0) v.group.visible = false; }
      var fr = Math.floor((t + v.phase) / (v.def.frameTime || th.frameTime)) % v.def.frames.length;
      if (fr !== v.frame || v.flash > 0 || v.flashWas) {
        v.frame = fr;
        var mode = v.flash > 0 ? 'white' : 'full';
        v.sprite.material.map = R.spriteFactory.texture(v.name, fr, mode);
        v.glow.material.map = R.spriteFactory.texture(v.name, fr, 'glow');
        v.flashWas = v.flash > 0;
      }
      v.flash = Math.max(0, v.flash - dt);
      var bob = Math.sin(t * th.bob.speed * Math.PI * 2 + v.phase) * th.bob.amp;
      var y = R.hexes.topY(v.cell) + (v.def.float || 0) + (v.def.float ? bob * 2 : 0);
      var shk = v.flash > 0 ? (Math.random() - 0.5) * 0.12 : 0;
      v.group.position.set(v.x + shk, 0, v.z);
      v.sprite.position.y = y + (v.def.float ? 0 : Math.max(0, bob));
      v.glow.position.y = v.sprite.position.y;
      v.glow.position.z = 0.03; v.glow.position.y += 0.02;
      v.shadow.position.y = R.hexes.topY(v.cell) + 0.01;
      var sc = v.alive ? 1 : 0.8 + 0.2 * v.fade;
      v.sprite.material.opacity = v.fade; v.glow.material.opacity = v.fade; v.shadow.material.opacity = th.shadow.opacity * v.fade;
      var px = v.def.pixel || th.pixel;
      v.sprite.scale.set(v.def.w * px * sc, v.def.h * px * (v.alive ? 1 : 0.6 + 0.4 * v.fade), 1);
      // fuori dal raggio della lanterna: sagoma scura con gli occhi accesi
      var b = 1;
      if (id !== 'P' && pv) {
        var d = Math.hypot(v.x - pv.x, v.z - pv.z) - sight;
        U.braziers.forEach(function (bp) { d = Math.min(d, Math.hypot(v.x - bp.x, v.z - bp.z) - 3); });
        b = Math.max(0.06, Math.min(1, 1 - d / 1.6));
      }
      v.sprite.material.color.copy(tint).lerp(white, b);
      if (v.body) bodyUpdate(v, b, sc, t);
    });
  }

  // figura low-poly: segue lo sprite (posizione, colpo, morte, buio)
  function bodyUpdate(v, b, sc, t) {
    var fig = v.body;
    fig.position.y = R.hexes.topY(v.cell);
    fig.rotation.y = Math.sin(t * 0.7 + v.phase) * 0.12;
    fig.scale.set(sc, v.alive ? 1 + Math.sin(t * 1.6 + v.phase) * 0.015 : 0.3 + 0.7 * v.fade, sc);
    fig.visible = v.fade > 0;
    var flash = v.flash > 0;
    fig.traverse(function (o) {
      if (!o.material) return;
      if (o.userData.e0 === undefined) { o.userData.e0 = o.material.emissive.getHex(); o.userData.c0 = o.material.color.clone(); }
      if (flash) o.material.emissive.setHex(0xffffff);
      else if (o.userData.e0) o.material.emissive.setHex(o.userData.e0);
      else o.material.emissive.copy(o.userData.c0).multiplyScalar(0.5 * b + 0.25); // silhouette leggibile anche in ombra
      o.material.color.copy(o.userData.c0).multiplyScalar(0.15 + 0.85 * b);
    });
  }

  function view(id) { return U.views[id]; }
  function worldPos(id) { var v = U.views[id]; return v ? { x: v.x, z: v.z, y: R.hexes.topY(v.cell) } : null; }

  // ── animazioni (restituiscono la durata in secondi) ──
  function moveTo(id, cell, dur) {
    var v = U.views[id]; if (!v) return 0;
    var p = R.cellToWorld(cell);
    v.tween = { kind: 'move', t: 0, dur: dur, x0: v.x, z0: v.z, x1: p.x, z1: p.z };
    v.cell = cell.slice();
    return dur;
  }
  function lunge(id, towardCell) {
    var v = U.views[id]; if (!v || !towardCell) return 0;
    var p = R.cellToWorld(towardCell), dx = p.x - v.x, dz = p.z - v.z, L = Math.hypot(dx, dz) || 1, a = R.theme.sprite.lunge;
    v.tween = { kind: 'lunge', t: 0, dur: 0.32, x0: v.x, z0: v.z, dx: dx / L * a, dz: dz / L * a };
    return 0.32;
  }
  function hit(id) { var v = U.views[id]; if (v) v.flash = R.theme.sprite.hitFlash; return R.theme.sprite.hitFlash; }
  function die(id) {
    var v = U.views[id]; if (!v) return 0;
    v.alive = false;
    if (R.fx) R.fx.burst(v.x, R.hexes.topY(v.cell) + 1, v.z, v.name === 'indagatore' ? 0xffd36a : 0x8a7f9a);
    return R.theme.sprite.deathTime;
  }
  // Allinea tutto allo stato del motore, senza animazioni
  function sync(G) {
    [G.player].concat(G.enemies).forEach(function (u) {
      var v = U.views[u.id]; if (!v) return;
      var p = R.cellToWorld(u.pos);
      v.tween = null; v.x = p.x; v.z = p.z; v.cell = u.pos.slice();
      if (u.alive) { v.alive = true; v.fade = 1; v.group.visible = true; }
      else if (v.alive) { v.alive = false; }
    });
  }

  R.units = { build: build, view: view, worldPos: worldPos, moveTo: moveTo, lunge: lunge, hit: hit, die: die, sync: sync };
})(typeof window !== 'undefined' ? window : globalThis);
