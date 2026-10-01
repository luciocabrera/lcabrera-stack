/*
 * Every `paths.*` base names a directory inside the repository by one
 * spelling. A base that climbs, is absolute, or carries a `..` segment could
 * name the directory another base names, so every command refuses the config
 * and says which key.
 *
 * Usage: `vp run test` in this workspace; exits non-zero on a failing case.
 */

import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, test } from 'vite-plus/test';

import { CONFIG_FILE_NAME, DEFAULT_CONFIG, resolveConfig } from './config.mjs';
import { hashContent } from './manifest.mjs';
import { destinationIn, nodeKindIn } from './retirement.mjs';
import {
  applySync,
  manifestAfter,
  onDiskHasher,
  onDiskReader,
  planSync,
} from './sync.mjs';

const DEVKIT = join(dirname(fileURLToPath(import.meta.url)), 'devkit.mjs');

const scratches = [];

afterEach(() => {
  const drained = [...scratches];
  scratches.length = 0;
  for (const path of drained) rmSync(path, { force: true, recursive: true });
});

const configWith = (paths) => JSON.stringify({ paths });

const scratch = () => {
  const root = mkdtempSync(join(tmpdir(), 'devkit-paths-'));
  scratches.push(root);
  return root;
};

describe('a paths base', () => {
  const REFUSED = {
    'a ".." segment that stays inside': 'app/sub/..',
    'a git-expanded prefix': '~/skills',
    'an absolute path': '/srv/skills',
    'a parent-relative path': '../outside',
  };

  for (const [label, base] of Object.entries(REFUSED)) {
    test(`is refused, naming its key, when it is ${label}`, () => {
      expect(() => resolveConfig(configWith({ skills: base }))).toThrow(
        /"paths\.skills" must be a directory inside the repository/,
      );
    });
  }

  test('is accepted when it is the root or a plain relative directory', () => {
    const config = resolveConfig(
      configWith({ root: '.', skills: 'kit/skills' }),
    );
    expect([config.paths.root, config.paths.skills]).toEqual([
      '.',
      'kit/skills',
    ]);
  });

  for (const argv of [['sync'], ['doctor', '--check'], ['init', '--force']]) {
    test(`makes devkit ${argv.join(' ')} refuse the config`, () => {
      const root = scratch();
      mkdirSync(join(root, '.git'));
      writeFileSync(
        join(root, CONFIG_FILE_NAME),
        configWith({ skills: 'app/sub/..' }),
      );

      const { status, stderr } = spawnSync(
        process.execPath,
        [DEVKIT, ...argv],
        {
          cwd: root,
          encoding: 'utf8',
        },
      );

      expect({ named: stderr.includes('"paths.skills"'), status }).toEqual({
        named: true,
        status: 1,
      });
    });
  }
});

describe('two bases reaching one directory', () => {
  test('plan one entry, from the higher rung, through an in-repository symlinked directory', () => {
    const root = scratch();
    mkdirSync(join(root, 'app'));
    symlinkSync(join(root, 'app'), join(root, 'alias'), 'dir');

    const plan = planSync({
      assets: [
        { content: 'lower body', path: 'lower/routes/example.tsx' },
        { content: 'higher body', path: 'higher/routes/example.tsx' },
      ],
      config: {
        ...DEFAULT_CONFIG,
        paths: { ...DEFAULT_CONFIG.paths, higher: 'alias', lower: 'app' },
      },
      destinationOf: destinationIn(root),
      groups: ['lower', 'higher'],
      manifest: { files: {} },
      onDiskHash: () => undefined,
    });

    expect(plan.map(({ content, path }) => ({ content, path }))).toEqual([
      { content: 'higher body', path: 'alias/routes/example.tsx' },
    ]);
  });
});

const ALIASED = {
  config: {
    ...DEFAULT_CONFIG,
    paths: { ...DEFAULT_CONFIG.paths, higher: 'alias', lower: 'app' },
  },
  higher: { content: 'higher body', path: 'higher/routes/example.tsx' },
  lower: { content: 'lower body', path: 'lower/routes/example.tsx' },
};

const syncAliased = ({ groups, manifest, root }) => {
  const entries = planSync({
    assets: [ALIASED.lower, ALIASED.higher],
    config: ALIASED.config,
    destinationOf: destinationIn(root),
    groups,
    kindOf: nodeKindIn(root),
    kitGroups: ['lower'],
    manifest,
    onDiskContent: onDiskReader(root),
    onDiskHash: onDiskHasher(root),
  });
  applySync({ entries, root });
  return {
    manifest: manifestAfter({ entries, previous: manifest, version: '0' }),
    states: entries.map(({ path, state }) => `${state} ${path}`),
  };
};

describe('a tree moving up a rung through a symlinked base', () => {
  test('updates the lower file under one record, and is current after', () => {
    const root = scratch();
    mkdirSync(join(root, 'app'));
    symlinkSync(join(root, 'app'), join(root, 'alias'), 'dir');
    const lower = syncAliased({
      groups: ['lower'],
      manifest: { files: {} },
      root,
    });

    const moved = syncAliased({
      groups: ['lower', 'higher'],
      manifest: lower.manifest,
      root,
    });
    const again = syncAliased({
      groups: ['lower', 'higher'],
      manifest: moved.manifest,
      root,
    });

    expect({
      again: again.states,
      content: readFileSync(join(root, 'app/routes/example.tsx'), 'utf8'),
      moved: moved.states,
      records: moved.manifest.files,
    }).toEqual({
      again: ['current alias/routes/example.tsx'],
      content: 'higher body',
      moved: ['updated alias/routes/example.tsx'],
      records: { 'alias/routes/example.tsx': hashContent('higher body') },
    });
  });
});
