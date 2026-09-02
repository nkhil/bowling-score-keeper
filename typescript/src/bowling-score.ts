import z from 'zod'

export enum FrameType {
  STRIKE = 'STRIKE',
  SPARE = 'SPARE',
  OPEN = 'OPEN',
  TENTH = 'TENTH',
}

const ScoreSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal(FrameType.STRIKE) }),
  z.object({
    type: z.literal(FrameType.SPARE),
    pins: z
      .tuple([z.number().nonnegative(), z.number().nonnegative()])
      .refine(([a, b]) => a + b === 10, {
        error: 'For a spare, the total should be exactly 10',
      })
  }),
  z.object({
    type: z.literal(FrameType.OPEN),
    pins: z
      .tuple([z.number().nonnegative(), z.number().nonnegative()])
      .refine(([a, b]) => a + b < 10, {
        error: 'For an open frame, the total should be less than 10',
      }),
  }),
  z.object({
    type: z.literal(FrameType.TENTH),
    pins: z
      .tuple([z.number().nonnegative(), z.number().nonnegative(), z.number().nonnegative().optional()])
      .refine(roll => {
        const [ a, b, c] = roll
        const everyElementIsLessThanTen = roll.every(e => e !== undefined && e <= 10)
        const isTurkey = a === 10 && b === 10 && c === 10
        if (isTurkey) {
          return everyElementIsLessThanTen && (a + b + c === 30)
        }

        return everyElementIsLessThanTen
      }, {
        error: 'For the final frame, the total should be less or equal to 30, and between 2 and 3 rolls'
      })
  })
])

export type FrameScore = z.infer<typeof ScoreSchema>

export class BowlingScoreKeeper {
  public scoreCache: Array<FrameScore> = []

  record(frame: FrameScore): void {
    this.validateFrame(frame)
    this.scoreCache.push(frame)
  }

  rollsFromFrame(f: FrameScore): Array<number> {
    switch (f.type) {
      case FrameType.STRIKE: { return [10] }
      case FrameType.SPARE: { return [f.pins[0], f.pins[1]] }
      case FrameType.OPEN: { return [f.pins[0], f.pins[1]] }
      case FrameType.TENTH: { return f.pins.map(p => p ?? 0) }
    }
  }

  private get rolls(): Array<number> {
    return this.scoreCache.flatMap((el: FrameScore) => this.rollsFromFrame(el))
  }

  private get frameNumber(): number {
    return this.scoreCache.length
  }

  getCurrentScore(): number {
    return this.scoreFrames(0)
  }

  getFinalScore(): { error: string } | { score: number }  {
    if (this.frameNumber !== 10) {
      console.log(`current frame number is ${this.frameNumber} and ${this.scoreCache.length}`)
      return { error: 'Game not finalised' }
    }

    return { score: this.scoreFrames(0) }
  }

  private getRollOffset(frame: number): number {
    let offset = 0
    for (let i = 0; i < frame; i++) {
      offset += this.rollsFromFrame(this.scoreCache[i]).length
    }
    return offset
  }

  private scoreFrames(index: number): number {
    const frame = this.scoreCache[index]
    if (!frame) { return 0 }

    const rollsSoFar = this.getRollOffset(index)

    switch (frame.type) {
      case FrameType.STRIKE: {
        return 10 + this.getRollValueAtIndex(rollsSoFar + 1) + this.getRollValueAtIndex(rollsSoFar + 2) + this.scoreFrames(index + 1)
      }
      case FrameType.SPARE: {
        return 10 + this.getRollValueAtIndex(rollsSoFar + 2) + this.scoreFrames(index + 1)
      }
      case FrameType.OPEN: {
        return frame.pins[0] + frame.pins[1] + this.scoreFrames(index + 1)
      }
      case FrameType.TENTH: {
        return frame.pins.reduce<number>((acc, v) => {
          if (v === undefined) return acc
          return acc + v
        }, 0)
      }
    }
  }

  private getRollValueAtIndex(index: number): number {
    const roll = this.rolls[index]
    return roll ?? 0
  }

  private validateFrame(frame: FrameScore): void {
    const validationResult = ScoreSchema.safeParse(frame)

    if (!validationResult.success) {
      throw new Error(`${validationResult.error}`)
    }}
}
