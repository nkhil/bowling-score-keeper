import { BowlingScoreKeeper, FrameScore } from './bowling-score.js'

type PersonArgs = {
  name: string
}

export class Person {
  public name: string
  private scoreKeeper: BowlingScoreKeeper

  constructor(args: PersonArgs) {
    this.name = args.name
    this.scoreKeeper = new BowlingScoreKeeper()
  }

  recordScore(score: FrameScore): void {
    this.scoreKeeper.record(score)
  }

  getCurrentScore(): number {
    return this.scoreKeeper.getCurrentScore()
  }

  getFinalScore(): { error: string } | { score: number } {
    return this.scoreKeeper.getFinalScore()
  }
}
