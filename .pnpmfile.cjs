/**
 * Gives the ESLint toolchain TypeScript 6 while every workspace, and vite-plus
 * with it, resolves the catalog's TypeScript 7 (ADR-139).
 *
 * A peer resolves from its dependent, so neither `overrides` nor
 * `packageExtensions` can point one elsewhere. This hook replaces the
 * `typescript` peer with a TypeScript 6 dependency for every package that runs
 * inside ESLint (it peers on `eslint`) and for every package whose own
 * `typescript` peer range excludes the catalog's version. The rules are in
 * `scripts/lib/eslint-typescript.cjs`.
 *
 * Usage: read by pnpm on every install. It throws, failing the install, when a
 * package's typescript peer is unreadable or excludes the TypeScript 6 it pins.
 */

const { readdirSync, readFileSync } = require('node:fs');
const path = require('node:path');

const {
  catalogTypeScript,
  needsTypeScript6,
  pinTypeScript6,
  workspaceGlobs,
} = require('./scripts/lib/eslint-typescript.cjs');

const readManifestName = (directory) => {
  try {
    return JSON.parse(
      readFileSync(path.join(directory, 'package.json'), 'utf8'),
    ).name;
  } catch {
    return undefined;
  }
};

const namesUnder = (glob) => {
  const parent = path.join(__dirname, glob.replace(/\/\*$/, ''));
  if (!glob.endsWith('/*')) {
    return [readManifestName(parent)];
  }
  return readdirSync(parent, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => readManifestName(path.join(parent, entry.name)));
};

const workspaceYaml = readFileSync(
  path.join(__dirname, 'pnpm-workspace.yaml'),
  'utf8',
);

const context = {
  catalogVersion: catalogTypeScript(workspaceYaml),
  workspaceNames: new Set(
    [
      readManifestName(__dirname),
      ...workspaceGlobs(workspaceYaml).flatMap(namesUnder),
    ].filter(Boolean),
  ),
};

const readPackage = (manifest) =>
  needsTypeScript6(manifest, context) ? pinTypeScript6(manifest) : manifest;

module.exports = { hooks: { readPackage } };
