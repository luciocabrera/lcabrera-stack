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
 *           targets: string[] }} args `targetEntries` is `undefined` when the
 * target does not exist, which is the case create is for.
 * @returns {string | undefined}
 */
export const createRefusal = ({
  enclosingRepository,
  targetEntries,
  targets,
}) => {
  if (targets.length === 0) {
    return `create: no target directory — run \`${CREATE_USAGE}\`, or run \`devkit init\` in the repository you already have.`;
  }
  if (targets.length > 1) {
    const named = targets.map(quoted).join(', ');
    return `create: one target directory at a time, and this run named ${named} — run \`${CREATE_USAGE}\`.`;
  }
  const [target] = targets;
  if (enclosingRepository !== undefined) {
    return `create: \`${target}\` is inside the git repository at \`${enclosingRepository}\` — create makes a repository, and nesting one inside another puts this tree under the outer repository's index and gates. Run \`devkit init\` in \`${enclosingRepository}\` to set that repository up, or run create outside it.`;
  }
  if (targetEntries !== undefined && targetEntries.length > 0) {
    const [first] = targetEntries.toSorted((left, right) =>
      left.localeCompare(right),
    );
    return `create: \`${target}\` is not empty — it already holds \`${first}\`, and create only ever writes into a directory it made. Choose a name that is not taken, or run \`devkit init\` inside \`${target}\`.`;
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
 * to. The searched directories are named because they are fixed: a git found
 * anywhere else is one the inherited PATH chose, which is the lookup this
 * package does not do.
 *
 * @param {{ searched: string[] }} args
 * @returns {string}
 */
export const missingGitRefusal = ({ searched }) =>
  `create: no git executable in ${searched.map(quoted).join(', ')} — create makes a git repository, so install git before running it.`;

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
