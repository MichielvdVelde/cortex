import type { Filter } from 'mongodb'
import HttpErrors from 'http-errors'

/** Transform an object based on a function. Creates a new object. */
export function transform<Type>(obj: any, fn: (key: string, value: any) => any): Type {
  const newObj: any = {}

  for (const key of Object.keys(obj)) {
    const result = fn(key, obj[key])
    if (result === undefined) continue
    if (Array.isArray(result)) {
      newObj[result[0]] = result[1]
    } else {
      newObj[key] = result
    }
  }

  return newObj
}

/** Create a filter query based on the URL search parameters. */
export function createFilter<Type>(search: URLSearchParams, fn: (key: string, value: string) => any): Filter<Type> {
  const filter: any = {}

  for (const [key, value] of search.entries()) {
    const result = fn(key, value)
    if (result === undefined) continue
    if (Array.isArray(result)) {
      filter[result[0]] = result[1]
    } else {
      filter[key] = result
    }
  }

  return filter
}

/** Extract pagination info from the search parameters. */
export function extractPagination(search: URLSearchParams, perPage = 20): { skip: number, limit: number } {
  let page = 1

  if (search.has('page')) {
    page = parseIntParameter(search.get('page')!)
  }

  if (search.has('perPage')) {
    perPage = parseIntParameter(search.get('perPage')!)
  }

  return {
    skip: (page - 1) * perPage,
    limit: perPage,
  }
}

/** Attempt to parse a string into an integer and throws a `BadRequest` on fail. */
export function parseIntParameter(value: string): number {
  try {
    return parseInt(value)
  } catch (e) {
    throw new HttpErrors.BadRequest('Failed to parse parameter')
  }
}
