/*
 * The mode a materialised file lands with.
 *
 * This is the one test in the package that touches a filesystem, and it has to:
 * the failure it pins is a mode, not a value, so a stubbed writer would assert
 * the stub rather than the behaviour. A hook that is not executable is skipped
 * by git without a word — the same clean run as a hook that passed — so nothing
 * else in the tree would report it.
 */

import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, test, vi } from 'vite-plus/test';

import { runDoctor, runSync } from './command-sync.mjs';
import { DEFAULT_CONFIG } from './config.mjs';
import { readFilesUnder } from './files.mjs';
import { hashContent } from './manifest.mjs';
import { applySync, planSync } from './sync.mjs';

const EXECUTABLE_BITS = 0o111;

const ASSETS_DIR = join(
  dirname(dirname(fileURLToPath(import.meta.url))),
  'assets',
);

const scratch = () => mkdtempSync(join(tmpdir(), 'devkit-exec-'));

const plan = (assets, { manifest = { files: {} }, onDiskHash } = {}) =>
  planSync({
    assets,
    config: { ...DEFAULT_CONFIG, profile: 'full' },
    manifest,
    onDiskHash: onDiskHash ?? (() => undefined),
  });

describe('planSync carries the asset mode', () => {
  test('an executable asset plans an executable entry', () => {
    const [entry] = plan([
      { content: '#!/bin/sh\n', executable: true, path: 'hooks/pre-push' },
    ]);
    expect(entry.executable).toBe(true);
  });

  test('an asset with no mode recorded plans a plain file', () => {
    // `executable` is absent on every asset a caller builds by hand — a test, a
    // consumer reaching for `planSync`. Absent must mean plain, not undefined,
    // or `applySync` would chmod on a value it was never given.
    const [entry] = plan([{ content: 'body', path: 'rules/testing.md' }]);
    expect(entry.executable).toBe(false);
  });

  test('a refused entry carries the mode too', () => {
    // Every entry carries it, including one that will never be written, so
    // nothing downstream has to know which states happen to have a mode — the
    // same discipline `onDiskHash` already follows.
    const [entry] = plan([
      {
        content: '{{commands.check}}',
        executable: true,
        path: 'hooks/pre-push',
      },
    ]);
    expect(entry.state).toBe('unresolved');
    expect(entry.executable).toBe(true);
  });
});

describe('applySync honours the mode', () => {
  test('writes an executable entry with its bit set', () => {
    const root = scratch();
    applySync({
      entries: plan([
        {
          content: '#!/bin/sh\nexit 0\n',
          executable: true,
          path: 'hooks/commit-msg',
        },
      ]),
      root,
    });

    const mode = statSync(join(root, '.githooks/commit-msg')).mode;
    expect(mode & EXECUTABLE_BITS).not.toBe(0);
  });

  test('leaves an ordinary entry unexecutable', () => {
    const root = scratch();
    applySync({
      entries: plan([{ content: 'body\n', path: 'rules/testing.md' }]),
      root,
    });

    const mode = statSync(join(root, '.claude/rules/testing.md')).mode;
    expect(mode & EXECUTABLE_BITS).toBe(0);
  });

  test('sets the bit on a hook whose bytes already match', () => {
    // The case `isWritten` does not cover, and the one this feature is FOR: a
    // consumer who unzipped a tarball, copied the tree, or cloned onto a
    // filesystem with no exec bit has the package's exact bytes at mode 0644.
    // `classifyMaterialisation` says `current`, so nothing is written — and the
    // mode is not in the hash, so `sync` says everything is up to date and
    // `doctor` reports nothing while git skips the hook. The chmod keys off
    // `isRecorded`, which is exactly the set whose content is provably ours.
    const root = scratch();
    const path = '.githooks/pre-push';
    const content = '#!/bin/sh\nexit 0\n';
    mkdirSync(join(root, '.githooks'), { recursive: true });
    writeFileSync(join(root, path), content, { mode: 0o644 });

    const entries = plan(
      [{ content, executable: true, path: 'hooks/pre-push' }],
      {
        manifest: { files: {} },
        onDiskHash: () => hashContent(content),
      },
    );
    expect(entries[0].state).toBe('current');
    applySync({ entries, root });

    expect(statSync(join(root, path)).mode & EXECUTABLE_BITS).not.toBe(0);
  });

  test('leaves the mode of a file the consumer owns alone', () => {
    // A `conflict` is a file this kit never wrote. Correcting its mode would be
    // adopting it, which is the one mistake a materialiser cannot undo — so the
    // chmod stops at `isRecorded` rather than running on every entry.
    const root = scratch();
    const path = '.githooks/pre-push';
    mkdirSync(join(root, '.githooks'), { recursive: true });
    writeFileSync(join(root, path), 'the consumer wrote this\n', {
      mode: 0o644,
    });

    const entries = plan(
      [{ content: 'ours\n', executable: true, path: 'hooks/pre-push' }],
      { onDiskHash: () => hashContent('the consumer wrote this\n') },
    );
    expect(entries[0].state).toBe('conflict');
    applySync({ entries, root });

    expect(statSync(join(root, path)).mode & EXECUTABLE_BITS).toBe(0);
  });

  test('sets the bit when updating a hook that is already there', () => {
    // `writeFileSync`'s mode option applies only when it CREATES the file, so an
    // overwrite keeps whatever mode the file had. A consumer whose checkout lost
    // the bit — a clone with core.fileMode off, an unzip, a copy — would take
    // every upstream update and still have a hook git silently skips. This is
    // why the bit is set AFTER the write rather than passed to it.
    const root = scratch();
    const path = '.githooks/commit-msg';
    mkdirSync(join(root, '.githooks'), { recursive: true });
    writeFileSync(join(root, path), 'stale\n', { mode: 0o644 });

    const entries = plan(
      [{ content: 'fresh\n', executable: true, path: 'hooks/commit-msg' }],
      {
        manifest: { files: { [path]: hashContent('stale\n') } },
        onDiskHash: () => hashContent('stale\n'),
      },
    );
    expect(entries[0].state).toBe('updated');
    applySync({ entries, root });

    const mode = statSync(join(root, path)).mode;
    expect(mode & EXECUTABLE_BITS).not.toBe(0);
  });
});

