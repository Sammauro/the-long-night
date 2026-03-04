# THE LONG NIGHT — Piano di Sviluppo Dettagliato
**Versione:** v1.0
**Data:** 2026-03-04

---

## Step 0 — Contratti (prerequisito, non visivo)

**Obiettivo:** definire i contratti di comunicazione tra moduli prima di scrivere qualsiasi logica.

**0.1** Creare struttura cartelle nel repo (`src/engine/`, `src/engine/data/`, `src/rendering/`, `src/ui/combat/`, `src/input/`, `src/balancing/`).

**0.2** Scrivere `src/engine/event_bus.js` — classe EventBus funzionante + catalogo completo eventi come commenti.

**0.3** Scrivere `src/input/command_bus.js` — classe CommandBus funzionante + catalogo completo comandi come commenti.

**0.4** Aggiornare CLAUDE.md con riferimento ai contratti e piano aggiornato.

**Cosa verifichi:** ti mando la lista degli eventi e dei comandi in italiano, li approvi. Nessun output visivo.

---

## Step 1 — Griglia esagonale con logica e rendering

**Obiettivo:** griglia 6×8 dello scenario demo visibile e navigabile nel browser.

**1.1** Tradurre `hex_utils.py` → `src/engine/hex_grid.js` (coordinate offset, hexCenter, hexDistance, hexNeighbors, pathfinding A*). Solo logica geometrica, zero rendering.

**1.2** Creare `src/engine/data/levels_demo.js` — dati scenario demo v0.0.4a: dimensioni griglia, posizioni giocatore, 4 zombie, 2 colonne, 1 trappola.

**1.3** Creare `index.html` + `style.css` base (palette Death Howl dal mockup, fonts, struttura shell).

**1.4** Creare `src/rendering/scene.js` — setup canvas 2D con pan (drag), zoom (scroll/pinch), resize. Geometria esagonale flat-top isometrica ripresa dal mockup (HW/HH, hexCenter, hexPoints).

**1.5** Creare `src/rendering/hex_renderer.js` — disegna griglia, sprite humanoid (giocatore + zombie), colonne, trappola, barre HP. Visual ripreso dal mockup.

**Recupero Python:** `hex_utils.py` per 1.1.
**Test:** apri GitHub Pages → vedi griglia 6×8, giocatore viola in R1-E4, 4 zombie rossi nelle posizioni corrette, 2 colonne grige, 1 trappola segnata. Puoi fare pan e zoom.

---

## Step 2 — Stato di gioco e HUD

**Obiettivo:** le risorse del giocatore e dei nemici sono dati reali visualizzati nell'HUD.

**2.1** Creare `src/engine/game_state.js` — stato completo: risorse giocatore (HP, PT, PM, Luce), HP e stati di ogni nemico, posizioni su griglia. Metodi per modificare risorse con validazione (HP non supera max, PT può superare 6, PM si accumula, Luce si accumula).

**2.2** Creare `src/engine/data/enemies_zombie.js` — scheda Zombie v0.0.4a (HP 4, Movimento 2, dado AI d4, tabella 4 azioni).

**2.3** Creare `src/ui/combat/ui_hud.js` — HUD giocatore (HP, PT, PM, Luce, stati) + HUD nemici (HP, stati per ciascuno). Layout dal mockup. Si sottoscrive a eventi `RESOURCE_CHANGED`, `STATE_APPLIED`, `STATE_CONSUMED`, `DAMAGE_DEALT`, `UNIT_DIED`.

**2.4** Collegare game_state → event_bus → ui_hud. Primo test del flusso engine→evento→UI.

**Test:** apri la pagina → HUD mostra HP 10/10, PT 6/6, PM 2, Luce 0. A destra 4 zombie con HP 4/4 ciascuno. Ancora non interattivo, ma i dati vengono dallo stato.

---

## Step 3 — Sistema dadi: lancio e Sequenza Vincolata

**Obiettivo:** premere un pulsante, vedere la Sequenza Vincolata popolata con dadi casuali.

**3.1** Creare `src/engine/data/dice_types.js` — definizioni facce: d4V=[1,1,2,2], d6V=[1,1,2,2,2,3], d8V=[1,1,2,2,2,3,3,4], d4F=[1,1,2,2], d8T=[1,1,2,2,2,3,3,4], d4AI=[1,2,3,4].

**3.2** Creare `src/engine/dice_system.js` — funzioni: rollBag (lancia tutti i dadi), generateSequence (ordine casuale), getResult, getDieInfo, rollSingleDie.

**3.3** Creare `src/ui/combat/ui_sequence.js` — striscia Sequenza Vincolata con visual dal mockup (dadi colorati per tipo, popover su hover con info dado). Aggiungere pulsante "Lancia Dadi". Si sottoscrive a `DICE_ROLLED`.

**3.4** Creare `src/engine/gamedata.js` — aggrega dati da `data/`: composizione Bag demo (2×d6V, 2×d4F, 1×d8T), dadi AI (1×d4AI per zombie vivo).

