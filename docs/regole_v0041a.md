# THE LONG NIGHT — MANUALE DI GIOCO
**Versione:** v0.0.4a rev.4
**Data:** 2026-03-02
**Stato:** SOURCE OF TRUTH — Combat System

> Questo documento sostituisce tutti i precedenti.
> Non modificare senza aggiornare il numero di versione.

> **Regola di Precedenza:** Le regole scritte su una carta hanno sempre la precedenza sulle regole generali di questo manuale. Se una carta contraddice il manuale, vale la carta.

> **Note terminologiche:**
> - La fase in cui il giocatore sceglie quali dadi prendere dopo il lancio è chiamata **Selezione** in tutto questo documento.
> - I termini **Turno Attuale** e **Prossimo Turno** sostituiscono i vecchi "Presente" e "Futuro" usati nel sistema degli stati (Scudi, Vulnerabilità, Stordito) — sezione 6.2. Questi termini non si applicano ai dadi, che risiedono solo nella Bag.

---

## 1. OBIETTIVO E SOPRAVVIVENZA

Il giocatore controlla un **Indagatore** in uno scenario tattico a turni su griglia esagonale.

La partita termina con **Sconfitta Immediata** se si verifica una delle due condizioni:
- **Morte Fisica:** I Punti Vita (HP) scendono a 0.
- **Follia:** I Punti Terrore (PT) scendono a 0.

La partita termina con **Vittoria** quando tutti i nemici dello scenario sono eliminati.

---

## 2. RISORSE DEL GIOCATORE

### 2.1. Punti Vita (HP)
Rappresentano la resistenza fisica. Massimo: **10 HP**.

### 2.2. Punti Terrore (PT)
Rappresentano la sanità mentale.
Il giocatore inizia ogni combattimento con **6 PT**. Non esiste un limite superiore ai PT — possono superare 6 tramite effetti di gioco.
Alcune carte e manovre richiedono di pagare PT come costo di attivazione.
Scendere a 0 PT causa sconfitta immediata per Follia.

### 2.3. Punti Movimento (PM)
Rappresentano la capacità di muoversi sulla griglia nel turno corrente.
- **PM Base:** Il giocatore inizia ogni sessione con **2 PM**.
- **Generazione:** Alcune carte generano PM tramite il loro Eco specifico. I dadi Vigore scartati nella Selezione generano PM (vedi sezione 3.3).
- **Accumulo:** I PM non spesi si conservano tra un turno e l'altro. Non vanno mai persi.
- **Spesa:** 1 PM = muovi 1 casella sulla griglia esagonale.

### 2.4. Luce (💡)
Rappresenta la lucidità residua del giocatore — la capacità di recuperare controllo sulle proprie risorse.

- **Generazione:** Ogni dado Fuoco scartato nella Selezione (Fase 3) genera **+1 Luce** (flat, indipendente dal risultato del lancio). Alcune carte generano Luce tramite il loro Eco.
- **Accumulo:** La Luce si conserva tra un turno e l'altro senza limite.
- **Spesa:** Pagare il costo di recupero di uno slot Equipaggiamento coperto da CD permette di rendere accessibile il dado di quello slot nella Selezione del turno corrente. Il pagamento non rimuove il CD dalla carta — il CD scala normalmente.

> *Nota di design — Secondo utilizzo della Luce (non implementato in v0.0.4a):*
> La Luce alimenta anche una barra super mossa. Calibrata a valore irraggiungibile nel test iniziale.

---

## 3. ECONOMIA DEI DADI

### 3.1. La Bag (Arsenale)

La **Bag** contiene tutti i dadi del giocatore. È un'economia chiusa: è impossibile generare dadi che non siano già presenti nella Bag. La Bag viene popolata all'inizio della partita dalla somma dei valori [SUPPLY] di tutte le carte del mazzo.

Ogni turno si lancia l'intera Bag. I dadi non entrano né escono dalla Bag durante la partita — tornano sempre nella Bag dopo ogni uso.

### 3.2. Il Sistema di Equipaggiamento

L'Equipaggiamento determina quali dadi della Bag sono **accessibili** nella Selezione. Senza un slot Equipaggiamento corrispondente, un dado non può essere selezionato — può solo essere scartato per la sua risorsa.

Ogni pezzo di Equipaggiamento definisce uno **slot** con tre attributi:
- **Dado:** quale tipo e/o taglia di dado lo slot rende accessibile.
- **Priorità:** numero che determina l'ordine di copertura quando le carte vanno in CD.
- **Costo di recupero:** quanta Luce costa rendere accessibile il dado quando lo slot è coperto da CD.

**Regola — Copertura degli slot da CD:**
Quando una carta va in Cooldown, copre gli slot dall'**alto verso il basso** (dalla priorità più alta). Quando una carta esce dal Cooldown, si libera lo slot a priorità più bassa tra quelli attualmente coperti (scorrimento verso il basso).

**Regola — Slot esclusivi:**
Alcuni pezzi di Equipaggiamento definiscono uno slot **esclusivo**: quello slot può ospitare in Cooldown solo carte di un tipo specifico (es. solo carte Fuoco). Le carte del tipo corrispondente possono andare nello slot esclusivo **oppure** in qualsiasi slot standard libero — non sono obbligate a usare lo slot esclusivo. La carta che occupa uno slot esclusivo non conta per le regole di copertura degli slot standard. Lo slot esclusivo ha un sistema di copertura indipendente dagli slot standard: quando una carta lo occupa, è coperto; quando la carta esce dal Cooldown, è libero. Non partecipa allo scorrimento di priorità degli slot standard.

**Regola — Dadi eccedenti:**
La Bag può contenere più dadi degli slot Equipaggiamento disponibili. Tutti i dadi in Bag vengono lanciati ogni turno. I dadi eccedenti — quelli per i quali non esiste nessuno slot corrispondente — non possono essere selezionati nella Selezione, ma possono essere scartati per la loro risorsa. Avere più dadi dello stesso tipo degli slot disponibili offre un vantaggio di scelta: il giocatore lancia tutti i dadi, vede i risultati, e sceglie quale tenere tra quelli dello stesso tipo.

