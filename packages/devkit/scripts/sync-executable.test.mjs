/*
 * The mode a materialised file lands with.
 *
 * This is the one test in the package that touches a filesystem, and it has to:
 * the failure it pins is a mode, not a value, so a stubbed writer would assert
 * the stub rather than the behaviour. A hook that is not executable is skipped
 * by git without a word — the same clean run as a hook that passed — so nothing
 * else in the tree would report it.
 */

import { mkdirSync, mkdtempSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, test } from 'vite-plus/test';

import { DEFAULT_CONFIG } from './config.mjs';
import { hashContent } from './manifest.mjs';
import { applySync, planSync } from './sync.mjs';

const EXECUTABLE_BITS = 0o111;

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
