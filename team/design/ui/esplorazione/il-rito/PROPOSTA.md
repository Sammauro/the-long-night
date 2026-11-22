# Il Rito — proposta di organizzazione dello schermo (B1.3e)

*esploratore "il rito" · 2026-11-22 · telefono 844×390 · dati: `bozze_B1.3b/strumenti/dati_mockup.json` (stati `sel_proposta` e `carta_aperta`)*

Schermate: `selezione_telefono.html` / `.png`, `risoluzione_carta_telefono.html` / `.png`. Si rigenerano con `strumenti/genera.js` e `strumenti/schermate.js` (font Grenze e Grenze Gotisch incorporati nei file, nessuna rete).

## 1. L'idea in breve

L'Indagatore combatte tracciando un cerchio di gesso sul pavimento. **Lui è il centro del cerchio, la Sequenza Vincolata gli gira attorno in senso orario.** Il cerchio ha un dentro e un fuori, e questo è tutto ciò che serve alla Selezione:

- **fuori dal cerchio** stanno i dadi che restano in Sequenza (i suoi e quelli dei nemici, nell'ordine in cui si risolvono);
- **dentro il cerchio** finiscono i dadi scartati, che diventano parte di lui: PM, Luce, PT.

Al centro non c'è un pannello di statistiche ma la sua figura: i PT stanno alla testa, gli HP al petto, la Luce è un chiarore che gli nasce dentro e cresce con il numero (non una candela, non la luce della stanza), i PM ai piedi. A destra, sul panno, le carte: stese come carte, girate davvero quando vanno in Plancia.

Non c'è nessuna linea che attraversa i dadi: il cerchio di gesso passa *tra* la Sequenza e gli scarti, è un confine e non un filo.

## 2. Il flusso di un turno (dal regolamento e dal motore)

Ordine del motore (`turn_manager.js`): Lancio → Fine Turno (saltato al turno 1) → Preparazione → Selezione → Risoluzione.

| Fase | Cosa decide il giocatore | Quanto spesso | Cosa gli serve in quel momento | Tocchi oggi |
|---|---|---|---|---|
| Lancio | niente | 1 a turno | che i dadi sono già lanciati e in che ordine; di chi è ogni dado nemico | 0 |
| Fine Turno | quali carte scartare per l'Eco; per "Ruota 1 CD" quale carta in Plancia | 0–5 carte a turno | Eco di ogni carta, cosa esce dalla Plancia, quali slot resteranno coperti | 1 per carta + 1 per il bersaglio + 1 per chiudere |
| Preparazione | niente | 1 a turno | quante carte ha pescato | 0 |
| Selezione | tenere o scartare ognuno dei 5 dadi; pagare Luce per uno slot coperto | 5 dadi a turno, ma di solito cambia 0–2 scelte | posizione dei suoi dadi rispetto ai dadi nemici; cosa farà ogni nemico e quanto male fa; cosa rende lo scarto; le carte in mano (per sapere quali impulsi servono) | il motore parte con `keep = {}`, cioè tutto scartato: 1 `SEL_TOGGLE` per ogni dado tenuto (4) + Conferma = **5** |
| Risoluzione, finestra libera | muoversi, giocare una carta gratuita, avanzare | prima e dopo ogni dado | PM e caselle raggiungibili, prossimo dado | 1 per passo, 1 per avanzare |
| Risoluzione, dado suo | aprire una carta, scegliere l'Azione, il bersaglio, la casella di spinta | 3–4 dadi a turno, 1–2 Azioni per dado | impulsi rimasti, Azioni pagabili, bersagli validi, cosa succede dopo (chi mi colpisce) | carta + Azione + bersaglio (+ casella) = 3–4 per Azione |
| Risoluzione, dado nemico | niente | 5 dadi a turno | chi agisce, dove va, quanto danno, perché | 1 per dado se si avanza a mano |

Due osservazioni che guidano il disegno:

1. **La decisione più pesante del turno è la Selezione, e si prende guardando tre cose insieme:** l'ordine della Sequenza, le minacce sulla mappa, le carte in mano. Oggi stanno in tre punti lontani e le carte non si leggono. Qui la mano è stesa e leggibile proprio in Selezione.
2. **In Risoluzione lo sguardo fa sempre lo stesso giro:** dado attivo → carta → bersaglio sulla mappa. Quando una carta è aperta le altre non si possono giocare (`OPEN_CARD`: "Chiudi prima la carta aperta"), quindi nasconderle non costa nulla: la carta aperta può prendersi tutto lo spazio della mano.

I conteggi "oggi" sono ricavati dai comandi del motore e dalla ricerca del 22/11, non misurati sull'interfaccia attuale (non l'ho guardata, come da brief).

## 3. L'organizzazione dello schermo

