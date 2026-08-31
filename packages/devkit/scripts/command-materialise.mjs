/*
 * The one place sync, doctor and init agree on: read the package's assets and
 * the consumer's state, produce the plan, and — for the two commands that
 * write — apply it and record what was written. All three render the same plan.
 *
 * Applying lives here rather than in each command because `init` is `sync` plus
 * wiring. Written twice, the two drift, and the way that shows up is an `init`
 * whose files a later `doctor` does not recognise: a repository reporting drift
 * on the day it was set up.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ACCEPTED_FILE, parseAccepted } from './accepted.mjs';
import {
  CONFIG_FILE_NAME,
  isExecutableAsset,
  resolveConfig,
  withProfile,
} from './config.mjs';
import { readFilesUnder } from './files.mjs';
import {
  MANIFEST_FILE,
  isAcknowledged,
  isReported,
  isWritten,
  parseManifest,
  serialiseManifest,
} from './manifest.mjs';
import { declaredPeerNames, installedPeerVersion } from './peer.mjs';
import {
  applySync,
  manifestAfter,
  onDiskHasher,
  planSync,
  withAcceptance,
} from './sync.mjs';

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));

const readIfPresent = (path) =>
  existsSync(path) ? readFileSync(path, 'utf8') : undefined;

const packageVersion = () =>
  JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8')).version;

const readAssets = () => {
  const assetsRoot = join(packageRoot, 'assets');
  if (!existsSync(assetsRoot)) return [];
  return readFilesUnder({ directory: assetsRoot, root: assetsRoot }).map(
    (asset) => ({ ...asset, executable: isExecutableAsset(asset.path) }),
  );
};

const peerResolutionBase = () => join(packageRoot, 'package.json');

const resolvePeerVersions = (assets) =>
  new Map(
    declaredPeerNames(assets).map((packageName) => [
      packageName,
      installedPeerVersion({ from: peerResolutionBase(), packageName }),
    ]),
  );

export const buildPlan = ({ profile, root }) => {
  const configured = resolveConfig(readIfPresent(join(root, CONFIG_FILE_NAME)));
  const config =
    profile === undefined
      ? configured
      : withProfile({ config: configured, profile });
  const manifest = parseManifest(
    readIfPresent(join(root, MANIFEST_FILE)),
    packageVersion(),
  );
  const assets = readAssets();
  const accepted = parseAccepted(readIfPresent(join(root, ACCEPTED_FILE)));
  const entries = withAcceptance({
    accepted,
    entries: planSync({
      assets,
      config,
      manifest,
      onDiskHash: onDiskHasher(root),
      peerVersions: resolvePeerVersions(assets),
    }),
  });
  return { accepted, config, entries, manifest };
};

export const nextManifestFor = ({ entries, manifest }) =>
  manifestAfter({ entries, previous: manifest, version: packageVersion() });

export const applyPlan = ({ entries, manifest, root }) => {
  applySync({ entries, root });

  const updated = serialiseManifest(nextManifestFor({ entries, manifest }));
  if (updated !== serialiseManifest(manifest)) {
    writeFileSync(join(root, MANIFEST_FILE), updated);
  }
};

const UNMET_LABELS = {
  config: 'not written — no config key set for',
  peer: 'not written — no compatible peer for',
};

const STATE_LABELS = {
  acknowledged: 'left alone — acknowledged',
  added: 'added',
  conflict: 'left alone — a file you wrote is already there',
  current: 'up to date',
  modified: 'left alone — locally modified',
  restored: 'restored',
  unmet: UNMET_LABELS.config,
  unresolved: 'not written — no command configured for',
  updated: 'updated',
};

const STATE_COLUMN_WIDTH = Math.max(
  ...Object.keys(STATE_LABELS).map((state) => state.length),
);

const STATES_NAMING_WHAT_IS_MISSING = new Set(['unmet', 'unresolved']);

const labelFor = (entry) =>
  entry.state === 'unmet' && entry.unmetKind === 'peer'
    ? UNMET_LABELS.peer
    : STATE_LABELS[entry.state];

const detailFor = (entry) => {
  if (STATES_NAMING_WHAT_IS_MISSING.has(entry.state)) {
    return `${labelFor(entry)} ${entry.missing.join(', ')}`;
  }
  if (isAcknowledged(entry.state)) {
    return `${labelFor(entry)}: ${entry.reason}`;
  }
  return labelFor(entry);
};

export const renderPlan = (entries, { verbose = false } = {}) => {
  const notable = entries.filter(
    (entry) =>
      isWritten(entry.state) ||
      isReported(entry.state) ||
      (verbose && isAcknowledged(entry.state)),
  );
  if (notable.length === 0) return 'Everything is up to date.';
  return notable
    .map(
      (entry) =>
        `  ${entry.state.padEnd(STATE_COLUMN_WIDTH)} ${entry.path}  (${detailFor(entry)})`,
    )
    .join('\n');
};

export const countsFor = (entries) => ({
  reported: entries.filter((entry) => isReported(entry.state)).length,
  written: entries.filter((entry) => isWritten(entry.state)).length,
});
