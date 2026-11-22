# Piano del batch B1 — Nuova interfaccia: ricerca, user story e design

*Stratega · 2026-11-22 · branch `prova-demo` · riguarda l'interfaccia di gioco; il tutorial è il B4.*

## 1. Obiettivo

Consegnare a Gianmarco mockup e specifica di un'interfaccia di combattimento riprogettata da zero, pensata prima per il telefono orizzontale, in cui si capisce senza toccare nulla **cosa sta per succedere, cosa posso fare adesso e perché un'azione non è permessa**, con un'identità che appartiene al mondo di TLN e non a un template.

Perché ora: giudizio di Gianmarco del 22/11 ("non funzionale né intuitiva, da riscrivere da zero") e tre segnalazioni dal telefono: Conferma che sembrava non fare nulla, intenti e stati dei nemici leggibili solo toccando i dadi, layout non pensato per il telefono. I report del 20/11 dicono lo stesso (`ux` A1 e A2, `gioco` punti di confusione 1–12).

## 2. Indicatori

Ognuno ha una verifica sui mockup (B1.4) e una sul gioco vero (B2 collaudo, B3 playtest).

| # | Indicatore | Verifica in B1 (mockup) | Verifica in B2/B3 (gioco) |
|---|---|---|---|
| I1 | **Minacce leggibili a colpo d'occhio.** Da una schermata fissa di inizio Selezione (stanza 1, 5 zombie), senza toccare nulla, per ogni nemico si leggono azione, danno previsto, bersaglio o destinazione e stati. | Un agente che non ha letto la SPEC risponde giusto per 5 nemici su 5, su telefono e desktop. | Playtester: 5 su 5 in meno di 10 secondi. |
| I2 | **Nessun rifiuto silenzioso.** Ogni tocco su un elemento interattivo produce un cambiamento visibile oppure un motivo scritto vicino al punto toccato, che resta finché serve (niente messaggi da 2 secondi come unica spiegazione). | La SPEC elenca ogni azione vietabile con il testo del motivo; ogni pulsante spento nei mockup mostra il motivo. | Collaudo: 0 tocchi senza effetto né messaggio su tutte le azioni vietate elencate. |
| I3 | **Telefono per primo (844×390).** Bersagli di tocco ≥ 44 px, testo ≥ 12 px, griglia intera visibile in ogni fase, 0 pannelli sovrapposti, 0 informazioni essenziali solo al passaggio del mouse. | Misura automatica sui mockup con Playwright (script e risultato salvati). | Stessa misura sul gioco, in tutte le fasi. |
| I4 | **Una sola azione principale per fase**, e la Sequenza Vincolata è l'elemento con più peso in Selezione e Risoluzione. In Selezione nessun dado si perde per un Conferma premuto per sbaglio. | Ogni mockup ha un solo pulsante primario; lo stato iniziale della Selezione è mostrato. | Playtester principiante: turno 1 completato in meno di 3 minuti senza aiuto esterno; stanza 1 senza blocchi oltre 30 secondi. |
| I5 | **Carte leggibili in mano.** Sul telefono costo ed effetto di ogni carta si capiscono senza aprirla. | Carte dei mockup con dati veri del set rev.11; l'agente del test I1 dice cosa fa ogni carta, 4 su 5. | Playtester telefono: 4 su 5; 0 carte aperte "per vedere cosa fa". |

Copertura (solo B1): ogni punto di confusione 1–12 di `team/reviews/gioco_2026-11-20.md` e i problemi A1, A2, B5 di `team/reviews/ux_2026-11-20.md` hanno una story oppure un "fuori ambito" motivato.

## 3. Vincoli

- Nessuna regola cambia. Se un problema nasce da una regola, va in `team/DOMANDE.md`. Fonti: `docs/regole_v0041a.md`, `docs/design_demo_v005.md`, `DEMO.md`, `team/DECISIONI.md`.
- Motore intatto: la nuova interfaccia userà solo dati che il motore espone. Se un'informazione serve e oggi manca (per esempio il danno previsto di un intento), la story lo scrive come "dato richiesto al motore", senza inventarlo.
- Grafica della scena 3D rimandata (decisione del 20/11): si progettano HUD, pannelli e segni sopra la mappa, non sprite né ambienti. Niente PixelLab.
- Palette di `CLAUDE.md` §7 come base; il designer può estenderla motivando. Terminologia ufficiale sempre.
- Formati: telefono orizzontale 844×390 (primario) e desktop 1400×850.

