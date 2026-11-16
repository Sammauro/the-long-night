// THE LONG NIGHT — Equipaggiamento (BRIEF 5.2, decisione D1)
// order: ordine di copertura degli slot standard (1 = coperto per primo). Lo slot Fuoco è indipendente.
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  TLN.data = TLN.data || {};

  TLN.data.equipment = {
    presets: {
      demo: [
        { slot: 1, kind: 'standard', die: 'vigore',  order: 1, cost: 2 },
        { slot: 2, kind: 'standard', die: 'terrore', order: 2, cost: 1 },
        { slot: 3, kind: 'standard', die: 'vigore',  order: 3, cost: 2 },
        { slot: 4, kind: 'fire',     die: 'fuoco',   order: null, cost: 1 }
      ],
      rev11: [
        { slot: 1, kind: 'standard', die: 'terrore', order: 1, cost: 2 },
        { slot: 2, kind: 'standard', die: 'vigore',  order: 2, cost: 1 },
        { slot: 3, kind: 'standard', die: 'vigore',  order: 3, cost: 2 },
        { slot: 4, kind: 'fire',     die: 'fuoco',   order: null, cost: 1 }
      ]
    },
    standardSpots: 3, // posti standard in Plancia
    fireSpots: 1
  };
})(typeof window !== 'undefined' ? window : globalThis);