describe('the mode this package ships its hooks with', () => {
  // Everything above tests what happens once `executable` is true. This tests
  // the one input it all reads: the mode the hook files are COMMITTED with.
  // Nothing else in the tree asserts it, and if either is ever recreated,
  // rewritten by a tool, or checked out with core.fileMode off, `executable`
  // reads false, the chmod is skipped, and the consumer receives a hook git
  // skips without a word — a clean `sync` either way.
  const assets = readFilesUnder({ directory: ASSETS_DIR, root: ASSETS_DIR });

  test('every hook is executable', () => {
    const hooks = assets.filter((asset) => asset.path.startsWith('hooks/'));

    expect(hooks.length).toBeGreaterThan(0);
    expect(hooks.filter((hook) => !hook.executable)).toEqual([]);
  });

  test('nothing else is', () => {
    // The other direction, because an accidental chmod on a document is how a
    // consumer ends up with an executable markdown file and no reason for it.
    // A future shipped script outside `hooks/` should fail here and be added
    // deliberately rather than by a mode nobody looked at.
    const stray = assets
      .filter((asset) => !asset.path.startsWith('hooks/'))
      .filter((asset) => asset.executable)
      .map((asset) => asset.path);

    expect(stray).toEqual([]);
  });
});

describe('through the command, not just the applier', () => {
  // The tests above call `applySync` directly, so none of them crosses the
  // caller — and the caller is where the mode repair was cancelled: `runSync`
  // used to skip `applySync` entirely when nothing needed writing, which is
  // precisely the second run of a sync whose files are all `current`. A test
  // that cannot reach that guard cannot tell this working from not working.
  const scratchRepo = () => {
    const root = scratch();
    writeFileSync(
      join(root, 'devkit.config.json'),
      JSON.stringify({
        commands: { check: 'true', install: 'true', test: 'true' },
        profile: 'full',
      }),
    );
    return root;
  };

  test('a second sync puts back a bit the tree lost', () => {
    const root = scratchRepo();
    const hook = join(root, '.githooks/pre-push');
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    runSync([], root);
    expect(statSync(hook).mode & EXECUTABLE_BITS).not.toBe(0);

    // What a clone with core.fileMode off, an unzip, or a copy leaves behind:
    // the right bytes, the wrong mode.
    chmodSync(hook, 0o644);
    runSync([], root);

    expect(statSync(hook).mode & EXECUTABLE_BITS).not.toBe(0);
    log.mockRestore();
  });
});

describe('doctor reads the same set sync wrote', () => {
  // Newly reachable in this change: the two profiles used to name the same
  // groups, so a `doctor` that ignored `--profile` could not disagree with a
  // `sync` that honoured it. Now it can, and the disagreement is silent — every
  // file outside the configured profile is filtered out of the plan before
  // anything counts it, so `--check` exits 0 over a tree it never looked at.
  test('a file deleted from the wider profile is reported under that profile', () => {
    const root = scratch();
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    writeFileSync(
      join(root, 'devkit.config.json'),
      JSON.stringify({
        commands: { check: 'true', install: 'true', test: 'true' },
        profile: 'full',
      }),
    );
    runSync([], root);
    rmSync(join(root, '.githooks/pre-push'));

    expect(runDoctor(['--check', '--profile', 'full'], root)).toBe(1);
    // …and the narrower profile does not place that file at all, so it has
    // nothing to say about it. That is correct, and it is exactly why the two
    // commands have to be asked the same question.
    expect(runDoctor(['--check', '--profile', 'agent'], root)).toBe(0);

    log.mockRestore();
    error.mockRestore();
  });
});
