# Le Ore — esplorazione "il tempo" (B1.3e)

*designer-ux-ui · 2026-11-22 · branch `prova-demo` · metafora assegnata: il tempo*

Schermate: `selezione_telefono.png`, `risoluzione_carta_telefono.png` (844×390, scala 2). HTML autonomi con lo stesso nome (font incorporati). Generatore e misura in `strumenti/`.

## 1. L'idea in breve

Il turno è una **pagina che si legge da sinistra a destra**. La Sequenza Vincolata prende tutta la larghezza del telefono, la dimensione più lunga, perché è la cosa più lunga del gioco: fino a 10 momenti in fila. Ogni dado è una colonna della pagina. A sinistra della fila c'è lo stato di adesso, a destra lo stato a fine turno. In mezzo, in ordine, cosa succede.

Tre conseguenze che cambiano l'organizzazione:

1. **La pagina è il registro del turno.** Intento, danno previsto, esito e motivo stanno scritti nella colonna del momento che li produce, e ci restano. Non servono messaggi a tempo né l'elenco dei nemici.
2. **La stanza è ruotata**: tu a sinistra, i nemici arrivano da destra. Tempo e spazio hanno lo stesso verso: ciò che sta per succedere arriva da destra, nella pagina e nella stanza. In tutte le stanze di `rooms.js` il giocatore parte in riga 1, quindi vale sempre.
3. **Le carte dicono quando si giocano.** Ogni carta porta in testa il proprio "quando" ("al 2° e al 7°", "prima del 9°") e una riga di tacche che ricopia la pagina. Al loro momento le carte giocabili salgono, le altre restano giù con il motivo.

Nessuna linea attraversa i dadi: le due voci (loro in alto, io in basso) si distinguono per posizione e forma, le colonne sono separate da tratti verticali, che sono le finestre libere.

## 2. Il flusso, prima del disegno

Fonti: `docs/regole_v0041a.md`, `src/engine/` (`turn_manager.js`, `dice_system.js`, `resolution.js`), `team/ricerca/ui_2026-11-22.md`. "Oggi" è contato in **comandi del motore**, che è il minimo possibile: non ho aperto l'interfaccia attuale, che può chiederne di più.

| Fase | Cosa decide | Quanto spesso | Cosa gli serve in quel momento | Tocchi oggi (comandi) |
|---|---|---|---|---|
| Lancio | niente | 1 a turno | che il turno è nuovo, l'ordine dei dadi, di chi è ogni dado nemico | 0 |
| Fine Turno (dal turno 2) | quali carte scartare per l'Eco, quale carta in Plancia ruotare | 0–5 scelte | Eco di ogni carta, cosa esce dalla Plancia, quali dadi del turno già lanciato restano coperti | 1 per carta (+1 se c'è un bersaglio) + 1 |
| Preparazione | niente | 1 a turno | quante carte ha pescato, quali sono nuove | 0 |
| Selezione | tenere o scartare ognuno dei suoi 5 dadi | 5 scelte, tutte insieme | ordine dei suoi dadi rispetto ai nemici, cosa fa ogni nemico e quanto male, quali carte paga ogni dado, slot liberi o coperti, saldo di Luce | 4 `SEL_TOGGLE` + 1 `SEL_CONFIRM` = 5 (si parte con tutto scartato) |
| Risoluzione, finestra libera | muoversi, giocare una carta gratuita | fino a 10 a turno, quasi sempre vuote | PM e caselle, quale carta gratuita vale qui, chi agisce dopo | 1 `ADVANCE` ciascuna |
| Risoluzione, mio dado | quale carta aprire, quale Azione, quale bersaglio, manovra base | 3–4 dadi a turno, 1–3 scelte ciascuno | impulsi rimasti, carte pagabili e motivo delle altre, cosa cambia nel resto del turno | 2 `ADVANCE` per dado (attiva, chiude) + `OPEN_CARD` + `USE_ACTION` per Azione |
| Risoluzione, dado nemico | niente | 5 a turno | chi agisce, dove va, quanto toglie e perché | 1 `ADVANCE` ciascuno |

Turno 1 della Cripta con 4 dadi tenuti: 5 comandi in Selezione e **14 `ADVANCE`** in Risoluzione (4 dadi miei × 2, 5 nemici, 1 per chiudere), prima ancora di giocare una carta.

Cosa ne ricavo:

