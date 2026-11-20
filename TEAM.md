# TLN — Team di agenti (branch `prova-demo`)

> Prova, non fonte di verità. Niente su `main`, CLAUDE.md, file di regole, Notion, GitHub Pages.

## 1. Avvio sul tuo PC (una volta)

1. **Codice:** nella cartella TLN `git pull` e `git checkout prova-demo`.
2. **Token PixelLab** (rigeneralo prima su pixellab.ai/account, quello incollato in chat va considerato esposto). In PowerShell:
   `setx PIXELLAB_TOKEN "il-nuovo-token"`, poi chiudi e riapri il terminale. Il token non va mai nel repo: `.mcp.json` lo legge dalla variabile.
3. **Strumenti per i tester:** `npm i -D playwright` e `npx playwright install chromium`. Per il server locale serve Python (`python -m http.server 8765`) oppure `npx http-server -p 8765`.
4. **Avvio:** dalla cartella TLN `claude --model fable`. Alla prima apertura approva il server MCP `pixellab` del progetto.
5. **Verifica:** in basso deve comparire `[Fable] 5h …% · settimana …%`. È la statusline che salva i consumi in `.claude/usage.json`: senza, le soglie non funzionano.
6. **Parti:** scrivi `/avvia-team`. Per farlo andare senza chiederti conferme a ogni comando, avvia con `claude --model fable --permission-mode acceptEdits` e approva i comandi ricorrenti la prima volta ("non chiedere più"); la modalità automatica completa (`auto`) usala solo se la tua versione la offre e ti fidi del perimetro qui sotto.

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

## 3. Ruoli

| Agente | Modello | Fa | Non fa |
|---|---|---|---|
| Regista (sessione principale, `/avvia-team`) | Fable | Sceglie il task, scrive il prompt, verifica, fa commit, scrive il report | Non scrive codice né arte da sé |
| `art-director` | Opus | Regole visive, brief, revisioni con schermate | Non sceglie lo stile definitivo |
| `artista-pixel` | Sonnet | Sprite e animazioni con PixelLab, pulizia, integrazione in `assets/` | Non tocca la logica |
| `ux-ui` | Opus | HUD, carte, sequenza, mobile; CSS e `src/ui/` | Mai `src/engine/` |
| `sviluppatore` | Sonnet | Bug, integrazioni, feature decise | Non interpreta regole ambigue |
| `tester-giocatore` | Sonnet | Gioca via Playwright, report da giocatore | Non modifica codice |
| `tester-bilanciamento` | Haiku | Simulazioni, tabelle di numeri | Non cambia i dati |

## 4. Cancelli: cosa decide solo Gianmarco

Il team si ferma e scrive in `team/DOMANDE.md` invece di procedere quando:
- serve scegliere lo stile (B o C) o la difficoltà;
- una regola di gioco è ambigua o andrebbe cambiata (anche un numero su una carta);
- un'azione non si può annullare: merge, cancellazioni, pubblicazione.

Le decisioni prese stanno in `team/DECISIONI.md`.

## 5. Fine lavoro: il report

Il regista scrive `team/reports/AAAA-MM-GG_HHMM.md` con:
1. **Perché si è fermato:** soglia (con la riga di `budget_guard`), backlog finito, oppure tutto bloccato.
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
