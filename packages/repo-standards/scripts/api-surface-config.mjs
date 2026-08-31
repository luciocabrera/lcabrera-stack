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

import { CONFIG_FILE_NAME, readPublishing } from './config.mjs';
import { toBuiltPaths } from './publish-surface.mjs';

const isContractSubpath = (subpath) =>
  subpath !== './package.json' && !subpath.includes('*');

const shipsSource = (manifest) => manifest.scripts?.build === undefined;

const entryForBuilt = (sourceTarget) => toBuiltPaths(sourceTarget).types;

const SCOPED_NAME = /^@[^@/\\]+\/[^@/\\]+$/;
const BARE_NAME = /^[^@/\\]+$/;

const isPackageName = (value) =>
  typeof value === 'string' &&
  (SCOPED_NAME.test(value) || BARE_NAME.test(value));

const readRosteredManifest = ({ directory, packagesDir, repoRoot }) => {
  const manifestPath = join(repoRoot, directory, 'package.json');
  if (!existsSync(manifestPath)) {
    throw new Error(
      `${CONFIG_FILE_NAME}: \`publishing.publicPackageDirs\` names \`${directory.slice(packagesDir.length + 1)}\`, but there is no manifest at \`${directory}/package.json\`. Each entry is a directory name under \`publishing.packagesDir\` (\`${packagesDir}\`), not a path from the repository root.`,
    );
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (!isPackageName(manifest.name)) {
    throw new Error(
      `${CONFIG_FILE_NAME}: \`publishing.publicPackageDirs\` names \`${directory.slice(packagesDir.length + 1)}\`, but \`${directory}/package.json\` declares the name ${JSON.stringify(manifest.name)}. A rostered package is identified and filed by its name, so it must be \`@scope/name\` or \`name\`.`,
    );
  }
  return manifest;
};

const toPackageConfig = ({ dir, packagesDir, repoRoot }) => {
  const directory = `${packagesDir}/${dir}`;
  const manifest = readRosteredManifest({ directory, packagesDir, repoRoot });
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

export const readPublicPackages = (repoRoot) => {
  const { packagesDir, publicPackageDirs } = readPublishing(repoRoot);

  return publicPackageDirs
    .map((dir) => toPackageConfig({ dir, packagesDir, repoRoot }))
    .sort((left, right) => left.name.localeCompare(right.name));
};

const unscoped = (packageName) => {
  if (isPackageName(packageName)) {
    return packageName.startsWith('@')
      ? packageName.slice(packageName.indexOf('/') + 1)
      : packageName;
  }
  throw new Error(
    `a rostered package declares the name ${JSON.stringify(packageName)}, which is not a package name — a snapshot path is built from it, so it must be \`@scope/name\` or \`name\`, with no other separator.`,
  );
};

export const snapshotPathFor = (packageName, repoRoot) =>
  `${readPublishing(repoRoot).apiSurfaceDir}/${unscoped(packageName)}.txt`;

export const entriesAreBuilt = (packageConfig) =>
  packageConfig.entries.every(({ entryFile }) => existsSync(entryFile));
