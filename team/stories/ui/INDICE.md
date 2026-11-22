# User story della nuova interfaccia di combattimento — indice (B1.2b)

*ricercatore-ux · 2026-11-22 · branch `prova-demo` · input: `team/ricerca/ui_2026-11-22.md` · piano: `team/PIANO.md` §4*

**22 story: 12 Must, 10 Should, 0 Could.** Nessuna cambia una regola; i dati che il motore oggi non espone sono scritti come "dato richiesto al motore" (DM1–DM4, in fondo).

## Come leggere i criteri

- **T** = telefono orizzontale 844×390 a tocco (primario) · **D** = desktop 1400×850 a mouse · **T·D** = vale per entrambi.
- Nel B1 (mockup) ogni criterio si verifica sulla schermata del B1.3b che rappresenta lo stato indicato; nel B2 (gioco) sul gioco vero, con uno screenshot o un'azione.
- **Stati di prova** (SP), tutti da `index.html?seed=7&room=r1` → "Salta il tutorial", salvo dove scritto. `team/ricerca/shots/fasi.js` riproduce SP1–SP5 nei due formati.

| SP | Stato | Come arrivarci |
|---|---|---|
| SP1 | Selezione, turno 1, 5 zombie, mano di 5, Plancia vuota | apertura della stanza |
| SP2 | Risoluzione, finestra libera prima del primo dado | SP1, tieni un dado per tipo (d8, un d6, un d4), Conferma |
| SP3 | Risoluzione, primo dado del giocatore attivo | SP2, avanza fino al primo dado del giocatore |
| SP4 | Carta aperta: Diniego Sismico | SP3, apri Diniego Sismico |
| SP5 | Fine Turno del turno 2 | SP1 giocato fino al turno 2 |
| SP6 | Risoluzione, primo dado zombie corrente | SP2, avanza fino al primo dado nemico |
| SP7 | Soglia dopo la Cripta | run dal menu con Cripta vinta, oppure stato preparato in console |
| SP8 | Primo turno di Buio (Cripta, turno 7) | partita portata oltre la Veglia, oppure stato preparato |
| SP9 | Sconfitta per HP a 0 da uno zombie | stato preparato in console (HP bassi, poi dado zombie) |
| SP10 | Selezione con una carta CD in Plancia (slot coperto) | SP1, gioca una carta CD 1 al turno 1, arriva alla Selezione del turno 2 |

## Elenco per priorità

Ordine dentro ogni priorità: prima ciò da cui dipendono le altre.

| # | Story | Priorità | Temi del piano | Dipende da |
|---|---|---|---|---|
| 1 | [US-02](US-02.md) Layout pensato per il telefono | **Must** | 12 | — |
| 2 | [US-01](US-01.md) Dove sono e cosa devo fare adesso | **Must** | 1 | US-02 |
| 3 | [US-07](US-07.md) La Sequenza come orologio, legata ai nemici | **Must** | 3, 4, 5 | US-02 |
| 4 | [US-06](US-06.md) Minacce sulla mappa | **Must** | 3 | US-07 · DM1 (non bloccante) |
| 5 | [US-18](US-18.md) Nessun rifiuto silenzioso | **Must** | 10 | US-02 |
| 6 | [US-03](US-03.md) Selezione: cosa rende tenere o scartare | **Must** | 2 | US-07 |
| 7 | [US-04](US-04.md) Selezione: stato iniziale sicuro e Conferma | **Must** | 2, 10 | US-03, US-18 |
| 8 | [US-11](US-11.md) Carte in mano leggibili sul telefono | **Must** | 6 | US-02 · domanda del 20/11 |
| 9 | [US-08](US-08.md) Il mio dado attivo e cosa ci posso fare | **Must** | 4 | US-07, US-11, US-18 |
| 10 | [US-12](US-12.md) Carta aperta | **Must** | 6, 7 | US-11, US-18 |
| 11 | [US-10](US-10.md) Quando tocca ai nemici | **Must** | 5 | US-06, US-07 |
| 12 | [US-15](US-15.md) Fine Turno: Eco, Plancia, rotazione dei CD | **Must** | 8 | US-01, US-11, US-18 · DM3 (criterio 4) |
| 13 | [US-05](US-05.md) Slot coperti: quale carta e quanta Luce | Should | 2, 8 | US-03 · DM3 |
| 14 | [US-09](US-09.md) Movimento e PM | Should | 4 | US-08 |
| 15 | [US-13](US-13.md) Puntamento, spinta e Collisione anche col muro | Should | 7 | US-12 |
| 16 | [US-14](US-14.md) Cono, Distorsione, Profondità Mente, Carica Furiosa | Should | 7 | US-13 |
| 17 | [US-16](US-16.md) Risorse e stati del giocatore | Should | 9 | US-02 |
| 18 | [US-17](US-17.md) Veglia e Buio | Should | 9, 1 | US-01, US-16 |
| 19 | [US-21](US-21.md) Telefono: tocco, dettaglio, orientamento | Should | 12, 3, 6 | US-06, US-11, US-12 |
| 20 | [US-22](US-22.md) Spazio per la guida | Should | 13 | US-02, US-18 |
| 21 | [US-19](US-19.md) Soglia: cosa resta e cosa dà ogni Sosta | Should | 11 | US-18 · DM4 |
| 22 | [US-20](US-20.md) Fine partita: perché è finita | Should | 11 | US-16 · DM2 |

