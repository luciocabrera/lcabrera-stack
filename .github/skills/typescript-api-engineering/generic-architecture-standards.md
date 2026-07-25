# TypeScript API Architecture Standard

## Core Philosophy

- Divide the application into **clear architectural layers**.
- **Each layer has one responsibility.**
- A layer may only communicate with the layer immediately below it.

```
HTTP Request
        │
        ▼
Router
        │
        ▼
Middleware
        │
        ▼
Validation
        │
        ▼
Controller
        │
        ▼
Use Case (Application Layer)
        │
        ▼
Domain
        │
        ▼
Repository Interface
        │
        ▼
PostgreSQL Repository
        │
        ▼
Database
```

---

## Why This Architecture

A simple Controller → Service → Repository pattern often produces monolithic "God Services" that mix validation, authorization, business rules, DB access, transactions, notifications, caching, event publishing, and third‑party integrations. This standard separates responsibilities into dedicated layers to keep code understandable, testable, and maintainable.

---

## Layer Responsibilities

### Router

- **Responsibility**: Define routes, apply middleware, connect routes to controllers.
- **Constraint**: Contains **no business logic**.

### Middleware

- **Responsibility**: Cross‑cutting concerns (authentication, rate limiting, logging, request IDs, CORS, compression, security headers, request timing).
- **Constraint**: Must never contain business rules.

### Validation

- **Responsibility**: Validate all external inputs before controllers (body, query, route params, headers, cookies).
- **Recommended libraries**: **Zod**, **Valibot**, **TypeBox**.
- **Constraint**: TypeScript types alone are **not** validation. Controllers receive already validated data.

### Controller

- **Responsibility**: Receive validated request, call the appropriate use case, return HTTP response.
- **Constraint**: Controllers must remain thin and **must never** contain SQL, business logic, authorization rules, or complex validation.

### Application Layer (Use Cases)

- **Responsibility**: Each business action is its own use case (e.g., `CreateUser`, `UpdateUser`, `ApproveInvoice`). Coordinates business rules, domain entities, transactions, repository calls, and domain events.
- **Read-Model Exception**: For pure data‑fetching queries, use cases may bypass rich domain aggregates and return lightweight DTOs from specialized **Read Repositories** to optimize performance.
- **Constraint**: Use cases must never know about HTTP.

### Domain Layer

- **Responsibility**: Business model and invariants (entities, value objects, domain rules). Domain objects enforce business rules (e.g., "A user cannot approve their own invoice").

### Repository Interfaces

- **Responsibility**: Abstract persistence. The application layer depends on interfaces, not implementations.

### PostgreSQL Repository Implementation

- **Responsibility**: Persistence using `pg`. Execute SQL, map rows to domain objects, handle transactions when necessary.
- **Constraint**: Repositories must **never** contain business logic. Never expose SQL outside repositories.

---

## Database Access Standard

- Use the official PostgreSQL driver: `pg`.
- Never expose SQL outside repository implementations.
- Use parameterized queries to avoid SQL injection.

**Good**

```sql
SELECT *
FROM users
WHERE id = $1
```

**Never**

```sql
SELECT *
FROM users
WHERE id = '${id}'
```

---

## Transactions

- **Responsibility**: Transactions belong in the application layer when multiple repositories participate in a single business operation.
- **Standardized API**: Use a `withTransaction(pool, fn)` higher‑order function to encapsulate `BEGIN` / `COMMIT` / `ROLLBACK`.
- **Repository contract**: Repository interfaces and implementations must accept an optional transaction client (e.g., `tx?: PoolClient`) so they can participate in coordinated use‑case transactions.
- **Rollback**: Rollback if any step fails.

**Transaction helper (recommended)**

```ts
// infrastructure/database/transaction.ts
import type { Pool, PoolClient } from 'pg';
import { pool } from './pool';

export async function withTransaction<T>(
  fn: (tx: PoolClient) => Promise<T>,
  providedPool: Pool = pool,
): Promise<T> {
  const client = await providedPool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {}
    throw err;
  } finally {
    client.release();
  }
}
```

---

## Authentication & Authorization

- **Authentication**: Perform in middleware. Controllers assume authentication has occurred. Supported mechanisms: JWT, OAuth, API Keys, Session Authentication.
- **Authorization**: Use dedicated policy classes or perform checks inside use cases for resource‑level, business‑rule authorization. Use middleware for coarse access gating (e.g., role checks). Never perform permission checks inside repositories.

---

## Error Handling

- **Centralized error handler** at middleware layer to convert application/domain errors into HTTP responses.
- **Error Translation Layer**: Repositories **must** map `pg` driver/database errors to domain/application exceptions (e.g., Postgres `23505` → `UniqueConstraintViolationError`) before propagating.
- **Do not expose** SQL errors, database schema details, stack traces, or internal exceptions to clients.

**Example DB error mapper**

