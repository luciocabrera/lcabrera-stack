#!/usr/bin/env node

/**
 * Refuses a silent breaking change to the configured packages' API surface.
 *
 * A repository's own harness compiles every consumer inside it, so a break
 * there fails the build — but the real consumers live outside the tree, and
 * nothing here compiles against them. A removed export, a changed signature or
 * a reshaped union in the PUBLISHED contract passes every gate that only looks
 * inward (`repo-verify-publish` checks subpath parity, never the type surface).
 * This is that missing net: a tracked snapshot of each package's exported
 * surface, taken against what a consumer installs — the built `.d.mts` for a
 * package that builds, the `src` entry for one that ships source — plus a
 * changeset cross-check. See ADR-046 and #359.
 *
 * Usage (from the repository root, AFTER the packages are built):
 *   repo-verify-api-surface           # check; lists every drift
 *   repo-verify-api-surface --write   # regenerate the snapshots
 *
 * A package whose published entry files are not on disk fails here rather than
 * being skipped: the gate used to report success for the packages it could read
 * while announcing the rest as "skipped, unbuilt", which on an unbuilt tree is a
 * pass that compared nothing (ADR-073).
 *
 * Exit codes: 0 = every configured package was compared and matches its snapshot
 * (and breaking changes carry a changeset), 1 = drift, an unaccompanied
 * breaking change, or a package that could not be read (all listed).
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { errorMessage } from './error-message.mjs';
import {
  collectBumpedPackages,
  missingChangesets,
} from './api-surface-changeset.mjs';
import {
  entriesAreBuilt,
  readPublicPackages,
  snapshotPathFor,
} from './api-surface-config.mjs';
import {
  diffSurfaces,
  formatChange,
  hasBreakingChange,
} from './api-surface-diff.mjs';
import { extractSurface } from './api-surface-extract.mjs';
import { parseSurface, renderSurface } from './api-surface-render.mjs';
import { CONFIG_FILE_NAME, readConventions } from './config.mjs';
import { runGit } from './git-exec.mjs';
import { resolveHostRoot } from './host-root.mjs';

const REPO_ROOT = resolveHostRoot({
  moduleDirectory: dirname(fileURLToPath(import.meta.url)),
});

const baseRef = () =>
  process.env.API_SURFACE_BASE ??
  `origin/${readConventions(REPO_ROOT).defaultBranch}`;

const readSnapshot = (relativePath) => {
  const absolute = join(REPO_ROOT, relativePath);
  return existsSync(absolute) ? readFileSync(absolute, 'utf8') : undefined;
};

const readBaseSnapshot = (relativePath) =>
  runGit({ args: ['show', `${baseRef()}:${relativePath}`], cwd: REPO_ROOT });

const readChangesetContents = () => {
  const directory = join(REPO_ROOT, '.changeset');
  return readdirSync(directory)
    .filter((name) => name.endsWith('.md') && name !== 'README.md')
    .map((name) => readFileSync(join(directory, name), 'utf8'));
};

const isUnbuilt = (packageConfig) =>
  !packageConfig.source && !entriesAreBuilt(packageConfig);

const missingEntries = (packageConfig) =>
  packageConfig.entries
    .filter(({ entryFile }) => !existsSync(entryFile))
    .map(({ entryFile }) => relative(REPO_ROOT, entryFile));

const unreadableProblem = (packageConfig) => {
  const missing = missingEntries(packageConfig);
  const listed = missing.slice(0, 3).join(', ');
  const rest = missing.length > 3 ? ', …' : '';
  return `${packageConfig.name}: no surface was read, so it was compared to nothing — these published entry files are not on disk: ${listed}${rest}. Build the packages, then re-run; if the build is current, \`exports\` names a file it does not produce.`;
};

const writeSnapshots = (packages) => {
  const problems = [];
  for (const packageConfig of packages) {
    if (isUnbuilt(packageConfig)) {
      problems.push(unreadableProblem(packageConfig));
      continue;
    }
    const surface = extractSurface(packageConfig);
    const relativePath = snapshotPathFor(packageConfig.name, REPO_ROOT);
    writeFileSync(
      join(REPO_ROOT, relativePath),
      renderSurface({ packageName: packageConfig.name, surface }),
    );
    console.log(`${packageConfig.name}: wrote ${relativePath}`);
  }
  return problems;
};

const verifyPackage = (packageConfig) => {
  const surface = extractSurface(packageConfig);
  const liveText = renderSurface({
    packageName: packageConfig.name,
    surface,
  });
  const relativePath = snapshotPathFor(packageConfig.name, REPO_ROOT);
  const committed = readSnapshot(relativePath);

  const drift = [];
  if (committed === undefined) {
    drift.push(
      `${packageConfig.name}: no snapshot at ${relativePath} — run \`repo-verify-api-surface --write\`.`,
    );
  } else if (committed !== liveText) {
    const changes = diffSurfaces({
      base: parseSurface(committed),
      next: surface,
    });
    drift.push(
      `${packageConfig.name}: the published surface changed but ${relativePath} was not regenerated:\n${changes
        .map(formatChange)
        .join(
          '\n',
        )}\n  → run \`repo-verify-api-surface --write\` and commit the snapshot.`,
    );
  }

  const baseText = readBaseSnapshot(relativePath);
  const changedVsBase =
    baseText === undefined
      ? []
      : diffSurfaces({ base: parseSurface(baseText), next: surface });

  return {
    changed:
      changedVsBase.length > 0
        ? {
            breaking: hasBreakingChange(changedVsBase),
            name: packageConfig.name,
          }
        : undefined,
    drift,
  };
};

const changesetProblems = (changedPackages) => {
  const bumpedPackages = collectBumpedPackages(readChangesetContents());
  const missing = missingChangesets({ bumpedPackages, changedPackages });
  return {
    problems: missing
      .filter((entry) => entry.required)
      .map(
        (entry) =>
          `${entry.name}: breaking surface change with no changeset — add one bumping ${entry.name} (see .changeset/README.md).`,
      ),
    warnings: missing
      .filter((entry) => !entry.required)
      .map(
        (entry) =>
          `${entry.name}: additive surface change and no changeset — a minor bump is advisable.`,
      ),
  };
};

const runVerify = (packages) => {
  const active = packages.filter((packageConfig) => !isUnbuilt(packageConfig));
  const unbuilt = packages
    .filter(isUnbuilt)
    .map((packageConfig) => unreadableProblem(packageConfig));

  const results = active.map(verifyPackage);
  const drift = results.flatMap((result) => result.drift);
  const changedPackages = results
    .map((result) => result.changed)
    .filter((entry) => entry !== undefined);
  const { problems: changesetFailures, warnings } =
    changesetProblems(changedPackages);

  for (const warning of warnings) {
    console.warn(`warning: ${warning}`);
  }

  const problems = [...unbuilt, ...drift, ...changesetFailures];
  if (problems.length > 0) {
    console.error('Public API surface gate failed:\n');
    for (const problem of problems) {
      console.error(`- ${problem}\n`);
    }
    process.exitCode = 1;
    return;
  }
  console.log(
    `Public API surface is accurate for ${active.length} package(s): ${active
      .map((packageConfig) => packageConfig.name)
      .join(', ')}.`,
  );
};

const main = () => {
  const packages = readPublicPackages(REPO_ROOT);
  if (packages.length === 0) {
    console.error(
      `Public API surface gate failed: ${CONFIG_FILE_NAME} configures no package under \`publishing.publicPackageDirs\`, so this gate would check nothing — which is almost certainly a mistake.`,
    );
    process.exitCode = 1;
    return;
  }
  if (process.argv.includes('--write')) {
    const problems = writeSnapshots(packages);
    if (problems.length > 0) {
      for (const problem of problems) {
        console.error(`- ${problem}`);
      }
      process.exitCode = 1;
    }
    return;
  }
  runVerify(packages);
};

try {
  main();
} catch (error) {
  console.error(`api-surface: ${errorMessage(error)}`);
  process.exitCode = 1;
}
