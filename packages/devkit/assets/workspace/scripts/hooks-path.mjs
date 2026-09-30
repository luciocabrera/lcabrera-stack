/*
 * Points git at the hooks this repository commits, so a clone runs them after
 * its first install rather than after someone remembers a `git config` command.
 *
 * It points only a repository whose work tree starts here, only at a hooks
 * directory that exists, and never over a `core.hooksPath` this clone already
 * set to something else. Anywhere else — an unpacked tarball, a build with no
 * `.git`, a machine with no git — it does nothing and the install carries on.
 * It imports nothing but Node, because it runs in installs that may not have
 * the package that placed it.
 *
 * Usage: node scripts/hooks-path.mjs   (the `prepare` task runs it)
 * Exit codes: 0 = pointed, already pointed, or nothing to point; 1 = git or
 * `devkit.config.json` refused.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { delimiter, dirname, join, sep } from 'node:path';
import process from 'node:process';

export const CONFIG_FILE_NAME = 'devkit.config.json';

export const DEFAULT_HOOKS_PATH = '.githooks';

const IS_ON_WINDOWS = process.platform === 'win32';

export const TRUSTED_GIT_DIRECTORIES = IS_ON_WINDOWS
  ? [
      String.raw`C:\Program Files\Git\cmd`,
      String.raw`C:\Program Files (x86)\Git\cmd`,
    ]
  : ['/usr/local/bin', '/usr/bin', '/bin'];

export const GIT_REPOSITORY_VARIABLES = new Set([
  'GIT_ALTERNATE_OBJECT_DIRECTORIES',
  'GIT_COMMON_DIR',
  'GIT_DIR',
  'GIT_INDEX_FILE',
  'GIT_NAMESPACE',
  'GIT_OBJECT_DIRECTORY',
  'GIT_WORK_TREE',
]);

const GIT_FILENAMES = IS_ON_WINDOWS ? ['git.exe', 'git'] : ['git'];

const PACKAGE_DIRECTORY = `${sep}node_modules${sep}`;

const isPackageDirectory = (entry) =>
  `${entry}${sep}`.includes(PACKAGE_DIRECTORY);

/**
 * @param {{ exists: (path: string) => boolean, pathEntries: string[] }} args
 * @returns {string | undefined}
 */
export const resolveInstallGit = ({ exists, pathEntries }) =>
  [
    ...TRUSTED_GIT_DIRECTORIES,
    ...pathEntries.filter(
      (entry) => entry !== '' && !isPackageDirectory(entry),
    ),
  ]
    .flatMap((directory) => GIT_FILENAMES.map((name) => join(directory, name)))
    .find((path) => exists(path));

const isPathName = (name) => name.toUpperCase() === 'PATH';

/**
 * @param {{ binary: string, env: Record<string, string | undefined> }} args
 * @returns {Record<string, string | undefined>}
 */
export const gitEnvironment = ({ binary, env }) =>
  Object.fromEntries([
    ...Object.entries(env).filter(
      ([name]) => !GIT_REPOSITORY_VARIABLES.has(name) && !isPathName(name),
    ),
    [
      Object.keys(env).find((name) => isPathName(name)) ?? 'PATH',
      [...new Set([dirname(binary), ...TRUSTED_GIT_DIRECTORIES])].join(
        delimiter,
      ),
    ],
  ]);

/**
 * @param {string | undefined} raw
 * @returns {string}
 */
export const hooksPathIn = (raw) => {
  if (raw === undefined) return DEFAULT_HOOKS_PATH;
  const configured = JSON.parse(raw)?.paths?.hooks;
  return typeof configured === 'string' && configured !== ''
    ? configured
    : DEFAULT_HOOKS_PATH;
};

/**
 * @param {{ current: string, hooksPath: string, hooksPresent: boolean,
 *           root: string, topLevel: string }} args
 * @returns {'kept' | 'outside' | 'pointed' | 'point' | 'absent'}
 */
export const hooksPathAction = ({
  current,
  hooksPath,
  hooksPresent,
  root,
  topLevel,
}) => {
  if (topLevel !== root) return 'outside';
  if (!hooksPresent) return 'absent';
  if (current === hooksPath) return 'pointed';
  return current === '' ? 'point' : 'kept';
};

const gitRunner = (binary) => (args) =>
  execFileSync(binary, args, {
    encoding: 'utf8',
    env: gitEnvironment({ binary, env: process.env }),
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();

const quietly = (git) => (args) => {
  try {
    return git(args);
  } catch {
    return '';
  }
};

const realPathOf = (path) => (path === '' ? '' : realpathSync(path));

const readIfPresent = (path) =>
  existsSync(path) ? readFileSync(path, 'utf8') : undefined;

const point = ({ binary, root }) => {
  const git = gitRunner(binary);
  const read = quietly(git);
  const hooksPath = hooksPathIn(readIfPresent(join(root, CONFIG_FILE_NAME)));
  const current = read(['config', '--local', '--get', 'core.hooksPath']);
  const action = hooksPathAction({
    current,
    hooksPath,
    hooksPresent: existsSync(join(root, hooksPath)),
    root,
    topLevel: realPathOf(read(['rev-parse', '--show-toplevel'])),
  });
  if (action === 'point') {
    git(['config', '--local', 'core.hooksPath', hooksPath]);
    console.log(`git runs the hooks in \`${hooksPath}/\` from now on.`);
  } else if (action === 'kept') {
    console.log(
      `core.hooksPath is \`${current}\` in this clone, so the hooks in \`${hooksPath}/\` were left off. Run \`git config core.hooksPath ${hooksPath}\` to turn them on.`,
    );
  }
};

const main = () => {
  const binary = resolveInstallGit({
    exists: existsSync,
    pathEntries: (process.env.PATH ?? '').split(delimiter),
  });
  if (binary === undefined) return;
  point({ binary, root: realpathSync(process.cwd()) });
};

if (import.meta.main) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
