# Refactor Plan: Bowling Score Keeper

Findings and suggestions for refactoring `src/bowling-score.ts`, with a focus on
recursion and DRY-ing up the scoring logic.

## 1. Observations on the current code

### The game can be modeled as a "rolls" stream
Bowling scoring is really about a stream of **rolls** with a notion of consumed
balls:

- An **OPEN** frame consumes 2 rolls. Score = `a + b`.
- A **SPARE** frame consumes 2 rolls. Frame value = `10 + next roll`.
- A **STRIKE** frame consumes 1 roll. Frame value = `10 + next 2 rolls`.
- The **TENTH** frame is a special terminal case: consume 2 or 3 rolls, no
  cross-frame bonus.

Frames 1–9 are scored "greedily": a spare/strike looks *forward* at the next
roll(s) that get consumed by *another* frame. This forward-looking nature is
exactly what makes recursion natural here.

### Where the current `getCurrentScore()` is repetitive / fragile
Look at each `STRIKE`/`SPARE` case — they all re-implement the same ideas with
manual `index + 1` / `index + 2` lookups and scattered `next?.type` checks:

- `STRIKE` manually handles `next` being OPEN, SPARE, or STRIKE (plus
  `index + 2` for the second bonus ball). This is the biggest smell.
- `SPARE` handles `next` being OPEN only; it quietly assumes the bonus ball is
  an OPEN's first pin.
- Logic for "the next roll(s)" is duplicated in 3+ branches.
- `calculateOpenFrameScore` and the TENTH case both sum a tuple of pins — same
  idea implemented differently.

### Existing bugs the refactor should fix
- **Three+ consecutive strikes** (e.g. `STRIKE STRIKE STRIKE OPEN`) are not
  scored correctly. Each `STRIKE` branch independently claims bonus balls, so
  overlapping bonuses double-count. A perfect game would not score 300.
- `getFinalScore()` checks `frameNumber !== 10`, but a strike in the 10th frame
  needs `scoreCache.length` to be bigger than 10 to include its bonus rolls —
  so `frameNumber` (number of recorded frames) and the actual rolls needed are
  mismatched.

## 2. Refactor suggestion A: recursive "rolls" model

Model the cache as an array of *frames*, but internally flatten to rolls and
score recursively. The cleanest approach: keep `scoreCache` as frames for
validation/authoring, but derive a minimal recursive scorer over rolls.

```ts
// Represents the flattened sequence of falls (each ball).
type Roll = number        // 0..10

function rollsFromFrame(f: FrameScore): Roll[] {
  switch (f.type) {
    case FrameType.STRIKE: return [10]
    case FrameType.SPARE: return [f.pins[0], f.pins[1]]
    case FrameType.OPEN: return [f.pins[0], f.pins[1]]
    case FrameType.TENTH: return f.pins    // already a roll list
  }
}
```

Then a recursive scorer over the rolled-out array, with a clear contract:

```ts
function scoreRolls(rolls: Roll[], frameIndex: number, rollOffset: number, frameCount: number): number
```

But honestly, the simplest *correct* and DRY model of bowling is:

```ts
function scoreGame(frames: Frame[]): number {
  const rollIndex = []            // start offset of each frame in the roll stream
  // ...build offsets...
  function frameScore(i: number): number {
    const f = frames[i]
    switch (f.type) {
      case FrameType.OPEN: return f.pins[0] + f.pins[1]
      case FrameType.SPARE: return 10 + nextRoll(i)
      case FrameType.STRIKE: return 10 + nextTwoRolls(i)
      case FrameType.TENTH: return sum(f.pins)
    }
  }
  // ...
}
```

where helper accessors are themselves tiny recursive/functional lookups.

## 3. Refactor suggestion B: the pragmatic DRY version

Rather than flattening to a raw roll stream (a bigger change), you can remove
the duplication *within* your current per-frame model by introducing small
helpers:

