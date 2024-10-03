import { openaiModelStreaming } from '@app/lib/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

const chatStreamPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.post('/chat/stream', async (request, reply) => {
    const { message } = request.body as { message: string }

    const prompt = PromptTemplate.fromTemplate(
      'You are a helpful assistant. User: {message}\nAssistant:'
    )

    const chain = prompt.pipe(openaiModelStreaming)

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    })

    const stream = await chain.stream({ message })

    for await (const chunk of stream) {
      reply.raw.write(`data: ${JSON.stringify({ chunk })}\n\n`)
    }

    reply.raw.write('data: [DONE]\n\n')
    reply.raw.end()
  })
}

export default fp(chatStreamPlugin)
