// Le 8 schermate della direzione A, ciascuna come funzione (formato, dati) → palchi HTML (uno per stato).
'use strict';
const A = require('./layout_A');
const { R, C, B, ico } = A;
const S = {};

// 1 · Selezione ───────────────────────────────────────────────────────────────────
function selezione(fmt, st, id, v) {
  const r = R[fmt], plan = st.selezione.plan, P = st.giocatore;
  const kept = Object.values(plan.dice).filter((d) => d.kept).length, disc = Object.values(plan.dice).length - kept;
  const t1 = st.turno === 1;
  let istr = 'Scegli quali dadi tenere: tocca un dado per cambiarlo.', tono = '';
  if (v.rifiuto) { istr = v.istr; tono = 'rifiuto'; }
  else if (!t1) istr = 'Scegli quali dadi tenere. Gli slot 1 e 4 sono coperti: costano Luce.';
  let cart = { marca: 'Previsione', html: A.previsione(st) };
  if (v.guida) cart = { tipo: 'guida', marca: 'Consiglio', html: v.guida, bottone: { t: 'Ho capito', tocco: 'guida chiudi' } };
  const luce = A.luceHTML(P.luce, plan.luceAfter);
  const prim = st.selezione.motivo
    ? C.primario({ spento: true, t: 'Conferma i dadi', motivo: v.motivo })
    : C.primario({ t: 'Conferma i dadi', sub: `tieni ${kept}, scarti ${disc}${guad(plan) ? ': ' + guad(plan) : ''}` });
  const noteVoci = {};
  st.plancia.voci.forEach((x) => { noteVoci[x.pid] = `a 0°: esce al prossimo Fine Turno`; });
  const parti = [
    C.orientamento(r.bar, { turno: st.turno, fase: 'Selezione', istr, tono, veglia: { turno: st.turno, max: 6 } }),
    C.colonnaSx(r.sx, { giocatore: P, luce, delta: {}, nicchie: A.nicchie(st, v.nicchie), voci: A.voci(st, noteVoci) }),
    C.cartiglio(r.cart, cart),
    A.mappa(fmt, st, { evidenzia: v.evidenzia }),
    v.mano ? v.mano : A.manoStd(fmt, st),
    C.rosario(r.ros, { turno: st.turno, dadi: A.dadiSelezione(st, v.toccato), fine: prim }),
  ];
  if (v.extra) parti.push(v.extra);
  return A.palco(fmt, id, parti, v.cls);
}
const guad = (plan) => A.guadagni(plan.gains);
S.selezione = (fmt, D) => [
  { id: 'proposta', did: 'Stato iniziale della Selezione, turno 1 (SP1): proposta già fatta, nessun dado con uno slot libero è scartato.',
    html: selezione(fmt, D.stati.sel_proposta, 'proposta', {}) },
  { id: 'rifiuto', did: 'Dopo un tocco sul Fuoco 1: due dadi Fuoco per uno slot, Conferma spento con il motivo accanto.',
    html: selezione(fmt, D.stati.sel_rifiuto, 'rifiuto', { rifiuto: true, istr: 'Due dadi Fuoco e un solo slot Fuoco: scartane uno.', toccato: 'd4',
      motivo: `Troppi dadi per gli slot: il ${ico('fuoco')}2 non ha slot. Scarta uno dei due ${ico('fuoco')}.`, nicchie: { conflitto: [4] } }) },
  { id: 'guida', did: 'Turno 2 (SP10): slot 1 e 4 coperti da carte in Plancia; consiglio della guida nel cartiglio, griglia e Sequenza nello stesso posto.',
    html: selezione(fmt, D.stati.sel_guida, 'guida', { guida: D.stati.sel_guida.guida, nicchie: { evid: [1, 4] } }) },
  { id: 'coperto', did: 'Turno 2 dopo due tocchi: tenuti il secondo ✊ (Slot 1 coperto, 2 Luce) e un 🔥 (Slot 4 coperto, 1 Luce). Luce insufficiente.',
    html: selezione(fmt, D.stati.sel_coperto, 'coperto', { rifiuto: true, istr: 'Luce insufficiente: scarta un dado o lascia libero uno slot coperto.', toccato: 'd13',
      motivo: 'Luce insufficiente: servono 3, avrai 2 (1 + 1 dallo scarto del Fuoco).', nicchie: { evid: [1, 4] } }) },
];

