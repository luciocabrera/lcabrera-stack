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

import { groupsFor, targetPathFor } from './config.mjs';
import {
  classifyMaterialisation,
  hashContent,
  isWritten,
  nextManifest,
} from './manifest.mjs';

/**
 * @param {{ assets: { path: string, content: string }[], config: object,
 *   manifest: { files: Record<string, string> },
 *   onDiskHash: (targetPath: string) => string | undefined }} args
 */
export const planSync = ({ assets, config, manifest, onDiskHash }) => {
  const groups = new Set(groupsFor(config));

  return assets
    .filter((asset) => groups.has(asset.path.split('/')[0]))
    .map((asset) => {
      const targetPath = targetPathFor({ assetPath: asset.path, config });
      if (targetPath === undefined) return undefined;
      const incomingHash = hashContent(asset.content);
      return {
        content: asset.content,
        incomingHash,
        path: targetPath,
        state: classifyMaterialisation({
          incomingHash,
          onDiskHash: onDiskHash(targetPath),
          recordedHash: manifest.files[targetPath],
        }),
      };
    })
    .filter((entry) => entry !== undefined);
};

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
