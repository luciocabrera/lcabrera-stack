#!/usr/bin/env node
/**
 * Claude Code PostToolUse autofix hook — per-file quality-gate fixers.
 *
 * Why this exists: after Claude writes or edits a file, we want the repo's
 * autofixable tooling applied to THAT ONE FILE immediately — the per-file analog
 * of a root `vp check --fix` — so the working tree stays continuously clean and
 * the final quality gate has little left to repair. Running the whole-repo
 * fixers on every edit is too coarse; this scopes them to the single file.
 *
 * What it runs, in fix-then-format order, each guarded so a missing binary or a
 * tool failure never blocks Claude:
 *   1. Oxlint  `vp lint  <file> --fix`             (root config, Rust)
 *   2. Biome   `biome lint <file> --write`         (safe lint fixes; ts/tsx/mjs/cjs)
 *   3. Oxfmt   `vp fmt   <file>`                    (formatter; runs last)
 * The per-workspace ESLint pass is deliberately NOT here (it cold-starts a Node
 * process per file); it stays in the Stop hook + pre-push, mirroring the repo's
 * pre-commit staged config, which also excludes ESLint.
 *
 * Binaries are launched by absolute node_modules/.bin path (never a bare command,
 * so no PATH-based launch) and via `vp` (not bare oxfmt/oxlint) so they read the
 * vite.config.ts config instead of the stray oxfmtrc/oxlintrc decoys.
 *
 * Input : PostToolUse hook JSON on stdin (reads tool_input.file_path).
 * Output: a one-line summary on stdout (transcript-mode only).
 * Exit  : always 0 — an autofixer, not a gate.
 *
 * Governed by .claude/rules/scripts.md.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, resolve, sep } from 'node:path';

const REPO_ROOT = resolve(import.meta.dirname, '..');
const VP_BIN = join(REPO_ROOT, 'node_modules', '.bin', 'vp');
const BIOME_BIN = join(REPO_ROOT, 'node_modules', '.bin', 'biome');
const STDIN_FD = 0;

/** Directory segments we never touch (generated, vendored, or scratch). */
const IGNORED_SEGMENTS = new Set([
  'node_modules',
  '.git',
  '.tmp',
  'dist',
  'build',
  'coverage',
  '.react-router',
  'reports',
  'miscelanious',
]);

/** Extension -> which fixers apply. Mirrors each tool's own file scoping. */
const OXFMT_EXTS = new Set([
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.json',
  '.jsonc',
  '.md',
  '.mdx',
  '.css',
  '.yaml',
  '.yml',
]);
const OXLINT_EXTS = new Set([
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
]);
const BIOME_EXTS = new Set(['.ts', '.tsx', '.mjs', '.cjs']);

// ---- pure core --------------------------------------------------------------

/** Absolute path of the edited file, or empty when the payload has none. */
const parseFilePath = (raw) => {
  const filePath = JSON.parse(raw)?.tool_input?.file_path;
  return typeof filePath === 'string' && filePath.length > 0
    ? resolve(filePath)
    : '';
};

/** True when the path is outside the repo or inside a generated/vendored dir. */
const isIgnored = (absPath) => {
  const rel = relative(REPO_ROOT, absPath);
  if (rel.length === 0 || rel.startsWith('..')) return true;
  return rel.split(sep).some((segment) => IGNORED_SEGMENTS.has(segment));
};

/** Ordered fixers that apply to this file's extension. */
const fixersFor = (absPath) => {
  const ext = extname(absPath).toLowerCase();
  return [
    OXLINT_EXTS.has(ext) && {
      name: 'oxlint',
      bin: VP_BIN,
      args: ['lint', absPath, '--fix'],
    },
    BIOME_EXTS.has(ext) && {
      name: 'biome',
      bin: BIOME_BIN,
      args: ['lint', absPath, '--write', '--no-errors-on-unmatched'],
    },
    OXFMT_EXTS.has(ext) && {
      name: 'oxfmt',
      bin: VP_BIN,
      args: ['fmt', absPath],
    },
  ].filter(Boolean);
};

// ---- effects (edges) --------------------------------------------------------

/** Run one fixer; swallow failures so the hook never blocks Claude. */
const applyFixer = ({ name, bin, args }) => {
  try {
    execFileSync(bin, args, {
      cwd: REPO_ROOT,
      stdio: 'ignore',
      timeout: 60_000,
    });
    return name;
  } catch {
    return ''; // binary missing, timed out, or unfixable findings remain
  }
};

const main = () => {
  const absPath = parseFilePath(readFileSync(STDIN_FD, 'utf8'));
  if (absPath.length === 0 || isIgnored(absPath) || !existsSync(VP_BIN)) return;
  if (!existsSync(absPath) || !statSync(absPath).isFile()) return;

  const applied = fixersFor(absPath).map(applyFixer).filter(Boolean);
  if (applied.length > 0) {
    console.log(
      `autofix ${relative(REPO_ROOT, absPath)} -> ${applied.join(', ')}`,
    );
  }
};

try {
  main();
} catch {
  // A malformed payload or unreadable stdin must never break the tool flow.
}
process.exitCode = 0;
