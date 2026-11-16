// M5 — il log di partita contiene i campi di BRIEF 10
var makeAgent = require('./agent');
module.exports = function (TLN, check, section) {
  var E = TLN.engine;
  section('Log di partita (§10)');
  var found = null;
  for (var s = 0; s < 80 && !found; s++) {
    var bus = E.createEventBus(), col = TLN.balancing.createCollector().attach(bus);
    var run = E.run.createRun({ seed: 4000 + s, start: 'r0', bus: bus }), ag = makeAgent(TLN, s, true), k = 0;
    while (run.phase !== 'END' && k++ < 4000) { var c = ag.choose(run); if (!c) break; E.run.execute(run, c); }
    if (col.data.rooms.length >= 2) found = col;
  }
  check(!!found, 'nessuna run casuale ha superato la prima Soglia');
  if (!found) return;
  var d = found.data, t = d.rooms[0].turnsData[1] || d.rooms[0].turnsData[0];
  ['room', 'turn', 'seed', 'sequence', 'plancia', 'coveredSlots', 'luceAvailable', 'coveredDice', 'ecoDiscards', 'cardsPlayed', 'damageDealt', 'damageTaken', 'ptLost', 'end'].forEach(function (k) {
    check(t[k] !== undefined && t[k] !== null, 'campo del turno mancante: ' + k);
  });
  ['hp', 'pt', 'luce', 'pm'].forEach(function (k) { check(t.end && t.end[k] != null, 'fine turno senza ' + k); });
  var r = d.rooms[0];
  check(r.turns > 0 && r.result && r.inVeglia != null && Array.isArray(r.rests) && r.rests.length >= 1, 'campi della stanza: turni, esito, Veglia, Soste');
  check(d.result != null && d.seed != null, 'esito e seed della run');
  var last = d.rooms[d.rooms.length - 1].turnsData.slice(-1)[0];
  check(last.end && last.end.hp != null, 'anche l\'ultimo turno ha HP/PT/Luce/PM finali');
  var txt = found.summaryText();
  check(/riepilogo run/.test(txt) && /Slot coperti/.test(txt), 'riepilogo testuale');
  check(JSON.parse(found.json()).rooms.length === d.rooms.length, 'JSON valido');
};
