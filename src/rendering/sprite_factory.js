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

  var cache = {};
  function texture(name, frame, mode) {
    var k = name + '|' + frame + '|' + mode;
    if (cache[k]) return cache[k];
    var t = new THREE.CanvasTexture(frameCanvas(TLN.render.sprites[name], frame, mode));
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    cache[k] = t;
    return t;
  }

  TLN.render.spriteFactory = { frameCanvas: frameCanvas, texture: texture };
})(typeof window !== 'undefined' ? window : globalThis);
