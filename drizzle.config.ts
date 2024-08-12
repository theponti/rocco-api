// Load environment variables
import dotenv from "dotenv";
dotenv.config();

const DATABASE_URL = process.env.DRIZZLE_DATABASE_URL;

if (!DATABASE_URL) {
	throw new Error("DATABASE_URL is not set");
}

import { defineConfig } from "drizzle-kit";

export default defineConfig({
	dbCredentials: {
		url: DATABASE_URL,
	},
	dialect: "postgresql",
	schema: "./src/db/drizzle/schema.ts",
	out: "./src/db/drizzle",
});
