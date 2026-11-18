// THE LONG NIGHT — suggerimenti contestuali (BRIEF 9.2). Ognuno compare una volta sola.
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  TLN.data = TLN.data || {};

  TLN.data.hints = [
    { id: 'firstWhisper',   text: 'Il Sussurratore non tocca i tuoi HP: consuma i PT. A 0 PT è Follia. Scartare il dado Terrore ti ridà 1 PT.' },
    { id: 'firstChoir',     text: 'Più Sussurratori, più forte il Coro. Abbattine uno per spezzarlo.' },
    { id: 'terrorCard',     text: 'Profondità Mente colpisce ovunque. Distorsione può trascinare un nemico su una trappola.' },
    { id: 'lightStolen',    text: 'La Falena mangia la tua Luce. Se non ne hai, morde.' },
    { id: 'firstSeal',      text: 'Il Sigillo occupa uno slot come una carta in Cooldown e se ne va da solo dopo un turno.' },
    { id: 'armorAbsorb',    text: 'La Corazza del Custode torna a 2 ogni turno. Danni Diretti e Vulnerabilità la superano.' },
    { id: 'lastVeglia',     text: 'La candela sta finendo. Al Buio perderai 1 PT a ogni turno.' },
    { id: 'slotCovered',    text: 'Dado bloccato: paga Luce oppure scartalo e aspetta. Gli Eco di rotazione accorciano i Cooldown lunghi.' },
    { id: 'planciaFull',    text: 'Plancia piena: questo turno puoi giocare solo carte senza Cooldown.' }
  ];
})(typeof window !== 'undefined' ? window : globalThis);
