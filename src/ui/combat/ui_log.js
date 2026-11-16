// THE LONG NIGHT — registro testuale degli eventi, copiabile (BRIEF 7)
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  var UI = TLN.ui = TLN.ui || {};
  var u = UI.util;

  var lines = [];
  var RES = { hp: 'HP', pt: 'PT', pm: 'PM', luce: 'Luce', jump: 'PM Salto' };
  function fmt(ev) {
    var d = ev.data, n = u.unitName;
    switch (ev.type) {
      case 'ROOM_START': return '══ ' + d.name + (d.veglia ? ' (Veglia ' + d.veglia + ')' : '') + ' ══';
      case 'TURN_START': return '— Turno ' + d.turn + ' —';
      case 'DICE_ROLLED': return 'Sequenza: ' + d.seq.map(function (x) { return x.kind === 'ai' ? x.owner + ':' + x.value : u.ICON[x.kind] + x.value; }).join(' · ');
      case 'SELECTION_CONFIRMED': return 'Selezione: tenuti ' + d.kept.map(function (x) { return u.ICON[x.kind] + x.value; }).join(' ') + (d.cost ? ' · pagati ' + d.cost + ' Luce' : '') + (d.discarded.length ? ' · scartati ' + d.discarded.map(function (x) { return u.ICON[x.kind] + x.value; }).join(' ') : '');
      case 'ECO': return 'Eco ' + TLN.data.cards.byId[d.id].name + ': ' + d.effects.join(', ');
      case 'CARD_OPEN': return 'Apri ' + TLN.data.cards.byId[d.id].name;
      case 'CARD_ACTION': return '  Azione ' + (d.action + 1) + (d.target ? ' su ' + n(d.target) : '') + (d.payer ? ' (' + d.n + u.ICON[d.payer] + ')' : '');
      case 'CARD_CLOSE': return 'Chiudi ' + TLN.data.cards.byId[d.id].name + (d.toPlancia ? ' → Plancia' : '');
      case 'MANEUVER': return { tactical: 'Movimento Tattico', ranged: 'Colpo a Distanza su ' + n(d.target), convert: 'Conversione Oscura → ' + u.ICON[d.to] }[d.kind];
      case 'MOVE': return d.unit === 'P' && d.how !== 'push' ? null : (d.how === 'push' ? n(d.unit) + ' spinto in R' + d.to[0] + 'E' + d.to[1] : null);
      case 'AI_ACTION': return n(d.enemy) + ': ' + d.name + ' (☠' + d.value + ')';
      case 'DAMAGE': return n(d.target) + ' subisce ' + d.hpLoss + (d.absorbed ? ' (+' + d.absorbed + ' assorbiti)' : '') + (d.direct ? ' diretti' : d.dtype === 'fire' ? ' Fuoco' : '') + (d.cause ? ' · ' + d.cause : '');
      case 'DIED': return '✝ ' + n(d.unit) + ' cade';
      case 'HEAL': return n(d.unit) + ' si cura di ' + d.amount;
      case 'TRAP': return 'Trappola in R' + d.at[0] + 'E' + d.at[1];
      case 'COLLISION': return 'Collisione di ' + n(d.target);
      case 'RESOURCE': return d.res === 'hp' ? null : (RES[d.res] + ' ' + (d.delta > 0 ? '+' : '') + d.delta + ' → ' + d.value + (d.cause ? ' · ' + d.cause : ''));
      case 'STATUS': return n(d.unit) + ': +' + d.delta + ' ' + u.STATUS_NAME[d.status];
      case 'DIE_OFF': return 'Dado di ' + n(d.enemy) + ' spento';
      case 'STUN_SKIP': return n(d.enemy) + ' è stordito e salta';
      case 'SEAL': return 'Sigillo sulla Plancia';
      case 'BUIO': return 'Buio: la candela è spenta';
      case 'ROOM_WON': return '★ Stanza vinta al turno ' + d.turn + (d.inVeglia ? ' (entro la Veglia)' : '');
      case 'DEFEAT': return '✝ Sconfitta: ' + (d.result === 'death' ? 'Morte' : 'Follia');
      case 'SOGLIA_CHOSEN': return 'Soglia: ' + d.rests.join(', ');
      default: return null;
    }
  }
  function onEvent(ev) {
    var s = fmt(ev); if (!s) return;
    lines.push(s);
    var box = u.$('log-lines');
    if (box) { var l = u.h('div', 'll', u.esc(s)); box.appendChild(l); box.scrollTop = box.scrollHeight; }
  }
  function init() {
    var tg = u.$('log-toggle'), cp = u.$('log-copy');
    if (tg) tg.onclick = function () { u.$('log').classList.toggle('open'); };
    if (cp) cp.onclick = function () { copy(lines.join('\n')); UI.toast('Registro copiato'); };
  }
  function fallback(text) {
    var ta = u.h('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) { /* niente appunti: il testo resta nel registro */ }
    ta.remove();
  }
  function copy(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).catch(function () { fallback(text); });
      else fallback(text);
    } catch (e) { fallback(text); }
  }
  function clear() { lines = []; var b = u.$('log-lines'); if (b) b.innerHTML = ''; }

  UI.log = { init: init, onEvent: onEvent, text: function () { return lines.join('\n'); }, copy: copy, clear: clear };
})(typeof window !== 'undefined' ? window : globalThis);
