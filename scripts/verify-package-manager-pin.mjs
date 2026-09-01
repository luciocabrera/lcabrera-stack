#!/usr/bin/env node
/**
 * Gate: a refresh must not leave the `packageManager` pin without its hash.
 *
 * A bare pin names the right version, so nothing else notices it has stopped
 * being an integrity check. Background: #927.
 *
 * Usage (from the repo root):
 *   node scripts/verify-package-manager-pin.mjs
 *   node scripts/verify-package-manager-pin.mjs --before <pin> --corepack-failed
 *   node scripts/verify-package-manager-pin.mjs --manifest <path>
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
    process.exitCode = 1;
  }
};

try {
  main();
} catch (error) {
  process.stderr.write(`verify-package-manager-pin: ${error.message}\n`);
  process.exitCode = 1;
}
