// THE LONG NIGHT — dadi (BRIEF 5.1)
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  TLN.data = TLN.data || {};

  // impulse: tipo di impulso prodotto · discard: risorsa ottenuta scartandolo in Selezione
  TLN.data.dice = {
    types: {
      vigore:  { id: 'vigore',  name: 'd6 Vigore',  sides: 6, faces: [1, 1, 2, 2, 2, 3],       impulse: 'forza',    discard: { pm: 1 },   icon: '✊' },
      fuoco:   { id: 'fuoco',   name: 'd4 Fuoco',   sides: 4, faces: [1, 1, 2, 2],             impulse: 'fuoco',    discard: { luce: 1 }, icon: '🔥' },
      terrore: { id: 'terrore', name: 'd8 Terrore', sides: 8, faces: [1, 1, 2, 2, 2, 3, 3, 4], impulse: 'presagio', discard: { pt: 1 },   icon: '🔮' },
      ai:      { id: 'ai',      name: 'Dado IA',    sides: 4, faces: [1, 2, 3, 4],             impulse: null,       discard: null,        icon: '☠' }
    },
    // Composizione della Bag del giocatore
    bag: [
      { type: 'vigore', count: 2 },
      { type: 'fuoco', count: 2 },
      { type: 'terrore', count: 1 }
    ],
    impulseIcons: { forza: '✊', fuoco: '🔥', presagio: '🔮' },
    impulseNames: { forza: 'Forza', fuoco: 'Fuoco', presagio: 'Presagio' }
  };
})(typeof window !== 'undefined' ? window : globalThis);
