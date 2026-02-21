# THE LONG NIGHT — MANUALE DI GIOCO
**Versione:** v0.0.3def rev.2
**Data:** 2026-02-21
**Stato:** SOURCE OF TRUTH — Combat System

> Questo documento sostituisce tutti i precedenti.
> Non modificare senza aggiornare il numero di versione.

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
- **Generazione:** Ogni carta scartata nella Fase 4 genera automaticamente **+1 PM** nel Next Turn Buffer (vedi sezione 4 — Eco).
- **Accumulo:** I PM non spesi si conservano tra un turno e l'altro. Non vanno mai persi.
- **Spesa:** 1 PM = muovi 1 casella sulla griglia esagonale.

---

## 3. ECONOMIA DEI DADI

### 3.1. I Tre Inventari

**DICE BAG (Arsenale)**
Dadi fisicamente disponibili ma non ancora attivi.
Viene popolata all'inizio della partita dalla somma dei valori [SUPPLY] di tutte le carte del mazzo.
È un'economia chiusa: è impossibile generare dadi che non siano presenti nella Bag.

**ACTIVE POOL (Tavolo)**
Dadi pronti per essere lanciati nel turno corrente.
All'inizio di ogni turno riceve i dadi dal Next Turn Buffer.

**NEXT TURN BUFFER (Futuro)**
Dadi e PM generati dagli Eco degli scarti e dai dadi non usati.
Vengono spostati nell'Active Pool all'inizio del turno successivo (Fase 1 — Upkeep).

### 3.2. Tipi di Dado

**DADO TERRA (Fisico) — d4/d6/d8**
Genera impulsi di **Forza** (✊).
Usato per attacchi in mischia e movimento.
Facce: d4 = 1-1-2-2 | d6 = 1-1-2-2-2-3 | d8 = 1-1-2-2-2-3-3-4

**DADO FUOCO (Elementale) — d4**
Genera impulsi di **Fuoco** (🔥).
Usato per attacchi a distanza e ad area.
Facce: d4 = 1-1-2-2

> *Nota di design:* Il Fuoco è il primo tipo Elementale implementato. In futuro altri elementi (es. Elettrico, Ghiaccio) seguiranno la stessa struttura con effetti di Amplificazione Elementale diversi.

**DADO TERRORE (Mentale) — d4/d6/d8**
Genera impulsi di **Presagio** (🔮).
I Presagi non hanno un costo fisso: il costo di attivazione è specificato su ogni carta o manovra che li utilizza.
Facce: d4 = 1-1-2-2 | d6 = 1-1-2-2-2-3 | d8 = 1-1-2-2-2-3-3-4

Manovre Base del Dado Terrore:
- **Scarica Mentale:** spendi 1 Presagio + 1 PT → 1 Danno Diretto (ignora scudi).
- **Affrontare le Paure:** scarta il dado senza usarlo → Recupera 1 PT. Il dado va nel Next Turn Buffer.

> **REGOLA SPECIALE — Il d8 Terrore è una risorsa unica e ciclica.**
> Esiste esattamente 1 d8 Terrore nell'intero sistema.
> Dopo qualsiasi interazione (impulsi spesi, scarto, manovra), il dado va sempre nel Next Turn Buffer — mai nella Bag.
> Il giocatore sa sempre dove si trova: in Active Pool (turno corrente) o in Next Turn Buffer (disponibile al prossimo turno).
> Non è mai perso.

**DADO AI NEMICO**
Ogni tipo di nemico ha il proprio dado AI definito nella sua Scheda Nemico.
Il dado AI entra nella Sequenza Vincolata insieme ai dadi del giocatore.
(Esempio: gli Zombie usano un d4 con 4 azioni.)

### 3.3. Impulsi e Azioni sulle Carte

Gli impulsi sono la valuta d'azione generata dai dadi quando vengono risolti nella Sequenza.
Ogni dado mette a disposizione un numero di impulsi pari al risultato del lancio.

**Regola — Impulsi parziali:**
Gli impulsi di un dado possono essere distribuiti liberamente tra più bersagli o più azioni della stessa carta. Non è obbligatorio spenderli tutti nello stesso modo.

