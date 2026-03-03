# PLAYER_GAME.PY - Enhanced Pygame Interface
# Functional version with die selection, PM usage, and enemy turns

import pygame
import random
import sys
import os
import math
import datetime


def get_resource_path(relative_path):
    """Get absolute path to resource, works for dev and PyInstaller bundle."""
    if getattr(sys, 'frozen', False):
        # Running as PyInstaller bundle
        base_path = sys._MEIPASS
    else:
        # Running as script
        base_path = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base_path, relative_path)
from gamedata import (CONSTANTS as C, DICE as D, CARDS, ZOMBIE_AI as Z,
                      SCENARIO_DEMO, ENEMY_TYPES, EFFECT_REGISTRY,
                      COST_ICONS, PAYLOAD_TRANSLATIONS, SUPPLY_TRANSLATIONS,
                      COOLDOWN_TEXT, CARD_TYPE_NAMES, get_card_description,
                      get_maneuver_description, MANEUVER_DESCRIPTIONS)
from hex_utils import HexUtils
from game_state import GameState

# ============================================================================
# PALETTE DEATH HOWL - Grim Victorian / Lovecraftian
# ============================================================================
PALETTE_DEATH_HOWL = {
    # Backgrounds
    'BG_DEEP_SLATE': (21, 21, 25),      # #151519
    'BG_CHARCOAL': (37, 37, 41),        # #252529
    
    # UI Elements
    'UI_PARCHMENT': (212, 197, 168),    # #D4C5A8
    'UI_BURNT_EDGE': (90, 77, 65),      # #5A4D41
    'UI_PANEL_BG': (45, 42, 55),        # #2D2A37
    
    # Accents
    'ACCENT_GOLD': (218, 165, 32),      # #DAA520 - Selezione
    'ACCENT_SPECTRAL': (64, 224, 208),  # #40E0D0 - Magia
    'ACCENT_BLOOD': (178, 34, 34),      # #B22222 - Pericolo
    'ACCENT_VIOLET': (138, 43, 226),    # #8A2BE2 - Terrore
    
    # Text
    'TEXT_PRIMARY': (230, 225, 220),    # #E6E1DC
    'TEXT_SECONDARY': (160, 155, 150),  # #A09B96
    'TEXT_DISABLED': (80, 78, 85),      # #504E55
    
    # Dice Colors (più saturi)
    'DICE_FORZA': (205, 170, 100),      # Terra/Brown-Gold
    'DICE_FUOCO': (255, 100, 50),       # Fuoco/Orange-Red
    'DICE_JOLLY': (180, 130, 255),      # Terrore/Purple
    'DICE_ENEMY': (180, 50, 50),        # Zombie/Dark Red
}

# ============================================================================
# LAYOUT CONSTANTS - Coordinate precise per UI scalabile
# ============================================================================
LAYOUT = {
    # Header
    'HEADER_Y': 0,
    'HEADER_HEIGHT': 60,
    'HP_BAR_X': 20,
    'HP_BAR_Y': 15,
    'HP_BAR_WIDTH': 200,
    
    # Dice Pool (Left Panel)
    'DICE_PANEL_X': 0,
    'DICE_PANEL_Y': 60,
    'DICE_PANEL_WIDTH': 280,
    'DICE_PANEL_HEIGHT': 480,
    
    # Hex Map (Center)
    'MAP_X': 280,
    'MAP_Y': 60,
    'MAP_WIDTH': 720,
    'MAP_HEIGHT': 480,
    
    # Enemy Panel (Right)
    'ENEMY_PANEL_X': 1000,
    'ENEMY_PANEL_Y': 60,
    'ENEMY_PANEL_WIDTH': 280,
    'ENEMY_PANEL_HEIGHT': 480,
    
    # Card Hand (Bottom)
    'HAND_Y': 540,
    'HAND_HEIGHT': 180,
    'CARD_WIDTH': 120,
    'CARD_HEIGHT': 170,
}


# ============================================================================
# EFFECT HANDLERS - Funzioni generiche per dispatch dinamico
# ============================================================================
# Ogni handler riceve: game, effect, context
# context contiene: enemy, allocated, effect_cost, dice_indices, card

