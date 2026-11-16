// THE LONG NIGHT — avvio dell'applicazione (scheletro M0)
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  TLN.ui = TLN.ui || {};
  TLN.ui.boot = function () {
    var el = document.getElementById('boot');
    if (el) el.textContent = 'THE LONG NIGHT — scheletro caricato (' + TLN.manifest.all().length + ' script).';
  };
})(typeof window !== 'undefined' ? window : globalThis);
