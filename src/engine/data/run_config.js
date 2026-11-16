// THE LONG NIGHT — parametri della run (BRIEF 5.7, decisioni D1–D4)
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  TLN.data = TLN.data || {};

  TLN.data.runConfig = {
    equipPreset: 'demo',            // D1 · sovrascrivibile con ?equip=rev11
    hpStart: 10, hpMax: 10,
    ptStart: 6,
    pmRoomStart: 2,                 // D2
    luceRoomStart: 0,               // D2
    handLimit: 5,
    ptCapOnEnter: 6,                // D3 · in combattimento i PT non hanno tetto
    darkPenaltyPT: 1,               // D4 · −1 PT a ogni Lancio oltre la Veglia
    restsBase: 1,                   // D4
    restsInVeglia: 2,               // D4 · stanza chiusa entro la Veglia
    rests: {
      bendarsi:    { id: 'bendarsi',    name: 'Bendarsi',               hp: 3, text: '+3 HP (max 10)' },
      raccogliersi:{ id: 'raccogliersi',name: 'Raccogliersi',           pt: 2, ptMax: 6, text: '+2 PT (max 6)' },
      lanterna:    { id: 'lanterna',    name: 'Alimentare la lanterna', luceNext: 2, text: '+2 Luce a inizio della prossima stanza' }
    },
    // D2 · cosa sopravvive tra le stanze. cooldown e luce: interruttori per esperimenti futuri (restano false)
    persist: { hp: true, pt: true, luce: false, cooldown: false },
    sequence: ['r0', 'r1', 'r2', 'r3'],
    skipTutorialStart: 'r1',
    maxTurnsSafety: 99
  };
})(typeof window !== 'undefined' ? window : globalThis);
