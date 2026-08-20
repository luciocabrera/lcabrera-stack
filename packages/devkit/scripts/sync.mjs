/*
 * Deciding what a sync would do, and then doing it.
 *
 * The planning half is pure and the writing half is a thin shell over it, so
 * `sync` and `doctor` are the same decision with and without the writes —
 * a doctor that computed its answer differently from the command it predicts
 * would be worse than no doctor at all.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { acceptedEntry, isAccepted } from './accepted.mjs';
import { groupsFor, hasConfigKey, targetPathFor } from './config.mjs';
import { requiredConfigKeys, requiredPeers } from './frontmatter.mjs';
import { unmetPeers } from './peer.mjs';
import { substituteCommands } from './placeholders.mjs';
import {
  ACKNOWLEDGEABLE_STATE,
  ACKNOWLEDGED_STATE,
  classifyMaterialisation,
  hashContent,
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

/**
 * `peerVersions` is supplied rather than resolved here, so planning stays pure
 * and every asset naming the same peer is answered from one lookup. Its default
 * is empty, which reads every declared peer as absent — a plan built without it
 * refuses rather than writes.
 *
 * @param {{ assets: { path: string, content: string }[], config: object,
 *   manifest: { files: Record<string, string> },
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
 * Only `modified` is relabelled. A `conflict` is an unmanaged file the consumer
 * wrote themselves; quieting that would be adopting it, which is a different
 * decision and the one mistake a materialiser cannot undo.
 *
 * Both commands read the plan through this, because `sync` and `doctor` must not
 * disagree about which files are quiet. It costs `sync` nothing: `acknowledged`
 * is in neither the written nor the recorded set, exactly as `modified` was.
 */
export const withAcceptance = ({ accepted, entries }) =>
  entries.map((entry) => {
    if (entry.state !== ACKNOWLEDGEABLE_STATE) return entry;
    if (!isAccepted({ accepted, hash: entry.onDiskHash, path: entry.path })) {
      return entry;
    }
    return {
      ...entry,
      reason: acceptedEntry({ accepted, path: entry.path }).reason,
      state: ACKNOWLEDGED_STATE,
    };
  });

export const applySync = ({ entries, root }) => {
  for (const entry of entries.filter((candidate) =>
    isWritten(candidate.state),
  )) {
    const destination = join(root, entry.path);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, entry.content);
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
