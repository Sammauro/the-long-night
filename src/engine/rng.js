// THE LONG NIGHT — generatore casuale con seed (BRIEF 2)
// Tutta la casualità del motore passa da qui. Nessun Math.random() in engine/.
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  TLN.engine = TLN.engine || {};

  // mulberry32: 32 bit di stato, deterministico e serializzabile.
  function createRng(seed) {
    var s = (seed >>> 0) || 1;
    var rng = {
      seed: seed >>> 0,
      next: function () {
        s = (s + 0x6D2B79F5) >>> 0;
        var t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      },
      int: function (n) { return Math.floor(rng.next() * n); },
      pick: function (arr) { return arr.length ? arr[rng.int(arr.length)] : undefined; },
      shuffle: function (arr) {
        for (var i = arr.length - 1; i > 0; i--) {
          var j = rng.int(i + 1);
          var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
        }
        return arr;
      },
      getState: function () { return s; },
      setState: function (v) { s = v >>> 0; }
    };
    return rng;
  }

  // Seed nuovo per una partita: è l'unico punto fuori dal motore puro,
  // chiamato da UI o test, mai dalla logica di gioco.
  function freshSeed() {
    return (Date.now() ^ ((typeof performance !== 'undefined' ? performance.now() : 0) * 1000)) >>> 0;
  }

  TLN.engine.createRng = createRng;
  TLN.engine.freshSeed = freshSeed;
})(typeof window !== 'undefined' ? window : globalThis);
