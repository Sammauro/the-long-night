// Invarianti da verificare a ogni passo (BRIEF 11, M2)
module.exports = function invariants(TLN, G) {
  var S = TLN.engine.state, hex = TLN.engine.hex, errs = [];
  var n = G.deck.length + G.hand.length + G.discard.length + (G.res && G.res.open ? 1 : 0);
  TLN.engine.cards.entries(G).forEach(function (e) { if (e.kind === 'card') n++; });
  if (n !== 16) errs.push('carte totali ' + n);
  if (G.plancia.std.length > 3) errs.push('più di 3 carte standard in Plancia');
  if (G.plancia.fire && !TLN.data.cards.byId[G.plancia.fire.id].fireSlot) errs.push('carta non Fuoco nello slot Fuoco');
  if (G.player.hp > 10) errs.push('HP giocatore ' + G.player.hp);
  var seen = {};
  [G.player].concat(G.enemies).forEach(function (u) {
    if (!u.alive) return;
    if (u.hp > u.hpMax) errs.push(u.id + ' HP oltre il massimo');
    if (!G.grid.inGrid(u.pos)) errs.push(u.id + ' fuori griglia');
    var k = hex.key(u.pos);
    if (seen[k]) errs.push(u.id + ' sovrapposto a ' + seen[k]);
    seen[k] = u.id;
    if (S.blocking(G, u.pos)) errs.push(u.id + ' su un ostacolo');
    if (S.hasTrap(G, u.pos)) errs.push(u.id + ' fermo su una trappola');
  });
  return errs;
};