```ts
// shared/errors/db-error-mapper.ts
import type { DatabaseError } from 'pg';
import {
  UniqueConstraintViolationError,
  PersistenceError,
} from './application-errors';

export function mapDbError(err: unknown): Error {
  const e = err as DatabaseError;
  if (e?.code === '23505')
    return new UniqueConstraintViolationError(
      e.detail || 'Unique constraint violated',
    );
  if (e?.code === '23503') return new PersistenceError('Foreign key violation');
  return new PersistenceError(e?.message ?? 'Database error');
}
```

---

## Logging

- Emit structured JSON logs per request including: **request ID**, **correlation ID**, **user ID**, **route**, **HTTP method**, **duration**, **status code**, and **errors**.

---

## Metrics

- Collect: request count, error count, latency, DB query duration, slow queries.
- Prefer OpenTelemetry-compatible instrumentation and export to OTLP/collector; expose Prometheus metrics endpoint for scraping.

---

## Folder Structure (feature-based)

Organize code by feature (modules) rather than by technical layer.

```
src/
├── app.ts
├── modules/
│   └── users/
│       ├── routes.ts
│       ├── controller.ts
│       ├── dto/
│       │   └── create-user.dto.ts
│       ├── use-cases/
│       │   └── create-user.ts
│       ├── domain/
│       │   └── user.ts
│       ├── repository/
│       │   ├── user-repository.ts
│       │   └── postgres-user-repository.ts
│       └── mapper/
│           └── user-mapper.ts
├── infrastructure/
│   ├── database/
│   │   ├── pool.ts
│   │   ├── transaction.ts
│   │   └── migrations/
│   ├── cache/
│   ├── email/
│   ├── messaging/
│   └── telemetry/
└── shared/
    ├── auth/
    ├── middleware/
    ├── validation/
    ├── errors/
    ├── logger/
    └── utils/
```

---

## Dependency Rule

Dependencies always point inward:

```
Controller
  ↓
Use Case
  ↓
Domain
  ↓
Repository Interface
  ↓
PostgreSQL Repository
```

Never reverse the dependency direction. Repositories must never depend on controllers; controllers must never know SQL.

---

## AI Agent Development Rules

- One use case per business action.
- Controllers must remain thin.
- Business logic belongs in use cases and domain models.
- Repositories only perform persistence.
- SQL must remain inside repository implementations.
- All DB access uses parameterized queries via `pg`.
- Validate all external input before controllers.
- Use explicit transactions for multi-step operations.
- Keep dependencies flowing inward.
- Organize code by feature, not by technical layer.
- Prefer composition over inheritance.
- Never bypass repository interfaces.
- Never embed SQL in controllers or use cases.
- Keep domain logic independent of PostgreSQL.

---

## Production Checklist

Before merging any API feature, verify:

- [ ] Routes are RESTful.
- [ ] Validation exists for all inputs.
- [ ] Controllers contain no business logic.
- [ ] Each business action has its own use case.
- [ ] Domain rules are enforced in the domain layer.
- [ ] Repositories contain only persistence logic.
- [ ] SQL uses parameterized queries.
- [ ] Transactions are used where appropriate.
- [ ] Errors are standardized and mapped.
- [ ] Logging is structured.
- [ ] Metrics are emitted.
- [ ] Tests cover the use case.
- [ ] Documentation is updated.
- [ ] No layer violates the dependency rules.

---

## Practical Patterns and Examples

### Repository signature (interface)

```ts
// modules/users/repository/user-repository.ts
import type { PoolClient } from 'pg';
import { User } from '../domain/user';

export interface UserRepository {
  create(user: User, tx?: PoolClient): Promise<User>;
  findById(id: string, tx?: PoolClient): Promise<User | null>;
  findByEmail(email: string, tx?: PoolClient): Promise<User | null>;
  update(user: User, tx?: PoolClient): Promise<User>;
  delete(id: string, tx?: PoolClient): Promise<void>;
}
```

### Postgres repository pattern (executor accepts Pool | PoolClient)

```ts
// modules/users/repository/postgres-user-repository.ts
import type { Pool, PoolClient } from 'pg';
import { pool as defaultPool } from '../../../infrastructure/database/pool';
import { User } from '../domain/user';
import { mapRowToUser } from '../mapper/user-mapper';
import { mapDbError } from '../../../shared/errors/db-error-mapper';
import { UserRepository } from './user-repository';

export class PostgresUserRepository implements UserRepository {
  constructor(private readonly db: Pool | PoolClient = defaultPool) {}

  private async executeQuery(
    executor: Pool | PoolClient,
    sql: string,
    params: unknown[],
  ) {
    const res = await executor.query(sql, params);
    return res;
  }

  async create(user: User, tx?: PoolClient): Promise<User> {
    const executor = tx ?? this.db;
    try {
      const res = await this.executeQuery(
        executor,
        `INSERT INTO users (id, email, name) VALUES ($1, $2, $3) RETURNING *`,
        [user.id, user.email, user.name],
      );
      return mapRowToUser(res.rows[0]);
    } catch (err) {
      throw mapDbError(err);
    }
  }

  async findByEmail(email: string, tx?: PoolClient): Promise<User | null> {
    const executor = tx ?? this.db;
    try {
      const res = await this.executeQuery(
        executor,
        `SELECT * FROM users WHERE email = $1`,
        [email],
      );
      return res.rowCount ? mapRowToUser(res.rows[0]) : null;
    } catch (err) {
      throw mapDbError(err);
    }
  }
}
```

