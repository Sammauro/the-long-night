// ═══════════════════════════════════════════════════════════
//  HEX RENDERER — Griglia, Sprite, Ostacoli, HP
//  The Long Night · src/rendering/hex_renderer.js
//
//  Responsabilità: disegna la griglia esagonale e tutte le unità.
//  Step 1: stato statico da levelData. Step 2+ riceverà eventi.
//
//  Geometria: flat-top, layout odd-q (colonne offset)
//    centerX = q × HW × 1.5
//    centerY = r × HH × 2 + (q dispari ? HH : 0)
//
//  Dipendenze: scene.js
// ═══════════════════════════════════════════════════════════

import { canvas, ctx, cam, HW, HH, setRenderCallback } from './scene.js';


// ── Geometria hex — flat-top, odd-q ─────────────────────────

function hexCenter(q, r) {
  // q, r: 1-indexed. Colonne dispari (q=1,3,5…) spostate in basso di HH.
  return [
    q * HW * 1.5,
    r * HH * 2 + (q % 2 === 1 ? HH : 0),
  ];
}

function hexPoints(cx, cy) {
  // 6 vertici flat-top, coerenti con hexCenter sopra.
  return [
    [cx + HW,      cy      ],   // destra
    [cx + HW * .5, cy - HH ],   // alto-destra
    [cx - HW * .5, cy - HH ],   // alto-sinistra
    [cx - HW,      cy      ],   // sinistra
    [cx - HW * .5, cy + HH ],   // basso-sinistra
    [cx + HW * .5, cy + HH ],   // basso-destra
  ];
}


// ── Stato interno renderer ───────────────────────────────────

let _level     = null;
let _hover     = { q: -1, r: -1 };
let _unitState = {};


// ── Inizializzazione ─────────────────────────────────────────

export function initRenderer(levelData) {
  _level = levelData;

  // Stato visivo iniziale — HP al massimo (collegato a game_state allo Step 2)
  _unitState['player'] = { pos: { ...levelData.player.pos }, hp: 10, maxHp: 10 };
  for (const e of levelData.enemies) {
    _unitState[e.id] = { pos: { ...e.pos }, hp: 4, maxHp: 4 };  // zombie HP 4 (regola §)
  }

  // Centra la camera sulla griglia
  _recenterCamera();

  // Hover: rilevamento casella sotto il cursore
  canvas.addEventListener('mousemove', e => {
    const wx = (e.clientX - cam.x) / cam.zoom;
    const wy = (e.clientY - cam.y) / cam.zoom;
    const found = _worldToHex(wx, wy);
    if (found.q !== _hover.q || found.r !== _hover.r) {
      _hover = found;
      render();
    }
  });

  // Ricentra dopo resize (si aggiunge dopo scene.js, quindi sovrascrive i valori errati)
  window.addEventListener('resize', () => {
    _recenterCamera();
    render();
  });

  // Registra callback e fa il primo render
  setRenderCallback(render);
  _buildEnemyHud();
  render();
}

function _recenterCamera() {
  // Calcola il centro della griglia in coordinate mondo e lo porta al centro schermo
  const { rows, cols } = _level.grid;
  // Bounds griglia (1-indexed):
  //   x: da (1*HW*1.5 - HW) a (cols*HW*1.5 + HW)
  //   y: da HH a (rows*HH*2 + 2*HH)
  const gridCenterX = (1 * HW * 1.5 - HW + cols * HW * 1.5 + HW) / 2;
  const gridCenterY = (HH + rows * HH * 2 + 2 * HH) / 2;
  // Centra orizzontalmente; verticalmente lascia ~130px per la UI in basso
  cam.x = canvas.width  / 2 - gridCenterX;
  cam.y = (canvas.height - 130) / 2 - gridCenterY;
}


// ── Render principale ────────────────────────────────────────

