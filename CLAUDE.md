# THE LONG NIGHT — CLAUDE.md
*Ultimo Aggiornamento: 2026-02-21 | Versione: v1.1*

> **LEGGI QUESTO FILE INTERO prima di toccare qualsiasi codice.**
> Source of truth regole di gioco: `docs/regole_v0031def.md`
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

- **Rendering 3D:** Three.js r128 via CDN — zero npm, zero bundler
- **UI:** HTML/CSS sovrapposto al canvas Three.js
- **Linguaggio:** Vanilla JavaScript — zero framework
- **Entry point:** `index.html` nella root (GitHub Pages)
- **Compatibilità:** browser desktop + mobile (touch e click gestiti in modo unificato)
- **OS sviluppatore:** Windows

```html
<!-- Unica dipendenza esterna -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
```

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
├── index.html                    ← shell: carica Three.js, CSS, moduli JS
├── style.css                     ← tutto lo stile UI in un file unico
├── CLAUDE.md                     ← questo file
│
├── src/
│   ├── engine/                   ← LOGICA DI GIOCO PURA (zero grafica, zero input)
│   │   ├── data/                 ← dati statici separati per categoria
│   │   │   ├── cards_combat.js   ← le 14 carte del combat system
│   │   │   ├── enemies_zombie.js ← scheda nemico Zombie
│   │   │   ├── dice_types.js     ← definizioni e facce dei dadi
│   │   │   └── levels_demo.js    ← configurazione scenario demo
│   │   ├── gamedata.js           ← aggrega data/ e lo esporta
│   │   ├── game_state.js         ← stato partita: Bag/Presente/Futuro, HP/PT/PM
│   │   ├── event_bus.js          ← emette eventi quando lo stato cambia
│   │   ├── turn_manager.js       ← orchestra le 4 fasi del turno
│   │   ├── dice_system.js        ← lancio dadi, sequenza vincolata, impulsi
│   │   ├── card_system.js        ← effetti carte, cooldown, eco
│   │   ├── combat_resolver.js    ← danni, stati, collisioni, spinte
│   │   ├── ai_opponent.js        ← comportamento nemici (zombie AI)
│   │   └── hex_grid.js           ← coordinate esagonali, distanze, pathfinding
│   │
│   ├── balancing/                ← AI DI BILANCIAMENTO (usa solo engine/)
│   │   ├── sim_runner.js         ← esegue N partite automatiche
│   │   ├── sim_agent.js          ← agente AI che gioca usando engine/
│   │   └── data_collector.js     ← raccoglie e serializza dati
│   │
│   ├── input/                    ← GESTIONE INPUT (astrae click/touch/AI)
│   │   ├── input_handler.js      ← unifica eventi mouse, touch, keyboard
│   │   └── command_bus.js        ← lista comandi disponibili e dispatcher
│   │
│   ├── rendering/                ← THREE.JS (solo rendering 3D)
│   │   ├── scene.js              ← setup Three.js: renderer, camera, luci
│   │   └── hex_renderer.js       ← disegna griglia isometrica e personaggi
│   │
│   └── ui/                       ← HTML/CSS OVERLAY (si espande per blocco)
│       └── combat/
│           ├── ui_sequence.js    ← striscia sequenza dadi (cuore visivo)
│           ├── ui_cards.js       ← carte in mano
│           ├── ui_hud.js         ← HP, PT, PM, risorse
│           └── ui_dice_panel.js  ← pannello Bag/Presente/Futuro
│
├── docs/
│   ├── regole_v0031def.md        ← SOURCE OF TRUTH regole di gioco
│   └── workflow_master.md        ← configurazione progetto
│
└── _archive/
    └── python/                   ← vecchio codice Python (solo riferimento)
        ← web_version/hex_utils.js e game_engine.js utili per hex logic
