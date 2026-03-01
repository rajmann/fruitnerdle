# Fruit Nerdle

A one-armed bandit-themed math puzzle game. Nudge dials to form an equation that hits the target number.

Live at [nerdlegame.com/fruitnerdle](https://nerdlegame.com/fruitnerdle)

## Architecture

React 18 + TypeScript + Vite 5 standalone SPA (no backend). Styled with Tailwind CSS, animated with Framer Motion.

### Project Structure

```
src/
  components/
    FruitMachine.tsx    Main game component (day selection, LED display, win logic)
    Dial.tsx            Reel widget with 3D preview rows and swipe input
    DialStrip.tsx       Animated value strip inside each dial
    NudgeButton.tsx     Chrome-styled arrow buttons
    Lever.tsx           Pull lever (spin trigger)
    HelpModal.tsx       Rules / how to play
    CoinTray.tsx        Payout display
  hooks/
    useFruitMachine.ts  Game state machine (ready -> spinning -> playing -> won)
  lib/
    evaluate.ts         Expression evaluator (order of operations, intermediates can be decimal)
    puzzleEngine.ts     Distance calculations, spin stop finding, payout tiers
    fruitConfetti.ts    Win confetti animation
  types/
    puzzle.ts           TypeScript interfaces (FruitPuzzle, DialConfig, DialState, etc.)
  data/
    puzzles.json        Pre-computed puzzles organised by day
```

### Game Mechanics

Each puzzle has 5 dials: `[number, operator, number, operator, number]`. Number dials hold 5 values (1-12). Operator dials hold up to 4 values from `[+, -, *, /]` (early games restrict operators for variety).

- **Spin** lands on a random position >= 3 moves from any solution
- **Nudge** moves one dial one step; blank operator positions are auto-skipped (free)
- **Win** when the expression evaluates to the target (standard order of operations)
- **Coins** reward efficiency: 5 coins at minimum moves, down to 1 for 10+ extra

### Difficulty Progression (5 puzzles per day)

| Game | Operators | Target Range | Notes |
|------|-----------|-------------|-------|
| 1 | `[+,-]` / `[-,/]` | 5-23 | No multiplication, diverse patterns |
| 2 | `[+,/]` / `[+,/]` | 5-36 | No multiplication, division puzzles |
| 3 | `[+,-,*,/]` | 30-99 | Full operators |
| 4-5 | `[+,-,*,/]` | 50-160 | Full operators, harder |

Games 1-2 use restricted operator dials with blank positions where `*` would normally be. Blanks appear as empty spaces on the wheel and are skipped during nudging at no move cost.

## Puzzle Generation

Puzzles are pre-computed and stored in `src/data/puzzles.json`. The generator is a Python script:

```bash
python scripts/generate_puzzles.py --days 2000
python scripts/generate_puzzles.py --days 2000 --seed 42   # reproducible
```

The generator:
1. Picks 3 random number dials (5 unique values from 1-12 each)
2. Enumerates all dial combinations for the configured operator set
3. Finds targets with exactly 1 solution
4. Filters to the desired target range for the difficulty tier
5. Verifies a valid spin stop position exists (>= 3 moves from solution)
6. Runs a verification pass confirming every puzzle has exactly 1 solution

There is also a legacy TypeScript generator at `scripts/generatePuzzles.ts` (run via `npm run generate-puzzles`), but the Python version is preferred as it supports the tiered difficulty system and custom operator configurations.

## Running Locally

Requires Node.js 18+.

```bash
npm install          # install dependencies
npm run dev          # start Vite dev server at http://localhost:5173
```

To test a production build:

```bash
npm run build        # TypeScript check + Vite production build -> dist/
npm run preview      # serve dist/ locally at http://localhost:4173
```

## Deployment

Build and deploy to the `/fruitnerdle` subfolder on S3 + CloudFront:

```bash
npm run build          # TypeScript check + Vite production build -> dist/
npm run deploySub      # Sync dist/ to s3://nerdle-serverless-app/fruitnerdle
npm run invalidateSub  # Invalidate CloudFront cache for /fruitnerdle/*
```

Requires AWS CLI configured with appropriate credentials.

### URL Routing

The app supports date-based URLs for daily challenges:
- `/fruitnerdle` - today's puzzles
- `/fruitnerdle/20260212` - puzzles for a specific date

Day 1 epoch is February 11, 2026. Days cycle through the available puzzle sets.
