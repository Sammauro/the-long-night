// ═══════════════════════════════════════════════════════════
//  COMMAND BUS — CONTRATTO COMANDI v0.0.4a
//  The Long Night · src/input/command_bus.js
// ═══════════════════════════════════════════════════════════
//
//  Questo file definisce TUTTI i comandi disponibili.
//  input_handler.js traduce click/touch in comandi.
//  sim_agent.js (AI bilanciamento) chiama gli stessi comandi.
//  Il giocatore e l'AI sono identici dal punto di vista del game engine.
//
//  Formato: commandBus.execute('NOME_COMANDO', { params })
//  Il command bus valida i parametri, chiama engine/, engine/ emette eventi.
//
//  Convenzione nomi: VERBO_OGGETTO (tutto maiuscolo, underscore)
//

class CommandBus {
  constructor() {
    this._handlers = {};
  }

  register(command, handler) {
    this._handlers[command] = handler;
  }

  execute(command, params) {
    const handler = this._handlers[command];
    if (!handler) {
      console.error(`[CommandBus] Comando sconosciuto: ${command}`);
      return { success: false, error: 'UNKNOWN_COMMAND' };
    }
    return handler(params);
  }

  // Lista comandi registrati (debug/test)
  listCommands() {
    return Object.keys(this._handlers);
  }
}

// Singleton
const commandBus = new CommandBus();
export default commandBus;