### 3.3. Tipi di Dado

**DADO VIGORE (Fisico) — d4/d6/d8**
Genera impulsi di **Forza** (✊).
Usato per attacchi in mischia e movimento.
Facce: d4 = 1-1-2-2 | d6 = 1-1-2-2-2-3 | d8 = 1-1-2-2-2-3-3-4
Scartato nella Selezione: genera **+1 PM**.

**DADO FUOCO (Elementale) — d4**
Genera impulsi di **Fuoco** (🔥).
Usato per attacchi a distanza e ad area.
Facce: d4 = 1-1-2-2
Scartato nella Selezione: genera **+1 Luce**.

> *Nota di design:* Il Fuoco è il primo tipo Elementale implementato. In futuro altri elementi (es. Elettrico, Ghiaccio) seguiranno la stessa struttura con effetti di Amplificazione Elementale diversi.

**DADO TERRORE (Mentale) — d8**
Genera impulsi di **Presagio** (🔮).
I Presagi possono essere utilizzati in due modi:
1. Come costo specifico delle carte e manovre Terrore.
2. Tramite la manovra **Conversione Oscura**: ogni Presagio può essere convertito in un impulso di qualsiasi tipo al costo variabile (vedi sezione 9). L'impulso ottenuto acquisisce il tipo scelto e può triggerare effetti specifici di quel tipo.
Facce: d8 = 1-1-2-2-2-3-3-4
Scartato nella Selezione: genera **+1 PT**.

**DADO AI NEMICO**
Ogni tipo di nemico ha il proprio dado AI definito nella sua Scheda Nemico.
Il dado AI entra nella Sequenza Vincolata insieme ai dadi scelti dal giocatore nella Selezione.
(Esempio: gli Zombie usano un d4 con 4 azioni.)

### 3.4. Impulsi e Azioni sulle Carte

Gli impulsi sono la valuta d'azione generata dai dadi quando vengono risolti nella Sequenza.
Ogni dado mette a disposizione un numero di impulsi pari al risultato del lancio.

**Regola — Impulsi parziali:**
Gli impulsi di un dado possono essere distribuiti liberamente tra più bersagli o più Azioni della stessa carta. Non è obbligatorio spenderli tutti nello stesso modo. Gli impulsi non spesi vanno persi a fine risoluzione del dado.

**Regola — Sequenza irreversibile delle Azioni:**
Ogni riga di effetti su una carta è chiamata **Azione**. Le Azioni si risolvono in sequenza dall'alto verso il basso. Una volta completata un'Azione, non è possibile tornare indietro. Non è possibile interrompere la risoluzione di una carta e poi riprenderla: qualsiasi azione esterna (incluso il movimento) chiude definitivamente la carta al punto in cui si trova.
*Esempio: se risolvo Attacco Base e sono nell'Azione Danno, non posso fare 1 danno, muovere, poi fare un altro danno con l'impulso rimanente. Il movimento chiude la carta.*

**Regola — No combinazione tra dadi:**
Non è possibile sommare gli impulsi di due dadi diversi per pagare un singolo costo elevato (salvo eccezioni specifiche indicate sulle carte). Uno stesso dado può essere usato per attivare più carte in sequenza, finché ha impulsi disponibili.

---

## 4. IL SISTEMA DELLE CARTE

### 4.1. Doppia Funzione
Ogni carta ha due utilizzi distinti e mutuamente esclusivi nello stesso turno:

**EFFETTO ATTIVO:** Si attiva giocando la carta durante la Fase 4 (Risoluzione). Alcune carte richiedono impulsi da un dado in risoluzione; altre no (indicato sul testo della carta).

**ECO (Effetto Scarto):** Si attiva scartando la carta durante la Fase 1 (Fine Turno). Ogni carta ha un Eco specifico che può generare PM, Luce, effetti tattici, o combinazioni di questi. Una carta scartata per l'Eco non può essere usata per l'Effetto Attivo nello stesso turno.

**Regola — Pesca carte (generale):**
Quando un effetto indica "Pesca X carte", il giocatore prende X carte dalla cima del Mazzo e le aggiunge alla mano. Se il Mazzo è vuoto, la pesca fallisce per le carte mancanti (non si rimescola la Pila Scarti). Le carte pescate durante la Fase 4 sono immediatamente giocabili nello stesso turno.

### 4.2. Cooldown (Rotazione)
Le carte usate per l'Effetto Attivo vengono poste sulla **Plancia Cooldown** ruotate in base alla loro potenza:

| Rotazione | CD | Turni di riposo |
|---|---|---|
| 90° | CD 1 | 1 turno |
| 180° | CD 2 | 2 turni |
| 270° | CD 3 | 3 turni |

Una carta torna disponibile (nella Pila Scarti) solo quando raggiunge 0° (posizione verticale).
Le carte con CD 0 non vanno in Cooldown: vanno direttamente nella Pila Scarti dopo l'uso.

**Regola — Timing del Cooldown:**
Una carta va in Cooldown immediatamente dopo che il giocatore ha finito di risolverne gli effetti (perché non ci sono più Azioni disponibili o perché il giocatore sceglie di non giocare ulteriori Azioni sulla carta). Lo slot Cooldown viene occupato in quel momento. Durante la Fase 4, il numero di slot liberi cambia in tempo reale man mano che le carte vengono giocate.

### 4.3. Plancia Cooldown — Slot
La Plancia Cooldown ha **3 slot standard** per le carte in rotazione. Slot aggiuntivi di tipo **esclusivo** sono definiti dall'Equipaggiamento. Le carte del tipo corrispondente a uno slot esclusivo possono occupare quello slot o uno slot standard libero, a scelta del giocatore. Le carte di tipo non corrispondente non possono occupare lo slot esclusivo.

