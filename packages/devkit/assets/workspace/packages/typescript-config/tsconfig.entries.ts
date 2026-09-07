/**
 * This repository's workspace roster, as data: one entry per tsconfig the
 * generator writes.
 *
 * It is kept apart from the runner so the whole set can be asserted without
 * running it — importing the runner rewrites every config in the tree as a side
 * effect of the import, which no test can do.
 *
 * A workspace with no entry here falls back to the near-empty root config and is
 * checked far more loosely than every other one, so adding an entry is part of
 * adding a workspace rather than a later tidy-up.
 */

import { createNodeTsConfig } from '@lcabrera/tsconfig/shared';
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
];
