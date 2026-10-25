/**
 * Whether every optional dependency a created tree's packages pin to an exact
 * version is covered by a `minimumReleaseAgeExclude` entry in the tree's
 * `pnpm-workspace.yaml`. pnpm installs such a pin even when it is younger than
 * its release age, and writes it into that list, so one left uncovered makes a
 * fresh tree go dirty on the day its family releases (#1490).
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import semver from 'semver';
import { parse } from 'yaml';

import { run } from './devkit-pack.mjs';

const VIRTUAL_STORE = join('node_modules', '.pnpm');

const WORKSPACE_FILE = 'pnpm-workspace.yaml';

const escaped = (text) =>
  text.replaceAll(/[.+?^${}()|[\]\\]/g, String.raw`\$&`);

const entryParts = (entry) => {
  const at = entry.indexOf('@', 1);
  return at === -1
    ? { name: entry, version: undefined }
    : { name: entry.slice(0, at), version: entry.slice(at + 1) };
};

/**
 * @param {{ entry: string, name: string, version: string }} args
 * @returns {boolean}
 */
export const excludeCovers = ({ entry, name, version }) => {
  const parts = entryParts(entry);
  const pattern = new RegExp(
    `^${parts.name.split('*').map(escaped).join('.*')}$`,
  );
  return (
    pattern.test(name) &&
    (parts.version === undefined || parts.version === version)
  );
};

/**
 * @param {ReadonlyArray<{ name: string, optionalDependencies?: Record<string, string>,
 *                         version: string }>} manifests
 * @returns {Array<{ name: string, pinnedBy: string, version: string }>}
 */
export const exactOptionalPins = (manifests) =>
  manifests.flatMap(({ name, optionalDependencies = {}, version }) =>
    Object.entries(optionalDependencies)
      .filter(([, spec]) => semver.valid(spec) !== null)
      .map(([dependency, spec]) => ({
        name: dependency,
        pinnedBy: `${name}@${version}`,
        version: spec,
      })),
  );

/**
 * @param {{ excluded: readonly string[],
 *           pins: ReadonlyArray<{ name: string, pinnedBy: string,
 *                                 version: string }> }} args
 * @returns {string[]}
 */
export const uncoveredPinFindings = ({ excluded, pins }) => {
  const uncovered = Map.groupBy(
    pins.filter(
      ({ name, version }) =>
        !excluded.some((entry) => excludeCovers({ entry, name, version })),
    ),
    ({ pinnedBy }) => pinnedBy,
  );
  return [...uncovered].map(
    ([pinnedBy, missed]) =>
      `\`${pinnedBy}\` pins optional dependencies at exact versions that no \`minimumReleaseAgeExclude\` entry in the blueprint's \`${WORKSPACE_FILE}\` covers (${missed.map(({ name, version }) => `${name}@${version}`).join(', ')}). While one of them is younger than pnpm's release age and \`${pinnedBy}\` is not, an install adds it to that list and the fresh tree goes dirty`,
  );
};

const packageNameOf = (directory) => {
  const name = directory.slice(0, directory.indexOf('@', 1));
  return name.startsWith('@') ? name.replace('+', '/') : name;
};

const storedManifests = (store) =>
  readdirSync(store)
    .map((directory) =>
      join(
        store,
        directory,
        'node_modules',
        packageNameOf(directory),
        'package.json',
      ),
    )
    .filter((path) => existsSync(path))
    .map((path) => JSON.parse(readFileSync(path, 'utf8')));

/**
 * @param {{ tree: string }} args
 * @returns {string[]}
 */
export const releaseAgeExcludeFindings = ({ tree }) => {
  const store = join(tree, VIRTUAL_STORE);
  if (!existsSync(store)) {
    return [
      `the created tree has no \`${VIRTUAL_STORE}\`, so nothing shows which optional dependencies its packages pin exactly`,
    ];
  }
  return uncoveredPinFindings({
    excluded:
      parse(run('git', ['show', `HEAD:${WORKSPACE_FILE}`], tree))
        ?.minimumReleaseAgeExclude ?? [],
    pins: exactOptionalPins(storedManifests(store)),
  });
};
