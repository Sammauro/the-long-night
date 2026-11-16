// Carica i file del motore (gruppi data, engine, balancing di src/manifest.js) in un contesto Node.
// Nessun pacchetto: solo fs, path, vm.
var fs = require('fs');
var path = require('path');
var vm = require('vm');

var ROOT = path.join(__dirname, '..');

function loadTLN(groups) {
  var ctx = { console: console, Math: Math, Date: Date, JSON: JSON };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'src/manifest.js'), 'utf8'), ctx, { filename: 'manifest.js' });
  var m = ctx.TLN.manifest;
  (groups || ['data', 'engine', 'balancing']).forEach(function (g) {
    m[g].forEach(function (f) {
      vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
    });
  });
  return ctx.TLN;
}

module.exports = { loadTLN: loadTLN, ROOT: ROOT };
