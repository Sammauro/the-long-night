// THE LONG NIGHT — PROVA DI STILE (branch prova-demo, non fonte di verità)
// ?style=b → sprite PixelLab su ambiente 3D (HD-2D)
// ?style=c → low-poly + dithering a palette ristretta, legato alla Luce
// senza parametro → resa attuale invariata
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  var R = TLN.render = TLN.render || {};

  var q = (typeof location !== 'undefined') ? new URLSearchParams(location.search) : null;
  var mode = q && q.get('style');
  mode = (mode === 'b' || mode === 'c') ? mode : 'base';
  if (typeof document !== 'undefined') document.documentElement.setAttribute('data-style', mode);

  // ── B: sprite PixelLab (strisce di fotogrammi 92×92, ritagliate sulla figura) ──
  var CROP = { x: 20, y: 8, w: 52, h: 76 };
  var PIXEL_B = 0.037;  // unità di mondo per pixel: figura alta ~2.7 come gli sprite attuali
  function useStrip(name, file, order) {
    var def = R.sprites[name]; if (!def) return;
    var img = new Image();
    img.src = 'assets/sprites/pixellab/' + file;
    def.image = img; def.crop = CROP; def.order = order;
    def.w = CROP.w; def.h = CROP.h; def.pixel = PIXEL_B; def.frameTime = 0.22;
    def.frames = order.map(function () { return []; }); // la lunghezza guida il ciclo dei fotogrammi
    def.glow = '';
  }
  function applyB() {
    useStrip('indagatore', 'player_idle.png', [1, 2, 3, 2]); // il fotogramma 0 perde la lanterna (difetto AI)
    useStrip('zombie', 'zombie_idle.png', [0, 1, 2, 3]);
  }

  // ── C: figure low-poly costruite in codice ──
  function mat(c, e) { return new THREE.MeshLambertMaterial({ color: c, emissive: e || 0x000000, flatShading: true }); }
  function part(g, geo, m, x, y, z, rx, rz) {
    var o = new THREE.Mesh(geo, m); o.position.set(x, y, z);
    if (rx) o.rotation.x = rx; if (rz) o.rotation.z = rz; g.add(o); return o;
  }
  var FIG = {
    indagatore: function () {
      var g = new THREE.Group(), coat = mat(0x524c68), skin = mat(0xe0c09a), brass = mat(0xc9a84c, 0xffb54a);
      part(g, new THREE.CylinderGeometry(0.32, 0.5, 1.5, 6), coat, 0, 0.75, 0);
      part(g, new THREE.DodecahedronGeometry(0.26, 0), skin, 0, 1.72, 0);
      part(g, new THREE.CylinderGeometry(0.46, 0.46, 0.06, 7), coat, 0, 1.92, 0);
      part(g, new THREE.CylinderGeometry(0.2, 0.26, 0.3, 6), coat, 0, 2.08, 0);
      part(g, new THREE.BoxGeometry(0.16, 0.24, 0.16), brass, 0.5, 0.75, 0.15);
      g.userData.h = 2.2; return g;
    },
    zombie: function () {
      var g = new THREE.Group(), cloth = mat(0x7a7488), skin = mat(0x9aa878), eye = mat(0xd8e8c0, 0xb0d090);
      part(g, new THREE.CylinderGeometry(0.22, 0.3, 0.8, 5), cloth, 0, 0.4, 0);
      part(g, new THREE.BoxGeometry(0.62, 0.7, 0.36), cloth, 0, 1.15, 0.08, 0.35);
      part(g, new THREE.DodecahedronGeometry(0.24, 0), skin, 0, 1.6, 0.32);
      part(g, new THREE.BoxGeometry(0.14, 0.14, 0.04), eye, 0, 1.62, 0.55);
      part(g, new THREE.BoxGeometry(0.14, 0.75, 0.14), skin, -0.38, 1.05, 0.35, -0.9);
      part(g, new THREE.BoxGeometry(0.14, 0.75, 0.14), skin, 0.38, 1.0, 0.3, -0.7);
      g.userData.h = 1.9; return g;
    }
  };
  function figure(name) { return FIG[name] ? FIG[name]() : null; }

  // ── C: post-processing — bassa risoluzione + dithering ordinato (Bayer 4×4) ──
  var PP = null;
  var VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  var FS = [
    'uniform sampler2D tDiffuse; uniform vec2 uRes; uniform float uLevels; uniform float uSat; uniform float uGain; varying vec2 vUv;',
    'float bayer(vec2 p){ int x = int(mod(p.x,4.0)); int y = int(mod(p.y,4.0)); int i = x + y*4;',
    ' float m[16]; m[0]=0.;m[1]=8.;m[2]=2.;m[3]=10.;m[4]=12.;m[5]=4.;m[6]=14.;m[7]=6.;m[8]=3.;m[9]=11.;m[10]=1.;m[11]=9.;m[12]=15.;m[13]=7.;m[14]=13.;m[15]=5.;',
    ' for (int k=0;k<16;k++){ if(k==i) return m[k]/16.0; } return 0.0; }',
    'void main(){ vec2 px = floor(vUv*uRes); vec3 c = texture2D(tDiffuse, (px+0.5)/uRes).rgb;',
    ' float l = dot(c, vec3(0.299,0.587,0.114)); c = mix(vec3(l), c, uSat);',
    ' c = clamp((pow(c * uGain, vec3(0.75)) - 0.10) / 0.90, 0.0, 1.0);', // il nero resta nero: niente retino sul fondo
    ' float n = uLevels - 1.0;',
    ' c = floor(c*n + bayer(px)) / n;',
    ' c = c * vec3(0.96, 0.9, 1.0) + vec3(0.03, 0.025, 0.045);', // virata verso la palette (viola profondo / oro)
    ' gl_FragColor = vec4(clamp(c,0.0,1.0), 1.0); }'
  ].join('\n');
  var DOWNSCALE = 3;  // pixel di schermo per pixel di gioco
  function setupC(ctx) {
    var rt = new THREE.WebGLRenderTarget(2, 2, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
    var m = new THREE.ShaderMaterial({ uniforms: { tDiffuse: { value: rt.texture }, uRes: { value: new THREE.Vector2(2, 2) }, uLevels: { value: 4 }, uSat: { value: 0.75 }, uGain: { value: 2.2 } },
      vertexShader: VS, fragmentShader: FS, depthTest: false, depthWrite: false });
    var quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), m);
    var sc = new THREE.Scene(); sc.add(quad);
    PP = { rt: rt, mat: m, scene: sc, cam: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), levels: 4 };
    ctx.renderer.setPixelRatio(1);
  }
  function resizeC(ctx) {
    if (!PP) return;
    var w = Math.max(2, Math.floor(ctx.w / DOWNSCALE)), h = Math.max(2, Math.floor(ctx.h / DOWNSCALE));
    PP.rt.setSize(w, h); PP.mat.uniforms.uRes.value.set(w, h);
  }
  // Più Luce = più toni. Al Buio l'immagine si sgrana verso il nero.
  function levelsFor(ctx) {
    var G = ctx.G, luce = G && G.player ? G.player.luce : 0, L = R.lights && R.lights.state;
    var lv = 3 + Math.min(luce, 4) * 0.75;
    if (L && L.dark) lv = 2.2;
    return lv;
  }
  function render(ctx) {
    if (mode !== 'c') { ctx.renderer.render(ctx.scene, ctx.camera); return; }
    if (!PP) { setupC(ctx); resizeC(ctx); }
    PP.levels += (levelsFor(ctx) - PP.levels) * 0.08;
    PP.mat.uniforms.uLevels.value = Math.max(2, PP.levels);
    ctx.renderer.setRenderTarget(PP.rt);
    ctx.renderer.render(ctx.scene, ctx.camera);
    ctx.renderer.setRenderTarget(null);
    ctx.renderer.render(PP.scene, PP.cam);
  }

  if (mode === 'b') applyB();

  R.style = { mode: mode, applyB: applyB, figure: figure, render: render, resize: resizeC };
})(typeof window !== 'undefined' ? window : globalThis);
