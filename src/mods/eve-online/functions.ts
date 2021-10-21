import type { Filter } from 'mongodb'
import type { Token } from 'cortex/mods/sso/eve-online'
import type { Character, Corporation, Item, Structure } from './types'
import type { JsonObject, JsonArray } from 'type-fest'
import fetch from 'node-fetch'
import { nanoid } from 'nanoid/async'
import { getDb } from 'cortex/storage/mongodb'
import { exchangeCode } from 'cortex/mods/sso/eve-online/sso'

export const ESI_URL = 'https://esi.evetech.net/latest'

export async function getItem(typeId: number): Promise<Item> {
  return fetchEsiIntoCollection(`/universe/types/${typeId}/`, 'types', typeId) as Promise<Item>
}

export async function getCharacter(characterId: number): Promise<Character> {
  return fetchEsiIntoCollection(`/characters/${characterId}/`, 'characters', characterId) as Promise<Character>
}

export async function getCorporation(corporationId: number): Promise<Corporation> {
  return fetchEsiIntoCollection(`/corporations/${corporationId}/`, 'corporations', corporationId) as Promise<Corporation>
}

export async function getStructure(structureId: number): Promise<Structure | undefined> {
  const db = await getDb()
  const collection = db.collection<Token>('tokens')
  const tokens = collection.find({
    scopes: { $in: ['esi-search.search_structures.v1'] },
  })

  for await (let token of tokens) {
    if (token.expiresOn.getTime() < Date.now()) {
      token = await refreshToken(token)
    }

    try {
      const document = await fetchEsiIntoCollection(`/universe/structures/${structureId}/`, 'structures', structureId, token.accessToken) as Promise<Structure>
      return document
    } catch (e) {
      continue
    }
  }
}

/** Fetch a resource from ESI and store it in its own collection. */
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

  const response = await fetch(`${ESI_URL}${uri}`, { headers })

  if (document && response.status === 304) {
    return document
  }

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
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

/** Fetch a resource from ESI. */
export async function fetchEsi(
  uri: string,
  {
    method = 'GET',
    statusCodes = [200],
    search,
    body,
    headers = {},
    token,
    noCheck = false,
  }: {
    method?: 'GET' | 'PUT' | 'POST' | 'DELETE',
    statusCodes?: number[],
    search?: URLSearchParams,
    body?: JsonObject | JsonArray,
    headers?: Record<string, any>,
    token?: string,
    noCheck?: boolean,
  } = {}
) {
  let uriWithSearch: string | undefined = undefined
  let stringifiedBody: string | undefined = undefined

  if (search && [...search.keys()].length) {
    uriWithSearch = `${uri}?${search.toString()}`
  }

  const db = await getDb()
  const collection = db.collection('responses')

  if (!noCheck && method === 'GET') {
    const responseInfo = await collection.findOne({
      source: 'esi',
      uri: uriWithSearch ?? uri,
    }, { projection: { etag: 1 } })

    if (responseInfo) {
      headers['If-None-Match'] = responseInfo.etag

      if (!statusCodes.includes(304)) {
        statusCodes.push(304)
      }
    }
  }

  if (body) {
    try {
      stringifiedBody = JSON.stringify(body)
      headers['Content-Type'] = 'application/json'
    } catch (e) {
      throw new TypeError('Failed to serialize body')
    }
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${ESI_URL}${uriWithSearch ?? uri}`, {
    method,
    headers,
    body: stringifiedBody,
  })

  if (!statusCodes.includes(response.status)) {
    const { error } = await response.json() as { error?: string }
    throw new Error(`[ESI]: ${error}`)
  }

  if (!noCheck && method === 'GET' && response.ok) {
    await collection.updateOne({
      source: 'esi',
      uri: uriWithSearch ?? uri
    }, {
      $set: {
        source: 'esi',
        uri: uriWithSearch ?? uri,
        etag: response.headers.get('etag')!,
        expiresOn: new Date(response.headers.get('expires')!),
        lastRetrievedOn: new Date(),
      },
      $setOnInsert: {
        _id: await nanoid(),
      }
    }, { upsert: true })
  }

  return response
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