```
 Z1 ✊1        Quali dadi tieni?                 Plancia  [ ][ ][ ][ ]
    ·  △                                         ┌─────┐┌─────┐┌─────┐
   ·    Z2          ⬡ ⬡ ⬡ ⬡ ⬡ ⬡ ⬡ ⬡              │carta││carta││carta│
  PT 6   Z3        ⬡ ⬡ ⬡ Z3 ⬡ ⬡ ⬡ ⬡              └─────┘└─────┘└─────┘
 (HP 10   Z4      Tu ⬡ Z1 ⬡ ⬡ ⬡ Z5 ⬡             ┌─────┐┌─────┐ mazzo
  Luce 0  ✊2       ⬡ ⬡ ⬡ Z2 ⬡ Z4 ⬡ ⬡             │carta││carta│
  PM 2   Z5                                      └─────┘└─────┘
   ·  🔮4          voce: cosa arriva, cosa       [  Conferma i dadi  ]
 🔥2                puoi fare prima
```

Tre zone, nessuna è una fascia né una colonna di pannelli:

- **La ruota (sinistra, mezzo cerchio centrato sul bordo).** Centro in (34,195), dadi su un arco di raggio 166 da 5° a 175°: si legge dall'alto in basso, in senso orario, con tre tacche a freccia sul gesso. I dadi del giocatore sono solidi e hanno la forma del loro poliedro (quadrato ✊ d6, triangolo 🔥 d4, rombo 🔮 d8); i dadi nemici sono dischi scuri bordati di rosso con il nome del nemico e, senza toccare nulla, intento e danno previsto ("Z2 −2"). Il pollice sinistro ci arriva senza spostare la mano.
- **La mappa (centro).** Ruotata di 90° rispetto al tavolo: le 8 righe corrono in larghezza, così l'Indagatore sta a sinistra, vicino alla sua figura, e i nemici vengono da destra. Caselle 52×45 px, griglia intera sempre visibile (325×293). Sopra la mappa una sola domanda ("Quali dadi tieni?", "Dove spingi Z4?"); sotto, la *voce*: due righe che restano finché la situazione non cambia e dicono cosa è appena successo e cosa sta per succedere ("Prima di Z2 hai ✊ 1").
- **Il panno (destra).** Plancia in alto (4 posti, quelli coperti mostrano la carta girata), mano sotto, un solo pulsante nell'angolo del pollice destro.

Sulla mappa ogni nemico porta tre cose fisse: sopra la casella l'intento con il danno che subirei (rosso pieno se mi colpisce, spento con "0" se non mi raggiunge, azzurro per gli Scudi), dentro la pedina nome e HP, sotto la casella gli stati. Il percorso è tratteggiato fino alla casella d'arrivo, e chi colpisce ha una tacca rossa spessa dalla casella d'arrivo a me. Intenti sopra, stati sotto: vale anche per la pedina del giocatore.

**Cosa cambia tra le fasi.** La ruota e la mappa non si spostano mai. In Risoluzione una lancetta d'oro va dal centro al dado attivo, che prende un contorno d'oro e una targhetta "resta 1 ✊"; i dadi risolti si spengono, quelli saltati (nemico morto o Stordito) sono barrati con scritto "salta". I dadi scartati in Selezione restano dentro il cerchio con il loro valore, come chiede la regola.

**Una sola cosa d'oro per volta.** L'oro è il colore di "adesso tocca qui": in Selezione il pulsante Conferma, in Risoluzione il dado attivo e, con una carta aperta, le caselle da toccare. Con la carta aperta non c'è nessun pulsante dorato: "Chiudi la carta" è a contorno, perché la mossa attesa è sulla mappa.

## 4. Le carte come mano

