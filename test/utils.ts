import type { FastifyReply, FastifyRequest } from 'fastify'
import type { Mock } from 'vitest'
import { vi } from 'vitest'

import * as auth from '@app/plugins/auth/utils'
import type { Session, SessionData } from '@fastify/secure-session'

export function mockAuthSession() {
  ;(auth.verifySession as Mock).mockImplementation(async (req) => {
    ;(req.session as Session<SessionData>).set('data', {
      userId: 'testUserId',
      name: 'testName',
      isAdmin: false,
      roles: [],
    })
    return
  })
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function getMockRequest(session: any = {}): FastifyRequest {
  return {
    session,
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  } as any as FastifyRequest
}

export function getMockReply(): FastifyReply {
  return {
    code: vi.fn(),
    send: vi.fn(),
    log: {
      error: vi.fn(),
    },
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  } as any as FastifyReply
}
