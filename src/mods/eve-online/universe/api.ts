import HttpErrors from 'http-errors'
import { hooks } from 'cortex/api'
import { parseIntParameter } from 'cortex/api/utility'
import { fetchEsi, findToken, getStructure } from 'cortex/mods/eve-online/functions'

// Search for structures
hooks.register('route', {
  path: '/universe/structures/search',
  execute: async context => {
    const search = new URLSearchParams(context.querystring)
    if (!search.has('search')) {
      throw new HttpErrors.BadRequest('Missing search parameter')
    }

    const token = await findToken({
      corporationId: parseInt(process.env.CORPORATION_ID!),
      scopes: { $in: ['esi-search.search_structures.v1'] },
    })

    if (!token) {
      throw new Error('Missing token')
    }

    const response = await fetchEsi(`/characters/${token.characterId}/search/`, {
      noCheck: true,
      token: token.accessToken,
      search: new URLSearchParams({
        categoies: 'structure',
        search: search.get('search')!,
      }),
    })

    const result = await response.json() as { structure: number[] }
    return result.structure
  }
})

// Load and view structure details
hooks.register('route', {
  path: '/universe/structures/:structureId',
  execute: async context => {
    const structureId = parseIntParameter(context.params.structureId)
    const structure = await getStructure(structureId)

    if (!structure) {
      throw new HttpErrors.NotFound('Structure not found')
    }

    return structure
  }
})
