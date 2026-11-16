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
| M4 | Combattimento giocabile | ⬜ | |
| M5 | Run | ⬜ | |
| M6 | Tutorial | ⬜ | |
| M7 | Rifinitura e pubblicazione | ⬜ | |

## Prossimo passo
M4: interfaccia di combattimento (§7) collegata al motore tramite command bus ed eventi.

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
| Q15 | Soste: se ne spettano 2, si può sceglierne solo 1? | No, si scelgono esattamente 1 o 2 Soste diverse. "Raccogliersi" non abbassa mai i PT. | `run_manager.js` |

## Da controllare a occhio
(elenco per il controllo visivo)
- **M3 — scena** (`index.html?view=r1&luce=0`, poi `luce=5`, `view=r3&dark=1&won=1`):
  - [ ] 60 fps su desktop con GPU (in console: `TLN.render.scene.ctx.fps`).
  - [ ] Righe della griglia parallele allo schermo, porta in alto (lato R8), giocatore in basso.
  - [ ] La lanterna cresce visibilmente da Luce 0 a Luce 5; a Luce 0 i nemici lontani sono sagome con gli occhi accesi.
  - [ ] Bracieri: tremolio e scintille leggibili; non sembrano palle arancioni.
  - [ ] Sprite (`docs/mockups/sprites.html`): lo Zombie ha la testa troppo "a rana"? Il volto dell'Indagatore si legge? Il Custode è abbastanza massiccio?

## Scostamenti dal brief
- Nessuna modifica a `CLAUDE.md` (deroga della sessione di prova): vedi "Modifiche da applicare ai documenti".
- `src/manifest.js` elenca solo i file già scritti; cresce milestone per milestone, così la pagina non ha mai script mancanti.
