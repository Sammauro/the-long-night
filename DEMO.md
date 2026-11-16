# THE LONG NIGHT — DEMO
Brief: docs/BRIEF_demo_claudecode.md (v1.0)

> **Sessione di prova.** Questo lavoro sta sul ramo `prova-demo` e non è fonte di verità.
> In deroga al brief: niente modifiche a `main`, niente merge, niente pull request, niente GitHub Pages;
> `CLAUDE.md`, `SIMULATOR.md` e i file di regole in `docs/` non vengono toccati: le modifiche che il brief chiede
> sono annotate qui sotto in "Modifiche da applicare ai documenti".

## Stato milestone
| # | Milestone | Stato | Note |
|---|---|---|---|
| M0 | Ricognizione e scheletro | ✅ | Pagina senza errori in console (verificato con Chromium headless) |
| M1 | Dati | ✅ | `node tools/smoke.js data`: 169 controlli, 0 falliti |
| M2 | Motore senza grafica | ✅ | `node tools/smoke.js`: 1477 controlli, 0 falliti (~25 s) |
| M3 | Scena 2.5D | ✅ | 4 stanze verificate con screenshot (Chromium headless); 60 fps da verificare su GPU vera |
| M4 | Combattimento giocabile | ✅ | Stanza 1 vinta da inizio a fine con mouse e con tocco (bot Playwright, clic reali); 14/14 carte giocate dall'interfaccia |
| M5 | Run | ✅ | Run dal menu via UI: Cripta vinta → Soglia → Corridoio; log scaricato con tutti i campi di §10. Vittoria della Stanza 3 verificata solo nel motore |
| M6 | Tutorial | ⬜ | |
| M7 | Rifinitura e pubblicazione | ⬜ | |

## Prossimo passo
M6: tutorial guidato della Stanza 0 (`tutorial_driver.js`, `ui_coach.js`) e suggerimenti contestuali.

## Sessioni
### Sessione 1 — 2026-11-16
- Fatto (M0):
  - Inventario del repo (sotto).
  - Struttura cartelle di §4; `src/manifest.js`; `index.html` che carica gli script in ordine da manifest (script classici, funziona da `file://`);
    `engine/rng.js` (mulberry32 con seed), `engine/event_bus.js` (un bus per partita), `input/command_bus.js` (con filtri, servono al tutorial).
  - I vecchi moduli ES spostati in `_archive/js_v0/` (non cancellati).
- File toccati: `index.html`, `style.css`, `src/manifest.js`, `src/engine/rng.js`, `src/engine/event_bus.js`, `src/input/command_bus.js`, `src/ui/app.js`, `DEMO.md`; spostamenti in `_archive/js_v0/`.
- Verifiche eseguite e risultato: apertura di `index.html` da `file://` in Chromium headless: 0 errori, 0 avvisi in console.
- Problemi aperti: nessuno.

