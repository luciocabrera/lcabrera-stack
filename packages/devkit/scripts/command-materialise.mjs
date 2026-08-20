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
import { declaredPeerNames, installedPeerVersion } from './peer.mjs';
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

/**
 * Peers resolve from THIS package's manifest, not from the consumer's working
 * directory: a peer is satisfied by the tree that installed the kit, so
 * resolving from wherever the command was invoked would report an installed peer
 * as absent whenever `devkit` is run from a subdirectory.
 *
 * The peer is declared in `package.json` as `@repo/repo-standards`, the name
 * that resolves TODAY. It becomes `@lcabrera/repo-standards` when #800 publishes
 * both packages; a peer entry naming the unpublished name would be unresolvable
 * for every consumer until then.
 */
const peerResolutionBase = () => join(packageRoot, 'package.json');

/**
 * Each distinct declared peer resolved ONCE per plan. Both commands read the
 * same plan, so neither can see a version the other did not, and a peer named by
 * twenty assets costs one resolution rather than twenty.
 */
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
    profile === undefined ? configured : { ...configured, profile };
  const manifest = parseManifest(
    readIfPresent(join(root, MANIFEST_FILE)),
    packageVersion(),
  );
  const assets = readAssets();
  const entries = planSync({
    assets,
    config,
    manifest,
    onDiskHash: onDiskHasher(root),
    peerVersions: resolvePeerVersions(assets),
  });
  return { config, entries, manifest };
};

export const nextManifestFor = ({ entries, manifest }) =>
  manifestAfter({ entries, previous: manifest, version: packageVersion() });

/**
 * `unmet` is one state with two remediations, so its wording is chosen from the
 * entry rather than from the state alone: a config key is a line the consumer
 * adds to `devkit.config.json`, a peer is a package they install or upgrade in
 * their own manifest. Splitting the STATE in two would give `sync` and `doctor`
 * two ways to say the same thing; keeping one label would name the file without
 * naming what to do about it.
 */
const UNMET_LABELS = {
  config: 'not written — no config key set for',
  peer: 'not written — no compatible peer for',
};

/**
 * The refusals keep separate wording on purpose. A command the consumer has not
 * mapped, a config key they have not set and a peer they cannot satisfy need
 * three different edits.
 */
const STATE_LABELS = {
  added: 'added',
  conflict: 'left alone — a file you wrote is already there',
  current: 'up to date',
  modified: 'left alone — locally modified',
  restored: 'restored',
  unmet: UNMET_LABELS.config,
  unresolved: 'not written — no command configured for',
  updated: 'updated',
};

/** States whose label is only actionable with the names that produced it. */
const STATES_NAMING_WHAT_IS_MISSING = new Set(['unmet', 'unresolved']);

const labelFor = (entry) =>
  entry.state === 'unmet' && entry.unmetKind === 'peer'
    ? UNMET_LABELS.peer
    : STATE_LABELS[entry.state];

const detailFor = (entry) =>
  STATES_NAMING_WHAT_IS_MISSING.has(entry.state)
    ? `${labelFor(entry)} ${entry.missing.join(', ')}`
    : labelFor(entry);

export const renderPlan = (entries) => {
  const notable = entries.filter(
    (entry) => isWritten(entry.state) || isReported(entry.state),
  );
  if (notable.length === 0) return 'Everything is up to date.';
  return notable
    .map(
      (entry) =>
        `  ${entry.state.padEnd(10)} ${entry.path}  (${detailFor(entry)})`,
    )
    .join('\n');
};

export const countsFor = (entries) => ({
  reported: entries.filter((entry) => isReported(entry.state)).length,
  written: entries.filter((entry) => isWritten(entry.state)).length,
});