**Regola — Slot pieni:**
Se non ci sono slot Cooldown liberi (né standard né esclusivi appropriati) al momento dell'attivazione, il giocatore non può giocare carte con CD ≥ 1 in quel turno. Le carte con CD 0 non occupano slot Cooldown e possono essere giocate senza limiti.

### 4.4. Manovre Base
Le Manovre Base sono azioni sempre disponibili associate a specifici tipi di dado (vedi sezione 9). In v0.0.4a le Manovre Base sono fisse e invariabili.

---

## 5. STRUTTURA DEL TURNO

Il gioco si svolve in round ciclici composti da 4 Fasi nell'ordine seguente:

**Fase 1 — Fine Turno** → **Fase 2 — Upkeep** → **Fase 3 — Lancio e Selezione** → **Fase 4 — Risoluzione**

> **Nota — Primo turno:** Al primo turno della partita, la Fase 1 (Fine Turno) viene saltata. Il gioco inizia dalla Fase 2 (Upkeep).

---

### FASE 1 — FINE TURNO

**Step A — Scarto Carte:**
Il giocatore sceglie liberamente quante e quali carte scartare dalla mano.

**Step B — Risoluzione Eco:**
Per ogni carta scartata il giocatore ottiene l'**Eco specifico** della carta (PM, Luce, effetti tattici, o altro — come indicato sulla carta). Gli effetti Eco si applicano immediatamente: i PM si accumulano, la Luce si accumula, gli Scudi vanno nell'area Turno Attuale.

**Step C — Rotazione Cooldown:**
1. Prima: sposta nella Pila Scarti tutte le carte sulla Plancia Cooldown che si trovano a 0°.
2. Poi: ruota tutte le rimanenti carte in Cooldown di 90° in senso antiorario.

**Step D — Rotazione Stati:**
Gli stati (Scudi, Vulnerabilità, Stordito) sono tracciati su due aree distinte per ogni personaggio — **Turno Attuale** e **Prossimo Turno**.
1. Tutti i token nell'area **Prossimo Turno** scadono e vengono rimossi.
2. Tutti i token nell'area **Turno Attuale** vengono spostati nell'area **Prossimo Turno**.

In pratica ogni stato dura al massimo fino alla fine del turno successivo a quello in cui è stato acquisito.

---

### FASE 2 — UPKEEP (Mantenimento)

**Step A — Pesca Carte:**
Pesca carte dalla cima del Mazzo fino a raggiungere il limite di mano corrente (base: 5 carte).
Se il Mazzo è vuoto durante la pesca, smetti di pescare senza rimescolare.

**Step B — Rimescola Scarti:**
Prendi tutte le carte nella Pila Scarti e rimescolale nel Mazzo (disponibili dalla prossima pesca).

---

### FASE 3 — LANCIO E SELEZIONE

**Step A — Lancio:**
Lancia simultaneamente tutti i dadi nella Bag più il dado AI di ogni nemico vivo in campo.
Il giocatore vede tutti i risultati prima di prendere qualsiasi decisione.

**Step B — Sequenza Vincolata:**
Dopo il lancio e prima della Selezione, tutti i dadi lanciati (giocatore + AI) vengono disposti in una fila orizzontale in ordine casuale. Questo ordine è la **Sequenza Vincolata** ed è **immutabile** per tutta la durata del turno (salvo effetti di carte che lo alterano esplicitamente).
I dadi AI sono sempre presenti nella Sequenza indipendentemente dalla Selezione.
I dadi scartati nella Selezione vengono rimossi dalla Sequenza. Il loro risultato di lancio resta visibile al giocatore per tutta la durata del turno.

**Step C — Selezione:**
Il giocatore processa i dadi lanciati uno alla volta, in qualsiasi ordine. Per ogni dado, decide se:
- **Selezionarlo** (inserirlo nella Sequenza per la Fase 4), se lo slot Equipaggiamento corrispondente è scoperto (gratuito) o coperto da CD (pagando il costo di recupero in Luce).
- **Scartarlo** (ottenere la risorsa corrispondente al tipo di dado).

Le risorse da scarto sono disponibili immediatamente e possono essere usate per pagare costi di recupero di dadi successivi nella stessa Selezione. Il giocatore può annullare una selezione già fatta e cambiare un dado da "selezionato" a "scartato" (o viceversa) in qualsiasi momento durante la Selezione, purché le risorse risultanti siano sufficienti a coprire tutti i costi al termine del processo.

Un dado non può essere selezionato se il giocatore non ha le risorse sufficienti per pagarne il costo di recupero.

*Risorse da scarto (flat, indipendenti dal risultato del lancio):*
- Dado Vigore scartato → **+1 PM**
- Dado Fuoco scartato → **+1 Luce**
- Dado Terrore scartato → **+1 PT**

---

### FASE 4 — RISOLUZIONE

I dadi nella Sequenza vengono risolti uno alla volta, da sinistra a destra. Tra la risoluzione di un dado e il successivo, il giocatore ha una **finestra di azione libera** in cui può:
- Giocare carte dalla mano (purché paghi i costi richiesti).
- Spendere PM per muoversi sulla griglia.
- Eseguire qualsiasi altra azione disponibile.

Una finestra di azione libera esiste anche **prima** del primo dado e **dopo** l'ultimo dado della Sequenza.

**Restrizioni:**
- Il giocatore non può agire durante la risoluzione del dado AI nemico.
- Il giocatore non può interrompere la risoluzione di una carta per giocare un'altra carta (vedi Regola — Sequenza irreversibile delle Azioni, sezione 3.4). Il movimento durante la risoluzione di una carta chiude definitivamente quella carta.

