# Direzione dell'interfaccia: due proposte per la Selezione sul telefono (B1.3a)

*designer-ux-ui · 2026-11-22 · branch `prova-demo` · input: `team/ricerca/ui_2026-11-22.md`, `team/stories/ui/` (12 Must), schermate in `team/ricerca/shots/`, `CLAUDE.md` §7, brief di Gianmarco*

## Dove guardare

| File | Cosa |
|---|---|
| `schermate/direzione_A_selezione_telefono.png` | A, stato iniziale della Selezione (SP1) |
| `schermate/direzione_A_selezione_telefono_rifiuto.png` | A, Conferma spento con il motivo |
| `schermate/direzione_B_selezione_telefono.png` | B, stato iniziale (SP1) |
| `schermate/direzione_B_selezione_telefono_rifiuto.png` | B, Conferma spento con il motivo |
| `direzione_A_selezione_telefono.html`, `direzione_B_…html` | mockup statici; aperti senza parametri mostrano i due stati uno sotto l'altro, con `?stato=proposta` o `?stato=rifiuto` uno solo |
| `strumenti/` | generatore dei mockup, schermate, misura I3 (`misura_I3.js`) e risultato (`misura_I3_risultato.json`) |

PNG a 844×390, deviceScaleFactor 2. Rigenerare: `node team/design/ui/strumenti/direzione_A.js` (e `_B`), poi `NODE_PATH=$(npm root -g) node team/design/ui/strumenti/schermate.js` e `misura_I3.js`. Se Google Fonts non è raggiungibile, `font_locali.js` serve gli stessi font dai pacchetti `@fontsource` (variabile `FONTSOURCE_DIR`).

## Dati usati (nessun numero inventato)

Stanza 1 La Cripta, turno 1, seed 7, presi dal motore in Node (`createRun({seed:7, start:'r1'})`), uguali alle schermate della ricerca:
- **Sequenza** (`G.seq`): Z1 1 · ✊1 · 🔥1 · Z2 1 · Z3 1 · Z4 1 · ✊2 · Z5 4 · 🔮4 · 🔥2.
- **Nemici** (`E.ai.preview`): Z1 e Z2 Attacco Orda, arrivano adiacenti, 1 danno ciascuno; Z3 e Z4 Attacco Orda, non ti raggiungono (Z3 finisce sulla trappola R5E3); Z5 Incassare, +2 Scudi. Tutti 6/6.
- **Proposta iniziale** (`E.dice.selectionPlan` con ✊1, ✊2, 🔥2, 🔮4 tenuti): Slot 1, 3, 4, 2; il 🔥1 resta senza slot e scartato rende +1 Luce; Luce 0 → 1. Stato di rifiuto: tenuti tutti e 5, `ok:false`, il 🔥2 "nessuno slot".
- **Mano** (`cards.js` rev.11): Attacco di Fuoco, Diniego Sismico, Distorsione, Parata, Carica Furiosa. Risorse: HP 10/10, PT 6, PM 2, Salto 0, Luce 0, Veglia 1/6.

## Cosa hanno in comune (per confrontare solo la struttura)

