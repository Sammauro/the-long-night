# THE LONG NIGHT — BRIEF DEMO GIOCABILE
**Versione:** 1.0 · **Data:** 2026-11-16
**Destinatario:** Claude Code, nel repo `Sammauro/the-long-night`
**Autore del design:** Gianmarco (Sammauro), con Project 1 "TLN — Design & Narrative"
**Documento gemello (motivazioni e numeri):** `docs/design_demo_v005.md`

> Leggi questo file per intero prima di scrivere codice. Poi leggi `CLAUDE.md`.
> Questo brief è autosufficiente: contiene tutte le regole e tutti i dati della demo.
> Dove questo brief e `CLAUDE.md` v1.3 divergono, **vale questo brief** (è più recente). I punti di divergenza sono elencati in §3.

---

## 0. Come si lavora

- Il lavoro è diviso in **8 milestone (M0–M7)**, vedi §11. Una milestone può richiedere più sessioni.
- La traccia tra le sessioni è `DEMO.md` nella root (template in §12). **All'inizio di ogni sessione leggi `DEMO.md`. Alla fine aggiornalo, poi fai commit e push.**
- Una milestone alla volta. Non iniziare la successiva finché i criteri di accettazione di quella corrente non sono verdi.
- Se una regola non è coperta da questo brief: **non interpretare, chiedi a Gianmarco.** Tutto ciò che era ambiguo è già stato deciso in §3: usa quei default senza chiedere.
- Valgono le regole operative di `CLAUDE.md` §8: `engine/` non conosce `rendering/` né `ui/`; file oltre 250 righe vanno spezzati; ogni funzione che implementa una regola cita il paragrafo di questo brief (`// BRIEF 6.4`); non mostrare codice in chat se non richiesto; push dopo ogni feature completata e verificata.

---

## 1. Obiettivo e perimetro

**Obiettivo:** una demo giocabile nel browser, pubblicata su GitHub Pages, in cui il giocatore attraversa **una stanza tutorial e tre stanze di combattimento** collegate dalla **Soglia**.

**Dentro la demo**
- Combattimento completo secondo il regolamento v0.0.4a rev.11 (§5–6).
- 16 carte, 5 dadi, 4 slot Equipaggiamento.
- 4 tipi di nemico: Zombie (esistente), Sussurratore, Falena Cinerea, Custode della Soglia (nuovi).
- Meccaniche di run nuove: **Veglia** (orologio di stanza) e **Soglia** (passaggio di stanza).
- Tutorial guidato (Stanza 0) e suggerimenti contestuali.
- Resa 2.5D: ambiente 3D in Three.js, personaggi in pixel art come billboard.
- Esportazione del log di partita.

**Fuori dalla demo**
- Esplorazione (Blocco 2), narrativa (Blocco 1), progressione, costruzione del mazzo, salvataggi di run.
- Stato Stordito applicato al giocatore (nessun nemico lo usa).
- Simulatore di bilanciamento (`src/balancing/`): verrà dopo, riusando questo motore. Le fasi 2–5 di `SIMULATOR.md` sono sostituite da questo brief.
- Audio (facoltativo in M7, solo suoni sintetizzati, nessun file).

---

## 2. Vincoli tecnici

- Three.js **r128** da CDN (cdnjs), unica dipendenza esterna. Niente npm, niente bundler, niente font esterni.
- JavaScript vanilla, **script classici** caricati in ordine da `index.html` (niente moduli ES: deve funzionare anche aperto da file).
- Un solo namespace globale `TLN` (`TLN.data`, `TLN.engine`, `TLN.input`, `TLN.render`, `TLN.ui`).
- UI in HTML/CSS sovrapposta al canvas. Desktop e mobile, click e touch gestiti insieme.
- **Tutta la casualità passa da `engine/rng.js`** (generatore con seed, es. mulberry32). Nessun `Math.random()` nel motore. Serve a tutorial, test e riproduzione dei log.
- Sviluppatore su Windows.
- Node è ammesso **solo** per eseguire i test a riga di comando (file JS semplici, zero pacchetti).

---

## 3. Decisioni già prese

Non riaprirle. Ognuna vive in un solo punto dei dati, così Gianmarco può cambiarla senza toccare la logica.

| # | Decisione | Dove sta |
|---|---|---|
| D1 | Ordine degli slot: preset `demo` (Vigore / Terrore / Vigore). Il preset `rev11` resta disponibile. | `data/equipment.js` |
| D2 | Tra le stanze: mazzo, mano, scarti, Plancia, stati si azzerano; PM tornano a 2; Luce torna a 0. HP e PT restano. | `data/run_config.js` |
| D3 | In ingresso stanza: PT = min(PT, 6). In combattimento i PT non hanno tetto. | `data/run_config.js` |
| D4 | Veglia: 6 / 6 / 7 turni. Oltre la Veglia: −1 PT a ogni Lancio. Stanza chiusa entro la Veglia: 2 Soste. | `data/rooms.js`, `data/run_config.js` |
| D5 | Fine Turno, ordine interno: Rotazione Stati → Scarto → Eco → Rotazione CD. | `engine/turn_manager.js` |
| D6 | Un dado IA per nemico vivo. Il legame si fissa al Lancio: per ogni tipo di nemico, il primo dado di quel tipo in Sequenza è del nemico con il numero di schieramento più basso, il secondo del successivo, e così via. Se un nemico muore prima che il suo dado si risolva, il dado si spegne (non passa a un altro). | `engine/dice_system.js` |
| D7 | Il bordo della mappa è un muro: una spinta verso l'esterno è una Collisione. | `engine/combat_resolver.js` |
| D8 | Gli attacchi a distanza non richiedono linea di vista: conta la gittata in caselle. | `engine/combat_resolver.js` |
| D9 | Distorsione non causa mai Collisione: il bersaglio si ferma se la casella è occupata. | `data/cards.js` |
| D10 | Manipolazione Destino resta CD 2. | `data/cards.js` |

**Divergenze da `CLAUDE.md` v1.3** (da correggere in M0, portandolo a v1.4):
- Le carte sono **16**: CD 0 = 7, CD 1 = 5, CD 2 = 4.
- Equipaggiamento: preset `demo` come default.
- Aggiungere il riferimento a questo brief e a `DEMO.md`.

