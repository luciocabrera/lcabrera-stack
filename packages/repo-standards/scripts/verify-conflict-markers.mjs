#!/usr/bin/env node
/**
 * Fails when a tracked file still carries a merge-conflict marker, including
 * one a Markdown formatter has already reshaped so that `git diff --check` and
 * a search for the raw marker both miss it. The patterns are in
 * `./conflict-markers.mjs`.
 *
 * Usage: repo-verify-conflict-markers
 * Exit codes: 0 = no tracked file carries a marker, 1 = one does, or git
 * listed no files to read.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { conflictMarkersIn, formatFinding } from './conflict-markers.mjs';
import { regularFiles } from './departed-names.mjs';
import { errorMessage } from './error-message.mjs';
import { runGit } from './git-exec.mjs';
import { resolveHostRoot } from './host-root.mjs';

const REPO_ROOT = resolveHostRoot({
  moduleDirectory: dirname(fileURLToPath(import.meta.url)),
});

const trackedFiles = () => {
  const output = runGit({ args: ['ls-files', '-s', '-z'], cwd: REPO_ROOT });
  const files = output === undefined ? [] : regularFiles(output);
  if (files.length === 0) {
    throw new Error(
      '`git ls-files` listed no tracked files. Refusing to report a clean pass on no data.',
    );
  }
  return files;
};

const readTracked = (paths) =>
  paths
    .filter((path) => existsSync(resolve(REPO_ROOT, path)))
    .map((path) => ({
      path,
      text: readFileSync(resolve(REPO_ROOT, path), 'utf8'),
    }));

const main = () => {
  const files = readTracked(trackedFiles());
  const findings = conflictMarkersIn(files);

  if (findings.length > 0) {
    process.stderr.write(
      'These tracked lines are merge-conflict markers left by an unfinished merge:\n\n',
    );
    for (const finding of findings) {
      process.stderr.write(`  ${formatFinding(finding)}\n`);
    }
    process.stderr.write(
      '\nResolve the conflict in each file: keep the side you want, then delete\n' +
        'the marker lines. A formatter may have rewritten a marker into a block\n' +
        'quote or a table cell, so check the lines around each one as well.\n',
    );
    process.exitCode = 1;
    return;
  }

  process.stdout.write(
    `Conflict-marker gate passed: ${files.length} tracked file(s) read, none carries a marker.\n`,
  );
};

try {
  main();
} catch (error) {
  process.stderr.write(`verify-conflict-markers: ${errorMessage(error)}\n`);
  process.exitCode = 1;
}
