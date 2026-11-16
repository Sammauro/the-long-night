// THE LONG NIGHT — griglia esagonale (BRIEF 5.6)
// Celle come [R, E] (1-indexed). Internamente coordinate assiali {q, r}.
// Righe dispari (R1, R3...) spostate di mezza casella a destra.
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  TLN.engine = TLN.engine || {};

  // Sei direzioni assiali in ordine di rotazione (consecutive = adiacenti).
  var DIRS = [
    { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
    { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
  ];

  // BRIEF 5.6: row = R−1, col = E−1, q = col − (row + (row mod 2)) / 2, r = row
  function toAxial(c) {
    var row = c[0] - 1, col = c[1] - 1;
    return { q: col - (row + (row & 1)) / 2, r: row };
  }
  function fromAxial(a) {
    var row = a.r;
    var col = a.q + (row + (row & 1)) / 2;
    return [row + 1, col + 1];
  }
  function key(c) { return c[0] + ',' + c[1]; }
  function same(a, b) { return !!a && !!b && a[0] === b[0] && a[1] === b[1]; }

  function createGrid(rows, cols) {
    function inGrid(c) { return c[0] >= 1 && c[0] <= rows && c[1] >= 1 && c[1] <= cols; }

    function distance(a, b) {
      var x = toAxial(a), y = toAxial(b);
      var dq = x.q - y.q, dr = x.r - y.r;
      return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
    }
    function step(c, dir) {
      var a = toAxial(c);
      return fromAxial({ q: a.q + DIRS[dir].q, r: a.r + DIRS[dir].r });
    }
    // Vicini, compresi quelli fuori griglia se outside = true (servono per le spinte contro il muro, D7)
    function neighbors(c, outside) {
      var out = [];
      for (var d = 0; d < 6; d++) {
        var n = step(c, d);
        if (outside || inGrid(n)) out.push(n);
      }
      return out;
    }
    function dirBetween(a, b) {
      for (var d = 0; d < 6; d++) if (same(step(a, d), b)) return d;
      return -1;
    }
    // BRIEF 5.3 — cono: origine + i·a + j·b, i, j ≥ 0, 1 ≤ i + j ≤ range
    function cone(origin, orient, range) {
      var o = toAxial(origin), a = DIRS[orient % 6], b = DIRS[(orient + 1) % 6];
      var out = [];
      for (var i = 0; i <= range; i++) {
        for (var j = 0; i + j <= range; j++) {
          if (i + j < 1) continue;
          var c = fromAxial({ q: o.q + i * a.q + j * b.q, r: o.r + i * a.r + j * b.r });
          if (inGrid(c)) out.push(c);
        }
      }
      return out;
    }
    // Linea retta dalla cella (esclusa) per n passi nella direzione dir
    function line(origin, dir, n) {
      var out = [], c = origin;
      for (var i = 0; i < n; i++) { c = step(c, dir); out.push(c); }
      return out;
    }
    function allCells() {
      var out = [];
      for (var r = 1; r <= rows; r++) for (var e = 1; e <= cols; e++) out.push([r, e]);
      return out;
    }
    return {
      rows: rows, cols: cols, inGrid: inGrid, distance: distance, step: step,
      neighbors: neighbors, dirBetween: dirBetween, cone: cone, line: line, allCells: allCells
    };
  }

  TLN.engine.hex = { DIRS: DIRS, toAxial: toAxial, fromAxial: fromAxial, key: key, same: same, createGrid: createGrid };
})(typeof window !== 'undefined' ? window : globalThis);
