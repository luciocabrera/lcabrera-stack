/*
 * The `closure` command: walk the named directories, analyse each one, and turn
 * the findings into an exit code.
 *
 * Separate from the CLI entry point so the dispatcher stays a dispatcher, and
 * from the analysis so the wording of a finding can change without touching
 * what counts as one.
 */

import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

import { analyseDirectory, renderClosureReport } from './closure-report.mjs';

export const runClosure = (directories, root) => {
  const missing = directories.filter((directory) => {
    const path = resolve(root, directory);
    return !existsSync(path) || !statSync(path).isDirectory();
  });

  if (missing.length > 0) {
    console.error(`not a directory: ${missing.join(', ')}`);
    return 1;
  }

  const results = directories.map((directory) =>
    analyseDirectory({ directory: resolve(root, directory), root }),
  );

  console.log(renderClosureReport(results));

  const escapes = results.flatMap((result) => result.escapes);
  if (escapes.length === 0) {
    console.log(`\nClosure gate passed: ${results.length} directory(ies).`);
    return 0;
  }

  const dirty = results.filter((result) => result.escapes.length > 0).length;
  console.error(
    `\n${escapes.length} escape(s) across ${dirty} directory(ies).`,
  );
  return 1;
};
