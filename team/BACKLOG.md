# Backlog del team (in ordine di priorità)

Stati: `da fare` · `in corso` · `fatto` · `da rifare` · `BLOCCATO (motivo)`

| # | Task | Agente | Criterio di fatto | Stato |
|---|---|---|---|---|
| 1 | Partita completa (r1→r3) in stile attuale, B e C, desktop e telefono orizzontale | tester-giocatore | Report in `team/reviews/gioco_<data>.md` con bug riproducibili (seed) e punti di confusione | fatto — 3 run complete (attuale desktop e telefono, B desktop), r1+Soglia per B telefono e C; 0 bug ALTA, 2 MEDIA, 5 BASSA; mosse scelte dall'agente di bilanciamento e ripetute con clic/tocchi veri; C senza run completa |
| 2 | Numeri di base della demo: 500 run complete, slot demo e rev11 | tester-bilanciamento | Tabella in `team/reviews/bilanciamento_<data>.md` confrontata con l'obiettivo (run ~52%, stanze 6–7 turni) | fatto · parallelo — run completa 70,0% (demo) e 70,8% (rev11) contro ~52%; turni 6/5/6; numeri della demo ricontrollati dal regista |
| 3 | Revisione B contro C con le regole di leggibilità di TEAM.md §6, sulle schermate di `docs/style_test/` | art-director | `team/reviews/stile_<data>.md`: pro e contro per stile, problemi per gravità. Raccomanda, non decide | fatto — raccomanda B (decisione a Gianmarco); 3 problemi ALTA: C illeggibile su telefono, C a Luce 0–1 su desktop, intenti e stati assenti dalla mappa in tutti gli stili |
| 4 | Revisione layout HUD/sequenza/carte, soprattutto telefono orizzontale | ux-ui | Report per gravità; corretti i MEDIA/BASSA su CSS e `src/ui/`; smoke a 0 falliti; schermate prima/dopo | fatto — 14 problemi (2 ALTA solo proposta, 7 MEDIA corretti, 4 BASSA su 5 corretti); chiusi BUG-2, BUG-3, BUG-7 del tester; smoke 1521/0 ricontrollato dal regista; non verificati telefono vero, tutorial completo, desktop B e C |
| 5 | Correggere i bug del task 1 che non dipendono da regole ambigue | sviluppatore | Un commit per bug; smoke a 0 falliti; domande in `team/DOMANDE.md` | in corso |
| 6 | Pulire l'idle dell'Indagatore: il fotogramma 0 perde la lanterna. Ricostruirlo dai fotogrammi 1–3 senza nuove generazioni, poi usare i 4 fotogrammi | artista-pixel | Striscia corretta in `assets/sprites/pixellab/`, ordine in `style.js` aggiornato, schermata B | da fare |
| 7 | Asset per Sussurratore, Falena, Custode nello stile scelto | artista-pixel | — | BLOCCATO (scelta stile B/C) |
| 8 | Applicare la difficoltà scelta (es. +1 zombie nel Corridoio, Custode a 16 HP) e rimisurare | sviluppatore + tester-bilanciamento | — | BLOCCATO (decisione difficoltà) |
