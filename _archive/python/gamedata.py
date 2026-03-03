# GAMEDATA.PY - Converted from gamedata.js
# Defines Constants, Dice, Cards, Zombie AI, and Scenario

CONSTANTS = {
    'MAP': {'ROWS': 8, 'COLS': 6},
    'RESOURCES': {'HP_MAX': 10, 'PT_MAX': 6, 'PM_BASE': 2},
    'COST_TYPES': {'FORCE': 'FORZA', 'FIRE': 'FUOCO', 'JOLLY': 'JOLLY', 'ANY': 'QUALSIASI'},
    'ZOMBIE_HP_STANDARD': 5
}

# ============================================================================
# UI TEXT TRANSLATIONS - Human-readable descriptions for new players (v0.0.4)
# ============================================================================

# Cost type icons (using symbols that work on Windows)
COST_ICONS = {
    'FORZA': '[F]',     # Forza fisica - text fallback
    'FUOCO': '🔥',      # Fuoco - emoji works
    'JOLLY': '🎲',      # Wild/any - emoji works
    'QUALSIASI': '🎲',  # Any type
}

# Full readable cost names
COST_NAMES = {
    'FORZA': 'Forza',
    'FUOCO': 'Fuoco',
    'JOLLY': 'Jolly',
    'QUALSIASI': 'Qualsiasi',
}

# Action translations (effect 'action' field -> readable Italian text)
ACTION_TRANSLATIONS = {
    'DAMAGE': 'Infliggi {value} Danno',
    'DAMAGE_FIRE': 'Infliggi {value} Danno Fuoco',
    'DAMAGE_DIRECT': 'Infliggi {value} Danno Diretto',
    'DRAW': 'Pesca {value} Carta',
    'MOVE': 'Muovi di {value} Caselle',
    'SHIELD': 'Ottieni {value} Scudo',
    'SHIELD_SELF': 'Ottieni {value} Scudo',
    'VULNERABILITY': 'Applica Vulnerabilita',
    'VULNERABILITY_FIRE': 'Applica Vuln. Fuoco',
    'VULNERABILITY_SELF': 'Subisci Vulnerabilita',
    'STUN_PUSH': 'Stordisci e Spingi {value}',
    'RESTORE_PT': 'Ripristina {value} PT',
    'CONVERT_DICE_FIRE': 'Converti dado in Fuoco (+1)',
    'CONVERT_ALL_JOLLY_TO_FORCE': 'Converti Jolly in Forza',
    'REROLL_SET_FACE': 'Scegli faccia dado',
    'CHARGE_MOVE_DAMAGE': 'Carica: Danno = Caselle',
    'INCREASE_RANGE': 'Gittata +{value}',
    'DAMAGE_FIRE_AOE': 'Danno Fuoco Area ({value})',
    'VULNERABILITY_FIRE_AOE': 'Vuln. Fuoco in Area',
}

# Per-impulse suffix
PER_IMPULSE_SUFFIX = ' (x impulso)'

# Discard payload translations
PAYLOAD_TRANSLATIONS = {
    'GAIN_SHIELD_TOKEN': 'Ottieni 1 Segnalino Scudo',
    'HAND_LIMIT_+1': 'Pesca 1 Carta extra',
    'GEN_D4_FIRE': 'Genera 1x d4 Fuoco',
    'GEN_D6_EARTH': 'Genera 1x d6 Terra',
    'GEN_JOLLY': 'Genera 1x Dado a Scelta',
    'ROTATE_TARGET_CD': 'Ricarica Parziale (1 carta)',
    'ROTATE_ALL_CD': 'Ricarica Totale (tutte)',
    'NONE': None,
}

# Supply contribution translations
SUPPLY_TRANSLATIONS = {
    'D4_FIRE': '1x d4 Fuoco',
    'D6_EARTH': '1x d6 Terra',
    'D8_EARTH': '1x d8 Colosso',
    'D8_TERROR': '1x d8 Terrore',
    'NONE': None,
}

# Cooldown text
COOLDOWN_TEXT = {
    0: 'Nessuno',
    1: '1 Turno (ruota 90°)',
    2: '2 Turni (ruota 180°)',
}

# =============================================================================
# CARD DESCRIPTIONS - Descrizioni narrative complete per ogni carta
# =============================================================================
# Queste descrizioni spiegano in linguaggio naturale cosa fa la carta

