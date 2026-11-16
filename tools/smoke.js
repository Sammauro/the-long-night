// THE LONG NIGHT — test del motore senza grafica (BRIEF 11)
// Uso: node tools/smoke.js [data|engine|cases|tutorial|random] [partite per stanza]
var loadTLN = require('./load').loadTLN;

var failures = 0, passes = 0;
function check(cond, msg) {
  if (cond) { passes++; } else { failures++; console.log('  ✗ ' + msg); }
}
function section(name) { console.log('— ' + name); }

var TLN = loadTLN();
var suites = {
  data: require('./tests/data_tests'),
  cases: require('./tests/case_tests'),
  tutorial: require('./tests/tutorial_tests'),
  preview: require('./tests/preview_tests'),
  log: require('./tests/log_tests'),
  random: require('./tests/random_tests'),
};
var only = process.argv[2];
var opts = { games: +(process.argv[3] || 300) };
Object.keys(suites).forEach(function (k) {
  if (only && only !== k) return;
  suites[k](TLN, check, section, opts);
});
console.log('\n' + passes + ' controlli superati, ' + failures + ' falliti.');
process.exit(failures ? 1 : 0);
