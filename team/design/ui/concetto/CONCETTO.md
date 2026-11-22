# Concetto dell'interfaccia: "Il Lume" (B1.3c)

*designer-ux-ui · 2026-11-22 · branch `prova-demo` · telefono 844×390 · evoluzione della direzione A dopo il feedback di Gianmarco ("troppo divisa in blocchi, levare i frame, dinamiche in cui si zoomano alcune informazioni")*

## 1. Principio guida

**La stanza non ha pannelli, ha una sola luce: dove cade la luce le cose diventano grandi e si spiegano, tutto il resto resta al suo posto in penombra e aspetta.**

Tre soli strumenti, al posto dei riquadri:

| Strumento | Sostituisce | Come |
|---|---|---|
| **Luce** | bordi e sfondi dei pannelli | un solo alone sulla stanza; si stringe su ciò che conta, il resto scende in penombra senza spostarsi |
| **Filo** | legende e frecce | la Sequenza è un filo d'oro; quando guardi un dado, un filo teso lo lega alla sua unità |
| **Scala** | finestre di dettaglio | l'informazione a fuoco cresce nel punto in cui è (numero da 22 a 42 px, dado ×1,24, figura ×1,3) |

È il gioco stesso: Veglia, candela, Luce e Buio sono già regole di TLN. Quando la Veglia finisce, l'alone si restringe davvero.

## 2. Dove guardare

| File | Cosa |
|---|---|
| `prototipo.html` | prototipo animato autonomo (CSS e JS in linea, solo Google Fonts). Gira da solo; un tocco sulla scena avanza di un passo. `?scena=A|B|C&passo=N&fermo=1` dà un fotogramma fermo |
| `fotogrammi/A1…A4` | Selezione: riposo, a metà del gesto, a fuoco su Z2, rifiuto scritto sul filo |
| `fotogrammi/B1…B4` | Dado nemico: luce larga, annuncio, atto, verdetto |
| `fotogrammi/C1…C3` | Il mio dado: la mano risponde, carta scelta, carta aperta con spinta |
| `strumenti/` | `genera.js` (costruisce il prototipo dai dati del motore), `fotogrammi.js`, `misura_concetto.js` e risultato `misura_I3_concetto.json`, `estrai_diniego.js` |

Dati: `bozze_B1.3b/strumenti/dati_mockup.json` (seed 7, La Cripta; anteprima DM1 in ordine di Sequenza) e `strumenti/dati_diniego.json` (Diniego Sismico su Z1 in SP3, estratto oggi dal motore). Nessun numero inventato.

## 3. I quattro posti (senza cornici)

```
 frase di orientamento: turno, fase, cosa fare adesso
 ┌ io ┐ ┌──────── la stanza ────────┐ ┌─ chi parla adesso ─┐
 candela   griglia intera, sempre      la mia mano
 HP PT     minacce scritte accanto     OPPURE la voce di chi agisce
 PM Luce   a chi le porta              (mai tutte e due)
 ─●──□──●──●──□──●──□── il filo: la Sequenza ───────◀ il nodo
```

Si riconoscono dalla posizione e dalla tipografia, non da un bordo. Unica superficie chiara per volta: i dadi d'osso a riposo; la carta scelta quando ne apri una.

**Sempre visibile**

- Griglia intera (48 caselle), mai spostata né coperta: la camera non si muove, si muove la luce.
- Il filo con tutti i dadi: valore, tipo, sigillo del nemico, stato (da fare, corrente, fatto).
- Per ogni nemico vivo: sigillo, azione, numero di danno agli HP oppure "non ti raggiunge", casella d'arrivo, punti vita.
- I miei quattro numeri, la candela della Veglia, i miei stati.
- Una frase di orientamento e un solo pulsante primario: il nodo in fondo al filo, sempre nello stesso punto.
- La mano in forma breve, tranne quando parla un nemico (vedi sotto).

**Solo quando serve**

| Cosa | Quando compare |
|---|---|
| Percorso completo, scomposizione del danno, "chi gli sarà accanto" | quando guardo quel nemico o quando tocca a lui |
| Filo teso dado → unità | solo per l'unità a fuoco |
| "Slot N", "+1 PM / Luce / PT" sopra e sotto i miei dadi | solo in Selezione; in Risoluzione il filo resta nudo |
| Plancia come oggetto | Fine Turno, oppure in Selezione se uno slot è coperto (la carta che lo copre si lega al dado) |
| Testo intero di una carta | quando la scelgo: la riga diventa carta |
| Carte che il dado attivo non apre | raccolte in un blocco quieto con il motivo |
| Costi in PM sulle caselle | finestra libera e mio dado attivo, non a carta aperta |
| Motivi di rifiuto | nel punto del problema e sul nodo, finché il problema c'è |
| Scheda del nemico, registro, opzioni | su richiesta (B1.3d) |

