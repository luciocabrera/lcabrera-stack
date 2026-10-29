/**
 * Rules for the Oxlint config-wiring gate. Pure; effects live in
 * `../verify-lint-plugins.mjs`.
 *
 * A plugin family goes dark silently: naming `lint.plugins` REPLACES Oxlint's
 * default set, so dropping an entry disables every rule it owns and reports
 * nothing, indistinguishable from clean code. Only a planted violation tells
 * the two apart, which is why this gate lints code instead of reading config.
 * Every family is either probed or listed in `UNPROBED_PLUGINS` with a reason,
 * and the gate fails when that stops being true. `ext` is per-probe because a
 * react rule needs `.tsx`: the same source saved as `.ts` reports only parse
 * errors, so one hardcoded extension would make a probe pass for the wrong
 * reason. A further probe may share a family when it proves one rule that no
 * other engine or rule reports for its planted code; `scope` is then the
 * prefix Oxlint prints for it, and the file name carries the rule so probes in
 * one family do not overwrite each other. `RULE_PROBES` is planted only where
 * the config names its rule, at a path the naming entry's `files` match, so a
 * probe for a rule a repository does not turn on never runs there.
 */
export { configsDeclaringKeys } from './lint-plugins-config-keys.mjs';
export {
  malformedProbes,
  namedRules,
  placeRuleProbes,
  probeFilename,
} from './lint-plugins-named-rules.mjs';
import { probeFilename } from './lint-plugins-named-rules.mjs';

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
  {
    code: "import { useEffect } from 'react';\n\nexport const A = ({ n }: { readonly n: number }) => {\n  useEffect(() => {\n    document.title = String(n);\n  }, []);\n  return null;\n};\n",
    ext: 'tsx',
    plugin: 'react',
    rule: 'exhaustive-deps',
    scope: 'react-hooks',
  },
  {
    code: "import { useEffect } from 'react';\n\nexport const A = ({ m, n }: { readonly m: number; readonly n: number }) => {\n  useEffect(() => {\n    document.title = String(n);\n  }, [m, n]);\n  return null;\n};\n",
    ext: 'tsx',
    plugin: 'react',
    rule: 'exhaustive-effect-dependencies',
  },
];

export const RULE_PROBES = [
  {
    code: 'export const a = (n: Promise<number>) =>\n  n.then((value) => {\n    globalThis.name = String(value);\n  });\n',
    plugin: 'promise',
    rule: 'always-return',
  },
  {
    code: 'export const A = () => {\n  const B = () => <div />;\n  return <B />;\n};\n',
    ext: 'tsx',
    plugin: 'react',
    rule: 'no-unstable-nested-components',
  },
  {
    code: 'export const a = (xs: readonly number[]) =>\n  [...xs].sort((p, q) => p - q);\n',
    plugin: 'unicorn',
    rule: 'no-array-sort',
  },
  {
    code: "it('plants a test without an assertion', () => {\n  globalThis.name = 'x';\n});\n",
    plugin: 'vitest',
    rule: 'expect-expect',
  },
  {
    code: "it('plants an expect without a matcher', () => {\n  expect(1);\n});\n",
    plugin: 'vitest',
    rule: 'valid-expect',
  },
  {
    code: "it('plants an expect inside a catch', () => {\n  try {\n    globalThis.name = 'x';\n  } catch (error) {\n    expect(error).toBeDefined();\n  }\n});\n",
    plugin: 'vitest',
    rule: 'no-conditional-expect',
  },
  {
    code: "describe('a suite', () => {\n  expect(1).toBe(1);\n});\n",
    plugin: 'vitest',
    rule: 'no-standalone-expect',
  },
  {
    code: "it('plants a toThrow without a message', () => {\n  expect(() => globalThis.name).toThrow();\n});\n",
    plugin: 'vitest',
    rule: 'require-to-throw-message',
  },
];

export const UNPROBED_PLUGINS = {
  import:
    'its correctness rules overlap tsgolint, which reports the same defect as a ' +
    'TypeScript error first, so a probe passes whether or not the plugin loaded',
};

export const pluginsWithoutCoverage = (plugins) => {
  const covered = new Set([
    ...PLUGIN_PROBES.map((probe) => probe.plugin),
    ...Object.keys(UNPROBED_PLUGINS),
  ]);
  return plugins.filter((plugin) => !covered.has(plugin));
};

export const probeCode = ({ plugin, rule, scope = plugin }) =>
  `${scope}(${rule})`;

export const familyPlacements = (dir) =>
  PLUGIN_PROBES.map((probe) => ({
    path: `${dir}/${probeFilename(probe)}`,
    probe,
    root: dir,
  }));

export const mergePlacements = (placements) =>
  placements
    .reduce((byPath, placement) => {
      const named = byPath.get(placement.path)?.named ?? placement.named;
      return byPath.set(placement.path, { ...placement, named });
    }, new Map())
    .values()
    .toArray();

const reportedKey = (filename, code) =>
  `${filename.replace(/^\.\//u, '')}\0${code}`;

export const silentPlacements = ({ diagnostics, placements }) => {
  const reported = new Set(
    diagnostics.map(({ code, filename }) => reportedKey(filename, code)),
  );
  return placements.filter(
    ({ path, probe }) => !reported.has(reportedKey(path, probeCode(probe))),
  );
};

const globWorkspace = (glob) => glob.replace(/\/\*\*$/u, '');

export const unclassifiedWorkspaces = ({ runtimes, workspaces }) => {
  const classified = new Set(
    Object.values(runtimes)
      .flat()
      .map((value) => globWorkspace(value)),
  );
  return workspaces.filter((workspace) => !classified.has(workspace));
};

export const staleRuntimeGlobs = ({ runtimes, workspaces }) => {
  const present = new Set(workspaces);
  return Object.values(runtimes)
    .flat()
    .filter((glob) => !present.has(globWorkspace(glob)));
};

export const multiplyClassifiedWorkspaces = ({ runtimes, workspaces }) => {
  const counts = new Map();
  for (const glob of Object.values(runtimes).flat()) {
    const workspace = globWorkspace(glob);
    counts.set(workspace, (counts.get(workspace) ?? 0) + 1);
  }
  return workspaces.filter((workspace) => (counts.get(workspace) ?? 0) > 1);
};

const isWorkspaceGlob = (glob) =>
  /^(?:apps|packages)\/[^/*]+\/\*\*$/u.test(glob);

export const workspaceRosters = (overrides) => {
  const blocks = overrides
    .map((override) => override.includes ?? [])
    .filter(
      (globs) =>
        globs.length > 0 && globs.every((value) => isWorkspaceGlob(value)),
    )
    .map((globs) => globs.map((value) => globWorkspace(value)));
  return blocks
    .filter((block, index) =>
      blocks.every(
        (other, otherIndex) =>
          !(
            otherIndex !== index &&
            other.length > block.length &&
            block.every((workspace) => other.includes(workspace))
          ),
      ),
    )
    .map((block) => block.map((workspace) => `${workspace}/**`));
};
