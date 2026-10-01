/*
 * When a run leaves a recorded path alone or retires nothing: a path that does
 * not resolve inside the repository, or names a placed file by another
 * spelling, and an asset set that cannot be trusted as the package's shipping
 * list. Asserted on a real tree, because the claim is about
 * which files survive.
 *
 * Usage: `vp run test` in this workspace; exits non-zero on a failing case.
 */

import {
  existsSync,
  mkdirSync,
  readdirSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, test, vi } from 'vite-plus/test';

import { runClosure } from './command-closure.mjs';
import { KIT_GROUPS } from './config.mjs';
import { hashContent, MANIFEST_FILE } from './manifest.mjs';
import {
  LOWER,
  RETIREMENT_CONFIG,
  scratchRepositories,
  syncRecord,
  VICTIM,
} from './retirement-fixtures.mjs';
import { destinationIn, retirementRefusal } from './retirement.mjs';
import { applySync, onDiskHasher, planSync } from './sync.mjs';
import { silencedConsole } from './test-fixtures.mjs';

const byName = (left, right) => left.localeCompare(right);

const { drain, scratchRepository } = scratchRepositories();

afterEach(drain);

const CONFIG = RETIREMENT_CONFIG;

describe('a recorded path outside the repository', () => {
  const OUTSIDE = {
    'an absolute path': ({ parent }) => join(parent, 'victim.txt'),
    'a parent-relative path': () => '../victim.txt',
    'a path through a symlinked directory': ({ parent, root }) => {
      symlinkSync(parent, join(root, 'linked'), 'dir');
      return 'linked/victim.txt';
    },
  };

  for (const [label, recordFor] of Object.entries(OUTSIDE)) {
    test(`is neither hashed nor deleted when it is ${label}`, () => {
      const tree = scratchRepository();
      const outcome = syncRecord({ path: recordFor(tree), root: tree.root });

      expect({
        ...outcome,
        survives: existsSync(join(tree.parent, 'victim.txt')),
      }).toEqual({
        hashed: false,
        recorded: false,
        state: 'outside',
        survives: true,
      });
    });
  }

  test('an unmodified file inside it is still retired', () => {
    const { root } = scratchRepository();
    writeFileSync(join(root, 'inside.txt'), VICTIM);

    expect({
      ...syncRecord({ path: 'inside.txt', root }),
      survives: existsSync(join(root, 'inside.txt')),
    }).toEqual({
      hashed: true,
      recorded: false,
      state: 'retired',
      survives: false,
    });
  });

  test('the repository root itself is not a path inside it', () => {
    const { root } = scratchRepository();
    expect(['.', '', 'a/..'].map(destinationIn(root))).toEqual([
      undefined,
      undefined,
      undefined,
    ]);
  });
});

describe('an asset set that cannot be trusted as the shipping list', () => {
  const CASES = {
    'is empty': { assets: [], kitGroups: ['lower'], names: 'no assets' },
    'lacks a group the kit ships': {
      assets: [LOWER],
      kitGroups: ['lower', 'higher'],
      names: 'no assets in higher',
    },
  };

  for (const [label, { assets, kitGroups, names }] of Object.entries(CASES)) {
    test(`retires nothing, and says why, when it ${label}`, () => {
      const { root } = scratchRepository();
      writeFileSync(join(root, 'recorded.txt'), VICTIM);

      const outcome = syncRecord({
        assets,
        kitGroups,
        path: 'recorded.txt',
        root,
      });

      expect({
        recorded: outcome.recorded,
        state: outcome.state,
        survives: existsSync(join(root, 'recorded.txt')),
      }).toEqual({ recorded: true, state: undefined, survives: true });
      expect(retirementRefusal({ assets, kitGroups })).toContain(names);
    });
  }

  test('is trusted when every shipping group is present', () => {
    expect(
      retirementRefusal({ assets: [LOWER], kitGroups: ['lower'] }),
    ).toBeUndefined();
  });

  test('every group the kit counts as shipping is a directory of this package’s assets', () => {
    const assetsRoot = join(
      dirname(dirname(fileURLToPath(import.meta.url))),
      'assets',
    );
    const directories = readdirSync(assetsRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    expect(KIT_GROUPS.toSorted(byName)).toEqual(directories.toSorted(byName));
  });
});

const SHIPPED_AT = 'app/kept.md';

const planAlias = (root, alias) => {
  writeFileSync(join(root, 'app', 'kept.md'), LOWER.content);
  const entries = planSync({
    assets: [LOWER],
    config: CONFIG,
    destinationOf: destinationIn(root),
    groups: ['lower'],
    kitGroups: ['lower'],
    manifest: {
      files: {
        [alias]: hashContent(LOWER.content),
        [SHIPPED_AT]: hashContent(LOWER.content),
      },
    },
    onDiskHash: onDiskHasher(root),
  });
  applySync({ entries, root });
  return {
    planned: entries.map(({ path, state }) => ({ path, state })),
    survives: existsSync(join(root, SHIPPED_AT)),
  };
};

describe('a record naming a placed file by another spelling', () => {
  const ALIASES = {
    'a parent segment': () => 'app/sub/../kept.md',
    'a symlinked directory inside the repository': (root) => {
      symlinkSync(join(root, 'app'), join(root, 'alias'), 'dir');
      return 'alias/kept.md';
    },
  };

  for (const [label, aliasFor] of Object.entries(ALIASES)) {
    test(`is not retired when it reaches it through ${label}`, () => {
      const { root } = scratchRepository();
      mkdirSync(join(root, 'app'));

      expect(planAlias(root, aliasFor(root))).toEqual({
        planned: [{ path: SHIPPED_AT, state: 'current' }],
        survives: true,
      });
    });
  }
});

const closureOf = (root) => {
  const silenced = silencedConsole(vi);
  try {
    const code = runClosure(['--shipped'], root);
    return { code, printed: silenced.log.mock.calls.flat().join('\n') };
  } finally {
    silenced.restore();
  }
};

describe('the shipped closure of a tree holding a stale record', () => {
  test('reports exactly what it reports without the record', () => {
    const { root } = scratchRepository();
    const clean = closureOf(root);
    writeFileSync(
      join(root, MANIFEST_FILE),
      JSON.stringify({
        files: { 'gone.md': hashContent('gone') },
        packageVersion: '0.0.0',
        version: 1,
      }),
    );
    writeFileSync(join(root, 'gone.md'), 'gone');

    expect(closureOf(root)).toEqual(clean);
  });
});

describe('a recorded path many directories deep', () => {
  test('resolves without exhausting the stack', () => {
    const { root } = scratchRepository();
    const deep = `${Array.from({ length: 20_000 }, () => 'a').join('/')}/f.md`;

    expect(destinationIn(root)(deep)?.startsWith(root)).toBe(true);
  });
});
