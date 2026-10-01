/*
 * Two held groups mapping onto one target path, and a recorded file no group
 * ships any more. The groups are fixtures: no rung above `monorepo` ships a
 * group of its own yet, so the precedence is asserted on groups a case names.
 *
 * Usage: `vp run test` in this workspace; exits non-zero on a failing case.
 */

import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vite-plus/test';

import { runDoctor, runSync } from './command-sync.mjs';
import { DEFAULT_CONFIG, retiredAssetsFor } from './config.mjs';
import { hashContent, MANIFEST_FILE } from './manifest.mjs';
import { containedIn } from './retirement.mjs';
import {
  applySync,
  manifestAfter,
  onDiskHasher,
  onDiskReader,
  planSync,
} from './sync.mjs';
import { planWith, silencedConsole } from './test-fixtures.mjs';

const CONFIG = {
  ...DEFAULT_CONFIG,
  paths: { ...DEFAULT_CONFIG.paths, higher: 'app', lower: 'app' },
};

const LOWER = { content: 'lower body', path: 'lower/routes/example.tsx' };
const HIGHER = { content: 'higher body', path: 'higher/routes/example.tsx' };
const TARGET = 'app/routes/example.tsx';
const RETIRED = {
  content: 'helper body',
  path: 'app/routes/example.helper.ts',
};

const scratches = [];

const scratch = () => {
  const root = mkdtempSync(join(tmpdir(), 'devkit-rungs-'));
  scratches.push(root);
  return root;
};

afterEach(() => {
  const drained = [...scratches];
  scratches.length = 0;
  for (const root of drained) rmSync(root, { force: true, recursive: true });
});

const writeAt = (root, path, content) => {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), content);
};

const syncTree = ({ assets, groups, manifest, retiring = [], root }) => {
  const entries = planSync({
    assets,
    config: CONFIG,
    groups,
    isContained: containedIn(root),
    kitGroups: ['lower'],
    manifest,
    onDiskContent: onDiskReader(root),
    onDiskHash: onDiskHasher(root),
    retiring,
  });
  applySync({ entries, root });
  return {
    entries,
    manifest: manifestAfter({ entries, previous: manifest, version: '0.0.0' }),
  };
};

const atLowerRung = (root) =>
  syncTree({
    assets: [LOWER, HIGHER],
    groups: ['lower'],
    manifest: { files: {} },
    root,
  }).manifest;

const recordedRetiree = (root, onDisk) => {
  if (onDisk !== undefined) writeAt(root, RETIRED.path, onDisk);
  return { files: { [RETIRED.path]: hashContent(RETIRED.content) } };
};

const retireIn = (root, manifest) =>
  syncTree({ assets: [LOWER], groups: ['lower'], manifest, root });

const quietly = (run) => {
  const silenced = silencedConsole(vi);
  try {
    return run();
  } finally {
    silenced.restore();
  }
};

const doctor = (root) => quietly(() => runDoctor(['--check'], root));

const synced = () => {
  const root = scratch();
  quietly(() => runSync([], root));
  return root;
};

const recordRetiree = (root, onDisk) => {
  const path = join(root, MANIFEST_FILE);
  const manifest = JSON.parse(readFileSync(path, 'utf8'));
  writeFileSync(
    path,
    JSON.stringify({
      ...manifest,
      files: {
        ...manifest.files,
        [RETIRED.path]: hashContent(RETIRED.content),
      },
    }),
  );
  writeAt(root, RETIRED.path, onDisk);
};

const stateOf = (entries, target) =>
  entries.find(({ path }) => path === target)?.state;

const retiredOutcome = (root, { entries, manifest }) => ({
  present: existsSync(join(root, RETIRED.path)),
  recorded: Object.keys(manifest.files),
  state: stateOf(entries, RETIRED.path),
});

const placed = (plan) => plan.map(({ content, path }) => ({ content, path }));

const recordedPaths = (root) =>
  Object.keys(
    JSON.parse(readFileSync(join(root, MANIFEST_FILE), 'utf8')).files,
  );

