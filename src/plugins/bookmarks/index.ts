import { Bookmark } from '@app/db/drizzle/schema'
import { db } from '@app/db'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { and, desc, eq } from 'drizzle-orm'

import { convertOGContentToBookmark, getOpenGraphData } from './utils'
import { verifySession } from '../auth/utils'

type LinkType = {
  image: string
  title: string
  description: string
  url: string
  siteName: string
  imageWidth: string
  imageHeight: string
  type: string
  createdAt: string
  updatedAt: string
}

export type SpotifyLink = LinkType & {
  type: 'spotify'
  spotifyId: string
}

export type AirbnbLink = LinkType & {
  type: 'airbnb'
  airbnbId: string
}

const bookmarkSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    image: { type: 'string' },
    title: { type: 'string' },
    description: { type: 'string' },
    url: { type: 'string' },
    siteName: { type: 'string' },
    imageWidth: { type: 'string' },
    imageHeight: { type: 'string' },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
  },
}

const bookmarksPlugin: FastifyPluginAsync = async (server: FastifyInstance) => {
  server.get(
    '/bookmarks',
    {
      schema: {
        response: {
          200: {
            type: 'array',
            items: bookmarkSchema,
          },
        },
      },
    },
    async (request, reply) => {
      const session = request.session.get('data')

      if (!session) {
        return reply.code(401).send()
      }

      const bookmarks = await db
        .select()
        .from(Bookmark)
        .where(eq(Bookmark.userId, session.userId))
        .orderBy(desc(Bookmark.createdAt))

      return bookmarks
    }
  )

  server.post(
    '/bookmarks',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            url: { type: 'string' },
          },
          required: ['url'],
        },
        response: {
          200: bookmarkSchema,
        },
      },
    },
    async (request, reply) => {
      const { url } = request.body as { url: string }
      const { userId } = request.session.get('data')

      try {
        const ogContent = await getOpenGraphData({ url })
        const bookmark = convertOGContentToBookmark({
          url,
          ogContent,
        })

        const obj = await db.insert(Bookmark).values({
          ...bookmark,
          userId,
        })
        return { bookmark: obj }
      } catch (err) {
        return reply.code(500).send({ message: 'Bookmark could not be created' })
      }
    }
  )

  server.put(
    '/bookmarks/:id',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        body: {
          type: 'object',
          properties: {
            url: { type: 'string' },
          },
          required: ['url'],
        },
        response: {
          200: bookmarkSchema,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const { url } = request.body as { url: string }
      const { userId } = request.session.get('data')

      try {
        const ogContent = await getOpenGraphData({ url })
        const bookmark = convertOGContentToBookmark({
          url,
          ogContent,
        })

        const obj = await db
          .update(Bookmark)
          .set(bookmark)
          .where(and(eq(Bookmark.id, id), eq(Bookmark.userId, userId)))
        return { bookmark: obj }
      } catch (err) {
        return reply.code(500).send({ message: 'Bookmark could not be updated' })
      }
    }
  )

  server.delete(
    '/bookmarks/:id',
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
          200: bookmarkSchema,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const { userId } = request.session.get('data')

      await db.delete(Bookmark).where(and(eq(Bookmark.id, id), eq(Bookmark.userId, userId)))

      reply.code(200).send(null)
    }
  )
}

export default bookmarksPlugin