**Altre regole chiarite** (valgono come scritte qui):
- Una carta a 0° resta sulla Plancia e continua a coprire lo slot fino alla Rotazione CD successiva.
- "Ruota 1 carta in CD di 90°" e "Avanza 1 carta in CD di 90°" sono lo stesso effetto: −1 al CD residuo.
- Le Azioni "1 X: effetto" sono ripetibili finché il dado ha impulsi, salvo indicazione contraria. Un'Azione senza costo si usa una volta.
- Attacco Base: la prima Azione (1 Danno gratuito) si può usare in qualunque finestra libera, anche senza dado attivo. Il bersaglio deve essere adiacente.
- Scatto richiede almeno 1 ✊. La pesca avviene una volta all'attivazione.
- Un dado convertito da Infusione Elementale è un dado Fuoco a tutti gli effetti (carte Fuoco, Colpo a Distanza; non più Movimento Tattico).
- Gli impulsi ottenuti da Conversione Oscura valgono per carte e manovre del tipo scelto.

---

## 4. Architettura

Schema invariato rispetto a `CLAUDE.md` §3:

```
input (click/touch, oppure script del tutorial)
   → TLN.input.commandBus      comandi astratti
   → TLN.engine                logica pura, nessuna grafica
   → TLN.engine.eventBus       eventi di cambiamento di stato
   → TLN.render + TLN.ui       reagiscono agli eventi
```

Il motore **non anima e non aspetta**: produce una coda di eventi. Rendering e UI li riproducono con i loro tempi.

### File

```
index.html                 carica gli script nell'ordine di src/manifest.js
style.css
CLAUDE.md  DEMO.md
src/
  manifest.js              elenco ordinato dei file (usato da index.html e dai test)
  engine/
    data/
      dice.js              §5.1
      equipment.js         §5.2
      cards.js             §5.3
      enemies.js           §5.4
      terrain.js           §5.5
      rooms.js             §5.6
      run_config.js        §5.7
      tutorial_script.js   §9.1
      hints.js             §9.2
    rng.js
    event_bus.js
    hex_grid.js            coordinate, vicini, distanza, linee, cono, percorsi
    game_state.js          stato di run e di stanza
    turn_manager.js        le 5 fasi
    dice_system.js         lancio, Sequenza, Selezione
    card_system.js         mazzo, mano, Eco, Plancia
    card_effects.js        risoluzione delle Azioni (dividere se supera 250 righe)
    combat_resolver.js     danni, stati, spinte, trappole
    ai_opponent.js         movimento e azioni nemiche
    run_manager.js         sequenza delle stanze, Veglia, Soglia
  input/
    command_bus.js
    input_handler.js
    tutorial_driver.js     blocca/guida i comandi durante la Stanza 0
  rendering/
    theme.js               tutti i parametri visivi in un posto solo
    scene.js  camera.js  lights.js
    hex_renderer.js  props.js  room_shell.js
    sprite_factory.js      da griglia di caratteri a texture
    sprites/               un file per personaggio
    unit_renderer.js  fx.js
  ui/
    combat/  ui_sequence.js  ui_selection.js  ui_cards.js  ui_plancia.js
             ui_hud.js  ui_enemy_panel.js  ui_targeting.js  ui_log.js
    run/     ui_soglia.js  ui_screens.js
    tutorial/ ui_coach.js
  balancing/
    data_collector.js      §10
tools/
  smoke.js                 test del motore senza grafica (Node)
docs/
  BRIEF_demo_claudecode.md  design_demo_v005.md
  mockups/sprites.html     pagina che mostra tutti gli sprite ingranditi
```

In M0 fai l'inventario di ciò che esiste già in `src/`. I file in `src/engine/data/` generati a giugno (`cards_combat.js`, `dice_types.js`, `enemies_zombie.js`, `levels_demo.js`) hanno uno schema più povero: **sostituiscili** con quelli di §5 e segna la sostituzione in `DEMO.md`. Non cancellare altro senza chiedere.

---

## 5. Dati

Tutti i numeri di gioco stanno in `src/engine/data/`. Nessun numero di bilanciamento nel codice di logica.

### 5.1 Dadi

| Dado | Quantità | Tipo impulso | Facce | Scartato in Selezione |
|---|---|---|---|---|
| d6 Vigore | 2 | ✊ Forza | 1,1,2,2,2,3 | +1 PM |
| d4 Fuoco | 2 | 🔥 Fuoco | 1,1,2,2 | +1 Luce |
| d8 Terrore | 1 | 🔮 Presagio | 1,1,2,2,2,3,3,4 | +1 PT |
| Dado IA | 1 per nemico vivo | — | 1,2,3,4 | — |

### 5.2 Equipaggiamento

Preset `demo` (default):

| Slot | Tipo | Dado | Ordine di copertura | Costo di recupero |
|---|---|---|---|---|
| 1 | Standard | d6 Vigore | 1° | 2 Luce |
| 2 | Standard | d8 Terrore | 2° | 1 Luce |
| 3 | Standard | d6 Vigore | 3° | 2 Luce |
| 4 | Esclusivo Fuoco | d4 Fuoco | indipendente | 1 Luce |

Preset `rev11`: Slot 1 d8 Terrore (2 Luce), Slot 2 d6 Vigore (1 Luce), Slot 3 d6 Vigore (2 Luce), Slot 4 invariato.
Il preset attivo si sceglie in `run_config.js`. Un parametro d'indirizzo `?equip=rev11` lo cambia senza toccare i file.

### 5.3 Carte (16)

Risorse: ✊ Forza, 🔥 Fuoco, 🔮 Presagio. "Adiacente" = distanza 1. Le Azioni si usano dall'alto in basso; se ne può saltare una; non si torna indietro (§6.5).

