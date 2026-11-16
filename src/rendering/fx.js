// THE LONG NIGHT — riscontri visivi: numeri che salgono, esplosioni di particelle, scossa (BRIEF 8.2)
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  var R = TLN.render = TLN.render || {};

  var FX = { bursts: [], labels: [], layer: null };

  function init(layerEl) {
    FX.layer = layerEl;
    if (!FX.reg) { FX.reg = true; R.scene.onUpdate(update); }
  }

  function burst(x, y, z, color) {
    var n = R.theme.fx.particles, pos = new Float32Array(n * 3), vel = [];
    for (var i = 0; i < n; i++) {
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
      vel.push([(Math.random() - 0.5) * 3, Math.random() * 3 + 1, (Math.random() - 0.5) * 3]);
    }
    var geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    var pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: color || 0xffffff, size: 0.12, transparent: true, opacity: 1, depthWrite: false, blending: THREE.AdditiveBlending }));
    R.scene.ctx.scene.add(pts);
    FX.bursts.push({ pts: pts, vel: vel, t: 0, life: 0.9 });
  }

  // Testo che sale da una casella (danni, cure, PT, Luce...)
  function label(cell, text, cls) {
    if (!FX.layer) return;
    var el = document.createElement('div');
    el.className = 'fx-num ' + (cls || '');
    el.textContent = text;
    FX.layer.appendChild(el);
    FX.labels.push({ el: el, cell: cell.slice(), t: 0, life: R.theme.fx.numberTime, off: FX.labels.length % 3 });
  }

  function update(dt) {
    FX.bursts = FX.bursts.filter(function (b) {
      b.t += dt;
      var pos = b.pts.geometry.attributes.position;
      for (var i = 0; i < b.vel.length; i++) {
        b.vel[i][1] -= 5 * dt;
        pos.setXYZ(i, pos.getX(i) + b.vel[i][0] * dt, pos.getY(i) + b.vel[i][1] * dt, pos.getZ(i) + b.vel[i][2] * dt);
      }
      pos.needsUpdate = true;
      b.pts.material.opacity = Math.max(0, 1 - b.t / b.life);
      if (b.t >= b.life) { R.scene.ctx.scene.remove(b.pts); b.pts.geometry.dispose(); return false; }
      return true;
    });
    FX.labels = FX.labels.filter(function (l) {
      l.t += dt;
      var k = l.t / l.life;
      var s = R.scene.cellToScreen(l.cell, 2.2 + k * R.theme.fx.numberRise);
      l.el.style.transform = 'translate(' + (s.x - 20 + l.off * 10) + 'px,' + s.y + 'px)';
      l.el.style.opacity = String(Math.max(0, 1 - Math.max(0, k - 0.6) / 0.4));
      if (k >= 1) { l.el.remove(); return false; }
      return true;
    });
  }

  R.fx = { init: init, burst: burst, label: label };
})(typeof window !== 'undefined' ? window : globalThis);
