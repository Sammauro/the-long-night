// Componenti dell'interfaccia di combattimento. Ogni funzione restituisce HTML; il CSS di ciascuno è in CSS.
// Indipendenti dal layout: la posizione la decide layout_A.js (o un layout B) con uno stile in linea.
'use strict';
const { ico, sigillo, TIPO_ICO, NOME_TIPO, SCARTO, AZ_ICO, AZ_BREVE } = require('./base');
const K = require('./carte');

const pos = (r) => `left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px`;
const tipoDi = (k) => ({ vigore: 'forza', fuoco: 'fuoco', terrore: 'presagio' }[k]);

// ── 1. Riga di orientamento: turno, fase, cosa fare adesso, Veglia ───────────────────────
function orientamento(r, o) {
  const v = o.veglia, buio = o.buio;
  let candela = '';
  for (let i = 0; i < v.max; i++) candela += `<rect x="${2 + i * 11}" y="5" width="10" height="7" class="${i < v.turno - 1 || buio ? 'arsa' : i === v.turno - 1 ? 'ora' : 'cera'}"/>`;
  const fiamma = buio ? '' : `<path d="M${v.max * 11 + 6} 2c2 2 3 4 1 7-1 1-3 1-3-1 0-2 2-3 2-6z" class="fiamma"/>`;
  return `<header class="orienta ${o.tono || ''}" style="${pos(r)}" data-pannello="orientamento">
    <span class="turno">Turno ${o.turno}</span><span class="fase">${o.fase}</span>
    <span class="istr">${o.istr}</span>
    <span class="veglia ${buio ? 'buio' : ''}"><svg class="candela" width="${v.max * 11 + 12}" height="16">${candela}${fiamma}</svg>
      ${buio ? `<span class="v-buio">Buio: −1 PT a ogni turno</span>` : `<span>Veglia ${v.turno}/${v.max}</span><span class="posta">${o.posta || 'entro la Veglia: 2 Soste'}</span>`}</span>
  </header>`;
}

// ── 2. Colonna sinistra: risorse, stati del giocatore, Plancia ───────────────────────────
function delta(d) { return d ? `<span class="delta ${d > 0 ? 'piu' : 'meno'}">${d > 0 ? '+' : '−'}${Math.abs(d)}</span>` : ''; }
function statiGiocatore(s) {
  const out = [], tot = (k) => (s[k] ? s[k][0] + s[k][1] : 0);
  if (s.shield) {
    if (s.shield[0]) out.push(`<span class="st scudo">${ico('scudo')}Scudo ${s.shield[0]}</span>`);
    if (s.shield[1]) out.push(`<span class="st scudo">${ico('scudo')}Scudo ${s.shield[1]} <i>scade</i></span>`);
  }
  if (tot('counter')) out.push(`<span class="st contra">${ico('contra')}Contrattacco</span>`);
  if (tot('vuln')) out.push(`<span class="st vuln">${ico('vuln')}Vulnerabile ×2</span>`);
  if (tot('vulnFire')) out.push(`<span class="st vuln">${ico('vuln')}Vuln. Fuoco</span>`);
  if (tot('stun')) out.push(`<span class="st stun">${ico('stordito')}Stordito</span>`);
  return out.join('');
}
// nicchie: { slot, die, occupante:{value}, coperto:{nome, costo}, evid }
function colonnaSx(r, o) {
  const p = o.giocatore, d = o.delta || {};
  const nic = o.nicchie.map((n) => `<div class="nicchia k-${n.die} ${n.occupante ? 'piena' : ''} ${n.coperto ? 'coperta' : ''} ${n.evid ? 'evid' : ''} ${n.conflitto ? 'conflitto' : ''}" data-tocco="slot ${n.slot}">
      <span class="n">${n.slot}</span>${ico(TIPO_ICO[n.die], 'tipo')}
      ${n.occupante ? `<b>${n.occupante.value}</b>` : ''}${n.coperto ? `<span class="costo-l">${n.coperto.costo} Luce</span>` : ''}</div>`).join('');
  const voci = (o.voci || []).map((v) => `<li class="${v.evid ? 'evid' : ''} ${v.esito || ''}"><span class="vn">${v.slot ? `<b>${v.slot}</b> ` : ''}${v.nome}</span>${v.nota ? `<span class="vt">${v.nota}</span>` : ''}</li>`).join('');
  return `<aside class="colonna-sx" style="${pos(r)}" data-pannello="risorse">
    <div class="ris hp ${p.hp <= 3 ? 'pericolo' : ''}" data-tocco="ris hp">${ico('hp')}<span class="l">HP</span><b>${p.hp}<span class="max">/${p.hpMax}</span></b>${delta(d.hp)}</div>
    <div class="ris pt ${p.pt <= 2 ? 'pericolo' : ''}" data-tocco="ris pt">${ico('pt')}<span class="l">PT</span><b>${p.pt}</b>${delta(d.pt)}</div>
    <div class="ris pm" data-tocco="ris pm">${ico('pm')}<span class="l">PM</span><b>${p.pm}</b>${delta(d.pm)}<span class="salto">${ico('salto')}<span class="l">Salto</span><b>${p.salto}</b></span></div>
    <div class="ris luce" data-tocco="ris luce">${ico('luce')}<span class="l">Luce</span><b>${o.luce || p.luce}</b>${delta(d.luce)}</div>
    <div class="stati-g">${statiGiocatore(p.stati) || ''}</div>
    <div class="plancia"><span class="tit">Plancia</span><div class="nicchie">${nic}</div>${voci ? `<ul class="voci">${voci}</ul>` : ''}</div>
  </aside>`;
}