| id | Carta | Copie | CD | Slot Fuoco | Azioni (in ordine) | Eco |
|---|---|---|---|---|---|---|
| `ab` | Attacco Base | 2 | 0 | — | A1 gratis, una volta: 1 Danno a un adiacente. A2 1 ✊: 1 Danno a un adiacente. A3 1 ✊: pesca 1 carta. | +1 PM · +1 Scudo (Turno Attuale) |
| `pa` | Parata | 2 | 0 | — | A1 1 ✊: +1 Scudo (Turno Attuale). A2 1 ✊: pesca 1 carta. | +1 Contrattacco (Turno Attuale) |
| `sc` | Scatto | 1 | 0 | — | All'attivazione: pesca 1 carta. A1 1 ✊: +1 PM Salto. | +2 PM · Ruota 1 carta in CD |
| `tm` | Tiro Mirato | 1 | 0 | — | Gittata base 2. A1 1 ✊: +1 Gittata. A2 1 ✊: 1 Danno a un bersaglio in gittata. | +2 PM · Ruota 1 carta in CD |
| `pm` | Profondità Mente | 1 | 0 | — | A1 X 🔮 + X PT: X Danni Diretti a un bersaglio ovunque. | +1 PM · Ruota 1 carta in CD |
| `ds` | Diniego Sismico | 1 | 1 | — | A1 1 ✊: 1 Danno + Spingi 1 a un adiacente (Collisione). | +1 PM · Ruota 1 carta in CD |
| `af` | Attacco di Fuoco | 1 | 1 | sì | A1 1 🔥: 2 Danni Fuoco a un adiacente. A2 1 🔥: Vulnerabilità Fuoco a un adiacente (bersaglio indipendente da A1). | +1 PM · +1 Luce |
| `cf` | Cono di Fuoco | 1 | 1 | sì | A1 2 🔥: 2 Danni Fuoco a ogni nemico nel cono (gittata 3, 6 orientamenti). | +1 Luce |
| `ie` | Infusione Elementale | 1 | 1 | sì | Gratis, finestra libera: un dado giocatore non-Terrore non ancora risolto diventa Fuoco e guadagna +1 impulso. | +1 PM · Ruota 1 carta in CD |
| `di` | Distorsione | 1 | 1 | — | A1 X 🔮 + 1 PT: sposta un'unità (non te) fino a X caselle, un passo adiacente alla volta su caselle libere. Trappole attive. Nessuna Collisione. | +1 PM · pesca 1 carta |
| `ap` | Attacco Poderoso | 1 | 2 | — | A1 1 ✊: 2 Danni a un adiacente. A2 1 ✊: Stordisci un adiacente + Spingi 1. Usare la carta ti dà Vulnerabilità generica (Turno Attuale), una sola volta per attivazione. | +1 PM · +1 Luce |
| `as` | Attacco Strategico | 1 | 2 | — | A1 1 ✊: 1 Danno a un adiacente. Alla chiusura: per ogni danno arrivato agli HP, +1 PM oppure +1 Scudo (Turno Attuale), a scelta. | +1 PM |
| `cu` | Carica Furiosa | 1 | 2 | — | Gratis, finestra libera. Non usabile se sei adiacente a un nemico. Consuma 2 dadi giocatore adiacenti tra loro in Sequenza, non risolti. Muovi in linea retta fino a (somma impulsi) caselle, solo su caselle libere. Se alla fine sei adiacente a un nemico: gli infliggi danni pari alle caselle percorse. | +1 Luce |
| `md` | Manipolazione Destino | 1 | 2 | — | Gratis, finestra libera. Costa 1 PT: scegli un dado giocatore non risolto e mettilo sulla faccia che vuoi. | Ruota **tutte** le carte in CD |

**Cono (gittata 3):** date due direzioni esagonali consecutive `a` e `b`, il cono è l'insieme delle caselle `origine + i·a + j·b` con `i, j ≥ 0` e `1 ≤ i + j ≤ 3`. Sono 2 + 3 + 4 = 9 caselle. Sei orientamenti.

**Amplificazione Elementale:** un'Azione di una carta Vigore (`ab`, `pa`, `sc`, `tm`, `ds`, `ap`, `as`) si può pagare con impulsi 🔥. Se è un attacco: il danno diventa di tipo Fuoco e, se tutto il danno dell'Azione va su un solo bersaglio, +1 Danno totale.

### 5.4 Nemici

Regole comuni:
- "Muove verso il giocatore": fino a `mov` caselle sul percorso più breve; si ferma appena è adiacente (o in gittata, se ha gittata). Se non ci arriva, la parte di attacco non avviene.
- Un nemico Stordito salta la sua prossima attivazione; lo stato si consuma.
- La cura non supera gli HP massimi.

**Zombie** — HP 6 · Mov 2

| d4 | Azione | Effetto |
|---|---|---|
| 1–2 | Attacco Orda | Muove. Se adiacente: 1 Danno, +1 per ogni altro Zombie adiacente al giocatore. |
| 3 | Morso Rigenerante | Muove. Se adiacente: 2 Danni; si cura di 1 HP per ogni danno arrivato agli HP. |
| 4 | Incassare | Fermo. +2 Scudi (Turno Attuale). |

**Sussurratore** — HP 3 · Mov 2 · Gittata 3

| d4 | Azione | Effetto |
|---|---|---|
| 1–2 | Sussurro | Muove fino a essere entro gittata 3. Se in gittata: il giocatore perde 1 PT. |
| 3 | Coro | Come Sussurro, con −1 PT in più per ogni altro Sussurratore vivo. |
| 4 | Dissolvenza | Si allontana di 2 dal giocatore. +1 Scudo (Turno Attuale). |

La perdita di PT non è danno: non interagisce con Scudi, Vulnerabilità, Contrattacco.

**Falena Cinerea** — HP 3 · Mov 3 · Volo

| d4 | Azione | Effetto |
|---|---|---|
| 1–2 | Divorare | Vola adiacente al giocatore. Se adiacente: ruba 1 Luce. Se il giocatore ha 0 Luce: 1 Danno. |
| 3 | Frenesia | Vola adiacente. Se adiacente: ruba 1 Luce **e** 1 Danno. Se 0 Luce: 2 Danni. |
| 4 | Volteggiare | Si allontana di 3. Non attacca. |

Volo: si sposta su una casella libera entro 3 di distanza ignorando unità e ostacoli sul tragitto; non attiva trappole; sceglie la casella libera adiacente al giocatore più vicina, altrimenti quella che riduce di più la distanza.

**Custode della Soglia** — HP 14 · Mov 1 · Corazza 2

| d4 | Azione | Effetto |
|---|---|---|
| 1–2 | Maglio | Muove 1. Se adiacente: 3 Danni, poi Spingi 1 il giocatore in direzione opposta al Custode (Collisione, §6.8). |
| 3 | Sigillo | Aggiunge un **Sigillo** alla Plancia tra le carte standard, con CD residuo 1. Se i 3 posti standard sono pieni: il giocatore perde 1 Luce (se ne ha). |
| 4 | Baluardo | Fermo. +2 Scudi (Turno Attuale). |

