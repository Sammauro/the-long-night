# THE LONG NIGHT — Analisi di design e proposta demo
**Versione:** v0.0.5-demo (PROPOSTA — non è source of truth finché non la approvi)
**Data:** 2026-11-16
**Base:** regolamento v0.0.4a rev.11 (Notion: pagina principale + Sezione 7 + Sezione 8-9) e CLAUDE.md v1.3
**Documento gemello:** `BRIEF_demo_claudecode.md` (istruzioni operative per Claude Code)

---

## 0. In una pagina

**Diagnosi.** Le tre tensioni aperte (CD Jam, Luce non vincolante, Terrore poco sentito) hanno una radice sola: **dentro la stanza il tempo è gratis**. Se aspettare un turno non costa nulla, non serve pagare Luce, non serve il burst del Terrore, e il CD è solo un'attesa. Non è un problema di carte: è un problema di incontri e di orologio. È la stessa conclusione a cui eri arrivato ad aprile ("è un problema di nemici"), ora con i numeri.

**Cosa propongo.**

| # | Proposta | Tocca il regolamento? |
|---|---|---|
| 1 | Slot in ordine Vigore / Terrore / Vigore (la tua variante) | Sì, solo la tabella Equipaggiamento |
| 2 | **Veglia**: ogni stanza ha un numero di turni; oltre, −1 PT a turno | Nuovo |
| 3 | **Soglia**: passaggio di stanza con 1 scelta (2 se sei stato nei tempi) | Nuovo |
| 4 | Tre nuovi nemici, ognuno preme su un sistema oggi "lento": Sussurratore (PT), Falena Cinerea (Luce), Custode della Soglia (slot e corazza) | Nuovo |
| 5 | Due nuove stanze + una stanza tutorial | Nuovo |
| 6 | Nessuna modifica ai testi delle 16 carte | No |

**Cosa non ho toccato.** Carte, dadi, facce, struttura del turno, stati, Zombie rev.11, costo della Conversione Oscura.

**Cosa devi decidere tu.** Dieci punti, elencati in §9. Nel brief ognuno ha già un default, così Claude Code non si ferma; se cambi idea si modifica una riga di dati.

---

## 1. Diagnosi

### 1.1 Cosa funziona (e va protetto)

- **La Sequenza Vincolata.** Vedi i tuoi dadi, le intenzioni nemiche e l'ordine: ogni turno è un puzzle a informazione completa con setup casuale. È il tratto distintivo del gioco. Ogni scelta della demo (UI, tutorial, nuovi nemici) è pensata per metterla al centro.
- **Uccidere prima che il dado nemico si risolva.** È il momento "Hotline Miami" del sistema e oggi non è scritto in modo esplicito. Il tutorial lo insegna al primo turno.
- **Slot = capacità di carte + accesso ai dadi.** Un solo oggetto governa due cose. È elegante e produce da solo il ritmo scatto → recupero.

### 1.2 La radice comune: il tempo è gratis

Nel playtest #2 hai chiuso 5 zombie in 6 turni perdendo 2 HP. Con una minaccia così bassa:

- **Luce:** un CD 1 blocca un dado per un turno. Se quel turno non ti costa niente, aspettare batte pagare.
- **Terrore:** il burst serve quando hai fretta. Senza fretta non serve.
- **CD:** diventa attesa, non scelta.

Il rimedio è rendere il tempo una risorsa. Non serve cambiare le carte.

### 1.3 Tre fatti strutturali (rev.11)

**a) Con gli slot attuali, la prima carta in CD è gratis.** La copertura parte dallo Slot 1, che ospita il d8 Terrore. Un dado coperto si può comunque scartare per la sua risorsa. Se il Terrore lo avresti scartato comunque, coprirlo non ti toglie nulla. Nel modello il dado Terrore viene scartato nel 66% dei turni: due volte su tre la prima carta in CD non ha costo. Questo spiega insieme "il recupero attivo sembra inutile" e "l'assenza del Terrore non si sente".

**b) L'83% della Luce arriva da sola.** Due d4 Fuoco, uno slot Fuoco: un dado Fuoco viene scartato ogni turno per forza, quindi +1 Luce garantita. Dagli Eco arriva solo +0,2 a turno. Entrate 1,2 a turno, uscite 0,8: la Luce non è scarsa perché non è il frutto di una scelta. In più lo Slot 4 si paga da solo (scarti un d4 per +1 Luce, paghi 1 Luce per tenere l'altro).

