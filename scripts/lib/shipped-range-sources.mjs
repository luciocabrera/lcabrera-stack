/**
 * Reading the ranges this repository ships: every data file under the devkit
 * assets, every range constant listed in `RANGE_CONSTANTS`, and the versions
 * the publishable workspaces are on. `shipped-ranges:verify` judges what this
 * reads and `devkit:pins` raises it, so both read the same set (ADR-117).
 */

import { readdirSync, readFileSync } from 'node:fs';
import { basename, join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

import { readPublishableManifests } from '../../packages/repo-standards/scripts/publishable-workspaces.mjs';
import {
  catalogRanges,
  constantRanges,
  manifestRanges,
  sourceOf,
} from './shipped-ranges.mjs';

const RANGE_CONSTANTS = [
  { constant: 'TOOLCHAIN_RANGES', path: 'packages/devkit/scripts/create.mjs' },
];

const toPosix = (path) => path.split(sep).join('/');

const shippedFiles = (assetsDir) =>
  readdirSync(assetsDir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name));

/**
 * @param {string} root
 */
export const assetSources = (root) =>
  shippedFiles(join(root, 'packages', 'devkit', 'assets')).flatMap((path) => {
    const source = sourceOf(basename(path));
    if (source === undefined) return [];

    return [
      {
        ...source,
        path: toPosix(relative(root, path)),
        text: readFileSync(path, 'utf8'),
      },
    ];
  });

const constantSource = async ({ constant, path, root }) => {
  const absolute = join(root, path);
  const exported = await import(pathToFileURL(absolute).href);
  const ranges = exported[constant];
  if (typeof ranges !== 'object' || ranges === null) {
    throw new TypeError(
      `${path} exports no \`${constant}\` object — the constant moved or was renamed, so the ranges it held are no longer read by this gate`,
    );
  }
  return {
    constant,
    kind: 'constant',
    path,
    ranges,
    text: readFileSync(absolute, 'utf8'),
  };
};

/**
 * @param {string} root
 */
export const constantSources = (root) =>
  Promise.all(
    RANGE_CONSTANTS.map((entry) => constantSource({ ...entry, root })),
  );

/**
 * @param {{ constant?: string, kind: string, path: string,
 *           ranges?: Record<string, string>, text: string }} source
 */
export const declarationsIn = ({ constant, kind, path, ranges, text }) => {
  if (kind === 'constant') return constantRanges({ constant, path, ranges });
  if (kind === 'manifest') {
    return manifestRanges({ manifest: JSON.parse(text), path });
  }
  return kind === 'catalog' ? catalogRanges({ path, text }) : [];
};

/**
 * @param {string} root
 * @returns {Record<string, string>}
 */
export const publishedVersions = (root) =>
  Object.fromEntries(
    readPublishableManifests(root).map((manifest) => [
      manifest.name,
      manifest.version,
    ]),
  );
