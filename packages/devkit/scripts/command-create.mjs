/*
 * The `create` command: the filesystem half.
 *
 * Every judgement it makes comes from `create.mjs`, so this file is the
 * directory, the git calls and the exit code. It sets the repository up by
 * calling the same `applyInit` that `init` runs, rather than by its own route:
 * a repository whose files a later `doctor` did not recognise would report
 * drift on the day it was made.
 */

import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import process from 'node:process';

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
  missingGitRefusal,
  packageNameFor,
  unfinishedNotice,
} from './create.mjs';
import {
  TRUSTED_GIT_DIRECTORIES,
  gitBinary,
  readGit,
  runGit,
} from './git-exec.mjs';
import { readProfileFlag } from './profile-flag.mjs';

const identityIn = (cwd) => ({
  email: readGit({ args: ['config', '--get', 'user.email'], cwd }),
  name: readGit({ args: ['config', '--get', 'user.name'], cwd }),
});

const enclosingRepositoryOf = (absolute) =>
  ancestorsOf(dirname(absolute)).find((directory) =>
    existsSync(join(directory, '.git')),
  );

const ABSENT = { entries: undefined, isDirectory: true, isReadable: true };

const targetState = (absolute) => {
  if (lstatSync(absolute, { throwIfNoEntry: false }) === undefined)
    return ABSENT;
  if (statSync(absolute, { throwIfNoEntry: false })?.isDirectory() !== true) {
    return { entries: undefined, isDirectory: false, isReadable: true };
  }
  try {
    return {
      entries: readdirSync(absolute),
      isDirectory: true,
      isReadable: true,
    };
  } catch {
    return { entries: undefined, isDirectory: true, isReadable: false };
  }
};

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
  runGit({
    args: ['init', '--quiet', '--initial-branch', CREATE_BRANCH, '.'],
    cwd: absolute,
  });
  writeFileSync(
    join(absolute, 'package.json'),
    `${JSON.stringify(initialManifest({ name: packageNameFor(basename(absolute)) }), undefined, 2)}\n`,
  );

  const code = applyInit({
    profile,
    root: absolute,
    upgrade: false,
    userAgent: process.env.npm_config_user_agent,
  });
  if (code !== 0) {
    console.error(`\n${unfinishedNotice({ target })}`);
    return code;
  }

  runGit({ args: ['add', '-A'], cwd: absolute });
  runGit({
    args: [
      ...commitIdentityArgs(identityIn(absolute)),
      'commit',
      '--quiet',
      '-m',
      INITIAL_COMMIT_MESSAGE,
    ],
    cwd: absolute,
  });

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

  const state = absolute === undefined ? ABSENT : targetState(absolute);

  const refusal = createRefusal({
    enclosingRepository:
      absolute === undefined ? undefined : enclosingRepositoryOf(absolute),
    targetEntries: state.entries,
    targetIsDirectory: state.isDirectory,
    targetIsReadable: state.isReadable,
    targets,
  });
  if (refusal !== undefined) {
    console.error(refusal);
    return 1;
  }

  if (gitBinary() === undefined) {
    console.error(missingGitRefusal({ searched: TRUSTED_GIT_DIRECTORIES }));
    return 1;
  }

  return scaffold({ absolute, profile: chosen.profile, target });
};