**Carte che richiedono impulsi:**
Le carte con costo in impulsi (es. "1 ✊: ...") possono essere giocate solo durante la risoluzione di un dado che fornisce impulsi del tipo richiesto, o impulsi convertiti nel tipo richiesto. Un dado mette a disposizione impulsi pari al risultato del lancio. Uno stesso dado può attivare più carte in sequenza finché ha impulsi disponibili. Gli impulsi non spesi vanno persi a fine risoluzione del dado.

**Carte senza costo in impulsi:**
Le carte che non richiedono impulsi da un dado (es. Infusione Elementale, Manipolazione Destino, Carica Furiosa) possono essere giocate in qualsiasi finestra di azione libera.

**Sequenza alterabile:**
Alcune carte, se espressamente indicato sul testo, alterano o consumano dadi della Sequenza (es. Carica Furiosa). In questi casi la regola della Sequenza immutabile è sospesa per quella carta.

**SE TOCCA A UN DADO GIOCATORE:**
Il dado mette a disposizione impulsi pari al risultato del lancio.
Il giocatore può spendere quegli impulsi per:
- Attivare l'Effetto Attivo di una o più carte dalla mano. Alcune azioni richiedono impulsi come costo esplicito nel testo della carta; altre no.
- Eseguire Manovre Base associate a quel tipo di dado.
- Una combinazione delle due opzioni.
Gli impulsi non spesi vanno persi.

**SE TOCCA A UN DADO AI NEMICO:**
Tutti i nemici vivi di quel tipo si attivano nell'ordine numerico di schieramento (Zombie 1 prima di Zombie 2, etc.).
Ogni nemico esegue l'azione corrispondente al risultato numerico del suo dado (vedi Schede Nemici).
Il giocatore non può interrompere le azioni nemiche salvo effetti specifici.

**Movimento dei nemici:**
Quando un'azione nemica prevede movimento, il nemico si sposta seguendo il **percorso più breve** verso il proprio bersaglio. Ogni passo deve ridurre la distanza dal bersaglio di 1 rispetto al passo precedente.
- I nemici aggirano gli ostacoli. Aggirare un ostacolo è l'unica eccezione alla regola del passo sempre più vicino, purché si stia percorrendo il cammino più breve.
- I nemici non possono terminare il proprio movimento né passare attraverso caselle occupate da altri nemici, ostacoli o personaggi.
- Se due caselle sono equidistanti e ugualmente valide sul percorso più breve, la scelta è casuale.
- Se nessun percorso valido esiste verso il bersaglio, il nemico non si muove. Esegue comunque la componente di attacco della sua azione se il bersaglio è già in gittata.

---

## 6. COMBATTIMENTO

### 6.1. Attacchi e Danni
I danni vengono inflitti spendendo impulsi del tipo corretto tramite carte o manovre.
Ogni punto danno rimuove 1 HP dal bersaglio.

**Corpo a Corpo (adiacente):** Un attacco Corpo a Corpo richiede che l'attaccante e il bersaglio siano su caselle adiacenti (distanza 1 sulla griglia esagonale). Non richiede linea di vista.

**Danno Diretto:** Il Danno Diretto ignora gli Scudi (non può essere assorbito) e ignora la Vulnerabilità (non viene moltiplicato). Rimuove direttamente HP dal bersaglio.

### 6.2. Sistema degli Stati

Gli stati sono tracciati su due aree distinte per ogni personaggio: **Turno Attuale** (stati acquisiti questo turno) e **Prossimo Turno** (stati acquisiti il turno precedente). La rotazione avviene nella Fase 1 — Fine Turno, Step D.

**Regola consumo:** quando si deve consumare un token di stato, si preleva prima dal Prossimo Turno. Esaurito il Prossimo Turno, si preleva dal Turno Attuale.

**SCUDO**
Ogni Segnalino Scudo assorbe 1 Danno.
L'uso degli scudi è obbligatorio: se si subisce un attacco, gli scudi vengono consumati prima degli HP.
È uno stato stackabile: più segnalini possono coesistere sullo stesso personaggio.

**VULNERABILITÀ**
La Vulnerabilità è **tipizzata**: ogni stack specifica un tipo di danno (es. Vulnerabilità Fuoco, Vulnerabilità generica).
- **Vulnerabilità generica** (senza tipo): il bersaglio subisce Danni raddoppiati (x2) da qualsiasi fonte di danno non-Elementale. Non moltiplica i danni Elementali (Fuoco, ecc.).
- **Vulnerabilità tipizzata** (es. Vulnerabilità Fuoco): il bersaglio subisce Danni raddoppiati (x2) solo da fonti di danno del tipo corrispondente.

La Vulnerabilità si applica **prima** degli Scudi: il danno moltiplicato viene poi ridotto dagli Scudi.
È uno stato stackabile: ogni stack aggiunge un moltiplicatore x2, ma solo stack dello stesso tipo si accumulano tra loro.

*Esempio: 1 stack Vulnerabilità Fuoco + 1 stack Vulnerabilità generica. Un attacco Fuoco da 2 danni viene moltiplicato x2 dalla Vulnerabilità Fuoco = 4 danni, ma NON dalla Vulnerabilità generica. Un attacco Fisico da 2 danni viene moltiplicato x2 dalla Vulnerabilità generica = 4 danni, ma NON dalla Vulnerabilità Fuoco.*

**STORDITO**
Il bersaglio salta la sua prossima attivazione.
- Su un **nemico specifico**: quel singolo nemico non si attiva quando tocca il dado AI del suo tipo nella Sequenza. Gli altri nemici dello stesso tipo si attivano normalmente.
- Sul **giocatore**: alla prossima risoluzione di un dado giocatore nella Sequenza (nel turno corrente o al turno successivo se non ci sono più dadi da risolvere), il giocatore salta quel dado — gli impulsi sono inaccessibili. Lo Stordito viene consumato.

### 6.3. Movimento sulla Griglia
1 PM = muovi l'Indagatore di 1 casella sulla griglia esagonale.
PM non spesi si conservano al turno successivo.

