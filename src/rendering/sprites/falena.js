// THE LONG NIGHT — sprite: Falena Cinerea (BRIEF 8.2)
// 32×32 px · 2 fotogrammi d'attesa · un carattere = un pixel ("." = trasparente).
// Per sostituirlo con un'immagine vera basta cambiare questo file (vedi sprite_factory.js, campo "image").
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  TLN.render = TLN.render || {};
  TLN.render.sprites = TLN.render.sprites || {};

  TLN.render.sprites.falena = {
    name: "Falena Cinerea",
    w: 32, h: 32,
    float: 0.9,
    glow: "m", // caratteri dell'accento luminoso (restano accesi al buio)
    palette: {"k":"#0b0a0c", "a":"#8a8580", "A":"#5d5955", "b":"#3a3532", "m":"#ffb347"},
    frames: [
      [
        '................................',
        '............k......k............',
        '...........kAk....kAk...........',
        '.......kkkkkkAk...kAkkkkk.......',
        '.....kkaaaaAkAk..kAkaaaaAkk.....',
        '....kaaaaaaaaaAk.kAaaaaaaaAk....',
        '...kaaaaaaaaaaAkkAaaaaaaaaaAk...',
        '..kaaaaAmaaaaaAbbaaaaaAmaaaaAk..',
        '..kaaaAmmmaaaAbbbbaaaAmmmaaaAk..',
        '..kaaAmmmmmaaaAbbaaaAmmmmmaaAk..',
        '.kaaaaAmmmaaaaAbbaaaaAmmmaaaaAk.',
        '..kaaaaAmaaaaaAbbaaaaaAmaaaaAk..',
        '..kaaaaaaaaaaaAbbaaaaaaaaaaaAk..',
        '..kaaaaaaaaaaaAbbaaaaaaaaaaaAk..',
        '...kaaaaaaaaaaAbbaaaaaaaaaaAk...',
        '....kaaaaaaaaAkbbkaaaaaaaaAk....',
        '.....kkaaaaAkkkbbkkkaaaaAkk.....',
        '......kaaaaaaAkbbkaaaaaaAk......',
        '.....kaaaaaaaaAbbaaaaaaaaAk.....',
        '.....kaaaaaaaaAbbaaaaaaaaAk.....',
        '....kaaaaAmaaaAbbaaaAmaaaaAk....',
        '.....kaaaaaaaaAbbaaaaaaaaAk.....',
        '.....kaaaaaaaaAbbaaaaaaaaAk.....',
        '......kaaaaaaAkbbkaaaaaaAk......',
        '.......kkkAkkkkbbkkkkAkkk.......',
        '..........k...kbbk...k..........',
        '...............kk...............',
        '................................',
        '................................',
        '................................',
        '................................',
        '................................'
      ],
      [
        '................................',
        '............k......k............',
        '...........kAk....kAk...........',
        '............kAk...kAk...........',
        '............kAk..kAk............',
        '.............kAk.kAk............',
        '.............kAkkAk.............',
        '..............kbbk..............',
        '.............kbbbbk.............',
        '..............kbbk..............',
        '..............kbbk..............',
        '.....kkkkkkk..kbbk..kkkkkkk.....',
        '...kkaaaaaaAkkkbbkkkaaaaaaAkk...',
        '..kaaaaaaaaaaAkbbkaaaaaaaaaaAk..',
        '.kaaaaaaaaaaaaAbbaaaaaaaaaaaaAk.',
        '.kaaAmmmaaaaaaAbbaaaaaaAmmmaaAk.',
        'kaaAmmmmmaaaaaAbbaaaaaAmmmmmaaAk',
        '.kaaAmmmaaaaaaAbbaaaaaaAmmmaaAk.',
        '.kaaaaaaaaaaaaAbbaaaaaaaaaaaaAk.',
        '..kaaaaaaaaaaAkbbkaaaaaaaaaaAk..',
        '...kkaaaaaaAkkkbbkkkaaaaaaAkk...',
        '....kaaaaaaaaAkbbkaaaaaaaaAk....',
        '....kaaaaaaaaAkbbkaaaaaaaaAk....',
        '...kaaaaAmaaaaAbbaaaaAmaaaaAk...',
        '....kaaaaaaaaAkbbkaaaaaaaaAk....',
        '....kaaaaaaaaAkbbkaaaaaaaaAk....',
        '.....kkaaaaAkk.kk.kkaaaaAkk.....',
        '.......kkkkk........kkkkk.......',
        '................................',
        '................................',
        '................................',
        '................................'
      ]
    ]
  };
})(typeof window !== 'undefined' ? window : globalThis);
