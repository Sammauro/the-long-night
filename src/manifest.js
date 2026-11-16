// THE LONG NIGHT — elenco ordinato degli script (BRIEF 4)
// Usato da index.html (browser) e da tools/smoke.js (Node).
// Gruppi: i test Node caricano solo "data", "engine" e "balancing".
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  TLN.manifest = {
    data: [
      'src/engine/data/dice.js',
      'src/engine/data/equipment.js',
      'src/engine/data/cards.js',
      'src/engine/data/enemies.js',
      'src/engine/data/terrain.js',
      'src/engine/data/rooms.js',
      'src/engine/data/run_config.js',
      'src/engine/data/tutorial_script.js',
      'src/engine/data/hints.js'
    ],
    engine: [
      'src/engine/rng.js',
      'src/engine/event_bus.js'
    ],
    input: [
      'src/input/command_bus.js'
    ],
    balancing: [],
    render: [],
    ui: [
      'src/ui/app.js'
    ]
  };
  TLN.manifest.order = ['data', 'engine', 'input', 'balancing', 'render', 'ui'];
  TLN.manifest.all = function () {
    var out = [];
    TLN.manifest.order.forEach(function (g) { out = out.concat(TLN.manifest[g]); });
    return out;
  };
})(typeof window !== 'undefined' ? window : globalThis);
