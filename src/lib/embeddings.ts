import { Document } from "@langchain/core/documents";
import {
	AutoModel,
	AutoProcessor,
	AutoTokenizer,
	RawImage,
	type PreTrainedModel,
	type PreTrainedTokenizer,
	type Processor,
	type Tensor,
} from "@xenova/transformers";
import { createHash } from "node:crypto";

import { HominemVectorStore } from "@app/lib/chromadb.js";

class Embedder {
	private processor?: Processor;

	private model?: PreTrainedModel;

	private tokenizer?: PreTrainedTokenizer;

	async init(modelName: string) {
		// Load the model, tokenizer and processor
		this.model = await AutoModel.from_pretrained(modelName);
		this.tokenizer = await AutoTokenizer.from_pretrained(modelName);
		this.processor = await AutoProcessor.from_pretrained(modelName);
	}

	async getImageEmbedding(image: File): Promise<number[]> {
		if (!this.model || !this.tokenizer || !this.processor) {
			throw new Error("Model not initialized");
		}
		try {
			// Prepare the image and text inputs
			const image_inputs = await this.processor(image);
			const text_inputs = this.tokenizer([""], {
				padding: true,
				truncation: true,
			});
			// Embed the image
			const output = await this.model({ ...text_inputs, ...image_inputs });
			const { image_embeds }: { image_embeds: Tensor } = output;
			const { data: embeddings } = image_embeds;

			return Array.from(embeddings) as number[];
		} catch (e) {
			console.log(`Error embedding image, ${e}`);
			throw e;
		}
	}

	async getEmbeddingsFromImage(image: RawImage): Promise<number[]> {
		if (!this.model || !this.tokenizer || !this.processor) {
			throw new Error("Model not initialized");
		}

		try {
			// Prepare the image and text inputs
			const image_inputs = await this.processor(image);
			const text_inputs = this.tokenizer([""], {
				padding: true,
				truncation: true,
			});
			// Embed the image
			const output = await this.model({ ...text_inputs, ...image_inputs });
			const { image_embeds }: { image_embeds: Tensor } = output;
			const { data: embeddings } = image_embeds;

			return Array.from(embeddings) as number[];
		} catch (e) {
			console.log(`Error embedding image, ${e}`);
			throw e;
		}
	}

	async embedFromBuffer(buffer: Buffer): Promise<{
		id: string;
		metadata: { [key: string]: any };
		values: number[];
	}> {
		if (!this.model || !this.tokenizer || !this.processor) {
			throw new Error("Model not initialized");
		}

		try {
			// Load the image
			const image = await RawImage.fromBlob(new Blob([buffer]));
			const embeddings = await this.getEmbeddingsFromImage(image);

			await HominemVectorStore.imageVectorStore.addVectors(
				[embeddings] as number[][],
				[new Document({ pageContent: buffer.toString(), metadata: {} })],
			);

			// Create an id for the image
			const id = createHash("md5").update(buffer.toString()).digest("hex");

			// Return the embedding in a format ready for Pinecone
			return {
				id,
				metadata: {},
				values: Array.from(embeddings) as number[],
			};
		} catch (e) {
			console.log(`Error embedding image, ${e}`);
			throw e;
		}
	}

	async embed(
		imagePath: string,
		metadata?: { [key: string]: any },
	): Promise<{
		id: string;
		metadata: { [key: string]: any };
		values: number[];
	}> {
		if (!this.model || !this.tokenizer || !this.processor) {
			throw new Error("Model not initialized");
		}

		try {
			// Load the image
			const image = await RawImage.read(imagePath);
			const embeddings = await this.getEmbeddingsFromImage(image);

			await HominemVectorStore.imageVectorStore.addVectors(
				[embeddings] as number[][],
				[new Document({ pageContent: imagePath, metadata: metadata })],
			);

			// Create an id for the image
			const id = createHash("md5").update(imagePath).digest("hex");

			// Return the embedding in a format ready for Pinecone
			return {
				id,
				metadata: metadata || {
					imagePath,
				},
				values: Array.from(embeddings) as number[],
			};
		} catch (e) {
			console.log(`Error embedding image, ${e}`);
			throw e;
		}
	}
}

const embedder = new Embedder();
export { embedder };