**Regola — Sequenza irreversibile delle Azioni:**
Ogni riga di effetti su una carta è chiamata **Azione**. Le Azioni si risolvono in sequenza dall'alto verso il basso. Una volta che la risoluzione di un'Azione è completata, non è possibile tornare indietro.
*Esempio: se Attacco Base ha 4 impulsi disponibili, il giocatore non può fare 1 danno, poi pescare una carta con i 2 impulsi successivi, poi tornare a fare un altro danno con l'impulso rimanente. Una volta passato all'Azione successiva (pesca), l'Azione precedente (danno) è chiusa.*

**Regola — No combinazione tra dadi:**
Non è possibile sommare gli impulsi di due dadi diversi per pagare un singolo costo elevato (salvo eccezioni specifiche indicate sulle carte).

---

## 4. IL SISTEMA DELLE CARTE

### 4.1. Doppia Funzione
Ogni carta ha due utilizzi distinti e mutuamente esclusivi nello stesso turno:

**EFFETTO ATTIVO:** Si attiva giocando la carta durante la Fase 3 (Risoluzione), spendendo gli impulsi richiesti dal dado corrente in quel momento.

**ECO (Effetto Scarto):** Si attiva scartando la carta durante la Fase 4 (Fine Turno). Genera risorse per il turno successivo. Una carta scartata per l'Eco non può essere usata per l'Effetto Attivo nello stesso turno.

### 4.2. Cooldown (Rotazione)
Le carte usate per l'Effetto Attivo vengono poste sulla **Plancia Cooldown** ruotate in base alla loro potenza:

| Rotazione | CD | Turni di riposo |
|---|---|---|
| 90° | CD 1 | 1 turno |
| 180° | CD 2 | 2 turni |
| 270° | CD 3 | 3 turni |

Una carta torna disponibile (nella Pila Scarti) solo quando raggiunge 0° (posizione verticale).
Le carte con CD 0 non vanno in Cooldown: vanno direttamente nella Pila Scarti dopo l'uso.

### 4.3. Plancia Cooldown — Slot
La Plancia Cooldown ha **3 slot standard** per le carte in rotazione.
**1 slot esclusivo aggiuntivo** è riservato alla carta Infusione Elementale.

> *Nota di design — Sistema Equipaggiamento (pianificato):*
> Gli oggetti equipaggiabili forniranno carte aggiuntive e/o slot cooldown extra.
> Lo slot esclusivo di Infusione Elementale è il prototipo di questo sistema.
> Riferimento: Too Many Bones (build emergenti da equipaggiamento). Non implementato in v0.0.3def.

### 4.4. Manovre Base — Sistema Futuro
Le Manovre Base sono azioni sempre disponibili associate a specifici tipi di dado (vedi sezione 9).
In futuro il giocatore potrà raccogliere e scegliere quali Manovre tenere attive tra quelle trovate durante l'avventura. In v0.0.3def le Manovre Base sono fisse e invariabili.

---

## 5. STRUTTURA DEL TURNO

Il gioco si svolge in round ciclici composti da 4 Fasi.

---

### FASE 1 — UPKEEP (Mantenimento)

**Step A — Sblocca Buffer:**
Sposta tutto il contenuto del Next Turn Buffer nell'Active Pool (dadi + PM).

**Step B — Rimescola Scarti:**
Prendi tutte le carte nella Pila Scarti generata nel turno precedente e rimescolale nel Mazzo.

**Step C — Pesca Carte:**
Pesca carte dalla cima del Mazzo fino a raggiungere il limite di mano corrente (base: 5 carte).
Il limite può essere aumentato da Eco attivi (es. Scatto).

---

### FASE 2 — LANCIO E SEQUENZA

**Step A — Lancio:**
Lancia simultaneamente tutti i dadi presenti nell'Active Pool (dadi giocatore) più il dado AI di ogni nemico vivo in campo. Il tipo di dado AI dipende dalla Scheda Nemico di ogni tipo di nemico.

**Step B — Sequenza Vincolata:**
Disponi tutti i dadi lanciati in una fila orizzontale nell'ordine risultante dal lancio.
Questo ordine è **immutabile** per tutta la durata della Fase 3.

---

### FASE 3 — RISOLUZIONE

Risolvi i dadi nella Sequenza uno alla volta, da sinistra a destra.

