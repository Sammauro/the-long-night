// Estrae dal motore (src/engine, solo lettura) tutti i dati dei mockup B1.3b e li salva in dati_mockup.json.
// Nessun numero dei mockup è scritto a mano: ogni stato nasce da una partita vera giocata qui con comandi del motore.
// Uso: node team/design/ui/strumenti/estrai_dati.js
//
// Partite usate
//   A · seed 7, stanza 1 (La Cripta), linea principale scritta qui sotto (turni 1–3)
//   B · seed 42, agente di bilanciamento (tools/balance_agent.js): Cripta vinta entro la Veglia → Soglia
//   C · seed 82, agente di bilanciamento: morte al turno 7, nel Buio → Fine Turno del turno 7 e fine partita
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..', '..', '..');
const { loadTLN } = require(path.join(ROOT, 'tools', 'load.js'));
const TLN = loadTLN(['data', 'engine']);
const E = TLN.engine, S = E.state, D = TLN.data;
const key = (c) => c[0] + ',' + c[1];

// ── partita ──────────────────────────────────────────────────────────────────────────
function nuova(seed, rooms) {
  const bus = E.createEventBus(), evs = [];
  bus.onAny((ev) => evs.push(ev));
  const run = E.run.createRun({ seed, start: rooms[0], only: rooms.length === 1, noScript: true, bus });
  if (rooms.length > 1) run.rooms = rooms.slice();
  return { run, evs, G: () => run.game };
}
function X(c, cmd) {
  const r = E.run.execute(c.run, cmd);
  if (!r || r.ok === false) throw new Error('rifiutato ' + JSON.stringify(cmd) + ' → ' + (r && r.error));
  return r;
}
const avanza = (c) => X(c, { type: 'ADVANCE' });
function finoA(c, uid) { // avanza finché il dado uid è attivo
  const G = c.G();
  for (let i = 0; i < 40; i++) { const d = G.res.active && G.seq[G.res.cursor]; if (d && d.uid === uid) return; avanza(c); }
  throw new Error('dado ' + uid + ' mai attivo');
}
function finestraPrimaDi(c, uid) { // avanza finché il prossimo dado da risolvere è uid (finestra libera)
  const G = c.G();
  for (let i = 0; i < 40; i++) {
    if (!G.res.active && G.seq[G.res.cursor] && G.seq[G.res.cursor].uid === uid) return;
    avanza(c);
  }
  throw new Error('finestra prima di ' + uid + ' mai raggiunta');
}
// proposta iniziale della Selezione (SPEC §Selezione, opzione b di US-04): tieni ogni dado che ha uno slot
// libero; tra più dadi dello stesso tipo per lo stesso slot, il valore più alto (a parità, il primo in Sequenza)
function proposta(G) {
  const cov = E.dice.coverage(G), liberi = { vigore: 0, fuoco: 0, terrore: 0 };
  G.equip.forEach((s) => { if (!cov[s.slot]) liberi[s.die]++; });
  const keep = [];
  ['vigore', 'fuoco', 'terrore'].forEach((t) => {
    G.seq.filter((d) => d.kind === t).map((d, i) => ({ d, i })).sort((a, b) => b.d.value - a.d.value || a.i - b.i)
      .slice(0, liberi[t]).forEach((x) => keep.push(x.d.uid));
  });
  return keep;
}
function tieni(c, uids) { const G = c.G(); Object.keys(G.sel.keep).forEach((u) => X(c, { type: 'SEL_TOGGLE', die: u })); uids.forEach((u) => X(c, { type: 'SEL_TOGGLE', die: u })); }

// agente di bilanciamento (stessa logica di tools/balance_agent.js, senza il ciclo principale)
function agente(run) {
  let src = fs.readFileSync(path.join(ROOT, 'tools', 'balance_agent.js'), 'utf8');
  src = src.slice(src.indexOf('function key'), src.indexOf('var res = {}'));
  return new Function('TLN', 'E', 'S', src + '; return make;')(TLN, E, S)(run);
}

