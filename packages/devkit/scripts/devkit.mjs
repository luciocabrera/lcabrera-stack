#!/usr/bin/env node

/*
 * The devkit CLI.
 *
 * Why: the setup that makes this repository work is discovered by PATH — an
 * agent reads the skills directory, GitHub reads the workflows directory — so a
 * package that only sits in node_modules delivers none of it. These commands put
 * the files where they are looked for, report when a consumer's copy and the
 * package have diverged, and measure whether a directory can travel at all.
 *
 * Usage:
 *   devkit create <directory> [--profile <name>]
 *   devkit init [--profile <name>] [--force] [--upgrade]
 *   devkit sync [--profile <name>]
 *   devkit doctor [--profile <name>] [--check] [--verbose]
 *   devkit doctor --accept <path> --reason "<why>"
 *   devkit closure [--profile <name>] <directory> [<directory> ...]
 *   devkit closure [--profile <name>] --shipped
 *
 * Exit codes: 0 = nothing to report, 1 = findings, drift under --check, or bad
 * arguments.
 */

import { runClosure } from './command-closure.mjs';
import { runCreate } from './command-create.mjs';
import { runInit } from './command-init.mjs';
import { runDoctor, runSync } from './command-sync.mjs';

const USAGE = [
  'usage:',
  '  devkit create <directory> [--profile <name>]',
  '  devkit init [--profile <name>] [--force] [--upgrade]',
  '  devkit sync [--profile <name>]',
  '  devkit doctor [--profile <name>] [--check] [--verbose]',
  '  devkit doctor --accept <path> --reason "<why>"',
  '  devkit closure [--profile <name>] <directory> [<directory> ...]',
  '  devkit closure [--profile <name>] --shipped',
].join('\n');

const COMMANDS = {
  closure: runClosure,
  create: runCreate,
  doctor: runDoctor,
  init: runInit,
  sync: runSync,
};

const withoutSeparator = (argv) => argv.filter((entry) => entry !== '--');

const HELP_FLAGS = new Set(['--help', '-h']);
const HELP_COMMAND = 'help';

const asksForHelp = (entries) =>
  entries[0] === HELP_COMMAND || entries.some((entry) => HELP_FLAGS.has(entry));

/** @param {{ argv: string[], root: string }} args */
export const runCommand = ({ argv, root }) => {
  const entries = withoutSeparator(argv);

  if (asksForHelp(entries)) {
    console.log(USAGE);
    return 0;
  }

  const [command, ...rest] = entries;
  const handler = Object.hasOwn(COMMANDS, command ?? '')
    ? COMMANDS[command]
    : undefined;

  if (handler === undefined) {
    console.error(USAGE);
    return 1;
  }
  return handler(rest, root);
};

// Guarded so importing this module — a test, or a consumer reaching for
// `runCommand` — does not execute the CLI as a side effect of the import.
if (import.meta.main) {
  try {
    process.exitCode = runCommand({
      argv: process.argv.slice(2),
      root: process.cwd(),
    });
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
