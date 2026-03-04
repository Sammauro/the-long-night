// ═══════════════════════════════════════════════════════════
//  LIVELLO DEMO — Scenario v0.0.4a
//  The Long Night · src/engine/data/levels_demo.js
//
//  Coordinate: {r: riga, q: colonna} — 1-indexed
//  Griglia: 8 righe × 6 colonne
//
//  Dipendenze: nessuna — dati statici puri
// ═══════════════════════════════════════════════════════════

export const DEMO_LEVEL = {
  id: 'demo',
  name: 'Scenario Demo',

  grid: {
    rows: 8,
    cols: 6,
  },

  // Posizione iniziale giocatore
  player: {
    id: 'player',
    pos: { r: 1, q: 4 },
  },

  // 4 zombie — statistiche in src/engine/data/enemies_zombie.js (Step 2)
  enemies: [
    { id: 'zombie_a', type: 'zombie', pos: { r: 4, q: 3 } },
    { id: 'zombie_b', type: 'zombie', pos: { r: 6, q: 2 } },
    { id: 'zombie_c', type: 'zombie', pos: { r: 7, q: 4 } },
    { id: 'zombie_d', type: 'zombie', pos: { r: 7, q: 5 } },
  ],

  // Ostacoli inamovibili — colonne
  obstacles: [
    { id: 'col_a', type: 'column', pos: { r: 4, q: 5 } },
    { id: 'col_b', type: 'column', pos: { r: 6, q: 4 } },
  ],

  // Trappole — danni a chi ci entra
  traps: [
    { id: 'trap_a', pos: { r: 5, q: 3 }, active: true },
  ],
};
