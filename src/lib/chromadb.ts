import { Chroma } from "@langchain/community/vectorstores/chroma";
import { OpenAIEmbeddings } from "@langchain/openai";
import { ChromaClient } from "chromadb";

export namespace HominemVectorStore {
	export const chromaClient = new ChromaClient();

	export const embeddings = new OpenAIEmbeddings({
		model: "text-embedding-3-small",
	});

	export const imageVectorStore = new Chroma(embeddings, {
		collectionName: "images",
		url: process.env.CHROMA_URL,
		// Optional: Used to specify the distance method of the embedding space.
		// [Docs](https://docs.trychroma.com/usage-guide#changing-the-distance-function)
		collectionMetadata: {
			"hnsw:space": "cosine",
		},
	});

	export const documentVectorStore = new Chroma(embeddings, {
		collectionName: "documents",
		url: process.env.CHROMA_URL,
		// Optional: Used to specify the distance method of the embedding space.
		// [Docs](https://docs.trychroma.com/usage-guide#changing-the-distance-function)
		collectionMetadata: {
			"hnsw:space": "cosine",
		},
	});

	export type VectorEmbeddings = OpenAIEmbeddings;
}
