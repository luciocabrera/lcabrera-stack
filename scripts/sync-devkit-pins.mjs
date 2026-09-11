#!/usr/bin/env node
/**
 * Move the runtime pins `devkit` emits to the ones this repository runs.
 *
 * `deps:refresh` moves `.node-version` and the root `packageManager`; the copies
 * in `packages/devkit/scripts/workspace.mjs` only move if something moves them,
 * and `scripts/lib/devkit-emitted-pins.test.mjs` fails until they do (#1179).
 *
 * Usage (from the repo root):
 *   node scripts/sync-devkit-pins.mjs
 *
 * Exit : 0 when the constants match the root pins (whether or not they were
 *        rewritten), 1 when a root pin or a constant cannot be found.
 *
 * Governed by .claude/rules/scripts.md.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { withEmittedPins } from './lib/devkit-pins.mjs';
import { parsePackageManagerPin } from './lib/package-manager-pin.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const DEVKIT = join(REPO_ROOT, 'packages', 'devkit');

const WORKSPACE_MODULE = join(DEVKIT, 'scripts', 'workspace.mjs');

const BLUEPRINT_NODE_VERSION = join(
  DEVKIT,
  'assets',
  'workspace',
  '.node-version',
);

const readRootPins = () => {
  const nodeVersion = readFileSync(
    join(REPO_ROOT, '.node-version'),
    'utf8',
  ).trim();
  const { packageManager } = JSON.parse(
    readFileSync(join(REPO_ROOT, 'package.json'), 'utf8'),
  );

  if (nodeVersion === '') {
    throw new Error('.node-version is empty');
  }
  if (parsePackageManagerPin(packageManager) === null) {
    throw new Error(
      `package.json has no usable packageManager pin: ${JSON.stringify(packageManager)}`,
    );
  }

  return { nodeVersion, packageManager };
};

const writeIfMoved = (path, next) => {
  const current = readFileSync(path, 'utf8');
  if (current === next) return false;
  writeFileSync(path, next);
  return true;
};

const main = () => {
  const pins = readRootPins();
  const moved = [
    writeIfMoved(
      WORKSPACE_MODULE,
      withEmittedPins({
        ...pins,
        source: readFileSync(WORKSPACE_MODULE, 'utf8'),
      }),
    ),
    writeIfMoved(BLUEPRINT_NODE_VERSION, `${pins.nodeVersion}\n`),
  ].some(Boolean);

  process.stdout.write(
    `sync-devkit-pins: devkit ${moved ? 'now emits' : 'already emits'} node ${pins.nodeVersion} and ${pins.packageManager}\n`,
  );
};

try {
  main();
} catch (error) {
  process.stderr.write(`sync-devkit-pins: ${error.message}\n`);
  process.exitCode = 1;
}
