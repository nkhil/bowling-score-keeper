# Bowling Scoring Rules

## Basic Structure
- A game consists of 10 frames, each with an equal opportunity to knock down 10 pins.
- In each frame, a bowler gets a maximum of 2 rolls (except the 10th frame, see below).
- Each frame starts with 10 pins standing.

## Frame Scoring

### Open Frame (no strike, no spare)
- If the bowler does not knock down all 10 pins in 2 rolls, the score is simply the total pins knocked down in that frame.
- No bonus is awarded for the next frame.

### Strike
- A strike is when all 10 pins are knocked down on the **first roll** of a frame.
- Scored as **10 points + the pins from the next 2 rolls**.
- The frame ends after the single roll (no second roll in frames 1-9).

### Spare
- A spare is when all 10 pins are knocked down across **both rolls** of a frame.
- Scored as **10 points + the pins from the next 1 roll**.
- The frame uses both rolls.

## The 10th Frame
- If a strike or spare is thrown in the 10th frame, the bowler gets **bonus rolls** to determine the bonus points.
    - A strike in the 10th grants **2 extra rolls**.
    - A spare in the 10th grants **1 extra roll**.
- The 10th frame can therefore have up to **3 rolls total**.
- These bonus rolls are used only to calculate the 10th frame score.

## Cumulative Scoring
- Scores are **cumulative** — each frame's score is added to the running total from the previous frames.
- The displayed frame total is the running total up to and including that frame.

## Special Cases / Validation
- A spare cannot be recorded in the same frame as a strike.
- A frame's two rolls (when not a strike) cannot exceed 10 pins combined.
- Maximum achievable score in a game is **300** (12 consecutive strikes: 10 in first nine frames + 2 bonus in the 10th).
