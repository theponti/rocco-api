import { db } from '@app/db'
import { Idea } from '@app/db/drizzle/schema'
import { and, desc, eq } from 'drizzle-orm'
import type { FastifyInstance, FastifyPluginAsync, FastifyRequest } from 'fastify'
import { verifySession } from '../auth/utils'

const ideaSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    description: { type: 'string' },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
  },
}
const ideasPlugin: FastifyPluginAsync = async (server: FastifyInstance) => {
  server.get(
    '/ideas',
    {
      schema: {
        response: {
          200: {
            type: 'array',
            items: ideaSchema,
          },
        },
      },
    },
    async (request) => {
      const { userId } = request.session.get('data')
      const ideas = await db
        .select()
        .from(Idea)
        .where(eq(Idea.userId, userId))
        .orderBy(desc(Idea.createdAt))
      return ideas
    }
  )

  server.post(
    '/ideas',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            description: { type: 'string' },
          },
          required: ['description'],
        },
        response: {
          200: ideaSchema,
        },
      },
    },
    async (request: FastifyRequest) => {
      const { description } = request.body as { description: string }
      const { userId } = request.session.get('data')
      const idea = await db.insert(Idea).values({
        description,
        userId,
      })
      return idea
    }
  )

  server.delete(
    '/ideas/:id',
    {
      preHandler: verifySession,
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        response: {
          200: ideaSchema,
        },
      },
    },
    async (request) => {
      const { id } = request.params as { id: string }
      const { userId } = request.session.get('data')
      await db.delete(Idea).where(and(eq(Idea.userId, userId), eq(Idea.id, id)))
      return true
    }
  )
}

export default ideasPlugin
