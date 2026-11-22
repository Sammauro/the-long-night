(function () {
  var q = new URLSearchParams(location.search);
  var palco = document.getElementById('palco');
  var scene = {};
  [].forEach.call(palco.querySelectorAll('.scena'), function (s) { scene[s.dataset.scena] = s; });
  var ORD = ['A', 'B', 'C'];
  // durata di ogni passo nel giro automatico (ms); 0 = passo che esiste solo come fotogramma fermo
  var DUR = { A: [3200, 0, 5200, 4600], B: [2600, 3800, 1500, 5600], C: [3600, 3600, 5200] };
  var DID = {
    A: ['A riposo. Tutte le minacce sono scritte accanto a chi le porta, tutti i dadi sono sul filo, la mano si legge. La luce è larga.',
      'A metà del gesto (110 ms): hai toccato Z2. La luce si stringe, il suo dado si alza, il filo si tende.',
      'A fuoco su Z2. Sulla stanza restano il numero grande, il percorso e dove sarà Z1; a destra la mano lascia il posto alla frase che spiega il 2. I dadi che giochi prima di lui si accendono. Un tocco nel buio riporta tutto com\'era.',
      'Tieni anche il secondo dado Fuoco: la luce scende sul filo, i due dadi in conflitto sono legati, il nodo si spegne e dice perché.'],
    B: ['Inizio della Risoluzione, luce larga. Puoi ancora muoverti o giocare una carta gratuita.',
      'Annuncio. Niente parte da solo: la luce si stringe su Z1, il suo dado si alza, la mano tace e al suo posto c\'è cosa sta per succedere, con il conto.',
      'Atto (0,9 s, si salta con un tocco). Le figure si ingrandiscono, le cifre nascono dove succede la cosa e vanno ai tuoi numeri nel margine.',
      'Verdetto. Resta scritto finché non vai avanti. La luce si riapre, il dado di Z1 è spento, la fiamma è sul prossimo: il tuo.'],
    C: ['Il tuo dado è attivo. La mano risponde: avanti le carte che questo dado apre, in un blocco quieto le altre con il motivo.',
      'Primo tocco su Diniego Sismico: la riga diventa carta, l\'unica superficie chiara. La luce mostra chi può colpire. Il nodo dice cosa farà il secondo tocco.',
      'Carta aperta, bersaglio e spinta scelti. Prima di confermare vedi l\'esito, e la minaccia che cambia si ingrandisce da sola: Z2 senza Z1 accanto fa 1.'],
  };
  var NOME = { A: 'Selezione', B: 'Dado nemico', C: 'Il mio dado' };
  function parti(str, sep) {
    var m = {};
    (str || '').split('|').forEach(function (x) { var i = x.indexOf(sep); if (i > 0) m[x.slice(0, i)] = x.slice(i + 1); });
    return m;
  }
  function applica(root, n) {
    root.dataset.passo = n;
    [].forEach.call(root.querySelectorAll('[data-s]'), function (el) {
      if (el._b == null) el._b = el.getAttribute('class') || '';
      el.setAttribute('class', (el._b + ' ' + (parti(el.dataset.s, ':')[n] || '')).trim());
    });
    [].forEach.call(root.querySelectorAll('[data-st]'), function (el) {
      if (el._s == null) el._s = el.getAttribute('style') || '';
      el.setAttribute('style', el._s + ';' + (parti(el.dataset.st, '=')[n] || parti(el.dataset.st, '=')['1'] || ''));
    });
  }
  var cur = 'A', passo = 1, auto = true, timer = null;
  function mostra(s, n) {
    cur = s; passo = n;
    ORD.forEach(function (k) {
      if (!scene[k].parentNode) return;
      scene[k].classList.toggle('in-scena', k === s);
      var m = scene[k].querySelector('.mappa'); if (k === s) m.id = 'mappa'; else m.removeAttribute('id');
    });
    applica(scene[s], n);
    var d = document.getElementById('didascalia'); if (d) d.textContent = DID[s][n - 1];
    var c = document.getElementById('conta'); if (c) c.textContent = NOME[s] + ' · ' + n + ' di ' + DUR[s].length;
    [].forEach.call(document.querySelectorAll('[data-vai]'), function (b) { b.classList.toggle('qui', b.dataset.vai === s); });
  }
  function prossimo(dir) {
    var n = passo, s = cur, tot = DUR[s].length;
    do {
      n += dir;
      if (n > tot) { s = ORD[(ORD.indexOf(s) + 1) % ORD.length]; n = 1; tot = DUR[s].length; }
      if (n < 1) { s = ORD[(ORD.indexOf(s) + ORD.length - 1) % ORD.length]; tot = DUR[s].length; n = tot; }
    } while (DUR[s][n - 1] === 0);
    mostra(s, n);
  }
  function giro() { clearTimeout(timer); if (!auto) return; timer = setTimeout(function () { prossimo(1); giro(); }, DUR[cur][passo - 1] || 1500); }
  function ferma() { auto = false; clearTimeout(timer); var b = document.getElementById('auto'); if (b) b.textContent = 'Riparti'; }

  if (q.get('fermo')) { // fotogramma fermo: ?scena=B&passo=3&fermo=1 (serve a schermate e misura)
    document.body.classList.add('solo'); palco.classList.add('fermo');
    var s0 = q.get('scena') || 'A';
    ORD.forEach(function (k) { if (k !== s0) scene[k].parentNode.removeChild(scene[k]); });
    mostra(s0, +(q.get('passo') || 1));
    return;
  }
  mostra(q.get('scena') || 'A', +(q.get('passo') || 1));
  palco.addEventListener('click', function () { ferma(); prossimo(1); });
  document.getElementById('avanti').addEventListener('click', function () { ferma(); prossimo(1); });
  document.getElementById('indietro').addEventListener('click', function () { ferma(); prossimo(-1); });
  document.getElementById('auto').addEventListener('click', function () { if (auto) ferma(); else { auto = true; this.textContent = 'Ferma'; giro(); } });
  [].forEach.call(document.querySelectorAll('[data-vai]'), function (b) { b.addEventListener('click', function () { mostra(b.dataset.vai, 1); giro(); }); });
  giro();
})();
