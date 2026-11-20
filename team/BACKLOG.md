# Backlog del team (in ordine di priorità)

Stati: `da fare` · `in corso` · `fatto` · `da rifare` · `BLOCCATO (motivo)`

| # | Task | Agente | Criterio di fatto | Stato |
|---|---|---|---|---|
| 1 | Partita completa (r1→r3) nello stile attuale, desktop e telefono orizzontale | tester-giocatore | Report in `team/reviews/gioco_<data>.md` con bug riproducibili (seed) e punti di confusione | da fare |
| 2 | Numeri di base della demo: 500 run complete, slot demo e rev11 | tester-bilanciamento | Tabella in `team/reviews/bilanciamento_<data>.md` confrontata con l'obiettivo (run ~52%, stanze 6–7 turni) | da fare · parallelo |
| 3 | Revisione B contro C con le regole di leggibilità di TEAM.md §6, sulle schermate di `docs/style_test/` | art-director | `team/reviews/stile_<data>.md`: pro e contro per stile, problemi per gravità. Raccomanda, non decide | BLOCCATO (grafica rimandata) |
| 4 | Revisione layout HUD/sequenza/carte, soprattutto telefono orizzontale (stile attuale, niente lavoro sugli asset) | ux-ui | Report per gravità; corretti i MEDIA/BASSA su CSS e `src/ui/`; smoke a 0 falliti; schermate prima/dopo | da fare |
| 5 | Correggere i bug del task 1 che non dipendono da regole ambigue | sviluppatore | Un commit per bug; smoke a 0 falliti; domande in `team/DOMANDE.md` | da fare (dopo 1) |
| 6 | Pulire l'idle dell'Indagatore: il fotogramma 0 perde la lanterna. Ricostruirlo dai fotogrammi 1–3 senza nuove generazioni, poi usare i 4 fotogrammi | artista-pixel | Striscia corretta in `assets/sprites/pixellab/`, ordine in `style.js` aggiornato, schermata B | BLOCCATO (grafica rimandata) |
| 7 | Asset per Sussurratore, Falena, Custode nello stile scelto | artista-pixel | — | BLOCCATO (grafica rimandata) |
| 8 | Applicare la difficoltà scelta (es. +1 zombie nel Corridoio, Custode a 16 HP) e rimisurare | sviluppatore + tester-bilanciamento | — | BLOCCATO (decisione difficoltà) |
