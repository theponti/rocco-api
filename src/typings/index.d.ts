import type { User } from '@app/db/drizzle/schema'
import * as FastifyJwt from '@fastify/jwt'
import type { MultipartFile } from '@fastify/multipart'
import type { Session } from '@fastify/secure-session'
import type { MailService } from '@sendgrid/mail'

declare module '@fastify/secure-session' {
  interface SessionData {
    name: string | null
    userId: string
    isAdmin: boolean
    roles: string[]
  }
}

declare module 'fastify' {
  interface FastifyInstance extends FastifyServerFactory {
    getUserId: (FastifyRequest) => string
    sendgrid: MailService
    sendEmail: (email: string, subject: string, text: string, html: string) => Promise<void>
    sendEmailToken: (email: string, emailToken: string) => void
    jwt: {
      sign: (payload: SessionToken) => Promise<Token>
      verify: (token: string) => Promise<SessionToken>
    }
  }

  interface FastifyRequest {
    auth: {
      userId: string
      isAdmin: boolean
    }
    file: MultipartFile
  }
}
