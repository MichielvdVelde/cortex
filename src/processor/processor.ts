import { importMods } from 'cortex/config/mods'

process.argv.splice(1, 1)
const command = process.argv[1]

await importMods('processor')

if (command === 'start') {
  await import('./start')
} else if (command === 'run') {
  await import('./run')
} else {
  console.log(`Invalid command: "${command}". Valid command are "start", "run".`)
}
