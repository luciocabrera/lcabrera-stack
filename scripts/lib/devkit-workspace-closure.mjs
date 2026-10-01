/**
 * Which `@lcabrera/*` workspaces a created tree resolves, packed from this
 * checkout after a build, with the range findings that decide whether the tree
 * could install them (verify-devkit-workspace.mjs, ADR-125).
 */

import { readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';

import { packOne, run } from './devkit-pack.mjs';
import { readIfPresent, readJson } from './devkit-tree-run.mjs';
import {
  catalogsOf,
  digestsOf,
  installedManifest,
  missingPackageFindings,
  packageClosure,
  rangeFindings,
  scopedDeclarations,
  scopedNames,
} from './devkit-workspace-packages.mjs';

const checkoutPackages = (repoRoot) =>
  new Map(
    readdirSync(join(repoRoot, 'packages'), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => ({
        directory: entry.name,
        manifest: readJson(
          join(repoRoot, 'packages', entry.name, 'package.json'),
        ),
      }))
      .filter(({ manifest }) => typeof manifest.name === 'string')
      .map((found) => [found.manifest.name, found]),
  );

const treeManifests = (tree) =>
  run('git', ['ls-files', '--', '*package.json'], tree)
    .split('\n')
    .filter((path) => path === 'package.json' || path.endsWith('/package.json'))
    .map((path) => ({
      manifest: readJson(join(tree, path)),
      where: `\`${path}\``,
    }));

const packAll = ({ directories, repoRoot, staging }) =>
  directories.map((directory) =>
    packOne({ directory, into: staging, repoRoot: repoRoot }),
  );

/**
 * @param {{ repoRoot: string, staging: string, tree: string }} args
 * @returns {{ findings: string[],
 *             packed: Array<{ file: string, integrity: string,
 *                             manifest: Record<string, unknown> }> }}
 */
export const packedPackages = ({ repoRoot, staging, tree }) => {
  const checkout = checkoutPackages(repoRoot);
  const manifests = treeManifests(tree);
  const { missing, names } = packageClosure({
    manifestOf: (name) => checkout.get(name)?.manifest,
    roots: manifests.flatMap(({ manifest }) => scopedNames(manifest)),
  });
  if (missing.length > 0) {
    return { findings: missingPackageFindings(missing), packed: [] };
  }
  run('vp', ['run', 'packages:build'], repoRoot);
  const packed = packAll({
    directories: names.map((name) => checkout.get(name).directory),
    repoRoot,
    staging,
  });
  const declarations = scopedDeclarations({
    catalogs: catalogsOf(
      readIfPresent(join(tree, 'pnpm-workspace.yaml')) ?? '',
    ),
    manifests: [
      ...manifests,
      ...packed.map(({ manifest }) => ({
        manifest: installedManifest(manifest),
        where: `the packed \`${manifest.name}\``,
      })),
    ],
  });
  return {
    findings: rangeFindings({
      declarations,
      versions: new Map(
        packed.map(({ manifest }) => [manifest.name, manifest.version]),
      ),
    }),
    packed: packed.map(({ manifest, tarball }) => ({
      file: basename(tarball),
      manifest,
      ...digestsOf(readFileSync(tarball)),
    })),
  };
};