// 2 · Risoluzione, dado del giocatore ─────────────────────────────────────────────────
S.dado_giocatore = (fmt, D) => {
  const st = D.stati.dado_giocatore, r = R[fmt], P = st.giocatore;
  const d = st.seq[st.res.cursor], n = st.res.pool.forza;
  const cella = st.cellaToccata, rr = st.raggiungibili.find((x) => x[0] === undefined && x.cell[0] === cella[0] && x.cell[1] === cella[1]);
  const accanto = rr.passi[0].accanto.join(', ');
  const bolla = (g) => { const x = g.cx(cella[0], cella[1]), y = g.cy(cella[0]);
    return `<div class="bolla" style="left:${(x - (fmt === 'tel' ? 150 : 230)).toFixed(0)}px;top:${(y - (fmt === 'tel' ? 64 : 96)).toFixed(0)}px">${rr.pm} PM: ogni passo che parte accanto a ${accanto} costa 2. Tocca di nuovo per andarci.</div>`; };
  const manoSt = (m) => { const mb = A.motivoBreve(m, st); return mb ? { motivo: mb } : { apri: true }; };
  const parti = [
    C.orientamento(r.bar, { turno: st.turno, fase: 'Risoluzione', istr: `Usa il dado ${ico('forza')}${d.value}: apri una carta, muoviti o passa.`, veglia: { turno: st.turno, max: 6 } }),
    C.colonnaSx(r.sx, { giocatore: P, delta: { hp: -1, luce: +1 }, nicchie: A.nicchie(st), voci: [] }),
    C.cartiglio(r.cart, { marca: `Dado ${ico('forza')}${d.value}`, html: `${n} impulso <span class="tacche-i">${'<i></i>'.repeat(n)}</span>. Per colpire o difenderti <b>apri una carta</b>; o muoviti (PM ${P.pm}).`,
      bottone: { t: 'Movimento Tattico', sub: `1 ${ico('forza')} → +1 PM`, tocco: 'manovra' } }),
    A.mappa(fmt, st, { raggiungibili: st.raggiungibili, cella, sopra: bolla }),
    A.manoStd(fmt, st, manoSt, 'fase-ris'),
    C.rosario(r.ros, { turno: st.turno, dadi: A.dadiRisoluzione(st), fine: C.primario({ t: 'Passa al dado di Z2', sub: `perdi ${n} ${ico('forza')} non usato` }) }),
  ];
  return [{ id: 'attivo', did: 'Turno 1 (SP3): Z1 ha agito (−1 HP), è attivo il primo dado del giocatore. Caselle raggiungibili con il costo; toccata R1E3.', html: A.palco(fmt, 'attivo', parti) }];
};

// 3 · Carta aperta ───────────────────────────────────────────────────────────────────
S.carta_aperta = (fmt, D) => {
  const st = D.stati.carta_aperta, r = R[fmt], P = st.giocatore, ap = st.aperta, c = A.carteById.ap;
  const bers = {}; ap.bersagli.forEach((b) => { bers[b.id] = b.motivo; });
  const d = st.seq[st.res.cursor], resta = st.res.pool.forza;
  const nomeCella = (cl) => `R${cl[0]}E${cl[1]}`;
  const sp = ap.spinta.map((s) => s.status === 'wall' ? `<li class="muro"><b>muro</b>Collisione col muro: 1 danno a Z4</li>` : s.status === 'free' ? `<li><b>${nomeCella(s.cell)}</b>Z4 entra</li>` : `<li><b>${nomeCella(s.cell)}</b>Collisione con ${s.contro}: 1 danno a entrambi</li>`).join('');
  const azioni = c.azioni.map((a, i) => ({ i, costo: [{ n: 1, ico: 'forza', cls: 'c-forza' }], testo: require('./tln/carte').effetto(a),
    cls: ap.azioni[i].motivo ? 'no' : 'ora', nota: ap.azioni[i].motivo ? ap.azioni[i].motivo : 'Bersaglio Z4: tocca dove spingerlo, poi tocca di nuovo.' }));
  const card = C.cartaAperta(r.mano, { nome: c.nome, cd: c.cd, dado: d.value, resta, azioni,
    dopo: `<ul class="spinte">${sp}</ul><p class="regola">Ti ha reso Vulnerabile: i danni che subisci valgono doppio fino alla rotazione degli stati.</p><p class="regola">Si chiude se ti muovi, apri un'altra carta o passi al dado successivo.</p>`,
    piede: `<span class="no-rimetti">Rimetti in mano: no, la carta è già stata usata.</span><button class="secondario" data-tocco="chiudi carta">Chiudi carta</button>` });
  const hit = st.anteprima.filter((a) => a.reach && a.dmg);
  const parti = [
    C.orientamento(r.bar, { turno: st.turno, fase: 'Risoluzione', istr: 'Attacco Poderoso: scegli dove spingere Z4.', veglia: { turno: st.turno, max: 6 } }),
    C.colonnaSx(r.sx, { giocatore: P, delta: { pm: -6 }, nicchie: A.nicchie(st), voci: A.voci(st, Object.fromEntries(st.plancia.voci.map((v) => [v.pid, 'a 0°: esce al prossimo Fine Turno']))) }),
    C.cartiglio(r.cart, { tipo: 'esito', marca: 'Fatto', html: `Z4 contro il muro: <b>Stordito</b> e 1 danno (HP 6 → 5). Ora sei Vulnerabile: ${hit.map((a) => `<span class="rosso">${a.owner} −${a.dmg}</span>`).join(', ')}.` }),
    A.mappa(fmt, st, { spinta: ap.spinta, bersagli: bers, bersaglio: 'Z4' }),
    card,
    C.rosario(r.ros, { turno: st.turno, dadi: A.dadiRisoluzione(st), fine: C.primario({ t: 'Passa al dado di Z1', sub: `perdi ${resta} ${ico('forza')} non usato` }) }),
  ];
  return [{ id: 'puntamento', did: 'Turno 2: mosso in R3E5, Attacco Poderoso aperto col ✊2 e usato una volta su Z4 contro il muro; ora la seconda spinta.', html: A.palco(fmt, 'puntamento', parti) }];
};

