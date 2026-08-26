import z from 'zod'

type RollType = 'STRIKE' | 'SPARE' | number

export enum FrameType {
  STRIKE = 'STRIKE',
  SPARE = 'SPARE',
  OPEN = 'OPEN',
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
  })
])

export type FrameScore = z.infer<typeof ScoreSchema>

export class BowlingScoreKeeper {
  private frameNumber: number
  public totalScore: number = 0
  public scoreCache: Array<FrameScore> = []

  constructor() {
    this.frameNumber = 1
  }

  record(frame: FrameScore): void {
    this.validateFrame(frame)
    this.scoreCache.push(frame)
    this.incrementFrame()
  }

  getFinalScore(): { error: string } | { score: number }  {
    if (this.frameNumber !== 10) {
      return { error: 'Game not finalised' }
    }

    return { score: 0 }
  }

  public get score(): Array<FrameScore> {
    return this.scoreCache
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
        default: {
          break
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
    if (this.frameNumber >= 10) {
      throw new Error('Rounds cannot exceed 9')
    }

    this.frameNumber++
  }
}
