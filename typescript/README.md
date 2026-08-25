# Bowling score keeper

```typescript
import { BowlingScoreKeeper, ScoreType } from './bowling-score.js'

const scoreKeeper = new BowlingScoreKeeper()

// For a strike
scoreKeeper.record(ScoreType.STRIKE)

// For a spare
scoreKeeper.record(ScoreType.SPARE)

// For an open frame
scoreKeeper.record(ScoreType.OPEN, [4, 5])

// Get the current score
scoreKeeper.getCurrentScore()
```
