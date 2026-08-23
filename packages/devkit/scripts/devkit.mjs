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
import { runInit } from './command-init.mjs';
import { runDoctor, runSync } from './command-sync.mjs';

const USAGE = [
  'usage:',
  '  devkit init [--profile <name>] [--force] [--upgrade]',
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
  init: runInit,
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
const HELP_FLAGS = new Set(['--help', '-h']);
const HELP_COMMAND = 'help';

/**
 * The two spellings are recognised in different places, and the asymmetry is the
 * whole point.
 *
 * A **flag** counts anywhere, because recognising it only in the command
 * position left `devkit sync --help` building a plan and applying it: a consumer
 * asking what a command does had their tree materialised into, and got exit 0
 * for it. `--help` and `-h` are not valid values for anything these commands
 * take, so nothing legitimate is lost by scanning for them.
 *
 * The bare **word** counts only in the command position, because it is an
 * ordinary string everywhere else. `--reason` takes free text and `closure`
 * takes directory names, so a wider scan turned
 * `doctor --accept <path> --reason help` into a usage page that recorded
 * nothing, and `closure help` into a success that analysed nothing — both the
 * silent-success failure the rest of this file exists to prevent.
 */
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