- **Mondo:** pietra scura della cripta (`--notte #151519`, `--pietra`, `--filo` di `CLAUDE.md` §7), un solo accento caldo, l'oro della candela (`--oro #c9a84c`) per ciò che è mio e per l'unico pulsante primario; il rosso (`--sangue`) solo per la minaccia. Estensioni: `--sangue-vivo #e2705f` (rosso leggibile a 12 px su fondo scuro), `--carta #cdbd97` e `--inchiostro #2a2017` (carta consunta), tinte di tipo `--fuoco`, `--terrore`. Niente schede arrotondate né ombre morbide: carte come strisce di carta strappata, dadi d'osso, sigilli di cera.
- **Tipografia:** IM Fell English (carattere da stampa antica) per turno, fase e nomi delle carte, mai sotto 14 px; Alegreya Sans per tutto ciò che si legge in fretta, cifre allineate (lining), minimo 12 px. Scala: 12 · 13 · 14–16 · 17 · 20–22 · 28 (valore dei dadi, il numero più grande dello schermo).
- **Icone a inchiostro in SVG** per ✊ 🔥 🔮, artigli (Orda), scudo, HP, PT, PM, Salto, Luce: uguali su ogni telefono e distinguibili in scala di grigi (US-07 c.6).
- **Sigilli dei nemici:** lettera dentro una forma diversa per ogni zombie (Z1 cerchio, Z2 quadrato, Z3 rombo, Z4 scudo, Z5 esagono), identica sul dado e sull'etichetta in mappa (US-07 c.2, N3). Rosso pieno se mi raggiunge, grigio se no.
- **Stato iniziale sicuro, opzione (b) di US-04:** all'apertura la Selezione propone già "tieni ogni dado che ha uno slot libero; tra due dadi per lo stesso slot il valore più alto". Il pulsante dice cosa fa ("tieni 4, scarti 1: +1 Luce"); un tocco per sbaglio non butta dadi. Scartata l'opzione (a) (doppio tocco con tutti i dadi scartati): parte da uno stato che invita a perdere il turno e chiede un tocco in più a ogni partita.
- **Ogni dado del giocatore mostra le due strade** (US-03): sopra "Slot N" / "nessuno slot" (se lo tieni), sotto "+1 PM / +1 Luce / +1 PT" (se lo scarti).
- **Rifiuto scritto dove si guarda** (US-18): Conferma spento, motivo fisso accanto, il dado in conflitto segnato in rosso con "nessuno slot", riga di orientamento che dice cosa fare.

## Direzione A — "Il Rosario" (colonne)

```
┌──────────────────────────────────────────────────────────────────────┐
│ Turno 1  Selezione   Scegli quali dadi tenere…        ▭▭▭▭▭▯ Veglia 1/6 │
├────────┬──────────────────────────────────┬──────────────────────────┤
│ HP 10  │                                  │ ▒ Attacco di Fuoco  │Eco │
│ PT 6   │   MAPPA diritta, inclinata       │ ▒ Diniego Sismico   │Eco │
│ PM 2   │   (come la camera di oggi)       │ ▒ Distorsione       │Eco │
│ Luce   │   etichette di minaccia          │ ▒ Parata            │Eco │
│ Plancia│   sopra ogni zombie              │ ▒ Carica Furiosa    │Eco │
├────────┴──────────────────────────────────┴──────────────────────────┤
│ ●─□─▨─●─●─●─□─●─□─□─  rosario della Sequenza       ◀ CONFERMA I DADI │
└──────────────────────────────────────────────────────────────────────┘
```
1. La Sequenza è un rosario di dadi d'osso su un filo d'oro lungo tutto il bordo basso, nella zona dei pollici; Conferma è il sigillo in fondo al filo.
2. Tenere = il dado sale sul filo e si accende "Slot N"; scartare = il dado scende, rigato, e si accende la resa (+1 Luce): la scelta si legge dalla posizione, non dal colore.
3. La mappa resta diritta come la camera attuale e prende il 69% dell'altezza; ogni zombie porta un'etichetta di due righe (sigillo, azione; danno a te / "non ti raggiunge" / "+2 Scudi") e la casella d'arrivo tratteggiata.
4. La mano è un registro di strisce di carta a destra: nome e CD, una riga per Azione con il costo in un riquadro, l'Eco su una matrice staccata a destra, sempre nello stesso punto.
5. Risorse e Plancia in una colonna stretta a sinistra; le nicchie della Plancia mostrano il valore del dado che le occupa, legate al dado dalla scritta "Slot N".

## Direzione B — "Il Registro" (strati)

