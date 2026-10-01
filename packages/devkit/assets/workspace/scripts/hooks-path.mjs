/*
 * Points git at the hooks this repository commits, so a clone runs them after
 * its first install rather than after someone remembers a `git config` command.
 *
 * It points only a repository whose work tree starts here, only at a hooks
 * directory that exists, and never over a `core.hooksPath` this clone already
 * set to something else. Anywhere else — an unpacked tarball, a build with no
 * `.git`, a machine with no git, or a CI job — it does nothing and the install
 * carries on. A CI job is left alone because a workflow that commits or pushes
 * from its checkout would otherwise run the whole pre-push gate inside itself.
 * It imports nothing but Node, because it runs in installs that may not have
 * the package that placed it.
 *
 * Usage: node scripts/hooks-path.mjs   (the `prepare` task runs it)
 * Exit codes: 0 = pointed, already pointed, or nothing to point; 1 = git or
 * `devkit.config.json` refused.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { delimiter, dirname, isAbsolute, join, posix, win32 } from 'node:path';
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

const PACKAGE_DIRECTORY = 'node_modules';

/**
 * @param {{ path: string, platform: string }} args
 * @returns {boolean}
 */
export const isInPackageDirectory = ({ path, platform }) =>
  path
    .split(/[\\/]/)
    .some(
      (segment) =>
        (platform === 'win32' ? segment.toLowerCase() : segment) ===
        PACKAGE_DIRECTORY,
    );

const canonical = ({ path, realPath }) => {
  try {
    return realPath(path);
  } catch {
    return;
  }
};

/**
 * @param {{ directories?: readonly string[],
 *           exists: (path: string) => boolean, pathEntries: string[],
 *           platform?: string, realPath: (path: string) => string }} args
 * @returns {string | undefined}
 */
export const resolveInstallGit = ({
  directories = TRUSTED_GIT_DIRECTORIES,
  exists,
  pathEntries,
  platform = process.platform,
  realPath,
}) =>
  [...directories, ...pathEntries.filter((entry) => isAbsolute(entry))]
    .flatMap((directory) => GIT_FILENAMES.map((name) => join(directory, name)))
    .filter((path) => exists(path))
    .map((path) => canonical({ path, realPath }))
    .find(
      (path) => path !== undefined && !isInPackageDirectory({ path, platform }),
    );

const isPathName = (name) => name.toUpperCase() === 'PATH';

/**
 * @param {{ name: string, platform?: string }} args
 * @returns {boolean}
 */
const isRepositoryVariable = ({ name, platform = process.platform }) =>
  GIT_REPOSITORY_VARIABLES.has(
    platform === 'win32' ? name.toUpperCase() : name,
  );

/**
 * @param {Record<string, string | undefined>} env
 * @returns {boolean}
 */
export const isContinuousIntegration = (env) =>
  !['', '0', 'false', undefined].includes(env.CI?.trim().toLowerCase());

/**
 * @param {{ binary: string, env: Record<string, string | undefined>,
 *           platform?: string }} args
 * @returns {Record<string, string | undefined>}
 */
export const gitEnvironment = ({ binary, env, platform = process.platform }) =>
  Object.fromEntries([
    ...Object.entries(env).filter(
      ([name]) =>
        !isRepositoryVariable({ name, platform }) && !isPathName(name),
    ),
    [
      Object.keys(env).find((name) => isPathName(name)) ?? 'PATH',
      [...new Set([dirname(binary), ...TRUSTED_GIT_DIRECTORIES])].join(
        delimiter,
      ),
    ],
  ]);

/**
 * @param {string} path
 * @returns {boolean}
 */
export const isRepositoryRelative = (path) => {
  if (/^[A-Za-z]:/.test(path) || win32.isAbsolute(path)) return false;
  const normal = posix.normalize(path.replaceAll('\\', '/'));
  return normal !== '..' && !normal.startsWith('../');
};

/**
 * @param {unknown} path
 * @returns {string | undefined}
 */
export const hooksPathRefusal = (path) =>
  path === undefined ||
  (typeof path === 'string' && path !== '' && isRepositoryRelative(path))
    ? undefined
    : `${CONFIG_FILE_NAME}: "paths.hooks" must be a directory inside the repository, relative to its root — got ${typeof path === 'string' ? `"${path}"` : JSON.stringify(path)}`;

/**
 * @param {string | undefined} raw
 * @returns {string}
 */
export const hooksPathIn = (raw) => {
  if (raw === undefined) return DEFAULT_HOOKS_PATH;
  const configured = JSON.parse(raw)?.paths?.hooks;
  const refusal = hooksPathRefusal(configured);
  if (refusal !== undefined) throw new Error(refusal);
  return configured ?? DEFAULT_HOOKS_PATH;
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

const isDirectory = (path) => {
  try {
    return statSync(path, { throwIfNoEntry: false })?.isDirectory() === true;
  } catch {
    return false;
  }
};

/**
 * @param {string} hooksPath
 * @returns {string}
 */
export const hooksPathInstruction = (hooksPath) =>
  /^[\w./-]+$/u.test(hooksPath)
    ? `Run \`git config core.hooksPath ${hooksPath}\` to turn them on.`
    : `Set core.hooksPath to \`${hooksPath}\` in this clone to turn them on.`;

const readIfPresent = (path) =>
  existsSync(path) ? readFileSync(path, 'utf8') : undefined;

const point = ({ binary, root }) => {
  const git = gitRunner(binary);
  const read = quietly(git);
  const topLevel = realPathOf(read(['rev-parse', '--show-toplevel']));
  if (topLevel !== root) return;
  const hooksPath = hooksPathIn(readIfPresent(join(root, CONFIG_FILE_NAME)));
  const current = read(['config', '--local', '--get', 'core.hooksPath']);
  const action = hooksPathAction({
    current,
    hooksPath,
    hooksPresent: isDirectory(join(root, hooksPath)),
    root,
    topLevel,
  });
  if (action === 'point') {
    git(['config', '--local', 'core.hooksPath', hooksPath]);
    console.log(`git runs the hooks in \`${hooksPath}/\` from now on.`);
  } else if (action === 'kept') {
    console.log(
      `core.hooksPath is \`${current}\` in this clone, so the hooks in \`${hooksPath}/\` were left off. ${hooksPathInstruction(hooksPath)}`,
    );
  }
};

const main = () => {
  if (isContinuousIntegration(process.env)) return;
  const binary = resolveInstallGit({
    exists: existsSync,
    pathEntries: (process.env.PATH ?? '').split(delimiter),
    realPath: realpathSync,
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
