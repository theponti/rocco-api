import dotenv from 'dotenv'
import assert from 'node:assert'
dotenv.config()

import fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify'
import { PgPlugin } from './db'
import adminPlugin from './plugins/admin'
import authPlugin from './plugins/auth'
import bookmarksPlugin from './plugins/bookmarks'
import chatSingleResponsePlugin from './plugins/chat/single-response'
import circuitBreaker from './plugins/circuit-breaker'
import emailPlugin from './plugins/email'
import ideasPlugin from './plugins/ideas'
import invites from './plugins/invites'
import listsPlugin from './plugins/lists'
import PlacesPlugin from './plugins/places'
import rateLimitPlugin from './plugins/rate-limit'
import sessionPlugin from './plugins/session'
import shutdownPlugin from './plugins/shutdown'
import statusPlugin from './plugins/status'
import usersPlugin from './plugins/user'

const { APP_URL, JWT_SECRET, PORT } = process.env

assert(APP_URL, 'Missing APP_URL env var')

export async function createServer(opts: FastifyServerOptions = {}): Promise<FastifyInstance> {
  const server = fastify(opts)

  await server.register(require('@fastify/cors'), {
    origin: [APP_URL],
    credentials: true,
  })
  await server.register(shutdownPlugin)
  await server.register(sessionPlugin)
  await server.register(require('@fastify/multipart'))
  await server.register(require('@fastify/csrf-protection'), {
    sessionPlugin: '@fastify/secure-session',
  })
  await server.register(require('@fastify/helmet'))
  await server.register(require('@fastify/jwt'), {
    secret: JWT_SECRET,
  })
  await server.register(PgPlugin)
  await server.register(circuitBreaker)
  await server.register(rateLimitPlugin)
  await server.register(statusPlugin)
  await server.register(emailPlugin)
  await server.register(adminPlugin)
  await server.register(authPlugin)
  await server.register(usersPlugin)
  await server.register(listsPlugin)
  await server.register(PlacesPlugin)
  await server.register(invites)
  await server.register(bookmarksPlugin)
  await server.register(ideasPlugin)
  await server.register(chatSingleResponsePlugin)

  server.setErrorHandler((error, request, reply) => {
    console.error(error)
    reply.status(500).send({ error: 'Internal server error' })
  })

  return server
}

export async function startServer() {
  const server = await createServer({
    logger: true,
    disableRequestLogging: process.env.ENABLE_REQUEST_LOGGING !== 'true',
  })

  if (!PORT) {
    server.log.error('Missing PORT env var')
    process.exit(1)
  }

  try {
    await server.listen({ port: +PORT, host: '0.0.0.0' })
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}
