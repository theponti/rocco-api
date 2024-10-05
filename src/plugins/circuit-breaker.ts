import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import fp, { type PluginOptions } from 'fastify-plugin'

export default fp((server: FastifyInstance, opts: PluginOptions, done: () => void) => {
  server.register(require('@fastify/circuit-breaker'), {
    threshold: 3, // default 5
    timeout: 5000, // default 10000
    resetTimeout: 5000, // default 10000
    onCircuitOpen: async (req: FastifyRequest, reply: FastifyReply) => {
      reply.statusCode = 500
      throw new Error('a custom error')
    },
    onTimeout: async (req: FastifyRequest, reply: FastifyReply) => {
      reply.statusCode = 504
      return 'timed out'
    },
  })
  done()
})
