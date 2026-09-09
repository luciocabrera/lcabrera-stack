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

import { runCommand } from './command-router.mjs';

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
