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
    config: createAppTsConfig({
      tsBuildInfoFile: './node_modules/.tmp/tsconfig.app.tsbuildinfo',
    }),
    filePath: resolve(packageDirectory, 'tsconfig.app.json'),
  },
  {
    config: createNodeTsConfig({
      tsBuildInfoFile: './node_modules/.tmp/tsconfig.node.tsbuildinfo',
    }),
    filePath: resolve(packageDirectory, 'tsconfig.node.json'),
  },
  {
    config: createAppTsConfig({
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
] as const;

await Promise.all(configs.map(writeConfigFile));
