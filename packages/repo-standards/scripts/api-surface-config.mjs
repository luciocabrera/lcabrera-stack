/**
 * Which packages the public-API surface gate watches, and where each one's
 * shipped types live (verify-api-surface.mjs).
 *
 * Only a repository's published packages have an external contract to protect;
 * its private ones may change freely (ADR-040). The snapshot must be taken
 * against what a consumer actually installs: the built `.d.mts` for a package
 * that builds, and the `src` entry for one that ships source (ADR-038). Running
 * one path over both would repeat the exact hazard `repo-verify-publish` exists
 * for.
 *
 * The roster is spelled out in `devkit.config.json` rather than derived from
 * `publishConfig.access`, so that publishing a package is a deliberate two-part
 * act: a manifest that says it ships, and an entry in the config that puts its
 * surface under the ratchet.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { readPublishing } from './config.mjs';
import { toBuiltPaths } from './publish-surface.mjs';

/**
 * A subpath is part of the versioned contract only when it names a concrete
 * entry. `./package.json` is the manifest, and a wildcard (`./components/*`) is
 * an open-ended deep-import escape hatch — snapshotting every file it can reach
 * would churn on every internal edit and drown the real contract. The curated
 * surface is the enumerated entries; the ADR records this boundary.
 */
const isContractSubpath = (subpath) =>
  subpath !== './package.json' && !subpath.includes('*');

/** A source-shipping package (`ui`) has no `build` script. */
const shipsSource = (manifest) => manifest.scripts?.build === undefined;

const entryForBuilt = (sourceTarget) => toBuiltPaths(sourceTarget).types;

/**
 * Resolves one package into the entries the extractor snapshots: its concrete
 * subpaths, each mapped to the type file a consumer would load.
 */
const toPackageConfig = ({ dir, packagesDir, repoRoot }) => {
  const directory = `${packagesDir}/${dir}`;
  const manifest = JSON.parse(
    readFileSync(join(repoRoot, directory, 'package.json'), 'utf8'),
  );
  const source = shipsSource(manifest);
  const entries = Object.entries(manifest.exports ?? {})
    .filter(([subpath]) => isContractSubpath(subpath))
    .map(([subpath, target]) => ({
      entryFile: join(
        repoRoot,
        directory,
        source ? target : entryForBuilt(target),
      ),
      subpath,
    }))
    .sort((left, right) => left.subpath.localeCompare(right.subpath));

  return {
    directory,
    entries,
    name: manifest.name,
    source,
    tsConfigFilePath: source
      ? join(repoRoot, directory, 'tsconfig.app.json')
      : undefined,
  };
};

/** Every configured package's snapshot configuration, in stable name order. */
export const readPublicPackages = (repoRoot) => {
  const { packagesDir, publicPackageDirs } = readPublishing(repoRoot);

  return publicPackageDirs
    .map((dir) => toPackageConfig({ dir, packagesDir, repoRoot }))
    .sort((left, right) => left.name.localeCompare(right.name));
};

/**
 * The scope dropped from a package name, so `@scope/thing` files itself as
 * `thing`. Any scope, not one this package knows: a snapshot named
 * `@scope/thing.txt` would put a directory separator in the filename and write
 * outside the snapshot directory.
 */
const unscoped = (packageName) =>
  packageName.startsWith('@')
    ? packageName.slice(packageName.indexOf('/') + 1)
    : packageName;

/** The tracked snapshot path for a package, relative to the repository root. */
export const snapshotPathFor = (packageName, repoRoot) =>
  `${readPublishing(repoRoot).apiSurfaceDir}/${unscoped(packageName)}.txt`;

/** True once every entry file the config points at exists on disk. */
export const entriesAreBuilt = (packageConfig) =>
  packageConfig.entries.every(({ entryFile }) => existsSync(entryFile));