```
┌──────────────────────────────────────────────────────────────────────┐
│ Turno 1  Selezione   Scegli quali dadi tenere…              Veglia 1/6 │
├──────────────────────────────────────────┬───────────────────────────┤
│ ☺  MAPPA ruotata di lato: tu a sinistra, │ HP 10  PT 6  PM 2  Luce 0→1│
│    la cripta si apre verso destra;       │ [Slot1][Slot2][Slot3][Slot4]│
│    etichette accanto agli zombie         │ [   CONFERMA I DADI      ] │
├──────────────────────────────────────────┴───────────────────────────┤
│ PERGAMENA: ⬤Z1  ▢1  ▨1  ⬤Z2  ⬤Z3  ⬤Z4  ▢2  ⬤Z5  ▢4  ▢2   (a tutta larghezza)│
├──────────────────────────────────────────────────────────────────────┤
│ [Attacco di Fuoco] [Diniego Sismico] [Distorsione] [Parata] [Carica]  │
└──────────────────────────────────────────────────────────────────────┘
```
1. La stanza è ruotata di 90°: tu a sinistra, i nemici avanzano da destra, cioè nello stesso verso in cui si legge la Sequenza.
2. La Sequenza è una striscia di pergamena a tutta larghezza al centro dello schermo, l'unica superficie chiara: dadi d'osso per me, sigilli di cera rossa per i nemici.
3. La scelta è scritta come su una scheda di voto: l'esito scelto ("Slot 1" o "+1 Luce") è cerchiato a inchiostro; il dado scartato è barrato con una X.
4. Una colonna "altare" a destra raccoglie risorse, Plancia e Conferma, sopra la fine della Sequenza.
5. La mano è una fila di 5 carte scure in basso, con l'Eco su una riga fissa in fondo a ogni carta.

## Confronto con gli indicatori

Misura automatica (`strumenti/misura_I3.js`, risultato in `strumenti/misura_I3_risultato.json`) su entrambi gli stati di ciascuna direzione; i numeri sono uguali nei due stati.

| | A · Il Rosario | B · Il Registro |
|---|---|---|
| Testo sotto 12 px | **0** su 119 nodi (minimo 12) | **0** su 118 (minimo 12) |
| Bersagli di tocco sotto 44×44 | **0** su 25 (minimo 44×44) | **0** su 25 (minimo 75×44) |
| Griglia: caselle in vista, coperte da pannelli | 48/48, 0 | 48/48, 0 |
| Griglia: altezza (soglia 195 px) | **267 px, 69%** | 197 px, 51% (2 px sopra la soglia) |
| Casella più piccola (soglia 44 / 28) | **58 × 42** | 77 × 29 (1 px sopra la soglia minore) |
| Centri di casella sotto un'etichetta di minaccia | 9, senza unità né arrivi; uno è un passo del percorso di Z3 (R5E2) | 9, senza unità né arrivi; l'etichetta di Z2 sfiora il bordo dell'arrivo di Z2 |
| Pannelli sovrapposti | 0 | 0 |
| Pulsanti primari | 1 | 1 |
| Regole che dipendono dal passaggio del mouse | 0 | 0 |
| Dadi: lato minimo; corpo del valore vs altri numeri | 44 px; 28 px vs 20 | 44 px; 28 px vs 22 |

| Indicatore | A · Il Rosario | B · Il Registro | Meglio |
|---|---|---|---|
| **I1** minacce a colpo d'occhio | 5 etichette di due righe identiche nella forma, ognuna accanto al suo zombie; arrivo e percorso disegnati; spazio libero intorno | stesse informazioni, ma la mappa schiacciata (celle alte 29 px) obbliga a etichette con aggancio lungo (Z1) e a una posizione di ripiego (Z2) che sfiora la casella d'arrivo di Z2 | **A** |
| **I2** nessun rifiuto silenzioso | motivo fisso subito sopra Conferma e accanto al dado in conflitto (ultimo del rosario); riga di orientamento in rosso | motivo fisso sopra Conferma nell'altare; il dado in conflitto è nella pergamena 60 px più in basso | A, di poco |
| **I3** telefono per primo | passa con margine su tutto | passa, ma griglia e caselle sono a 1–2 px dalle soglie: qualunque riga in più (guida, Buio) la fa scendere sotto | **A** |
| **I4** un'azione principale, Sequenza con più peso, nessun dado perso | primario unico nella zona del pollice destro; stato iniziale sicuro. Debolezza: la mano di carta chiara (288×270 px) è la superficie più luminosa e compete con il rosario | primario unico; stato iniziale sicuro; la pergamena a tutta larghezza è senza dubbio l'elemento più forte dello schermo | **B** |
| **I5** carte leggibili in mano | 214 px di riga per le Azioni, al massimo 2 righe per carta, Eco su una matrice separata sempre nello stesso posto; nessun testo tagliato | 152 px di riga: Distorsione, Carica Furiosa e Attacco di Fuoco occupano 3 righe su 3 disponibili, senza margine per carte più lunghe | **A** |

