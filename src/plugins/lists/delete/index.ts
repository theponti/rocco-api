import { db } from "@app/db";
import type { FastifyInstance } from "fastify";

import { verifySession } from "../../auth/utils";
import { List } from "@app/db/drizzle/schema";
import { eq } from "drizzle-orm";

const deleteListRoute = (server: FastifyInstance) => {
	server.delete(
		"/lists/:id",
		{
			preValidation: verifySession,
			schema: {
				params: {
					type: "object",
					properties: {
						id: { type: "string" },
					},
					required: ["id"],
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params as { id: string };

			await db.delete(List).where(eq(List.id, id));

			return reply.status(204).send();
		},
	);
};

export default deleteListRoute;