CARD_DESCRIPTIONS = {
    'attacco_base': {
        'flavor': '',
        'how_to_use': '''Richiede dadi TERRA (Forza):
  1 Forza = 1 Danno (ripetibile)
  2 Forza = Pesca 1 carta''',
        'discard_tip': 'Ottieni 1 Scudo.',
    },
    'scatto': {
        'flavor': '',
        'how_to_use': '''Richiede dadi TERRA (Forza):
  1 Forza = Muovi di 2 caselle (ripetibile)''',
        'discard_tip': 'Pesca 1 carta extra nel prossimo turno.',
    },
    'attacco_poderoso': {
        'flavor': '',
        'how_to_use': '''Richiede dadi TERRA (Forza):
  1 Forza = 2 Danni (ma prendi Vulnerabilita)
  1 Forza = Stordisci + Spingi 1 (Vulnerabilita)
ATTENZIONE: Ogni uso ti rende Vulnerabile!''',
        'discard_tip': 'Genera 1x d4 Fuoco (se in bag).',
    },
    'diniego_sismico': {
        'flavor': '',
        'how_to_use': '''Richiede dadi TERRA (Forza):
  1 Forza = 2 Danni (ripetibile)
Bonus: Danni extra se spingi vs ostacoli!''',
        'discard_tip': 'Genera 1x d4 Fuoco (se in bag).',
    },
    'attacco_strategico': {
        'flavor': '',
        'how_to_use': '''Richiede dadi TERRA (Forza). Gittata 2:
  1 Forza = Vulnerabilita + 1 Scudo
  1 Forza = Pesca 1 carta''',
        'discard_tip': 'Scegli un dado da generare (d4/d6/d8).',
    },
    'attacco_fuoco': {
        'flavor': '',
        'how_to_use': '''Richiede dadi FUOCO 🔥. Gittata 3:
  1 🔥 = 2 Danni Fuoco (ripetibile)
  1 🔥 = Vulnerabilita Fuoco (ripetibile)''',
        'discard_tip': 'Genera 1x d6 Terra (se in bag).',
    },
    'cono_fuoco': {
        'flavor': '',
        'how_to_use': '''Richiede dadi FUOCO 🔥. Attacco ad AREA (cono):
  1 🔥 = Aumenta gittata cono +1
  1 🔥 = Danno Fuoco a tutti nel cono
  1 🔥 = Vulnerabilita Fuoco a tutti''',
        'discard_tip': 'Genera 1x d6 Terra (se in bag).',
    },
    'infusione_elementale': {
        'flavor': '',
        'how_to_use': '''GRATUITO - Nessun costo:
  Trasforma 1 dado qualsiasi in Fuoco
  Il dado guadagna +1 impulso bonus!
Usa per alimentare carte Fuoco.''',
        'discard_tip': 'Ricarica 1 carta in cooldown (90 gradi).',
    },
    'carica_furiosa': {
        'flavor': '',
        'how_to_use': '''SPECIALE - Richiede 2 DADI ADIACENTI:
  Consuma entrambi i dadi
  Muoviti = somma impulsi
  Danno = caselle percorse
Se usi dado Terrore: +1 PT costo.''',
        'discard_tip': 'Scegli un dado da generare.',
    },
    'profondita_mente_oscura': {
        'flavor': '',
        'how_to_use': '''Richiede dado TERRORE 🎲 + 1 PT:
  Converti TUTTI i Jolly in Forza
Trasforma Terrore in potenza fisica!''',
        'discard_tip': 'Scegli un dado da generare.',
    },
    'manipolazione_destino': {
        'flavor': '',
        'how_to_use': '''Costa 1 PT. Nessun dado richiesto:
  Scegli un dado qualsiasi
  Ruotalo sulla faccia che preferisci!
Garantisci la combo perfetta.''',
        'discard_tip': 'TUTTE le carte in cooldown tornano pronte!',
    },
}

# Descrizioni manovre base dei dadi
MANEUVER_DESCRIPTIONS = {
    'movimento_tattico': {
        'name': 'Movimento Tattico',
        'dice': 'Terra (d6/d4/d8)',
        'cost': '1 Forza',
        'effect': 'Muovi di 1 casella',
        'tip': 'Riposizionamento tattico base.',
    },
    'colpo_a_distanza': {
        'name': 'Colpo a Distanza',
        'dice': 'Fuoco (d4)',
        'cost': '1 🔥 Fuoco',
        'effect': '1 Danno Fuoco (Gittata 3)',
        'tip': 'Attacco base a distanza.',
    },
    'scarica_mentale': {
        'name': 'Scarica Mentale',
        'dice': 'Terrore (d8/d6/d4)',
        'cost': '1 🎲 Qualsiasi + 1 PT',
        'effect': 'Infliggi 1 Danno Diretto (ignora scudi)',
        'tip': 'Costoso ma ignora le difese nemiche.',
    },
    'affrontare_paure': {
        'name': 'Affrontare le Paure',
        'dice': 'Terrore (d8/d6/d4)',
        'cost': 'Scarta dado non usato',
        'effect': 'Ripristina 1 PT',
        'tip': 'Recupera Punti Terrore scartando un dado Terrore inutilizzato.',
    },
}

