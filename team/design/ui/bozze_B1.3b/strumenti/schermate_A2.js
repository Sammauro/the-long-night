// Schermate fuori dal turno: Soglia (6) e Fine partita (8). Stessi token e componenti del combattimento.
'use strict';
const A = require('./layout_A');
const { R, C, B, M, ico } = A;
const S = {};

// 6 · Soglia ─────────────────────────────────────────────────────────────────────
S.soglia = (fmt, D) => {
  const s = D.stati.soglia, g = s.soglia, tel = fmt === 'tel';
  const W = tel ? 844 : 1400, H = tel ? 390 : 850, bar = R[fmt].bar;
  const ptPerdi = s.carry.pt - s.ptCap;
  const sosta = (x) => {
    const sel = s.scelte.indexOf(x.id) >= 0, n = s.nessuna, d = x.dopo;
    let eff;
    if (d.hp !== n.hp) eff = `HP <b>${n.hp} → ${d.hp}</b>`;
    else if (d.luceIngresso !== n.luceIngresso) eff = `Luce d'ingresso <b>${n.luceIngresso} → ${d.luceIngresso}</b>`;
    else if (d.ptIngresso !== n.ptIngresso) eff = `PT d'ingresso <b>${n.ptIngresso} → ${d.ptIngresso}</b>`;
    else eff = `<b class="nulla">nessun cambiamento</b><span class="perche">hai ${s.carry.pt} PT: entri comunque con ${n.ptIngresso}</span>`;
    return `<button class="sosta ${sel ? 'scelta' : ''}" data-tocco="sosta ${x.id}" aria-pressed="${sel}">
      <span class="s-nome">${x.nome}</span><span class="s-testo">${x.testo}</span><span class="s-eff">${eff}</span>${sel ? '<span class="s-segno">scelta</span>' : '<span class="s-segno vuoto">tocca per sceglierla</span>'}</button>`;
  };
  const html = `<div class="palco fmt-${fmt} soglia" id="soste">
    <header class="orienta" style="${C.pos(bar)}" data-pannello="orientamento"><span class="turno">Soglia</span><span class="fase">${s.storia.name} è chiusa</span>
      <span class="istr">Scegli ${g.rests} Soste diverse, poi attraversa.</span><span class="veglia"><span>chiusa al turno ${s.storia.turns} di ${s.storia.veglia}</span></span></header>
    <section class="s-porti" data-pannello="cosa porti">
      <h3>Cosa porti con te</h3>
      <p class="riga">${ico('hp')} HP <b>${s.carry.hp}</b>/${s.hpMax} <span class="resta">restano</span></p>
      <p class="riga">${ico('pt')} PT <b>${s.carry.pt} → ${s.ptCap}</b> <span class="perdi">entrando ne perdi ${ptPerdi}</span></p>
      <h3>Si azzera</h3>
      <p class="riga">${ico('luce')} Luce <b>${s.carry.luce} → ${s.nessuna.luceIngresso}</b></p>
      <p class="riga">Plancia: ${s.plancia} carte in Cooldown escono</p>
      <p class="perche-soste">${g.rests} Soste: hai chiuso la Cripta entro la Veglia (${s.storia.turns} turni su ${s.storia.veglia}).</p>
    </section>
    <section class="s-soste" data-pannello="soste">${s.soste.map(sosta).join('')}</section>
    <section class="s-oltre" data-pannello="oltre"><h3>Oltre la soglia</h3><p class="s-stanza">${s.prossima.nome}</p><p>Veglia: ${s.prossima.veglia} turni</p><p class="presagio">«${s.prossima.presagio}»</p></section>
    <div class="s-fine" data-pannello="primario">${C.primario({ spento: true, t: 'Attraversa la Soglia', sub: `${s.scelte.length} di ${g.rests} Soste`, motivo: `Scegli ancora ${g.rests - s.scelte.length} Sosta.` })}</div>
  </div>`;
  void W; void H;
  return [{ id: 'soste', did: 'Soglia dopo la Cripta (seed 42): 2 Soste, Bendarsi scelta; ogni Sosta mostra prima → dopo; il pulsante dice cosa manca.', html }];
};

// 8 · Fine partita ──────────────────────────────────────────────────────────────────
S.fine_partita = (fmt, D) => {
  const f = D.stati.fine_partita, r = R[fmt], d = f.defeat, u = f.ultimi[0];
  const st = { giocatore: { pos: f.pos, hp: 0, hpMax: 10, pt: f.giocatore.pt, pm: 0, salto: 0, luce: f.giocatore.luce, stati: {} }, nemici: f.nemiciPos.map((n) => Object.assign({ tipo: 'zombie', vivo: n.vivo }, n)), terreno: f.terreno, anteprima: [] };
  const colpo = (c) => c.fonte
    ? `<li><span class="t">T${c.turno}</span><span><b>${c.fonte}</b>, ${c.causa}: <span class="rosso">−${c.hpLoss} HP</span> (${c.hp[0]} → ${c.hp[1]})${c.final > c.amount ? `; ${c.amount} ×2, eri Vulnerabile` : ''}</span></li>`
    : `<li><span class="t">T${c.turno}</span><span><b>${c.causa}</b>: <span class="rosso">−1 PT</span> (${c.pt[0]} → ${c.pt[1]})</span></li>`;
  const tel = fmt === 'tel';
  const lap = { x: tel ? 230 : 380, y: tel ? 40 : 90, w: tel ? 470 : 700, h: tel ? 340 : 600 };
  const parti = [
    C.orientamento(r.bar, { turno: d.turn, fase: 'Fine della partita', tono: 'buio', istr: 'La notte ti ha preso.', veglia: { turno: 6, max: 6 }, buio: !d.inVeglia }),
    C.colonnaSx(r.sx, { giocatore: st.giocatore, nicchie: [1, 2, 3, 4].map((n) => ({ slot: n, die: D.equip.find((e) => e.slot === n).die })), voci: [] }),
    `<div class="velo">${A.mappa(fmt, st, { minacce: false, evidenzia: u.fonte })}</div>`,
    `<section class="lapide" style="${C.pos(lap)}" data-pannello="fine partita">
      <h2>Morte</h2><p class="causa">HP a 0. Ti ha finito <b>${u.fonte}</b> con ${u.causa}: ${u.hpLoss} danno.</p>
      <p class="dove">${f.stanza.nome}, turno ${d.turn}, ${d.inVeglia ? 'entro la Veglia' : `nel Buio: la Veglia era finita al turno ${f.stanza.veglia}`}.</p>
      <h3>Ultimi colpi</h3><ul class="colpi">${f.ultimi.map(colpo).join('')}</ul>
      <p class="conto">Zombie abbattuti: ${f.nemiciUccisi} di ${f.nemici}.</p>
      <div class="azioni-fine"><div class="prim-fine">${C.primario({ t: 'Ricomincia', sub: 'stessa stanza, nuovi dadi' })}</div>
        <button class="secondario" data-tocco="copia">Copia riepilogo</button><button class="secondario" data-tocco="log">Scarica log</button><button class="secondario lieve" data-tocco="menu">Torna al menu</button></div>
    </section>`,
  ];
  return [{ id: 'morte', did: 'Fine partita (seed 82): morte al turno 7 nel Buio, causa e ultimi colpi; HUD con HP 0.', html: A.palco(fmt, 'morte', parti, 'scena-fine') }];
};
void M; void B;
module.exports = { S };
