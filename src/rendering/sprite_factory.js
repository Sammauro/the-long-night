// THE LONG NIGHT — da griglia di caratteri a canvas e texture (BRIEF 8.2)
// Uno sprite può in futuro avere "image" (URL di un PNG con i fotogrammi affiancati): in quel caso
// la griglia non serve e viene usata l'immagine.
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  TLN.render = TLN.render || {};

  // mode: 'full' | 'glow' (solo l'accento) | 'white' (sagoma bianca per il lampo) | 'dark' (sagoma scura)
  function frameCanvas(def, frame, mode, scale) {
    scale = scale || 1;
    var c = document.createElement('canvas');
    c.width = def.w * scale; c.height = def.h * scale;
    var g = c.getContext('2d');
    if (def.image) { drawImageFrame(g, def, frame, mode, scale); return c; }
    var rows = def.frames[frame % def.frames.length];
    for (var y = 0; y < rows.length; y++) {
      for (var x = 0; x < rows[y].length; x++) {
        var ch = rows[y][x];
        if (ch === '.') continue;
        var isGlow = def.glow.indexOf(ch) >= 0;
        var col;
        if (mode === 'glow') { if (!isGlow) continue; col = def.palette[ch]; }
        else if (mode === 'white') col = '#ffffff';
        else if (mode === 'dark') col = isGlow ? null : '#0a090d';
        else col = def.palette[ch];
        if (!col) continue;
        g.fillStyle = col;
        g.fillRect(x * scale, y * scale, scale, scale);
      }
    }
    return c;
  }

  // Striscia PNG (prova di stile B): fotogrammi quadrati affiancati, ritagliati con def.crop
  function drawImageFrame(g, def, frame, mode, scale) {
    var img = def.image, cr = def.crop, n = def.order[frame % def.order.length];
    if (mode === 'glow' || !img.complete || !img.naturalWidth) return;
    var fw = img.naturalHeight;
    g.imageSmoothingEnabled = false;
    g.drawImage(img, n * fw + cr.x, cr.y, cr.w, cr.h, 0, 0, cr.w * scale, cr.h * scale);
    if (mode === 'white' || mode === 'dark') {
      g.globalCompositeOperation = 'source-in';
      g.fillStyle = mode === 'white' ? '#ffffff' : '#0a090d';
      g.fillRect(0, 0, cr.w * scale, cr.h * scale);
      g.globalCompositeOperation = 'source-over';
    }
  }

  var cache = {};
  function texture(name, frame, mode) {
    var k = name + '|' + frame + '|' + mode;
    if (cache[k]) return cache[k];
    var def = TLN.render.sprites[name];
    if (def.image && !(def.image.complete && def.image.naturalWidth)) {
      // immagine non ancora caricata: texture vuota da ridisegnare al caricamento
      var c0 = frameCanvas(def, frame, mode), t0 = new THREE.CanvasTexture(c0);
      t0.magFilter = THREE.NearestFilter; t0.minFilter = THREE.NearestFilter; t0.generateMipmaps = false;
      def.image.addEventListener('load', function () {
        var g = c0.getContext('2d'); g.clearRect(0, 0, c0.width, c0.height);
        drawImageFrame(g, def, frame, mode, 1); t0.needsUpdate = true;
      });
      cache[k] = t0; return t0;
    }
    var t = new THREE.CanvasTexture(frameCanvas(def, frame, mode));
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    cache[k] = t;
    return t;
  }

  TLN.render.spriteFactory = { frameCanvas: frameCanvas, texture: texture };
})(typeof window !== 'undefined' ? window : globalThis);
