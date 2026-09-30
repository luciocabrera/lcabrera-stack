/*
 * Points git at the hooks this repository commits, so a clone runs them after
 * its first install rather than after someone remembers a `git config` command.
 *
 * It points only a repository whose work tree starts here, only at a hooks
 * directory that exists, and never over a `core.hooksPath` this clone already
 * set to something else. Anywhere else — an unpacked tarball, a build with no
 * `.git`, a machine with no git — it does nothing and the install carries on.
 *
 * Usage: node scripts/hooks-path.mjs   (the `prepare` task runs it)
 * Exit codes: 0 = pointed, already pointed, or nothing to point; 1 = git or
 * `devkit.config.json` refused.
 */

import { CONFIG_FILE_NAME, resolveConfig } from '@lcabrera/devkit/config';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

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

const git = (args) =>
  execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();

const readGit = (args) => {
  try {
    return git(args);
  } catch {
    return '';
  }
};

const realPathOf = (path) => (path === '' ? '' : realpathSync(path));

const configuredHooksPath = (root) => {
  const path = join(root, CONFIG_FILE_NAME);
  const raw = existsSync(path) ? readFileSync(path, 'utf8') : undefined;
  return resolveConfig(raw).paths.hooks;
};

const main = () => {
  const root = realpathSync(process.cwd());
  const hooksPath = configuredHooksPath(root);
  const current = readGit(['config', '--local', '--get', 'core.hooksPath']);
  const action = hooksPathAction({
    current,
    hooksPath,
    hooksPresent: existsSync(join(root, hooksPath)),
    root,
    topLevel: realPathOf(readGit(['rev-parse', '--show-toplevel'])),
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

if (import.meta.main) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
