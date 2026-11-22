// Direzione A "Il Rosario" con i tre innesti dalla B: posizioni dei pannelli per formato e composizione
// delle schermate di combattimento a partire dagli stati estratti dal motore (dati_mockup.json).
'use strict';
const B = require('./tln/base');
const C = require('./tln/componenti');
const M = require('./tln/mappa');
const { ico } = B;

// ── rettangoli dei pannelli ──────────────────────────────────────────────────────────
const R = {
  tel: { bar: { x: 0, y: 0, w: 844, h: 30 }, sx: { x: 0, y: 30, w: 104, h: 272 }, cart: { x: 104, y: 30, w: 442, h: 46 },
    map: { x: 104, y: 76, w: 442, h: 226, basso: 1 }, mano: { x: 552, y: 31, w: 288, h: 270 }, ros: { x: 0, y: 302, w: 844, h: 88 },
    hex: { W: 50, S: 0.62 }, striscia: 52, strisciaEco: 46 },
  desk: { bar: { x: 0, y: 0, w: 1400, h: 48 }, sx: { x: 0, y: 48, w: 190, h: 642 }, cart: { x: 190, y: 48, w: 770, h: 62 },
    map: { x: 190, y: 110, w: 770, h: 580, basso: 30 }, mano: { x: 966, y: 52, w: 426, h: 634 }, ros: { x: 0, y: 690, w: 1400, h: 160 },
    hex: { W: 104, S: 0.66 }, striscia: 125, strisciaEco: 90 },
};

const carteById = {};
function initCarte(D) { D.carte.forEach((c) => { carteById[c.id] = c; }); }
const nomeCarta = (id) => carteById[id].nome;
const cartaDati = (m) => Object.assign({}, carteById[m.id], { uid: m.uid });