- **Stese sul panno (Selezione, finestra libera, dado attivo senza carta aperta).** 5 carte intere, 90×134 px, tre sopra e due sotto, leggermente storte come posate a mano; il sesto posto è il mazzo, a dorsi impilati, con il conto di mazzo e scarti. Ogni carta ha: nome, il segno di Cooldown (una carta girata con dentro i turni di riposo; due carte sovrapposte per CD 2), le Azioni in ordine con il costo in un tondo (✊ 🔥 🔮, cerchio vuoto = gratis) e l'effetto in forma breve, e in fondo la fascia Eco sempre nello stesso punto. Tutto a 12 px o più: si leggono senza aprirle (US-11, I5). L'angolo in basso a destra piegato in oro segna la carta appena pescata.
- **Ingrandire una carta.** Un tocco su una carta la alza: prende tutto lo spazio della mano (272×234 px) con il testo intero. Le altre scivolano sotto e ne sporge la cima con il nome. In Selezione e Fine Turno è solo lettura, un tocco fuori la rimette giù. Nessun tocco prolungato obbligatorio.
- **Giocare una carta.** In Risoluzione la stessa alzata è la carta aperta: in testa gli impulsi del dado (pieni quelli rimasti, tratteggiati quelli spesi), poi le Azioni come righe alte almeno 46 px. La prima Azione pagabile è già armata (fondo chiaro, bordo oro, "Ora: tocca…"), quindi il gesto è **carta → bersaglio sulla mappa**; si tocca una riga solo per passare a un'Azione successiva. Le Azioni non disponibili sono barrate con il motivo del motore scritto sotto ("Non si torna a un'Azione precedente"). Nel piede: "Rimetti in mano" con il suo motivo se non si può, e la conseguenza della chiusura ("in Plancia 2 turni, copre lo slot 🔮"). Finiti impulsi o Azioni la carta si chiude da sola (`autoClose` del motore) e va a girarsi nella Plancia.
- **Scartare per l'Eco (Fine Turno).** Mano stesa, la fascia Eco di ogni carta diventa la parte accesa; un tocco spinge la carta verso il cerchio (stesso gesto dei dadi: ciò che scarti entra in te) e il guadagno compare sulla figura. "Ruota 1 CD" accende in oro le carte in Plancia.
- **Più di 5 carte** (Parata, Scatto, Distorsione fanno pescare): le righe passano a 4+3 con sovrapposizione laterale; resta scoperta la colonna dei costi e il nome, la carta toccata sale in primo piano.

## 5. Un turno raccontato (stanza 1, turno 1, dati di `sel_proposta`)

Sequenza in senso orario: Z1 · ✊1 · 🔥1 · Z2 · Z3 · Z4 · ✊2 · Z5 · 🔮4 · 🔥2. Mano: Attacco di Fuoco, Diniego Sismico, Distorsione, Parata, Carica Furiosa.

| # | Momento | Cosa vedo | Tocchi |
|---|---|---|---|
| 1 | **Selezione** | La proposta è già fatta (US-04): quattro dadi fuori dal cerchio, il 🔥1 dentro perché c'è un solo slot 🔥; sulla figura "Luce 0 +1" e "HP 10, −3 in arrivo". La voce: "Prima di Z2 hai ✊ 1". Mi va bene. **Conferma i dadi**. | 1 |
| 2 | Finestra libera | La lancetta punta Z1, primo della ruota. Non ho dadi prima di lui. **Avanti**. | 1 |
| 3 | Z1 | Il gioco si ferma su Z1: percorso, Attacco Orda, −1 HP; la voce spiega. La lancetta passa da sola al mio ✊1. | 0 |
| 4 | ✊1 | Diniego Sismico ha il bordo acceso (pagabile). La tocco: si alza, Azione armata. Tocco Z1. Tocco la casella dorata dove spingerlo (verso la trappola). La carta si chiude da sola e si gira in Plancia. | 3 |
| 5 | Z2, Z3, Z4 | **Avanti**: i tre dadi nemici di fila si risolvono uno dopo l'altro con una pausa leggibile ciascuno; un tocco solo per il gruppo. | 1 |
| 6 | ✊2 | Parata: la tocco, tocco la riga "+1 Scudo" (non ha bersaglio, la riga è il gesto), tocco "Pesca 1". Si chiude da sola. | 3 |
| 7 | Z5 | **Avanti**: Incassare, +2 Scudi sotto la sua casella. | 1 |
| 8 | 🔮4 | Distorsione: la tocco, tocco Z2, tocco la casella d'arrivo. X non si imposta a parte: è la distanza della casella scelta, e la carta dice "X = 2, −1 PT" prima della conferma. | 3 |
| 9 | 🔥2 | **Avanti** (1). Attacco di Fuoco: carta, Z1 (2 Danni Fuoco), riga "Vulnerabile al Fuoco", Z1. | 5 |
| 10 | Ultima finestra | **Avanti**: fine della Risoluzione. | 1 |
| 11 | **Fine Turno** (turno 2 già lanciato: la ruota mostra i dadi nuovi ma capovolti in grigio, "lanciati, li scegli dopo") | Tocco Carica Furiosa per l'Eco (+1 Luce), **Chiudi il turno**. | 2 |
| | **Totale** | | **21** |

Lo stesso turno con i gesti di oggi (4 dadi da tenere + Conferma; carta + Azione + bersaglio per ogni Azione; X di Distorsione impostato a parte; un avanzamento per dado): circa **33–35** tocchi. I risparmi vengono da tre scelte, non dalla grafica: proposta iniziale in Selezione (−4), prima Azione già armata (−1 per carta), dadi nemici consecutivi in un tocco (−3).

