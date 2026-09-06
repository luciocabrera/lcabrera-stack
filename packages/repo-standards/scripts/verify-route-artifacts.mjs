#!/usr/bin/env node
/**
 * Fails the build when a `*.types` / `*.constants` file inside a route folder is
 * named after nothing the folder holds.
 *
 * Why this is a script and not part of the rule it completes.
 * `local-rules/domain-folder-filename` (#604) enforces the same convention
 * everywhere else, and exempts the whole route tree because it classifies a
 * folder from its path alone — a path cannot say that
 * `routes/car-sales-infinite/` holds a component called `CarSales`. Closing that
 * inside the rule needs the directory listing, and the rule cannot have it: its
 * eslint pass is not type-aware, so there is no program to enumerate siblings
 * from, and a non-literal `fs` call is what
 * `security/detect-non-literal-fs-filename` forbids in a package that publishes
 * as `@lcabrera/eslint-plugin` and may not carry a suppression. Here neither
 * constraint applies, and the published rule keeps working for consumers
 * unchanged.
 *
 * The convention therefore has two homes, and they cite each other: the rule's
 * header points at this gate, and `./route-artifacts.mjs` holds the shared
 * lists with a test that asserts they still match the rule's source.
 *
 * The listing comes from `git ls-files` rather than a directory walk, so an
 * untracked scratch file cannot satisfy the check for a file that is committed.
 *
 * Usage:
 *   repo-verify-route-artifacts
 *
 * Exit codes: 0 = every route-folder file names an artifact beside it,
 * 1 = one does not, or the tracked file list could not be read.
 */
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { errorMessage } from './error-message.mjs';
import { runGit } from './git-exec.mjs';
import { resolveHostRoot } from './host-root.mjs';
import { describeFinding, routeArtifactReport } from './route-artifacts.mjs';

const REPO_ROOT = resolveHostRoot({
  moduleDirectory: dirname(fileURLToPath(import.meta.url)),
});

const trackedPaths = () => {
  const output = runGit({ args: ['ls-files'], cwd: REPO_ROOT });
  if (output === undefined) {
    throw new Error(
      'Route-artifact gate: could not list tracked files. Refusing to report a clean pass on no data.',
    );
  }
  return output.split('\n').filter((line) => line !== '');
};

const reportFindings = (findings) => {
  console.error(
    `Route-artifact gate — ${findings.length} file(s) named after nothing in their folder:\n`,
  );
  for (const finding of findings) {
    console.error(`  - ${describeFinding(finding)}`);
  }
  console.error(
    '\nA route folder is named for its URL segment, so its shared modules are named',
  );
  console.error(
    'for the artifact instead — see .claude/rules/typescript.md § File Naming Suffixes.',
  );
};

const summarise = ({ checked, skipped }) =>
  skipped.length === 0
    ? `Route-artifact gate passed: ${checked} route-folder file(s) name an artifact beside them.`
    : `Route-artifact gate passed: ${checked} route-folder file(s) checked, ${skipped.length} skipped (their folder holds no artifact module).`;

const main = () => {
  const report = routeArtifactReport(trackedPaths());
  if (report.findings.length > 0) {
    reportFindings(report.findings);
    process.exitCode = 1;
    return;
  }
  console.log(summarise(report));
};

try {
  main();
} catch (error) {
  // `throw` accepts any value, so `error.message` renders `undefined` for a
  // thrown string or object — destroying the output exactly when something
  // unexpected went wrong.
  console.error(errorMessage(error));
  process.exitCode = 1;
}
