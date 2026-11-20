# Bilanciamento demo: misura di base (2026-11-20)

Branch `prova-demo`. Misura con l'agente prudente `tools/balance_agent.js`, senza modifiche a dati, `src/` o allo strumento. Nessuna raccomandazione di difficoltà: la decisione spetta a Gianmarco.

## Riepilogo

- **Slot demo:** run completa 70,0% (350/500, IC 95% 65,8–73,9). Obiettivo ~52%: scarto +18 punti, fuori dall'intervallo di confidenza.
- **Slot rev.11:** run completa 70,8% (354/500, IC 95% 66,7–74,6). Scarto +19 punti. Gli intervalli delle due configurazioni si sovrappongono: il preset degli slot non cambia in modo misurabile l'esito.
- **Stanze:** la mediana dei turni è 6 nella Cripta e nel Sala del Custode, 5 nel Corridoio dei Sussurri, in entrambe le configurazioni. Obiettivo 6–7: il Corridoio è sotto di un turno. Medie: 5,8 / 4,9 / 6,2 (demo).
- **Confronto con le misure precedenti** (DEMO.md, 400 run, slot demo): 90% / 91% / 86% di vittorie, mediane 6 / 5 / 6, run completa 70%. Stessi valori entro il rumore statistico: la demo non è cambiata in modo misurabile da allora.
- **Morti:** quasi tutte per morte fisica (142 su 150 sconfitte in demo). La Sala del Custode è la stanza con più morti (59 su 409 entrate, 14,4%). La Follia compare solo nel Corridoio (8 casi in entrambe le configurazioni).

## Comandi e seed

Comandi eseguiti (dalla radice del repo):

```
node tools/balance_agent.js 500 r1,r2,r3
node tools/balance_agent.js 500 r1,r2,r3 rev11
```

Per i numeri esatti (conteggi, IC 95%, medie, HP) ho usato un wrapper in scratchpad, copia dello stesso strumento con solo output aggiuntivo (`$S/make_stats.js`, generato da `$S/balance_stats.js`, dove `$S` è `C:\Users\Samma\AppData\Local\Temp\claude\01f5a35a4918afe9\4d142929-cf2b-4be5-ab96-3efdfdecd073\scratchpad`). Il wrapper riproduce identici i conteggi dello strumento ufficiale. Comandi:

```
node "$S/balance_stats.js" 500 r1,r2,r3
node "$S/balance_stats.js" 500 r1,r2,r3 rev11
```

**Seed:** lo strumento non ha un parametro di seed da riga di comando. Il seed è fisso nel codice: per la run `i` (0…N-1) il seed è `9000 + i × 7919`. Le 500 run usano quindi i = 0…499, uguali per entrambe le configurazioni. Le misure sono ripetibili con gli stessi comandi.

Tempo di esecuzione: circa 10 s per configurazione. Errori di simulazione: 0.

## Tabella: slot demo (500 run)

| Stanza | Entrate | Vittorie | % vittoria (IC 95%) | Morti | Follia | Turni mediana | Turni media | Entro la Veglia | HP a fine stanza (vittorie, mediana / media) |
|---|---|---|---|---|---|---|---|---|---|
| r1 Cripta | 500 | 451 | 90,2% (87,3–92,5) | 49 | 0 | 6 | 5,8 | 354 (70,8%) | 6 / 5,5 |
| r2 Corridoio | 451 | 409 | 90,7% (87,7–93,0) | 34 | 8 | 5 | 4,9 | 386 (85,6%) | 6 / 5,9 |
| r3 Sala del Custode | 409 | 350 | 85,6% (81,8–88,6) | 59 | 0 | 6 | 6,2 | 306 (74,8%) | 6 / 5,7 |
| **Run completa** | 500 | **350** | **70,0% (65,8–73,9)** | | | | | | HP a fine run (vittorie): mediana 6, media 5,7 |

## Tabella: slot rev.11 (500 run)

