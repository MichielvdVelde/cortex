import HttpErrors from 'http-errors'
import { hooks } from 'cortex/api'
import { parseIntParameter } from 'cortex/api/utility'
import { findToken, getStructure } from 'cortex/mods/eve-online/functions'
import { getScopesFor } from 'cortex/mods/eve-online/scopes'
import { protect } from 'cortex/mods/auth/middleware'
import { fetchEsi } from '../functions'

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

// Open the contract window in the character's client
hooks.register('route', {
  path: '/universe/ui/contract/:contractId',
  method: 'put',
  middleware: [protect()],
  execute: async context => {
    const contractId = parseIntParameter(context.params.contractId)
    const token = await findToken({
      characterId: context.identity!.characterId,
      scopes: { $all: getScopesFor('open-window') },
    })

    if (!token) {
      throw new HttpErrors.Unauthorized('Missing token')
    }

    // Send the open window command
    await fetchEsi('/ui/openwindow/contract/', {
      method: 'POST',
      token: token.accessToken,
      search: new URLSearchParams({ contract_id: `${contractId}` }),
      statusCodes: [204],
    })

    return true
  }
})
