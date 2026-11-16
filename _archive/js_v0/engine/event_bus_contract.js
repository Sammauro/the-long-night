// ═══════════════════════════════════════════════════════════
//  EVENT BUS — CONTRATTO EVENTI v0.0.4a
//  The Long Night · src/engine/event_bus.js
// ═══════════════════════════════════════════════════════════
//
//  Questo file definisce TUTTI gli eventi che il sistema può emettere.
//  Ogni modulo in engine/ emette eventi qui elencati.
//  Ogni modulo in rendering/ e ui/ ascolta solo questi eventi.
//  engine/ non ascolta MAI eventi da rendering/ o ui/.
//
//  Formato: eventBus.emit('NOME_EVENTO', { payload })
//  Ascolto: eventBus.on('NOME_EVENTO', callback)
//
//  Convenzione nomi: CATEGORIA_AZIONE (tutto maiuscolo, underscore)
//

class EventBus {
  constructor() {
    this._listeners = {};
  }

  on(event, callback) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(callback);
  }

  off(event, callback) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
  }

  emit(event, data) {
    if (!this._listeners[event]) return;
    for (const cb of this._listeners[event]) cb(data);
  }
}

// Singleton
const eventBus = new EventBus();
export default eventBus;


// ═══════════════════════════════════════════════════════════
//  CATALOGO EVENTI — CONTRATTO
// ═══════════════════════════════════════════════════════════
//
//  ┌─────────────────────────────────────────────────────────┐
//  │  TURNO E FASI                                          │
//  ├─────────────────────────────────────────────────────────┤
//  │                                                         │
//  │  TURN_STARTED                                           │
//  │  { turnNumber: Number }                                 │
//  │  Emesso: inizio di ogni turno, dopo la Fase 1           │
//  │  (al turno 1 emesso direttamente, Fase 1 saltata)      │
//  │                                                         │
//  │  PHASE_CHANGED                                          │
//  │  { phase: 1|2|3|4, phaseName: String }                  │
//  │  Emesso: ogni cambio fase                               │
//  │  phaseNames: 'FINE_TURNO'|'UPKEEP'|'LANCIO'|'RISOLUZ'  │
//  │                                                         │
//  │  TURN_ENDED                                             │
//  │  { turnNumber: Number }                                 │
//  │  Emesso: fine della Fase 4, prima di Fase 1 successiva  │
//  │                                                         │
//  │  GAME_OVER                                              │
//  │  { result: 'VICTORY'|'DEATH'|'INSANITY',               │
//  │    reason: String }                                     │
//  │  Emesso: quando HP=0, PT=0, o tutti i nemici eliminati  │
//  │                                                         │
//  └─────────────────────────────────────────────────────────┘
//
//  ┌─────────────────────────────────────────────────────────┐
//  │  RISORSE GIOCATORE                                     │
//  ├─────────────────────────────────────────────────────────┤
//  │                                                         │
//  │  RESOURCE_CHANGED                                       │
//  │  { resource: 'HP'|'PT'|'PM'|'LIGHT',                   │
//  │    oldValue: Number, newValue: Number,                   │
//  │    max: Number|null }                                    │
//  │  Emesso: ogni variazione di risorsa giocatore            │
//  │                                                         │
//  └─────────────────────────────────────────────────────────┘
//
//  ┌─────────────────────────────────────────────────────────┐
//  │  DADI                                                   │
//  ├─────────────────────────────────────────────────────────┤
//  │                                                         │
//  │  DICE_ROLLED                                            │
//  │  { dice: Array<{                                        │
//  │      id: String,                                        │
//  │      type: 'VIGOR'|'FIRE'|'TERROR'|'AI',               │
//  │      size: 'd4'|'d6'|'d8',                              │
//  │      result: Number,                                    │
//  │      owner: 'player'|enemyId                            │
//  │    }>,                                                   │
//  │    sequence: Array<String> }  // id in ordine Sequenza   │
//  │  Emesso: Fase 3 Step A, dopo lancio intera Bag + AI     │
//  │                                                         │
//  │  DICE_SELECTED                                          │
//  │  { dieId: String, action: 'SELECT'|'DISCARD',           │
//  │    resourceGained: {type: String, amount: Number}|null } │
//  │  Emesso: giocatore seleziona/scarta un dado nella Sel.  │
//  │                                                         │
//  │  SELECTION_CONFIRMED                                    │
//  │  { selected: Array<String>,                              │
//  │    discarded: Array<String>,                             │
//  │    finalSequence: Array<String> }                        │
//  │  Emesso: giocatore conferma la Selezione                │
//  │                                                         │
//  │  SEQUENCE_ADVANCE                                       │
//  │  { dieId: String, index: Number,                        │
//  │    type: 'VIGOR'|'FIRE'|'TERROR'|'AI',                  │
//  │    result: Number,                                      │
//  │    isPlayerDie: Boolean }                               │
//  │  Emesso: si passa al dado successivo nella Sequenza     │
//  │                                                         │
//  │  SEQUENCE_DIE_CONSUMED                                  │
//  │  { dieId: String, reason: String }                      │
//  │  Emesso: un dado viene rimosso dalla Sequenza           │
//  │  (es. Carica Furiosa consuma 2 dadi)                    │
//  │                                                         │
//  │  IMPULSES_SPENT                                         │
//  │  { dieId: String, spent: Number, remaining: Number }    │
//  │  Emesso: impulsi spesi su carta o manovra               │
//  │                                                         │
//  │  IMPULSES_LOST                                          │
//  │  { dieId: String, lost: Number }                        │
//  │  Emesso: impulsi non spesi persi a fine risoluz. dado   │
//  │                                                         │
//  │  DIE_FACE_CHANGED                                       │
//  │  { dieId: String, oldResult: Number,                    │
//  │    newResult: Number, reason: String }                   │
//  │  Emesso: Manipolazione Destino cambia faccia dado       │
//  │                                                         │
//  │  DIE_TYPE_CONVERTED                                     │
//  │  { dieId: String, oldType: String, newType: String,     │
//  │    bonusImpulse: Boolean, reason: String }               │
//  │  Emesso: Infusione Elementale converte tipo dado         │
//  │                                                         │
//  └─────────────────────────────────────────────────────────┘
//
//  ┌─────────────────────────────────────────────────────────┐
//  │  CARTE                                                  │
//  ├─────────────────────────────────────────────────────────┤
//  │                                                         │
//  │  CARDS_DRAWN                                            │
//  │  { cards: Array<String>, handSize: Number }              │
//  │  Emesso: Fase 2 Step A, pesca carte                     │
//  │                                                         │
//  │  CARD_PLAYED                                            │
//  │  { cardId: String, cardName: String,                    │
//  │    dieId: String|null }                                  │
//  │  Emesso: giocatore attiva effetto attivo di una carta   │
//  │                                                         │
//  │  CARD_ACTION_RESOLVED                                   │
//  │  { cardId: String, actionIndex: Number,                 │
//  │    effects: Array<Object> }                              │
//  │  Emesso: un'Azione della carta è stata risolta          │
//  │                                                         │
//  │  CARD_CLOSED                                            │
//  │  { cardId: String, reason: 'COMPLETED'|'INTERRUPTED' }  │
//  │  Emesso: carta chiusa (azioni finite o interruzione)    │
//  │                                                         │
//  │  CARD_TO_COOLDOWN                                       │
//  │  { cardId: String, cdValue: Number,                     │
//  │    slotIndex: Number }                                   │
//  │  Emesso: carta piazzata in Plancia Cooldown              │
//  │                                                         │
//  │  CARD_CD_ROTATED                                        │
//  │  { cardId: String, oldRotation: Number,                 │
//  │    newRotation: Number }                                 │
//  │  Emesso: Fase 1 Step C, rotazione CD                    │
//  │                                                         │
//  │  CARD_CD_COMPLETED                                      │
//  │  { cardId: String }                                     │
//  │  Emesso: carta raggiunge 0° e va nella Pila Scarti     │
//  │                                                         │
//  │  CARD_DISCARDED                                         │
//  │  { cardId: String, eco: Object }                        │
//  │  Emesso: Fase 1 Step A-B, carta scartata per Eco        │
//  │                                                         │
//  │  DECK_RESHUFFLED                                        │
//  │  { cardsShuffled: Number }                               │
//  │  Emesso: Fase 2 Step B, scarti rimescolati nel mazzo    │
//  │                                                         │
//  └─────────────────────────────────────────────────────────┘
//
//  ┌─────────────────────────────────────────────────────────┐
//  │  GRIGLIA E MOVIMENTO                                    │
//  ├─────────────────────────────────────────────────────────┤
//  │                                                         │
//  │  UNIT_MOVED                                             │
//  │  { unitId: String, from: {col,row}, to: {col,row},     │
//  │    pmSpent: Number|null }                                │
//  │  Emesso: qualsiasi unità si muove sulla griglia         │
//  │                                                         │
//  │  UNIT_PUSHED                                            │
//  │  { unitId: String, from: {col,row}, to: {col,row},     │
//  │    pushForce: Number, stepsCompleted: Number,           │
//  │    source: String }                                     │
//  │  Emesso: Spinta applicata a un'unità                    │
//  │                                                         │
//  │  COLLISION                                              │
//  │  { unitId: String, collidedWith: String|'OBSTACLE',     │
//  │    damage: Number, at: {col,row} }                      │
//  │  Emesso: Collisione Tattica durante una Spinta          │
//  │                                                         │
//  │  TRAP_TRIGGERED                                         │
//  │  { unitId: String, at: {col,row},                       │
//  │    damage: Number, trapRemoved: Boolean }                │
//  │  Emesso: unità entra in casella trappola                │
//  │                                                         │
//  └─────────────────────────────────────────────────────────┘
//
//  ┌─────────────────────────────────────────────────────────┐
//  │  COMBATTIMENTO                                          │
//  ├─────────────────────────────────────────────────────────┤
//  │                                                         │
//  │  DAMAGE_DEALT                                           │
//  │  { sourceId: String, targetId: String,                  │
//  │    rawDamage: Number, finalDamage: Number,               │
//  │    damageType: 'PHYSICAL'|'FIRE'|'DIRECT',              │
//  │    shieldsAbsorbed: Number,                              │
//  │    vulnerabilityApplied: Boolean }                       │
//  │  Emesso: danno inflitto (dopo scudi e vulnerabilità)    │
//  │                                                         │
//  │  UNIT_DIED                                              │
//  │  { unitId: String, killedBy: String }                   │
//  │  Emesso: unità raggiunge 0 HP                           │
//  │                                                         │
//  │  HEALING_APPLIED                                        │
//  │  { unitId: String, amount: Number,                      │
//  │    newHp: Number }                                       │
//  │  Emesso: cura applicata (es. Morso Rigenerante zombie)  │
//  │                                                         │
//  └─────────────────────────────────────────────────────────┘
//
//  ┌─────────────────────────────────────────────────────────┐
//  │  STATI (Scudi, Vulnerabilità, Stordito)                 │
//  ├─────────────────────────────────────────────────────────┤
//  │                                                         │
//  │  STATE_APPLIED                                          │
//  │  { unitId: String,                                      │
//  │    state: 'SHIELD'|'VULNERABLE'|'STUNNED',              │
//  │    subtype: String|null,                                 │
//  │    stacks: Number,                                       │
//  │    area: 'CURRENT_TURN'|'NEXT_TURN' }                   │
//  │  Emesso: stato aggiunto a un'unità                      │
//  │                                                         │
//  │  STATE_CONSUMED                                         │
//  │  { unitId: String,                                      │
//  │    state: 'SHIELD'|'VULNERABLE'|'STUNNED',              │
//  │    subtype: String|null,                                 │
//  │    stacksConsumed: Number,                               │
//  │    fromArea: 'NEXT_TURN'|'CURRENT_TURN' }               │
//  │  Emesso: stato consumato (scudo assorbe, stun usato)    │
//  │                                                         │
//  │  STATES_ROTATED                                         │
//  │  { unitId: String,                                      │
//  │    expired: Array<Object>,                               │
//  │    movedToNextTurn: Array<Object> }                      │
//  │  Emesso: Fase 1 Step D, rotazione stati                 │
//  │                                                         │
//  └─────────────────────────────────────────────────────────┘
//
//  ┌─────────────────────────────────────────────────────────┐
//  │  AI NEMICI                                              │
//  ├─────────────────────────────────────────────────────────┤
//  │                                                         │
//  │  ENEMY_ACTIVATED                                        │
//  │  { enemyId: String, dieResult: Number,                  │
//  │    actionName: String }                                  │
//  │  Emesso: nemico inizia la sua azione                    │
//  │                                                         │
//  │  ENEMY_ACTION_RESOLVED                                  │
//  │  { enemyId: String, actionName: String,                 │
//  │    effects: Array<Object> }                              │
//  │  Emesso: azione nemica completata                       │
//  │                                                         │
//  │  ENEMY_SKIPPED                                          │
//  │  { enemyId: String, reason: 'STUNNED'|'DEAD' }         │
//  │  Emesso: nemico salta la sua attivazione                │
//  │                                                         │
//  └─────────────────────────────────────────────────────────┘
//
//  ┌─────────────────────────────────────────────────────────┐
//  │  EQUIPAGGIAMENTO                                        │
//  ├─────────────────────────────────────────────────────────┤
//  │                                                         │
//  │  SLOT_COVERED                                           │
//  │  { slotIndex: Number, cardId: String }                  │
//  │  Emesso: carta in CD copre uno slot equipaggiamento     │
//  │                                                         │
//  │  SLOT_UNCOVERED                                         │
//  │  { slotIndex: Number }                                  │
//  │  Emesso: slot equipaggiamento torna scoperto            │
//  │                                                         │
//  │  SLOT_RECOVERED                                         │
//  │  { slotIndex: Number, lightSpent: Number }              │
//  │  Emesso: giocatore paga Luce per sbloccare slot coperto │
//  │                                                         │
//  └─────────────────────────────────────────────────────────┘
//
//  ┌─────────────────────────────────────────────────────────┐
//  │  CONVERSIONE OSCURA                                     │
//  ├─────────────────────────────────────────────────────────┤
//  │                                                         │
//  │  DARK_CONVERSION                                        │
//  │  { presagiSpent: Number, ptSpent: Number,               │
//  │    outputType: String, outputCount: Number,             │
//  │    isElemental: Boolean }                                │
//  │  Emesso: manovra Conversione Oscura eseguita            │
//  │                                                         │
//  └─────────────────────────────────────────────────────────┘
