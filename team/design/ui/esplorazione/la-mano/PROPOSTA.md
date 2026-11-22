# La mano — esplorazione B1.3e

*Metafora di partenza: gerarchia rovesciata. Dadi e carte a schermo pieno, la stanza è una finestra che cresce solo quando serve.*

File: `selezione_telefono.html` / `.png`, `risoluzione_carta_telefono.html` / `.png` (844×390, dati di `dati_mockup.json`: stati `sel_proposta` e `carta_aperta`). Rigenerabili con `strumenti/genera.js` e `strumenti/scatta.js`.

## 1. L'idea in breve

Il giocatore non decide "sulla mappa": decide **quali dadi tenere** e **quale carta giocare con quale dado**. La mappa serve in due soli momenti: capire le minacce e scegliere una casella o un bersaglio. Quindi:

- I dadi (la Sequenza) e le carte occupano lo schermo; la stanza è una finestra in basso a destra.
- La minaccia di ogni nemico è scritta **sul suo dado nella Sequenza** (azione sopra, danno sotto): il dado nemico è già "chi, quando, quanto". La stanza piccola aggiunge solo il "dove".
- Quando una carta o una manovra chiede un bersaglio, la stanza cresce a tutta altezza e la mano si ritira dietro la carta in uso. Finita la scelta, torna piccola.

## 2. Analisi del flusso (regolamento §5, comandi di `src/engine`)

| Fase | Decisioni del giocatore | Frequenza | Informazioni necessarie in quel momento | Tocchi oggi (1 comando = almeno 1 tocco) |
|---|---|---|---|---|
| Lancio | nessuna | 1 per turno | l'ordine della Sequenza | 0 |
| Fine Turno (dal T2) | quali carte scartare per l'Eco | 0–5 carte | Eco di ogni carta, risorse, Plancia dopo la rotazione, Sequenza del turno nuovo | `ECO_DISCARD` × n + `ECO_DONE` |
| Preparazione | nessuna | — | quali carte sono nuove | 0 |
| Selezione | tieni o scarta, per ogni mio dado | 5 dadi | valore e tipo, slot libero o costo in Luce, resa dello scarto, **cosa fanno i nemici prima e dopo quel dado**, quali carte ho da pagare | `SEL_TOGGLE` × 3–5 (oggi parte tutto scartato) + `SEL_CONFIRM` |
| Risoluzione, dado nemico | nessuna (guardare) | 5 per turno | chi agisce, cosa è successo | `ADVANCE` × 5 |
| Risoluzione, dado mio | quale carta, quale Azione, quale bersaglio o casella; muovermi; manovra base; passare | 3–4 dadi, 1–3 scelte ciascuno | impulsi rimasti, carte apribili e perché no, bersagli validi, esito della spinta | `OPEN_CARD` + `USE_ACTION` × azioni (+ casella), `MOVE`, `MANEUVER`, `ADVANCE` |

Cosa ne ricavo:

1. Su circa 25–30 tocchi di un turno, **quelli che toccano la mappa sono 4–6** (bersaglio, casella di spinta, movimento). Tutti gli altri cadono su dadi, carte e sul pulsante per avanzare.
2. La decisione più pesante (Selezione) non tocca mai la mappa: la legge soltanto.
3. I dadi nemici consecutivi chiedono un tocco ciascuno senza offrire una scelta.
4. La mappa serve grande per pochi secondi, ma in quei secondi deve avere caselle toccabili (≥ 44 px), cosa impossibile se divide lo schermo alla pari con mano e Sequenza.

## 3. Organizzazione dello schermo

Due assetti, stessa struttura. Il passaggio è un'animazione sola (stanza che cresce verso l'alto e a sinistra, 220 ms; la mano scivola dietro la carta in uso).

**Assetto "in mano"** (Selezione, finestre libere, Fine Turno):

