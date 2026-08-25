#!/usr/bin/env node
/**
 * Gate: no repo script exits mid-stream.
 *
 * `.claude/rules/scripts.md` forbids `process.exit()` in favour of
 * `process.exitCode`, because exiting can drop a buffered stderr write — losing
 * the message that explains the failure, in CI and under `tee` exactly. Until
 * this gate the rule lived only in prose, and a new file broke it as easily as
 * an old one (#929).
 *
 * A lint rule cannot cover this: the eslint fan-out is per-workspace and root
 * `scripts/` is not a workspace, which is where most of these files live. Same
 * reason the size gate is a standalone repo-wide script.
 *
 * Usage (from the repo root):
 *   vp run scripts:exits:verify
 *
 * Exit : 0 when no script calls process.exit, 1 listing every one that does.
 *
 * Governed by .claude/rules/scripts.md.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import {
  findProcessExitCalls,
  mayContainExitCall,
} from './lib/script-exit-calls.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT_FILE = /\.[mc]js$/u;
const SKIP_DIRS = new Set([
  '.git',
  '.tmp',
  'build',
  'coverage',
  'dist',
  'node_modules',
  'reports',
]);

const toPosix = (value) => value.replaceAll('\\', '/');

const findScripts = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = join(directory, entry.name);

    if (entry.isDirectory()) {
      return SKIP_DIRS.has(entry.name) ? [] : findScripts(full);
    }

    return SCRIPT_FILE.test(entry.name)
      ? [toPosix(relative(REPO_ROOT, full))]
      : [];
  });

const main = () => {
  const scripts = findScripts(REPO_ROOT);

  // Every offender, not the first — the rest of the same rule this gate enforces.
  const offences = scripts.flatMap((file) => {
    const source = readFileSync(join(REPO_ROOT, file), 'utf8');

    if (!mayContainExitCall(source)) return [];

    return findProcessExitCalls(source, file).map((call) => ({
      ...call,
      file,
    }));
  });

  if (offences.length > 0) {
    console.error(
      `${offences.length} script(s) call process.exit(), which can truncate the output explaining the failure:\n`,
    );

    for (const { file, line, text } of offences) {
      console.error(`  - ${file}:${line}  ${text}`);
    }

    console.error(
      '\nSet `process.exitCode` and return instead, with a top-level try/catch. See .claude/rules/scripts.md.',
    );
    process.exitCode = 1;
    return;
  }

  console.log(
    `No script exits mid-stream: ${scripts.length} script(s) checked.`,
  );
};

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