- **Corazza 2:** nella fase Lancio, se la somma dei suoi Scudi è minore di 2, aggiungi Scudi (Turno Attuale) fino a 2.
- **Sigillo:** si comporta come una carta in CD (copre lo slot, scende con la Rotazione CD, subisce gli Eco di rotazione). Quando esce sparisce: non va negli scarti.
- Può essere spinto e Stordito come gli altri.

### 5.5 Terreno

| Elemento | Regola |
|---|---|
| Colonna | Ostacolo. Blocca movimento. Bersaglio valido di Collisione. |
| Braciere | Come la Colonna. In più: l'unità che subisce Collisione contro un Braciere riceve Vulnerabilità Fuoco (Turno Attuale). Emette luce. |
| Trappola | Attraversabile. Quando un'unità **entra** (movimento, spinta, Distorsione): 3 Danni Diretti, poi la trappola sparisce. Non scatta con Volo né con PM Salto. |

### 5.6 Stanze

Griglia 6 colonne × 8 righe. Esagoni a punta in alto. **Le righe dispari sono spostate di mezza casella a destra.** Coordinate `(R, E)`: riga 1–8, esagono 1–6.

Vicini di `(R, E)`: sulla stessa riga `(R, E±1)`. Se R è dispari: `(R±1, E)` e `(R±1, E+1)`. Se R è pari: `(R±1, E−1)` e `(R±1, E)`.
Consiglio: converti in coordinate assiali per distanze, linee e cono. Con `row = R−1`, `col = E−1`: `q = col − (row + (row mod 2)) / 2`, `r = row`.

Legenda mappe: `P` giocatore · `Z` Zombie · `S` Sussurratore · `F` Falena · `C` Custode · `#` Colonna · `B` Braciere · `x` Trappola

**Stanza 0 — Il Risveglio** (tutorial, nessuna Veglia)
```
R1    .   .   .   P   .   .
R2  .   .   .   .   .   .
R3    .   .   .   Z   .   .
R4  .   .   .   .   #   .
R5    .   .   .   Z   .   .
R6  .   .   .   .   .   .
R7    .   .   .   .   .   .
R8  .   .   Z   .   .   .
```
Giocatore R1E4 · Z1 R3E4 (**HP 3**) · Z2 R5E4 (HP 6) · Z3 R8E3 (HP 6) · Colonna R4E5

**Stanza 1 — La Cripta** (Veglia 6)
```
R1    .   .   .   P   .   .
R2  .   .   .   .   .   .
R3    .   .   .   .   .   .
R4  .   .   Z   .   #   Z
R5    .   .   x   .   .   .
R6  .   Z   .   #   .   Z
R7    .   .   .   Z   .   .
R8  .   .   .   .   .   .
```
Giocatore R1E4 · Zombie R4E3, R4E6, R6E2, R6E6, R7E4 · Colonne R4E5, R6E4 · Trappola R5E3

**Stanza 2 — Il Corridoio dei Sussurri** (Veglia 6)
```
R1    .   .   P   .   .   .
R2  .   .   .   .   .   .
R3    .   #   .   .   #   .
R4  x   .   Z   Z   .   .
R5    .   Z   .   .   .   x
R6  .   .   #   #   .   .
R7    .   S   .   .   S   .
R8  .   .   .   .   .   .
```
Giocatore R1E3 · Zombie R4E3, R4E4, R5E2 · Sussurratori R7E2, R7E5 · Colonne R3E2, R3E5, R6E3, R6E4 · Trappole R4E1, R5E6

**Stanza 3 — La Sala del Custode** (Veglia 7)
```
R1    .   .   P   .   .   .
R2  .   .   .   .   .   .
R3    .   .   .   x   .   .
R4  .   Z   .   .   Z   .
R5    .   B   .   .   B   .
R6  F   .   C   .   .   F
R7    .   .   .   .   .   .
R8  .   .   .   .   .   .
```
Giocatore R1E3 · Custode R6E3 · Zombie R4E2, R4E5 · Falene R6E1, R6E6 · Bracieri R5E2, R5E5 · Trappola R3E4

L'ordine di schieramento (numerazione dei nemici) è quello in cui sono elencati qui.

### 5.7 Run

| Parametro | Valore |
|---|---|
| HP iniziali / massimi | 10 / 10 |
| PT iniziali | 6 |
| PM a inizio stanza | 2 |
| Luce a inizio stanza | 0 (+2 con la Sosta "Lanterna") |
| Limite di mano | 5 |
| Tetto PT in ingresso stanza | 6 |
| Penalità Buio | −1 PT a ogni Lancio oltre la Veglia |
| Soste alla Soglia | 1; 2 diverse se la stanza è stata chiusa entro la Veglia |
| Bendarsi | +3 HP (max 10) |
| Raccogliersi | +2 PT (max 6) |
| Alimentare la lanterna | +2 Luce a inizio della prossima stanza |
| `persist` | `{ hp: true, pt: true, luce: false, cooldown: false }` |

`persist.cooldown` e `persist.luce` devono essere letti dal codice ma restano `false`: sono interruttori per esperimenti futuri.

Sequenza: Stanza 0 → Soglia → Stanza 1 → Soglia → Stanza 2 → Soglia → Stanza 3 → schermata finale. Dal menu si può partire dalla Stanza 1 saltando il tutorial.

---

## 6. Regole del motore

### 6.1 Vittoria e sconfitta
- Stanza vinta: nessun nemico vivo. Si controlla dopo ogni danno; **la stanza finisce subito**, i dadi rimasti in Sequenza si scartano senza effetto.
- Sconfitta immediata: HP ≤ 0 (Morte) oppure PT ≤ 0 (Follia). Si controlla dopo ogni variazione.
- Un pagamento in PT che porterebbe a 0 è consentito ma l'interfaccia chiede conferma.

### 6.2 Il turno: 5 fasi

**Fase 1 — Lancio**
1. Incrementa il contatore di turno. Se supera la Veglia della stanza: −1 PT (evento `BUIO`).
2. Applica Corazza ai nemici che la hanno.
3. Lancia i 5 dadi della Bag e un dado IA per ogni nemico vivo.
4. Disponi tutti i dadi in ordine casuale: è la **Sequenza Vincolata**, immutabile per il turno salvo carte che lo dicono.
5. Lega ogni dado IA al suo nemico (D6) e calcola l'azione corrispondente.

