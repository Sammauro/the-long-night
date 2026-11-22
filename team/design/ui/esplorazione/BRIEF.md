# B1.3e — Esplorazione divergente dell'interfaccia: brief comune

## Perché questo passo
Gianmarco, 22/11, sul concetto "Il Lume": "non capisco perché l'organizzazione generale sia delle proposte che di tutto quello che mi hai fatto vedere è sempre lo stesso. Sembra che qualcosa blocchi proposte veramente nuove." E: "stiamo facendo UX/UI, non solo io: l'interfaccia va valutata anche in base al gioco, al suo flusso, ed essere funzionale al massimo."

Cosa bloccava (diagnosi del regista): tutte le proposte partivano dallo schema di CLAUDE.md §7 (HUD a sinistra, griglia al centro, sequenza sotto, carte in basso/lato) e dalle schermate dell'interfaccia attuale; ogni passo ereditava il precedente. **Per questa esplorazione quello schema NON è un vincolo.** Valgono solo le regole del gioco e le story.

## Correzioni di contenuto (da Gianmarco)
- **La Luce non è luminosità dell'ambiente.** È una risorsa interiore del personaggio (luce interiore): si ottiene scartando dadi Fuoco e con alcuni Eco, si accumula, si spende per recuperare dadi il cui slot è coperto da carte in cooldown (vedi `docs/regole_v0041a.md` §2.4 e §4). Non rappresentarla come candela, lampada o illuminazione della scena.
- **Niente "miccia"** (il filo/linea che attraversa la Sequenza come una corda o un rosario).
- **Le carte devono essere carte**, con la dignità di una mano di carte: si vedono come carte, si tengono in mano, si possono ingrandire per leggerle. Non righe di testo o strisce.
- Niente candela come indicatore.

## Cosa ti chiedo
1. **Analisi del flusso, prima del disegno.** Ricostruisci dal regolamento e dal motore (`src/engine/`, sola lettura) un turno completo: per ogni fase, quali decisioni prende il giocatore, con quale frequenza, quali informazioni gli servono in quel momento, quante azioni fisiche (tocchi) servono oggi. Scrivila in breve nel tuo file.
2. **Un'organizzazione dello schermo che nasca da quel flusso** e dalla metafora di partenza che ti è assegnata (puoi tradirla se trovi di meglio, ma la tua proposta deve essere strutturalmente diversa dallo schema "HUD sinistra / griglia centro / sequenza sotto / carte di lato").
3. **Le carte come mano:** come si tiene, come si ingrandisce una carta, come si gioca.
4. **Un turno raccontato** (storyboard testuale) dalla Selezione al Fine Turno, contando i tocchi.
5. **Due schermate chiave su telefono 844×390**: Selezione, e Risoluzione con una carta in uso. Un file HTML statico autonomo per schermata e il PNG (Playwright, deviceScaleFactor 2; Google Fonts è bloccato dal proxy: usa @fontsource via npm come in `team/design/ui/strumenti/` o `bozze_B1.3b/strumenti/`). Dati realistici: `team/design/ui/bozze_B1.3b/strumenti/dati_mockup.json`.

## Cosa NON leggere (per non farti condizionare)
`team/design/ui/concetto/`, `team/design/ui/schermate/`, `team/design/ui/DIREZIONE.md`, `team/ricerca/shots/`, e le cartelle degli altri esploratori in `team/design/ui/esplorazione/`.

Puoi leggere: regolamento, `src/engine/`, `team/ricerca/ui_2026-11-22.md` (solo principi, riferimenti e tabella dei problemi), `team/stories/ui/` (i criteri di accettazione restano validi).

## Criteri con cui verrà valutata (dallo stratega)
- Funzionalità del flusso: tocchi per turno, informazioni presenti al momento di ogni decisione, errori possibili.
- Leggibilità su telefono (I1–I5 di `team/PIANO.md`).
- Identità: esalta il gioco (horror lovecraftiano, dadi, carte), non sembra un'interfaccia generica.
- Novità reale dell'organizzazione rispetto allo schema di partenza.

## Output
Cartella `team/design/ui/esplorazione/<nome-concetto>/`: `PROPOSTA.md` (flusso, organizzazione, mano di carte, storyboard con conteggio tocchi, rischi), i due HTML, i due PNG. Non toccare `src/`, non toccare `team/STATO.md` (lo aggiorna il regista). Commit e push solo della tua cartella, con messaggio in italiano.