**Regola — Partenza adiacente al nemico (solo giocatore):**
Se il giocatore si trova adiacente a un nemico all'inizio del suo movimento, il primo passo di allontanamento costa 2 PM invece di 1. I passi successivi costano normalmente 1 PM. Questa regola non si applica ai nemici.

**Collisione Tattica:**
La Spinta X allontana il bersaglio dalla fonte di X caselle. "Allontanare" significa che ogni step deve risultare in una casella più lontana dalla fonte rispetto alla precedente.
- Se la Spinta è generata dal giocatore: è il giocatore a scegliere liberamente la traiettoria di allontanamento tra le caselle valide. Il giocatore può scegliere di dirigere il bersaglio verso una casella valida alternativa invece di causare la Collisione.
- Se la Spinta è generata da un nemico: la traiettoria va nella direzione opposta alla fonte (linea retta), automaticamente.
- Se la casella successiva nel percorso è occupata da un **ostacolo, un nemico o un personaggio**, si verifica una **Collisione**: il bersaglio si ferma e subisce (X - N) danni, dove N è il numero di caselle già percorse. Se la Collisione avviene contro un'altra unità (nemico o personaggio), anche l'unità colpita subisce (X - N) danni.
- Se tutte le caselle valide per il primo passo sono bloccate, la Spinta causa Collisione immediata con danno pari a X (perché N = 0).

**Trappole:**
Alcune caselle della mappa contengono trappole. La trappola si attiva quando qualsiasi unità **entra** nella casella — sia con movimento volontario, sia per spostamento forzato (Spinta, Distorsione, o altro). L'effetto è indicato nello scenario. La trappola viene rimossa dopo l'attivazione.

### 6.4. Amplificazione Elementale
È possibile usare impulsi di tipo Elementale (da qualsiasi fonte, inclusa la Conversione Oscura) per pagare il costo di una carta Vigore (normalmente pagata con Forza).
- L'azione acquisisce il tipo dell'elemento degli impulsi usati.
- Se l'azione è un attacco e tutto il danno viene inflitto a un singolo bersaglio: infligge **+1 Danno** totale.
- Se il danno è distribuito su più bersagli: il +1 Danno non si applica.
- **Restrizione:** Gli impulsi Presagio non convertiti non possono attivare l'Amplificazione Elementale. Devono essere prima convertiti tramite Conversione Oscura in un impulso Elementale.

---

## 7. DATABASE CARTE — SET TEST v0.0.4a (13 Carte)

### ARSENALE VIGORE

| Nome | CD | Supply | Effetto Attivo | Eco ⤵️ |
|---|---|---|---|---|
| **Attacco Base** (x2) | 0 | — | 1 ✊: 1 Danno. / 2 ✊: Pesca 1 carta immediatamente. | +1 PM · +1 Scudo (Turno Attuale) |
| **Attacco Poderoso** | 1 | — | 1 ✊: 2 Danni (self: Vulnerabile generica, non stacka sulla stessa attivazione). / 1 ✊: Stordisci 1 nemico adiacente + Spingi 1 (self: Vulnerabile generica, non stacka sulla stessa attivazione). | +1 PM · +1 Luce |
| **Diniego Sismico** | 1 | — | 1 ✊: infliggi 1 Danno e Spingi 1 al bersaglio adiacente (Collisione Tattica). Danno e Spinta si applicano simultaneamente con un singolo impulso. | +1 PM · +1 Luce |
| **Attacco Strategico** | 2 | 1x d6 Vigore | 1 ✊: 1 Danno. Per ogni danno inflitto direttamente agli HP (non assorbito da scudi), ottieni 1 PM **oppure** 1 Scudo (Turno Attuale) a scelta. | +1 PM · +2 Luce |

> **Attacco Strategico — Risoluzione ricompense:**
> Si risolve prima tutto il danno dell'Azione (applicando Vulnerabilità e Scudi), poi si contano i danni totali effettivamente inflitti agli HP. La ricompensa (PM o Scudo) si calcola sul totale, non impulso per impulso.

### ARSENALE FUOCO

| Nome | CD | Supply | Effetto Attivo | Eco ⤵️ |
|---|---|---|---|---|
| **Attacco di Fuoco** | 1 | 1x d4 Fuoco | 1 🔥: 2 Danni Fuoco (Corpo a Corpo). / 1 🔥: Applica Vulnerabilità Fuoco a un bersaglio adiacente. | +1 PM · +1 Luce |
| **Cono di Fuoco** | 1 | 1x d4 Fuoco | 1 🔥: 2 Danni Fuoco AOE (Cono, Gittata 3). Il giocatore sceglie l'orientamento del cono tra le 6 direzioni al momento dell'attivazione. | +1 PM · +1 Luce |
| **Infusione Elementale** | 1 (slot esclusivo Fuoco) | — | Non richiede impulsi. Converti gli impulsi di 1 dado non ancora risolto nella Sequenza in impulsi Fuoco (+1 impulso al dado convertito). I dadi Terrore non possono essere convertiti (i Presagi sono esclusi). Gli impulsi ottenuti tramite Conversione Oscura che hanno già acquisito un tipo non-Presagio possono essere ulteriormente convertiti in Fuoco. L'effetto si applica quando quel dado viene risolto. | +1 PM · Avanza 1 carta in CD di 90° a scelta del giocatore |

> **Cono di Fuoco — Forma dell'area (Gittata 3):**
> Il cono si espande partendo dalla fonte: fascia 1 = 2 caselle adiacenti alla fonte, fascia 2 = le 3 successive, fascia 3 = le 4 successive. Il giocatore sceglie l'orientamento tra le 6 direzioni della griglia esagonale al momento dell'attivazione.

