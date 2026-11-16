// THE LONG NIGHT — tutti i parametri visivi in un posto solo (BRIEF 8)
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  TLN.render = TLN.render || {};

  TLN.render.theme = {
    clear: 0x0b0a0e,
    fog: { color: 0x0b0a0e, near: 18, far: 46 },
    hex: {
      size: 1.0,              // centro → vertice
      gap: 0.06,              // spazio tra prismi
      height: 0.42,           // spessore base
      heightJitter: 0.07,     // variazione di altezza
      color: 0x2a2730, colorJitter: 0.07, roughness: 0.95,
      top: 0x34303b
    },
    highlight: {               // bordo luminoso delle caselle
      reach: 0x4a8fbd, target: 0xd04848, cone: 0xe0a040, select: 0xc9a84c, push: 0xe0703a, path: 0x6fb0e0, danger: 0xb84040,
      lift: 0.012, width: 0.07, pulse: 2.6
    },
    camera: {
      tilt: 50,               // gradi dall'orizzontale
      distance: 30,
      margin: { top: 0.03, bottom: 0.40, side: 0.21 }, // quota di schermo lasciata all'interfaccia
      breathe: { amp: 0.035, speed: 0.35 },
      shake: { amp: 0.16, decay: 6 }
    },
    lights: {
      ambient: { color: 0x4a5878, intensity: 0.18 },
      hemi: { sky: 0x30384f, ground: 0x0b0a0e, intensity: 0.22 },
      moon: { color: 0x6c7fb0, intensity: 0.22, pos: [-6, 14, -10] },
      darkScale: 0.45         // fattore sulla luce ambiente al Buio
    },
    // Lanterna del giocatore: raggio e intensità crescono con la Luce. A Luce 0 resta un alone minimo.
    lantern: {
      color: 0xffc56a, height: 1.9,
      curve: function (luce) {
        var l = Math.max(0, Math.min(luce, 8));
        return { distance: 4.2 + l * 1.25, intensity: 1.1 + l * 0.32, sight: 2.2 + l * 0.85 };
      },
      flicker: 0.06
    },
    brazier: { color: 0xff7a2a, intensity: 1.6, distance: 6.5, flicker: 0.35, sparks: 10 },
    trap: { glyph: '#d04848', plate: 0x1f1b22, pulse: 1.8 },
    column: { color: 0x5e5866, segments: 3, radius: 0.42, height: 2.1 },
    wall: { color: 0x221f28, height: 0.9, thickness: 0.35 },
    door: { color: 0x1a1720, glow: 0xf2e2a0, idleGlow: 0.05 },
    sprite: {
      pixel: 0.055,           // unità di mondo per pixel di sprite
      shadow: { color: 0x000000, opacity: 0.55, scale: 0.9 },
      bob: { amp: 0.04, speed: 1.6 },
      frameTime: 0.55,        // secondi tra i due fotogrammi d'attesa
      darkTint: 0x101016,     // sagoma fuori dal raggio della lanterna
      lunge: 0.45, hitFlash: 0.16, deathTime: 0.7
    },
    fx: { numberRise: 1.2, numberTime: 0.9, particles: 18 },
    moveStepTime: 0.16,
    diceRollTime: 0.4
  };
})(typeof window !== 'undefined' ? window : globalThis);
