/*
 * A recorded path holding something other than a readable regular file, and a
 * plan built without the filesystem probes a real run passes: neither may read
 * a node that blocks, nor delete what it cannot compare.
 *
 * Usage: `vp run test` in this workspace; exits non-zero on a failing case.
 */

import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, test } from 'vite-plus/test';

import { renderPlan } from './command-materialise.mjs';
import { hashContent } from './manifest.mjs';
import {
  RETIREMENT_CONFIG as CONFIG,
  LOWER,
  scratchRepositories,
  syncRecord,
  VICTIM,
} from './retirement-fixtures.mjs';
import { destinationIn, nodeKindIn } from './retirement.mjs';
import { applySync, onDiskHasher, planSync } from './sync.mjs';

const { drain, scratchRepository } = scratchRepositories();

afterEach(drain);

const IS_ROOT_USER = process.getuid?.() === 0;

const keptOutcome = ({ path, root }) => ({
  ...syncRecord({ path, root }),
  survives: existsSync(join(root, path)),
});

describe('a recorded path that holds something unreadable', () => {
  test('is kept, not retired, when a directory is there now', () => {
    const { root } = scratchRepository();
    mkdirSync(join(root, 'stale'));
    writeFileSync(join(root, 'stale', 'inside.txt'), 'consumer content');

    expect(keptOutcome({ path: 'stale', root })).toEqual({
      hashed: false,
      recorded: false,
      state: 'kept',
      survives: true,
    });
  });

  test.skipIf(IS_ROOT_USER)(
    'is kept, not retired, when the file cannot be read (skipped as root, which reads any mode)',
    () => {
      const { root } = scratchRepository();
      writeFileSync(join(root, 'locked.txt'), VICTIM);
      chmodSync(join(root, 'locked.txt'), 0o000);

      expect(keptOutcome({ path: 'locked.txt', root })).toEqual({
        hashed: true,
        recorded: false,
        state: 'kept',
        survives: true,
      });
    },
  );

  test('is retired when nothing is there at all', () => {
    const { root } = scratchRepository();

    expect(keptOutcome({ path: 'missing.txt', root })).toEqual({
      hashed: false,
      recorded: false,
      state: 'retired',
      survives: false,
    });
  });
});

const HAS_MKFIFO =
  process.platform !== 'win32' &&
  spawnSync('mkfifo', ['--version'], { encoding: 'utf8' }).error === undefined;

const PLAN_IN_A_CHILD = `
import { pathToFileURL } from 'node:url';
const [scripts, root, path, probe] = process.argv.slice(1);
const load = (name) => import(pathToFileURL(scripts + '/' + name).href);
const { DEFAULT_CONFIG } = await load('config.mjs');
const { hashContent } = await load('manifest.mjs');
const { destinationIn, nodeKindIn } = await load('retirement.mjs');
const { onDiskHasher, planSync } = await load('sync.mjs');
const entries = planSync({
  assets: [{ content: 'lower body', path: 'lower/kept.md' }],
  config: { ...DEFAULT_CONFIG, paths: { ...DEFAULT_CONFIG.paths, lower: 'app' } },
  destinationOf: destinationIn(root),
  groups: ['lower'],
  ...(probe === 'real' && { kindOf: nodeKindIn(root) }),
  kitGroups: ['lower'],
  manifest: { files: { [path]: hashContent('victim body') } },
  onDiskHash: onDiskHasher(root),
});
process.stdout.write(entries.find((entry) => entry.path === path)?.state ?? '');
`;

const fifoPlanState = (probe) => {
  const { root } = scratchRepository();
  spawnSync('mkfifo', [join(root, 'pipe')]);
  const child = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '--eval',
      PLAN_IN_A_CHILD,
      dirname(fileURLToPath(import.meta.url)),
      root,
      'pipe',
      probe,
    ],
    { encoding: 'utf8', timeout: 3000 },
  );
  return { signal: child.signal, state: child.stdout };
};

describe('a recorded path that holds a FIFO', () => {
  for (const probe of ['real', 'default']) {
    test.skipIf(!HAS_MKFIFO)(
      `is kept without being opened with the ${probe} node-kind probe, so the plan finishes (skipped where mkfifo is unavailable)`,
      () => {
        expect(fifoPlanState(probe)).toEqual({ signal: null, state: 'kept' });
      },
    );
  }
});

describe('planSync without a destination probe', () => {
  test('never deletes a file a record reaches through a symlinked directory', () => {
    const { parent, root } = scratchRepository();
    symlinkSync(parent, join(root, 'linked'), 'dir');
    const entries = planSync({
      assets: [LOWER],
      config: CONFIG,
      groups: ['lower'],
      kindOf: nodeKindIn(root),
      kitGroups: ['lower'],
      manifest: { files: { 'linked/victim.txt': hashContent(VICTIM) } },
      onDiskHash: onDiskHasher(root),
    });
    applySync({ entries, root });

    expect({
      state: entries.find((entry) => entry.path === 'linked/victim.txt')?.state,
      survives: existsSync(join(parent, 'victim.txt')),
    }).toEqual({ state: 'outside', survives: true });
  });
});

describe('planSync without a node-kind probe', () => {
  test.skipIf(IS_ROOT_USER)(
    'keeps an unreadable recorded file rather than deleting it (skipped as root, which reads any mode)',
    () => {
      const { root } = scratchRepository();
      writeFileSync(join(root, 'locked.txt'), VICTIM);
      chmodSync(join(root, 'locked.txt'), 0o000);
      const entries = planSync({
        assets: [LOWER],
        config: CONFIG,
        destinationOf: destinationIn(root),
        groups: ['lower'],
        kitGroups: ['lower'],
        manifest: { files: { 'locked.txt': hashContent(VICTIM) } },
        onDiskHash: onDiskHasher(root),
      });
      applySync({ entries, root });

      expect({
        state: entries.find((entry) => entry.path === 'locked.txt')?.state,
        survives: existsSync(join(root, 'locked.txt')),
      }).toEqual({ state: 'kept', survives: true });
    },
  );
});

const keptLine = ({ path, root }) =>
  renderPlan(
    planSync({
      assets: [LOWER],
      config: CONFIG,
      destinationOf: destinationIn(root),
      groups: ['lower'],
      kindOf: nodeKindIn(root),
      kitGroups: ['lower'],
      manifest: { files: { [path]: hashContent(VICTIM) } },
      onDiskHash: onDiskHasher(root),
    }),
  )
    .split('\n')
    .find((line) => line.includes(path));

describe('the line a kept record prints', () => {
  test('says the file was modified when it was edited', () => {
    const { root } = scratchRepository();
    writeFileSync(join(root, 'edited.txt'), 'edited');

    expect(keptLine({ path: 'edited.txt', root })).toContain(
      'left alone — locally modified, and this version no longer ships it',
    );
  });

  test('says it is not a regular file when a directory is there', () => {
    const { root } = scratchRepository();
    mkdirSync(join(root, 'stale'));

    expect(keptLine({ path: 'stale', root })).toContain(
      'left alone — not a regular file, and this version no longer ships it',
    );
  });

  test.skipIf(IS_ROOT_USER)(
    'says it could not be read when the file has no read permission (skipped as root, which reads any mode)',
    () => {
      const { root } = scratchRepository();
      writeFileSync(join(root, 'locked.txt'), VICTIM);
      chmodSync(join(root, 'locked.txt'), 0o000);

      expect(keptLine({ path: 'locked.txt', root })).toContain(
        'left alone — could not be read, and this version no longer ships it',
      );
    },
  );
});