# Card type full names
CARD_TYPE_NAMES = {
    'TERRA': 'Terra',
    'FUOCO': 'Fuoco',
    'TERRORE': 'Terrore',
    'HYBRID': 'Ibrida',
    'UTIL': 'Utilita',
}


def format_effect_text(effect, verbose=False):
    """Generate human-readable text for a card effect.

    Args:
        effect: Effect dict from CARDS[].effects[]
        verbose: If True, use full text instead of icons

    Returns:
        String like "Spendi 1 ✊ Forza: Infliggi 2 Danni"
    """
    cost = effect.get('cost', {})
    cost_type = cost.get('type', 'QUALSIASI')
    cost_amount = cost.get('amount', 0)

    action = effect.get('action', '?')
    value = effect.get('value', 1)
    per_impulse = effect.get('per_impulse', False)

    # Build cost part with both icon and name for clarity
    icon = COST_ICONS.get(cost_type, '🎲')
    cost_name = COST_NAMES.get(cost_type, cost_type)

    if cost_amount > 0:
        cost_text = f"Spendi {cost_amount} {icon} {cost_name}"
    else:
        cost_text = "Gratuito"

    # Add PT cost if present (Terror Point cost)
    extra_pt = cost.get('extra_pt_flat') or effect.get('cost_extra_terror')
    if extra_pt:
        cost_text += f" + {extra_pt} PT"

    # Build action part
    action_template = ACTION_TRANSLATIONS.get(action, action)
    try:
        action_text = action_template.format(value=value)
    except (KeyError, ValueError):
        action_text = action_template

    # Per impulse explanation
    if per_impulse:
        action_text += " (ripetibile)"

    # Handle secondary action
    secondary = effect.get('secondary_action')
    if secondary:
        sec_template = ACTION_TRANSLATIONS.get(secondary, secondary)
        sec_value = effect.get('secondary_value', 1)
        try:
            sec_text = sec_template.format(value=sec_value)
        except (KeyError, ValueError):
            sec_text = sec_template
        action_text += f" + {sec_text}"

    # Handle malus (self-inflicted debuffs)
    malus = effect.get('malus')
    if malus:
        malus_text = ACTION_TRANSLATIONS.get(malus, malus)
        action_text += f" (Malus: {malus_text})"

    return f"{cost_text}: {action_text}"


def get_card_description(card):
    """Generate full human-readable description for a card.

    Args:
        card: Card dict from CARDS

    Returns:
        Dict with all formatted strings for tooltip display
    """
    card_id = card.get('id', '')
    narrative = CARD_DESCRIPTIONS.get(card_id, {})

    result = {
        # Basic info
        'type': CARD_TYPE_NAMES.get(card.get('type', '?'), card.get('type', '?')),
        'cooldown': COOLDOWN_TEXT.get(card.get('cooldown', 0), f"{card.get('cooldown')} turni"),
        'range': card.get('range', 1),
        'target_type': card.get('target_type', 'SELF'),

        # Technical effects (old format, kept for compatibility)
        'effects': [format_effect_text(e) for e in card.get('effects', [])],

        # Discard/Supply
        'discard': PAYLOAD_TRANSLATIONS.get(card.get('discard_payload', 'NONE')),
        'supply': SUPPLY_TRANSLATIONS.get(card.get('supply_contribution', 'NONE')),

        # Narrative descriptions (new)
        'flavor': narrative.get('flavor', ''),
        'how_to_use': narrative.get('how_to_use', ''),
        'discard_tip': narrative.get('discard_tip', ''),
    }
    return result


def get_maneuver_description(maneuver_id):
    """Get human-readable description for a dice maneuver.

    Args:
        maneuver_id: ID of the maneuver (e.g., 'movimento_tattico')

    Returns:
        Dict with maneuver description or None
    """
    return MANEUVER_DESCRIPTIONS.get(maneuver_id)


