# THE LONG NIGHT — CLAUDE.md
*Ultimo Aggiornamento: 2026-04-16 | Versione: v1.3*

> **LEGGI QUESTO FILE INTERO prima di toccare qualsiasi codice.**
> Source of truth regole di gioco: `docs/regole_v0041a.md`
> Sezione 7 (carte) e Sezione 8-9 (nemici/manovre) sono sottopagine Notion separate.
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

---

## 4. Struttura del Repo

```
the-long-night/
├── index.html
├── style.css
├── CLAUDE.md
├── src/
│   ├── engine/
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
│   ├── input/
│   ├── rendering/
│   └── ui/combat/
├── docs/
│   ├── regole_v0041a.md
│   ├── workflow_master.md
│   └── mockups/
│       ├── ui_mockup_v4.html
│       └── vtt_playtest_v1.html  ← VTT tool (aggiornare versione)
└── _archive/python/
```

---

## 5. Regole di Gioco — Stato Attuale (v0.0.4a rev.11)

### Struttura turno (5 fasi)
1. **Lancio** — tira tutta la Bag + dadi AI, forma Sequenza Vincolata
2. **Fine Turno** — Rotazione Stati → Scarto → Eco → Rotazione CD *(saltata al T1)*
3. **Preparazione** — Pesca fino a 5 + Rimescola scarti
4. **Selezione** — scegli dadi da tenere/scartare, paghi Luce se slot coperto
5. **Risoluzione** — risolvi sequenza da sinistra a destra

### Risorse giocatore
- HP: 10 | PT: 6 | PM: 2 (iniziali) | Luce: 0
- PM Salto: generati da Scatto, attraversano caselle occupate, non si accumulano

### Sistema dadi (Bag)
- 2× d6 Vigore (slot 2 e 3) | 2× d4 Fuoco (slot 4 esclusivo Fuoco) | 1× d8 Terrore (slot 1)
- Scarto: Vigore → +1 PM | Fuoco → +1 Luce | Terrore → +1 PT
- Facce: d4 Vigore/Fuoco = [1,1,2,2] | d6 Vigore = [1,1,2,2,2,3] | d8 Terrore = [1,1,2,2,2,3,3,4]

### Equipaggiamento demo (4 slot)
| Slot | Dado | Priorità | Costo recupero |
|---|---|---|---|
| 1 | d8 Terrore | Alta | 2 Luce |
| 2 | d6 Vigore | Media | 1 Luce |
| 3 | d6 Vigore | Bassa | 2 Luce |
| 4 (esclusivo Fuoco) | d4 Fuoco | — | 1 Luce |

### Set carte (17 carte — v0.0.4a rev.11)

**CD 0 (6 carte):**
- Parata ×2: `1 ✊: +1 Scudo. / 1 ✊: Pesca 1 carta.` | Eco: Contrattacco
- Scatto ×1: `1 ✊: +1 PM Salto. Pesca 1 carta.` | Eco: +2 PM · Ruota 1 CD 90°
- Tiro Mirato ×1: `Gittata 2. / 1 ✊: +1 Gittata. / 1 ✊: 1 Danno.` | Eco: +2 PM · Ruota 1 CD 90°
- Attacco Base ×2: `1 Danno. / 1 ✊: 1 Danno. / 1 ✊: Pesca 1 carta.` | Eco: +1 PM · +1 Scudo
- Profondità Mente ×1: `X 🔮 + X PT → X Danni Diretti ovunque.` | Eco: +1 PM · Ruota 1 CD 90°

**CD 1 (5 carte):**
- Diniego Sismico ×1: `1 ✊: 1 Danno + Spingi 1 (Collisione).` | Eco: +1 PM · Ruota 1 CD 90°
- Attacco di Fuoco ×1: `1 🔥: 2 Danni Fuoco CaC. / 1 🔥: Vulnerabilità Fuoco.` | Eco: +1 PM · +1 Luce
- Cono di Fuoco ×1: `2 🔥: 2 Danni AOE Cono Gittata 3.` | Eco: +1 Luce
- Infusione Elementale ×1: `Gratis: converti 1 dado in Fuoco +1 impulso.` | Eco: +1 PM · Avanza 1 CD 90°
- Distorsione ×1: `X 🔮 + 1 PT: sposta unità X caselle. No Collisione. Trappole attive.` | Eco: +1 PM · Pesca 1 carta

