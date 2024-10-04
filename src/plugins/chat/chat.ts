import { db, takeUniqueOrThrow } from '@app/db'
import { Chat, ChatMessage } from '@app/db/drizzle/schema'
import { PromptTemplate } from '@langchain/core/prompts'
import { ChatOpenAI } from '@langchain/openai'
import { eq } from 'drizzle-orm'
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'
import { HttpResponseOutputParser } from 'langchain/output_parsers'

const formatMessage = (message: { role: string; content: string }) => {
  return `${message.role}: ${message.content}`
}

const TEMPLATE = `
	You are an expert assistant at what the topic the user begins the conversation with.

	## Rules
	- Only respond based on the conversation topic that was set based on the user's first message.
	- Do not introduce new topics.
	- Do not provide any information that is not directly related to the user's first message.
	- Do not ask questions.
	- If the user asks a question, provide a direct answer.
	- If the user makes a statement, provide a response that is relevant to the user's statement.
	- If the user makes a statement that is not related to the conversation topic, inform the user what the conversation topic is.

	## Current conversation:
	{chat_history}

	## User input
	{input}
`

const STRUCTURED_OUTPUT_TEMPLATE = `
Extract the requested fields from the input.

The field "entity" refers to the first mentioned entity in the input.

## Input:
{input}
`

const chatPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.post('/chat', async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await request.session // Assuming you have session handling middleware

    if (!session || !session.user) {
      return reply.code(401).send({ error: 'Unauthorized' })
    }

    try {
      let chat = null
      const activeChatId = request.cookies.activeChat

      if (activeChatId) {
        chat = await db
          .select()
          .from(Chat)
          .where(eq(Chat.id, activeChatId))
          .limit(1)
          .then(takeUniqueOrThrow)
      } else {
        chat = await db
          .insert(Chat)
          .values({
            title: 'Basic Chat',
            userId: session.user.id,
          })
          .returning()
          .then(takeUniqueOrThrow)
        reply.setCookie('activeChat', chat.id)
      }

      if (!chat) {
        return reply.code(404).send({ error: 'Chat not found' })
      }

      const messages = await db.select().from(ChatMessage).where(eq(ChatMessage.chatId, chat.id))

      const { message } = request.body as { message: string }

      const formattedPreviousMessages = messages.slice(0, -1).map(formatMessage)
      const prompt = PromptTemplate.fromTemplate(TEMPLATE)
      const model = new ChatOpenAI({
        streaming: false,
      })

      const result = await prompt
        .pipe(model)
        .pipe(new HttpResponseOutputParser())
        .invoke({
          chat_history: formattedPreviousMessages.join('\n'),
          input: message,
        })

      const formattedBufferResult = Buffer.from(result).toString('utf-8')

      const newMessages = await db.transaction(async (t) => {
        return [
          // Insert user message
          await t
            .insert(ChatMessage)
            .values({
              userId: session.user.id,
              chatId: chat.id,
              role: 'user',
              content: message,
            })
            .returning()
            .then(takeUniqueOrThrow),
          // Insert assistant message
          await t
            .insert(ChatMessage)
            .values({
              userId: session.user.id,
              chatId: chat.id,
              role: 'assistant',
              content: formattedBufferResult,
            })
            .returning()
            .then(takeUniqueOrThrow),
        ]
      })

      return reply.send({
        messages: messages.concat(newMessages),
      })
    } catch (e) {
      fastify.log.error(e)
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })
}

export default fp(chatPlugin, {
  name: 'chatPlugin',
  dependencies: ['@fastify/cookie', '@fastify/session'],
})
