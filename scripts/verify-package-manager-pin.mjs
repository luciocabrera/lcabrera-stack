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
import { readFileSync } from 'node:fs';
import process from 'node:process';

import { flagValue } from '../packages/repo-standards/scripts/cli-input.mjs';
import {
  describePinOutcome,
  parsePackageManagerPin,
} from './lib/package-manager-pin.mjs';

const manifestPath = flagValue('--manifest') ?? 'package.json';
const before = flagValue('--before');
const corepackFailed = process.argv.includes('--corepack-failed');

const fail = (message) => {
  process.stderr.write(`verify-package-manager-pin: ${message}\n`);
  process.exit(1);
};

let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
} catch (error) {
  fail(`cannot read ${manifestPath}: ${error.message}`);
}

const after = manifest.packageManager;

if (after === undefined) {
  fail(
    `${manifestPath} declares no packageManager field. Nothing pins the package manager, so an install can use any version.`,
  );
}

if (parsePackageManagerPin(after) === null) {
  fail(`${manifestPath} has a malformed packageManager pin: ${after}`);
}

const outcome = describePinOutcome({ after, before, corepackFailed });

if (outcome.level === 'error') {
  fail(
    `${outcome.message}.\n` +
      '  taze writes the bare version; corepack adds the "+sha…". A bare pin means corepack\n' +
      '  did not complete its write, so the pin is a version preference rather than an\n' +
      '  integrity check. Re-run `corepack use pnpm@latest` and commit the result.',
  );
}

const stream = outcome.level === 'warn' ? process.stderr : process.stdout;
stream.write(`verify-package-manager-pin: ${outcome.message}\n`);
