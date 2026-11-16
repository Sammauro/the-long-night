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
      'src/engine/event_bus.js',
      'src/engine/hex_grid.js',
      'src/engine/game_state.js',
      'src/engine/combat_resolver.js',
      'src/engine/dice_system.js',
      'src/engine/card_system.js',
      'src/engine/card_effects.js',
      'src/engine/card_effects_free.js',
      'src/engine/ai_opponent.js',
      'src/engine/resolution.js',
      'src/engine/turn_manager.js',
      'src/engine/legal_moves.js',
      'src/engine/run_manager.js'
    ],
    input: [
      'src/input/command_bus.js',
      'src/input/input_handler.js'
    ],
    balancing: [],
    render: [
      'src/rendering/theme.js',
      'src/rendering/sprite_factory.js',
      'src/rendering/sprites/indagatore.js',
      'src/rendering/sprites/zombie.js',
      'src/rendering/sprites/sussurratore.js',
      'src/rendering/sprites/falena.js',
      'src/rendering/sprites/custode.js',
      'src/rendering/scene.js',
      'src/rendering/camera.js',
      'src/rendering/lights.js',
      'src/rendering/hex_renderer.js',
      'src/rendering/props.js',
      'src/rendering/room_shell.js',
      'src/rendering/unit_renderer.js',
      'src/rendering/fx.js'
    ],
    ui: [
      'src/ui/ui_common.js',
      'src/ui/combat/ui_hud.js',
      'src/ui/combat/ui_sequence.js',
      'src/ui/combat/ui_selection.js',
      'src/ui/combat/ui_plancia.js',
      'src/ui/combat/ui_cards.js',
      'src/ui/combat/ui_enemy_panel.js',
      'src/ui/combat/ui_targeting.js',
      'src/ui/combat/ui_log.js',
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
