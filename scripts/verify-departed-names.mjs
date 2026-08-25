/**
 * Fails the build when anything in the repository names a departed product or
 * workspace. The roster is scripts/departed-names.json.
 *
 * Usage: node scripts/verify-departed-names.mjs
 *
 * Exit codes: 0 = nothing names a departed thing, 1 = something does.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  departedReferences,
  formatFinding,
  isCheckedFile,
  parseRoster,
} from './lib/departed-names.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Tracked files only. Globbing the working tree would walk build output and the
 * residue a deleted workspace leaves behind, which is not what a reader reads.
 */
const trackedFiles = () =>
  execFileSync('git', ['ls-files', '-z'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
    .split('\0')
    .filter(Boolean);

/** A file git tracks may still be binary; those decode to replacement chars. */
const readText = (path) => {
  try {
    return readFileSync(resolve(REPO_ROOT, path), 'utf8');
  } catch {
    return '';
  }
};

const main = () => {
  const { allowed, names } = parseRoster(
    readFileSync(resolve(REPO_ROOT, 'scripts/departed-names.json'), 'utf8'),
  );

  const files = trackedFiles().filter(isCheckedFile);
  // A run that walked nothing must not report the same success as a clean tree.
  if (files.length === 0) {
    throw new Error(
      'walked no files — check `git ls-files` and the extension list.',
    );
  }

  const findings = files.flatMap((path) =>
    departedReferences({ allowed, names, path, text: readText(path) }),
  );

  if (findings.length > 0) {
    console.error('These name something that left this repository:\n');
    for (const finding of findings) {
      console.error(`  - ${formatFinding(finding)}`);
    }
    console.error(
      '\nRewrite the line, or — if the name genuinely must appear — add the file ' +
        'to `allow` in scripts/departed-names.json with a reason.',
    );
    process.exitCode = 1;
    return;
  }

  console.log(
    `Departed-name gate passed: ${files.length} tracked file(s) name none of ` +
      `the ${names.length} departed thing(s).`,
  );
};

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
