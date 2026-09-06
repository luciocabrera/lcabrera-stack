/*
 * The `create` command: the filesystem half.
 *
 * Every judgement it makes comes from `create.mjs`, so this file is the
 * directory, the git calls and the exit code. It sets the repository up by
 * calling the same `applyInit` that `init` runs, rather than by its own route:
 * a repository whose files a later `doctor` did not recognise would report
 * drift on the day it was made.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';

import { applyInit } from './command-init.mjs';
import { DEFAULT_CONFIG, withProfile } from './config.mjs';
import {
  CREATE_BRANCH,
  INITIAL_COMMIT_MESSAGE,
  ancestorsOf,
  commitIdentityArgs,
  createRefusal,
  createSummary,
  initialManifest,
  packageNameFor,
  unfinishedNotice,
} from './create.mjs';
import { readProfileFlag } from './profile-flag.mjs';

const git = (args, cwd) =>
  execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

const gitConfigValue = ({ cwd, key }) => {
  try {
    return git(['config', '--get', key], cwd).trim();
  } catch {
    return '';
  }
};

const identityIn = (cwd) => ({
  email: gitConfigValue({ cwd, key: 'user.email' }),
  name: gitConfigValue({ cwd, key: 'user.name' }),
});

const enclosingRepositoryOf = (absolute) =>
  ancestorsOf(dirname(absolute)).find((directory) =>
    existsSync(join(directory, '.git')),
  );

const entriesOf = (absolute) =>
  existsSync(absolute) ? readdirSync(absolute) : undefined;

const positionals = (argv) => argv.filter((entry) => !entry.startsWith('-'));

const resolvedProfile = (flagged) => {
  try {
    return {
      profile: withProfile({
        config: DEFAULT_CONFIG,
        profile: flagged ?? DEFAULT_CONFIG.profile,
      }).profile,
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
};

const scaffold = ({ absolute, profile, target }) => {
  mkdirSync(absolute, { recursive: true });
  git(['init', '--quiet', '--initial-branch', CREATE_BRANCH, '.'], absolute);
  writeFileSync(
    join(absolute, 'package.json'),
    `${JSON.stringify(initialManifest({ name: packageNameFor(basename(absolute)) }), undefined, 2)}\n`,
  );

  const code = applyInit({ profile, root: absolute, upgrade: false });
  if (code !== 0) {
    console.error(`\n${unfinishedNotice({ target })}`);
    return code;
  }

  git(['add', '-A'], absolute);
  git(
    [
      ...commitIdentityArgs(identityIn(absolute)),
      'commit',
      '--quiet',
      '-m',
      INITIAL_COMMIT_MESSAGE,
    ],
    absolute,
  );

  console.log(`\n${createSummary({ branch: CREATE_BRANCH, target })}`);
  return 0;
};

export const runCreate = (argv, root) => {
  const { error, profile: flagged, rest } = readProfileFlag(argv);
  if (error !== undefined) {
    console.error(error);
    return 1;
  }

  const chosen = resolvedProfile(flagged);
  if (chosen.error !== undefined) {
    console.error(chosen.error);
    return 1;
  }

  const targets = positionals(rest);
  const [target] = targets;
  const absolute = target === undefined ? undefined : resolve(root, target);

  const refusal = createRefusal({
    enclosingRepository:
      absolute === undefined ? undefined : enclosingRepositoryOf(absolute),
    targetEntries: absolute === undefined ? undefined : entriesOf(absolute),
    targets,
  });
  if (refusal !== undefined) {
    console.error(refusal);
    return 1;
  }

  return scaffold({ absolute, profile: chosen.profile, target });
};
