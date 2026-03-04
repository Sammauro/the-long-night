# THE LONG NIGHT — CLAUDE.md
*Ultimo Aggiornamento: 2026-03-04 | Versione: v1.4*

> **LEGGI QUESTO FILE INTERO prima di toccare qualsiasi codice.**
> Source of truth regole di gioco: `docs/regole_v0041a.md`
> In caso di dubbio sulle regole: chiedi conferma, non interpretare.

---

## 1. Il Progetto

**The Long Night (TLN)** è un gioco tattico/narrativo in tre blocchi:
- **Blocco 3 — Combat** (in sviluppo): tattico a turni su griglia esagonale
- **Blocco 2 — Esplorazione** (pianificato): mappa open con dungeon stile Zelda
- **Blocco 1 — Narrativa** (pianificato): adventure testuale con mostro-impiegato

**Repository:** https://github.com/Sammauro/the-long-night
**Account GitHub:** Sammauro
**Deploy pubblico:** https://sammauro.github.io/the-long-night

---

## 2. Stack Tecnico

- **Rendering:** Canvas 2D — zero npm, zero bundler, zero Three.js
- **UI:** HTML/CSS sovrapposto al canvas
- **Linguaggio:** Vanilla JavaScript — zero framework
- **Entry point:** `index.html` nella root (GitHub Pages)
- **Compatibilità:** browser desktop + mobile (touch e click gestiti in modo unificato)
- **OS sviluppatore:** Windows

---

## 3. Architettura — Pattern Fondamentale

```
INPUT (giocatore click/touch oppure AI di bilanciamento)
        ↓
  input/command_bus.js     ← traduce tutto in comandi astratti
        ↓
  engine/                  ← logica di gioco pura (zero grafica)
        ↓
  engine/event_bus.js      ← emette eventi quando lo stato cambia
        ↓
  rendering/ + ui/         ← si aggiornano in risposta agli eventi
```

**Regola assoluta:** `engine/` non importa mai nulla da `rendering/` o `ui/`. Mai.
Se questo accade è un bug architetturale — fermati e correggi prima di andare avanti.

**Perché questa separazione:**
L'AI di bilanciamento (`balancing/sim_agent.js`) deve poter giocare migliaia di partite chiamando solo `engine/` — senza aprire nessuna finestra grafica. Il giocatore umano fa esattamente le stesse chiamate tramite `input_handler.js`. Il game engine non sa mai chi lo sta chiamando.

---

## 4. Struttura del Repo

