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

const REPO_COMMANDS = { check: 'true', install: 'true', test: 'true' };

const scratchRepo = (commands = REPO_COMMANDS) => {
  const root = scratch();
  writeFileSync(
    join(root, 'devkit.config.json'),
    JSON.stringify({ commands, profile: 'repo' }),
  );
  return root;
};

const silenced = () => {
  const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  return {
    log,
    restore: () => {
      log.mockRestore();
      error.mockRestore();
    },
  };
};

const plan = (assets, { manifest = { files: {} }, onDiskHash } = {}) =>
  planSync({
    assets,
    config: { ...DEFAULT_CONFIG, profile: 'repo' },
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
    const [entry] = plan([{ content: 'body', path: 'rules/testing.md' }]);
    expect(entry.executable).toBe(false);
  });

  test('a refused entry carries the mode too', () => {
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
  const assets = readFilesUnder({ directory: ASSETS_DIR, root: ASSETS_DIR });

  test('every hook is executable', () => {
    const hooks = assets.filter((asset) => asset.path.startsWith('hooks/'));

    expect(hooks.length).toBeGreaterThan(0);
    expect(hooks.filter((hook) => !hook.executable)).toEqual([]);
  });

  test('nothing else is', () => {
    const stray = assets
      .filter((asset) => !asset.path.startsWith('hooks/'))
      .filter((asset) => asset.executable)
      .map((asset) => asset.path);

    expect(stray).toEqual([]);
  });
});

describe('through the command, not just the applier', () => {
  test('a second sync puts back a bit the tree lost', () => {
    const root = scratchRepo();
    const hook = join(root, '.githooks/pre-push');
    const { restore } = silenced();

    runSync([], root);
    expect(statSync(hook).mode & EXECUTABLE_BITS).not.toBe(0);

    chmodSync(hook, 0o644);
    runSync([], root);

    expect(statSync(hook).mode & EXECUTABLE_BITS).not.toBe(0);
    restore();
  });
});

describe('doctor reads the same set sync wrote', () => {
  test('a file deleted from the wider profile is reported under that profile', () => {
    const root = scratchRepo();
    const { restore } = silenced();

    runSync([], root);
    rmSync(join(root, '.githooks/pre-push'));

    expect(runDoctor(['--check', '--profile', 'repo'], root)).toBe(1);
    expect(runDoctor(['--check', '--profile', 'agent'], root)).toBe(0);

    restore();
  });

  test('a rung above repo reads the same set and says it adds nothing yet', () => {
    const root = scratchRepo({ ...REPO_COMMANDS, audit: 'true' });
    const { log, restore } = silenced();

    runSync([], root);

    expect(runDoctor(['--check', '--profile', 'monorepo'], root)).toBe(0);
    expect(runDoctor(['--check', '--profile', 'full'], root)).toBe(0);
    expect(
      log.mock.calls
        .flat()
        .filter((line) => /places what "repo" places/.test(line)),
    ).toEqual([
      expect.stringMatching(/^The "monorepo" profile/),
      expect.stringMatching(/^The "full" profile/),
    ]);

    rmSync(join(root, '.githooks/pre-push'));
    expect(runDoctor(['--check', '--profile', 'full'], root)).toBe(1);

    restore();
  });
});
