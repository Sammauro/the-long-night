# Il tavolo — proposta di esplorazione (B1.3e)

*designer-ux-ui · 2026-11-22 · branch `prova-demo` · brief: `../BRIEF.md`*

Schermate: `selezione_telefono.html` / `.png`, `risoluzione_carta_telefono.html` / `.png` (844×390, scala 2).
Si rigenerano con `strumenti/genera.js` e `strumenti/scatta.js`.

## 1. L'idea

Lo schermo è un tavolo visto dall'alto, e il tavolo è girato: **io siedo a sinistra, loro arrivano da destra**. Non c'è HUD. Ogni informazione è un oggetto con un solo posto: i dadi stanno nel binario, le risorse sono gettoni, la Plancia è il tappetino con gli slot, le carte sono in mano, il passaggio di fase è un sigillo di ceralacca.

Tre conseguenze che cambiano la struttura, non solo l'aspetto:

1. **La stanza è ruotata di 90°** (8 colonne × 6 righe). Sul telefono orizzontale la griglia intera sta in 325×293 px con caselle da 52×45, e lascia metà schermo al mio lato del tavolo.
2. **Il centro del tavolo è il posto dove si porta la carta.** Lì la carta si ingrandisce per leggerla e lì si gioca, accanto al tabellone dove si sceglie il bersaglio. Non esiste un pannello "carta aperta".
3. **La mano si alza e si abbassa.** Alzata si legge tutta. Quando una carta è al centro la mano si abbassa: le altre non si possono giocare (regola 3.4) e quindi non competono.

## 2. Analisi del flusso

Fonti: `docs/regole_v0041a.md` §3–§5, `src/engine/dice_system.js` (selectionPlan, SEL_TOGGLE, SEL_CONFIRM), `team/ricerca/ui_2026-11-22.md` §1. I tocchi "oggi" sono una stima dai comandi del motore, non una misura sull'interfaccia attuale (non l'ho guardata, come da brief).

| Fase | Cosa decide | Quanto spesso | Cosa gli serve in quel momento | Tocchi oggi (stima) |
|---|---|---|---|---|
| Lancio | niente | 1 a turno | che il turno è nuovo, chi possiede ogni dado nemico | 0 |
| Fine Turno | quali carte scartare per l'Eco, quale carta in Plancia ruotare | 0–3 scelte | Eco di ogni carta, cosa esce dalla Plancia, quali slot restano coperti | 1 per carta, 1 per bersaglio, 1 chiudi |
| Preparazione | niente | 1 a turno | quali carte sono nuove | 0 |
| Selezione | tenere o scartare ognuno dei suoi 5 dadi, pagare Luce | 5 scelte, di solito 0–2 cambi | posto del dado fra i dadi nemici, slot libero o coperto e costo, Luce prima e dopo, cosa rende lo scarto, carte che useranno quel dado, minacce | 3–4 + Conferma: si parte da "tutti scartati" |
| Risoluzione, finestra libera | muoversi, carte gratuite, andare avanti | fino a 9 finestre | PM, prossimo dado, minaccia sul posto dove vado | 1 per mossa, 1 per avanzare |
| Risoluzione, mio dado | carta o manovra, Azione, bersaglio, spinta | 3–4 dadi, 1–3 azioni ciascuno | impulsi rimasti, carte pagabili, bersagli validi, effetto della spinta | apri 1, azione 1, bersaglio 1, spinta 1, chiudi 1 |
| Risoluzione, dado nemico | niente | 5 dadi | chi agisce, dove va, quanto danno e perché | 0–1 per dado |

Cosa ne ricavo:

- La **Selezione** è l'unico momento in cui servono insieme dadi, Plancia, mano e minacce. È la schermata più affollata: deve avere tutto fermo e visibile, e partire da una scelta sensata.
- In **Risoluzione** il gesto ripetuto è carta → bersaglio. Carta e tabellone devono toccarsi. La Sequenza qui si legge soltanto.
- In **Fine Turno** il tabellone non serve quasi: lavorano mano e Plancia, che sono vicine.
- Mano, Plancia e gettoni servono in tutte le fasi: stanno sempre nello stesso posto. Cambia solo cosa c'è al centro.

