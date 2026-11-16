// THE LONG NIGHT — oggetti: Colonna, Braciere, Trappola (BRIEF 8.1, 5.5)
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  var R = TLN.render = TLN.render || {};

  var P = { traps: {}, braziers: [] };

  function column(c) {
    var th = R.theme.column, g = new THREE.Group();
    var mat = new THREE.MeshStandardMaterial({ color: th.color, roughness: 0.9 });
    var y = 0, seg = th.height / th.segments;
    for (var i = 0; i < th.segments; i++) {
      var last = i === th.segments - 1, h = last ? seg * 0.7 : seg * 0.94;
      var r = th.radius * (1 - i * 0.04);
      var m = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.97, r, h, 10), mat);
      m.position.y = y + h / 2;
      if (last) { m.rotation.z = 0.09; m.rotation.x = -0.05; }
      g.add(m); y += seg;
    }
    // cima spezzata: due schegge
    var chip = new THREE.Mesh(new THREE.ConeGeometry(th.radius * 0.5, 0.35, 5), mat);
    chip.position.set(0.12, y - seg * 0.18, 0.05); chip.rotation.z = 0.5; g.add(chip);
    var base = new THREE.Mesh(new THREE.CylinderGeometry(th.radius * 1.3, th.radius * 1.4, 0.18, 6), mat);
    base.position.y = 0.09; g.add(base);
    var rub = new THREE.Mesh(new THREE.DodecahedronGeometry(0.13), mat);
    rub.position.set(-0.45, 0.1, 0.3); g.add(rub);
    return g;
  }

  function brazier(c) {
    var th = R.theme.brazier, g = new THREE.Group();
    var iron = new THREE.MeshStandardMaterial({ color: 0x2b2522, roughness: 0.6, metalness: 0.4 });
    var foot = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.3, 0.8, 8), iron); foot.position.y = 0.4; g.add(foot);
    var bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.28, 0.35, 10, 1, true), iron); bowl.position.y = 0.95; g.add(bowl);
    bowl.material.side = THREE.DoubleSide;
    var coals = new THREE.Mesh(new THREE.CircleGeometry(0.42, 10), new THREE.MeshBasicMaterial({ color: 0xc8501c }));
    coals.rotation.x = -Math.PI / 2; coals.position.y = 1.0; g.add(coals);
    var light = new THREE.PointLight(th.color, th.intensity, th.distance, 1.8); light.position.y = 1.5; g.add(light);
    // scintille
    var n = th.sparks, pos = new Float32Array(n * 3), seeds = [];
    for (var i = 0; i < n; i++) seeds.push(Math.random());
    var geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    var pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffb060, size: 0.09, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
    g.add(pts);
    P.braziers.push({ light: light, pts: pts, seeds: seeds, coals: coals });
    return g;
  }

  function glyphTexture(color) {
    var cv = document.createElement('canvas'); cv.width = cv.height = 64;
    var x = cv.getContext('2d');
    x.strokeStyle = color; x.lineWidth = 4; x.lineCap = 'round';
    x.beginPath(); x.arc(32, 32, 20, 0, Math.PI * 2); x.stroke();
    x.beginPath(); x.moveTo(32, 14); x.lineTo(32, 50); x.moveTo(18, 24); x.lineTo(46, 40); x.moveTo(46, 24); x.lineTo(18, 40); x.stroke();
    var t = new THREE.CanvasTexture(cv); return t;
  }
  function trap(c) {
    var th = R.theme.trap, g = new THREE.Group();
    var plate = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.66, 0.04, 6), new THREE.MeshStandardMaterial({ color: th.plate, roughness: 0.5, metalness: 0.5 }));
    plate.position.y = 0.0; g.add(plate);
    var glyph = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), new THREE.MeshBasicMaterial({ map: glyphTexture(th.glyph), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    glyph.rotation.x = -Math.PI / 2; glyph.position.y = 0.03; g.add(glyph);
    g.userData.glyph = glyph;
    return g;
  }

  function build(ctx, G) {
    P.traps = {}; P.braziers = [];
    var group = new THREE.Group(); ctx.room.add(group); P.group = group;
    Object.keys(G.terrain).forEach(function (k) {
      var t = G.terrain[k], p = R.cellToWorld(t.at), y = R.hexes.topY(t.at);
      var obj = t.type === 'column' ? column(t.at) : t.type === 'brazier' ? brazier(t.at) : trap(t.at);
      obj.position.set(p.x, y, p.z);
      group.add(obj);
      if (t.type === 'trap') P.traps[k] = obj;
    });
    if (!P.reg) { P.reg = true; R.scene.onUpdate(update); }
  }

  function update(dt, t) {
    var th = R.theme;
    Object.keys(P.traps).forEach(function (k) {
      var gl = P.traps[k].userData.glyph;
      gl.material.opacity = 0.45 + 0.4 * Math.sin(t * th.trap.pulse * Math.PI);
    });
    P.braziers.forEach(function (b, i) {
      b.light.intensity = th.brazier.intensity * (1 - th.brazier.flicker * 0.5 + th.brazier.flicker * 0.5 * (Math.sin(t * 17 + i) + Math.sin(t * 9.3 + i * 2)) * 0.5 + Math.random() * 0.08);
      var pos = b.pts.geometry.attributes.position;
      for (var j = 0; j < b.seeds.length; j++) {
        var ph = (t * 0.6 + b.seeds[j]) % 1;
        pos.setXYZ(j, Math.sin(b.seeds[j] * 40 + t) * 0.25 * (1 - ph), 1.1 + ph * 1.4, Math.cos(b.seeds[j] * 30 + t) * 0.25 * (1 - ph));
      }
      pos.needsUpdate = true;
    });
  }

  // Una trappola scattata sparisce
  function removeTrap(c) {
    var k = c[0] + ',' + c[1], o = P.traps[k];
    if (o) { P.group.remove(o); delete P.traps[k]; }
  }

  R.props = { build: build, removeTrap: removeTrap };
})(typeof window !== 'undefined' ? window : globalThis);