// ── pezzi comuni ────────────────────────────────────────────────────────────────────
function nicchie(st, extra) {
  extra = extra || {};
  const plan = st.selezione && st.selezione.plan, cov = st.plancia.copertura;
  return [1, 2, 3, 4].map((n) => {
    const s = st.plancia.slot.find((x) => x.slot === n);
    const o = { slot: n, die: s.die };
    if (plan) {
      const uid = Object.keys(plan.dice).find((u) => plan.dice[u].kept && plan.dice[u].slot === n);
      if (uid) o.occupante = st.seq.find((d) => d.uid === uid);
    }
    if (cov[n]) o.coperto = { costo: s.cost };
    if ((extra.evid || []).indexOf(n) >= 0) o.evid = true;
    if ((extra.conflitto || []).indexOf(n) >= 0) o.conflitto = true;
    return o;
  });
}
function voci(st, note) {
  return st.plancia.voci.map((v) => ({ slot: v.slot, nome: v.nome, nota: (note && note[v.pid]) || `${v.cd * 90}°, copre Slot ${v.slot}`, evid: note && note.evid && note.evid.indexOf(v.pid) >= 0, esito: note && note.esito && note.esito[v.pid] }));
}
function luceHTML(a, b) { return a === b ? `${a}` : `${a}<span class="poi">→${b}</span>`; }
function guadagni(g) { const o = []; if (g.pm) o.push(`+${g.pm} PM`); if (g.luce) o.push(`+${g.luce} Luce`); if (g.pt) o.push(`+${g.pt} PT`); return o.join(', '); }
const anteDi = (st, id) => (st.anteprima || []).find((a) => a.owner === id);
function dadoNemico(st, d, extra) {
  const a = anteDi(st, d.owner) || {};
  const breve = B.AZ_BREVE[d.action];
  let giu = breve;
  if (a.spento === 'stordito') giu = 'salta';
  else if (a.reach && (a.dmg || a.absorbed)) giu = `${breve} −${a.dmg}`;
  return Object.assign({ owner: d.owner, value: d.value, azione: d.action, reach: a.reach && a.dmg > 0, giu, stato: a.spento ? 'spento' : '' }, extra || {});
}
function dadiSelezione(st, toccato) {
  const plan = st.selezione.plan;
  return st.seq.map((d) => {
    if (d.owner !== 'P') return dadoNemico(st, d);
    const i = plan.dice[d.uid], kept = i.kept;
    let su, suCls = '';
    if (kept) { su = i.slot ? (i.cost ? `${i.cost} Luce` : `Slot ${i.slot}`) : 'nessuno slot'; if (!i.slot) suCls = 'errore'; }
    else su = i.label === 'libero' ? 'slot libero' : i.label;
    const st2 = kept ? (i.slot ? 'tenuto' : 'tenuto conflitto') : 'scartato';
    return { owner: 'P', uid: d.uid, kind: d.kind, value: d.value, su, suCls, giu: B.SCARTO[d.kind], scelto: kept ? 'su' : 'giu', stato: st2 + (toccato === d.uid ? ' toccato' : '') };
  });
}
function dadiRisoluzione(st, opz) {
  opz = opz || {};
  return st.seq.map((d, i) => {
    const attivo = st.res && st.res.active && st.res.cursor === i;
    const stato = d.state === 'resolved' ? 'risolto' : attivo ? 'attivo' : '';
    if (d.owner !== 'P') {
      const extra = { stato: (stato || '') + (opz.attivoNemico === d.owner && d.state === 'pending' ? ' attivo' : '') };
      const x = dadoNemico(st, d, {});
      if (d.state === 'resolved') { x.giu = B.AZ_BREVE[d.action]; x.reach = false; }
      x.stato = [x.stato, extra.stato].join(' ');
      return x;
    }
    const o = { owner: 'P', uid: d.uid, kind: d.kind, value: d.value, stato };
    if (attivo) { const n = st.res.pool.forza + st.res.pool.fuoco + st.res.pool.presagio; o.giu = `<span class="tacche">${'<i></i>'.repeat(n)}${'<i class="vuota"></i>'.repeat(Math.max(0, d.value - n))}</span>`; o.scelto = 'giu'; o.su = 'attivo'; o.suCls = ''; }
    return o;
  });
}
function motivoBreve(m, st) {
  if (!m.motivo) return null;
  const tipi = new Set(); (carteById[m.id].azioni || []).forEach((a) => Object.keys(a.cost || {}).forEach((k) => { if (k !== 'pt') tipi.add(k); }));
  if (m.motivo === 'Serve un dado attivo con impulsi adatti') return 'serve ' + [...tipi].map((t) => ico(t)).join('');
  if (m.motivo === 'Sei adiacente a un nemico') return 'accanto a ' + st.adiacenti.join(', ');
  if (m.motivo === 'Completa prima la carta aperta') return 'carta aperta';
  if (/non-Terrore|tuo dado/.test(m.motivo)) return 'nessun dado adatto';
  return m.motivo;
}
function mappa(fmt, st, opts) {
  const r = R[fmt].map, g = M.geo(r, R[fmt].hex.W, R[fmt].hex.S);
  const s = M.scena(st, g, opts, M.DIM[fmt]);
  return `<div id="mappa" class="mappa" style="${C.pos(r)}" data-pannello="mappa">${s.svg}${s.html}${opts.sopra ? opts.sopra(g) : ''}</div>`;
}
function palco(fmt, id, parti, cls) {
  return `<div class="palco fmt-${fmt} ${cls || ''}" id="${id}">${parti.join('\n')}</div>`;
}
function manoStd(fmt, st, statiFn, cls) {
  const carte = st.mano.map(cartaDati);
  const stati = st.mano.map((m, i) => Object.assign({ nuova: st.turno > 1 && m.nuova && st.fase === 'SELEZIONE', intero: fmt === 'desk' }, statiFn ? statiFn(m, i) : {}));
  return C.mano(R[fmt].mano, carte, stati, cls);
}
function previsione(st) { // testo del cartiglio in Selezione: danni in ordine di Sequenza (DM1)
  const hit = st.anteprima.filter((a) => a.reach && a.dmg);
  const tot = hit.reduce((s, a) => s + a.dmg, 0), hp = st.giocatore.hp;
  const parti = hit.map((a) => `<span class="rosso">${a.owner} −${a.dmg}</span>${a.orda ? ` (Orda: ${a.orda.join(', ')} accanto)` : ''}`).join(', ');
  return hit.length ? `Se nessuno cambia nulla: ${parti}. HP ${hp} → <b>${hp - tot}</b>.` : 'Nessun nemico ti raggiunge in questo turno.';
}

module.exports = { R, initCarte, carteById, nomeCarta, cartaDati, nicchie, voci, luceHTML, guadagni, anteDi, dadoNemico, dadiSelezione, dadiRisoluzione, motivoBreve, mappa, palco, manoStd, previsione, C, B, M, ico };
