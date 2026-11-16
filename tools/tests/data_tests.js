// M1 — verifiche sui dati (BRIEF 11, M1)
module.exports = function (TLN, check, section) {
  var D = TLN.data;

  section('Carte');
  var total = 0, byCd = { 0: 0, 1: 0, 2: 0 };
  D.cards.list.forEach(function (c) {
    total += c.copies; byCd[c.cd] += c.copies;
    check(c.eco && c.eco.length > 0, 'carta ' + c.id + ' senza Eco');
    check(c.free || c.actions.length > 0, 'carta ' + c.id + ' senza Azioni');
  });
  check(total === 16, 'le carte sono ' + total + ', attese 16');
  check(byCd[0] === 7 && byCd[1] === 5 && byCd[2] === 4, 'ripartizione CD ' + JSON.stringify(byCd) + ', attesa 7/5/4');
  check(D.cards.list.length === 14, 'carte distinte: ' + D.cards.list.length + ', attese 14');

  section('Dadi');
  var n = 0;
  D.dice.bag.forEach(function (b) { n += b.count; check(!!D.dice.types[b.type], 'tipo dado ' + b.type); });
  check(n === 5, 'la Bag ha ' + n + ' dadi, attesi 5');
  Object.keys(D.dice.types).forEach(function (k) {
    var t = D.dice.types[k];
    check(t.faces.length === t.sides, 'facce di ' + k);
  });

  section('Equipaggiamento');
  ['demo', 'rev11'].forEach(function (p) {
    var slots = D.equipment.presets[p];
    check(slots && slots.length === 4, 'preset ' + p + ' con 4 slot');
    check(slots.filter(function (s) { return s.kind === 'fire'; }).length === 1, 'preset ' + p + ': uno slot Fuoco');
  });
  check(D.runConfig.equipPreset === 'demo', 'preset di default = demo (D1)');

  section('Stanze');
  var G = D.rooms.grid;
  check(D.rooms.list.length === 4, '4 stanze');
  D.rooms.list.forEach(function (room) {
    var seen = {};
    function place(at, what) {
      var ok = at[0] >= 1 && at[0] <= G.rows && at[1] >= 1 && at[1] <= G.cols;
      check(ok, room.id + ': ' + what + ' fuori griglia ' + at);
      var key = at[0] + ',' + at[1];
      check(!seen[key], room.id + ': due elementi in ' + key + ' (' + seen[key] + ', ' + what + ')');
      seen[key] = what;
    }
    place(room.player, 'giocatore');
    room.enemies.forEach(function (e) { check(!!D.enemies[e.type], 'tipo nemico ' + e.type); place(e.at, e.type); });
    room.terrain.forEach(function (t) { check(!!D.terrain[t.type], 'terreno ' + t.type); place(t.at, t.type); });
  });
  var vs = D.rooms.list.map(function (r) { return r.veglia; });
  check(vs[0] === null && vs[1] === 6 && vs[2] === 6 && vs[3] === 7, 'Veglia 6/6/7 (D4)');

  section('Tabelle d4');
  Object.keys(D.enemies).forEach(function (k) {
    var e = D.enemies[k];
    for (var v = 1; v <= 4; v++) {
      check(!!e.d4[v] && !!e.actions[e.d4[v]], k + ': d4 = ' + v + ' non coperto');
    }
  });

  section('Tutorial e suggerimenti');
  var T = D.tutorialScript;
  check(T.openingHand.length === 5, 'mano iniziale da 5');
  [1, 2, 3].forEach(function (t) { check(T.sequences[t] && T.sequences[t].length > 0, 'sequenza del turno ' + t); });
  check(T.steps.length === 16, 'passi guidati: ' + T.steps.length + ', attesi 16');
  check(D.hints.length === 9, 'suggerimenti: ' + D.hints.length + ', attesi 9');
};
