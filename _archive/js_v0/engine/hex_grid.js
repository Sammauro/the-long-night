// ═══════════════════════════════════════════════════════════
//  HEX GRID — Geometria Esagonale
//  The Long Night · src/engine/hex_grid.js
//
//  Layout: odd-r offset, coordinate 1-indexed {r: riga, q: colonna}
//  Sistema cube interno: {q, r, s} con q+r+s=0
//  Tradotto da _archive/python/hex_utils.py
//
//  Dipendenze: nessuna — modulo puro, zero rendering
// ═══════════════════════════════════════════════════════════


// ── Conversioni coordinate ──────────────────────────────────

export function offsetToCube(r, q) {
  // Converte da offset 1-indexed a cube coordinates (odd-r layout)
  const r0 = r - 1;
  const q0 = q - 1;
  const cq = q0 - Math.floor(r0 / 2);
  const cr = r0;
  return { q: cq, r: cr, s: -cq - cr };
}

export function cubeToOffset(cube) {
  // Converte da cube coordinates a offset 1-indexed
  const r0 = cube.r;
  const q0 = cube.q + Math.floor(cube.r / 2);
  return { r: r0 + 1, q: q0 + 1 };
}


// ── Distanza ────────────────────────────────────────────────

export function hexDistance(a, b) {
  // Distanza hex tra due posizioni offset 1-indexed
  const ca = offsetToCube(a.r, a.q);
  const cb = offsetToCube(b.r, b.q);
  return (Math.abs(ca.q - cb.q) + Math.abs(ca.r - cb.r) + Math.abs(ca.s - cb.s)) / 2;
}


// ── Validità e vicini ────────────────────────────────────────

export function isValidHex(pos, rows, cols) {
  return pos.r >= 1 && pos.r <= rows && pos.q >= 1 && pos.q <= cols;
}

// Direzioni cube (6 direzioni standard)
const CUBE_DIRS = [
  { q:  1, r:  0, s: -1 },  // 0: Est
  { q:  1, r: -1, s:  0 },  // 1: NE
  { q:  0, r: -1, s:  1 },  // 2: NO
  { q: -1, r:  0, s:  1 },  // 3: Ovest
  { q: -1, r:  1, s:  0 },  // 4: SO
  { q:  0, r:  1, s: -1 },  // 5: SE
];

export function hexNeighbors(pos, rows, cols) {
  // Restituisce tutte le caselle adiacenti valide (distanza 1)
  const cube = offsetToCube(pos.r, pos.q);
  const neighbors = [];
  for (const d of CUBE_DIRS) {
    const nc = { q: cube.q + d.q, r: cube.r + d.r, s: cube.s + d.s };
    const offset = cubeToOffset(nc);
    if (isValidHex(offset, rows, cols)) {
      neighbors.push(offset);
    }
  }
  return neighbors;
}


// ── Pathfinding ──────────────────────────────────────────────

export function moveTowards(start, end, rows, cols) {
  // REGOLA — AI zombie: muovi di un passo verso il bersaglio
  // In caso di distanze equivalenti, scelta casuale tra le opzioni
  const neighbors = hexNeighbors(start, rows, cols);
  let bestOptions = [];
  let minDist = Infinity;
  for (const n of neighbors) {
    const d = hexDistance(n, end);
    if (d < minDist) {
      minDist = d;
      bestOptions = [n];
    } else if (d === minDist) {
      bestOptions.push(n);
    }
  }
  if (bestOptions.length === 0) return start;
  return bestOptions[Math.floor(Math.random() * bestOptions.length)];
}


// ── Cono AoE (Cono di Fuoco) ─────────────────────────────────

export function getCone(origin, directionHex, range, rows, cols) {
  // REGOLA — area espandente nella direzione indicata
  // directionHex DEVE essere adiacente all'origine (distanza 1)
  // dist 1 → 2 hex, dist 2 → 3 hex, dist 3 → 4 hex
  const oCube = offsetToCube(origin.r, origin.q);
  const dCube = offsetToCube(directionHex.r, directionHex.q);
  const dq = dCube.q - oCube.q;
  const dr = dCube.r - oCube.r;
  const ds = dCube.s - oCube.s;

  let dirIdx = -1;
  for (let i = 0; i < CUBE_DIRS.length; i++) {
    if (CUBE_DIRS[i].q === dq && CUBE_DIRS[i].r === dr && CUBE_DIRS[i].s === ds) {
      dirIdx = i;
      break;
    }
  }
  if (dirIdx === -1) return [];

  const mainDir  = CUBE_DIRS[dirIdx];
  const spreadDir = CUBE_DIRS[(dirIdx + 2) % 6];  // 120° CCW

  const area = [];
  for (let dist = 1; dist <= range; dist++) {
    const numHexes = dist + 1;
    const startQ = oCube.q + mainDir.q * dist;
    const startR = oCube.r + mainDir.r * dist;
    const startS = oCube.s + mainDir.s * dist;
    for (let i = 0; i < numHexes; i++) {
      const nc = {
        q: startQ + spreadDir.q * i,
        r: startR + spreadDir.r * i,
        s: startS + spreadDir.s * i,
      };
      const offset = cubeToOffset(nc);
      if (isValidHex(offset, rows, cols)) {
        area.push(offset);
      }
    }
  }
  return area;
}


// ── Direzione tra due posizioni ──────────────────────────────

export function getDirection(from, to) {
  // Restituisce il vettore direzione cube approssimato tra due offset pos
  const c1 = offsetToCube(from.r, from.q);
  const c2 = offsetToCube(to.r, to.q);
  let dq = c2.q - c1.q;
  let dr = c2.r - c1.r;
  let ds = c2.s - c1.s;
  if (dq === 0 && dr === 0 && ds === 0) return null;
  const maxVal = Math.max(Math.abs(dq), Math.abs(dr), Math.abs(ds));
  if (maxVal > 0) {
    dq = Math.round(dq / maxVal);
    dr = Math.round(dr / maxVal);
    ds = Math.round(ds / maxVal);
    if (dq + dr + ds !== 0) ds = -dq - dr;
  }
  return { q: dq, r: dr, s: ds };
}

export function addDirection(pos, direction) {
  // Applica un vettore direzione cube a una posizione offset
  if (!direction) return pos;
  const cube = offsetToCube(pos.r, pos.q);
  return cubeToOffset({
    q: cube.q + direction.q,
    r: cube.r + direction.r,
    s: cube.s + direction.s,
  });
}
