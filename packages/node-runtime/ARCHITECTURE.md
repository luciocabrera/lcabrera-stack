# Package Architecture (`@lcabrera/node`)

Process-lifecycle primitives for **long-running Node services** — the
concerns a service has because it is a process (termination signals, exit
paths), not because of what it serves.

Published as **`@lcabrera/node`** from the `packages/node-runtime` workspace
([ADR-069](../../docs/decisions/ADR-069-publish-the-shared-toolchain.md)), so
its consumers are no longer only in-repo ones. `README.md` is the
consumer-facing document; this file is why the package is shaped the way it is.

In-repo consumers: `apps/scan-orchestrator` (CQMS product), which leaves with the
CQMS extraction (#672) and then resolves the same package from the registry. The
car-sales demo servers already left that way under #686 and consume it from npm
today — the first consumers to exercise the package as an outside project would,
which is what publishing it was for.

## Why this package exists

The repo had no home for process-lifecycle code, and each existing candidate
was wrong in its own way:

| Candidate           | Why not                                                                                                                                  |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `@lcabrera/utils`   | Its `ARCHITECTURE.md` commits to "keep utilities pure and side-effect free". Registering signal handlers is a side effect by definition. |
| `api-shared`        | The car-sales demo's shared lib. `scan-orchestrator` is CQMS product code; depending on it would couple product to demo.                 |
| `@lcabrera/server`  | Owns DB/query/crypto/token concerns. A process signal is not data access.                                                                |
| Duplicating per app | What we had: 12 lines of identical `process.on` wiring in two servers, flagged as a fallow clone group.                                  |

Every consumer depends on **this** package, not on each other — the demo and
the product stay decoupled.

Publishing did not change that answer, and two merges that look cheaper were
rejected again on the same grounds
([ADR-069](../../docs/decisions/ADR-069-publish-the-shared-toolchain.md)):
folding into `@lcabrera/server` would drag its `pg` dependency into a consumer
that only wanted a shutdown handler
([ADR-038](../../docs/decisions/ADR-038-public-package-topology-by-runtime.md)),
and folding into `@lcabrera/utils` would put a side effect back inside the
package whose whole contract is that it has none. So the package stays small;
small is what a correct boundary costs here.

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
  the rest of the repo. Each file is its own `exports` subpath, so there is no
  root export and no barrel.
- **Node-only, enforced by the tsconfig.** `createNodeTsConfig` gives this
  package `types: ['node']` and no DOM lib, so a `document`/`window` reach-in
  fails `vp run typecheck` here instead of shipping a package that only works
  inside a bundler. It also carries no `paths` self-alias: a published package
  must resolve its own subpaths through its real `exports` map, not through a
  tsconfig alias no consumer has
  ([ADR-060](../../docs/decisions/ADR-060-source-shipping-package-module-resolution.md)).
- **The surface does not widen without a reason of its own.** This is a public
  package now, and an npm version is permanent — adding a helper "while we are
  here" is a decision with an external cost, not a tidy-up.
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
import { registerShutdownSignals } from '@lcabrera/node/registerShutdownSignals.util';

const shutdown = async () => {
  console.warn('🛑 Shutting down scan-orchestrator');
  await closePool();
};

registerShutdownSignals({ shutdown });
```

## Testing

Tests spy on `process.on` rather than emitting real signals — emitting would
run vitest's own SIGINT handling, and `removeAllListeners` would delete it.

## Publishing

Built with `vp pack` (tsdown) to `dist` as `.mjs` + `.d.mts` with source maps:
a `.ts` file inside `node_modules` is not loadable at all, since Node refuses to
strip types there. `exports` keeps pointing at `src` so nothing in this repo has
to build first, and pnpm substitutes `publishConfig.exports` at pack time — the
split `vp run publish:verify` exists to police. The exported type surface is
snapshotted in `reports/api-surface/node.txt` and ratcheted by
`vp run api-surface:verify`.

No suppression file is ever committed here (`.gitignore` covers
`eslint-suppressions.json`), which is what puts this package in the
never-baseline tier AGENTS.md §4 describes.
