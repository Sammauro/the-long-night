// THE LONG NIGHT — stanze (BRIEF 5.6, Veglia D4)
// Coordinate [R, E]: riga 1–8, esagono 1–6. Righe dispari spostate di mezza casella a destra.
// L'ordine di "enemies" è l'ordine di schieramento (numerazione).
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  TLN.data = TLN.data || {};

  TLN.data.rooms = {
    grid: { rows: 8, cols: 6 },
    list: [
      { id: 'r0', index: 0, name: 'Il Risveglio', tutorial: true, veglia: null,
        player: [1, 4],
        enemies: [
          { type: 'zombie', at: [3, 4], hp: 3 },
          { type: 'zombie', at: [5, 4] },
          { type: 'zombie', at: [8, 3] }
        ],
        terrain: [{ type: 'column', at: [4, 5] }] },
      { id: 'r1', index: 1, name: 'La Cripta', veglia: 6,
        omen: 'Odore di terra smossa. Qualcosa raspa contro la pietra.',
        player: [1, 4],
        enemies: [
          { type: 'zombie', at: [4, 3] }, { type: 'zombie', at: [4, 6] },
          { type: 'zombie', at: [6, 2] }, { type: 'zombie', at: [6, 6] },
          { type: 'zombie', at: [7, 4] }
        ],
        terrain: [{ type: 'column', at: [4, 5] }, { type: 'column', at: [6, 4] }, { type: 'trap', at: [5, 3] }] },
      { id: 'r2', index: 2, name: 'Il Corridoio dei Sussurri', veglia: 6,
        omen: 'Oltre la porta qualcuno ripete il tuo nome, sottovoce.',
        player: [1, 3],
        enemies: [
          { type: 'zombie', at: [4, 3] }, { type: 'zombie', at: [4, 4] }, { type: 'zombie', at: [5, 2] },
          { type: 'sussurratore', at: [7, 2] }, { type: 'sussurratore', at: [7, 5] }
        ],
        terrain: [
          { type: 'column', at: [3, 2] }, { type: 'column', at: [3, 5] },
          { type: 'column', at: [6, 3] }, { type: 'column', at: [6, 4] },
          { type: 'trap', at: [4, 1] }, { type: 'trap', at: [5, 6] }
        ] },
      { id: 'r3', index: 3, name: 'La Sala del Custode', veglia: 7,
        omen: 'Un battito di ali secche. Sotto, un passo che fa tremare il pavimento.',
        player: [1, 3],
        enemies: [
          { type: 'custode', at: [6, 3] },
          { type: 'zombie', at: [4, 2] }, { type: 'zombie', at: [4, 5] },
          { type: 'falena', at: [6, 1] }, { type: 'falena', at: [6, 6] }
        ],
        terrain: [{ type: 'brazier', at: [5, 2] }, { type: 'brazier', at: [5, 5] }, { type: 'trap', at: [3, 4] }] }
    ]
  };
})(typeof window !== 'undefined' ? window : globalThis);