## 4. Come si muove l'attenzione, fase per fase

| Momento | La luce va su | Si ingrandisce | Scende in penombra | A destra c'è | Il nodo dice |
|---|---|---|---|---|---|
| **Selezione, riposo** (A1) | tutta la stanza | niente: tutto alla sua misura | niente | la mano | "Conferma i dadi · tieni 4, scarti 1: +1 Luce" |
| **Selezione, guardo una minaccia** (A3) | nemico, percorso, arrivo, me | numero di danno, il suo dado, i miei dadi che vengono prima | altre minacce, altri dadi, nodo | la voce: perché 2, cosa gioco prima | invariato, in penombra |
| **Selezione, scelta impossibile** (A4) | resta larga, appena abbassata | il dado toccato; staffa rossa tra i due dadi in conflitto | niente | la mano | spento: "Troppi dadi per gli slot · scarta un Fuoco per confermare" |
| **Dado nemico, annuncio** (B2) | chi agisce, percorso, me | numero, dado, figure | tutto il resto | la voce: "Tocca a Z1", il conto riga per riga | "Lascia agire Z1 · −1 HP" |
| **Dado nemico, atto** (B3) | più stretta, sul colpo | figure ×1,3; cifre che nascono sul colpo e vanno ai miei numeri | etichette vicine si spengono | la voce, riga corrente accesa | "Z1 sta agendo · tocca per saltare" |
| **Dado nemico, verdetto** (B4) | si riapre a tre quarti | il numero cambiato nel margine | niente | il verdetto, finché non proseguo | "Avanti, tocca a te · il tuo dado Fuoco 2" |
| **Mio dado attivo** (C1) | stanza larga | il dado; le carte che apre fanno un passo avanti | le carte che non apre, in un blocco con il motivo | la mano che risponde al dado | cavo: "Passa al prossimo dado · perdi 1" |
| **Carta scelta** (C2) | me e i bersagli validi | la riga diventa carta (nome 21 px, testo intero) | altre carte, altri nemici | la carta | "Apri Diniego Sismico · con il dado 1" |
| **Carta aperta, puntamento** (C3) | me, bersaglio, caselle di spinta | esito sul bersaglio; **la minaccia che cambia si ingrandisce da sola** (Z2: −2 → −1) | il resto | la carta, "Rimetti in mano" | "Colpisci e spingi Z1 · Z1 da 6 a 5 HP" |
| **Fine Turno / Eco** (non in prototipo) | lascia la stanza (penombra), va su mano e Plancia | l'Eco di ogni carta passa in primo piano, le Azioni rimpiccioliscono; la Plancia emerge sotto il filo con le carte che ruotano | stanza; il filo porta scritto "dadi del turno 2" | la mano, letta dal lato Eco | "Prosegui senza scartare" / "Scarta 1 · +1 PM, ruota Distorsione" |

Regola che tiene insieme tutto: **i numeri stanno nel mondo, le frasi stanno nel margine destro.** Il margine destro ha una voce sola per volta: le mie carte quando posso giocarle, la frase del nemico quando agisce lui (il motore non mi lascia agire durante il suo dado).

## 5. Le dinamiche di messa a fuoco

| # | Dinamica | Si attiva | Cosa cresce | Cosa si attenua | Durata | Si torna |
|---|---|---|---|---|---|---|
| D1 | **Sguardo** su una minaccia | tocco su un dado nemico, sulla sua etichetta o sulla figura | numero 22 → 42 px, dado ×1,24, filo teso, percorso, fantasma di chi sarà accanto | resto al 64% di opacità, alone da 330×230 a 128×98 px | 240 ms in entrata; resta finché voglio | tocco nel buio o sullo stesso dado: 160 ms |
| D2 | **Annuncio, atto, verdetto** | la fiamma arriva su un dado nemico | come D1, poi figure ×1,3 e cifre da 44 px | come D1, più stretto nell'atto | annuncio: aspetta il tocco; atto: 900 ms, saltabile; verdetto: aspetta il tocco | "Avanti": l'alone si riapre in 300 ms |
| D3 | **La mano risponde** | un mio dado diventa attivo | carte apribili avanti di 8 px e a pieno contrasto | carte non apribili in un blocco, con il motivo | 240 ms | al dado successivo |
| D4 | **La riga diventa carta** | primo tocco su una carta apribile | la riga cresce in un foglio chiaro, testo intero a 15 px | altre carte, nemici non bersagliabili | 240 ms | "Rimetti in mano", o tocco su un'altra carta |
| D5 | **Il numero che cambia si fa vedere** | qualunque valore cambi (HP, Scudo, danno previsto di un nemico) | la cifra ×1,8 nel suo posto, con il valore di prima accanto | niente | 300 ms su, 900 ms giù | da sola |
| D6 | **La ronda** (proposta, non in prototipo) | apertura della Selezione | l'alone percorre il filo da sinistra a destra accendendo ogni minaccia in ordine | il resto | 1,6 s in tutto, un tocco la salta | finisce nel riposo A1 |

