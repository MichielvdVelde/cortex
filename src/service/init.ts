import type { Policy, ToPolicy } from 'cortex/mods/auth'
import { getPolicies } from 'cortex/mods/auth/register'
import { getCharacter, getCorporation } from 'cortex/mods/eve-online/functions'
import { closeClient, getDb } from 'cortex/storage/mongodb'
import { nanoid } from 'nanoid/async'

const corporation = await getCorporation(parseInt(process.env.CORPORATION_ID!))
console.log(`Now initializing EVE Cortex for corporation ${corporation.name}...`)

const policyDb = await getDb('policies')
const policyCollection = policyDb.collection<Policy>('policies')

if (await policyCollection.countDocuments({}, { limit: 1 })) {
  console.log('EVE Cortex has already been initialized! Aborting.')
  await closeClient()
  process.exit(0)
}

console.log('Inserting default policies')
await policyCollection.insertMany([...getPolicies()])

const character = await getCharacter(corporation.ceo_id)
console.log(`Now adding policy for CEO character ${character.name}...`)

const toPolicyCollection = policyDb.collection<ToPolicy>('to-policies')

await toPolicyCollection.insertOne({
  _id: await nanoid(),
  type: 'character',
  target: corporation.ceo_id,
  policies: ['full'],
})

console.log('Initialization complete!')
await closeClient()
