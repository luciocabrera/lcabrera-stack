---
'@lcabrera/node': minor
---

The repo's process-lifecycle helpers are now a published package,
`@lcabrera/node`. It carries the concerns a long-running Node service has
because it is a **process** — termination signals, exit paths — rather than
because of what it serves.

One export today, and that is the whole package:

```ts
import { registerShutdownSignals } from '@lcabrera/node/registerShutdownSignals.util';

registerShutdownSignals({
  shutdown: async () => {
    await server.close();
    await pool.end();
  },
});
```

It wires **both** `SIGINT` and `SIGTERM` — the two a container runtime actually
sends, `SIGTERM` on `docker stop` or an orchestrator eviction and `SIGINT` on
Ctrl-C in a dev shell. A service that handles only one appears to shut down
gracefully in development and gets killed mid-flight in production. A rejected
`shutdown` is logged and never rethrown, because throwing out of a signal
handler surfaces as an unhandled rejection and tears the process down harder
than the graceful path it was meant to provide. Nothing here calls
`process.exit`: when the process dies stays the caller's decision.

Deliberately **not** folded into either neighbouring package. `@lcabrera/server`
depends on `pg`, so folding would drag a Postgres driver into a consumer that
only wanted a shutdown handler; `@lcabrera/utils` guarantees pure,
side-effect-free helpers, and registering process handlers is the exact category
that was split out of it to keep that guarantee. Small is what the correct
boundary costs.

No dependencies and no peer dependencies. Published as compiled ESM (`.mjs` +
`.d.mts`) with source maps, one output per source module, `"sideEffects": false`
— importing the module registers nothing, only calling the helper does. Node
only: the package's tsconfig ships no DOM lib, so a browser-global reach-in
fails typecheck here rather than reaching a consumer.
