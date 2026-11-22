// Dati veri per la dinamica C del concetto (B1.3c): SP3 (seed 7, turno 1, dado ✊1 attivo dopo Z1),
// Diniego Sismico aperto su Z1: caselle di spinta del motore, esito e anteprima dei nemici dopo la spinta.
// Uso: node team/design/ui/concetto/strumenti/estrai_diniego.js  → dati_diniego.json
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..', '..', '..');
const { loadTLN } = require(path.join(ROOT, 'tools', 'load.js'));
const TLN = loadTLN(['data', 'engine']);
const E = TLN.engine, S = E.state;

function nuova() {
  const bus = E.createEventBus(), evs = [];
  bus.onAny((ev) => evs.push(ev));
  const run = E.run.createRun({ seed: 7, start: 'r1', only: true, noScript: true, bus });
  return { run, evs, G: () => run.game };
}
function X(c, cmd) { const r = E.run.execute(c.run, cmd); if (!r || r.ok === false) throw new Error('rifiutato ' + JSON.stringify(cmd) + ' → ' + (r && r.error)); return r; }
function sp3() {
  const c = nuova(), G = c.G();
  ['d1', 'd2', 'd3', 'd5'].forEach((u) => X(c, { type: 'SEL_TOGGLE', die: u }));
  X(c, { type: 'SEL_CONFIRM' });
  for (let i = 0; i < 40; i++) { const d = G.res.active && G.seq[G.res.cursor]; if (d && d.uid === 'd2') break; X(c, { type: 'ADVANCE' }); }
  return c;
}
const out = {};
const c = sp3(), G = c.G();
const ds = G.hand.find((h) => h.id === 'ds');
out.keepIniziale = Object.keys(G.sel ? G.sel.keep || {} : {});
out.apri = E.check(G, { type: 'OPEN_CARD', card: ds.uid });
X(c, { type: 'OPEN_CARD', card: ds.uid });
const z1 = S.unitById(G, 'Z1');
out.giocatore = G.player.pos; out.z1 = z1.pos;
out.spinta = E.combat.pushOptions(G, G.player.pos, z1).map((x) => ({ cell: x.cell, status: x.status, inGrid: x.inGrid, contro: x.status === 'occupied' ? ((S.unitAt(G, x.cell) || {}).id || (S.terrainAt(G, x.cell) || {}).type) : null }));
out.bersagli = S.aliveEnemies(G).map((e) => { const po = E.combat.pushOptions(G, G.player.pos, e)[0]; return { id: e.id, motivo: E.check(G, { type: 'USE_ACTION', action: 0, target: e.id, push: po && po.cell }) }; });
out.rimetti = E.check(G, { type: 'CANCEL_CARD' });
out.esiti = out.spinta.map((sp) => {
  const v = sp3(), g = v.G();
  X(v, { type: 'OPEN_CARD', card: g.hand.find((h) => h.id === 'ds').uid });
  const from = v.evs.length;
  const chk = E.check(g, { type: 'USE_ACTION', action: 0, target: 'Z1', push: sp.cell });
  if (chk) return { cell: sp.cell, rifiuto: chk };
  X(v, { type: 'USE_ACTION', action: 0, target: 'Z1', push: sp.cell });
  const ev = v.evs.slice(from).filter((e) => ['DAMAGE', 'PUSH', 'COLLISION', 'MOVE', 'STATUS', 'POOL'].includes(e.type)).map((e) => ({ type: e.type, data: e.data }));
  const z = S.unitById(g, 'Z1');
  // anteprima dei dadi nemici che restano, in ordine di Sequenza, giocando il turno senza fare altro
  const f2 = v.evs.length; for (let i = 0; i < 30 && g.turn === 1; i++) X(v, { type: 'ADVANCE' });
  const danni = v.evs.slice(f2).filter((e) => e.type === 'DAMAGE' && e.data.target === 'P').map((e) => e.data.source + ' ' + e.data.cause + ' −' + e.data.hpLoss);
  return { cell: sp.cell, z1: { pos: z.pos, hp: z.hp }, eventi: ev, danniSeNonFaiAltro: danni };
});
fs.writeFileSync(path.join(__dirname, 'dati_diniego.json'), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out));
