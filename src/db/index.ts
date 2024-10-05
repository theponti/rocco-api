import * as schema from './drizzle/schema'
import { Client as PGClient } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import fastifyPlugin from 'fastify-plugin'
import logger from '@app/logger'

const client = new PGClient({
  connectionString: process.env.DATABASE_URL,
})

export const db = drizzle(client, { schema })

export const PgPlugin = fastifyPlugin(async (server) => {
  try {
    logger.info({
      msg: 'Connecting to Postgres',
      url: process.env.DATABASE_URL,
    })
    await client.connect()
    logger.info('Connected to Postgres')
    server.decorate('db', db)
  } catch (error) {
    logger.error('Error connecting to Postgres', error)
  } finally {
    server.addHook('onClose', async () => {
      await client.end()
    })
  }
})

export const takeOne = <T>(values: T[]): T => {
  return values[0]
}

// Define this helper somewhere in your codebase:
export const takeUniqueOrThrow = <T>(values: T[]): T => {
  if (values.length !== 1) throw new Error('Found non unique or inexistent value')
  return values[0]
}
