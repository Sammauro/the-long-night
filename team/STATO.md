# Stato del lavoro — leggere per riprendere

> Ogni passo concluso aggiorna questa tabella, fa commit e push. Se il lavoro si interrompe (crediti finiti, soglia, sessione chiusa), si riparte dal primo passo non `fatto`: gli output già salvati nei file restano validi, il passo `in corso` si riprende leggendo cosa ha già prodotto.

**Batch corrente:** B1 — Nuova interfaccia: ricerca, user story e design
**Modalità:** cloud (Gianmarco dà il via a ogni batch) · sul PC: soglie automatiche
**Prossima azione:** B1.1

| Passo | Cosa | Agente | Stato | Output |
|---|---|---|---|---|
| B1.1 | Piano del batch: obiettivi misurabili, passi, cancello | stratega | da fare | `team/PIANO.md` |
| B1.2 | Ricerca UX e user story della nuova interfaccia | ricercatore-ux | da fare | `team/ricerca/`, `team/stories/ui/` |
| B1.3 | Design da zero: mockup desktop e telefono, specifica | designer-ux-ui | da fare | `team/design/ui/` |
| B1.4 | Valutazione del batch contro gli indicatori | stratega | da fare | `team/valutazioni/B1_*.md` |
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
