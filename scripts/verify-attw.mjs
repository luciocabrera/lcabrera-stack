/**
 * Fails when a built public package's published types don't resolve for a
 * consumer (Are The Types Wrong?).
 *
 * The surface snapshot gate (scripts/verify-api-surface.mjs) answers "did the
 * surface change?"; this answers "does the shipped surface even resolve?" — the
 * ESM/CJS and module-resolution traps ADR-038 documents. Runs over the three
 * built packages (`api`, `server`, `utils`); source-shipped `ui` is out of
 * scope, since attw's `.ts`-in-node_modules model does not describe a package
 * whose consumer compiles the source itself.
 *
 * Usage (from the repo root, AFTER `vp run packages:build`):
 *   vp run attw:verify
 *
 * Exit codes: 0 = every built package's types resolve, 1 = at least one does
 * not (every problem is listed). Unbuilt packages are skipped with a notice.
 */
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { checkPackageTypes, formatProblem } from './lib/attw-check.mjs';
import { readPublicPackages } from './lib/api-surface-config.mjs';

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../..');

const builtPackages = () =>
  readPublicPackages(REPO_ROOT).filter((entry) => !entry.source);

const main = async () => {
  const packages = builtPackages();
  const failures = [];

  for (const packageConfig of packages) {
    const directory = join(REPO_ROOT, packageConfig.directory);
    if (!existsSync(join(directory, 'dist'))) {
      console.warn(
        `${packageConfig.name}: dist missing, skipped — run \`vp run packages:build\` first.`,
      );
      continue;
    }
    const { problems } = await checkPackageTypes(directory);
    if (problems.length > 0) {
      failures.push(
        `${packageConfig.name}: published types do not resolve:\n${problems
          .map(formatProblem)
          .join('\n')}`,
      );
    }
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
    `Published types resolve for ${packages.length} built package(s).`,
  );
};

try {
  await main();
} catch (error) {
  console.error(`attw: ${error.message}`);
  process.exitCode = 1;
}
