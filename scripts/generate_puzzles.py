"""
Puzzle generator for Fruit Nerdle.
Generates n days of 5-puzzle challenge sets with difficulty progression.

Usage:
    python scripts/generate_puzzles.py --days 30

Difficulty tiers per day:
    Q1:    no-* operators, target 5-23   (gentle warm-up, diverse patterns)
    Q2:    no-* operators, target 5-36   (moderate, division patterns)
    Q3:    target 30-99   (moderate, full operators)
    Q4-Q5: target 50-160  (full range, harder)

Games 1-2 use restricted operator dials (no *) with blank slots.
Games 3-5 use standard [+, -, *, /] operators.

Each puzzle has exactly 1 solution across all dial combinations.
Number dials: 5 unique values from 1-12.
"""

import argparse
import json
import random
import os
import sys

OPERATORS = ['+', '-', '*', '/']
NUMBERS = list(range(1, 13))  # 1-12

# Operator configurations for restricted games (no *)
# Blanks ('') fill remaining positions to keep 4 slots per operator dial
OPERATOR_CONFIGS = {
    0: {  # Game 1: patterns +-:73%, +/:27%
        'ops1': ['+', '', '-', ''],
        'ops3': ['-', '', '/', ''],
    },
    1: {  # Game 2: patterns ++:76%, //:11%, +/:8%, /+:5%
        'ops1': ['+', '', '/', ''],
        'ops3': ['+', '', '/', ''],
    },
    # Games 3-5 use default OPERATORS (no blanks)
}

# Difficulty tiers: (puzzle_slot, min_target, max_target, op_config_key_or_None)
TIERS = [
    (0, 5, 23, 0),       # Q1: restricted ops, small targets
    (1, 5, 36, 1),       # Q2: restricted ops, medium-small targets
    (2, 30, 99, None),   # Q3: full operators, moderate
    (3, 50, 160, None),  # Q4: full operators, full range
    (4, 50, 160, None),  # Q5: full operators, full range
]


def precedence(op: str) -> int:
    return 2 if op in ('*', '/') else 1


def apply_op(a: float, op: str, b: float):
    if op == '+': return a + b
    if op == '-': return a - b
    if op == '*': return a * b
    if op == '/':
        if b == 0: return None
        return a / b
    return None  # blank operator


def evaluate_expression(n1, op1, n2, op2, n3):
    """Evaluate with standard order of operations. Returns int or None."""
    if op1 == '' or op2 == '':
        return None  # blank operator

    if precedence(op1) >= precedence(op2):
        left = apply_op(n1, op1, n2)
        if left is None: return None
        result = apply_op(left, op2, n3)
    else:
        right = apply_op(n2, op2, n3)
        if right is None: return None
        result = apply_op(n1, op1, right)

    if result is None: return None
    if not float(result).is_integer(): return None
    result = int(result)
    if result <= 0: return None
    return result


def effective_circular_distance(a: int, b: int, values: list) -> int:
    """
    Effective distance between two positions on a dial, skipping blanks.
    Simulates nudge behavior where blanks are auto-skipped (free).
    """
    if a == b:
        return 0
    size = len(values)

    # Check if there are any blanks; shortcut for standard dials
    has_blanks = any(v == '' for v in values)
    if not has_blanks:
        diff = abs(a - b)
        return min(diff, size - diff)

    # Count forward hops (only non-blank positions count)
    forward = 0
    pos = a
    while pos != b:
        pos = (pos + 1) % size
        if values[pos] != '':
            forward += 1

    # Count backward hops
    backward = 0
    pos = a
    while pos != b:
        pos = (pos - 1) % size
        if values[pos] != '':
            backward += 1

    return min(forward, backward)


def config_distance(config: list, solution: list, all_values: list) -> int:
    """Total effective distance across all 5 dials."""
    return sum(
        effective_circular_distance(config[i], solution[i], all_values[i])
        for i in range(5)
    )


