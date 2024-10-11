import type { InferInsertModel } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { EVENTS, track } from '../../../analytics'
import { db, takeUniqueOrThrow } from '../../../db'
import { List } from '../../../db/drizzle/schema'
import type { RequestWithSession } from '../../../typings'
import { verifySession } from '../../auth/utils'

const postListRoute = (server: FastifyInstance) => {
  server.post(
    '/lists',
    {
      preValidation: verifySession,
      schema: {
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: {
              type: 'string',
              minLength: 3,
              maxLength: 50,
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              list: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request: RequestWithSession): Promise<{ list: InferInsertModel<typeof List> }> => {
      const { name } = request.body as { name: string }
      const { userId } = request.session.get('data')
      const list = await db
        .insert(List)
        .values({
          name,
          userId,
        })
        .returning()
        .then(takeUniqueOrThrow)

      track(userId, EVENTS.USER_EVENTS.LIST_CREATED, { name })

      return { list }
    }
  )
}

export default postListRoute
