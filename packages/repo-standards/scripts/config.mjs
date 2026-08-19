/*
 * The repository facts these gates would otherwise hardcode.
 *
 * Same split the toolchain packages made: the rule travels, the names inside it
 * do not. A gate that says "retarget to `main`" is telling a repository with a
 * differently-named default branch something false, and one that names this
 * repository's register directory is naming a path a consumer does not have.
 *
 * The file is `devkit.config.json`, shared with the materialiser, because it is
 * the CONSUMER's data and two files invite drift between them. The readers are
 * separate on purpose: each package reads only the block it owns, so neither has
 * to depend on the other to answer a question about its own behaviour.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const CONFIG_FILE_NAME = 'devkit.config.json';

export const DEFAULT_CONVENTIONS = {
  defaultBranch: 'main',
  sharedBranchesDir: 'docs/coordination/branches',
};

const isPlainObject = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * A malformed config is a failure rather than a silent fallback: a consumer who
 * wrote one meant it, and quietly ignoring it would enforce a rule they did not
 * ask for while reporting success.
 */
export const resolveConventions = (raw) => {
  if (raw === undefined) return DEFAULT_CONVENTIONS;
  const parsed = JSON.parse(raw);
  if (!isPlainObject(parsed)) {
    throw new Error(`${CONFIG_FILE_NAME} must contain a JSON object`);
  }
  const block = isPlainObject(parsed.conventions) ? parsed.conventions : {};
  return {
    defaultBranch:
      typeof block.defaultBranch === 'string' && block.defaultBranch !== ''
        ? block.defaultBranch
        : DEFAULT_CONVENTIONS.defaultBranch,
    sharedBranchesDir:
      typeof block.sharedBranchesDir === 'string' &&
      block.sharedBranchesDir !== ''
        ? block.sharedBranchesDir
        : DEFAULT_CONVENTIONS.sharedBranchesDir,
  };
};

export const readConventions = (root = process.cwd()) => {
  const path = join(root, CONFIG_FILE_NAME);
  return resolveConventions(
    existsSync(path) ? readFileSync(path, 'utf8') : undefined,
  );
};
