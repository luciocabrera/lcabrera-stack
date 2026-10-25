/**
 * Gives the ESLint toolchain TypeScript 6 while every workspace, and vite-plus
 * with it, resolves the catalog's TypeScript 7.
 *
 * typescript-eslint and the plugins built on it load the compiler API through a
 * `typescript` peer, and TypeScript 7 ships no compiler API yet. A peer resolves
 * from the dependent, so neither `overrides` nor `packageExtensions` can point
 * it elsewhere: this hook turns the peer into a dependency on TypeScript 6 for
 * the packages named below. Why, and when to remove it: ADR-139.
 *
 * Usage: read by pnpm on every install. It runs no command and sets no exit code.
 */

const TYPESCRIPT_6 = 'npm:typescript@^6.0.3';

const ESLINT_SCOPES = ['@eslint-react/', '@typescript-eslint/'];

const ESLINT_PACKAGES = new Set([
  'eslint-plugin-perfectionist',
  'eslint-plugin-react-x',
  'ts-api-utils',
  'typescript-eslint',
]);

const needsTypeScript6 = (name) =>
  ESLINT_PACKAGES.has(name) ||
  ESLINT_SCOPES.some((scope) => name.startsWith(scope));

const withoutKey = (record, key) =>
  Object.fromEntries(
    Object.entries(record ?? {}).filter(([name]) => name !== key),
  );

const pinTypeScript6 = (manifest) => ({
  ...manifest,
  dependencies: { ...manifest.dependencies, typescript: TYPESCRIPT_6 },
  peerDependencies: withoutKey(manifest.peerDependencies, 'typescript'),
  peerDependenciesMeta: withoutKey(manifest.peerDependenciesMeta, 'typescript'),
});

const readPackage = (manifest) =>
  needsTypeScript6(manifest.name) ? pinTypeScript6(manifest) : manifest;

module.exports = { hooks: { readPackage } };
