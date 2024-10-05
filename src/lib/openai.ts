import { ChatOpenAI } from '@langchain/openai'
import { OpenAI } from 'openai'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

if (!OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is required to connect to OpenAI API')
}

export const openaiClient = new OpenAI({ apiKey: OPENAI_API_KEY })

export const openaiModelStreaming = new ChatOpenAI({
  modelName: 'gpt-4o-mini',
  streaming: true,
  temperature: 0.7,
  openAIApiKey: OPENAI_API_KEY,
})

export const openaiModel = new ChatOpenAI({
  modelName: 'gpt-4o-mini',
  temperature: 0.7,
  openAIApiKey: OPENAI_API_KEY,
})
