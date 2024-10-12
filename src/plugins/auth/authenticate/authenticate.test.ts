import { add } from 'date-fns'
import type { FastifyInstance } from 'fastify'
import fastify from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../../../db'
import { List, Token, User } from '../../../db/drizzle/schema'
import { createServer } from '../../../server'
import authenticatePlugin, { TOKEN_FAILURE_REASONS } from './index'

vi.mock('../../../db', async () => {
  const actual = await vi.importActual('../../../db')
  return {
    ...actual,
    db: {
      selectDistinct: vi.fn(),
      transaction: vi.fn(),
    },
  }
})

vi.mock('../../../analytics', () => ({
  APP_USER_ID: 'app_user_id',
  EVENTS: {
    USER_EVENTS: {
      EMAIL_TOKEN_VALIDATED_FAILURE: 'email_token_validated_failure',
      LOGIN_SUCCESS: 'login_success',
    },
  },
  track: vi.fn(),
}))

describe('authenticatePlugin', () => {
  let server: FastifyInstance

  beforeEach(async () => {
    server = await createServer({ logger: false })
    await server.ready()
  })

  it('should authenticate a user with valid token', async () => {
    const mockUser = {
      id: 'user_id',
      email: 'test@example.com',
      isAdmin: false,
    }
    const mockToken = {
      id: 'token_id',
      emailToken: 'valid_token',
      valid: true,
      expiration: add(new Date(), { hours: 1 }).toISOString(),
    }

    vi.mocked(db.selectDistinct).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue(
            Promise.resolve({
              Token: mockToken,
              User: mockUser,
            })
          ),
        }),
      }),
    } as any)

    vi.mocked(db.transaction).mockImplementation(async (callback) => {
      return callback({
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              execute: vi.fn().mockResolvedValue([mockUser]),
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue({}),
          }),
        }),
      } as any)
    })

    const response = await server.inject({
      method: 'POST',
      url: '/authenticate',
      payload: {
        email: 'test@example.com',
        emailToken: 'valid_token',
      },
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.payload)).toHaveProperty('user')
    expect(response.headers).toHaveProperty('authorization')
  })

  it('should return 400 for non-existent token', async () => {
    vi.mocked(db.selectDistinct).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue(Promise.resolve(null)),
        }),
      }),
    } as any)

    const response = await server.inject({
      method: 'POST',
      url: '/authenticate',
      payload: {
        email: 'test@example.com',
        emailToken: 'invalid_token',
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.payload).toBe('Invalid token')
  })

  it('should return 401 for invalid token', async () => {
    vi.mocked(db.selectDistinct).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue(
            Promise.resolve({
              Token: { valid: false },
              User: { email: 'test@example.com' },
            })
          ),
        }),
      }),
    } as any)

    const response = await server.inject({
      method: 'POST',
      url: '/authenticate',
      payload: {
        email: 'test@example.com',
        emailToken: 'invalid_token',
      },
    })

    expect(db.selectDistinct).toHaveBeenCalled()
    expect(response.statusCode).toBe(401)
  })

  it('should return 401 for expired token', async () => {
    vi.mocked(db.selectDistinct).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue(
            Promise.resolve({
              Token: {
                valid: true,
                expiration: add(new Date(), { hours: -1 }).toISOString(),
              },
              User: { email: 'test@example.com' },
            })
          ),
        }),
      }),
    } as any)

    const response = await server.inject({
      method: 'POST',
      url: '/authenticate',
      payload: {
        email: 'test@example.com',
        emailToken: 'expired_token',
      },
    })

    expect(response.statusCode).toBe(401)
    expect(response.payload).toBe('Token expired')
  })

  it('should return 401 for email mismatch', async () => {
    vi.mocked(db.selectDistinct).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue(
            Promise.resolve({
              Token: {
                valid: true,
                expiration: add(new Date(), { hours: 1 }).toISOString(),
              },
              User: { email: 'different@example.com' },
            })
          ),
        }),
      }),
    } as any)

    const response = await server.inject({
      method: 'POST',
      url: '/authenticate',
      payload: {
        email: 'test@example.com',
        emailToken: 'valid_token',
      },
    })

    expect(response.statusCode).toBe(401)
  })
})
