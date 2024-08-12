import {
	AutoTokenizer,
	AutoProcessor,
	AutoModel,
	RawImage,
	type Processor,
	type PreTrainedModel,
	type PreTrainedTokenizer,
	type Tensor,
} from "@xenova/transformers";
import type {
	RecordMetadata,
	PineconeRecord,
} from "@pinecone-database/pinecone";
import { createHash } from "node:crypto";

import { HominemVectorStore } from "@app/lib/chromadb.js";

class Embedder {
	private processor: Processor;

	private model: PreTrainedModel;

	private tokenizer: PreTrainedTokenizer;

	async init(modelName: string) {
		// Load the model, tokenizer and processor
		this.model = await AutoModel.from_pretrained(modelName);
		this.tokenizer = await AutoTokenizer.from_pretrained(modelName);
		this.processor = await AutoProcessor.from_pretrained(modelName);
	}

	async getImageEmbedding(image: File): Promise<number[]> {
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
	// Embeds an image and returns the embedding
	async embed(
		imagePath: string,
		metadata?: RecordMetadata,
	): Promise<PineconeRecord> {
		try {
			// Load the image
			const image = await RawImage.read(imagePath);
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

			await HominemVectorStore.imageVectorStore.addVectors(
				[embeddings] as number[][],
				embeddings,
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