- Fatto (M1):
  - `src/engine/data/`: `dice.js`, `equipment.js` (preset `demo` e `rev11`), `cards.js` (14 carte distinte, 16 copie, Azioni strutturate), `enemies.js` (4 nemici, tabelle d4 come dati interpretati dall'IA), `terrain.js`, `rooms.js` (4 stanze), `run_config.js`, `tutorial_script.js` (mazzo, dadi, movimento fissato, 16 passi), `hints.js` (9 suggerimenti).
  - `tools/load.js` (carica i file del manifest in un contesto `vm` di Node) e `tools/smoke.js` (runner); `tools/tests/data_tests.js`.
- Verifiche M1: `node tools/smoke.js data` → 169 controlli superati: 16 carte (7/5/4), 5 dadi, 4 stanze senza sovrapposizioni né coordinate fuori griglia, ogni d4 copre 1–4; pagina senza errori.

- Fatto (M2): motore completo in `src/engine/` (script classici, namespace `TLN.engine`):
  `hex_grid.js` (assiali, distanza, vicini anche fuori griglia per il muro, cono, linee), `game_state.js` (stato, stati a due aree, risorse, esito, registro comandi `check/run`),
  `combat_resolver.js` (danni con Vulnerabilità → Scudi → HP, Diretti, Contrattacco, trappole, spinte, Collisione, Braciere), `dice_system.js` (Lancio, Sequenza, legame D6, Selezione e costi),
  `card_system.js` (mazzo, pesca, Plancia, Sigilli, Eco, Rotazione CD), `card_effects.js` (aprire/usare/chiudere/annullare, Amplificazione), `card_effects_free.js` (Infusione, Manipolazione, Carica),
  `ai_opponent.js` (percorsi, Volo, allontanamento, 12 azioni, Corazza, anteprima per l'interfaccia), `resolution.js` (finestre, dado attivo, movimento con PM Salto, annulla, manovre base),
  `turn_manager.js` (5 fasi), `legal_moves.js` (mosse legali, per i test e per il futuro simulatore), `run_manager.js` (stanze, Soglia, Soste, tetto PT).
  Il motore emette ~40 tipi di evento sul bus; non conosce né rendering né UI.
- Test (M2): `tools/tests/` — `case_tests*.js` (casi mirati), `tutorial_tests.js`, `random_tests.js` (+ `agent.js`, `invariants.js`, `helpers.js`).
- Verifiche M2: `node tools/smoke.js` → **1477 controlli superati, 0 falliti**:
  - 300 partite casuali per ciascuna delle 4 stanze + 50 run complete: nessuna eccezione, nessuna mossa legale rifiutata; a ogni passo: 16 carte, ≤ 3 standard e ≤ 1 Fuoco in Plancia, HP ≤ 10, nessuna unità sovrapposta, fuori griglia, su ostacolo o ferma su trappola.
  - Esplorazione con un giocatore casuale "pesato" (preferisce mosse di danno) per raggiungere vittorie, Soglia e tutti gli eventi rari (Buio, Sigillo, Coro, Luce rubata, Corazza, Carica, Infusione...).
  - Stesso seed → stesso log (9 combinazioni seed × stanza).
  - Casi mirati: Collisione contro colonna, bordo e unità; Braciere; trappola con spinta e con Distorsione; Vulnerabilità prima degli Scudi; Danno Diretto; Contrattacco; dado IA spento; Corazza; Sigillo con Plancia libera e piena (e uscita senza scarti); Buio; tetto PT alla Soglia; 2 Soste entro la Veglia; Luce "Lanterna"; cono a 9 caselle; Amplificazione; Conversione Oscura; PM Salto; annulla; costi di Selezione; carte gratuite; ap, as, Scatto; Falena, Coro, Morso, Maglio; vittoria immediata; Follia pagando PT; pesca a vuoto; Eco di rotazione.
  - Script del tutorial: tutti gli stati attesi di §9.1 (fine T1, passo 12, passo 14) verificati.
- Nota: il giocatore casuale perde quasi sempre (è casuale); un agente goloso di prova (non nel repo) mostra che si muore soprattutto entrando nell'orda. Non è un indicatore di bilanciamento.

- Fatto (M3): `src/rendering/` — `theme.js` (tutti i parametri visivi, curva della lanterna), `scene.js` (renderer, ciclo, coordinate [R,E] → mondo, selezione casella, proiezione su schermo), `camera.js` (ortografica a 50°, respiro, scossa, inquadratura che lascia spazio all'interfaccia), `lights.js` (ambiente freddo, luna, lanterna legata alla Luce, Buio), `hex_renderer.js` (prismi esagonali con variazioni di altezza e tono, bordi luminosi raggiungibile/bersaglio/cono/selezione/spinta), `props.js` (Colonna con cima spezzata, Braciere con luce tremolante e scintille, Trappola con glifo pulsante), `room_shell.js` (pavimento, pareti basse, porta sul lato R8 che si illumina), `unit_renderer.js` (billboard con ombra, 2 fotogrammi, oscillazione, affondo, lampo bianco, dissolvenza; fuori dal raggio della lanterna sagome scure con occhi accesi), `fx.js` (numeri che salgono, particelle), `sprite_factory.js` + `sprites/*.js` (5 sprite come griglie di caratteri), `docs/mockups/sprites.html`.
  Vignettatura e righe di scansione in CSS; al Buio la vignettatura si stringe.
- Verifiche M3: screenshot headless delle 4 stanze (`index.html?view=r0..r3&luce=N&dark=1&won=1`), 0 errori in console. Unità, colonne, bracieri, trappole al loro posto; con Luce 0 i nemici lontani sono sagome con occhi accesi, con Luce 5 la lanterna illumina la prima fila; la porta si accende.
  **FPS:** in Chromium headless con rendering software (SwiftShader) ~20 fps: non è indicativo. Il controllo dei 60 fps va fatto su un browser desktop con GPU (vedi "Da controllare a occhio").

- Fatto (M4): interfaccia di §7 in `src/ui/` e `src/input/`:
  `ui_common.js` (stato UI, invio comandi, **riproduzione degli eventi** con i loro tempi: passi, affondi, lampi, numeri, Collisioni, morti; finestre di scelta; conferma per i pagamenti in PT che portano a 0),
  `ui_hud.js` (HP, PT, PM + PM Salto, Luce, candela della Veglia, turno e fase), `ui_sequence.js` (Sequenza con ritratti, icone d'azione e stati attivo/risolto/spento; anteprima del dado IA al passaggio o al tocco),
  `ui_selection.js` (pannello comandi: Selezione con "libero / N Luce / nessuno slot" e contatori in tempo reale, Fine Turno con somma degli Eco, dado attivo con impulsi e manovre base, "Dado successivo" con conferma se restano impulsi, "Continua" prima dei dadi IA e opzione "continua da solo", annulla movimento),
  `ui_plancia.js` (4 slot con dado e costo, lucchetto sui coperti, carte in CD ruotate davvero di 90°/180°, Sigilli, anteprima "prossimo turno: bloccati"), `ui_cards.js` (mano con Azioni sopra ed Eco sotto, carta aperta con le Azioni come pulsanti, Amplificazione, ricompensa di Attacco Strategico, scarti di Fine Turno nell'ordine scelto con bersaglio della rotazione),
  `ui_enemy_panel.js` (elenco con HP, Scudi, stati, intenzione; scheda con tabella d4), `ui_targeting.js` (caselle raggiungibili con costo in PM, bersagli, tre caselle di spinta con "Collisione", cono nei 6 orientamenti, percorso di Distorsione, Infusione, Manipolazione, Carica), `ui_log.js` (registro copiabile), `input_handler.js` (clic e tocco unificati, tocco prolungato = scheda, spazio = continua, esc = annulla).
  Layout in `style_ui.css`.
- Verifiche M4 (strumenti Playwright nello scratchpad, **non** nel repo perché Playwright è un pacchetto):
  - Bot che sceglie con una politica tattica minima e **agisce solo con clic/tocchi reali** sui pulsanti, sulle carte, sui dadi e sulle caselle del canvas: Stanza 1 vinta con il mouse (seed 17, 6 turni) e con il tocco (seed 10 e 17); altre partite giocate fino a Morte/Follia; 0 errori in console.
  - Tutte le 14 carte distinte giocate dall'interfaccia (stato preparato via script, poi solo clic): ok. Bug trovati e corretti: pannello Registro sovrapposto alla carta aperta; Carica Furiosa che restava nella scelta dei dadi; copia negli appunti senza permesso.
  - Nuovo test `tools/tests/preview_tests.js`: l'anteprima del dado IA (danno "adesso", PT, Luce rubata) coincide con l'azione reale nel **99,8%** di 2978 casi; le differenze vengono dalle parità di percorso che il motore risolve a caso (§6.9), mentre l'anteprima mostra il primo percorso più breve.
  - `node tools/smoke.js` → 1478 controlli, 0 falliti.
- Osservazione di bilanciamento (non è una regola, solo un dato): un agente tattico rozzo scritto per i test (colpisce chi deve ancora agire, si ritira dai gruppi) vince la Stanza 0 nel 99% dei casi, la Stanza 1 nel ~10%, la Stanza 2 nel ~10%, la Stanza 3 quasi mai, perdendo soprattutto per **Follia al Buio** (è lento). Il modello di `design_demo_v005.md` dichiara ~80%: la differenza è probabilmente l'agente, ma vale un controllo nel playtest.

- Fatto (M5): `src/balancing/data_collector.js` (log della run dagli eventi: per turno stanza, turno, seed, Sequenza, Plancia, slot coperti, Luce disponibile, esito di ogni slot coperto pagato/scartato/lasciato, Eco, carte giocate, danni fatti e subiti, PT persi con causa, HP/PT/Luce/PM finali; per stanza turni, esito rispetto alla Veglia, Soste; riepilogo testuale per Notion e JSON);
  `src/ui/run/ui_soglia.js` (riepilogo, cosa si azzera e cosa resta, scelta di 1 o 2 Soste, "ti aspetta" con le schede dei nemici della stanza successiva), `src/ui/run/ui_screens.js` (menu con "Inizia (tutorial)" e "Salta il tutorial", schermata finale con storia, "Copia riepilogo", "Scarica log", "Torna al menu").
  Il motore ora include nel `SELECTION_START` la Plancia e la Luce, e nell'esito di stanza lo stato del giocatore (serve al log per l'ultimo turno).
- Verifiche M5: nuovo test `tools/tests/log_tests.js` (campi di §10 presenti, JSON valido, riepilogo); `node tools/smoke.js` → 1503 controlli, 0 falliti.
  Bot Playwright dal menu ("Salta il tutorial", solo clic): seed 17 → Cripta vinta in 7 turni, Soglia (Bendarsi), Corridoio perso per Follia; il file scaricato con "Scarica log" contiene tutti i campi. Seed 10 con il tocco: run fino alla schermata finale. 0 errori in console.
  **Non verificato in UI:** una run vinta fino alla fine della Stanza 3 (l'agente di test non vince la Sala del Custode); la sequenza completa r0 → r3 con vittoria è coperta solo dai test del motore. Va provata a mano.

### Inventario iniziale (M0)
| Cosa c'era | Stato | Cosa ne è stato fatto |
|---|---|---|
| `index.html`, `style.css` (HUD statico, font Google) | moduli ES, font esterni (vietati da §2) | spostati in `_archive/js_v0/`, sostituiti |
| `src/engine/hex_grid.js` | modulo ES, coordinate `{r,q}` | spostato in `_archive/js_v0/engine/`, da riscrivere come script classico (M2) |
| `src/engine/event_bus_contract.js` | contratto eventi, modulo ES | spostato in archivio, sostituito da `src/engine/event_bus.js` |
| `src/input/command_bus_contract.js` | contratto comandi, modulo ES | spostato in archivio, sostituito da `src/input/command_bus.js` |
| `src/engine/data/levels_demo.js` | schema povero (4 Zombie, vecchio setup) | spostato in archivio; sarà sostituito da `data/rooms.js` (M1) |
| `src/engine/data/cards_combat.js`, `dice_types.js`, `enemies_zombie.js` | **non presenti** nel repo | nulla da sostituire |
| `src/rendering/scene.js`, `hex_renderer.js` | moduli ES Three.js | spostati in archivio, da riscrivere (M3) |
| `src/*/README.md` | vuoti | lasciati |
| `docs/` (regole, mockup, VTT r10/r11, piani) | documentazione | non toccati |
| `_archive/python/` | modello Python vecchio | non toccato |
| `SIMULATOR.md` | **non presente** nel repo | — |

## Modifiche da applicare ai documenti
(Il brief le chiede; in questa prova non sono state applicate.)
- `CLAUDE.md` → v1.4 (BRIEF 3):
  - carte **16** (CD 0 = 7, CD 1 = 5, CD 2 = 4) invece di 17; nella lista CD 2 ci sono 4 carte, non 3;
  - Equipaggiamento: preset `demo` (Slot 1 d6 Vigore 2 Luce · Slot 2 d8 Terrore 1 Luce · Slot 3 d6 Vigore 2 Luce · Slot 4 d4 Fuoco 1 Luce) come default; `rev11` resta come preset;
  - riferimento a `docs/BRIEF_demo_claudecode.md` e a `DEMO.md`;
  - §2/§4: script classici con namespace `TLN` (niente moduli ES), struttura file di BRIEF §4;
  - §2: rimuovere i font esterni (BRIEF 2: "niente font esterni").
- `SIMULATOR.md`: il brief dice che le fasi 2–5 sono sostituite dal brief, ma il file non esiste nel repo.

## Domande per Gianmarco
(regole non coperte dal brief; ho scelto l'opzione più prudente e sono andato avanti)

| # | Domanda | Scelta fatta (prudente) | Dove |
|---|---|---|---|
| Q1 | "Rimescola gli scarti nel mazzo": si mescola tutto il mazzo o solo gli scarti? | Se ci sono scarti, mazzo + scarti si mescolano insieme; se gli scarti sono vuoti non si mescola nulla (così la cima del mazzo del tutorial resta intatta al T2). | `card_system.js` `preparation` |
| Q2 | Una carta aperta resta aperta passando al dado successivo? | No: si chiude da sé quando si avanza (come quando ci si muove o si apre un'altra carta). Ogni Azione si paga comunque con un solo dado. | `resolution.js` ADVANCE |
| Q3 | Le carte gratuite (`ie`, `md`, `cu`) si possono giocare mentre un dado è attivo? | Solo in finestra libera (nessun dado attivo). L'Azione gratuita di `ab` invece sempre. | `card_effects_free.js` |
| Q4 | Scatto ha già pescato all'attivazione: si può annullare? | No: dopo la pesca non è più annullabile. | `card_effects.js` CANCEL_CARD |
| Q5 | Scatto "richiede almeno 1 ✊": vale anche 🔥 tramite Amplificazione? | Sì, basta poter pagare la sua Azione (✊, o 🔥 per Amplificazione). | `cards.js` / `costOf` |
| Q6 | Amplificazione su Diniego Sismico: il +1 vale anche se la Collisione colpisce un'altra unità? | Il +1 si applica al danno d'attacco sul bersaglio; il danno di Collisione resta 1 normale. | `card_effects.js` |
| Q7 | Attacco Strategico: la scelta PM/Scudo. | Alla chiusura il giocatore sceglie quanti PM (il resto Scudi). Se la carta va chiusa da sola (movimento, altra carta, dado successivo) prima serve la scelta. | `card_effects.js` |
| Q8 | Contrattacco: vale anche sul danno da Collisione della spinta del Maglio? | No, solo sul danno dell'attacco nemico. | `combat_resolver.js` |
| Q9 | Distorsione: se il bersaglio entra in una trappola a metà percorso e sopravvive, continua? | Sì, continua il percorso scelto; si ferma se muore. | `card_effects.js` |
| Q10 | Falena: può atterrare su una trappola? "Volteggiare" (si allontana di 3) è un Volo? | Non atterra mai su una trappola; Volteggiare usa la regola "si allontana di N" passo per passo, senza attivare trappole. | `ai_opponent.js` |
| Q11 | Carica Furiosa: le trappole sulla linea contano come caselle libere? | Sì (sono attraversabili) e scattano. "Adiacenti in Sequenza" = consecutivi nella Sequenza dopo la Selezione. | `card_effects_free.js` |
| Q12 | Movimento: "un movimento" è il singolo comando di spostamento? | Sì: ogni spostamento (destinazione) è un movimento; se parte da adiacente a un nemico il primo passo costa 2 PM. Il percorso automatico non attraversa trappole camminando, salvo se la trappola è la destinazione. | `resolution.js` |
| Q13 | Log §10: cosa vuol dire "lasciato" per un dado coperto? | Per ogni slot coperto: **pagato** (tenuto pagando Luce), **scartato** (c'era un dado di quel tipo ed è stato scartato), **lasciato** (nessun dado di quel tipo a disposizione). | `dice_system.js` |
| Q14 | Annullare un movimento che ha chiuso una carta aperta. | Non annullabile (la chiusura ha già messo la carta in Plancia/scarti). | `resolution.js` |
| Q16 | Un'Azione di carta Vigore costa ✊ ma il dado attivo ha solo 🔥: si paga con 🔥 da sola? | Sì, l'Amplificazione è legale: se i ✊ non bastano il motore usa 🔥 e il pulsante dell'Azione lo dice ("paghi 🔥, danno Fuoco"). Con ✊ disponibili si paga ✊, salvo spunta "paga con 🔥". | `card_effects.js`, `ui_cards.js` |
| Q17 | L'anteprima del dado IA deve mostrare il percorso esatto quando ci sono più percorsi brevi equivalenti? | Mostra il primo; il motore sceglie a caso tra i pari (§6.9). Danno e portata coincidono nel 99,8% dei casi. Se serve l'esattezza, si può rendere deterministica la scelta tra pari. | `ai_opponent.js` |
| Q15 | Soste: se ne spettano 2, si può sceglierne solo 1? | No, si scelgono esattamente 1 o 2 Soste diverse. "Raccogliersi" non abbassa mai i PT. | `run_manager.js` |

## Da controllare a occhio
(elenco per il controllo visivo)
- **M3 — scena** (`index.html?view=r1&luce=0`, poi `luce=5`, `view=r3&dark=1&won=1`):
  - [ ] 60 fps su desktop con GPU (in console: `TLN.render.scene.ctx.fps`).
  - [ ] Righe della griglia parallele allo schermo, porta in alto (lato R8), giocatore in basso.
  - [ ] La lanterna cresce visibilmente da Luce 0 a Luce 5; a Luce 0 i nemici lontani sono sagome con gli occhi accesi.
  - [ ] Bracieri: tremolio e scintille leggibili; non sembrano palle arancioni.
  - [ ] Sprite (`docs/mockups/sprites.html`): lo Zombie ha la testa troppo "a rana"? Il volto dell'Indagatore si legge? Il Custode è abbastanza massiccio?

- **M4 — combattimento** (`index.html?room=r1`):
  - [ ] Leggibilità della Sequenza con 10 dadi (Stanza 2) e delle etichette di Selezione sotto i dadi.
  - [ ] Le carte in Plancia ruotate di 180° (CD 2) restano leggibili? Va bene il testo capovolto?
  - [ ] Passando sopra un dado IA: nemico, percorso e casella del giocatore evidenziati; il riquadro rosso dice il danno.
  - [ ] Ritmo delle animazioni dei nemici (passi, affondo, numeri) e della pausa prima dei dadi IA.
  - [ ] Su tablet/telefono: tocco su caselle piccole, tocco prolungato sul nemico per la scheda.

- **M5 — run**: [ ] una run completa vinta fino all'alba (schermata finale di vittoria); [ ] testo di "Copia riepilogo" incollato su Notion.

## Scostamenti dal brief
- Nessuna modifica a `CLAUDE.md` (deroga della sessione di prova): vedi "Modifiche da applicare ai documenti".
- Il pannello Registro è un menu a tendina in alto (pulsanti "Registro" e "Copia") invece di un riquadro sempre aperto, per non coprire la griglia.
- `src/manifest.js` elenca solo i file già scritti; cresce milestone per milestone, così la pagina non ha mai script mancanti.