describe('planSync where two held groups map onto one path', () => {
  test('plans one entry, from the higher rung, whichever asset comes first', () => {
    for (const assets of [
      [LOWER, HIGHER],
      [HIGHER, LOWER],
    ]) {
      const plan = planWith({
        assets,
        config: CONFIG,
        groups: ['lower', 'higher'],
      });
      expect(placed(plan)).toEqual([{ content: HIGHER.content, path: TARGET }]);
    }
  });

  test('plans the lower rung’s asset when the higher group is not held', () => {
    const plan = planWith({
      assets: [LOWER, HIGHER],
      config: CONFIG,
      groups: ['lower'],
    });
    expect(plan.map(({ content }) => content)).toEqual([LOWER.content]);
  });

  test('ranks the groups a profile holds by the rung that places them', () => {
    const plan = planWith({
      assets: [
        { content: 'monorepo copy', path: 'workspace/shared.md' },
        { content: 'repo copy', path: 'root/shared.md' },
      ],
      config: { ...DEFAULT_CONFIG, profile: 'monorepo' },
    });
    expect(placed(plan)).toEqual([
      { content: 'monorepo copy', path: 'shared.md' },
    ]);
  });
});

describe('syncing a tree from a lower rung to a higher one', () => {
  test('updates the superseded file the consumer left untouched', () => {
    const root = scratch();
    const manifest = atLowerRung(root);

    const { entries, manifest: after } = syncTree({
      assets: [LOWER, HIGHER],
      groups: ['lower', 'higher'],
      manifest,
      root,
    });

    expect(entries.map(({ path, state }) => ({ path, state }))).toEqual([
      { path: TARGET, state: 'updated' },
    ]);
    expect(readFileSync(join(root, TARGET), 'utf8')).toBe(HIGHER.content);
    expect(after.files[TARGET]).toBe(hashContent(HIGHER.content));
  });

  test('leaves an edited superseded file modified', () => {
    const root = scratch();
    const manifest = atLowerRung(root);
    writeAt(root, TARGET, 'lower body, edited');

    const { entries, manifest: after } = syncTree({
      assets: [LOWER, HIGHER],
      groups: ['lower', 'higher'],
      manifest,
      root,
    });

    expect(entries.map(({ state }) => state)).toEqual(['modified']);
    expect(readFileSync(join(root, TARGET), 'utf8')).toBe('lower body, edited');
    expect(after.files[TARGET]).toBe(hashContent(LOWER.content));
  });
});

describe('a recorded file no group ships', () => {
  test('is deleted when unmodified, and its record leaves the manifest', () => {
    const root = scratch();
    const run = retireIn(root, recordedRetiree(root, RETIRED.content));

    expect(retiredOutcome(root, run)).toEqual({
      present: false,
      recorded: [TARGET],
      state: 'retired',
    });
  });

  test('is kept and reported when edited, and its record leaves the manifest', () => {
    const root = scratch();
    const { entries, manifest } = retireIn(
      root,
      recordedRetiree(root, 'helper body, edited'),
    );

    expect(entries.find(({ path }) => path === RETIRED.path)?.state).toBe(
      'kept',
    );
    expect(readFileSync(join(root, RETIRED.path), 'utf8')).toBe(
      'helper body, edited',
    );
    expect(Object.keys(manifest.files)).toEqual([TARGET]);
  });

  test('drops the record of one already gone from the tree', () => {
    const root = scratch();
    const { entries, manifest } = retireIn(root, recordedRetiree(root));

    expect(entries.find(({ path }) => path === RETIRED.path)?.state).toBe(
      'retired',
    );
    expect(Object.keys(manifest.files)).toEqual([TARGET]);
  });

  test('is not retired while a group the run does not hold still ships it', () => {
    const plan = planSync({
      assets: [LOWER, { content: 'kept upstream', path: 'higher/extra.md' }],
      config: CONFIG,
      groups: ['lower'],
      kitGroups: ['lower', 'higher'],
      manifest: { files: { 'app/extra.md': hashContent('kept upstream') } },
      onDiskHash: () => hashContent('kept upstream'),
    });
    expect(plan.map(({ path }) => path)).toEqual([TARGET]);
  });
});

