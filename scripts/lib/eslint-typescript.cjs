/**
 * Decides which installed packages get TypeScript 6 instead of the catalog's
 * TypeScript 7, for the `.pnpmfile.cjs` hook (ADR-139).
 *
 * Pure: it reads manifests and text handed to it. CommonJS, because pnpm loads
 * the hook with `require` before anything is installed, so no dependency is
 * available to it.
 *
 * Usage: required by `.pnpmfile.cjs` and its test. It runs no command; it
 * throws on a range it cannot read or a TypeScript 6 pin a range excludes.
 */

const { satisfies } = require('./semver-range.cjs');

/**
 * @param {string} range a semver range as written in a manifest
 * @param {string} version an exact version
 * @returns {boolean} what `semver.satisfies(version, range)` returns; throws on a range it cannot read
 */
const rangeAdmits = (range, version) => satisfies(version, range);

const blockLines = (text, header, indent) => {
  const lines = text.split('\n');
  const start = lines.indexOf(header);
  if (start === -1) {
    return [];
  }
  const rest = lines.slice(start + 1);
  const end = rest.findIndex(
    (line) =>
      line.trim() !== '' &&
      !line.startsWith(indent) &&
      !line.trimStart().startsWith('#'),
  );
  return end === -1 ? rest : rest.slice(0, end);
};

/**
 * @param {string} workspaceYaml the text of `pnpm-workspace.yaml`
 * @returns {string | null} the lowest version the `build` catalog's `typescript` range names
 */
const catalogTypeScript = (workspaceYaml) => {
  const build = blockLines(workspaceYaml, '  build:', '    ');
  const line = build.find((entry) => entry.startsWith('    typescript:'));
  if (line === undefined) {
    return null;
  }
  const floor = line
    .slice(line.indexOf(':') + 1)
    .trim()
    .replace(/^[\^~>=v]+/, '');
  return floor.split('.').length === 3 && satisfies(floor, '*') ? floor : null;
};

/**
 * @param {string} workspaceYaml the text of `pnpm-workspace.yaml`
 * @returns {string[]} the `packages:` globs
 */
const workspaceGlobs = (workspaceYaml) =>
  blockLines(workspaceYaml, 'packages:', '  ')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => line.slice(2).split('#')[0].trim().replaceAll(/['"]/g, ''));

/**
 * @param {{ name: string, peerDependencies?: Record<string, string> }} manifest
 * @param {{ catalogVersion: string | null, workspaceNames: ReadonlySet<string> }} context
 * @returns {boolean}
 */
const needsTypeScript6 = (manifest, { catalogVersion, workspaceNames }) => {
  if (workspaceNames.has(manifest.name)) {
    return false;
  }
  const peers = manifest.peerDependencies ?? {};
  if (peers.eslint !== undefined) {
    return true;
  }
  return (
    peers.typescript !== undefined &&
    catalogVersion !== null &&
    !rangeAdmits(peers.typescript, catalogVersion)
  );
};

const withoutKey = (record, key) =>
  Object.fromEntries(
    Object.entries(record ?? {}).filter(([name]) => name !== key),
  );

const TYPESCRIPT_6 = '6.0.3';

/**
 * @template {{ name: string, version?: string, dependencies?: Record<string, string>, peerDependencies?: Record<string, string>, peerDependenciesMeta?: Record<string, unknown> }} T
 * @param {T} manifest
 * @returns {T}
 */
const pinTypeScript6 = (manifest) => {
  const declared = manifest.peerDependencies?.typescript;
  if (declared !== undefined && !rangeAdmits(declared, TYPESCRIPT_6)) {
    throw new Error(
      `.pnpmfile.cjs: ${manifest.name}@${manifest.version ?? '?'} declares the typescript peer ` +
        `"${declared}", which excludes the TypeScript ${TYPESCRIPT_6} this hook installs in its place. ` +
        'Give it a TypeScript its range admits before installing (ADR-139).',
    );
  }
  return {
    ...manifest,
    dependencies: {
      ...manifest.dependencies,
      typescript: `npm:typescript@${TYPESCRIPT_6}`,
    },
    peerDependencies: withoutKey(manifest.peerDependencies, 'typescript'),
    peerDependenciesMeta: withoutKey(
      manifest.peerDependenciesMeta,
      'typescript',
    ),
  };
};

module.exports = {
  TYPESCRIPT_6,
  catalogTypeScript,
  needsTypeScript6,
  pinTypeScript6,
  rangeAdmits,
  workspaceGlobs,
};
