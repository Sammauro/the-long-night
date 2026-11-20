#!/usr/bin/env node
// THE LONG NIGHT — freno a soglia per il team di agenti.
// Usi:
//   node .claude/tools/budget_guard.js            → stampa lo stato (per il regista); exit 0 = si può continuare, 3 = fermarsi
//   come hook PreToolUse sull'avvio di subagenti  → exit 2 blocca l'avvio e spiega perché (stderr)
const fs = require('fs');
const path = require('path');

const dir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const read = f => { try { return JSON.parse(fs.readFileSync(path.join(dir, '.claude', f), 'utf8')); } catch (e) { return null; } };
const budget = Object.assign({ max_five_hour: 85, max_seven_day: 60, max_week_points_this_session: 15, stale_minutes: 30 }, read('budget.json') || {});
const u = read('usage.json');
const asHook = !process.stdin.isTTY && process.argv.indexOf('--status') < 0;

function verdict() {
  if (!u) return { ok: true, why: 'nessun dato di consumo ancora (la statusline lo scrive dopo la prima risposta)' };
  const age = (Date.now() - Date.parse(u.updated_at)) / 60000;
  const used = u.seven_day != null && u.seven_day_at_start != null ? u.seven_day - u.seven_day_at_start : null;
  const r = [];
  if (u.five_hour != null && u.five_hour >= budget.max_five_hour) r.push(`finestra 5 ore al ${Math.round(u.five_hour)}% (soglia ${budget.max_five_hour}%)`);
  if (u.seven_day != null && u.seven_day >= budget.max_seven_day) r.push(`limite settimanale al ${Math.round(u.seven_day)}% (soglia ${budget.max_seven_day}%)`);
  if (used != null && used >= budget.max_week_points_this_session) r.push(`questa sessione ha consumato ${Math.round(used)} punti della settimana (soglia ${budget.max_week_points_this_session})`);
  const status = `5h ${u.five_hour}% · settimana ${u.seven_day}% · sessione +${used == null ? '?' : Math.round(used)} punti · dati di ${Math.round(age)} min fa`;
  if (r.length) return { ok: false, why: r.join('; '), status };
  return { ok: true, why: age > budget.stale_minutes ? 'dati vecchi: controlla che la statusline sia attiva' : 'sotto soglia', status };
}

const v = verdict();
if (asHook) {
  // l'input dell'hook non serve: si decide solo sui consumi
  process.stdin.resume(); process.stdin.on('data', () => {});
  process.stdin.on('end', () => {
    if (!v.ok) {
      process.stderr.write(`SOGLIA DI CONSUMO RAGGIUNTA: ${v.why}. Non avviare altri agenti: scrivi il report finale in team/reports/ (vedi TEAM.md, "Fine lavoro") e fermati.`);
      process.exit(2);
    }
    process.exit(0);
  });
} else {
  console.log((v.ok ? 'OK — ' : 'STOP — ') + v.why + (v.status ? '\n' + v.status : ''));
  process.exit(v.ok ? 0 : 3);
}
