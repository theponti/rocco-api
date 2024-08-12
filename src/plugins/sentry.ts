import * as Sentry from "@sentry/node";
import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

const { SENTRY_DSN, SENTRY_DEBUG, NODE_ENV } = process.env as Record<
	string,
	string
>;

const shutdownPlugin: FastifyPluginAsync = fp(async (server) => {
	Sentry.init({
		dsn: SENTRY_DSN,
		environment: NODE_ENV,
		enabled: !!SENTRY_DSN,
		integrations: [new Sentry.Integrations.Http({ tracing: true })],
		debug: !!SENTRY_DEBUG,
		tracesSampleRate: 1,
	});

	server.addHook("onError", (request, reply, error, done) => {
		Sentry.withScope((scope) => {
			scope.setTags({
				path: request?.raw.url ?? "Not available",
			});
			scope.setExtras({
				"request ID": request?.id,
			});
			Sentry.captureException(error);
		});

		done();
	});

	server.addHook("onRequest", (req, res, next) => {
		req.log.trace("start sentry request transaction");
		const transaction = Sentry.startTransaction({
			op: req.routerPath,
			name: "HTTP request handler",
		});
		res.raw.on("finish", () => {
			req.log.trace("finish sentry request transaction");
			transaction.finish();
		});
		next();
	});
});

export default shutdownPlugin;
