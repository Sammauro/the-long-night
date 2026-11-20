// Gemello in Node del giocatore: usa l'agente prudente di tools/balance_agent.js per pianificare una run
// (stesso seed, stesso motore) e salva la sequenza di comandi in JSON. Poi tools/tests/ui_replay.js la
// riproduce nel browser con clic/tocchi veri. Uso: node tools/tests/twin_plan.js <seed> [equip] > piano.json
var fs = require('fs'), path = require('path');
var load = require('../load.js');
var seed = +process.argv[2] || 1;
var src = fs.readFileSync(path.join(__dirname, '..', 'balance_agent.js'), 'utf8');
src = src.slice(0, src.indexOf('var res = {}, full = 0'));
src = src.replace("var TLN = load.loadTLN();", "var TLN = load.loadTLN(); globalThis.__TLN = TLN;");
var fn = new Function('require', '__dirname', 'process', src + '\n;return {make: make, E: E};');
var fakeProc = { argv: ['node', 'x', '1', 'r1,r2,r3', process.argv[3] || 'demo'] };
var mod = fn(function (m) { return m === 'path' ? path : load; }, path.join(__dirname, '..'), fakeProc);
var E = mod.E;
var run = E.run.createRun({ seed: seed, start: 'r1', noScript: true });
var A = mod.make(run), log = [];
var orig = E.run.execute;
function fp() { var g = run.game; return g ? { t: g.turn, ph: g.phase, cur: g.res ? g.res.cursor : -1, act: g.res ? !!g.res.active : false, hp: g.player.hp, pt: g.player.pt, pos: g.player.pos.join(), eh: g.enemies.map(function (e) { return e.alive ? e.hp : 0; }).join(), ri: run.roomIndex, rp: run.phase } : { rp: run.phase }; }
E.run.execute = function (r, c) { var res = orig.call(E.run, r, c); if (res.ok) log.push({ c: c, room: run.rooms[run.roomIndex], fp: fp() }); return res; };
var guard = 0;
while (run.phase !== 'END' && guard++ < 3000) { A.make ? 0 : 0; A.step(); if (run.game && run.game.turn > 40) break; }
process.stdout.write(JSON.stringify({ seed: seed, result: run.result, history: run.history.map(function (h) { return { room: h.room, result: h.result, turns: h.turns }; }), cmds: log }));
