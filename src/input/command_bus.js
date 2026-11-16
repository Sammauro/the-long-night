// THE LONG NIGHT — bus dei comandi (BRIEF 4)
// Traduce ogni input (click, tocco, script del tutorial, agente di test)
// in comandi astratti { type, ...parametri } e li passa al motore.
(function (root) {
  var TLN = root.TLN = root.TLN || {};
  TLN.input = TLN.input || {};

  function createCommandBus() {
    var handlers = {};
    var filters = [];
    var after = [];
    var cb = {
      register: function (type, fn) { handlers[type] = fn; },
      // Un filtro può rifiutare un comando restituendo una stringa d'errore.
      addFilter: function (fn) {
        filters.push(fn);
        return function () { filters = filters.filter(function (f) { return f !== fn; }); };
      },
      onExecuted: function (fn) { after.push(fn); },
      execute: function (cmd) {
        if (!cmd || !handlers[cmd.type]) return { ok: false, error: 'Comando sconosciuto: ' + (cmd && cmd.type) };
        for (var i = 0; i < filters.length; i++) {
          var why = filters[i](cmd);
          if (why) return { ok: false, error: why, filtered: true };
        }
        var res = handlers[cmd.type](cmd) || { ok: true };
        for (var j = 0; j < after.length; j++) after[j](cmd, res);
        return res;
      },
      list: function () { return Object.keys(handlers); }
    };
    return cb;
  }

  TLN.input.createCommandBus = createCommandBus;
})(typeof window !== 'undefined' ? window : globalThis);
