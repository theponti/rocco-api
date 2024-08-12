import type { FastifyPluginAsync } from "fastify";

import { APP_USER_ID, EVENTS, track } from "../../../analytics";
import { createToken } from "./createToken";
import logger from "@app/logger";

interface LoginInput {
	email: string;
}

const loginPlugin: FastifyPluginAsync = async (server) => {
	server.post(
		"/login",
		{
			schema: {
				body: {
					email: { type: "string" },
				},
			},
		},
		async (request, reply) => {
			const { email } = request.body as LoginInput;

			try {
				await createToken({ email, server });
				return reply.code(200).send();
			} catch (error) {
				const message = (error as Error)?.message;
				logger.error(message);
				track(APP_USER_ID, EVENTS.USER_EVENTS.REGISTER_FAILURE, { message });
				return reply.code(500).send({ message: "Could not create account" });
			}
		},
	);
};

export default loginPlugin;
