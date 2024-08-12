import fs from "node:fs/promises";
import path from "node:path";
import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { CLIPEncoder } from "clip-encoder";

interface PluginOptions {
	openaiApiKey: string;
}

const advancedAIPlugin: FastifyPluginAsync<PluginOptions> = async (
	fastify,
	options,
) => {
	// Upload photo and store CLIP embedding
	fastify.post("/upload-photo", async (request, reply) => {
		const data = await request.file();
		if (!data) {
			return reply.code(400).send({ error: "No file uploaded" });
		}

		const buffer = await data.toBuffer();
		const embedding = await clipEncoder.encode(buffer);

		const { data: uploadData, error: uploadError } = await supabase.storage
			.from("photos")
			.upload(`${Date.now()}-${data.filename}`, buffer);

		if (uploadError) {
			return reply.code(500).send({ error: "Failed to upload photo" });
		}

		const { data: insertData, error: insertError } = await supabase
			.from("photos")
			.insert({
				filename: data.filename,
				storage_path: uploadData.path,
				embedding: embedding,
			});

		if (insertError) {
			return reply.code(500).send({ error: "Failed to store photo metadata" });
		}

		return reply.send({
			message: "Photo uploaded and embedded successfully",
			data: insertData,
		});
	});

	// Query photos
	fastify.get("/query-photos", async (request, reply) => {
		const { query } = request.query as { query: string };

		const queryEmbedding = await clipEncoder.encode(query);

		const { data, error } = await supabase.rpc("query_photos", {
			query_embedding: queryEmbedding,
			match_threshold: 0.7,
			match_count: 5,
		});

		if (error) {
			return reply.code(500).send({ error: "Failed to query photos" });
		}

		return reply.send({ results: data });
	});

	// Upload audio and store transcription
	fastify.post("/upload-audio", async (request, reply) => {
		const data = await request.file();
		if (!data) {
			return reply.code(400).send({ error: "No file uploaded" });
		}

		const buffer = await data.toBuffer();
		const tempFilePath = path.join(__dirname, `temp-${Date.now()}.wav`);
		await fs.writeFile(tempFilePath, buffer);

		try {
			const transcription = await openai.createTranscription(
				fs.createReadStream(tempFilePath) as any,
				"whisper-1",
			);

			const { data: uploadData, error: uploadError } = await supabase.storage
				.from("audio")
				.upload(`${Date.now()}-${data.filename}`, buffer);

			if (uploadError) {
				return reply.code(500).send({ error: "Failed to upload audio" });
			}

			const { data: insertData, error: insertError } = await supabase
				.from("audio_transcriptions")
				.insert({
					filename: data.filename,
					storage_path: uploadData.path,
					transcription: transcription.data.text,
				});

			if (insertError) {
				return reply
					.code(500)
					.send({ error: "Failed to store audio transcription" });
			}

			return reply.send({
				message: "Audio uploaded and transcribed successfully",
				data: insertData,
			});
		} finally {
			await fs.unlink(tempFilePath);
		}
	});
};

export default fp(advancedAIPlugin);

const indexImages = async () => {
	try {
		await createIndexIfNotExists(pineconeClient, indexName, 512);
		await waitUntilIndexIsReady(pineconeClient, indexName);

		await embedder.init("Xenova/clip-vit-base-patch32");

		const imagePaths = await listFiles("./data");

		await embedAndUpsert({ imagePaths, chunkSize: 100 });
	} catch (error) {
		console.error(error);
	}
};
