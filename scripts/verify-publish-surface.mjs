/**
 * Keeps a built package's published surface honest.
 *
 * The four public packages are consumed from outside this monorepo, where a
 * `.ts` file inside `node_modules` is not loadable at all: Node refuses to strip
 * types there and throws `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`. Three of
 * them therefore build to `dist`, while `exports` keeps pointing at `src` so
 * nothing in this repo has to build before it can typecheck, test or run. pnpm
 * substitutes `publishConfig.exports` when it packs the tarball.
 *
 * That split is the hazard this file exists for. The repo exercises the `src`
 * map on every command and the `dist` map on none of them — so a subpath added
 * to `exports` and forgotten in `publishConfig.exports` looks perfectly healthy
 * here and is simply absent for consumers. Nothing fails until someone installs
 * the package.
 *
 * Checks, per package with a `build` script and `publishConfig.access: public`:
 *   1. `publishConfig.exports` covers exactly the same subpaths as `exports`.
 *   2. Every subpath resolves to a built file, with a `types` entry beside it.
 *   3. `files` ships `dist`, or the tarball would contain none of the build.
 *   4. Every target exists on disk — but only once the package has been built,
 *      so run this AFTER `build:all` for the check to mean anything. Without a
 *      `dist/` it reports only the structural half.
 *
 * Usage (from the repo root):
 *   vp run publish:verify              # check (CI runs it after building)
 *   vp run publish:verify -- --write   # regenerate publishConfig.exports
 *
 * Exit codes: 0 = the published surface matches the source surface, 1 = it does
 * not (every discrepancy is listed, not just the first).
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildPublishExports,
  diffSubpaths,
  isBuiltPublicPackage,
  isPublishedTargetCorrect,
  toBuiltPaths,
} from './lib/publish-surface.mjs';

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const PACKAGES_DIR = 'packages';

/** Reads every workspace manifest under `packages/`. */
const readPackageManifests = () =>
  readdirSync(join(REPO_ROOT, PACKAGES_DIR))
    .map((name) => ({
      directory: `${PACKAGES_DIR}/${name}`,
      manifestPath: join(REPO_ROOT, PACKAGES_DIR, name, 'package.json'),
    }))
    .filter(({ manifestPath }) => existsSync(manifestPath))
    .map((entry) => ({
      ...entry,
      manifest: JSON.parse(readFileSync(entry.manifestPath, 'utf8')),
    }));

const checkSubpathCoverage = ({ directory, manifest }, problems) => {
  const { extra, missing } = diffSubpaths({
    published: Object.keys(manifest.publishConfig?.exports ?? {}),
    source: Object.keys(manifest.exports ?? {}),
  });

  for (const subpath of missing) {
    problems.push(
      `${directory}: \`${subpath}\` is in \`exports\` but not \`publishConfig.exports\` — consumers would not get it. Run with --write.`,
    );
  }
  for (const subpath of extra) {
    problems.push(
      `${directory}: \`${subpath}\` is in \`publishConfig.exports\` but no longer in \`exports\` — it was renamed or removed. Run with --write.`,
    );
  }
};

const checkTargets = ({ directory, manifest }, problems) => {
  const isBuilt = existsSync(join(REPO_ROOT, directory, 'dist'));

  for (const [subpath, sourceTarget] of Object.entries(
    manifest.exports ?? {},
  )) {
    const published = manifest.publishConfig?.exports?.[subpath];
    if (published === undefined) {
      continue;
    }
    if (!isPublishedTargetCorrect({ published, sourceTarget })) {
      problems.push(
        `${directory}: \`${subpath}\` should publish as ${toBuiltPaths(sourceTarget).default}, not ${JSON.stringify(published)}. Run with --write.`,
      );
      continue;
    }
    if (!isBuilt) {
      continue;
    }
    for (const target of Object.values(toBuiltPaths(sourceTarget))) {
      if (!existsSync(join(REPO_ROOT, directory, target))) {
        problems.push(
          `${directory}: \`${subpath}\` points at ${target}, which the build did not produce.`,
        );
      }
    }
  }
};

const checkFiles = ({ directory, manifest }, problems) => {
  if (!(manifest.files ?? []).includes('dist')) {
    problems.push(
      `${directory}: \`files\` does not include "dist", so the tarball would ship none of the build.`,
    );
  }
};

const writePublishExports = ({ manifest, manifestPath }) => {
  const rebuilt = buildPublishExports(manifest.exports);
  const updated = {
    ...manifest,
    publishConfig: { ...manifest.publishConfig, exports: rebuilt },
  };
  writeFileSync(manifestPath, `${JSON.stringify(updated, undefined, 2)}\n`);
  return Object.keys(rebuilt).length;
};

const main = () => {
  const packages = readPackageManifests().filter(({ manifest }) =>
    isBuiltPublicPackage(manifest),
  );

  if (packages.length === 0) {
    console.error(
      'No package has both a `build` script and `publishConfig.access: "public"` — this gate is checking nothing, which is almost certainly a mistake.',
    );
    process.exitCode = 1;
    return;
  }

  if (process.argv.includes('--write')) {
    for (const entry of packages) {
      console.log(
        `${entry.directory}: wrote ${writePublishExports(entry)} published subpath(s).`,
      );
    }
    return;
  }

  const problems = [];
  for (const entry of packages) {
    checkSubpathCoverage(entry, problems);
    checkTargets(entry, problems);
    checkFiles(entry, problems);
  }

  if (problems.length > 0) {
    console.error('Published surface does not match the source surface:\n');
    for (const problem of problems) {
      console.error(`  - ${problem}`);
    }
    console.error(
      `\n${problems.length} problem(s). Consumers install \`dist\`, and nothing else in this repo exercises that map — so these surface only after publishing.`,
    );
    process.exitCode = 1;
    return;
  }

  const subpathCount = packages.reduce(
    (total, { manifest }) =>
      total + Object.keys(manifest.publishConfig?.exports ?? {}).length,
    0,
  );
  const builtCount = packages.filter(({ directory }) =>
    existsSync(join(REPO_ROOT, directory, 'dist')),
  ).length;
  console.log(
    `Published surface is accurate: ${packages.length} built package(s), ${subpathCount} subpath(s); ` +
      `${builtCount} of ${packages.length} verified against a real dist/.`,
  );
};

main();
