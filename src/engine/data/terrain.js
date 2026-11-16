// THE LONG NIGHT — terreno (BRIEF 5.5)
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  TLN.data = TLN.data || {};

  TLN.data.terrain = {
    column:  { id: 'column',  name: 'Colonna',  blocks: true,  collision: true, onCollision: null, light: false },
    brazier: { id: 'brazier', name: 'Braciere', blocks: true,  collision: true, onCollision: { status: 'vulnFire', n: 1 }, light: true },
    trap:    { id: 'trap',    name: 'Trappola', blocks: false, collision: false, onEnter: { direct: 3, remove: true } }
  };
})(typeof window !== 'undefined' ? window : globalThis);
