# BRIEF — Avvio Sessione Fase 0
**Data:** 2026-03-03
**Destinatario:** Claude Code (Project 2 — TLN Code & Simulator)

---

## ISTRUZIONI OPERATIVE

Questo progetto Claude.ai è uno spazio di pianificazione — NON un ambiente di esecuzione.
**Non creare artefatti interattivi.** Tutto il codice e i file vanno scritti come blocchi di testo nel chat, pronti per essere copiati nel repo da Claude Code.
L'output di questa sessione è un pacchetto di lavoro per Claude Code: specifiche chiare, comandi pronti, file completi.

---

## Contesto

Stai lavorando su **The Long Night (TLN)**, un gioco tattico a turni su griglia esagonale.
Leggi **CLAUDE.md** nella root del repo prima di fare qualsiasi cosa.
La source of truth delle regole è `docs/regole_v0041a.md` — leggilo integralmente.

---

## Obiettivo di questa sessione: Fase 0

Costruire la struttura base del progetto, capire quanto codice Python esistente è recuperabile, e aggiornare il mockup UI alla v0.0.4a.

---

## Step 1 — Esplora il codice Python esistente

Nella cartella `_archive/python/` c'è una versione precedente del gioco scritta in Python (basata sul regolamento v0.0.3def). Esplora i file e per ognuno produci una scheda sintetica:

- **Cosa fa** (in 2-3 righe)
- **Recuperabile direttamente?** (logica portabile in JS senza riscrittura sostanziale)
- **Recuperabile con adattamento?** (logica valida ma va aggiornata alla v0.0.4a)
- **Da riscrivere** (logica obsoleta o incompatibile)

Presta particolare attenzione a:
- `hex_utils.js` / `hex_utils.py` — geometria esagonale, pathfinding
- `game_engine.py` — logica di gioco generale
- Qualsiasi file che gestisce dadi, sequenza, stati

Nota: il Python è basato su v0.0.3def. Le differenze principali con v0.0.4a sono:
- Sistema dadi: Bag/Presente/Futuro → solo Bag + Selezione
- Nuova risorsa: Luce
- Equipaggiamento con slot e copertura CD
- Struttura turno invertita (Fine Turno è ora Fase 1)
- Vulnerabilità tipizzata
- Collisione estesa alle unità

---

## Step 2 — Setup struttura cartelle

Crea la struttura cartelle descritta in CLAUDE.md sezione 4, se non esiste già.

---

## Step 3 — engine/data/ con dati statici

Sulla base di `docs/regole_v0041a.md`, crea i file di dati statici:

**`src/engine/data/dice_types.js`**
Tutti i tipi di dado (VIGOR, FIRE, TERROR, AI) con facce e risorsa generata da scarto.

**`src/engine/data/cards_combat.js`**
Le 13 carte del set test. Per ogni carta: nome, CD, supply, effetto attivo (come struttura dati), eco.
Le carte senza costo in impulsi (Infusione Elementale, Manipolazione Destino, Carica Furiosa) vanno marcate esplicitamente con `requiresImpulses: false`.

**`src/engine/data/enemies_zombie.js`**
Scheda Zombie: HP, Movimento, dado AI, 4 azioni con effetti.

**`src/engine/data/levels_demo.js`**
Setup scenario demo: risorse iniziali, equipaggiamento (4 slot con priorità e costo recupero), composizione Bag, mappa 6x8, posizioni giocatore e zombie, ostacoli, trappola.

**`src/engine/gamedata.js`**
Aggrega e ri-esporta tutto da `data/`. Solo aggregazione, zero logica.

---

## Step 4 — Aggiorna il mockup UI alla v0.0.4a

Il file `docs/mockups/ui_mockup_v4.html` è un mockup interattivo già funzionante (griglia isometrica Three.js, carte con hover, popover sui dadi, palette Death Howl). **Il visual shell è buono — non toccarlo.** Aggiorna solo le parti che mostrano meccaniche obsolete della v0.0.3def.

Salva il risultato come `docs/mockups/ui_mockup_v5.html` (non sovrascrivere la v4).

### Modifiche richieste

