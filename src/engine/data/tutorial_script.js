// THE LONG NIGHT — Stanza 0, script del tutorial (BRIEF 9.1)
// Dadi: 'vigore:2' = d6 Vigore su faccia 2 · 'ai:Z1:1' = dado IA di Z1 con valore 1.
// I passi guidati sono letti da input/tutorial_driver.js:
//   allow: comandi ammessi (gli altri sono bloccati) · done: condizione che chiude il passo.
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  TLN.data = TLN.data || {};

  TLN.data.tutorialScript = {
    roomId: 'r0',
    seed: 20261116,
    scriptedTurns: 3,
    // Mano iniziale, poi cima del mazzo nell'ordine; il resto è mescolato.
    openingHand: ['ab', 'pa', 'sc', 'ds', 'af'],
    deckTop: ['ab', 'pa', 'as'],
    draws: { 1: ['ab', 'pa', 'sc', 'ds', 'af'], 2: ['ab', 'pa', 'as'] },
    sequences: {
      1: ['vigore:2', 'ai:Z1:1', 'fuoco:1', 'fuoco:2', 'terrore:3', 'vigore:1', 'ai:Z2:2', 'ai:Z3:4'],
      2: ['vigore:3', 'terrore:2', 'ai:Z2:3', 'ai:Z3:1', 'fuoco:2', 'fuoco:2', 'vigore:1'],
      3: ['vigore:2', 'fuoco:2', 'fuoco:1', 'ai:Z3:2', 'terrore:1', 'vigore:2']
    },
    // Movimento fissato: turno 1, Z2 percorre R5E4 → R4E4 → R3E4
    forcedPaths: { '1:Z2': [[4, 4], [3, 4]] },
    steps: [
      { id: 1, text: 'Questa è la Sequenza. I tuoi dadi e quelli dei nemici si risolvono da sinistra a destra. Tocca un teschio per vedere cosa farà quel nemico.',
        phase: 'SELEZIONE', allow: [{ type: 'INSPECT_DIE', ai: true }], done: { cmd: 'INSPECT_DIE' } },
      { id: 2, text: 'Scegli quali dadi tenere. Hai un solo slot Fuoco: tieni il 🔥2. L\'altro si scarta e ti dà 1 Luce.',
        allow: [{ type: 'SEL_TOGGLE' }, { type: 'INSPECT_DIE' }], done: { keep: ['vigore:2', 'vigore:1', 'fuoco:2'] } },
      { id: 3, text: 'Scarta anche il dado Terrore: +1 PT. Imparerai a usarlo più avanti.',
        allow: [{ type: 'SEL_CONFIRM' }, { type: 'SEL_TOGGLE' }, { type: 'INSPECT_DIE' }], done: { phase: 'RISOLUZIONE' }, keepLocked: ['vigore:2', 'vigore:1', 'fuoco:2'] },
      { id: 4, text: 'Hai 2 PM. Spostati sulla casella evidenziata.',
        allow: [{ type: 'ADVANCE', untilActive: 0 }, { type: 'MOVE', to: [2, 4] }, { type: 'INSPECT_DIE' }], done: { playerAt: [2, 4] }, highlight: [2, 4] },
      { id: 5, text: 'Attacco Base: 1 danno gratis, poi 1 danno per ogni ✊. Colpisci lo Zombie.',
        allow: [{ type: 'OPEN_CARD', card: 'ab' }, { type: 'USE_ACTION', target: 'Z1' }, { type: 'INSPECT_DIE' }], done: { dead: 'Z1' } },
      { id: 6, text: 'Z1 è caduto prima del suo dado: l\'azione è annullata. Colpire al momento giusto è la tua difesa migliore.',
        allow: [{ type: 'ADVANCE' }, { type: 'CLOSE_CARD' }, { type: 'INSPECT_DIE' }], done: { activeKind: 'fuoco' } },
      { id: 7, text: 'Colpo a Distanza: 1 danno per 🔥, fino a 3 caselle. Colpisci Z2 due volte.',
        allow: [{ type: 'MANEUVER', kind: 'ranged', target: 'Z2' }, { type: 'INSPECT_DIE' }], done: { hp: ['Z2', 4] } },
      { id: 8, text: 'Il prossimo dado è di Z2 e sta per colpirti. Gioca Parata: +1 Scudo.',
        allow: [{ type: 'ADVANCE', untilActiveKind: 'vigore' }, { type: 'OPEN_CARD', card: 'pa' }, { type: 'USE_ACTION', action: 0 }, { type: 'INSPECT_DIE' }], done: { playerShield: 1 } },
      { id: 9, text: 'Lo Scudo ha assorbito il colpo.',
        allow: [{ type: 'ADVANCE' }, { type: 'CLOSE_CARD' }, { type: 'INSPECT_DIE' }], done: { phase: 'FINE_TURNO', turn: 2 } },
      { id: 10, text: 'Prima di pescare puoi scartare carte per il loro Eco. Scarta Scatto: +2 PM.',
        allow: [{ type: 'ECO_DISCARD', card: 'sc' }, { type: 'INSPECT_DIE' }], done: { discarded: 'sc' } },
      { id: 11, text: 'Tieni ✊3, ✊1 e un 🔥2.',
        allow: [{ type: 'ECO_DONE' }, { type: 'SEL_TOGGLE' }, { type: 'SEL_CONFIRM' }, { type: 'INSPECT_DIE' }], done: { phase: 'RISOLUZIONE' }, keepLocked: ['vigore:3', 'vigore:1', 'fuoco:2'] },
      { id: 12, text: 'Diniego Sismico: 1 danno e una spinta per ogni ✊. Spingi Z2 contro la colonna: la Collisione aggiunge 1 danno.',
        allow: [{ type: 'ADVANCE', untilActive: 0 }, { type: 'OPEN_CARD', card: 'ds' }, { type: 'USE_ACTION', target: 'Z2', push: [4, 5] }, { type: 'INSPECT_DIE' }], done: { dead: 'Z2' }, highlight: [4, 5] },
      { id: 13, text: 'Diniego Sismico ha Cooldown 1: va sulla Plancia e copre lo Slot 1. Al prossimo turno uno dei tuoi d6 sarà bloccato.',
        allow: [{ type: 'CLOSE_CARD' }, { type: 'INSPECT_DIE' }], done: { planciaHas: 'ds' }, freeAfter: true },
      { id: 14, text: 'Lo Slot 1 è coperto: un ✊ è gratis, l\'altro costa 2 Luce. Pagali per tenerlo.',
        phase: 'SELEZIONE', turn: 3, allow: [{ type: 'SEL_TOGGLE' }, { type: 'SEL_CONFIRM' }, { type: 'INSPECT_DIE' }], done: { phase: 'RISOLUZIONE' }, keepRequired: ['vigore:2', 'vigore:2'] },
      { id: 15, text: 'Ora tocca a te. Elimina l\'ultimo Zombie.', free: true, done: { phase: 'WON' } },
      { id: 16, text: 'Mazzo e Plancia si azzerano. HP e PT restano. Scegli una Sosta.', at: 'SOGLIA', free: true, done: { cmd: 'SOGLIA_CHOOSE' } }
    ],
    // Verifica attesa (BRIEF 9.1), usata da tools/smoke.js
    expect: {
      endTurn1: { dead: ['Z1'], hp: { Z2: 4 }, at: { Z2: [3, 4] }, playerHp: 10, pm: 1, luce: 1, pt: 7 },
      afterStep12: { dead: ['Z2'], impulsesLeft: 1 },
      step14: { luceAtLeast: 3, planciaStd: [{ card: 'ds', cd: 0 }] }
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