**Recupero Python:** facce dadi da `gamedata.py`.
**Test:** premi "Lancia Dadi" → 9 dadi appaiono nella striscia (5 giocatore + 4 AI) con risultati casuali. Hover mostra tipo/risultato. Ogni click dà risultati diversi.

---

## Step 4 — Selezione dadi con Equipaggiamento

**Obiettivo:** dopo il lancio, il giocatore sceglie quali dadi tenere e quali scartare.

**4.1** Aggiungere a `dice_system.js` la logica Selezione: stato di ogni dado (selezionato/scartato/non processato), calcolo risorse da scarto (flat: Vigore→+1PM, Fuoco→+1Luce, Terrore→+1PT).

**4.2** Creare sistema Equipaggiamento in `game_state.js` — 4 slot demo con tipo, priorità, costo recupero. Logica copertura slot da CD (priorità alta→bassa). Slot esclusivo Fuoco.

**4.3** Aggiornare `ui_sequence.js` — click su dado giocatore alterna selezionato/scartato. Visual: dado scartato appare dimmed con icona risorsa. Dado selezionato evidenziato. Pulsante "Conferma Selezione".

**4.4** Collegare Selezione al game_state — risorse si aggiornano in tempo reale nell'HUD quando si scarta/riseleziona. Conferma rimuove dadi scartati dalla Sequenza.

**Test:** dopo lancio → clicca un dado Fuoco per scartarlo → Luce nell'HUD sale a 1. Clicca di nuovo → torna selezionato, Luce torna a 0. Conferma → dadi scartati spariscono dalla striscia. La Sequenza finale ha solo i selezionati + AI.

---

## Step 5 — Database carte e mano

**Obiettivo:** vedere 5 carte in mano, pescate casualmente, con dati v0.0.4a corretti.

**5.1** Creare `src/engine/data/cards_combat.js` — tutte le 13 carte v0.0.4a con: id, nome, tipo (VG/FU/SP), CD, Supply, costo in impulsi, lista Azioni (sequenza irreversibile), Eco (tipo + valore), testo descrittivo.

**5.2** Creare `src/engine/card_system.js` — mazzo, pila scarti, mano. Funzioni: shuffle, draw(n), discardFromHand, getHand, getDeck.

**5.3** Aggiornare `gamedata.js` — composizione mazzo demo (13 carte), limite mano (5).

**5.4** Creare `src/ui/combat/ui_cards.js` — zona carte in basso, visual dal mockup (card compact + hover expand con effetto ed Eco). Si sottoscrive a `CARDS_DRAWN`, `CARD_PLAYED`, `CARD_DISCARDED`.

**5.5** Collegare: all'inizio partita → shuffle → draw(5) → `CARDS_DRAWN` → ui_cards mostra le 5 carte.

**Test:** ricarica la pagina → 5 carte in mano, diverse a ogni caricamento. Hover mostra nome, costo, effetto attivo, Eco — tutto allineato alla v0.0.4a. Carte in CD appaiono dimmed (nessuna per ora, ma lo stile è pronto).

---

## Step 6 — Risoluzione: Attacco Base + movimento + AI zombie

**Obiettivo:** un dado alla volta, giocatore agisce, nemici agiscono. Combattimento minimo funzionante.

**6.1** Creare `src/engine/turn_manager.js` — orchestra le 4 fasi, gestisce il dado corrente nella Sequenza, finestre di azione libera tra dadi. Emette `PHASE_CHANGED`, `SEQUENCE_ADVANCE`.

**6.2** Creare `src/engine/combat_resolver.js` — calcolo danni (raw → vulnerabilità → scudi → HP), applicazione stati (Scudo, Vulnerabilità, Stordito). Emette `DAMAGE_DEALT`, `STATE_APPLIED`, `UNIT_DIED`.

**6.3** Creare `src/input/input_handler.js` — unifica click/touch sul canvas. Click su casella → `SELECT_HEX`. Click su carta → `PLAY_CARD`. Turn_manager interpreta in base al contesto.

**6.4** Implementare logica Attacco Base in `card_system.js` — 1✊: 1 Danno corpo a corpo / 2✊: Pesca 1 carta. Sequenza irreversibile delle due Azioni.

**6.5** Implementare movimento giocatore — click casella adiacente, validazione PM, costo 2 PM se adiacente a nemico (primo passo). Emette `UNIT_MOVED`. Il movimento chiude la carta in risoluzione.

**6.6** Creare `src/engine/ai_opponent.js` — logica zombie: quando tocca il dado AI, ogni zombie vivo si attiva in ordine numerico. Movimento verso giocatore (percorso più breve), attacco se adiacente. Implementare le 4 azioni della tabella d4. Emette `ENEMY_ACTIVATED`, `ENEMY_ACTION_RESOLVED`.

**6.7** Aggiornare rendering — casella evidenziata quando in attesa di bersaglio (verde per movimento valido, rosso per nemico bersagliabile). Sprite si spostano quando un'unità si muove. Barre HP si aggiornano.

