#!/usr/bin/env node

/*
 * The devkit CLI.
 *
 * Why: the setup that makes this repository work is discovered by PATH — an
 * agent reads `.github/skills`, GitHub reads `.github/workflows` — so a package
 * that only sits in node_modules delivers none of it. This command is what puts
 * the files where they are looked for, and what reports when a consumer's copy
 * and the package have diverged.
 *
 * Usage:
 *   devkit closure <directory> [<directory> ...]
 *
 * Exit codes: 0 = nothing to report, 1 = findings or bad arguments.
 */

import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

import { analyseDirectory, renderClosureReport } from './closure-report.mjs';

const USAGE = 'usage: devkit closure <directory> [<directory> ...]';

const runClosure = (directories, root) => {
  const missing = directories.filter(
    (directory) =>
      !existsSync(resolve(root, directory)) ||
      !statSync(resolve(root, directory)).isDirectory(),
  );

  if (missing.length > 0) {
    console.error(`not a directory: ${missing.join(', ')}`);
    return 1;
  }

  const results = directories.map((directory) =>
    analyseDirectory({ directory: resolve(root, directory), root }),
  );

  console.log(renderClosureReport(results));

  const total = results.reduce(
    (count, result) => count + result.escapes.length,
    0,
  );
  if (total === 0) {
    console.log(`\nClosure gate passed: ${results.length} directory(ies).`);
    return 0;
  }
  console.error(
    `\n${total} escape(s) across ${results.filter((result) => result.escapes.length > 0).length} directory(ies).`,
  );
  return 1;
};

const main = () => {
  const [command, ...rest] = process.argv.slice(2);
  const root = process.cwd();

  if (command === 'closure') {
    if (rest.length === 0) {
      console.error(USAGE);
      return 1;
    }
    return runClosure(rest, root);
  }

  console.error(USAGE);
  return 1;
};

try {
  process.exitCode = main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
