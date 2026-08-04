/**
 * Pure core of the worktree env-linker (`scripts/worktree-link-env.mjs`).
 *
 * Why separate: the script itself is filesystem effects — walk, symlink, print —
 * and none of that is reviewable in a test. The decisions that can be *wrong*
 * are here: what counts as a real env file rather than a tracked template, and
 * what link text survives the tree being moved. Both are colocated-tested.
 *
 * Governed by .claude/rules/scripts.md.
 */
import { dirname, relative, resolve } from 'node:path';

/** Directories that never hold a checked-out env file. */
export const SKIPPED_DIRS = new Set([
  'node_modules',
  '.git',
  '.tmp',
  'dist',
  'build',
  'coverage',
  '.react-router',
  'reports',
]);

/** Suffixes that mark a TEMPLATE, which is tracked and must never be linked over. */
export const TEMPLATE_SUFFIXES = ['.example', '.sample', '.template'];

/**
 * True for `.env` and `.env.<something>`, excluding the tracked templates.
 * The template exclusion is the load-bearing half: `.env.example` IS committed,
 * so linking one would replace a real file with a pointer to the primary's copy.
 */
export const isEnvFileName = (name) =>
  /^\.env(\..+)?$/.test(name) &&
  !TEMPLATE_SUFFIXES.some((suffix) => name.endsWith(suffix));

/**
 * Relative link text, so the symlink keeps resolving if either checkout is moved
 * or renamed. An absolute target would silently dangle after a `mv`.
 */
export const linkTextFor = (sourceAbs, destinationAbs) =>
  relative(dirname(destinationAbs), sourceAbs);

/** `{target, dryRun}` from argv, defaulting the target to the current directory. */
export const parseArgs = (argv, cwd) => {
  const flag = argv.indexOf('--target');
  const raw = flag === -1 ? cwd : (argv[flag + 1] ?? cwd);
  return { target: resolve(raw), dryRun: argv.includes('--dry-run') };
};

/** One-line summary; `linked` counts everything that was not already present. */
export const summarize = (results, dryRun, destinationLabel) => {
  const linked = results.filter((result) => result.status !== 'exists').length;
  const verb = dryRun ? 'Would link' : 'Linked';
  return `${verb} ${linked} of ${results.length} env file(s) into ${destinationLabel}`;
};