// ── fotografia di uno stato ─────────────────────────────────────────────────────────────
const stati = (u) => { const o = {}; Object.keys(u.status).forEach((k) => { const v = u.status[k]; if (v[0] || v[1]) o[k] = v.slice(); }); return o; };
function testoAzione(a) { return a.text; }
function carta(G, h, fase, extra) {
  const d = D.cards.byId[h.id];
  const o = { uid: h.uid, id: h.id, nome: d.name, cd: d.cd, family: d.family, fireSlot: d.fireSlot, eco: d.ecoText,
    azioni: d.actions.map((a) => ({ cost: a.cost, kind: a.kind, dmg: a.dmg, push: a.push, target: a.target, n: a.n, range: a.range, testo: testoAzione(a) })),
    pre: d.preText || null, post: d.postText || null, baseRange: d.baseRange || null, free: d.free || null };
  if (fase === 'RISOLUZIONE') {
    o.motivo = d.free ? E.check(G, { type: 'FREE_CARD', card: h.uid, die: null }) : E.check(G, { type: 'OPEN_CARD', card: h.uid });
    if (d.free) o.motivoFree = freeMotivo(G, h, d);
  }
  return Object.assign(o, extra || {});
}
function freeMotivo(G, h, d) { // motivo del motore per una carta gratuita nella finestra o col dado attivo
  if (d.free === 'charge') {
    if (G.res.open) return 'Completa prima la carta aperta';
    if (S.adjacentEnemies(G, G.player.pos).length) return 'Sei adiacente a un nemico';
  }
  return null;
}
// anteprima in ordine di Sequenza (DM1): ogni nemico calcolato con le posizioni lasciate dai dadi nemici precedenti.
// Si muove una copia "in prestito" e poi si ripristina: il motore resta intatto.
function anteprimaDM1(G, from) {
  const salva = G.enemies.map((e) => ({ e, pos: e.pos.slice(), st: JSON.stringify(e.status), hp: e.hp }));
  const pSh = G.player.status.shield.slice();
  const out = [];
  for (let i = from; i < G.seq.length; i++) {
    const d = G.seq[i];
    if (d.owner === 'P' || d.state !== 'pending') continue;
    const e = S.unitById(G, d.owner);
    if (!e || !e.alive) { out.push({ uid: d.uid, owner: d.owner, spento: 'morto' }); continue; }
    if (S.statusCount(e, 'stun')) { out.push({ uid: d.uid, owner: d.owner, spento: 'stordito', action: d.actionId, name: D.enemies[e.type].actions[d.actionId].name }); continue; }
    const p = E.ai.preview(G, e, d.actionId);
    const act = D.enemies[e.type].actions[d.actionId];
    const r = { uid: d.uid, owner: d.owner, action: d.actionId, name: p.name, value: d.value, from: e.pos.slice(),
      path: p.path.map((c) => c.slice()), end: p.end.slice(), reach: p.reach, raw: p.raw || 0, dmg: p.dmg || 0, absorbed: p.absorbed || 0,
      shield: p.shield || 0, base: act.dmg || 0 };
    if (act.hordeBonus && p.raw > act.dmg) r.orda = S.adjacentEnemies(G, G.player.pos).filter((z) => z !== e && z.type === 'zombie' && G.grid.distance(z.pos, G.player.pos) === 1).map((z) => z.id);
    if (S.hasTrap(G, p.end) && p.path.length) r.trappola = D.terrain.trap.onEnter.direct;
    if (act.lifesteal && r.dmg) r.cura = Math.min(r.dmg, e.hpMax - e.hp + (S.statusCount(G.player, 'counter') ? r.dmg : 0));
    if (r.dmg && S.statusCount(G.player, 'counter')) r.contrattacco = r.dmg;
    out.push(r);
    // effetti che contano per i dadi successivi
    e.pos = p.end.slice();
    if (p.shield) S.addStatus(G, e, 'shield', p.shield, 'anteprima');
    if (r.absorbed) { let a = r.absorbed; for (const k of [1, 0]) { const t = Math.min(a, G.player.status.shield[k]); G.player.status.shield[k] -= t; a -= t; } }
  }
  salva.forEach((s) => { s.e.pos = s.pos; s.e.status = JSON.parse(s.st); s.e.hp = s.hp; });
  G.player.status.shield = pSh;
  return out;
}
function plancia(G) {
  const cov = E.dice.coverage(G);
  // DM3 non esiste ancora: l'associazione carta → slot segue l'ordine di Plancia (std in ordine degli slot standard)
  const std = G.equip.filter((s) => s.kind === 'standard').sort((a, b) => a.order - b.order);
  const voci = G.plancia.std.map((e, i) => ({ pid: e.pid, id: e.id, nome: e.kind === 'seal' ? 'Sigillo' : D.cards.byId[e.id].name, cd: e.cd, max: e.max, posto: 'std', slot: std[i] && std[i].slot }));
  if (G.plancia.fire) { const e = G.plancia.fire; voci.push({ pid: e.pid, id: e.id, nome: D.cards.byId[e.id].name, cd: e.cd, max: e.max, posto: 'fire', slot: G.equip.find((s) => s.kind === 'fire').slot }); }
  return { voci, copertura: cov, slot: G.equip.map((s) => ({ slot: s.slot, die: s.die, cost: s.cost, kind: s.kind })) };
}
function nuove(c) { // carte pescate nell'ultima Preparazione
  const evs = c.evs; let i = evs.length - 1;
  while (i >= 0 && !(evs[i].type === 'PHASE' && evs[i].data.phase === 'PREPARAZIONE')) i--;
  if (i < 0) return [];
  return evs.slice(i).filter((e) => e.type === 'DRAW' && e.data.cause !== 'Eco').map((e) => e.data.card);
}
function foto(c, extra) {
  const G = c.G(), p = G.player;
  const nu = nuove(c);
  const o = {
    turno: G.turn, fase: G.phase, stanza: { id: G.room.id, nome: G.room.name, veglia: G.room.veglia },
    giocatore: { pos: p.pos.slice(), hp: p.hp, hpMax: p.hpMax, pt: p.pt, pm: p.pm, salto: p.jump, luce: p.luce, stati: stati(p) },
    nemici: G.enemies.map((e) => ({ id: e.id, tipo: e.type, pos: e.pos.slice(), hp: Math.max(0, e.hp), hpMax: e.hpMax, vivo: e.alive, stati: stati(e) })),
    terreno: Object.keys(G.terrain).map((k) => ({ at: k.split(',').map(Number), tipo: G.terrain[k].type })),
    seq: G.seq.map((d) => ({ uid: d.uid, owner: d.owner, kind: d.kind, value: d.value, action: d.actionId || null,
      nome: d.owner !== 'P' ? D.enemies[S.unitById(G, d.owner).type].actions[d.actionId].name : null, state: d.state })),
    mano: G.hand.map((h) => carta(G, h, G.phase, { nuova: nu.indexOf(h.uid) >= 0 })),
    mazzo: G.deck.length, scarti: G.discard.length,
    plancia: plancia(G),
  };
  if (G.phase === 'SELEZIONE') {
    const plan = E.dice.selectionPlan(G, G.sel.keep);
    o.selezione = { keep: Object.assign({}, G.sel.keep), plan, motivo: E.check(G, { type: 'SEL_CONFIRM' }) };
    o.anteprima = anteprimaDM1(G, 0);
  }
  if (G.phase === 'FINE_TURNO') o.anteprima = anteprimaDM1(G, 0);
  if (G.phase === 'RISOLUZIONE') {
    o.res = { cursor: G.res.cursor, active: G.res.active, pool: Object.assign({}, G.res.pool), lastMove: !!G.res.lastMove };
    o.anteprima = anteprimaDM1(G, G.res.cursor + (G.res.active ? 1 : 0));
    const R = E.resolution.reachable(G);
    o.raggiungibili = Object.values(R).map((r) => ({ cell: r.cell.slice(), pm: r.pm, salto: r.jump, trap: !!r.trap,
      passi: r.path.map((s, i) => { const prev = i ? r.path[i - 1].cell : p.pos; const adj = S.adjacentEnemies(G, prev).map((e) => e.id);
        return { cell: s.cell.slice(), how: s.how, costo: adj.length ? 2 : 1, accanto: adj }; }) }));
    o.adiacenti = S.adjacentEnemies(G, p.pos).map((e) => e.id);
    if (G.res.active) {
      const d = G.seq[G.res.cursor];
      if (d.owner === 'P') o.manovre = {
        tactical: E.check(G, { type: 'MANEUVER', kind: 'tactical' }),
        ranged: E.check(G, { type: 'MANEUVER', kind: 'ranged', target: (S.aliveEnemies(G)[0] || {}).id }),
        convert: E.check(G, { type: 'MANEUVER', kind: 'convert', to: 'forza' }),
      };
    }
  }
  return Object.assign(o, extra || {});
}
function eventi(c, from, tipi) {
  return c.evs.slice(from).filter((e) => !tipi || tipi.indexOf(e.type) >= 0).map((e) => ({ type: e.type, data: e.data }));
}