**SE TOCCA A UN DADO GIOCATORE:**
Il dado mette a disposizione impulsi pari al risultato del lancio.
Il giocatore può spendere quegli impulsi per:
- Attivare l'Effetto Attivo di una o più carte dalla mano.
- Eseguire Manovre Base associate a quel tipo di dado.
- Una combinazione delle due opzioni.
Gli impulsi non spesi vanno persi (non si accumulano al dado successivo).
I dadi non usati (nessun impulso prelevato, nessuna manovra eseguita) vanno nel Next Turn Buffer a fine turno.

**SE TOCCA A UN DADO AI NEMICO:**
Tutti i nemici vivi di quel tipo si attivano nell'ordine in cui sono stati schierati.
Ogni nemico esegue l'azione corrispondente al risultato numerico del suo dado (vedi Schede Nemici).
Il giocatore non può interrompere le azioni nemiche salvo effetti specifici.

---

### FASE 4 — FINE TURNO

**Step A — Scarto Carte:**
Il giocatore sceglie liberamente quante e quali carte scartare dalla mano. Non c'è un obbligo di scarto minimo o massimo.

**Step B — Risoluzione Eco:**
Per ogni carta scartata il giocatore ottiene **automaticamente entrambi** i seguenti effetti:
1. **+1 PM** nel Next Turn Buffer.
2. **Eco:** l'effetto [Eco ⤵️] della carta viene eseguito. Se l'Eco richiede un dado dalla Bag e il dado non è disponibile, l'effetto fallisce ma il +1 PM viene comunque ottenuto.

**Step C — Rotazione Cooldown:**
1. Prima: sposta nella Pila Scarti tutte le carte sulla Plancia Cooldown che si trovano a 0°.
2. Poi: ruota tutte le rimanenti carte in Cooldown di 90° in senso antiorario.

---

## 6. COMBATTIMENTO

### 6.1. Attacchi e Danni
I danni vengono inflitti spendendo impulsi del tipo corretto tramite carte o manovre.
Ogni punto danno rimuove 1 HP dal bersaglio (salvo scudi).

### 6.2. Sistema degli Stati

Gli stati (Scudo, Vulnerabilità, Stordito) funzionano tutti con lo stesso sistema a due pool:

**Pool Corrente (questo turno):** stati acquisiti nel turno corrente.
**Pool Precedente (turno scorso):** stati acquisiti nel turno precedente.

**Regola consumo:** quando si deve consumare un token di stato, si preleva prima dalla Pool Precedente. Esaurita quella, si preleva dalla Pool Corrente.

**Regola scadenza:** a fine turno, tutti i token nella Pool Corrente vengono spostati nella Pool Precedente. I token già nella Pool Precedente scadono e vengono rimossi.

In pratica ogni stato dura al massimo fino alla fine del turno successivo a quello in cui è stato acquisito.

**SCUDO**
Ogni Segnalino Scudo assorbe 1 Danno.
L'uso degli scudi è obbligatorio: se si subisce un attacco, gli scudi vengono consumati prima degli HP.
È uno stato stackabile: più segnalini possono coesistere sullo stesso personaggio.

**VULNERABILITÀ**
Il bersaglio subisce Danni raddoppiati (x2) per ogni stack di Vulnerabilità attivo.
È uno stato stackabile: ogni stack aggiunge un moltiplicatore x2.
Esempio: 2 stack di Vulnerabilità = danno x4.

**STORDITO**
Il bersaglio salta la sua prossima attivazione.
- Su un nemico: non si attiva quando tocca il suo dado AI nella Sequenza.
- Sul giocatore: perde l'uso del prossimo dado giocatore nella Sequenza (gli impulsi sono inaccessibili).

### 6.3. Movimento sulla Griglia
1 PM = muovi l'Indagatore di 1 casella sulla griglia esagonale.
PM non spesi si conservano al turno successivo.

**Regola — Partenza adiacente al nemico:**
Se un'unità si trova adiacente a un nemico all'inizio del suo movimento, il primo passo di allontanamento (la prima casella percorsa) costa 2 PM invece di 1. I passi successivi costano normalmente 1 PM.