DICE = {
    #'TERRA' is the d6 Earth die (default)
    'TERRA': {
        'id': 'd6_terra',
        'name': 'Dado Terra d6',
        'faces': [
            {'type': 'FORZA', 'quantity': 1},
            {'type': 'FORZA', 'quantity': 1},
            {'type': 'FORZA', 'quantity': 2},
            {'type': 'FORZA', 'quantity': 2},
            {'type': 'FORZA', 'quantity': 2},
            {'type': 'FORZA', 'quantity': 3}
        ],
        'maneuvers': [
            {
                'id': 'movimento_tattico',
                'name': 'Movimento Tattico',
                'cost': {'type': 'FORZA', 'amount': 1},
                'cost_impulses': 1,
                'effect': {'type': 'MOVE', 'value': 1}
            }
        ]
    },
    # v0.0.3: d4 Earth variant
    'TERRA_D4': {
        'id': 'd4_terra',
        'name': 'Dado Terra d4',
        'faces': [
            {'type': 'FORZA', 'quantity': 1},
            {'type': 'FORZA', 'quantity': 1},
            {'type': 'FORZA', 'quantity': 2},
            {'type': 'FORZA', 'quantity': 2}
        ],
        'maneuvers': [
            {
                'id': 'movimento_tattico',
                'name': 'Movimento Tattico',
                'cost': {'type': 'FORZA', 'amount': 1},
                'cost_impulses': 1,
                'effect': {'type': 'MOVE', 'value': 1}
            }
        ]
    },
    # v0.0.3: d8 Earth variant - for Carica Furiosa
    'TERRA_D8': {
        'id': 'd8_terra',
        'name': 'Dado Terra d8',
        'faces': [
            {'type': 'FORZA', 'quantity': 1},
            {'type': 'FORZA', 'quantity': 1},
            {'type': 'FORZA', 'quantity': 2},
            {'type': 'FORZA', 'quantity': 2},
            {'type': 'FORZA', 'quantity': 2},
            {'type': 'FORZA', 'quantity': 3},
            {'type': 'FORZA', 'quantity': 3},
            {'type': 'FORZA', 'quantity': 4}
        ],
        'maneuvers': [
            {
                'id': 'movimento_tattico',
                'name': 'Movimento Tattico',
                'cost': {'type': 'FORZA', 'amount': 1},
                'cost_impulses': 1,
                'effect': {'type': 'MOVE', 'value': 1}
            }
        ]
    },
    'FUOCO': {
        'id': 'd4_fuoco',
        'name': 'Dado Fuoco',
        'faces': [
            {'type': 'FUOCO', 'quantity': 1},
            {'type': 'FUOCO', 'quantity': 1},
            {'type': 'FUOCO', 'quantity': 2},
            {'type': 'FUOCO', 'quantity': 2}
        ],
        'maneuvers': [
            {
                'id': 'colpo_a_distanza',
                'name': 'Colpo a Distanza',
                'cost': {'type': 'FUOCO', 'amount': 1},
                'cost_impulses': 1,
                'effect': {'type': 'DAMAGE', 'value': 1, 'range': 3, 'element': 'FUOCO'}
            }
        ]
    },
    # TERRORE is the d8 Terror die (default)
    'TERRORE': {
        'id': 'd8_terrore',
        'name': 'Dado Terrore d8',
        'faces': [
            {'type': 'JOLLY', 'quantity': 1},
            {'type': 'JOLLY', 'quantity': 1},
            {'type': 'JOLLY', 'quantity': 2},
            {'type': 'JOLLY', 'quantity': 2},
            {'type': 'JOLLY', 'quantity': 2},
            {'type': 'JOLLY', 'quantity': 3},
            {'type': 'JOLLY', 'quantity': 3},
            {'type': 'JOLLY', 'quantity': 4}
        ],
        'maneuvers': [
            {
                'id': 'scarica_mentale',
                'name': 'Scarica Mentale',
                'cost': {'type': 'QUALSIASI', 'amount': 1, 'extra_pt_flat': 1},
                'cost_impulses': 1,
                'effect': {'type': 'DAMAGE_DIRECT', 'value': 1}
            },
            {
                'id': 'affrontare_paure',
                'name': 'Affrontare le Paure',
                'special': 'DISCARD_UNUSED',
                'effect': {'type': 'RESTORE_PT', 'value': 1}
            }
        ]
    },
    # v0.0.3: d4 Terror variant - for swap mechanic
    'TERRORE_D4': {
        'id': 'd4_terrore',
        'name': 'Dado Terrore d4',
        'faces': [
            {'type': 'JOLLY', 'quantity': 1},
            {'type': 'JOLLY', 'quantity': 1},
            {'type': 'JOLLY', 'quantity': 2},
            {'type': 'JOLLY', 'quantity': 2}
        ],
        'maneuvers': [
            {
                'id': 'scarica_mentale',
                'name': 'Scarica Mentale',
                'cost': {'type': 'QUALSIASI', 'amount': 1, 'extra_pt_flat': 1},
                'cost_impulses': 1,
                'effect': {'type': 'DAMAGE_DIRECT', 'value': 1}
            },
            {
                'id': 'affrontare_paure',
                'name': 'Affrontare le Paure',
                'special': 'DISCARD_UNUSED',
                'effect': {'type': 'RESTORE_PT', 'value': 1}
            }
        ]
    },
    # v0.0.3: d6 Terror variant - for swap mechanic
    'TERRORE_D6': {
        'id': 'd6_terrore',
        'name': 'Dado Terrore d6',
        'faces': [
            {'type': 'JOLLY', 'quantity': 1},
            {'type': 'JOLLY', 'quantity': 1},
            {'type': 'JOLLY', 'quantity': 2},
            {'type': 'JOLLY', 'quantity': 2},
            {'type': 'JOLLY', 'quantity': 2},
            {'type': 'JOLLY', 'quantity': 3}
        ],
        'maneuvers': [
            {
                'id': 'scarica_mentale',
                'name': 'Scarica Mentale',
                'cost': {'type': 'QUALSIASI', 'amount': 1, 'extra_pt_flat': 1},
                'cost_impulses': 1,
                'effect': {'type': 'DAMAGE_DIRECT', 'value': 1}
            },
            {
                'id': 'affrontare_paure',
                'name': 'Affrontare le Paure',
                'special': 'DISCARD_UNUSED',
                'effect': {'type': 'RESTORE_PT', 'value': 1}
            }
        ]
    },
    'AI_ZOMBIE': {
        'id': 'd4_ai',
        'faces': [1, 2, 3, 4]
    }
}

