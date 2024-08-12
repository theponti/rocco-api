import type { FastifyReply, FastifyRequest } from "fastify";
import { searchPlaces } from "../google/places";

export async function GET(request: FastifyRequest, reply: FastifyReply) {
	const { query, latitude, longitude, radius } = request.query as {
		query: string;
		latitude: number;
		longitude: number;
		radius: number;
	};

	try {
		const places = await searchPlaces({
			query,
			center: { latitude, longitude },
			radius,
			fields: [
				"places.id",
				"places.shortFormattedAddress",
				"places.displayName",
				"places.location",
			],
		});

		const formattedPlaces = places.map((place) => ({
			address: place.shortFormattedAddress,
			latitude: place.location?.latitude,
			longitude: place.location?.longitude,
			name: place.displayName?.text,
			googleMapsId: place.id,
		}));

		return reply.code(200).send(formattedPlaces);
	} catch (err) {
		request.log.error("Could not fetch places", err);
		return reply.code(500).send();
	}
}
