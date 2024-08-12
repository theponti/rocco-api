import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

const rateLimitPlugin: FastifyPluginAsync = async (server) => {
	server.register(require("@fastify/rate-limit"));
};

export default fp(rateLimitPlugin);
