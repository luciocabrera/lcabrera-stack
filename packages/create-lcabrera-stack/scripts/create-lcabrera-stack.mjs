#!/usr/bin/env node

/*
 * `pnpm create lcabrera-stack <directory>` — a shim, and nothing else.
 *
 * The initializer name a package manager resolves is unscoped and fixed, so it
 * cannot be a subpath of the package that holds the behaviour. This file exists
 * only to hand its arguments to `devkit create`; anything it decided for itself
 * would be a second implementation nobody runs the other way round.
 *
 * Usage: create-lcabrera-stack <directory> [--profile <name>]
 * Exit codes: whatever `devkit create` exits with; 1 if it could not be run,
 * and a run that never started says so rather than exiting quietly.
 */

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import process from 'node:process';

const DEVKIT = '@lcabrera/devkit';
const SUBCOMMAND = 'create';

const devkitCli = () => {
  const manifestPath = createRequire(import.meta.url).resolve(
    `${DEVKIT}/package.json`,
  );
  const { bin } = JSON.parse(readFileSync(manifestPath, 'utf8'));
  return resolve(dirname(manifestPath), bin.devkit);
};

try {
  const result = spawnSync(
    process.execPath,
    [devkitCli(), SUBCOMMAND, ...process.argv.slice(2)],
    { stdio: 'inherit' },
  );
  if (result.error !== undefined) throw result.error;
  if (result.status === null) {
    throw new Error(`terminated by ${result.signal ?? 'an unknown signal'}`);
  }
  process.exitCode = result.status;
} catch (error) {
  process.stderr.write(
    `create-lcabrera-stack: could not run \`devkit ${SUBCOMMAND}\` — ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
}