**c) Troppe valvole 1:1.** 1 ✊ = 1 Danno = 1 PM = 1 Scudo = 1 carta pescata; ogni dado scartato rende qualcosa; quasi ogni Eco dà +1 PM. Quando tutto si converte in tutto senza perdita, lo scarto non fa male. È il tema della tua "Direzione 1 / Leva C": resta in backlog, non lo tocco nella demo.

### 1.4 CD Jam: non è un difetto

In una mano da 5 ci sono in media 2,8 carte con CD (9 su 16). Gli slot ne smaltiscono circa 1,4 a turno (dato del modello; il conto teorico dà 1,2–1,5 più 0,5 dello slot Fuoco). Quindi circa una carta CD per turno finisce comunque in Eco: è previsto dal sistema.

Il "jam" vero è il turno dopo un'apertura a tre carte: tre slot coperti, tre dadi bloccati, 5 Luce per sbloccarli tutti. È il prezzo di un alpha strike, è visibile in anticipo e si scioglie con gli Eco di rotazione (6 fonti: una carta CD 1 ruotata a 0° esce subito e libera lo slot prima della Selezione). Nel modello, che gioca in modo regolare, i tre slot sono tutti coperti solo nel 5% dei turni.

**Conclusione:** il jam va reso leggibile, non eliminato. Due interventi, entrambi di interfaccia: la Plancia mostra **quali dadi saranno bloccati al prossimo turno** appena giochi una carta CD; il tutorial lo insegna al turno 3.

---

## 2. I numeri

### 2.1 Metodo e limiti

Ho scritto un modello in Python che gioca le stanze con le regole rev.11: griglia esagonale, Sequenza, Selezione, slot, Eco, CD, stati, spinte e collisioni, trappole, le 16 carte, IA nemiche. 1.500 run per configurazione.

L'agente è **prudente ma non brillante**: attacca il bersaglio migliore, usa gli scudi quando vede arrivare danno, si allontana se ha PM. Non costruisce combo.