const OUT = { origine: 'estrai_dati.js · motore src/engine · ' + new Date().toISOString().slice(0, 10), stati: {} };
const put = (k, v) => { OUT.stati[k] = v; };

// ═════ Partita A · seed 7, La Cripta ═════
function lineaA(fermo) {
  const c = nuova(7, ['r1']), G = c.G();
  if (fermo === 'SP1') return c;
  tieni(c, proposta(G));
  X(c, { type: 'SEL_CONFIRM' });
  finoA(c, 'd2');
  if (fermo === 'SP3') return c;
  X(c, { type: 'OPEN_CARD', card: G.hand.find((h) => h.id === 'pa').uid });
  X(c, { type: 'USE_ACTION', action: 0 });
  finoA(c, 'd1');
  X(c, { type: 'MANEUVER', kind: 'tactical' }); X(c, { type: 'MANEUVER', kind: 'tactical' });
  finoA(c, 'd5');
  X(c, { type: 'OPEN_CARD', card: G.hand.find((h) => h.id === 'di').uid });
  X(c, { type: 'USE_ACTION', action: 0, target: 'Z1', path: [[3, 3], [4, 3], [5, 3]] }); // Distorsione: Z1 sulla trappola
  finoA(c, 'd3');
  X(c, { type: 'OPEN_CARD', card: G.hand.find((h) => h.id === 'af').uid });
  X(c, { type: 'USE_ACTION', action: 0, target: 'Z2' }); X(c, { type: 'USE_ACTION', action: 1, target: 'Z2' });
  for (let i = 0; i < 20 && G.turn === 1; i++) avanza(c);
  return c; // turno 2, Fine Turno
}

