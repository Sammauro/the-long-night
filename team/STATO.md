# Stato del lavoro — leggere per riprendere

> Ogni passo concluso aggiorna questa tabella, fa commit e push. Se il lavoro si interrompe (crediti finiti, soglia, sessione chiusa), si riparte dal primo passo non `fatto`: gli output già salvati nei file restano validi, il passo `in corso` si riprende leggendo cosa ha già prodotto.

**Batch corrente:** B1 — Nuova interfaccia: ricerca, user story e design
**Modalità:** cloud (Gianmarco dà il via a ogni batch) · sul PC: soglie automatiche
**Prossima azione:** B1.3b — mockup completi (8 schermate × telefono e desktop) e `SPEC.md` sulla direzione A "Il Rosario" con i tre innesti dalla B (input: `team/design/ui/DIREZIONE.md`, tutte le story Must e Should; piano in `team/PIANO.md`)

| Passo | Cosa | Agente | Stato | Output |
|---|---|---|---|---|
| B1.1 | Piano del batch: obiettivi misurabili, passi, cancello | stratega | fatto | `team/PIANO.md` |
| B1.2a | Ricerca UX: mappa del turno, principi, riferimenti, tabella dei problemi | ricercatore-ux | fatto | `team/ricerca/ui_2026-11-22.md` |
| B1.2b | User story della nuova interfaccia (15–22, max 12 Must, 13 temi) | ricercatore-ux | fatto | `team/stories/ui/` |
| B1.3a | Due direzioni della Selezione su telefono e scelta motivata | designer-ux-ui | fatto | `team/design/ui/DIREZIONE.md` |
| B1.3b | Mockup completi (8 schermate × telefono e desktop) e specifica | designer-ux-ui | sospeso (nuovo brief del 22/11, vedi B1.3c) | bozze in `team/design/ui/bozze_B1.3b/` |
| B1.4 | Valutazione del batch contro gli indicatori I1–I5 | stratega | da fare | `team/valutazioni/B1_*.md` |
| ⛔ | **Cancello: Gianmarco approva i mockup** | — | in attesa | — |

## Batch successivi (bozza, li dettaglia lo stratega)

| Batch | Contenuto | Cancello |
|---|---|---|
| B2 | Sviluppo della nuova interfaccia in `src/ui/` (da zero, motore intatto), per gruppi di story, con collaudo dopo ogni gruppo | collaudo: tutte le story Must PASSANO |
| B3 | Playtest con tre profili (principiante, veterano, telefono) + correzioni | valutazione dello stratega; report a Gianmarco |
| B4 | Tutorial nuovo: ricerca, story, design di un percorso più semplice e guidato | Gianmarco approva il percorso |
| B5 | Sviluppo del tutorial + playtest principiante | il principiante completa il tutorial senza bloccarsi |

## Registro

| Data | Passo | Esito | Commit |
|---|---|---|---|
| 2026-11-22 | B1.1 | Piano scritto: 5 indicatori, passi B1.2a/b e B1.3a/b, cancello sui mockup | questo commit |
| 2026-11-22 | B1.2a | Ricerca scritta: 5 fasi mappate con dati del motore, 7 principi, 9 riferimenti con fonti, 18 problemi (C1–C12, A1, A2, B5, T1–T3) + 5 nuovi, 3 dati richiesti al motore; schermate in `team/ricerca/shots/` | dopo fdb284f (vedi git log) |
| 2026-11-22 | B1.2b | 22 story (12 Must, 10 Should) sui 13 temi; I1–I5 coperti da Must; INDICE con stati di prova SP1–SP10 e tabella problema → story (C1–C12, A1, A2, B5, T1–T3, N1–N5, BUG); dati richiesti al motore DM1–DM4 (DM4 nuovo: anteprima delle Soste); nessuna nuova domanda di regola | dopo 3c84f39 (vedi git log) |
| 2026-11-22 | B1.3a | Due direzioni della Selezione su telefono (A "Il Rosario": colonne, Sequenza sul bordo basso; B "Il Registro": strati, stanza ruotata, Sequenza di pergamena al centro), dati reali SP1 dal motore, PNG in `team/design/ui/schermate/`; misura I3 automatica: entrambe 0 testi < 12 px, 0 bersagli < 44 px, 0 pannelli sovrapposti, 1 primario; griglia A 267 px (69%), B 197 px (51%). Scelta A con tre innesti da B (I1, I3, I5). Trovato: in SP1 l'anteprima "se nulla cambia" dà Z2 −1, nel motore fa −2 (Orda dopo Z1): proposto DM1 obbligatorio nel B2 | questo commit |
| 2026-11-22 | B1.3b | Sospeso per nuovo brief di Gianmarco sulla direzione A (si rifà il concetto nel B1.3c). Salvate le bozze in `team/design/ui/bozze_B1.3b/strumenti/`: estrazione dei dati dal motore (12 stati: seed 7 turni 1–3, seed 42 Soglia, seed 82 Buio e morte; anteprima in ordine di Sequenza DM1 verificata su SP1: Z1 −1, Z2 −2), token e componenti riusabili (`tln/`), layout e composizione A non ancora generati in HTML; nessun mockup né PNG prodotto | questo commit |
