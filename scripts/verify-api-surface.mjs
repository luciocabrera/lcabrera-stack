/**
 * Refuses a silent breaking change to the four public packages' API surface.
 *
 * The harness compiles every in-repo consumer, so an in-repo break fails the
 * gate — but the real consumers of `@lcabrera/{api,server,ui,utils}` live outside
 * this tree, and nothing here compiles against them. A removed export, a changed
 * signature or a reshaped union in the PUBLISHED contract passes every existing
 * gate (`publish:verify` checks subpath parity, never the type surface). This is
 * that missing net: a tracked snapshot of each package's exported surface, taken
 * against what a consumer installs (`dist` `.d.mts`; `src` for source-shipped
 * `ui`), plus a changeset cross-check. See docs/decisions/ADR-046 and #359.
 *
 * Usage (from the repo root, AFTER `vp run packages:build`):
 *   vp run api-surface:verify            # check; lists every drift
 *   vp run api-surface:verify -- --write # regenerate the snapshots
 *
 * Exit codes: 0 = surface matches the snapshots (and breaking changes carry a
 * changeset), 1 = drift or an unaccompanied breaking change (all listed).
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  collectBumpedPackages,
  missingChangesets,
} from './lib/api-surface-changeset.mjs';
import {
  entriesAreBuilt,
  readPublicPackages,
  snapshotPathFor,
} from './lib/api-surface-config.mjs';
import {
  diffSurfaces,
  formatChange,
  hasBreakingChange,
} from './lib/api-surface-diff.mjs';
import { extractSurface } from './lib/api-surface-extract.mjs';
import { parseSurface, renderSurface } from './lib/api-surface-render.mjs';
import { runGit } from './lib/git-exec.mjs';

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const BASE_REF = process.env.API_SURFACE_BASE ?? 'origin/main';

const readSnapshot = (relativePath) => {
  const absolute = join(REPO_ROOT, relativePath);
  return existsSync(absolute) ? readFileSync(absolute, 'utf8') : undefined;
};

/** The snapshot as committed on the base ref, or undefined if it is new there. */
const readBaseSnapshot = (relativePath) =>
  runGit({ args: ['show', `${BASE_REF}:${relativePath}`], cwd: REPO_ROOT });

const readChangesetContents = () => {
  const directory = join(REPO_ROOT, '.changeset');
  return readdirSync(directory)
    .filter((name) => name.endsWith('.md') && name !== 'README.md')
    .map((name) => readFileSync(join(directory, name), 'utf8'));
};

/** True for a built package whose `dist` is not on disk — nothing to read yet. */
const isUnbuilt = (packageConfig) =>
  !packageConfig.source && !entriesAreBuilt(packageConfig);

const writeSnapshots = (packages) => {
  const problems = [];
  for (const packageConfig of packages) {
    if (isUnbuilt(packageConfig)) {
      problems.push(
        `${packageConfig.name}: dist is missing — run \`vp run packages:build\` before --write.`,
      );
      continue;
    }
    const surface = extractSurface(packageConfig);
    const relativePath = snapshotPathFor(packageConfig.name);
    writeFileSync(
      join(REPO_ROOT, relativePath),
      renderSurface({ packageName: packageConfig.name, surface }),
    );
    console.log(`${packageConfig.name}: wrote ${relativePath}`);
  }
  return problems;
};

/** Compares the live surface to the committed snapshot; collects drift + change vs base. */
const verifyPackage = (packageConfig) => {
  const surface = extractSurface(packageConfig);
  const liveText = renderSurface({
    packageName: packageConfig.name,
    surface,
  });
  const relativePath = snapshotPathFor(packageConfig.name);
  const committed = readSnapshot(relativePath);

  const drift = [];
  if (committed === undefined) {
    drift.push(
      `${packageConfig.name}: no snapshot at ${relativePath} — run \`vp run api-surface:verify -- --write\`.`,
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
        )}\n  → run \`vp run api-surface:verify -- --write\` and commit the snapshot.`,
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
  const skipped = packages.filter(isUnbuilt);
  for (const packageConfig of skipped) {
    console.warn(
      `${packageConfig.name}: dist missing, skipped (structural mode) — build for a full check.`,
    );
  }

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

  const problems = [...drift, ...changesetFailures];
  if (problems.length > 0) {
    console.error('Public API surface gate failed:\n');
    for (const problem of problems) {
      console.error(`- ${problem}\n`);
    }
    process.exitCode = 1;
    return;
  }
  const skippedNote =
    skipped.length > 0 ? ` (${skipped.length} skipped, unbuilt)` : '';
  console.log(
    `Public API surface is accurate for ${active.length} package(s)${skippedNote}.`,
  );
};

const main = () => {
  const packages = readPublicPackages(REPO_ROOT);
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
  console.error(`api-surface: ${error.message}`);
  process.exitCode = 1;
}
