// THE LONG NIGHT — le 16 carte (BRIEF 5.3, decisioni D9 e D10)
// Schema di un'Azione:
//   cost: { forza|fuoco|presagio: n | 'X', pt: n | 'X' }   (vuoto = gratuita, usabile una volta)
//   kind: attack | draw | shield | jump | range | direct | distort | vulnFire | cone | stunPush
//   target: adj (nemico adiacente) | range (entro la gittata della carta) | any (ovunque) | unit (unità non-te)
// family 'vigore' = carta Vigore: le sue Azioni si possono pagare con 🔥 (Amplificazione Elementale).
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  TLN.data = TLN.data || {};

  var cards = [
    { id: 'ab', name: 'Attacco Base', copies: 2, cd: 0, fireSlot: false, family: 'vigore',
      actions: [
        { cost: {}, kind: 'attack', dmg: 1, target: 'adj', text: 'Gratis: 1 Danno a un adiacente.' },
        { cost: { forza: 1 }, kind: 'attack', dmg: 1, target: 'adj', text: '1 ✊: 1 Danno a un adiacente.' },
        { cost: { forza: 1 }, kind: 'draw', n: 1, text: '1 ✊: pesca 1 carta.' }
      ],
      eco: [{ pm: 1 }, { status: 'shield', n: 1 }], ecoText: '+1 PM · +1 Scudo' },
    { id: 'pa', name: 'Parata', copies: 2, cd: 0, fireSlot: false, family: 'vigore',
      actions: [
        { cost: { forza: 1 }, kind: 'shield', n: 1, text: '1 ✊: +1 Scudo.' },
        { cost: { forza: 1 }, kind: 'draw', n: 1, text: '1 ✊: pesca 1 carta.' }
      ],
      eco: [{ status: 'counter', n: 1 }], ecoText: '+1 Contrattacco' },
    { id: 'sc', name: 'Scatto', copies: 1, cd: 0, fireSlot: false, family: 'vigore',
      onOpen: { draw: 1 }, requires: 1,
      actions: [
        { cost: { forza: 1 }, kind: 'jump', n: 1, text: '1 ✊: +1 PM Salto.' }
      ],
      preText: 'All\'attivazione: pesca 1 carta.',
      eco: [{ pm: 2 }, { rotate: 1 }], ecoText: '+2 PM · Ruota 1 CD' },
    { id: 'tm', name: 'Tiro Mirato', copies: 1, cd: 0, fireSlot: false, family: 'vigore',
      baseRange: 2,
      actions: [
        { cost: { forza: 1 }, kind: 'range', n: 1, text: '1 ✊: +1 Gittata.' },
        { cost: { forza: 1 }, kind: 'attack', dmg: 1, target: 'range', text: '1 ✊: 1 Danno in gittata.' }
      ],
      preText: 'Gittata 2.',
      eco: [{ pm: 2 }, { rotate: 1 }], ecoText: '+2 PM · Ruota 1 CD' },
    { id: 'pm', name: 'Profondità Mente', copies: 1, cd: 0, fireSlot: false, family: 'terrore',
      actions: [
        { cost: { presagio: 'X', pt: 'X' }, kind: 'direct', target: 'any', text: 'X 🔮 + X PT: X Danni Diretti ovunque.' }
      ],
      eco: [{ pm: 1 }, { rotate: 1 }], ecoText: '+1 PM · Ruota 1 CD' },
    { id: 'ds', name: 'Diniego Sismico', copies: 1, cd: 1, fireSlot: false, family: 'vigore',
      actions: [
        { cost: { forza: 1 }, kind: 'attack', dmg: 1, push: 1, target: 'adj', text: '1 ✊: 1 Danno + Spingi 1 un adiacente.' }
      ],
      eco: [{ pm: 1 }, { rotate: 1 }], ecoText: '+1 PM · Ruota 1 CD' },
    { id: 'af', name: 'Attacco di Fuoco', copies: 1, cd: 1, fireSlot: true, family: 'fuoco',
      actions: [
        { cost: { fuoco: 1 }, kind: 'attack', dmg: 2, dtype: 'fire', target: 'adj', text: '1 🔥: 2 Danni Fuoco a un adiacente.' },
        { cost: { fuoco: 1 }, kind: 'vulnFire', target: 'adj', text: '1 🔥: Vulnerabilità Fuoco a un adiacente.' }
      ],
      eco: [{ pm: 1 }, { luce: 1 }], ecoText: '+1 PM · +1 Luce' },
    { id: 'cf', name: 'Cono di Fuoco', copies: 1, cd: 1, fireSlot: true, family: 'fuoco',
      actions: [
        { cost: { fuoco: 2 }, kind: 'cone', dmg: 2, dtype: 'fire', range: 3, text: '2 🔥: 2 Danni Fuoco a ogni nemico nel cono (gittata 3).' }
      ],
      eco: [{ luce: 1 }], ecoText: '+1 Luce' },
    { id: 'ie', name: 'Infusione Elementale', copies: 1, cd: 1, fireSlot: true, family: 'free',
      free: 'infuse', bonus: 1,
      preText: 'Gratis, finestra libera: un tuo dado non-Terrore non risolto diventa Fuoco e +1 impulso.',
      actions: [], eco: [{ pm: 1 }, { rotate: 1 }], ecoText: '+1 PM · Ruota 1 CD' },
    // D9: Distorsione non causa mai Collisione
    { id: 'di', name: 'Distorsione', copies: 1, cd: 1, fireSlot: false, family: 'terrore',
      actions: [
        { cost: { presagio: 'X', pt: 1 }, kind: 'distort', target: 'unit', collision: false, text: 'X 🔮 + 1 PT: sposta un\'unità (non te) fino a X caselle. Trappole attive.' }
      ],
      eco: [{ pm: 1 }, { draw: 1 }], ecoText: '+1 PM · Pesca 1' },
    { id: 'ap', name: 'Attacco Poderoso', copies: 1, cd: 2, fireSlot: false, family: 'vigore',
      selfVuln: true,
      actions: [
        { cost: { forza: 1 }, kind: 'attack', dmg: 2, target: 'adj', text: '1 ✊: 2 Danni a un adiacente.' },
        { cost: { forza: 1 }, kind: 'stunPush', push: 1, target: 'adj', text: '1 ✊: Stordisci un adiacente + Spingi 1.' }
      ],
      preText: 'Usarla ti rende Vulnerabile.',
      eco: [{ pm: 1 }, { luce: 1 }], ecoText: '+1 PM · +1 Luce' },
    { id: 'as', name: 'Attacco Strategico', copies: 1, cd: 2, fireSlot: false, family: 'vigore',
      onClose: 'strategicReward',
      actions: [
        { cost: { forza: 1 }, kind: 'attack', dmg: 1, target: 'adj', text: '1 ✊: 1 Danno a un adiacente.' }
      ],
      postText: 'Alla chiusura: per ogni danno agli HP, +1 PM o +1 Scudo.',
      eco: [{ pm: 1 }], ecoText: '+1 PM' },
    { id: 'cu', name: 'Carica Furiosa', copies: 1, cd: 2, fireSlot: false, family: 'free',
      free: 'charge',
      preText: 'Gratis, finestra libera, non adiacente a nemici. Consuma 2 dadi adiacenti in Sequenza: muovi in linea retta fino alla loro somma; se finisci adiacente a un nemico, danni = caselle percorse.',
      actions: [], eco: [{ luce: 1 }], ecoText: '+1 Luce' },
    // D10: Manipolazione Destino resta CD 2
    { id: 'md', name: 'Manipolazione Destino', copies: 1, cd: 2, fireSlot: false, family: 'free',
      free: 'fate', ptCost: 1,
      preText: 'Gratis, finestra libera. 1 PT: metti un tuo dado non risolto sulla faccia che vuoi.',
      actions: [], eco: [{ rotateAll: true }], ecoText: 'Ruota tutte le CD' }
  ];

  var byId = {};
  cards.forEach(function (c) { byId[c.id] = c; });

  TLN.data.cards = {
    list: cards,
    byId: byId,
    // Carte Vigore: pagabili con 🔥 (Amplificazione Elementale, BRIEF 5.3)
    amplifiable: ['ab', 'pa', 'sc', 'tm', 'ds', 'ap', 'as'],
    amplifyBonus: 1,
    coneDirections: 6
  };
})(typeof window !== 'undefined' ? window : globalThis);