### Use case example (with transaction and OpenTelemetry span)

```ts
// modules/users/use-cases/create-user.ts
import { trace } from '@opentelemetry/api';
import { withTransaction } from '../../../infrastructure/database/transaction';
import { PostgresUserRepository } from '../repository/postgres-user-repository';
import { User } from '../domain/user';
import { ConflictError } from '../../../shared/errors/application-errors';

const tracer = trace.getTracer('app.usecase');

export async function createUserUseCase(input: {
  email: string;
  name: string;
}) {
  return tracer.startActiveSpan('CreateUser', async (span) => {
    span.setAttribute('use_case', 'CreateUser');
    try {
      return await withTransaction(async (tx) => {
        const repo = new PostgresUserRepository();
        const existing = await repo.findByEmail(input.email, tx);
        if (existing) throw new ConflictError('Email already in use');

        const user = User.create({ email: input.email, name: input.name });
        return await repo.create(user, tx);
      });
    } catch (err) {
      span.recordException(err as Error);
      throw err;
    } finally {
      span.end();
    }
  });
}
```

---

## Observability (OpenTelemetry + Metrics)

- Instrument **use-case** boundaries as parent spans.
- Instrument **repository** DB calls as child spans. Add attributes: `request.id`, `user.id`, `use_case`, `db.system`, `db.statement` (avoid secrets).
- Export traces/metrics to OTLP collector; expose Prometheus metrics endpoint for scraping.
- Keep sampling configurable and avoid recording PII.

**Minimal OTEL setup (example)**

```ts
// infrastructure/telemetry/otel.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';

const traceExporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_TRACES,
});
const metricExporter = new OTLPMetricExporter({
  url: process.env.OTEL_EXPORTER_OTLP_METRICS,
});

export const sdk = new NodeSDK({
  traceExporter,
  metricReader: new PeriodicExportingMetricReader({ exporter: metricExporter }),
  instrumentations: [getNodeAutoInstrumentations()],
});

export async function startTelemetry() {
  await sdk.start();
}
export async function shutdownTelemetry() {
  await sdk.shutdown();
}
```

---

## Migrations

- **Tool recommendation**: `node-pg-migrate` or `sqitch`.
- Keep migrations small and incremental. Prefer backward‑compatible changes: add nullable columns, backfill, then set `NOT NULL`.
- Run migrations in CI and as a controlled deploy step. Keep migration files in the repo and code review them.

**Example migration**

```sql
-- migrations/1670000000000-create-users.sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

---

## Testing Strategy

- **Unit tests**: domain and use cases with mocked repositories.
- **Repository integration tests**: run against ephemeral Postgres (Docker) with migrations applied.
- **End-to-end tests**: critical flows against a staging environment.
- Provide fixtures and test data builders.

---

## When to Consider an ORM (Escape Hatch)

- The standard prefers raw SQL via `pg`. If a team chooses an ORM for productivity, require an **ORM adapter** that:
  - Implements repository interfaces exactly.
  - Supports the same transaction semantics (or exposes a compatible transactional client).
  - Passes performance benchmarks for critical queries.
  - Works with the standardized migration tooling.
  - Requires architectural sign-off and a migration plan.

---

## Operational Runbook (deploy checklist)

- Run migrations in a controlled job before switching traffic.
- Warm caches and run smoke tests after deploy.
- Monitor traces and metrics for 15–30 minutes post‑deploy.
- For destructive migrations, use feature flags and phased rollout.
- Keep a rollback plan and tested backups.

---

## Golden Rule

The architecture exists to make the codebase predictable. Every new feature should fit naturally into the existing structure without requiring new architectural patterns. When in doubt, prefer **clarity, consistency, and separation of concerns** over clever abstractions.

---

## Appendix: Quick snippets

### `pool.ts`

```ts
// infrastructure/database/pool.ts
import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // pool options
});
```

### Example DB error mapping (repeated for convenience)

```ts
// shared/errors/db-error-mapper.ts
import type { DatabaseError } from 'pg';
import {
  UniqueConstraintViolationError,
  PersistenceError,
} from './application-errors';

export function mapDbError(err: unknown): Error {
  const e = err as DatabaseError;
  if (e?.code === '23505')
    return new UniqueConstraintViolationError(
      e.detail || 'Unique constraint violated',
    );
  if (e?.code === '23503') return new PersistenceError('Foreign key violation');
  return new PersistenceError(e?.message ?? 'Database error');
}
```

---