| | Tu (playtest #2, rev.10) | Agente (Cripta, rev.11) |
|---|---|---|
| Turni per chiudere | 6 | 5,5 medi |
| HP persi | 2 | 4,8 |

Sul ritmo l'agente è in linea con te; in difesa prende circa il doppio del danno. Quindi: **i confronti tra configurazioni sono affidabili, le percentuali di vittoria sono un pavimento.** Un giocatore capace farà sensibilmente meglio. È un solo playtest di riferimento: va ricalibrato appena la demo gira.

### 2.2 Slot e Luce (stanza singola, Cripta)

| Config | Paga Luce? | Vittorie | Turni | Impulsi ✊🔥 / turno | Terrore selezionato | Luce a fine stanza |
|---|---|---|---|---|---|---|
| A — rev.11 (T / V / V) | sì | 76% | 5,5 | 5,4 | 34% dei turni | 2,2 |
| A | no | 69% | 6,1 | 4,6 | 24% | 8,9 |
| **B — proposta (V / T / V)** | sì | 80% | 5,5 | 5,0 | **45%** | 1,8 |
| B | no | 71% | 6,1 | 4,2 | 39% | 8,8 |

Cosa dicono:

- **B non costa nulla in efficacia** e porta il Terrore in gioco un terzo di volte in più. Meno impulsi fisici, compensati dal Terrore usato.
- **Pagare Luce vale circa 0,6 turni a stanza** e 7–9 punti di vittoria. Non è poco, ma senza orologio 0,6 turni non hanno prezzo. Con la Veglia sì: chi non paga chiude nei tempi nel 49% dei casi invece del 69%.

### 2.3 La run completa (config B, Veglia e Soglia attive)

| Stanza | Vittorie | Turni (mediana; 10°–90°) | Entro la Veglia | HP finali | PT finali | Pressione specifica |
|---|---|---|---|---|---|---|
| 1 — La Cripta | 80% | 5 (4–7) | 69% | 5,2 | 6,8 | danno 1,1 / turno |
| 2 — Corridoio dei Sussurri | 86% | 5 (4–6) | 82% | 5,3 | **4,2** | −0,6 PT / turno |
| 3 — Sala del Custode | 76% | 6 (5–8) | 61% | 4,9 | 4,9 | 0,43 dadi bloccati / turno |

Run completata dall'agente: **52%** (con gli slot rev.11: 46%; senza pagare mai Luce: 41%; senza alcun recupero tra le stanze: 22%).

Lettura: la stanza 2 porta i PT da 6 a circa 4 senza essere una mattanza (le sconfitte per Follia sono il 3% degli ingressi). La stanza 3 dura un turno in più e blocca più dadi. La Soglia fa il suo lavoro: senza recupero la run non regge.

**Durata.** Il tuo obiettivo era 6–7 turni. Siamo a 5–6 per l'agente, quindi 6 circa per un umano nelle stanze 1 e 2, 7 nella 3. La manopola è nota: +1 Zombie nel Corridoio dà +1 turno e toglie circa 20 punti di vittoria all'agente. Non l'ho girata: preferisco una demo giusta a una demo lunga.

---

## 3. Bilanciamento interno

### 3.1 Il metro

Unità di valore: **1 impulso = 1 Danno = 1 PM = 1 Scudo = 1 carta**. È il cambio che le manovre base e le carte CD 0 già applicano. Una carta con CD deve rendere più del cambio, in proporzione a quanto costa.

**Quanto costa davvero una carta CD.** Non è l'assenza della carta: è il dado dello slot che copre, per tanti turni quanti sono i CD, oppure la Luce per recuperarlo.

| Carta in CD n° | Config A (rev.11) | Config B (proposta) |
|---|---|---|
| 1ª | Terrore: costo ≈ 0 due volte su tre | d6 Vigore: 1,8 impulsi o 2 Luce |
| 2ª | d6 Vigore: 1 Luce (la Luce garantita del turno) | Terrore: 1 Luce |
| 3ª | d6 Vigore: 2 Luce | d6 Vigore: 2 Luce |

In B la prima carta CD ha finalmente un prezzo. È il cambiamento più importante della proposta e non richiede di toccare nessuna carta.

### 3.2 Le carte contro il metro

| Carta | CD | Resa per impulso | Giudizio |
|---|---|---|---|
| Attacco Base ×2 | 0 | n+1 danni con n ✊ | La più efficiente del mazzo grazie al danno gratuito. Va bene come "pane"; da tenere d'occhio perché sono due copie. |
| Parata ×2 | 0 | 1 | In linea. |
| Scatto | 0 | ~2 (PM Salto + pesca) | In linea; Eco forte. |
| Tiro Mirato | 0 | ≤1 (paghi la gittata) | In linea. Nelle stanze nuove ha un lavoro. |
| Profondità Mente | 0 | 1 danno diretto per 🔮 + 1 PT | Si paga in "vita". Giusta solo se i PT sono sotto pressione: ora lo sono. |
| Diniego Sismico | 1 | 1–2 (con collisione) | In linea. Migliora con più ostacoli. |
| Attacco di Fuoco | 1 | 2 | In linea. |
| Cono di Fuoco | 1 | 1 per bersaglio | In linea; premia il posizionamento. |
| Infusione Elementale | 1 | +1 impulso e tipo Fuoco | In linea; è il motore delle combo. |
| Distorsione | 1 | situazionale | **Non la cambio: le do un lavoro.** Vedi sotto. |
| Attacco Poderoso | 2 | 2, con Vulnerabile su di te | In linea. |
| Attacco Strategico | 2 | 2 (danno + scudo o PM) | In linea. |
| Carica Furiosa | 2 | ≤2, con tre vincoli | Difficile da innescare: il modello la gioca nel 6% dei casi. Con nemici a distanza trova spazio. Da osservare. |
| Manipolazione Destino | 2 | +1,2 impulsi (d6) o +1,75 (d8) per 1 PT | **Unico vero fuori scala.** Come attivo rende meno di quanto costa il suo CD 2; vale quasi solo per l'Eco. Proposta minima: CD 2 → CD 1. Da decidere dopo aver visto la demo. |

**Distorsione.** Il difetto era del livello, non della carta. Nelle stanze nuove serve a tre cose: trascinare un Sussurratore su una trappola (3 Danni Diretti: lo uccide), allontanare uno Zombie di 3–4 caselle prima che il suo dado si risolva (attacco annullato per 1 PT), tirare a sé un bersaglio protetto. Ogni stanza ha almeno un pericolo ambientale.

### 3.3 Coerenze da sistemare (non sono design, sono refusi)

1. Le carte sono **16**, non 17: CD 0 = 7, CD 1 = 5, CD 2 = 4. Sbagliano CLAUDE.md, Sezione 7 e la pagina principale.
2. La pagina principale su Notion descrive ancora 4 fasi; CLAUDE.md ne descrive 5 con il Lancio per primo. Ho seguito CLAUDE.md.
3. Dentro la Fine Turno l'ordine cambia tra le due fonti. Con l'ordine di CLAUDE.md (prima rotazione stati, poi Eco) uno Scudo da Eco dura due risoluzioni; con quello di Notion, una. Ho seguito CLAUDE.md, che rende uniformi tutti gli Scudi.
4. Distorsione, in Sezione 7, dice sia "No Collisione" sia "i danni da Collisione si applicano". Ho preso "No Collisione".
5. La pagina principale contiene ancora la vecchia tabella Zombie a 4 azioni. Vale la Sezione 8-9.

---

## 4. Nuovi nemici

**Principio:** ogni nemico preme su un sistema che oggi non lavora.

| Nemico | Preme su | Ti obbliga a |
|---|---|---|
| Zombie (rev.11, invariato) | HP, spazio | Non farti circondare |
| **Sussurratore** | PT | Decidere: Terrore per colpire o per curarti |
| **Falena Cinerea** | Luce | Spenderla o proteggerla |
| **Custode della Soglia** | Slot, tempo | Costruire una combo |

### Sussurratore
HP 3 · Movimento 2 · Gittata 3 · dado d4

| d4 | Azione | Effetto |
|---|---|---|
| 1–2 | Sussurro | Si avvicina fino a gittata 3. Se è in gittata: perdi 1 PT. |
| 3 | Coro | Come Sussurro, con −1 PT in più per ogni altro Sussurratore vivo. |
| 4 | Dissolvenza | Si allontana di 2. +1 Scudo (Turno Attuale). |

La perdita di PT non è danno: Scudi e Contrattacco non la fermano. Gittata 3 è la stessa del tuo Colpo a Distanza e del Cono: se lui ti raggiunge, tu raggiungi lui. HP 3 perché una trappola (3 Danni Diretti) lo elimini: Distorsione diventa la risposta "programmata".

Con lui in campo il dado Terrore ha due usi che competono: scartarlo (+1 PT, ti tieni in piedi) o usarlo (Profondità Mente lo colpisce ovunque, ma costa PT). È la scelta che mancava.

### Falena Cinerea
HP 3 · Movimento 3 · Volo · dado d4

| d4 | Azione | Effetto |
|---|---|---|
| 1–2 | Divorare | Vola adiacente a te. Ruba 1 Luce. Se non ne hai: 1 Danno. |
| 3 | Frenesia | Vola adiacente a te. Ruba 1 Luce e infligge 1 Danno. Se non ne hai: 2 Danni. |
| 4 | Volteggiare | Si allontana di 3. Non attacca. |

Volo: attraversa unità e ostacoli, non attiva trappole, non può fermarsi su caselle occupate. Con due Falene addosso perdi fino a 1,5 Luce a turno, più di quanta ne entra.

### Custode della Soglia (élite)
HP 14 · Movimento 1 · **Corazza 2** · dado d4

| d4 | Azione | Effetto |
|---|---|---|
| 1–2 | Maglio | Muove 1 verso di te. Se adiacente: 3 Danni e Spingi 1 (Collisione). |
| 3 | Sigillo | Mette un Sigillo sul primo slot standard libero della tua Plancia. Vale come una carta in CD 1. Se non c'è posto: perdi 1 Luce. |
| 4 | Baluardo | Fermo. +2 Scudi (Turno Attuale). |

**Corazza 2:** all'inizio di ogni turno, se ha meno di 2 Scudi, torna a 2. I colpi piccoli e sparsi si sprecano; servono Danni Diretti (Profondità Mente, trappola), Vulnerabilità (si applica prima degli Scudi) o un turno concentrato. È "l'one-shot come risultato di una combo programmata".

**Sigillo:** nessuna regola nuova, riusa la Plancia. Copre uno slot, ruota e sparisce come una carta, si accelera con gli Eco di rotazione. Con gli slot in config B colpisce per primo un d6 Vigore.

### Terreno nuovo: Braciere
Ostacolo. Un'unità che subisce Collisione contro un Braciere riceve anche Vulnerabilità Fuoco (Turno Attuale). Premia Diniego Sismico e Attacco Poderoso e apre le combo di Fuoco.

---

## 5. Le stanze

Griglia 6 colonne × 8 righe, punta in alto, righe dispari spostate di mezza casella a destra (come il VTT). `R` = riga, `E` = esagono.
Legenda: `P` giocatore · `Z` Zombie · `S` Sussurratore · `F` Falena · `C` Custode · `#` Colonna · `B` Braciere · `x` Trappola

### Stanza 0 — Il Risveglio (tutorial)
```
R1    .   .   .   P   .   .
R2  .   .   .   .   .   .
R3    .   .   .   Z   .   .      Z1: 3 HP
R4  .   .   .   .   #   .
R5    .   .   .   Z   .   .      Z2: 6 HP
R6  .   .   .   .   .   .
R7    .   .   .   .   .   .
R8  .   .   Z   .   .   .        Z3: 6 HP
```

### Stanza 1 — La Cripta (il tuo setup demo rev.11, invariato) · Veglia 6
```
R1    .   .   .   P   .   .
R2  .   .   .   .   .   .
R3    .   .   .   .   .   .
R4  .   .   Z   .   #   Z
R5    .   .   x   .   .   .
R6  .   Z   .   #   .   Z
R7    .   .   .   Z   .   .
R8  .   .   .   .   .   .
```

### Stanza 2 — Il Corridoio dei Sussurri · Veglia 6
```
R1    .   .   P   .   .   .
R2  .   .   .   .   .   .
R3    .   #   .   .   #   .
R4  x   .   Z   Z   .   .
R5    .   Z   .   .   .   x
R6  .   .   #   #   .   .
R7    .   S   .   .   S   .
R8  .   .   .   .   .   .
```
Gli Zombie fanno da muro, i Sussurratori stanno dietro le colonne. Le trappole sono ai bordi, fuori dai percorsi naturali: servono una spinta o Distorsione (2 passi dal Sussurratore di destra, 3 da quello di sinistra).

### Stanza 3 — La Sala del Custode · Veglia 7
```
R1    .   .   P   .   .   .
R2  .   .   .   .   .   .
R3    .   .   .   x   .   .
R4  .   Z   .   .   Z   .
R5    .   B   .   .   B   .
R6  F   .   C   .   .   F
R7    .   .   .   .   .   .
R8  .   .   .   .   .   .
```
Le Falene arrivano al turno 2. Il Custode avanza di 1 a turno: hai due o tre turni per ripulire prima che arrivi.

---

## 6. Il passaggio di stanza

Requisiti che mi hai dato: funzionale, non rompe il flusso, gestibile. Due pezzi.

### 6.1 La Veglia (dentro la stanza)

Ogni stanza ha una candela con N tacche. Ne brucia una a turno.

- **Chiudi la stanza entro la Veglia:** alla Soglia scegli 2 Soste invece di 1.
- **La candela si spegne (Buio):** da quel turno, a ogni Lancio perdi 1 PT.

Una regola, due effetti: dà un prezzo al tempo (quindi alla Luce e al CD) e impedisce di tirarla in lunga sull'ultimo nemico per accumulare risorse.

### 6.2 La Soglia (tra le stanze)

Quando cade l'ultimo nemico il combattimento finisce subito: niente turni a vuoto. Poi una sola schermata, una sola decisione.

**Si azzera** (ciò che hai in mano): mazzo, mano, scarti, Plancia e Sigilli, stati, PM (tornano a 2), Luce (torna a 0).
**Resta** (ciò che sei): HP; PT fino a un massimo di 6.

**Soste** — ne scegli 1, oppure 2 diverse se sei stato nella Veglia:

| Sosta | Effetto |
|---|---|
| Bendarsi | +3 HP (max 10) |
| Raccogliersi | +2 PT (max 6) |
| Alimentare la lanterna | Inizi la prossima stanza con 2 Luce |

La Soglia mostra anche chi ti aspetta nella prossima stanza: tipi e numero dei nemici, con la loro scheda. Informazione completa, coerente con il resto del gioco.

### 6.3 Perché così

- **Reset del mazzo:** è la tua ultima indicazione ("ci deve essere il reset del mazzo tra un combattimento e l'altro"). In memoria di progetto risultava anche l'idea opposta, il CD che persiste; nel brief c'è un interruttore per provarla.
- **PT persistenti con tetto a 6 in ingresso:** il regolamento dice "inizi ogni combattimento con 6 PT" e "nessun limite superiore". In una run le due frasi insieme permetterebbero di accumulare PT in una stanza facile scartando il Terrore ogni turno. Il tetto vale solo sulla Soglia: in combattimento resta tutto com'è.
- **Luce azzerata:** toglie ogni motivo di rallentare il finale. La terza Sosta la restituisce come scelta.
- **Domani:** la Soglia è il posto dove entrerà l'esplorazione (Blocco 2). Per ora è il suo segnaposto: un momento calmo, una decisione.

---

## 7. Tutorial

Stanza 0, tre turni guidati con dadi, mano e mosse nemiche fissati; poi gioco libero. Si può saltare.

| Turno | Cosa insegna | Come |
|---|---|---|
| 1 | Sequenza, Selezione, movimento, una carta | Ti avvicini e uccidi Z1 con Attacco Base **prima** che il suo dado si risolva: il dado si spegne. |
| 1 | Colpo a Distanza, Scudo, attacco nemico | 2 danni a Z2 da lontano; Parata; l'Orda di Z2 viene assorbita. |
| 2 | Eco, carta con CD, Collisione | Scarti Scatto (+2 PM). Diniego Sismico spinge Z2 contro la colonna: 2 danni a impulso. La carta copre lo Slot 1. |
| 3 | Slot coperto, Luce | Un d6 è bloccato: paghi 2 Luce per tenerlo. Poi libero contro Z3. |
| Fine | Soglia | Prima Sosta spiegata. |

Nelle stanze successive, suggerimenti contestuali che compaiono una volta sola: primo Sussurro, primo Coro, prima Luce rubata, primo Sigillo, primo Buio, prima carta Terrore in mano.

---

## 8. Direzione visiva: 3D o pixel art?

**Risposta breve: tutti e due, ognuno dove rende.** È anche la direzione che avevi già fissato a marzo (2.5D alla Eiyuden Chronicle).

Claude Code non ha uno strumento di modellazione: non scolpisce un personaggio come farebbe un artista. Sa però costruire geometria in codice, e lì è forte. Quindi:

- **3D reale per l'ambiente:** esagoni con spessore, colonne, bracieri, pareti, porta della Soglia, luci dinamiche, nebbia. Tutto in Three.js r128, senza asset esterni.
- **Pixel art per i personaggi:** sprite 32×48 disegnati in codice (griglie di caratteri + palette), mostrati come billboard nella scena 3D. Animati per trasformazione (respiro, affondo, lampo al colpo, dissolvenza), non con tanti fotogrammi: è il modo più sicuro per avere un bel risultato senza un illustratore.
- **La Luce si vede.** Il giocatore porta una lanterna: raggio e intensità seguono la risorsa Luce. A Luce 0 i nemici lontani sono sagome con gli occhi accesi. Al Buio la scena si chiude.

Gli sprite stanno in file separati: quando avrai arte vera li sostituisci senza toccare altro. Onestamente: l'ambiente verrà bene al primo colpo; gli sprite avranno bisogno di uno o due giri di revisione, e per questo il brief prevede una pagina che li mostra da soli.

Le cinque decisioni visive rimaste aperte da marzo sono chiuse nel brief con un default: sprite 32×48; camera fissa con leggero respiro; Plancia con le carte ruotate davvero di 90°/180°; UI poco diegetica (vignettatura e disturbi solo a PT bassi); dadi con rotolamento breve e saltabile.

---

## 9. Decisioni da confermare

Ognuna ha già un default nel brief, in un file di dati.

| # | Decisione | Default nel brief |
|---|---|---|
| D1 | Ordine slot | B (Vigore / Terrore / Vigore). A resta disponibile come preset. |
| D2 | Tra le stanze | Reset di mazzo e CD; HP e PT restano; Luce a 0. |
| D3 | PT in ingresso stanza | Massimo 6. |
| D4 | Veglia | 6 / 6 / 7 turni; Buio = −1 PT a turno; nei tempi = 2 Soste. |
| D5 | Ordine interno della Fine Turno | Stati → Scarto → Eco → CD (CLAUDE.md). |
| D6 | Dadi IA | Un dado per nemico. Il primo dado Zombie in Sequenza è dello Zombie con il numero più basso, e così via. Se il nemico muore prima, il suo dado si spegne. |
| D7 | Bordo mappa nelle spinte | Vale come muro: Collisione. |
| D8 | Linea di vista per gli attacchi a distanza | Non richiesta: conta solo la gittata. |
| D9 | Distorsione | Nessuna Collisione. |
| D10 | Manipolazione Destino | Invariata (CD 2) nella demo; valutare CD 1 dopo il playtest. |

---

## 10. Dopo la demo

- Ricalibrare il modello sui tuoi log (la demo li esporta).
- Decidere D10 e la durata del Corridoio (+1 Zombie).
- Arc Terrore (soglie PT come perk): con i PT sotto pressione ha finalmente il terreno adatto.
- Leva C (Eco senza PM garantito): resta il passo successivo per rendere doloroso lo scarto.
