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
 * and the CLI would otherwise read one as an option.
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
  while (directory.startsWith(repoRoot + sep)) {
    if (exists(join(directory, CONFIG_NAME))) return directory;
    directory = dirname(directory);
  }
  return undefined;
};

export const planLintGroups = ({ exists = existsSync, paths, repoRoot }) => {
  const groups = new Map();
  for (const filePath of paths.filter(isLintablePath)) {
    const directory = findConfigDirectory({ exists, filePath, repoRoot });
    if (directory === undefined) continue;
    const files = groups.get(directory) ?? [];
    files.push(relative(directory, filePath));
    groups.set(directory, files);
  }
  return [...groups].map(([directory, files]) => ({ directory, files }));
};

export const eslintArguments = ({ files, fix }) => [
  '--config',
  CONFIG_NAME,
  '--max-warnings',
  '0',
  '--no-warn-ignored',
  ...(fix ? ['--fix'] : []),
  '--',
  ...files,
];
