/**
 * Fails when a built public package's published types don't resolve for a
 * consumer (Are The Types Wrong?).
 *
 * The surface snapshot gate (scripts/verify-api-surface.mjs) answers "did the
 * surface change?"; this answers "does the shipped surface even resolve?" — the
 * ESM/CJS and module-resolution traps ADR-038 documents. It runs over the
 * public packages that build; source-shipped `ui` is out of scope, since attw's
 * `.ts`-in-node_modules model does not describe a package whose consumer
 * compiles the source itself.
 *
 * A package with no `dist` is a failure here, not a skip: this gate used to
 * announce that types resolved for every package while having checked none of
 * them, on a tree nobody had built — see ADR-073.
 *
 * Usage (from the repo root, AFTER `vp run packages:build`):
 *   vp run attw:verify
 *
 * Exit codes: 0 = every in-scope package was checked and its types resolve,
 * 1 = at least one does not, or one could not be checked (all are listed).
 */
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { checkPackageTypes, formatProblem } from './lib/attw-check.mjs';
import { readPublicPackages } from './lib/api-surface-config.mjs';

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../..');

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
      'attw gate failed: no public package builds a dist/, so this gate would check nothing — which is almost certainly a mistake.',
    );
    process.exitCode = 1;
    return;
  }

  const failures = packages
    .filter((packageConfig) => !isBuilt(packageConfig))
    .map(
      (packageConfig) =>
        `${packageConfig.name}: no dist/, so its published types were not checked — run \`vp run packages:build\` first.`,
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
  console.error(`attw: ${error.message}`);
  process.exitCode = 1;
}
