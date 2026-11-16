// THE LONG NIGHT — log di partita (BRIEF 10): ascolta l'eventBus e costruisce il registro della run.
// Usato dalla schermata finale ("Copia riepilogo", "Scarica log") e, in futuro, dal simulatore.
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  TLN.balancing = TLN.balancing || {};

  function createCollector() {
    var data = { version: 1, seed: null, equip: null, rooms: [], result: null, startedAt: null };
    var room = null, turn = null;
    function newTurn(n) {
      turn = { room: room.room, turn: n, seed: data.seed, sequence: [], plancia: [], coveredSlots: [], luceAvailable: null,
        coveredDice: [], keptDice: [], discardedDice: [], lucePaid: 0, ecoDiscards: [], cardsPlayed: [],
        damageDealt: 0, damageTaken: 0, ptLost: [], end: null };
      room.turnsData.push(turn);
    }
    var on = {
      RUN_START: function (d) { data.seed = d.seed; data.equip = d.equip; data.startRoom = d.rooms[0]; },
      ROOM_START: function (d) { room = { room: d.room, name: d.name, veglia: d.veglia, start: d.player, turns: 0, result: null, inVeglia: null, rests: [], turnsData: [] }; data.rooms.push(room); },
      TURN_START: function (d) { if (room) { newTurn(d.turn); room.turns = d.turn; } },
      DICE_ROLLED: function (d) { if (turn) turn.sequence = d.seq.map(function (x) { return x.kind === 'ai' ? { ai: x.owner, value: x.value, action: x.action } : { die: x.kind, value: x.value }; }); },
      SELECTION_START: function (d) {
        if (!turn) return;
        turn.plancia = d.plancia; turn.luceAvailable = d.luce;
        turn.coveredSlots = Object.keys(d.coverage).filter(function (k) { return d.coverage[k]; }).map(Number);
      },
      SELECTION_CONFIRMED: function (d) {
        if (!turn) return;
        turn.coveredDice = d.covered; // per ogni slot coperto: pagato | scartato | lasciato
        turn.keptDice = d.kept.map(function (x) { return x.kind + ':' + x.value; });
        turn.discardedDice = d.discarded.map(function (x) { return x.kind + ':' + x.value; });
        turn.lucePaid = d.cost;
      },
      ECO_DISCARD: function (d) { if (turn) turn.ecoDiscards.push(d.id); },
      CARD_OPEN: function (d) { if (turn) turn.cardsPlayed.push(d.id); },
      DAMAGE: function (d) {
        if (!turn) return;
        if (d.target === 'P') turn.damageTaken += d.hpLoss; else turn.damageDealt += d.hpLoss;
      },
      RESOURCE: function (d) { if (turn && d.res === 'pt' && d.delta < 0) turn.ptLost.push({ n: -d.delta, cause: d.cause }); },
      TURN_END: function (d) { if (turn) turn.end = { hp: d.hp, pt: d.pt, luce: d.luce, pm: d.pm }; },
      ROOM_WON: function (d) { if (room) { room.result = 'win'; room.inVeglia = d.inVeglia; room.turns = d.turn; } },
      DEFEAT: function (d) { if (room) { room.result = d.result; room.inVeglia = d.inVeglia; room.turns = d.turn; } },
      SOGLIA_CHOSEN: function (d) { if (room) room.rests = d.rests; },
      RUN_END: function (d) { data.result = d.result; data.final = { hp: d.hp, pt: d.pt }; }
    };
    function onEvent(ev) {
      if (on[ev.type]) on[ev.type](ev.data);
      // lo stato di fine turno vale anche per il turno in cui la stanza si chiude
      if ((ev.type === 'ROOM_WON' || ev.type === 'DEFEAT') && turn && !turn.end) turn.end = ev.data.player;
    }
    function attach(bus) { bus.onAny(onEvent); return api; }

    function summaryText() {
      var L = [];
      var RES = { victory: 'Vittoria', death: 'Morte', madness: 'Follia', win: 'vinta' };
      L.push('THE LONG NIGHT — riepilogo run · seed ' + data.seed + ' · slot ' + data.equip + ' · esito: ' + (RES[data.result] || data.result));
      data.rooms.forEach(function (r) {
        var paid = 0, disc = 0, left = 0, dealt = 0, taken = 0, pt = {};
        r.turnsData.forEach(function (t) {
          t.coveredDice.forEach(function (c) { if (c.outcome === 'pagato') paid++; else if (c.outcome === 'scartato') disc++; else left++; });
          dealt += t.damageDealt; taken += t.damageTaken;
          t.ptLost.forEach(function (x) { pt[x.cause] = (pt[x.cause] || 0) + x.n; });
        });
        L.push('');
        L.push('■ ' + r.name + ' — ' + (r.result === 'win' ? 'vinta' : RES[r.result] || '—') + ' in ' + r.turns + ' turni' + (r.veglia ? ' (Veglia ' + r.veglia + (r.inVeglia ? ', nei tempi' : ', oltre') + ')' : ''));
        L.push('  Danni fatti ' + dealt + ' · subiti ' + taken + ' · PT persi: ' + (Object.keys(pt).map(function (k) { return k + ' ' + pt[k]; }).join(', ') || 'nessuno'));
        L.push('  Slot coperti: pagati ' + paid + ' · scartati ' + disc + ' · lasciati ' + left);
        if (r.rests.length) L.push('  Soste: ' + r.rests.join(', '));
        r.turnsData.forEach(function (t) {
          L.push('  T' + t.turn + ': Luce ' + t.luceAvailable + (t.lucePaid ? ' (pagati ' + t.lucePaid + ')' : '') +
            ' · coperti ' + (t.coveredSlots.join('/') || '—') + ' · carte ' + (t.cardsPlayed.join(' ') || '—') +
            (t.ecoDiscards.length ? ' · Eco ' + t.ecoDiscards.join(' ') : '') +
            (t.end && t.end.hp != null ? ' · fine: HP ' + t.end.hp + ' PT ' + t.end.pt + ' Luce ' + t.end.luce + ' PM ' + t.end.pm : ''));
        });
      });
      return L.join('\n');
    }
    var api = { attach: attach, data: data, summaryText: summaryText, json: function () { return JSON.stringify(data, null, 1); } };
    return api;
  }

  TLN.balancing.createCollector = createCollector;
})(typeof window !== 'undefined' ? window : globalThis);
