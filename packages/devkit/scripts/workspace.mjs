/*
 * What the monorepo rung puts in the root manifest, and why it cannot be an
 * asset like the rest of the rung.
 *
 * Every other file the rung places is the same in every consumer's tree, so it
 * ships verbatim and the manifest records its hash. The root `package.json` is
 * not: it carries the repository's own name, which only `create` knows. So the
 * fields below are merged into the manifest create writes, and a name a consumer
 * already chose is never overwritten. The task list is the one part a later run
 * still reconciles, key by key — `tasks.mjs` — because a block of names is
 * mergeable where the rest of the manifest is not.
 *
 * The dependency versions are deliberately absent. Every dependency here
 * resolves through `catalog:`, so `pnpm-workspace.yaml` is the one place a
 * version is declared and a second copy cannot drift from it.
 *
 * The two runtime pins are the exception, and they are copies on purpose: a new
 * repository has no catalog to read them from, so they ship as constants. Each
 * is held to the pin this repository runs by a test, and `deps:refresh` moves
 * them with the root — the pnpm one once sat a major behind because nothing did
 * either (#1179).
 *
 * The generate task formats what it wrote because the published writer emits
 * plain `JSON.stringify` output that Oxfmt then collapses; without that step
 * every regenerated config is left dirty.
 *
 * Each task list names the rung it lands on, so the `full` rung's database
 * tasks reach only a tree that also holds the compose file they drive.
 */

import { includesRung } from './config.mjs';

export const NODE_VERSION = '26.10.0';

export const PACKAGE_MANAGER =
  'pnpm@12.6.0+sha256.05b7b921fbb31564505c967eabf825895a1cc18f50935c00be98815272cc9d56';

export const TSCONFIG_WORKSPACE = '@repo/typescript-config';

export const APP_WORKSPACE = 'web';

export const GENERATED_TSCONFIGS = '**/tsconfig*.json';

export const HOOKS_PATH_SCRIPT = 'scripts/hooks-path.mjs';

/**
 * The band an install may proceed in, derived from the exact pin.
 *
 * Derived rather than written, because the two have to move together and only
 * one of them is checkable: `.node-version` is what a version manager reads, and
 * a band that fell behind it would refuse the very runtime the tree asks for.
 * It is deliberately wider than the pin — a Node patch release must not
 * hard-fail every install before someone moves the pin.
 *
 * @param {string} version
 * @returns {string}
 */
export const nodeEngineBand = (version) => {
  const [head = ''] = version.split('.', 1);
  const major = Number(head);
  if (head === '' || !Number.isSafeInteger(major)) {
    throw new TypeError(
      `workspace: \`${version}\` does not start with a major version, so no engine band can be derived from it`,
    );
  }
  return `>=${major} <${major + 1}`;
};

export const WORKSPACE_DEPENDENCIES = {
  '@biomejs/biome': 'catalog:lint',
  '@lcabrera/vite-config': 'catalog:stack',
  '@types/node': 'catalog:types',
  typescript: 'catalog:build',
  'vite-plus': 'catalog:build',
};

/**
 * The tasks the rung wires, as the list they are rather than as a block.
 *
 * One list, in name order, is what lets a consumer's manifest be reconciled key
 * by key instead of written once and never looked at again: `tasks.mjs` reads
 * it, and `COMMANDS.md` documents every name in it.
 *
 * @type {ReadonlyArray<{ command: string, name: string }>}
 */
export const WORKSPACE_TASKS = [
  { command: `vp run --filter ${APP_WORKSPACE} build`, name: 'build' },
  { command: 'vp check', name: 'check' },
  { command: `vp run --filter ${APP_WORKSPACE} dev`, name: 'dev' },
  { command: 'vp fmt .', name: 'format:all' },
  { command: 'vp fmt --check .', name: 'format:check' },
  { command: 'vp lint . --fix && vp run lint:biome', name: 'lint:all' },
  { command: 'biome lint . --write', name: 'lint:biome' },
  { command: 'biome lint .', name: 'lint:biome:check' },
  { command: 'vp lint . && vp run lint:biome:check', name: 'lint:check' },
  {
    command: `node ${HOOKS_PATH_SCRIPT} && vp run tsconfig:generate`,
    name: 'prepare',
  },
  { command: `vp run --filter ${APP_WORKSPACE} start`, name: 'start' },
  { command: 'vp run -r test', name: 'test:all' },
  {
    command: `vp run --filter ${TSCONFIG_WORKSPACE} generate && vp fmt '${GENERATED_TSCONFIGS}'`,
    name: 'tsconfig:generate',
  },
  {
    command: 'tsc --noEmit -p tsconfig.app.json && vp run -r typecheck',
    name: 'typecheck:all',
  },
];

const COMPOSE = 'docker compose -f docker/local/docker-compose.yml';

const COMPOSE_WITH_ENV = `${COMPOSE} --env-file docker/local/.env`;

/** @type {ReadonlyArray<{ command: string, name: string }>} */
export const DATABASE_TASKS = [
  { command: `${COMPOSE_WITH_ENV} down`, name: 'db:down' },
  {
    command: `vp run db:up && vp run --filter ${APP_WORKSPACE} seed`,
    name: 'db:seed',
  },
  { command: `${COMPOSE_WITH_ENV} ps`, name: 'db:status' },
  { command: `${COMPOSE_WITH_ENV} up -d --wait postgres`, name: 'db:up' },
];

const RUNG_TASKS = [
  ['monorepo', WORKSPACE_TASKS],
  ['full', DATABASE_TASKS],
];

const asScripts = (tasks) =>
  Object.fromEntries(tasks.map(({ command, name }) => [name, command]));

export const WORKSPACE_SCRIPTS = asScripts(WORKSPACE_TASKS);

export const BLUEPRINT_TASK_NAMES = RUNG_TASKS.flatMap(([, tasks]) =>
  tasks.map(({ name }) => name),
);

/**
 * @param {{ profile: string }} args
 * @returns {Record<string, string>} the blueprint tasks every rung `profile`
 * includes wires, empty below `monorepo`
 */
export const workspaceScriptsFor = ({ profile }) =>
  asScripts(
    RUNG_TASKS.filter(([rung]) => includesRung({ profile, rung })).flatMap(
      ([, tasks]) => tasks,
    ),
  );

/**
 * The manifest fields the rung adds, over whatever the caller already has.
 *
 * A field the caller set wins, for the same reason a task it already declared
 * does: setting up a repository must not break one that works.
 *
 * @param {{ manifest?: object, profile?: string }} args
 * @returns {object}
 */
export const withWorkspaceFields = ({
  manifest = {},
  profile = 'monorepo',
} = {}) => ({
  ...manifest,
  devDependencies: { ...WORKSPACE_DEPENDENCIES, ...manifest.devDependencies },
  engines: { node: nodeEngineBand(NODE_VERSION), ...manifest.engines },
  packageManager: manifest.packageManager ?? PACKAGE_MANAGER,
  scripts: { ...workspaceScriptsFor({ profile }), ...manifest.scripts },
});