Il giocatore vede subito tutti i risultati e tutte le intenzioni.

**Fase 2 — Fine Turno** (saltata al turno 1 di ogni stanza)
1. Rotazione Stati, per ogni unità: i segnalini "Prossimo Turno" scadono; quelli "Turno Attuale" passano a "Prossimo Turno".
2. Scarto: il giocatore sceglie quali carte scartare dalla mano (anche nessuna) e in che ordine.
3. Eco: ogni carta scartata dà il suo Eco, subito, nell'ordine scelto.
4. Rotazione CD: le carte (e i Sigilli) con CD residuo 0 escono dalla Plancia (le carte vanno negli scarti); poi tutte le altre scendono di 1.

**Fase 3 — Preparazione**
1. Pesca fino ad avere 5 carte. Se il mazzo finisce, la pesca si ferma.
2. Poi rimescola gli scarti nel mazzo.

**Fase 4 — Selezione** (§6.3)

**Fase 5 — Risoluzione** (§6.4)

### 6.3 Selezione
- Il numero di dadi di un tipo che puoi tenere è pari al numero di slot di quel tipo.
- Standard: sono coperti i primi `k` slot nell'ordine di copertura, dove `k` = numero di carte e Sigilli tra le carte standard in Plancia. Lo slot Fuoco è coperto se ospita una carta.
- Tenere un dado usa uno slot del suo tipo: prima quelli scoperti (gratis), poi quelli coperti dal meno caro, pagando il costo in Luce.
- Ogni dado non tenuto è scartato e dà la sua risorsa (§5.1). Con 2 d4 Fuoco e 1 slot Fuoco, almeno un d4 viene sempre scartato.
- Le risorse da scarto sono disponibili subito e possono pagare i recuperi dello stesso turno. Il giocatore può cambiare idea liberamente fino alla conferma; la conferma è valida solo se la Luce basta.
- Alla conferma, i dadi scartati escono dalla Sequenza (il loro risultato resta consultabile).

### 6.4 Risoluzione
I dadi si risolvono da sinistra a destra.

- **Finestra libera:** prima del primo dado, tra un dado e l'altro, dopo l'ultimo. Il giocatore può muoversi (PM), giocare carte gratuite (`ie`, `md`, `cu`) e usare l'Azione gratuita di `ab`.
- **Dado giocatore attivo:** mette a disposizione impulsi pari al valore. Il giocatore può spenderli su Azioni di carte e manovre base, in qualunque combinazione, e può anche muoversi. Gli impulsi non spesi si perdono quando passa al dado successivo.
- **Dado IA:** il nemico legato esegue la sua azione. Il giocatore non può intervenire durante l'azione. Se il nemico è morto, il dado è spento.
- **Nessuna somma tra dadi:** il costo di una singola Azione si paga con impulsi di un solo dado.

Manovre base:

| Manovra | Dado | Costo | Effetto |
|---|---|---|---|
| Movimento Tattico | Vigore | 1 ✊ | +1 PM |
| Colpo a Distanza | Fuoco | 1 🔥 | 1 Danno Fuoco a un bersaglio entro 3 |
| Conversione Oscura | Terrore | 1 🔮 + 1 PT per impulso | 1 impulso ✊ oppure 🔥. Se 🔥: +1 PT una volta per attivazione. |

### 6.5 Carte
- **Aprire una carta:** dalla mano. Se costa impulsi, serve un dado attivo che li fornisca. Se ha CD ≥ 1, serve un posto libero in Plancia: una carta Fuoco può usare lo slot Fuoco o un posto standard; le altre solo un posto standard (massimo 3).
- **Azioni:** dall'alto in basso. Si può saltare un'Azione; non si torna a una precedente.
- **Chiudere una carta:** lo decide il giocatore, oppure avviene da sé se si muove o apre un'altra carta. Alla chiusura la carta va negli scarti (CD 0) o in Plancia con il suo CD. Una carta aperta su cui non è stata usata nessuna Azione si può annullare e torna in mano.
- **Carte Fuoco in Plancia:** vanno nello slot Fuoco se è libero, altrimenti tra le standard.
- **Pescare:** dalla cima del mazzo; se è vuoto la pesca fallisce. Le carte pescate in Risoluzione sono giocabili subito.

### 6.6 Danni e stati
Ordine di calcolo per un danno non Diretto:
1. Vulnerabilità: ×2 per ogni segnalino del tipo giusto. La generica vale per i danni non elementali; quella Fuoco solo per i danni Fuoco.
2. Scudi: ogni Scudo assorbe 1. Si consumano prima quelli "Prossimo Turno", poi "Turno Attuale". L'uso è obbligatorio.
3. Il resto va agli HP.

- **Danno Diretto:** va agli HP. Ignora Scudi e Vulnerabilità.
- **Contrattacco** (solo giocatore): per ogni segnalino, quando un attacco nemico gli toglie HP, la fonte subisce lo stesso danno (normale, assorbibile). Il segnalino non si consuma; scade con la Rotazione Stati.
- **Stordito:** vedi §5.4.
- Tutti gli stati hanno due aree, "Turno Attuale" e "Prossimo Turno", e ruotano come in §6.2.

### 6.7 Movimento del giocatore
- 1 PM = 1 casella libera. I PM non spesi si conservano tra i turni della stessa stanza.
- Se all'inizio di un movimento sei adiacente a un nemico, il primo passo costa 2 PM.
- **PM Salto:** un passo pagato con PM Salto attraversa una casella occupata (nemico, ostacolo, trappola) senza effetti. Non ci si può fermare su una casella occupata. I PM Salto non usati si perdono a fine turno.
- Entrare in una trappola la fa scattare.

### 6.8 Spinte e Collisione
- Le tre caselle "di allontanamento" sono i vicini del bersaglio più lontani dalla fonte rispetto al bersaglio stesso. Possono essere libere, occupate, oppure fuori mappa (muro, D7).
- **Spinta del giocatore:** sceglie lui una delle tre. Se è libera, il bersaglio ci entra. Se è occupata o è muro: Collisione.
- **Spinta di un nemico:** direzione opposta alla fonte, in linea retta. Stessa regola.
- **Collisione (Spingi 1):** il bersaglio resta dov'è e subisce 1 Danno. Se ha urtato un'unità, anche quella subisce 1 Danno. Se ha urtato un Braciere: Vulnerabilità Fuoco.

