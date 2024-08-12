import * as FastifyJwt from "@fastify/jwt";
import type { MultipartFile } from "@fastify/multipart";
import type { Session } from "@fastify/secure-session";
import type { MailService } from "@sendgrid/mail";

interface SessionToken {
	userId: string;
	isAdmin: boolean;
	roles: string[];
}

declare module "fastify" {
	interface FastifyInstance extends FastifyServerFactory {
		getUserId: (FastifyRequest) => string;
		sendgrid: MailService;
		sendEmail: (
			email: string,
			subject: string,
			text: string,
			html: string,
		) => Promise<void>;
		sendEmailToken: (email: string, emailToken: string) => void;
		jwt: {
			sign: (payload: SessionToken) => Promise<Token>;
			verify: (token: string) => Promise<SessionToken>;
		};
	}

	interface FastifyRequest
		extends FastifyRequest<RouteGenericInterface, Server, IncomingMessage> {
		auth: {
			userId: string;
			isAdmin: boolean;
		};
		session: Session;
		file: MultipartFile;
	}
}