export function render() {
  if (!_level || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(cam.x, cam.y);
  ctx.scale(cam.zoom, cam.zoom);

  _drawGrid();
  _drawObstacles();
  _drawTraps();
  _drawEnemies();
  _drawPlayer();   // player sopra i nemici

  ctx.restore();
}


// ── Griglia ──────────────────────────────────────────────────

function _drawGrid() {
  const { rows, cols } = _level.grid;
  for (let r = 1; r <= rows; r++) {
    for (let q = 1; q <= cols; q++) {
      const [cx, cy] = hexCenter(q, r);
      const pts = hexPoints(cx, cy);
      const isHov      = (_hover.q === q && _hover.r === r);
      const isPlayer   = (_level.player.pos.q === q && _level.player.pos.r === r);
      const isEnemy    = _level.enemies.some(e => e.pos.q === q && e.pos.r === r);
      const isObstacle = _level.obstacles.some(o => o.pos.q === q && o.pos.r === r);
      const isTrap     = _level.traps.some(t => t.pos.q === q && t.pos.r === r);

      let fill, stroke, lw = 1, dash = [];

      if (isObstacle) {
        fill   = 'rgba(30,25,55,0.85)';
        stroke = 'rgba(80,70,130,0.6)';
        lw = 1.5;
      } else if (isHov) {
        fill   = 'rgba(0,229,255,0.07)';
        stroke = 'rgba(0,229,255,0.35)';
        lw = 1.5;
      } else if (isPlayer) {
        fill   = 'rgba(180,79,255,0.12)';
        stroke = 'rgba(180,79,255,0.55)';
        lw = 1.5;
      } else if (isEnemy) {
        fill   = 'rgba(255,45,45,0.09)';
        stroke = 'rgba(255,45,45,0.45)';
        lw = 1.5;
      } else if (isTrap) {
        fill   = 'rgba(255,170,0,0.04)';
        stroke = 'rgba(255,170,0,0.30)';
        dash = [4, 3];
      } else {
        fill   = 'rgba(8,8,28,0.5)';
        stroke = 'rgba(22,27,60,0.75)';
      }

      _fillHex(pts, fill, stroke, lw, dash);

      // DEBUG: label coordinate — rimuovere dopo verifica
      ctx.save();
      ctx.font         = `${HH * 0.65}px monospace`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle    = 'rgba(200,210,230,0.55)';
      ctx.fillText(`R${r}Q${q}`, cx, cy);
      ctx.restore();
    }
  }
}


// ── Ostacoli — colonne ───────────────────────────────────────

function _drawObstacles() {
  for (const obs of _level.obstacles) {
    const [cx, cy] = hexCenter(obs.pos.q, obs.pos.r);
    ctx.save();
    ctx.shadowColor = 'rgba(120,100,200,0.4)';
    ctx.shadowBlur  = 12;
    const colW = HW * 0.28;
    const colH = HH * 2.8;
    ctx.fillStyle = 'rgba(60,55,90,0.9)';
    _roundRect(cx - colW / 2, cy - colH * 0.85, colW, colH, 3);
    ctx.fill();
    // cap superiore
    ctx.fillStyle = 'rgba(100,90,150,0.8)';
    _roundRect(cx - colW * 0.65, cy - colH * 0.85 - 4, colW * 1.3, 6, 2);
    ctx.fill();
    ctx.restore();
  }
}


// ── Trappole ─────────────────────────────────────────────────

function _drawTraps() {
  for (const trap of _level.traps) {
    if (!trap.active) continue;
    const [cx, cy] = hexCenter(trap.pos.q, trap.pos.r);
    ctx.save();
    ctx.font = `${HH * 1.1}px serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha  = 0.55;
    ctx.fillText('⚠', cx, cy + HH * 0.1);
    ctx.restore();
  }
}


// ── Sprite humanoid ──────────────────────────────────────────

function _drawHumanoid(cx, cy, height, color, glowColor) {
  const headR  = height * 0.10;
  const bodyH  = height * 0.28;
  const bodyW  = height * 0.14;
  const legH   = height * 0.28;
  const legW   = height * 0.065;
  const armH   = height * 0.22;
  const armW   = height * 0.055;
  const headY  = cy - height + headR;
  const shouldY = headY + headR + height * 0.01;
  const hipY   = shouldY + bodyH;

  ctx.save();
  ctx.shadowColor = glowColor;
  ctx.shadowBlur  = 18;
  ctx.fillStyle   = color;

  // Testa
  ctx.beginPath();
  ctx.arc(cx, headY, headR, 0, Math.PI * 2);
  ctx.fill();
  // Busto
  _roundRect(cx - bodyW / 2, shouldY, bodyW, bodyH, 2);
  ctx.fill();
  // Braccia
  _roundRect(cx - bodyW / 2 - armW, shouldY + height * 0.02, armW, armH, 2);
  ctx.fill();
  _roundRect(cx + bodyW / 2,        shouldY + height * 0.02, armW, armH, 2);
  ctx.fill();
  // Gambe
  _roundRect(cx - bodyW / 2 + height * 0.01, hipY, legW, legH, 2);
  ctx.fill();
  _roundRect(cx + bodyW / 2 - legW - height * 0.01, hipY, legW, legH, 2);
  ctx.fill();

  ctx.restore();
}

function _drawHpBar(cx, cy, pct, color, width = 44) {
  const bx = cx - width / 2;
  const by = cy + 4;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  _roundRect(bx, by, width, 3, 1.5);
  ctx.fill();
  if (pct > 0) {
    ctx.fillStyle   = color;
    ctx.shadowColor = color;
    ctx.shadowBlur  = 4;
    _roundRect(bx, by, width * pct, 3, 1.5);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}


// ── Giocatore ────────────────────────────────────────────────

function _drawPlayer() {
  const s = _unitState['player'];
  const [cx, cy] = hexCenter(s.pos.q, s.pos.r);

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy + HH * .2, HW * .45, HH * .4, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(180,79,255,0.3)';
  ctx.fill();
  ctx.restore();

  _drawHumanoid(cx, cy - HH * .1, HH * 3.8, 'rgba(195,130,255,0.92)', 'rgba(180,79,255,0.6)');
  _drawHpBar(cx, cy + HH * .3, s.hp / s.maxHp, '#39ff14');
}


// ── Nemici ───────────────────────────────────────────────────

function _drawEnemies() {
  for (const enemy of _level.enemies) {
    const s = _unitState[enemy.id];
    if (!s || s.hp <= 0) continue;
    const [cx, cy] = hexCenter(s.pos.q, s.pos.r);

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy + HH * .2, HW * .4, HH * .35, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,45,45,0.22)';
    ctx.fill();
    ctx.restore();

    _drawHumanoid(cx, cy, HH * 3.0, 'rgba(255,100,100,0.82)', 'rgba(255,45,45,0.5)');
    _drawHpBar(cx, cy + HH * .25, s.hp / s.maxHp, '#ff2d2d', 36);
  }
}


// ── HUD nemici — top right ───────────────────────────────────

function _buildEnemyHud() {
  const list = document.getElementById('e-list');
  if (!list) return;
  list.innerHTML = '';
  for (const e of _level.enemies) {
    const row = document.createElement('div');
    row.className  = 'e-row';
    row.dataset.id = e.id;
    row.innerHTML = `
      <span class="e-icon">🧟</span>
      <div class="e-info">
        <div class="e-name">${e.id.replace('_', '\u00A0').toUpperCase()}</div>
        <div class="e-bar"><div class="e-fill" id="hbar-${e.id}" style="width:100%"></div></div>
      </div>`;
    list.appendChild(row);
  }
}


// ── Helper: hit-test hex ─────────────────────────────────────

function _worldToHex(wx, wy) {
  // Approssimazione ellissoidale per hit-test (stessa del mockup v4)
  const { rows, cols } = _level.grid;
  for (let r = 1; r <= rows; r++) {
    for (let q = 1; q <= cols; q++) {
      const [cx, cy] = hexCenter(q, r);
      const dx = (wx - cx) / HW;
      const dy = (wy - cy) / HH;
      if (dx * dx + dy * dy < 1) return { q, r };
    }
  }
  return { q: -1, r: -1 };
}


// ── Helper canvas ────────────────────────────────────────────

function _fillHex(pts, fill, stroke, lw = 1, dash = []) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fillStyle   = fill;
  ctx.fill();
  ctx.setLineDash(dash);
  ctx.strokeStyle = stroke;
  ctx.lineWidth   = lw;
  ctx.stroke();
  ctx.setLineDash([]);
}

function _roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y,     x + w, y + r,     r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x,     y + h, x,     y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x,     y,     x + r, y,         r);
  ctx.closePath();
}