> **Attacco di Fuoco — Azioni indipendenti:**
> Le due azioni hanno bersagli indipendenti: il bersaglio della seconda azione può essere diverso da quello della prima. Gli impulsi spesi sulla prima azione non hanno effetto sulla seconda e viceversa. Resta valida la Regola della Sequenza Irreversibile: una volta passato alla seconda azione, non è possibile tornare alla prima.

### ARSENALE SPECIALE

| Nome | CD | Supply | Effetto Attivo | Eco ⤵️ |
|---|---|---|---|---|
| **Carica Furiosa** | 2 | 1x d6 Vigore | Non richiede impulsi. Seleziona e consuma 2 dadi giocatore adiacenti nella Sequenza. Muovi in linea retta: caselle percorribili = somma degli impulsi dei 2 dadi consumati. Se al termine del movimento il giocatore è adiacente a un nemico, infliggi danno pari alle caselle percorse. Non utilizzabile se il giocatore è già adiacente a qualsiasi nemico. | +1 PM · +2 Luce |
| **Profondità Mente** | 2 | 1x d8 Terrore | X Presagi + X PT → X Danni Diretti (ignorano scudi) a un singolo bersaglio ovunque sulla mappa. | +1 PM · +2 Luce |
| **Manipolazione Destino** | 2 | — | Non richiede impulsi. Costa 1 PT: scegli un dado giocatore nella Sequenza non ancora risolto e ruotalo sulla faccia che preferisci. | +1 PM · Avanza tutte le carte in CD di 90° in senso antiorario |
| **Distorsione** | 1 | — | X Presagi + 1 PT → sposta un'unità bersaglio (non self) di X caselle. La direzione è a scelta del giocatore. Ogni passo deve essere adiacente alla posizione precedente. Non si applica Collisione: il bersaglio si ferma se il percorso è bloccato. Le trappole si attivano normalmente se il bersaglio entra in una casella con trappola. **Target validi:** qualsiasi unità sul campo eccetto il giocatore stesso. | +1 PM · Pesca 1 carta |

> **Carica Furiosa — Chiarimenti:**
> - La carta non richiede impulsi e può essere giocata in qualsiasi finestra di azione libera della Fase 4.
> - La carta altera la Sequenza Vincolata: i 2 dadi selezionati vengono rimossi dalla Sequenza.
> - I 2 dadi devono essere adiacenti tra loro nella Sequenza e devono essere dadi giocatore.
> - Il movimento è in linea retta. Non è possibile passare attraverso caselle occupate da nemici, ostacoli o altri personaggi.
> - Se il giocatore non raggiunge un nemico (distanza troppo grande o percorso bloccato), si ferma nella casella più lontana raggiungibile sulla linea retta. Non infligge danno (non è adiacente a un nemico al termine del movimento).
> - La restrizione "non utilizzabile se adiacente a qualsiasi nemico" si applica al momento dell'attivazione della carta.

> **Carte non incluse nel set test:**
> - **Scatto** (x2) — rimossa, effetto attivo da riprogettare.

---

## 8. SCHEDE NEMICI

### ZOMBIE (Orda)
**Statistiche:** HP 4 | Movimento 2
**Dado AI:** d4
**Ordine di attivazione:** i Zombie si attivano per ordine numerico di schieramento (Zombie 1 → Zombie 2 → Zombie 3 → ...).

**Regole generali Zombie:**
- Quando un'azione indica "Muove verso il giocatore", lo Zombie si sposta fino a un massimo di caselle pari al suo valore Movimento seguendo il percorso più breve, fermandosi non appena diventa adiacente al giocatore. Se lo Zombie è già adiacente al giocatore, non si muove. Se al termine del movimento lo Zombie non è adiacente al giocatore, la componente "Attacca" dell'azione non viene eseguita.
- La cura non può superare il massimo HP indicato nella scheda.

| Risultato | Azione | Effetto |
|---|---|---|
| 1 | Morso Rigenerante | Muove verso il giocatore + Attacca (2 Danni). Cura 1 HP per ogni danno inflitto agli HP. |
| 2 | Attacco Orda | Muove verso il giocatore + Attacca (2 Danni). +1 Danno per ogni altro Zombie adiacente al bersaglio al momento dell'attacco. |
| 3 | Incassare | Non si muove. Non attacca. Guadagna 2 Segnalini Scudo (Turno Attuale). |
| 4 | Attacco Terrore | Muove verso il giocatore + Attacca (2 Danni). Se almeno 1 danno viene inflitto agli HP: bersaglio perde 1 PT. |

---

## 9. MANOVRE BASE

Azioni sempre disponibili quando si risolve il dado indicato. Non richiedono una carta.

| Manovra | Dado | Costo | Effetto |
|---|---|---|---|
| Movimento Tattico | Vigore (qualsiasi) | 1 Forza | +1 PM |
| Colpo a Distanza | Fuoco (d4) | 1 Fuoco | 1 Danno (Gittata 3) |
| Conversione Oscura | Terrore (d8) | Vedi nota | 1 Impulso del tipo scelto dal giocatore. L'impulso acquisisce il tipo scelto e può triggerare effetti specifici di quel tipo (inclusa Amplificazione Elementale se scelto Fuoco). |

> **Conversione Oscura — Costo differenziato:**
> - Conversione in impulso non-Elementale (es. Forza): **1 Presagio + 1 PT** per impulso convertito.
> - Conversione in impulso Elementale (es. Fuoco): **1 Presagio + 1 PT** per impulso convertito **+ 1 PT flat** per l'intera conversione (pagato una volta sola indipendentemente dal numero di impulsi convertiti in quella attivazione).
>
> *Esempio: convertire 3 Presagi in 3 impulsi Fuoco costa 3 PT (1 per impulso) + 1 PT (flat Elementale) = 4 PT totali.*

---

## 10. SETUP DEMO (Scenario Base v0.0.4a)

### Risorse iniziali
HP: 10 | PT: 6 | PM: 2 | Luce: 0

### Equipaggiamento Demo