**CD 2 (3 carte):**
- Attacco Poderoso ×1: `1 ✊: 2 Danni (self Vulnerabile). / 1 ✊: Stordisci + Spingi 1 (self Vulnerabile).` | Eco: +1 PM · +1 Luce
- Attacco Strategico ×1: `1 ✊: 1 Danno. Per HP danno: +1 PM o +1 Scudo.` | Eco: +1 PM
- Carica Furiosa ×1: `Gratis. 2 dadi adiacenti consumati. Movimento in linea retta. Danno = caselle.` | Eco: +1 Luce
- Manipolazione Destino ×1: `Gratis. 1 PT: ruota 1 dado sulla faccia preferita.` | Eco: Avanza tutte CD 90°

### Stati
- **Scudo:** assorbe 1 danno (obbligatorio). Stackabile. 2 aree: Turno Attuale / Prossimo Turno.
- **Vulnerabilità:** tipizzata (generica o Fuoco). x2 danno. Si applica prima degli Scudi.
- **Stordito:** salta prossima attivazione.
- **Contrattacco:** se subisci danno agli HP, infliggi lo stesso danno alla fonte (danno normale, non Diretto). Non si consuma. Scade con rotazione stati.

### Zombie (v0.0.4a rev.11)
- HP: 6 | Movimento: 2 | Dado AI: d4
- 1-2: Attacco Orda (Muove + 1 Danno, +1 per zombie adiacente)
- 3: Morso Rigenerante (Muove + 2 Danni, cura 1 HP per danno agli HP)
- 4: Incassare (fermo, +2 Scudi Turno Attuale)

### Setup demo
- Mappa: 6×8 esagoni (pointy-top, righe dispari offset)
- Giocatore: R1 E4
- Z1: R4 E3 | Z2: R4 E6 | Z3: R6 E2 | Z4: R6 E6 | Z5: R7 E4
- Colonna A: R4 E5 | Colonna B: R6 E4
- Trappola R5 E3: 3 Danni Diretti, rimossa dopo attivazione

### Manovre base
- Dado Vigore: 1 ✊ → +1 PM
- Dado Fuoco d4: 1 🔥 → 1 Danno Gittata 3
- Dado Terrore d8: Conversione Oscura — 1 🔮 + 1 PT → 1 impulso a scelta (se Elementale: +1 PT flat)

---

## 6. Terminologia Ufficiale

| Termine | JS | Note |
|---|---|---|
| Bag | `diceBag` | Tutti i dadi |
| PM Salto | `jumpPM` | Attraversa caselle occupate |
| Sequenza Vincolata | `sequence` | Ordine risoluzione immutabile |
| Contrattacco | `counterattack` | Stato reattivo |
| Eco | `eco` | Effetto scarto carta |

---

## 7. Layout Visivo (Death Howl style)

```
┌──────────────────────────────────────────┐
│  HUD sx          GRIGLIA          HUD dx │
│  HP/PT/PM/Luce  esagonale    info nemici │
│                                          │
│        ┌──────────────────────────┐      │
│        │  SEQUENZA VINCOLATA      │      │
│        └──────────────────────────┘      │
│  ┌─────────────────────────────────┐     │
│  │  CARTE IN MANO                  │     │
│  └─────────────────────────────────┘     │
└──────────────────────────────────────────┘
```

Palette Death Howl:
```css
--bg-deep: #151519; --bg-card: #16141c; --bg-panel: #1c1a24;
--border: #2e2a3e; --text: #e8e0d0; --text-muted: #8a7f9a;
--gold: #c9a84c; --red: #b84040; --blue: #4a8fbd;
```

---

## 8. Regole Operative

- Non interpretare mai le regole autonomamente. Se ambiguo: chiedi.
- `engine/` non importa mai da `rendering/` o `ui/`. Mai.
- Ogni funzione che implementa una regola cita la sezione: `// REGOLA 3.2`
- File > 250 righe: segnala e spezza. Eccezione: file HTML VTT (può arrivare a 900 righe).
- Non mostrare codice salvo richiesta esplicita. Lavora feature per feature.
- Push dopo ogni feature completata e testata.

---

## 9. Fasi di Sviluppo

**FASE 0 — Setup**
- [x] Struttura repo
- [x] CLAUDE.md aggiornato
- [x] Regolamento in `docs/`
- [x] VTT Playtest tool in `docs/mockups/`
- [ ] `engine/data/` con carte, dadi, zombie
- [ ] `engine/game_state.js`
- [ ] `engine/event_bus.js` e `input/command_bus.js`

**FASE 1 — Combat Simulator**
**FASE 1.5 — Balancing AI**
**FASE 2 — Esplorazione**
**FASE 3 — Narrativa**

---

*The Long Night — CLAUDE.md v1.3 · 2026-04-16*
