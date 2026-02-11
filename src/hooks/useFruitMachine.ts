import { useState, useCallback, useRef } from 'react';
import type { FruitPuzzle, DialState, GamePhase, Operator } from '@/types/puzzle';
import { evaluateExpression, evaluateWord } from '@/lib/evaluate';
import { findValidSpinStop, minDistanceToAnySolution, isWordPuzzle } from '@/lib/puzzleEngine';

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
  currentResult: number | string | null;
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

function evaluate(puzzle: FruitPuzzle, dialStates: DialState[]): number | string | null {
  const values = getDialValues(puzzle, dialStates);
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

  const puzzle = puzzles[puzzleIndex];
  const winTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasSpunRef = useRef(false);

  const currentResult = phase === 'playing' || phase === 'won'
    ? evaluate(puzzle, dialStates)
    : null;
  const isCorrect = currentResult === puzzle.target;

  const spin = useCallback(() => {
    const stopIndices = findValidSpinStop(puzzle);
    const dialSizes = puzzle.dials.map(d => d.values.length);
    const minDist = minDistanceToAnySolution(stopIndices, puzzle.solutions, dialSizes);
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
      const dialSize = puzzle.dials[dialIndex].values.length;
      const current = newStates[dialIndex].currentIndex;

      const newIndex = direction === 'up'
        ? (current - 1 + dialSize) % dialSize
        : (current + 1) % dialSize;

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
  }, []);

  const nextPuzzle = useCallback(() => {
    selectPuzzle((puzzleIndex + 1) % puzzles.length);
  }, [puzzleIndex, selectPuzzle]);

  const prevPuzzle = useCallback(() => {
    selectPuzzle((puzzleIndex - 1 + puzzles.length) % puzzles.length);
  }, [puzzleIndex, selectPuzzle]);

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
