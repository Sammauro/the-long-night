// THE LONG NIGHT — nemici (BRIEF 5.4)
// Ogni azione è descritta da campi che ai_opponent.js interpreta:
//   move: 'approach' (verso il giocatore) | 'fly' (Volo adiacente) | null
//   retreat: N passi di allontanamento · dmg: danni se a portata · shield: Scudi (Turno Attuale)
//   hordeBonus · lifesteal · ptLoss · choirBonus · stealLight · dmgNoLight · push · seal
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  TLN.data = TLN.data || {};

  TLN.data.enemies = {
    zombie: {
      id: 'zombie', name: 'Zombie', letter: 'Z', hp: 6, mov: 2, range: 1,
      d4: { 1: 'orda', 2: 'orda', 3: 'morso', 4: 'incassare' },
      actions: {
        orda:      { name: 'Attacco Orda', icon: '✋', move: 'approach', dmg: 1, hordeBonus: 1, text: 'Muove. Se adiacente: 1 Danno, +1 per ogni altro Zombie adiacente a te.' },
        morso:     { name: 'Morso Rigenerante', icon: '🦷', move: 'approach', dmg: 2, lifesteal: true, text: 'Muove. Se adiacente: 2 Danni; si cura di 1 per danno agli HP.' },
        incassare: { name: 'Incassare', icon: '🛡', move: null, shield: 2, text: 'Fermo. +2 Scudi.' }
      }
    },
    sussurratore: {
      id: 'sussurratore', name: 'Sussurratore', letter: 'S', hp: 3, mov: 2, range: 3,
      d4: { 1: 'sussurro', 2: 'sussurro', 3: 'coro', 4: 'dissolvenza' },
      actions: {
        sussurro:    { name: 'Sussurro', icon: '👁', move: 'approach', ptLoss: 1, text: 'Si avvicina fino a gittata 3. Se in gittata: perdi 1 PT.' },
        coro:        { name: 'Coro', icon: '🎶', move: 'approach', ptLoss: 1, choirBonus: 1, text: 'Come Sussurro, −1 PT in più per ogni altro Sussurratore vivo.' },
        dissolvenza: { name: 'Dissolvenza', icon: '🌫', move: null, retreat: 2, shield: 1, text: 'Si allontana di 2. +1 Scudo.' }
      }
    },
    falena: {
      id: 'falena', name: 'Falena Cinerea', letter: 'F', hp: 3, mov: 3, range: 1, fly: true,
      d4: { 1: 'divorare', 2: 'divorare', 3: 'frenesia', 4: 'volteggiare' },
      actions: {
        divorare:    { name: 'Divorare', icon: '🕯', move: 'fly', stealLight: 1, dmg: 0, dmgNoLight: 1, text: 'Vola adiacente. Ruba 1 Luce; se non ne hai, 1 Danno.' },
        frenesia:    { name: 'Frenesia', icon: '🦋', move: 'fly', stealLight: 1, dmg: 1, dmgNoLight: 2, text: 'Vola adiacente. Ruba 1 Luce e 1 Danno; se non hai Luce, 2 Danni.' },
        volteggiare: { name: 'Volteggiare', icon: '〰', move: null, retreat: 3, text: 'Si allontana di 3. Non attacca.' }
      }
    },
    custode: {
      id: 'custode', name: 'Custode della Soglia', letter: 'C', hp: 14, mov: 1, range: 1, armor: 2,
      d4: { 1: 'maglio', 2: 'maglio', 3: 'sigillo', 4: 'baluardo' },
      actions: {
        maglio:   { name: 'Maglio', icon: '🔨', move: 'approach', dmg: 3, push: 1, text: 'Muove 1. Se adiacente: 3 Danni e ti spinge di 1 (Collisione).' },
        sigillo:  { name: 'Sigillo', icon: '⛬', move: null, seal: 1, text: 'Mette un Sigillo (CD 1) sulla tua Plancia. Se è piena: perdi 1 Luce.' },
        baluardo: { name: 'Baluardo', icon: '🛡', move: null, shield: 2, text: 'Fermo. +2 Scudi.' }
      }
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