```
the-long-night/
│
├── index.html                    ← shell: carica CSS e moduli JS  ✅ Step 1
├── style.css                     ← tutto lo stile UI in un file unico  ✅ Step 1
├── CLAUDE.md                     ← questo file
│
├── src/
│   ├── engine/                   ← LOGICA DI GIOCO PURA (zero grafica, zero input)
│   │   ├── data/                 ← dati statici separati per categoria
│   │   │   ├── levels_demo.js    ← configurazione scenario demo  ✅ Step 1
│   │   │   ├── cards_combat.js   ← le 13 carte del combat system v0.0.4a
│   │   │   ├── enemies_zombie.js ← scheda nemico Zombie
│   │   │   └── dice_types.js     ← definizioni e facce dei dadi
│   │   ├── hex_grid.js           ← coordinate esagonali, distanze, pathfinding  ✅ Step 1
│   │   ├── event_bus_contract.js ← emette eventi quando lo stato cambia  ✅ Step 0
│   │   ├── gamedata.js           ← aggrega data/ e lo esporta
│   │   ├── game_state.js         ← stato partita: HP/PT/PM/Luce, Bag, Equipaggiamento
│   │   ├── turn_manager.js       ← orchestra le 4 fasi del turno
│   │   ├── dice_system.js        ← lancio dadi, Selezione, Sequenza Vincolata
│   │   ├── card_system.js        ← effetti carte, cooldown, eco
│   │   ├── combat_resolver.js    ← danni, stati, collisioni, spinte
│   │   └── ai_opponent.js        ← comportamento nemici (zombie AI)
│   │
│   ├── balancing/                ← AI DI BILANCIAMENTO (usa solo engine/)
│   │   ├── sim_runner.js         ← esegue N partite automatiche
│   │   ├── sim_agent.js          ← agente AI che gioca usando engine/
│   │   └── data_collector.js     ← raccoglie e serializza dati
│   │
│   ├── input/                    ← GESTIONE INPUT (astrae click/touch/AI)
│   │   ├── input_handler.js      ← unifica eventi mouse, touch, keyboard
│   │   └── command_bus_contract.js ← lista comandi disponibili e dispatcher  ✅ Step 0
│   │
│   ├── rendering/                ← CANVAS 2D (solo rendering griglia e sprite)
│   │   ├── scene.js              ← setup canvas: pan, zoom, resize  ✅ Step 1
│   │   └── hex_renderer.js       ← disegna griglia isometrica e personaggi  ✅ Step 1
│   │
│   └── ui/                       ← HTML/CSS OVERLAY
│       └── combat/
│           ├── ui_sequence.js    ← striscia Sequenza Vincolata
│           ├── ui_cards.js       ← carte in mano
│           ├── ui_hud.js         ← HP, PT, PM, Luce, risorse
│           └── ui_dice_panel.js  ← Plancia Cooldown
│
├── docs/
│   ├── regole_v0041a.md          ← SOURCE OF TRUTH regole di gioco
│   ├── piano_sviluppo.md         ← piano incrementale dettagliato
│   └── mockups/
│       └── ui_mockup_v4.html     ← riferimento visivo congelato (NON la UI finale)
│
└── _archive/
    └── python/                   ← vecchio codice Python (solo riferimento)
        ├── hex_utils.py          ← geometria esagonale — recuperabile quasi 1:1
        ├── game_state.py         ← solo struttura cooldown board come riferimento
        ├── gamedata.py           ← solo facce dadi e costanti mappa
        └── player_game.py        ← solo pattern effect handler come riferimento
```

### Contratti tra moduli (Step 0)

I file `event_bus.js` e `command_bus.js` contengono sia il codice funzionante sia il **catalogo completo** degli eventi e comandi come commenti strutturati. Questi cataloghi sono il contratto di comunicazione tra tutti i moduli:

- **event_bus.js** — lista tutti gli eventi che `engine/` può emettere. `rendering/` e `ui/` ascoltano solo questi eventi.
- **command_bus.js** — lista tutti i comandi che `input/` e `balancing/` possono chiamare.

**Regola:** prima di creare un nuovo modulo, verifica che gli eventi che emette e i comandi che chiama siano nel catalogo. Se mancano, aggiorna il contratto e chiedi approvazione.

### Regola di scalabilità
- **Nuova carta:** aggiungi a `data/cards_combat.js`
- **Nuovo nemico:** crea `data/enemies_[nome].js`, aggiorna `gamedata.js`
- **Nuova stanza/livello:** crea `data/levels_[nome].js`, aggiorna `gamedata.js`
- **Nuovo blocco di gioco:** crea `engine_exploration/` e `ui/exploration/` — non toccare nulla di `engine/`
- **Se un file supera 250 righe:** è un segnale che fa troppe cose, spezzalo

---

## 5. Layout Visivo

### Riferimento visivo
**File:** `docs/mockups/ui_mockup_v4.html`

Mockup di esplorazione — definisce macro-layout e comportamenti UI. **NON è la UI da implementare direttamente.** La palette definitiva e gli asset reali verranno definiti in una fase successiva. Rispetta struttura e interazioni, non i colori né le forme degli sprite.

### Principi congelati
- Griglia esagonale isometrica low-angle, schermo pieno, pan e zoom liberi
- UI completamente floating — zero sfondi opachi, zero bordi che separano zone
- Sprite 2D a figura intera con ombra ellittica sotto i piedi
- Dadi: striscia orizzontale ultra-compatta
- Sequenza vincolata: dado attivo si alza, dado usato grigio, hover = popover dettaglio
- Carte: si allargano al hover mostrando testo effetto completo
- Azioni nemici: integrate nella sequenza vincolata, dettaglio su hover
- Message strip: quasi invisibile di default
- Layout landscape obbligatorio

