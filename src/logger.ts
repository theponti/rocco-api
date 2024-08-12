import pino from "pino";

const logger = pino({
	level: process.env.PINO_LOG_LEVEL || "debug",
	timestamp: pino.stdTimeFunctions.isoTime,
	transport: {
		target: "pino-pretty",
		options: {
			colorize: true,
		},
	},
	redact: {
		paths: ["email"],
	},
});

export default logger;
