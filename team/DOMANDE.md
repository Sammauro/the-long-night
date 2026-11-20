# Domande aperte per Gianmarco

(gli agenti aggiungono qui le domande su regole ambigue e decisioni; una per riga, con data, agente e file)

- 2026-11-20 · tester-giocatore · `src/engine/run_manager.js` (`applyRests`), `src/engine/data/run_config.js`, `src/ui/run/ui_soglia.js` — Alla Soglia si arriva spesso con PT > 6 (visti 9 e 10 nelle partite seed 2 e 5) e il tetto di 6 PT in ingresso viene applicato comunque: "Raccogliersi" (+2 PT, max 6) non cambia nulla quando PT ≥ 6, ma consuma comunque una delle Soste e la schermata non avvisa. È voluto? Opzioni: (a) lasciare così (la Sosta è sprecata, scelta del giocatore), (b) applicare "Raccogliersi" dopo il tetto (quindi 6 → 6, comunque inutile), (c) segnalare in schermata che non ha effetto, (d) altra regola. Serve decidere anche in quale ordine vanno tetto e Sosta.