// 1 · Selezione, turno 1 (SP1)
{
  const c = lineaA('SP1'), G = c.G();
  const base = foto(c); // Selezione aperta: keep vuoto nel motore
  tieni(c, proposta(G));
  put('sel_proposta', foto(c, { nota: 'SP1 con la proposta iniziale applicata (US-04 opzione b)' }));
  tieni(c, G.seq.filter((d) => d.owner === 'P').map((d) => d.uid));
  put('sel_rifiuto', foto(c, { nota: 'SP1, tenuti tutti e 5: due dadi Fuoco per lo slot 4', toccato: 'd4' }));
  // verifica DM1: turno giocato senza azioni → danni veri
  const v = lineaA('SP1'); tieni(v, proposta(v.G())); X(v, { type: 'SEL_CONFIRM' });
  const from = v.evs.length; for (let i = 0; i < 30 && v.G().turn === 1; i++) avanza(v);
  OUT.verificaDM1_SP1 = eventi(v, from, ['DAMAGE']).filter((e) => e.data.target === 'P').map((e) => e.data.source + ' ' + e.data.cause + ' −' + e.data.hpLoss);
  OUT.previewMotoreSP1 = G.seq.filter((d) => d.owner !== 'P').map((d) => { const p = E.ai.preview(G, S.unitById(G, d.owner), d.actionId); return d.owner + ' ' + p.name + ' dmg ' + (p.dmg || 0); });
  void base;
}
// 1b · Selezione, turno 2 con slot coperti (SP10): Fine Turno chiuso senza scarti
{
  const c = lineaA(), G = c.G();
  X(c, { type: 'ECO_DONE' });
  tieni(c, proposta(G));
  put('sel_guida', foto(c, { nota: 'SP10: Plancia con Distorsione e Attacco di Fuoco a 0°, slot 1 e 4 coperti; proposta iniziale',
    guida: D.hints.find((h) => h.id === 'slotCovered').text }));
  const v2 = G.seq.filter((d) => d.kind === 'vigore'), f1 = G.seq.filter((d) => d.kind === 'fuoco');
  const keep = proposta(G).concat([v2.find((d) => !G.sel.keep[d.uid]).uid, f1[0].uid]);
  tieni(c, keep);
  put('sel_coperto', foto(c, { nota: 'SP10 dopo due tocchi: tenuti anche il secondo ✊ (Slot 1 coperto, 2 Luce) e un 🔥 (Slot 4 coperto, 1 Luce)' }));
}
// 2 · Risoluzione, dado del giocatore (SP3)
{
  const c = lineaA('SP3');
  const ev = eventi(c, 0, ['DAMAGE', 'RESOURCE']).filter((e) => e.type === 'DAMAGE' || e.data.res !== 'pm');
  put('dado_giocatore', foto(c, { nota: 'SP3: Z1 ha agito, primo dado del giocatore (✊1) attivo', ultimi: ev.slice(-4),
    cellaToccata: [1, 3] }));
}
// 3 · Carta aperta: turno 2, Attacco Poderoso, spinta contro il muro
{
  const c = lineaA(), G = c.G();
  X(c, { type: 'ECO_DISCARD', card: G.hand.find((h) => h.id === 'ds').uid, rotate: E.cards.entries(G).find((e) => e.id === 'af').pid });
  X(c, { type: 'ECO_DONE' });
  tieni(c, proposta(G)); X(c, { type: 'SEL_CONFIRM' });
  const primo = G.seq.find((d) => d.owner === 'P');
  finoA(c, primo.uid);
  X(c, { type: 'MOVE', to: [3, 5] });
  X(c, { type: 'OPEN_CARD', card: G.hand.find((h) => h.id === 'ap').uid });
  const from = c.evs.length;
  X(c, { type: 'USE_ACTION', action: 1, target: 'Z4', push: [4, 7] });
  const usata = eventi(c, from);
  const o = G.res.open, z4 = S.unitById(G, 'Z4');
  const ap = {
    id: 'ap', next: o.next, usedAny: o.usedAny,
    azioni: o.def.actions.map((a, i) => ({ i, testo: a.text, motivo: E.check(G, { type: 'USE_ACTION', action: i, target: 'Z4', push: [4, 7] }) })),
    rimetti: E.check(G, { type: 'CANCEL_CARD' }),
    bersagli: S.aliveEnemies(G).map((e) => ({ id: e.id, motivo: E.check(G, { type: 'USE_ACTION', action: 1, target: e.id, push: E.combat.pushOptions(G, G.player.pos, e)[0] && E.combat.pushOptions(G, G.player.pos, e)[0].cell }) })),
    spinta: E.combat.pushOptions(G, G.player.pos, z4).map((x) => ({ cell: x.cell, status: x.status, contro: x.status === 'occupied' ? ((S.unitAt(G, x.cell) || {}).id || (S.terrainAt(G, x.cell) || {}).type) : null })),
    bersaglio: 'Z4', usata,
  };
  put('carta_aperta', foto(c, { nota: 'Turno 2: mosso in R3E5, aperto Attacco Poderoso col ✊2, usata una volta l\'Azione 2 su Z4 contro il muro', aperta: ap }));
}
// 4 · Risoluzione, dado nemico: turno 3, Z1 Morso Rigenerante contro Scudo e Contrattacco
{
  const c = lineaA(), G = c.G();
  X(c, { type: 'ECO_DISCARD', card: G.hand.find((h) => h.id === 'ds').uid, rotate: E.cards.entries(G).find((e) => e.id === 'af').pid });
  X(c, { type: 'ECO_DONE' });
  tieni(c, proposta(G)); X(c, { type: 'SEL_CONFIRM' });
  // turno 2: ogni ✊ in Movimento Tattico, ogni 🔥 in Colpo a Distanza sul nemico più debole entro 3
  for (let i = 0; i < 60 && G.turn === 2; i++) {
    if (G.res && G.res.active && G.seq[G.res.cursor].owner === 'P') {
      while (G.res.pool.forza > 0) X(c, { type: 'MANEUVER', kind: 'tactical' });
      while (G.res.pool.fuoco > 0) {
        const t = S.aliveEnemies(G).filter((e) => G.grid.distance(G.player.pos, e.pos) <= 3).sort((a, b) => a.hp - b.hp)[0];
        if (!t) break; X(c, { type: 'MANEUVER', kind: 'ranged', target: t.id });
      }
    }
    avanza(c);
  }
  // turno 3, Fine Turno: Eco di Parata (Contrattacco) e di Attacco Base (+1 PM, +1 Scudo)
  X(c, { type: 'ECO_DISCARD', card: G.hand.find((h) => h.id === 'pa').uid });
  X(c, { type: 'ECO_DISCARD', card: G.hand.find((h) => h.id === 'ab').uid });
  X(c, { type: 'ECO_DONE' });
  tieni(c, proposta(G)); X(c, { type: 'SEL_CONFIRM' });
  finestraPrimaDi(c, G.seq[0].uid);
  const z = G.seq[G.res.cursor];
  put('nemico_anteprima', foto(c, { nota: 'Turno 3, il primo dado è di ' + z.owner, tocca: z.owner }));
  const from = c.evs.length; avanza(c);
  put('nemico_esito', foto(c, { nota: 'Turno 3, dopo il dado di ' + z.owner, tocca: z.owner, esito: eventi(c, from) }));
}
// 5 · Fine Turno del turno 2 (SP5): Eco con bersaglio in Plancia
{
  const c = lineaA(), G = c.G();
  const rot = eventi(c, 0).filter((e) => e.type === 'STATUS_ROTATED').length;
  const ds = G.hand.find((h) => h.id === 'ds');
  const prima = foto(c, { nota: 'SP5: turno 2, Fine Turno', ruotati: rot });
  // anteprima per ogni bersaglio possibile dell'Eco "Ruota 1 CD": cosa esce e quali slot restano coperti (DM3 calcolato su copia)
  const opzioni = E.cards.entries(G).map((e) => {
    const c2 = lineaA(), G2 = c2.G();
    X(c2, { type: 'ECO_DISCARD', card: G2.hand.find((h) => h.id === 'ds').uid, rotate: e.pid }); X(c2, { type: 'ECO_DONE' });
    return { pid: e.pid, id: e.id, nome: D.cards.byId[e.id].name, dopo: plancia(G2), pmDopo: G2.player.pm };
  });
  const c3 = lineaA(); X(c3, { type: 'ECO_DONE' });
  prima.fineTurno = { scelta: [ds.uid], ecoScelta: D.cards.byId.ds.ecoText, opzioni, senzaScarti: plancia(c3.G()),
    statiRuotati: eventi(c, 0).filter((e) => e.type === 'STATUS').slice(-3) };
  put('fine_turno', prima);
}
// ═════ Partita B · seed 42: Soglia dopo la Cripta ═════
{
  const c = nuova(42, ['r1', 'r2']), run = c.run, A = agente(run);
  for (let g = 0; g < 3000 && run.phase === 'COMBAT'; g++) A.step();
  if (run.phase !== 'SOGLIA') throw new Error('seed 42: niente Soglia');
  const sg = c.evs.find((e) => e.type === 'SOGLIA').data, h = run.history[0];
  const cfg = run.cfg, next = E.run.roomById(sg.next.id);
  // DM4 (anteprima delle Soste) calcolata come applyRests + tetto dei PT in ingresso, su copie del carry
  const prova = (ids) => {
    const carry = Object.assign({}, run.carry, { luceBonus: 0 });
    ids.forEach((id) => { const r = cfg.rests[id]; if (r.hp) carry.hp = Math.min(cfg.hpMax, carry.hp + r.hp); if (r.pt) carry.pt = Math.max(carry.pt, Math.min(r.ptMax, carry.pt + r.pt)); if (r.luceNext) carry.luceBonus += r.luceNext; });
    return { hp: carry.hp, ptIngresso: Math.min(carry.pt, cfg.ptCapOnEnter), luceIngresso: cfg.luceRoomStart + carry.luceBonus };
  };
  const g = run.game;
  put('soglia', {
    nota: 'seed 42, agente di bilanciamento: Cripta vinta entro la Veglia', soglia: sg, storia: h,
    carry: { hp: run.carry.hp, pt: run.carry.pt, luce: run.carry.luce }, ptCap: cfg.ptCapOnEnter, hpMax: cfg.hpMax,
    soste: Object.values(cfg.rests).map((r) => ({ id: r.id, nome: r.name, testo: r.text, dopo: prova([r.id]) })),
    nessuna: prova([]), scelte: ['bendarsi'], motivo: E.run.check(run, { type: 'SOGLIA_CHOOSE', rests: ['bendarsi'] }),
    prossima: { nome: next.name, veglia: next.veglia, presagio: next.omen },
    nemiciUccisi: g.enemies.filter((e) => !e.alive).length, nemici: g.enemies.length, plancia: plancia(g).voci.length,
  });
}
// ═════ Partita C · seed 82: Buio al turno 7, poi morte ═════
{
  const c = nuova(82, ['r1']), run = c.run, A = agente(run);
  let ft7 = null;
  for (let g = 0; g < 3000 && run.phase === 'COMBAT'; g++) {
    const G = run.game;
    if (!ft7 && G.turn === 7 && G.phase === 'FINE_TURNO') {
      const buio = c.evs.filter((e) => e.type === 'RESOURCE' && e.data.cause === 'Buio').pop();
      ft7 = foto(c, { nota: 'seed 82, agente: primo turno di Buio (SP8), Fine Turno del turno 7', buio: buio && buio.data });
    }
    A.step();
  }
  put('fine_turno_buio', ft7);
  const G = run.game;
  const colpi = c.evs.map((e, i) => ({ e, i })).filter(({ e }) => (e.type === 'DAMAGE' && e.data.target === 'P' && e.data.hpLoss > 0) || (e.type === 'RESOURCE' && e.data.res === 'pt' && e.data.delta < 0));
  const turnoDi = (i) => { let t = 0; for (let j = 0; j <= i; j++) if (c.evs[j].type === 'TURN_START') t = c.evs[j].data.turn; return t; };
  const hpDi = (i) => { const r = c.evs.slice(i).find((e) => e.type === 'RESOURCE' && e.data.res === 'hp'); return r ? [r.data.old, r.data.value] : null; };
  put('fine_partita', {
    nota: 'seed 82, agente di bilanciamento: morte nella Cripta al turno 7 (Buio)', defeat: c.evs.find((e) => e.type === 'DEFEAT').data,
    stanza: { nome: G.room.name, veglia: G.room.veglia },
    ultimi: colpi.slice(-3).reverse().map(({ e, i }) => e.type === 'DAMAGE'
      ? { turno: turnoDi(i), fonte: e.data.source, causa: e.data.cause, amount: e.data.amount, final: e.data.final, absorbed: e.data.absorbed, hpLoss: e.data.hpLoss, hp: hpDi(i) }
      : { turno: turnoDi(i), fonte: null, causa: e.data.cause, pt: [e.data.old, e.data.value] }),
    giocatore: { hp: Math.max(0, G.player.hp), pt: G.player.pt, luce: G.player.luce },
    nemiciUccisi: G.enemies.filter((e) => !e.alive).length, nemici: G.enemies.length,
    vivi: G.enemies.filter((e) => e.alive).map((e) => ({ id: e.id, hp: e.hp, pos: e.pos })),
    pos: G.player.pos, nemiciPos: G.enemies.map((e) => ({ id: e.id, pos: e.pos, vivo: e.alive, hp: Math.max(0, e.hp), hpMax: e.hpMax, stati: stati(e) })),
    terreno: Object.keys(G.terrain).map((k) => ({ at: k.split(',').map(Number), tipo: G.terrain[k].type })),
  });
}

// carte: tutte le 14 distinte del set (forma breve generata in lib)
OUT.carte = D.cards.list.map((d) => ({ id: d.id, nome: d.name, cd: d.cd, family: d.family, eco: d.ecoText, pre: d.preText || null, post: d.postText || null, baseRange: d.baseRange || null, free: d.free || null,
  azioni: d.actions.map((a) => ({ cost: a.cost, kind: a.kind, dmg: a.dmg, push: a.push, target: a.target, n: a.n, range: a.range, dtype: a.dtype, testo: a.text })) }));
OUT.nemici = D.enemies.zombie;
OUT.equip = TLN.data.equipment.presets.demo;

fs.writeFileSync(path.join(__dirname, 'dati_mockup.json'), JSON.stringify(OUT, null, 1));
console.log('scritto dati_mockup.json ·', Object.keys(OUT.stati).length, 'stati');
console.log('verifica DM1 SP1 (turno giocato senza azioni):', OUT.verificaDM1_SP1.join(' | '));
console.log('ai.preview SP1 (oggi):', OUT.previewMotoreSP1.join(' | '));