Regole comuni: la camera e la griglia non si muovono mai; ogni messa a fuoco ha la stessa uscita (tocco nel buio); niente si apre da solo tranne D5 e D6; con "riduci movimento" restano solo dissolvenze.

## 6. Come spariscono cornici e pannelli

| Nella direzione A | Nel Lume |
|---|---|
| Barra in alto con bordo | una frase: "Turno 1, Selezione." in IM Fell oro, poi l'istruzione |
| Colonna risorse + riquadro Plancia | la candela (Veglia, si accorcia a ogni turno) e quattro numeri scritti accanto; la Plancia non è un riquadro: lo slot è scritto sul dado |
| Etichette di minaccia in scatole scure | scritte nel mondo con alone d'inchiostro; il rosso solo sul numero che mi colpisce |
| Mano: 5 strisce di carta chiara (competeva con la Sequenza) | 5 voci d'inchiostro sul buio; diventa carta solo quella scelta |
| Carta aperta come pannello | la stessa voce che cresce in un foglio |
| Fascia della Sequenza con bordo | dadi su un filo; il pulsante è il nodo in fondo |
| Esito del nemico in un riquadro | la voce nel margine destro, al posto della mano |

Tipografia: IM Fell English per ciò che si dice (frase di orientamento, nomi, voce), Alegreya Sans per ciò che si conta. Le cifre sono sempre in Alegreya, anche dentro IM Fell (l'1 antico si legge "I"). Colori: palette di `CLAUDE.md` §7; oro = mio e azione, rosso = mi colpisce, azzurro = Scudi; fondo unico `#09080c`.

## 7. Rischi per la leggibilità e controllo

Misura con la funzione di `strumenti/misura_I3.js` sugli 11 fotogrammi (`strumenti/misura_I3_concetto.json`): **11 su 11** con 0 testi sotto 12 px (minimo 12), 0 bersagli sotto 44 px (minimo 56×44), 48/48 caselle in vista, 0 coperte, griglia alta 267 px (68%), casella 60×43, 0 pannelli sovrapposti, 0 etichette fuori mappa, 1 primario, 0 regole `:hover`, valore dei dadi 28 px contro 21 al massimo altrove.

| Ind. | Rischio del concetto | Controllo |
|---|---|---|
| **I1** | la penombra nasconde le altre minacce | il riposo (A1) non attenua nulla: è lì che si fa il test 5 su 5. A fuoco, la penombra non scende sotto 3:1 di contrasto (misurato: 3,2 il peggiore, un "−1" rosso; prima bozza a 1,7, corretta). Soglia da portare in SPEC |
| **I1** | etichette senza scatola illeggibili sulla mappa | alone d'inchiostro a 4 strati; posizione scelta a mano nei fotogrammi: nel B1.3d serve la regola di piazzamento automatico (lato libero, mai su arrivi o percorsi) |
| **I2** | il motivo finisce lontano | il motivo sta in tre punti insieme: sul dado in conflitto, sul nodo spento, nella frase di orientamento; resta finché il problema c'è |
| **I3** | lo zoom rompe "griglia intera in ogni fase" | non c'è zoom di camera: crescono solo segni e figure, la griglia resta 48/48 in tutti i passi |
| **I3** | la voce copre qualcosa | misurato: non tocca filo, figura che agisce né giocatore (US-10 c.7) |
| **I4** | il nodo "Passa" dorato invita a buttare impulsi | con impulsi da perdere il nodo è cavo (scuro, testo oro) e dichiara la perdita; resta l'unico primario |
| **I4** | la Sequenza perde peso senza fascia | i dadi d'osso sono l'unica superficie chiara a riposo; valore 28 px, il più grande dello schermo fuori dai momenti a fuoco |
| **I5** | carte non apribili raccolte in un blocco: si legge meno | succede solo con un mio dado attivo; in Selezione e finestra libera le 5 carte sono intere. Da verificare nel test I5 |
| tutti | troppo movimento, lentezza | nessuna dinamica sopra 300 ms tranne l'atto (900 ms) e la ronda (1,6 s), entrambe saltabili; solo `opacity` e `transform` più un gradiente |
| tutti | la mano sparisce mentre parla il nemico | tocco nel buio la riporta; il verdetto la restituisce al primo "Avanti". Domanda aperta 2 |

Limiti dichiarati: figure e griglia sono segnaposto; Fine Turno, Soglia, Buio e slot coperti sono descritti ma non disegnati; il desktop non è stato derivato; il prototipo è una sequenza di passi scritti, non il gioco.

## 8. Riferimenti

La rete della sessione era chiusa (proxy): **le fonti qui sotto sono citate a memoria, senza link verificati oggi**, tranne quelle già verificate in `team/ricerca/ui_2026-11-22.md` §3. Da ricontrollare prima di citarle fuori dal team.

| Riferimento | Meccanismo | Cosa prendo |
|---|---|---|
| Into the Breach (ricerca §3, fonte verificata) | intenti sulla mappa, "clarity over cool" | numeri nel mondo; niente camera che si muove |
| Darkest Dungeon (Red Hook; GDC 2016, "Darkest Dungeon: A Design Postmortem") | a ogni colpo la scena stringe sui due contendenti e il resto si scurisce | D2: l'atto come stretta breve su chi colpisce e chi subisce |
| Return of the Obra Dinn (L. Pope, 2018; devlog TIGSource) | un momento fermo alla volta, il resto è nero | una cosa sola a fuoco; il buio come sfondo, non come cornice |
| Pentiment (Obsidian, 2022) | la pagina miniata: le glosse escono nel margine | margine destro come glossa della stanza; frasi nel margine, numeri nel mondo |
| Disco Elysium (ZA/UM, 2019) | una sola colonna di testo a destra che racconta ciò che accade | "la voce": una colonna, una voce per volta |
| Inscryption (ricerca §3) | lo stato della partita è un oggetto del mondo | candela = Veglia, filo = Sequenza, nodo = conferma |
| Slay the Spire, Balatro (ricerca §3) | intento con numero sopra il nemico; risoluzione da sinistra a destra | etichetta di minaccia; il filo che si consuma |
| Citizen Sleeper (Jump Over the Age, 2022) | dadi del ciclo sempre in vista, la stazione dietro senza finestre opache | dadi come oggetti permanenti sopra il mondo |
| G. Furnas, "Generalized Fisheye Views", CHI 1986 | focus + contesto: il dettaglio cresce dove guardo, il contesto resta | fondamento di D1–D4 |
| B. Shneiderman, "The Eyes Have It", 1996 | "overview first, zoom and filter, then details-on-demand" | riposo = panoramica; sguardo = dettaglio a richiesta |
| Cockburn, Karlson, Bederson, "A Review of Overview+Detail, Zooming, and Focus+Context Interfaces", ACM Computing Surveys 2008 | lo zoom che toglie il contesto costa orientamento | perché la griglia non si sposta mai |
| J. Nielsen, "Progressive Disclosure", NN/g 2006 | mostrare dopo ciò che serve dopo | tabella "solo quando serve" |
| Fagerholt e Lorentzon, "Beyond the HUD", Chalmers 2009 | interfaccia diegetica, spaziale, meta | luce e candela come interfaccia che appartiene al mondo |
| C. Ware, *Information Visualization: Perception for Design* | luminanza e dimensione guidano l'attenzione prima della lettura | luce e scala come unici segnali di priorità |

## 9. Domande per Gianmarco (cancello del concetto)

1. Il principio "una sola luce, niente pannelli" è la direzione giusta? Se sì, il B1.3d fa i mockup completi su questo.
2. Va bene che la mano lasci il posto alla voce quando tocca a un nemico, o la vuoi sempre in vista (più piccola)?
3. La camera resta ferma (cresce solo l'informazione). Vuoi provare anche una stretta di camera vera durante l'atto, sapendo che per 900 ms la griglia non sarebbe intera?
4. La ronda all'apertura della Selezione (1,6 s, saltabile): sì o no?
5. Carte non apribili raccolte in un blocco quando un dado è attivo: sì, o sempre 5 voci intere?
