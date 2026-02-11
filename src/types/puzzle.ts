export type Operator = '+' | '-' | '*' | '/';

export interface DialConfig {
  type: 'number' | 'operator' | 'letter';
  values: (number | string)[];
}

export interface FruitPuzzle {
  id: string;
  target: number | string;
  dials: [DialConfig, DialConfig, DialConfig, DialConfig, DialConfig];
  solutions: number[][];
}

export interface DialState {
  currentIndex: number;
  lastNudgeDirection?: 'up' | 'down';
}

export type GamePhase = 'ready' | 'spinning' | 'playing' | 'won';

export interface GameState {
  puzzle: FruitPuzzle;
  dialStates: DialState[];
  phase: GamePhase;
  moveCount: number;
  spinStopIndices: number[];
}

export const OPERATORS: Operator[] = ['+', '-', '*', '/'];

export const MYSTERY_FRUIT = '🍒';

export const OPERATOR_FRUITS: Record<string, string> = {
  '+': '🍎',
  '-': '🍊',
  '*': '🍋',
  '/': '🍐',
};

export const CELEBRATION_FRUITS = ['🍎', '🍊', '🍋', '🍐', '🍇', '🍓', '🍑', '🍌', '🍉', '🫐', '🥝'];
