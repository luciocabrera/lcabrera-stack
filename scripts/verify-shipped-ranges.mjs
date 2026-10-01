/**
 * Fails when a dependency range this repository ships excludes the version it
 * publishes for that package, or the minor after it, or admits a release older
 * than it — a range in a `packages/devkit` asset, or one a constant listed in
 * `RANGE_CONSTANTS` holds for a devkit command to write. That range decides
 * which release a created repository installs (ADR-117).
 *
 * The deciding half is `./lib/shipped-ranges.mjs` (pure) and the reading is
 * `./lib/shipped-range-sources.mjs`; this file is the printing and the exit
 * code. See `.claude/rules/scripts.md`.
 *
 * Usage: node scripts/verify-shipped-ranges.mjs
 * Exit codes: 0 = every range admits it, 1 = one does not, or an asset or a
 * listed constant could not be read.
 */

import process from 'node:process';

import {
  assetSources,
  constantSources,
  declarationsIn,
  publishedVersions,
} from './lib/shipped-range-sources.mjs';
import {
  findingLine,
  mentionsIn,
  passLine,
  shippedRangeFindings,
} from './lib/shipped-ranges.mjs';

const REPO_ROOT = process.cwd();

const main = () => {
  const assets = assetSources(REPO_ROOT);
  const constants = constantSources(REPO_ROOT);
  const sources = [...assets, ...constants];
  const versions = publishedVersions(REPO_ROOT);
  const names = Object.keys(versions);

  const declarations = sources.flatMap(declarationsIn);
  const mentions = assets.flatMap(({ hashComments, path, text }) =>
    mentionsIn({ hashComments, names, path, text }),
  );

  const findings = shippedRangeFindings({
    declarations,
    mentions,
    sources,
    versions,
  });

  for (const finding of findings) {
    console.error(`  ${findingLine(finding)}`);
  }

  if (findings.length > 0) {
    console.error(
      '\nA shipped range decides which release a created repository installs, so it has to start at the one this repository publishes and admit the minor after it — and a file naming one of those packages has to yield a declaration this gate can judge.',
    );
    process.exitCode = 1;
    return;
  }

  console.log(passLine({ declarations, mentions, sources }));
};

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