## 3. Organizzazione dello schermo

```
┌───────────────┬──────────────────────────────────────────────────────────┐
│ fase e        │  IL BINARIO: la Sequenza Vincolata, 10 posti da 66 px     │
│ consegna      │  sotto ogni dado: cosa succede (2 righe)                  │
├──────────────┬┴───────────────┬───────────────────────────────┬──────────┤
│ gettoni       │                │                               │ mazzo    │
│ HP PT PM Luce │  IL CENTRO     │                               │ scarti   │
├──────────────┤  scheda nemico  │        IL TABELLONE           ├──────────┤
│ PLANCIA       │  oppure carta  │   io a sinistra → loro a dx   │ dadi     │
│ 4 slot (2×2)  │  in gioco      │        8 × 6 esagoni          │ scartati │
├──────────────┴────────────────┤                               ├──────────┤
│ LA MANO, a ventaglio           │                               │ SIGILLO  │
│ 5 carte intere                 │                               │ (1 azione)│
└───────────────────────────────┴───────────────────────────────┴──────────┘
   il mio lato (0–424)              il loro lato (426–764)         bordo (764–844)
```

| Oggetto | Posizione e misura | Cosa fa |
|---|---|---|
| Binario | in alto, tutta la larghezza, 88 px | I dadi in ordine. La forma dice il tipo: quadrato avorio = Vigore, triangolo brace = Fuoco, rombo viola = Terrore, triangolo rovesciato scuro = nemico, con l'icona dell'azione sulla faccia. Sotto ogni dado due righe: di chi è e cosa produce ("II Orda, −1 a te"). |
| Gettoni | 238×44 sotto la consegna | HP, PT, PM, Luce. In Selezione mostrano prima → dopo ("4→5"). La Luce è una scintilla, non una fiamma né una lampada. |
| Plancia | 236×106 | I 4 slot. Slot libero: la sagoma del dado, piena se un dado lo occupa. Slot coperto: la carta in Cooldown ci sta sopra, con la moneta del costo in Luce (piena se pagata). La carta ruota di 90° a ogni turno di attesa, come nel gioco fisico. |
| Centro | 172×154 a riposo, 172×250 con carta | A riposo: scheda del nemico (legge il dado nemico: 1–2 Orda, 3 Morso, 4 Incassa). Con una carta: la carta grande. |
| Mano | 416×140 in basso a sinistra | Ventaglio di 5 carte da 94×129, sotto il pollice sinistro. |
| Tabellone | 338×302 | Pedine numerate I–V come i dadi. Percorso pieno = ti raggiunge, tratteggiato = non arriva. Cartellino rosso in alto a sinistra = danno previsto; goccia in alto a destra = HP; stati sotto la pedina. |
| Bordo | 80 px a destra | Mazzo, scarti, piattino dei dadi scartati (il risultato resta visibile per il turno, regola 5 fase 3), sigillo. |
| Sigillo | 62 px, angolo in basso a destra | L'unica azione principale. Acceso quando è il passo atteso, spento quando l'azione attesa è altrove. Dice sempre cosa fa: "Vincola la Sequenza", "Prossimo dado", "Chiudi la carta", "Chiudi il turno". |

Differenza dallo schema di partenza: la Sequenza è sopra e larga quanto lo schermo, la griglia è a destra e ruotata, non esistono HUD laterali, la mano è nell'angolo del pollice e la carta si gioca tra mano e griglia.

## 4. Le carte come mano

**Tenerla.** Cinque carte di carta consunta, intere, leggermente ruotate e sovrapposte di 13 px. Ogni carta ha tre zone fisse: in alto l'angolo (tipo di impulso e CD) e il nome; al centro le Azioni in forma breve, una riga per Azione con il costo come icona; in basso la fascia scura dell'Eco, sempre nello stesso punto. Tutto a 12 px o più, senza toccare nulla.

