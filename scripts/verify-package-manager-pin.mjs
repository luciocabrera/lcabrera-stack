#!/usr/bin/env node
/**
 * Guard: a refresh must not leave the `packageManager` pin without its hash.
 *
 * Why this exists: `vp run deps:refresh` writes that field twice — taze moves
 * the version and writes it bare, corepack rewrites it with the `+sha…` — and
 * the second step can fail in a way nothing downstream notices (#927). The
 * version still moved, so every version-based check reports a successful
 * refresh while the pin has quietly lost the integrity half that makes it worth
 * pinning at all.
 *
 * It also reports what the refresh DID to the pin, because corepack's exit code
 * does not. The distro corepack Node 26 leaves on PATH installs pnpm, rewrites
 * the field, then dies launching it — so `--corepack-failed` changes the
 * wording here but never the verdict. The field decides; the exit code is
 * context.
 *
 * This guards the refresh rather than running as a repo-wide gate because that
 * is the only moment the field is written. A committed pin does not decay on
 * its own; it decays in the seconds between taze and corepack.
 *
 * Usage (from the repo root):
 *   node scripts/verify-package-manager-pin.mjs
 *   node scripts/verify-package-manager-pin.mjs --before pnpm@11.22.0+sha256.… --corepack-failed
 *   node scripts/verify-package-manager-pin.mjs --manifest path/to/package.json
 *
 * Exit : 0 when the pin carries an integrity hash, 1 when it does not, is
 *        absent, malformed, or the manifest cannot be read.
 *
 * Governed by .claude/rules/scripts.md.
 */
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { flagValue } from '../packages/repo-standards/scripts/cli-input.mjs';
import { readTextWithin } from '../packages/repo-standards/scripts/safe-read.mjs';
import {
  describePinOutcome,
  parsePackageManagerPin,
} from './lib/package-manager-pin.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const HINT =
  '  taze writes the bare version; corepack adds the "+sha…". A bare pin means corepack\n' +
  '  did not complete its write, so the pin is a version preference rather than an\n' +
  '  integrity check. Re-run `corepack use pnpm@latest` and commit the result.';

/**
 * `--manifest` reaches the filesystem, so it is containment-checked rather than
 * passed straight to a read. The refresh only ever points this at the root
 * manifest; the flag exists for tests, and a test argument is still an argument.
 *
 * `JSON.parse` happily returns `null` for the text "null", which would then be
 * dereferenced as an object — so the shape is checked here rather than assumed.
 */
const readManifest = (path) => {
  const parsed = JSON.parse(readTextWithin(path, REPO_ROOT));

  if (parsed === null || typeof parsed !== 'object') {
    throw new TypeError(`${path} does not contain a JSON object`);
  }

  return parsed;
};

const main = () => {
  const manifestPath = flagValue('--manifest') ?? 'package.json';
  const before = flagValue('--before');
  const corepackFailed = process.argv.includes('--corepack-failed');

  const after = readManifest(manifestPath).packageManager;

  // Collected rather than thrown one at a time, per .claude/rules/scripts.md.
  // These three are mutually exclusive by nature — a field cannot be both absent
  // and malformed — so the list holds at most one today; the shape is what keeps
  // a fourth check from being bolted on as an early exit.
  const problems = [];

  if (after === undefined) {
    problems.push(
      `${manifestPath} declares no packageManager field. Nothing pins the package manager, so an install can use any version.`,
    );
  } else if (parsePackageManagerPin(after) === null) {
    problems.push(
      `${manifestPath} has a malformed packageManager pin: ${after}`,
    );
  } else {
    const outcome = describePinOutcome({ after, before, corepackFailed });

    if (outcome.level === 'error') {
      problems.push(`${outcome.message}.\n${HINT}`);
    } else {
      const stream = outcome.level === 'warn' ? process.stderr : process.stdout;
      stream.write(`verify-package-manager-pin: ${outcome.message}\n`);
    }
  }

  for (const problem of problems) {
    process.stderr.write(`verify-package-manager-pin: ${problem}\n`);
  }

  if (problems.length > 0) {
    // Never `process.exit()` here: stderr is asynchronous when it is a pipe, and
    // exiting mid-stream can drop the message above — on the one failure path
    // this script exists to explain, under exactly the CI/`tee` runs that need it.
    process.exitCode = 1;
  }
};

try {
  main();
} catch (error) {
  process.stderr.write(`verify-package-manager-pin: ${error.message}\n`);
  process.exitCode = 1;
}