def handle_damage(game, effect, ctx):
    """Handle DAMAGE effect - physical damage to enemy"""
    if not ctx.get('enemy'):
        return False

    base_dmg = effect.get('value', 1)
    allocated = ctx.get('allocated', 1)
    effect_cost = ctx.get('effect_cost', 1)

    if effect.get('per_impulse'):
        damage = base_dmg * (allocated // effect_cost)
    else:
        damage = base_dmg

    # Fire bonus - check current die
    dice_indices = ctx.get('dice_indices', [])
    if dice_indices:
        current_die = game.state.dice_pool[dice_indices[0]]
        is_fire_infused = current_die['face']['type'] == 'FUOCO'
        card = ctx.get('card', {})
        if is_fire_infused and card.get('type') == 'TERRA':
            damage += 1
            game.add_log(f"   🔥 Bonus Fuoco: +1 danno!")

    enemy = ctx['enemy']
    hp_before = enemy['hp']
    game.apply_damage(enemy, damage)
    is_kill = enemy['hp'] <= 0
    game.add_log(f"   ⚔ {damage} danni! HP: {enemy['hp']}")
    if is_kill:
        game.add_log(f"   💀 {enemy['id']} eliminato!")

    # v0.0.3: Telemetry - log damage dealt
    card = ctx.get('card', {})
    game.state.tracker.log_damage_dealt(
        source_type='CARD',
        source_id=card.get('id', 'unknown'),
        target_id=enemy.get('id', 'enemy'),
        damage=damage,
        is_kill=is_kill,
        damage_type='PHYSICAL',
        context=game.state.tracker.get_context_snapshot(game.state)
    )

    # Handle malus: VULNERABILITY_SELF
    _apply_malus(game, effect)
    return True

def handle_damage_fire(game, effect, ctx):
    """Handle DAMAGE_FIRE effect - fire damage (same as DAMAGE for now)"""
    return handle_damage(game, effect, ctx)

def handle_damage_direct(game, effect, ctx):
    """Handle DAMAGE_DIRECT - ignores shields (Scarica Mentale)"""
    if not ctx.get('enemy'):
        return False

    damage = effect.get('value', 1) * ctx.get('allocated', 1)
    enemy = ctx['enemy']

    # Direct damage ignores shields
    hp_before = enemy['hp']
    enemy['hp'] = max(0, enemy['hp'] - damage)
    is_kill = enemy['hp'] <= 0
    game.add_log(f"   ⚡ {damage} danni diretti! HP: {enemy['hp']}")
    if is_kill:
        game.add_log(f"   💀 {enemy['id']} eliminato!")

    # v0.0.3: Telemetry - log direct damage
    card = ctx.get('card', {})
    game.state.tracker.log_damage_dealt(
        source_type='CARD',
        source_id=card.get('id', 'unknown'),
        target_id=enemy.get('id', 'enemy'),
        damage=damage,
        is_kill=is_kill,
        damage_type='DIRECT',
        context=game.state.tracker.get_context_snapshot(game.state)
    )

    return True

def handle_shield(game, effect, ctx):
    """Handle SHIELD effect - add shield tokens to player"""
    allocated = ctx.get('allocated', 1)
    effect_cost = ctx.get('effect_cost', 1)
    
    if effect.get('per_impulse'):
        shields = effect.get('value', 1) * (allocated // effect_cost)
    else:
        shields = effect.get('value', 1)
    
    if 'shields' not in game.state.player:
        game.state.player['shields'] = []

    for _ in range(shields):
        game.state.player['shields'].append({'assigned_turn': game.state.turn})

    # v0.0.3 FIX: Show total shield count
    total_shields = len(game.state.player['shields'])
    game.add_log(f"   🛡 SHIELD: +{shields} token (totale: {total_shields})")
    return True

def handle_vulnerability(game, effect, ctx):
    """Handle VULNERABILITY effect - apply vulnerability to enemy"""
    if not ctx.get('enemy'):
        return False
    
    enemy = ctx['enemy']
    allocated = ctx.get('allocated', 1)
    effect_cost = ctx.get('effect_cost', 1)
    
    stacks = effect.get('value', 1) * (allocated // effect_cost) if effect.get('per_impulse') else effect.get('value', 1)
    
    if 'status' not in enemy:
        enemy['status'] = []
    
    vuln_status = next((s for s in enemy['status'] if s['type'] == 'VULNERABILITA'), None)
    if vuln_status:
        old_stacks = vuln_status.get('stacks', 0)
        vuln_status['stacks'] = old_stacks + stacks
        vuln_status['assigned_turn'] = game.state.turn
        game.add_log(f"   🎯 VULN: +{stacks} stack (totale: {vuln_status['stacks']})")
    else:
        enemy['status'].append({'type': 'VULNERABILITA', 'stacks': stacks, 'assigned_turn': game.state.turn})
        game.add_log(f"   🎯 VULN: +{stacks} stack (nuovo)")
    
    # Handle secondary_action: SHIELD_SELF
    if effect.get('secondary_action') == 'SHIELD_SELF':
        shield_value = effect.get('secondary_value', 1) * (allocated // effect_cost) if effect.get('per_impulse') else effect.get('secondary_value', 1)
        if 'shields' not in game.state.player:
            game.state.player['shields'] = []
        for _ in range(shield_value):
            game.state.player['shields'].append({'assigned_turn': game.state.turn})
        game.add_log(f"   🛡 +{shield_value} token scudo (tattica!)")
    
    return True

def handle_vulnerability_fire(game, effect, ctx):
    """Handle VULNERABILITY_FIRE - same as VULNERABILITY"""
    return handle_vulnerability(game, effect, ctx)

def handle_vulnerability_self(game, effect, ctx):
    """Handle VULNERABILITY_SELF malus - apply vulnerability to player"""
    malus_value = effect.get('value', 1)
    if 'status' not in game.state.player:
        game.state.player['status'] = []
    
    vuln_found = False
    for status in game.state.player['status']:
        if status['type'] == 'VULNERABILITA':
            old_stacks = status.get('stacks', 0)
            status['stacks'] = old_stacks + malus_value
            game.add_log(f"   ⚠️ VULN su te stesso: +{malus_value} stack (totale: {status['stacks']})")
            vuln_found = True
            break

    if not vuln_found:
        game.state.player['status'].append({'type': 'VULNERABILITA', 'stacks': malus_value})
        game.add_log(f"   ⚠️ VULN su te stesso: +{malus_value} stack (nuovo)")

    return True

def handle_stun_push(game, effect, ctx):
    """Handle STUN_PUSH effect - stun and push enemy away"""
    if not ctx.get('enemy'):
        return False
    
    enemy = ctx['enemy']
    allocated = ctx.get('allocated', 1)
    effect_cost = ctx.get('effect_cost', 1)
    
    stun_value = effect.get('value', 1) * (allocated // effect_cost) if effect.get('per_impulse') else effect.get('value', 1)
    
    # Push enemy away from player
    pushed = 0
    for _ in range(stun_value):
        push_dir = HexUtils.get_direction(game.state.player['pos'], enemy['pos'])
        if push_dir:
            new_pos = HexUtils.add_direction(enemy['pos'], push_dir)
            if HexUtils.is_valid(new_pos):
                occupied = False
                if new_pos == game.state.player['pos']:
                    occupied = True
                for e in game.state.enemies:
                    if e['id'] != enemy['id'] and e['hp'] > 0 and e['pos'] == new_pos:
                        occupied = True
                        break
                if not occupied:
                    enemy['pos'] = new_pos
                    pushed += 1
    
    # Apply stun tokens
    if 'status' not in enemy:
        enemy['status'] = []
    for _ in range(stun_value):
        enemy['status'].append({'type': 'STUN', 'assigned_turn': game.state.turn})

    # v0.0.3 FIX: Show total stun count
    total_stun = sum(1 for s in enemy['status'] if s.get('type') == 'STUN')
    if pushed > 0:
        game.add_log(f"   💫 STUN: +{stun_value} token (totale: {total_stun}) + spinta di {pushed}!")
    else:
        game.add_log(f"   💫 STUN: +{stun_value} token (totale: {total_stun})")
    
    # Handle malus
    _apply_malus(game, effect)
    return True

def handle_move(game, effect, ctx):
    """Handle MOVE effect - add movement points"""
    allocated = ctx.get('allocated', 1)
    effect_cost = ctx.get('effect_cost', 1)
    
    if effect.get('per_impulse'):
        move_points = effect.get('value', 1) * (allocated // effect_cost)
    else:
        move_points = effect.get('value', 1)
    
    game.state.player['pm'] += move_points
    game.add_log(f"   🏃 +{move_points} PM!")
    return True

def handle_draw(game, effect, ctx):
    """Handle DRAW effect - draw cards"""
    cards_to_draw = effect.get('value', 1)
    for _ in range(cards_to_draw):
        if len(game.state.player['deck']) > 0:
            drawn = game.state.player['deck'].pop(0)
            game.state.player['hand'].append(drawn)
            game.add_log("   🃏 Pescata 1 carta!")
        elif len(game.state.player['discard']) > 0:
            game.state.player['deck'] = game.state.player['discard'].copy()
            game.state.player['discard'] = []
            random.shuffle(game.state.player['deck'])
            if len(game.state.player['deck']) > 0:
                drawn = game.state.player['deck'].pop(0)
                game.state.player['hand'].append(drawn)
                game.add_log("   🃏 Pescata 1 carta!")
    return True

def handle_restore_pt(game, effect, ctx):
    """Handle RESTORE_PT effect - restore terror points"""
    value = effect.get('value', 1)
    game.state.player['pt'] = min(game.state.player['pt_max'], game.state.player['pt'] + value)
    game.add_log(f"   💜 +{value} PT!")
    return True

def handle_increase_range(game, effect, ctx):
    """Handle INCREASE_RANGE effect - store range bonus for AOE"""
    allocated = ctx.get('allocated', 1)
    effect_cost = ctx.get('effect_cost', 1)
    
    range_increase = effect.get('value', 1) * (allocated // effect_cost) if effect.get('per_impulse') else effect.get('value', 1)
    
    if not hasattr(game, 'aoe_range_bonus'):
        game.aoe_range_bonus = 0
    game.aoe_range_bonus += range_increase
    game.add_log(f"   📏 Range cono +{range_increase}")
    return True

def handle_damage_fire_aoe(game, effect, ctx):
    """Handle DAMAGE_FIRE_AOE effect - fire damage to area"""
    card = ctx.get('card', {})
    target_pos = ctx.get('target_pos')
    allocated = ctx.get('allocated', 1)
    effect_cost = ctx.get('effect_cost', 1)
    
    if card.get('target_type') != 'AREA_ENEMY' or not target_pos:
        return False
    
    player_pos = game.state.player['pos']
    base_range = card.get('area', {}).get('base_range', 3)
    total_range = base_range + getattr(game, 'aoe_range_bonus', 0)
    
    cone_hexes = HexUtils.get_cone(player_pos, target_pos, total_range)
    game.add_log(f"   📐 Cono calcolato: {len(cone_hexes)} hex, range: {total_range}")
    
    # Find enemies in cone
    enemies_hit = []
    for e in game.state.enemies:
        if e['hp'] > 0:
            for cone_hex in cone_hexes:
                if e['pos']['q'] == cone_hex['q'] and e['pos']['r'] == cone_hex['r']:
                    enemies_hit.append(e)
                    break
    
    game.add_log(f"   🧟 Nemici trovati nel cono: {len(enemies_hit)}")
    
    if enemies_hit:
        damage = effect.get('value', 1) * (allocated // effect_cost) if effect.get('per_impulse') else effect.get('value', 1)
        game.add_log(f"   🔥 Danno {damage} a {len(enemies_hit)} nemici!")
        for e in enemies_hit:
            game.apply_damage(e, damage)
            game.add_log(f"      💥 {e['id']}: HP {e['hp']}")
            if e['hp'] == 0:
                game.add_log(f"         💀 ELIMINATO!")
        game.aoe_enemies_hit = enemies_hit
    else:
        game.add_log(f"   ⚠️ Nessun nemico nel cono!")
    
    return True

def handle_vulnerability_fire_aoe(game, effect, ctx):
    """Handle VULNERABILITY_FIRE_AOE effect - apply vulnerability to enemies in area"""
    allocated = ctx.get('allocated', 1)
    effect_cost = ctx.get('effect_cost', 1)
    
    enemies_hit = getattr(game, 'aoe_enemies_hit', [])
    if not enemies_hit:
        return False
    
    vuln_stacks = effect.get('value', 1) * (allocated // effect_cost) if effect.get('per_impulse') else effect.get('value', 1)
    
    for e in enemies_hit:
        if e['hp'] > 0:
            if 'status' not in e:
                e['status'] = []
            vuln_status = next((s for s in e['status'] if s['type'] == 'VULNERABILITA'), None)
            if vuln_status:
                vuln_status['stacks'] = vuln_status.get('stacks', 1) + vuln_stacks
                vuln_status['assigned_turn'] = game.state.turn
            else:
                e['status'].append({'type': 'VULNERABILITA', 'stacks': vuln_stacks, 'assigned_turn': game.state.turn})
    
    game.add_log(f"   🎯 Vulnerabilità x{vuln_stacks} applicata!")
    return True

def _apply_malus(game, effect):
    """Helper: Apply malus effects (VULNERABILITY_SELF)"""
    if effect.get('malus') == 'VULNERABILITY_SELF':
        malus_value = effect.get('malus_value', 1)
        if 'status' not in game.state.player:
            game.state.player['status'] = []
        vuln_found = False
        for status in game.state.player['status']:
            if status['type'] == 'VULNERABILITA':
                old_stacks = status.get('stacks', 0)
                status['stacks'] = old_stacks + malus_value
                status['assigned_turn'] = game.state.turn
                game.add_log(f"   ⚠️ VULN su te stesso: +{malus_value} stack (totale: {status['stacks']})")
                vuln_found = True
                break
        if not vuln_found:
            game.state.player['status'].append({'type': 'VULNERABILITA', 'stacks': malus_value, 'assigned_turn': game.state.turn})
            game.add_log(f"   ⚠️ VULN su te stesso: +{malus_value} stack (nuovo)")

# Handler registry mapping - maps handler names to functions
EFFECT_HANDLERS = {
    'handle_damage': handle_damage,
    'handle_damage_fire': handle_damage_fire,
    'handle_damage_direct': handle_damage_direct,
    'handle_shield': handle_shield,
    'handle_vulnerability': handle_vulnerability,
    'handle_vulnerability_fire': handle_vulnerability_fire,
    'handle_vulnerability_self': handle_vulnerability_self,
    'handle_stun_push': handle_stun_push,
    'handle_move': handle_move,
    'handle_draw': handle_draw,
    'handle_restore_pt': handle_restore_pt,
    'handle_increase_range': handle_increase_range,
    'handle_damage_fire_aoe': handle_damage_fire_aoe,
    'handle_vulnerability_fire_aoe': handle_vulnerability_fire_aoe,
}

def execute_effect(game, action, effect, ctx):
    """Central dispatcher for effect execution using EFFECT_REGISTRY"""
    effect_info = EFFECT_REGISTRY.get(action)
    if not effect_info:
        game.add_log(f"   ⚠️ Effetto sconosciuto: {action}")
        return False
    
    handler_name = effect_info.get('handler')
    handler = EFFECT_HANDLERS.get(handler_name)
    
    if not handler:
        game.add_log(f"   ⚠️ Handler mancante: {handler_name}")
        return False
    
    return handler(game, effect, ctx)



pygame.init()

# Fixed resolution - ROLLBACK from fullscreen
SCREEN_WIDTH = 1280
SCREEN_HEIGHT = 720
FPS = 60

# Colors - Mapped to PALETTE_DEATH_HOWL for consistency
COLOR_BG = PALETTE_DEATH_HOWL['BG_DEEP_SLATE']
COLOR_PANEL_BG = PALETTE_DEATH_HOWL['UI_PANEL_BG']
COLOR_PANEL_BORDER = PALETTE_DEATH_HOWL['UI_BURNT_EDGE']
COLOR_TEXT = PALETTE_DEATH_HOWL['TEXT_PRIMARY']
COLOR_TEXT_DIM = PALETTE_DEATH_HOWL['TEXT_SECONDARY']
COLOR_TEXT_DARK = PALETTE_DEATH_HOWL['TEXT_DISABLED']
COLOR_HP = PALETTE_DEATH_HOWL['ACCENT_BLOOD']
COLOR_PT = PALETTE_DEATH_HOWL['ACCENT_VIOLET']
COLOR_PM = PALETTE_DEATH_HOWL['ACCENT_SPECTRAL']
COLOR_SUCCESS = (34, 197, 94)  # Green - conservato
COLOR_WARNING = (251, 146, 60)  # Orange - conservato
COLOR_ERROR = PALETTE_DEATH_HOWL['ACCENT_BLOOD']
COLOR_HEX_BG = PALETTE_DEATH_HOWL['BG_CHARCOAL']
COLOR_HEX_BORDER = PALETTE_DEATH_HOWL['UI_BURNT_EDGE']
COLOR_HEX_HOVER = (90, 90, 130)  # Conservato
COLOR_HEX_SELECTED = PALETTE_DEATH_HOWL['ACCENT_GOLD']
COLOR_HEX_RANGE = (59, 130, 246, 60)  # Alpha - conservato
COLOR_CARD_BG = PALETTE_DEATH_HOWL['UI_PANEL_BG']
COLOR_CARD_HOVER = PALETTE_DEATH_HOWL['UI_BURNT_EDGE']
COLOR_CARD_SELECTED = PALETTE_DEATH_HOWL['ACCENT_GOLD']
COLOR_CARD_DISABLED = PALETTE_DEATH_HOWL['BG_CHARCOAL']
COLOR_BUTTON = PALETTE_DEATH_HOWL['UI_BURNT_EDGE']
COLOR_BUTTON_HOVER = PALETTE_DEATH_HOWL['ACCENT_GOLD']
COLOR_DICE_FORZA = PALETTE_DEATH_HOWL['DICE_FORZA']
COLOR_DICE_FUOCO = PALETTE_DEATH_HOWL['DICE_FUOCO']
COLOR_DICE_JOLLY = PALETTE_DEATH_HOWL['DICE_JOLLY']
COLOR_DICE_CONSUMED = (50, 50, 60)  # Conservato
COLOR_DICE_ENEMY = PALETTE_DEATH_HOWL['DICE_ENEMY']

# Fonts (v0.0.3 FIX: Using Unicode-friendly system fonts)
try:
    FONT_TITLE = pygame.font.SysFont('segoeui,arial,sans-serif', 36, bold=True)
    FONT_LARGE = pygame.font.SysFont('segoeui,arial,sans-serif', 28, bold=True)
    FONT_MEDIUM = pygame.font.SysFont('segoeui,arial,sans-serif', 20)
    FONT_SMALL = pygame.font.SysFont('segoeui,arial,sans-serif', 16)
    FONT_TINY = pygame.font.SysFont('segoeui,arial,sans-serif', 13)
    # Emoji font - Windows native emoji support
    FONT_EMOJI = pygame.font.SysFont('seguiemj,segoeuiemoji,segoe ui emoji,apple color emoji,noto color emoji', 16)
except:
    FONT_TITLE = pygame.font.Font(None, 48)
    FONT_LARGE = pygame.font.Font(None, 36)
    FONT_MEDIUM = pygame.font.Font(None, 28)
    FONT_SMALL = pygame.font.Font(None, 20)
    FONT_TINY = pygame.font.Font(None, 16)
    FONT_EMOJI = pygame.font.Font(None, 16)  # Fallback

# Icons (v0.0.3: Emoji support with Segoe UI Emoji font)
ICON_MAP = {
    'FORZA': '⚔',     # Force (sword, single char variant)
    'FUOCO': '🔥',    # Fire
    'JOLLY': '🎲',    # Jolly/Wild (dice)
    'HP': '♥',        # Health Points (simpler heart)
    'PT': '💀',       # Terror Points
    'PM': '⚡'        # Movement Points
}

# ============================================================================
# EMOJI HELPER - Rendering emoji con font dedicato
# ============================================================================
def render_text_with_emoji(text, font, emoji_font, color):
    """Renderizza testo che può contenere emoji.

    Args:
        text: Stringa da renderizzare (può contenere emoji)
        font: Font normale per il testo
        emoji_font: Font dedicato per le emoji
        color: Colore del testo

    Returns:
        Surface con il testo renderizzato
    """
    # Lista di emoji comuni usate nel gioco (SOLO versioni semplici, no modificatori)
    emoji_chars = '🔥🌍🎭📦🔮🧙🧟⚡💀🎲⏱️⚠️💫»◇▣■📜🃏🎯🏃▶⚔♥🛡'

    # Se non ci sono emoji, usa il font normale
    if not any(c in emoji_chars for c in text):
        return font.render(text, True, color)

    # Altrimenti, renderizza parte per parte
    surfaces = []
    current_text = ""

    for char in text:
        if char in emoji_chars:
            # Renderizza il testo accumulato
            if current_text:
                surfaces.append(font.render(current_text, True, color))
                current_text = ""
            # Renderizza l'emoji con fallback robusto
            try:
                emoji_surf = emoji_font.render(char, True, color)
                # Check if emoji has width (some fonts fail silently)
                if emoji_surf.get_width() > 0:
                    surfaces.append(emoji_surf)
                else:
                    # Skip emoji that has zero width
                    pass
            except pygame.error:
                # Skip emoji that can't be rendered (zero width, invalid char, etc.)
                # Don't try to render with normal font as it will fail too
                pass
        else:
            current_text += char

    # Renderizza il testo finale rimasto
    if current_text:
        surfaces.append(font.render(current_text, True, color))

    # Se c'è solo una surface, restituiscila
    if len(surfaces) == 1:
        return surfaces[0]

    # Combina le surface in una unica
    total_width = sum(s.get_width() for s in surfaces)
    max_height = max(s.get_height() for s in surfaces)

    combined = pygame.Surface((total_width, max_height), pygame.SRCALPHA)
    x_offset = 0
    for surf in surfaces:
        combined.blit(surf, (x_offset, 0))
        x_offset += surf.get_width()

    return combined


def truncate_text(text, font, max_width, suffix="..."):
    """Truncate text to fit within max_width pixels.

    Args:
        text: String to truncate
        font: Pygame font to measure with
        max_width: Maximum width in pixels
        suffix: String to append when truncating

    Returns:
        Truncated string fitting within max_width
    """
    if font.size(text)[0] <= max_width:
        return text

    while font.size(text + suffix)[0] > max_width and len(text) > 1:
        text = text[:-1]

    return text + suffix


# ============================================================================
# ASSET MANAGER - Gestione centralizzata asset con fallback
# ============================================================================
class AssetManager:
    """Manager centralizzato per caricamento asset.
    
    Architettura flessibile predisposta per:
    - Oggi: singole immagini statiche
    - Futuro: sprite sheets con frame animation
    """
    
    def __init__(self):
        self.sprites = {}  # Cache sprite caricate
        self.animations = {}  # Futuro: dizionario animazioni
    
    def load_sprite(self, name, path):
        """Carica sprite statica. Supporta PyInstaller bundle."""
        if name not in self.sprites:
            try:
                # Use get_resource_path for PyInstaller compatibility
                full_path = get_resource_path(path)
                img = pygame.image.load(full_path).convert_alpha()
                self.sprites[name] = img
                print(f"[AssetManager] Loaded: {name} from {full_path}")
            except Exception as e:
                print(f"[AssetManager] Failed to load {name}: {e}")
                self.sprites[name] = None  # Fallback a placeholder
        return self.sprites[name]
    
    def get_sprite(self, name, fallback_size=(64, 64), fallback_color=(255, 0, 255)):
        """Ritorna sprite o placeholder colorato se non esiste."""
        sprite = self.sprites.get(name)
        if sprite is None:
            # Placeholder programmatico (magenta = asset mancante)
            placeholder = pygame.Surface(fallback_size, pygame.SRCALPHA)
            pygame.draw.rect(placeholder, fallback_color, (0, 0, *fallback_size))
            pygame.draw.line(placeholder, (0, 0, 0), (0, 0), fallback_size, 2)
            pygame.draw.line(placeholder, (0, 0, 0), (0, fallback_size[1]), (fallback_size[0], 0), 2)
            return placeholder
        return sprite
    
    # PREDISPOSIZIONE FUTURA per animazioni
    def load_animated_sprite(self, name, sheet_path, frame_width, frame_count):
        """[FUTURO] Carica sprite sheet e divide in frame."""
        # TODO: Implementare quando si aggiungeranno animazioni
        pass
    
    def get_animated_frame(self, name, dt_ms):
        """[FUTURO] Ritorna frame corrente di animazione."""
        # TODO: Implementare con frame cycling
        pass

class PlayerGame:
    def __init__(self):
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        pygame.display.set_caption("Zombie Dice Battle - 1280×720")
        self.clock = pygame.time.Clock()
        self.running = True
        
        # Setup debug logging with UTF-8 encoding and explicit error handling
        self.debug_log_file = open('debug.log', 'w', encoding='utf-8', errors='replace')
        self.debug_log("="*80)
        self.debug_log("GAME SESSION STARTED")
        self.debug_log(f"Time: {datetime.datetime.now()}")
        self.debug_log("="*80)
        
        self.state = None
        self.phase = "Menu"
        self.log_messages = ["> Premi 'Nuovo Gioco' per iniziare"]
        
        # Asset Manager - Load background and future assets (DOPO log_messages)
        self.assets = AssetManager()
        self.assets.load_sprite('background', 'assets/background.png')
        self.add_log("🎨 Background full art caricato!")
        
        # UI State
        self.selected_card_idx = None
        self.selected_dice = []  # List of die indices (legacy, now used for special card targeting)
        self.current_die_idx = 0  # NEW: Sequential die system - points to current die to use
        self.selected_target = None
        self.current_card = None
        self.current_maneuver = None  # For die maneuvers
        self.valid_targets = []
        self.range_hexes = []
        self.valid_move_hexes = []  # For movement
        self.hover_card_idx = None
        self.hover_hex = None
        self.show_maneuvers = False  # Toggle maneuver panel
        self.next_die_idx = 0  # Track next die to resolve in order
        self.discard_selection = []  # Track cards selected for voluntary discard
        self.selecting_target_die_for_card = None  # STEP 6: Special cards (Infusione, Manipolazione) - stores card_id

        # Multi-target attack mode (for per_impulse cards)
        self.multi_target_mode = False
        self.multi_target_card = None
        self.multi_target_remaining_impulses = 0
        self.multi_target_die_idx = None
        self.multi_target_card_idx = None
        self.multi_target_started = False  # True after first impulse used
        self.multi_target_current_effect_idx = 0  # Track which effect we're executing


        # Enemy turn sequencing
        self.current_enemy_idx = 0  # Track which enemy is currently acting
        self.enemy_turn_in_progress = False  # Flag to prevent multiple triggers

        # NEW: Impulse selection for Scarica Mentale
        self.selecting_impulses = False
        self.impulse_die_idx = None
        self.max_impulses = 0
        
        # NEW: Carica Furiosa support
        self.selecting_dice_pair = False
        self.available_dice_pairs = []
        self.charging_state = {
            'active': False,
            'pm_available': 0,
            'hexes_moved': 0,
            'start_pos': None,
            'has_fire_die': False,
            'has_terror_die': False,
            'dice_consumed': []
        }

        # NEW: Multi-effect impulse allocation

        self.allocating_impulses = False
        self.impulse_allocation = {}  # {effect_index: impulses_allocated}
        self.current_effect_idx = 0
        self.remaining_impulses_for_allocation = 0
        self.pending_card_data = None  # Store card/target/dice for execution after allocation

        # Hex map (scaled for 590×440 area at x=280)
        self.hex_size = 32
        self.map_offset_x = 345  # Centered in 590px (280 + 65)
        self.map_offset_y = 170  # Centered in 440px (100 + 70)
        
        # Animation
        self.animation_timer = 0
        self.pulse = 0
        
        # v0.0.3 Fase F: Card tooltip (right-click hold)
        self.tooltip_card_idx = None
        self.tooltip_pos = None
        
        # v0.0.3 Fase F: Terror Swap mode
        self.terror_swap_active = False
        
        # v0.0.3 Fase F: Jolly die selection modal
        self.jolly_selection_active = False
        self.jolly_selection_options = []  # List of available die types
        self.jolly_selection_queue = []  # Queue for multiple GEN_JOLLY cards

        # v0.0.3: ROTATE_TARGET_CD selection modal
        self.rotate_cd_selection_active = False
        self.rotate_cd_selection_cards = []  # List of {slot_idx, card_id, card_name, cd}
    
    def debug_log(self, msg):
        """Write detailed debug info to file"""
        timestamp = datetime.datetime.now().strftime("%H:%M:%S.%f")[:-3]
        self.debug_log_file.write(f"[{timestamp}] {msg}\n")
        self.debug_log_file.flush()  # Ensure immediate write
        
    def new_game(self):
        self.state = GameState()
        
        # v0.0.3: Initialize bag/pool/buffer system
        self.state.init_dice_bag()
        self.state.setup_turn_1()
        
        self.phase = "Upkeep"
        self.log_messages = []
        self.add_log("> Nuovo gioco!")
        self.add_log(f"HP {self.state.player['hp']}/{self.state.player['hp_max']}, PT {self.state.player['pt']}/{self.state.player['pt_max']}")

        # Log v0.0.3 initial resources
        self.add_log(f"<> Active Pool: {len(self.state.active_pool)} dadi")
        self.add_log(f"# Bag: {len(self.state.dice_bag)} dadi rimanenti")
        
        self.reset_selection()
        
    def reset_selection(self):
        self.selected_card_idx = None
        self.selected_dice = []
        self.selected_target = None
        self.current_card = None
        self.current_maneuver = None
        self.valid_targets = []
        self.range_hexes = []
        self.valid_move_hexes = []
        self.show_maneuvers = False
        self.selecting_impulses = False
        self.impulse_die_idx = None
        self.max_impulses = 0
        self.selecting_dice_pair = False
        self.available_dice_pairs = []
        # Multi-effect allocation reset
        self.allocating_impulses = False
        self.impulse_allocation = {}
        self.current_effect_idx = 0
        self.remaining_impulses_for_allocation = 0
        self.pending_card_data = None

    def add_log(self, msg):
        self.log_messages.append(msg)
        if len(self.log_messages) > 25:
            self.log_messages.pop(0)
        try:
            print(msg)
        except UnicodeEncodeError:
            # Fallback for Windows console that doesn't support UTF-8
            print(msg.encode('ascii', 'replace').decode('ascii'))
        # Also write ALL messages to debug.log for post-game analysis
        try:
            self.debug_log_file.write(f"{msg}\n")
            self.debug_log_file.flush()  # Ensure it's written immediately
        except:
            pass  # Ignore errors writing to log file
        if '[DEBUG]' in msg:
            self.debug_log(msg)
        
    def upkeep_phase(self):
        """v0.0.3 FASE 1: Maintenance - Buffer unlock, hand limit, draw"""
        p = self.state.player
        self.add_log("📋 FASE 1: Upkeep")
        
        # STEP 1: Unlock Buffer - Move dice/PM from next_turn_buffer to active_pool
        if self.state.next_turn_buffer:
            pm_gained = 0
            dice_moved = 0
            for obj in self.state.next_turn_buffer:
                if obj.get('type') == 'PM':
                    p['pm'] += obj['value']
                    pm_gained += obj['value']
                else:
                    # Dice object - move to active_pool
                    self.state.active_pool.append(obj)
                    dice_moved += 1
            
            self.state.next_turn_buffer = []
            if pm_gained > 0:
                self.add_log(f"   💎 +{pm_gained} PM dal buffer")
            if dice_moved > 0:
                self.add_log(f"   🎲 {dice_moved} dadi sbloccati dal buffer")
        
        # STEP 2: Calculate hand limit (base 5 + bonus from HAND_LIMIT_+1)
        hand_limit = 5 + self.state.hand_limit_bonus_next_turn
        self.state.hand_limit = hand_limit
        self.state.hand_limit_bonus_next_turn = 0  # Reset bonus

        # STEP 3: Draw up to limit (from deck only)
        drawn = 0
        while len(p['hand']) < hand_limit and len(p['deck']) > 0:
            p['hand'].append(p['deck'].pop(0))
            drawn += 1

        if drawn > 0:
            self.add_log(f"   📝 Pescate {drawn} carte (limite: {hand_limit})")
        elif len(p['hand']) < hand_limit:
            self.add_log(f"   ⚠️ Mazzo vuoto - pescate 0 carte")

        # STEP 4: Reshuffle discard into deck AFTER drawing (v0.0.3 FIX)
        # This prepares the deck for next turn
        if len(p['discard']) > 0:
            p['deck'].extend(p['discard'])
            p['discard'] = []
            import random
            random.shuffle(p['deck'])
            self.add_log(f"   🔄 Scarto rimescolato nel mazzo ({len(p['deck'])} carte)")

        # STEP 5: Soft limit check - if hand > limit, notify (handled in Unkeep)
        if len(p['hand']) > hand_limit:
            self.add_log(f"   ⚠️ Mano eccedente: {len(p['hand'])} > {hand_limit}")
            self.add_log(f"   → Dovrai scartare in fase Unkeep")

        # [DISABLED] Terror Swap phase - skipped for now
        # TODO: Re-enable Terror Swap when feature is polished
        # self.phase = "TerrorSwap"
        # self.add_log("↻ TERROR SWAP - Premi SPAZIO per saltare")

        # Skip directly to Roll phase
        self.phase = "Roll"
        self.roll_phase()
        
    def roll_phase(self):
        """v0.0.3: Roll dice from active_pool (not created fresh)"""
        self.state.dice_pool = []
        self.state.consumed_dice_indices = set()
        self.current_die_idx = 0  # Reset to first die

        self.add_log("🎲 FASE 3: Roll")
        
        # v0.0.3: Roll dice from active_pool
        for die in self.state.active_pool:
            die_def = die['die_def']
            face_idx = random.randint(0, len(die_def['faces']) - 1)
            rolled_face = die_def['faces'][face_idx]
            
            self.state.dice_pool.append({
                'source': 'PLAYER',
                'id': die.get('id', 'player_die'),
                'die_type': die.get('die_type', 'UNKNOWN'),
                'def': die_def,
                'face': rolled_face.copy() if isinstance(rolled_face, dict) else {'type': 'FORZA', 'quantity': rolled_face},
                'initial_impulses': rolled_face['quantity'] if isinstance(rolled_face, dict) else rolled_face,
                'remaining_impulses': rolled_face['quantity'] if isinstance(rolled_face, dict) else rolled_face
            })

        # Roll enemy dice - one die per ENEMY TYPE (not per instance)
        enemy_types_in_play = set()
        for enemy in self.state.enemies:
            if enemy['hp'] > 0:
                type_ref = enemy.get('type_ref', 'ZOMBIE_STANDARD')
                enemy_types_in_play.add(type_ref)
        
        for type_ref in enemy_types_in_play:
            enemy_type = ENEMY_TYPES.get(type_ref)
            if enemy_type and 'die' in enemy_type:
                die_def = enemy_type['die']
                # Roll the die
                rolled_value = random.choice(die_def['faces'])
                action = die_def['actions'].get(rolled_value, {})
                
                self.state.dice_pool.append({
                    'source': 'ENEMY',
                    'type_ref': type_ref,
                    'die_id': die_def['id'],
                    'rolled_value': rolled_value,
                    'action': action,
                    'enemies_affected': [e['id'] for e in self.state.enemies 
                                        if e.get('type_ref', 'ZOMBIE_STANDARD') == type_ref and e['hp'] > 0]
                })
        
        # Backward compatibility: set ai_action_code from first enemy die
        enemy_dice = [d for d in self.state.dice_pool if d['source'] == 'ENEMY']
        if enemy_dice:
            self.state.ai_action_code = enemy_dice[0].get('rolled_value', 1)
        else:
            self.state.ai_action_code = 1

        # Shuffle ALL dice together (player + zombie) - dice order determines action order!
        random.shuffle(self.state.dice_pool)
        
        # Log player dice
        player_dice = [d for d in self.state.dice_pool if d['source'] == 'PLAYER']
        for d in player_dice:
            icon = ICON_MAP.get(d['face']['type'], '•')
            self.add_log(f"   {icon} {d['face']['type']} x{d['face']['quantity']}")
        
        # Log enemy dice
        for d in enemy_dice:
            action_name = d.get('action', {}).get('name', '?')
            self.add_log(f"   🧟 {d['type_ref']}: {action_name}")
        
        self.add_log(f"   📊 {len(player_dice)} dadi giocatore + {len(enemy_dice)} dadi nemici")

        self.phase = "Resolution"
        self.next_die_idx = 0  # Start from first die

        # Handle STUN tokens for player - each STUN token consumes one die automatically
        if 'status' in self.state.player:
            stun_count = 0
            for status in self.state.player['status'][:]:
                if status['type'] == 'STUN':
                    stun_count += 1
                    self.state.player['status'].remove(status)

            if stun_count > 0:
                # Consume first N player dice (STUN tokens)
                dice_consumed = 0
                for i in range(len(self.state.dice_pool)):
                    if dice_consumed >= stun_count:
                        break
                    if self.state.dice_pool[i]['source'] == 'PLAYER':
                        self.state.consumed_dice_indices.add(i)
                        dice_consumed += 1

                if dice_consumed > 0:
                    self.add_log(f"💫 STORDITO! {dice_consumed} dadi consumati automaticamente")

        self.reset_selection()
        
    def play_card(self, card_idx):
        # Block card selection during multi-target mode
        if self.multi_target_mode:
            self.add_log("⚠️ Completa prima la carta corrente (SPAZIO o continua ad attaccare)")
            return

        if card_idx >= len(self.state.player['hand']):
            return

        # If clicking on already selected card, deselect it
        if self.selected_card_idx == card_idx:
            self.add_log(f"❌ Carta deselezionata")
            self.reset_selection()
            return

        card_id = self.state.player['hand'][card_idx]
        card = next((c for c in CARDS if c['id'] == card_id), None)
        if not card:
            return

        self.debug_log("\n" + "="*60)
        self.debug_log(f"CARD SELECTED: {card['name']} (id: {card['id']})")
        self.debug_log(f"  Type: {card['target_type']}")
        self.debug_log(f"  Range: {card.get('range', 'N/A')}")
        self.debug_log(f"  Player pos: {self.state.player['pos']}")

        self.selected_card_idx = card_idx
        self.current_card = card
        self.selected_dice = []
        self.add_log(f"📝 Carta: {card['name']}")
        
        # Check if requires dice pair (Carica Furiosa)
        if card.get('requires_dice_pair'):
            self.debug_log("  SPECIAL: Requires dice pair (Carica Furiosa)")
            self.add_log("")
            self.add_log("═══ CARICA FURIOSA - ISTRUZIONI═══")
            self.add_log("STEP 1: Seleziona 2 DADI CONSECUTIVI")
            self.add_log("        (es: dado [0] e [1] oppure [1] e [2])")
            self.add_log("STEP 2: Clicca su un NEMICO sulla mappa")
            self.add_log("STEP 3: Premi SPAZIO per confermare")
            self.add_log("═══════════════════════════")
            self.add_log("")
        else:
            self.add_log("   → Clicca sui dadi da usare, poi SPAZIO")
        
        # Calculate valid targets for ENEMY cards
        if card['target_type'] == 'ENEMY':
            max_range = card.get('range', 1)
            player_pos = self.state.player['pos']
            
            self.valid_targets = []
            for enemy in self.state.enemies:
                if enemy['hp'] > 0:
                    dist = HexUtils.get_distance(player_pos, enemy['pos'])
                    if dist <= max_range:
                        self.valid_targets.append(enemy['pos'])
            
            self.debug_log(f"  Valid targets calculated: {len(self.valid_targets)}")
            for vt in self.valid_targets:
                enemy_name = next((e['id'] for e in self.state.enemies if e['pos'] == vt), '?')
                self.debug_log(f"    - {enemy_name} at {vt}")
                        
            self.range_hexes = []
            for row in range(1, C['MAP']['ROWS'] + 1):
                for col in range(1, C['MAP']['COLS'] + 1):
                    hex_pos = {'r': row, 'q': col}
                    if HexUtils.get_distance(player_pos, hex_pos) <= max_range:
                        self.range_hexes.append(hex_pos)
        
        # CONO DI FUOCO: Show only ADJACENT hexes for direction selection
        elif card['target_type'] == 'AREA_ENEMY':
            player_pos = self.state.player['pos']
            area_range = card.get('area', {}).get('base_range', 3)

            # Show only ADJACENT hexes (distance 1) to select direction
            self.range_hexes = HexUtils.get_neighbors(player_pos)

            self.add_log(f"   🔥 Cono di Fuoco - Range {area_range}")
            self.add_log("   → STEP 1: Clicca un HEX ADIACENTE per DIREZIONARE")
            self.add_log("   → STEP 2: Premi SPAZIO per confermare")
                        
    def move_player(self, target_hex):
        """Move player to target hex"""
        # Block movement during multi-target mode
        if self.multi_target_mode:
            self.add_log("⚠️ Completa prima la carta corrente (SPAZIO or continua ad attaccare)")
            return

        # Check if charging (Carica Furiosa active)
        is_charging = self.charging_state['active']
        
        # Check if player is adjacent to an enemy (engaged) - movement costs 2 PM
        is_engaged = HexUtils.is_engaged(self.state.player, self.state.enemies)
        move_cost = 2 if is_engaged else 1
        
        if is_charging:
            charge_pm = self.charging_state['pm_available']
            if charge_pm < move_cost:
                if is_engaged:
                    self.add_log(f"⚠️ PM carica insufficienti! (servono {move_cost} PM - adiacente a nemico)")
                else:
                    self.add_log("⚠️ Nessun PM carica rimasto!")
                return
        else:
            if self.state.player['pm'] < move_cost:
                if is_engaged:
                    self.add_log(f"⚠️ PM insufficienti! (servono {move_cost} PM - adiacente a nemico)")
                else:
                    self.add_log("⚠️ Nessun PM rimasto!")
                return
        
        player_pos = self.state.player['pos']
        dist = HexUtils.get_distance(player_pos, target_hex)
        
        # Can only move to adjacent hexes (distance 1)
        if dist != 1:
            self.add_log("⚠️ Troppo lontano! Muoviti solo 1 hex")
            return
            
        # Check if occupied
        for enemy in self.state.enemies:
            if enemy['hp'] > 0 and enemy['pos'] == target_hex:
                self.add_log("⚠️ Hex occupato da nemico!")
                return
                
        # Move
        self.state.player['pos'] = target_hex
        
        # Consume PM (charge PM if charging, normal PM otherwise)
        if is_charging:
            self.charging_state['pm_available'] -= move_cost
            self.charging_state['hexes_moved'] += 1
            remaining = self.charging_state['pm_available']
            hexes_moved = self.charging_state['hexes_moved']
            if is_engaged:
                self.add_log(f"🏃⚡ Carica (disimpegno) a ({target_hex['q']},{target_hex['r']}) - Hex mossi: {hexes_moved}, PM carica: {remaining}")
            else:
                self.add_log(f"🏃⚡ Carica a ({target_hex['q']},{target_hex['r']}) - Hex mossi: {hexes_moved}, PM carica: {remaining}")
        else:
            self.state.player['pm'] -= move_cost
            if is_engaged:
                self.add_log(f"🏃 Disimpegno a ({target_hex['q']},{target_hex['r']}) - PM: {self.state.player['pm']} (costo: {move_cost})")
            else:
                self.add_log(f"🏃 Mosso a ({target_hex['q']},{target_hex['r']}) - PM: {self.state.player['pm']}")
        
        # STEP 8: Removed auto-transition to EnemyTurn - player must press Pass button

        
    def pass_turn(self):
        """End turn - only allowed if no zombie die remaining and no active charge"""
        if self.phase != "Resolution":
            return

        # Check if Carica Furiosa is active
        if self.charging_state.get('active'):
            self.add_log("⚠️ Carica in corso! Muoviti e premi SPAZIO per attaccare")
            return

        # Check if there's an unexecuted zombie die
        for i, die in enumerate(self.state.dice_pool):
            if die['source'] == 'ENEMY' and i not in self.state.consumed_dice_indices:
                self.add_log("⚠️ Devi prima risolvere il dado zombie!")
                return

        self.add_log("⏩ Fine turno volontario")
        self.start_discard_phase()
    
    def execute_maneuver(self, maneuver, die_idx):
        """Execute a maneuver using a specific die"""
        # Block maneuvers during multi-target mode
        if self.multi_target_mode:
            self.add_log("⚠️ Completa prima la carta corrente (SPAZIO o continua ad attaccare)")
            return

        # Check PT cost
        cost = maneuver.get('cost', {})
        if cost.get('extra_pt_flat'):
            if self.state.player['pt'] < cost['extra_pt_flat']:
                self.add_log("⚠️ PT insufficienti!")
                return
                
        self.add_log(f"⚡ {maneuver['name']}")
        
        effect = maneuver['effect']
        effect_type = effect['type']
        
        if effect_type == 'MOVE':
            # Movimento Tattico - Grant PM
            move_range = effect['value']
            self.state.player['pm'] += move_range
            self.add_log(f"   🏃 +{move_range} PM! Totale: {self.state.player['pm']}")
            # Consume 1 impulse
            self.consume_impulses(die_idx, 1)
            
        elif effect_type == 'DAMAGE':
            # Colpo a Distanza
            max_range = effect['range']
            player_pos = self.state.player['pos']
            
            self.valid_targets = []
            for enemy in self.state.enemies:
                if enemy['hp'] > 0:
                    dist = HexUtils.get_distance(player_pos, enemy['pos'])
                    if dist <= max_range:
                        self.valid_targets.append(enemy['pos'])
                        
            if not self.valid_targets:
                self.add_log("   Nessun bersaglio in range!")
                return
                
            self.add_log(f"   → Clicca su un nemico (range {max_range})")
            self.current_maneuver = {'maneuver': maneuver, 'die_idx': die_idx}
            
        elif effect_type == 'DAMAGE_DIRECT':
            # Scarica Mentale - choose number of impulses (costs 1 PT per impulse)
            if not any(e['hp'] > 0 for e in self.state.enemies):
                self.add_log("   Nessun nemico vivo!")
                return
            
            # Get die REMAINING impulses
            die = self.state.dice_pool[die_idx]
            impulses = die.get('remaining_impulses', die['face']['quantity'])
            
            # Check if player has enough PT for at least 1 impulse
            if self.state.player['pt'] < 1:
                self.add_log("   ⚠️ PT insufficienti! (serve 1 PT per impulso)")
                return
            
            # Limit max impulses by available PT (1 PT per impulse)
            max_usable = min(impulses, self.state.player['pt'])
            self.add_log(f"   Scegli quanti impulsi usare (1-{max_usable})")
            self.add_log(f"   ⚠️ Costo: 1 PT per impulso")
            self.selecting_impulses = True
            self.impulse_die_idx = die_idx
            self.max_impulses = max_usable
            self.current_maneuver = {'maneuver': maneuver, 'die_idx': die_idx}
                

        elif effect_type == 'RESTORE_PT':
            # Affrontare le Paure - must discard die WITHOUT using any impulses
            die = self.state.dice_pool[die_idx]

            # Check if die has been used at all
            original_impulses = die['face']['quantity']
            remaining_impulses = die.get('remaining_impulses', original_impulses)

            if remaining_impulses < original_impulses:
                self.add_log("   ❌ Non puoi Affrontare le Paure - hai già usato impulsi!")
                return

            # Die must be unused - consume it entirely
            # NOTE: Affrontare le Paure can exceed PT max ("overheal")
            self.state.player['pt'] += 1
            self.consume_impulses(die_idx, remaining_impulses)  # Consume all
            self.state.consumed_dice_indices.add(die_idx)  # Mark as consumed
            self.return_die_to_bag(die_idx)  # v0.0.3: Return to bag
            self.add_log(f"   +1 PT (PT: {self.state.player['pt']})")
            self.add_log(f"   🎲 Dado Terrore consumato completamente")
                        
    
    def execute_scarica_mentale(self, impulses_used):
        """Execute Scarica Mentale with chosen number of impulses"""
        if not self.current_maneuver:
            return
            
        # Show valid targets
        self.valid_targets = [e['pos'] for e in self.state.enemies if e['hp'] > 0]
        self.add_log(f"   Usando {impulses_used} impulsi  {impulses_used} danni")
        self.add_log("    Clicca su un nemico")
        
        # Store impulses to use
        self.current_maneuver['impulses'] = impulses_used
        
        # Close overlay
        self.selecting_impulses = False

    def activate_charge(self, die1_idx, die2_idx):
        """Activate Carica Furiosa with selected dice pair"""
        die1 = self.state.dice_pool[die1_idx]
        die2 = self.state.dice_pool[die2_idx]
        
        # Check PT if TERRORE die present
        has_terror = (die1['face']['type'] == 'JOLLY' or die2['face']['type'] == 'JOLLY')
        if has_terror and self.state.player['pt'] < 1:
            self.add_log("❌ Dado TERRORE richiede 1 PT!")
            return False
        
        # Calculate charge PM
        impulses1 = die1.get('remaining_impulses', die1['face']['quantity'])
        impulses2 = die2.get('remaining_impulses', die2['face']['quantity'])
        total_pm = impulses1 + impulses2
        
        # Detect die types
        has_fire = (die1['face']['type'] == 'FUOCO' or die2['face']['type'] == 'FUOCO')
        
        # Set charging state
        self.charging_state = {
            'active': True,
            'pm_available': total_pm,
            'hexes_moved': 0,
            'start_pos': self.state.player['pos'].copy(),
            'has_fire_die': has_fire,
            'has_terror_die': has_terror,
            'dice_consumed': [die1_idx, die2_idx]
        }
        
        # Consume both dice
        self.consume_impulses(die1_idx, impulses1)
        self.consume_impulses(die2_idx, impulses2)
        self.state.consumed_dice_indices.add(die1_idx)
        self.state.consumed_dice_indices.add(die2_idx)

        # v0.0.3 FIX: Return consumed dice to bag
        self.return_die_to_bag(die1_idx)
        self.return_die_to_bag(die2_idx)

        # Remove card from hand
        self.remove_card_from_hand(self.selected_card_idx)
        
        # Log activation
        self.add_log("")
        self.add_log("⚡⚔ CARICA ATTIVATA! ⚔⚡")
        self.add_log(f"   🏃 {total_pm} PM per la carica")
        if has_fire:
            self.add_log("   🔥 Dado FUOCO: +1 danno al termine")
        if has_terror:
            self.add_log("   💀 Dado TERRORE: -1 PT al termine")
        self.add_log("")
        self.add_log("📍 Muoviti cliccando sugli hex")
        self.add_log("   SPAZIO per confermare e attaccare")
        
        # Reset selection states
        self.selecting_dice_pair = False
        self.current_card = None
        self.selected_card_idx = None
        
        return True

    def end_charge(self):
        """Complete charge - check for attack opportunity"""
        if not self.charging_state['active']:
            return
        
        hexes_moved = self.charging_state['hexes_moved']
        has_fire = self.charging_state['has_fire_die']
        has_terror = self.charging_state['has_terror_die']
        
        # Apply PT cost if terror die
        if has_terror:
            self.state.player['pt'] -= 1
            self.add_log(f"   💀 -1 PT (Dado Terrore) → PT: {self.state.player['pt']}")

            # Check game over immediately
            if self.check_game_over():
                return
        
        # Check for adjacent enemies
        player_pos = self.state.player['pos']
        adjacent_enemies = []
        for enemy in self.state.enemies:
            if enemy['hp'] > 0:
                if HexUtils.get_distance(player_pos, enemy['pos']) == 1:
                    adjacent_enemies.append(enemy)
        
        if adjacent_enemies:
            # Calculate damage
            base_damage = hexes_moved
            if has_fire:
                base_damage += 1
            
            self.add_log("")
            self.add_log(f"⚔ CARICA CONCLUSA!")
            self.add_log(f"   Mosso: {hexes_moved} hexes")
            self.add_log(f"   Danno disponibile: {base_damage}")
            self.add_log("   → Clicca nemico adiacente per attaccare")
            
            # Show valid targets
            self.valid_targets = [e['pos'] for e in adjacent_enemies]
            
            # Store damage for when target is selected
            self.charging_state['damage_ready'] = base_damage
        else:
            self.add_log("")
            self.add_log(f"⚔ CARICA CONCLUSA (nessun nemico adiacente)")
            self.add_log(f"   Mosso: {hexes_moved} hexes")
            
            # Reset charging state
            self.charging_state['active'] = False
            self.check_end_resolution()

    def execute_multi_target_impulse(self, impulses_used):
        """Execute multi-target attack with chosen number of impulses on selected target.
        
        REFACTORED: Now executes only the CURRENT effect (tracked by multi_target_current_effect_idx).
        This allows the player to use different targets for each effect.
        """
        if not self.multi_target_mode or not hasattr(self, 'impulse_target_enemy'):
            return

        target = self.impulse_target_enemy
        card = self.multi_target_card
        effects = card.get('effects', [])

        # Get current die for fire bonus calculation
        current_die = self.state.dice_pool[self.multi_target_die_idx]
        is_fire_infused = current_die['face']['type'] == 'FUOCO'

        # Get CURRENT effect only (skip non-target effects)
        current_effect = None
        effect_idx = self.multi_target_current_effect_idx
        
        # Find next target-based effect
        while effect_idx < len(effects):
            eff = effects[effect_idx]
            action = eff.get('action', '')
            if action not in ['DRAW', 'SHIELD', 'MOVE']:
                current_effect = eff
                break
            effect_idx += 1
        
        if current_effect is None:
            # No more target-based effects - complete the card
            self.complete_multi_target_card()
            return

        action = current_effect.get('action', '')
        effect_cost = current_effect.get('cost', {}).get('amount', 1)

        # Calculate effect value based on impulses and per_impulse flag
        if current_effect.get('per_impulse'):
            effect_value = current_effect.get('value', 1) * (impulses_used // effect_cost)
        else:
            effect_value = current_effect.get('value', 1)


        # Execute effect based on action type
        if action in ['DAMAGE', 'DAMAGE_FIRE']:
            # Fire bonus from die type - ONLY if using ALL impulses in single allocation
            damage = effect_value
            if is_fire_infused and card.get('type') == 'TERRA':
                # Check if player is using ALL remaining impulses (concentrated attack)
                if impulses_used == self.multi_target_remaining_impulses:
                    damage += 1
                    self.add_log(f"   🔥 Bonus Fuoco: +1 danno (attacco concentrato)!")
                else:
                    self.add_log(f"   ⚠️ Attacco distribuito - bonus fuoco perso")

            self.apply_damage(target, damage)
            self.add_log(f"   ⚔ {damage} danni a {target['id']}! HP: {target['hp']}")

            if target['hp'] == 0:
                self.add_log(f"   💀 {target['id']} eliminato!")

        elif action in ['VULNERABILITY', 'VULNERABILITY_FIRE']:
            if 'status' not in target:
                target['status'] = []

            vuln_status = None
            for status in target['status']:
                if status['type'] == 'VULNERABILITA':
                    vuln_status = status
                    break

            if vuln_status:
                vuln_status['stacks'] = vuln_status.get('stacks', 0) + effect_value
                vuln_status['assigned_turn'] = self.state.turn
            else:
                target['status'].append({'type': 'VULNERABILITA', 'stacks': effect_value, 'assigned_turn': self.state.turn})

            self.add_log(f"   🎯 Vulnerabilità x{effect_value} su {target['id']}")

        # Handle secondary_action (Attacco Strategico shields) - execute per impulse use
        if current_effect.get('secondary_action') == 'SHIELD_SELF':
            shield_value = current_effect.get('secondary_value', 1) * (impulses_used // effect_cost) if current_effect.get('per_impulse') else current_effect.get('secondary_value', 1)
            if 'shields' not in self.state.player:
                self.state.player['shields'] = []
            for _ in range(shield_value):
                self.state.player['shields'].append({'assigned_turn': self.state.turn})
            self.add_log(f"   🛡 +{shield_value} token scudo!")

        # Mark that we've started using the card (can't cancel with ESC anymore)
        self.multi_target_started = True

        # Update remaining impulses
        self.multi_target_remaining_impulses -= impulses_used
        self.consume_impulses(self.multi_target_die_idx, impulses_used)

        # Close selector
        self.selecting_impulses = False
        del self.impulse_target_enemy

        # Check if more impulses available
        if self.multi_target_remaining_impulses > 0:
            # Update valid targets (remove dead enemies)
            player_pos = self.state.player['pos']
            card_range = card.get('range', 1)
            self.valid_targets = [e['pos'] for e in self.state.enemies 
                                  if e['hp'] > 0 and HexUtils.get_distance(player_pos, e['pos']) <= card_range]

            if not self.valid_targets:
                # No more valid targets - try next effect or complete
                self.advance_to_next_effect()
            else:
                # Continue with current effect - player can select another target
                effect_name = action.replace('_', ' ').title()
                self.add_log(f"   {self.multi_target_remaining_impulses} impulsi rimanenti")
                self.add_log(f"   → Clicca nemico per {effect_name}")
                self.add_log(f"   → TAB: passa a effetto successivo")
                self.add_log(f"   → SPAZIO: completa carta")
        else:
            # All impulses used - complete the card
            self.complete_multi_target_card()

    def advance_to_next_effect(self):
        """Advance to the next effect in multi-target mode.
        
        IMPORTANT: Once you advance past an effect, you CAN'T go back!
        Non-target effects (DRAW, SHIELD, MOVE) are executed immediately when encountered,
        using REMAINING impulses. Target effects wait for player input.
        """
        if not self.multi_target_mode:
            return
        
        card = self.multi_target_card
        effects = card.get('effects', [])
        
        # Move to next effect
        self.multi_target_current_effect_idx += 1
        
        # Process effects until we find a target-based one or run out
        while self.multi_target_current_effect_idx < len(effects):
            eff = effects[self.multi_target_current_effect_idx]
            action = eff.get('action', '')
            # v0.0.3 FIX: use cost_impulses, not cost.amount
            effect_cost = eff.get('cost_impulses', eff.get('cost', {}).get('amount', 1))
            
            # Check if it's a non-target effect
            if action in ['DRAW', 'SHIELD', 'MOVE']:
                # Execute immediately if we have enough impulses
                if self.multi_target_remaining_impulses >= effect_cost:
                    self.execute_non_target_effect(eff)
                    # Consume impulses for this effect
                    self.multi_target_remaining_impulses -= effect_cost
                    self.consume_impulses(self.multi_target_die_idx, effect_cost)
                else:
                    self.add_log(f"   (Effetto {action} skippato - servono {effect_cost} impulsi)")
                
                # Move to next effect
                self.multi_target_current_effect_idx += 1
                continue
            else:
                # Found target-based effect - wait for player input
                break
        
        # Check if we're done
        if self.multi_target_current_effect_idx >= len(effects):
            # No more effects - complete the card
            self.add_log("   Tutti gli effetti completati")
            self.complete_multi_target_card()
            return
        
        # Check if we have impulses for the next target effect
        if self.multi_target_remaining_impulses <= 0:
            self.add_log("   Nessun impulso rimanente")
            self.complete_multi_target_card()
            return
        
        # Found next target effect - prompt player
        next_effect = effects[self.multi_target_current_effect_idx]
        effect_name = next_effect.get('action', '').replace('_', ' ').title()
        self.add_log(f"   → Effetto successivo: {effect_name}")
        self.add_log(f"   → Clicca nemico o SPAZIO per completare")

    def execute_non_target_effect(self, effect):
        """Execute a non-target effect (DRAW, SHIELD, MOVE) using remaining impulses"""
        action = effect.get('action', '')
        value = effect.get('value', 1)
        
        if action == 'DRAW':
            for _ in range(value):
                # v0.0.3 FIX: Reshuffle discard if deck empty
                if len(self.state.player['deck']) == 0 and len(self.state.player['discard']) > 0:
                    self.state.player['deck'] = self.state.player['discard'].copy()
                    self.state.player['discard'] = []
                    import random
                    random.shuffle(self.state.player['deck'])
                    self.add_log("   🔄 Mazzo rimescolato")

                if len(self.state.player['deck']) > 0:
                    drawn = self.state.player['deck'].pop(0)
                    self.state.player['hand'].append(drawn)
                    self.add_log("   🃏 Pescata 1 carta!")
                else:
                    self.add_log("   ⚠️ Mazzo e scarto vuoti - impossibile pescare")
        
        elif action == 'SHIELD':
            if 'shields' not in self.state.player:
                self.state.player['shields'] = []
            for _ in range(value):
                self.state.player['shields'].append({'assigned_turn': self.state.turn})
            self.add_log(f"   🛡 +{value} token scudo!")
        
        elif action == 'MOVE':
            self.state.player['pm'] += value
            self.add_log(f"   🏃 +{value} PM!")




    def complete_multi_target_card(self):
        """Complete multi-target card and clean up.
        
        Executes any remaining non-target effects (DRAW, etc.) from the current effect index
        onwards, using REMAINING impulses.
        """
        if not self.multi_target_mode:
            return

        card = self.multi_target_card
        effects = card.get('effects', [])

        # Execute remaining non-target effects (starting from current index)
        # Target effects are skipped (they required player input that wasn't given)
        for idx in range(self.multi_target_current_effect_idx, len(effects)):
            effect = effects[idx]
            action = effect.get('action', '')
            # v0.0.3 FIX: use cost_impulses, not cost.amount
            effect_cost = effect.get('cost_impulses', effect.get('cost', {}).get('amount', 1))

            # Only handle non-target effects here
            if action not in ['DRAW', 'SHIELD', 'MOVE']:
                continue

            # Check if we have enough remaining impulses
            if self.multi_target_remaining_impulses >= effect_cost:
                self.execute_non_target_effect(effect)
                self.multi_target_remaining_impulses -= effect_cost
                self.consume_impulses(self.multi_target_die_idx, effect_cost)
            else:
                self.add_log(f"   (Effetto {action} skippato - servono {effect_cost} impulsi)")



        # Remove card from hand
        self.remove_card_from_hand(self.multi_target_card_idx)

        # Reset multi-target mode
        self.multi_target_mode = False
        self.multi_target_card = None
        self.multi_target_remaining_impulses = 0
        self.multi_target_die_idx = None
        self.multi_target_card_idx = None
        self.multi_target_started = False
        self.multi_target_current_effect_idx = 0
        self.valid_targets = []

        self.check_end_resolution()


    def consume_impulses(self, die_idx, amount):
        """Reduce remaining impulses from a die

        Note: Does NOT automatically mark die as consumed - a die with 0 impulses
        can still have maneuvers available (e.g. Scarica Mentale on Terror die).
        Cards/maneuvers are responsible for marking dice as consumed when appropriate.
        """
        if die_idx >= len(self.state.dice_pool):
            return
        die = self.state.dice_pool[die_idx]
        if 'remaining_impulses' in die:
            die['remaining_impulses'] = max(0, die['remaining_impulses'] - amount)
            if die['remaining_impulses'] == 0:
                self.add_log(f"   🎲 Dado [{die_idx}] senza impulsi (manovre ancora disponibili)")

    def discard_current_die(self):
        """Discard the current die without using its impulses - allows skipping to next die"""
        if self.phase != "Resolution" or not self.state.dice_pool:
            return False

        # Get current die
        current_idx = self.get_current_die_index()
        if current_idx is None:
            self.add_log("   ⚠️ Nessun dado da scartare!")
            return False

        die = self.state.dice_pool[current_idx]

        # Skip enemy dice
        if die['source'] != 'PLAYER':
            self.add_log("   ⚠️ Non puoi scartare dadi nemici!")
            return False

        # Mark as consumed (skipping it)
        self.state.consumed_dice_indices.add(current_idx)
        
        # v0.0.3 FIX: Check if die was used (any impulses consumed)
        initial = die.get('initial_impulses', die['face']['quantity'])
        remaining = die.get('remaining_impulses', die['face']['quantity'])
        was_used = (remaining < initial)
        
        die_type = die.get('die_type')
        icon = ICON_MAP.get(die['face']['type'], '•')
        
        if was_used:
            # Die was used (even partially) → return to bag for future generation
            if die_type:
                self.return_die_to_bag(current_idx)
            self.add_log(f"   🗑️ Dado [{current_idx}] scartato ({icon} {die['face']['type']} x{remaining} impulsi persi)")
            self.add_log(f"   ↩️ → Bag (dado usato)")
        else:
            # Die was NOT used at all → buffer T+1
            if die_type:
                # Find matching die in active_pool and move to buffer
                for i, active_die in enumerate(self.state.active_pool):
                    if active_die.get('die_type') == die_type:
                        moved_die = self.state.active_pool.pop(i)
                        self.state.next_turn_buffer.append(moved_die)
                        break
            self.add_log(f"   🗑️ Dado [{current_idx}] scartato ({icon} {die['face']['type']} x{remaining} impulsi persi)")
            self.add_log(f"   🔮 → Buffer T+1 (disponibile prossimo turno)")

        # get_current_die_index() will automatically find next die
        self.check_end_resolution()
        return True

    def return_die_to_bag(self, die_idx):
        """v0.0.3: Return used die from active_pool back to dice_bag
        
        Called when a die is fully consumed. Finds the matching die in active_pool
        and moves it back to dice_bag for future generation.
        """
        if die_idx >= len(self.state.dice_pool):
            return
        
        consumed_die = self.state.dice_pool[die_idx]
        die_type = consumed_die.get('die_type')
        die_id = consumed_die.get('id')
        
        if not die_type or consumed_die['source'] != 'PLAYER':
            return  # Only return player dice
        
        # Find matching die in active_pool
        for i, active_die in enumerate(self.state.active_pool):
            if active_die.get('id') == die_id or active_die.get('die_type') == die_type:
                # Move from active_pool to dice_bag
                die = self.state.active_pool.pop(i)
                self.state.dice_bag.append(die)
                self.add_log(f"   ↩️ {die_type} torna alla Bag")
                return
        
        # If not found by ID, try to find by type
        for i, active_die in enumerate(self.state.active_pool):
            if active_die.get('die_type') == die_type:
                die = self.state.active_pool.pop(i)
                self.state.dice_bag.append(die)
                self.add_log(f"   ↩️ {die_type} torna alla Bag (by type)")
                return

    # LEGACY: Manual die selection removed - now using sequential current_die_idx system
    def toggle_die_DISABLED(self, die_idx):
        if die_idx >= len(self.state.dice_pool):
            return
        die = self.state.dice_pool[die_idx]
        if die.get('remaining_impulses', die['face']['quantity']) == 0:
            return
        if die['source'] != 'PLAYER':
            return

        # Check sequence constraint - must resolve dice left to right
        if die_idx < self.next_die_idx:
            self.add_log(f"   ⚠️ Dado [{die_idx}] già risolto!")
            return

        # Find the next unresolved die (skip consumed OR exhausted dice)
        while self.next_die_idx < len(self.state.dice_pool):
            current_die = self.state.dice_pool[self.next_die_idx]
            is_enemy_die = current_die['source'] != 'PLAYER'
            # Skip enemy dice first (they don't have 'quantity' field)
            if is_enemy_die:
                self.next_die_idx += 1
                continue
            is_consumed = self.next_die_idx in self.state.consumed_dice_indices
            is_exhausted = current_die.get('remaining_impulses', current_die['face']['quantity']) == 0
            if is_consumed or is_exhausted:
                self.next_die_idx += 1
            else:
                break

        if die_idx != self.next_die_idx:
            self.add_log(f"   ⚠️ Devi risolvere il dado [{self.next_die_idx}] prima!")
            return
            
        if die_idx in self.selected_dice:
            self.selected_dice.remove(die_idx)
            self.add_log(f"   ❌ Dado [{die_idx}] deselezionato")
        else:
            self.selected_dice.append(die_idx)
            icon = ICON_MAP.get(die['face']['type'], '•')
            self.add_log(f"   ✅ Dado [{die_idx}] selezionato ({icon} {die['face']['type']} x{die['face']['quantity']})")
            
            # CARICA FURIOSA: Give feedback on selection
            if self.current_card and self.current_card.get('requires_dice_pair'):
                if len(self.selected_dice) == 1:
                    self.add_log(f"   📌 Ora seleziona il dado CONSECUTIVO:")
                    # Show adjacent dice
                    if die_idx > 0:
                        self.add_log(f"      - Dado [{die_idx-1}] (prima)")
                    if die_idx < len(self.state.dice_pool) - 1:
                        self.add_log(f"      - Dado [{die_idx+1}] (dopo)")
                elif len(self.selected_dice) == 2:
                    dice_indices = sorted(self.selected_dice)
                    self.add_log(f"   🎲 Selezione: [{dice_indices[0]}] + [{dice_indices[1]}]")
                    if dice_indices[1] - dice_indices[0] == 1:
                        self.add_log("   ✅ CONSECUTIVI! Ora clicca su un NEMICO e premi SPAZIO")
                    else:
                        self.add_log(f"   ⚠️ NON consecutivi ({dice_indices[1] - dice_indices[0]} spazi)")
                        self.add_log("   → Deseleziona e riprova con dadi adiacenti")

    def start_impulse_allocation(self, card, target, total_impulses):
        """Start the impulse allocation process for multi-effect cards or per_impulse cards"""
        effects = card.get('effects', [])

        # Check if single-effect card needs allocation (per_impulse cards like Scatto, Difesa Base)
        if len(effects) == 1:
            effect = effects[0]
            if effect.get('per_impulse') and total_impulses > 1:
                # Single per_impulse effect - allow choosing how many impulses to use
                pass  # Continue to allocation
            else:
                # Single effect without per_impulse - no allocation needed
                return False
        elif len(effects) == 0:
            return False

        # Use current die instead of selected_dice (STEP 4 refactoring)
        current_die_idx = self.get_current_die_index()
        if current_die_idx is None:
            self.add_log("⚠️ Nessun dado disponibile!")
            return False

        self.allocating_impulses = True
        self.impulse_allocation = {}
        self.current_effect_idx = 0
        self.remaining_impulses_for_allocation = total_impulses
        self.pending_card_data = {
            'card': card,
            'target': target,
            'card_idx': self.selected_card_idx,
            'dice_indices': [current_die_idx],  # Use only current die
            'total_impulses': total_impulses
        }
        self.add_log(f"📊 Alloca {total_impulses} impulsi tra {len(effects)} effetti")
        return True

    def allocate_impulses_to_effect(self, impulses):
        """Handle user's impulse allocation choice for current effect"""
        if not self.pending_card_data:
            return

        card = self.pending_card_data['card']
        effects = card.get('effects', [])

        # Store allocation for current effect
        self.impulse_allocation[self.current_effect_idx] = impulses
        self.remaining_impulses_for_allocation -= impulses

        current_effect = effects[self.current_effect_idx]
        effect_action = current_effect.get('action', '?')
        if impulses > 0:
            self.add_log(f"   → Effetto {self.current_effect_idx + 1}: {impulses} impulsi")
        else:
            self.add_log(f"   → Effetto {self.current_effect_idx + 1}: saltato")

        # Move to next effect
        self.current_effect_idx += 1

        # Check if more effects to allocate
        if self.current_effect_idx < len(effects) and self.remaining_impulses_for_allocation > 0:
            # Continue allocation
            return

        # All effects allocated or no impulses left - execute card
        self.allocating_impulses = False
        self.execute_card_with_allocation()

    def remove_card_from_hand(self, card_idx):
        """Remove card from hand and place it in cooldown_board or discard pile based on cooldown"""
        if card_idx >= len(self.state.player['hand']):
            return

        card_id = self.state.player['hand'][card_idx]
        card = next((c for c in CARDS if c['id'] == card_id), None)

        if not card:
            self.state.player['hand'].pop(card_idx)
            return

        cooldown = card.get('cooldown', 0)

        if cooldown == 0:
            # No cooldown - goes directly to discard
            self.state.player['discard'].append(card_id)
            self.add_log(f"   📥 {card['name']} → Scarto")
        else:
            # Has cooldown - find empty slot in cooldown_board
            cd_degrees = cooldown * 90  # cooldown 1 = 90°, cooldown 2 = 180°

            # Check for exclusive slot requirement (e.g., FUOCO cards for s4_fire)
            card_type = card.get('type', None)

            placed = False
            for slot in self.state.player['cooldown_board']:
                if slot['card'] is None:
                    # Check if slot is exclusive and matches card type
                    if 'exclusive' in slot:
                        if card_type == slot['exclusive']:
                            slot['card'] = card_id
                            slot['cd'] = cd_degrees
                            placed = True
                            self.add_log(f"   ⏱️ {card['name']} → Cooldown {cd_degrees}°")
                            break
                    else:
                        # Non-exclusive slot, can place any card
                        slot['card'] = card_id
                        slot['cd'] = cd_degrees
                        placed = True
                        self.add_log(f"   ⏱️ {card['name']} → Cooldown {cd_degrees}°")
                        break

            if not placed:
                # No free slot - card goes to discard (overflow fallback)
                self.state.player['discard'].append(card_id)
                self.add_log(f"⚠️ Cooldown board piena! {card['name']} → Scarto")

        # Remove from hand
        self.state.player['hand'].pop(card_idx)

    def execute_card_with_allocation(self):
        """Execute card using pre-allocated impulses"""
        if not self.pending_card_data:
            return

        card = self.pending_card_data['card']
        target_pos = self.pending_card_data['target']
        card_idx = self.pending_card_data['card_idx']
        dice_indices = self.pending_card_data['dice_indices']

        self.add_log(f"🔧 Eseguo {card['name']} con allocazione impulsi")
        if target_pos:
            self.add_log(f"   Target: ({target_pos['q']}, {target_pos['r']})")

        # Find target enemy
        enemy = None
        if target_pos:
            for e in self.state.enemies:
                if e['pos'] == target_pos and e['hp'] > 0:
                    enemy = e
                    break

        # Process effects with allocated impulses
        effects = card.get('effects', [])
        for idx, effect in enumerate(effects):
            allocated = self.impulse_allocation.get(idx, 0)
            action = effect.get('action', '')

            self.add_log(f"   Effetto {idx+1} ({action}): {allocated} impulsi allocati")

            if allocated == 0:
                self.add_log(f"      → Saltato (0 impulsi)")
                continue  # Skipped effect

            effect_cost = effect.get('cost', {}).get('amount', 1)

            # === DISPATCH DINAMICO via execute_effect() ===
            # Costruisce context per l'handler
            ctx = {
                'enemy': enemy,
                'allocated': allocated,
                'effect_cost': effect_cost,
                'dice_indices': dice_indices,
                'card': card,
                'target_pos': target_pos
            }
            
            # Chiama il dispatcher centrale
            execute_effect(self, action, effect, ctx)

        # Consume ONLY the impulses actually used in allocation (not all remaining)
        total_used = sum(self.impulse_allocation.values())
        current_die_idx = dice_indices[0]  # Only one die in new sequential system

        if total_used > 0:
            self.consume_impulses(current_die_idx, total_used)

        # Note: get_current_die_index() will automatically skip consumed dice

        # Remove card from hand (to cooldown_board or discard)
        self.remove_card_from_hand(card_idx)

        # Clear pending data
        self.pending_card_data = None
        self.impulse_allocation = {}

        # Clear AOE temporary data (Cono di Fuoco)
        if hasattr(self, 'aoe_range_bonus'):
            delattr(self, 'aoe_range_bonus')
        if hasattr(self, 'aoe_enemies_hit'):
            delattr(self, 'aoe_enemies_hit')

        self.reset_selection()
        self.check_end_resolution()

    def execute_card(self):
        self.add_log(f"[DEBUG] execute_card() chiamato")
        if not self.current_card:
            self.add_log("⚠️ Seleziona una carta!")
            return

        card = self.current_card
        self.add_log(f"[DEBUG] Carta: {card.get('id')}, Target type: {card.get('target_type')}")

        # Special handling for Carica Furiosa - dice selection UI
        if card.get('requires_dice_pair'):
            self.add_log("")
            self.add_log("⚡⚔ CARICA FURIOSA ⚔⚡")
            self.add_log("   Seleziona 2 dadi PLAYER consecutivi:")
            self.add_log("   - Click dado 1, poi dado 2")
            self.add_log("   - Non possono essere dadi ENEMY")
            self.add_log("   - SPAZIO per confermare")
            
            # Find available dice pairs (consecutive PLAYER dice)
            self.available_dice_pairs = []
            for i in range(len(self.state.dice_pool) - 1):
                die1 = self.state.dice_pool[i]
                die2 = self.state.dice_pool[i + 1]
                
                # Both must be PLAYER (not ENEMY)
                if die1['source'] == 'PLAYER' and die2['source'] == 'PLAYER':
                    # Both must not be consumed
                    if i not in self.state.consumed_dice_indices and (i+1) not in self.state.consumed_dice_indices:
                        self.available_dice_pairs.append([i, i+1])
            
            if not self.available_dice_pairs:
                self.add_log("❌ Nessuna coppia di dadi PLAYER consecutivi disponibile!")
                return
            
            self.add_log(f"   {len(self.available_dice_pairs)} coppie disponibili")
            self.selecting_dice_pair = True
            return
        
        # CONO DI FUOCO: Directional cone attack
        if card['target_type'] == 'AREA_ENEMY':
            # Get current die
            current_die_idx = self.get_current_die_index()
            if current_die_idx is None:
                self.add_log("⚠️ Nessun dado disponibile!")
                return

            current_die = self.state.dice_pool[current_die_idx]

            # Validate die type matches card requirement (FUOCO can pay FORZA)
            required_type = card.get('effects', [{}])[0].get('cost', {}).get('type', 'ANY')
            if not self.can_use_die_for_cost(current_die, required_type):
                self.add_log(f"⚠️ Dado corrente ({current_die['face']['type']}) non può pagare {required_type}!")
                self.add_log(f"   Salta dado con [D] oppure usa una carta compatibile")
                return

            # Must have selected a direction target
            if not self.selected_target:
                self.add_log("❌ Devi selezionare una DIREZIONE per il cono!")
                self.add_log("   → Clicca su un hex per direzionare il cono")
                return

            total_impulses = current_die.get('remaining_impulses', current_die['face']['quantity'])

            # Check if card has multiple effects - use allocation UI
            effects = card.get('effects', [])
            if len(effects) > 1:
                # Start impulse allocation process for AOE card
                if self.start_impulse_allocation(card, self.selected_target, total_impulses):
                    return  # Wait for user to allocate impulses

            # Fallback: simple implementation (should not reach here with current Cono di Fuoco)
            player_pos = self.state.player['pos']
            area_range = card.get('area', {}).get('base_range', 3)
            cone_hexes = HexUtils.get_cone(player_pos, self.selected_target, area_range)

            enemies_hit = []
            for enemy in self.state.enemies:
                if enemy['hp'] > 0:
                    for cone_hex in cone_hexes:
                        if enemy['pos'] == cone_hex:
                            enemies_hit.append(enemy)
                            break

            if not enemies_hit:
                self.add_log("   ⚠️ Nessun nemico nel cono!")
                return

            self.add_log("")
            self.add_log("🔥⚔ CONO DI FUOCO! ⚔🔥")

            damage_per_enemy = total_impulses
            for enemy in enemies_hit:
                self.apply_damage(enemy, damage_per_enemy)
                self.add_log(f"   💥 {enemy['id']}: HP {enemy['hp']}")

            # Consume used impulses from current die
            used = current_die.get('remaining_impulses', current_die['face']['quantity'])
            self.consume_impulses(current_die_idx, used)

            # Note: get_current_die_index() will automatically skip consumed dice

            self.remove_card_from_hand(self.selected_card_idx)
            self.reset_selection()
            self.check_end_resolution()
            return
        
        # For ENEMY cards, need target (unless optional_target is True)
        elif card['target_type'] == 'ENEMY':
            # Get current die
            current_die_idx = self.get_current_die_index()
            if current_die_idx is None:
                self.add_log("⚠️ Nessun dado disponibile!")
                return

            current_die = self.state.dice_pool[current_die_idx]

            # Validate die type matches card requirement (FUOCO can pay FORZA)
            required_type = card.get('effects', [{}])[0].get('cost', {}).get('type', 'ANY')
            if not self.can_use_die_for_cost(current_die, required_type):
                self.add_log(f"⚠️ Dado corrente ({current_die['face']['type']}) non può pagare {required_type}!")
                self.add_log(f"   Salta dado con [D] oppure usa una carta compatibile")
                return

            # Calculate total impulses from current die only
            total_impulses = current_die.get('remaining_impulses', current_die['face']['quantity'])

            effects = card.get('effects', [])

            # Check if card can split attacks between multiple targets (per_impulse cards)
            # Cards like Attacco Base, Attacco Strategico, Attacco di Fuoco
            # These bypass the initial target requirement - target is selected in multi_target_mode
            has_per_impulse = any(eff.get('per_impulse') for eff in effects)
            if has_per_impulse and not card.get('optional_target', False):

                # Enter multi-target mode
                self.multi_target_mode = True
                self.multi_target_card = card
                self.multi_target_remaining_impulses = total_impulses
                self.multi_target_die_idx = current_die_idx
                self.multi_target_card_idx = self.selected_card_idx
                self.multi_target_started = False  # Reset flag for new card
                self.multi_target_current_effect_idx = 0  # Start from first effect

                # Clear card selection UI first (but keep multi_target state)
                self.reset_selection()

                # Calculate valid targets AFTER reset_selection (so they don't get cleared)
                player_pos = self.state.player['pos']
                card_range = card.get('range', 1)
                self.valid_targets = []
                for enemy in self.state.enemies:
                    if enemy['hp'] > 0:
                        dist = HexUtils.get_distance(player_pos, enemy['pos'])
                        if dist <= card_range:
                            self.valid_targets.append(enemy['pos'])

                self.add_log(f"🎯 {card['name']} - {total_impulses} impulsi disponibili")
                self.add_log("   → Clicca sui nemici per attaccare")
                self.add_log("   → SPAZIO per confermare e completare")
                return


            # Check if card has multiple effects - use allocation UI
            if len(effects) > 1:
                # Start impulse allocation process
                if self.start_impulse_allocation(card, self.selected_target, total_impulses):
                    return  # Wait for user to allocate impulses

            # Single effect card - execute directly
            enemy = None
            if self.selected_target:
                for e in self.state.enemies:
                    if e['pos'] == self.selected_target and e['hp'] > 0:
                        enemy = e
                        break

            # For optional_target cards, allow playing without enemy (will skip primary effects, execute secondary_action only)
            if not enemy and not card.get('optional_target', False):
                self.add_log("⚠️ Seleziona un bersaglio!")
                return


            if effects:
                effect = effects[0]
                effect_cost = effect.get('cost', {}).get('amount', 1)

                if effect.get('action') in ['DAMAGE', 'DAMAGE_FIRE']:
                    base_dmg = effect.get('value', 1)
                    if effect.get('per_impulse'):
                        damage = base_dmg * (total_impulses // effect_cost)
                    else:
                        damage = base_dmg

                    # Fire bonus
                    is_fire_infused = current_die['face']['type'] == 'FUOCO'
                    if is_fire_infused and card.get('type') == 'TERRA':
                        damage += 1
                        self.add_log(f"   🔥 Bonus Fuoco: +1 danno!")

                    self.apply_damage(enemy, damage)
                    self.add_log(f"   ⚔ {damage} danni! HP: {enemy['hp']}")
                    if enemy['hp'] == 0:
                        self.add_log(f"   💀 {enemy['id']} eliminato!")

            # Consume used impulses from current die
            used = current_die.get('remaining_impulses', current_die['face']['quantity'])
            self.consume_impulses(current_die_idx, used)

            # Note: get_current_die_index() will automatically skip consumed dice
        
        # Remove card and check end resolution for ENEMY cards
        if card['target_type'] == 'ENEMY':
            self.remove_card_from_hand(self.selected_card_idx)
            self.reset_selection()
            self.check_end_resolution()
            return
                
        elif card['target_type'] == 'SELF':
            # Get current die (skip special cards for now - STEP 6)
            if card['id'] not in ['profondita_mente_oscura', 'infusione_elementale']:
                current_die_idx = self.get_current_die_index()
                if current_die_idx is None:
                    self.add_log("⚠️ Nessun dado disponibile!")
                    return

                current_die = self.state.dice_pool[current_die_idx]

                # Validate die type matches card requirement (FUOCO can pay FORZA)
                required_type = card.get('effects', [{}])[0].get('cost', {}).get('type', 'ANY')
                if not self.can_use_die_for_cost(current_die, required_type):
                    self.add_log(f"⚠️ Dado corrente ({current_die['face']['type']}) non può pagare {required_type}!")
                    self.add_log(f"   Salta dado con [D] oppure usa una carta compatibile")
                    return

                total_impulses = current_die.get('remaining_impulses', current_die['face']['quantity'])

                # Check if card has per_impulse effect - use allocation UI (same as Cono di Fuoco)
                effects = card.get('effects', [])
                if effects and effects[0].get('per_impulse') and card['id'] in ['scatto', 'difesa_base']:
                    # Use same allocation system as multi-effect cards
                    if self.start_impulse_allocation(card, None, total_impulses):
                        return  # Wait for user to allocate impulses
                    else:
                        # No allocation needed (only 1 impulse) - execute directly
                        self.pending_card_data = {
                            'card': card,
                            'target': None,
                            'card_idx': self.selected_card_idx,
                            'dice_indices': [current_die_idx],
                            'total_impulses': total_impulses
                        }
                        self.impulse_allocation = {0: total_impulses}  # Allocate all impulses to first effect
                        self.execute_card_with_allocation()
                        return

            # PROFONDITÀ MENTE OSCURA: Convert JOLLY to FORZA (STEP 6 - special card)
            if card['id'] == 'profondita_mente_oscura':
                # Find Terror die and convert JOLLY to FORZA
                for die in self.state.dice_pool:
                    if die['source'] == 'PLAYER' and die['def']['id'] == 'd8_terrore':
                        if die['face']['type'] == 'JOLLY':
                            qty = die['face']['quantity']
                            die['face']['type'] = 'FORZA'
                            self.add_log(f"   ✨ {qty} JOLLY → {qty} FORZA!")
                            break
            
            # INFUSIONE ELEMENTALE: Convert any FORZA die to FUOCO (STEP 6 - free selection)
            elif card['id'] == 'infusione_elementale':
                # Enter target die selection mode
                self.selecting_target_die_for_card = card['id']
                self.add_log("🔥 INFUSIONE ELEMENTALE")
                self.add_log("   → Clicca su un dado FORZA da convertire in FUOCO")
                self.add_log("   → +1 impulso bonus!")
                return  # Wait for die selection

            # SCATTO and DIFESA BASE are now handled by execute_card_with_allocation()
            # via the start_impulse_allocation() call above

        elif card['target_type'] == 'DIE':
            # MANIPOLAZIONE DESTINO: Reroll die to best face (STEP 6 - free selection)
            if card['id'] == 'manipolazione_destino':
                # Enter target die selection mode
                self.selecting_target_die_for_card = card['id']
                self.add_log("🎲 MANIPOLAZIONE DESTINO")
                self.add_log("   → Clicca su un dado da modificare")
                self.add_log("   → Il dado mostrerà la sua faccia migliore!")
                return  # Wait for die selection

        # Remove card from hand (to cooldown_board or discard)
        self.remove_card_from_hand(self.selected_card_idx)

        self.reset_selection()
        self.check_end_resolution()
        
    def check_end_resolution(self):
        """Check if resolution phase is complete - player must manually press Pass button"""
        player_dice = sum(1 for i, d in enumerate(self.state.dice_pool)
                         if d['source'] == 'PLAYER' and i not in self.state.consumed_dice_indices)

        # No automatic transition - player must press "Passa" to end turn
        # This allows using PM, playing cards without dice, etc.
        if player_dice == 0:
            # Just log a hint, don't auto-transition
            pass

    def start_discard_phase(self):
        """v0.0.3: Start the Unkeep/DiscardPhase (called by Pass button or automatically)"""
        if self.phase != "Resolution":
            return  # Only callable from Resolution phase

        self.add_log("✅ Fine risoluzione")
        # Go to DiscardPhase (v0.0.3: now has payload effects)
        self.phase = "DiscardPhase"
        self.discard_selection = []  # Track cards selected for discard
        self.jolly_selection_queue = []  # v0.0.3 FIX: Reset GEN_JOLLY queue
        self.add_log("")
        self.add_log("═══ FASE 4: UNKEEP ═══")
        self.add_log("Clicca sulle carte da scartare")
        self.add_log("Ogni scarto = +1 PM + effetto speciale!")
        self.add_log("Premi SPAZIO per continuare")
        self.add_log("═══════════════════════")
    
    def generate_die_from_bag(self, die_type, to_buffer=True):
        """v0.0.3: Generate a die from bag to buffer (or active_pool)
        
        Returns True if successful, False if die type not available in bag.
        """
        from gamedata import DICE
        
        # Mapping from die_type code to DICE key
        type_map = {
            'D4_FIRE': 'FUOCO',
            'D6_EARTH': 'TERRA',
            'D8_EARTH': 'TERRA_D8',
            'D8_TERROR': 'TERRORE',
            'D4_TERROR': 'TERRORE_D4',
            'D6_TERROR': 'TERRORE_D6'
        }
        
        # Find die of requested type in bag
        die_idx = next((i for i, d in enumerate(self.state.dice_bag)
                       if d['die_type'] == die_type), None)
        
        if die_idx is None:
            return False  # Die not available in bag
        
        # Remove from bag
        die = self.state.dice_bag.pop(die_idx)
        
        # Add to buffer or active_pool
        if to_buffer:
            self.state.next_turn_buffer.append(die)
        else:
            self.state.active_pool.append(die)
        
        return True
    
    def execute_discard_payload(self, payload, card):
        """v0.0.3: Execute the discard_payload effect of a discarded card

        Returns:
            str - 'SUCCESS', 'FAILURE_SCARCITY', 'PENDING', or 'NONE'
        """
        from gamedata import DICE

        if not payload or payload == 'NONE':
            return 'NONE'

        result = 'SUCCESS'  # Default to success

        if payload == 'GAIN_SHIELD_TOKEN':
            if 'shields' not in self.state.player:
                self.state.player['shields'] = []
            self.state.player['shields'].append({'assigned_turn': self.state.turn})
            self.add_log(f"      🛡 +1 Scudo")

        elif payload == 'HAND_LIMIT_+1':
            self.state.hand_limit_bonus_next_turn += 1
            self.add_log(f"      📚 +1 Limite Mano al prossimo turno")

        elif payload == 'GEN_D4_FIRE':
            if self.generate_die_from_bag('D4_FIRE', to_buffer=True):
                self.add_log(f"      🔥 d4 Fuoco → Buffer")
            else:
                result = 'FAILURE_SCARCITY'
                in_active = sum(1 for d in self.state.active_pool if d.get('die_type') == 'D4_FIRE')
                in_buffer = sum(1 for d in self.state.next_turn_buffer if d.get('die_type') == 'D4_FIRE')
                self.add_log(f"      ❌ d4 Fuoco non disponibile nella Bag")
                if in_active > 0:
                    self.add_log(f"         ({in_active} in Active Pool)")
                if in_buffer > 0:
                    self.add_log(f"         ({in_buffer} in Buffer T+1)")

        elif payload == 'GEN_D6_EARTH':
            if self.generate_die_from_bag('D6_EARTH', to_buffer=True):
                self.add_log(f"      🌍 d6 Terra → Buffer")
            else:
                result = 'FAILURE_SCARCITY'
                in_active = sum(1 for d in self.state.active_pool if d.get('die_type') == 'D6_EARTH')
                in_buffer = sum(1 for d in self.state.next_turn_buffer if d.get('die_type') == 'D6_EARTH')
                self.add_log(f"      ❌ d6 Terra non disponibile nella Bag")
                if in_active > 0:
                    self.add_log(f"         ({in_active} in Active Pool)")
                if in_buffer > 0:
                    self.add_log(f"         ({in_buffer} in Buffer T+1)")

        elif payload == 'GEN_JOLLY':
            # v0.0.3 FIX: Queue GEN_JOLLY requests for sequential processing
            # Add to queue instead of activating modal immediately
            self.jolly_selection_queue.append({
                'card_name': card.get('name', 'Carta'),
                'card_id': card.get('id', 'unknown')
            })
            self.add_log(f"      🎭 GEN_JOLLY accodato (#{len(self.jolly_selection_queue)})")
            result = 'PENDING'  # Result determined later

        elif payload == 'ROTATE_TARGET_CD':
            # v0.0.3: Collect cards in cooldown for user selection
            cards_in_cd = []
            for slot_idx, slot in enumerate(self.state.player['cooldown_board']):
                if slot['card'] is not None and slot['cd'] > 0:
                    card_id = slot['card']
                    card_obj = next((c for c in CARDS if c['id'] == card_id), None)
                    card_name = card_obj['name'] if card_obj else card_id
                    cards_in_cd.append({
                        'slot_idx': slot_idx,
                        'card_id': card_id,
                        'card_name': card_name,
                        'cd': slot['cd']
                    })

            if cards_in_cd:
                # Activate modal for user selection
                self.rotate_cd_selection_active = True
                self.rotate_cd_selection_cards = cards_in_cd
                self.add_log(f"      🔄 Scegli carta da ricaricare ({len(cards_in_cd)} disponibili)")
                result = 'PENDING'  # Result determined when user selects
            else:
                self.add_log(f"      ⚠️ Nessuna carta in cooldown da ricaricare")
                result = 'FAILURE_NO_TARGET'

        elif payload == 'ROTATE_ALL_CD':
            self.rotate_all_cooldown_cards()

        return result
    
    def process_jolly_queue(self):
        """v0.0.3 FIX: Process next GEN_JOLLY request from queue"""
        if not self.jolly_selection_queue:
            return False  # Queue empty

        # Get available dice from bag
        available_dice = []
        seen_types = set()
        for die in self.state.dice_bag:
            die_type = die.get('die_type')
            if die_type and die_type not in seen_types:
                available_dice.append(die_type)
                seen_types.add(die_type)

        if available_dice:
            # Activate modal for first request in queue
            card_info = self.jolly_selection_queue[0]
            self.jolly_selection_active = True
            self.jolly_selection_options = available_dice
            self.add_log(f"   🎭 {card_info['card_name']}: Scegli dado dalla Bag")
            return True
        else:
            # No dice available - skip this request
            card_info = self.jolly_selection_queue.pop(0)
            in_active = len(self.state.active_pool)
            in_buffer = sum(1 for d in self.state.next_turn_buffer if isinstance(d, dict) and 'die_type' in d)
            self.add_log(f"   ❌ {card_info['card_name']}: Nessun dado nella Bag")
            if in_active > 0:
                self.add_log(f"      ({in_active} in Active Pool)")
            if in_buffer > 0:
                self.add_log(f"      ({in_buffer} in Buffer T+1)")
            # Try next in queue recursively
            return self.process_jolly_queue()

    def rotate_all_cooldown_cards(self):
        """v0.0.3: Rotate ALL cards in cooldown by 90 degrees"""
        rotated = 0
        for slot in self.state.player['cooldown_board']:
            if slot['card'] is not None and slot['cd'] > 0:
                slot['cd'] = max(0, slot['cd'] - 90)
                rotated += 1
        
        if rotated > 0:
            self.add_log(f"      🔄 {rotated} carte in cooldown ricaricate!")
        else:
            self.add_log(f"      ⚠️ Nessuna carta in cooldown")

    def check_game_over(self):
        """Check victory/defeat conditions immediately

        Returns:
            bool - True if game ended, False otherwise
        """
        # Check defeat: HP <= 0
        if self.state.player['hp'] <= 0:
            self.add_log("💀 SCONFITTA! HP esauriti!")
            self.state.ended = True
            self.state.result = 'DEFEAT_HP'
            self.phase = "GameOver"
            # v0.0.3: Save telemetry session
            self.state.tracker.save_session(
                result='DEFEAT_HP',
                final_context=self.state.tracker.get_context_snapshot(self.state)
            )
            return True

        # Check defeat: PT <= 0
        if self.state.player['pt'] <= 0:
            self.add_log("💀 SCONFITTA! PT esauriti!")
            self.state.ended = True
            self.state.result = 'DEFEAT_PT'
            self.phase = "GameOver"
            # v0.0.3: Save telemetry session
            self.state.tracker.save_session(
                result='DEFEAT_PT',
                final_context=self.state.tracker.get_context_snapshot(self.state)
            )
            return True

        # Check victory: all enemies dead
        if all(e['hp'] <= 0 for e in self.state.enemies):
            self.add_log("🎉 VITTORIA! Tutti i nemici sono stati sconfitti!")
            self.state.ended = True
            self.state.result = 'VICTORY'
            self.phase = "GameOver"
            # v0.0.3: Save telemetry session
            self.state.tracker.save_session(
                result='VICTORY',
                final_context=self.state.tracker.get_context_snapshot(self.state)
            )
            return True

        return False

    def apply_damage(self, target, damage, source_enemy=None, ai_effect=None):
        """Apply damage to target, consuming vulnerability and shields token-by-token

        Token consumption rules:
        - Each VULNERABILITY token multiplies ONE incoming damage x2, then is consumed
        - Shields are sorted by assigned_turn (oldest first)
        - Each SHIELD token absorbs ONE damage, then is consumed
        - Remaining damage goes to HP

        Args:
            target: dict - The target entity (player or enemy)
            damage: int - Amount of damage to apply
            source_enemy: dict - The attacking enemy (for effect-based healing)
            ai_effect: str - Effect type from ZOMBIE_AI (e.g., 'HEAL_SELF_1', 'FEAR_1')

        Returns:
            int - Actual HP damage dealt (after shields)
        """
        if damage <= 0:
            return 0

        # Initialize status and shields if not present
        if 'status' not in target:
            target['status'] = []
        if 'shields' not in target:
            target['shields'] = []

        # Sort status by assigned_turn (oldest first)
        target['status'].sort(key=lambda s: s.get('assigned_turn', 0))

        # Process damage point by point with vulnerability tokens
        total_damage = 0
        vulnerability_tokens_consumed = 0

        for i in range(damage):
            # Check if there's a vulnerability token to consume
            vuln_found = False
            for status in target['status'][:]:
                if status['type'] == 'VULNERABILITA' and status.get('stacks', 0) > 0:
                    # Consume one vulnerability token
                    status['stacks'] -= 1
                    vulnerability_tokens_consumed += 1
                    total_damage += 2  # This damage point becomes 2
                    vuln_found = True

                    # Remove status if no stacks left
                    if status['stacks'] <= 0:
                        target['status'].remove(status)
                    break

            if not vuln_found:
                total_damage += 1  # Normal damage

        # v0.0.3 FIX: Show remaining vuln stacks after consumption
        remaining_vuln = sum(s.get('stacks', 0) for s in target['status'] if s.get('type') == 'VULNERABILITA')
        if vulnerability_tokens_consumed > 0:
            self.add_log(f"   ⚠️ VULN: -{vulnerability_tokens_consumed} stack → {total_damage} danni totali (rimasti: {remaining_vuln})")

        # Now process shields (sorted by assigned_turn, oldest first)
        remaining_damage = total_damage
        shields_absorbed = 0

        # Sort shields by assigned_turn (oldest first)
        target['shields'].sort(key=lambda s: s.get('assigned_turn', 0))

        for shield in target['shields'][:]:
            if remaining_damage <= 0:
                break
            # Each shield token absorbs 1 damage
            shields_absorbed += 1
            remaining_damage -= 1
            target['shields'].remove(shield)

        # v0.0.3 FIX: Show remaining shields after absorption
        remaining_shields = len(target['shields'])
        if shields_absorbed > 0:
            self.add_log(f"   🛡 SHIELD: -{shields_absorbed} token (rimasti: {remaining_shields})")

        # Apply remaining damage to HP
        hp_damage = 0
        if remaining_damage > 0:
            hp_before = target['hp']
            target['hp'] = max(0, target['hp'] - remaining_damage)
            hp_damage = hp_before - target['hp']

            if hp_damage > 0:
                self.add_log(f"   💥 {hp_damage} danni a HP")

        # Handle AI effects based on effect type
        if source_enemy and hp_damage > 0 and ai_effect:
            # HEAL_SELF_1: enemy heals 1 HP per HP damage dealt
            if ai_effect == 'HEAL_SELF_1':
                max_hp = source_enemy.get('hp_max', 4)
                heal_amount = min(1, max_hp - source_enemy['hp'])
                if heal_amount > 0:
                    source_enemy['hp'] += heal_amount
                    self.add_log(f"   🩹 {source_enemy['id']} si cura di {heal_amount} HP (Morso Rigenerante)!")

        # FEAR_1: inflicts 1 PT loss
        if ai_effect == 'FEAR_1' and target == self.state.player and hp_damage > 0:
            pt_loss = 1
            old_pt = self.state.player['pt']
            self.state.player['pt'] = max(0, self.state.player['pt'] - pt_loss)
            if old_pt != self.state.player['pt']:
                self.add_log(f"   😱 Terrore! -{pt_loss} PT (Attacco Spaventoso)")

        # v0.0.3: Telemetry - log player damage taken
        if target == self.state.player and (hp_damage > 0 or shields_absorbed > 0):
            source_id = source_enemy.get('id', 'enemy') if source_enemy else 'unknown'
            damage_type = 'FEAR' if ai_effect == 'FEAR_1' else 'PHYSICAL'
            self.state.tracker.log_damage_taken(
                source_id=source_id,
                damage=hp_damage,
                damage_type=damage_type,
                shields_absorbed=shields_absorbed,
                context=self.state.tracker.get_context_snapshot(self.state)
            )

        # Check game over immediately after any damage
        self.check_game_over()

        return hp_damage
        
    def execute_enemy_turn(self):
        """Start enemy turn - process first enemy"""
        if self.enemy_turn_in_progress:
            return  # Already processing

        self.add_log("🧟 Turno Nemici")

        ai_action = Z.get(self.state.ai_action_code)
        if not ai_action:
            self.next_turn()
            return

        self.add_log(f"   Azione: {ai_action['name']}")
        self.current_enemy_idx = 0
        self.enemy_turn_in_progress = True

        # Process first enemy
        self.process_single_enemy(ai_action)

    def process_single_enemy(self, ai_action):
        """Process a single enemy's turn, then schedule next enemy"""
        self.add_log(f"⚙️ [DEBUG] process_single_enemy chiamato, idx={self.current_enemy_idx}/{len(self.state.enemies)}")

        # Find next alive enemy
        while self.current_enemy_idx < len(self.state.enemies):
            enemy = self.state.enemies[self.current_enemy_idx]
            if enemy['hp'] > 0:
                self.add_log(f"⚙️ [DEBUG] Trovato nemico vivo: {enemy['id']}")
                break
            self.add_log(f"⚙️ [DEBUG] Nemico {self.current_enemy_idx} morto, salto")
            self.current_enemy_idx += 1

        # Check if all enemies processed
        if self.current_enemy_idx >= len(self.state.enemies):
            self.add_log(f"⚙️ [DEBUG] Tutti i nemici processati, chiamo finish_enemy_turn()")
            self.finish_enemy_turn()
            return

        enemy = self.state.enemies[self.current_enemy_idx]
        self.add_log(f"")
        self.add_log(f"🧟 {enemy['id']} si attiva")
        self.add_log(f"⚙️ [DEBUG] Posizione iniziale: ({enemy['pos']['q']}, {enemy['pos']['r']}) HP: {enemy['hp']}")

        ai_effect = ai_action.get('effect')

        if ai_action['action'] == 'MOVE_ATTACK':
            player_pos = self.state.player['pos']

            # Movement (zombies move up to 2 hexes per turn)
            distance_before = HexUtils.get_distance(enemy['pos'], player_pos)
            if distance_before > 1:
                old_pos = enemy['pos'].copy()
                # Move up to 2 times (2 PM equivalent)
                for _ in range(2):
                    if HexUtils.get_distance(enemy['pos'], player_pos) > 1:
                        proposed_pos = HexUtils.move_towards(enemy['pos'], player_pos)

                        # Check if proposed position is already occupied by another zombie
                        is_blocked = False
                        for other_enemy in self.state.enemies:
                            if other_enemy['hp'] > 0 and other_enemy != enemy:
                                if other_enemy['pos']['q'] == proposed_pos['q'] and other_enemy['pos']['r'] == proposed_pos['r']:
                                    is_blocked = True
                                    break

                        # If blocked, try to find an alternative path
                        if is_blocked:
                            # Get all neighbors and find the best free ones that improve distance
                            neighbors = HexUtils.get_neighbors(enemy['pos'])
                            best_alternatives = []
                            current_distance = HexUtils.get_distance(enemy['pos'], player_pos)
                            best_distance = float('inf')

                            for neighbor in neighbors:
                                # Check if neighbor is free
                                neighbor_free = True
                                for other_enemy in self.state.enemies:
                                    if other_enemy['hp'] > 0 and other_enemy != enemy:
                                        if other_enemy['pos']['q'] == neighbor['q'] and other_enemy['pos']['r'] == neighbor['r']:
                                            neighbor_free = False
                                            break

                                # Only consider neighbors that REDUCE distance (closer than current position)
                                if neighbor_free:
                                    neighbor_dist = HexUtils.get_distance(neighbor, player_pos)
                                    # Must be closer than current position
                                    if neighbor_dist < current_distance:
                                        if neighbor_dist < best_distance:
                                            # Found better option - reset list
                                            best_distance = neighbor_dist
                                            best_alternatives = [neighbor]
                                        elif neighbor_dist == best_distance:
                                            # Found equivalent option at same distance - add to list
                                            best_alternatives.append(neighbor)

                            # Use alternative path if found (randomly choose among best equivalents)
                            if best_alternatives:
                                enemy['pos'] = random.choice(best_alternatives)
                            else:
                                # No valid move, stop trying
                                break
                        else:
                            # Path is clear, move normally
                            enemy['pos'] = proposed_pos

                distance_after = HexUtils.get_distance(enemy['pos'], player_pos)
                if old_pos != enemy['pos']:
                    self.add_log(f"   👣 Si muove verso il giocatore (distanza: {distance_before} → {distance_after})")
                    self.add_log(f"⚙️ [DEBUG] Posizione finale: ({enemy['pos']['q']}, {enemy['pos']['r']})")

            # Attack if adjacent
            if HexUtils.get_distance(enemy['pos'], player_pos) == 1:
                damage = ai_action.get('damage', 1)

                # BONUS_DMG_ADJ_ZOMBIES: +1 damage for each other adjacent zombie
                if ai_effect == 'BONUS_DMG_ADJ_ZOMBIES':
                    adj_zombies = 0
                    for other_enemy in self.state.enemies:
                        if other_enemy['id'] != enemy['id'] and other_enemy['hp'] > 0:
                            if HexUtils.get_distance(other_enemy['pos'], player_pos) == 1:
                                adj_zombies += 1
                    if adj_zombies > 0:
                        damage += adj_zombies
                        self.add_log(f"   🧟 Orda! +{adj_zombies} danno (zombie adiacenti)")

                self.add_log(f"   ⚔ Attacca per {damage} danni")

                # Pass effect type to apply_damage for HEAL_SELF_1 and FEAR_1 handling
                self.apply_damage(self.state.player, damage, source_enemy=enemy, ai_effect=ai_effect)

                # Check game over (done inside apply_damage)
                if self.phase == "GameOver":
                    return
            else:
                self.add_log(f"   ❌ Non può attaccare (troppo lontano)")

        elif ai_action['action'] == 'DEFEND':
            shields = ai_action.get('shields', 1)
            if 'shields' not in enemy:
                enemy['shields'] = []
            # Create N separate shield tokens
            for _ in range(shields):
                enemy['shields'].append({'assigned_turn': self.state.turn})
            self.add_log(f"   🛡 Ottiene +{shields} token scudo")

        # Schedule next enemy with delay
        self.current_enemy_idx += 1
        self.add_log(f"⚙️ [DEBUG] Schedulato timer per prossimo nemico (idx={self.current_enemy_idx})")
        pygame.time.set_timer(pygame.USEREVENT + 1, 600)  # 0.6 second delay (reduced from 1.2s)

    def finish_enemy_turn(self):
        """Called when all enemies have acted"""
        self.add_log(f"⚙️ [DEBUG] finish_enemy_turn chiamato")

        # Print all enemy states
        for i, e in enumerate(self.state.enemies):
            self.add_log(f"⚙️ [DEBUG] Enemy {i}: {e['id']} at ({e['pos']['q']},{e['pos']['r']}) HP={e['hp']}")

        self.enemy_turn_in_progress = False

        # Disable the enemy sequence timer
        pygame.time.set_timer(pygame.USEREVENT + 1, 0)
        self.add_log(f"⚙️ [DEBUG] Timer sequenza nemici disabilitato")

        self.add_log("")

        # Check win/lose (should be already checked in apply_damage, but double-check)
        if self.check_game_over():
            return

        # Consume AI die (visually - it's recreated each turn anyway)
        self.add_log("🎲 Dado AI consumato")
        self.add_log(f"⚙️ [DEBUG] Chiamo next_turn()")

        self.next_turn()

    def execute_enemy_turn_inline(self):
        """Execute enemy turn inline during Resolution phase (STEP 7)

        This processes enemies synchronously without changing phase or using timers.
        Called when current die is ENEMY. Uses action stored in the die itself.
        """
        # Get current enemy die
        current_die_idx = self.get_current_die_index()
        if current_die_idx is None:
            return
            
        current_die = self.state.dice_pool[current_die_idx]
        if current_die['source'] != 'ENEMY':
            return
        
        # Get action from the die (already contains the rolled action data)
        ai_action = current_die.get('action', {})
        if not ai_action:
            self.add_log("⚠️ Nessuna azione AI disponibile")
            self.state.consumed_dice_indices.add(current_die_idx)
            self.advance_to_next_die()
            return

        # Get the type and affected enemies
        type_ref = current_die.get('type_ref', 'ZOMBIE_STANDARD')
        enemies_affected = current_die.get('enemies_affected', [])
        
        self.add_log(f"   Azione: {ai_action.get('name', '?')}")
        ai_effect = ai_action.get('effect')
        action_type = ai_action.get('type', 'MOVE_ATTACK')  # New: use 'type' instead of 'action'

        # Process only enemies of this die's type
        for enemy in self.state.enemies:
            if enemy['hp'] <= 0:
                continue
            
            # Check if this enemy is affected by this die (same type)
            enemy_type_ref = enemy.get('type_ref', 'ZOMBIE_STANDARD')
            if enemy_type_ref != type_ref:
                continue

            self.add_log(f"")
            self.add_log(f"🧟 {enemy['id']} si attiva")

            # Check for STUN tokens - each token makes the enemy skip one turn
            if 'status' in enemy:
                stun_found = False
                for status in enemy['status'][:]:
                    if status['type'] == 'STUN':
                        # Consume one STUN token
                        enemy['status'].remove(status)
                        self.add_log(f"   💫 STORDITO! {enemy['id']} salta il turno")
                        stun_found = True
                        break

                if stun_found:
                    continue  # Skip this enemy's turn

            if action_type == 'MOVE_ATTACK':
                player_pos = self.state.player['pos']

                # Movement (zombies move up to 2 hexes per turn)
                distance_before = HexUtils.get_distance(enemy['pos'], player_pos)
                if distance_before > 1:
                    old_pos = enemy['pos'].copy()
                    # Move up to 2 times
                    for _ in range(2):
                        if HexUtils.get_distance(enemy['pos'], player_pos) > 1:
                            proposed_pos = HexUtils.move_towards(enemy['pos'], player_pos)

                            # Check collision with other zombies
                            is_blocked = False
                            for other_enemy in self.state.enemies:
                                if other_enemy['hp'] > 0 and other_enemy != enemy:
                                    if other_enemy['pos']['q'] == proposed_pos['q'] and other_enemy['pos']['r'] == proposed_pos['r']:
                                        is_blocked = True
                                        break

                            if is_blocked:
                                # Try alternative path
                                neighbors = HexUtils.get_neighbors(enemy['pos'])
                                best_alternatives = []
                                current_distance = HexUtils.get_distance(enemy['pos'], player_pos)
                                best_distance = float('inf')

                                for neighbor in neighbors:
                                    neighbor_free = True
                                    for other_enemy in self.state.enemies:
                                        if other_enemy['hp'] > 0 and other_enemy != enemy:
                                            if other_enemy['pos']['q'] == neighbor['q'] and other_enemy['pos']['r'] == neighbor['r']:
                                                neighbor_free = False
                                                break

                                    if neighbor_free:
                                        dist = HexUtils.get_distance(neighbor, player_pos)
                                        if dist < best_distance:
                                            best_distance = dist
                                            best_alternatives = [neighbor]
                                        elif dist == best_distance:
                                            best_alternatives.append(neighbor)

                                if best_alternatives:
                                    import random
                                    enemy['pos'] = random.choice(best_alternatives)
                            else:
                                enemy['pos'] = proposed_pos

                    distance_after = HexUtils.get_distance(enemy['pos'], player_pos)
                    self.add_log(f"   📍 Movimento: distanza {distance_before} → {distance_after}")

                # Attack if adjacent
                if HexUtils.get_distance(enemy['pos'], player_pos) <= 1:
                    base_damage = ai_action.get('damage', 1)

                    # Bonus damage if adjacent zombies
                    if ai_effect == 'BONUS_DMG_ADJ_ZOMBIES':
                        adjacent_count = 0
                        for other in self.state.enemies:
                            if other['hp'] > 0 and other != enemy:
                                if HexUtils.get_distance(other['pos'], player_pos) <= 1:
                                    adjacent_count += 1
                        if adjacent_count > 0:
                            base_damage += adjacent_count
                            self.add_log(f"   💪 Attacco Orda: +{adjacent_count} danno (zombies adiacenti)")

                    # Apply damage with effect
                    self.apply_damage(self.state.player, base_damage, ai_effect=ai_effect)
                    self.add_log(f"   ⚔ Attacco! {base_damage} danni → HP: {self.state.player['hp']}")
                    
                    # Check game over immediately
                    if self.state.player['hp'] <= 0:
                        self.add_log("💀 SCONFITTA!")
                        self.phase = "GameOver"
                        return

                    # HEAL effect
                    if ai_effect == 'HEAL_SELF_1':
                        enemy['hp'] = min(enemy['hp'] + 1, enemy['hp_max'])
                        self.add_log(f"   💚 {enemy['id']} si rigenera! HP: {enemy['hp']}")

            elif action_type == 'DEFEND':
                # Zombie gains shield tokens
                shields = ai_action.get('shields', 1)
                if 'shields' not in enemy:
                    enemy['shields'] = []
                for _ in range(shields):
                    enemy['shields'].append({'assigned_turn': self.state.turn})
                self.add_log(f"   🛡 Ottiene +{shields} scudo")

        self.add_log("🧟 === FINE TURNO ZOMBIE ===")

        self.add_log("")

        # Check game over
        if self.check_game_over():
            return

        # Consume zombie die and advance
        current_die_idx = self.get_current_die_index()
        if current_die_idx is not None:
            self.state.consumed_dice_indices.add(current_die_idx)
            self.advance_to_next_die()
            self.add_log("🎲 Dado zombie consumato - continua con i dadi rimanenti")

        self.check_end_resolution()

    def log_status_report(self):
        """v0.0.3 FIX: Log detailed status report for debugging"""
        p = self.state.player

        self.add_log("═══ REPORT STATI ═══")

        # Player status
        p_shields = len(p.get('shields', []))
        p_status = p.get('status', [])
        p_vuln = sum(s.get('stacks', 0) for s in p_status if s.get('type') == 'VULNERABILITA')
        p_stun = sum(1 for s in p_status if s.get('type') == 'STUN')

        player_parts = []
        if p_shields > 0:
            player_parts.append(f"🛡×{p_shields}")
        if p_vuln > 0:
            player_parts.append(f"⚠️VULN×{p_vuln}")
        if p_stun > 0:
            player_parts.append(f"💫STUN×{p_stun}")

        if player_parts:
            self.add_log(f"  Giocatore: {' '.join(player_parts)}")
        else:
            self.add_log(f"  Giocatore: Nessuno stato attivo")

        # Enemy status
        for enemy in self.state.enemies:
            if enemy['hp'] <= 0:
                continue

            e_shields = len(enemy.get('shields', []))
            e_status = enemy.get('status', [])
            e_vuln = sum(s.get('stacks', 0) for s in e_status if s.get('type') == 'VULNERABILITA')
            e_stun = sum(1 for s in e_status if s.get('type') == 'STUN')

            enemy_parts = []
            if e_shields > 0:
                enemy_parts.append(f"🛡×{e_shields}")
            if e_vuln > 0:
                enemy_parts.append(f"⚠️VULN×{e_vuln}")
            if e_stun > 0:
                enemy_parts.append(f"💫STUN×{e_stun}")

            if enemy_parts:
                self.add_log(f"  {enemy['id']}: {' '.join(enemy_parts)}")
            else:
                self.add_log(f"  {enemy['id']}: Nessuno stato attivo")

        self.add_log("═══════════════════")

    def next_turn(self):
        """Advance to next turn with proper cleanup"""
        # v0.0.3: Telemetry - log turn end before cleanup
        self.state.tracker.log_turn_end(
            turn_number=self.state.turn,
            context=self.state.tracker.get_context_snapshot(self.state)
        )

        # CRITICAL: Call cleanup phase BEFORE advancing turn
        self.cleanup_phase()

        # v0.0.3 FIX: Log status report at end of turn
        self.log_status_report()

        self.state.turn += 1
        self.phase = "Upkeep"
        self.add_log(f"\n--- TURNO {self.state.turn} ---")

        # v0.0.3: Telemetry - log turn start and update tracker
        self.state.tracker.set_turn(self.state.turn)
        self.state.tracker.log_turn_start(
            turn_number=self.state.turn,
            context=self.state.tracker.get_context_snapshot(self.state)
        )
        
    def cleanup_phase(self):
        """Cleanup phase: discard CD=0 cards, rotate cooldowns, reshuffle deck"""
        p = self.state.player

        # Cooldown Board Processing - CORRECT SEQUENCE:
        # 1. First: discard cards already at 0°
        # 2. Then: rotate remaining cards by 90°
        
        # STEP 1: Discard cards at 0°
        for slot in p['cooldown_board']:
            if slot['card'] is not None and slot['cd'] == 0:
                card_id = slot['card']
                card = next((c for c in CARDS if c['id'] == card_id), None)
                card_name = card['name'] if card else card_id
                
                p['discard'].append(card_id)
                slot['card'] = None
                slot['cd'] = 0
                self.add_log(f"   📥 {card_name} → Scarto (cooldown finito)")
        
        # STEP 2: Rotate remaining cards by 90°
        for slot in p['cooldown_board']:
            if slot['card'] is not None and slot['cd'] > 0:
                card_id = slot['card']
                card = next((c for c in CARDS if c['id'] == card_id), None)
                card_name = card['name'] if card else card_id
                
                old_cd = slot['cd']
                slot['cd'] -= 90
                self.add_log(f"   ⏱️ {card_name}: {old_cd}° → {slot['cd']}°")

        # CRITICAL: Deck Reshuffling
        if len(p['deck']) == 0 and len(p['discard']) > 0:
            self.add_log("📦 Mazzo vuoto - Rimescolamento scarti...")
            p['deck'] = p['discard'].copy()
            p['discard'] = []
            random.shuffle(p['deck'])
            self.add_log(f"   ✅ {len(p['deck'])} carte rimescolate nel mazzo")
        
        # Shield expiration - shields last until end of NEXT turn (assigned T0 -> expire end of T1)
        # Per regole.md: "Scadono naturalmente alla fine del turno successivo a quello di assegnazione"
        if 'shields' in p:
            expired_shields = [s for s in p['shields'] if self.state.turn - s.get('assigned_turn', self.state.turn) >= 1]
            p['shields'] = [s for s in p['shields'] if self.state.turn - s.get('assigned_turn', self.state.turn) < 1]
            if expired_shields:
                total_expired = len(expired_shields)  # Count tokens, not sum of 'value'
                self.add_log(f"   🛡 {total_expired} scudi scaduti")
        
        # Status expiration - status effects last until end of NEXT turn (same as shields)
        if 'status' in p:
            expired_status = [s for s in p['status'] if self.state.turn - s.get('assigned_turn', self.state.turn) >= 1]
            p['status'] = [s for s in p['status'] if self.state.turn - s.get('assigned_turn', self.state.turn) < 1]
            if expired_status:
                for status in expired_status:
                    status_type = status.get('type', 'UNKNOWN')
                    self.add_log(f"   ⏱️ {status_type} scaduto")
        
        for enemy in self.state.enemies:
            # Enemy shields expiration (same rule as player)
            if 'shields' in enemy:
                enemy['shields'] = [s for s in enemy['shields'] if self.state.turn - s.get('assigned_turn', self.state.turn) < 1]
            # Enemy status expiration (same rule as player)
            if 'status' in enemy:
                enemy['status'] = [s for s in enemy['status'] if self.state.turn - s.get('assigned_turn', self.state.turn) < 1]

    # ===== SEQUENTIAL DIE SYSTEM =====

    def can_use_die_for_cost(self, die, required_type):
        """Check if die can be used to pay for required type

        Rules:
        - FUOCO can pay FORZA (with +1 damage bonus on attacks)
        - JOLLY cannot pay anything (must be converted first via Profondità Mente Oscura,
          or used specifically for Scarica Mentale)
        - Exact type match works
        """
        die_type = die['face']['type']

        # JOLLY cannot be used to pay costs (needs conversion or Scarica Mentale)
        if die_type == 'JOLLY':
            return False

        # ANY/QUALSIASI accepts everything (except JOLLY)
        if required_type in ['ANY', 'QUALSIASI']:
            return True

        # Exact match
        if die_type == required_type:
            return True

        # FUOCO can pay FORZA (with bonus damage for attacks)
        if die_type == 'FUOCO' and required_type == 'FORZA':
            return True

        return False

    def get_current_die_index(self):
        """Get the index of the current unconsumed die (sequential order)

        A die is considered "usable" if:
        - It's explicitly marked as consumed, OR
        - It has remaining impulses > 0, OR
        - It has available maneuvers (even with 0 impulses), OR
        - It's an ENEMY die (zombie)

        Automatically updates self.current_die_idx to the found die.
        """
        if not self.state or not self.state.dice_pool:
            return None

        # Find first usable die starting from current position
        for i in range(self.current_die_idx, len(self.state.dice_pool)):
            die = self.state.dice_pool[i]

            # Skip explicitly consumed dice
            if i in self.state.consumed_dice_indices:
                continue

            # ENEMY dice (zombie) are always usable
            if die['source'] == 'ENEMY':
                self.current_die_idx = i
                return i

            # PLAYER die is usable if it has impulses OR maneuvers
            has_impulses = die.get('remaining_impulses', 0) > 0
            has_maneuvers = 'maneuvers' in die.get('def', {}) and len(die['def']['maneuvers']) > 0

            if has_impulses or has_maneuvers:
                self.current_die_idx = i
                return i

        return None  # All dice consumed

    def advance_to_next_die(self):
        """Increment die index to move to next position

        The next call to get_current_die_index() will find the next unconsumed die.
        """
        if not self.state:
            return

        # Simply increment - get_current_die_index() will skip consumed dice
        self.current_die_idx += 1

        # Check if there are more dice
        next_idx = self.get_current_die_index()
        if next_idx is None:
            self.add_log("✅ Tutti i dadi usati - Premi PASSA per finire turno")
            return

        next_die = self.state.dice_pool[next_idx]
        if next_die['source'] == 'ENEMY':
            self.add_log("🧟 È il turno del dado ZOMBIE!")
        else:
            # Log next player die
            face_type = next_die['face']['type']
            qty = next_die['face']['quantity']
            icon = ICON_MAP.get(face_type, '•')
            self.add_log(f"→ Prossimo dado: {icon} {face_type} x{qty}")

    def hex_to_pixel(self, hex_pos):
        """Convert hex coordinates to pixel position (FLAT-TOP odd-r)"""
        col = hex_pos['q'] - 1
        row = hex_pos['r'] - 1
        
        # Flat-top ODD-R offset coordinates (matches hex_utils.py)
        width = self.hex_size * math.sqrt(3)
        height = self.hex_size * 2
        
        # Odd rows (1,3,5...) are offset to the RIGHT by half a hex width
        x = self.map_offset_x + width * (col + 0.5 * (row % 2))
        y = self.map_offset_y + height * 0.75 * row
        
        return (int(x), int(y))
        
    def pixel_to_hex(self, pos):
        """Convert pixel position to hex coordinates (FLAT-TOP odd-r)"""
        px, py = pos
        
        width = self.hex_size * math.sqrt(3)
        height = self.hex_size * 2
        
        # Odd-r conversion (matches hex_utils.py)
        row = round((py - self.map_offset_y) / (height * 0.75))
        col = round((px - self.map_offset_x - 0.5 * width * (row % 2)) / width)
        
        q = col + 1
        r = row + 1
        
        if 1 <= r <= C['MAP']['ROWS'] and 1 <= q <= C['MAP']['COLS']:
            return {'r': r, 'q': q}
        return None
        
    def draw_hexagon(self, center, size, color, border_color=None, width=2):
        """Draw a FLAT-TOP hexagon"""
        points = []
        for i in range(6):
            # Flat-top: offset angles by 30° (start at -30°, then 30°, 90°, 150°, 210°, 270°)
            angle = math.radians(60 * i - 30)
            x = center[0] + size * math.cos(angle)
            y = center[1] + size * math.sin(angle)
            points.append((x, y))
        pygame.draw.polygon(self.screen, color, points)
        if border_color:
            pygame.draw.polygon(self.screen, border_color, points, width=width)


    def draw_game_over(self):
        """Draw game over screen with victory/defeat message"""
        # Semi-transparent overlay
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT))
        overlay.set_alpha(200)
        overlay.fill((0, 0, 0))
        self.screen.blit(overlay, (0, 0))

        # Determine result
        is_victory = self.state.result == 'VICTORY'

        # Main message
        if is_victory:
            title = "🎉 VITTORIA! 🎉"
            subtitle = "Tutti i nemici sono stati sconfitti!"
            color = COLOR_SUCCESS
        elif self.state.result == 'DEFEAT_HP':
            title = "💀 SCONFITTA 💀"
            subtitle = "HP esauriti!"
            color = COLOR_ERROR
        elif self.state.result == 'DEFEAT_PT':
            title = "💀 SCONFITTA 💀"
            subtitle = "PT esauriti - Follia!"
            color = COLOR_ERROR
        else:
            title = "💀 SCONFITTA 💀"
            subtitle = "Game Over"
            color = COLOR_ERROR

        # Title
        title_surf = render_text_with_emoji(title, FONT_TITLE, FONT_EMOJI, color)
        title_rect = title_surf.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 - 100))
        self.screen.blit(title_surf, title_rect)

        # Subtitle
        subtitle_surf = FONT_LARGE.render(subtitle, True, COLOR_TEXT)
        subtitle_rect = subtitle_surf.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 - 40))
        self.screen.blit(subtitle_surf, subtitle_rect)

        # Game stats
        stats_y = SCREEN_HEIGHT // 2 + 20
        stats = [
            f"Turni giocati: {self.state.turn}",
            f"Danni inflitti: {self.state.telemetry.get('total_damage_dealt', 0)}",
            f"Danni subiti: {self.state.telemetry.get('total_damage_taken', 0)}",
            f"Carte scartate: {self.state.telemetry.get('discarded_cards', 0)}"
        ]

        for i, stat in enumerate(stats):
            stat_surf = FONT_SMALL.render(stat, True, COLOR_TEXT)
            stat_rect = stat_surf.get_rect(center=(SCREEN_WIDTH // 2, stats_y + i * 30))
            self.screen.blit(stat_surf, stat_rect)

        # Restart button
        btn_w = 200
        btn_h = 50
        btn_x = (SCREEN_WIDTH - btn_w) // 2
        btn_y = SCREEN_HEIGHT // 2 + 180
        btn_rect = pygame.Rect(btn_x, btn_y, btn_w, btn_h)

        mouse = pygame.mouse.get_pos()
        hover = btn_rect.collidepoint(mouse)

        pygame.draw.rect(self.screen, COLOR_BUTTON_HOVER if hover else COLOR_BUTTON, btn_rect, border_radius=15)
        btn_text = render_text_with_emoji("▶ Nuova Partita", FONT_MEDIUM, FONT_EMOJI, COLOR_TEXT)
        btn_text_rect = btn_text.get_rect(center=btn_rect.center)
        self.screen.blit(btn_text, btn_text_rect)

        # Store button rect for click handling
        self.gameover_restart_btn = btn_rect

    def render(self):
        # Background color che combina con la mappa (Death Howl style)
        # Usa un dark slate/charcoal che fa da base neutra per la hex map
        self.screen.fill(PALETTE_DEATH_HOWL['BG_CHARCOAL'])

        self.animation_timer += self.clock.get_time() / 1000.0
        self.pulse = abs(math.sin(self.animation_timer * 3)) * 0.3 + 0.7

        # Game Over screen - override all other UI
        if self.phase == "GameOver":
            self.draw_game_over()
            pygame.display.flip()
            return

        self.draw_header()
        self.draw_hex_map()
        self.draw_dice_pool()
        self.draw_deck_status()
        self.draw_bag_buffer_panel()  # v0.0.3: Bag/Buffer panel
        # Maneuvers now integrated in draw_dice_pool()
        self.draw_card_hand()
        self.draw_log()
        self.draw_footer()

        # Draw status panel AFTER map so it's on top
        self.draw_player_status_panel()

        # Zombie trigger button (STEP 7)
        self.draw_zombie_trigger_button()

        # Impulse selection overlay
        if self.selecting_impulses:
            self.draw_impulse_selector()

        # Multi-effect impulse allocation overlay
        if self.allocating_impulses:
            self.draw_effect_allocation_overlay()

        # v0.0.3 Fase F: Card tooltip (right-click hold)
        if self.tooltip_card_idx is not None:
            self.draw_card_tooltip()

        # [DISABLED] v0.0.3 Fase F: Terror Swap UI
        # if self.phase == "TerrorSwap":
        #     self.draw_terror_swap_ui()

        # v0.0.3 Fase F: Jolly selection modal
        if self.jolly_selection_active:
            self.draw_jolly_selection_modal()

        # v0.0.3: ROTATE_TARGET_CD modal
        if self.rotate_cd_selection_active:
            self.draw_rotate_cd_selection_modal()

        pygame.display.flip()
        
    def draw_header(self):
        rect = pygame.Rect(10, 10, SCREEN_WIDTH - 20, 90)
        pygame.draw.rect(self.screen, COLOR_PANEL_BG, rect, border_radius=15)
        pygame.draw.rect(self.screen, COLOR_PANEL_BORDER, rect, width=2, border_radius=15)
        
        if not self.state:
            title = FONT_TITLE.render("Zombie Dice Battle", True, COLOR_TEXT)
            self.screen.blit(title, (SCREEN_WIDTH // 2 - title.get_width() // 2, 35))
            return
            
        # HP bar
        hp_pct = self.state.player['hp'] / self.state.player['hp_max']
        bar_rect = pygame.Rect(30, 25, 200, 25)
        pygame.draw.rect(self.screen, (40, 40, 50), bar_rect, border_radius=12)
        if hp_pct > 0:
            fill = pygame.Rect(32, 27, int(196 * hp_pct), 21)
            pygame.draw.rect(self.screen, COLOR_HP if hp_pct > 0.3 else COLOR_ERROR, fill, border_radius=10)
        hp_text = render_text_with_emoji(f"{ICON_MAP['HP']} {self.state.player['hp']}/{self.state.player['hp_max']}", FONT_MEDIUM, FONT_EMOJI, COLOR_TEXT)
        self.screen.blit(hp_text, (bar_rect.centerx - hp_text.get_width() // 2, 28))

        # PT & PM
        pt_text = render_text_with_emoji(f"{ICON_MAP['PT']} {self.state.player['pt']}/{self.state.player['pt_max']}", FONT_LARGE, FONT_EMOJI, COLOR_PT)
        self.screen.blit(pt_text, (260, 25))
        pm_text = render_text_with_emoji(f"{ICON_MAP['PM']} {self.state.player['pm']}", FONT_LARGE, FONT_EMOJI, COLOR_PM)
        self.screen.blit(pm_text, (380, 25))

        # Note: Shields & Status now shown in dedicated panel below (draw_player_status_panel)

        # Turn & Phase
        turn_text = FONT_MEDIUM.render(f"Turno {self.state.turn}", True, COLOR_TEXT_DIM)
        self.screen.blit(turn_text, (SCREEN_WIDTH - 250, 25))
        phase_text = FONT_MEDIUM.render(f"Fase: {self.phase}", True, COLOR_TEXT)
        self.screen.blit(phase_text, (SCREEN_WIDTH - 250, 60))

    def draw_player_status_panel(self):
        """Draw dedicated status panel for player (shields, vulnerability, stun)"""
        if not self.state:
            return

        # Panel positioning: below header, centered horizontally
        panel_width = 400
        panel_height = 50
        panel_x = (SCREEN_WIDTH - panel_width) // 2
        panel_y = 105  # Just below header (header ends at y=100)

        # Only draw if player has any status/shields
        shields = self.state.player.get('shields', [])
        status_effects = self.state.player.get('status', [])

        if not shields and not status_effects:
            return  # Nothing to show

        # Draw panel background
        rect = pygame.Rect(panel_x, panel_y, panel_width, panel_height)
        pygame.draw.rect(self.screen, COLOR_PANEL_BG, rect, border_radius=10)
        pygame.draw.rect(self.screen, COLOR_PANEL_BORDER, rect, width=2, border_radius=10)

        # Count tokens
        shields_count = len(shields)
        stun_count = sum(1 for s in status_effects if s.get('type') == 'STUN')
        vuln_count = sum(s.get('stacks', 0) for s in status_effects if s.get('type') == 'VULNERABILITA')

        # Build status text
        status_parts = []
        if shields_count > 0:
            status_parts.append(f"🛡×{shields_count}")
        if vuln_count > 0:
            status_parts.append(f"⚠️×{vuln_count}")
        if stun_count > 0:
            status_parts.append(f"💫×{stun_count}")

        if status_parts:
            status_text = "   ".join(status_parts)
            text_surface = render_text_with_emoji(status_text, FONT_LARGE, FONT_EMOJI, COLOR_TEXT)
            text_x = panel_x + (panel_width - text_surface.get_width()) // 2
            text_y = panel_y + (panel_height - text_surface.get_height()) // 2
            self.screen.blit(text_surface, (text_x, text_y))

    def draw_hex_map(self):
        # 1280×720 layout: Centered map
        rect = pygame.Rect(280, 100, 590, 440)
        pygame.draw.rect(self.screen, COLOR_PANEL_BG, rect, border_radius=15)
        pygame.draw.rect(self.screen, COLOR_PANEL_BORDER, rect, width=2, border_radius=15)
        
        if not self.state:
            return

        title = render_text_with_emoji("▣ Mappa", FONT_MEDIUM, FONT_EMOJI, COLOR_TEXT)
        self.screen.blit(title, (295, 115))
        
        # Draw hexes
        for row in range(1, C['MAP']['ROWS'] + 1):
            for col in range(1, C['MAP']['COLS'] + 1):
                hex_pos = {'r': row, 'q': col}
                center = self.hex_to_pixel(hex_pos)
                
                color = COLOR_HEX_BG
                border = COLOR_HEX_BORDER
                width = 1
                
                if self.hover_hex and self.hover_hex['r'] == row and self.hover_hex['q'] == col:
                    color = COLOR_HEX_HOVER
                if hex_pos in self.range_hexes:
                    color = COLOR_HEX_RANGE
                    border = COLOR_PM
                if hex_pos in self.valid_targets:
                    border = COLOR_SUCCESS
                    width = 3
                if self.selected_target and self.selected_target['r'] == row and self.selected_target['q'] == col:
                    color = COLOR_HEX_SELECTED
                    
                self.draw_hexagon(center, self.hex_size, color, border, width)

                # Coordinate hex (commented out - not needed in game)
                # coord = FONT_TINY.render(f"{col},{row}", True, COLOR_TEXT_DARK)
                # self.screen.blit(coord, (center[0] - 10, center[1] - 6))

        # Player
        p_center = self.hex_to_pixel(self.state.player['pos'])
        pygame.draw.circle(self.screen, COLOR_PM, p_center, 25)
        pygame.draw.circle(self.screen, COLOR_PANEL_BORDER, p_center, 25, 3)
        icon = render_text_with_emoji("🧙", FONT_LARGE, FONT_EMOJI, COLOR_TEXT)
        self.screen.blit(icon, (p_center[0] - 12, p_center[1] - 15))
        
        # Enemies
        for enemy in self.state.enemies:
            if enemy['hp'] > 0:
                e_center = self.hex_to_pixel(enemy['pos'])
                pygame.draw.circle(self.screen, COLOR_HP, e_center, 25)
                pygame.draw.circle(self.screen, COLOR_PANEL_BORDER, e_center, 25, 3)
                text = render_text_with_emoji(f"🧟{enemy['hp']}", FONT_SMALL, FONT_EMOJI, COLOR_TEXT)
                self.screen.blit(text, (e_center[0] - 18, e_center[1] - 10))

                # Status effects (below HP) - compact format: S3 V2 ST1
                status_parts = []

                # Count shields (each shield is now a separate token)
                shields_count = len(enemy.get('shields', []))
                if shields_count > 0:
                    status_parts.append(f"S{shields_count}")

                # Count status tokens
                status_effects = enemy.get('status', [])
                if status_effects:
                    stun_count = sum(1 for s in status_effects if s.get('type') == 'STUN')
                    vuln_count = sum(s.get('stacks', 0) for s in status_effects if s.get('type') == 'VULNERABILITA')

                    if vuln_count > 0:
                        status_parts.append(f"V{vuln_count}")
                    if stun_count > 0:
                        status_parts.append(f"ST{stun_count}")

                # Draw combined status text
                if status_parts:
                    status_y = e_center[1] + 8
                    status_text_str = " ".join(status_parts)
                    status_text = FONT_TINY.render(status_text_str, True, COLOR_TEXT)
                    text_x = e_center[0] - status_text.get_width() // 2
                    self.screen.blit(status_text, (text_x, status_y))
                
    def draw_dice_pool(self):
        # 1280×720 layout: Dice panel at (10,100) 260×360
        rect = pygame.Rect(10, 100, 260, 360)
        pygame.draw.rect(self.screen, COLOR_PANEL_BG, rect, border_radius=15)
        pygame.draw.rect(self.screen, COLOR_PANEL_BORDER, rect, width=2, border_radius=15)
        
        title = render_text_with_emoji("◇ Dadi", FONT_MEDIUM, FONT_EMOJI, COLOR_TEXT)
        self.screen.blit(title, (25, 108))
        
        if not self.state:
            return
        
        # SECTION 1: ALL dice in sequence order (player + zombie)
        y = 140
        current_die_idx = self.get_current_die_index()

        for i, die in enumerate(self.state.dice_pool):
            is_consumed = i in self.state.consumed_dice_indices
            is_current = (i == current_die_idx and not is_consumed)
            is_selected = i in self.selected_dice
            
            if die['source'] == 'PLAYER':
                # Player die
                die_rect = pygame.Rect(20, y, 240, 35)
                
                if is_consumed:
                    bg = COLOR_DICE_CONSUMED
                elif is_current:
                    bg = (50, 100, 50)
                elif is_selected:
                    bg = COLOR_SUCCESS
                else:
                    bg = COLOR_CARD_BG
                    
                pygame.draw.rect(self.screen, bg, die_rect, border_radius=6)
                
                if is_current:
                    pygame.draw.rect(self.screen, COLOR_WARNING, die_rect, width=3, border_radius=6)
                elif is_selected:
                    pygame.draw.rect(self.screen, COLOR_SUCCESS, die_rect, width=2, border_radius=6)
                    
                face_type = die['face']['type']
                qty = die['face']['quantity']
                icon = ICON_MAP.get(face_type, '•')
                
                # Extract die size from die_type (D4_FIRE -> d4, D6_EARTH -> d6, etc)
                die_type = die.get('die_type', '')
                die_size = ''
                if 'D4' in die_type:
                    die_size = 'd4'
                elif 'D6' in die_type:
                    die_size = 'd6'
                elif 'D8' in die_type:
                    die_size = 'd8'
                
                if face_type == 'FORZA':
                    color = COLOR_DICE_FORZA
                elif face_type == 'FUOCO':
                    color = COLOR_DICE_FUOCO
                else:
                    color = COLOR_DICE_JOLLY
                    
                prefix = "→" if is_current else " "
                # Show die size in display
                display_text = f"{prefix}[{i}] {die_size} {icon} {face_type}" if die_size else f"{prefix}[{i}] {icon} {face_type}"
                name = render_text_with_emoji(display_text, FONT_TINY, FONT_EMOJI, color if not is_consumed else COLOR_TEXT_DARK)
                self.screen.blit(name, (25, y + 10))
                
                remaining = die.get('remaining_impulses', qty)
                qty_text = FONT_TINY.render(f"x{remaining}" if remaining > 0 else "X", True, COLOR_TEXT if not is_consumed else COLOR_TEXT_DARK)
                self.screen.blit(qty_text, (225, y + 10))
                y += 35
                
            else:
                # ENEMY (zombie) die - shown in sequence!
                die_rect = pygame.Rect(20, y, 240, 38)
                
                if is_consumed:
                    bg = (40, 20, 20)
                elif is_current:
                    bg = (120, 30, 30)  # Bright red when active
                else:
                    bg = (60, 25, 25)
                    
                pygame.draw.rect(self.screen, bg, die_rect, border_radius=6)
                pygame.draw.rect(self.screen, COLOR_ERROR, die_rect, width=2 if not is_current else 3, border_radius=6)
                
                action = die.get('action', {})
                action_name = action.get('name', 'Azione')[:15]
                
                prefix = "→" if is_current else " "
                zombie_text = render_text_with_emoji(f"{prefix}[{i}] 🧟 {action_name}", FONT_TINY, FONT_EMOJI, COLOR_ERROR if not is_consumed else COLOR_TEXT_DARK)
                self.screen.blit(zombie_text, (25, y + 11))
                y += 38
        
        # SECTION 3: Maneuvers (y = 330 to 460, 2 buttons max)
        if current_die_idx is not None and self.phase == "Resolution":
            current_die = self.state.dice_pool[current_die_idx]
            if current_die['source'] == 'PLAYER' and 'maneuvers' in current_die.get('def', {}):
                maneuvers = current_die['def']['maneuvers']
                if maneuvers and current_die_idx not in self.state.consumed_dice_indices:
                    # Draw separator line
                    pygame.draw.line(self.screen, COLOR_PANEL_BORDER, (20, 330), (260, 330), 1)
                    
                    # Title
                    maneuver_title = render_text_with_emoji(f"⚡ MANOVRE [{current_die_idx}]", FONT_TINY, FONT_EMOJI, COLOR_WARNING)
                    self.screen.blit(maneuver_title, (25, 338))
                    
                    # Maneuver buttons
                    mouse = pygame.mouse.get_pos()
                    btn_y = 360
                    hovered_maneuver = None  # Track which maneuver is hovered

                    for idx, m in enumerate(maneuvers[:2]):
                        btn_rect = pygame.Rect(20, btn_y, 240, 35)
                        hover = btn_rect.collidepoint(mouse)

                        if hover:
                            hovered_maneuver = m

                        can_afford = True
                        cost = m.get('cost', {})
                        if cost.get('extra_pt_flat'):
                            if self.state.player['pt'] < cost['extra_pt_flat']:
                                can_afford = False

                        bg = COLOR_BUTTON_HOVER if hover else COLOR_BUTTON
                        if not can_afford:
                            bg = COLOR_CARD_DISABLED
                        pygame.draw.rect(self.screen, bg, btn_rect, border_radius=6)

                        name_text = FONT_TINY.render(m['name'][:18], True, COLOR_TEXT if can_afford else COLOR_TEXT_DARK)
                        self.screen.blit(name_text, (28, btn_y + 10))

                        if cost.get('extra_pt_flat'):
                            cost_text = FONT_TINY.render(f"+{cost['extra_pt_flat']}PT", True, COLOR_TEXT_DIM)
                            self.screen.blit(cost_text, (220, btn_y + 10))

                        btn_y += 40

                    # Draw maneuver tooltip if hovered
                    if hovered_maneuver:
                        self.draw_maneuver_tooltip(hovered_maneuver, mouse)


    def draw_deck_status(self):
        """Draw deck, discard, and cooldown board status"""
        if not self.state:
            return

        # 1280×720 layout: Compact deck panel below dice
        rect = pygame.Rect(10, 470, 260, 80)
        pygame.draw.rect(self.screen, COLOR_PANEL_BG, rect, border_radius=15)
        pygame.draw.rect(self.screen, COLOR_PANEL_BORDER, rect, width=2, border_radius=15)

        # Title + counts in one line
        deck_count = len(self.state.player.get('deck', []))
        discard_count = len(self.state.player.get('discard', []))
        info_text = render_text_with_emoji(f"■ Mazzo: {deck_count} | Scarti: {discard_count}", FONT_SMALL, FONT_EMOJI, COLOR_TEXT)
        self.screen.blit(info_text, (20, 480))

        # Cooldown - compact text
        cooldown_board = self.state.player.get('cooldown_board', [])
        cd_parts = []
        for slot in cooldown_board[:4]:
            if slot.get('card'):
                card = next((c for c in CARDS if c['id'] == slot['card']), None)
                if card:
                    cd_parts.append(f"{card['name'][:5]}:{slot.get('cd',0)}°")
        if cd_parts:
            cd_text = render_text_with_emoji("⏱️ " + " ".join(cd_parts), FONT_TINY, FONT_EMOJI, COLOR_TEXT_DIM)
            self.screen.blit(cd_text, (20, 510))
    
    def draw_bag_buffer_panel(self):
        """v0.0.3: Draw Bag and Buffer status panel (above log, right side)"""
        if not self.state:
            return
        
        # Position: Right side, just below header (y=60), width 250, height 70
        rect = pygame.Rect(1010, 60, 260, 70)
        pygame.draw.rect(self.screen, COLOR_PANEL_BG, rect, border_radius=10)
        pygame.draw.rect(self.screen, COLOR_PANEL_BORDER, rect, width=2, border_radius=10)
        
        y = 65
        
        # BAG: Count dice by type
        bag_counts = {}
        for d in self.state.dice_bag:
            dtype = d.get('die_type', 'UNKNOWN')
            bag_counts[dtype] = bag_counts.get(dtype, 0) + 1
        
        bag_text = "📦 BAG: "
        if bag_counts:
            parts = []
            for dtype, count in bag_counts.items():
                type_short = dtype.replace('D', 'd').replace('_FIRE', '🔥').replace('_EARTH', '🌍').replace('_STANDARD', '⚔').replace('_TERROR', '🎭')
                parts.append(f"{type_short}×{count}")
            bag_text += " ".join(parts)
        else:
            bag_text += "vuota"

        bag_render = render_text_with_emoji(bag_text, FONT_TINY, FONT_EMOJI, COLOR_TEXT_DIM)
        self.screen.blit(bag_render, (1020, y))
        y += 18
        
        # BUFFER: Count items for next turn
        buffer_pm = sum(1 for b in self.state.next_turn_buffer if b.get('type') == 'PM')
        buffer_dice = [b for b in self.state.next_turn_buffer if b.get('type') != 'PM']
        
        buffer_text = "🔮 T+1: "
        if buffer_pm > 0 or buffer_dice:
            parts = []
            if buffer_pm > 0:
                parts.append(f"+{buffer_pm}PM")
            for d in buffer_dice:
                dtype = d.get('die_type', '?')
                type_short = dtype.replace('D', 'd').replace('_FIRE', '🔥').replace('_EARTH', '🌍').replace('_TERROR', '🎭')
                parts.append(type_short)
            buffer_text += " ".join(parts)
        else:
            buffer_text += "vuoto"

        buffer_render = render_text_with_emoji(buffer_text, FONT_TINY, FONT_EMOJI, COLOR_WARNING)
        self.screen.blit(buffer_render, (1020, y))
        y += 18
        
        # Active Pool count
        active_count = len(self.state.active_pool)
        active_text = render_text_with_emoji(f"🎲 Active: {active_count} dadi", FONT_TINY, FONT_EMOJI, COLOR_SUCCESS)
        self.screen.blit(active_text, (1020, y))

    def draw_card_hand(self):
        if not self.state or not self.state.player['hand']:
            return
            
        # 1280×720 layout: Cards above footer
        hand_y = 555
        card_w = 140  # Compact cards
        card_h = 90
        spacing = 10
        
        total_w = len(self.state.player['hand']) * (card_w + spacing) - spacing
        start_x = (SCREEN_WIDTH - total_w) // 2
        
        for idx, card_id in enumerate(self.state.player['hand']):
            card = next((c for c in CARDS if c['id'] == card_id), None)
            if not card:
                continue
                
            x = start_x + idx * (card_w + spacing)
            y = hand_y
            
            if idx == self.hover_card_idx:
                y -= 20

            is_selected = idx == self.selected_card_idx
            is_discard_selected = idx in self.discard_selection

            card_rect = pygame.Rect(x, y, card_w, card_h)

            if is_discard_selected:
                # During DiscardPhase, show selected cards for discard
                bg = COLOR_ERROR
            elif is_selected:
                bg = COLOR_CARD_SELECTED
            elif idx == self.hover_card_idx:
                bg = COLOR_CARD_HOVER
            else:
                bg = COLOR_CARD_BG

            pygame.draw.rect(self.screen, bg, card_rect, border_radius=10)

            # Glow for playable or discard selection
            if self.phase == "DiscardPhase" and is_discard_selected:
                pygame.draw.rect(self.screen, COLOR_ERROR, card_rect, width=3, border_radius=10)
            elif not is_selected and self.phase == "Resolution":
                pygame.draw.rect(self.screen, COLOR_SUCCESS, card_rect, width=2, border_radius=10)
                
            # Name
            name = FONT_SMALL.render(card['name'][:15], True, COLOR_TEXT)
            self.screen.blit(name, (x + 10, y + 15))
            
            # Shortcut
            key = FONT_TINY.render(f"[{idx + 1}]", True, COLOR_TEXT_DARK)
            self.screen.blit(key, (x + card_w - 30, y + card_h - 25))
            
    def draw_log(self):
        # 1280×720 layout: Right side log
        rect = pygame.Rect(880, 100, 390, 440)
        pygame.draw.rect(self.screen, COLOR_PANEL_BG, rect, border_radius=15)
        pygame.draw.rect(self.screen, COLOR_PANEL_BORDER, rect, width=2, border_radius=15)

        title = FONT_MEDIUM.render("≡ Log", True, COLOR_TEXT)
        self.screen.blit(title, (895, 115))

        y = 145
        for msg in self.log_messages[-18:]:  # Fits 440px height
            text = FONT_TINY.render(msg[:45], True, COLOR_TEXT_DIM)
            self.screen.blit(text, (895, y))
            y += 22
            
    def draw_footer(self):
        # 1280×720 layout: Footer with LARGE buttons
        rect = pygame.Rect(10, 650, 1260, 60)
        pygame.draw.rect(self.screen, COLOR_PANEL_BG, rect, border_radius=15)
        pygame.draw.rect(self.screen, COLOR_PANEL_BORDER, rect, width=2, border_radius=15)
        
        mouse = pygame.mouse.get_pos()
        
        # New Game button - LARGE
        btn_new = pygame.Rect(30, 660, 200, 40)
        hover = btn_new.collidepoint(mouse)
        pygame.draw.rect(self.screen, COLOR_BUTTON_HOVER if hover else COLOR_BUTTON, btn_new, border_radius=10)
        text = render_text_with_emoji("▶ Nuovo Gioco", FONT_MEDIUM, FONT_EMOJI, COLOR_TEXT)
        self.screen.blit(text, (btn_new.x + 20, btn_new.y + 10))
        
        # Next Phase button - LARGE
        if self.phase in ["Upkeep", "Roll"]:
            btn_phase = pygame.Rect(250, 660, 200, 40)
            hover = btn_phase.collidepoint(mouse)
            pygame.draw.rect(self.screen, COLOR_BUTTON_HOVER if hover else COLOR_BUTTON, btn_phase, border_radius=10)
            text = render_text_with_emoji("▶ Avanti", FONT_MEDIUM, FONT_EMOJI, COLOR_TEXT)
            self.screen.blit(text, (btn_phase.x + 50, btn_phase.y + 10))
        
        # Pass Turn - LARGE (hidden when charging or zombie die active)
        if self.phase == "Resolution" and self.state:
            current_die_idx = self.get_current_die_index()
            is_zombie_die = (current_die_idx is not None and
                           self.state.dice_pool[current_die_idx]['source'] == 'ENEMY')
            is_charging = self.charging_state.get('active', False)

            if not is_zombie_die and not is_charging:
                btn_pass = pygame.Rect(250, 660, 180, 40)
                hover = btn_pass.collidepoint(mouse)
                pygame.draw.rect(self.screen, COLOR_WARNING if hover else (200, 120, 40), btn_pass, border_radius=10)
                text = render_text_with_emoji("» Passa", FONT_MEDIUM, FONT_EMOJI, COLOR_TEXT)
                self.screen.blit(text, (btn_pass.x + 50, btn_pass.y + 10))
            elif is_charging:
                # Show charge status in footer
                pm_available = self.charging_state.get('pm_available', 0)
                hexes_moved = self.charging_state.get('hexes_moved', 0)
                damage_ready = self.charging_state.get('damage_ready', 0)

                if damage_ready > 0:
                    # Attack ready
                    charge_text = f"⚡ CARICA: {damage_ready} danni pronti! Click su nemico adiacente per attaccare"
                    color = (255, 200, 100)
                else:
                    # Still moving
                    charge_text = f"⚡ CARICA: {pm_available} PM | {hexes_moved} hex mossi | SPAZIO per confermare"
                    color = (255, 220, 150)

                charge_surf = FONT_SMALL.render(charge_text, True, color)
                self.screen.blit(charge_surf, (250, 670))

        # Help text - positioned at right of footer
        if self.phase == "Resolution" and self.charging_state.get('active'):
            help_text = FONT_TINY.render("Click hex: Muovi | SPAZIO: Conferma carica", True, COLOR_TEXT_DIM)
        else:
            help_text = FONT_TINY.render("SPAZIO: Esegui | D: Scarta dado | Click: Muovi/Seleziona", True, COLOR_TEXT_DIM)
        self.screen.blit(help_text, (500, 695))

    def draw_zombie_trigger_button(self):
        """Draw big zombie trigger button when current die is ENEMY (STEP 7)"""
        if self.phase != "Resolution" or not self.state:
            return

        # Don't show zombie button during Carica Furiosa
        if self.charging_state.get('active'):
            return

        current_die_idx = self.get_current_die_index()
        if current_die_idx is None:
            return

        current_die = self.state.dice_pool[current_die_idx]
        if current_die['source'] != 'ENEMY':
            return

        # Semi-transparent overlay
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT))
        overlay.set_alpha(120)
        overlay.fill((20, 10, 10))
        self.screen.blit(overlay, (0, 0))

        # Big button
        btn_w = 400
        btn_h = 120
        btn_x = (SCREEN_WIDTH - btn_w) // 2
        btn_y = (SCREEN_HEIGHT - btn_h) // 2
        btn_zombie = pygame.Rect(btn_x, btn_y, btn_w, btn_h)

        mouse = pygame.mouse.get_pos()
        hover = btn_zombie.collidepoint(mouse)

        # Pulsating effect
        import time
        pulse = abs(int(time.time() * 3) % 2)
        color = (220, 50, 50) if hover else (180 + pulse * 20, 30, 30)

        pygame.draw.rect(self.screen, color, btn_zombie, border_radius=20)
        pygame.draw.rect(self.screen, (255, 80, 80), btn_zombie, width=4, border_radius=20)

        # Title
        title = render_text_with_emoji("⚔ TURNO ZOMBIE ⚔", FONT_LARGE, FONT_EMOJI, COLOR_TEXT)
        self.screen.blit(title, (btn_x + (btn_w - title.get_width()) // 2, btn_y + 25))

        # Subtitle
        subtitle = FONT_SMALL.render("Clicca per risolvere", True, COLOR_TEXT_DIM)
        self.screen.blit(subtitle, (btn_x + (btn_w - subtitle.get_width()) // 2, btn_y + 70))

        # Hint below
        hint = FONT_TINY.render("💡 Puoi ancora muoverti o giocare carte prima di premere", True, COLOR_WARNING)
        self.screen.blit(hint, ((SCREEN_WIDTH - hint.get_width()) // 2, btn_y + btn_h + 20))

    def draw_impulse_selector(self):
        """Draw impulse selection overlay for maneuvers or multi-target cards"""
        # Semi-transparent overlay
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT))
        overlay.set_alpha(180)
        overlay.fill((10, 10, 20))
        self.screen.blit(overlay, (0, 0))

        # Dialog box
        dialog_w = 500
        dialog_h = 250
        dialog_x = (SCREEN_WIDTH - dialog_w) // 2
        dialog_y = (SCREEN_HEIGHT - dialog_h) // 2

        dialog_rect = pygame.Rect(dialog_x, dialog_y, dialog_w, dialog_h)
        pygame.draw.rect(self.screen, COLOR_PANEL_BG, dialog_rect, border_radius=20)
        pygame.draw.rect(self.screen, COLOR_SUCCESS, dialog_rect, width=3, border_radius=20)

        # Title (different for multi-target vs maneuver)
        if self.multi_target_mode and self.multi_target_card:
            title_text = f"⚔ {self.multi_target_card['name']}"
        else:
            title_text = "⚡ Scarica Mentale"
        title = render_text_with_emoji(title_text, FONT_LARGE, FONT_EMOJI, COLOR_TEXT)
        self.screen.blit(title, (dialog_x + (dialog_w - title.get_width()) // 2, dialog_y + 20))
        
        # Subtitle
        subtitle = FONT_SMALL.render(f"Scegli quanti impulsi usare (max {self.max_impulses})", True, COLOR_TEXT_DIM)
        self.screen.blit(subtitle, (dialog_x + (dialog_w - subtitle.get_width()) // 2, dialog_y + 65))
        
        # Impulse buttons
        mouse = pygame.mouse.get_pos()
        btn_w = 80
        btn_h = 60
        spacing = 20
        total_w = self.max_impulses * btn_w + (self.max_impulses - 1) * spacing
        start_x = dialog_x + (dialog_w - total_w) // 2
        btn_y = dialog_y + 110
        
        for i in range(1, self.max_impulses + 1):
            x = start_x + (i - 1) * (btn_w + spacing)
            btn_rect = pygame.Rect(x, btn_y, btn_w, btn_h)
            hover = btn_rect.collidepoint(mouse)
            
            pygame.draw.rect(self.screen, COLOR_SUCCESS if hover else COLOR_BUTTON, btn_rect, border_radius=12)
            
            num_text = FONT_LARGE.render(str(i), True, COLOR_TEXT)
            self.screen.blit(num_text, (x + (btn_w - num_text.get_width()) // 2, btn_y + 12))
        
        # ESC hint
        hint = FONT_TINY.render("ESC per annullare", True, COLOR_TEXT_DARK)
        self.screen.blit(hint, (dialog_x + (dialog_w - hint.get_width()) // 2, dialog_y + dialog_h - 30))

    def draw_effect_allocation_overlay(self):
        """Draw overlay for allocating impulses to card effects"""
        if not self.pending_card_data:
            return

        card = self.pending_card_data['card']
        effects = card.get('effects', [])
        if self.current_effect_idx >= len(effects):
            return

        current_effect = effects[self.current_effect_idx]

        # Semi-transparent overlay
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT))
        overlay.set_alpha(180)
        overlay.fill((10, 10, 20))
        self.screen.blit(overlay, (0, 0))

        # Dialog box
        dialog_w = 600
        dialog_h = 320
        dialog_x = (SCREEN_WIDTH - dialog_w) // 2
        dialog_y = (SCREEN_HEIGHT - dialog_h) // 2

        dialog_rect = pygame.Rect(dialog_x, dialog_y, dialog_w, dialog_h)
        pygame.draw.rect(self.screen, COLOR_PANEL_BG, dialog_rect, border_radius=20)
        pygame.draw.rect(self.screen, COLOR_PT, dialog_rect, width=3, border_radius=20)

        # Title - Card name
        title = render_text_with_emoji(f"📜 {card['name']}", FONT_LARGE, FONT_EMOJI, COLOR_TEXT)
        self.screen.blit(title, (dialog_x + (dialog_w - title.get_width()) // 2, dialog_y + 15))

        # Effect info
        effect_action = current_effect.get('action', '?')
        effect_value = current_effect.get('value', 1)
        effect_cost = current_effect.get('cost', {}).get('amount', 1)

        # Map action to readable name
        action_names = {
            'DAMAGE': f'⚔ Danno ({effect_value} per impulso)',
            'DAMAGE_FIRE': f'🔥 Danno Fuoco ({effect_value} per impulso)',
            'DRAW': f'🃏 Pesca {effect_value} carta',
            'VULNERABILITY': f'🎯 Vulnerabilità ({effect_value} per impulso)',
            'VULNERABILITY_FIRE': f'🎯 Vulnerabilità Fuoco ({effect_value} per impulso)',
            'SHIELD': f'🛡 Scudo ({effect_value} per impulso)',
            'MOVE': f'🏃 Movimento (+{effect_value} PM per impulso)',
        }
        effect_name = action_names.get(effect_action, effect_action)

        # Single-effect cards don't need "Effetto 1/1" display
        is_single_effect = len(effects) == 1

        # Effect number (only for multi-effect cards)
        if not is_single_effect:
            effect_num = FONT_MEDIUM.render(f"Effetto {self.current_effect_idx + 1}/{len(effects)}", True, COLOR_TEXT_DIM)
            self.screen.blit(effect_num, (dialog_x + (dialog_w - effect_num.get_width()) // 2, dialog_y + 55))

        # Effect description
        effect_desc = render_text_with_emoji(effect_name, FONT_MEDIUM, FONT_EMOJI, COLOR_SUCCESS)
        desc_y = dialog_y + 55 if is_single_effect else dialog_y + 85
        self.screen.blit(effect_desc, (dialog_x + (dialog_w - effect_desc.get_width()) // 2, desc_y))

        # Cost info
        cost_text = FONT_SMALL.render(f"Costo minimo: {effect_cost} impulso/i", True, COLOR_TEXT_DIM)
        self.screen.blit(cost_text, (dialog_x + (dialog_w - cost_text.get_width()) // 2, dialog_y + 115))

        # Remaining impulses
        remaining_text = FONT_MEDIUM.render(f"Impulsi disponibili: {self.remaining_impulses_for_allocation}", True, COLOR_WARNING)
        self.screen.blit(remaining_text, (dialog_x + (dialog_w - remaining_text.get_width()) // 2, dialog_y + 145))

        # Buttons: 0 to remaining_impulses (single-effect cards start from 1, no skip option)
        mouse = pygame.mouse.get_pos()
        btn_w = 60
        btn_h = 50
        spacing = 10

        # Single-effect cards: start from 1 (can't skip the only effect)
        # Multi-effect cards: start from 0 (can skip individual effects)
        start_value = 1 if is_single_effect else 0
        max_value = self.remaining_impulses_for_allocation
        num_buttons = min(max_value - start_value + 1, 8)

        total_w = num_buttons * btn_w + (num_buttons - 1) * spacing
        start_x = dialog_x + (dialog_w - total_w) // 2
        btn_y = dialog_y + 185

        for btn_idx in range(num_buttons):
            value = start_value + btn_idx
            x = start_x + btn_idx * (btn_w + spacing)
            btn_rect = pygame.Rect(x, btn_y, btn_w, btn_h)
            hover = btn_rect.collidepoint(mouse)

            # Disable if below minimum cost (except 0 to skip for multi-effect)
            can_select = (value == 0) or (value >= effect_cost)
            if can_select:
                color = COLOR_SUCCESS if hover else COLOR_BUTTON
            else:
                color = COLOR_CARD_DISABLED

            pygame.draw.rect(self.screen, color, btn_rect, border_radius=10)

            num_text = FONT_MEDIUM.render(str(value), True, COLOR_TEXT if can_select else COLOR_TEXT_DARK)
            self.screen.blit(num_text, (x + (btn_w - num_text.get_width()) // 2, btn_y + 12))

        # Hint
        if is_single_effect:
            hint = FONT_TINY.render("Scegli quanti impulsi usare | ESC = Annulla", True, COLOR_TEXT_DARK)
        else:
            hint = FONT_TINY.render("0 = Salta effetto | ESC = Annulla carta", True, COLOR_TEXT_DARK)
        self.screen.blit(hint, (dialog_x + (dialog_w - hint.get_width()) // 2, dialog_y + dialog_h - 35))

    def draw_terror_swap_ui(self):
        """v0.0.3: Draw Terror Swap phase UI overlay"""
        if not self.state:
            return
        
        # Semi-transparent overlay
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
        overlay.fill((0, 0, 0, 100))
        self.screen.blit(overlay, (0, 0))
        
        # Central info panel
        panel_w = 500
        panel_h = 180
        panel_x = (SCREEN_WIDTH - panel_w) // 2
        panel_y = 200
        
        panel_rect = pygame.Rect(panel_x, panel_y, panel_w, panel_h)
        pygame.draw.rect(self.screen, (35, 30, 50), panel_rect, border_radius=15)
        pygame.draw.rect(self.screen, PALETTE_DEATH_HOWL['ACCENT_VIOLET'], panel_rect, width=3, border_radius=15)
        
        # Title
        title = FONT_LARGE.render("↻ TERROR SWAP", True, PALETTE_DEATH_HOWL['ACCENT_VIOLET'])
        self.screen.blit(title, (panel_x + (panel_w - title.get_width()) // 2, panel_y + 20))
        
        # Instructions
        instr1 = FONT_MEDIUM.render("Clicca un dado normale per swapparlo", True, COLOR_TEXT)
        self.screen.blit(instr1, (panel_x + (panel_w - instr1.get_width()) // 2, panel_y + 65))
        
        instr2 = FONT_SMALL.render("con un dado TERRORE dalla bag", True, COLOR_TEXT_DIM)
        self.screen.blit(instr2, (panel_x + (panel_w - instr2.get_width()) // 2, panel_y + 95))
        
        # Check available terror dice in bag
        terror_in_bag = [d for d in self.state.dice_bag if 'TERROR' in d.get('die_type', '')]
        bag_info = f"🎲 Terror in Bag: {len(terror_in_bag)}"
        bag_text = render_text_with_emoji(bag_info, FONT_SMALL, FONT_EMOJI, COLOR_WARNING if terror_in_bag else COLOR_TEXT_DARK)
        self.screen.blit(bag_text, (panel_x + (panel_w - bag_text.get_width()) // 2, panel_y + 125))
        
        # Skip hint
        skip_hint = FONT_TINY.render("Premi SPAZIO per saltare", True, COLOR_TEXT_DARK)
        self.screen.blit(skip_hint, (panel_x + (panel_w - skip_hint.get_width()) // 2, panel_y + 155))
        
        # Highlight swappable dice in pool area (drawn on left panel)
        # Dice that can be swapped: non-TERROR player dice
        y = 140  # Same as draw_dice_pool
        for i, die in enumerate(self.state.active_pool):
            die_type = die.get('die_type', '')
            is_swappable = 'TERROR' not in die_type and terror_in_bag
            
            if is_swappable:
                # Draw highlight around die in pool area
                highlight_rect = pygame.Rect(15, y - 2, 250, 35)
                pygame.draw.rect(self.screen, PALETTE_DEATH_HOWL['ACCENT_VIOLET'], highlight_rect, width=2, border_radius=8)
            y += 35

    def draw_jolly_selection_modal(self):
        """v0.0.3: Draw modal for selecting ANY die from bag"""
        if not self.jolly_selection_options:
            return
        
        # Semi-transparent overlay
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
        overlay.fill((0, 0, 0, 150))
        self.screen.blit(overlay, (0, 0))
        
        # Modal panel - dynamic width based on options
        btn_w = 100  # Wider for descriptive labels
        btn_spacing = 10
        num_btns = len(self.jolly_selection_options)
        total_btns_w = num_btns * btn_w + (num_btns - 1) * btn_spacing
        modal_w = max(450, total_btns_w + 60)
        modal_h = 180
        modal_x = (SCREEN_WIDTH - modal_w) // 2
        modal_y = (SCREEN_HEIGHT - modal_h) // 2
        
        modal_rect = pygame.Rect(modal_x, modal_y, modal_w, modal_h)
        pygame.draw.rect(self.screen, (35, 30, 50), modal_rect, border_radius=15)
        pygame.draw.rect(self.screen, PALETTE_DEATH_HOWL['DICE_JOLLY'], modal_rect, width=3, border_radius=15)
        
        # Title
        title = FONT_LARGE.render("🎭 SCEGLI DADO DALLA BAG", True, PALETTE_DEATH_HOWL['DICE_JOLLY'])
        self.screen.blit(title, (modal_x + (modal_w - title.get_width()) // 2, modal_y + 20))
        
        # Subtitle
        subtitle = FONT_SMALL.render("Clicca per generare nel Buffer", True, COLOR_TEXT_DIM)
        self.screen.blit(subtitle, (modal_x + (modal_w - subtitle.get_width()) // 2, modal_y + 55))
        
        # Dice buttons - store positions for click handling
        btn_h = 60
        btn_y = modal_y + 90
        start_x = modal_x + (modal_w - total_btns_w) // 2
        
        # Label map for all die types - clear descriptive labels
        die_labels = {
            'D4_TERROR': 'd4 Jolly',
            'D6_TERROR': 'd6 Jolly',
            'D8_TERROR': 'd8 Jolly',
            'D4_FIRE': 'd4 Fuoco',
            'D6_EARTH': 'd6 Terra',
            'D8_EARTH': 'd8 Terra'
        }
        
        for i, die_type in enumerate(self.jolly_selection_options):
            btn_x = start_x + i * (btn_w + btn_spacing)
            btn_rect = pygame.Rect(btn_x, btn_y, btn_w, btn_h)
            
            # Get label for die type
            label = die_labels.get(die_type, die_type[:6])
            
            # Draw button
            pygame.draw.rect(self.screen, PALETTE_DEATH_HOWL['ACCENT_VIOLET'], btn_rect, border_radius=10)
            pygame.draw.rect(self.screen, PALETTE_DEATH_HOWL['DICE_JOLLY'], btn_rect, width=2, border_radius=10)
            
            # Label
            label_surface = FONT_MEDIUM.render(label, True, COLOR_TEXT)
            self.screen.blit(label_surface, (btn_x + (btn_w - label_surface.get_width()) // 2,
                                             btn_y + (btn_h - label_surface.get_height()) // 2))

    def draw_rotate_cd_selection_modal(self):
        """v0.0.3: Draw modal for selecting card in cooldown to rotate"""
        if not self.rotate_cd_selection_cards:
            return

        # Semi-transparent overlay
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
        overlay.fill((0, 0, 0, 150))
        self.screen.blit(overlay, (0, 0))

        # Modal panel - dynamic width based on number of cards
        btn_w = 140
        btn_h = 80
        btn_spacing = 15
        num_btns = len(self.rotate_cd_selection_cards)
        total_btns_w = num_btns * btn_w + (num_btns - 1) * btn_spacing
        modal_w = max(500, total_btns_w + 60)
        modal_h = 220
        modal_x = (SCREEN_WIDTH - modal_w) // 2
        modal_y = (SCREEN_HEIGHT - modal_h) // 2

        modal_rect = pygame.Rect(modal_x, modal_y, modal_w, modal_h)
        pygame.draw.rect(self.screen, (35, 30, 50), modal_rect, border_radius=15)
        pygame.draw.rect(self.screen, PALETTE_DEATH_HOWL['ACCENT_GOLD'], modal_rect, width=3, border_radius=15)

        # Title
        title = render_text_with_emoji("🔄 SCEGLI CARTA DA RICARICARE", FONT_LARGE, FONT_EMOJI, PALETTE_DEATH_HOWL['ACCENT_GOLD'])
        self.screen.blit(title, (modal_x + (modal_w - title.get_width()) // 2, modal_y + 20))

        # Subtitle
        subtitle = FONT_SMALL.render("Ricarica di 90° (Click per selezionare)", True, COLOR_TEXT_DIM)
        self.screen.blit(subtitle, (modal_x + (modal_w - subtitle.get_width()) // 2, modal_y + 55))

        # Card buttons - vertical layout with card info
        btn_y = modal_y + 100
        start_x = modal_x + (modal_w - total_btns_w) // 2

        for i, card_data in enumerate(self.rotate_cd_selection_cards):
            btn_x = start_x + i * (btn_w + btn_spacing)
            btn_rect = pygame.Rect(btn_x, btn_y, btn_w, btn_h)

            # Draw button background
            pygame.draw.rect(self.screen, PALETTE_DEATH_HOWL['ACCENT_VIOLET'], btn_rect, border_radius=10)
            pygame.draw.rect(self.screen, PALETTE_DEATH_HOWL['ACCENT_GOLD'], btn_rect, width=2, border_radius=10)

            # Card name (truncate if too long)
            card_name = card_data['card_name']
            if len(card_name) > 18:
                card_name = card_name[:15] + "..."

            name_surface = FONT_SMALL.render(card_name, True, COLOR_TEXT)
            name_x = btn_x + (btn_w - name_surface.get_width()) // 2
            name_y = btn_y + 15
            self.screen.blit(name_surface, (name_x, name_y))

            # Current CD display
            cd_text = f"CD: {card_data['cd']}°"
            cd_surface = FONT_MEDIUM.render(cd_text, True, COLOR_WARNING)
            cd_x = btn_x + (btn_w - cd_surface.get_width()) // 2
            cd_y = btn_y + 45
            self.screen.blit(cd_surface, (cd_x, cd_y))

    def handle_click(self, pos):
        # Game Over restart button
        if self.phase == "GameOver" and hasattr(self, 'gameover_restart_btn'):
            if self.gameover_restart_btn.collidepoint(pos):
                self.new_game()
                return

        # Carica Furiosa movement phase - only allow hex clicks
        if self.charging_state.get('active') and not self.charging_state.get('damage_ready'):
            # Only allow movement, block everything else
            hex_pos = self.pixel_to_hex(pos)
            if hex_pos:
                self.move_player(hex_pos)
            return  # Block all other clicks

        # v0.0.3: Jolly selection modal click handling
        if self.jolly_selection_active:
            # Calculate button positions (same as draw_jolly_selection_modal)
            btn_w = 100  # Match draw_jolly_selection_modal
            btn_spacing = 10
            num_btns = len(self.jolly_selection_options)
            total_btns_w = num_btns * btn_w + (num_btns - 1) * btn_spacing
            modal_w = max(450, total_btns_w + 60)
            modal_h = 180
            modal_x = (SCREEN_WIDTH - modal_w) // 2
            modal_y = (SCREEN_HEIGHT - modal_h) // 2
            btn_h = 60
            btn_y = modal_y + 90
            start_x = modal_x + (modal_w - total_btns_w) // 2
            
            for i, die_type in enumerate(self.jolly_selection_options):
                btn_x = start_x + i * (btn_w + btn_spacing)
                btn_rect = pygame.Rect(btn_x, btn_y, btn_w, btn_h)
                if btn_rect.collidepoint(pos):
                    # Generate selected die to buffer
                    if self.generate_die_from_bag(die_type, to_buffer=True):
                        self.add_log(f"      ✅ {die_type} → Buffer")
                    else:
                        self.add_log(f"      ❌ {die_type} non disponibile")

                    # v0.0.3 FIX: Remove processed request from queue
                    if self.jolly_selection_queue:
                        self.jolly_selection_queue.pop(0)

                    # Close current modal
                    self.jolly_selection_active = False
                    self.jolly_selection_options = []

                    # v0.0.3 FIX: Process next in queue or go to next turn
                    if self.jolly_selection_queue:
                        # More GEN_JOLLY requests - process next
                        self.process_jolly_queue()
                    elif self.phase == "DiscardPhase":
                        # Queue empty - proceed to next turn
                        self.next_turn()
                    return
            return  # Don't process other clicks when modal active

        # v0.0.3: ROTATE_TARGET_CD selection modal click handling
        if self.rotate_cd_selection_active:
            # Calculate button positions (same as draw_rotate_cd_selection_modal)
            btn_w = 140
            btn_h = 80
            btn_spacing = 15
            num_btns = len(self.rotate_cd_selection_cards)
            total_btns_w = num_btns * btn_w + (num_btns - 1) * btn_spacing
            modal_w = max(500, total_btns_w + 60)
            modal_h = 220
            modal_x = (SCREEN_WIDTH - modal_w) // 2
            modal_y = (SCREEN_HEIGHT - modal_h) // 2
            btn_y = modal_y + 100
            start_x = modal_x + (modal_w - total_btns_w) // 2

            for i, card_data in enumerate(self.rotate_cd_selection_cards):
                btn_x = start_x + i * (btn_w + btn_spacing)
                btn_rect = pygame.Rect(btn_x, btn_y, btn_w, btn_h)
                if btn_rect.collidepoint(pos):
                    # Apply rotation to selected card
                    slot_idx = card_data['slot_idx']
                    slot = self.state.player['cooldown_board'][slot_idx]
                    old_cd = slot['cd']
                    slot['cd'] = max(0, slot['cd'] - 90)
                    new_cd = slot['cd']

                    self.add_log(f"      ✅ {card_data['card_name']} ricaricata: {old_cd}° → {new_cd}°")

                    # Deactivate modal
                    self.rotate_cd_selection_active = False
                    self.rotate_cd_selection_cards = []
                    return
            return  # Block other clicks if modal is active

        # [DISABLED] v0.0.3: Terror Swap click handling
        # if self.phase == "TerrorSwap":
        #     # Check if clicked on a die in active_pool area
        #     terror_in_bag = [d for d in self.state.dice_bag if 'TERROR' in d.get('die_type', '')]
        #     if terror_in_bag:
        #         y = 140
        #         for i, die in enumerate(self.state.active_pool):
        #             die_rect = pygame.Rect(15, y - 2, 250, 35)
        #             if die_rect.collidepoint(pos):
        #                 die_type = die.get('die_type', '')
        #                 if 'TERROR' not in die_type:
        #                     # Swap this die with terror from bag
        #                     terror_die = terror_in_bag[0]
        #                     self.state.dice_bag.remove(terror_die)
        #                     self.state.dice_bag.append(die)  # Normal die goes to bag
        #                     self.state.active_pool[i] = terror_die  # Terror replaces it
        #                     self.add_log(f"🔄 Swap: {die_type} → {terror_die.get('die_type', 'TERROR')}")
        #                     # Proceed to Roll phase after swap
        #                     self.phase = "Roll"
        #                     self.roll_phase()
        #                     return
        #                 else:
        #                     self.add_log("⚠️ Dado già Terror!")
        #                 return
        #             y += 35
        #     return  # Don't process other clicks during TerrorSwap

        # Dice pair selection for Carica Furiosa
        if self.selecting_dice_pair:
            # Check if clicked on dice pool area (must match draw_dice_pool positions!)
            y = 140  # Same as draw_dice_pool
            clicked_die_idx = None
            
            for i, die in enumerate(self.state.dice_pool):
                if die['source'] != 'PLAYER':
                    y += 38  # Zombie die height in draw
                    continue
                
                die_rect = pygame.Rect(20, y, 240, 35)  # Match draw dimensions
                if die_rect.collidepoint(pos):
                    clicked_die_idx = i
                    break
                y += 35  # Next die position
            
            if clicked_die_idx is not None:
                # Check if this die is part of a valid consecutive pair
                valid_pair = None
                for pair in self.available_dice_pairs:
                    if clicked_die_idx in pair:
                        valid_pair = pair
                        break
                
                if valid_pair:
                    # Activate charge with this pair
                    self.activate_charge(valid_pair[0], valid_pair[1])
                else:
                    self.add_log("⚠️ Questo dado non fa parte di una coppia consecutiva valida!")
            else:
                self.add_log("   Clicca su un dado per selezionare la coppia")
            return  # Block other clicks when selecting dice pair
        
        # Impulse selection overlay

        if self.selecting_impulses:
            dialog_w = 500
            dialog_h = 250
            dialog_x = (SCREEN_WIDTH - dialog_w) // 2
            dialog_y = (SCREEN_HEIGHT - dialog_h) // 2
            
            btn_w = 80
            btn_h = 60
            spacing = 20
            total_w = self.max_impulses * btn_w + (self.max_impulses - 1) * spacing
            start_x = dialog_x + (dialog_w - total_w) // 2
            btn_y = dialog_y + 110
            
            for i in range(1, self.max_impulses + 1):
                x = start_x + (i - 1) * (btn_w + spacing)
                btn_rect = pygame.Rect(x, btn_y, btn_w, btn_h)
                if btn_rect.collidepoint(pos):
                    if self.multi_target_mode:
                        # Execute multi-target attack with chosen impulses
                        self.execute_multi_target_impulse(i)
                    else:
                        # Execute Scarica Mentale with chosen impulses
                        self.execute_scarica_mentale(i)
                    return
            return  # Block other clicks when overlay is shown

        # Zombie trigger button (STEP 7)
        if self.phase == "Resolution" and self.state:
            current_die_idx = self.get_current_die_index()
            if current_die_idx is not None and self.state.dice_pool[current_die_idx]['source'] == 'ENEMY':
                btn_w = 400
                btn_h = 120
                btn_x = (SCREEN_WIDTH - btn_w) // 2
                btn_y = (SCREEN_HEIGHT - btn_h) // 2
                btn_zombie = pygame.Rect(btn_x, btn_y, btn_w, btn_h)

                if btn_zombie.collidepoint(pos):
                    self.add_log("🧟 === TURNO ZOMBIE ===")
                    self.execute_enemy_turn_inline()
                    return

        # Special card die selection (STEP 6 - Infusione, Manipolazione)
        if self.selecting_target_die_for_card:
            # Check if clicked on dice pool area (must match draw_dice_pool positions!)
            y = 140  # Same as draw_dice_pool
            for i, die in enumerate(self.state.dice_pool):
                if die['source'] != 'PLAYER':
                    y += 38  # Zombie die height in draw
                    continue

                die_rect = pygame.Rect(20, y, 240, 35)  # Match draw dimensions
                if die_rect.collidepoint(pos):
                    # Clicked on this die - check if valid for card
                    is_consumed = i in self.state.consumed_dice_indices

                    if is_consumed:
                        self.add_log("⚠️ Dado già consumato!")
                        y += 35
                        continue

                    # Execute special card effect
                    if self.selecting_target_die_for_card == 'infusione_elementale':
                        # Must be FORZA die
                        if die['face']['type'] != 'FORZA':
                            self.add_log(f"⚠️ Infusione richiede dado FORZA (questo è {die['face']['type']})")
                            y += 35
                            continue

                        # Convert to FUOCO + 1 bonus impulse
                        old_qty = die['face']['quantity']
                        die['face']['type'] = 'FUOCO'
                        die['face']['quantity'] += 1
                        die['remaining_impulses'] = die.get('remaining_impulses', old_qty) + 1
                        self.add_log(f"   ⚡ Dado [{i}]: FORZA x{old_qty} → FUOCO x{die['face']['quantity']}!")

                    elif self.selecting_target_die_for_card == 'manipolazione_destino':
                        # Find best face for this die
                        best_face = max(die['def']['faces'], key=lambda f: f['quantity'])
                        old_qty = die['face']['quantity']
                        old_type = die['face']['type']
                        old_remaining = die.get('remaining_impulses', old_qty)

                        # Apply best face, preserve remaining impulses
                        die['face'] = best_face.copy()
                        die['remaining_impulses'] = max(old_remaining, best_face['quantity'])  # Use max, not min!

                        self.add_log(f"   🎲 Dado [{i}]: {old_type} x{old_qty} → {best_face['type']} x{best_face['quantity']}!")
                        self.add_log(f"      Impulsi rimanenti: {die['remaining_impulses']}")

                    # Remove card from hand (NOT consuming current die - special card)
                    self.remove_card_from_hand(self.selected_card_idx)

                    # Reset selection
                    self.selecting_target_die_for_card = None
                    self.selected_card_idx = None
                    self.current_card = None
                    self.check_end_resolution()
                    return

                y += 35  # Next die position (matches draw)

            # Clicked outside dice - cancel selection
            self.add_log("❌ Selezione annullata - clicca su un dado o premi ESC")
            return  # Block other clicks

        # Multi-effect allocation overlay
        if self.allocating_impulses:
            dialog_w = 600
            dialog_h = 320
            dialog_x = (SCREEN_WIDTH - dialog_w) // 2
            dialog_y = (SCREEN_HEIGHT - dialog_h) // 2

            btn_w = 60
            btn_h = 50
            spacing = 10

            # Get current effect info
            card = self.pending_card_data['card']
            effects = card.get('effects', [])
            current_effect = effects[self.current_effect_idx]
            effect_cost = current_effect.get('cost', {}).get('amount', 1)
            is_single_effect = len(effects) == 1

            # Single-effect cards: start from 1 (can't skip the only effect)
            start_value = 1 if is_single_effect else 0
            max_value = self.remaining_impulses_for_allocation
            num_buttons = min(max_value - start_value + 1, 8)

            total_w = num_buttons * btn_w + (num_buttons - 1) * spacing
            start_x = dialog_x + (dialog_w - total_w) // 2
            btn_y = dialog_y + 185

            for btn_idx in range(num_buttons):
                value = start_value + btn_idx
                x = start_x + btn_idx * (btn_w + spacing)
                btn_rect = pygame.Rect(x, btn_y, btn_w, btn_h)
                if btn_rect.collidepoint(pos):
                    # Check if valid selection (0 to skip for multi-effect, or >= cost)
                    can_select = (value == 0) or (value >= effect_cost)
                    if can_select:
                        self.allocate_impulses_to_effect(value)
                    return
            return  # Block other clicks when overlay is shown

        # Buttons - 1280×720 layout
        btn_new = pygame.Rect(30, 660, 200, 40)
        if btn_new.collidepoint(pos):
            self.new_game()
            return
            
        if self.phase in ["Upkeep", "Roll"]:
            btn_phase = pygame.Rect(250, 660, 200, 40)
            if btn_phase.collidepoint(pos):
                if self.phase == "Upkeep":
                    self.upkeep_phase()
                elif self.phase == "Roll":
                    self.roll_phase()
                return
        
        # Pass Turn button
        if self.phase == "Resolution" and self.state:
            btn_pass = pygame.Rect(250, 660, 180, 40)
            if btn_pass.collidepoint(pos):
                self.pass_turn()
                return

        # DiscardPhase: Click cards to toggle selection for discard
        # v0.0.3: Block if any modal is active
        if self.phase == "DiscardPhase" and self.state and not self.rotate_cd_selection_active:
            hand_y = 555  # 1280×720 layout
            card_w = 140
            card_h = 90
            spacing = 10

            if len(self.state.player['hand']) > 0:
                total_w = len(self.state.player['hand']) * (card_w + spacing) - spacing
                start_x = (SCREEN_WIDTH - total_w) // 2

                for idx in range(len(self.state.player['hand'])):
                    x = start_x + idx * (card_w + spacing)
                    y = hand_y
                    if idx == self.hover_card_idx:
                        y -= 20
                    card_rect = pygame.Rect(x, y, card_w, card_h)
                    if card_rect.collidepoint(pos):
                        # Toggle card selection for discard
                        if idx in self.discard_selection:
                            self.discard_selection.remove(idx)
                            self.add_log(f"   Rimossa da scarto")
                        else:
                            self.discard_selection.append(idx)
                            card_id = self.state.player['hand'][idx]
                            card = next((c for c in CARDS if c['id'] == card_id), None)
                            card_name = card['name'] if card else card_id
                            self.add_log(f"   Selezionata per scarto: {card_name}")
                        return
            return  # Block other clicks during DiscardPhase

        if not self.state or self.phase != "Resolution":
            return
            
        # LEGACY: Manual die selection removed - dice are now used in sequential order
        # Die selection
        # y = 165
        # for i, die in enumerate(self.state.dice_pool):
        #     if die['source'] != 'PLAYER':
        #         continue
        #     if i in self.state.consumed_dice_indices:
        #         y += 50
        #         continue
        #
        #     die_rect = pygame.Rect(20, y, 250, 38)
        #     if die_rect.collidepoint(pos):
        #         self.toggle_die(i)
        #         return
        #     y += 50
        
        # Card selection (only if no card selected)
        if not self.current_card:
            hand_y = 555  # 1280×720 layout
            card_w = 140
            card_h = 90
            spacing = 10
            
            if len(self.state.player['hand']) > 0:
                total_w = len(self.state.player['hand']) * (card_w + spacing) - spacing
                start_x = (SCREEN_WIDTH - total_w) // 2
                
                for idx in range(len(self.state.player['hand'])):
                    x = start_x + idx * (card_w + spacing)
                    y = hand_y
                    if idx == self.hover_card_idx:
                        y -= 20
                    card_rect = pygame.Rect(x, y, card_w, card_h)
                    if card_rect.collidepoint(pos):
                        self.play_card(idx)
                        return

        # Multi-target mode: Click on enemies to attack with impulses
        if self.multi_target_mode:
            hex_pos = self.pixel_to_hex(pos)
            if hex_pos:
                # Check if hex_pos is in valid_targets (compare dict values)
                is_valid = any(target['r'] == hex_pos['r'] and target['q'] == hex_pos['q']
                              for target in self.valid_targets)

                if is_valid:
                    # Find target enemy
                    target_enemy = None
                    for e in self.state.enemies:
                        if e['pos']['r'] == hex_pos['r'] and e['pos']['q'] == hex_pos['q'] and e['hp'] > 0:
                            target_enemy = e
                            break

                    if target_enemy:
                        # Show impulse selector for this target
                        self.selecting_impulses = True
                        self.impulse_target_enemy = target_enemy
                        self.max_impulses = self.multi_target_remaining_impulses
                        self.add_log(f"   Target: {target_enemy['id']}")
                        self.add_log(f"   Scegli quanti impulsi usare (1-{self.max_impulses})")
                        return

        # Hex selection for AREA_ENEMY (Cono di Fuoco) - select direction
        if self.current_card and self.current_card['target_type'] == 'AREA_ENEMY':
            try:
                hex_pos = self.pixel_to_hex(pos)
                if hex_pos and hex_pos in self.range_hexes:
                    self.selected_target = hex_pos
                    # Calculate and store cone preview
                    player_pos = self.state.player['pos']
                    area_range = self.current_card.get('area', {}).get('base_range', 3)
                    cone_hexes = HexUtils.get_cone(player_pos, hex_pos, area_range)
                    self.valid_targets = cone_hexes  # Store for visualization
                    self.add_log(f"   ✓ Direzione: ({hex_pos['q']},{hex_pos['r']})")
                    self.add_log(f"   🔥 Area cono: {len(cone_hexes)} hexagons")
                    # Count enemies in cone
                    enemies_in_cone = 0
                    for enemy in self.state.enemies:
                        if enemy['hp'] > 0:
                            for cone_hex in cone_hexes:
                                if enemy['pos'] == cone_hex:
                                    enemies_in_cone += 1
                                    break
                    self.add_log(f"   🧟 Nemici nel cono: {enemies_in_cone}")
                    return
            except Exception as e:
                import traceback
                print("\n" + "="*80)
                print("ERRORE CONO DI FUOCO:")
                print("="*80)
                traceback.print_exc()
                print("="*80)
                self.add_log(f"❌ ERRORE: {str(e)}")
                return
        # Click on maneuver buttons (check FIRST, return if clicked)
        if self.phase == "Resolution" and self.state and not self.current_card and not self.current_maneuver:
            current_die_idx = self.get_current_die_index()
            if current_die_idx is not None:
                current_die = self.state.dice_pool[current_die_idx]
                if current_die['source'] == 'PLAYER' and 'maneuvers' in current_die.get('def', {}):
                    maneuvers = current_die['def']['maneuvers']
                    if maneuvers and current_die_idx not in self.state.consumed_dice_indices:
                        # Fixed Y positions matching draw_dice_pool
                        btn_y = 360  # First button
                        for idx, m in enumerate(maneuvers[:2]):
                            btn_rect = pygame.Rect(20, btn_y, 240, 35)
                            
                            if btn_rect.collidepoint(pos):
                                self.execute_maneuver(m, current_die_idx)
                                return  # Exit after executing maneuver
                            
                            btn_y += 40  # Next button

        # Hex selection for target (ENEMY cards)
        if self.current_card and self.current_card['target_type'] == 'ENEMY':
            hex_pos = self.pixel_to_hex(pos)
            if hex_pos and hex_pos in self.valid_targets:
                self.selected_target = hex_pos
                self.add_log(f"   → Bersaglio: hex ({hex_pos['q']},{hex_pos['r']})")
            return
            
        # Maneuver target selection
        if self.current_maneuver:
            hex_pos = self.pixel_to_hex(pos)
            if hex_pos and hex_pos in self.valid_targets:
                # Find target enemy
                target = None
                for e in self.state.enemies:
                    if e['pos'] == hex_pos and e['hp'] > 0:
                        target = e
                        break
                        
                if target:
                    maneuver = self.current_maneuver['maneuver']
                    die_idx = self.current_maneuver['die_idx']

                    # Check if impulses were selected (Scarica Mentale)
                    if 'impulses' in self.current_maneuver:
                        damage = self.current_maneuver['impulses']
                        # Pay PT cost (1 PT per impulse for Scarica Mentale)
                        pt_cost = damage
                        self.state.player['pt'] -= pt_cost
                        self.add_log(f"   💀 -{pt_cost} PT (PT: {self.state.player['pt']})")

                        # Check game over if PT reaches 0
                        if self.check_game_over():
                            return
                    else:
                        damage = maneuver['effect']['value']

                    # Check if this is DAMAGE_DIRECT (Scarica Mentale) - ignores shields
                    is_direct_damage = maneuver.get('effect', {}).get('type') == 'DAMAGE_DIRECT'
                    
                    if is_direct_damage:
                        # Direct damage ignores shields
                        target['hp'] = max(0, target['hp'] - damage)
                        self.add_log(f"   💥 {damage} danni a HP")
                    else:
                        # Use apply_damage to handle vulnerability and shields
                        self.apply_damage(target, damage)
                    self.add_log(f"   ⚔ Manovra eseguita su {target['id']}! HP: {target['hp']}")

                    if target['hp'] == 0:
                        self.add_log(f"   💀 {target['id']} eliminato!")

                    # Check victory condition (done inside apply_damage)
                    if self.phase == "GameOver":
                        return
                        
                    # Consume used impulses
                    if 'impulses' in self.current_maneuver:
                        self.consume_impulses(die_idx, self.current_maneuver['impulses'])
                    else:
                        self.consume_impulses(die_idx, damage)

                    # Note: Do NOT automatically consume die - it can be reused if it has remaining impulses
                    # User must press 'D' to skip/discard the die when done

                    self.current_maneuver = None
                    self.valid_targets = []
            return
            
        # Carica Furiosa final attack (when damage_ready is set)
        if self.charging_state.get('damage_ready'):
            hex_pos = self.pixel_to_hex(pos)
            if hex_pos:
                # Check if hex_pos is in valid_targets (adjacent enemies)
                is_valid = any(target['r'] == hex_pos['r'] and target['q'] == hex_pos['q']
                              for target in self.valid_targets)
                
                if is_valid:
                    # Find target enemy at this position
                    target_enemy = None
                    for e in self.state.enemies:
                        if e['pos']['r'] == hex_pos['r'] and e['pos']['q'] == hex_pos['q'] and e['hp'] > 0:
                            target_enemy = e
                            break
                    
                    if target_enemy:
                        damage = self.charging_state['damage_ready']
                        
                        self.add_log("")
                        self.add_log("⚡⚔ IMPATTO CARICA FURIOSA! ⚔⚡")
                        
                        # Apply damage
                        self.apply_damage(target_enemy, damage)
                        self.add_log(f"   💥 {target_enemy['id']}: HP {target_enemy['hp']}")

                        if target_enemy['hp'] == 0:
                            self.add_log(f"   💀 {target_enemy['id']} ELIMINATO!")

                        # Check victory (done inside apply_damage)
                        if self.phase == "GameOver":
                            return
                        
                        # Reset charge state
                        self.charging_state['active'] = False
                        self.charging_state['damage_ready'] = None
                        self.valid_targets = []
                        
                        self.add_log("")
                        self.check_end_resolution()
                        return
            return  # Block other clicks when damage is ready
            
        # Hex click for movement (when no card/maneuver selected)
        if not self.current_card and not self.current_maneuver and not self.multi_target_mode:
            hex_pos = self.pixel_to_hex(pos)
            if hex_pos:
                self.move_player(hex_pos)
                
    def handle_motion(self, pos):
        # Card hover
        self.hover_card_idx = None
        if self.state and self.phase == "Resolution" and not self.current_card:
            hand_y = SCREEN_HEIGHT - 200
            card_w = 160
            card_h = 120
            spacing = 12
            
            if len(self.state.player['hand']) > 0:
                total_w = len(self.state.player['hand']) * (card_w + spacing) - spacing
                start_x = (SCREEN_WIDTH - total_w) // 2
                
                for idx in range(len(self.state.player['hand'])):
                    x = start_x + idx * (card_w + spacing)
                    card_rect = pygame.Rect(x, hand_y, card_w, card_h)
                    if card_rect.collidepoint(pos):
                        self.hover_card_idx = idx
                        break
                        
        # Hex hover
        self.hover_hex = self.pixel_to_hex(pos)
    
    def handle_right_click(self, pos):
        """v0.0.3: Handle right-click for card tooltip display"""
        if not self.state:
            return
        
        # Check if click is on a card in hand
        hand_y = 555  # Same as draw_card_hand
        card_w = 140
        card_h = 90
        spacing = 10
        
        if len(self.state.player['hand']) > 0:
            total_w = len(self.state.player['hand']) * (card_w + spacing) - spacing
            start_x = (SCREEN_WIDTH - total_w) // 2
            
            for idx, card_id in enumerate(self.state.player['hand']):
                x = start_x + idx * (card_w + spacing)
                y = hand_y
                if idx == self.hover_card_idx:
                    y -= 20
                
                card_rect = pygame.Rect(x, y, card_w, card_h)
                if card_rect.collidepoint(pos):
                    self.tooltip_card_idx = idx
                    self.tooltip_pos = pos
                    return
        
        # If not on a card, clear tooltip
        self.tooltip_card_idx = None
        self.tooltip_pos = None
    
    def draw_card_tooltip(self):
        """v0.0.5: Draw large, clear card tooltip with narrative description.

        Shows:
        - Card name and type
        - COME USARLA: Full usage instructions
        - SCARTO: What happens when discarded
        - Stats: CD, Gittata, Supply
        """
        if self.tooltip_card_idx is None or not self.state:
            return

        if self.tooltip_card_idx >= len(self.state.player['hand']):
            return

        card_id = self.state.player['hand'][self.tooltip_card_idx]
        card = next((c for c in CARDS if c['id'] == card_id), None)
        if not card:
            return

        # Get human-readable description
        desc = get_card_description(card)

        # === TOOLTIP DIMENSIONS ===
        tooltip_w = 400  # Wide for readability
        padding = 16
        content_width = tooltip_w - (padding * 2)
        line_height = 19

        # Calculate height based on content
        how_to_lines = desc['how_to_use'].split('\n') if desc['how_to_use'] else []

        # Height calculation:
        height = 45  # Title + separator
        height += 28  # Stats line
        if desc['supply']:
            height += 24  # Supply line
        height += 28  # "COME USARLA" header
        for line in how_to_lines:
            if line.strip():
                height += line_height
            else:
                height += 8  # Empty line gap
        if desc['discard_tip']:
            height += 55  # Separator + header + text

        # Add bottom padding
        height += 20

        tooltip_h = max(height, 220)

        # === POSITION ===
        x = min(self.tooltip_pos[0] + 20, SCREEN_WIDTH - tooltip_w - 10)
        y = max(self.tooltip_pos[1] - tooltip_h - 10, 10)
        if y + tooltip_h > SCREEN_HEIGHT - 10:
            y = SCREEN_HEIGHT - tooltip_h - 10

        # === DRAW BACKGROUND ===
        tooltip_rect = pygame.Rect(x, y, tooltip_w, tooltip_h)
        pygame.draw.rect(self.screen, (20, 20, 28), tooltip_rect, border_radius=12)
        pygame.draw.rect(self.screen, PALETTE_DEATH_HOWL['ACCENT_GOLD'], tooltip_rect, width=2, border_radius=12)

        py = y + padding

        # === CARD NAME ===
        card_name = card['name']
        name_surface = FONT_LARGE.render(card_name, True, PALETTE_DEATH_HOWL['ACCENT_GOLD'])
        self.screen.blit(name_surface, (x + padding, py))
        py += 30

        # === SEPARATOR ===
        pygame.draw.line(self.screen, PALETTE_DEATH_HOWL['UI_BURNT_EDGE'],
                        (x + padding, py), (x + tooltip_w - padding, py), 1)
        py += 8

        # === STATS LINE ===
        card_type = card.get('type', '?')
        # Use text labels instead of problematic emoji
        type_label = {'TERRA': '[Terra]', 'FUOCO': '🔥 Fuoco', 'TERRORE': '[Terrore]', 'HYBRID': '[Ibrida]', 'UTIL': '[Utilita]'}.get(card_type, '[?]')

        stats_parts = [type_label]

        # Cooldown
        cd = card.get('cooldown', 0)
        if cd > 0:
            stats_parts.append(f"CD: {cd} turno{'i' if cd > 1 else ''}")
        else:
            stats_parts.append("CD: Nessuno")

        # Range (only for attack cards)
        if card.get('target_type') in ['ENEMY', 'AREA_ENEMY']:
            stats_parts.append(f"Gittata: {desc['range']}")

        stats_text = " | ".join(stats_parts)
        stats_surface = render_text_with_emoji(stats_text, FONT_SMALL, FONT_EMOJI, COLOR_TEXT_DIM)
        self.screen.blit(stats_surface, (x + padding, py))
        py += 24

        # === SUPPLY (if any) ===
        if desc['supply']:
            supply_text = f"[SUPPLY]: {desc['supply']}"
            supply_surface = FONT_SMALL.render(supply_text, True, (100, 180, 100))
            self.screen.blit(supply_surface, (x + padding, py))
            py += 22

        py += 5

        # === COME USARLA ===
        header_surface = FONT_SMALL.render("COME USARLA:", True, COLOR_SUCCESS)
        self.screen.blit(header_surface, (x + padding, py))
        py += 24

        # Render each line of how_to_use
        for line in how_to_lines:
            if not line.strip():
                py += 8  # Empty line = small gap
                continue

            # Handle bullet points and emoji
            line_surface = render_text_with_emoji(line, FONT_SMALL, FONT_EMOJI, COLOR_TEXT)
            self.screen.blit(line_surface, (x + padding + 5, py))
            py += line_height

        # === SCARTO ===
        if desc['discard_tip']:
            py += 10
            pygame.draw.line(self.screen, (60, 50, 40),
                            (x + padding, py), (x + tooltip_w - padding, py), 1)
            py += 10

            discard_header = FONT_SMALL.render("[SCARTO]:", True, COLOR_WARNING)
            self.screen.blit(discard_header, (x + padding, py))
            py += 20

            discard_surface = FONT_SMALL.render(desc['discard_tip'], True, (180, 160, 140))
            self.screen.blit(discard_surface, (x + padding + 5, py))

    def draw_maneuver_tooltip(self, maneuver, mouse_pos):
        """Draw tooltip for dice maneuvers (basic actions).

        Shows:
        - Maneuver name
        - Cost
        - Effect
        - Tip
        """
        m_id = maneuver.get('id', '')
        m_desc = get_maneuver_description(m_id)

        if not m_desc:
            # Fallback if no description found
            m_desc = {
                'name': maneuver.get('name', 'Manovra'),
                'cost': '?',
                'effect': '?',
                'tip': '',
            }

        # Tooltip dimensions
        tooltip_w = 300
        tooltip_h = 130
        padding = 12

        # Position to the right of the panel
        x = 280  # Right of dice panel
        y = mouse_pos[1] - tooltip_h // 2

        # Keep on screen
        if y < 10:
            y = 10
        if y + tooltip_h > SCREEN_HEIGHT - 10:
            y = SCREEN_HEIGHT - tooltip_h - 10

        # Draw background
        tooltip_rect = pygame.Rect(x, y, tooltip_w, tooltip_h)
        pygame.draw.rect(self.screen, (25, 25, 35), tooltip_rect, border_radius=10)
        pygame.draw.rect(self.screen, COLOR_WARNING, tooltip_rect, width=2, border_radius=10)

        py = y + padding

        # Name
        name_surface = FONT_MEDIUM.render(m_desc['name'], True, COLOR_WARNING)
        self.screen.blit(name_surface, (x + padding, py))
        py += 28

        # Separator
        pygame.draw.line(self.screen, (60, 50, 40),
                        (x + padding, py), (x + tooltip_w - padding, py), 1)
        py += 8

        # Cost
        cost_text = f"Costo: {m_desc['cost']}"
        cost_surface = render_text_with_emoji(cost_text, FONT_SMALL, FONT_EMOJI, COLOR_TEXT)
        self.screen.blit(cost_surface, (x + padding, py))
        py += 20

        # Effect
        effect_text = f"Effetto: {m_desc['effect']}"
        effect_surface = render_text_with_emoji(effect_text, FONT_SMALL, FONT_EMOJI, COLOR_SUCCESS)
        self.screen.blit(effect_surface, (x + padding, py))
        py += 22

        # Tip
        if m_desc.get('tip'):
            tip_surface = FONT_TINY.render(m_desc['tip'], True, COLOR_TEXT_DIM)
            self.screen.blit(tip_surface, (x + padding, py))

    def run(self):
        while self.running:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    self.running = False
                elif event.type == pygame.MOUSEBUTTONDOWN:
                    if event.button == 1:  # Left click
                        self.handle_click(event.pos)
                    elif event.button == 3:  # Right click - show tooltip
                        self.handle_right_click(event.pos)
                elif event.type == pygame.MOUSEBUTTONUP:
                    if event.button == 3:  # Release right click - hide tooltip
                        self.tooltip_card_idx = None
                        self.tooltip_pos = None
                elif event.type == pygame.MOUSEMOTION:
                    self.handle_motion(event.pos)
                elif event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_ESCAPE:
                        if self.selecting_target_die_for_card:
                            # Cancel special card die selection (STEP 6)
                            self.selecting_target_die_for_card = None
                            self.selected_card_idx = None
                            self.current_card = None
                            self.add_log("❌ Selezione dado annullata")
                        elif self.multi_target_mode and self.selecting_impulses:
                            # Cancel impulse selection in multi-target mode (stay in multi-target)
                            self.selecting_impulses = False
                            if hasattr(self, 'impulse_target_enemy'):
                                del self.impulse_target_enemy
                            self.add_log("   Selezione impulsi annullata")
                        elif self.multi_target_mode:
                            # Check if card resolution has started
                            if self.multi_target_started:
                                # Can't cancel once you've used impulses
                                self.add_log("⚠️ Non puoi annullare! Completa con SPAZIO o continua ad attaccare")
                            else:
                                # Cancel multi-target mode before first impulse used
                                self.add_log("❌ Carta annullata")
                                self.multi_target_mode = False
                                self.multi_target_card = None
                                self.multi_target_remaining_impulses = 0
                                self.multi_target_die_idx = None
                                self.multi_target_card_idx = None
                                self.multi_target_started = False
                                self.multi_target_current_effect_idx = 0
                                self.valid_targets = []

                        elif self.selecting_impulses:
                            # Cancel impulse selection
                            self.selecting_impulses = False
                            self.current_maneuver = None
                            self.add_log("   Annullato")
                        elif self.allocating_impulses:
                            # Cancel impulse allocation
                            self.allocating_impulses = False
                            self.pending_card_data = None
                            self.add_log("   Allocazione annullata")
                        elif self.current_card:
                            # Deselect active card
                            self.add_log("❌ Carta deselezionata")
                            self.reset_selection()
                        else:
                            self.running = False
                    elif event.key == pygame.K_SPACE:
                        # Block SPACE if jolly selection modal is active
                        if self.jolly_selection_active:
                            pass  # Ignore - must click on modal buttons
                        elif self.phase == "DiscardPhase":
                            # v0.0.3: Discard selected cards with payload effects
                            if self.discard_selection:
                                # Sort in reverse to avoid index shifting issues
                                for idx in sorted(self.discard_selection, reverse=True):
                                    card_id = self.state.player['hand'][idx]
                                    card = next((c for c in CARDS if c['id'] == card_id), None)
                                    card_name = card['name'] if card else card_id
                                    self.state.player['discard'].append(card_id)
                                    self.state.player['hand'].pop(idx)
                                    self.add_log(f"   📥 {card_name} → Scarto")

                                    # v0.0.3: +1 PM to buffer for each discard
                                    self.state.next_turn_buffer.append({'type': 'PM', 'value': 1})
                                    self.add_log(f"      💎 +1 PM → Buffer")

                                    # v0.0.3: Execute discard_payload
                                    payload = 'NONE'
                                    payload_result = 'NONE'
                                    if card:
                                        payload = card.get('discard_payload', 'NONE')
                                        payload_result = self.execute_discard_payload(payload, card)

                                    # v0.0.3: Telemetry - log card discard
                                    if card:
                                        self.state.tracker.log_card_discarded(
                                            card=card,
                                            discard_type='VOLUNTARY',
                                            payload_type=payload,
                                            payload_result=payload_result,
                                            context=self.state.tracker.get_context_snapshot(self.state)
                                        )

                                self.add_log(f"✅ {len(self.discard_selection)} carte scartate")
                            else:
                                self.add_log("✅ Nessuna carta scartata")
                            self.discard_selection = []

                            # v0.0.3 FIX: Process GEN_JOLLY queue if any
                            if self.jolly_selection_queue:
                                self.process_jolly_queue()
                            else:
                                # No jolly selections needed - go to next turn
                                self.next_turn()
                        elif self.multi_target_mode:
                            # Confirm and complete multi-target card
                            self.add_log("✅ Carta confermata")
                            self.complete_multi_target_card()
                        elif self.charging_state['active']:
                            # Complete Carica Furiosa charge
                            self.end_charge()
                        elif self.state and self.phase in ["Upkeep", "Roll"]:  # [DISABLED] Removed "TerrorSwap"
                            # Handle phase transitions BEFORE current_card check
                            if self.phase == "Upkeep":
                                self.upkeep_phase()
                            # [DISABLED] Terror Swap handler
                            # elif self.phase == "TerrorSwap":
                            #     # Skip Terror Swap - proceed to Roll
                            #     self.add_log("   → Terror Swap saltato")
                            #     # Clear any card selection from clicking
                            #     self.reset_selection()
                            #     self.phase = "Roll"
                            #     self.roll_phase()
                            elif self.phase == "Roll":
                                self.roll_phase()
                        elif self.current_card and self.phase == "Resolution":
                            # Only execute cards during Resolution phase
                            self.execute_card()
                    elif event.key == pygame.K_TAB:
                        # Advance to next effect in multi-target mode
                        if self.multi_target_mode and not self.selecting_impulses:
                            self.advance_to_next_effect()
                    elif event.key == pygame.K_d:

                        # Discard current die without using impulses
                        if self.state and self.phase == "Resolution" and not self.current_card:
                            self.discard_current_die()
                    elif event.key >= pygame.K_1 and event.key <= pygame.K_9:
                        if self.state and self.phase == "Resolution" and not self.current_card:
                            idx = event.key - pygame.K_1
                            if idx < len(self.state.player['hand']):
                                self.play_card(idx)

            self.render()
            self.clock.tick(FPS)
            
        pygame.quit()
        sys.exit()

if __name__ == "__main__":
    game = PlayerGame()
    game.run()
