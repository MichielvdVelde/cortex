import { Policy, ToPolicy } from '..'
import * as yup from 'yup'
import HttpErrors from 'http-errors'
import { hooks } from 'cortex/api'
import { getDb } from 'cortex/storage/mongodb'
import { parseIntParameter } from 'cortex/api/utility'
import { enforce } from '../middleware'

// List all policies
hooks.register('route', {
  path: '/admin/auth/policies',
  middleware: [
    enforce('admin:auth:policies', 'read')
  ],
  execute: async () => {
    const db = await getDb('policies')
    const collection = db.collection<Policy>('policies')
    return collection.find().toArray()
  }
})

// Create or update a policy
hooks.register('route', {
  path: '/admin/auth/policies/:path',
  method: 'post',
  middleware: [
    enforce('admin:auth:policies', 'write')
  ],
  schema: yup.object().shape({
    name: yup.string().required(),
    description: yup.string().required(),
    effect: yup.string().required(),
    resource: yup.array(yup.string()).optional(),
    notResource: yup.array(yup.string()).optional(),
    action: yup.array(yup.string()).optional(),
    notAction: yup.array(yup.string()).optional(),
  }).required(),
  execute: async context => {
    const { path } = context.params as { path: string }
    const body = context.request.body as {
      name: string,
      description: string,
      effect: 'allow' | 'deny',
      resource?: string[],
      notResource?: string[],
      action?: string[],
      notAction?: string[],
    }

    if (!body.resource?.length && !body.notResource?.length) {
      throw new HttpErrors.BadRequest('"resource" or "notResource" required')
    } else if (!body.action?.length && !body.notAction?.length) {
      throw new HttpErrors.BadRequest('"action" or "notAction" required')
    }

    const db = await getDb('policies')
    const collection = db.collection<Policy>('policies')

    if (await collection.countDocuments({ _id: path }, { limit: 1 })) {
      await collection.deleteOne({ _id: path })
    }

    await collection.insertOne({ _id: path, ...body })
    return true
  }
})

// Delete a policy
hooks.register('route', {
  path: '/admin/auth/policies/:path',
  middleware: [
    enforce('admin:auth:policies', 'delete')
  ],
  method: 'delete',
  execute: async context => {
    const { path } = context.params as { path: string }
    const db = await getDb('policies')
    const collection = db.collection<Policy>('policies')
    const { deletedCount } = await collection.deleteOne({ _id: path })

    if (deletedCount) {
      const toPolicyCollection = db.collection<ToPolicy>('to-policies')
      await toPolicyCollection.updateMany({
        policies: { $in: [path] },
      }, {
        $pull: {
          policies: path
        }
      })
    }

    return deletedCount
  }
})

// View policies for a target
hooks.register('route', {
  path: '/admin/:type/:target/policies',
  middleware: [
    enforce(context => `admin:auth:policies:${context.params.type}:${context.params.target}`, 'read')
  ],
  execute: async context => {
    const { type, target } = context.params as { type: string, target: string }
    if (!['account', 'character', 'corporation', 'alliance', 'role', 'title', 'scope'].includes(type)) {
      throw new HttpErrors.NotFound()
    }

    const db = await getDb('policies')
    const collection = db.collection<ToPolicy>('to-policies')
    return collection.find({
      type: type as any,
      target: ['account', 'role', 'scope'].includes(type) ? target : parseIntParameter(target)
    }).toArray()
  }
})

// Apply policies to a target
hooks.register('route', {
  path: '/admin/:type/:target/policies',
  method: 'post',
  middleware: [
    enforce(context => `admin:auth:policies:${context.params.type}:${context.params.target}`, 'write')
  ],
  schema: yup.array(yup.string()).required(),
  execute: async context => {
    const { type, target } = context.params as { type: string, target: string }
    const body = context.request.body as string[]

    const db = await getDb('policies')
    const collection = db.collection<ToPolicy>('to-policies')
    await collection.updateOne({
      type: type as any,
      target: ['account', 'role', 'scope'].includes(type) ? target : parseIntParameter(target)
    }, {
      $addToSet: {
        policies: {
          $each: body
        }
      }
    })

    return true
  }
})

// Remove policies from a target
hooks.register('route', {
  path: '/admin/:type/:target/policies',
  method: 'delete',
  middleware: [
    enforce(context => `admin:auth:policies:${context.params.type}:${context.params.target}`, 'delete')
  ],
  schema: yup.array(yup.string()).required(),
  execute: async context => {
    const { type, target } = context.params as { type: string, target: string }
    const body = context.request.body as string[]
    const db = await getDb('policies')
    const collection = db.collection<ToPolicy>('to-policies')
    await collection.updateOne({
      type: type as any,
      target: ['account', 'role', 'scope'].includes(type) ? target : parseIntParameter(target)
    }, {
      $pull: {
        policies: body,
      }
    })
  }
})
