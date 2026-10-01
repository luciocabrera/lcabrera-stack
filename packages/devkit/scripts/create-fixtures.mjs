/*
 * What the suites that run `devkit create` into a scratch directory share: the
 * scratch directories, a git that answers with its output, and a console that
 * stays quiet while a command runs.
 *
 * Kept free of the test runner, as `test-fixtures.mjs` is, so each suite keeps
 * its own `afterEach` and passes its own `vi`.
 */

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { runCreate } from './command-create.mjs';
import { runGit } from './git-exec.mjs';
import { silencedConsole } from './test-fixtures.mjs';

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

export const git = (args, cwd) => runGit({ args, cwd });

export const quietlyWith = (vi, run) => {
  const { error, log, restore } = silencedConsole(vi);
  try {
    const code = run();
    return {
      code,
      errors: error.mock.calls.flat().join('\n'),
      printed: log.mock.calls.flat().join('\n'),
    };
  } finally {
    restore();
  }
};

export const createUnderWith = (vi, { parent, profile }) =>
  quietlyWith(vi, () => runCreate(['demo', '--profile', profile], parent));
