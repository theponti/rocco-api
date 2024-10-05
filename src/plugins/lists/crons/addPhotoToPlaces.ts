/**
 * This cron job fetches the first photo of a place from the Google Places API
 * and updates the place with the photo URL.
 */

import { db } from '@app/db'
import type { FastifyInstance } from 'fastify'
import { getPlacePhotos, isValidImageUrl } from '../../google/places'
import { Place } from '@app/db/drizzle/schema'
import { eq } from 'drizzle-orm'

async function addPhotoToPlaces(server: FastifyInstance) {
  let count = 0
  const places = await db.select().from(Place)

  if (!places.length) {
    return
  }

  for (const place of places) {
    // Skip places that already have a valid image
    if (place.imageUrl && isValidImageUrl(place.imageUrl)) {
      console.log('Place already has a valid image', { id: place.id })
      continue
    }

    // Skip places that don't have a googleMapsId
    if (!place.googleMapsId) {
      continue
    }

    const media = await getPlacePhotos({
      googleMapsId: place.googleMapsId,
      limit: 1,
    })

    if (!media) {
      console.error('Error fetching photo for place', { id: place.id })
      continue
    }

    const { imageUrl } = media[0]

    if (!imageUrl) {
      console.error('No photoUri found for place', { id: place.id })
      continue
    }

    if (!isValidImageUrl(imageUrl)) {
      console.error('Invalid photoUri found for place', {
        id: place.id,
        imageUrl,
      })
      continue
    }

    if (isValidImageUrl(imageUrl)) {
      await db.update(Place).set({ imageUrl }).where(eq(Place.id, place.id))
      count += 1
    }
  }

  // Send email to admin
  server.sendEmail(
    process.env.SENDGRID_SENDER_EMAIL as string,
    'All places have been updated with photos',
    'All places have been updated with photos',
    `<p>${count} places have been updated with valid image URLs</p>`
  )
}

export default addPhotoToPlaces