**6.8** Aggiornare `ui_sequence.js` — dado attivo evidenziato (stile `active` dal mockup con animazione). Dadi usati appaiono dimmed (`used`).

**Test:** il primo dado nella Sequenza si illumina. Se è Vigore: clicchi Attacco Base → la griglia evidenzia i nemici adiacenti → clicchi zombie → HP dello zombie scende di 1 → carta va negli scarti (CD 0). Puoi cliccare una casella adiacente → ti muovi, PM scende. Quando è il turno del dado AI: lo zombie si muove verso di te e attacca — i tuoi HP scendono. Il dado successivo si illumina automaticamente. Morte di uno zombie o del giocatore mostra messaggio.

---

## Step 7 — Cooldown, Eco, Fine Turno e ciclo completo

**Obiettivo:** un turno completo giocabile dall'inizio alla fine, con il ciclo che riparte.

**7.1** Implementare Plancia Cooldown in `card_system.js` — 3 slot standard + 1 esclusivo Fuoco. Carte con CD ≥ 1 vanno in plancia dopo l'uso. Validazione: se slot pieni, non si possono giocare carte CD ≥ 1.

**7.2** Creare `src/ui/combat/ui_dice_panel.js` — pannello Plancia Cooldown visiva (dal mockup: carte ruotate 90°/180°/270°). Si sottoscrive a `CARD_TO_COOLDOWN`, `CARD_CD_ROTATED`, `CARD_CD_COMPLETED`.

**7.3** Implementare Fase 1 — Fine Turno:
- Step A: UI permette di selezionare carte da scartare dalla mano.
- Step B: Eco applicati (PM, Luce, Scudi, pesca, avanzamento CD — secondo la carta).
- Step C: carte a 0° escono dal CD → Pila Scarti. Resto ruota 90° antiorario.
- Step D: rotazione stati (Prossimo Turno→rimossi, Turno Attuale→Prossimo Turno).

**7.4** Implementare Fase 2 — Upkeep:
- Step A: pesca carte fino a limite mano (5).
- Step B: rimescola Pila Scarti nel Mazzo.

**7.5** Collegare ciclo completo: Fine Turno (pulsante) → Fase 1 → Fase 2 → Fase 3 (lancio) → Fase 4 (risoluzione) → Fine Turno.

**7.6** Gestire primo turno: Fase 1 saltata, parte da Fase 2.

**7.7** Aggiornare indicatore turno in alto (dal mockup: "TURNO 01 · RISOLUZIONE").

**Test:** gioca Attacco Poderoso (CD 1) → appare nella plancia ruotata 90°. Lo slot è occupato. Premi "Fine Turno" → puoi scartare carte per Eco (PM/Luce/Scudi si aggiornano) → la carta in CD ruota di 90° → nuovo lancio dadi → nuovo turno parte. Al turno dopo: la carta raggiunge 0° e torna disponibile nella pesca. Il contatore turno si incrementa. Lo stato degli scudi/vulnerabilità si degrada correttamente.

---

## Step 8 — Allineamento UI alla v0.0.4a

**Obiettivo:** tutta l'interfaccia riflette la terminologia e le meccaniche della v0.0.4a.

**8.1** Rimuovere striscia PRE/FUT/BAG dal mockup. Sostituire con indicatore Bag (composizione dadi) + stato Equipaggiamento (slot scoperti/coperti).

**8.2** Aggiungere Luce come risorsa visibile nell'HUD giocatore (icona 💡, valore numerico).

**8.3** Aggiornare popover dadi nella Sequenza — terminologia corretta (Selezione, non Presente/Futuro).

**8.4** Aggiornare testi carte — effetti e Eco allineati alla v0.0.4a (rimuovere riferimenti a carte obsolete come Scatto).

**8.5** Verifica finale coerenza: nessun riferimento residuo a v0.0.3 in tutta la UI.

**Test:** tutto il testo nell'interfaccia usa la terminologia v0.0.4a. La Luce è visibile. L'Equipaggiamento è comprensibile.

---

## Dopo Step 8 — Carte complesse (uno step per carta)

Ogni carta aggiuntiva è un mini-step indipendente:

- **Attacco Poderoso** — aggiungere Vulnerabilità self + Stordisci + Spingi
- **Diniego Sismico** — Spinta + Collisione Tattica
- **Attacco Strategico** — ricompensa per danno agli HP
- **Attacco di Fuoco** — corpo a corpo + azione indipendente Vulnerabilità Fuoco
- **Cono di Fuoco** — AOE cono, scelta direzione sulla griglia
- **Infusione Elementale** — conversione tipo dado non risolto
- **Carica Furiosa** — consumo 2 dadi, movimento lineare, danno
- **Profondità Mente** — X Presagi + X PT → X Danni Diretti
- **Manipolazione Destino** — cambio faccia dado
- **Distorsione** — spostamento unità bersaglio
- **Manovre Base** — Movimento Tattico, Colpo a Distanza, Conversione Oscura

---

*Piano v1.0 · 2026-03-04*
