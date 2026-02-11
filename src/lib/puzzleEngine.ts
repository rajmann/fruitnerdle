import type { FruitPuzzle, Operator } from '@/types/puzzle';
import { evaluateExpression, evaluateWord } from './evaluate';

/** Check if a puzzle is a word puzzle (all letter dials). */
export function isWordPuzzle(puzzle: FruitPuzzle): boolean {
  return puzzle.dials[0].type === 'letter';
}

/**
 * Circular distance between two positions on a dial of given size.
 */
export function circularDistance(a: number, b: number, size: number): number {
  const diff = Math.abs(a - b);
  return Math.min(diff, size - diff);
}

/**
 * Total Manhattan distance between two configurations across all 5 dials.
 */
export function configDistance(
  config: number[],
  solution: number[],
  dialSizes: number[],
): number {
  let total = 0;
  for (let i = 0; i < 5; i++) {
    total += circularDistance(config[i], solution[i], dialSizes[i]);
  }
  return total;
}

/**
 * Minimum distance from a configuration to any solution.
 */
export function minDistanceToAnySolution(
  config: number[],
  solutions: number[][],
  dialSizes: number[],
): number {
  return Math.min(
    ...solutions.map(sol => configDistance(config, sol, dialSizes))
  );
}

/**
 * Evaluate a dial configuration and return the result (or null).
 */
function evaluateConfig(puzzle: FruitPuzzle, indices: number[]): number | string | null {
  const values = indices.map((idx, i) => puzzle.dials[i].values[idx]);
  if (isWordPuzzle(puzzle)) {
    return evaluateWord(values);
  }
  return evaluateExpression(
    values[0] as number,
    values[1] as string as Operator,
    values[2] as number,
    values[3] as string as Operator,
    values[4] as number,
  );
}

/**
 * Check that no visible preview row (uniform offsets -2, -1, +1, +2)
 * evaluates to the target. Prevents the answer being visible in preview rows.
 */
function previewRowsAreSafe(puzzle: FruitPuzzle, candidate: number[], dialSizes: number[]): boolean {
  for (const offset of [-2, -1, 1, 2]) {
    const shifted = candidate.map((idx, i) =>
      ((idx + offset) % dialSizes[i] + dialSizes[i]) % dialSizes[i]
    );
    if (evaluateConfig(puzzle, shifted) === puzzle.target) {
      return false;
    }
  }
  return true;
}

/**
 * Find a valid random spin stop position that is at least minDistance
 * moves from any solution, does not equal the target, and whose
 * visible preview rows also don't reveal the answer.
 */
export function findValidSpinStop(puzzle: FruitPuzzle, minDistance = 3): number[] {
  const dialSizes = puzzle.dials.map(d => d.values.length);
  const MAX_ATTEMPTS = 500;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const candidate = dialSizes.map(size => Math.floor(Math.random() * size));

    const minDist = minDistanceToAnySolution(candidate, puzzle.solutions, dialSizes);
    if (minDist < minDistance) continue;

    // Verify center position doesn't equal the target
    if (evaluateConfig(puzzle, candidate) === puzzle.target) continue;

    // Verify preview rows don't reveal the answer
    if (!previewRowsAreSafe(puzzle, candidate, dialSizes)) continue;

    return candidate;
  }

  // Exhaustive fallback
  return findSpinStopExhaustive(puzzle, minDistance);
}

function findSpinStopExhaustive(puzzle: FruitPuzzle, minDistance: number): number[] {
  const dialSizes = puzzle.dials.map(d => d.values.length);
  const indices = [0, 0, 0, 0, 0];

  while (true) {
    const dist = minDistanceToAnySolution(indices, puzzle.solutions, dialSizes);
    if (dist >= minDistance) {
      if (evaluateConfig(puzzle, indices) !== puzzle.target
        && previewRowsAreSafe(puzzle, indices, dialSizes)) {
        return [...indices];
      }
    }

    // Increment odometer-style
    let carry = true;
    for (let i = 4; i >= 0 && carry; i--) {
      indices[i]++;
      if (indices[i] >= dialSizes[i]) {
        indices[i] = 0;
      } else {
        carry = false;
      }
    }

    if (carry) break;
  }

  throw new Error('No valid spin stop position found');
}

/**
 * Calculate coin payout based on how many moves over the minimum.
 * Base tiers: min moves = 5, +1-2 = 4, +3-5 = 3, +6-9 = 2, 10+ extra = 1
 * reduction lowers all tiers: 0 for hard, 1 for medium, 2 for easy.
 * Minimum payout is always 1.
 */
export function calculatePayout(moveCount: number, minMoves: number, reduction = 0): number {
  const extra = moveCount - minMoves;
  let payout: number;
  if (extra <= 0) payout = 5;
  else if (extra <= 2) payout = 4;
  else if (extra <= 5) payout = 3;
  else if (extra <= 9) payout = 2;
  else payout = 1;
  return Math.max(1, payout - reduction);
}

/**
 * Count all solutions for a puzzle (for verification).
 */
export function countSolutions(puzzle: FruitPuzzle): { count: number; solutions: number[][] } {
  const [d0, d1, d2, d3, d4] = puzzle.dials;
  const solutions: number[][] = [];

  for (let i0 = 0; i0 < d0.values.length; i0++) {
    for (let i1 = 0; i1 < d1.values.length; i1++) {
      for (let i2 = 0; i2 < d2.values.length; i2++) {
        for (let i3 = 0; i3 < d3.values.length; i3++) {
          for (let i4 = 0; i4 < d4.values.length; i4++) {
            const result = evaluateConfig(puzzle, [i0, i1, i2, i3, i4]);
            if (result === puzzle.target) {
              solutions.push([i0, i1, i2, i3, i4]);
            }
          }
        }
      }
    }
  }

  return { count: solutions.length, solutions };
}
