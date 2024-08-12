import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

import { db } from "@app/db";
import { verifySession } from "./auth/utils";
import { User } from "@app/db/drizzle/schema";
import { eq } from "drizzle-orm";

const usersPlugin: FastifyPluginAsync = async (server: FastifyInstance) => {
	server.get(
		"/me",
		{
			preValidation: verifySession,
		},
		async (request, reply) => {
			const session = request.session.get("data");
			try {
				const foundUser = await db
					.select()
					.from(User)
					.where(eq(User.id, session.userId))
					.limit(1);

				/**
				 * If user does not exist, then we should delete their
				 * session and return a 401.
				 */
				if (!foundUser) {
					request.session.delete();
					return reply.code(401).send();
				}

				return reply.code(200).send(User);
			} catch (err) {
				request.log.info("Could not fetch user", { err });
				return reply.code(500).send();
			}
		},
	);

	server.delete(
		"/me",
		{
			preValidation: verifySession,
		},
		async (request, reply) => {
			const session = request.session.get("data");
			await db.delete(User).where(eq(User.id, session.userId));
			return true;
		},
	);
};

export default fp(usersPlugin);
