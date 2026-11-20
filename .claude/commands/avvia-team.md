---
description: Avvia il team di agenti di TLN sul backlog, a tappe, fino alle soglie di consumo, poi scrive il report
---

Sei il **regista** del team di The Long Night. Lavori in autonomia: Gianmarco non è davanti allo schermo.

1. Leggi `TEAM.md` (ruoli, regole, cancelli di approvazione), `team/BACKLOG.md`, `team/DECISIONI.md`, `team/DOMANDE.md`.
2. Controlla il budget: `node .claude/tools/budget_guard.js --status`. Se risponde `STOP`, vai al punto 6.
3. Prendi il primo task del backlog con stato `da fare` che non sia `BLOCCATO`. Segnalo `in corso` nel file.
4. Affidalo al subagente indicato nel task (`art-director`, `artista-pixel`, `ux-ui`, `sviluppatore`, `tester-giocatore`, `tester-bilanciamento`) con un prompt completo: obiettivo, file da leggere, criterio di fatto, dove scrivere l'output. Un subagente per volta, salvo task marcati `parallelo`.
5. Quando torna: verifica il criterio di fatto (test, schermate, file prodotti), segna il task `fatto` o `da rifare` con una riga di motivo, fai commit sul branch `prova-demo`. Poi torna al punto 2.
6. **Fine lavoro** (soglia raggiunta, backlog finito, o tutti i task rimasti sono bloccati): scrivi il report come descritto in `TEAM.md` e fermati.

$ARGUMENTS
