
import multer from "multer";
import type { FastifyPluginAsync } from "fastify";
import { ChromaClient } from 'chromadb';
import { pipeline } from '@xenova/transformers';
import sharp from 'sharp';

import { embedder } from "../../../lib/embeddings.js";
import { HominemVectorStore } from "@app/lib/chromadb.js";
import logger from "@app/logger.js";

function getImagesInRange(
  page: number,
  pageSize: number,
  imagePaths: string[]
): string[] {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return imagePaths.slice(start, end);
}

// Save newly uploaded images to the data directory
const upload = multer({ dest: "data/" }).array("images");



export const HominemAIImagePlugin: FastifyPluginAsync = async (server) => {
  // Initialize CLIP model
  const clipModel = await pipeline('feature-extraction', 'Xenova/clip-vit-base-patch32');
  
  // Initialize ChromaDB client
  const client = new ChromaClient();
  
  server.get("/ai/images/get", async (req, res) => {
    const params = req.params as { page: string; pageSize: string };

    if ((!params.page || !params.pageSize) {
      return res.status(400).send({ error: "Missing page or pageSize" });
    }

    const pageSize = Number.parseInt(params.pageSize, 10) || 10;
    const page = Number.parseInt(params.page, 10) || 1;
    const imagePaths = await listFiles("./data");

    try {
      const images = getImagesInRange(page, pageSize, imagePaths).map(
        (image) => ({
          src: image,
        })
      );
      res.status(200).json(images);
    } catch (error) {
      console.log("ERROR: ", error);
      res.status(500).json({ error: "Error fetching images" });
    }
  });

  
  server.get('/ai/images/search', async (req, res) => {
    const data = await req.file();
    
    if (!data) {
      return res.status(400).send({ error: "No image uploaded" });
    }

    try {
      await embedder.init("Xenova/clip-vit-base-patch32");
      const queryEmbedding = await embedder.embed(imagePath);
      const queryResult = await (
        HominemVectorStore
          .imageVectorStore
          .similaritySearchVectorWithScore(queryEmbedding.values, 6)
      );
      const matchingImages = queryResult.map(match => {
        const { metadata } = match;
        return {
          src: metadata ? metadata.imagePath : '',
          score: match.metadata.score
        };  
      });
      res.status(200).json(matchingImages);
    } catch (error) {
      res.status(500).json({ error: "Error fetching images" });
    }
  });

  server.post('/ai/images/upload', async (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        res.status(500).json({ error: "Error uploading images" });
        return;
      }

      if (!req.files || req.files.length === 0) {
        res.status(400).json({ error: "No files uploaded" });
        return;
      }

      const uploadedImagePaths = (req.files as Express.Multer.File[]).map(
        (file) => file.path
      );

      try {
        await upsertImages(uploadedImagePaths);
        // Return the page number of the first image uploaded (for demo purposes)
        const imagePaths = await listFiles("./data");
        const pageSize = parseInt(req.query.pageSize as string, 10) || 10;
        const pageOfFirstImage =
          Math.floor(imagePaths.indexOf(uploadedImagePaths[0]) / pageSize) +
          1;
        res.status(200).json({ pageOfFirstImage });
      } catch (error) {
        res.status(500).json({ error: "Error uploading images" });
      }
    });
  });
  
  server.delete('/ai/images/delete', async (req, res) => {
    const imagePath = req.query.imagePath as string;

    try {
      await deleteImage(imagePath);
      res.status(200).json({ message: "Image deleted" });
    } catch (error) {
      res.status(500).json({ error: "Error deleting image" });
    }
  });

  server.post('/upload-and-search', async (request, reply) => {
    const data = await request.file();
    if (!data) {
      return reply.code(400).send({ error: 'No file uploaded' });
    }

    try {
      // Process the uploaded image
      const buffer = await data.toBuffer();
      const resizedImage = await sharp(buffer)
        .resize(224, 224, { fit: 'cover' })
        .toBuffer();

      // Generate embedding using CLIP model
      const imageEmbedding = await clipModel(resizedImage, {
        pooling: 'mean',
        normalize: true,
      });

      // Search similar images in ChromaDB
      const searchResults = await collection.query({
        queryEmbeddings: [Array.from(imageEmbedding.data)],
        nResults: 5,
      });

      // Return search results
      return reply.send({
        message: 'Image processed and search completed',
        results: searchResults,
      });
    } catch (error) {
      logger.error(error);
      return reply.code(500).send({ error: 'Failed to process image or search database' });
    }
  });

  // Add a route to add images to the database
  server.post('/add-image', async (request, reply) => {
    const data = await request.file();
    if (!data) {
      return reply.code(400).send({ error: 'No file uploaded' });
    }

    try {
      const buffer = await data.toBuffer();
      const resizedImage = await sharp(buffer)
        .resize(224, 224, { fit: 'cover' })
        .toBuffer();

      const imageEmbedding = await clipModel(resizedImage, {
        pooling: 'mean',
        normalize: true,
      });

      await HominemVectorStore.imageVectorStore.addVectors({
        ids: [data.filename],
        embeddings: [Array.from(imageEmbedding.data)],
        metadatas: [{ filename: data.filename }],
      });

      return reply.send({ message: 'Image added to database successfully' });
    } catch (error) {
      logger.error(error);
      return reply.code(500).send({ error: 'Failed to add image to database' });
    }
  });
};
