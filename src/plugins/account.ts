import { db } from "@app/db";
import { account } from "@app/db/drizzle/schema";
import { eq } from "drizzle-orm";

export function getUserAccount(userId: string) {
	return db.select().from(account).where(eq(account.userId, userId)).limit(1);
}
