# GAME_STATE.PY - Converted from game_state.js
# Game state management class

import random
from gamedata import CONSTANTS as C, SCENARIO_DEMO as S
from balancing_tracker import BalancingTracker

class GameState:
    def __init__(self):
        self.turn = 0
        self.log_history = []
        self.ended = False
        self.result = None
        
        # Player initialization
        self.player = {
            'id': S['PLAYER'].get('id', 'Giocatore'),
            'type': 'PLAYER',
            'hp': S['PLAYER']['hp'],
            'hp_max': C['RESOURCES']['HP_MAX'],
            'pt': S['PLAYER']['pt'],
            'pt_max': C['RESOURCES']['PT_MAX'],
            'pm': C['RESOURCES']['PM_BASE'],
            'pos': dict(S['PLAYER']['pos']),
            'hand': [],
            'deck': list(S['PLAYER']['deck']),
            'discard': [],
            'cooldown_board': [
                {'id': 's1', 'card': None, 'cd': 0},
                {'id': 's2', 'card': None, 'cd': 0},
                {'id': 's3', 'card': None, 'cd': 0},
                {'id': 's4_fire', 'card': None, 'cd': 0, 'exclusive': 'FUOCO'}
            ],
            'played_this_turn': [],
            'shields': [],
            'status': []
        }
        
        # Shuffle deck (Fisher-Yates)
        for i in range(len(self.player['deck']) - 1, 0, -1):
            j = random.randint(0, i)
            self.player['deck'][i], self.player['deck'][j] = self.player['deck'][j], self.player['deck'][i]
        
        # Enemies initialization
        self.enemies = []
        for e in S['ENEMIES']:
            enemy = dict(e)
            enemy['hp_max'] = e['hp']
            enemy['shields'] = []
            enemy['status'] = []
            enemy['pos'] = dict(e['pos'])
            self.enemies.append(enemy)
        
        # v0.0.2: Old dice pool system (to be replaced in v0.0.3)
        self.dice_pool = []
        self.consumed_dice_indices = set()
        self.ai_action_code = None
        
        # v0.0.3: NEW - Bag/Pool/Buffer System
        self.dice_bag = []  # Available dice not yet active
        self.active_pool = []  # Dice ready to be rolled this turn
        self.next_turn_buffer = []  # Dice/PM generated from discards, activated next turn
        
        # v0.0.3: NEW - Hand limit tracking
        self.hand_limit = 5  # Base hand limit
        self.hand_limit_bonus_next_turn = 0  # Bonus from HAND_LIMIT_+1 payload
        
        # Telemetry (legacy - kept for compatibility)
        self.telemetry = {
            'turns_data': [],
            'card_usage': {},
            'total_damage_dealt': 0,
            'total_damage_taken': 0,
            'discarded_cards': 0
        }

        # v0.0.3: Balancing Tracker - persistent telemetry for game balancing
        self.tracker = BalancingTracker(game_version="v0.0.3")
    
    def log(self, msg):
        """Add a log message"""
        self.log_history.append(f"[T{self.turn}] {msg}")
    
    def init_dice_bag(self):
        """v0.0.3: Calculate initial dice bag from supply_contribution of all cards in deck"""
        from gamedata import CARDS, DICE
        
        # Mapping from supply_contribution to DICE key
        die_def_map = {
            'D4_FIRE': 'FUOCO',
            'D6_EARTH': 'TERRA',
            'D8_EARTH': 'TERRA_D8',
            'D8_TERROR': 'TERRORE',
            'D4_TERROR': 'TERRORE_D4',  # v0.0.3 FIX
            'D6_TERROR': 'TERRORE_D6'   # v0.0.3 FIX
        }
        
        # Count supply contributions from deck
        bag_counts = {}
        for card_id in self.player['deck']:
            card = next((c for c in CARDS if c['id'] == card_id), None)
            if not card:
                continue
            contrib = card.get('supply_contribution', 'NONE')
            if contrib != 'NONE':
                bag_counts[contrib] = bag_counts.get(contrib, 0) + 1
        
        # Populate dice_bag
        self.dice_bag = []
        die_id = 0
        for die_type, count in bag_counts.items():
            dice_key = die_def_map.get(die_type)
            if not dice_key or dice_key not in DICE:
                continue
            for _ in range(count):
                self.dice_bag.append({
                    'die_type': die_type,
                    'die_def': DICE[dice_key],
                    'source': 'PLAYER',
                    'id': f'player_die_{die_id}'
                })
                die_id += 1
        
        self.log(f"🎲 Bag inizializzata: {len(self.dice_bag)} dadi")
    
    def setup_turn_1(self):
        """v0.0.3: Setup initial active pool for turn 1 ('Omaggio')"""
        from gamedata import DICE
        
        # Initial gift: these dice move from bag to active_pool
        initial_dice = [
            ('D6_EARTH', 'TERRA'),
            ('D4_FIRE', 'FUOCO'),
            ('D8_TERROR', 'TERRORE')
        ]
        
        for die_type, dice_key in initial_dice:
            # Find die in bag
            die_idx = next((i for i, d in enumerate(self.dice_bag) 
                           if d['die_type'] == die_type), None)
            if die_idx is not None:
                # Move from bag to active_pool
                die = self.dice_bag.pop(die_idx)
                self.active_pool.append(die)
                self.log(f"   🎁 {die_type} → Active Pool")
            else:
                # Die not in bag - create it fresh (shouldn't happen with proper deck)
                self.active_pool.append({
                    'die_type': die_type,
                    'die_def': DICE.get(dice_key),
                    'source': 'PLAYER',
                    'id': f'gift_die_{die_type}'
                })
                self.log(f"   🎁 {die_type} → Active Pool (creato)")
        
        # Initial PM
        self.player['pm'] = 2
        self.log(f"   💎 2 PM iniziali")
        
        # Log bag status
        bag_summary = {}
        for d in self.dice_bag:
            bag_summary[d['die_type']] = bag_summary.get(d['die_type'], 0) + 1
        if bag_summary:
            self.log(f"   📦 Bag rimanente: {bag_summary}")
    
    def clone(self):
        """Create a deep copy of the state"""
        import copy
        return copy.deepcopy(self)

