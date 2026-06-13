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
] as const;

await Promise.all(configs.map(writeConfigFile));
