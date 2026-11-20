# Correzioni del 2026-11-20 (Task 5, sviluppatore)

Smoke dopo l'ultimo commit di codice: `1521 controlli superati, 0 falliti.` Schermate in `team/reviews/correzioni_2026-11-20/`.

## BUG-1 — spinta contro il muro (commit a7f6258)
- Causa: la cella-muro e' fuori griglia, la scena non ha mesh da cliccare; `highlights()` la mostrava solo come etichetta.
- Modifica: `src/ui/combat/ui_targeting.js` (nuova `wallButtons()`), `src/ui/app.js` (la barra del modo aggiunge un pulsante "Collisione col muro" per ogni cella-muro, con freccia se sono due; chiama `onCell`). Funziona in tutti gli stili e formati perche' e' DOM. `tools/tests/ui_replay.js` e `probe_wall_push.js` ora usano il pulsante (clic/tocco veri), nessun ripiego.
- Attacco Poderoso ("Stordisci + Spingi 1") ha `push: 1, target: 'adj'` e passa da `onUnit` -> `step: 'push'` come Diniego Sismico: stessa barra, stesso pulsante. Non l'ho provato in partita (vedi limiti).
- Verifica: `twin_plan.js 1` + `ui_replay.js ... --stopat=189 --probe=tools/tests/probe_wall_push.js`. Desktop (clic): "Pulsanti Collisione col muro: 1", HP Z5 6 -> 4, modalita' chiusa. Telefono 844x390 (`--phone`, tap): stesso esito. Schermate: `bug1_desktop_*.png`, `bug1_telefono_*.png`.
- Nota: sul telefono la barra del modo copre in parte la Sequenza (e' cosi' da prima).

## BUG-4 — HUD a fine partita (commit fb71eaa)
- Causa: come ipotizzato, `refresh()` con fase END ridisegnava solo le schermate.
- Modifica: `src/ui/app.js`, ridisegna anche l'HUD se esiste una partita.
- Verifica: `twin_plan.js 10` + `ui_replay.js` (0 anomalie, 0 errori console). Dietro la schermata "Morte" l'HUD mostra 0/10 e "Sconfitta": `bug4_fine_partita_hud_0.png`.

## BUG-5 — avvisi flatShading in stile C (commit d8b17b7)
- Causa: `flatShading` non esiste su `MeshLambertMaterial` in r128.
- Modifica: `src/rendering/style.js`, tolta la proprieta' (era gia' ignorata, quindi l'aspetto e' identico).
- Verifica: Playwright su `?room=r1&seed=8&style=c`, con la vecchia `style.js` servita via route: 18 avvisi; con la nuova: 0 (7 messaggi totali, nessuno di flatShading). Schermate prima/dopo equivalenti (differisce solo la fase delle animazioni): `bug5_stile_c_prima.png`, `bug5_stile_c_dopo.png`. Il tester ne contava 30 su una partita piu' lunga.

## BUG-6 — testo tutorial passo 1 (commit 54f624d)
- Causa: testo che citava un teschio inesistente.
- Modifica: `src/engine/data/tutorial_script.js`: "Tocca il dado di un nemico per vedere cosa fara'." Nessun testo di regola cambiato.
- Verifica: smoke a 0 falliti; non rigiocato il tutorial.

## Limiti
- Attacco Poderoso non provato con clic reale (percorso di codice identico).
- Il puntatore "tocco prolungato" e i 16 passi del tutorial non riverificati.
- Il replay richiede circa 6 minuti per run in SwiftShader.
