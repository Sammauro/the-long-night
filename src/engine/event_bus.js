// THE LONG NIGHT — bus degli eventi (BRIEF 4)
// Il motore non anima e non aspetta: emette eventi in ordine.
// Rendering, UI e log li ascoltano e li riproducono con i loro tempi.
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  TLN.engine = TLN.engine || {};

  function createEventBus() {
    var listeners = {};
    var any = [];
    var counter = 0;
    var bus = {
      on: function (type, fn) {
        (listeners[type] = listeners[type] || []).push(fn);
        return function () { bus.off(type, fn); };
      },
      off: function (type, fn) {
        if (!listeners[type]) return;
        listeners[type] = listeners[type].filter(function (f) { return f !== fn; });
      },
      onAny: function (fn) {
        any.push(fn);
        return function () { any = any.filter(function (f) { return f !== fn; }); };
      },
      emit: function (type, payload) {
        var ev = { n: ++counter, type: type, data: payload || {} };
        var ls = (listeners[type] || []).slice();
        for (var i = 0; i < ls.length; i++) ls[i](ev.data, ev);
        var as = any.slice();
        for (var j = 0; j < as.length; j++) as[j](ev);
        return ev;
      },
      count: function () { return counter; }
    };
    return bus;
  }

  TLN.engine.createEventBus = createEventBus;
})(typeof window !== 'undefined' ? window : globalThis);
