# `@lcabrera/node`

Process-lifecycle primitives for **long-running Node services** — the concerns a
service has because it is a process (termination signals, exit paths), not
because of what it serves.

Node-only by construction: its tsconfig ships no DOM lib, so a `document` or
`window` reach-in fails typecheck here rather than reaching a consumer.

## Install

```bash
npm install @lcabrera/node
```

No dependencies and no peer dependencies. Requires a Node runtime (it reads
`process`).

Inside this monorepo, depend on it with `"@lcabrera/node": "workspace:*"` and run
`vp install` from the root.

## Exports

| Export                    | Import                                        |
| ------------------------- | --------------------------------------------- |
| `registerShutdownSignals` | `@lcabrera/node/registerShutdownSignals.util` |

There is deliberately no root (`.`) export: each helper is its own subpath, so a
consumer pulls in exactly what it names.

### `registerShutdownSignals`

```ts
import { registerShutdownSignals } from '@lcabrera/node/registerShutdownSignals.util';

registerShutdownSignals({
  shutdown: async () => {
    await server.close();
    await pool.end();
  },
});
```

```ts
type RegisterShutdownSignalsArgs = {
  readonly shutdown: () => Promise<void>;
};

declare const registerShutdownSignals: (
  args: RegisterShutdownSignalsArgs,
) => void;
```

Runs `shutdown` when the process is asked to terminate. Three properties are
worth knowing before you wire it up, because each one is a decision rather than
an accident:

- **It wires both `SIGINT` and `SIGTERM`.** Those are the two a container
  runtime actually sends — `SIGTERM` on `docker stop` or an orchestrator
  eviction, `SIGINT` on Ctrl-C in a dev shell. A service that handles only one
  appears to shut down gracefully in development and gets killed mid-flight in
  production.
- **A rejected `shutdown` is logged, never rethrown.** Throwing out of a signal
  handler surfaces as an unhandled rejection and tears the process down harder
  than the graceful path this exists to provide. The failure is reported on
  `console.error`, named by the signal that triggered it, and the process is
  left to exit on its own.
- **It does not call `process.exit`.** Deciding when the process dies stays with
  the caller; this only gives your cleanup a chance to run first.

**Call it from your entry point, not from a library module.** Registering
process handlers is a side effect, so a module that does it as a consequence of
being imported is action at a distance. `server.ts` is the right home.

## Versioning

Published as compiled ESM (`.mjs` + `.d.mts`) with source maps, one output file
per source module. `"sideEffects": false` — importing the module registers
nothing; only calling the helper does.

## Contributing

This package lives in
[`luciocabrera/lcabrera-stack`](https://github.com/luciocabrera/lcabrera-stack)
under `packages/node-runtime`. Its scope and the boundaries it is held to are in
[the repository's `ARCHITECTURE.md`](https://github.com/luciocabrera/lcabrera-stack/blob/main/packages/node-runtime/ARCHITECTURE.md),
which does not travel in the install; the decision to publish it is
[ADR-069](https://github.com/luciocabrera/lcabrera-stack/blob/main/docs/decisions/ADR-069-publish-the-shared-toolchain.md).

## License

MIT © Lucio Cabrera