### Palette provvisoria
```css
--bg-void:   #04040e;
--cyan:      #00e5ff;
--violet:    #b44fff;
--acid:      #39ff14;
--red:       #ff2d2d;
--gold:      #ffaa00;
--text:      #c8d8e8;
--muted:     #4a5570;
```

**Compatibilità mobile:** landscape obbligatorio.
Nessun hover-only interaction — tutto deve funzionare con tap.

---

## 6. Terminologia Ufficiale

Usare SEMPRE questi nomi nel codice, commenti e variabili:

| Termine di gioco | JS | Note |
|---|---|---|
| Bag | `diceBag` | Arsenale dadi — unico pool |
| Selezione | `diceSelection` | Fase scelta dadi dopo il lancio |
| Sequenza Vincolata | `sequence` | Ordine dadi per la Fase 4 |
| Turno Attuale | `currentTurn` | Stati acquisiti questo turno |
| Prossimo Turno | `nextTurn` | Stati che scadono a fine turno |
| Dado Vigore | `VIGOR` | Fisico — Forza ✊ |
| Dado Fuoco | `FIRE` | Elementale — Fuoco 🔥 |
| Dado Terrore | `TERROR` | Mentale — Presagio 🔮 |
| Presagio | `presagio` | Impulso del Dado Terrore |
| Luce | `light` | Risorsa per recupero slot CD |
| Eco | `eco` | Effetto scarto carta |
| Equipaggiamento | `equipment` | Slot che determinano dadi accessibili |

---

## 7. Regole Operative

### Regola fondamentale — regole di gioco
Non interpretare mai le regole di gioco autonomamente.
Se qualcosa in `docs/regole_v0041a.md` è ambiguo, fermati e chiedi.
Le regole su una carta hanno sempre la precedenza sul manuale generale.

### Commenti nel codice
Ogni funzione che implementa una regola cita la sezione:
```javascript
// REGOLA 3.2 — Dado Vigore: genera impulsi Forza pari al risultato del lancio
// REGOLA 5.3 — Fase 3: impulsi non spesi vanno persi, non si accumulano
```

### Procedure code
Il proprietario del progetto non è uno sviluppatore. Non mostrare codice salvo richiesta esplicita. Lavora feature per feature: completa, testa, fai push, comunica solo il risultato funzionale e il link GitHub Pages per il test. Le decisioni bloccanti si risolvono in Project 1 su Claude.ai.

### Un file, una responsabilità
`gamedata.js` aggrega dati, non contiene logica.
`turn_manager.js` orchestra, non implementa.
`hex_grid.js` fa solo geometria esagonale.

### Aggiornare CLAUDE.md
Ogni volta che crei un nuovo file o cambi l'architettura, aggiorna la sezione 4.

---

## 8. Multi-Agente (Strategia Graduale)

**Fase attuale (setup + combat):** un agente solo — Claude Code classico.
L'architettura deve essere stabile prima di parallelizzare.

**Quando introdurre multi-agente (Blocco 2 in poi):**
- Agente Engine → `src/engine_exploration/`
- Agente UI/Front → `src/ui/exploration/` + stile
- Agente Balancing → `src/balancing/` con nuovi scenari

**Condizione necessaria:** `event_bus.js` e `command_bus.js` stabili e documentati prima di avviare agenti paralleli.

---

## 9. Workflow GitHub

### Configurazione Claude Code
- Cartella locale: `C:\Users\gc048\OneDrive - RINA S.p.A\Documents\Personale\TLN`
- Remote configurato con Fine-grained token (repo: the-long-night, permessi: Contents read/write)
- Push funzionante — nessuna credenziale richiesta a runtime
- **Importante:** fare sempre `git pull` prima di aprire Claude Code se si sono fatte modifiche via browser

