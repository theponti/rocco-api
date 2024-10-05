import { db } from '@app/db'
import { Account } from '@app/db/drizzle/schema'
import { eq } from 'drizzle-orm'

export function getUserAccount(userId: string) {
  return db.select().from(Account).where(eq(Account.userId, userId)).limit(1)
}