// 4 · Risoluzione, dado nemico ────────────────────────────────────────────────────────
S.dado_nemico = (fmt, D) => {
  const out = [];
  ['nemico_anteprima', 'nemico_esito'].forEach((k) => {
    const st = D.stati[k], r = R[fmt], P = st.giocatore, z = st.tocca, esito = k === 'nemico_esito';
    const ante = D.stati.nemico_anteprima.anteprima.find((a) => a.owner === z);
    const prossimo = st.seq.find((d, i) => i >= (esito ? st.res.cursor : st.res.cursor + 1) && d.state === 'pending');
    const pross = prossimo.owner === 'P' ? `il tuo ${ico(C.tipoDi(prossimo.kind))}${prossimo.value}` : prossimo.owner;
    let cart, prim, track = null;
    if (!esito) {
      cart = { tipo: 'esito', marca: `Tocca a ${z}`, html: `Morso Rigenerante: va in R${ante.end[0]}E${ante.end[1]} e morde. ${ante.raw} danni, lo Scudo ne assorbe ${ante.absorbed}: <span class="rosso">−${ante.dmg} HP</span>. Il tuo Contrattacco gli rende ${ante.contrattacco}; il Morso lo cura di ${ante.cura}.` };
      prim = C.primario({ t: `Fai agire ${z}`, sub: `poi: ${pross}` });
    } else {
      const ev = st.esito, dm = ev.find((e) => e.type === 'DAMAGE' && e.data.target === 'P').data, hp = ev.find((e) => e.type === 'RESOURCE').data;
      const ct = ev.find((e) => e.type === 'DAMAGE' && e.data.cause === 'Contrattacco').data, he = ev.find((e) => e.type === 'HEAL').data;
      const mv = ev.filter((e) => e.type === 'MOVE'); track = { id: z, path: [mv[0].data.from].concat(mv.map((m) => m.data.to)) };
      const z1 = st.nemici.find((n) => n.id === z);
      cart = { tipo: 'esito', marca: `${z} ha agito`, html: `Morso Rigenerante: ${dm.amount} danni, Scudo −${dm.absorbed}: <span class="rosso">HP ${hp.old} → ${hp.value}</span>. Contrattacco: ${ct.hpLoss} danno a ${z}; il Morso lo cura di ${he.amount}: resta a ${z1.hp} HP.` };
      prim = C.primario({ t: 'Prosegui', sub: `prossimo: ${pross}` });
    }
    const parti = [
      C.orientamento(r.bar, { turno: st.turno, fase: 'Risoluzione', istr: esito ? `${z} ha agito. Prossimo: ${pross}.` : `Tocca a ${z}: guarda cosa farà, poi prosegui.`, veglia: { turno: st.turno, max: 6 } }),
      C.colonnaSx(r.sx, { giocatore: P, delta: esito ? { hp: -1 } : {}, nicchie: A.nicchie(st), voci: [] }),
      C.cartiglio(r.cart, cart),
      A.mappa(fmt, esito ? Object.assign({}, st, { anteprima: st.anteprima }) : st, { attivo: esito ? null : z, evidenzia: esito ? z : null, tracciato: track }),
      A.manoStd(fmt, st, (m) => ({ motivo: A.motivoBreve(m, st) ? 'non ora' : null }), 'fase-ris'),
      C.rosario(r.ros, { turno: st.turno, dadi: A.dadiRisoluzione(st, { attivoNemico: esito ? null : z }), cursore: esito ? st.res.cursor : null, fine: prim }),
    ];
    out.push({ id: esito ? 'esito' : 'anteprima', did: esito ? 'Turno 3, dopo il dado di Z1: esito scritto con il perché, percorso reale tracciato.' : 'Turno 3, il gioco si ferma sul dado di Z1: anteprima con Scudo, Contrattacco e Morso.',
      html: A.palco(fmt, esito ? 'esito' : 'anteprima', parti) });
  });
  return out;
};

