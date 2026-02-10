/**
 * Puzzle generator for Fruit Nerdle.
 * Run with: npx tsx scripts/generatePuzzles.ts
 *
 * Number dials: 5 values from 1-12 (indices 0-4).
 * Operator dials: ['+', '-', '*', '/'] (indices 0-3).
 * Solutions use 0-based indices directly.
 * Each puzzle has exactly 1 solution.
 */

type Operator = '+' | '-' | '*' | '/';
const OPERATORS: Operator[] = ['+', '-', '*', '/'];

function applyOp(a: number, op: Operator, b: number): number | null {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;
    case '/':
      if (b === 0) return null;
      return a / b;
  }
}

function precedence(op: Operator): number {
  return (op === '*' || op === '/') ? 2 : 1;
}

function evaluateExpression(
  n1: number, op1: Operator, n2: number, op2: Operator, n3: number,
): number | null {
  let result: number | null;

  if (precedence(op1) >= precedence(op2)) {
    const left = applyOp(n1, op1, n2);
    if (left === null) return null;
    result = applyOp(left, op2, n3);
  } else {
    const right = applyOp(n2, op2, n3);
    if (right === null) return null;
    result = applyOp(n1, op1, right);
  }

  if (result === null) return null;
  if (!Number.isInteger(result)) return null;
  if (result <= 0 || result > 999) return null;

  return result;
}

function circularDistance(a: number, b: number, size: number): number {
  const diff = Math.abs(a - b);
  return Math.min(diff, size - diff);
}

function configDistance(config: number[], solution: number[], dialSizes: number[]): number {
  let total = 0;
  for (let i = 0; i < 5; i++) {
    total += circularDistance(config[i], solution[i], dialSizes[i]);
  }
  return total;
}

function generateRandomNumberDial(): number[] {
  const values = new Set<number>();
  while (values.size < 5) {
    values.add(Math.floor(Math.random() * 12) + 1); // 1-12
  }
  return Array.from(values);
}

interface Solution {
  indices: number[];
  expression: string;
  result: number;
}

interface PuzzleCandidate {
  target: number;
  numberDials: [number[], number[], number[]];
  solution: Solution;
}

function findPuzzles(numberDials: [number[], number[], number[]]): PuzzleCandidate[] {
  const [dial0, dial2, dial4] = numberDials;
  const resultsMap: Map<number, Solution[]> = new Map();

  // Enumerate all combinations using 0-based indices
  for (let i0 = 0; i0 < dial0.length; i0++) {
    for (let i1 = 0; i1 < 4; i1++) {
      for (let i2 = 0; i2 < dial2.length; i2++) {
        for (let i3 = 0; i3 < 4; i3++) {
          for (let i4 = 0; i4 < dial4.length; i4++) {
            const n1 = dial0[i0];
            const op1 = OPERATORS[i1];
            const n2 = dial2[i2];
            const op2 = OPERATORS[i3];
            const n3 = dial4[i4];

            const result = evaluateExpression(n1, op1, n2, op2, n3);
            if (result !== null) {
              if (!resultsMap.has(result)) {
                resultsMap.set(result, []);
              }
              resultsMap.get(result)!.push({
                indices: [i0, i1, i2, i3, i4],
                expression: `${n1} ${op1} ${n2} ${op2} ${n3}`,
                result,
              });
            }
          }
        }
      }
    }
  }

  // Find targets with exactly 1 solution
  const candidates: PuzzleCandidate[] = [];

  for (const [target, solutions] of resultsMap) {
    if (solutions.length === 1) {
      candidates.push({
        target,
        numberDials,
        solution: solutions[0],
      });
    }
  }

  return candidates;
}

function hasValidSpinStop(
  solution: Solution,
  dialSizes: number[],
  minDist: number,
): boolean {
  for (let attempt = 0; attempt < 200; attempt++) {
    const candidate = dialSizes.map(size => Math.floor(Math.random() * size));
    const d = configDistance(candidate, solution.indices, dialSizes);
    if (d >= minDist) {
      return true;
    }
  }
  return false;
}

