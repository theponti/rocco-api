import { desc, eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { db } from '../../db'
import { List, User, UserLists } from '../../db/drizzle/schema'
import type { RequestWithSession } from '../../typings'
import { verifySession } from '../auth/utils'

async function getUserLists(userId: string) {
  return db
    .select()
    .from(UserLists)
    .where(eq(UserLists.userId, userId))
    .leftJoin(List, eq(UserLists.listId, List.id))
    .leftJoin(User, eq(UserLists.userId, User.id))
    .orderBy(desc(List.createdAt))
}

const getListsRoute = (server: FastifyInstance) => {
  server.get(
    '/lists',
    {
      preValidation: verifySession,
    },
    async (request: RequestWithSession) => {
      const { userId } = request.session.get('data')
      const lists = await db
        .select()
        .from(List)
        .where(eq(List.userId, userId))
        .leftJoin(User, eq(List.userId, User.id))
        .orderBy(desc(List.createdAt))
      const userLists = await getUserLists(userId)

      return [
        ...lists,
        ...userLists.map(({ List, User }) => ({
          ...List,
          createdBy: {
            email: User?.email,
          },
        })),
      ]
    }
  )
}

export default getListsRoute