**Ingrandirla.** Un tocco la solleva e la posa al centro, grande (172×250), con il testo intero. In Selezione e Fine Turno è solo lettura: un secondo tocco la rimette in mano. È lo stesso gesto e lo stesso posto in ogni fase.

**Giocarla.** In Risoluzione la carta posata al centro è la carta in gioco: le sue Azioni sono toccabili, i bersagli validi si accendono sul tabellone a 8 px di distanza. Si può anche trascinare la carta dalla mano direttamente su un bersaglio. Mentre è al centro:

- la mano si abbassa (restano i nomi; un tocco dice "Chiudi prima la carta in gioco");
- gli impulsi del dado sono una pedina accanto alla carta; quelli spesi finiscono sulla riga dell'Azione che hanno pagato;
- un'Azione non più disponibile è barrata con il motivo scritto sotto ("Non si torna a un'Azione precedente");
- chiusa, la carta scivola sulla Plancia e si corica sullo slot che copre (CD ≥ 1) oppure va negli scarti (CD 0). "Rimetti in mano" esiste solo finché non è stata usata.

## 5. Un turno raccontato

Turno 2 della Cripta, lo stesso dei due mockup. Regola del sigillo: un tocco porta fino al prossimo momento in cui posso agire; i dadi nemici consecutivi si risolvono in fila con una pausa ciascuno.

| # | Dove | Gesto | Cosa cambia sul tavolo |
|---|---|---|---|
| — | Selezione | nessuno | La proposta è già applicata: ✊2 su slot 3, 🔮1 su slot 2. Gli altri sono fantasmi nel binario, i dadi veri nel piattino. |
| 1 | Binario | tocco il 🔥1 | Torna nel binario. Sulla Plancia la moneta dello slot 4 si riempie ("pagato 1 Luce"). Luce 1→1, PM 4→5. *(schermata 1)* |
| — | Binario | toccassi il ✊2 fantasma | Rifiuto scritto sotto il dado: "tieni: 2 Luce", sigillo spento con "Luce insufficiente". |
| 2 | Sigillo | "Vincola la Sequenza" | I fantasmi spariscono, il binario si chiude a 8 dadi. Finestra libera. |
| 3 | Tabellone | tocco una casella raggiungibile | Mi sposto, PM 5→0. Il sigillo offre "Annulla la mossa" finché non faccio altro. |
| 4 | Sigillo | "Prossimo dado" | Il ✊2 si alza nel binario. Al centro compare la pedina degli impulsi. |
| 5 | Mano | tocco Attacco Poderoso | La carta va al centro, la mano si abbassa. Divento Vulnerabile (×2 sotto la mia pedina). |
| 6 | Carta | tocco l'Azione 2 | L'Azione 1 si barra. II e IV si accendono. |
| 7 | Tabellone | tocco IV | Tre spinte possibili: due caselle e il muro ("muro +1"). |
| 8 | Tabellone | tocco il muro | IV stordito, Collisione, 1 danno. Il suo dado nel binario si spegne con la croce. |
| 9 | Tabellone | tocco IV di nuovo | L'Azione resta armata. *(schermata 2)* |
| 10 | Tabellone | tocco una spinta | Impulsi finiti: la carta si chiude da sola e si corica sulla Plancia. |
| 11 | Sigillo | "Prossimo dado" | I e II agiscono in fila. Si ferma sul 🔥1. |
| 12–13 | Centro, tabellone | manovra base, poi bersaglio | 1 danno a gittata 3. |
| 14 | Sigillo | "Prossimo dado" | 🔮1 attivo. |
| 15 | Sigillo | "Prossimo dado" (avviso: 1 impulso perso) | III, IV saltato, V. Poi Fine Turno. |
| 16–17 | Mano | tocco due carte | Vanno agli scarti; l'Eco fa salire i gettoni. Le carte sulla Plancia mostrano già la rotazione che faranno. |
| 18 | Sigillo | "Chiudi il turno" | Rotazione, pesca, nuovo lancio. |

