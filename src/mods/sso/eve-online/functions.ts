import type { Filter } from 'mongodb'
import type { Token } from '.'
import type { Character, Corporation, Item, Structure } from './types'
import fetch from 'node-fetch'
import { getDb } from 'cortex/storage/mongodb'
import { exchangeCode } from './sso'

export async function getItem(typeId: number): Promise<Item> {
  return fetchEsiIntoCollection(`/universe/types/${typeId}/`, 'types', typeId) as Promise<Item>
}

export async function getCharacter(characterId: number): Promise<Character> {
  return fetchEsiIntoCollection(`/characters/${characterId}/`, 'characters', characterId) as Promise<Character>
}

export async function getCorporation(corporationId: number): Promise<Corporation> {
  return fetchEsiIntoCollection(`/corporations/${corporationId}/`, 'corporations', corporationId) as Promise<Corporation>
}

export async function getStructure(structureId: number): Promise<Structure> {
  const token = await findToken({
    corporationId: parseInt(process.env.CORPORATION_ID!),
    scopes: { $in: ['esi-universe.read_structures.v1'] },
  })
  if (!token) {
    throw new Error('Token not found')
  }
  return fetchEsiIntoCollection(`/universe/structures/${structureId}/`, 'structures', structureId, token?.accessToken) as Promise<Structure>
}

export async function fetchEsiIntoCollection(
  uri: string,
  collectionName: string,
  key: number,
  token?: string,
) {
  const db = await getDb('eve-online')
  const collection = db.collection(collectionName)
  let document = await collection.findOne({ _id: key })
  const headers: Record<string, string> = {}

  if (document) {
    if (document.expires.getTime() > Date.now()) {
      return document
    }
    headers['If-None-Match'] = document.etag
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`https://esi.evetech.net/latest${uri}`, { headers })

  if (document && response.status === 304) {
    return document
  }

  const body = await response.json() as any
  document = {
    ...body,
    etag: response.headers.get('etag')!,
    expires: new Date(response.headers.get('expires')!)
  }

  await collection.updateOne({ _id: key }, {
    $set: document,
    $setOnInsert: {
      _id: key,
    }
  }, { upsert: true })
  document!._id = key
  return document
}

/** Find a token which matches the filter. */
export async function findToken(filter: Filter<Token>, options?: {
  refresh?: boolean,
}): Promise<Token | undefined> {
  const db = await getDb()
  const collection = db.collection<Token>('tokens')
  let token = await collection.findOne(filter)

  if (token && (options?.refresh ?? true) && token.expiresOn.getTime() <= Date.now()) {
    return refreshToken(token)
  }

  return token ?? undefined
}

/** Refresh the token */
export async function refreshToken(token: Token): Promise<Token> {
  const db = await getDb()
  const collection = db.collection<Token>('tokens')

  const response = await exchangeCode(token.refreshToken, {
    isRefreshToken: true,
  })

  await collection.updateOne({ _id: token._id }, {
    $set: {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresOn: new Date(Date.now() + (response.expires_in * 1000)),
    }
  })

  return collection.findOne({ _id: token._id }) as Promise<Token>
}
