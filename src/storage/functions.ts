import { nanoid } from 'nanoid/async'
import { getDb } from './mongodb'

/** Set a system-wide setting */
export async function getSetting(path: string): Promise<any>
export async function getSetting<Type>(path: string, defaultValue: Type): Promise<Type>
export async function getSetting<Type>(path: string, defaultValue?: Type): Promise<Type | undefined> {
  const db = await getDb()
  const collection = db.collection('settings')
  const setting = await collection.findOne({ _id: path })

  if (!setting) {
    return defaultValue
  }

  switch (setting.type) {
    case 'int':
      return parseInt(setting.value) as unknown as Type
    case 'float':
      return parseFloat(setting.value) as unknown as Type
    case 'string':
      return setting.value as unknown as Type
    case 'json':
      return JSON.parse(setting.value) as Type
    case 'boolean':
      // @ts-ignore
      return setting.value === 'true'
  }
}

/** Set a system-wide setting */
export async function setSetting<Type>(path: string, value: Type, type: 'int' | 'float' | 'string' | 'json' | 'boolean'): Promise<void> {
  const db = await getDb()
  const collection = db.collection('settings')

  let strValue: string

  switch (type) {
    case 'int':
    case 'float':
    case 'boolean':
    case 'string':
      strValue = `${value}`
      break
    case 'json':
      strValue = JSON.stringify(value)
      break
    default:
      throw new Error(`Invalid type: ${type}`)
  }

  await collection.updateOne({ _id: path }, {
    $set: {
      type,
      value: strValue,
    },
    $setOnInsert: {
      _id: path,
    }
  }, { upsert: true })
}

/** Get a user-specific preference */
export async function getPreference(characterId: number, path: string): Promise<any>
export async function getPreference<Type>(characterId: number, path: string, defaultValue: Type): Promise<Type>
export async function getPreference<Type>(characterId: number, path: string, defaultValue?: Type): Promise<Type | undefined> {
  const db = await getDb()
  const collection = db.collection('preferences')
  const preference = await collection.findOne({ characterId, path })

  if (!preference) {
    return defaultValue
  }

  switch (preference.type) {
    case 'int':
      return parseInt(preference.value) as unknown as Type
    case 'float':
      return parseFloat(preference.value) as unknown as Type
    case 'string':
      return preference.value as unknown as Type
    case 'json':
      return JSON.parse(preference.value) as Type
    case 'boolean':
      // @ts-ignore
      return doc.value === 'true'
  }
}

/** Set a character-specific preference */
export async function setPreference<Type>(characterId: number, path: string, value: Type, type: 'int' | 'float' | 'string' | 'json' | 'boolean'): Promise<void> {
  const db = await getDb()
  const collection = db.collection('preferences')

  let strValue: string

  switch (type) {
    case 'int':
    case 'float':
    case 'boolean':
    case 'string':
      strValue = `${value}`
      break
    case 'json':
      strValue = JSON.stringify(value)
      break
    default:
      throw new Error(`Invalid type: ${type}`)
  }

  await collection.updateOne({ characterId, path }, {
    $set: {
      type,
      value: strValue,
    },
    $setOnInsert: {
      _id: await nanoid(),
    }
  }, { upsert: true })
}
