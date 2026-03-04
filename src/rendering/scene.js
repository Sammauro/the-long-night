// ═══════════════════════════════════════════════════════════
//  SCENE — Canvas, Camera, Geometria Esagonale
//  The Long Night · src/rendering/scene.js
//
//  Responsabilità: setup canvas, pan, zoom, resize.
//  Esporta: canvas, ctx, cam, HW, HH, hexCenter, hexPoints,
//           setRenderCallback, screenToWorld
//
//  Dipendenze: nessuna
// ═══════════════════════════════════════════════════════════


// ── Geometria hex — flat-top isometrica low-angle ───────────
// Costanti congelate dal mockup v4

export const HW = 52;   // metà larghezza esagono
export const HH = 20;   // metà altezza esagono (schiacciato per prospettiva)

export function hexCenter(col, row) {
  const c = col - 1;
  const r = row - 1;
  const off = r % 2 === 0 ? 0 : HW;
  return [c * HW * 2 + off, r * HH * 1.6];
}

export function hexPoints(cx, cy) {
  // 6 vertici del poligono esagonale flat-top
  return [
    [cx + HW,       cy      ],
    [cx + HW * .5,  cy - HH ],
    [cx - HW * .5,  cy - HH ],
    [cx - HW,       cy      ],
    [cx - HW * .5,  cy + HH ],
    [cx + HW * .5,  cy + HH ],
  ];
}


// ── Canvas e Camera ─────────────────────────────────────────

// canvas e ctx inizializzati a livello modulo (script type="module" è deferred)
export const canvas = document.getElementById('gc');
export const ctx    = canvas.getContext('2d');

export const cam = { x: 0, y: 0, zoom: 1 };

let _gridRows = 8;
let _gridCols = 6;
let _renderCallback = null;
let _drag = { on: false, sx: 0, sy: 0, cx: 0, cy: 0 };

export function setRenderCallback(fn) {
  _renderCallback = fn;
}

function requestRender() {
  if (_renderCallback) _renderCallback();
}

export function screenToWorld(sx, sy) {
  return {
    x: (sx - cam.x) / cam.zoom,
    y: (sy - cam.y) / cam.zoom,
  };
}


// ── Inizializzazione ─────────────────────────────────────────

export function initScene(rows, cols) {
  _gridRows = rows;
  _gridCols = cols;

  // ── Pan: mouse ──
  canvas.addEventListener('mousedown', e => {
    _drag.on = true;
    _drag.sx = e.clientX; _drag.sy = e.clientY;
    _drag.cx = cam.x;    _drag.cy = cam.y;
  });
  window.addEventListener('mousemove', e => {
    if (_drag.on) {
      cam.x = _drag.cx + (e.clientX - _drag.sx);
      cam.y = _drag.cy + (e.clientY - _drag.sy);
      requestRender();
    }
  });
  window.addEventListener('mouseup', () => { _drag.on = false; });

  // ── Zoom: scroll ──
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const f = e.deltaY < 0 ? 1.1 : 0.91;
    cam.x = e.clientX - (e.clientX - cam.x) * f;
    cam.y = e.clientY - (e.clientY - cam.y) * f;
    cam.zoom = Math.min(Math.max(cam.zoom * f, 0.25), 3.0);
    requestRender();
  }, { passive: false });

  // ── Pan: touch ──
  let _lastTouch = null;
  let _touchDist  = 0;

  canvas.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      _lastTouch = e.touches[0];
    } else if (e.touches.length === 2) {
      _touchDist = _pinchDist(e.touches);
    }
  }, { passive: true });

  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (e.touches.length === 1 && _lastTouch) {
      const t = e.touches[0];
      cam.x += t.clientX - _lastTouch.clientX;
      cam.y += t.clientY - _lastTouch.clientY;
      _lastTouch = t;
      requestRender();
    } else if (e.touches.length === 2) {
      const newDist = _pinchDist(e.touches);
      if (_touchDist > 0) {
        const f = newDist / _touchDist;
        const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        cam.x = mx - (mx - cam.x) * f;
        cam.y = my - (my - cam.y) * f;
        cam.zoom = Math.min(Math.max(cam.zoom * f, 0.25), 3.0);
      }
      _touchDist = newDist;
      requestRender();
    }
  }, { passive: false });

  canvas.addEventListener('touchend', () => {
    _lastTouch = null;
    _touchDist = 0;
  }, { passive: true });

  // ── Resize ──
  window.addEventListener('resize', _resize);
  _resize();
}

function _pinchDist(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function _resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  // Centra la griglia nello schermo, leggermente in alto per lasciare spazio alla UI
  const gW = _gridCols * HW * 2;
  const gH = _gridRows * HH * 1.6;
  cam.x = (canvas.width  - gW) / 2 + HW;
  cam.y = (canvas.height - gH) / 2 - 30;
  requestRender();
}
