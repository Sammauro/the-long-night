// THE LONG NIGHT — lancio, Sequenza, legame dei dadi IA, Selezione (BRIEF 6.2 Fase 1, 6.3; decisione D6)
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  var E = TLN.engine = TLN.engine || {};
  var S = E.state;

  function newDie(G, kind, value, extra) {
    G.dieSeq = (G.dieSeq || 0) + 1;
    var d = { uid: 'd' + G.dieSeq, kind: kind, value: value, bonus: 0, infused: false, state: 'pending' };
    for (var k in extra) d[k] = extra[k];
    return d;
  }

  // BRIEF 6.2 Fase 1 punti 3–5
  function roll(G) {
    var D = TLN.data.dice, dice = [];
    var scripted = G.script && G.script.sequences && G.turn <= G.script.scriptedTurns && G.script.sequences[G.turn];
    if (scripted) {
      scripted.forEach(function (tok) {
        var p = tok.split(':');
        if (p[0] === 'ai') {
          var en = S.unitById(G, p[1]);
          if (en && en.alive) dice.push(newDie(G, 'ai', +p[2], { owner: en.id, enemyType: en.type }));
        } else {
          dice.push(newDie(G, p[0], +p[1], { owner: 'P' }));
        }
      });
    } else {
      D.bag.forEach(function (b) {
        for (var i = 0; i < b.count; i++) {
          var t = D.types[b.type];
          dice.push(newDie(G, b.type, t.faces[G.rng.int(t.sides)], { owner: 'P' }));
        }
      });
      S.aliveEnemies(G).forEach(function (e) {
        dice.push(newDie(G, 'ai', D.types.ai.faces[G.rng.int(4)], { owner: null, enemyType: e.type }));
      });
      G.rng.shuffle(dice);
      bindAiDice(G, dice);
    }
    dice.forEach(function (d) {
      if (d.kind === 'ai') d.actionId = TLN.data.enemies[d.enemyType].d4[d.value];
    });
    G.seq = dice;
    G.seqDropped = [];
    G.sel = { keep: {} };
    G.bus.emit('DICE_ROLLED', { turn: G.turn, seq: dice.map(dieSummary) });
  }

  // D6 — per ogni tipo di nemico, il primo dado di quel tipo è del nemico con il numero di schieramento più basso
  function bindAiDice(G, dice) {
    var queues = {};
    S.aliveEnemies(G).slice().sort(function (a, b) { return a.deploy - b.deploy; }).forEach(function (e) {
      (queues[e.type] = queues[e.type] || []).push(e);
    });
    dice.forEach(function (d) {
      if (d.kind === 'ai') d.owner = queues[d.enemyType].shift().id;
    });
  }

  function dieSummary(d) {
    return { uid: d.uid, kind: d.kind, value: d.value, owner: d.owner, action: d.actionId || null };
  }
  function impulses(d) { return d.value + d.bonus; }

  // ── Selezione (BRIEF 6.3) ──
  function coverage(G) {
    var std = G.equip.filter(function (s) { return s.kind === 'standard'; })
      .slice().sort(function (a, b) { return a.order - b.order; });
    var k = G.plancia.std.length, cov = {};
    std.forEach(function (s, i) { cov[s.slot] = i < k; });
    G.equip.forEach(function (s) { if (s.kind === 'fire') cov[s.slot] = !!G.plancia.fire; });
    return cov;
  }
  // Slot di un tipo in ordine d'uso: prima gli scoperti (gratis), poi i coperti dal meno caro
  function slotsFor(G, type, cov) {
    return G.equip.filter(function (s) { return s.die === type; }).map(function (s) {
      return { slot: s.slot, covered: cov[s.slot], cost: cov[s.slot] ? s.cost : 0 };
    }).sort(function (a, b) {
      if (a.covered !== b.covered) return a.covered ? 1 : -1;
      return a.cost - b.cost || a.slot - b.slot;
    });
  }
  function selectionPlan(G, keep) {
    keep = keep || G.sel.keep;
    var cov = coverage(G), plan = { ok: true, cost: 0, gains: { pm: 0, luce: 0, pt: 0 }, dice: {}, slots: [] };
    ['vigore', 'fuoco', 'terrore'].forEach(function (type) {
      var slots = slotsFor(G, type, cov), used = 0;
      G.seq.forEach(function (d) {
        if (d.kind !== type) return;
        var info = { kept: !!keep[d.uid] };
        if (info.kept) {
          var s = slots[used++];
          if (!s) { plan.ok = false; info.label = 'nessuno slot'; info.slot = null; }
          else { info.slot = s.slot; info.cost = s.cost; plan.cost += s.cost; info.label = s.cost ? s.cost + ' Luce' : 'libero'; }
        } else {
          var gain = TLN.data.dice.types[type].discard;
          for (var g in gain) plan.gains[g] += gain[g];
          info.gain = gain;
        }
        plan.dice[d.uid] = info;
      });
      // Etichetta per i dadi non tenuti: quanto costerebbe tenerli adesso
      G.seq.forEach(function (d) {
        if (d.kind !== type || keep[d.uid]) return;
        var s = slots[used];
        plan.dice[d.uid].label = s ? (s.cost ? s.cost + ' Luce' : 'libero') : 'nessuno slot';
      });
      slots.forEach(function (s, i) { plan.slots.push({ slot: s.slot, type: type, covered: s.covered, cost: s.cost, used: i < used }); });
    });
    plan.luceAfter = G.player.luce + plan.gains.luce - plan.cost;
    plan.affordable = plan.ok && plan.luceAfter >= 0;
    return plan;
  }

  E.defineCommand('SEL_TOGGLE', {
    check: function (G, c) {
      if (G.phase !== 'SELEZIONE') return 'Non è la fase di Selezione';
      var d = G.seq.filter(function (x) { return x.uid === c.die; })[0];
      if (!d || d.kind === 'ai') return 'Dado non selezionabile';
      return null;
    },
    run: function (G, c) {
      if (G.sel.keep[c.die]) delete G.sel.keep[c.die]; else G.sel.keep[c.die] = true;
      G.bus.emit('SELECTION', { keep: Object.keys(G.sel.keep) });
    }
  });

  E.defineCommand('SEL_CONFIRM', {
    check: function (G) {
      if (G.phase !== 'SELEZIONE') return 'Non è la fase di Selezione';
      var plan = selectionPlan(G);
      if (!plan.ok) return 'Troppi dadi per gli slot';
      if (!plan.affordable) return 'Luce insufficiente';
      return null;
    },
    run: function (G) {
      var plan = selectionPlan(G), cov = coverage(G);
      var record = { turn: G.turn, covered: [], kept: [], discarded: [], cost: plan.cost, luceBefore: G.player.luce };
      // §10 — per ogni slot coperto: pagato, scartato (avevi un dado ma l'hai scartato) o lasciato (nessun dado)
      plan.slots.forEach(function (s) {
        if (!s.covered) return;
        var discardedSame = G.seq.some(function (d) { return d.kind === s.type && !G.sel.keep[d.uid]; });
        record.covered.push({ slot: s.slot, type: s.type, cost: G.equip.filter(function (e) { return e.slot === s.slot; })[0].cost,
          outcome: s.used ? 'pagato' : discardedSame ? 'scartato' : 'lasciato' });
      });
      var kept = [], dropped = [];
      G.seq.forEach(function (d) {
        if (d.kind === 'ai' || G.sel.keep[d.uid]) kept.push(d); else { d.state = 'discarded'; dropped.push(d); }
      });
      record.kept = kept.filter(function (d) { return d.kind !== 'ai'; }).map(dieSummary);
      record.discarded = dropped.map(dieSummary);
      G.seq = kept;
      G.seqDropped = dropped;
      if (plan.gains.pm) S.changeRes(G, 'pm', plan.gains.pm, 'Scarto dado');
      if (plan.gains.luce) S.changeRes(G, 'luce', plan.gains.luce, 'Scarto dado');
      if (plan.gains.pt) S.changeRes(G, 'pt', plan.gains.pt, 'Scarto dado');
      if (plan.cost) { S.changeRes(G, 'luce', -plan.cost, 'Recupero slot'); G.stats.lightPaid += plan.cost; }
      record.coverage = cov;
      G.bus.emit('SELECTION_CONFIRMED', record);
      E.turn.beginResolution(G);
    }
  });

  // Comando senza effetti sul motore: serve all'interfaccia e al tutorial (toccare un dado)
  E.defineCommand('INSPECT_DIE', {
    always: true,
    check: function (G, c) { return G.seq.some(function (d) { return d.uid === c.die; }) ? null : 'Dado inesistente'; },
    run: function (G, c) { G.bus.emit('INSPECT_DIE', { die: c.die }); }
  });

  E.dice = { roll: roll, bindAiDice: bindAiDice, impulses: impulses, coverage: coverage, selectionPlan: selectionPlan, dieSummary: dieSummary };
})(typeof window !== 'undefined' ? window : globalThis);
