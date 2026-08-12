import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createAppTsConfig, createNodeTsConfig } from './tsconfig.shared.ts';

const packageDirectory = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(packageDirectory, '..', '..');

/**
 * Every generated tsconfig, as data. Kept apart from `generate.ts` so the set
 * can be asserted without running the generator: importing the writer would
 * rewrite all 17 configs as a side effect of the import, which no test can do.
 */
export const configs = [
  {
    // This package's own source (generate.ts + tsconfig.shared.ts) is
    // Node-only: node:fs/node:path/node:url, run via `node`, no bundler and
    // no browser context. It previously emitted an app-config/node-config
    // demo pair for itself, but neither one ever checked this source: the app
    // config demanded `vite/client` types from a package that does not depend
    // on vite (so tsc exited 2 before reading a single file), and the node
    // config included only `vite.config.ts`, which this package does not have.
    // A generator that defines the repo's strictness while being exempt from
    // it is the one config here that has to be right.
    config: createNodeTsConfig({
      exclude: ['node_modules'],
      include: ['**/*.ts'],
      tsBuildInfoFile: './node_modules/.tmp/tsconfig.app.tsbuildinfo',
    }),
    filePath: path.resolve(packageDirectory, 'tsconfig.app.json'),
  },
  {
    // admin_system consumes @lcabrera/server/@repo/scan-ingestion/@lcabrera/ui
    // directly (CQMS routes, TECH_SPEC §2.4/§2.8) — without these, this
    // config drifts from the actual hand-verified tsconfig.app.json the
    // moment this generator re-runs for an unrelated reason (found the
    // hard way: re-running it for apps/scan-orchestrator's new entry
    // silently wiped these three, breaking oxlint resolution for the
    // entire cqms routes tree).
    config: createAppTsConfig({
      paths: {
        '@lcabrera/server/*': ['../../packages/server/src/*'],
        // Bare specifier only. There is deliberately NO `@lcabrera/ui/*`
        // wildcard here: an alias for the subpaths resolves them straight to
        // `src/`, which is how a broken `exports` map stayed invisible in this
        // repo while the published package could not be imported at all
        // (ADR-060). Without it, every deep import is checked against the real
        // export map by `tsc`, so an unexported subpath fails typecheck here
        // rather than on a consumer's machine.
        '@lcabrera/ui': ['../../packages/ui/src/public-api.ts'],
        '@repo/scan-ingestion/*': ['../../packages/scan-ingestion/src/*'],
      },
      tsBuildInfoFile: './node_modules/.tmp/tsconfig.app.tsbuildinfo',
    }),
    filePath: path.resolve(
      workspaceRoot,
      'apps/admin_system/tsconfig.app.json',
    ),
  },
  {
    config: createNodeTsConfig({
      tsBuildInfoFile: './node_modules/.tmp/tsconfig.node.tsbuildinfo',
    }),
    filePath: path.resolve(
      workspaceRoot,
      'apps/admin_system/tsconfig.node.json',
    ),
  },
  {
    config: createAppTsConfig({
      paths: {
        '@lcabrera/server/*': ['../../packages/server/src/*'],
        // Bare specifier only — see the identical entry under admin_system.
        '@lcabrera/ui': ['../../packages/ui/src/public-api.ts'],
      },
      tsBuildInfoFile: './node_modules/.tmp/tsconfig.app.tsbuildinfo',
    }),
    filePath: path.resolve(
      workspaceRoot,
      'apps/react-router/tsconfig.app.json',
    ),
  },
  {
    config: createNodeTsConfig({
      tsBuildInfoFile: './node_modules/.tmp/tsconfig.node.tsbuildinfo',
    }),
    filePath: path.resolve(
      workspaceRoot,
      'apps/react-router/tsconfig.node.json',
    ),
  },
  {
    config: createAppTsConfig({
      // packages/ui has no vite.config.ts of its own — everything lives
      // under src/, consumed directly by whichever app's Vite/tsc instance
      // processes it. This config exists so tools that resolve the nearest
      // tsconfig.json from a file *inside* packages/ui (an editor's language
      // server, or tsc/lint invoked directly against this package) get the
      // same strictness every other workspace is held to.
      //
      // This entry is the only one that ends up with NO `paths` at all, and
      // that is deliberate on three counts:
      //
      //   `@lcabrera/ui/*` — deleted (ADR-060). The package ships source, so a
      //   consumer compiles our files and every self-import resolves through
      //   our own exports map. Aliasing it here short-circuited that map, which
      //   is how eight wildcard `exports` entries that resolved for nobody
      //   stayed green for their whole life. Self-imports now go through
      //   `#ui/*`, which resolves from the manifest rather than a tsconfig.
      //
      //   `@lcabrera/server/*` — gone with the shapes it resolved (ADR-039):
      //   @lcabrera/ui is client-safe and must not reach into a Node-only
      //   package, and an alias is exactly how such an edge hides.
      //
      //   `@/*` — resolves only through a tsconfig, so an `@/` import inside a
      //   published package is unresolvable for a consumer, the same class of
      //   undeclared edge as the two above.
      //
      // In each case omitting the alias makes tsc, not review, the thing that
      // catches one. `tsconfig.shared.test.ts` asserts the absence.
      srcAlias: false,
      tsBuildInfoFile: './node_modules/.tmp/tsconfig.app.tsbuildinfo',
      // packages/ui's src/ mixes browser-context components with
      // Node-context SSR entry utilities (packages/ui/src/entry/) — apps
      // keep these in two separate tsconfig projects (app.json/node.json),
      // but this package has no vite.config.ts to anchor a second project
      // around, so both type roots live in the one config.
      types: ['node'],
    }),
    filePath: path.resolve(workspaceRoot, 'packages/ui/tsconfig.app.json'),
  },
  {
    // @lcabrera/server is Node-only, and this entry is now a plain node config
    // rather than an app config with 'node' bolted on.
    //
    // It used to be the latter because the package carried two runtimes at
    // once (ADR-008): a browser src/api/ half needing DOM + vite/client
    // alongside a Node src/db/ half. That half is gone — it is @lcabrera/api now
    // — so the DOM lib was left granting Window, document and fetch to a
    // package that has no business touching any of them. Dropping to
    // createNodeTsConfig makes a browser reach-in fail typecheck here, the
    // exact mirror of @lcabrera/api omitting 'node' to keep itself client-safe.
    config: createNodeTsConfig({
      include: ['src', 'vite.config.ts'],
      paths: {
        '@lcabrera/server/*': ['./src/*'],
      },
      tsBuildInfoFile: './node_modules/.tmp/tsconfig.app.tsbuildinfo',
    }),
    filePath: path.resolve(workspaceRoot, 'packages/server/tsconfig.app.json'),
  },
  {
    // Genuinely Node-only (pg client, fs/path, git CLI via child_process,
    // no DOM/vite.client usage anywhere). Overrides createNodeTsConfig's
    // default include (['vite.config.ts'] only, meant for an app's
    // Node-context sibling config) since this package has no app-context
    // tsconfig to pair with — its own src/ needs typechecking.
    config: createNodeTsConfig({
      include: ['src', 'vite.config.ts'],
      paths: {
        '@repo/scan-ingestion/*': ['./src/*'],
      },
      tsBuildInfoFile: './node_modules/.tmp/tsconfig.app.tsbuildinfo',
    }),
    filePath: path.resolve(
      workspaceRoot,
      'packages/scan-ingestion/tsconfig.app.json',
    ),
  },
  {
    // Genuinely Node-only — spawns the Claude Agent SDK's own CLI
    // subprocess, no DOM/vite.client usage anywhere.
    config: createNodeTsConfig({
      include: ['src', 'vite.config.ts'],
      paths: {
        '@repo/agent-runner/*': ['./src/*'],
      },
      tsBuildInfoFile: './node_modules/.tmp/tsconfig.app.tsbuildinfo',
    }),
    filePath: path.resolve(
      workspaceRoot,
      'packages/agent-runner/tsconfig.app.json',
    ),
  },
  {
    // Genuinely Node-only — process-lifecycle primitives (SIGINT/SIGTERM
    // handlers), the deliberate impure counterpart to @lcabrera/utils.
    //
    // This was the one tsconfig.app.json the generator did not own: it was
    // hand-written, so every tsconfig.shared.ts change silently skipped it
    // while its name promised otherwise (the README calls these generated
    // artifacts). It had drifted to carry esModuleInterop, resolveJsonModule
    // and useDefineForClassFields, none of which this package uses — no
    // default imports, no JSON imports, no classes — plus an `@/*` alias
    // nothing imports through. Folding it in drops the dead options and
    // makes it identical in shape to its Node-only siblings above.
    config: createNodeTsConfig({
      include: ['src', 'vite.config.ts'],
      paths: {
        '@repo/node-runtime/*': ['./src/*'],
      },
      tsBuildInfoFile: './node_modules/.tmp/tsconfig.app.tsbuildinfo',
    }),
    filePath: path.resolve(
      workspaceRoot,
      'packages/node-runtime/tsconfig.app.json',
    ),
  },
  {
    // Genuinely Node-only — the standalone scan-orchestrator process
    // (Implementation Plan step 9): a dedicated Postgres LISTEN client, a
    // plain node:http + ws server, no DOM/vite.client usage anywhere.
    config: createNodeTsConfig({
      include: ['src', 'vite.config.ts'],
      paths: {
        '@repo/scan-orchestrator/*': ['./src/*'],
      },
      tsBuildInfoFile: './node_modules/.tmp/tsconfig.app.tsbuildinfo',
    }),
    filePath: path.resolve(
      workspaceRoot,
      'apps/scan-orchestrator/tsconfig.app.json',
    ),
  },
  {
    // @lcabrera/api is the browser half of the old data-access package: fetch
    // client, HTTP contracts, base-URL resolution. It needs the DOM lib and
    // vite/client that createAppTsConfig supplies by default (Window, Location,
    // fetch, the Vite env object) — but, unlike packages/server, it must
    // NOT append 'node'. That omission is the point: a stray process/fs reach-in
    // fails typecheck here rather than quietly making a client-safe package
    // server-only again, which is the regression
    // packages/ui/scripts/check-public-api-client-safe.mjs now also guards.
    config: createAppTsConfig({
      include: ['src', 'vite.config.ts'],
      // No `@/*` — @lcabrera/api is publishable, and that alias resolves only
      // through a tsconfig. See the packages/ui entry above.
      srcAlias: false,
      tsBuildInfoFile: './node_modules/.tmp/tsconfig.app.tsbuildinfo',
    }),
    filePath: path.resolve(workspaceRoot, 'packages/api/tsconfig.app.json'),
  },
  {
    // @lcabrera/utils is pure and side-effect free by contract (AGENTS.md §1),
    // which is exactly why it gets `types: []` rather than the default
    // ['node']: denying it the Node ambient globals means a stray process/fs
    // reach-in fails typecheck here instead of quietly eroding the guarantee
    // that keeps this package the safe half of the utils/node-runtime split.
    //
    // Sources live under src/ (domain-grouped) with a root vite.config.ts, so
    // include names both — matching the other library packages. `types: []`
    // still denies Node ambient globals to keep the purity guarantee.
    config: createNodeTsConfig({
      include: ['src', 'vite.config.ts'],
      tsBuildInfoFile: './node_modules/.tmp/tsconfig.app.tsbuildinfo',
      types: [],
    }),
    filePath: path.resolve(workspaceRoot, 'packages/utils/tsconfig.app.json'),
  },
  {
    // Genuinely Node-only: a Vite build plugin reading the emitted manifest
    // through node:fs/node:path off process.cwd(). Flat package, same
    // include/exclude reasoning as @lcabrera/utils above.
    config: createNodeTsConfig({
      exclude: ['node_modules'],
      include: ['**/*.ts'],
      tsBuildInfoFile: './node_modules/.tmp/tsconfig.app.tsbuildinfo',
    }),
    filePath: path.resolve(workspaceRoot, 'packages/plugins/tsconfig.app.json'),
  },
  {
    // Genuinely Node-only: the shared Vite/lint/fmt config factories every
    // workspace's vite.config.ts imports. Flat package, same include/exclude
    // reasoning as @lcabrera/utils above.
    config: createNodeTsConfig({
      exclude: ['node_modules'],
      include: ['**/*.ts'],
      tsBuildInfoFile: './node_modules/.tmp/tsconfig.app.tsbuildinfo',
    }),
    filePath: path.resolve(
      workspaceRoot,
      'packages/vite-configs/tsconfig.app.json',
    ),
  },
  {
    // Genuinely Node-only: ESLint rules, which run in the linter's process.
    // Until it became publishable this package carried a hand-written
    // tsconfig.json — the last one in the repo outside this generator — so it
    // silently missed every option the others tightened. Sources under src/
    // with a root vite.config.ts, so include names both, matching @lcabrera/utils.
    config: createNodeTsConfig({
      include: ['src', 'vite.config.ts'],
      tsBuildInfoFile: './node_modules/.tmp/tsconfig.app.tsbuildinfo',
    }),
    filePath: path.resolve(
      workspaceRoot,
      'packages/eslint-local-rules/tsconfig.app.json',
    ),
  },
] as const;
