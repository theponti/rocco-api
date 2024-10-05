import { db, takeUniqueOrThrow } from '@app/db'
import { ListInvite, UserLists } from '@app/db/drizzle/schema'
import { and, eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'

import { verifySession } from '../../auth/utils'

const acceptListInviteRoute = async (server: FastifyInstance) => {
  server.post(
    '/invites/:listId/accept',
    {
      preValidation: verifySession,
      schema: {
        params: {
          type: 'object',
          properties: {
            listId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              list: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { listId } = request.params as { listId: string }
      const { email, userId } = request.session.get('data')
      const listInviteArgs = {
        listId_invitedUserEmail: { listId, invitedUserEmail: email },
      }
      const invite = await db
        .select()
        .from(ListInvite)
        .where(and(eq(ListInvite.listId, listId), eq(ListInvite.invitedUserEmail, email)))
        .then(takeUniqueOrThrow)

      if (!invite) {
        return reply.status(404).send()
      }

      if (invite.invitedUserEmail !== email) {
        return reply.status(403).send()
      }

      const list = await db.transaction(async (t) => {
        await t
          .update(ListInvite)
          .set({
            accepted: true,
          })
          .where(and(eq(ListInvite.listId, listId), eq(ListInvite.invitedUserEmail, email)))

        await t.insert(UserLists).values({
          userId,
          listId: invite.listId,
        })
      })

      return { list }
    }
  )
}

export default acceptListInviteRoute
