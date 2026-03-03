# HEX_UTILS.PY - Converted from hex_utils.js
# Hex grid utility functions for distance, neighbors, cones, etc.

import math
import random
from gamedata import CONSTANTS as C

class HexUtils:
    @staticmethod
    def offset_to_cube(row, col):
        # Convert from 1-indexed to 0-indexed for standard hex formulas
        # Using odd-r layout (same as JavaScript version)
        row0 = row - 1
        col0 = col - 1
        q = col0 - row0 // 2
        r = row0
        return {'q': q, 'r': r, 's': -q - r}
    
    @staticmethod
    def cube_to_offset(cube):
        # For odd-r layout (same as JavaScript version)
        row0 = cube['r']
        col0 = cube['q'] + cube['r'] // 2
        # Convert back to 1-indexed
        return {'r': row0 + 1, 'q': col0 + 1}
    
    @staticmethod
    def get_distance(p1, p2):
        c1 = HexUtils.offset_to_cube(p1['r'], p1['q'])
        c2 = HexUtils.offset_to_cube(p2['r'], p2['q'])
        return (abs(c1['q'] - c2['q']) + abs(c1['r'] - c2['r']) + abs(c1['s'] - c2['s'])) // 2
    
    @staticmethod
    def get_neighbors(pos):
        neighbors = []
        for r in range(1, C['MAP']['ROWS'] + 1):
            for q in range(1, C['MAP']['COLS'] + 1):
                if r == pos['r'] and q == pos['q']:
                    continue
                if HexUtils.get_distance(pos, {'r': r, 'q': q}) == 1:
                    neighbors.append({'r': r, 'q': q})
        return neighbors
    
    @staticmethod
    def lerp(a, b, t):
        return a + (b - a) * t
    
    @staticmethod
    def cube_lerp(a, b, t):
        return {
            'q': HexUtils.lerp(a['q'], b['q'], t),
            'r': HexUtils.lerp(a['r'], b['r'], t),
            's': HexUtils.lerp(a['s'], b['s'], t)
        }
    
    @staticmethod
    def cube_round(cube):
        q = round(cube['q'])
        r = round(cube['r'])
        s = round(cube['s'])
        
        q_diff = abs(q - cube['q'])
        r_diff = abs(r - cube['r'])
        s_diff = abs(s - cube['s'])
        
        if q_diff > r_diff and q_diff > s_diff:
            q = -r - s
        elif r_diff > s_diff:
            r = -q - s
        else:
            s = -q - r
            
        return {'q': q, 'r': r, 's': s}
    
    @staticmethod
    def get_cone(origin, direction_hex, range_val=3):
        """Create an expanding cone in the direction of an adjacent hex.

        The direction MUST be an adjacent hex (distance 1 from origin).
        The cone expands as follows:
        - Distance 1: 2 hexes
        - Distance 2: 3 hexes
        - Distance 3: 4 hexes
        - Distance d: d+1 hexes

        Total for range 3: 2+3+4 = 9 hexes
        Range 4 adds 5 more hexes (total 14)
        Range 5 adds 6 more hexes (total 20)
        """
        # Convert to cube coordinates
        o_cube = HexUtils.offset_to_cube(origin['r'], origin['q'])
        d_cube = HexUtils.offset_to_cube(direction_hex['r'], direction_hex['q'])

        # Calculate direction vector
        dir_q = d_cube['q'] - o_cube['q']
        dir_r = d_cube['r'] - o_cube['r']
        dir_s = d_cube['s'] - o_cube['s']

        # The 6 cube directions
        CUBE_DIRS = [
            (1, 0, -1),   # 0: East
            (1, -1, 0),   # 1: NE
            (0, -1, 1),   # 2: NW
            (-1, 0, 1),   # 3: West
            (-1, 1, 0),   # 4: SW
            (0, 1, -1),   # 5: SE
        ]

        # Find which direction this is
        dir_idx = -1
        for i, (dq, dr, ds) in enumerate(CUBE_DIRS):
            if dir_q == dq and dir_r == dr and dir_s == ds:
                dir_idx = i
                break

        if dir_idx == -1:
            # Not a valid adjacent direction - return empty
            return []

        main_dir = CUBE_DIRS[dir_idx]
        # Spread direction: +2 to follow the hex ring correctly (120 degrees CCW)
        spread_dir = CUBE_DIRS[(dir_idx + 2) % 6]

        area_hexes = []

        for dist in range(1, range_val + 1):
            num_hexes = dist + 1  # 2 at dist 1, 3 at dist 2, 4 at dist 3, etc.

            # Start position: corner of ring segment at this distance
            start_q = o_cube['q'] + main_dir[0] * dist
            start_r = o_cube['r'] + main_dir[1] * dist
            start_s = o_cube['s'] + main_dir[2] * dist

            # Generate hexes along the ring segment
            for i in range(num_hexes):
                hex_q = start_q + spread_dir[0] * i
                hex_r = start_r + spread_dir[1] * i
                hex_s = start_s + spread_dir[2] * i

                offset = HexUtils.cube_to_offset({'q': hex_q, 'r': hex_r, 's': hex_s})

                # Check if valid position on map
                if HexUtils.is_valid(offset):
                    area_hexes.append(offset)

        return area_hexes
    
    @staticmethod
    def is_valid(h):
        return h['r'] >= 1 and h['r'] <= C['MAP']['ROWS'] and h['q'] >= 1 and h['q'] <= C['MAP']['COLS']
    
    @staticmethod
    def move_towards(start, end):
        neighbors = HexUtils.get_neighbors(start)
        best_options = []
        min_dist = float('inf')

        # Find all neighbors with the minimum distance
        for n in neighbors:
            d = HexUtils.get_distance(n, end)
            if d < min_dist:
                # Found better option - reset list
                min_dist = d
                best_options = [n]
            elif d == min_dist:
                # Found equivalent option at same distance - add to list
                best_options.append(n)

        # If we found improvements, pick randomly among the best options
        if best_options:
            return random.choice(best_options)
        # Otherwise stay in place
        return start
    
    @staticmethod
    def is_engaged(entity, enemies):
        """Check if entity is engaged (adjacent to enemies)"""
        return any(e['hp'] > 0 and HexUtils.get_distance(entity['pos'], e['pos']) <= 1 for e in enemies)

    @staticmethod
    def get_direction(from_pos, to_pos):
        """Get the cube direction vector from from_pos towards to_pos.
        Returns a tuple (dq, dr, ds) representing the direction, or None if same position.
        """
        c1 = HexUtils.offset_to_cube(from_pos['r'], from_pos['q'])
        c2 = HexUtils.offset_to_cube(to_pos['r'], to_pos['q'])

        dq = c2['q'] - c1['q']
        dr = c2['r'] - c1['r']
        ds = c2['s'] - c1['s']

        if dq == 0 and dr == 0 and ds == 0:
            return None

        # Normalize to unit direction (approximate)
        max_val = max(abs(dq), abs(dr), abs(ds))
        if max_val > 0:
            # Round to nearest valid cube direction
            dq = round(dq / max_val)
            dr = round(dr / max_val)
            ds = round(ds / max_val)
            # Ensure cube constraint: q + r + s = 0
            if dq + dr + ds != 0:
                ds = -dq - dr

        return (dq, dr, ds)

    @staticmethod
    def add_direction(pos, direction):
        """Add a cube direction tuple to an offset position, returning new offset position."""
        if direction is None:
            return pos

        cube = HexUtils.offset_to_cube(pos['r'], pos['q'])
        new_cube = {
            'q': cube['q'] + direction[0],
            'r': cube['r'] + direction[1],
            's': cube['s'] + direction[2]
        }
        return HexUtils.cube_to_offset(new_cube)
