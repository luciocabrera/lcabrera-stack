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
 *   devkit doctor [--check]
 *   devkit closure <directory> [<directory> ...]
 *
 * Exit codes: 0 = nothing to report, 1 = findings, drift under --check, or bad
 * arguments.
 */

import { runClosure } from './command-closure.mjs';
import { runDoctor, runSync } from './command-sync.mjs';

const USAGE = [
  'usage:',
  '  devkit sync [--profile <name>]',
  '  devkit doctor [--check]',
  '  devkit closure <directory> [<directory> ...]',
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

/** @param {{ argv: string[], root: string }} args */
export const runCommand = ({ argv, root }) => {
  const [command, ...rest] = argv;
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
