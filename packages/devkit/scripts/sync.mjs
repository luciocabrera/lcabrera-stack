/*
 * Deciding what a sync would do, and then doing it.
 *
 * The planning half is pure and the writing half is a thin shell over it, so
 * `sync` and `doctor` are the same decision with and without the writes —
 * a doctor that computed its answer differently from the command it predicts
 * would be worse than no doctor at all.
 */

import {
  chmodSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';

import { isRepositoryRelative } from '../assets/workspace/scripts/hooks-path.mjs';
import { acceptedEntry, isAccepted } from './accepted.mjs';
import { substituteCiSetup } from './ci-setup.mjs';
import {
  assetGroup,
  groupsFor,
  hasConfigKey,
  retiredAssetsFor,
  targetPathFor,
} from './config.mjs';
import {
  consumerRegionKey,
  joinConsumerRegion,
  splitConsumerRegion,
} from './consumer-region.mjs';
import { requiredConfigKeys, requiredPeers } from './frontmatter.mjs';
import {
  ACKNOWLEDGED_STATE,
  classifyMaterialisation,
  hashContent,
  isAcknowledgeable,
  isRecorded,
  isRemoval,
  isWritten,
  nextManifest,
} from './manifest.mjs';
import { unmetPeers } from './peer.mjs';
import { substituteCommands } from './placeholders.mjs';
import { declaredRetirements, retirementsFor } from './retirement.mjs';

const unmetDeclaration = ({ config, content, peerVersions }) => {
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

const onDiskFor = ({ assetPath, onDiskContent, onDiskHash, targetPath }) => {
  const key = consumerRegionKey(assetPath);
  const content = key === undefined ? undefined : onDiskContent(targetPath);
  if (content === undefined) return { hash: onDiskHash(targetPath) };
  const { kit, region } = splitConsumerRegion({ content, key });
  const hash = hashContent(kit);
  return region === '' ? { hash } : { hash, region };
};

const planEntryFor = ({
  asset,
  config,
  manifest,
  onDiskContent,
  onDiskHash,
  peerVersions,
  targetPath,
}) => {
  const { hash: onDisk, region } = onDiskFor({
    assetPath: asset.path,
    onDiskContent,
    onDiskHash,
    targetPath,
  });

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
    ...(region !== undefined && { region }),
    state: classifyMaterialisation({
      incomingHash,
      onDiskHash: onDisk,
      recordedHash: manifest.files[targetPath],
    }),
  };
};

const targetedAssets = ({ assets, config }) =>
  assets
    .map((asset) => ({
      asset,
      targetPath: targetPathFor({ assetPath: asset.path, config }),
    }))
    .filter(({ targetPath }) => targetPath !== undefined);

const prevailingAssets = ({ assets, config, groups }) => {
  const rank = new Map(groups.map((group, index) => [group, index]));
  const prevailing = new Map();
  const targeted = targetedAssets({ assets, config });
  for (const { asset, targetPath } of targeted) {
    const held = rank.get(assetGroup(asset.path));
    if (held === undefined) continue;
    const incumbent = prevailing.get(targetPath);
    if (incumbent === undefined || held > incumbent.rank) {
      prevailing.set(targetPath, { asset, rank: held, targetPath });
    }
  }
  return prevailing.values().toArray();
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
 *   config: object, groups?: readonly string[],
 *   manifest: { files: Record<string, string> },
 *   onDiskContent?: (targetPath: string) => string | undefined,
 *   onDiskHash: (targetPath: string) => string | undefined,
 *   peerVersions?: Map<string, string | undefined>,
 *   retiring?: readonly string[],
 *   isContained?: (targetPath: string) => boolean,
 *   kitGroups?: readonly string[] }} args
 */
export const planSync = ({
  assets,
  config,
  groups = groupsFor(config),
  isContained = isRepositoryRelative,
  kitGroups,
  manifest,
  onDiskContent = () => undefined,
  onDiskHash,
  peerVersions = new Map(),
  retiring = retiredAssetsFor({ profile: config.profile }),
}) => {
  const retired = new Set(retiring);
  const placed = prevailingAssets({
    assets: assets.filter((asset) => !retired.has(asset.path)),
    config,
    groups,
  });
  const placedPaths = new Set(placed.map(({ targetPath }) => targetPath));
  const declared = declaredRetirements({ config, retiring }).difference(
    placedPaths,
  );
  const planned = placed.map(({ asset, targetPath }) => {
    const entry = planEntryFor({
      asset,
      config,
      manifest,
      onDiskContent,
      onDiskHash,
      peerVersions,
      targetPath,
    });
    return { ...entry, executable: asset.executable === true };
  });

  return [
    ...planned,
    ...retirementsFor({
      assets,
      config,
      declared,
      isContained,
      kitGroups,
      manifest,
      onDiskHash,
    }),
  ];
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

const removeFile = (path) => {
  try {
    if (lstatSync(path).isDirectory()) return;
  } catch {
    return;
  }
  rmSync(path, { force: true });
};

export const applySync = ({ entries, root }) => {
  for (const entry of entries) {
    if (!isWritten(entry.state)) continue;
    const destination = join(root, entry.path);
    if (isRemoval(entry.state)) {
      removeFile(destination);
      continue;
    }
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(
      destination,
      joinConsumerRegion({ kit: entry.content, region: entry.region }),
    );
  }

  for (const entry of entries) {
    if (!needsExecutableBit(entry)) continue;
    chmodSync(join(root, entry.path), EXECUTABLE_MODE);
  }
};

export const manifestAfter = ({ entries, previous, tasks, version }) =>
  nextManifest({
    entries: entries.map((entry) => ({
      incomingHash: entry.incomingHash,
      path: entry.path,
      state: entry.state,
    })),
    previous,
    tasks,
    version,
  });

export const onDiskReader = (root) => (targetPath) => {
  try {
    return readFileSync(join(root, targetPath), 'utf8');
  } catch {
    return;
  }
};

export const onDiskHasher = (root) => (targetPath) => {
  try {
    return hashContent(readFileSync(join(root, targetPath)));
  } catch {
    return;
  }
};