### 6.9 Movimento dei nemici
- Percorso più breve verso una casella valida (adiacente al giocatore, o entro gittata). Non attraversano ostacoli, altri nemici, il giocatore.
- A parità di lunghezza la scelta è casuale (via `rng`).
- Se non esiste alcun percorso, il nemico non si muove; attacca comunque se il giocatore è già a portata.
- I nemici non evitano le trappole.
- "Si allontana di N": N passi, ognuno su una casella libera che aumenta la distanza dal giocatore; si ferma se non ce ne sono.

---

## 7. Interfaccia

Layout di `CLAUDE.md` §7: griglia al centro, Sequenza tra griglia e mano, mano in basso, HUD ai lati.

**Principio guida:** il giocatore deve poter prevedere il turno intero guardando lo schermo. Ogni informazione che serve al puzzle è visibile senza clic.

| Zona | Contenuto |
|---|---|
| HUD sinistro | HP, PT, PM (e PM Salto), Luce, candela della Veglia, turno |
| Plancia | 4 slot con dado e costo; carte in CD **ruotate davvero** di 90°/180°; Sigilli; **anteprima "prossimo turno: bloccati"** |
| Sequenza | Dadi in fila. Giocatore: colore del tipo e valore. IA: ritratto del nemico, icona dell'azione, valore. Stato: attivo, risolto, spento. |
| Pannello nemici | Elenco con HP, Scudi, stati. Selezionandone uno: scheda completa con la tabella d4. |
| Mano | Carte con due zone distinte: Azioni sopra, Eco sotto (fascia di colore diverso). |
| Registro | Log testuale degli eventi, copiabile. |

Comportamenti richiesti:
- **Passare sopra (o toccare) un dado IA** evidenzia il nemico, mostra il percorso previsto e il danno che farebbe **adesso**. Si aggiorna se il giocatore si sposta.
- **Selezione:** ogni dado mostra "libero", "N Luce" o "nessuno slot". Contatori di Luce, PM, PT aggiornati in tempo reale. Conferma disattivata se la Luce non basta.
- **Fine Turno:** si scelgono le carte da scartare; l'anteprima mostra la somma degli Eco prima di confermare.
- **Bersagli:** caselle raggiungibili con costo in PM; bersagli validi di un'Azione; anteprima del cono nei 6 orientamenti; le tre caselle di spinta con indicazione "Collisione".
- **Dado attivo:** impulsi rimasti sempre visibili. "Dado successivo" chiede conferma se restano impulsi.
- **Finestra prima di un dado IA:** breve pausa con pulsante "Continua". Opzione "continua da solo se non ho PM né carte gratuite" (attiva di default).
- **Annulla:** si può annullare un movimento finché non ha rivelato nulla e non ha fatto scattare nulla. Le Azioni non si annullano.
- Tasti: spazio = continua / dado successivo; esc = annulla selezione.
- Mobile: orientamento orizzontale; tocco prolungato = dettaglio; nessuna azione dipende dal passaggio del puntatore.

Colori (base da `CLAUDE.md` §7, più gli accenti di tipo):
```css
--bg-deep:#151519; --bg-card:#16141c; --bg-panel:#1c1a24; --border:#2e2a3e;
--text:#e8e0d0; --text-muted:#8a7f9a; --gold:#c9a84c; --red:#b84040; --blue:#4a8fbd;
--vigore:#c9a84c; --fuoco:#e0703a; --terrore:#9a5fd0; --luce:#f2e2a0; --nemico:#b84040;
```
Il nero domina. I colori vivi sono solo accenti.

---

## 8. Resa visiva: 2.5D

Ambiente in 3D reale, personaggi in pixel art. Tutti i parametri in `rendering/theme.js`.

### 8.1 Scena
- **Camera:** ortografica, inclinata dall'alto (circa 50°), righe della griglia parallele allo schermo. Fissa, con un respiro appena percettibile. Scossa breve sui colpi.
- **Esagoni:** prismi a sei lati con spessore, pietra scura, piccole variazioni di altezza e tono. Bordo luminoso per: raggiungibile (blu), bersaglio (rosso), cono (ambra), selezione (oro).
- **Guscio della stanza:** pareti basse sul perimetro, una **porta** sul lato lontano (R8). A stanza vinta la porta si illumina: è la Soglia.
- **Oggetti:** Colonna (cilindri sovrapposti, cima spezzata); Braciere (ciotola, luce puntiforme tremolante, scintille); Trappola (piastra incassata con glifo che pulsa).
- **Luci:** ambiente freddo e basso; nebbia scura. **Lanterna del giocatore:** luce puntiforme il cui raggio e intensità crescono con la risorsa Luce (definisci la curva in `theme.js`; a Luce 0 resta un alone minimo). I nemici fuori dal raggio sono sagome scure con gli occhi accesi.
- **Buio:** quando la Veglia finisce, la luce ambiente cala e la vignettatura si stringe.
- Niente post-processing da librerie aggiuntive: vignettatura, grana e righe di scansione si fanno in CSS sopra il canvas.

### 8.2 Sprite
- Ogni personaggio è un file in `rendering/sprites/` con: dimensioni, palette (carattere → colore), fotogrammi (righe di caratteri).
- `sprite_factory.js` li disegna su canvas e crea texture con filtro *nearest*. Billboard rivolti alla camera, con ombra a terra.
- Formato: 32×48 px per giocatore, Zombie, Sussurratore; 32×32 per la Falena; 48×64 per il Custode. 2 fotogrammi di attesa ciascuno.
- **Animazione per trasformazione, non per numero di fotogrammi:** oscillazione in attesa, affondo verso il bersaglio e ritorno, lampo bianco e scossa quando colpiti, dissolvenza con piccola esplosione di particelle alla morte. Numeri di danno che salgono.
- Tre o quattro toni per sprite, contorno scuro, un solo accento luminoso. La sagoma deve leggersi a colpo d'occhio.

