# Package Architecture (`@repo/node-runtime`)

Process-lifecycle primitives for **long-running Node services** — the
concerns a service has because it is a process (termination signals, exit
paths), not because of what it serves.

Consumers today: `apps/scan-orchestrator` (CQMS product) and
`apps/api-server` (car-sales demo).

## Why this package exists

The repo had no home for process-lifecycle code, and each existing candidate
was wrong in its own way:

| Candidate           | Why not                                                                                                                                  |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `@lcabrera/utils`   | Its `ARCHITECTURE.md` commits to "keep utilities pure and side-effect free". Registering signal handlers is a side effect by definition. |
| `api-shared`        | The car-sales demo's shared lib. `scan-orchestrator` is CQMS product code; depending on it would couple product to demo.                 |
| `@lcabrera/server`  | Owns DB/query/crypto/token concerns. A process signal is not data access.                                                                |
| Duplicating per app | What we had: 12 lines of identical `process.on` wiring in two servers, flagged as a fallow clone group.                                  |

Both consumers depend on **this** package, not on each other — the demo and
the product stay decoupled.

## Design constraints

- **Impurity is the point, and it is bounded.** Unlike `@lcabrera/utils`, these
  helpers exist to touch the process. That licence covers process lifecycle
  only: anything computable as a pure function belongs in `@lcabrera/utils`, and
  anything domain-specific belongs to its own package.
- **Entry points call these; libraries do not.** A module imported for
  something else must never register process handlers as a side effect of
  being imported — that's an invisible action at a distance. Call these from
  a service's `server.ts`.
- **One utility per file**, each with a colocated `*.util.test.ts`, matching
  the rest of the repo.
- **Never swallow a failure silently, never let one become the exit path.**
  A shutdown that rejects gets logged; it must not throw out of a signal
  handler, where it would surface as an unhandled rejection and kill the
  process harder than the graceful path it replaced.

## Artifacts

| Artifact                  | Location                              | Description                                                                                          |
| ------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `registerShutdownSignals` | `src/registerShutdownSignals.util.ts` | Runs a caller's `shutdown` on SIGINT/SIGTERM, logging (never rethrowing) a rejection. Public export. |

## Usage

```ts
import { registerShutdownSignals } from '@repo/node-runtime/registerShutdownSignals.util';

const shutdown = async () => {
  console.warn('🛑 Shutting down scan-orchestrator');
  await closePool();
};

registerShutdownSignals({ shutdown });
```

## Testing

Tests spy on `process.on` rather than emitting real signals — emitting would
run vitest's own SIGINT handling, and `removeAllListeners` would delete it.