```

### Regola di scalabilità
- **Nuova carta:** aggiungi a `data/cards_combat.js`
- **Nuovo nemico:** crea `data/enemies_[nome].js`, aggiorna `gamedata.js`
- **Nuova stanza/livello:** crea `data/levels_[nome].js`, aggiorna `gamedata.js`
- **Nuovo blocco di gioco:** crea `engine_exploration/` e `ui/exploration/` — non toccare nulla di `engine/`
- **Se un file supera 250 righe:** è un segnale che fa troppe cose, spezzalo

---

## 5. Layout Visivo (Riferimento: Death Howl)

```
┌──────────────────────────────────────────────┐
│  HUD sx              GRIGLIA            HUD dx│
│  HP / PT / PM      isometrica    info nemici  │
│                    Three.js                   │
│                                               │
│         ┌────────────────────────────┐        │
│         │  ←  SEQUENZA DADI  →       │        │
│         │  [d6✊][d4🔥][AI][d8🔮]   │        │
│         └────────────────────────────┘        │
│  ┌───────────────────────────────────────┐    │
│  │  CARTE IN MANO                        │    │
│  │  [carta]  [carta]  [carta]  [carta]   │    │
│  └───────────────────────────────────────┘    │
└──────────────────────────────────────────────┘
```

**Three.js** gestisce solo la griglia isometrica esagonale e i personaggi.
**HTML/CSS** gestisce tutto il resto: sequenza dadi, carte, HUD, pannelli.

**Palette colori (Death Howl style):**
```css
--bg-deep:     #151519;
--bg-card:     #16141c;
--bg-panel:    #1c1a24;
--border:      #2e2a3e;
--text:        #e8e0d0;
--text-muted:  #8a7f9a;
--gold:        #c9a84c;
--red:         #b84040;
--blue:        #4a8fbd;
```

**Compatibilità mobile:** tutti gli elementi UI devono rispondere a touch.
`input_handler.js` traduce `touchstart/touchend` negli stessi comandi di `click`.
Nessun `hover`-only interaction — tutto deve funzionare con tap.

---

## 6. Terminologia Ufficiale

Usare SEMPRE questi nomi nel codice, commenti e variabili:

| Termine di gioco | JS | Note |
|---|---|---|
| Bag | `diceBag` | Arsenale dadi non attivi |
| Presente | `activePool` | Dadi turno corrente |
| Futuro | `nextTurnBuffer` | Dadi turno successivo |
| Dado Vigore | `VIGOR` | Fisico — Forza ✊ |
| Dado Fuoco | `FIRE` | Elementale — Fuoco 🔥 |
| Dado Terrore | `TERROR` | Mentale — Presagio 🔮 |
| Presagio | `presagio` | Impulso del Dado Terrore |
| Eco | `eco` | Effetto scarto carta |
| Amplificazione Elementale | `elementalAmplify` | Dado elementale su carta fisica |

---

## 7. Regole Operative

### Regola fondamentale — regole di gioco
Non interpretare mai le regole di gioco autonomamente.
Se qualcosa in `docs/regole_v0031def.md` è ambiguo, fermati e chiedi.
Le regole su una carta hanno sempre la precedenza sul manuale generale.

### Commenti nel codice
Ogni funzione che implementa una regola cita la sezione:
```javascript
// REGOLA 3.2 — Dado Vigore: genera impulsi Forza pari al risultato del lancio
// REGOLA 5.3 — Fase 3: impulsi non spesi vanno persi, non si accumulano
```

### Contratti tra moduli
`event_bus.js` deve essere scritto e stabile **prima** che altri moduli lo usino.
Stessa cosa per `command_bus.js` — definisce i comandi disponibili prima che input o AI li chiamino.

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

### Configurazione Claude Code ← DA COMPLETARE
> Passi da fare quando si configura Claude Code:
> 1. GitHub → Settings → Developer settings → Personal access tokens → Generate new token
> 2. Permessi: selezionare `repo` (lettura e scrittura completa)
> 3. Inserire il token nella configurazione di Claude Code
> 4. Verificare che il push funzioni
> Aggiornare questa sezione con i dettagli dopo la configurazione.

### Deploy
Ogni push su `main` aggiorna automaticamente il sito pubblico.
Claude Code fa push dopo ogni feature completata e testata.

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

**FASE 0 — Setup (corrente)**
- [ ] Struttura repo pulita con cartelle
- [ ] `index.html` + `style.css` base (Death Howl palette)
- [ ] `engine/data/` con tutte le 14 carte, dadi, zombie
- [ ] `engine/game_state.js` con Bag/Presente/Futuro
- [ ] `engine/event_bus.js` e `input/command_bus.js`

**FASE 1 — Combat Simulator**
- [ ] `engine/hex_grid.js`
- [ ] `engine/dice_system.js` con sequenza vincolata
- [ ] `engine/card_system.js` con effetti, cooldown, eco
- [ ] `engine/combat_resolver.js` con danni, stati, spinte
- [ ] `engine/ai_opponent.js` zombie
- [ ] `rendering/` griglia isometrica Three.js
- [ ] `ui/combat/` HUD giocabile completo
- [ ] `input/input_handler.js` click + touch
- [ ] Deploy GitHub Pages — primo playtest pubblico

**FASE 1.5 — Balancing AI**
- [ ] `balancing/sim_runner.js`
- [ ] `balancing/sim_agent.js`
- [ ] `balancing/data_collector.js`

**FASE 2 — Esplorazione (Blocco 2)**
**FASE 3 — Narrativa (Blocco 1)**
**FASE 4 — Integrazione**

---

*The Long Night — CLAUDE.md v1.1 · 2026-02-21*
*Non modificare senza aggiornare data e versione*