**Errori resi difficili.** Conferma distratto: non butta nulla, parte da una proposta sensata. Impulsi dimenticati: "Avanti" con impulsi rimasti scrive nel pulsante "perdi 1 ✊" prima del tocco. Carta sbagliata: "Rimetti in mano" finché nulla è stato usato. Slot coperto: il dado porta un sigillo con il costo e la carta che lo copre ("Distorsione, 2 Luce"); se la Luce non basta il dado non si sposta e il motivo resta scritto accanto.

## 6. Le due schermate

- **`selezione_telefono.png`** — SP1 con la proposta iniziale. Da leggere senza toccare: cosa fa ogni nemico e quanto male (mappa e ruota dicono la stessa cosa), quali dadi tengo, cosa mi rende lo scarto (cerchietti tratteggiati dentro il cerchio), cosa fanno le 5 carte.
- **`risoluzione_carta_telefono.png`** — turno 2, ✊2 attivo, Attacco Poderoso aperta, Azione 2 già usata una volta su Z4, 1 impulso rimasto; scelta della casella di spinta con il muro fuori griglia toccabile ("muro, 1 danno"). La figura dice "HP 8, −12 in arrivo" e la voce spiega perché (Vulnerabile ×2).

Misura automatica (`strumenti/schermate.js`): 0 testi sotto 12 px in entrambe. Bersagli: dadi 42–54 px su un passo di 55 px (area di tocco 48), caselle 52×45, carte 90×134, righe Azione ≥ 46, posti Plancia 44×44, pulsanti 44 e 48 di altezza.

## 7. Rischi e punti aperti

| Rischio | Quanto pesa | Cosa propongo |
|---|---|---|
| **Ordine orario invece che da sinistra a destra.** Il regolamento dice "da sinistra a destra"; qui si legge dall'alto in basso lungo l'arco. | Medio: è la scommessa della proposta | Tacche a freccia sul gesso, lancetta sul dado attivo, primo dado sempre in alto. Da provare con un principiante prima di tutto il resto. |
| **Più di 11 dadi.** A 13 dadi il passo sull'arco scende a 43 px. | Medio | L'arco può allungarsi oltre il mezzo giro spostando il centro verso l'interno (fino a ~190°), oppure i dadi nemici dello stesso tipo e consecutivi si impilano. Da decidere quando si sa il massimo di nemici per stanza. |
| **Mappa ruotata di 90°.** È un segnaposto piatto: la scena 3D vera è rimandata. | Basso per il mockup, da verificare con la camera isometrica | La ruota e il panno non dipendono dall'orientamento; serve solo che la griglia stia nei 325×293 centrali. |
| **Carte larghe 90 px.** Reggono 12–14 caratteri per riga; Carica Furiosa e Distorsione sono al limite. | Medio | Forma breve generata dai dati delle Azioni (funzione `breve` in `genera.js`). Per le tre carte gratuite il motore ha solo il testo lungo (`pre`): la forma breve di Carica Furiosa nel mockup è scritta a mano. Serve un campo breve nei dati o l'approvazione del testo. |
| **Carica Furiosa** consuma "2 dadi adiacenti in Sequenza": sull'arco "adiacenti" si vede, ma va disegnata la presa di due dadi vicini. | Basso | Non coperta dalle due schermate. |
| **Danno previsto in ordine di Sequenza (DM1).** "−3 in arrivo" e "−12 in arrivo" usano l'anteprima del JSON. | Già noto | Finché DM1 non c'è, la voce scrive "se nulla cambia". |
| **Dadi scartati nella schermata di Risoluzione.** Il JSON di `carta_aperta` non riporta i due dadi scartati al turno 2: i valori dentro il cerchio (✊1, 🔥2) sono illustrativi. | Basso | Il motore li ha (`state: 'discarded'`). |
| **Linguaggio del rito.** Ho tenuto i termini ufficiali (tieni, scarta, Sequenza, Plancia, Conferma) e lasciato il rito alla forma, non alle parole. | Scelta | Se piace, "scartare" può diventare "offrire" solo nei testi d'atmosfera, mai nei pulsanti. |
| **Il pollice sinistro copre la figura** mentre tocca i dadi bassi dell'arco. | Basso | I numeri che cambiano (Luce +1) compaiono anche nel sottotitolo del pulsante Conferma. |

## 8. Story coperte dalle due schermate

US-02 (misure), US-01 (domanda sopra la mappa), US-07 (Sequenza come orologio, dado→nemico per nome), US-06 (intento, danno, percorso, stati sulla mappa), US-03 e US-04 (due strade per dado, proposta iniziale, Conferma che non distrugge), US-11 (mano leggibile), US-08 e US-12 (dado attivo, impulsi, carta aperta, motivi), US-13 (spinta e muro), US-18 (motivi scritti dove si guarda), US-16 (risorse e stati sulla figura). Non disegnate qui: Fine Turno (US-15), dado nemico in corso (US-10), Soglia (US-19), slot coperto in Selezione (US-05), descritte sopra a parole.
