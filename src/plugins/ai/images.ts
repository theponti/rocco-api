import { HominemVectorStore } from '@app/lib/chromadb.js'
import { embedder } from '@app/lib/embeddings'
import { supabaseClient } from '@app/lib/supabase.js'
import { OpenAIEmbeddings } from '@langchain/openai'
import { pipeline } from '@xenova/transformers'
import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import multer from 'multer'


// Save newly uploaded images to the data directory
const upload = multer({ dest: 'data/' }).array('images')


export const imagePlugin: FastifyPluginAsync = async (server) => {
  // Initialize CLIP model
  const clipModel = await pipeline('feature-extraction', 'Xenova/clip-vit-base-patch32')

  server.post('/upload-photo', async (request, reply) => {
    const data = await request.file()
    if (!data) {
      return reply.code(400).send({ error: 'No file uploaded' })
    }

    const buffer = await data.toBuffer()
    const [embedding, uploadResponse] = await Promise.all([
      embedder.embedFromBuffer(buffer),

    supabaseClient.storage
      .from('photos')
      .upload(`${Date.now()}-${data.filename}`, buffer)
    ])

    const { data: uploadData, error: uploadError } = uploadResponse

    if (uploadError) {
      return reply.code(500).send({ error: 'Failed to upload photo' })
    }

    const { data: insertData, error: insertError } = await supabaseClient.from('photos').insert({
      filename: data.filename,
      storage_path: uploadData.path,
    })

    if (insertError) {
      return reply.code(500).send({ error: 'Failed to store photo metadata' })
    }

    return reply.send({
      message: 'Photo uploaded and embedded successfully',
      data: insertData,
    })
  })

  server.get('/ai/images/get', async (req, res) => {
    const params = req.params as { page: string; pageSize: string }

    if (!params.page || !params.pageSize) {
      return res.status(400).send({ error: 'Missing page or pageSize' })
    }

    try {
      const images = supabaseClient.storage.from('photos').list()
      res.status(200).send(images)
    } catch (error) {
      console.log('ERROR: ', error)
      res.status(500).send({ error: 'Error fetching images' })
    }
  })

  server.get('/ai/images/search', async (req, res) => {
    const data = await req.file()

    if (!data) {
      return res.status(400).send({ error: 'No image uploaded' })
    }

    try {
      const buffer = await data.toBuffer()
      const base64Image = buffer.toString('base64')

      // Initialize OpenAI embedding
      const embeddings = new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY,
      })

      // Generate embedding for the uploaded image
      const queryEmbedding = await embeddings.embedQuery(base64Image)

      // Initialize ChromaDB client
      const client = HominemVectorStore.chromaClient
      const collection = await client.getOrCreateCollection({ name: 'image_collection' })

      // Perform similarity search
      const results = await collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: 6,
      })

      res.status(200).send(results.metadatas)
    } catch (error) {
      console.error('Error in image search:', error)
      res.status(500).send({ error: 'Error fetching images' })
    }
  })

  server.delete('/ai/images/delete', async (req, res) => {
    const { imagePath } = req.params as { imagePath: string } 

    try {
      await supabaseClient.from('photos').delete().eq('filename', imagePath)
      res.status(200).send({ message: 'Image deleted' })
    } catch (error) {
      res.status(500).send({ error: 'Error deleting image' })
    }
  })
}

export default fp(imagePlugin)