Altri criteri: **costo di sviluppo** (B ruota la camera e schiaccia la vista: gli sprite di oggi si sovrapporrebbero; A tiene l'inquadratura attuale); **pollici** (in A dadi e Conferma stanno nel bordo basso, la zona più comoda in orizzontale; in B il primario è a metà altezza a destra, comodo, i dadi al centro, comodi); **desktop** (A si allarga senza cambiare gerarchia: mappa più grande, strisce con il testo intero; B anche).

## Scelta: si porta avanti la A, con tre innesti dalla B

**A — "Il Rosario"** vince su I1, I3 e I5 e pareggia su I2: la mappa ha il 37% di altezza in più (267 contro 197 px), le minacce stanno accanto ai nemici senza ripieghi, le carte si leggono intere con margine, e la camera resta quella di oggi. La B vince solo su I4, ed è proprio la parte che si può innestare nella A senza toccarne la struttura:

1. **Sequenza come unica superficie chiara** (da B): il rosario passa su una fascia di pergamena; la mano diventa carta in ombra (più scura di oggi, inchiostro chiaro o carta abbassata di tono), così la Sequenza torna l'elemento con più peso (I4, US-07 c.1).
2. **Esito scelto cerchiato** (da B): sotto e sopra ogni dado l'esito scelto è chiuso in un riquadro a inchiostro e l'altro è solo attenuato, al posto della barratura: "+1 PM" barrato si può leggere come "non disponibile".
3. **Dado scartato barrato con una X** (da B), oltre alla rigatura e alla posizione più bassa: più chiaro in scala di grigi.

## Da portare nel B1.3b

- **CRITICA per I1 — l'anteprima "se nulla cambia" sbaglia proprio in SP1.** Il mockup mostra Z2 "−1 HP", come dice `ai.preview`; ma Z1 agisce prima e arriva adiacente, quindi l'Orda di Z2 fa **2** danni. Verificato eseguendo il turno nel motore senza fare nulla: Z1 −1, Z2 −2, HP 10 → 7. La legenda "se nulla cambia" è vera alla lettera ma il totale letto (−2) è sbagliato di uno al primo turno della prima stanza. Propongo allo stratega di rendere **DM1** (anteprima in ordine di Sequenza) un requisito del B2 e non più "non bloccante".
- **Carte più lunghe:** Tiro Mirato ha tre righe ("Gittata 2", due Azioni) e Attacco Strategico ha un effetto lungo; la tabella delle 14 forme brevi (US-11 c.2) deve verificare che nessuna superi 2 righe a 214 px. Se una le supera, la passiva ("Gittata 2") va accanto al nome.
- **Spazio per la guida (US-22):** in A non c'è ancora. Candidato: la riga di orientamento che si apre su due righe spingendo in basso solo la colonna sinistra; da misurare.
- **Zone sicure dell'iPhone** in orizzontale (tacca ai lati, barra in basso): il rosario sta sul bordo basso; nel B1.3b va provato con i margini di sicurezza.
- Le 9 caselle con il centro sotto un'etichetta non hanno unità né arrivi, ma in A una è un passo del percorso di Z3: quando un percorso, un arrivo o un costo PM cade sotto un'etichetta, l'etichetta si sposta (regola di posizionamento da scrivere in `SPEC.md`).
- Le figure sulla mappa sono segnaposto: si progettano solo i segni sopra la mappa (decisione del 20/11).

## Domande per Gianmarco (al cancello)

1. A con i tre innesti da B ti convince, o preferisci la B (Sequenza al centro, stanza ruotata) accettando una mappa più piccola?
2. Ti va bene che la Selezione si apra con una proposta già fatta (si cambia con un tocco per dado) invece che con tutti i dadi scartati?
3. Forma breve delle carte (domanda del 20/11): quella del registro A ("1🔥 2 Danni Fuoco, adiacente") va bene?