# ============================================================================
# EFFECT_REGISTRY - Registro effetti per dispatch dinamico
# ============================================================================
# Ogni effetto ha:
#   - category: tipo logico (DAMAGE, DEFENSE, MOVEMENT, UTILITY, CONVERSION, AOE)
#   - target: tipo di bersaglio richiesto (ENEMY, SELF, DIE, AREA, NONE)
#   - handler: nome funzione handler in player_game.py (da implementare in 2.2)
#   - description: descrizione per UI/debug
#   - per_impulse: se l'effetto scala con impulsi allocati

EFFECT_REGISTRY = {
    # === DAMAGE ===
    'DAMAGE': {
        'category': 'DAMAGE',
        'target': 'ENEMY',
        'handler': 'handle_damage',
        'description': 'Infligge danno fisico al bersaglio',
        'per_impulse': True
    },
    'DAMAGE_FIRE': {
        'category': 'DAMAGE',
        'target': 'ENEMY',
        'handler': 'handle_damage_fire',
        'description': 'Infligge danno da fuoco al bersaglio',
        'per_impulse': True
    },
    'DAMAGE_DIRECT': {
        'category': 'DAMAGE',
        'target': 'ENEMY',
        'handler': 'handle_damage_direct',
        'description': 'Infligge danno diretto (ignora scudi)',
        'per_impulse': False
    },
    
    # === DEFENSE ===
    'SHIELD': {
        'category': 'DEFENSE',
        'target': 'SELF',
        'handler': 'handle_shield',
        'description': 'Aggiunge scudi al giocatore',
        'per_impulse': True
    },
    'SHIELD_SELF': {
        'category': 'DEFENSE',
        'target': 'SELF',
        'handler': 'handle_shield',
        'description': 'Aggiunge scudi (effetto secondario)',
        'per_impulse': False
    },
    
    # === DEBUFF ===
    'VULNERABILITY': {
        'category': 'DEBUFF',
        'target': 'ENEMY',
        'handler': 'handle_vulnerability',
        'description': 'Applica vulnerabilità al bersaglio',
        'per_impulse': True
    },
    'VULNERABILITY_FIRE': {
        'category': 'DEBUFF',
        'target': 'ENEMY',
        'handler': 'handle_vulnerability_fire',
        'description': 'Applica vulnerabilità al fuoco',
        'per_impulse': True
    },
    'VULNERABILITY_SELF': {
        'category': 'DEBUFF',
        'target': 'SELF',
        'handler': 'handle_vulnerability_self',
        'description': 'Applica vulnerabilità a se stesso (malus)',
        'per_impulse': False
    },
    'STUN_PUSH': {
        'category': 'DEBUFF',
        'target': 'ENEMY',
        'handler': 'handle_stun_push',
        'description': 'Stordisce e spinge il bersaglio',
        'per_impulse': True
    },
    
    # === MOVEMENT ===
    'MOVE': {
        'category': 'MOVEMENT',
        'target': 'SELF',
        'handler': 'handle_move',
        'description': 'Aggiunge punti movimento',
        'per_impulse': True
    },
    'CHARGE_MOVE_DAMAGE': {
        'category': 'MOVEMENT',
        'target': 'ENEMY',
        'handler': 'handle_charge_move_damage',
        'description': 'Carica verso nemico e infligge danno',
        'per_impulse': False,
        'special': 'REQUIRES_DICE_PAIR'
    },
    
    # === UTILITY ===
    'DRAW': {
        'category': 'UTILITY',
        'target': 'SELF',
        'handler': 'handle_draw',
        'description': 'Pesca carte',
        'per_impulse': False
    },
    'RESTORE_PT': {
        'category': 'UTILITY',
        'target': 'SELF',
        'handler': 'handle_restore_pt',
        'description': 'Ripristina Punti Terrore',
        'per_impulse': False
    },
    'REROLL_SET_FACE': {
        'category': 'UTILITY',
        'target': 'DIE',
        'handler': 'handle_reroll_set_face',
        'description': 'Ritira dado e sceglie faccia',
        'per_impulse': False
    },
    
    # === CONVERSION ===
    'CONVERT_DICE_FIRE': {
        'category': 'CONVERSION',
        'target': 'SELF',
        'handler': 'handle_convert_dice_fire',
        'description': 'Converte tutti i dadi in FUOCO',
        'per_impulse': False
    },
    'CONVERT_ALL_JOLLY_TO_FORCE': {
        'category': 'CONVERSION',
        'target': 'SELF',
        'handler': 'handle_convert_jolly_to_force',
        'description': 'Converte tutti i JOLLY in FORZA',
        'per_impulse': False
    },
    
    # === AOE (Area of Effect) ===
    'DAMAGE_FIRE_AOE': {
        'category': 'AOE',
        'target': 'AREA',
        'handler': 'handle_damage_fire_aoe',
        'description': 'Infligge danno da fuoco ad area',
        'per_impulse': True
    },
    'VULNERABILITY_FIRE_AOE': {
        'category': 'AOE',
        'target': 'AREA',
        'handler': 'handle_vulnerability_fire_aoe',
        'description': 'Applica vulnerabilità al fuoco ad area',
        'per_impulse': False
    },
    'INCREASE_RANGE': {
        'category': 'UTILITY',
        'target': 'SELF',
        'handler': 'handle_increase_range',
        'description': 'Aumenta il raggio della carta',
        'per_impulse': False
    }
}