## 4. Passi

Ogni passo sta in una sessione, salva i file, aggiorna `team/STATO.md`, fa commit e push.

### B1.2a — Ricerca · `ricercatore-ux`
- **Input:** questo piano; `team/reviews/*_2026-11-20.md` e le schermate collegate; regole e `DEMO.md`; `src/engine/` per i dati disponibili in ogni fase; interfaccia attuale con `node tools/shots.js`.
- **Output:** `team/ricerca/ui_2026-11-22.md` con:
  1. mappa del turno: per ognuna delle 5 fasi cosa il giocatore deve sapere, cosa decide, quali dati del motore esistono, cosa oggi lo ostacola;
  2. al massimo 7 principi specifici per TLN;
  3. riferimenti con link e il meccanismo che prendiamo: almeno Into the Breach (intenti sulla mappa), Slay the Spire e Balatro su mobile (carte in mano), Death Howl (sequenza), più un tattico su telefono orizzontale a scelta;
  4. tabella dei problemi: i 12 punti di confusione, A1, A2, B5 e le 3 segnalazioni dal telefono, ognuno con causa e principio violato.
- **Fatto quando:** le 5 fasi sono coperte; ogni riferimento ha una fonte verificabile; nessun problema della lista manca dalla tabella.

### B1.2b — User story · `ricercatore-ux`
- **Input:** la ricerca del B1.2a.
- **Output:** `team/stories/ui/US-XX.md` e `INDICE.md`. Tra 15 e 22 story, al massimo 12 Must. Temi obbligatori:
  1. orientamento: fase, turno, "cosa devo fare adesso" (compreso Lancio prima del Fine Turno);
  2. Selezione: tenere o scartare, cosa rende ogni scarto, slot coperti e costo in Luce, stato iniziale sicuro, Conferma;
  3. minacce: intenti, danno, percorso e stati dei nemici sulla mappa; legame tra dado nemico e unità;
  4. Risoluzione, dado del giocatore: dado attivo, impulsi, movimento con costo in PM, manovra base, impulsi che si perdono;
  5. Risoluzione, dadi nemici: quando tocca a loro, cosa è successo e perché, risoluzione automatica;
  6. carte: lettura in mano, apertura, azioni disponibili e non, dettaglio, rimettere in mano;
  7. puntamento: bersaglio, gittata, spinta e Collisione contro il muro, Cono, Distorsione;
  8. Fine Turno: scarto volontario, Eco anche con bersaglio, Plancia e rotazione dei CD;
  9. risorse e stati del giocatore: HP, PT, PM, PM Salto, Luce, Scudo nelle due aree, Vulnerabilità, Contrattacco, Veglia e Buio;
  10. feedback e rifiuti: motivo di ogni azione vietata, conferme solo dove si perde qualcosa;
  11. Soglia e fine partita: Soste, tetto dei PT, causa della morte;
  12. telefono: tocco e tocco prolungato al posto del mouse, orientamento;
  13. spazio per la guida: dove compare un messaggio di tutorial o suggerimento senza coprire Sequenza e griglia (il contenuto è del B4).
- **Fatto quando:** ogni story ha criteri Dato/Quando/Allora verificabili con una schermata o un'azione, su telefono e desktop; ogni indicatore I1–I5 è criterio di almeno una Must; l'INDICE ha la tabella problema → story; le domande di regola sono in `team/DOMANDE.md` e non nelle story.

### B1.3a — Direzione e schermata chiave · `designer-ux-ui`
- **Input:** ricerca, INDICE e story Must, brief di Gianmarco, skill `frontend-design`.
- **Output** in `team/design/ui/`: **due direzioni diverse** della sola schermata Selezione su telefono (`direzione_A_selezione_telefono.html`, `direzione_B_…`), con PNG in `schermate/`, e `DIREZIONE.md`: idea di ciascuna in 5 righe, confronto contro I1–I5, quale si porta avanti e perché.
- **Fatto quando:** le due direzioni differiscono per struttura (posto di Sequenza, carte e minacce), non solo per colori; entrambe usano dati reali della stanza 1; la scelta cita gli indicatori.

