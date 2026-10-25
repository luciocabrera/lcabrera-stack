/**
 * Decides which installed packages get TypeScript 6 instead of the catalog's
 * TypeScript 7, for the `.pnpmfile.cjs` hook (ADR-139).
 *
 * Pure: it reads manifests and text handed to it. CommonJS, because pnpm loads
 * the hook with `require` before anything is installed, so no dependency is
 * available to it.
 *
 * Usage: required by `.pnpmfile.cjs` and its test. It runs no command and sets
 * no exit code.
 */

const VERSION = /^v?(\d+)(?:\.(\d+|x|\*))?(?:\.(\d+|x|\*))?(?:-[\w.]+)?$/;

const WILDCARDS = new Set(['', '*', 'x', 'X', 'latest']);

const OPERATORS = ['>=', '<=', '>', '<', '=', '^', '~'];

const parsePartial = (text) => {
  const match = VERSION.exec(text);
  if (match === null) {
    return null;
  }
  const [, major, minor, patch] = match;
  const part = (value) =>
    value === undefined || value === 'x' || value === '*'
      ? null
      : Number(value);
  return [Number(major), part(minor), part(patch)];
};

const compare = (left, right) => {
  for (const index of [0, 1, 2]) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0);
    if (difference !== 0) {
      return difference;
    }
  }
  return 0;
};

const upperBound = (operator, [major, minor, patch]) => {
  if (operator === '^') {
    if (major !== 0 || minor === null) {
      return [major + 1, 0, 0];
    }
    return minor !== 0 || patch === null
      ? [0, minor + 1, 0]
      : [0, 0, patch + 1];
  }
  if (minor === null) {
    return [major + 1, 0, 0];
  }
  return operator === '~' || patch === null
    ? [major, minor + 1, 0]
    : [major, minor, patch + 1];
};

const comparatorAdmits = (token, version) => {
  if (WILDCARDS.has(token)) {
    return true;
  }
  const operator =
    OPERATORS.find((candidate) => token.startsWith(candidate)) ?? '';
  const bound = parsePartial(token.slice(operator.length).trim());
  if (bound === null) {
    return null;
  }
  const order = compare(version, bound);
  if (operator === '>=') return order >= 0;
  if (operator === '>') return order > 0;
  if (operator === '<=') return order <= 0;
  if (operator === '<') return order < 0;
  return order >= 0 && compare(version, upperBound(operator, bound)) < 0;
};

const comparatorSetAdmits = (set, version) => {
  const hyphen = /^(\S+)\s+-\s+(\S+)$/.exec(set);
  const tokens =
    hyphen === null
      ? set.split(/\s+/).filter(Boolean)
      : [`>=${hyphen[1]}`, `<=${hyphen[2]}`];
  const verdicts = (tokens.length === 0 ? ['*'] : tokens).map((token) =>
    comparatorAdmits(token, version),
  );
  return verdicts.includes(null) ? null : verdicts.every(Boolean);
};

/**
 * @param {string} range a semver range as written in a manifest
 * @param {string} version an exact version
 * @returns {boolean} false only when the range is understood and excludes the version
 */
const rangeAdmits = (range, version) => {
  const exact = parsePartial(version);
  if (exact === null) {
    return true;
  }
  const verdicts = new Set(
    range.split('||').map((set) => comparatorSetAdmits(set.trim(), exact)),
  );
  return verdicts.has(true) || verdicts.has(null);
};

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
  return parsePartial(floor)?.every((part) => part !== null) ? floor : null;
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

/**
 * @template {{ dependencies?: Record<string, string>, peerDependencies?: Record<string, string>, peerDependenciesMeta?: Record<string, unknown> }} T
 * @param {T} manifest
 * @param {string} specifier the TypeScript 6 dependency to install in place of the peer
 * @returns {T}
 */
const pinTypeScript6 = (manifest, specifier) => ({
  ...manifest,
  dependencies: { ...manifest.dependencies, typescript: specifier },
  peerDependencies: withoutKey(manifest.peerDependencies, 'typescript'),
  peerDependenciesMeta: withoutKey(manifest.peerDependenciesMeta, 'typescript'),
});

module.exports = {
  catalogTypeScript,
  needsTypeScript6,
  pinTypeScript6,
  rangeAdmits,
  workspaceGlobs,
};
