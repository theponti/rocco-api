import { db, takeUniqueOrThrow } from "@app/db";
import { User } from "@app/db/drizzle/schema";
import { eq } from "drizzle-orm";
import type {
	FastifyReply,
	FastifyRequest,
	preValidationHookHandler,
} from "fastify";

export function verifyPermissions(permissions: string[]) {
	return (request: FastifyRequest, reply: FastifyReply, done: () => void) => {
		const data = request.session.get("data");

		if (!data) {
			return reply.code(401).send();
		}

		if (!data.roles.includes(permissions[0])) {
			return reply.code(403).send();
		}

		return done();
	};
}

export const verifyIsAdmin: preValidationHookHandler = async (
	request: FastifyRequest,
	reply: FastifyReply,
) => {
	const data = request.session.get("data");

	if (!data) {
		reply.log.error("Could not verifyIsAdmin - no session");
		return reply.code(401).send();
	}

	if (!data.isAdmin) {
		return reply.code(403).send();
	}
};

export const verifySession: preValidationHookHandler = async (
	request: FastifyRequest,
	reply: FastifyReply,
) => {
	const data = request.session.get("data");

	/**
	 * If no session exists, attempt to verify the JWT token.
	 */
	if (!data) {
		let token: { userId: string } | undefined;

		try {
			token = await request.jwtVerify<{ userId: string }>();
		} catch (e) {
			reply.log.error("Could not verify session token", e);
			return reply.code(401).send();
		}

		/**
		 * If the token is invalid or doesn't contain a userId,
		 * return 401 unauthorized
		 */
		if (!token || (token && !token.userId)) {
			return reply.code(401).send();
		}

		try {
			const user = await db
				.select()
				.from(User)
				.where(eq(User.id, token.userId))
				.then(takeUniqueOrThrow);

			/**
			 * If the user doesn't exist, return 401 unauthorized
			 */
			if (!user) {
				return reply.code(401).send();
			}

			request.session.set("data", {
				...token,
				email: user.email,
			});
		} catch (e) {
			reply.log.error("Could not verify session", e);
			return reply.code(401).send();
		}
	}

	/**
	 * If the session exists, but the email is missing,
	 */
	if (data?.userId && !data.email) {
		const user = await db
			.select()
			.from(User)
			.where(eq(User.id, data.userId))
			.then(takeUniqueOrThrow);
		request.session.set("data", {
			...data,
			email: user?.email,
		});
	}
};
