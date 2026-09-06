/*
 * The decisions `devkit create` makes, with no filesystem in them.
 *
 * `create` makes the repository that `init` requires to exist already, so its
 * refusals are the mirror of init's: this one is wrong wherever init is right.
 * Keeping the judgements here means each refusal is reachable from a test that
 * passes it literal values rather than only from a real directory tree.
 *
 * The effects live in `command-create.mjs`.
 */

import { dirname } from 'node:path';

const CREATE_USAGE = 'devkit create <directory> [--profile <name>]';

const quoted = (value) => `\`${value}\``;

export const CREATE_BRANCH = 'main';

export const INITIAL_COMMIT_MESSAGE =
  'chore: initialise the repository with devkit';

export const DEFAULT_COMMIT_IDENTITY = {
  email: 'devkit@localhost',
  name: 'devkit',
};

/**
 * @param {string} directory
 * @returns {string[]} `directory` and every directory above it, nearest first
 */
export const ancestorsOf = (directory) => {
  const parent = dirname(directory);
  return parent === directory
    ? [directory]
    : [directory, ...ancestorsOf(parent)];
};

/**
 * Why this run must not create anything, or `undefined` to proceed.
 *
 * A repository inside a repository is refused rather than made because git
 * would then track the outer one's index over the inner tree, and the gates
 * this kit places read the enclosing repository's config; a directory with
 * anything in it is refused because create writes a whole tree and has no way
 * to tell an abandoned attempt from a project someone is standing in. Both name
 * `init`, which is the command for a repository that already exists.
 *
 * @param {{ enclosingRepository?: string, targetEntries?: string[],
 *           targetIsDirectory?: boolean, targetIsReadable?: boolean,
 *           targets: string[], unrecognised?: string[] }} args
 * `unrecognised` is every flag-shaped argument left after the options this
 * command knows were taken out — refused rather than dropped, because
 * `--profile=repo` is the likelier typo of the two the flag has and dropping it
 * runs the default rung while reporting success. `targetEntries` is `undefined`
 * when the target does not exist, which is the case create is for; `targetIsDirectory` is `false` when something that is not
 * a directory already holds the name, and `targetIsReadable` is `false` when a
 * directory is there and its contents cannot be listed.
 * @returns {string | undefined}
 */
export const createRefusal = ({
  enclosingRepository,
  targetEntries,
  unrecognised = [],
  targetIsDirectory = true,
  targetIsReadable = true,
  targets,
}) => {
  if (unrecognised.length > 0) {
    return `create: ${unrecognised.map(quoted).join(', ')} is not an option this command takes — \`--profile <name>\` is the only one, and it is spelled with a space. Run \`${CREATE_USAGE}\`.`;
  }
  if (targets.length === 0) {
    return `create: no target directory — run \`${CREATE_USAGE}\`, or run \`devkit init\` in the repository you already have.`;
  }
  if (targets.length > 1) {
    const named = targets.map(quoted).join(', ');
    return `create: one target directory at a time, and this run named ${named} — run \`${CREATE_USAGE}\`.`;
  }
  const [target] = targets;
  if (enclosingRepository !== undefined) {
    return `create: \`${target}\` is inside the git repository at \`${enclosingRepository}\` — create makes a repository, and nesting one inside another puts this tree under the outer repository's index and gates. Run \`devkit init\` in \`${enclosingRepository}\` to set that repository up, or run \`devkit create\` outside it.`;
  }
  if (!targetIsDirectory) {
    return `create: \`${target}\` is already there and is not a directory — create makes the directory, so the name has to be free. Pick one nothing occupies, or move what is there.`;
  }
  if (!targetIsReadable) {
    return `create: \`${target}\` is already there and cannot be read, so create cannot tell whether it is empty. Fix its permissions, or pick a name nothing occupies.`;
  }
  if (targetEntries !== undefined && targetEntries.length > 0) {
    const [first] = targetEntries.toSorted((left, right) =>
      left.localeCompare(right),
    );
    return `create: \`${target}\` is not empty — it already holds \`${first}\`, and create writes only into a directory with nothing in it. Pick a name nothing occupies, or run \`devkit init\` inside \`${target}\` if that is the project you meant.`;
  }
  return undefined;
};

const NAME_SEPARATORS = /[^a-z0-9._-]+/g;

const isEdgeCharacter = (character) =>
  character === '-' || character === '.' || character === '_';

const withoutEdges = (value) => {
  const characters = value.split('');
  const start = characters.findIndex(
    (character) => !isEdgeCharacter(character),
  );
  if (start === -1) return '';
  const end = characters.findLastIndex(
    (character) => !isEdgeCharacter(character),
  );
  return value.slice(start, end + 1);
};

/**
 * @param {string} directoryName
 * @returns {string} an npm-installable name derived from it
 */
export const packageNameFor = (directoryName) => {
  const cleaned = withoutEdges(
    directoryName.toLowerCase().replaceAll(NAME_SEPARATORS, '-'),
  );
  return cleaned === '' ? 'app' : cleaned;
};

/**
 * @param {{ name: string }} args
 * @returns {object} the manifest a created repository starts from
 */
export const initialManifest = ({ name }) => ({
  name,
  version: '0.0.0',
  private: true,
  type: 'module',
});

/**
 * The `-c` arguments the initial commit needs, if any.
 *
 * git refuses to commit without an identity, and a machine that has never
 * configured one is the ordinary case for the environment create is meant for —
 * a fresh container, or a CI runner making a scratch repository. Supplying a
 * placeholder there is better than a first run that fails on `git config`; a
 * machine that has an identity keeps it.
 *
 * @param {{ email?: string, name?: string }} identity
 * @returns {string[]}
 */
export const commitIdentityArgs = ({ email = '', name = '' } = {}) =>
  email !== '' && name !== ''
    ? []
    : [
        '-c',
        `user.name=${DEFAULT_COMMIT_IDENTITY.name}`,
        '-c',
        `user.email=${DEFAULT_COMMIT_IDENTITY.email}`,
      ];

/**
 * `create` makes a git repository, so a machine without git cannot be told
 * afterwards — the directory would be written and then have nothing to commit
 * to. The fixed install locations are named because they are what was looked at
 * first; PATH was searched after them, so reaching this means git is nowhere.
 *
 * @param {{ searched: string[] }} args
 * @returns {string}
 */
export const missingGitRefusal = ({ searched }) =>
  `create: no git executable in ${searched.map(quoted).join(', ')}, nor anywhere on this machine's PATH — create makes a git repository, so install git before running it.`;

/**
 * @param {{ target: string }} args
 * @returns {string} what a run that materialised nothing usable leaves behind
 */
export const unfinishedNotice = ({ target }) =>
  `\`${target}\` was created and is left in place with whatever did materialise. Do what the failure above asks from inside it — the repository is real, so the commands for one that already exists are the ones that apply now.`;

/**
 * @param {{ branch: string, target: string }} args
 */
export const createSummary = ({ branch, target }) =>
  [
    `Created \`${target}\`: a git repository on \`${branch}\`, with everything above committed.`,
    `No gate task was wired, because none of their binaries is installed yet. Install your dependencies in \`${target}\`, then run \`devkit init --upgrade\` there to add the tasks whose binaries have arrived, keeping the config as you have it.`,
  ].join('\n');
