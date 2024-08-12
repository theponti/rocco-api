# Rocco API

This repo uses the following technologies:

- [**Fastify**](https://www.fastify.io/): Fast and low overhead web framework, for Node.js
  - [**@fastify/cors**](https://www.npmjs.com/package/@fastify/cors): CORS support
  - [**@fastify/secure-session**](https://www.npmjs.com/package/@fastify/secure-session): Session management
  - [**@fastify/csrf-protection**](https://www.npmjs.com/package/@fastify/csrf-protection): CSRF protection
  - [**@fastify/helmet**](https://www.npmjs.com/package/@fastify/helmet): Helmet security headers
  - [**@fastify/circuit-breaker**](https://www.npmjs.com/package/@fastify/circuit-breaker): Provide [_circuit breaker_](https://martinfowler.com/bliki/CircuitBreaker.html) architecture
  - [**@fastify/rate-limit**](https://www.npmjs.com/package/@fastify/rate-limit): Rate limiting
- **Data**
  - [*Drizzle*](https://orm.drizzle.team): ORM
  - [*PostgreSQL*](https://www.postgresql.org/): object-relational database
- **Analytics & Observability**
  - [*Segment*](https://segment.com/): Customer data platform
  - [*Sentry*](https://sentry.io/): Application monitoring
- **Other**
  - [*Sendgrid*](https://sendgrid.com/): Email delivery service
