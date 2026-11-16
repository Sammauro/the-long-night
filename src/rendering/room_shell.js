// THE LONG NIGHT — guscio della stanza: pavimento, pareti basse, porta della Soglia (BRIEF 8.1)
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  var R = TLN.render = TLN.render || {};

  var S = { door: null, open: 0, target: 0 };

  function build(ctx, G) {
    var th = R.theme, g = new THREE.Group(); ctx.room.add(g);
    var w = Math.sqrt(3) * th.hex.size;
    var halfX = (G.grid.cols + 0.5) * w / 2 + 0.6, halfZ = (G.grid.rows - 1) * 1.5 / 2 + 1.5;
    var floor = new THREE.Mesh(new THREE.PlaneGeometry(halfX * 2 + 8, halfZ * 2 + 8), new THREE.MeshStandardMaterial({ color: 0x0d0c10, roughness: 1 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -th.hex.height / 2 - 0.02; g.add(floor);
    var wm = new THREE.MeshStandardMaterial({ color: th.wall.color, roughness: 0.95 });
    var hgt = th.wall.height, tk = th.wall.thickness, y0 = floor.position.y;
    function wall(x, z, sx, sz, h) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(sx, h, sz), wm);
      m.position.set(x, y0 + h / 2, z); g.add(m); return m;
    }
    // lati: blocchi irregolari
    for (var i = 0; i < 7; i++) {
      var z = -halfZ + (i + 0.5) * (halfZ * 2 / 7), hh = hgt * (0.75 + ((i * 37) % 10) / 30);
      wall(-halfX, z, tk, halfZ * 2 / 7 - 0.05, hh);
      wall(halfX, z, tk, halfZ * 2 / 7 - 0.05, hh * 0.95);
    }
    // parete lontana con la porta al centro
    var gap = 2.2;
    wall(-(halfX + gap / 2) / 2 - gap / 4, -halfZ, halfX - gap / 2, tk, hgt * 1.6);
    wall((halfX + gap / 2) / 2 + gap / 4, -halfZ, halfX - gap / 2, tk, hgt * 1.6);
    // parete vicina, molto bassa per non coprire la griglia
    wall(0, halfZ, halfX * 2, tk, hgt * 0.3);
    // porta: stipiti, architrave, battente luminoso
    var stone = new THREE.MeshStandardMaterial({ color: 0x2c2833, roughness: 0.9 });
    var dh = 2.6;
    [-gap / 2, gap / 2].forEach(function (x) {
      var pil = new THREE.Mesh(new THREE.BoxGeometry(0.35, dh, 0.5), stone); pil.position.set(x, y0 + dh / 2, -halfZ); g.add(pil);
    });
    var lint = new THREE.Mesh(new THREE.BoxGeometry(gap + 0.7, 0.35, 0.55), stone); lint.position.set(0, y0 + dh, -halfZ); g.add(lint);
    var glowMat = new THREE.MeshBasicMaterial({ color: th.door.glow, transparent: true, opacity: th.door.idleGlow, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
    var panel = new THREE.Mesh(new THREE.PlaneGeometry(gap - 0.35, dh - 0.2), glowMat); panel.position.set(0, y0 + dh / 2 - 0.05, -halfZ - 0.05); g.add(panel);
    var dl = new THREE.PointLight(th.door.glow, 0, 7, 1.5); dl.position.set(0, 1.4, -halfZ + 0.8); g.add(dl);
    S.door = { panel: panel, light: dl, cell: null };
    S.open = 0; S.target = 0;
    if (!S.reg) { S.reg = true; R.scene.onUpdate(update); }
  }
  function update(dt, t) {
    if (!S.door) return;
    S.open += (S.target - S.open) * Math.min(1, dt * 1.5);
    var idle = R.theme.door.idleGlow;
    S.door.panel.material.opacity = idle + S.open * (0.7 + 0.1 * Math.sin(t * 3));
    S.door.light.intensity = S.open * 1.8;
  }
  // A stanza vinta la porta si illumina: è la Soglia
  function setDoorOpen(on) { S.target = on ? 1 : 0; }

  R.shell = { build: build, setDoorOpen: setDoorOpen };
})(typeof window !== 'undefined' ? window : globalThis);