**Collisione Tattica:**
La Spinta X allontana il bersaglio dalla fonte di X caselle. "Allontanare" significa che ogni step deve risultare in una casella più lontana dalla fonte rispetto alla precedente.
- È la fonte a scegliere liberamente la traiettoria di allontanamento tra le caselle valide.
- Se una casella che sarebbe valida per il passo successivo è occupata da un ostacolo, si verifica una **Collisione**: il bersaglio si ferma e subisce (X - N) danni, dove N è il numero di caselle già percorse.
- Quando è un nemico a infliggere Spinta al giocatore, la traiettoria va sempre nella direzione opposta alla fonte (linea retta), applicando comunque la Collisione con ostacoli.

### 6.4. Amplificazione Elementale
È possibile usare un dado Elementale (qualsiasi dado non-Terra e non-Terrore) per pagare il costo di una carta Fisica (normalmente pagata con Forza).
- L'azione acquisisce il tipo dell'elemento del dado usato.
- Se l'azione è un attacco e tutto il danno viene inflitto a un singolo bersaglio: infligge **+1 Danno** totale.
- Se il danno è distribuito su più bersagli: il +1 Danno non si applica.
- **Restrizione:** Non è possibile usare dadi Terrore per l'Amplificazione Elementale.

> *Nota di design:* Il bonus di Amplificazione dipenderà dall'elemento in versioni future.
> Esempio ipotetico: Dado Elettrico → +1 PM invece di +1 Danno. (TBC)

---

## 7. DATABASE CARTE — SET BASE (14 Carte)

### ARSENALE TERRA

| Nome | CD | Supply | Effetto Attivo | Eco ⤵️ |
|---|---|---|---|---|
| **Attacco Base** (x2) | 0 | — | 1 ✊: 1 Danno. / 2 ✊: Pesca 1 carta immediatamente. | +1 Scudo (Pool Corrente T+1) |
| **Scatto** (x2) | 0 | — | 1 ✊: +2 PM immediatamente (ripetibile). | +1 al limite di mano (T+1) |
| **Attacco Poderoso** | 1 | — | 1 ✊: 2 Danni (self: Vulnerabile). / 1 ✊: Stordisci + Spingi 1 (self: Vulnerabile). | Genera 1x d4 Fuoco nel buffer |
| **Diniego Sismico** | 1 | — | 1 ✊: 1 Danno + Spingi 1 (Collisione Tattica). | Genera 1x d4 Fuoco nel buffer |
| **Attacco Strategico** | 2 | 1x d6 Terra | 1 ✊: Vulnerabilità (Gittata 2) + 1 Scudo (Pool Corrente T+1). / 1 ✊: Pesca 1 carta immediatamente. | Genera 1x Dado a Scelta nel buffer |

### ARSENALE FUOCO

| Nome | CD | Supply | Effetto Attivo | Eco ⤵️ |
|---|---|---|---|---|
| **Attacco di Fuoco** | 1 | 1x d4 Fuoco | 1 🔥: 2 Danni Fuoco (Gittata 3). / 1 🔥: Vulnerabilità Fuoco. | Genera 1x d6 Terra nel buffer |
| **Cono di Fuoco** | 1 | 1x d4 Fuoco | 1 🔥: +1 Gittata. / 1 🔥: Danno Fuoco AOE (Cono). / 1 🔥: Vulnerabilità Fuoco AOE. | Genera 1x d6 Terra nel buffer |
| **Infusione Elementale** | 1 (slot esclusivo) | — | GRATIS: Converti 1 dado non-Terrore in Fuoco (+1 impulso al dado convertito). | Ruota 1 carta in Cooldown di 90° in senso antiorario (avanzamento parziale) |

> **Cono di Fuoco — Forma dell'area:**
> Il cono si espande partendo dalla fonte: 2 caselle adiacenti alla fonte, poi le 3 successive, poi le 4 successive.
> Ogni aumento di Gittata (+1 Gittata) aggiunge un'ulteriore "fascia" di caselle al cono (5, poi 6, ecc.).

### ARSENALE SPECIALE

| Nome | CD | Supply | Effetto Attivo | Eco ⤵️ |
|---|---|---|---|---|
| **Carica Furiosa** | 2 | 1x d8 Standard | Consuma 2 dadi adiacenti nella Sequenza. Carica in linea retta: PM = somma impulsi dei 2 dadi consumati. Danno = caselle effettivamente percorse. | Genera 1x Dado a Scelta nel buffer |
| **Profondità Mente** | 2 | 1x d8 Terrore | 1 Presagio + 1 PT: Converti tutti i Presagi (🔮) attualmente disponibili in Forza (✊). Gli impulsi Forza così ottenuti possono essere ulteriormente convertiti in Fuoco tramite la carta Infusione Elementale. | Genera 1x Dado a Scelta nel buffer |
| **Manipolazione Destino** | 2 | — | 1 PT: Scegli un dado in Active Pool e ruotalo sulla faccia che preferisci. | Fa avanzare tutte le carte in Cooldown di 90° in senso antiorario (tutte si avvicinano al ritorno). |