Se lo stratega deve tagliare Must nel B1.4, le prime candidate a scendere a Should sono US-10 e US-15 (si appoggiano su componenti già esistenti oggi: pausa prima dei dadi nemici e testo fisso del bersaglio dell'Eco).

## Indicatori → story Must

| Indicatore | Criterio in una Must |
|---|---|
| I1 Minacce leggibili a colpo d'occhio | US-06 criterio 1 (anche US-07 criterio 2) |
| I2 Nessun rifiuto silenzioso | US-18 criteri 1–3 (anche US-08, US-12) |
| I3 Telefono per primo | US-02 criteri 1–5 e 7 |
| I4 Una sola azione principale; Sequenza con più peso; nessun dado perso per sbaglio | US-01 criterio 2; US-07 criterio 1; US-04 criteri 1–2 |
| I5 Carte leggibili in mano | US-11 criterio 1 |

## Temi del piano → story

| # | Tema | Story |
|---|---|---|
| 1 | Orientamento (compreso Lancio prima del Fine Turno) | US-01, US-17 |
| 2 | Selezione | US-03, US-04, US-05 |
| 3 | Minacce e legame dado→unità | US-06, US-07, US-21 |
| 4 | Risoluzione, dado del giocatore | US-08, US-09, US-07 |
| 5 | Risoluzione, dadi nemici | US-10, US-07 |
| 6 | Carte: lettura, apertura, azioni, dettaglio, rimettere in mano | US-11, US-12, US-21 |
| 7 | Puntamento: bersaglio, gittata, spinta e muro, Cono, Distorsione | US-13, US-14 |
| 8 | Fine Turno: scarto, Eco con bersaglio, Plancia e CD | US-15, US-05 |
| 9 | Risorse e stati del giocatore, Veglia e Buio | US-16, US-17 |
| 10 | Feedback e rifiuti; conferme solo dove si perde qualcosa | US-18, US-04 |
| 11 | Soglia e fine partita | US-19, US-20 |
| 12 | Telefono: tocco, tocco prolungato, orientamento | US-02, US-21 |
| 13 | Spazio per la guida | US-22 |

## Problema → story

Problemi della tabella §4 della ricerca. Nessuno è fuori ambito.

| # | Problema | Story |
|---|---|---|
| C1 | Selezione: tutti i dadi scartati di default; etichette minuscole | US-04, US-03 |
| C2 | Slot coperti e costo in Luce non spiegati | US-05 |
| C3 | Lancio prima del Fine Turno: Sequenza del turno 2 visibile mentre si chiude il turno 1 | US-01, US-15 |
| C4 | Eco con bersaglio in un messaggio di 2 s | US-15, US-18 |
| C5 | Intenti nemici solo nell'elenco e sul dado | US-06, US-07 |
| C6 | Non è chiaro che si attacca aprendo una carta; impulsi persi in piccolo | US-08, US-12 |
| C7 | "Continua da solo" attivo: nessun momento "tocca a loro" | US-10 |
| C8 | Telefono: le carte in mano non dicono cosa fanno | US-11 |
| C9 | Soglia: (a) pulsante spento senza motivo, (c) nessun dato per scegliere le Soste | US-19 · (b) è una regola: già in `DOMANDE.md` (20/11) |
| C10 | Veglia e Buio poco visibili | US-17, US-16 |
| C11 | Cono di Fuoco orientato da caselle condivise | US-14 |
| C12 | Fine partita senza causa | US-20 |
| A1 | Intenti e stati non sulla mappa; Z3 non collegabile allo sprite | US-06, US-07 |
| A2 | Telefono: carte senza Azioni | US-11 |
| B5 | Il messaggio breve copre la Sequenza | US-18, US-22 |
| T1 | "Conferma sembrava non fare nulla" | US-04, US-18, US-22 |
| T2 | Intenti e stati leggibili solo toccando i dadi | US-06 |
| T3 | Layout non pensato per il telefono | US-02 (e criteri [T] di tutte) |
| N1 | Costo PM senza spiegazione del "2", sovrapposto all'anteprima nemica | US-09, US-06 |
| N2 | Scorciatoie da tastiera mostrate sul telefono | US-21 |
| N3 | Dadi nemici con ritratti identici | US-07 |
| N4 | Carte pescate senza segno | US-01, US-11 |
| N5 | Anteprima nemica "se nulla cambia" | US-06 (DM1) |
| BUG-1 | Spinta contro il muro (corretto il 20/11, da mantenere) | US-13 |
| BUG-2 | Carta aperta ed elenco nemici sovrapposti | US-02 |
| BUG-3 | Riquadro della guida che copre la griglia | US-22 |
| BUG-4 | HUD non aggiornato alla sconfitta | US-20 |
| BUG-7 | Nessun riscontro al clic su una carta in Selezione / Fine Turno | US-18 |

## Dati richiesti al motore

Nessuno blocca i mockup del B1; servono nel B2. Il motore resta intatto finché Gianmarco o lo stratega non decidono di aggiungerli.

| # | Dato | Story | Oggi |
|---|---|---|---|
| DM1 | Anteprima dei nemici **in ordine di Sequenza** (danno e percorso simulando i dadi precedenti su una copia dello stato) | US-06 | `ai.preview` calcola ogni nemico da solo sullo stato attuale: la schermata scrive "se nulla cambia" |
| DM2 | **Causa della sconfitta** in `DEFEAT` (unità e azione dell'ultimo colpo, "Buio", o pagamento in PT) | US-20 | ricavabile dagli ultimi `DAMAGE`/`RESOURCE` |
| DM3 | **Carta che copre ciascuno slot**, adesso e dopo il Fine Turno con gli scarti e le rotazioni scelte | US-05, US-15 | `coverage()` dà solo vero/falso; l'anteprima del turno dopo è ricalcolata nell'interfaccia (`ui_plancia.js`, `nextCoverage`) |
| DM4 | **Anteprima delle Soste**: HP, PT e Luce d'ingresso dopo ciascuna Sosta e dopo il tetto dei PT, con l'ordine di `applyRests` (nuovo rispetto alla ricerca) | US-19 | il risultato esiste solo dopo la scelta (`SOGLIA_CHOSEN`) |

## Domande di regola

Nessuna nuova domanda di regola dal B1.2b. Restano aperte in `team/DOMANDE.md` e sono richiamate dalle story senza deciderle:
- 20/11, Soglia: ordine tra tetto dei PT e Raccogliersi, Sosta senza effetto (US-19);
- 20/11, forma abbreviata del testo delle carte sul telefono (US-11; si chiude al cancello B1, PIANO §5 domanda 2).

La domanda del 20/11 sulla posizione del riquadro Tutorial/Suggerimento decade, assorbita da US-22 (PIANO §5).
