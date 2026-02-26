import type { FruitPuzzle, DialConfig, Operator } from '@/types/puzzle';
import { evaluateExpression } from './evaluate';

/**
 * Circular distance between two positions on a dial of given size.
 */
export function circularDistance(a: number, b: number, size: number): number {
  const diff = Math.abs(a - b);
  return Math.min(diff, size - diff);
}

/**
 * Effective distance between two positions on a dial, skipping blank values.
 * Simulates actual nudge behavior where blanks are auto-skipped (free).
 * For dials with no blanks, equivalent to circularDistance.
 */
export function effectiveCircularDistance(
  a: number,
  b: number,
  values: (number | string)[],
): number {
  if (a === b) return 0;
  const size = values.length;

  // Count forward hops (only non-blank positions count as a move)
  let forward = 0;
  let pos = a;
  while (pos !== b) {
    pos = (pos + 1) % size;
    if (values[pos] !== '') forward++;
  }

  // Count backward hops
  let backward = 0;
  pos = a;
  while (pos !== b) {
    pos = (pos - 1 + size) % size;
    if (values[pos] !== '') backward++;
  }

  return Math.min(forward, backward);
}

/**
 * Total Manhattan distance between two configurations across all 5 dials,
 * accounting for blank positions on operator dials.
 */
export function configDistance(
  config: number[],
  solution: number[],
  dials: DialConfig[],
): number {
  let total = 0;
  for (let i = 0; i < 5; i++) {
    total += effectiveCircularDistance(config[i], solution[i], dials[i].values);
  }
  return total;
}

/**
 * Minimum distance from a configuration to any solution.
 */
export function minDistanceToAnySolution(
  config: number[],
  solutions: number[][],
  dials: DialConfig[],
): number {
  return Math.min(
    ...solutions.map(sol => configDistance(config, sol, dials))
  );
}

/**
 * Evaluate a dial configuration and return the result (or null).
 */
function evaluateConfig(puzzle: FruitPuzzle, indices: number[]): number | null {
  const values = indices.map((idx, i) => puzzle.dials[i].values[idx]);
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
function previewRowsAreSafe(puzzle: FruitPuzzle, candidate: number[]): boolean {
  const dialSizes = puzzle.dials.map(d => d.values.length);
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
 * Preferred spin-stop indices per dial.
 * Dials with blanks: land ON a blank so the player must nudge at least once.
 * Dials without blanks: any index is valid.
 */
function spinStopCandidateIndices(puzzle: FruitPuzzle): number[][] {
  return puzzle.dials.map(d => {
    const blanks = d.values.map((v, i) => ({ v, i })).filter(x => x.v === '').map(x => x.i);
    // If dial has blanks, prefer starting on a blank
    if (blanks.length > 0) return blanks;
    // Otherwise all indices are valid
    return d.values.map((_, i) => i);
  });
}

/**
 * Find a valid random spin stop position that is at least minDistance
 * moves from any solution, does not equal the target, does not land
 * on blank positions, and whose preview rows don't reveal the answer.
 */
export function findValidSpinStop(puzzle: FruitPuzzle, minDistance = 3): number[] {
  const validIndices = spinStopCandidateIndices(puzzle);
  const MAX_ATTEMPTS = 500;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const candidate = validIndices.map(vi => vi[Math.floor(Math.random() * vi.length)]);

    const minDist = minDistanceToAnySolution(candidate, puzzle.solutions, puzzle.dials);
    if (minDist < minDistance) continue;

    // Verify center position doesn't equal the target
    if (evaluateConfig(puzzle, candidate) === puzzle.target) continue;

    // Verify preview rows don't reveal the answer
    if (!previewRowsAreSafe(puzzle, candidate)) continue;

    return candidate;
  }

  // Exhaustive fallback
  return findSpinStopExhaustive(puzzle, minDistance);
}

function findSpinStopExhaustive(puzzle: FruitPuzzle, minDistance: number): number[] {
  const validIndices = spinStopCandidateIndices(puzzle);

  // Build all valid combinations using only non-blank indices
  const stack: number[][] = [[]];
  const candidates: number[][] = [];

  while (stack.length > 0) {
    const partial = stack.pop()!;
    const depth = partial.length;
    if (depth === 5) {
      candidates.push(partial);
      continue;
    }
    for (const idx of validIndices[depth]) {
      stack.push([...partial, idx]);
    }
  }

  for (const indices of candidates) {
    const dist = minDistanceToAnySolution(indices, puzzle.solutions, puzzle.dials);
    if (dist >= minDistance) {
      if (evaluateConfig(puzzle, indices) !== puzzle.target
        && previewRowsAreSafe(puzzle, indices)) {
        return indices;
      }
    }
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
