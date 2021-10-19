import type { JsonObject, JsonArray } from 'type-fest'
import fetch from 'node-fetch'
import { getDb } from 'cortex/storage/mongodb'
import { nanoid } from 'nanoid/async'

const ESI_URL = 'https://esi.evetech.net/latest'

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
