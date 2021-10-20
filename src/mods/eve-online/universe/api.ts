import HttpErrors from 'http-errors'
import { hooks } from 'cortex/api'
import { parseIntParameter } from 'cortex/api/utility'
import { getStructure } from 'cortex/mods/eve-online/functions'

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
