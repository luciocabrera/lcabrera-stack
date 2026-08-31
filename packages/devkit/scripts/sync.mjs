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
import { substituteCiSetup } from './ci-setup.mjs';
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

const planEntryFor = ({
  asset,
  config,
  manifest,
  onDiskHash,
  peerVersions,
}) => {
  const targetPath = targetPathFor({ assetPath: asset.path, config });
  if (targetPath === undefined) return undefined;

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

  const { content, missing } = substituteCommands({
    commands: config.commands,
    content: substituteCiSetup({
      content: asset.content,
      setup: config.ci?.setup,
    }),
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

const EXECUTABLE_MODE = 0o755;

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

export const onDiskHasher = (root) => (targetPath) => {
  try {
    return hashContent(readFileSync(join(root, targetPath)));
  } catch {
    return undefined;
  }
};
