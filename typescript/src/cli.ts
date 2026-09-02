import { input, confirm } from '@inquirer/prompts'

import { FrameType } from './bowling-score.js'
import { Person } from './person.js'

const numOfPlayersAnswer = await input({
  message: 'How many players?',
  validate: (value) => {
    const n = Number.parseInt(value, 10)
    return Number.isNaN(n) ? 'Please enter a valid number' : true
  }
})

const numberOfPlayers = Number.parseInt(numOfPlayersAnswer, 10)

const players: Array<Person> = []

for (let i = 0; i < numberOfPlayers; i++) {
  const playerName = await input({
    message: `What is the name of player ${i + 1}?`,
  })
  players.push(new Person({ name: playerName }))
}

console.log('You\'ve selected the following players')
for (const p of players) {
  console.log(`- ${p.name}`)
}

await confirm({
  message: 'Do the names look right?'
})

console.log('Let the games begin!')

const rounds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
for (const round of rounds) {
  console.log(`Round ${round}!`)
  for (const p of players) {
    const score = await input({
      message: `Score for ${p.name} in round ${round}`
    })
    switch (true) {
      case score.trim() === 'x': {
        p.recordScore({
          type: FrameType.STRIKE,
        })
        break
      }
      case score.trim().startsWith('/'): {
        p.recordScore({
          type: FrameType.SPARE,
          pins: [5, 5],
        })
        break
      }
      default: {
        break
      }
    }
  }
}