---

## 8. SCHEDE NEMICI

### ZOMBIE (Orda)
**Statistiche:** HP 4 | Movimento 2
**Dado AI:** d4

| Risultato | Azione | Effetto |
|---|---|---|
| 1 | Morso Rigenerante | Muove verso il giocatore + Attacca (2 Danni). Cura 1 HP per ogni danno inflitto agli HP. |
| 2 | Attacco Orda | Muove verso il giocatore + Attacca (2 Danni). +1 Danno per ogni altro Zombie adiacente al bersaglio al momento dell'attacco. |
| 3 | Incassare | Non si muove. Non attacca. Guadagna 2 Segnalini Scudo (Pool Corrente). |
| 4 | Attacco Terrore | Muove verso il giocatore + Attacca (2 Danni). Se almeno 1 danno viene inflitto agli HP: bersaglio perde 1 PT. |

---

## 9. MANOVRE BASE

Azioni sempre disponibili quando si risolve il dado indicato. Non richiedono una carta.

| Manovra | Dado | Costo | Effetto |
|---|---|---|---|
| Movimento Tattico | Terra (qualsiasi) | 1 Forza | +1 PM |
| Colpo a Distanza | Fuoco (d4) | 1 Fuoco | 1 Danno (Gittata 3) |
| Scarica Mentale | Terrore (d8) | 1 Presagio + 1 PT | 1 Danno Diretto (ignora scudi) |
| Affrontare le Paure | Terrore (d8) | Scarta il dado senza usarlo | Recupera 1 PT. Il d8 Terrore va nel Next Turn Buffer. |

---

## 10. SETUP DEMO (Scenario Base)

### Risorse iniziali
HP: 10 | PT: 6 | PM: 2

### Composizione Bag
Calcolata dalla somma dei Supply delle 14 carte del mazzo demo:
- 2x d4 Fuoco (da Attacco di Fuoco + Cono di Fuoco)
- 1x d6 Terra (da Attacco Strategico)
- 1x d8 Standard (da Carica Furiosa)
- 1x d8 Terrore (da Profondità Mente) ← risorsa unica ciclica

### Active Pool Turno 1
- 1x d6 Terra
- 1x d4 Fuoco
- 1x d8 Terrore

### Mazzo (14 carte)
- 2x Attacco Base
- 2x Scatto
- 1x Attacco Poderoso
- 1x Diniego Sismico
- 1x Attacco Strategico
- 1x Attacco di Fuoco
- 1x Cono di Fuoco
- 1x Infusione Elementale
- 1x Carica Furiosa
- 1x Profondità Mente
- 1x Manipolazione Destino

Mano iniziale: pesca 5 carte.

### Mappa
Griglia 6x8 esagoni. Nessun ostacolo (scenario demo).

### Schieramento
- Giocatore: Riga 1, Esagono 4
- Zombie 1: Riga 4, Esagono 3
- Zombie 2: Riga 6, Esagono 2
- Zombie 3: Riga 7, Esagono 4
- Zombie 4: Riga 7, Esagono 5

---

## 11. MECCANICHE IN DRAFT O PIANIFICATE

**Sistema Equipaggiamento (pianificato):**
Gli oggetti equipaggiabili forniranno carte aggiuntive al mazzo, slot cooldown extra sulla Plancia, effetti passivi legati alle statistiche del personaggio.
Riferimento: Too Many Bones (build emergenti da equipaggiamento).

**Elementi futuri (pianificati):**
Dado Elettrico e altri tipi elementali, ognuno con un'Amplificazione Elementale specifica.
Il Fuoco (+1 Danno su singolo bersaglio) è il prototipo del sistema.

---

*The Long Night — Combat System v0.0.3def rev.2 · 2026-02-21*
*Prossima versione target: v0.1.0 (primo milestone simulatore Three.js)*