| Stanza | Entrate | Vittorie | % vittoria (IC 95%) | Morti | Follia | Turni mediana | Turni media | Entro la Veglia | HP a fine stanza (vittorie, mediana / media) |
|---|---|---|---|---|---|---|---|---|---|
| r1 Cripta | 500 | 447 | 89,4% (86,4–91,8) | 53 | 0 | 6 | 5,7 | 360 (72,0%) | 6 / 5,6 |
| r2 Corridoio | 447 | 403 | 90,1% (87,0–92,6) | 36 | 8 | 5 | 4,9 | 385 (86,1%) | 6 / 6,0 |
| r3 Sala del Custode | 403 | 354 | 87,8% (84,3–90,7) | 49 | 0 | 6 | 6,1 | 317 (78,7%) | 6 / 5,8 |
| **Run completa** | 500 | **354** | **70,8% (66,7–74,6)** | | | | | | HP a fine run (vittorie): mediana 6, media 5,8 |

Per le percentuali "% vittoria" e "Entro la Veglia" la base è il numero di entrate nella stanza. "Entro la Veglia" è il dato che lo strumento definisce come `inVeglia` sulle vittorie.

## Confronto con l'obiettivo di design

| Metrica | Obiettivo | Demo | Scarto demo | rev.11 | Scarto rev.11 |
|---|---|---|---|---|---|
| Run completa | ~52% | 70,0% | +18,0 pp | 70,8% | +18,8 pp |
| Turni stanza 1 (Cripta), mediana | 6–7 | 6 | nel range | 6 | nel range |
| Turni stanza 2 (Corridoio), mediana | 6–7 | 5 | −1 sotto il range | 5 | −1 sotto il range |
| Turni stanza 3 (Sala del Custode), mediana | 6–7 | 6 | nel range | 6 | nel range |

Il design non indica un obiettivo di vittoria per singola stanza: nella tabella non ci sono scarti per stanza.

## Confronto con le misure precedenti

Dati da DEMO.md (400 run, slot demo, seed non registrato):

| Stanza | Vittorie precedenti | Vittorie ora (demo) | Mediana precedente | Mediana ora | Entro Veglia precedente | Entro Veglia ora |
|---|---|---|---|---|---|---|
| Cripta | 90% | 90,2% | 6 | 6 | 72% | 70,8% |
| Corridoio | 91% | 90,7% | 5 | 5 | 86% | 85,6% |
| Sala del Custode | 86% | 85,6% | 6 | 6 | 75% | 74,8% |
| Run completa | 70% | 70,0% | | | | |

Il valore di 66–72% citato in `team/DECISIONI.md` non è riconducibile a una misura registrata: la misura di DEMO.md è 70%. Le misure ora riproducono quella precedente con uno scarto di ~1 punto, quindi il dato è stabile.

## Limiti della misura

- **Agente, non giocatore.** `balance_agent.js` è una politica euristica che gioca con regole fisse. Il risultato misura quanto la demo è difficile per quel modo di giocare, non per un giocatore umano. Il file stesso lo dichiara ("prudente").
- **Un solo seed.** Gli IC 95% misurano il campionamento su 500 run con seed fisso, non la variabilità tra seed diversi. Il seed non è configurabile da riga di comando.
- **Nessun dato su nemico o causa di morte.** Lo strumento e lo stato di gioco registrano solo esito (`death` / `madness` / `win`) e stanza. Non è possibile dire quale nemico (zombie, sussurratore, falena, custode) causa le morti.
- **HP a fine stanza calcolata solo sulle vittorie**, con il wrapper (non nello strumento ufficiale). Le sconfitte non hanno un HP di fine stanza utile.
- **Stanza 4 (tutorial) non misurata:** la richiesta copriva r1→r3.
- **Turni:** le mediane sono calcolate sulle sole vittorie, come nello strumento ufficiale. Un run che supera il limite di 40 turni o 3000 passi non viene registrato: nelle due misure tutte le 500 run risultano contabilizzate (vittorie + morti + follia = entrate), quindi nessuna run è stata scartata.
- **Veglia:** la definizione di "entro la Veglia" è quella dello strumento; non ho verificato il criterio nel design.