describe('doctor --check and a pending retire', () => {
  for (const [label, onDisk, survives] of [
    ['an unmodified', RETIRED.content, false],
    ['an edited', 'helper body, edited', true],
  ]) {
    test(`exits non-zero until sync retires ${label} file`, () => {
      const root = synced();
      const clean = doctor(root);
      recordRetiree(root, onDisk);

      const pending = doctor(root);
      quietly(() => runSync([], root));

      expect({ clean, pending, settled: doctor(root) }).toEqual({
        clean: 0,
        pending: 1,
        settled: 0,
      });
      expect(existsSync(join(root, RETIRED.path))).toBe(survives);
      expect(recordedPaths(root)).not.toContain(RETIRED.path);
    });
  }
});

const HELPER = {
  content: RETIRED.content,
  path: 'lower/routes/example.helper.ts',
};

const FIXTURE_RETIREMENTS = [
  ['monorepo', []],
  ['full', [HELPER.path]],
];

const withHelperAtLowerRung = (root) =>
  syncTree({
    assets: [LOWER, HELPER, HIGHER],
    groups: ['lower'],
    manifest: { files: {} },
    root,
  }).manifest;

const syncAtProfile = ({ manifest, profile, root }) =>
  syncTree({
    assets: [LOWER, HELPER, HIGHER],
    groups: profile === 'full' ? ['lower', 'higher'] : ['lower'],
    manifest,
    retiring: retiredAssetsFor({ profile, retirements: FIXTURE_RETIREMENTS }),
    root,
  });

describe('a path a rung declares it retires', () => {
  test('is declared only while the profile includes that rung', () => {
    expect({
      full: retiredAssetsFor({
        profile: 'full',
        retirements: FIXTURE_RETIREMENTS,
      }),
      monorepo: retiredAssetsFor({
        profile: 'monorepo',
        retirements: FIXTURE_RETIREMENTS,
      }),
    }).toEqual({ full: [HELPER.path], monorepo: [] });
  });

  test('is deleted when unmodified, though a lower group still ships it', () => {
    const root = scratch();
    const run = syncAtProfile({
      manifest: withHelperAtLowerRung(root),
      profile: 'full',
      root,
    });

    expect(retiredOutcome(root, run)).toEqual({
      present: false,
      recorded: [TARGET],
      state: 'retired',
    });
  });

  test('is kept and reported when edited', () => {
    const root = scratch();
    const lower = withHelperAtLowerRung(root);
    writeAt(root, RETIRED.path, 'helper body, edited');

    const { entries } = syncAtProfile({
      manifest: lower,
      profile: 'full',
      root,
    });

    expect(stateOf(entries, RETIRED.path)).toBe('kept');
    expect(readFileSync(join(root, RETIRED.path), 'utf8')).toBe(
      'helper body, edited',
    );
  });

  test('gives way to a file the declaring rung ships at the same path', () => {
    const plan = planSync({
      assets: [LOWER, HIGHER],
      config: CONFIG,
      groups: ['lower', 'higher'],
      kitGroups: ['lower'],
      manifest: { files: { [TARGET]: hashContent(LOWER.content) } },
      onDiskHash: () => hashContent(LOWER.content),
      retiring: [LOWER.path],
    });

    expect(
      plan.map(({ content, path, state }) => ({ content, path, state })),
    ).toEqual([{ content: HIGHER.content, path: TARGET, state: 'updated' }]);
  });

  test('is left alone by a run at a profile below the declaring rung', () => {
    const root = scratch();
    const lower = withHelperAtLowerRung(root);

    const { entries, manifest } = syncAtProfile({
      manifest: lower,
      profile: 'monorepo',
      root,
    });

    expect(stateOf(entries, RETIRED.path)).toBe('current');
    expect(readFileSync(join(root, RETIRED.path), 'utf8')).toBe(HELPER.content);
    expect(manifest.files[RETIRED.path]).toBe(hashContent(HELPER.content));
  });
});