CARDS = [
    # ========== ATTACCO BASE (x2) ==========
    {
        'id': 'attacco_base',
        'name': 'Attacco Base',
        'type': 'TERRA',
        'cooldown': 0,
        'range': 1,
        'target_type': 'ENEMY',
        'quantity': 2,  # v0.0.3
        'supply_contribution': 'NONE',  # v0.0.3
        'discard_payload': 'GAIN_SHIELD_TOKEN',  # v0.0.3
        'effects': [
            {'cost': {'type': 'FORZA', 'amount': 1}, 'cost_impulses': 1, 'action': 'DAMAGE', 'value': 1, 'per_impulse': True},
            {'cost': {'type': 'FORZA', 'amount': 2}, 'cost_impulses': 2, 'action': 'DRAW', 'value': 1}
        ]
    },
    # ========== SCATTO (x1) ==========
    {
        'id': 'scatto',
        'name': 'Scatto',
        'type': 'TERRA',
        'cooldown': 0,
        'target_type': 'SELF',
        'quantity': 1,  # v0.0.3
        'supply_contribution': 'NONE',  # v0.0.3
        'discard_payload': 'HAND_LIMIT_+1',  # v0.0.3
        'effects': [
            {'cost': {'type': 'FORZA', 'amount': 1}, 'cost_impulses': 1, 'action': 'MOVE', 'value': 2, 'per_impulse': True}
        ]
    },
    # ========== ATTACCO PODEROSO (x1) ==========
    {
        'id': 'attacco_poderoso',
        'name': 'Attacco Poderoso',
        'type': 'TERRA',
        'cooldown': 1,
        'range': 1,
        'target_type': 'ENEMY',
        'quantity': 1,  # v0.0.3
        'supply_contribution': 'NONE',  # v0.0.3
        'discard_payload': 'GEN_D4_FIRE',  # v0.0.3
        'effects': [
            {'cost': {'type': 'FORZA', 'amount': 1}, 'cost_impulses': 1, 'action': 'DAMAGE', 'value': 2, 'per_impulse': True, 'malus': 'VULNERABILITY_SELF', 'malus_value': 1},
            {'cost': {'type': 'FORZA', 'amount': 1}, 'cost_impulses': 1, 'action': 'STUN_PUSH', 'value': 1, 'malus': 'VULNERABILITY_SELF', 'malus_value': 1, 'per_impulse': True}
        ]
    },
    # ========== DINIEGO SISMICO (x1) - PLACEHOLDER ==========
    # TODO: Questa cart non esiste - probabilmente sostituisce una carta esistente
    {
        'id': 'diniego_sismico',
        'name': 'Diniego Sismico',
        'type': 'TERRA',
        'cooldown': 1,
        'range': 1,
        'target_type': 'ENEMY',
        'quantity': 1,  # v0.0.3
        'supply_contribution': 'NONE',  # v0.0.3
        'discard_payload': 'GEN_D4_FIRE',  # v0.0.3
        'effects': [
            # Placeholder - same as Attacco Poderoso for now
            {'cost': {'type': 'FORZA', 'amount': 1}, 'cost_impulses': 1, 'action': 'DAMAGE', 'value': 2, 'per_impulse': True}
        ]
    },
    # ========== INFUSIONE ELEMENTALE (x1) ==========
    {
        'id': 'infusione_elementale',
        'name': 'Infusione Elementale',
        'type': 'FUOCO',
        'cooldown': 1,
        'exclusive_slot': True,
        'target_type': 'SELF',
        'quantity': 1,  # v0.0.3
        'supply_contribution': 'NONE',  # v0.0.3
        'discard_payload': 'ROTATE_TARGET_CD',  # v0.0.3
        'effects': [
            {'cost': {'type': 'QUALSIASI', 'amount': 0}, 'cost_impulses': 0, 'action': 'CONVERT_DICE_FIRE', 'extra_impulse': 1}
        ]
    },
    # ========== ATTACCO DI FUOCO (x1) ==========
    {
        'id': 'attacco_fuoco',
        'name': 'Attacco di Fuoco',
        'type': 'FUOCO',
        'cooldown': 1,
        'range': 1,
        'target_type': 'ENEMY',
        'quantity': 1,  # v0.0.3
        'supply_contribution': 'D4_FIRE',  # v0.0.3
        'discard_payload': 'GEN_D6_EARTH',  # v0.0.3
        'effects': [
            {'cost': {'type': 'FUOCO', 'amount': 1}, 'cost_impulses': 1, 'action': 'DAMAGE_FIRE', 'value': 2, 'per_impulse': True},
            {'cost': {'type': 'FUOCO', 'amount': 1}, 'cost_impulses': 1, 'action': 'VULNERABILITY_FIRE', 'value': 1, 'per_impulse': True}
        ]
    },
    # ========== CONO DI FUOCO (x1) ==========
    {
        'id': 'cono_fuoco',
        'name': 'Cono di Fuoco',
        'type': 'FUOCO',
        'cooldown': 1,
        'range': 3,
        'target_type': 'AREA_ENEMY',
        'area': {'type': 'CONE', 'base_range': 3},
        'quantity': 1,  # v0.0.3
        'supply_contribution': 'D4_FIRE',  # v0.0.3
        'discard_payload': 'GEN_D6_EARTH',  # v0.0.3
        'effects': [
            {'cost': {'type': 'FUOCO', 'amount': 1}, 'cost_impulses': 1, 'action': 'INCREASE_RANGE', 'value': 1},
            {'cost': {'type': 'FUOCO', 'amount': 1}, 'cost_impulses': 1, 'action': 'DAMAGE_FIRE_AOE', 'value': 1, 'per_impulse': True},
            {'cost': {'type': 'FUOCO', 'amount': 1}, 'cost_impulses': 1, 'action': 'VULNERABILITY_FIRE_AOE', 'value': 1}
        ]
    },
    # ========== ATTACCO STRATEGICO (x1) ==========
    {
        'id': 'attacco_strategico',
        'name': 'Attacco Strategico',
        'type': 'TERRA',
        'cooldown': 2,
        'range': 2,
        'target_type': 'ENEMY',
        'quantity': 1,  # v0.0.3
        'supply_contribution': 'D6_EARTH',  # v0.0.3
        'discard_payload': 'GEN_JOLLY',  # v0.0.3
        'effects': [
            {'cost': {'type': 'FORZA', 'amount': 1}, 'cost_impulses': 1, 'action': 'VULNERABILITY', 'value': 1, 'per_impulse': True, 'secondary_action': 'SHIELD_SELF', 'secondary_value': 1},
            {'cost': {'type': 'FORZA', 'amount': 1}, 'cost_impulses': 1, 'action': 'DRAW', 'value': 1}
        ]
    },
    # ========== CARICA FURIOSA (x1) ==========
    {
        'id': 'carica_furiosa',
        'name': 'Carica Furiosa',
        'type': 'HYBRID',
        'cooldown': 2,
        'range': 3,
        'requires_dice_pair': True,
        'description': 'Consuma 2 dadi PLAYER adiacenti nel pool. Costo extra: 1 PT se uno dei dadi è Terrore.',
        'target_type': 'ENEMY',
        'quantity': 1,  # v0.0.3
        'supply_contribution': 'D8_EARTH',  # v0.0.3
        'discard_payload': 'GEN_JOLLY',  # v0.0.3
        'effects': [
            {'action': 'CHARGE_MOVE_DAMAGE', 'cost': {'type': 'QUALSIASI', 'amount': 0}, 'cost_extra_terror': 1}
        ]
    },
    # ========== PROFONDITÀ MENTE OSCURA (x1) ==========
    {
        'id': 'profondita_mente_oscura',
        'name': 'Profondità Mente Oscura',
        'type': 'TERRORE',
        'cooldown': 2,
        'target_type': 'SELF',
        'quantity': 1,  # v0.0.3
        'supply_contribution': 'D8_TERROR',  # v0.0.3
        'discard_payload': 'GEN_JOLLY',  # v0.0.3
        'effects': [
            {'cost': {'type': 'JOLLY', 'amount': 1}, 'cost_impulses': 1, 'cost_extra_terror': 1, 'action': 'CONVERT_ALL_JOLLY_TO_FORCE'}
        ]
    },
    # ========== MANIPOLAZIONE DESTINO (x1) ==========
    {
        'id': 'manipolazione_destino',
        'name': 'Manipolazione Destino',
        'type': 'UTIL',
        'cooldown': 2,
        'target_type': 'DIE',
        'quantity': 1,  # v0.0.3
        'supply_contribution': 'NONE',  # v0.0.3
        'discard_payload': 'ROTATE_ALL_CD',  # v0.0.3
        'effects': [
            {'cost': {'type': 'QUALSIASI', 'amount': 0}, 'cost_impulses': 0, 'cost_extra_terror': 0, 'action': 'REROLL_SET_FACE'}
        ]
    }
]

