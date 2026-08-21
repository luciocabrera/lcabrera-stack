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

/**
 * The shipped files, addressed by their group-prefixed path.
 *
 * The mode is decided here rather than read off the file, because the file's own
 * mode is gone by the time a consumer sees it — see `isExecutableAsset`. Reading
 * it from disk worked in this repository and in no installed copy of the
 * package, which is the one shape of failure nothing here could observe.
 */
const readAssets = () => {
  const assetsRoot = join(packageRoot, 'assets');
  if (!existsSync(assetsRoot)) return [];
  return readFilesUnder({ directory: assetsRoot, root: assetsRoot }).map(
    (asset) => ({ ...asset, executable: isExecutableAsset(asset.path) }),
  );
};

/**
 * Peers resolve from THIS package's manifest, not from the consumer's working
 * directory: a peer is satisfied by the tree that installed the kit, so
 * resolving from wherever the command was invoked would report an installed peer
 * as absent whenever `devkit` is run from a subdirectory.
 *
 * The peer is declared in `package.json` as `@lcabrera/repo-standards`, the name
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
  // Validated rather than spread in: `groupsFor` answers `[]` for a profile it
  // does not know, so a typo would place nothing and every command would report
  // success — the same clean run as a repository with nothing left to do.
  const config =
    profile === undefined
      ? configured
      : withProfile({ config: configured, profile });
  const manifest = parseManifest(
    readIfPresent(join(root, MANIFEST_FILE)),
    packageVersion(),
  );
  const assets = readAssets();
  // Acceptance is applied here rather than in either command, so `sync` and
  // `doctor` cannot disagree about which edits are quiet — the same reason the
  // peer resolution below happens once, here, rather than per command.
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

/**
 * Write what the plan says, then record it.
 *
 * `applySync` is called unconditionally, and the record is written even when no
 * content was: a file already identical to the package is adopted into the
 * record, and without that a later edit to one reads as an untracked file rather
 * than as drift. The mode is `applySync`'s to decide for the same reason — a
 * hook whose bytes still match is `current`, so gating the call on there being
 * something to write silently stopped restoring its executable bit.
 */
export const applyPlan = ({ entries, manifest, root }) => {
  applySync({ entries, root });

  const updated = serialiseManifest(nextManifestFor({ entries, manifest }));
  if (updated !== serialiseManifest(manifest)) {
    writeFileSync(join(root, MANIFEST_FILE), updated);
  }
};

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

/**
 * The state column is as wide as the longest state there is, computed from the
 * vocabulary rather than written down. A literal width is a guess that the next
 * state name outgrows — `acknowledged` outgrew the last one, and every row after
 * it sat two characters out of line. `STATE_LABELS` is the right thing to
 * measure because a state without a label already renders `undefined`, so no
 * state can reach here without passing through it.
 */
const STATE_COLUMN_WIDTH = Math.max(
  ...Object.keys(STATE_LABELS).map((state) => state.length),
);

/** States whose label is only actionable with the names that produced it. */
const STATES_NAMING_WHAT_IS_MISSING = new Set(['unmet', 'unresolved']);

const labelFor = (entry) =>
  entry.state === 'unmet' && entry.unmetKind === 'peer'
    ? UNMET_LABELS.peer
    : STATE_LABELS[entry.state];

const detailFor = (entry) => {
  if (STATES_NAMING_WHAT_IS_MISSING.has(entry.state)) {
    return `${labelFor(entry)} ${entry.missing.join(', ')}`;
  }
  // The reason travels with the listing because an acknowledgement nobody can
  // read is one nobody can revisit, and revisiting it is the only way it ever
  // gets removed.
  if (isAcknowledged(entry.state)) {
    return `${labelFor(entry)}: ${entry.reason}`;
  }
  return labelFor(entry);
};

/**
 * The default report is the actionable one: an acknowledged edit is deliberate,
 * so repeating it every run is the noise acknowledgement exists to remove.
 * `--verbose` brings it back with its reason, so quiet never means gone.
 */
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
