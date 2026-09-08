/**
 * Which ESLint config governs which of the files handed in, and what to invoke
 * for each group.
 *
 * A monorepo keeps one flat config per workspace and none at the root, so there
 * is no single config a lint-the-changed-files command can point at. The rule
 * used here is the one a reader would apply: a file is governed by the nearest
 * `eslint.config.mjs` above it, and a file with none above it is outside every
 * workspace and belongs to no config at all.
 *
 * The file list comes after `--` because a leading `-` is legal in a filename
 * and the CLI would otherwise read one as an option. This module's own argv is
 * read the same way, and for the same reason: a staged `-weird.ts` dropped as an
 * unrecognised flag would silently escape the gate, so an unknown `-` token is an
 * error and `--` ends the options here too.
 *
 * The remaining flags are read from the governing workspace's own
 * `lint:eslint:check` script rather than restated here. A second list drifts,
 * and it had: a workspace whose own gate refuses inline disables was being
 * linted here by a call that honoured them, so the commit hook passed exactly
 * the finding that workspace's gate goes on to report.
 *
 * Only a flag is carried across, never a bare token: a lint target written
 * after a boolean flag (`eslint --no-inline-config .`) would otherwise be read
 * as that flag's value, and one `.` reaching ESLint ahead of the `--` turns a
 * staged-file run into a whole-workspace one, silently. A value is taken only
 * for the flags known to want one; an unknown flag that wants one loses its
 * value and ESLint says so, which is the failure worth having.
 *
 * `--no-warn-ignored` is what keeps that rule from contradicting the config:
 * naming a file the config ignores is a warning, and at `--max-warnings 0` a
 * staged `dist/` or `build/` path would fail the commit for being ignored. A
 * whole-tree `eslint .` never visits those files at all, so this matches it.
 *
 * Pure. The spawning shell is `run-eslint-staged.mjs`.
 */
import { existsSync } from 'node:fs';
import { basename, dirname, join, relative, sep } from 'node:path';

const CONFIG_NAME = 'eslint.config.mjs';

const LINTED_EXTENSIONS = new Set([
  '.cjs',
  '.cts',
  '.js',
  '.jsx',
  '.mjs',
  '.mts',
  '.ts',
  '.tsx',
]);

export const isLintablePath = (path) => {
  const name = basename(path);
  const dot = name.lastIndexOf('.');
  return dot > 0 && LINTED_EXTENSIONS.has(name.slice(dot).toLowerCase());
};

export const findConfigDirectory = ({
  exists = existsSync,
  filePath,
  repoRoot,
}) => {
  let directory = dirname(filePath);
  while (directory === repoRoot || directory.startsWith(repoRoot + sep)) {
    if (exists(join(directory, CONFIG_NAME))) return directory;
    if (directory === repoRoot) break;
    directory = dirname(directory);
  }
};

export const planLintGroups = ({ exists = existsSync, paths, repoRoot }) => {
  const groups = new Map();
  for (const filePath of paths) {
    if (!isLintablePath(filePath)) continue;
    const directory = findConfigDirectory({ exists, filePath, repoRoot });
    if (directory === undefined) continue;
    const files = groups.get(directory) ?? [];
    files.push(relative(directory, filePath));
    groups.set(directory, files);
  }
  return [...groups].map(([directory, files]) => ({ directory, files }));
};

const RUNNER_OWNED = new Set(['--config', '--fix', '--no-warn-ignored']);

const VALUE_FLAGS = new Set([
  '--cache-location',
  '--cache-strategy',
  '--concurrency',
  '--config',
  '--env',
  '--ext',
  '--flag',
  '--format',
  '--global',
  '--ignore-pattern',
  '--max-warnings',
  '--output-file',
  '--parser',
  '--parser-options',
  '--plugin',
  '--report-unused-disable-directives-severity',
  '--resolve-plugins-relative-to',
  '--rule',
  '--rulesdir',
]);

const DEFAULT_FLAGS = ['--max-warnings', '0'];

const modeAfter = (token) => {
  if (!VALUE_FLAGS.has(token)) return 'idle';
  return RUNNER_OWNED.has(token) ? 'drop' : 'keep';
};

export const workspaceEslintFlags = (script) => {
  const tokens =
    typeof script === 'string' ? script.split(/\s+/u).filter(Boolean) : [];
  const kept = [];
  let mode = 'idle';
  for (const token of tokens.slice(1)) {
    if (!token.startsWith('-')) {
      if (mode === 'keep') kept.push(token);
      mode = 'idle';
      continue;
    }
    if (!RUNNER_OWNED.has(token)) kept.push(token);
    mode = modeAfter(token);
  }
  return kept.length > 0 ? kept : DEFAULT_FLAGS;
};

export const eslintArguments = ({ files, fix, workspaceFlags }) => [
  '--config',
  CONFIG_NAME,
  '--no-warn-ignored',
  ...(workspaceFlags ?? DEFAULT_FLAGS),
  ...(fix ? ['--fix'] : []),
  '--',
  ...files,
];

export const parseArguments = (args) => {
  const end = args.indexOf('--');
  const flags = end === -1 ? args : args.slice(0, end);
  const literal = end === -1 ? [] : args.slice(end + 1);
  return {
    check: flags.includes('--check'),
    paths: [...flags.filter((arg) => !arg.startsWith('-')), ...literal],
    unknown: flags.filter((arg) => arg !== '--check' && arg.startsWith('-')),
  };
};

const USAGE = 'usage: repo-eslint-staged [--check] [--] <file>…';

export const argumentError = ({ missing, paths, unknown }) => {
  if (unknown.length > 0) {
    return `unknown option ${unknown.join(', ')}. A file whose name starts with "-" goes after "--".\n${USAGE}`;
  }
  if (paths.length === 0) return USAGE;
  if (missing.length > 0) {
    const listed = missing.map((path) => `  • ${path}`).join('\n');
    return `no such file(s), so nothing would lint them:\n${listed}`;
  }
};

export const lintScriptOf = (scripts) =>
  scripts?.['lint:eslint:check'] ?? scripts?.['lint:eslint'];

export const spawnOutcome = (status) => {
  if (status === 0) return 'clean';
  if (status === 1) return 'findings';
  return 'broken';
};

export const exitCodeFor = (outcomes) => {
  if (outcomes.includes('broken')) return 2;
  if (outcomes.includes('findings')) return 1;
  return 0;
};
