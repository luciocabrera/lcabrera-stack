// Where this tooling considers "here" to be: the repository it is INSTALLED
// in, never the project being scanned. Four things hang off it — the `.tmp`
// scratch root, a bare positional scope, the `node_modules` the fallow and
// ts-morph binaries are resolved from, and the ingestion config file.
//
// Derived from the caller module's own location rather than from `cwd`, so a
// runner spawned from an arbitrary working directory still agrees with one run
// by hand, and so it survives being installed into `node_modules` instead of
// vendored at a fixed depth (the previous "four levels up" rule assumed
// `.github/skills/<skill>/scripts/` and broke anywhere else).

import { existsSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';

const NODE_MODULES = 'node_modules';

/**
 * The consumer root of an installed copy: everything left of the FIRST
 * `node_modules` segment. pnpm nests a second one under `.pnpm`, so taking the
 * first is what lands on the consumer rather than on the virtual store.
 */
export const rootFromInstallPath = (moduleDirectory) => {
  const segments = moduleDirectory.split(sep);
  const index = segments.indexOf(NODE_MODULES);
  if (index <= 0) return undefined;
  const root = segments.slice(0, index).join(sep);
  // `/node_modules/…` joins to the empty string, which is not a directory —
  // there is no consumer above a store mounted at the filesystem root.
  return root.length > 0 ? root : undefined;
};

/** The nearest ancestor holding a `.git` entry — a worktree's is a file. */
export const findRepositoryRoot = (startDirectory) => {
  if (existsSync(join(startDirectory, '.git'))) return startDirectory;
  const parent = dirname(startDirectory);
  return parent === startDirectory ? undefined : findRepositoryRoot(parent);
};

export const HOST_ROOT_ENV = 'SCAN_REPORT_HOST_ROOT';

export const resolveHostRoot = ({ env = process.env, moduleDirectory }) => {
  const override = env[HOST_ROOT_ENV];
  if (override) return resolve(override);
  return (
    rootFromInstallPath(moduleDirectory) ??
    findRepositoryRoot(moduleDirectory) ??
    process.cwd()
  );
};
