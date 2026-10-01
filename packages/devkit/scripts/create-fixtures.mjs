/*
 * What the suites that run `devkit create` into a scratch directory share: the
 * scratch directories, a git that answers with its output, and a console that
 * stays quiet while a command runs.
 *
 * Kept free of the test runner, as `test-fixtures.mjs` is, so each suite keeps
 * its own `afterEach` and passes its own `vi`.
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { runCreate } from './command-create.mjs';

export const scratchDirectories = (prefix) => {
  const roots = [];
  return {
    drain: () => {
      const drained = [...roots];
      roots.length = 0;
      for (const root of drained) {
        rmSync(root, { force: true, recursive: true });
      }
    },
    make: () => {
      const root = mkdtempSync(join(tmpdir(), prefix));
      roots.push(root);
      return root;
    },
  };
};

export const git = (args, cwd) =>
  execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();

export const quietlyWith = (vi, run) => {
  const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  try {
    const code = run();
    return {
      code,
      errors: error.mock.calls.flat().join('\n'),
      printed: log.mock.calls.flat().join('\n'),
    };
  } finally {
    log.mockRestore();
    error.mockRestore();
  }
};

export const createUnderWith = (vi, { parent, profile }) =>
  quietlyWith(vi, () => runCreate(['demo', '--profile', profile], parent));