function generatePuzzles(count: number) {
  const puzzles: any[] = [];
  const usedTargets = new Set<number>();
  let attempt = 0;

  while (puzzles.length < count && attempt < 10000) {
    attempt++;
    const dial0 = generateRandomNumberDial();
    const dial2 = generateRandomNumberDial();
    const dial4 = generateRandomNumberDial();
    const numberDials: [number[], number[], number[]] = [dial0, dial2, dial4];

    const candidates = findPuzzles(numberDials);

    // Prefer accessible targets (<=200)
    const sorted = candidates.sort((a, b) => {
      const aScore = a.target <= 200 ? 0 : 1;
      const bScore = b.target <= 200 ? 0 : 1;
      return aScore - bScore;
    });

    for (const candidate of sorted) {
      if (puzzles.length >= count) break;
      if (usedTargets.has(candidate.target)) continue;

      const dialSizes = [dial0.length, 4, dial2.length, 4, dial4.length];
      if (!hasValidSpinStop(candidate.solution, dialSizes, 3)) continue;

      const puzzle = {
        id: `puzzle-${String(puzzles.length + 1).padStart(3, '0')}`,
        target: candidate.target,
        dials: [
          { type: 'number' as const, values: [...dial0] },
          { type: 'operator' as const, values: ['+', '-', '*', '/'] },
          { type: 'number' as const, values: [...dial2] },
          { type: 'operator' as const, values: ['+', '-', '*', '/'] },
          { type: 'number' as const, values: [...dial4] },
        ],
        solutions: [candidate.solution.indices],
      };

      puzzles.push(puzzle);
      usedTargets.add(candidate.target);

      console.log(`\nPuzzle ${puzzles.length}: target = ${candidate.target}`);
      console.log(`  Dial 0 (numbers): [${dial0.join(', ')}]`);
      console.log(`  Dial 1 (operators): [+, -, *, /]`);
      console.log(`  Dial 2 (numbers): [${dial2.join(', ')}]`);
      console.log(`  Dial 3 (operators): [+, -, *, /]`);
      console.log(`  Dial 4 (numbers): [${dial4.join(', ')}]`);
      console.log(`  Solution: [${candidate.solution.indices}] -> ${candidate.solution.expression} = ${candidate.target}`);
      break; // Only take 1 puzzle per dial set
    }
  }

  if (puzzles.length < count) {
    console.error(`\nOnly generated ${puzzles.length}/${count} puzzles after ${attempt} attempts.`);
  }

  return puzzles;
}

// Generate and write
const puzzles = generatePuzzles(5);

// Verification pass
console.log('\n--- VERIFICATION ---');
for (const puzzle of puzzles) {
  const [d0, d1, d2, d3, d4] = puzzle.dials;
  let solutionCount = 0;
  for (let i0 = 0; i0 < d0.values.length; i0++) {
    for (let i1 = 0; i1 < d1.values.length; i1++) {
      for (let i2 = 0; i2 < d2.values.length; i2++) {
        for (let i3 = 0; i3 < d3.values.length; i3++) {
          for (let i4 = 0; i4 < d4.values.length; i4++) {
            const result = evaluateExpression(
              d0.values[i0] as number,
              d1.values[i1] as Operator,
              d2.values[i2] as number,
              d3.values[i3] as Operator,
              d4.values[i4] as number,
            );
            if (result === puzzle.target) solutionCount++;
          }
        }
      }
    }
  }
  console.log(`${puzzle.id}: target=${puzzle.target}, solutions found=${solutionCount} ${solutionCount === 1 ? '✓' : '✗ FAIL'}`);
}

// Write to file
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const outDir = join(__dirname, '..', 'src', 'data');
mkdirSync(outDir, { recursive: true });
writeFileSync(
  join(outDir, 'puzzles.json'),
  JSON.stringify(puzzles, null, 2),
);
console.log(`\nWrote ${puzzles.length} puzzles to src/data/puzzles.json`);