```
┌────────────────────────────────────────────────────────────────┐
│ Selezione  turno 1 · cosa fare adesso            HP PT PM Luce │
│ ┌SEQUENZA VINCOLATA, tutta la larghezza──────────┐ ┌─────────┐ │
│ │ Z1  ✊1  🔥1  Z2  Z3  Z4  ✊2  Z5  🔮4  🔥2     │ │CONFERMA │ │
│ │ sopra: slot / azione   sotto: scarto / danno   │ │ esito   │ │
│ └────────────────────────────────────────────────┘ └─────────┘ │
│ ┌carta┐┌carta┐┌carta┐┌carta┐┌carta┐          ┌──la stanza────┐ │
│ │     ││     ││     ││     ││     │          │  (piccola)    │ │
│ └─Eco─┘└─Eco─┘└─Eco─┘└─Eco─┘└─Eco─┘          └───────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

**Assetto "nella stanza"** (una carta o una manovra chiede bersaglio o casella; movimento; dadi nemici):

```
┌──────────────────────────────────────┬─────────────────────────┐
│ Risoluzione  HP PT PM Luce  stati    │ Dove spingi Z4?         │
│ [✊2] Z1 Z2 🔥1 🔮1 Z3 Z4 Z5          │                         │
│ ┌carta in uso──┐┌dietro┐ dado attivo │      LA STANZA          │
│ │ Azione 1 ✗   │├──────┤ ●○ impulsi  │   (tutta altezza,       │
│ │ Azione 2 ◀   │├──────┤ Plancia     │    caselle 52×45)       │
│ │ Eco          │└──────┘ [Chiudi]    │                         │
│ └──────────────┘                     │                         │
└──────────────────────────────────────┴─────────────────────────┘
```

Scelte strutturali:

- **La Sequenza è la riga più alta e più larga** e fa anche da elenco delle minacce. Ogni posto ha tre livelli: sopra la strada "tieni" (per i miei dadi: slot e costo) o l'azione (per i nemici); al centro il dado; sotto la strada "scarta" (resa) o il danno previsto. Un dado tenuto sta in alto con una barra sotto; uno scartato scende, si inclina e diventa un contorno tratteggiato: differenza di posizione e forma, non solo di colore.
- **Forme dei dadi**: Vigore quadrato, Fuoco triangolo, Terrore rombo, nemico lapide con la sua sigla. Si distinguono in scala di grigi.
- **Il pulsante primario chiude la Sequenza a destra**: si legge da sinistra a destra e si arriva al pulsante. Il suo testo è l'esito ("tieni 4, scarti 1, +1 Luce"). In Risoluzione nello stesso punto c'è "Fai agire Z2, Z3, Z4" o "Passa: perdi 1 ✊".
- **La stanza è coricata**: le 8 righe corrono in orizzontale, il giocatore entra da sinistra. Su un telefono orizzontale è l'unico orientamento che dà caselle da 52×45 px a tutta altezza. Piccola misura 246×222 e mostra posizioni, percorsi, punto d'arrivo; chi mi raggiunge ha anello e percorso rossi.
- **La stanza cresce da sola** quando: apro una carta con bersaglio, scelgo una manovra con bersaglio, tocca ai nemici (la mano non serve, guardo loro), oppure la tocco per muovermi. Non copre nulla: prende il posto della mano, che si ritira.
- **Risorse** in una riga accanto al nome della fase, sempre lì. La Luce è un numero con un segno a quattro punte; in Selezione mostra "0 → 1".
- **Plancia**: accanto al dado attivo, come carta ruotata con la frase "copre lo slot 1, torna a Fine Turno". In Selezione lo slot coperto si legge sopra il dado ("slot 1 · 2 Luce").

## 4. Le carte come mano

- **Si tengono**: 5 carte vere a ventaglio (110×208 px), carta chiara stampata con inchiostro. In alto sigillo del tipo e CD, poi il nome, poi le Azioni in ordine con il costo in un tassello pieno (numero + icona) e l'effetto accanto; **l'Eco è sempre il piede scuro della carta**, stesso punto su ogni carta.
- **Si leggono senza aprirle**: testo a 12,5 px, costo ed effetto di ogni Azione sulla carta. Solo i testi liberi lunghi (Carica Furiosa) hanno una forma breve; il testo intero sta sulla carta ingrandita.
- **Si ingrandiscono**: un tocco alza la carta dal ventaglio e la porta a 192×258 con testo intero; le altre restano visibili dietro. Nessuna carta si gioca con un tocco solo.
- **Si giocano**: secondo tocco sulla carta alzata, o sul tassello "Apri con ✊ 2". La carta resta a sinistra, grande, per tutto l'uso: l'Azione in corso è il riquadro chiaro in rilievo, le Azioni passate sono barrate con il motivo. Le altre carte si infilano dietro a cascata (intestazioni leggibili, strisce da 47 px) con la frase "Ferme: una carta è aperta".
- **Si scartano** (Fine Turno): stessa grammatica dei dadi in Selezione. Tocco: la carta scende e si inclina, il piede Eco si accende, il pulsante dice "Scarta 2: +2 PM, +1 Luce".
- Carte non apribili adesso: restano nel ventaglio abbassate, con il motivo scritto sul bordo alto ("Serve 🔥: il dado è ✊").
- Manovra base del dado attivo: una mezza carta fissa accanto al dado ("1 ✊: +1 PM"), si usa come una carta.

## 5. Un turno raccontato (stanza 1, turno 1, da `sel_proposta`)

| # | Momento | Cosa faccio | Tocchi |
|---|---|---|---|
| 1 | Selezione | La proposta tiene ✊1, ✊2, 🔮4, 🔥2 e scarta 🔥1 (nessuno slot). Leggo sulla Sequenza: Z1 −1, Z2 −2, gli altri non arrivano. Conferma. | 1 |
| 2 | Finestra libera | "Fai agire Z1". La stanza cresce, Z1 arriva e colpisce, −1 HP, la stanza torna piccola. | 1 |
| 3 | Dado ✊1 | Tocco Diniego Sismico (si alza), tocco di nuovo (si apre, la stanza cresce), tocco Z1, tocco la casella di spinta. La carta va in Plancia da sola. | 4 |
| 4 | | "Fai agire Z2, Z3, Z4": un tocco per i tre dadi nemici consecutivi, con pausa dopo ognuno. | 1 |
| 5 | Dado ✊2 | Parata: alzo, apro, Azione 1 (+1 Scudo), Azione 2 (pesca 1). Niente bersaglio: la stanza resta piccola. | 4 |
| 6 | | "Fai agire Z5". | 1 |
| 7 | Dado 🔮4 | Distorsione: alzo, apro, tocco il nemico, tocco la casella d'arrivo (anteprima del percorso), ritocco per confermare. | 5 |
| 8 | | "Passa al dado 🔥". | 1 |
| 9 | Dado 🔥2 | Manovra Colpo a Distanza: tocco la mezza carta, tocco il bersaglio due volte. | 3 |
| 10 | | "Chiudi il turno". | 1 |
| 11 | Fine Turno | Abbasso due carte per l'Eco, "Scarta 2". | 3 |
| | **Totale** | | **25** |

Stessa giocata contando i comandi del motore di oggi: circa **30** (Selezione 5, un `ADVANCE` per dado 10, carte e manovra 12, Eco 3). Dove cambia: −4 in Selezione (proposta iniziale), −3 sui dadi nemici consecutivi, +3 per l'ingrandimento prima di aprire (scelta voluta contro le aperture accidentali), −1 per la chiusura automatica.

Errori che l'assetto previene: Conferma con tutto scartato (proposta iniziale), carta aperta per sbaglio (due tocchi), tocco su una casella troppo piccola (la stanza piccola non ha bersagli: un tocco la ingrandisce e basta), impulsi persi (il pulsante lo scrive).

## 6. Rischi e punti aperti

| Priorità | Rischio | Nota |
|---|---|---|
| CRITICA | **I1 chiede le minacce ancorate allo sprite.** Qui stanno sul dado; la stanza piccola mostra solo posizione, percorso e anello rosso. | È la scommessa del concetto. Va provata con il test di lettura I1: se fallisce, la stanza piccola deve portare anche il numero. |
| MEDIA | Muoversi costa un tocco in più (ingrandire la stanza). | Dopo un movimento la stanza resta grande finché non si tocca una carta. |
| MEDIA | Durante il puntamento la Sequenza si stringe a 56 px per posto: con 10 dadi non ci sta. | I dadi risolti si impilano a sinistra; da verificare su stanze con più nemici. |
| MEDIA | Mano oltre 5 carte (pesche in Risoluzione): il ventaglio deve sovrapporsi. | Fino a 7 carte con sovrapposizione del 25%; la carta toccata si alza. |
| MEDIA | La stanza coricata cambia l'orientamento a cui si è abituati. | Solo resa grafica, nessun effetto sul motore. |
| BASSA | In Risoluzione con bersaglio non c'è un pulsante primario: l'azione primaria sono le caselle color ottone. | "Chiudi la carta" è secondario, con il motivo sotto. |
| BASSA | Forma breve di Carica Furiosa scritta a mano. | Resta la domanda aperta del 20/11 sulla forma breve. |
| BASSA | Nel mockup di Risoluzione il bersaglio è di nuovo Z4, già stordito. | È lo stato del file dati; non ho ricalcolato le caselle di spinta per un altro bersaglio. |

Non coperti in questa esplorazione: desktop, Fine Turno, Soglia, dado nemico in corso, Buio.

## 7. Misure (Playwright, `strumenti/scatta.js`)

- Testo minimo 12 px in entrambe le schermate, nessun elemento fuori dal palco.
- Bersagli: posto della Sequenza 71×118 (dado 56), compatto 56×84; carta in mano 110×208; striscia della carta dietro 112×47; casella della stanza grande 52×45; Conferma 100×98; "Chiudi la carta" 124×44.
- Caratteri: Grenze Gotisch (nomi, fasi), Asap Condensed (dati e testo). Colori come variabili CSS nell'HTML.