**18 tocchi** per un turno pieno (una mossa, una carta usata due volte, una manovra, due Eco). Lo stesso turno con i comandi del motore così come sono (Selezione da zero, avanzamento dado per dado, chiusura della carta a mano) ne chiede circa 26: stima, da misurare. Il risparmio viene da tre punti: proposta iniziale (−2), sigillo che attraversa i dadi nemici (−4), carta che si chiude da sola a impulsi finiti (−1 per carta).

## 6. Verifiche fatte

- Misura Playwright sui due mockup (`strumenti/scatta.js`): 0 testi sotto 12 px, 0 elementi fuori schermo. Bersagli sotto 44 px segnalati: la casella disegnata è 50×43 (il passo reale della griglia è 52×45) e le pedine, che stanno dentro la casella e ne ereditano il tocco.
- Dati: stato `sel_coperto` per la Selezione e `carta_aperta` per la Risoluzione. La Selezione mostrata è la proposta iniziale più un tocco sul 🔥; i conti (Luce 1+1−1, PM +1) seguono `selectionPlan`, ma li ho fatti a mano, non con il motore.
- Non fatto: il test di lettura I1 e I5 con un agente che non conosce il concetto.

## 7. Rischi e punti aperti

| Priorità | Punto | Nota |
|---|---|---|
| CRITICA | **Stanza ruotata di 90°.** | Tutta la proposta ne dipende. Non cambia le regole, ma cambia la camera della scena e va deciso da Gianmarco. Senza rotazione la griglia 6×8 lascia troppo poco spazio al mio lato. |
| CRITICA | **Il binario regge 10 dadi a 66 px.** | Con un undicesimo dado (Bag più grande o sei nemici) i posti scendono sotto i 60 px e le due righe non ci stanno. Serve una regola: etichette a una riga oppure dadi nemici dello stesso tipo raggruppati. |
| MEDIA | **Oltre 5 carte in mano** (Parata e Attacco Base pescano). | A 6 carte la parte visibile di ognuna scende da 81 a 64 px e la forma breve non entra più. Proposta: da 6 in su il ventaglio si stringe e la lettura passa dal tocco. Va contro I5 per quei turni. |
| MEDIA | **Forma breve delle carte.** | Qui è scritta a mano per le 6 carte dei mockup. Va generata dai dati (US-11 criterio 2) e Carica Furiosa è al limite. |
| MEDIA | **Dadi in alto, lontani dai pollici.** | In Selezione i tocchi sono pochi grazie alla proposta. Alternativa da provare: toccare lo slot sulla Plancia per liberare o riprendere il suo dado. |
| MEDIA | **Carta che copre uno slot.** | Il motore dà solo coperto o no (DM3). Nel mockup l'abbinamento carta → slot segue l'ordine di Plancia. Per lo stesso motivo sulla carta in gioco scrivo "va in Plancia per 2 turni" senza dire quale slot. |
| BASSA | La scheda del nemico sparisce quando una carta è al centro. | Si richiama toccando un nemico. Con più tipi di nemico mostra quello toccato per ultimo. |
| BASSA | Cartellini di danno in zone affollate. | Con tre nemici adiacenti si accavallano alle pedine. |
| BASSA | "Turno 2 di 6". | Ho letto `veglia: 6` come numero di turni prima del Buio: da confermare. |

Non disegnati perché fuori dal brief: Fine Turno, dado nemico, Soglia, desktop. Il concetto li prevede così: in Fine Turno la mano resta alzata e le fasce dell'Eco si accendono; sul dado nemico il centro mostra la scheda con la riga dell'azione in corso; la Soglia è il tavolo sgombro con le Soste come carte posate.
