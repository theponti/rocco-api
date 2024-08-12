import { db, takeUniqueOrThrow } from "@app/db";
import type { FastifyInstance } from "fastify";

import { verifySession } from "../../auth/utils";
import { List } from "@app/db/drizzle/schema";
import { eq } from "drizzle-orm";

const putListRoute = (server: FastifyInstance) => {
	server.put(
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
				body: {
					type: "object",
					properties: {
						name: { type: "string" },
					},
					required: ["name"],
				},
				response: {
					200: {
						type: "object",
						properties: {
							list: {
								type: "object",
								properties: {
									id: { type: "string" },
									name: { type: "string" },
									createdAt: { type: "string" },
									updatedAt: { type: "string" },
								},
							},
						},
					},
				},
			},
		},
		async (request) => {
			const { id, name } = request.body as { id: string; name: string };
			const list = await db
				.update(List)
				.set({
					name,
				})
				.where(eq(List.id, id))
				.returning();
			return { list };
		},
	);
};

export default putListRoute;
