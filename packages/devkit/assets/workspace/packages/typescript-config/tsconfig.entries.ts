/**
 * This repository's workspace roster, as data: one entry per tsconfig the
 * generator writes.
 *
 * It is kept apart from the runner so the whole set can be asserted without
 * running it — importing the runner rewrites every config in the tree as a side
 * effect of the import, which no test can do.
 *
 * A workspace with no entry here gets no tsconfig, and nothing then type-checks
 * it: this tree ships no root `tsconfig.json` to fall back to, the generated root
 * config reaches only the files beside it, and a workspace with no config of its
 * own has no `typecheck` task to run — so `typecheck:all` passes over it and
 * exits 0. Point the compiler at those files by hand and you get its defaults,
 * without `noUncheckedIndexedAccess` or anything else these factories add.
 * Adding an entry is part of adding a workspace, not a later tidy-up.
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
