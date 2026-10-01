#!/usr/bin/env node
/**
 * Move the pins `devkit` ships to the ones this repository runs and publishes.
 *
 * `deps:refresh` moves `.node-version` and the root `packageManager`; the copies
 * in `packages/devkit/scripts/workspace.mjs` only move if something moves them,
 * and `scripts/lib/devkit-emitted-pins.test.mjs` fails until they do (#1179).
 * `release:version` moves the package versions, and every shipped range floor
 * below one is raised to it, which `shipped-ranges:verify` fails on (#1219).
 *
 * Usage (from the repo root): vp run devkit:pins
 *
 * Exit : 0 when every pin and floor matches (whether or not it was rewritten),
 *        1 when a root pin, a constant or a floor cannot be found or raised.
 *
 * Governed by .claude/rules/scripts.md.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { withEmittedPins } from './lib/devkit-pins.mjs';
import { parsePackageManagerPin } from './lib/package-manager-pin.mjs';
import { withRaisedFloors } from './lib/shipped-floors.mjs';
import {
  assetSources,
  constantSources,
  declarationsIn,
  publishedVersions,
} from './lib/shipped-range-sources.mjs';

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

const raisedSources = async () => {
  const versions = publishedVersions(REPO_ROOT);
  const sources = [
    ...assetSources(REPO_ROOT),
    ...(await constantSources(REPO_ROOT)),
  ];

  return sources.map((source) => ({
    next: withRaisedFloors({
      declarations: declarationsIn(source),
      kind: source.kind,
      text: source.text,
      versions,
    }),
    path: source.path,
  }));
};

const raiseFloors = async () => {
  const raised = [];
  for (const { next, path } of await raisedSources()) {
    if (writeIfMoved(join(REPO_ROOT, path), next)) raised.push(path);
  }
  return raised;
};

const syncRuntimePins = () => {
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

const main = async () => {
  syncRuntimePins();
  const raised = await raiseFloors();

  process.stdout.write(
    raised.length === 0
      ? 'sync-devkit-pins: every shipped range already starts at the version this repository publishes\n'
      : `sync-devkit-pins: raised the shipped range floors in ${raised.join(', ')}\n`,
  );
};

try {
  await main();
} catch (error) {
  process.stderr.write(`sync-devkit-pins: ${error.message}\n`);
  process.exitCode = 1;
}
