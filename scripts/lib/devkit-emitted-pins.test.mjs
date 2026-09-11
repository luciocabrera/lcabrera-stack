/*
 * The runtime pins `devkit` writes into a new repository are the ones this
 * repository runs on.
 *
 * Both are constants in `workspace.mjs`, because a repository being created has
 * nothing to read them from yet. `deps:refresh` moves the root pins every day
 * and nothing else reached the copies: the Node one was caught by devkit's own
 * blueprint test, the pnpm one was not and shipped a major behind (#1179). This
 * holds each copy to the root, and holds the refresh script to rewriting them.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import {
  NODE_VERSION,
  PACKAGE_MANAGER,
} from '../../packages/devkit/scripts/workspace.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const read = (...segments) =>
  readFileSync(join(REPO_ROOT, ...segments), 'utf8');

describe('the pins devkit emits are the pins this repository runs', () => {
  it('pnpm: the emitted packageManager is the root manifest field, hash included', () => {
    expect(PACKAGE_MANAGER).toBe(
      JSON.parse(read('package.json')).packageManager,
    );
  });

  it('node: the emitted .node-version is the root pin', () => {
    expect(NODE_VERSION).toBe(read('.node-version').trim());
  });
});

describe('deps-refresh.sh carries the emitted pins with the root ones', () => {
  const script = read('scripts', 'deps-refresh.sh');

  it('rewrites the devkit constants after corepack has written the root pin', () => {
    const corepackWrote = script.indexOf('use pnpm@latest');
    const synced = script.indexOf('packages/devkit/scripts/workspace.mjs');

    expect(
      corepackWrote,
      'the corepack call moved or was renamed',
    ).toBeGreaterThan(-1);
    expect(synced, 'the devkit pins are never synced').toBeGreaterThan(-1);
    expect(synced).toBeGreaterThan(corepackWrote);
  });
});