// ── 3. Cartiglio: la voce del turno sopra la mappa (previsione, esito, guida, passi) ────
function cartiglio(r, o) {
  const btn = o.bottone ? `<button class="secondario" data-tocco="${o.bottone.tocco}">${o.bottone.t}${o.bottone.sub ? `<small>${o.bottone.sub}</small>` : ''}</button>` : '';
  const btn2 = o.bottone2 ? `<button class="secondario lieve" data-tocco="${o.bottone2.tocco}">${o.bottone2.t}</button>` : '';
  return `<section class="cartiglio ${o.tipo || ''}" style="${pos(r)}" data-pannello="cartiglio">
    ${o.marca ? `<span class="marca">${o.marca}</span>` : ''}<div class="testo">${o.html}</div>${btn}${btn2}</section>`;
}

// ── 4. Mano: carte in ombra, forma breve, Eco sempre a destra ───────────────────────────
function striscia(c, st) {
  st = st || {};
  const righe = K.righe(c), pas = K.passive(c);
  const chip = st.nuova ? '<span class="chip nuova">nuova</span>' : '';
  const stato = st.apri ? `<span class="chip apri">apri</span>` : st.motivo ? `<span class="chip no">${st.motivo}</span>` : '';
  const full = st.intero;
  const corpo = full
    ? K.testoIntero(c).map((t) => `<p class="azione intera">${K.emoji(t)}</p>`).join('')
    : righe.map((x) => `<p class="azione">${K.costoHTML(x.costo)} ${K.emoji(x.testo)}</p>`).join('') + (pas.length ? `<p class="passiva">${pas.join('; ')}</p>` : '');
  return `<article class="striscia f-${c.family} ${st.apri ? 'apribile' : ''} ${st.motivo ? 'chiusa' : ''} ${st.scarta ? 'scarta' : ''} ${st.sel ? 'sel' : ''}" data-tocco="carta ${c.nome}">
    <div class="corpo"><h3><span class="nome">${c.nome}</span>${chip}${stato}<span class="cd">CD ${c.cd}</span></h3>${corpo}</div>
    <div class="matrice">${ico('eco')}<span class="eco-t">Eco</span><span class="eco">${c.eco.replace(' · ', '<br>')}</span>${st.scarta ? '<span class="scelto">scarti</span>' : ''}</div>
  </article>`;
}
function mano(r, carte, stati, cls) {
  return `<section class="mano ${cls || ''}" style="${pos(r)}" data-pannello="mano">${carte.map((c, i) => striscia(c, stati[i])).join('')}</section>`;
}

