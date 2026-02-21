# THE LONG NIGHT — WORKFLOW MASTER
**Versione:** 2.0
**Data:** 2026-02-21
**Autore:** Gianmarco (Sammauro)

> Questo documento descrive come è organizzato il progetto, gli strumenti usati, e il flusso di lavoro. È il documento di riferimento per orientarsi. La source of truth per le regole di gioco è `docs/regole_v0031def.md`.

---

## 1. Il Progetto

**The Long Night (TLN)** è un gioco tattico/narrativo in tre blocchi narrativi:

**Blocco 3 — Combat (in sviluppo):** tattico a turni su griglia esagonale. Sistema dadi Bag/Presente/Futuro + carte a doppia funzione (Effetto Attivo + Eco) + cooldown rotation. Riferimenti: Hotline Miami (puzzle deterministico), Mage Knight (carte come risorse), Too Many Bones (build emergenti), Bloodborne (atmosfera, rischio costoso).

**Blocco 2 — Esplorazione (pianificato):** il gioco nel gioco. Si gioca come umano in mappa open con dungeon ed enigmi stile Zelda.

**Blocco 1 — Narrativa (pianificato):** adventure testuale. Protagonista è un mostro-impiegato che vive una vita alienante e gioca ogni sera a un videogame. Riferimento: Disco Elysium.

**Repository:** https://github.com/Sammauro/the-long-night
**Deploy pubblico:** https://sammauro.github.io/the-long-night

---

## 2. Stack Tecnico

- **Rendering 3D:** Three.js r128 via CDN
- **UI:** HTML/CSS sovrapposto al canvas Three.js
- **Linguaggio:** Vanilla JavaScript — zero framework, zero npm
- **Compatibilità:** browser desktop + mobile
- **Deploy:** GitHub Pages automatico da branch `main`
- **OS sviluppatore:** Windows (`py` non `python`)

---

## 3. Architettura

### Pattern fondamentale
```
INPUT (click/touch giocatore OPPURE AI di bilanciamento)
        ↓
  input/command_bus.js
        ↓
  engine/               ← logica pura, zero grafica
        ↓
  engine/event_bus.js
        ↓
  rendering/ + ui/      ← si aggiornano in risposta agli eventi
```

`engine/` non importa mai nulla da `rendering/` o `ui/`. Mai.

### Struttura repo
```
the-long-night/
├── index.html
├── style.css                     ← stile UI unico
├── CLAUDE.md
├── src/
│   ├── engine/                   ← logica pura
│   │   ├── data/
│   │   │   ├── cards_combat.js
│   │   │   ├── enemies_zombie.js
│   │   │   ├── dice_types.js
│   │   │   └── levels_demo.js
│   │   ├── gamedata.js
│   │   ├── game_state.js
│   │   ├── event_bus.js
│   │   ├── turn_manager.js
│   │   ├── dice_system.js
│   │   ├── card_system.js
│   │   ├── combat_resolver.js
│   │   ├── ai_opponent.js
│   │   └── hex_grid.js
│   ├── balancing/
│   │   ├── sim_runner.js
│   │   ├── sim_agent.js
│   │   └── data_collector.js
│   ├── input/
│   │   ├── input_handler.js
│   │   └── command_bus.js
│   ├── rendering/
│   │   ├── scene.js
│   │   └── hex_renderer.js
│   └── ui/
│       └── combat/
│           ├── ui_sequence.js
│           ├── ui_cards.js
│           ├── ui_hud.js
│           └── ui_dice_panel.js
├── docs/
│   ├── regole_v0031def.md        ← SOURCE OF TRUTH
│   └── workflow_master.md
└── _archive/python/
```

### Scalabilità
- Nuova carta → `data/cards_combat.js`
- Nuovo nemico → nuovo file `data/enemies_[nome].js` + aggiorna `gamedata.js`
- Nuovo livello → nuovo file `data/levels_[nome].js` + aggiorna `gamedata.js`
- Nuovo blocco → nuove cartelle `engine_exploration/` e `ui/exploration/`, non si tocca `engine/`
- File > 250 righe → va spezzato

---

## 4. Layout Visivo

Riferimento: **Death Howl** — griglia isometrica centrale, sequenza dadi tra griglia e carte, carte in basso, HUD ridotto ai lati.

