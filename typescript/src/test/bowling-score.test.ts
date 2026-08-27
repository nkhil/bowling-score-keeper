import test from 'ava'

import { FrameType, FrameScore, BowlingScoreKeeper } from '../bowling-score.js'

function createBowlingScoreKeeper(scores: Array<FrameScore> = []): BowlingScoreKeeper {
  const scoreKeeper = new BowlingScoreKeeper()

  if (scores.length === 0) {
    return scoreKeeper
  }

  for (const score of scores) {
    switch (true) {
      case score.type === FrameType.STRIKE: {
        scoreKeeper.record({ type: FrameType.STRIKE })
        break
      }
      case score.type === FrameType.SPARE: {
        scoreKeeper.record({ type: FrameType.SPARE, pins: score.pins })
        break
      }
      case score.type === FrameType.OPEN: {
        if (score.pins.length !== 2) {
          throw new Error('Expected scores to be of length 2')
        }
        scoreKeeper.record({ type: FrameType.OPEN, pins: score.pins })
      }
    }
  }
  return scoreKeeper
}

test('Records a STRIKE => OPEN', t => {
  const scoreKeeper = createBowlingScoreKeeper([
    {
      type: FrameType.STRIKE,
    },
    {
      type: FrameType.OPEN,
      pins: [7, 2],
    }
  ])

  /**
   * Frame 1: Strike = 10 + your next two balls (7 + 2) = 19
   * Frame 2: 7 + 2 = 9
   * 19 + 9 = 28
   */
  t.is(scoreKeeper.getCurrentScore(), 28)
})

test('Records a SPARE => OPEN', t => {
  const scoreKeeper = createBowlingScoreKeeper([
    {
      type: FrameType.SPARE,
      pins: [4, 6],
    },
    {
      type: FrameType.OPEN,
      pins: [1, 2],
    }
  ])

  /**
   * Frame 1: Spare = 10 + next ball (10 + 1) = 11
   * Frame 2: 1 + 2 = 3
   * 11 + 3 = 14
   */

  t.is(scoreKeeper.getCurrentScore(), 14)
})

test('Validates an OPEN score correctly', t => {
  const scoreKeeper = new BowlingScoreKeeper()

  t.throws(() => {
    scoreKeeper.record({
      type: FrameType.OPEN,
      pins: [5, 5]
    })
  })

  t.throws(() => {
    scoreKeeper.record({
      type: FrameType.OPEN,
      pins: [10, 2]
    })
  })
})

test('Records an OPEN score correctly', t => {
  const scoreKeeper = createBowlingScoreKeeper([
    {
      type: FrameType.OPEN,
      pins: [4, 5],
    }
  ])

  t.is(scoreKeeper.getCurrentScore(), 9)
})

test('Records a STRIKE => SPARE', t => {
  const scoreKeeper = createBowlingScoreKeeper([
    {
      type: FrameType.STRIKE,
    },
    {
      type: FrameType.SPARE,
      pins: [5, 5],
    }
  ])

  t.is(scoreKeeper.getCurrentScore(), 30)
})

test('Records a STRIKE => SPARE => OPEN', t => {
  const scoreKeeper = createBowlingScoreKeeper([
    { type: FrameType.STRIKE },
    { type: FrameType.SPARE, pins: [4, 6] },
    { type: FrameType.OPEN, pins: [7, 2] },
  ])

  t.is(scoreKeeper.getCurrentScore(), 46)
})

test('Records a full game with OPEN frames', t => {
  const scoreKeeper = createBowlingScoreKeeper([
    { type: FrameType.OPEN, pins: [1, 2] },
    { type: FrameType.OPEN, pins: [4, 3] },
    { type: FrameType.OPEN, pins: [2, 1] },
    { type: FrameType.OPEN, pins: [0, 7] },
    { type: FrameType.OPEN, pins: [0, 0] },
    { type: FrameType.OPEN, pins: [5, 1] },
    { type: FrameType.OPEN, pins: [6, 1] },
    { type: FrameType.OPEN, pins: [3, 2] },
    { type: FrameType.OPEN, pins: [2, 6] },
    { type: FrameType.OPEN, pins: [1, 1] },
  ])

  t.deepEqual(scoreKeeper.getFinalScore(), { score: 48 })
})