| Sprite | Sagoma | Accento |
|---|---|---|
| Indagatore | Cappotto lungo, cappello, lanterna in mano | Oro della lanterna |
| Zombie | Curvo, braccia asimmetriche | Occhi rossi |
| Sussurratore | Alto, sottile, incappucciato, sospeso; veste a brandelli, niente gambe | Viola nel vuoto del volto |
| Falena Cinerea | Ali color cenere, due fotogrammi di battito | Macchie ambra sulle ali |
| Custode della Soglia | Massa larga, piastre; due placche = Corazza | Glifo-sigillo sul petto |

- `docs/mockups/sprites.html` mostra tutti gli sprite ingranditi, su fondo scuro, con i due fotogrammi affiancati: serve a Gianmarco per rivederli senza avviare il gioco.
- Gli sprite devono poter essere sostituiti in futuro da immagini vere cambiando solo il file dello sprite.

### 8.3 Decisioni visive chiuse
Sprite 32×48 · camera fissa con respiro · Plancia separata con carte ruotate · UI poco diegetica (disturbi e tremolio del testo solo con PT ≤ 2) · dadi che rotolano per meno di mezzo secondo, saltabile.

---

## 9. Tutorial e suggerimenti

### 9.1 Stanza 0 — script
Nei primi tre turni dadi, ordine della Sequenza, pesca e un movimento nemico sono fissati dallo script (`tutorial_script.js`). `tutorial_driver.js` lascia passare solo il comando atteso a ogni passo guidato. Dal turno 4 tutto torna casuale. Pulsante "Salta tutorial" sempre visibile.

**Mazzo preparato:** mano iniziale Attacco Base, Parata, Scatto, Diniego Sismico, Attacco di Fuoco. In cima al mazzo, nell'ordine: Attacco Base, Parata, Attacco Strategico. Il resto mescolato.

**Dadi fissati** (in ordine di Sequenza, prima della Selezione):

| Turno | Sequenza |
|---|---|
| 1 | ✊2 · IA Z1 = 1 (Orda) · 🔥1 · 🔥2 · 🔮3 · ✊1 · IA Z2 = 2 (Orda) · IA Z3 = 4 (Incassare) |
| 2 | ✊3 · 🔮2 · IA Z2 = 3 (Morso) · IA Z3 = 1 (Orda) · 🔥2 · 🔥2 · ✊1 |
| 3 | ✊2 · 🔥2 · 🔥1 · IA Z3 = 2 (Orda) · 🔮1 · ✊2 |

**Movimento fissato:** turno 1, Z2 percorre R5E4 → R4E4 → R3E4.

**Passi guidati**

| # | Momento | Testo | Azione attesa |
|---|---|---|---|
| 1 | T1 Lancio | "Questa è la Sequenza. I tuoi dadi e quelli dei nemici si risolvono da sinistra a destra. Tocca un teschio per vedere cosa farà quel nemico." | Tocca un dado IA |
| 2 | T1 Selezione | "Scegli quali dadi tenere. Hai un solo slot Fuoco: tieni il 🔥2. L'altro si scarta e ti dà 1 Luce." | Tieni ✊2, ✊1, 🔥2 |
| 3 | T1 Selezione | "Scarta anche il dado Terrore: +1 PT. Imparerai a usarlo più avanti." | Conferma |
| 4 | ✊2 attivo | "Hai 2 PM. Spostati sulla casella evidenziata." | Muovi a R2E4 |
| 5 | ✊2 attivo | "Attacco Base: 1 danno gratis, poi 1 danno per ogni ✊. Colpisci lo Zombie." | `ab` su Z1: 3 danni, Z1 cade |
| 6 | Dado di Z1 | "Z1 è caduto prima del suo dado: l'azione è annullata. Colpire al momento giusto è la tua difesa migliore." | Continua |
| 7 | 🔥2 attivo | "Colpo a Distanza: 1 danno per 🔥, fino a 3 caselle. Colpisci Z2 due volte." | 2 danni a Z2 |
| 8 | ✊1 attivo | "Il prossimo dado è di Z2 e sta per colpirti. Gioca Parata: +1 Scudo." | `pa`, 1 Scudo |
| 9 | Dado di Z2 | "Lo Scudo ha assorbito il colpo." | Continua |
| 10 | T2 Fine Turno | "Prima di pescare puoi scartare carte per il loro Eco. Scarta Scatto: +2 PM." | Scarta `sc` |
| 11 | T2 Selezione | "Tieni ✊3, ✊1 e un 🔥2." | Conferma |
| 12 | ✊3 attivo | "Diniego Sismico: 1 danno e una spinta per ogni ✊. Spingi Z2 contro la colonna: la Collisione aggiunge 1 danno." | `ds` su Z2 verso R4E5, due volte: Z2 cade |
| 13 | Chiusura `ds` | "Diniego Sismico ha Cooldown 1: va sulla Plancia e copre lo Slot 1. Al prossimo turno uno dei tuoi d6 sarà bloccato." | Continua (il resto del turno è libero) |
| 14 | T3 Selezione | "Lo Slot 1 è coperto: un ✊ è gratis, l'altro costa 2 Luce. Pagali per tenerlo." | Tieni entrambi i ✊ |
| 15 | T3 Risoluzione | "Ora tocca a te. Elimina l'ultimo Zombie." | Gioco libero |
| 16 | Soglia | "Mazzo e Plancia si azzerano. HP e PT restano. Scegli una Sosta." | Scegli |

Verifica attesa dello script: a fine T1 Z1 morto, Z2 a 4 HP in R3E4, giocatore a 10 HP, PM 1, Luce 1, PT 7; a fine passo 12 Z2 morto (il suo dado Morso si spegne) e 1 ✊ ancora da spendere; al passo 14 Luce ≥ 3 e un solo posto standard occupato da `ds` con CD residuo 0.

### 9.2 Suggerimenti contestuali
Compaiono una sola volta, alla prima occorrenza dell'evento. Testi in `hints.js`.

