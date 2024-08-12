import { db, takeUniqueOrThrow } from "@app/db";
import type { FastifyInstance } from "fastify";

import { verifySession } from "../auth/utils";
import { List, ListInvite, User } from "@app/db/drizzle/schema";
import { eq } from "drizzle-orm";

const getListInvitesRoute = (server: FastifyInstance) => {
	server.get(
		"/lists/:id/invites",
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
				response: {
					200: {
						type: "array",
						items: {
							type: "object",
							properties: {
								accepted: { type: "boolean" },
								listId: { type: "string" },
								invitedUserEmail: { type: "string" },
								invitedUserId: { type: "string" },
								// The user who created the invite
								user: {
									type: "object",
									properties: {
										id: { type: "string" },
										email: { type: "string" },
										name: { type: "string" },
									},
								},
								createdAt: { type: "string" },
								updatedAt: { type: "string" },
							},
						},
					},
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params as { id: string };
			const invites = await db
				.select()
				.from(ListInvite)
				.where(eq(ListInvite.listId, id));

			return reply.status(200).send(invites);
		},
	);

	// Create a new list invite route
	server.post(
		"/lists/:id/invites",
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
						email: { type: "string" },
					},
					required: ["email"],
				},
				response: {
					200: {
						type: "object",
						properties: {
							accepted: { type: "boolean" },
							listId: { type: "string" },
							invitedUserEmail: { type: "string" },
							invitedUserId: { type: "string" },
							// The user who created the invite
							user: {
								type: "object",
								properties: {
									id: { type: "string" },
									email: { type: "string" },
									name: { type: "string" },
								},
							},
							createdAt: { type: "string" },
							updatedAt: { type: "string" },
						},
					},
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params as { id: string };
			const { email } = request.body as { email: string };
			const { userId } = request.session.get("data");
			const list = await db
				.select()
				.from(List)
				.where(eq(List.id, id))
				.then(takeUniqueOrThrow);

			if (!list) {
				return reply.status(404).send({
					message: "List not found",
				});
			}

			let invite = null;
			try {
				invite = await db.insert(ListInvite).values({
					listId: id,
					invitedUserEmail: email,
					invitedUserId: null,
					accepted: false,
					userId,
				});
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			} catch (error: any) {
				switch (error.code) {
					case "P2002":
						return reply.status(409).send({
							message: "Invite already exists",
						});
					default:
						break;
				}

				return reply.status(500).send({
					message: "Something went wrong",
				});
			}

			const userEmail = await db
				.select({
					email: User.email,
				})
				.from(User)
				.where(eq(User.id, userId))
				.then(takeUniqueOrThrow);

			// Send email to the invited user using sendgrid
			await server.sendEmail(
				email,
				"You have been invited to a list",
				"You have been invited to a list",
				`
					<div class="email" style="font-family: sans-serif;">
						<h1>You have been invited to a list</h1>
						<p class="font-size: 16px">You have been invited to the ${list.name} list</p>
						<p class="font-size: 14px; color: grey">This list is by ${userEmail?.email}</p>
						<p>Click <a href="${process.env.APP_URL}/invites/incoming">here</a> to accept the invite</p>
					</div>
				`,
			);

			return reply.status(200).send(invite);
		},
	);
};

export default getListInvitesRoute;