```
┌──────────────────────────────────────────┐
│  HUD sx          GRIGLIA          HUD dx │
│  HP/PT/PM      isometrica    info nemici │
│                Three.js                  │
│        ┌──────────────────────────┐      │
│        │  ←  SEQUENZA DADI  →    │      │
│        │  [d6✊][d4🔥][AI][d8🔮] │      │
│        └──────────────────────────┘      │
│  ┌─────────────────────────────────┐     │
│  │  CARTE IN MANO                  │     │
│  │  [carta] [carta] [carta]        │     │
│  └─────────────────────────────────┘     │
└──────────────────────────────────────────┘
```

**Three.js:** griglia esagonale isometrica + personaggi.
**HTML/CSS:** tutto il resto.

---

## 5. Strumenti e Accounts

**Claude (Anthropic):**
- Project 1 "TLN — Design & Narrative" → Sonnet per iterazioni, Opus per audit
- Project 2 "TLN — Code & Simulator" → Claude Code per tutto il codice

**Antigravity (Google):** task bulk/paralleli (dialoghi, varianti carte, testi narrativi)

**Notion:** hub documentazione
```
THE LONG NIGHT
├── MASTER RULES → Block 3 Combat System
├── ASSET DATABASE
├── BALANCING & PLAYTEST
└── ROADMAP
    └── Workflow Master
```

**GitHub:** https://github.com/Sammauro/the-long-night
**Asset generation:** DALL-E 3 (concept art), Imagen 3 (varianti), Meshy.ai (3D mesh .glb), Sketchfab (CC0 gothic assets)

---

## 6. Loop di Sviluppo

```
DESIGN LOOP
  Project 1 — Sonnet/Opus
  → scrive/itera/audita regole
  → aggiorna Notion MASTER RULES
        ↓
CODE LOOP
  Project 2 — Claude Code
  → genera/aggiorna simulatore Three.js
  → push GitHub → deploy GitHub Pages
        ↓
PLAYTEST LOOP
  → gioca → identifica problemi
  → Opus analizza dati balancing
  → aggiorna Notion BALANCING & PLAYTEST
  → torna a Design Loop
```

---

## 7. Strategia Multi-Agente

**Fase attuale (setup + combat):** Claude Code singolo. L'architettura deve stabilizzarsi prima di parallelizzare.

**Dal Blocco 2 in poi:**
- Agente Engine → `src/engine_exploration/`
- Agente UI/Front → `src/ui/exploration/` + stile
- Agente Balancing → `src/balancing/`

**Condizione necessaria:** `event_bus.js` e `command_bus.js` stabili e documentati prima di avviare agenti paralleli.

---

## 8. Fasi del Progetto

**FASE 0 — Setup (corrente)**
- [x] Notion workspace
- [x] GitHub repo creato
- [x] Project 1 "TLN — Design & Narrative" creato
- [x] Project 2 "TLN — Code & Simulator" creato
- [x] Regolamento v0.0.3def r3 consolidato
- [x] CLAUDE.md v1.1 scritto
- [ ] Caricare CLAUDE.md nel repo GitHub
- [ ] Caricare regolamento in `docs/` su GitHub
- [ ] Configurare collegamento Claude Code ↔ GitHub
- [ ] Setup struttura cartelle Three.js pulita

**FASE 1 — Combat Simulator**
- [ ] `engine/data/` con tutte le 14 carte, dadi, zombie
- [ ] `engine/game_state.js` Bag/Presente/Futuro
- [ ] `engine/event_bus.js` e `input/command_bus.js`
- [ ] `engine/hex_grid.js`
- [ ] `engine/dice_system.js` sequenza vincolata
- [ ] `engine/card_system.js` effetti, cooldown, eco
- [ ] `engine/combat_resolver.js` danni, stati, spinte
- [ ] `engine/ai_opponent.js` zombie
- [ ] `rendering/` griglia isometrica Three.js
- [ ] `ui/combat/` HUD giocabile
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

## 9. Versioning Regolamento

| Versione | Stato | Descrizione |
|---|---|---|
| v0.0.1 | Archivio | Prototipo iniziale |
| v0.0.2 | Archivio | Bugfix cooldown rotation |
| v0.0.3 | Archivio | Sistema Bag/Pool/Buffer, Discard Payloads |
| v0.0.3.1 | Archivio | Hotfix: d8 Terrore come risorsa unica ciclica |
| v0.0.3def r3 | **Corrente** | Consolidamento completo — source of truth |
| v0.1.0 | Target | Primo milestone simulatore Three.js |

---

*The Long Night — Workflow Master v2.0 · 2026-02-21*