- La decisione più densa è la **Selezione**: cinque scelte prese insieme, che dipendono dall'ordine. Serve vedere ordine, minacce e carte nello stesso sguardo, senza toccare.
- La Risoluzione è fatta soprattutto di **avanzamenti**. La maggior parte delle finestre libere è vuota: fermarsi a ognuna è lavoro inutile.
- Le informazioni cambiano natura col tempo: prima è una previsione, poi un esito. Lo stesso posto può ospitare entrambe.

## 3. Organizzazione dello schermo

```
┌────────┬──────────────────────────────────────────────────────────┬────────┐
│ ADESSO │  LA PAGINA DEL TURNO: una colonna per momento            │ A FINE │ 100 px
│ turno  │  loro in alto (sigillo Z1..Z5), io in basso (dado)       │ TURNO  │
│ risorse│  sotto/sopra: cosa fa, quanto toglie, tieni/scarta       │ HP, PT │
├────────┴───────────┬──────────────────────────────────────────────┴────────┤
│ LA STANZA ruotata  │  una riga che dice cosa fare adesso                   │
│ tu a sinistra,     │  LA MANO: carte vere, in piedi                        │ 290 px
│ loro da destra     │                                                       │
│ 318 × 286          │  Plancia (ridotta)              [ azione principale ] │
└────────────────────┴───────────────────────────────────────────────────────┘
```

**La pagina (844×100).** È l'unica superficie chiara dello schermo, pergamena su buio: ha il peso maggiore senza bisogno di essere alta.
- *Testa, "adesso"*: turno, Veglia come sei tacche (il tempo lungo della notte accanto al tempo breve del turno), HP, PT, PM, Luce, stati del giocatore.
- *Colonne*: 66 px l'una con 10 momenti, 75 con 8. Dado nemico in alto con la sigla del nemico al posto del numero (il numero del dado non serve al giocatore, l'azione sì). Dado mio in basso, forma diversa per tipo: quadrato Vigore, triangolo Fuoco, rombo Terrore. Nell'altra metà della colonna, due righe di testo: per i nemici azione ed effetto su di me ("Orda −2 HP", "non arriva"); per i miei dadi, in Selezione "Tieni · 2 carte" o "Scarta · +1 Luce", in Risoluzione quante carte pagano.
- *Coda, "a fine turno"*: HP, PT, PM, Luce previsti. Cambia mentre scelgo i dadi e mentre punto una carta. Nella seconda schermata dice "se non confermi: morte al 3°".
- *Momento corrente*: la colonna si allarga, prende il bordo dorato e mostra gli impulsi rimasti.

**La stanza (318×286).** Caselle alte 44 px, il minimo per il tocco. Ogni nemico porta un cartiglio con il **numero del suo momento** nella pagina, l'azione e il danno su di me; percorso tratteggiato fino alla casella d'arrivo. Chi mi colpisce ha il cartiglio chiaro e il tratto rosso pieno, chi non arriva è spento. HP sotto ogni pedina.

**Niente HUD laterale, niente elenco nemici.** Le risorse sono la testa e la coda della pagina; i nemici sono nella pagina e sulla mappa con le stesse parole.

**Plancia.** In Selezione e Risoluzione è un segno piccolo (posti liberi e occupati, nome della carta che riposa). Il dato che serve davvero in Selezione, cioè "questo dado è coperto, da quale carta, quanta Luce costa", sta scritto sulla colonna del dado. In Fine Turno la Plancia si apre al posto della riga guida.

**Fine Turno.** Il motore lancia prima di chiudere il turno precedente. Qui non è un problema da nascondere: la pagina nuova è già lì, con i dadi lanciati, e l'etichetta dei miei dadi coperti cambia mentre scelgo gli Eco ("coperto, 2 Luce" diventa "libero" se ruoto la carta che lo copre). Le carte mettono in evidenza il piede con l'Eco. Azione principale: "Chiudi il turno 1".

## 4. La mano di carte

