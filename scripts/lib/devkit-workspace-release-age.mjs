/**
 * Whether every optional dependency a created tree's packages pin to an exact
 * version is covered by a `minimumReleaseAgeExclude` entry in the tree's
 * `pnpm-workspace.yaml`. pnpm installs such a pin even when it is younger than
 * its release age, and writes it into that list, so one left uncovered makes a
 * fresh tree go dirty on the day its family releases (#1490).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import semver from 'semver';
import { parse, parseAllDocuments } from 'yaml';

import { run } from './devkit-pack.mjs';
import { readIfPresent } from './devkit-tree-run.mjs';

const LIST_ARGS = ['ls', '--recursive', '--json', '--depth', 'Infinity'];

const LOCKFILE = 'pnpm-lock.yaml';

const MODULES_STATE = join('node_modules', '.modules.yaml');

const UNREAD_SHOWN = 5;

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

const LISTED_KINDS = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
];

const listedPathsUnder = (dependencies = {}) =>
  Object.values(dependencies).flatMap((entry) => [
    ...(entry.path === undefined ? [] : [entry.path]),
    ...LISTED_KINDS.flatMap((kind) => listedPathsUnder(entry[kind])),
  ]);

/**
 * @param {ReadonlyArray<Record<string, unknown>>} listing
 * @returns {string[]}
 */
export const listedPaths = (listing) => [
  ...new Set(
    listing.flatMap((project) =>
      LISTED_KINDS.flatMap((kind) => listedPathsUnder(project[kind])),
    ),
  ),
];

/**
 * @param {{ lockfile: string, modules: string }} args
 * @returns {string[]}
 */
export const installedPackages = ({ lockfile, modules }) => {
  const resolved = parseAllDocuments(lockfile)
    .map((document) => document.toJS())
    .find((document) => document?.settings !== undefined);
  const skipped = new Set(parse(modules)?.skipped ?? []);
  return Object.keys(resolved?.packages ?? {}).filter(
    (key) => !skipped.has(key),
  );
};

/**
 * @param {{ installed: readonly string[], read: ReadonlySet<string> }} args
 * @returns {string[]}
 */
export const scanCoverageFindings = ({ installed, read }) => {
  if (installed.length === 0) {
    return [
      `the created tree's \`${LOCKFILE}\` names no installed package, so the exact-pin check has nothing to hold its scan to`,
    ];
  }
  const unread = installed.filter((key) => !read.has(key));
  return unread.length === 0
    ? []
    : [
        `the exact-pin check read no manifest for ${unread.length} of the ${installed.length} packages the created tree's \`${LOCKFILE}\` installs (${unread.slice(0, UNREAD_SHOWN).join(', ')}), so it cannot tell whether they pin an optional dependency exactly`,
      ];
};

/**
 * @param {{ tree: string }} args
 * @returns {string[]}
 */
export const releaseAgeExcludeFindings = ({ tree }) => {
  const manifests = listedPaths(JSON.parse(run('pnpm', [...LIST_ARGS], tree)))
    .map((path) => join(path, 'package.json'))
    .filter((path) => existsSync(path))
    .map((path) => JSON.parse(readFileSync(path, 'utf8')));
  const coverage = scanCoverageFindings({
    installed: installedPackages({
      lockfile: readIfPresent(join(tree, LOCKFILE)) ?? '',
      modules: readIfPresent(join(tree, MODULES_STATE)) ?? '',
    }),
    read: new Set(manifests.map(({ name, version }) => `${name}@${version}`)),
  });
  return coverage.length > 0
    ? coverage
    : uncoveredPinFindings({
        excluded:
          parse(run('git', ['show', `HEAD:${WORKSPACE_FILE}`], tree))
            ?.minimumReleaseAgeExclude ?? [],
        pins: exactOptionalPins(manifests),
      });
};
