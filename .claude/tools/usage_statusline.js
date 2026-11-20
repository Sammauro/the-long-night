#!/usr/bin/env node
// THE LONG NIGHT — statusline di Claude Code che salva i consumi del piano in .claude/usage.json
// Claude Code passa su stdin un JSON con rate_limits.five_hour / seven_day (piani Pro e Max).
// Il file viene letto dal regista e da budget_guard.js per fermarsi alle soglie di .claude/budget.json.
const fs = require('fs');
const path = require('path');

let raw = '';
process.stdin.on('data', d => (raw += d));
process.stdin.on('end', () => {
  let j = {};
  try { j = JSON.parse(raw || '{}'); } catch (e) { /* input non valido: mostro solo il modello */ }
  const dir = (j.workspace && j.workspace.project_dir) || process.cwd();
  const file = path.join(dir, '.claude', 'usage.json');
  const rl = j.rate_limits || {};
  const five = rl.five_hour && rl.five_hour.used_percentage;
  const week = rl.seven_day && rl.seven_day.used_percentage;

  let prev = {};
  try { prev = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { /* primo avvio */ }
  // Il punto di partenza della settimana si fissa alla prima lettura di ogni sessione
  const sid = j.session_id || 'nosession';
  const start = prev.session_id === sid && prev.seven_day_at_start != null ? prev.seven_day_at_start : week;

  if (five != null || week != null) {
    const out = {
      updated_at: new Date().toISOString(),
      session_id: sid,
      five_hour: five != null ? five : null,
      five_hour_resets_at: rl.five_hour ? rl.five_hour.resets_at : null,
      seven_day: week != null ? week : null,
      seven_day_resets_at: rl.seven_day ? rl.seven_day.resets_at : null,
      seven_day_at_start: start != null ? start : null,
      session_cost_usd: j.cost ? j.cost.total_cost_usd : null
    };
    try { fs.writeFileSync(file, JSON.stringify(out, null, 2)); } catch (e) { /* cartella non scrivibile */ }
  }

  const model = (j.model && j.model.display_name) || '';
  const pct = v => (v == null ? '–' : Math.round(v) + '%');
  process.stdout.write(`[${model}] 5h ${pct(five)} · settimana ${pct(week)}`);
});
