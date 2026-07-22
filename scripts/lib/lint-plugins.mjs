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
 * `import` is absent on purpose: its correctness rules overlap tsgolint, which
 * reports the same defect as a TypeScript error first, so a probe for it would
 * pass whether or not the plugin loaded.
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
];

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