- **Sono carte.** Proporzione da tarocco (97×188), nere con filo d'oro, in piedi una accanto all'altra. Cinque stanno affiancate senza coprirsi. Dalla sesta in poi, o quando una carta è aperta, si chiudono a ventaglio: resta visibile la colonna sinistra di ognuna con quando, nome e Azioni.
- **Cosa si legge senza aprirle**: quando si gioca, nome, Azioni con costo in forma breve, Eco, CD (solo se ≥ 1).
- **Il "quando"**: una riga di testo ("al 2° e al 7°") e sopra le tacche che ricopiano la pagina. Tacca piena: il dado giusto. Tacca vuota dorata: si può pagare con un altro dado (Fuoco con Amplificazione, Terrore con Conversione Oscura). Trattino: dado scartato. Per le carte gratuite i segni stanno **tra** le tacche, perché si giocano nelle finestre libere.
- **Ingrandire**: un tocco. La carta sale e diventa grande (178×249) accanto alla stanza, con il testo intero; le altre si chiudono a ventaglio; nella pagina si accendono le colonne in cui si può giocare. Un tocco fuori la rimette giù. Nessun tocco prolungato.
- **Giocare**: lo stesso gesto. Se è il momento giusto, la carta ingrandita è anche aperta: mostra le Azioni in ordine, quale è la prossima, quali sono chiuse e perché. Non si spende niente finché non si conferma un'Azione, e fino ad allora "Rimetti in mano" è un tocco fuori.
- **Bersaglio**: primo tocco sceglie e mostra l'anteprima (sulla mappa e nella pagina), secondo tocco sullo stesso punto o sul pulsante principale conferma. Se il bersaglio valido è uno solo è già scelto.
- **Carte che non si possono giocare adesso**: restano giù e scrivono il motivo del motore sul bordo ("Serve un dado attivo con impulsi adatti", "Nessun posto libero in Plancia").

## 5. Un turno raccontato (Cripta, turno 1)

Sequenza: Z1 · ✊1 · 🔥1 · Z2 · Z3 · Z4 · ✊2 · Z5 · 🔮4 · 🔥2. Mano: Attacco di Fuoco, Diniego Sismico, Distorsione, Parata, Carica Furiosa.

| # | Momento | Cosa vedo | Cosa faccio | Tocchi |
|---|---|---|---|---|
| 1 | Selezione | La pagina con i 10 momenti. Proposta già applicata: tengo ✊1, ✊2, 🔮4, 🔥2, scarto 🔥1 (non ha slot). Coda: HP 7, Luce 1 | Leggo: Z1 mi colpisce prima che io agisca; prima di Z2 ho un ✊. Confermo | 1 |
| 2 | Finestra prima di Z1 | Pulsante: "Lascia agire Z1". Caselle raggiungibili con 2 PM | Resto fermo, lascio agire | 1 |
| 3 | Z1 | Z1 si muove e colpisce. Nella sua colonna resta scritto "−1 HP". La pagina passa da sola al mio ✊1 | — | 0 |
| 4 | ✊1 | Diniego Sismico e Parata salgono. Le altre restano giù | Tocco Diniego, Z1 è l'unico adiacente ed è già scelto con la spinta dritta; confermo | 2 |
| 5 | fine ✊1 | Impulsi finiti. Pulsante: "Avanti: Z2, Z3, Z4" | Avanti | 1 |
| 6 | Z2, Z3, Z4 | Tre battute di seguito, 0,6 s l'una; ogni esito resta scritto nella sua colonna. Si ferma sul mio ✊2 | — | 0 |
| 7 | ✊2 | Parata sale | Tocco Parata, tocco "+1 Scudo", tocco "pesca 1 carta" | 3 |
| 8 | fine ✊2 | Pulsante: "Avanti: Z5" | Avanti | 1 |
| 9 | 🔮4 | Distorsione sale | Tocco la carta, tocco Z2, tocco la casella d'arrivo (X = distanza), confermo | 4 |
| 10 | fine 🔮4 | Restano 2 🔮 che potrei convertire. Pulsante: "Avanti: perdi 2 🔮" | Tocco, il pulsante chiede conferma, confermo | 2 |
| 11 | 🔥2 | Attacco di Fuoco sale se ho un adiacente; altrimenti la manovra Colpo a Distanza sta sulla colonna del dado | Manovra, bersaglio, conferma, due volte | 4 |
| 12 | fine turno | Pulsante: "Chiudi i dadi" | Avanti | 1 |
| 13 | Fine Turno (turno 2 già lanciato) | Carte con l'Eco in evidenza, Plancia aperta | Scarto una carta per l'Eco, chiudo | 2 |

**Totale: 22 tocchi**, di cui 1 in Selezione e 7 per avanzare. Oggi gli stessi passi chiedono almeno 5 comandi in Selezione e 14 per avanzare (19 contro 8), più le carte.

