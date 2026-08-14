/**
 * Which packages the public-API surface gate watches, and where each one's
 * shipped types live (scripts/verify-api-surface.mjs).
 *
 * Only the `@lcabrera/*` packages ship outside this repo, so only they have an
 * external contract to protect — `@repo/*` may change freely (ADR-040). The
 * snapshot must be taken against what a consumer actually installs: the built
 * `dist` `.d.mts` for the built packages, and the `src` entry for `ui`, which
 * ships source because StyleX derives theme identity from the source path
 * (ADR-038). Running one path over both would repeat the exact hazard
 * `publish:verify` exists for.
 *
 * The list is spelled out rather than derived from `publishConfig.access`, so
 * that publishing a package is a deliberate two-part act: a manifest that says
 * it ships, and an entry here that puts its surface under the ratchet.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { toBuiltPaths } from './publish-surface.mjs';

/** The public packages, by directory name under `packages/`. */
const PUBLIC_PACKAGE_DIRS = [
  'api',
  'eslint-local-rules',
  'node-runtime',
  'server',
  'tsconfig',
  'ui',
  'utils',
];

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
const toPackageConfig = ({ dir, repoRoot }) => {
  const directory = `packages/${dir}`;
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

/** Every public package's snapshot configuration, in stable name order. */
export const readPublicPackages = (repoRoot) =>
  PUBLIC_PACKAGE_DIRS.map((dir) => toPackageConfig({ dir, repoRoot })).sort(
    (left, right) => left.name.localeCompare(right.name),
  );

/** The tracked snapshot path for a package, relative to the repo root. */
export const snapshotPathFor = (packageName) =>
  `reports/api-surface/${packageName.replace('@lcabrera/', '')}.txt`;

/** True once every entry file the config points at exists on disk. */
export const entriesAreBuilt = (packageConfig) =>
  packageConfig.entries.every(({ entryFile }) => existsSync(entryFile));
