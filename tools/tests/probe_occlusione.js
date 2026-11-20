// Sonda: quali controlli della carta aperta sono coperti da altri pannelli? (telefono orizzontale)
module.exports = async function (page, h) {
  var r = await page.evaluate(function () {
    var out = [], q = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };
    var panel = document.getElementById('open-card'), pr = panel.getBoundingClientRect(), er = document.getElementById('enemies').getBoundingClientRect();
    q('#open-card .act-btn, #open-card .amp, #open-card button, #open-card .oc-t').forEach(function (el) {
      var b = el.getBoundingClientRect(), cx = b.left + b.width / 2, cy = b.top + b.height / 2, top = document.elementFromPoint(cx, cy);
      var hitSelf = top && (top === el || el.contains(top));
      out.push({ el: (el.className || el.tagName) + ' "' + (el.innerText || '').slice(0, 24).replace(/\n/g, ' ') + '"', y: Math.round(b.top), h: Math.round(b.height), tappable: !!hitSelf, copertoDa: hitSelf ? null : (top ? (top.closest('#enemies') ? '#enemies' : top.id || top.className) : null) });
    });
    return { openCard: { top: Math.round(pr.top), bottom: Math.round(pr.bottom) }, enemies: { top: Math.round(er.top), bottom: Math.round(er.bottom) }, viewport: [innerWidth, innerHeight], controls: out };
  });
  console.log('OCCLUSIONE', JSON.stringify(r, null, 1));
  await h.shot('sonda_occlusione');
  var en = await page.evaluate(function () { var e = document.getElementById('enemies'); return { scrollH: e.scrollHeight, clientH: e.clientHeight, overflow: getComputedStyle(e).overflowY, righe: e.querySelectorAll('.en, .row, [data-id]').length }; });
  console.log('LISTA NEMICI', JSON.stringify(en));
};
