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
| M2 | Motore senza grafica | ⬜ | |
| M3 | Scena 2.5D | ⬜ | |
| M4 | Combattimento giocabile | ⬜ | |
| M5 | Run | ⬜ | |
| M6 | Tutorial | ⬜ | |
| M7 | Rifinitura e pubblicazione | ⬜ | |

## Prossimo passo
M2: motore senza grafica (griglia, stato, turno, dadi, Selezione, carte, Plancia, danni, IA, Veglia, Soglia) e partite casuali in `tools/smoke.js`.

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

## Da controllare a occhio
(elenco per il controllo visivo)

## Scostamenti dal brief
- Nessuna modifica a `CLAUDE.md` (deroga della sessione di prova): vedi "Modifiche da applicare ai documenti".
- `src/manifest.js` elenca solo i file già scritti; cresce milestone per milestone, così la pagina non ha mai script mancanti.
