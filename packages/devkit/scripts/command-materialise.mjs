/*
 * The one place sync and doctor agree on: read the package's assets and the
 * consumer's state, and produce the plan. Both commands render the same plan;
 * only one of them writes.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CONFIG_FILE_NAME, resolveConfig } from './config.mjs';
import { readFilesUnder } from './files.mjs';
import {
  MANIFEST_FILE,
  isReported,
  isWritten,
  parseManifest,
} from './manifest.mjs';
import { manifestAfter, onDiskHasher, planSync } from './sync.mjs';

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));

const readIfPresent = (path) =>
  existsSync(path) ? readFileSync(path, 'utf8') : undefined;

const packageVersion = () =>
  JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8')).version;

/** The shipped files, addressed by their group-prefixed path. */
const readAssets = () => {
  const assetsRoot = join(packageRoot, 'assets');
  if (!existsSync(assetsRoot)) return [];
  return readFilesUnder({ directory: assetsRoot, root: assetsRoot });
};

export const buildPlan = ({ profile, root }) => {
  const configured = resolveConfig(readIfPresent(join(root, CONFIG_FILE_NAME)));
  const config =
    profile === undefined ? configured : { ...configured, profile };
  const manifest = parseManifest(
    readIfPresent(join(root, MANIFEST_FILE)),
    packageVersion(),
  );
  const entries = planSync({
    assets: readAssets(),
    config,
    manifest,
    onDiskHash: onDiskHasher(root),
  });
  return { config, entries, manifest };
};

export const nextManifestFor = ({ entries, manifest }) =>
  manifestAfter({ entries, previous: manifest, version: packageVersion() });

const STATE_LABELS = {
  added: 'added',
  conflict: 'left alone — a file you wrote is already there',
  current: 'up to date',
  modified: 'left alone — locally modified',
  restored: 'restored',
  updated: 'updated',
};

export const renderPlan = (entries) => {
  const notable = entries.filter(
    (entry) => isWritten(entry.state) || isReported(entry.state),
  );
  if (notable.length === 0) return 'Everything is up to date.';
  return notable
    .map(
      (entry) =>
        `  ${entry.state.padEnd(9)} ${entry.path}  (${STATE_LABELS[entry.state]})`,
    )
    .join('\n');
};

export const countsFor = (entries) => ({
  reported: entries.filter((entry) => isReported(entry.state)).length,
  written: entries.filter((entry) => isWritten(entry.state)).length,
});
