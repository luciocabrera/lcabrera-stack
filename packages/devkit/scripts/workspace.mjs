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
 * The versions are deliberately absent. Every dependency here resolves through
 * `catalog:`, so `pnpm-workspace.yaml` is the one place a version is declared
 * and a second copy cannot drift from it.
 *
 * The generate task formats what it wrote because the published writer emits
 * plain `JSON.stringify` output that Oxfmt then collapses; without that step
 * every regenerated config is left dirty.
 */

export const NODE_VERSION = '26.8.1';

const PACKAGE_MANAGER =
  'pnpm@11.25.0+sha256.33dd0748f27e7916c4f1c8b6943461983e3453b06bbda6312a6280130b4881e5';

export const TSCONFIG_WORKSPACE = '@repo/typescript-config';

export const GENERATED_TSCONFIGS = '**/tsconfig*.json';

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
  { command: 'vp check', name: 'check' },
  { command: 'vp fmt .', name: 'format:all' },
  { command: 'vp fmt --check .', name: 'format:check' },
  { command: 'vp lint . --fix && vp run lint:biome', name: 'lint:all' },
  { command: 'biome lint . --write', name: 'lint:biome' },
  { command: 'biome lint .', name: 'lint:biome:check' },
  { command: 'vp lint . && vp run lint:biome:check', name: 'lint:check' },
  { command: 'vp run tsconfig:generate', name: 'prepare' },
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

export const WORKSPACE_SCRIPTS = Object.fromEntries(
  WORKSPACE_TASKS.map(({ command, name }) => [name, command]),
);

/**
 * The manifest fields the rung adds, over whatever the caller already has.
 *
 * A field the caller set wins, for the same reason a task it already declared
 * does: setting up a repository must not break one that works.
 *
 * @param {{ manifest?: object }} args
 * @returns {object}
 */
export const withWorkspaceFields = ({ manifest = {} } = {}) => ({
  ...manifest,
  devDependencies: { ...WORKSPACE_DEPENDENCIES, ...manifest.devDependencies },
  engines: { node: nodeEngineBand(NODE_VERSION), ...manifest.engines },
  packageManager: manifest.packageManager ?? PACKAGE_MANAGER,
  scripts: { ...WORKSPACE_SCRIPTS, ...manifest.scripts },
});
