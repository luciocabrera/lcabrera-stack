/*
 * Which recorded files a run may retire, and the conditions under which it may
 * retire none of them.
 *
 * A retirement deletes a file because the package no longer ships its path, so
 * the shipping list is the authority and has to be one. An install whose
 * assets directory is missing, empty or short of a group reads as a package
 * that ships nothing there, and every record would be retired. And a record is
 * a key in a file the consumer can edit, so it is read as a path inside the
 * repository only once it has been shown to be one.
 *
 * Usage: imported by `sync.mjs`; `destinationIn`, `nodeKindIn` and
 * `retirementRefusal` are also used by `command-materialise.mjs`.
 */

import { lstatSync, realpathSync, statSync } from 'node:fs';
import { join, parse, posix, sep } from 'node:path';

import {
  isRepositoryRelative,
  isWithin,
} from '../assets/workspace/scripts/hooks-path.mjs';
import { assetGroup, KIT_GROUPS, targetPathFor } from './config.mjs';
import { classifyRetirement } from './manifest.mjs';

const OUTSIDE_STATE = 'outside';

const realPathOrNothing = (path) => {
  try {
    return realpathSync(path);
  } catch {
    return;
  }
};

const throughLinks = (path) => {
  const { root } = parse(path);
  const segments = path.slice(root.length).split(sep).filter(Boolean);
  let resolved = realPathOrNothing(root) ?? root;
  for (const [index, segment] of segments.entries()) {
    const next = realPathOrNothing(join(resolved, segment));
    if (next === undefined) return join(resolved, ...segments.slice(index));
    resolved = next;
  }
  return resolved;
};

/**
 * @param {string} path
 * @returns {string | undefined} the normalised repository-relative path, or
 * nothing for one that is absolute, climbs out, or names the root itself
 */
export const lexicalDestination = (path) => {
  if (!isRepositoryRelative(path)) return;
  const normal = posix.normalize(path.replaceAll('\\', '/'));
  return normal === '.' || normal === './' ? undefined : normal;
};

/**
 * @param {string} root
 * @returns {(path: string) => string | undefined} the file a path names once
 * every symbolic link on the way is resolved, or nothing when that file is not
 * strictly inside `root`
 */
export const destinationIn = (root) => {
  const realRoot = throughLinks(root);
  return (path) => {
    if (lexicalDestination(path) === undefined) return;
    const resolved = throughLinks(join(root, path));
    return resolved !== realRoot && isWithin({ path: resolved, root: realRoot })
      ? resolved
      : undefined;
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
  return `Retired nothing: this install of @lcabrera/devkit holds no assets in ${missing.join(', ')}, which this version ships, so its asset set is incomplete and cannot say what the package stopped shipping. Every recorded file was left in place. Reinstall the package and re-run.`;
};

export const declaredRetirements = ({ config, retiring }) =>
  new Set(
    retiring
      .map((assetPath) => targetPathFor({ assetPath, config }))
      .filter((targetPath) => targetPath !== undefined),
  );

const GONE_CODES = new Set(['ENOENT', 'ENOTDIR']);

const linkedKind = (path) => {
  try {
    return statSync(path).isFile() ? 'file' : 'other';
  } catch {
    return 'other';
  }
};

/**
 * @param {string} root
 * @returns {(path: string) => 'absent' | 'file' | 'other'} what is at the path
 * without reading it: nothing, a regular file (directly or through a link), or
 * anything else, which is never opened
 */
export const nodeKindIn = (root) => (path) => {
  const full = join(root, path);
  try {
    const node = lstatSync(full);
    if (node.isFile()) return 'file';
    return node.isSymbolicLink() ? linkedKind(full) : 'other';
  } catch (error) {
    return GONE_CODES.has(error?.code) ? 'absent' : 'other';
  }
};

const retirementOutcome = ({ kind, onDisk, recordedHash }) => {
  if (kind === 'absent') return { state: 'retired' };
  if (kind !== 'file') return { keptBecause: 'not-regular', state: 'kept' };
  if (onDisk === undefined) return { keptBecause: 'unreadable', state: 'kept' };
  const state = classifyRetirement({ onDiskHash: onDisk, recordedHash });
  return state === 'kept' ? { keptBecause: 'edited', state } : { state };
};

const retirementEntry = ({
  destination,
  kindOf,
  onDiskHash,
  path,
  recordedHash,
}) => {
  if (destination === undefined) {
    return { executable: false, missing: [], path, state: OUTSIDE_STATE };
  }
  const kind = kindOf(path);
  const onDisk = kind === 'file' ? onDiskHash(path) : undefined;
  return {
    executable: false,
    missing: [],
    onDiskHash: onDisk,
    path,
    ...retirementOutcome({ kind, onDisk, recordedHash }),
  };
};

const destinationsOf = ({ destinationOf, paths }) =>
  new Set(
    [...paths]
      .map((path) => destinationOf(path))
      .filter((destination) => destination !== undefined),
  );

/**
 * @param {{ assets: { path: string }[], config: object,
 *   declared: Set<string>,
 *   destinationOf: (targetPath: string) => string | undefined,
 *   kindOf: (targetPath: string) => 'absent' | 'file' | 'other',
 *   kitGroups?: readonly string[], manifest: { files: Record<string, string> },
 *   onDiskHash: (targetPath: string) => string | undefined,
 *   placed: Set<string> }} args
 */
export const retirementsFor = ({
  assets,
  config,
  declared,
  destinationOf,
  kindOf,
  kitGroups,
  manifest,
  onDiskHash,
  placed,
}) => {
  if (retirementRefusal({ assets, kitGroups }) !== undefined) return [];
  const shipped = new Set(
    assets
      .map((asset) => targetPathFor({ assetPath: asset.path, config }))
      .filter((targetPath) => targetPath !== undefined),
  );
  const placedAt = destinationsOf({ destinationOf, paths: placed });
  const declaredAt = destinationsOf({ destinationOf, paths: declared });
  const shippedAt = destinationsOf({ destinationOf, paths: shipped });
  const stillShipped = (destination) =>
    placedAt.has(destination) ||
    (shippedAt.has(destination) && !declaredAt.has(destination));
  return Object.entries(manifest.files)
    .filter(([path]) => declared.has(path) || !shipped.has(path))
    .map(([path, recordedHash]) => ({
      destination: destinationOf(path),
      path,
      recordedHash,
    }))
    .filter(
      ({ destination }) =>
        destination === undefined || !stillShipped(destination),
    )
    .map((record) => retirementEntry({ ...record, kindOf, onDiskHash }));
};
