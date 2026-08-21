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
import { runDoctor, runSync } from './command-sync.mjs';

const USAGE = [
  'usage:',
  '  devkit sync [--profile <name>]',
  '  devkit doctor [--profile <name>] [--check] [--verbose]',
  '  devkit doctor --accept <path> --reason "<why>"',
  '  devkit closure [--profile <name>] <directory> [<directory> ...]',
  '  devkit closure [--profile <name>] --shipped',
].join('\n');

/**
 * A table rather than a chain of conditions, so adding a command does not make
 * the dispatcher harder to reason about or to test.
 */
const COMMANDS = {
  closure: runClosure,
  doctor: runDoctor,
  sync: runSync,
};

/**
 * A bare `--` is how a task runner separates its own flags from the ones it
 * forwards, so it arrives in argv and means nothing here. Left in place it reads
 * as a directory name, which is how `devkit closure -- <dir>` failed while the
 * same command without the separator worked.
 */
const withoutSeparator = (argv) => argv.filter((entry) => entry !== '--');

/**
 * Asking for help is not a usage error, and the difference is not cosmetic:
 * `--help` is the first thing a consumer runs and the cheapest liveness check a
 * smoke test can make, so answering it on stderr with a failing code reads as a
 * broken install and aborts any caller running under `set -e`. An unrecognised
 * command still fails — the separation is between "you asked what this does" and
 * "you asked for something that is not here".
 */
const HELP_REQUESTS = new Set(['--help', '-h', 'help']);

/**
 * Anywhere in argv, not just the command position. `sync` reads the flags it
 * knows and ignores the rest, so recognising help only as the first word left
 * `devkit sync --help` building a plan and writing it: a consumer asking what a
 * command does had their tree materialised into instead, and got exit 0 for it.
 *
 * Nothing legitimate is swallowed, because `--help` is not a valid value for any
 * flag or positional these commands take — `--profile --help` is already refused
 * by the flag-shaped-value guard rather than reaching here as a profile name.
 */
const asksForHelp = (argv) => argv.some((entry) => HELP_REQUESTS.has(entry));

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