### B1.3b — Mockup completi e specifica · `designer-ux-ui`
- **Input:** direzione scelta, tutte le story Must e Should.
- **Output** in `team/design/ui/`: `mockup_<schermata>_telefono.html` e `_desktop.html`, PNG in `schermate/`, `SPEC.md`. Schermate obbligatorie, ognuna in entrambi i formati:
  1. **Selezione**, turno 1: 5 zombie con intenti e stati sulla mappa, uno slot coperto con costo in Luce, un dado tenuto e uno scartato;
  2. **Risoluzione, dado del giocatore**: caselle raggiungibili con costo in PM, mano leggibile, manovra base;
  3. **Risoluzione, carta aperta**: un'azione disponibile, una non disponibile con motivo, puntamento con bersaglio e spinta contro il muro;
  4. **Risoluzione, dado nemico**: percorso, danno, Scudo che assorbe, esito;
  5. **Fine Turno / Eco**: scarto, Eco con bersaglio in Plancia, rotazione dei CD, Sequenza del turno dopo già visibile;
  6. **Soglia**: Soste, tetto dei PT, pulsante spento con motivo;
  7. **Dettaglio** di carta e di nemico al tocco;
  8. **Fine partita** con causa.
  Stati da mostrare almeno una volta: Buio (Veglia finita), Stordito, Vulnerabilità, Contrattacco, Luce insufficiente, messaggio della guida nello spazio riservato.
- **SPEC.md:** componenti con stati (normale, attivo, spento con motivo, evidenziato), misure, tipografia, colori come variabili CSS, animazioni con durata, comportamento al tocco, elenco dei motivi di rifiuto, tabella componente → story, dati richiesti al motore, risultato della misura I3.
- **Fatto quando:** 8 schermate × 2 formati con PNG; misura I3 superata sui mockup del telefono; ogni story Must compare nella tabella; nessun testo di carta o numero inventato.

### B1.4 — Valutazione · `stratega`
- **Output:** `team/valutazioni/B1_<data>.md`: indicatori con evidenza, test di lettura I1 e I5 fatto da un agente che non ha letto la SPEC, controllo del brief (vedi Rischi), decisione `procedi al cancello` oppure `ripeti <passo>`. Allegato: una pagina per Gianmarco con le schermate e le domande a cui deve rispondere.

## 5. Cancello

Il batch si chiude quando il B1.4 dice `procedi` **e Gianmarco approva i mockup**. Il B2 non parte prima. Gianmarco riceve le PNG (telefono per prime) e le due direzioni del B1.3a, e risponde a:
1. Direzione approvata, da correggere (cosa), o da rifare?
2. Carte in mano sul telefono: va bene la forma abbreviata proposta? Chiude la domanda del 20/11 in `team/DOMANDE.md`.
3. Le eventuali domande di regola emerse nel B1.

La domanda del 20/11 sulla posizione del riquadro Suggerimento decade: la assorbe il tema 13.

## 6. Rischi

| Rischio | Segnale precoce | Risposta |
|---|---|---|
| Interfaccia "standard da AI" | Nel B1.3a le due direzioni si assomigliano; schede arrotondate tutte uguali, colonne simmetriche, gradienti; togliendo i testi non si capisce che è TLN | Si ripete il B1.3a prima di fare 16 mockup |
| Bella ma poco leggibile | Il test I1 fallisce; decorazioni con più contrasto dei dati | La leggibilità vince: si toglie decorazione, non informazione |
| Telefono trattato come desktop ridotto | Il mockup desktop nasce prima; la griglia sul telefono scende sotto metà schermo | Il B1.3a è solo telefono; il desktop si deriva dopo |
| Story che cambiano regole o chiedono dati che il motore non ha | Criteri che citano valori non presenti in `src/engine/` | Domanda in `DOMANDE.md` oppure voce "dato richiesto al motore" |
| Troppe story, B2 ingestibile | Più di 12 Must | Il ricercatore declassa; lo stratega taglia nel B1.4 |
| Mockup fatti su un caso comodo | Stanza con 2 nemici, mano di 3 carte | Obbligo: 5 zombie, mano di 5, Plancia con carte in CD |
| Interfaccia che obbliga a un tutorial lungo | Schermate che si capiscono solo con una spiegazione a parte | Tema 13 e indicatore I4: la schermata dice da sola cosa fare ora |
