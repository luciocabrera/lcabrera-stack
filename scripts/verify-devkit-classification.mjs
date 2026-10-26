/**
 * Fails when a file `packages/devkit` ships has no row in its
 * `CLASSIFICATION.md`, or a row names a path that no longer ships. Without it a
 * new asset arrives unclassified and reads exactly like one that was weighed.
 *
 * The deciding half is `./lib/devkit-classification.mjs` (pure); this file is
 * the reading, the printing and the exit code. See `.claude/rules/scripts.md`.
 *
 * Usage: node scripts/verify-devkit-classification.mjs
 * Exit codes: 0 = every shipped file is covered and every row path ships,
 * 1 = otherwise.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import process from 'node:process';

import {
  assetPatternsIn,
  coverageReport,
} from './lib/devkit-classification.mjs';

const DEVKIT_DIR = join(process.cwd(), 'packages', 'devkit');
const ASSETS_DIR = join(DEVKIT_DIR, 'assets');
const CLASSIFICATION = join(DEVKIT_DIR, 'CLASSIFICATION.md');

const shippedAssets = () =>
  readdirSync(ASSETS_DIR, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) =>
      relative(ASSETS_DIR, join(entry.parentPath, entry.name))
        .split(sep)
        .join('/'),
    );

const main = () => {
  const assets = shippedAssets();
  const patterns = assetPatternsIn(readFileSync(CLASSIFICATION, 'utf8'));
  const { stale, uncovered } = coverageReport({ assets, patterns });

  for (const path of uncovered) {
    console.error(`  assets/${path}  has no row in CLASSIFICATION.md`);
  }
  for (const pattern of stale) {
    console.error(`  \`${pattern}\`  is a row path no shipped file matches`);
  }

  if (uncovered.length > 0 || stale.length > 0) {
    console.error(
      '\nEvery shipped file needs a verdict row, and every row path has to name a file that ships.',
    );
    process.exitCode = 1;
    return;
  }

  console.log(
    `Classification gate passed: ${assets.length} shipped file(s) covered by ${patterns.length} row path(s).`,
  );
};

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