// 5 · Fine Turno / Eco ──────────────────────────────────────────────────────────────
S.fine_turno = (fmt, D) => {
  const out = [];
  { // turno 2, scarto di Diniego Sismico con Eco "Ruota 1 CD": scegliere la carta
    const st = D.stati.fine_turno, r = R[fmt], P = st.giocatore, ft = st.fineTurno;
    const pids = st.plancia.voci.map((v) => v.pid);
    const pannello = `<div class="eco-panel" data-pannello="eco">
      <p class="eco-tot">Scarti 1: <b>+1 PM</b>, <b>Ruota 1 CD</b></p>
      <p class="eco-chiede">Scegli la carta in Plancia da ruotare:</p>
      ${ft.opzioni.map((o) => { const lib = [1, 4].filter((s) => st.plancia.copertura[s] && !o.dopo.copertura[s]); return `<button class="scelta-cd" data-tocco="ruota ${o.nome}"><b>${o.nome}</b><span>esce ora: Slot ${lib.join(', ')} libero alla Selezione</span></button>`; }).join('')}
      <p class="eco-senza">Senza scarti restano entrambe a 0° e coprono gli Slot 1 e 4.</p></div>`;
    const mano = A.manoStd(fmt, st, (m) => ({ scarta: ft.scelta.indexOf(m.uid) >= 0, sel: ft.scelta.indexOf(m.uid) >= 0 }), 'fase-eco con-pannello').replace('</section>', pannello + '</section>');
    const noteV = { evid: pids };
    st.plancia.voci.forEach((v) => { noteV[v.pid] = `90°: senza Eco resta e copre Slot ${v.slot}`; });
    const parti = [
      C.orientamento(r.bar, { turno: 2, fase: 'Fine Turno', istr: 'Dadi del turno 2 già lanciati: prima chiudi il turno 1.', veglia: { turno: 2, max: 6 } }),
      C.colonnaSx(r.sx, { giocatore: P, nicchie: A.nicchie(st, { evid: [1, 4] }), voci: A.voci(st, noteV) }),
      C.cartiglio(r.cart, { marca: 'Fine Turno', html: `<div class="passi"><span class="passo fatto">Stati ruotati</span><span class="passo ora">Scarto ed Eco</span><span class="passo">Escono le carte a 0°</span><span class="passo">Ruotano le altre</span></div><div class="tenue">Stati ruotati: nessuno tuo è scaduto.</div>` }),
      A.mappa(fmt, st, {}),
      mano,
      C.rosario(r.ros, { turno: 2, dadi: A.dadiRisoluzione(Object.assign({}, st, { res: null })), cls: 'nuovo-turno', fine: C.primario({ spento: true, t: 'Scarta 1', sub: '+1 PM, Ruota 1 CD', motivo: 'Scegli la carta in Plancia da ruotare.' }) }),
    ];
    out.push({ id: 'eco', did: 'Turno 2, Fine Turno (SP5): scelto Diniego Sismico per l\'Eco "Ruota 1 CD"; il bersaglio in Plancia è da scegliere, Conferma spento con il motivo.', html: A.palco(fmt, 'eco', parti) });
  }
  { // turno 7, primo turno di Buio (SP8)
    const st = D.stati.fine_turno_buio, r = R[fmt], P = st.giocatore, b = st.buio;
    const z = st.anteprima.find((a) => a.reach && a.dmg);
    const noteV = {}; st.plancia.voci.forEach((v) => { noteV[v.pid] = v.cd === 0 ? 'a 0°: esce ora' : `${v.cd * 90}°: ruota a 0°, copre Slot ${v.slot}`; });
    const parti = [
      C.orientamento(r.bar, { turno: st.turno, fase: 'Fine Turno', tono: 'buio', istr: 'Buio: −1 PT a ogni turno. Chiudi il turno 6.', veglia: { turno: 6, max: 6 }, buio: true }),
      C.colonnaSx(r.sx, { giocatore: P, delta: { pt: -1 }, nicchie: A.nicchie(st), voci: A.voci(st, noteV) }),
      C.cartiglio(r.cart, { tipo: 'buio', marca: 'Buio', html: `La Veglia è finita al turno 6: <span class="rosso">PT ${b.old} → ${b.value}</span>, e così a ogni turno. ${z ? `${z.owner} ti raggiunge: <span class="rosso">−${z.dmg} HP</span>, ne hai ${P.hp}.` : ''}`, bottone: { t: 'Ho capito', tocco: 'avviso chiudi' } }),
      A.mappa(fmt, st, {}),
      A.manoStd(fmt, st, () => ({}), 'fase-eco'),
      C.rosario(r.ros, { turno: st.turno, dadi: A.dadiRisoluzione(Object.assign({}, st, { res: null })), fine: C.primario({ t: 'Prosegui senza scartare', sub: 'tocca una carta per il suo Eco' }) }),
    ];
    out.push({ id: 'buio', did: 'Turno 7 (SP8, seed 82): primo turno di Buio. L\'avviso resta nel cartiglio finché non lo chiudi o agisci.', html: A.palco(fmt, 'buio', parti, 'scena-buio') });
  }
  return out;
};

