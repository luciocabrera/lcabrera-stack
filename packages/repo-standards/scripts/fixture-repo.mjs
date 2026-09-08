/**
 * Building and tearing down a synthetic repository for a gate's end-to-end
 * tests.
 *
 * Every gate that reads a whole tree needs one, and each of those fixtures had
 * grown its own copy of the same four things: write a file and its parents,
 * plant one edit in a file that must already contain the text, remember which
 * temporary roots were made, and remove them afterwards. Two copies is where a
 * public package's duplication budget runs out, and a baseline cannot absorb it
 * — a fallow entry for one of these packages is a suppression, and they take
 * none.
 *
 * Test scaffolding: excluded from the package by the `files` entry beside the
 * test exclusion, because a consumer has no use for it.
 */
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

export const writeIn = (root) => (path, text) => {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), text);
};

export const editIn = (root) => (path, from, to) => {
  const full = join(root, path);
  const before = readFileSync(full, 'utf8');
  const after = before.replace(from, () => to);
  if (after === before) {
    throw new Error(`fixture: \`${from}\` is not in ${path}`);
  }
  writeFileSync(full, after);
};

export const createFixtureRoots = (prefix) => {
  const roots = [];
  return {
    make: () => {
      const root = realpathSync(mkdtempSync(join(tmpdir(), prefix)));
      roots.push(root);
      return root;
    },
    removeAll: () => {
      const drained = [...roots];
      roots.length = 0;
      for (const root of drained) {
        rmSync(root, { force: true, recursive: true });
      }
    },
  };
};