| Slot | Tipo | Dado | Priorità | Costo recupero |
|---|---|---|---|---|
| Slot 1 | Standard | d8 Terrore | Alta (copre per primo) | 2 Luce |
| Slot 2 | Standard | d6 Vigore | Media | 1 Luce |
| Slot 3 | Standard | d6 Vigore | Bassa (copre per ultimo) | 2 Luce |
| Slot 4 | Esclusivo Fuoco (solo carte Fuoco) | d4 Fuoco | — | 1 Luce |

> *Nota: La Bag contiene 2x d4 Fuoco ma lo slot Equipaggiamento per il Fuoco è uno solo (Slot 4 esclusivo). Il giocatore lancia entrambi i d4, vede i risultati, e sceglie quale selezionare. L'altro viene scartato per +1 Luce.*

### Composizione Bag
- 2x d6 Vigore (da Attacco Strategico + Carica Furiosa)
- 2x d4 Fuoco (da Attacco di Fuoco + Cono di Fuoco)
- 1x d8 Terrore (da Profondità Mente)

### Turno 1 — Lancio iniziale
Il gioco al Turno 1 inizia dalla Fase 2 (Upkeep) — la Fase 1 (Fine Turno) viene saltata.
Tutti gli slot Equipaggiamento sono scoperti: tutti i dadi sono accessibili gratuitamente nella Selezione.

### Mazzo (13 carte)
- 2x Attacco Base
- 1x Attacco Poderoso
- 1x Diniego Sismico
- 1x Attacco Strategico
- 1x Attacco di Fuoco
- 1x Cono di Fuoco
- 1x Infusione Elementale
- 1x Carica Furiosa
- 1x Profondità Mente
- 1x Manipolazione Destino
- 1x Distorsione

Mano iniziale: pesca 5 carte.

### Mappa
Griglia 6x8 esagoni.

**Ostacoli (colonne — occupano 1 casella, bloccano movimento e causano Collisione):**
- Colonna A: Riga 4, Esagono 5
- Colonna B: Riga 6, Esagono 4