// ── 5. Rosario: la Sequenza Vincolata sulla pergamena ──────────────────────────────────
// dadi: [{ owner, kind, value, uid, su, giu, scelto:'su'|'giu', stato:'tenuto'|'scartato'|'conflitto'|'risolto'|'attivo'|'spento', reach, azione, segni }]
function dado(d) {
  if (d.owner === 'P') {
    const su = d.su ? `<span class="t-su ${d.scelto === 'su' ? 'cerchio' : 'tenue'} ${d.suCls || ''}">${d.su}</span>` : '<span class="t-su"></span>';
    const giu = d.giu ? `<span class="t-giu ${d.scelto === 'giu' ? 'cerchio' : 'tenue'} ${d.giuCls || ''}">${d.giu}</span>` : '<span class="t-giu"></span>';
    return `<div class="perla mio k-${d.kind} ${d.stato || ''}" data-tocco="dado ${d.uid}" role="button" ${d.stato === 'tenuto' || d.stato === 'scartato' ? `aria-pressed="${d.stato === 'tenuto'}"` : ''}>
      ${su}<span class="osso"><b>${d.value}</b>${ico(tipoDi(d.kind), 'angolo')}${d.stato === 'scartato' ? '<svg class="ics" viewBox="0 0 10 10" preserveAspectRatio="none"><path d="M1 1L9 9M9 1L1 9"/></svg>' : ''}</span>${giu}</div>`;
  }
  return `<div class="perla nem ${d.reach ? 'colpisce' : ''} ${d.stato || ''}" data-tocco="dado ${d.owner}">
    <span class="t-su">${sigillo(d.owner, 22, d.reach ? '' : 'grigio')}</span>
    <span class="cera"><b>${d.value}</b>${ico(AZ_ICO[d.azione] || 'artigli', 'angolo')}</span>
    <span class="t-giu ${d.reach ? 'rosso' : 'tenue'}">${d.giu}</span></div>`;
}
function rosario(r, o) {
  const perle = o.dadi.map((d, i) => (o.cursore === i ? '<span class="ago" aria-label="finestra libera"></span>' : '') + dado(d)).join('');
  return `<section class="rosario ${o.cls || ''}" style="${pos(r)}" data-pannello="sequenza">
    <div class="capo"><b>${o.turno}</b><span>turno</span></div><div class="filo"></div><div class="perle">${perle}</div>
    <div class="fine">${o.fine}</div></section>`;
}
function primario(o) {
  if (o.spento) return `<div class="motivo" role="status">${o.motivo}</div><button class="primario spento" data-tocco="primario" data-primario aria-disabled="true">${o.t}<small>${o.sub || 'non disponibile'}</small></button>`;
  return `${o.sopra ? `<div class="avviso">${o.sopra}</div>` : ''}<button class="primario" data-tocco="primario" data-primario>${o.t}${o.sub ? `<small>${o.sub}</small>` : ''}</button>`;
}

// ── 6. Carta aperta e scheda di dettaglio (stessa colonna della mano) ─────────────────
function cartaAperta(r, o) {
  return `<section class="aperta" style="${pos(r)}" data-pannello="carta aperta">
    <header><h3>${o.nome}</h3><span class="cd">CD ${o.cd}</span></header>
    <p class="col-dado">Aperta col ${ico('forza')}${o.dado}: resta <b>${o.resta} ${ico('forza')}</b> ${'<i class="tacca"></i>'.repeat(o.resta)}${'<i class="tacca vuota"></i>'.repeat(o.dado - o.resta)}</p>
    ${o.azioni.map((a) => `<div class="az-a ${a.cls}" data-tocco="azione ${a.i + 1}"><span class="num">${a.i + 1}</span><div><p>${K.costoHTML(a.costo)} ${a.testo}</p>${a.nota ? `<p class="nota">${a.nota}</p>` : ''}</div></div>`).join('')}
    ${o.dopo || ''}
    <footer>${o.piede}</footer></section>`;
}
function scheda(r, o) {
  return `<section class="scheda" style="${pos(r)}" data-pannello="dettaglio" role="dialog">
    <button class="chiudi" data-tocco="chiudi dettaglio" aria-label="Chiudi">${ico('chiudi')}</button>${o.html}</section>`;
}

module.exports = { orientamento, colonnaSx, cartiglio, mano, striscia, rosario, dado, primario, cartaAperta, scheda, statiGiocatore, pos, tipoDi, SCARTO, NOME_TIPO, AZ_BREVE };