| Evento | Testo |
|---|---|
| Primo Sussurro | "Il Sussurratore non tocca i tuoi HP: consuma i PT. A 0 PT è Follia. Scartare il dado Terrore ti ridà 1 PT." |
| Primo Coro | "Più Sussurratori, più forte il Coro. Abbattine uno per spezzarlo." |
| Prima carta 🔮 in mano con Sussurratore vivo | "Profondità Mente colpisce ovunque. Distorsione può trascinare un nemico su una trappola." |
| Prima Luce rubata | "La Falena mangia la tua Luce. Se non ne hai, morde." |
| Primo Sigillo | "Il Sigillo occupa uno slot come una carta in Cooldown. Un Eco che ruota le carte lo toglie prima." |
| Corazza che assorbe | "La Corazza del Custode torna a 2 ogni turno. Danni Diretti e Vulnerabilità la superano." |
| Ultima tacca della Veglia | "La candela sta finendo. Al Buio perderai 1 PT a ogni turno." |
| Primo slot coperto fuori dal tutorial | "Dado bloccato: paga Luce, aspetta, oppure scarta una carta con Eco di rotazione." |
| Tre posti standard pieni | "Plancia piena: questo turno puoi giocare solo carte senza Cooldown." |

---

## 10. Log di partita

`balancing/data_collector.js` ascolta l'`eventBus` e costruisce un log della run. Alla schermata finale (vittoria o sconfitta) due pulsanti: "Copia riepilogo" (testo, da incollare su Notion) e "Scarica log" (JSON).

Per ogni turno registra almeno: stanza, turno, seed; Sequenza lanciata; posti di Plancia occupati e slot coperti; Luce disponibile; per ogni dado coperto se è stato **pagato, scartato o lasciato**; carte scartate per Eco; carte giocate; danni fatti e subiti; PT persi e per quale causa; HP, PT, Luce, PM a fine turno.
Per ogni stanza: turni, esito rispetto alla Veglia, Soste scelte.

Questo dato (pagare Luce o aspettare) è quello che mancava nei playtest precedenti.

---

## 11. Milestone

Ogni milestone finisce con `DEMO.md` aggiornato, commit e push.

**M0 — Ricognizione e scheletro**
Inventario del repo; struttura cartelle; `manifest.js`; `index.html` che carica gli script; `rng.js`, `event_bus.js`, `command_bus.js`; `DEMO.md`; `CLAUDE.md` portato a v1.4 (§3).
*Fatto quando:* la pagina si apre senza errori in console; `DEMO.md` elenca cosa c'era e cosa è stato sostituito.

**M1 — Dati**
Tutti i file di `src/engine/data/` secondo §5 e §9.
*Fatto quando:* `tools/smoke.js` verifica: 16 carte (7/5/4 per CD); 5 dadi; 4 stanze senza due elementi sulla stessa casella e senza coordinate fuori griglia; ogni tabella d4 copre 1–4.

**M2 — Motore senza grafica**
Griglia, stato, turno, dadi, Selezione, carte, Plancia, danni, stati, spinte, trappole, IA dei 4 nemici, Veglia, Soglia, sequenza delle stanze.
*Fatto quando:* `node tools/smoke.js` gioca 300 partite per stanza con un giocatore che sceglie a caso tra le mosse legali, senza eccezioni, e a ogni passo valgono questi invarianti: le carte tra mazzo, mano, scarti e Plancia sono sempre 16; mai più di 3 carte standard e 1 nello slot Fuoco; HP ≤ 10; nessuna unità su casella occupata o fuori griglia; la stessa partita con lo stesso seed produce lo stesso log. In più, casi mirati: Collisione contro colonna, bordo e unità; trappola con spinta e con Distorsione; Vulnerabilità prima degli Scudi; Danno Diretto; dado IA spento; Corazza; Sigillo con Plancia libera e piena; Buio; tetto PT alla Soglia; lo script del tutorial arriva agli stati attesi di §9.1.

**M3 — Scena 2.5D**
Scena, camera, luci, esagoni, guscio, oggetti, sprite, lanterna legata alla Luce, `sprites.html`.
*Fatto quando:* le 4 stanze si vedono correttamente con tutte le unità al loro posto; la lanterna cambia al variare della Luce; 60 fotogrammi al secondo su desktop.

**M4 — Combattimento giocabile**
Tutta l'interfaccia di §7, collegata al motore tramite comandi ed eventi.
*Fatto quando:* la Stanza 1 si gioca dall'inizio alla fine con mouse e con tocco, senza usare la console; ogni carta è giocabile; l'anteprima dei dadi IA è corretta.

**M5 — Run**
Soglia, Veglia a schermo, tre stanze in sequenza, schermate iniziale e finale, log (§10).
*Fatto quando:* si completa la run Stanza 1 → 3; il log scaricato contiene i campi di §10.

**M6 — Tutorial**
Stanza 0 guidata e suggerimenti contestuali.
*Fatto quando:* una persona che non conosce il gioco arriva alla Soglia seguendo solo i testi; "Salta tutorial" funziona; ogni suggerimento compare una volta sola.

**M7 — Rifinitura e pubblicazione**
Animazioni, riscontri visivi, passata mobile, prestazioni, pubblicazione su GitHub Pages.
*Fatto quando:* la demo è online all'indirizzo di `CLAUDE.md`; funziona su un telefono in orizzontale.

**Controllo visivo.** Alla fine di M3, M4 e M7: se in sessione hai uno strumento per aprire la pagina e guardarla, usalo e correggi ciò che vedi. Se non lo hai, scrivi in `DEMO.md` l'elenco preciso di cosa Gianmarco deve controllare a occhio.

---

## 12. `DEMO.md` — template

```markdown
# THE LONG NIGHT — DEMO
Brief: docs/BRIEF_demo_claudecode.md (v1.0)

## Stato milestone
| # | Milestone | Stato | Note |
|---|---|---|---|
| M0 | Ricognizione e scheletro | ⬜ | |
| M1 | Dati | ⬜ | |
| M2 | Motore senza grafica | ⬜ | |
| M3 | Scena 2.5D | ⬜ | |
| M4 | Combattimento giocabile | ⬜ | |
| M5 | Run | ⬜ | |
| M6 | Tutorial | ⬜ | |
| M7 | Rifinitura e pubblicazione | ⬜ | |

## Prossimo passo
(una frase: cosa fare all'inizio della prossima sessione)

## Sessioni
### Sessione N — AAAA-MM-GG
- Fatto:
- File toccati:
- Verifiche eseguite e risultato:
- Problemi aperti:

## Domande per Gianmarco
(regole non coperte dal brief; non procedere su questi punti senza risposta)

## Da controllare a occhio
(elenco per il controllo visivo)

## Scostamenti dal brief
(qualunque cosa fatta diversamente, con il motivo)
```

---

*The Long Night — Brief demo v1.0 · 2026-11-16*
