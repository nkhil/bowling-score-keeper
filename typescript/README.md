# Bowling score keeper (TypeScript)

A TypeScript implementation of a bowling scoring library.

## Setup

Requires Node `^23.11.0` and npm `^11` (pinned via `engines`/`volta`).

```bash
npm install
```

## Commands

```bash
npm run build        # compile TypeScript to ./build
npm run build:watch  # compile on change
npm run lint         # eslint on src/**
npm run lint:fix     # autofix lint errors
npm test             # run AVA tests
```

## Usage

```typescript
import { BowlingScoreKeeper, FrameType } from './src/bowling-score.js'

const scoreKeeper = new BowlingScoreKeeper()

// For a strike
scoreKeeper.record({ type: FrameType.STRIKE })

// For a spare
scoreKeeper.record({ type: FrameType.SPARE })

// For an open frame
scoreKeeper.record({ type: FrameType.OPEN, pins: [4, 5] })

// Get the current score
scoreKeeper.getCurrentScore()
```

## API

### `BowlingScoreKeeper`

- `record(frame: FrameScore): void` — records a frame's score. Throws if more than 9 frames are recorded.
- `getCurrentScore(): number` — returns the running cumulative score.
- `getFinalScore(): { error: string } | { score: number }` — returns the final score once the game is complete.
- `score: Array<FrameScore>` — the recorded frames.

### `FrameType`

```typescript
enum FrameType {
  STRIKE = 'STRIKE',
  SPARE = 'SPARE',
  OPEN = 'OPEN',
}
```

For `OPEN` frames, a `pins: [firstRoll, secondRoll]` tuple is required where the two rolls sum to less than 10.

## Rules

Standard ten-pin bowling rules apply. See the root [rules.md](../rules.md) for a summary.
