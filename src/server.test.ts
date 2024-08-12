import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { createServer } from "./server";

describe("server", () => {
	let testServer: FastifyInstance;

	beforeAll(async () => {
		testServer = await createServer({ logger: false });
	});

	afterAll(async () => {
		await testServer.close();
	});

	test("status endpoint returns 200", async () => {
		const response = await testServer.inject({
			method: "GET",
			url: "/status",
		});
		expect(response.statusCode).toBe(200);
		expect(JSON.parse(response.body)).toEqual({ up: true });
	});
});
