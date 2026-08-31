#!/usr/bin/env node

/**
 * Keeps a built package's published surface honest — against the artifact, not
 * against the manifest's intentions.
 *
 * A published package is consumed from outside its monorepo, where a `.ts` file
 * inside `node_modules` is not loadable at all: Node refuses to strip types
 * there and throws `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`. The built
 * ones therefore build to `dist`, while `exports` keeps pointing at `src` so
 * nothing in the source tree has to build before it can typecheck, test or run.
 * The swap lives in `publishConfig.exports`, which **pnpm** substitutes at pack
 * time — an override `npm pack` ignores outright.
 *
 * So the manifest states an intention and only the tarball states a fact. This
 * gate packs every in-scope package with pnpm and reads the result back: the
 * exports a consumer would get, the files that are really in it, and — for the
 * packages whose dependencies are packed alongside them — a real import from a
 * temporary directory outside this repo. It also asserts that the release path
 * is still the pnpm one the guarantee rests on. See ADR-073.
 *
 * There is deliberately no "nothing was built, so nothing to check" outcome: a
 * publishing gate that reports success having produced no artifact is worse
 * than no gate, because it is believed.
 *
 * Usage (from the repository root, AFTER the packages are built):
 *   repo-verify-publish            # check
 *   repo-verify-publish --write    # regenerate publishConfig.exports
 *
 * Exit codes: 0 = every package packed and its tarball matches the source
 * surface, 1 = it does not, or nothing could be packed (every discrepancy is
 * listed, not just the first).
 */
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { errorMessage } from './error-message.mjs';
import { packAndRead } from './publish-pack.mjs';
import { runConsumerSmoke } from './publish-smoke.mjs';
import {
  buildPublishExports,
  diffSubpaths,
  isBuiltPublicPackage,
  isPublishedTargetCorrect,
  packedSurfaceProblems,
  toBuiltPaths,
} from './publish-surface.mjs';
import { readPublishing } from './config.mjs';
import { resolveHostRoot } from './host-root.mjs';
import { releasePackerProblems } from './release-packer.mjs';

const REPO_ROOT = resolveHostRoot({
  moduleDirectory: dirname(fileURLToPath(import.meta.url)),
});
const readPackageManifests = () => {
  const { packagesDir } = readPublishing(REPO_ROOT);

  return readdirSync(join(REPO_ROOT, packagesDir))
    .map((name) => ({
      directory: `${packagesDir}/${name}`,
      manifestPath: join(REPO_ROOT, packagesDir, name, 'package.json'),
    }))
    .filter(({ manifestPath }) => existsSync(manifestPath))
    .map((entry) => ({
      ...entry,
      manifest: JSON.parse(readFileSync(entry.manifestPath, 'utf8')),
    }));
};

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

const unbuiltProblems = (packages) =>
  packages
    .filter(({ directory }) => !existsSync(join(REPO_ROOT, directory, 'dist')))
    .map(
      ({ directory }) =>
        `${directory}: no dist/, so there is no publishable tarball to check — build the packages first.`,
    );

const checkArtifacts = (packages, problems) => {
  const workDirectory = mkdtempSync(join(tmpdir(), 'publish-verify-'));
  try {
    const packed = packages.map((entry) => ({
      ...packAndRead({
        destination: workDirectory,
        directory: join(REPO_ROOT, entry.directory),
      }),
      sourceExports: entry.manifest.exports ?? {},
      sourceLabel: entry.directory,
    }));

    for (const entry of packed) {
      problems.push(
        ...packedSurfaceProblems({
          files: entry.files,
          label: entry.sourceLabel,
          packedExports: entry.manifest.exports,
          sourceExports: entry.sourceExports,
        }),
      );
    }

    const smoke = runConsumerSmoke({
      packages: packed,
      workDirectory: join(workDirectory, 'consumer'),
    });
    problems.push(...smoke.problems);
    if (smoke.smoked.length === 0) {
      problems.push(
        'no packed package could be imported without a registry, so nothing was proven end to end — at least one package whose dependencies are all packed here must stay in the set.',
      );
    }
    return smoke;
  } finally {
    rmSync(workDirectory, { force: true, recursive: true });
  }
};

const releaseProblems = () => {
  const { releaseWorkflow } = readPublishing(REPO_ROOT);

  return releasePackerProblems({
    lockfiles: readdirSync(REPO_ROOT),
    packageManager: JSON.parse(
      readFileSync(join(REPO_ROOT, 'package.json'), 'utf8'),
    ).packageManager,
    workflowText: readFileSync(join(REPO_ROOT, releaseWorkflow), 'utf8'),
  }).map((problem) => `${releaseWorkflow}: ${problem}`);
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

const reportFailure = (problems) => {
  console.error('Published surface does not match the source surface:\n');
  for (const problem of problems) {
    console.error(`  - ${problem}`);
  }
  console.error(
    `\n${problems.length} problem(s). Consumers install \`dist\`, and nothing else in the source tree exercises that map — so these surface only after publishing.`,
  );
  process.exitCode = 1;
};

const reportSuccess = ({ packages, smoke }) => {
  const subpathCount = packages.reduce(
    (total, { manifest }) =>
      total + Object.keys(manifest.publishConfig?.exports ?? {}).length,
    0,
  );
  console.log(
    `Packed and checked ${packages.length} package(s), ${subpathCount} subpath(s); ` +
      `${smoke.specifiers.length} subpath(s) imported by a consumer outside this repo (${smoke.smoked
        .map(({ name }) => name)
        .join(', ')}).`,
  );
};

const runChecks = (packages) => {
  const problems = packages.flatMap((entry) => {
    const collected = [];
    checkSubpathCoverage(entry, collected);
    checkTargets(entry, collected);
    checkFiles(entry, collected);
    return collected;
  });
  problems.push(...releaseProblems());

  const unbuilt = unbuiltProblems(packages);
  if (unbuilt.length > 0) {
    reportFailure([...problems, ...unbuilt]);
    return;
  }

  const smoke = checkArtifacts(packages, problems);
  if (problems.length > 0) {
    reportFailure(problems);
    return;
  }
  reportSuccess({ packages, smoke });
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

  runChecks(packages);
};

try {
  main();
} catch (error) {
  console.error(`publish-surface: ${errorMessage(error)}`);
  process.exitCode = 1;
}