**1. Pannello dadi (hud-dice) — rifare**
Rimuovi le label PRE / FUT / BAG (tre pool non esistono più).
Sostituisci con un pannello che mostra i dadi della Bag con il loro stato attuale:
- Durante la Fase 3 (Selezione): ogni dado mostra il risultato del lancio e lo stato (✓ selezionato / ✗ scartato / 💡X recuperabile a costo).
- Durante la Fase 4 (Risoluzione): mostra solo i dadi in Sequenza (selezionati), con stato usato/attivo/da risolvere.

**2. Fase Selezione — aggiungere stato UI**
Aggiungi uno stato visivo per la Fase 3 (Selezione). Quando attiva, ogni dado lanciato deve mostrare chiaramente:
- Verde/accessibile: slot libero, selezione gratuita.
- Giallo/a pagamento: slot coperto da CD, costo X Luce indicato.
- Grigio/solo scarto: nessuno slot corrispondente, può solo essere scartato per risorsa.
I dadi scartati restano visibili con il loro risultato di lancio per tutto il turno (opacità ridotta, label "SCARTATO + risorsa ottenuta").

**3. Pannello Equipaggiamento — aggiungere**
Aggiungi un pannello compatto (posizionalo dove ritieni più logico, ad esempio sopra le carte o affianco al CD) che mostra i 4 slot dell'equipaggiamento demo:
- Slot 1: d8 Terrore — coperto/scoperto + costo recupero (2💡)
- Slot 2: d6 Vigore — coperto/scoperto + costo recupero (1💡)
- Slot 3: d6 Vigore — coperto/scoperto + costo recupero (2💡)
- Slot 4 (esclusivo Fuoco): d4 Fuoco — coperto/scoperto + costo recupero (1💡)

**4. HUD giocatore — aggiungere Luce**
Aggiungi la risorsa Luce (💡) al pannello hud-player, dopo PM.
Usare lo stesso stile delle altre risorse (barra o pip, a tua scelta purché leggibile).

**5. Carte — correggere contenuto**
Aggiorna le carte nel mockup per riflettere il set test v0.0.4a (13 carte, non 14):
- **Rimuovi Scatto** — non è nel set test v0.0.4a.
- **Profondità Mente** — Effetto: "X 🔮 + X PT → X Danni Diretti a bersaglio ovunque". Eco: "+1 PM · +2 Luce".
- **Attacco di Fuoco** — Effetto: "1 🔥: 2 Danni Fuoco (Corpo a Corpo)". Non più Gittata 2.
- **Tutti gli Eco** — Aggiorna al formato v0.0.4a. Esempio: Attacco Base → "+1 PM · +1 Scudo". Attacco Poderoso → "+1 PM · +1 Luce". Vedi `docs/regole_v0041a.md` sezione 7 per tutti gli Eco corretti.

**6. Popover dado Terrore — correggere**
Il popover attuale dice "Scarto → Recupera 1 PT → Terrore va in Futuro". In v0.0.4a:
- Il dado Terrore scartato nella Selezione genera +1 PT.
- Non esiste il "Futuro" come pool separato.
- Non è più una risorsa unica ciclica — è un dado normale nella Bag.
Aggiorna il popover di conseguenza.

---

## Output atteso

1. Scheda recuperabilità codice Python — testo markdown nel chat
2. Struttura cartelle — lista comandi mkdir pronti da eseguire
3. File `src/engine/data/` e `src/engine/gamedata.js` — codice JS completo scritto nel chat come blocchi di testo
4. `docs/mockups/ui_mockup_v5.html` — HTML completo scritto nel chat come blocco di testo

Commit: `FEAT: fase0 - data layer + UI mockup v5`

---

## Note operative

- Non interpretare mai le regole autonomamente. Se `docs/regole_v0041a.md` è ambiguo su qualcosa, fermati e segnala.
- Ogni funzione che implementerà una regola citerà la sezione (es. `// REGOLA 3.2`).
- `engine/` non importa mai nulla da `rendering/` o `ui/`. Mai.
- Se un file supera 250 righe, segnalalo prima di procedere.
