#!/usr/bin/env node
/**
 * Consume the changesets, then raise the range floors `devkit` ships to the
 * versions they produced. A raised floor reaches nobody until `devkit`
 * publishes, so when the changesets did not move devkit this writes a devkit
 * patch changeset naming the raised floors and versions once more (#1226).
 * An empty queue is not an error: nothing is versioned, and the floors are
 * still raised to the versions the tree already holds.
 *
 * Usage (from the repo root): vp run release:version
 *
 * Exit : 0 when every shipped floor starts at a version the tree holds,
 *        whether or not any changeset was queued,
 *        1 when `changeset version` failed or a floor could not be raised.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import process from 'node:process';

import { getReleasePlan } from '@changesets/get-release-plan';

import { floorChangeset } from './lib/shipped-floors.mjs';
import { raiseShippedFloors } from './lib/shipped-range-sources.mjs';

const ROOT = process.cwd();

const DEVKIT_PACKAGE = '@lcabrera/devkit';

const DEVKIT_MANIFEST = join(ROOT, 'packages', 'devkit', 'package.json');

const FLOOR_CHANGESET = join(ROOT, '.changeset', 'devkit-shipped-floors.md');

const CHANGESET_BIN = createRequire(import.meta.url).resolve(
  '@changesets/cli/bin.js',
);

const devkitVersion = () =>
  JSON.parse(readFileSync(DEVKIT_MANIFEST, 'utf8')).version;

const hasQueuedChangesets = async () => {
  const { changesets, preState } = await getReleasePlan(ROOT);
  return changesets.length > 0 || preState?.mode === 'exit';
};

const changesetVersion = () => {
  const result = spawnSync(process.execPath, [CHANGESET_BIN, 'version'], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    throw new Error(`\`changeset version\` exited ${result.status}`);
  }
};

const publishRaisedFloors = (raised) => {
  writeFileSync(
    FLOOR_CHANGESET,
    floorChangeset({ packageName: DEVKIT_PACKAGE, raised }),
  );
  changesetVersion();

  const again = raiseShippedFloors(ROOT);
  if (again.length > 0) {
    throw new Error(
      `versioning ${DEVKIT_PACKAGE} moved more floors (${again.map(({ name }) => name).join(', ')}), which no published release would carry`,
    );
  }
};

const main = async () => {
  const before = devkitVersion();
  if (await hasQueuedChangesets()) {
    changesetVersion();
  } else {
    process.stdout.write('release-version: no changeset is queued\n');
  }

  const raised = raiseShippedFloors(ROOT);
  if (raised.length > 0 && devkitVersion() === before) {
    publishRaisedFloors(raised);
  }

  process.stdout.write(
    raised.length === 0
      ? `release-version: no shipped floor moved; ${DEVKIT_PACKAGE} is at ${devkitVersion()}\n`
      : `release-version: raised ${raised.length} shipped floor(s); ${DEVKIT_PACKAGE} ships them at ${devkitVersion()}\n`,
  );
};

try {
  await main();
} catch (error) {
  process.stderr.write(`release-version: ${error.message}\n`);
  process.exitCode = 1;
}