# ============================================================================
# ENEMY TYPES - Tipi di nemici con dadi associati
# ============================================================================
# Ogni tipo di nemico ha un dado con azioni specifiche per faccia.
# I nemici dello stesso tipo condividono lo stesso dado nel pool.

ENEMY_TYPES = {
    'ZOMBIE_STANDARD': {
        'name': 'Zombie',
        'base_hp': 5,
        'move_range': 1,
        'attack_range': 1,
        
        # Dado associato al tipo
        'die': {
            'id': 'd4_zombie_standard',
            'faces': [1, 2, 3, 4],
            'actions': {
                1: {
                    'id': 'morso_rigenerante',
                    'name': 'Morso Rigenerante',
                    'type': 'MOVE_ATTACK',
                    'damage': 2,
                    'effect': 'HEAL_SELF_1'
                },
                2: {
                    'id': 'attacco_orda',
                    'name': 'Attacco Orda',
                    'type': 'MOVE_ATTACK',
                    'damage': 2,
                    'effect': 'BONUS_DMG_ADJ_ZOMBIES'
                },
                3: {
                    'id': 'incassare',
                    'name': 'Incassare',
                    'type': 'DEFEND',
                    'shields': 2
                },
                4: {
                    'id': 'attacco_spaventoso',
                    'name': 'Attacco Spaventoso',
                    'type': 'MOVE_ATTACK',
                    'damage': 2,
                    'effect': 'FEAR_1'
                }
            }
        }
    }
    # Future enemy types can be added here:
    # 'ZOMBIE_BERSERKER': {...},
    # 'NECROMANCER': {...},
}