**Trappole (casella attraversabile — 3 Danni Diretti all'attivazione, poi rimossa):**
- Trappola: Riga 5, Esagono 3

### Schieramento
- Giocatore: Riga 1, Esagono 4
- Zombie 1: Riga 4, Esagono 3
- Zombie 2: Riga 6, Esagono 2
- Zombie 3: Riga 7, Esagono 4
- Zombie 4: Riga 7, Esagono 5

---

## 11. MECCANICHE IN DRAFT O PIANIFICATE

**Leva A — Costi aggiuntivi sull'Effetto Attivo (backlog v0.0.4):**
Alcune carte costeranno PM o PT per essere attivate, oltre al CD. Da implementare dopo stabilizzazione del sistema Leva B.

**Leva C — Differenziazione Eco PM (backlog v0.0.4):**
Il +1 PM nell'Eco di ogni carta del set base è attualmente uniforme. In futuro lo scarto sarà vera rinuncia — alcune carte potrebbero non generare PM, o generarne di più. Da rivalutare con dati del simulatore.

**Scatto — riprogettazione (backlog v0.0.4):**
Rimossa dal set test. L'effetto attivo è troppo debole. Da ridisegnare. L'Eco andrà convertito: il vecchio "+1 limite di mano" diventa "+1 PM · Pesca 1 carta" per allinearsi al nuovo flusso.

**Diniego Sismico — valutazione post-playtest:**
Inclusa nel set test. L'efficacia dipende dagli ostacoli nella mappa demo. Da valutare con dati reali.

**Sistema Equipaggiamento — Variante B (backlog v0.0.4):**
Ogni slot potrebbe avere un CD massimo ospitabile (limite rigido). Da testare in parallelo alla Variante A (attuale).

**Super mossa (backlog v0.0.4):**
Secondo utilizzo della Luce. Barra calibrata a valore irraggiungibile nel test iniziale. Da definire dopo stabilizzazione del loop base.

**Arc Terrore — soglie PT come perk progressivi (v0.0.5):**
Soglie a ≤5/≤4/≤3/≤2 PT che sbloccano perk cumulativi sul dado Terrore. Progressione inversa — scendere = potere.

**Elementi futuri (pianificati):**
Dado Elettrico e altri tipi elementali, ognuno con un'Amplificazione Elementale specifica.

---

## 12. EQUIVALENZA v0.0.3def → v0.0.4a

Questa sezione mappa ogni meccanica modificata alla sua nuova forma. Utile per chi conosce la versione precedente.

### Struttura del Turno

| v0.0.3def | v0.0.4a | Note |
|---|---|---|
| Fase 1 Upkeep → Fase 2 Lancio → Fase 3 Risoluzione → Fase 4 Fine Turno | **Fase 1 Fine Turno → Fase 2 Upkeep → Fase 3 Lancio e Selezione → Fase 4 Risoluzione** | Il Fine Turno è ora la prima fase — elimina ambiguità sull'applicazione degli stati |
| Fase 1 Step B: Rimescola → Step C: Pesca | Fase 2 Step A: Pesca → Step B: Rimescola | Si pesca prima del rimescolamento |
| Fine turno: stati ruotano implicitamente | Fine turno Step D: rotazione esplicita Turno Attuale→Prossimo Turno, Prossimo Turno→rimosso | Aree stati ora esplicite con nuova terminologia |
| — | Primo turno: Fase 1 saltata | Evita di applicare una Fine Turno senza aver giocato nulla |
| Buffer come meccanica intermedia | **Buffer rimosso** | Gli effetti Eco si applicano direttamente nella Fase 1 Step B |

### Risorse

| v0.0.3def | v0.0.4a | Note |
|---|---|---|
| PM generati dall'Eco (1 per carta scartata, regola universale) | +1 PM come Eco specifico di ogni carta del set base | Non è più una regola di sistema ma un effetto carta |
| — | **Luce** (nuova risorsa) | Generata da dadi Fuoco scartati nella Selezione e da alcuni Eco. Spesa per sbloccare slot coperti da CD |

### Sistema Dadi

| v0.0.3def | v0.0.4a | Note |
|---|---|---|
| Bag → Presente → Futuro (tre inventari) | Solo **Bag** | I dadi non si spostano più tra inventari. Si lancia tutta la Bag ogni turno |
| Dadi in Presente = dadi che giochi | Dadi in Bag = dadi che lanci. Dadi scelti nella Selezione = dadi che risolvi in Sequenza | La Selezione sostituisce la selezione implicita |
| Eco delle carte generano dadi nel Futuro | Eco delle carte generano **Luce** o effetti tattici | I dadi non vengono più generati dalle carte |
| d8 Terrore — risorsa unica ciclica | d8 Terrore — dado normale nella Bag | La regola ciclica non ha più senso nel nuovo sistema |
| — | **Selezione** (nuova meccanica) | Dopo il lancio, il giocatore sceglie quali dadi prendere e quali scartare |
| — | **Equipaggiamento** con slot, priorità, costo recupero | Determina quali dadi sono accessibili nella Selezione |

### Carte

| Carta | v0.0.3def | v0.0.4a | Motivo |
|---|---|---|---|
| **Scatto** (x2) | Effetto: +2 PM per impulso. Eco: +1 limite mano | **Rimossa dal set test** | Effetto attivo troppo debole |
| **Attacco Poderoso** | Eco: genera 1x d4 Fuoco nel Futuro | Eco: **+1 PM · +1 Luce** | I dadi non si generano più dalle carte |
| **Diniego Sismico** | Eco: genera 1x d4 Fuoco nel Futuro | Eco: **+1 PM · +1 Luce** | I dadi non si generano più dalle carte |
| **Attacco Strategico** | Effetto: Vulnerabilità (Gittata 2) + Scudo / Pesca carta. Eco: genera Dado a Scelta | Effetto: **1 Danno per impulso + PM o Scudo per danno agli HP (calcolato sul totale)**. Eco: **+1 PM · +2 Luce** | Vulnerabilità, range e pesca poco attrattivi; dadi non si generano più |
| **Attacco di Fuoco** | Effetto: Gittata 3. Eco: genera 1x d6 Vigore nel Futuro | Effetto: **Corpo a Corpo. Seconda azione indipendente (Vulnerabilità Fuoco a bersaglio adiacente)**. Eco: **+1 PM · +1 Luce** | Cambiato in attacco adiacente; azioni indipendenti |
| **Cono di Fuoco** | Effetto: +Gittata / AOE / Vulnerabilità AOE. Eco: genera 1x d6 Vigore | Effetto: **1 🔥: 2 Danni AOE Cono (Gittata 3), orientamento a scelta**. Eco: **+1 PM · +1 Luce** | Semplificato; dadi non si generano più |
| **Carica Furiosa** | Supply: 1x d8 Standard. Danno = tutte le caselle percorse | Supply: **1x d6 Vigore**. Non richiede impulsi. Danno solo se adiacente al nemico al termine. Non usabile se già adiacente. Eco: **+1 PM · +2 Luce** | d8 Standard non esiste più; meccanica completamente riscritta |
| **Profondità Mente** | Effetto: converte Presagi in Forza. Eco: genera Dado a Scelta | Effetto: **X Presagi + X PT → X Danni Diretti a singolo bersaglio ovunque**. Eco: **+1 PM · +2 Luce** | Riprogettata |
| **Distorsione** | — (carta nuova) | Effetto: **X Presagi + 1 PT → sposta unità non-self X caselle, no Collisione, trappole attivate normalmente**. Eco: **+1 PM · pesca 1 carta** | Aggiunta per massa critica mazzo; Eco differito rimosso con il Buffer |

### Combattimento

| v0.0.3def | v0.0.4a | Note |
|---|---|---|
| Vulnerabilità non tipizzata | **Vulnerabilità tipizzata** (generica vs Fuoco vs altri tipi futuri) | Stack dello stesso tipo si accumulano; tipi diversi non si cumulano tra loro |
| Amplificazione Elementale richiede dado Elementale | **Amplificazione Elementale funziona con impulsi Elementali** (inclusa Conversione Oscura) | Il check è sul tipo dell'impulso, non sul dado d'origine |
| Collisione: danno solo al bersaglio spinto | **Collisione: danno anche all'unità colpita** (X - N danni per entrambi) | Estesa agli scontri tra unità |

### Terminologia Stati

| v0.0.3def | v0.0.4a | Note |
|---|---|---|
| "Presente" / "Futuro" per gli stati | **"Turno Attuale" / "Prossimo Turno"** | Disambigua dai termini usati per i dadi nel vecchio sistema |

### Manovre Base

| v0.0.3def | v0.0.4a | Note |
|---|---|---|
| **Scarica Mentale:** 1 Presagio + 1 PT → 1 Danno Diretto | **Conversione Oscura:** costo differenziato per tipo di impulso | Non più danno fisso — conversione flessibile; costo extra per impulsi Elementali |
| **Affrontare le Paure:** scarta d8 → +1 PT | **Rimossa** | Il d8 scartato nella Selezione genera già +1 PT |

### Mappa Demo

| v0.0.3def | v0.0.4a | Note |
|---|---|---|
| Griglia 6x8, nessun ostacolo | Griglia 6x8, **2 colonne** (R4 Es.5, R6 Es.4) + **1 trappola** (R5 Es.3) | Ostacoli per Collisione Tattica; trappola per Distorsione |

---

*The Long Night — Combat System v0.0.4a rev.3 · 2026-03-02*
*Sostituisce: v0.0.4a rev.3 (2026-03-02)*
*Prossima versione target: v0.1.0 (primo milestone simulatore Three.js)*
