import { useState, useCallback, useRef } from 'react';
import type { FruitPuzzle, DialState, GamePhase, Operator } from '@/types/puzzle';
import { evaluateExpression } from '@/lib/evaluate';
import { findValidSpinStop, minDistanceToAnySolution } from '@/lib/puzzleEngine';

/** Compute a safe resting position for preview rows in ready state. */
function computeRestingPosition(puzzle: FruitPuzzle): DialState[] {
  const indices = findValidSpinStop(puzzle);
  return indices.map(idx => ({ currentIndex: idx }));
}

export interface UseFruitMachineReturn {
  // State
  puzzle: FruitPuzzle;
  dialStates: DialState[];
  phase: GamePhase;
  moveCount: number;
  nudgeCount: number;
  minMoves: number;
  spinStopIndices: number[];
  currentResult: number | null;
  isCorrect: boolean;
  puzzleIndex: number;
  totalPuzzles: number;

  // Actions
  spin: () => void;
  nudge: (dialIndex: number, direction: 'up' | 'down') => void;
  nextPuzzle: () => void;
  prevPuzzle: () => void;
  selectPuzzle: (index: number) => void;
  resetPuzzle: () => void;
  onSpinComplete: () => void;
}

function getDialValues(puzzle: FruitPuzzle, dialStates: DialState[]) {
  return dialStates.map((ds, i) => puzzle.dials[i].values[ds.currentIndex]);
}

function evaluate(puzzle: FruitPuzzle, dialStates: DialState[]): number | null {
  const values = getDialValues(puzzle, dialStates);
  return evaluateExpression(
    values[0] as number,
    values[1] as string as Operator,
    values[2] as number,
    values[3] as string as Operator,
    values[4] as number,
  );
}

export function useFruitMachine(puzzles: FruitPuzzle[]): UseFruitMachineReturn {
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [phase, setPhase] = useState<GamePhase>('ready');
  const [moveCount, setMoveCount] = useState(0);
  const [nudgeCount, setNudgeCount] = useState(0);
  const [spinStopIndices, setSpinStopIndices] = useState<number[]>([0, 0, 0, 0, 0]);
  const [minMoves, setMinMoves] = useState(0);
  const [dialStates, setDialStates] = useState<DialState[]>(
    () => computeRestingPosition(puzzles[0])
  );

  const winTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasSpunRef = useRef(false);

  // Reset all state when puzzle set changes (synchronous during render)
  const [prevPuzzles, setPrevPuzzles] = useState(puzzles);
  if (puzzles !== prevPuzzles) {
    setPrevPuzzles(puzzles);
    setPuzzleIndex(0);
    setPhase('ready');
    setMoveCount(0);
    setNudgeCount(0);
    setSpinStopIndices([0, 0, 0, 0, 0]);
    setMinMoves(0);
    setDialStates(computeRestingPosition(puzzles[0]));
    if (winTimerRef.current) { clearTimeout(winTimerRef.current); winTimerRef.current = null; }
    hasSpunRef.current = false;
  }

  // Clamp index: when puzzles array changes this render, puzzleIndex still holds
  // the old value (setPuzzleIndex(0) above is queued, not immediate).
  const isTransitioning = puzzles !== prevPuzzles;
  const effectivePuzzleIndex = Math.min(puzzleIndex, puzzles.length - 1);
  const puzzle = puzzles[effectivePuzzleIndex];

  // Don't evaluate during transition renders: old dialStates + new puzzle can
  // accidentally produce isCorrect=true, firing a spurious win timer.
  const currentResult = !isTransitioning && (phase === 'playing' || phase === 'won')
    ? evaluate(puzzle, dialStates)
    : null;
  const isCorrect = currentResult === puzzle.target;

  const spin = useCallback(() => {
    // Clear any pending win timer to prevent it firing mid-spin
    if (winTimerRef.current) { clearTimeout(winTimerRef.current); winTimerRef.current = null; }
    const stopIndices = findValidSpinStop(puzzle);
    const minDist = minDistanceToAnySolution(stopIndices, puzzle.solutions, puzzle.dials);
    setSpinStopIndices(stopIndices);
    setMinMoves(minDist);
    if (hasSpunRef.current) {
      setMoveCount(prev => prev + 1); // re-spin costs a move
    }
    hasSpunRef.current = true;
    setPhase('spinning');
  }, [puzzle]);

  const onSpinComplete = useCallback(() => {
    setDialStates(spinStopIndices.map(idx => ({ currentIndex: idx })));
    setPhase('playing');
  }, [spinStopIndices]);

  const nudge = useCallback((dialIndex: number, direction: 'up' | 'down') => {
    if (phase !== 'playing') return;

    setDialStates(prev => {
      const newStates = [...prev];
      const dial = puzzle.dials[dialIndex];
      const dialSize = dial.values.length;
      const current = newStates[dialIndex].currentIndex;

      let newIndex = direction === 'up'
        ? (current - 1 + dialSize) % dialSize
        : (current + 1) % dialSize;

      // Auto-skip blank positions (free, no extra move cost)
      let safety = 0;
      while (dial.values[newIndex] === '' && safety < dialSize) {
        newIndex = direction === 'up'
          ? (newIndex - 1 + dialSize) % dialSize
          : (newIndex + 1) % dialSize;
        safety++;
      }

      newStates[dialIndex] = { currentIndex: newIndex, lastNudgeDirection: direction };
      return newStates;
    });

    setMoveCount(prev => prev + 1);
    setNudgeCount(prev => prev + 1);

    // Check win after state update (will be reflected in next render via isCorrect)
  }, [phase, puzzle]);

  // Check for win after dial states change (3s delay before win screen)
  if (phase === 'playing' && isCorrect && !winTimerRef.current) {
    winTimerRef.current = setTimeout(() => {
      setPhase('won');
      winTimerRef.current = null;
    }, 3000);
  }

  const selectPuzzle = useCallback((index: number) => {
    if (index >= 0 && index < puzzles.length) {
      if (winTimerRef.current) { clearTimeout(winTimerRef.current); winTimerRef.current = null; }
      setPuzzleIndex(index);
      setPhase('ready');
      setMoveCount(0);
      setNudgeCount(0);
      hasSpunRef.current = false;
      setDialStates(computeRestingPosition(puzzles[index]));
    }
  }, [puzzles]);

  const nextPuzzle = useCallback(() => {
    selectPuzzle((puzzleIndex + 1) % puzzles.length);
  }, [puzzleIndex, puzzles.length, selectPuzzle]);

  const prevPuzzle = useCallback(() => {
    selectPuzzle((puzzleIndex - 1 + puzzles.length) % puzzles.length);
  }, [puzzleIndex, puzzles.length, selectPuzzle]);

  const resetPuzzle = useCallback(() => {
    if (winTimerRef.current) { clearTimeout(winTimerRef.current); winTimerRef.current = null; }
    setPhase('ready');
    setMoveCount(0);
    setNudgeCount(0);
    hasSpunRef.current = false;
    setDialStates(computeRestingPosition(puzzle));
  }, [puzzle]);

  return {
    puzzle,
    dialStates,
    phase,
    moveCount,
    nudgeCount,
    minMoves,
    spinStopIndices,
    currentResult,
    isCorrect,
    puzzleIndex,
    totalPuzzles: puzzles.length,
    spin,
    nudge,
    nextPuzzle,
    prevPuzzle,
    selectPuzzle,
    resetPuzzle,
    onSpinComplete,
  };
}
