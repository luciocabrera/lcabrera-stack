#!/usr/bin/env node
/**
 * Gate: no repo script calls `process.exit()` (ADR-090).
 *
 * Which files count is `isToolingScript`, shared with the size gate, so the two
 * agree about extensions and neither reads fewer than .claude/rules/scripts.md
 * binds. Which DIRECTORIES get walked is not shared: `SKIP_DIRS` below is this
 * gate's alone, and the size gate skips `ALWAYS_SKIPPED` plus whatever
 * `gates.scriptSize.skipDirs` names. A file under a directory only one of them
 * skips is read by only one of them.
 *
 * Usage (from the repo root):
 *   repo-verify-script-exits
 *
 * Exit : 0 when no script calls it, 1 listing every one that does.
 *
 * Governed by .claude/rules/scripts.md.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { resolveHostRoot } from './host-root.mjs';
import {
  findProcessExitCalls,
  mayContainExitCall,
} from './script-exit-calls.mjs';
import { isToolingScript } from './script-size.mjs';

const REPO_ROOT = resolveHostRoot({
  moduleDirectory: dirname(fileURLToPath(import.meta.url)),
});
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

    const path = toPosix(relative(REPO_ROOT, full));
    return isToolingScript(path) ? [path] : [];
  });

const main = () => {
  const scripts = findScripts(REPO_ROOT);

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
