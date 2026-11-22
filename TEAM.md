# TLN — Team di agenti (branch `prova-demo`)

> Prova, non fonte di verità. Niente su `main`, CLAUDE.md, file di regole, Notion, GitHub Pages.

## 1. Avvio sul tuo PC (una volta)

1. **Codice:** nella cartella TLN `git pull` e `git checkout prova-demo`.
2. **Token PixelLab** (rigeneralo prima su pixellab.ai/account, quello incollato in chat va considerato esposto). In PowerShell:
   `setx PIXELLAB_TOKEN "il-nuovo-token"`, poi chiudi e riapri il terminale. Il token non va mai nel repo: `.mcp.json` lo legge dalla variabile.
3. **Strumenti per i tester:** `npm i -D playwright` e `npx playwright install chromium`. Per il server locale serve Python (`python -m http.server 8765`) oppure `npx http-server -p 8765`.
4. **Avvio:** dalla cartella TLN `claude --model fable`. Alla prima apertura approva il server MCP `pixellab` del progetto.
5. **Verifica:** in basso deve comparire `[Fable] 5h …% · settimana …%`. È la statusline che salva i consumi in `.claude/usage.json`: senza, le soglie non funzionano.
6. **Parti o riprendi:** scrivi `/avvia-team`. Per farlo andare senza chiederti conferme a ogni comando, avvia con `claude --model fable --permission-mode acceptEdits` e approva i comandi ricorrenti la prima volta ("non chiedere più"); la modalità automatica completa (`auto`) usala solo se la tua versione la offre e ti fidi del perimetro qui sotto.

## 2. Soglie di consumo

| Cosa | Dove | Default |
|---|---|---|
| Finestra di 5 ore del piano Max | `.claude/budget.json` → `max_five_hour` | 85% |
| Limite settimanale | `max_seven_day` | 60% |
| Consumo di questa sessione sulla settimana | `max_week_points_this_session` | 15 punti |
| Generazioni PixelLab per sessione | `pixellab_max_generations_per_session` | 15 |

Come si fermano gli agenti:
- **Il regista** esegue `node .claude/tools/budget_guard.js --status` prima di ogni task; se risponde `STOP` scrive il report e si ferma.
- **L'hook** in `.claude/settings.json` blocca l'avvio di nuovi subagenti oltre soglia, anche se il regista se ne dimentica.
- **Il tetto rigido** resta il limite di spesa che imposti tu su claude.ai, in Impostazioni → Usage.

## 3. Processo a batch

Il lavoro è diviso in **batch** (blocchi grossi con un obiettivo) e ogni batch in **passi** piccoli. Lo stato vive in `team/STATO.md`: dopo ogni passo si aggiorna, si fa commit e push. Se i crediti finiscono o la sessione si chiude, `/avvia-team` riparte dal primo passo non fatto.

Ogni batch segue lo stesso schema:
1. **Piano** (stratega/Fable): obiettivi misurabili, passi, cancello → `team/PIANO.md`.
2. **Ricerca e user story** (ricercatore-ux) → `team/ricerca/`, `team/stories/`.
3. **Design** (designer-ux-ui) → mockup e specifica in `team/design/`.
4. **Sviluppo** (sviluppatore, anche più istanze in parallelo per story indipendenti).
5. **Collaudo** delle story (collaudatore) → `team/collaudo/`.
6. **Playtest** con profili (playtester) → `team/playtest/`.
7. **Valutazione** (stratega): procedi, ripeti o fermati → `team/valutazioni/`.

Non tutti i batch usano tutti i passi: li sceglie lo stratega nel piano.

**Dove gira**
- **Nel cloud** (dall'app Claude): un batch per volta; a fine batch o al cancello ci si ferma e Gianmarco scrive quando andare avanti. Niente soglie automatiche: il freno è il tetto di spesa su claude.ai.
- **Sul PC** (`claude --model fable`, poi `/avvia-team`): le soglie automatiche della §2 fermano il lavoro e il report dice da dove riprendere.

## 4. Ruoli

| Agente | Modello | Fa | Non fa |
|---|---|---|---|
| Regista (sessione principale, `/avvia-team`) | Fable sul PC | Segue `team/STATO.md`, affida i passi, verifica, salva | Non esegue il lavoro |
| `stratega` | Fable | Piano del batch, indicatori, valutazione ai cancelli | Non scrive codice né story |
| `ricercatore-ux` | Opus | Ricerca con fonti, principi, user story con criteri | Non disegna né programma |
| `designer-ux-ui` | Opus | Interfaccia da zero: mockup HTML, specifica | Non tocca `src/` |
| `sviluppatore` | Sonnet | Implementa story e specifica; motore intatto | Non interpreta regole |
| `collaudatore` | Sonnet | Verifica criterio per criterio con prove | Non giudica il gusto |
| `playtester` | Opus | Gioca con un profilo, pensa ad alta voce, misura l'attrito | Non legge lo stato interno |
| `tester-bilanciamento` | Haiku | Simulazioni, numeri | Non cambia i dati |
| `art-director`, `artista-pixel` | Opus, Sonnet | In pausa: grafica rimandata | — |

**Cancelli in cui decide Gianmarco:** approvazione dei mockup (B1) e del percorso del tutorial (B4); stile grafico; difficoltà; ogni regola di gioco ambigua o da cambiare (va in `team/DOMANDE.md`); azioni non annullabili (merge su `main`, pubblicazione).

## 5. Fine sessione: il report

Il regista scrive `team/reports/AAAA-MM-GG_HHMM.md` con:
1. **Perché si è fermato:** cancello, soglia (con la riga di `budget_guard`), fine batch, oppure tutto bloccato.
   **Prossima azione:** il passo esatto da cui riprendere (lo stesso scritto in cima a `team/STATO.md`).
2. **Fatto:** task, agente, commit, una riga di esito.
3. **Non fatto o da rifare:** con il motivo.
4. **Consumi:** 5 ore e settimana all'inizio e alla fine; generazioni PixelLab usate (da `team/art/pixellab_log.md`).
5. **Serve da te:** le domande aperte e le decisioni bloccanti, in ordine di importanza.

Poi commit e push su `prova-demo`.

## 6. Contesto di stile (dalla ricerca del 18/11)

- Blasphemous scartato come riferimento visivo: vista di lato, animazione a mano costosa, immaginario diverso. Teniamo il sacro corrotto e il peso dei colpi.
- In prova due direzioni, entrambe nel codice con il parametro `?style=`:
  - **B** (`?style=b`): sprite PixelLab su ambiente 3D (`assets/sprites/pixellab/`).
  - **C** (`?style=c`): figure low-poly e dithering a bassa risoluzione; più Luce = più toni, al Buio l'immagine si sgrana.
- Schermate di confronto: `docs/style_test/confronto_stili.png`. Codice: `src/rendering/style.js`.
- Regole di leggibilità valide per entrambe: silhouette distinte, stati e intenti come icone sopra l'arte, un solo accento caldo, azioni mostrate con un'animazione breve.
