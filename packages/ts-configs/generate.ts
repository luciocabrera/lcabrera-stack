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
        '@repo/api/*': ['../../packages/api/src/*'],
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
      // imports and @repo/api cross-imports — without it, only a
      // consuming app's own tsconfig knew about these aliases.
      paths: {
        '@repo/api/*': ['../api/src/*'],
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
    // Despite having no React, packages/api runs in the browser (fetch
    // utilities executed client-side) and needs import.meta.env (vite/client)
    // plus DOM lib (its tests reference Window/Location) — createAppTsConfig
    // fits its actual runtime better than createNodeTsConfig, which assumes
    // no DOM/vite context at all. Confirmed no node: built-ins are used
    // anywhere in this package.
    config: createAppTsConfig({
      paths: {
        '@repo/api/*': ['./src/*'],
      },
      tsBuildInfoFile: './node_modules/.tmp/tsconfig.app.tsbuildinfo',
    }),
    filePath: resolve(workspaceRoot, 'packages/api/tsconfig.app.json'),
  },
] as const;

await Promise.all(configs.map(writeConfigFile));
