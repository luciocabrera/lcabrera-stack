/*
 * Which rung each command places when no `--profile` is given.
 *
 * `create` and `init` share the flag and not the default: `create` writes into
 * an empty directory, so its default is the rung that leaves a workspace, while
 * `init` writes into a repository that already exists and keeps the smallest
 * one. Both are asserted against a real tree and a real git, because the claim
 * is about what lands on disk and what a later `sync` makes of it.
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
import { join } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vite-plus/test';

import { runCreate } from './command-create.mjs';
import { runInit } from './command-init.mjs';
import { runDoctor, runSync } from './command-sync.mjs';
import { runGit } from './git-exec.mjs';
import { silencedConsole } from './test-fixtures.mjs';

const scratches = [];

const scratch = () => {
  const root = mkdtempSync(join(tmpdir(), 'devkit-default-profile-'));
  scratches.push(root);
  return root;
};

const git = (args, cwd) => runGit({ args, cwd });

const quietly = (run) => {
  const silenced = silencedConsole(vi);
  try {
    return run();
  } finally {
    silenced.restore();
  }
};

const created = (argv) => {
  const parent = scratch();
  const code = quietly(() => runCreate(['demo', ...argv], parent));
  return { code, root: join(parent, 'demo') };
};

const configuredProfile = (root) =>
  JSON.parse(readFileSync(join(root, 'devkit.config.json'), 'utf8')).profile;

afterEach(() => {
  const drained = [...scratches];
  scratches.length = 0;
  for (const root of drained) {
    rmSync(root, { force: true, recursive: true });
  }
});

describe('devkit create with no --profile', () => {
  test('commits the same tree as --profile monorepo', () => {
    const unflagged = created([]);
    const flagged = created(['--profile', 'monorepo']);

    expect(unflagged.code).toBe(0);
    expect(flagged.code).toBe(0);
    expect(existsSync(join(unflagged.root, 'pnpm-workspace.yaml'))).toBe(true);
    expect(git(['ls-files', '--stage'], unflagged.root)).toBe(
      git(['ls-files', '--stage'], flagged.root),
    );
  });

  test('records the rung it used, so a later sync keeps to it', () => {
    const { root } = created([]);

    expect(configuredProfile(root)).toBe('monorepo');
    expect(quietly(() => runSync([], root))).toBe(0);
    expect(git(['status', '--porcelain'], root)).toBe('');
    expect(quietly(() => runDoctor(['--check'], root))).toBe(0);
  });
});

describe('devkit init with no --profile', () => {
  test('still places the agent rung in a repository that exists', () => {
    const root = join(scratch(), 'existing');
    mkdirSync(root);
    git(['init', '--quiet', '.'], root);
    writeFileSync(
      join(root, 'package.json'),
      `${JSON.stringify({ name: 'existing', private: true }, undefined, 2)}\n`,
    );

    expect(quietly(() => runInit([], root))).toBe(0);
    expect(configuredProfile(root)).toBe('agent');
    expect(existsSync(join(root, 'pnpm-workspace.yaml'))).toBe(false);
    expect(existsSync(join(root, '.githooks'))).toBe(false);
    expect(existsSync(join(root, '.github', 'skills'))).toBe(true);
  });
});
