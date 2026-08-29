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
      }),
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
        const [a, b, c] = roll
        const everyElementIsLessThanTen = roll.every(e => e !== undefined && e <= 10)
        return everyElementIsLessThanTen && (a === 10 || a + b <= 10) && (roll.length === 2 || a === 10 || a + b === 10)
      }, {
        error: 'For the final frame, all rolls must be 10 or less; a third roll requires a strike or spare on the first two',
      }),
  }),
])

export type FrameScore = z.infer<typeof ScoreSchema>

type Roll = number

function rollsFromFrame(f: FrameScore): Array<Roll> {
  switch (f.type) {
    case FrameType.STRIKE: { return [10]
    }
    case FrameType.SPARE: { return [f.pins[0], f.pins[1]]
    }
    case FrameType.OPEN: { return [f.pins[0], f.pins[1]]
    }
    case FrameType.TENTH: { return f.pins.map(p => p ?? 0)
    }
  }
}

export class BowlingScoreKeeper2 {
  private frames: Array<FrameScore> = []

  record(frame: FrameScore): void {
    this.validateFrame(frame)
    this.frames.push(frame)
  }

  getFinalScore(): { error: string } | { score: number } {
    const consumed = this.rolls.length
    if (consumed < this.minimumRollsForFinal()) {
      return { error: 'Game not finalised' }
    }
    return { score: this.getCurrentScore() }
  }

  getCurrentScore(): number {
    return this.scoreFrames(0)
  }

  private get rolls(): Array<Roll> {
    return this.frames.flatMap(rollsFromFrame)
  }

  // Recursive scorer over the flat roll stream. `start` is the index of the
  // first roll consumed by frame `index`; bonuses borrow rolls beyond it.
  private scoreFrames(index: number): number {
    const frame = this.frames[index]
    if (!frame) return 0

    const start = this.rollOffsetFor(index)

    switch (frame.type) {
      case FrameType.OPEN: {
        return frame.pins[0] + frame.pins[1] + this.scoreFrames(index + 1)
      }
      case FrameType.SPARE: {
        return 10 + this.rollAt(start + 2) + this.scoreFrames(index + 1)
      }
      case FrameType.STRIKE: {
        return 10 + this.rollAt(start + 1) + this.rollAt(start + 2) + this.scoreFrames(index + 1)
      }
      case FrameType.TENTH: {
        // The final frame is just the sum of its own rolls; no cross-frame bonus.
        return frame.pins.map(p => p ?? 0).reduce((a, b) => a + b, 0) + this.scoreFrames(index + 1)
      }
    }
  }

  private rollAt(rollIndex: number): number {
    const roll = this.rolls[rollIndex]
    return roll === undefined ? 0 : roll
  }

  private rollOffsetFor(index: number): number {
    let offset = 0
    for (let i = 0; i < index; i++) {
      offset += rollsFromFrame(this.frames[i]).length
    }
    return offset
  }

  private minimumRollsForFinal(): number {
    // 10 frames; each frame 1 has 2 rolls except a strike (1) and the
    // last frame may add a 3rd roll on a strike/spare.
    let total = 0
    for (let i = 0; i < Math.min(this.frames.length, 10); i++) {
      total += rollsFromFrame(this.frames[i]).length
    }
    return total
  }

  private validateFrame(frame: FrameScore): void {
    const validationResult = ScoreSchema.safeParse(frame)
    if (!validationResult.success) {
      throw new Error(`${validationResult.error}`)
    }
  }
}
