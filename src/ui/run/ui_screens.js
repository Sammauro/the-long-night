// THE LONG NIGHT — schermata iniziale, finale e sovrapposizioni della run (BRIEF 5.7, 10)
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  var UI = TLN.ui = TLN.ui || {};
  var u = UI.util;

  var menuOn = false, shown = null;

  function showMenu() {
    menuOn = true; shown = null;
    u.$('game').classList.remove('on');
    var box = u.$('screens'); box.innerHTML = ''; box.classList.add('on');
    var q = new URLSearchParams(location.search);
    var w = u.h('div', 'scr menu');
    w.innerHTML = '<h1 class="title">THE LONG NIGHT</h1><p class="sub">Una stanza per svegliarsi, tre per sopravvivere. La candela non aspetta.</p>';
    w.appendChild(UI.controls.btn('Inizia — Il Risveglio <small>con il tutorial</small>', 'main', function () { start('r0'); }));
    w.appendChild(UI.controls.btn('Salta il tutorial — La Cripta', '', function () { start('r1'); }));
    w.appendChild(u.h('p', 'note', 'Slot: preset <b>' + (q.get('equip') === 'rev11' ? 'rev11' : TLN.data.runConfig.equipPreset) + '</b> (con <code>?equip=rev11</code> nell\'indirizzo si usa il preset rev11).<br>Clic o tocco per agire · spazio = continua · esc = annulla.'));
    box.appendChild(w);
  }
  function start(room) {
    menuOn = false;
    var box = u.$('screens'); box.innerHTML = ''; box.classList.remove('on');
    UI.startRun(room);
  }

  function download(name, text) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function final(box) {
    var run = UI.st.run, col = UI.collector;
    var T = { victory: 'L\'alba', death: 'Morte', madness: 'Follia' };
    var w = u.h('div', 'scr final ' + run.result);
    var rows = run.history.map(function (h) {
      return '<tr><td>' + u.esc(h.name) + '</td><td>' + (h.result === 'win' ? 'vinta' : T[h.result]) + '</td><td>' + h.turns + (h.veglia ? '/' + h.veglia : '') + '</td><td>' + (h.rests.join(', ') || '—') + '</td></tr>';
    }).join('');
    w.innerHTML = '<h1>' + T[run.result] + '</h1><p class="sub">' + (run.result === 'victory' ? 'Hai attraversato tutte le stanze.' : 'La notte ti ha preso in ' + u.esc(run.history[run.history.length - 1].name) + '.') + '</p>' +
      '<table class="hist"><tr><th>Stanza</th><th>Esito</th><th>Turni</th><th>Soste</th></tr>' + rows + '</table>' +
      '<p class="note">HP ' + run.carry.hp + ' · PT ' + run.carry.pt + ' · seed ' + run.seed + '</p>';
    var r = u.h('div', 'row');
    r.appendChild(UI.controls.btn('Copia riepilogo', '', function () { UI.log.copy(col.summaryText()); UI.toast('Riepilogo copiato'); }));
    r.appendChild(UI.controls.btn('Scarica log', '', function () { download('tln_run_' + run.seed + '.json', col.json()); }));
    r.appendChild(UI.controls.btn('Torna al menu', 'main', showMenu));
    w.appendChild(r);
    box.appendChild(w);
  }

  function render() {
    if (menuOn) return;
    var run = UI.st.run, box = u.$('screens'); if (!run || !box) return;
    var want = run.phase === 'SOGLIA' ? 'soglia' : run.phase === 'END' ? 'end' : null;
    if (want === shown && want !== 'soglia') return;
    shown = want;
    box.innerHTML = '';
    box.classList.toggle('on', !!want);
    if (want === 'soglia') UI.soglia.render(box);
    if (want === 'end') final(box);
  }

  UI.screens = { showMenu: showMenu, render: render, start: start };
})(typeof window !== 'undefined' ? window : globalThis);
