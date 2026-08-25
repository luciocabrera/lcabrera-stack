/**
 * Fails the build when anything in the repository names a departed product or
 * workspace. The roster is scripts/departed-names.json.
 *
 * Usage: node scripts/verify-departed-names.mjs
 *
 * Exit codes: 0 = nothing names a departed thing, 1 = something does.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { runGit } from '../packages/repo-standards/scripts/git-exec.mjs';

import {
  departedReferences,
  formatFinding,
  isCheckedFile,
  parseRoster,
  regularFiles,
  staleAllowances,
} from './lib/departed-names.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Tracked files only. Globbing the working tree would walk build output and the
 * residue a deleted workspace leaves behind, which is not what a reader reads.
 *
 * `runGit` rather than a bare `execFileSync('git', …)`: it pins PATH to fixed
 * system directories and strips the `GIT_DIR` family, so the answer is about
 * this repository and not one an inherited variable names.
 */
const trackedFiles = () => {
  const output = runGit({ args: ['ls-files', '-s', '-z'], cwd: REPO_ROOT });
  // `undefined` is git missing or failing — not an empty repository.
  if (output === undefined) {
    throw new Error(
      '`git ls-files` produced nothing. Refusing to report a clean pass on no data.',
    );
  }
  return regularFiles(output);
};

/**
 * Deliberately not wrapped in a try/catch. An unreadable file returning `''`
 * would report exactly what a file naming nothing reports, which is the silent
 * pass this script refuses everywhere else. `readFileSync` does not throw on
 * binary content — it throws on EISDIR (a submodule gitlink), ENOENT (a tracked
 * symlink whose target is gone) and EACCES, none of which should be swallowed
 * by a gate. `main`'s catch turns any of them into a loud, named failure.
 */
const readText = (path) => readFileSync(resolve(REPO_ROOT, path), 'utf8');

const main = () => {
  const { allow, names } = parseRoster(
    readFileSync(resolve(REPO_ROOT, 'scripts/departed-names.json'), 'utf8'),
  );

  const files = trackedFiles().filter(isCheckedFile);
  // A run that walked nothing must not report the same success as a clean tree.
  if (files.length === 0) {
    throw new Error(
      'walked no files — check `git ls-files` and the binary list.',
    );
  }

  const all = files.flatMap((path) =>
    departedReferences({ allow, names, path, text: readText(path) }),
  );

  // Both sections print before exiting: a stale allowance and a reintroduced
  // name are independent, and correcting a stale allowance can only ever add
  // findings. Stopping at the first would cost a CI round-trip to learn about
  // the second (.claude/rules/scripts.md — list every discrepancy).
  const stale = staleAllowances({
    allow,
    seen: new Set(all.map(({ name, path }) => `${path}\0${name}`)),
    walked: new Set(files),
  });
  const findings = all.filter(({ isAllowed }) => !isAllowed);

  if (stale.length > 0) {
    console.error(
      'These allowances in scripts/departed-names.json are stale:\n',
    );
    for (const message of stale) {
      console.error(`  - ${message}`);
    }
    console.error('');
  }

  if (findings.length > 0) {
    console.error('These name something that left this repository:\n');
    for (const finding of findings) {
      console.error(`  - ${formatFinding(finding)}`);
    }
    console.error(
      '\nRewrite the line, or — if the name genuinely must appear — add the file ' +
        'to `allow` in scripts/departed-names.json with the names and a reason.',
    );
  }

  if (stale.length > 0 || findings.length > 0) {
    process.exitCode = 1;
    return;
  }

  const allowed = all.length - findings.length;
  console.log(
    `Departed-name gate passed: ${files.length} tracked file(s) name none of ` +
      `the ${names.length} departed thing(s)` +
      (allowed > 0 ? `, beyond ${allowed} allowed mention(s).` : '.'),
  );
};

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
