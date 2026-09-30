/*
 * What the two suites about the `prepare` hooks script share: where the script
 * is, the environment it is run under, and the scratch trees it is run in.
 *
 * Kept free of the test runner, as `test-fixtures.mjs` is, so each suite keeps
 * its own `afterEach` and `expect`.
 */

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { GIT_REPOSITORY_VARIABLES, runGit } from './git-exec.mjs';
import { HOOKS_PATH_SCRIPT } from './workspace.mjs';

export const PACKAGE_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

export const HOOKS_SCRIPT = join(
  PACKAGE_ROOT,
  'assets',
  'workspace',
  HOOKS_PATH_SCRIPT,
);

export const CLEAN_ENV = Object.fromEntries(
  Object.entries(process.env).filter(
    ([name]) => !GIT_REPOSITORY_VARIABLES.has(name) && name !== 'CI',
  ),
);

/**
 * @param {string[]} args
 * @param {string} cwd
 * @returns {string}
 */
export const gitIn = (args, cwd) => runGit({ args, cwd });

/**
 * @param {string} cwd
 * @returns {string}
 */
export const localHooksPathIn = (cwd) => {
  try {
    return gitIn(['config', '--local', '--get', 'core.hooksPath'], cwd);
  } catch {
    return '';
  }
};

/**
 * @param {string} prefix
 * @returns {{ drain: () => void, scratch: () => string }}
 */
export const scratchDirectories = (prefix) => {
  const made = [];
  return {
    drain: () => {
      const drained = [...made];
      made.length = 0;
      for (const root of drained) {
        rmSync(root, { force: true, recursive: true });
      }
    },
    scratch: () => {
      const root = mkdtempSync(join(tmpdir(), prefix));
      made.push(root);
      return root;
    },
  };
};
