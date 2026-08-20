/**
 * `safe-read.mjs` and `safe-write.mjs` carry the same containment loop, written
 * twice on purpose (see `safe-write.mjs`'s header — extracting it makes
 * `jssecurity:S8707` fire on both). This is what pairs them: two copies of a
 * security check only bite when one can be hardened without the other, and this
 * fails the moment they stop agreeing about which paths are inside.
 */
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test';

import { readTextWithin } from './safe-read.mjs';
import { writeTextWithin } from './safe-write.mjs';

let root;
let outside;

beforeAll(() => {
  root = resolve(mkdtempSync(join(tmpdir(), 'safe-fs-root-')));
  outside = resolve(mkdtempSync(join(tmpdir(), 'safe-fs-outside-')));
});

afterAll(() => {
  for (const dir of [root, outside]) {
    rmSync(dir, { force: true, recursive: true });
  }
});

/** Whether this reader/writer let the path through at all. */
const readAccepts = (path, roots) => {
  try {
    readTextWithin(path, roots[0], roots.slice(1));
    return true;
  } catch (error) {
    return !error.message.startsWith('refusing to read');
  }
};

const writeAccepts = (path, roots) => {
  try {
    writeTextWithin(path, 'x', roots[0], roots.slice(1));
    return true;
  } catch (error) {
    return !error.message.startsWith('refusing to write');
  }
};

describe('safe-read and safe-write agree on containment', () => {
  it.each([
    ['a file directly inside the root', (r) => join(r.root, 'f.txt'), true],
    ['a file nested inside the root', (r) => join(r.root, 'a', 'b.txt'), true],
    ['the root itself', (r) => r.root, true],
    ['a traversal out of the root', (r) => join(r.root, '..', 'x'), false],
    // The sibling case the `+ sep` in the comparison exists for.
    [
      'a sibling sharing the root prefix',
      (r) => `${r.root}-other${sep}f`,
      false,
    ],
    ['a path under an unrelated root', (r) => join(r.outside, 'f'), false],
  ])('%s', (_label, build) => {
    const path = build({ outside, root });
    // The file has to exist for the read to get past containment to the fs call;
    // the write creates its own. Nested paths are expected to fail on ENOENT,
    // which both helpers report as "accepted" — containment is what is compared.
    if (!path.includes('..')) {
      try {
        writeFileSync(path, 'seed', 'utf8');
      } catch {
        // The directory may not exist; the containment verdict is unaffected.
      }
    }
    expect(readAccepts(path, [root])).toBe(writeAccepts(path, [root]));
  });

  it('agree that an empty or absent root refuses everything', () => {
    const path = join(root, 'f.txt');
    expect(readAccepts(path, [''])).toBe(writeAccepts(path, ['']));
    expect(readAccepts(path, [''])).toBe(false);
  });

  it('agree that an extra root is honoured', () => {
    const path = join(outside, 'shared.txt');
    writeFileSync(path, 'seed', 'utf8');
    expect(readAccepts(path, [root, outside])).toBe(true);
    expect(writeAccepts(path, [root, outside])).toBe(true);
  });
});
