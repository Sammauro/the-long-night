// THE LONG NIGHT — esagoni come prismi di pietra con bordi luminosi (BRIEF 8.1)
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  var R = TLN.render = TLN.render || {};

  var H = { tiles: {}, list: [] };

  // pseudo-casuale stabile per casella (solo estetica)
  function hash(r, e, k) { var x = Math.sin(r * 127.1 + e * 311.7 + k * 74.7) * 43758.5453; return x - Math.floor(x); }

  function build(ctx, G) {
    var th = R.theme.hex, hl = R.theme.highlight;
    H.tiles = {}; H.list = [];
    var group = new THREE.Group();
    ctx.room.add(group);
    var rad = th.size - th.gap;
    var ringGeo = new THREE.RingGeometry(rad * 0.80, rad * 0.96, 6, 1, Math.PI / 2);
    var fillGeo = new THREE.CircleGeometry(rad * 0.95, 6, Math.PI / 2);
    G.grid.allCells().forEach(function (c) {
      var p = R.cellToWorld(c);
      var hgt = th.height + (hash(c[0], c[1], 1) - 0.5) * 2 * th.heightJitter;
      var tone = 1 + (hash(c[0], c[1], 2) - 0.5) * 2 * th.colorJitter;
      var side = new THREE.MeshStandardMaterial({ color: new THREE.Color(th.color).multiplyScalar(tone * 0.8), roughness: th.roughness, metalness: 0 });
      var top = new THREE.MeshStandardMaterial({ color: new THREE.Color(th.top).multiplyScalar(tone), roughness: th.roughness, metalness: 0 });
      var geo = new THREE.CylinderGeometry(rad, rad * 1.02, hgt, 6, 1);
      var mesh = new THREE.Mesh(geo, [side, top, side]);
      mesh.position.set(p.x, hgt / 2 - th.height / 2, p.z);
      mesh.userData.cell = c.slice();
      group.add(mesh);
      var y = hgt - th.height / 2 + hl.lift;
      var ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
      var ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2; ring.position.set(p.x, y, p.z); ring.visible = false;
      var fillMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
      var fill = new THREE.Mesh(fillGeo, fillMat);
      fill.rotation.x = -Math.PI / 2; fill.position.set(p.x, y - 0.004, p.z); fill.visible = false;
      group.add(ring); group.add(fill);
      var tile = { cell: c, mesh: mesh, ring: ring, fill: fill, top: y, kind: null };
      H.tiles[c[0] + ',' + c[1]] = tile; H.list.push(tile);
    });
    if (!H.reg) { H.reg = true; R.scene.onUpdate(update); }
  }

  var updating = false;
  function update(dt, t) {
    var hl = R.theme.highlight;
    var pulse = 0.75 + 0.25 * Math.sin(t * hl.pulse * Math.PI);
    for (var i = 0; i < H.list.length; i++) {
      var tl = H.list[i];
      if (!tl.kind) continue;
      tl.ring.material.opacity = (tl.kind === 'select' ? 1 : 0.85) * pulse;
      tl.fill.material.opacity = (tl.kind === 'target' || tl.kind === 'cone' || tl.kind === 'danger' ? 0.22 : tl.kind === 'push' ? 0.18 : 0.08) * pulse;
    }
  }

  // highlights: [{ cell:[R,E], kind:'reach'|'target'|'cone'|'select'|'push'|'path'|'danger' }]
  function setHighlights(list) {
    var hl = R.theme.highlight;
    H.list.forEach(function (t) { t.kind = null; t.ring.visible = false; t.fill.visible = false; });
    (list || []).forEach(function (h) {
      var t = H.tiles[h.cell[0] + ',' + h.cell[1]];
      if (!t) return;
      t.kind = h.kind;
      t.ring.material.color.setHex(hl[h.kind] || 0xffffff);
      t.fill.material.color.setHex(hl[h.kind] || 0xffffff);
      t.ring.visible = true; t.fill.visible = true;
    });
  }
  function topY(c) { var t = H.tiles[c[0] + ',' + c[1]]; return t ? t.top : 0; }
  function pickables() { return H.list.map(function (t) { return t.mesh; }); }

  R.hexes = { build: build, setHighlights: setHighlights, topY: topY, pickables: pickables };
})(typeof window !== 'undefined' ? window : globalThis);