def has_valid_spin_stop(solution_indices: list, all_values: list, min_dist: int = 3) -> bool:
    """Check that a starting position exists that is >= min_dist effective moves from solution."""
    # Dials with blanks: start ON a blank so player must nudge.
    # Dials without blanks: any index is valid.
    valid_indices = []
    for vals in all_values:
        blanks = [i for i, v in enumerate(vals) if v == '']
        valid_indices.append(blanks if blanks else list(range(len(vals))))

    for _ in range(200):
        candidate = [random.choice(vi) for vi in valid_indices]
        if config_distance(candidate, solution_indices, all_values) >= min_dist:
            return True
    return False


def random_number_dial() -> list:
    """Generate a dial with 5 unique random numbers from 1-12."""
    return random.sample(NUMBERS, 5)


def find_single_solution_targets(dial0, ops1, dial2, ops3, dial4):
    """
    Enumerate all combinations across the 3 number dials and the given
    operator dials. Return dict of {target: solution_indices} for targets
    that have exactly 1 solution.
    """
    results_map = {}  # target -> list of solution index tuples

    # Only iterate over non-blank operator positions
    non_blank_1 = [(i, op) for i, op in enumerate(ops1) if op != '']
    non_blank_3 = [(i, op) for i, op in enumerate(ops3) if op != '']

    for i0 in range(len(dial0)):
        for i1, op1 in non_blank_1:
            for i2 in range(len(dial2)):
                for i3, op3 in non_blank_3:
                    for i4 in range(len(dial4)):
                        result = evaluate_expression(
                            dial0[i0], op1, dial2[i2],
                            op3, dial4[i4]
                        )
                        if result is not None:
                            if result not in results_map:
                                results_map[result] = []
                            results_map[result].append([i0, i1, i2, i3, i4])

    # Return only targets with exactly 1 solution
    return {t: sols[0] for t, sols in results_map.items() if len(sols) == 1}


def generate_puzzle(min_target: int, max_target: int, used_targets: set,
                    ops1=None, ops3=None, max_attempts: int = 10000):
    """
    Generate a single puzzle within the target range.
    ops1/ops3: operator dial values (e.g. ['+', '-', '', ''] for restricted).
    """
    ops1 = ops1 or OPERATORS[:]
    ops3 = ops3 or OPERATORS[:]

    for _ in range(max_attempts):
        dial0 = random_number_dial()
        dial2 = random_number_dial()
        dial4 = random_number_dial()

        candidates = find_single_solution_targets(dial0, ops1, dial2, ops3, dial4)

        # Filter to desired range, excluding used targets
        valid = {t: s for t, s in candidates.items()
                 if min_target <= t <= max_target and t not in used_targets}

        if not valid:
            continue

        # Pick a random valid target
        target = random.choice(list(valid.keys()))
        solution_indices = valid[target]

        # Build all_values for distance/spin-stop calculation
        all_values = [dial0, ops1, dial2, ops3, dial4]
        if not has_valid_spin_stop(solution_indices, all_values):
            continue

        # Reconstruct expression for logging
        n1 = dial0[solution_indices[0]]
        op1 = ops1[solution_indices[1]]
        n2 = dial2[solution_indices[2]]
        op2 = ops3[solution_indices[3]]
        n3 = dial4[solution_indices[4]]

        return {
            "target": target,
            "dials": [dial0, ops1[:], dial2, ops3[:], dial4],
            "solution_indices": solution_indices,
            "expression": f"{n1} {op1} {n2} {op2} {n3}",
        }

    return None


