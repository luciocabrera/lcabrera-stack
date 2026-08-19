/*
 * Where these gates consider "the repository" to be.
 *
 * Not a fixed number of directories upward. That only works while the code sits
 * at the one depth it was written for, and stops being true the moment it moves
 * — which is exactly what happened when these gates moved out of the repository
 * root into a workspace: the guard that refuses to read a file outside the
 * repository started computing the package directory as the repository, and
 * refused every legitimate path.
 *
 * Derived from the caller's own location instead: an installed copy resolves to
 * the consumer above `node_modules`, and a linked copy walks up to the nearest
 * `.git`.
 *
 * This is the one copy. `@repo/scan-report` had the same resolver for the same
 * reason and now calls this one, passing its own environment-variable name —
 * which is why the name is an argument rather than a constant.
 */

import { existsSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';

const NODE_MODULES = 'node_modules';

export const HOST_ROOT_ENV = 'REPO_STANDARDS_HOST_ROOT';

/**
 * The consumer root of an installed copy: everything left of the FIRST
 * `node_modules` segment. pnpm nests a second one under `.pnpm`, so taking the
 * first lands on the consumer rather than on the virtual store.
 */
export const rootFromInstallPath = (moduleDirectory) => {
  const segments = moduleDirectory.split(sep);
  const index = segments.indexOf(NODE_MODULES);
  if (index <= 0) return undefined;
  const root = segments.slice(0, index).join(sep);
  return root.length > 0 ? root : undefined;
};

/** The nearest ancestor holding a `.git` entry — a worktree's is a file. */
export const findRepositoryRoot = (startDirectory) => {
  if (existsSync(join(startDirectory, '.git'))) return startDirectory;
  const parent = dirname(startDirectory);
  return parent === startDirectory ? undefined : findRepositoryRoot(parent);
};

export const resolveHostRoot = ({
  env = process.env,
  envName = HOST_ROOT_ENV,
  moduleDirectory,
}) => {
  const override = env[envName];
  if (override) return resolve(override);
  return (
    rootFromInstallPath(moduleDirectory) ??
    findRepositoryRoot(moduleDirectory) ??
    process.cwd()
  );
};
