/*
 * Deciding what a sync would do, and then doing it.
 *
 * The planning half is pure and the writing half is a thin shell over it, so
 * `sync` and `doctor` are the same decision with and without the writes —
 * a doctor that computed its answer differently from the command it predicts
 * would be worse than no doctor at all.
 */

import { chmodSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { acceptedEntry, isAccepted } from './accepted.mjs';
import { groupsFor, hasConfigKey, targetPathFor } from './config.mjs';
import { requiredConfigKeys, requiredPeers } from './frontmatter.mjs';
import { unmetPeers } from './peer.mjs';
import { substituteCommands } from './placeholders.mjs';
import {
  isAcknowledgeable,
  ACKNOWLEDGED_STATE,
  classifyMaterialisation,
  hashContent,
  isRecorded,
  isWritten,
  nextManifest,
} from './manifest.mjs';

/**
 * What a file declares and this consumer cannot honour, or `undefined` when
 * there is nothing in the way.
 *
 * Both declarations are checked BEFORE substitution because a declared
 * requirement is the wider failure: substituting would report only the keys the
 * file happens to interpolate. A file is refused for the FIRST reason it cannot
 * be honoured rather than for the most visible one, so the order here is the
 * order the consumer is asked to fix things in.
 *
 * One state carries both, because both have the same outcome — nothing written,
 * nothing recorded. The kind travels with the entry only so the report can name
 * the right remediation: a line in `devkit.config.json`, or a package in the
 * consumer's own dependencies.
 */
const unmetDeclaration = ({ content, config, peerVersions }) => {
  const keys = requiredConfigKeys(content).filter(
    (key) => !hasConfigKey({ config, path: key }),
  );
  if (keys.length > 0) return { missing: keys, unmetKind: 'config' };

  const peers = unmetPeers({
    peers: requiredPeers(content),
    versions: peerVersions,
  });
  return peers.length > 0 ? { missing: peers, unmetKind: 'peer' } : undefined;
};

/** What one asset becomes, or `undefined` when this config places it nowhere. */
const planEntryFor = ({
  asset,
  config,
  manifest,
  onDiskHash,
  peerVersions,
}) => {
  const targetPath = targetPathFor({ assetPath: asset.path, config });
  if (targetPath === undefined) return undefined;

  // Carried on the entry rather than consumed and dropped. Acknowledging an
  // edit is keyed to what is actually on disk, so a further edit invalidates
  // it on its own; a plan that discarded this hash could only offer a
  // path-keyed acknowledgement, which never expires. Every entry carries it,
  // including a refused one, so nothing downstream has to know which states
  // happen to have a hash.
  const onDisk = onDiskHash(targetPath);

  const unmet = unmetDeclaration({
    config,
    content: asset.content,
    peerVersions,
  });

  if (unmet !== undefined) {
    return {
      content: asset.content,
      incomingHash: hashContent(asset.content),
      missing: unmet.missing,
      onDiskHash: onDisk,
      path: targetPath,
      state: 'unmet',
      unmetKind: unmet.unmetKind,
    };
  }

  // Substituted BEFORE hashing, so the record describes what is on disk
  // rather than the template it came from.
  const { content, missing } = substituteCommands({
    commands: config.commands,
    content: asset.content,
  });
  const incomingHash = hashContent(content);

  if (missing.length > 0) {
    return {
      content,
      incomingHash,
      missing,
      onDiskHash: onDisk,
      path: targetPath,
      state: 'unresolved',
    };
  }

  return {
    content,
    incomingHash,
    missing,
    onDiskHash: onDisk,
    path: targetPath,
    state: classifyMaterialisation({
      incomingHash,
      onDiskHash: onDisk,
      recordedHash: manifest.files[targetPath],
    }),
  };
};

/**
 * `peerVersions` is supplied rather than resolved here, so planning stays pure
 * and every asset naming the same peer is answered from one lookup. Its default
 * is empty, which reads every declared peer as absent — a plan built without it
 * refuses rather than writes.
 *
 * The asset's mode rides on the entry beside its content, so `applySync` never
 * has to know which group a path came from. Which group it came from is exactly
 * what decides the mode — see `isExecutableAsset` — but that is settled before a
 * plan is built, so applying one stays a matter of reading the entry.
 *
 * @param {{ assets: { path: string, content: string, executable?: boolean }[],
 *   config: object, manifest: { files: Record<string, string> },
 *   onDiskHash: (targetPath: string) => string | undefined,
 *   peerVersions?: Map<string, string | undefined> }} args
 */
export const planSync = ({
  assets,
  config,
  manifest,
  onDiskHash,
  peerVersions = new Map(),
}) => {
  const groups = new Set(groupsFor(config));

  return assets
    .filter((asset) => groups.has(asset.path.split('/')[0]))
    .map((asset) => {
      const entry = planEntryFor({
        asset,
        config,
        manifest,
        onDiskHash,
        peerVersions,
      });
      return entry === undefined
        ? undefined
        : { ...entry, executable: asset.executable === true };
    })
    .filter((entry) => entry !== undefined);
};

/**
 * The plan with each acknowledged edit relabelled, layered OVER the
 * classification rather than folded into it — the same separation `manifestAfter`
 * already keeps from `planSync`. `classifyMaterialisation` stays a function of
 * three hashes, so the acceptance record can never change what `modified` means
 * and a consumer with no record gets exactly the plan they got before.
 *
 * `modified` and `conflict` are both relabelled, and quieting a conflict is not
 * adopting it — the package's version is still never written over the consumer's
 * file, so the one mistake a materialiser cannot undo remains impossible. What
 * changes is only whether a deliberate, permanent divergence is reported on
 * every run forever. A repository that authored its own register before adopting
 * the kit holds exactly that state, which is why `doctor --check` could not be a
 * gate until this: it was red on a correct tree.
 *
 * Both commands read the plan through this, because `sync` and `doctor` must not
 * disagree about which files are quiet. It costs `sync` nothing: `acknowledged`
 * is in neither the written nor the recorded set, exactly as the two states it
 * replaces were.
 */
export const withAcceptance = ({ accepted, entries }) =>
  entries.map((entry) => {
    if (!isAcknowledgeable(entry.state)) return entry;
    if (!isAccepted({ accepted, hash: entry.onDiskHash, path: entry.path })) {
      return entry;
    }
    return {
      ...entry,
      reason: acceptedEntry({ accepted, path: entry.path }).reason,
      state: ACKNOWLEDGED_STATE,
    };
  });

/**
 * `writeFileSync`'s mode applies only when it CREATES the file, so an entry that
 * already exists keeps whatever mode it had — which is why the bit is set
 * explicitly afterwards rather than passed as an option. A hook restored over a
 * non-executable file of the same name would otherwise stay silently inert.
 */
const EXECUTABLE_MODE = 0o755;

/**
 * Writing is one question, the mode is another, and they cover different sets.
 *
 * The mode is corrected on every file the record calls ours — `isRecorded`, not
 * `isWritten` — because a `current` file has the package's exact bytes and may
 * still have arrived without its bit, through a tarball, a copy, or a clone on a
 * filesystem that does not carry one. Nothing else would ever put it back: the
 * mode is not in the hash, so `sync` says everything is up to date and `doctor`
 * reports nothing while git skips the hook. Recorded is the right line because
 * it is exactly the set whose content is provably the package's; a `conflict` or
 * a `modified` file belongs to the consumer, and its mode is theirs too.
 */
const needsExecutableBit = (entry) =>
  entry.executable === true && isRecorded(entry.state);

export const applySync = ({ entries, root }) => {
  for (const entry of entries.filter((candidate) =>
    isWritten(candidate.state),
  )) {
    const destination = join(root, entry.path);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, entry.content);
  }

  // After the writes, so a file created just above is included.
  for (const entry of entries.filter(needsExecutableBit)) {
    chmodSync(join(root, entry.path), EXECUTABLE_MODE);
  }
};

export const manifestAfter = ({ entries, previous, version }) =>
  nextManifest({
    entries: entries.map((entry) => ({
      incomingHash: entry.incomingHash,
      path: entry.path,
      state: entry.state,
    })),
    previous,
    version,
  });

/** Hashing what is on disk, with absence reported as absence rather than thrown. */
export const onDiskHasher = (root) => (targetPath) => {
  try {
    return hashContent(readFileSync(join(root, targetPath)));
  } catch {
    return undefined;
  }
};
