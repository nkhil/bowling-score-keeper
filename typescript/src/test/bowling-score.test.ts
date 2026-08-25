import test from 'ava'

import { FrameType, BowlingScoreKeeper } from '../bowling-score.js'

test('Records a STRIKE => OPEN', t => {
  const scoreKeeper = new BowlingScoreKeeper()
  scoreKeeper.record({
    type: FrameType.STRIKE,
  })
  scoreKeeper.record({
    type: FrameType.OPEN,
    pins: [7, 2],
  })

  /**
   * Frame 1: Strike = 10 + your next two balls (7 + 2) = 19
   * Frame 2: 7 + 2 = 9
   * 19 + 9 = 28
   */
  t.is(scoreKeeper.getCurrentScore(), 28)
})

test('Records a SPARE => OPEN', t => {
  const scoreKeeper = new BowlingScoreKeeper()
  scoreKeeper.record({
    type: FrameType.SPARE,
  })
  scoreKeeper.record({
    type: FrameType.OPEN,
    pins: [1, 2],
  })

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
  const scoreKeeper = new BowlingScoreKeeper()

  scoreKeeper.record({
    type: FrameType.OPEN,
    pins: [4, 5],
  })

  t.is(scoreKeeper.getCurrentScore(), 9)
})