### Deploy
Ogni push su `main` aggiorna automaticamente il sito pubblico.
Claude Code fa push dopo ogni step completato e testato.

### Naming Convention Commit
- `BACKUP: pre-[feature]` — prima di modifiche grosse
- `STABLE: v0.X` — versione testata e funzionante
- `FEAT: [nome]` — nuova feature
- `FIX: [descrizione]` — bugfix

### Ripristino
Se qualcosa si rompe: github.com/Sammauro/the-long-night → Commits → scegli commit stabile → Revert.
Chiedere sempre conferma prima di ripristinare.

---

## 10. Protocollo Sessioni

### "salva sessione"
Crea/aggiorna `SESSION_RESUME.md`:
```markdown
# SESSION RESUME
*Aggiornato: [data]*

## Obiettivo Sessione
## Completato
## In Corso (se interrotto)
- File: [nome], funzione: [nome]
- Stato: [cosa funziona, cosa manca]
## Prossimi Step
## File Modificati
## Note
```

### "riprendi sessione"
1. Leggi `SESSION_RESUME.md`
2. Leggi questo `CLAUDE.md`
3. Riassumi in 3-5 righe dove eravamo
4. Chiedi conferma prima di continuare

---

## 11. Fasi di Sviluppo

**Piano dettagliato completo:** `docs/piano_sviluppo.md`

Ogni step fa push su GitHub Pages ed è verificabile visivamente. Non si passa al successivo senza approvazione.

**STEP 0 — Contratti** ✅
- [x] Struttura cartelle repo
- [x] `event_bus.js` con catalogo eventi
- [x] `command_bus.js` con catalogo comandi
- [x] Aggiornamento CLAUDE.md

**STEP 1 — Griglia esagonale** ✅
- [x] `hex_grid.js` (da hex_utils.py)
- [x] `data/levels_demo.js`
- [x] `index.html` + `style.css`
- [x] `rendering/scene.js` (canvas, pan, zoom)
- [x] `rendering/hex_renderer.js` (griglia, sprite, ostacoli)

**STEP 2 — Stato e HUD**
- [ ] `game_state.js`
- [ ] `data/enemies_zombie.js`
- [ ] `ui/combat/ui_hud.js`
- [ ] Collegamento state→event_bus→UI

**STEP 3 — Dadi e Sequenza**
- [ ] `data/dice_types.js`
- [ ] `dice_system.js`
- [ ] `ui/combat/ui_sequence.js`
- [ ] `gamedata.js`

**STEP 4 — Selezione e Equipaggiamento**
- [ ] Logica Selezione in dice_system
- [ ] Sistema Equipaggiamento in game_state
- [ ] UI selezione interattiva
- [ ] Risorse da scarto in tempo reale

**STEP 5 — Carte e mano**
- [ ] `data/cards_combat.js` (13 carte v0.0.4a)
- [ ] `card_system.js`
- [ ] `ui/combat/ui_cards.js`
- [ ] Pesca iniziale

**STEP 6 — Risoluzione (Attacco Base + mov + AI)**
- [ ] `turn_manager.js`
- [ ] `combat_resolver.js`
- [ ] `input_handler.js`
- [ ] Attacco Base funzionante
- [ ] Movimento giocatore
- [ ] `ai_opponent.js` (4 azioni zombie)
- [ ] Feedback visivo

**STEP 7 — CD, Eco, Fine Turno, ciclo**
- [ ] Plancia Cooldown (3+1 slot)
- [ ] `ui/combat/ui_dice_panel.js`
- [ ] Fase 1 completa
- [ ] Fase 2 completa
- [ ] Ciclo turno continuo

**STEP 8 — Allineamento UI v0.0.4a**
- [ ] Rimozione PRE/FUT/BAG → Bag + Equipaggiamento
- [ ] Luce nell'HUD
- [ ] Aggiornamento popover e testi
- [ ] Verifica coerenza finale

**DOPO STEP 8 — Carte complesse (uno step per carta)**

---

*The Long Night — CLAUDE.md v1.4 · 2026-03-04*
*Non modificare senza aggiornare data e versione*
