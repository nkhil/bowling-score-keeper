# Using `BowlingScoreKeeper2`

This is the recursive, roll-stream based refactor of the scoring engine. It is
imported and used the same way as the original `BowlingScoreKeeper`, and is
validated with the same Zod `ScoreSchema`.

## Import

```ts
import { FrameType, BowlingScoreKeeper2 } from './bowling-score-2.js'
```

## Basic usage

You create a keeper, call `record(frame)` once per frame (1–10), then read the
score.

```ts
const keeper = new BowlingScoreKeeper2()

// Frames 1-9 as normal frames...
keeper.record({ type: FrameType.STRIKE })                              // strike
keeper.record({ type: FrameType.SPARE, pins: [4, 6] })                 // spare
keeper.record({ type: FrameType.OPEN, pins: [7, 2] })                  // open

// The 10th frame is a TENTH frame; it can carry a third bonus roll.
keeper.record({ type: FrameType.TENTH, pins: [7, 3, 5] })              // spare + bonus ball
```

## Reading scores

### Running score mid-game

`getCurrentScore()` returns the total so far, including bonuses earned by
complete frames. It is available at any point.

```ts
const running = keeper.getCurrentScore()   // number
```

### Final score

`getFinalScore()` only reports a score once the game is complete. Until then it
returns an error object.

```ts
const result = keeper.getFinalScore()

if ('error' in result) {
  console.log(result.error)          // 'Game not finalised'
} else {
  console.log(result.score)          // final total
}
```

## The four frame types

| Frame type     | Data                                | Meaning                                        |
| -------------- | ----------------------------------- | ---------------------------------------------- |
| `STRIKE`       | (none)                              | All 10 pins on the first roll                  |
| `SPARE`        | `pins: [a, b]` with `a + b === 10`  | All 10 pins across two rolls                  |
| `OPEN`         | `pins: [a, b]` with `a + b < 10`    | Frame that did not knock all 10 pins down      |
| `TENTH`        | `pins: [a, b]` (optional `c`)       | Final frame; 2 rolls, or 3 on a strike/spare   |

### Examples of the 10th frame

```ts
keeper.record({ type: FrameType.TENTH, pins: [7, 3, 5] })     // spare   -> 15
keeper.record({ type: FrameType.TENTH, pins: [10, 5, 3] })    // strike  -> 18
keeper.record({ type: FrameType.TENTH, pins: [10, 10, 10] })  // turkey  -> 30
keeper.record({ type: FrameType.TENTH, pins: [3, 5] })        // open    -> 8
```

## Full example: a completed game

```ts
import { FrameType, BowlingScoreKeeper2 } from './bowling-score-2.js'

const keeper = new BowlingScoreKeeper2()

keeper.record({ type: FrameType.OPEN, pins: [1, 2] })      //  1.  3
keeper.record({ type: FrameType.OPEN, pins: [4, 3] })      //  2. 10
keeper.record({ type: FrameType.OPEN, pins: [2, 1] })      //  3. 13
keeper.record({ type: FrameType.OPEN, pins: [0, 7] })      //  4. 20
keeper.record({ type: FrameType.OPEN, pins: [0, 0] })      //  5. 20
keeper.record({ type: FrameType.OPEN, pins: [5, 1] })      //  6. 26
keeper.record({ type: FrameType.OPEN, pins: [6, 1] })      //  7. 33
keeper.record({ type: FrameType.OPEN, pins: [3, 2] })      //  8. 38
keeper.record({ type: FrameType.OPEN, pins: [2, 6] })      //  9. 46
keeper.record({ type: FrameType.TENTH, pins: [1, 1] })     // 10. 48

console.log(keeper.getCurrentScore())   // 48
console.log(keeper.getFinalScore())     // { score: 48 }
```

## Example: perfect game

```ts
const keeper = new BowlingScoreKeeper2()

for (let i = 0; i < 9; i++) {
  keeper.record({ type: FrameType.STRIKE })
}
keeper.record({ type: FrameType.TENTH, pins: [10, 10, 10] })

console.log(keeper.getFinalScore())   // { score: 300 }  (recursive model handles consecutive strikes)
```

## Validation

`record()` throws on an invalid frame (via Zod), so invalid pin counts are
rejected eagerly.

```ts
keeper.record({ type: FrameType.OPEN, pins: [5, 5] })     // throws: open must sum < 10
keeper.record({ type: FrameType.SPARE, pins: [4, 4] })    // throws: spare must sum === 10
keeper.record({ type: FrameType.TENTH, pins: [3, 5, 9] }) // throws: 3rd roll needs strike/spare
```
