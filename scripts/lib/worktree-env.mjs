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

export const TEMPLATE_SUFFIXES = ['.example', '.sample', '.template'];

export const isEnvFileName = (name) =>
  /^\.env(\..+)?$/.test(name) &&
  !TEMPLATE_SUFFIXES.some((suffix) => name.endsWith(suffix));

export const linkTextFor = (sourceAbs, destinationAbs) =>
  relative(dirname(destinationAbs), sourceAbs);

export const parseArgs = (argv, cwd) => {
  const flag = argv.indexOf('--target');
  const candidate = flag === -1 ? undefined : argv[flag + 1];
  const usable =
    candidate !== undefined && !candidate.startsWith('-') ? candidate : cwd;
  return { target: resolve(usable), dryRun: argv.includes('--dry-run') };
};

export const summarize = (results, dryRun, destinationLabel) => {
  const linked = results.filter((result) => result.status !== 'exists').length;
  const verb = dryRun ? 'Would link' : 'Linked';
  return `${verb} ${linked} of ${results.length} env file(s) into ${destinationLabel}`;
};
