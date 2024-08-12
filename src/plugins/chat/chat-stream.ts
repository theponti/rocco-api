import { PromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import type { FastifyPluginAsync } from "fastify";

const ChatStreamPlugin: FastifyPluginAsync = async (fastify) => {
	// Streaming chat with GPT
	fastify.post("/chat", async (request, reply) => {
		const { message } = request.body as { message: string };

		const prompt = PromptTemplate.fromTemplate(
			"You are a helpful assistant. User: {message}\nAssistant:",
		);

		const chain = prompt.pipe(chatModel);

		reply.raw.writeHead(200, {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			Connection: "keep-alive",
		});

		const stream = await chain.stream({ message });

		for await (const chunk of stream) {
			reply.raw.write(`data: ${JSON.stringify({ chunk })}\n\n`);
		}

		reply.raw.write("data: [DONE]\n\n");
		reply.raw.end();
	});
};
