#!/usr/bin/env node

/**
 * Fails when a built package's published types don't resolve for a consumer
 * (Are The Types Wrong?).
 *
 * The surface snapshot gate (verify-api-surface.mjs) answers "did the surface
 * change?"; this answers "does the shipped surface even resolve?" — the ESM/CJS
 * and module-resolution traps ADR-038 documents. It runs over the configured
 * packages that build; one that ships source is out of scope, since attw's
 * `.ts`-in-node_modules model does not describe a package whose consumer
 * compiles the source itself.
 *
 * A package with no `dist` is a failure here, not a skip: this gate used to
 * announce that types resolved for every package while having checked none of
 * them, on a tree nobody had built — see ADR-073.
 *
 * Usage (from the repository root, AFTER the packages are built):
 *   repo-verify-types
 *
 * Exit codes: 0 = every in-scope package was checked and its types resolve,
 * 1 = at least one does not, or one could not be checked (all are listed).
 */
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { errorMessage } from './error-message.mjs';
import { checkPackageTypes, formatProblem } from './attw-check.mjs';
import { readPublicPackages } from './api-surface-config.mjs';
import { CONFIG_FILE_NAME } from './config.mjs';
import { resolveHostRoot } from './host-root.mjs';

const REPO_ROOT = resolveHostRoot({
  moduleDirectory: dirname(fileURLToPath(import.meta.url)),
});

const builtPackages = () =>
  readPublicPackages(REPO_ROOT).filter((entry) => !entry.source);

const isBuilt = (packageConfig) =>
  existsSync(join(REPO_ROOT, packageConfig.directory, 'dist'));

const checkResolution = async (packageConfig) => {
  const { problems } = await checkPackageTypes(
    join(REPO_ROOT, packageConfig.directory),
  );
  return problems.length === 0
    ? []
    : [
        `${packageConfig.name}: published types do not resolve:\n${problems
          .map(formatProblem)
          .join('\n')}`,
      ];
};

const main = async () => {
  const packages = builtPackages();
  if (packages.length === 0) {
    console.error(
      `attw gate failed: no package configured in ${CONFIG_FILE_NAME} builds a dist/, so this gate would check nothing — which is almost certainly a mistake.`,
    );
    process.exitCode = 1;
    return;
  }

  const failures = packages
    .filter((packageConfig) => !isBuilt(packageConfig))
    .map(
      (packageConfig) =>
        `${packageConfig.name}: no dist/, so its published types were not checked — build the packages first.`,
    );
  for (const packageConfig of packages.filter(isBuilt)) {
    failures.push(...(await checkResolution(packageConfig)));
  }

  if (failures.length > 0) {
    console.error('attw gate failed:\n');
    for (const failure of failures) {
      console.error(`- ${failure}\n`);
    }
    process.exitCode = 1;
    return;
  }
  console.log(
    `Published types resolve for ${packages.length} package(s): ${packages
      .map((packageConfig) => packageConfig.name)
      .join(', ')}.`,
  );
};

try {
  await main();
} catch (error) {
  console.error(`attw: ${errorMessage(error)}`);
  process.exitCode = 1;
}
