import { PromptTemplate } from '@langchain/core/prompts'
import { ChatOpenAI } from '@langchain/openai'
import { createStreamDataTransformer, type Message } from 'ai'
import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import { HttpResponseOutputParser } from 'langchain/output_parsers'

// biome-ignore lint/complexity/noBannedTypes: <explanation>
type ChatPluginOptions = {}

const chatPlugin: FastifyPluginAsync<ChatPluginOptions> = async (fastify, options) => {
  fastify.post(
    '/chat',
    {
      schema: {
        body: {
          type: 'object',
          required: ['messages'],
          properties: {
            messages: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  content: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const session = request.session.get('data')

      if (!session) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      try {
        const { messages } = request.body as { messages: Message[] }

        const message = messages.at(-1)?.content

        if (!message) {
          return reply.code(400).send({ error: 'No message was provided in the request body' })
        }

        const prompt = PromptTemplate.fromTemplate('{message}')

        const model = new ChatOpenAI({})

        const parser = new HttpResponseOutputParser()

        const chain = prompt.pipe(model).pipe(parser)

        const stream = await chain.stream({ message })

        // Set appropriate headers for streaming
        reply.raw.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        })

        // Stream the response
        for await (const chunk of stream) {
          reply.raw.write(chunk)
        }

        reply.raw.end()
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      } catch (e: any) {
        reply.code(e.status ?? 500).send({ error: e.message })
      }
    }
  )
}

export default fp(chatPlugin, {
  name: 'chatPlugin',
})
