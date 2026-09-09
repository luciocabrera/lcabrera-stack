/**
 * This repository's workspace roster, as data: one entry per tsconfig the
 * generator writes.
 *
 * It is kept apart from the runner so the whole set can be asserted without
 * running it — importing the runner rewrites every config in the tree as a side
 * effect of the import, which no test can do.
 *
 * Adding an entry is part of adding a workspace, not a later tidy-up.
 */

import {
  createAppTsConfig,
  createNodeTsConfig,
} from '@lcabrera/tsconfig/shared';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageDirectory = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(packageDirectory, '..', '..');

export const configs = [
  {
    config: createNodeTsConfig({
      exclude: ['node_modules'],
      include: ['*.ts'],
      tsBuildInfoFile: './node_modules/.tmp/tsconfig.app.tsbuildinfo',
    }),
    filePath: path.resolve(workspaceRoot, 'tsconfig.app.json'),
  },
  {
    config: createNodeTsConfig({
      exclude: ['node_modules'],
      include: ['**/*.ts'],
      tsBuildInfoFile: './node_modules/.tmp/tsconfig.app.tsbuildinfo',
    }),
    filePath: path.resolve(packageDirectory, 'tsconfig.app.json'),
  },
  {
    config: createAppTsConfig({
      tsBuildInfoFile: './node_modules/.tmp/tsconfig.app.tsbuildinfo',
    }),
    filePath: path.resolve(workspaceRoot, 'apps/web/tsconfig.app.json'),
  },
  {
    config: createNodeTsConfig({
      tsBuildInfoFile: './node_modules/.tmp/tsconfig.node.tsbuildinfo',
    }),
    filePath: path.resolve(workspaceRoot, 'apps/web/tsconfig.node.json'),
  },
];
