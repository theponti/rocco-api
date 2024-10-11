import { and, eq, inArray } from 'drizzle-orm'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { EVENTS, track } from '../../analytics'
import { db, takeUniqueOrThrow } from '../../db'
import { Item, List, Place } from '../../db/drizzle/schema'
import type { RequestWithSession } from '../../typings'
import { verifySession } from '../auth/utils'
import {
  getPlaceDetails,
  getPlacePhotos,
  type FormattedPlace,
  type PhotoMedia,
} from '../google/places'
import * as search from './search'

const types = {
  location: {
    latitude: { type: 'number' },
    longitude: { type: 'number' },
  },
}

type Location = {
  latitude: number
  longitude: number
}

const CreatePlaceProperties = {
  ...types.location,
  name: { type: 'string' },
  address: { type: 'string' },
  googleMapsId: { type: 'string' },
  websiteUri: { type: 'string' },
  imageUrl: { type: 'string' },
  types: { type: 'array', items: { type: 'string' } },
}

const CreatePlaceRequired = Object.keys(CreatePlaceProperties)

const CreatePlaceResponseProperties = {
  ...CreatePlaceProperties,
  id: { type: 'string' },
  description: { type: 'string' },
  createdAt: { type: 'string' },
  updatedAt: { type: 'string' },
}
const CreatePlaceResponseRequired = Object.keys(CreatePlaceResponseProperties)

const PlacesPlugin: FastifyPluginAsync = async (server: FastifyInstance) => {
  server.post(
    '/lists/place',
    {
      preValidation: verifySession,
      schema: {
        body: {
          type: 'object',
          properties: {
            listIds: {
              type: 'array',
              items: { type: 'string' },
            },
            place: {
              type: 'object',
              properties: CreatePlaceProperties,
              required: CreatePlaceRequired,
            },
          },
          required: ['listIds', 'place'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              lists: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    createdAt: { type: 'string' },
                    updatedAt: { type: 'string' },
                  },
                },
              },
              place: {
                type: 'object',
                properties: CreatePlaceResponseProperties,
                required: CreatePlaceResponseRequired,
              },
            },
          },
        },
      },
    },
    async (request: RequestWithSession) => {
      const { userId } = request.session.get('data')
      const { listIds, place } = request.body as PlacePostBody
      const filteredListTypes = place.types.filter((type) => {
        return !/point_of_interest|establishment|political/.test(type)
      })

      const createdPlace = await db
        .insert(Place)
        .values({
          name: place.name,
          description: '',
          address: place.address,
          googleMapsId: place.googleMapsId,
          types: filteredListTypes,
          imageUrl: place.imageUrl,
          latitude: place.latitude,
          longitude: place.longitude,
          websiteUri: place.websiteUri,
          userId,
        })
        .returning()
        .then(takeUniqueOrThrow)

      await db
        .insert(Item)
        .values(
          [...listIds].map((id) => ({
            type: 'PLACE',
            itemId: createdPlace.id,
            listId: id,
          }))
        )
        .onConflictDoNothing()

      const lists = await db.select().from(List).where(inArray(List.id, listIds))

      // 👇 Track place creation
      track(userId, EVENTS.USER_EVENTS.PLACE_ADDED, {
        types: place.types,
      })

      server.log.info('place added to lists', {
        userId,
        placeId: createdPlace.id,
        listIds,
      })

      return { place: createdPlace, lists }
    }
  )

  server.delete(
    '/lists/:listId/place/:placeId',
    {
      preValidation: verifySession,
      schema: {
        params: {
          type: 'object',
          properties: {
            listId: { type: 'string' },
            placeId: { type: 'string' },
          },
          required: ['listId', 'placeId'],
        },
      },
    },
    async (request: RequestWithSession) => {
      const { userId } = request.session.get('data')
      const { listId, placeId } = request.params as {
        listId: string
        placeId: string
      }

      await db
        .delete(Item)
        .where(and(eq(Item.listId, listId), eq(Item.itemId, placeId), eq(Item.type, 'PLACE')))

      server.log.info('place removed from list', {
        userId,
        placeId,
        listId,
      })

      return { success: true }
    }
  )

  server.get(
    '/places/:id',
    {
      preValidation: verifySession,
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              address: { type: 'string' },
              name: { type: 'string' },
              id: { type: 'string' },
              googleMapsId: { type: 'string' },
              imageUrl: { type: 'string' },
              phoneNumber: { type: 'string' },
              photos: { type: 'array', items: { type: 'string' } },
              types: { type: 'array', items: { type: 'string' } },
              websiteUri: { type: 'string' },
              ...types.location,
              lists: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                  },
                },
              },
            },
            required: [
              'address',
              'latitude',
              'longitude',
              'name',
              'googleMapsId',
              'imageUrl',
              'photos',
              'types',
            ],
          },
          404: {
            type: 'null',
          },
        },
      },
    },
    async (request: RequestWithSession, reply) => {
      const { id } = request.params as { id: string }
      let photos: PhotoMedia[] | undefined
      let lists: { id: string; name: string }[] = []
      let place: typeof Place | FormattedPlace | null = null

      try {
        place = await db
          .select()
          .from(Place)
          .where(eq(Place.googleMapsId, id))
          .then(takeUniqueOrThrow)
      } catch (err) {
        request.log.error(err, 'Could not fetch place')
        return reply.code(500).send()
      }

      // If this place has not been saved before, fetch it from Google.
      if (!place) {
        try {
          place = await getPlaceDetails({
            placeId: id,
          })

          // If the place does not exist in Google, return a 404.
          if (!place) {
            server.log.error('GET Place - Could not find place from Google')
            return reply.code(404).send()
          }
        } catch (err) {
          const statusCode = (err as { response: { status: number } })?.response?.status || 500

          server.log.error('GET Place Google Error', err)
          return reply.code(statusCode).send()
        }
      }

      if (!place.googleMapsId) {
        server.log.error('GET Place - Place does not have a Google Maps ID')
        return reply.code(404).send()
      }

      try {
        photos = await getPlacePhotos({
          googleMapsId: place.googleMapsId as string,
          limit: 5,
        })
      } catch (err) {
        server.log.error(err, 'Could not fetch photos from Google')
        return reply.code(500).send()
      }

      if (place?.id) {
        try {
          const items = await db
            .select()
            .from(Item)
            .where(and(eq(Item.itemId, place.id), eq(Item.itemType, 'PLACE')))
            .leftJoin(List, eq(List.id, Item.listId))

          lists = items?.map((item) => item?.List).filter(Boolean)
        } catch (err) {
          server.log.error(err, 'Could not fetch lists')
          return reply.code(500).send()
        }
      }

      return reply.code(200).send({
        ...place,
        imageUrl: photos?.[0]?.imageUrl || '',
        photos: photos?.map((photo) => photo.imageUrl) || [],
        lists: lists ?? [],
      })
    }
  )

  server.get(
    '/places/search',
    {
      preValidation: verifySession,
      schema: {
        querystring: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            radius: { type: 'number' },
            ...types.location,
          },
          required: ['query', 'latitude', 'longitude', 'radius'],
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                address: { type: 'string' },
                name: { type: 'string' },
                googleMapsId: { type: 'string' },
                ...types.location,
              },
              required: ['latitude', 'longitude', 'name', 'googleMapsId'],
            },
          },
          404: {
            type: 'null',
          },
        },
      },
    },
    search.GET
  )
}

export default PlacesPlugin

type PlacePostBody = {
  listIds: string[]
  place: Location & {
    name: string
    address: string
    imageUrl: string
    googleMapsId: string
    types: string[]
    websiteUri: string
  }
}
