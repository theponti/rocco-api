import type { FastifyReply, FastifyRequest } from "fastify";
import type { Mock } from "vitest";
import { vi } from "vitest";

import * as auth from "@app/plugins/auth/utils";

export function mockAuthSession() {
	(auth.verifySession as Mock).mockImplementation(async (req) => {
		req.session.set("data", { userId: "testUserId" });
		return;
	});
}

export function getMockRequest(session: any = {}): FastifyRequest {
	return {
		session,
	} as any as FastifyRequest;
}

export function getMockReply(): FastifyReply {
	return {
		code: vi.fn(),
		send: vi.fn(),
		log: {
			error: vi.fn(),
		},
	} as any as FastifyReply;
}