def generate_day(day_num: int) -> dict:
    """Generate a day's set of 5 puzzles with difficulty progression."""
    used_targets = set()
    puzzles = []

    for slot, min_t, max_t, op_config_key in TIERS:
        # Get operator config for this slot
        ops1 = None
        ops3 = None
        if op_config_key is not None and op_config_key in OPERATOR_CONFIGS:
            config = OPERATOR_CONFIGS[op_config_key]
            ops1 = config['ops1']
            ops3 = config['ops3']

        puzzle_data = generate_puzzle(min_t, max_t, used_targets, ops1=ops1, ops3=ops3)
        if puzzle_data is None:
            print(f"  WARNING: Failed to generate puzzle for day {day_num}, slot {slot + 1} "
                  f"(target range {min_t}-{max_t})", file=sys.stderr)
            return None

        used_targets.add(puzzle_data["target"])

        puzzle = {
            "id": f"d{day_num:03d}-p{slot + 1}",
            "target": puzzle_data["target"],
            "dials": [
                {"type": "number", "values": puzzle_data["dials"][0]},
                {"type": "operator", "values": puzzle_data["dials"][1]},
                {"type": "number", "values": puzzle_data["dials"][2]},
                {"type": "operator", "values": puzzle_data["dials"][3]},
                {"type": "number", "values": puzzle_data["dials"][4]},
            ],
            "solutions": [puzzle_data["solution_indices"]],
        }
        puzzles.append(puzzle)

        ops_label = "restricted" if op_config_key is not None else "standard"
        print(f"  P{slot + 1}: {puzzle_data['expression']} = {puzzle_data['target']}  "
              f"solution={puzzle_data['solution_indices']}  [{ops_label}]")

    return {"day": day_num, "puzzles": puzzles}


def verify_all(days: list):
    """Verification pass: re-check every puzzle has exactly 1 solution."""
    print("\n--- VERIFICATION ---")
    all_ok = True
    for day_data in days:
        for puzzle in day_data["puzzles"]:
            dials_values = [d["values"] for d in puzzle["dials"]]
            ops1 = dials_values[1]
            ops3 = dials_values[3]
            targets = find_single_solution_targets(
                dials_values[0], ops1, dials_values[2], ops3, dials_values[4]
            )
            target = puzzle["target"]
            if target in targets:
                print(f"  {puzzle['id']}: target={target} ok")
            else:
                # Count actual solutions for error reporting
                non_blank_1 = [(i, op) for i, op in enumerate(ops1) if op != '']
                non_blank_3 = [(i, op) for i, op in enumerate(ops3) if op != '']
                count = 0
                for i0 in range(5):
                    for i1, op1 in non_blank_1:
                        for i2 in range(5):
                            for i3, op3 in non_blank_3:
                                for i4 in range(5):
                                    r = evaluate_expression(
                                        dials_values[0][i0], op1,
                                        dials_values[2][i2], op3,
                                        dials_values[4][i4]
                                    )
                                    if r == target:
                                        count += 1
                print(f"  {puzzle['id']}: target={target} FAIL ({count} solutions)")
                all_ok = False
    return all_ok


def main():
    parser = argparse.ArgumentParser(description="Generate Fruit Nerdle puzzle sets")
    parser.add_argument("--days", type=int, default=30, help="Number of days to generate (default: 30)")
    parser.add_argument("--seed", type=int, default=None, help="Random seed for reproducibility")
    args = parser.parse_args()

    if args.seed is not None:
        random.seed(args.seed)

    print(f"Generating {args.days} days of puzzles...\n")

    days = []
    for day_num in range(1, args.days + 1):
        print(f"Day {day_num}:")
        day_data = generate_day(day_num)
        if day_data is None:
            print(f"ERROR: Could not generate day {day_num}. Stopping.", file=sys.stderr)
            sys.exit(1)
        days.append(day_data)

    # Verification
    if not verify_all(days):
        print("\nERROR: Verification failed!", file=sys.stderr)
        sys.exit(1)

    # Write output
    script_dir = os.path.dirname(os.path.abspath(__file__))
    out_path = os.path.join(script_dir, "..", "src", "data", "puzzles.json")
    out_path = os.path.normpath(out_path)

    with open(out_path, "w") as f:
        json.dump(days, f, indent=2)

    print(f"\nWrote {len(days)} days ({len(days) * 5} puzzles) to {out_path}")


if __name__ == "__main__":
    main()