```ts
private framesAfter(index: number): Array<FrameScore> {
  return this.scoreCache.slice(index + 1)
}

// Sum the first `count` rolls produced by the frames after `index`.
private bonusRolls(index: number, count: number): number {
  let sum = 0
  let needed = count
  for (const next of this.framesAfter(index)) {
    const produced = this.rollsFor(next)
    const take = Math.min(produced.length, needed)
    for (let r = 0; r < take; r++) sum += produced[r]
    needed -= take
    if (needed === 0) break
  }
  return sum
}

private rollsFor(f: FrameScore): number[] {
  switch (f.type) {
    case FrameType.STRIKE: return [10]
    case FrameType.SPARE:
    case FrameType.OPEN: return f.pins
    case FrameType.TENTH: return f.pins
  }
}
```

With those, scoring collapses to one `switch` with very little per-case logic:

```ts
switch (s.type) {
  case FrameType.STRIKE:
    score += 10 + this.bonusRolls(index, 2)
    break
  case FrameType.SPARE:
    score += 10 + this.bonusRolls(index, 1)
    break
  case FrameType.OPEN:
    score += this.calculateOpenFrameScore(s.pins)
    break
  case FrameType.TENTH:
    score += s.pins.reduce((a, b) => a + b, 0)
    break
}
```

This is the **recommended** first step: minimal change, removes all the
`next?.type === ...` duplication, and it *incidentally fixes* the 
three-consecutive-strike bug because `bonusRolls` walks frames forward until it
has collected enough rolls, rather than assuming the next frame's shape.

## 4. Recursive depth 1 framework

If you specifically want recursion, the clean framing is a recursive function
that scores frames from an index and knows how many rolls remain owed to a
prior strike/spare:

```ts
// score the frames[i..] returning { score, rollsProduced }
function scoreFrom(i: number): { score: number }
```

But a more natural recursion for this problem is over the **roll stream**, not
frames, because bonuses "borrow" rolls across frame boundaries. Something like:

```ts
let rolls: number[]      // flattened
let roll = 0

function frameScoreRolls():
  if (rolls.length - roll < 3) return ... // not enough for a full frame

  const first = rolls[roll]
  if (first === 10) {        // strike, uses 1 roll
    roll += 1
    return 10 + nextTwoRolls()
  }
  const second = rolls[roll + 1]
  if (first + second === 10) {
    roll += 2
    return 10 + nextRoll()
  }
  roll += 2
  return first + second

function nextRoll(): number { const r = rolls[roll]; roll += ...; return r }
```

Recursion here replaces your `for` loop with a loop-by-construction, but JS has
no tail-call guarantee, so an iterative version is strictly safer. Prefer the
iterative `bonusRolls` approach unless recursion is a hard requirement.

## 5. Concrete recommendations

1. Do **refactor suggestion B** first (it is small and fixes the bug). Verify
   against the "three strikes" and "perfect game 300" cases.
2. If you want recursion for its own sake, prefer the *roll-stream* recursion
   model (section 4), not recursion over frames — it matches how bonuses span
   frame boundaries.
3. DRY the TENTH scoring into a single `reduce`/sum (it's just the sum of its 2–3
   rolls).
4. Delete `calculateOpenFrameScore` in favour of the shared `rollsFor`/sum
   helpers, or a single `sum(pins)` util.
5. Fix the frame-counting bug: the 10th frame may "consume" more rolls than 10
   frames' worth, so derive completeness from the rolled-out stream, not a bare
   `frameNumber === 10` counter.

## 6. Suggested tests to pin behaviour before/after refactor

- Perfect game (`12` strikes) → `300`
- Three consecutive strikes + open (`STRIKE STRIIKE STRIKE [3,2]`) → validate
- 10th-frame spare `[7,3,5]` → `15`
- 10th-frame strike `[10,5,3]` → `18`
- 10th-frame turkey `[10,10,10]` → `30`
- Overall total from the existing `getCurrentScore()` vs `getFinalScore()` for a
  finished mixed game
