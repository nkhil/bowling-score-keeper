# Bowling score keeper

A bowling scoring library that tracks frames and calculates cumulative scores using standard ten-pin bowling rules.

## Implementations

- **TypeScript** — `./typescript`
  - Zero-dependency scoring logic (uses `zod` for frame validation)
  - Tested with [AVA](https://github.com/avajs/ava)

## Usage

See the per-implementation README for usage details:

- [TypeScript](typescript/README.md)

### Quick example (TypeScript)

Run from the `typescript` directory:

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

## Rules

Standard ten-pin bowling rules apply. A summary lives in [rules.md](rules.md):

- 10 frames per game, up to 3 rolls in the 10th frame
- Open frame: sum of pins knocked down
- Strike: 10 + pins from the next 2 rolls
- Spare: 10 + pins from the next 1 roll
- Scores are cumulative