Regole che tengono basso il conto:
- La Selezione parte da una proposta sensata (US-04 opzione b). Un dado scartato perché lo slot è occupato da un altro dado dello stesso tipo si scambia con un tocco solo.
- "Avanti" chiude il mio dado, fa agire tutti i nemici che seguono e si ferma sul mio prossimo dado già attivo. Il pulsante dice sempre chi agisce.
- Davanti a un mio dado il tempo si ferma nella finestra libera **solo se** ho una carta gratuita giocabile lì.
- Conferma in due tocchi solo se sto lasciando impulsi con cui potevo ancora pagare qualcosa.

## 6. Le due schermate

**Selezione** (`sel_proposta` di `dati_mockup.json`). Senza toccare nulla si legge: Z1 Orda −1 al 1° momento, Z2 Orda −2 al 4°, Z3 e Z4 non arrivano, Z5 si scuda +2; arrivo a fine turno con HP 7 se non faccio nulla; 🔥1 è scartato e perché. Un solo pulsante: "Conferma 4 dadi · scarti 1 Fuoco: +1 Luce".

**Risoluzione con carta in uso** (`carta_aperta`, turno 2). Attacco Poderoso aperto sul ✊2, seconda Azione già usata su Z4, resta 1 ✊. Il giocatore ha toccato Z2 e la casella dove spingerlo. In verde tratteggiato l'anteprima: Z2 salterà il suo momento, Z1 scende da −6 a −4, la coda passa da "morte al 3°" a HP 4. La prima Azione è chiusa con il suo motivo. Un solo pulsante: "Conferma la spinta".

Rispetto al dato salvato ho cambiato il bersaglio in anteprima (Z2 invece di Z4) per mostrare l'effetto sul resto del turno. **I numeri dell'anteprima (Z1 −4, HP 4) li ho calcolati a mano dalle regole, non vengono dal motore.**

Misura automatica (`strumenti/misura_risultato.json`): 0 testi sotto 12 px su 130 e 135, 0 bersagli sotto 44 px su 22 e 24, niente fuori schermo.

## 7. Rischi e punti aperti

| # | Rischio | Peso | Nota |
|---|---|---|---|
| 1 | **Previsione "a fine turno" e anteprima delle carte** chiedono al motore la simulazione in ordine di Sequenza (DM1) e, in più, la simulazione dell'Azione prima della conferma (nuovo, lo chiamerei DM5) | Alto | Senza, la coda scrive "se nulla cambia" e l'anteprima mostra solo gli effetti certi (Z2 stordito salta). È il pezzo che dà più valore: va deciso presto |
| 2 | **Stanza ruotata** e caselle a 44 px esatti: nessun margine per stanze più grandi di 6×8 | Alto | La rotazione è una scelta di camera, non di regole, ma tocca la scena 3D rimandata |
| 3 | **Cartigli sulla mappa** quando i nemici si ammassano accanto al giocatore | Medio | Nella seconda schermata reggono con 5 unità in 3 colonne; con 6–7 nemici adiacenti servirebbe mostrare solo numero e danno |
| 4 | **La pagina è in alto**, il pulsante in basso a destra: in Selezione il pollice sale ai dadi (al più 5 tocchi a turno) | Medio | Da provare su telefono vero |
| 5 | **Carte larghe 97 px**: servono le forme brevi del testo; "Vulnerabilità Fuoco" va a capo male | Medio | Lega alla domanda aperta del 20/11 sulla forma abbreviata |
| 6 | **Con una carta aperta** le altre hanno 61 px di colonna visibile | Medio | Leggibili ma strette; con 6+ carte in mano peggiora |
| 7 | **Plancia ridotta a un segno** fuori dal Fine Turno | Basso | Chiede DM3 per scrivere sul dado quale carta lo copre |
| 8 | 11 o più momenti: colonne da 60 px | Basso | Regge fino a 13 (51 px) |
| 9 | Tre famiglie di caratteri (Almendra titoli, Grenze Gotisch cifre, Alegreya Sans testo) | Basso | Grenze si può togliere |
| 10 | Desktop, Soglia, dado nemico in corso, Fine Turno: solo descritti | — | Fuori dal perimetro di questa esplorazione |

## 8. File

- `selezione_telefono.html` / `.png`
- `risoluzione_carta_telefono.html` / `.png`
- `strumenti/genera.js` (costruisce gli HTML), `strumenti/scatta.js` (PNG e misura), `strumenti/misura_risultato.json`
