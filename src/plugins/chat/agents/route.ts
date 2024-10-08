import { Calculator } from '@langchain/community/tools/calculator'
import { SerpAPI } from '@langchain/community/tools/serpapi'
import { AIMessage, ChatMessage, HumanMessage } from '@langchain/core/messages'
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
import { ChatOpenAI } from '@langchain/openai'
import { StreamingTextResponse, type Message as VercelChatMessage } from 'ai'
import type { FastifyPluginAsync } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { AgentExecutor, createToolCallingAgent } from 'langchain/agents'

const convertVercelMessageToLangChainMessage = (message: VercelChatMessage) => {
  if (message.role === 'user') {
    return new HumanMessage(message.content)
  }
  if (message.role === 'assistant') {
    return new AIMessage(message.content)
  }

  return new ChatMessage(message.content, message.role)
}

const AGENT_SYSTEM_TEMPLATE =
  'You are a talking parrot named Polly. All final responses must be how a talking parrot would respond. Squawk often!'

const agentPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.post('/agent', async (request, reply) => {
    try {
      const body = request.body as {
        messages: VercelChatMessage[]
        show_intermediate_steps: boolean
      }

      /**
       * We represent intermediate steps as system messages for display purposes,
       * but don't want them in the chat history.
       */
      const messages = (body.messages ?? []).filter(
        (message: VercelChatMessage) => message.role === 'user' || message.role === 'assistant'
      )
      const returnIntermediateSteps = body.show_intermediate_steps
      const previousMessages = messages.slice(0, -1).map(convertVercelMessageToLangChainMessage)
      const currentMessageContent = messages[messages.length - 1].content

      // Requires process.env.SERPAPI_API_KEY to be set: https://serpapi.com/
      // You can remove this or use a different tool instead.
      const tools = [new Calculator(), new SerpAPI()]
      const chat = new ChatOpenAI({
        model: 'gpt-4o-mini',
        temperature: 0,
        // IMPORTANT: Must "streaming: true" on OpenAI to enable final output streaming below.
        streaming: true,
      })

      /**
       * Based on https://smith.langchain.com/hub/hwchase17/openai-functions-agent
       *
       * This default prompt for the OpenAI functions agent has a placeholder
       * where chat messages get inserted as "chat_history".
       *
       * You can customize this prompt yourself!
       */
      const prompt = ChatPromptTemplate.fromMessages([
        ['system', AGENT_SYSTEM_TEMPLATE],
        new MessagesPlaceholder('chat_history'),
        ['human', '{input}'],
        new MessagesPlaceholder('agent_scratchpad'),
      ])

      const agent = await createToolCallingAgent({
        llm: chat,
        tools,
        prompt,
      })

      const agentExecutor = new AgentExecutor({
        agent,
        tools,
        // Set this if you want to receive all intermediate steps in the output of .invoke().
        returnIntermediateSteps,
      })

      if (!returnIntermediateSteps) {
        /**
         * Agent executors also allow you to stream back all generated tokens and steps
         * from their runs.
         *
         * This contains a lot of data, so we do some filtering of the generated log chunks
         * and only stream back the final response.
         *
         * This filtering is easiest with the OpenAI functions or tools agents, since final outputs
         * are log chunk values from the model that contain a string instead of a function call object.
         *
         * See: https://js.langchain.com/docs/modules/agents/how_to/streaming#streaming-tokens
         */
        const logStream = await agentExecutor.streamLog({
          input: currentMessageContent,
          chat_history: previousMessages,
        })

        const textEncoder = new TextEncoder()
        const transformStream = new ReadableStream({
          async start(controller) {
            for await (const chunk of logStream) {
              if (chunk.ops?.length > 0 && chunk.ops[0].op === 'add') {
                const addOp = chunk.ops[0]
                if (
                  addOp.path.startsWith('/logs/ChatOpenAI') &&
                  typeof addOp.value === 'string' &&
                  addOp.value.length
                ) {
                  controller.enqueue(textEncoder.encode(addOp.value))
                }
              }
            }
            controller.close()
          },
        })

        return new StreamingTextResponse(transformStream)
      }
      /**
       * Intermediate steps are the default outputs with the executor's `.stream()` method.
       * We could also pick them out from `streamLog` chunks.
       * They are generated as JSON objects, so streaming them is a bit more complicated.
       */
      const result = await agentExecutor.invoke({
        input: currentMessageContent,
        chat_history: previousMessages,
      })

      return reply.status(200).send({
        output: result.output,
        intermediate_steps: result.intermediateSteps,
      })
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e)
      return reply.send({
        error: 'Internal Server Error',
        status: 500,
      })
    }
  })
}

export default fastifyPlugin(agentPlugin, {
  name: 'agentPlugin',
  dependencies: ['@fastify/cookie', '@fastify/session'],
})
