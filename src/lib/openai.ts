import { ChatOpenAI, OpenAI, OpenAIClient } from "@langchain/openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
	throw new Error("OPENAI_API_KEY is required to connect to OpenAI API");
}

export const openai = new OpenAIClient({ apiKey: OPENAI_API_KEY });

export const chatModel = new ChatOpenAI({
	modelName: "gpt-3.5-turbo",
	streaming: true,
	temperature: 0.7,
	openAIApiKey: OPENAI_API_KEY,
});
