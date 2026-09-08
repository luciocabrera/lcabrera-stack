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
  realpathSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import process from 'node:process';

import { applyInit } from './command-init.mjs';
import { DEFAULT_CONFIG, withProfile } from './config.mjs';
import {
  abandonedNotice,
  ancestorsOf,
  commitIdentityArgs,
  CREATE_BRANCH,
  createRefusal,
  createSummary,
  gitStepFailure,
  INITIAL_COMMIT_MESSAGE,
  initialManifest,
  missingGitRefusal,
  packageNameFor,
  unfinishedNotice,
} from './create.mjs';
import {
  gitBinary,
  readGit,
  runGit,
  TRUSTED_GIT_DIRECTORIES,
} from './git-exec.mjs';
import { readProfileFlag } from './profile-flag.mjs';

const identityIn = (cwd) => ({
  email: readGit({ args: ['config', '--get', 'user.email'], cwd }),
  name: readGit({ args: ['config', '--get', 'user.name'], cwd }),
});

const realPathOf = (path) => {
  try {
    return realpathSync(path);
  } catch {
    return;
  }
};

const realTargetOf = (absolute) => {
  const resolved = realPathOf(absolute);
  if (resolved !== undefined) return resolved;
  const parent = realPathOf(dirname(absolute));
  return parent === undefined ? absolute : join(parent, basename(absolute));
};

const enclosingRepositoryOf = (absolute) =>
  ancestorsOf(dirname(realTargetOf(absolute))).find((directory) =>
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

const isOption = (entry) => entry.startsWith('-');

const positionals = (argv) => argv.filter((entry) => !isOption(entry));

const unrecognisedOptions = (argv) => argv.filter((value) => isOption(value));

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

const gitFailureDetail = (error) => {
  const said = String(error.stderr ?? '').trim();
  if (said !== '') return said;
  return typeof error.status === 'number'
    ? `git exited ${error.status} and said nothing`
    : String(error.message ?? error);
};

const gitStep = ({ args, cwd, step, target }) => {
  try {
    runGit({ args, cwd });
    return;
  } catch (error) {
    return gitStepFailure({
      detail: gitFailureDetail(error),
      step,
      target,
    });
  }
};

const halted = ({ failure, notice }) => {
  if (failure !== undefined) console.error(`\n${failure}`);
  console.error(`\n${notice}`);
  return 1;
};

const scaffold = ({ absolute, profile, target }) => {
  mkdirSync(absolute, { recursive: true });
  const initFailure = gitStep({
    args: ['init', '--quiet', '--initial-branch', CREATE_BRANCH, '.'],
    cwd: absolute,
    step: 'init',
    target,
  });
  if (initFailure !== undefined) {
    return halted({
      failure: initFailure,
      notice: abandonedNotice({ target }),
    });
  }
  writeFileSync(
    join(absolute, 'package.json'),
    `${JSON.stringify(initialManifest({ name: packageNameFor(basename(absolute)), profile }), undefined, 2)}\n`,
  );

  const code = applyInit({
    profile,
    root: absolute,
    upgrade: false,
    userAgent: process.env.npm_config_user_agent,
  });
  if (code !== 0) return halted({ notice: unfinishedNotice({ target }) });

  const committed =
    gitStep({ args: ['add', '-A'], cwd: absolute, step: 'add', target }) ??
    gitStep({
      args: [
        ...commitIdentityArgs(identityIn(absolute)),
        'commit',
        '--quiet',
        '-m',
        INITIAL_COMMIT_MESSAGE,
      ],
      cwd: absolute,
      step: 'commit',
      target,
    });
  if (committed !== undefined) {
    return halted({
      failure: committed,
      notice: unfinishedNotice({ target }),
    });
  }

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
  const unrecognised = unrecognisedOptions(rest);
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
    unrecognised,
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