# LEGACY: Mantenuto per retrocompatibilità durante transizione
ZOMBIE_AI = {
    1: {'name': 'Morso Rigenerante', 'action': 'MOVE_ATTACK', 'damage': 2, 'effect': 'HEAL_SELF_1'},
    2: {'name': 'Attacco Orda', 'action': 'MOVE_ATTACK', 'damage': 2, 'effect': 'BONUS_DMG_ADJ_ZOMBIES'},
    3: {'name': 'Incassare', 'action': 'DEFEND', 'shields': 2},
    4: {'name': 'Attacco Spaventoso', 'action': 'MOVE_ATTACK', 'damage': 2, 'effect': 'FEAR_1'}
}

# ============================================================================
# SCENARIO
# ============================================================================

SCENARIO_DEMO = {
    'PLAYER': {
        'id': 'Giocatore',
        'hp': 10,
        'pt': 6,
        'pos': {'r': 1, 'q': 4},
        # v0.0.3 deck: 12 cards (2x Attacco Base, no Difesa Base/Diniego)
        'deck': [
            'attacco_base', 'attacco_base',  # 2x
            'scatto',
            'attacco_poderoso',
            'infusione_elementale',
            'attacco_fuoco', 'cono_fuoco',
            'attacco_strategico',
            'carica_furiosa',
            'profondita_mente_oscura',
            'manipolazione_destino'
        ]
    },
    'ENEMIES': [
        # type_ref punta a ENEMY_TYPES, hp può fare override di base_hp
        {'id': 'Zombie_1', 'type_ref': 'ZOMBIE_STANDARD', 'hp': 4, 'pos': {'r': 4, 'q': 3}},
        {'id': 'Zombie_2', 'type_ref': 'ZOMBIE_STANDARD', 'hp': 4, 'pos': {'r': 6, 'q': 2}},
        {'id': 'Zombie_3', 'type_ref': 'ZOMBIE_STANDARD', 'hp': 4, 'pos': {'r': 7, 'q': 4}},
        {'id': 'Zombie_4', 'type_ref': 'ZOMBIE_STANDARD', 'hp': 4, 'pos': {'r': 7, 'q': 5}}
    ]
}