// ═══════════════════════════════════════════════════════════
//  CATALOGO COMANDI — CONTRATTO
// ═══════════════════════════════════════════════════════════
//
//  Ogni comando elenca: parametri, validazione, evento emesso.
//  I comandi restituiscono { success: Boolean, error?: String }.
//
//  ┌─────────────────────────────────────────────────────────┐
//  │  FLUSSO DI GIOCO                                       │
//  ├─────────────────────────────────────────────────────────┤
//  │                                                         │
//  │  START_GAME                                             │
//  │  { scenarioId: String }                                 │
//  │  Validazione: scenario esiste in gamedata               │
//  │  Effetto: inizializza stato, popola Bag, pesca mano     │
//  │  Emette: TURN_STARTED, PHASE_CHANGED, CARDS_DRAWN       │
//  │                                                         │
//  │  END_TURN                                               │
//  │  { }                                                    │
//  │  Validazione: fase corrente = 4 (Risoluzione)           │
//  │  Effetto: avvia Fase 1 del turno successivo             │
//  │  Emette: TURN_ENDED, poi ciclo Fase 1→2→3              │
//  │                                                         │
//  └─────────────────────────────────────────────────────────┘
//
//  ┌─────────────────────────────────────────────────────────┐
//  │  FASE 1 — FINE TURNO                                    │
//  ├─────────────────────────────────────────────────────────┤
//  │                                                         │
//  │  DISCARD_CARD_FOR_ECO                                   │
//  │  { cardId: String }                                     │
//  │  Validazione: carta in mano, fase = 1                   │
//  │  Effetto: rimuove carta dalla mano, applica Eco         │
//  │  Emette: CARD_DISCARDED, RESOURCE_CHANGED (per ogni     │
//  │          risorsa generata dall'Eco)                      │
//  │                                                         │
//  │  CONFIRM_END_PHASE                                      │
//  │  { }                                                    │
//  │  Validazione: fase = 1, step scarto completato          │
//  │  Effetto: esegue rotazione CD e rotazione stati         │
//  │  Emette: CARD_CD_ROTATED (×N), STATES_ROTATED (×N),     │
//  │          PHASE_CHANGED                                   │
//  │                                                         │
//  └─────────────────────────────────────────────────────────┘
//
//  ┌─────────────────────────────────────────────────────────┐
//  │  FASE 3 — LANCIO E SELEZIONE                            │
//  ├─────────────────────────────────────────────────────────┤
//  │                                                         │
//  │  ROLL_DICE                                              │
//  │  { }                                                    │
//  │  Validazione: fase = 3, dadi non ancora lanciati        │
//  │  Effetto: lancia intera Bag + dadi AI, genera Sequenza  │
//  │  Emette: DICE_ROLLED                                    │
//  │                                                         │
//  │  TOGGLE_DIE_SELECTION                                   │
//  │  { dieId: String }                                      │
//  │  Validazione: fase = 3, dado è del giocatore,           │
//  │    se seleziona: slot disponibile (scoperto o coperto   │
//  │    con Luce sufficiente)                                │
//  │  Effetto: alterna stato selezionato/scartato            │
//  │  Emette: DICE_SELECTED, RESOURCE_CHANGED                │
//  │                                                         │
//  │  RECOVER_SLOT                                           │
//  │  { slotIndex: Number }                                  │
//  │  Validazione: slot coperto da CD, Luce sufficiente      │
//  │  Effetto: paga Luce, rende slot accessibile             │
//  │  Emette: SLOT_RECOVERED, RESOURCE_CHANGED               │
//  │                                                         │
//  │  CONFIRM_SELECTION                                      │
//  │  { }                                                    │
//  │  Validazione: fase = 3, almeno 1 dado selezionato       │
//  │  Effetto: blocca selezione, rimuove scartati da Seq.    │
//  │  Emette: SELECTION_CONFIRMED, PHASE_CHANGED             │
//  │                                                         │
//  └─────────────────────────────────────────────────────────┘
//
//  ┌─────────────────────────────────────────────────────────┐
//  │  FASE 4 — RISOLUZIONE                                   │
//  ├─────────────────────────────────────────────────────────┤
//  │                                                         │
//  │  ADVANCE_SEQUENCE                                       │
//  │  { }                                                    │
//  │  Validazione: fase = 4, dado corrente risolto           │
//  │  Effetto: passa al dado successivo nella Sequenza       │
//  │  Emette: IMPULSES_LOST (se rimasti), SEQUENCE_ADVANCE   │
//  │                                                         │
//  │  PLAY_CARD                                              │
//  │  { cardId: String, dieId: String|null }                 │
//  │  Validazione: carta in mano, fase = 4, finestra azione  │
//  │    libera, slot CD disponibile (se CD ≥ 1),             │
//  │    dado compatibile se carta richiede impulsi           │
//  │  Effetto: attiva effetto carta                          │
//  │  Emette: CARD_PLAYED                                    │
//  │                                                         │
//  │  RESOLVE_CARD_ACTION                                    │
//  │  { cardId: String, actionIndex: Number,                 │
//  │    targetId: String|null, targetHex: {col,row}|null,    │
//  │    impulsesSpent: Number,                               │
//  │    choice: Object|null }                                │
//  │  Validazione: carta in gioco, azione disponibile        │
//  │    (sequenza irreversibile), impulsi sufficienti,       │
//  │    bersaglio valido (adiacenza, gittata, ecc.)          │
//  │  Effetto: risolve l'azione specifica                    │
//  │  Emette: CARD_ACTION_RESOLVED, IMPULSES_SPENT,          │
//  │          DAMAGE_DEALT / STATE_APPLIED / etc.             │
//  │                                                         │
//  │  CLOSE_CARD                                             │
//  │  { cardId: String }                                     │
//  │  Validazione: carta attualmente in risoluzione          │
//  │  Effetto: chiude carta, manda in CD se CD ≥ 1           │
//  │  Emette: CARD_CLOSED, CARD_TO_COOLDOWN                  │
//  │                                                         │
//  │  EXECUTE_MANEUVER                                       │
//  │  { maneuver: 'TACTICAL_MOVEMENT'|'RANGED_SHOT'|         │
//  │              'DARK_CONVERSION',                          │
//  │    dieId: String,                                       │
//  │    targetId: String|null,                               │
//  │    targetHex: {col,row}|null,                           │
//  │    conversionType: String|null,                          │
//  │    impulsesSpent: Number }                              │
//  │  Validazione: dado corrente del tipo giusto,            │
//  │    impulsi sufficienti, bersaglio valido,               │
//  │    PT sufficienti (per Conversione Oscura)              │
//  │  Effetto: esegue manovra base                          │
//  │  Emette: IMPULSES_SPENT + evento specifico              │
//  │                                                         │
//  └─────────────────────────────────────────────────────────┘
//
//  ┌─────────────────────────────────────────────────────────┐
//  │  MOVIMENTO                                              │
//  ├─────────────────────────────────────────────────────────┤
//  │                                                         │
//  │  MOVE_PLAYER                                            │
//  │  { targetHex: {col: Number, row: Number} }              │
//  │  Validazione: fase = 4, finestra azione libera,         │
//  │    casella adiacente, PM sufficienti (2 PM se           │
//  │    partenza adiacente a nemico per primo passo),        │
//  │    casella non occupata                                  │
//  │  Effetto: muove giocatore, scala PM                     │
//  │  Emette: UNIT_MOVED, RESOURCE_CHANGED                   │
//  │  Nota: chiude la carta in risoluzione se presente       │
//  │                                                         │
//  └─────────────────────────────────────────────────────────┘
//
//  ┌─────────────────────────────────────────────────────────┐
//  │  SELEZIONE BERSAGLIO (UI → engine)                      │
//  ├─────────────────────────────────────────────────────────┤
//  │                                                         │
//  │  SELECT_HEX                                             │
//  │  { col: Number, row: Number }                           │
//  │  Validazione: casella valida sulla griglia              │
//  │  Effetto: dipende dal contesto — può risolvere          │
//  │    un bersaglio per carta, movimento, spinta, ecc.      │
//  │  Nota: comando "generico" — il turn_manager interpreta  │
//  │    in base allo stato corrente (carta in attesa di      │
//  │    bersaglio, movimento, ecc.)                           │
//  │                                                         │
//  │  SELECT_UNIT                                            │
//  │  { unitId: String }                                     │
//  │  Validazione: unità esiste e viva                       │
//  │  Effetto: seleziona unità come bersaglio corrente       │
//  │                                                         │
//  │  SELECT_DIRECTION                                       │
//  │  { direction: 0|1|2|3|4|5 }                             │
//  │  Validazione: contesto richiede una direzione           │
//  │    (es. Cono di Fuoco, Carica Furiosa)                  │
//  │  Effetto: conferma direzione per carta in risoluzione   │
//  │                                                         │
//  └─────────────────────────────────────────────────────────┘
//
//  ┌─────────────────────────────────────────────────────────┐
//  │  CARTE SPECIALI (comandi dedicati)                       │
//  ├─────────────────────────────────────────────────────────┤
//  │                                                         │
//  │  CHARGE_SELECT_DICE                                     │
//  │  { die1Id: String, die2Id: String }                     │
//  │  Validazione: Carica Furiosa in gioco, i 2 dadi sono    │
//  │    adiacenti nella Sequenza, entrambi giocatore,        │
//  │    giocatore non adiacente a nemico                     │
//  │  Effetto: consuma 2 dadi, avvia movimento lineare       │
//  │  Emette: SEQUENCE_DIE_CONSUMED (×2)                     │
//  │                                                         │
//  │  MANIPULATE_DIE                                         │
//  │  { dieId: String, newFace: Number }                     │
//  │  Validazione: Manipolazione Destino in gioco,           │
//  │    dado non risolto, faccia valida, PT ≥ 1              │
//  │  Effetto: cambia faccia dado, paga 1 PT                 │
//  │  Emette: DIE_FACE_CHANGED, RESOURCE_CHANGED             │
//  │                                                         │
//  │  INFUSE_DIE                                             │
//  │  { dieId: String }                                      │
//  │  Validazione: Infusione Elementale in gioco,            │
//  │    dado non risolto, dado non Terrore                   │
//  │  Effetto: converte tipo in Fuoco + 1 impulso bonus      │
//  │  Emette: DIE_TYPE_CONVERTED                              │
//  │                                                         │
//  │  DISTORT_UNIT                                           │
//  │  { targetId: String, path: Array<{col,row}> }           │
//  │  Validazione: Distorsione in gioco, bersaglio non self, │
//  │    percorso valido (adiacente step by step), Presagi    │
//  │    e PT sufficienti                                      │
//  │  Effetto: sposta unità, attiva trappole                 │
//  │  Emette: UNIT_MOVED, TRAP_TRIGGERED (se applicabile)    │
//  │                                                         │
//  └─────────────────────────────────────────────────────────┘
