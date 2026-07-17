import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createAppTsConfig, createNodeTsConfig } from './tsconfig.shared.ts';

type WriteConfigArgs = {
  readonly config: unknown;
  readonly filePath: string;
};

const packageDirectory = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(packageDirectory, '..', '..');

const stringifyConfig = (config: unknown): string =>
  `${JSON.stringify(config, null, 2)}\n`;

const writeConfigFile = async ({
  config,
  filePath,
}: WriteConfigArgs): Promise<void> => {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, stringifyConfig(config), 'utf8');
};

const configs = [
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
    filePath: resolve(packageDirectory, 'tsconfig.app.json'),
  },
  {
    // admin_system consumes @repo/data-access/@repo/scan-ingestion/@repo/ui
    // directly (CQMS routes, TECH_SPEC §2.4/§2.8) — without these, this
    // config drifts from the actual hand-verified tsconfig.app.json the
    // moment this generator re-runs for an unrelated reason (found the
    // hard way: re-running it for apps/scan-orchestrator's new entry
    // silently wiped these three, breaking oxlint resolution for the
    // entire cqms routes tree).
    config: createAppTsConfig({
      paths: {
        '@repo/data-access/*': ['../../packages/data-access/src/*'],
        '@repo/scan-ingestion/*': ['../../packages/scan-ingestion/src/*'],
        // Bare specifier — `@repo/ui` resolves to the public-api barrel, not
        // a subpath. Distinct from the wildcard below and NOT implied by it
        // (`@repo/ui/*` never matches the bare form), so dropping it breaks
        // every `from '@repo/ui'` import in this app.
        '@repo/ui': ['../../packages/ui/src/public-api.ts'],
        '@repo/ui/*': ['../../packages/ui/src/*'],
      },
      tsBuildInfoFile: './node_modules/.tmp/tsconfig.app.tsbuildinfo',
    }),
    filePath: resolve(workspaceRoot, 'apps/admin_system/tsconfig.app.json'),
  },
  {
    config: createNodeTsConfig({
      tsBuildInfoFile: './node_modules/.tmp/tsconfig.node.tsbuildinfo',
    }),
    filePath: resolve(workspaceRoot, 'apps/admin_system/tsconfig.node.json'),
  },
  {
    config: createAppTsConfig({
      paths: {
        '@repo/data-access/*': ['../../packages/data-access/src/*'],
        // Bare specifier — see the identical entry under admin_system above.
        '@repo/ui': ['../../packages/ui/src/public-api.ts'],
        '@repo/ui/*': ['../../packages/ui/src/*'],
      },
      tsBuildInfoFile: './node_modules/.tmp/tsconfig.app.tsbuildinfo',
    }),
    filePath: resolve(workspaceRoot, 'apps/react-router/tsconfig.app.json'),
  },
  {
    config: createNodeTsConfig({
      tsBuildInfoFile: './node_modules/.tmp/tsconfig.node.tsbuildinfo',
    }),
    filePath: resolve(workspaceRoot, 'apps/react-router/tsconfig.node.json'),
  },
  {
    config: createAppTsConfig({
      // packages/ui has no vite.config.ts of its own — everything lives
      // under src/, consumed directly by whichever app's Vite/tsc instance
      // processes it. This config exists so tools that resolve the nearest
      // tsconfig.json from a file *inside* packages/ui (an editor's
      // language server, or tsc/lint invoked directly against this
      // package) can still resolve @repo/ui's own self-referencing
      // imports and @repo/data-access cross-imports — without it, only a
      // consuming app's own tsconfig knew about these aliases.
      paths: {
        '@repo/data-access/*': ['../data-access/src/*'],
        '@repo/ui/*': ['./src/*'],
      },
      tsBuildInfoFile: './node_modules/.tmp/tsconfig.app.tsbuildinfo',
      // packages/ui's src/ mixes browser-context components with
      // Node-context SSR entry utilities (packages/ui/src/entry/) — apps
      // keep these in two separate tsconfig projects (app.json/node.json),
      // but this package has no vite.config.ts to anchor a second project
      // around, so both type roots live in the one config.
      types: ['node'],
    }),
    filePath: resolve(workspaceRoot, 'packages/ui/tsconfig.app.json'),
  },
  {
    // packages/data-access has two genuinely different runtime contexts in
    // one package, deliberately (renamed from packages/api when it grew a
    // Postgres db/ subtree alongside its original browser fetch utilities —
    // see ADR-008): src/api/ runs in the browser (fetch utilities executed
    // client-side, needs import.meta.env/vite/client + DOM lib for its
    // Window/Location test references) while src/db/ is Node-only (pg
    // client, process.env). Mirrors packages/ui's own precedent exactly
    // (its src/entry/ SSR utilities mix into an otherwise browser-context
    // package) — createAppTsConfig + types: ['node'] appended, one project
    // covers both since this package has no vite.config-anchored node
    // split either.
    config: createAppTsConfig({
      paths: {
        '@repo/data-access/*': ['./src/*'],
      },
      tsBuildInfoFile: './node_modules/.tmp/tsconfig.app.tsbuildinfo',
      types: ['node'],
    }),
    filePath: resolve(workspaceRoot, 'packages/data-access/tsconfig.app.json'),
  },
  {
    // Genuinely Node-only (pg client, fs/path, git CLI via child_process,
    // no DOM/vite.client usage anywhere) — unlike packages/data-access's
    // src/api/ half. Overrides
    // createNodeTsConfig's default include (['vite.config.ts'] only, meant
    // for an app's Node-context sibling config) since this package has no
    // app-context tsconfig to pair with — its own src/ needs typechecking.
    config: createNodeTsConfig({
      include: ['src', 'vite.config.ts'],
      paths: {
        '@repo/scan-ingestion/*': ['./src/*'],
      },
      tsBuildInfoFile: './node_modules/.tmp/tsconfig.app.tsbuildinfo',
    }),
    filePath: resolve(
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
    filePath: resolve(workspaceRoot, 'packages/agent-runner/tsconfig.app.json'),
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
    filePath: resolve(
      workspaceRoot,
      'apps/scan-orchestrator/tsconfig.app.json',
    ),
  },
  {
    // @repo/utils is pure and side-effect free by contract (AGENTS.md §1),
    // which is exactly why it gets `types: []` rather than the default
    // ['node']: denying it the Node ambient globals means a stray process/fs
    // reach-in fails typecheck here instead of quietly eroding the guarantee
    // that keeps this package the safe half of the utils/node-runtime split.
    //
    // Flat package (no src/ — the *.util.ts files sit at the package root),
    // so include is overridden. Naming an `exclude` at all opts out of
    // TypeScript's implicit node_modules exclusion, so it must be restated —
    // otherwise `**/*.ts` drags the entire dependency tree into the program.
    config: createNodeTsConfig({
      exclude: ['node_modules'],
      include: ['**/*.ts'],
      tsBuildInfoFile: './node_modules/.tmp/tsconfig.app.tsbuildinfo',
      types: [],
    }),
    filePath: resolve(workspaceRoot, 'packages/utils/tsconfig.app.json'),
  },
  {
    // Genuinely Node-only: a Vite build plugin reading the emitted manifest
    // through node:fs/node:path off process.cwd(). Flat package, same
    // include/exclude reasoning as @repo/utils above.
    config: createNodeTsConfig({
      exclude: ['node_modules'],
      include: ['**/*.ts'],
      tsBuildInfoFile: './node_modules/.tmp/tsconfig.app.tsbuildinfo',
    }),
    filePath: resolve(workspaceRoot, 'packages/plugins/tsconfig.app.json'),
  },
  {
    // Genuinely Node-only: the shared Vite/lint/fmt config factories every
    // workspace's vite.config.ts imports. Flat package, same include/exclude
    // reasoning as @repo/utils above.
    config: createNodeTsConfig({
      exclude: ['node_modules'],
      include: ['**/*.ts'],
      tsBuildInfoFile: './node_modules/.tmp/tsconfig.app.tsbuildinfo',
    }),
    filePath: resolve(workspaceRoot, 'packages/vite-configs/tsconfig.app.json'),
  },
] as const;

await Promise.all(configs.map(writeConfigFile));