// 7 · Dettaglio di nemico e di carta ──────────────────────────────────────────────────
S.dettaglio = (fmt, D) => {
  const st = D.stati.sel_proposta, z = D.nemici, a3 = st.anteprima.find((a) => a.owner === 'Z3'), r = R[fmt];
  const pos3 = st.seq.findIndex((d) => d.owner === 'Z3') + 1;
  const facce = [[[1, 2], 'orda'], [[3], 'morso'], [[4], 'incassare']].map(([f, k]) => `<div class="faccia ${f.indexOf(st.seq[pos3 - 1].value) >= 0 ? 'estratta' : ''}"><b>${f.join('–')}</b><div><span class="nm">${z.actions[k].name}</span>${f.indexOf(st.seq[pos3 - 1].value) >= 0 ? ' · questo turno' : ''}<br>${z.actions[k].text}</div></div>`).join('');
  const nem = C.scheda(r.mano, { html: `<header>${B.sigillo('Z3', fmt === 'tel' ? 24 : 32, 'grigio')}<h3>Zombie Z3</h3></header>
    <p>HP <b>6/6</b>. Movimento ${z.mov}. Nessuno stato.</p>
    <p>Il suo dado è il ${pos3}° della Sequenza: <b>${st.seq[pos3 - 1].value}</b>, ${z.actions.orda.name}. Arriva in R${a3.end[0]}E${a3.end[1]}: non ti raggiunge.</p>${facce}` });
  const di = A.carteById.di;
  const cartaR = fmt === 'tel' ? { x: 300, y: 40, w: 246, h: 214 } : { x: 560, y: 120, w: 396, h: 330 };
  const car = C.scheda(cartaR, { html: `<p class="motivo-sel">In Selezione le carte non si giocano: scegli i dadi.</p>
    <header><h3>${di.nome}</h3><span class="cd">CD ${di.cd}</span></header>
    <p>${require('./tln/carte').emoji(di.azioni[0].testo)} Non causa Collisione.</p>
    <p><b>Eco</b> (se la scarti a fine turno): ${di.eco}.</p>
    <p>Dopo l'uso va in Plancia: alla Selezione successiva copre uno slot standard (costa Luce usarlo), poi esce.</p>` });
  return [
    { id: 'nemico', did: 'SP1, tocco su Z3 (sprite o dado) e poi su "dettaglio": scheda sopra la mano, Z3 e il suo dado evidenziati. Si chiude con un tocco fuori.',
      html: selezione(fmt, st, 'nemico', { evidenzia: 'Z3', extra: nem, cls: 'con-scheda' }) },
    { id: 'carta', did: 'SP1, tocco su Distorsione: in Selezione non si gioca (motivo in cima), dettaglio con il testo intero lontano dal dito.',
      html: selezione(fmt, st, 'carta', { extra: car, cls: 'con-scheda-carta', mano: A.manoStd(fmt, st, (m) => (m.id === 'di' ? { sel: true } : {})) }) },
  ];
};
module.exports = { S, selezione };
