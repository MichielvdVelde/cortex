import HttpErrors from 'http-errors'
import { hooks } from 'cortex/api'
import { parseIntParameter } from 'cortex/api/utility'
import { findToken} from 'cortex/mods/eve-online/functions'
import { getScopesFor } from 'cortex/mods/eve-online/scopes'
import { protect } from 'cortex/mods/auth/middleware'
import { fetchEsi } from '../functions'

// Open the contract window in the character's client
hooks.register('route', {
  path: '/ui/contract/:contractId',
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

hooks.register('route', {
  path: '/ui/information/:id',
  method: 'put',
  middleware: [protect()],
  execute: async context => {
    const id = parseIntParameter(context.params.id)
    const token = await findToken({
      characterId: context.identity!.characterId,
      scopes: { $all: getScopesFor('open-window') },
    })

    if (!token) {
      throw new HttpErrors.Unauthorized('Missing token')
    }

    // Send the open window command
    await fetchEsi('/ui/openwindow/information/', {
      method: 'POST',
      token: token.accessToken,
      search: new URLSearchParams({ target_id: `${id}` }),
      statusCodes: [204],
    })

    return true
  }
})

hooks.register('route', {
  path: '/ui/market/:typeId',
  method: 'put',
  middleware: [protect()],
  execute: async context => {
    const typeId = parseIntParameter(context.params.typeId)
    const token = await findToken({
      characterId: context.identity!.characterId,
      scopes: { $all: getScopesFor('open-window') },
    })

    if (!token) {
      throw new HttpErrors.Unauthorized('Missing token')
    }

    // Send the open window command
    await fetchEsi('/ui/openwindow/marketdetails/', {
      method: 'POST',
      token: token.accessToken,
      search: new URLSearchParams({ type_id: `${typeId}` }),
      statusCodes: [204],
    })

    return true
  }
})
