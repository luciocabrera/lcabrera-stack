/*
 * Which recorded files a run may retire, and the two conditions under which it
 * may retire none of them.
 *
 * A retirement deletes a file because the package no longer ships its path, so
 * the shipping list is the authority and has to be one. An install whose
 * assets directory is missing, empty or short of a group reads as a package
 * that ships nothing there, and every record would be retired. And a record is
 * a key in a file the consumer can edit, so it is read as a path inside the
 * repository only once it has been shown to be one.
 *
 * Usage: imported by `sync.mjs`; `containedIn` and `retirementRefusal` are
 * also used by `command-materialise.mjs`.
 */

import { realpathSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

import {
  isRepositoryRelative,
  isWithin,
} from '../assets/workspace/scripts/hooks-path.mjs';
import { assetGroup, KIT_GROUPS, targetPathFor } from './config.mjs';
import { classifyRetirement } from './manifest.mjs';

const OUTSIDE_STATE = 'outside';

const throughLinks = (path) => {
  try {
    return realpathSync(path);
  } catch {
    const parent = dirname(path);
    return parent === path ? path : join(throughLinks(parent), basename(path));
  }
};

/**
 * @param {string} root
 * @returns {(targetPath: string) => boolean} whether a path resolves, through
 * every symbolic link on the way, to somewhere strictly inside `root`
 */
export const containedIn = (root) => {
  const realRoot = throughLinks(root);
  return (targetPath) => {
    if (!isRepositoryRelative(targetPath)) return false;
    const resolved = throughLinks(join(root, targetPath));
    return (
      resolved !== realRoot && isWithin({ path: resolved, root: realRoot })
    );
  };
};

/**
 * @param {{ assets: { path: string }[], kitGroups?: readonly string[] }} args
 * @returns {string | undefined} why no record may be retired, or nothing when
 * the asset set can be trusted as the package's shipping list
 */
export const retirementRefusal = ({ assets, kitGroups = KIT_GROUPS }) => {
  if (assets.length === 0) {
    return 'Retired nothing: this install of @lcabrera/devkit holds no assets, so it cannot tell a file the package stopped shipping from one it failed to unpack. Every recorded file was left in place. Reinstall the package and re-run.';
  }
  const present = new Set(assets.map((asset) => assetGroup(asset.path)));
  const missing = kitGroups.filter((group) => !present.has(group));
  if (missing.length === 0) return;
  return `Retired nothing: this install of @lcabrera/devkit holds no assets in ${missing.join(', ')}, which every version ships, so its asset set is incomplete and cannot say what the package stopped shipping. Every recorded file was left in place. Reinstall the package and re-run.`;
};

export const declaredRetirements = ({ config, retiring }) =>
  new Set(
    retiring
      .map((assetPath) => targetPathFor({ assetPath, config }))
      .filter((targetPath) => targetPath !== undefined),
  );

const retirementEntry = ({ isContained, onDiskHash, path, recordedHash }) => {
  if (!isContained(path)) {
    return { executable: false, missing: [], path, state: OUTSIDE_STATE };
  }
  const onDisk = onDiskHash(path);
  return {
    executable: false,
    missing: [],
    onDiskHash: onDisk,
    path,
    state: classifyRetirement({ onDiskHash: onDisk, recordedHash }),
  };
};

/**
 * @param {{ assets: { path: string }[], config: object,
 *   declared: Set<string>, isContained: (targetPath: string) => boolean,
 *   kitGroups?: readonly string[], manifest: { files: Record<string, string> },
 *   onDiskHash: (targetPath: string) => string | undefined }} args
 */
export const retirementsFor = ({
  assets,
  config,
  declared,
  isContained,
  kitGroups,
  manifest,
  onDiskHash,
}) => {
  if (retirementRefusal({ assets, kitGroups }) !== undefined) return [];
  const shipped = new Set(
    assets
      .map((asset) => targetPathFor({ assetPath: asset.path, config }))
      .filter((targetPath) => targetPath !== undefined),
  );
  return Object.entries(manifest.files)
    .filter(([path]) => declared.has(path) || !shipped.has(path))
    .map(([path, recordedHash]) =>
      retirementEntry({ isContained, onDiskHash, path, recordedHash }),
    );
};
