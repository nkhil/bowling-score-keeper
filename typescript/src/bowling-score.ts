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
  private frameNumber: number
  public scoreCache: Array<FrameScore> = []

  constructor() {
    this.frameNumber = 0
  }

  record(frame: FrameScore): void {
    this.validateFrame(frame)
    this.scoreCache.push(frame)
    this.incrementFrame()
  }

  getFinalScore(): { error: string } | { score: number }  {
    if (this.frameNumber !== 10) {
      console.log(`current frame number is ${this.frameNumber} and ${this.scoreCache.length}`)
      return { error: 'Game not finalised' }
    }

    return { score: this.getCurrentScore() }
  }

  getCurrentScore(): number {
    let score = 0
    for (const [index, s] of this.scoreCache.entries()) {
      switch (s.type) {
        case FrameType.STRIKE: {
          score += 10
          const next = this.scoreCache[index + 1]
          if (next?.type === FrameType.OPEN) {
            score += this.calculateOpenFrameScore(next.pins)
          }
          if (next?.type === FrameType.SPARE) {
            score += 10
          }
          if (next?.type === FrameType.STRIKE) {
            score += 10
            const frameAfterNext = this.scoreCache[index + 2]
            if (frameAfterNext?.type === FrameType.OPEN) {
              score += frameAfterNext.pins[0]
            }
          }
          break
        }
        case FrameType.SPARE: {
          score += 10
          const next = this.scoreCache[index + 1]
          if (next?.type === FrameType.OPEN) {
            score += next.pins[0]
          }
          break
        }
        case FrameType.OPEN: {
          score += this.calculateOpenFrameScore(s.pins)
          break
        }
        case FrameType.TENTH: {
          const [first, second, third] = s.pins

          if (first !== 10) {
            const isSpare = first + second === 10
            if (isSpare) {
              score += first + second + (third ?? 0)
              break
            }
            score += first + second
            break
          }

          score += 10

          if (second !== 10) {
            score += second + (third ?? 0)
            break
          }

          score += 10 + (third ?? 0)
          break
        }
        default: {
          throw new Error('unexpected default case')
        }
      }
    }
    return score
  }

  private calculateOpenFrameScore(pins: Array<number>): number {
    if (pins.length !== 2) {
      throw new Error('Expected pins to be of exactly 2 length')
    }

    let score = 0
    for (const pin of pins) {
      score += pin
    }

    return score
  }

  private validateFrame(frame: FrameScore): void {
    const validationResult = ScoreSchema.safeParse(frame)

    if (!validationResult.success) {
      throw new Error(`${validationResult.error}`)
    }

  }

  private incrementFrame(): void {
    if (this.frameNumber === 10) {
      console.log('This is frame 10, so no op')
    }

    this.frameNumber++
  }
}
