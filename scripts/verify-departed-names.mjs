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
  departedPathReferences,
  departedReferences,
  formatFinding,
  formatPathFinding,
  isCheckedFile,
  parseRoster,
  regularFiles,
  staleAllowances,
} from './lib/departed-names.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const trackedFiles = () => {
  const output = runGit({ args: ['ls-files', '-s', '-z'], cwd: REPO_ROOT });
  if (output === undefined) {
    throw new Error(
      '`git ls-files` produced nothing. Refusing to report a clean pass on no data.',
    );
  }
  return regularFiles(output);
};

const readText = (path) => readFileSync(resolve(REPO_ROOT, path), 'utf8');

const main = () => {
  const { allow, names } = parseRoster(
    readFileSync(resolve(REPO_ROOT, 'scripts/departed-names.json'), 'utf8'),
  );

  const tracked = trackedFiles();
  const files = tracked.filter(isCheckedFile);
  if (files.length === 0) {
    throw new Error(
      'walked no files — check `git ls-files` and the binary list.',
    );
  }

  const all = files.flatMap((path) =>
    departedReferences({ allow, names, path, text: readText(path) }),
  );
  const pathHits = departedPathReferences({ allow, names, paths: tracked });

  const stale = staleAllowances({
    allow,
    seen: new Set(
      [...all, ...pathHits].map(({ name, path }) => `${path}\0${name}`),
    ),
    walked: new Set(files),
  });
  const findings = all.filter(({ isAllowed }) => !isAllowed);
  const pathFindings = pathHits.filter(({ isAllowed }) => !isAllowed);

  if (stale.length > 0) {
    console.error(
      'These allowances in scripts/departed-names.json are stale:\n',
    );
    for (const message of stale) {
      console.error(`  - ${message}`);
    }
    console.error('');
  }

  if (pathFindings.length > 0) {
    console.error('These PATHS name something that left this repository:\n');
    for (const finding of pathFindings) {
      console.error(`  - ${formatPathFinding(finding)}`);
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

  if (stale.length > 0 || findings.length > 0 || pathFindings.length > 0) {
    process.exitCode = 1;
    return;
  }

  const allowed = all.length - findings.length;
  console.log(
    `Departed-name gate passed: ${files.length} tracked file(s) name none of ` +
      `the ${names.length} departed thing(s), in their paths or their contents` +
      (allowed > 0 ? `, beyond ${allowed} allowed mention(s).` : '.'),
  );
};

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
