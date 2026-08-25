/**
 * Rules for the Oxlint config-wiring gate. Pure; effects live in
 * `../verify-lint-plugins.mjs`.
 */

/**
 * One deliberate violation per plugin family Oxlint must have loaded.
 *
 * A family goes dark silently: naming `lint.plugins` REPLACES Oxlint's default
 * set, so dropping an entry disables every rule it owns and reports nothing —
 * indistinguishable from clean code. Only a planted violation tells the two
 * apart, which is why this gate lints code instead of reading config.
 *
 * Every family in `PLUGINS` is either probed here or listed in
 * `UNPROBED_PLUGINS` with a reason, and `pluginsWithoutCoverage` fails the gate
 * when that stops being true — so a family cannot be added and left unproven.
 *
 * `ext` is the probe file's extension, per-probe rather than a constant because
 * a react rule needs `.tsx`: the same source saved as `.ts` reports only
 * TypeScript parse errors and no `react(…)` code at all, so one hardcoded
 * extension would make a probe pass for the wrong reason.
 */
export const PLUGIN_PROBES = [
  {
    code: 'debugger;\nexport const a = 1;\n',
    plugin: 'eslint',
    rule: 'no-debugger',
  },
  {
    code: 'export const a = (y: number) => y * 0;\n',
    plugin: 'oxc',
    rule: 'erasing-op',
  },
  {
    code: 'type Z = { readonly b?: string };\nexport const a = (z?: Z) => z!!.b;\n',
    plugin: 'typescript',
    rule: 'no-extra-non-null-assertion',
  },
  {
    code: "export const a = (t: EventTarget) => {\n  t.removeEventListener('click', () => 'x');\n};\n",
    plugin: 'unicorn',
    rule: 'no-invalid-remove-event-listener',
  },
  {
    code: 'export const a = (done: (e?: unknown) => void) => {\n  Promise.resolve(1).catch(done);\n};\n',
    plugin: 'promise',
    rule: 'no-callback-in-promise',
  },
  {
    // `no-children-prop`, not `jsx-key`: the eslint pass loads
    // eslint-plugin-react-x, whose `no-missing-key` agrees with `jsx-key`, so
    // that rule surviving would not prove THIS family loaded. `no-children-prop`
    // has no counterpart in react-x or react-dom's recommended sets and no
    // TypeScript-error equivalent — `jsx-no-duplicate-props` is shadowed by
    // typescript(TS17001) and would pass for the wrong reason.
    code: 'export const a = () => <div children="x" />;\n',
    ext: 'tsx',
    plugin: 'react',
    rule: 'no-children-prop',
  },
];

/**
 * Families in `PLUGINS` deliberately left unprobed, and why.
 *
 * A family belongs here only when a planted violation cannot tell "loaded" from
 * "not loaded" — never because writing a probe is merely awkward.
 */
export const UNPROBED_PLUGINS = {
  import:
    'its correctness rules overlap tsgolint, which reports the same defect as a ' +
    'TypeScript error first, so a probe passes whether or not the plugin loaded',
};

/** A probe's filename, e.g. `react.probe.tsx`. (pure) */
export const probeFilename = ({ plugin, ext }) =>
  `${plugin}.probe.${ext ?? 'ts'}`;

/**
 * Configured families that are neither probed nor documented as exempt.
 *
 * A set-membership fact about the gate's own data, so unlike the probes it
 * cannot be confounded and needs no violation planted. (pure)
 */
export const pluginsWithoutCoverage = (plugins) => {
  const covered = new Set([
    ...PLUGIN_PROBES.map((probe) => probe.plugin),
    ...Object.keys(UNPROBED_PLUGINS),
  ]);
  return plugins.filter((plugin) => !covered.has(plugin));
};

/** The diagnostic code Oxlint prints for a probe, e.g. `unicorn(no-null)`. */
export const probeCode = ({ plugin, rule }) => `${plugin}(${rule})`;

/**
 * Probes whose rule did not fire — each one means that plugin family is loaded
 * but silent, or not loaded at all.
 */
export const silentProbes = ({ probes, reportedCodes }) => {
  const reported = new Set(reportedCodes);
  return probes.filter((probe) => !reported.has(probeCode(probe)));
};

/**
 * Workspace configs that declare a `lint` key.
 *
 * Vite+ reads `lint` from the root config only, so one here is dead config that
 * looks live — the failure this gate exists to prevent.
 */
export const configsDeclaringLint = (files) =>
  files
    .filter(({ path }) => path !== 'vite.config.ts')
    .filter(({ text }) => /^\s{0,4}lint\s*:/mu.test(stripComments(text)))
    .map(({ path }) => path);

/** Removes `//` and block comments so a commented-out `lint:` is not counted. */
const stripComments = (text) =>
  text.replaceAll(/\/\*[\s\S]*?\*\//gu, '').replaceAll(/\/\/[^\n]*/gu, '');

/** `packages/ui/**` → `packages/ui`. */
const globWorkspace = (glob) => glob.replace(/\/\*\*$/u, '');

/**
 * Workspaces named in no runtime list.
 *
 * The lists were first written from whichever workspaces happened to carry a
 * `lint` block — the setup that was never loaded — which silently left six out.
 * Nothing derives them, so nothing but this would notice a new workspace.
 */
export const unclassifiedWorkspaces = ({ runtimes, workspaces }) => {
  const classified = new Set(Object.values(runtimes).flat().map(globWorkspace));
  return workspaces.filter((workspace) => !classified.has(workspace));
};

/** Runtime globs naming a workspace that no longer exists. */
export const staleRuntimeGlobs = ({ runtimes, workspaces }) => {
  const present = new Set(workspaces);
  return Object.values(runtimes)
    .flat()
    .filter((glob) => !present.has(globWorkspace(glob)));
};

/** Workspaces named in more than one list — the other half of "exactly one". */
export const multiplyClassifiedWorkspaces = ({ runtimes, workspaces }) => {
  const counts = new Map();
  for (const glob of Object.values(runtimes).flat()) {
    const workspace = globWorkspace(glob);
    counts.set(workspace, (counts.get(workspace) ?? 0) + 1);
  }
  return workspaces.filter((workspace) => (counts.get(workspace) ?? 0) > 1);
};

/** `apps/foo/**` or `packages/foo/**` — a whole workspace, not a file pattern. */
const isWorkspaceGlob = (glob) =>
  /^(?:apps|packages)\/[^/*]+\/\*\*$/u.test(glob);

/**
 * The `biome.jsonc` override blocks that partition the workspaces.
 *
 * A whole-workspace block that is a subset of another is a rule scoped to some
 * workspaces, not a roster — so it is excluded. Without that, the narrower block
 * this repo's own config comment tells you to write would be read as a third
 * roster and reported as a duplicate classification.
 */
export const workspaceRosters = (overrides) => {
  const blocks = overrides
    .map((override) => override.includes ?? [])
    .filter((globs) => globs.length > 0 && globs.every(isWorkspaceGlob))
    .map((globs) => globs.map(globWorkspace));
  return blocks
    .filter(
      (block, index) =>
        !blocks.some(
          (other, otherIndex) =>
            otherIndex !== index &&
            other.length > block.length &&
            block.every((workspace) => other.includes(workspace)),
        ),
    )
    .map((block) => block.map((workspace) => `${workspace}/**`));
};
