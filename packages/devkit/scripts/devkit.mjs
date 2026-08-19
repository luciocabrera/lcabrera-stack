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

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { runClosure } from './command-closure.mjs';
import {
  buildPlan,
  countsFor,
  nextManifestFor,
  renderPlan,
} from './command-materialise.mjs';
import { MANIFEST_FILE, serialiseManifest } from './manifest.mjs';
import { applySync } from './sync.mjs';

const USAGE = [
  'usage:',
  '  devkit sync [--profile <name>]',
  '  devkit doctor [--check]',
  '  devkit closure <directory> [<directory> ...]',
].join('\n');

const flagValue = (argv, name) => {
  const index = argv.indexOf(name);
  return index === -1 ? undefined : argv[index + 1];
};

const runSync = (argv, root) => {
  const { entries, manifest } = buildPlan({
    profile: flagValue(argv, '--profile'),
    root,
  });
  const { reported, written } = countsFor(entries);

  console.log(renderPlan(entries));

  if (written > 0) applySync({ entries, root });

  // The record is written even when nothing was — a file already identical to
  // the package is adopted into it, and without that a later edit to one reads
  // as an untracked file rather than as drift.
  const updated = serialiseManifest(nextManifestFor({ entries, manifest }));
  if (updated !== serialiseManifest(manifest)) {
    writeFileSync(join(root, MANIFEST_FILE), updated);
  }

  if (reported > 0) {
    console.log(
      '\nFiles left alone are yours to keep. Re-run after resolving them, or leave them diverged.',
    );
  }
  return 0;
};

const runDoctor = (argv, root) => {
  const { entries } = buildPlan({ root });
  const { reported, written } = countsFor(entries);

  console.log(renderPlan(entries));

  const drifted = written + reported;
  if (drifted === 0) return 0;
  if (!argv.includes('--check')) return 0;

  console.error(
    `\n${drifted} file(s) differ from the package. Run devkit sync.`,
  );
  return 1;
};

const main = () => {
  const [command, ...rest] = process.argv.slice(2);
  const root = process.cwd();

  if (command === 'closure') {
    if (rest.length === 0) {
      console.error(USAGE);
      return 1;
    }
    return runClosure(rest, root);
  }
  if (command === 'sync') return runSync(rest, root);
  if (command === 'doctor') return runDoctor(rest, root);

  console.error(USAGE);
  return 1;
};

try {
  process.exitCode = main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
