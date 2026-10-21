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
 * reason. A second probe may share a family when it proves one rule that no
 * other engine reports; `scope` is then the prefix Oxlint prints for it.
 */
import { ts } from 'ts-morph';

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
];

export const UNPROBED_PLUGINS = {
  import:
    'its correctness rules overlap tsgolint, which reports the same defect as a ' +
    'TypeScript error first, so a probe passes whether or not the plugin loaded',
};

export const probeFilename = ({ ext = 'ts', plugin, scope = plugin }) =>
  `${scope}.probe.${ext}`;

export const pluginsWithoutCoverage = (plugins) => {
  const covered = new Set([
    ...PLUGIN_PROBES.map((probe) => probe.plugin),
    ...Object.keys(UNPROBED_PLUGINS),
  ]);
  return plugins.filter((plugin) => !covered.has(plugin));
};

export const probeCode = ({ plugin, rule, scope = plugin }) =>
  `${scope}(${rule})`;

export const silentProbes = ({ probes, reportedCodes }) => {
  const reported = new Set(reportedCodes);
  return probes.filter((probe) => !reported.has(probeCode(probe)));
};

const unwrap = (node) =>
  ts.isParenthesizedExpression(node) ||
  ts.isAsExpression(node) ||
  ts.isSatisfiesExpression(node)
    ? unwrap(node.expression)
    : node;

const returnedExpressions = (fn) =>
  ts.isBlock(fn.body)
    ? fn.body.statements
        .filter((statement) => ts.isReturnStatement(statement))
        .filter((statement) => statement.expression !== undefined)
        .map((statement) => statement.expression)
    : [fn.body];

const localInitializers = (sourceFile) =>
  new Map(
    sourceFile.statements
      .filter((statement) => ts.isVariableStatement(statement))
      .flatMap((statement) => statement.declarationList.declarations)
      .filter(
        (declaration) =>
          ts.isIdentifier(declaration.name) &&
          declaration.initializer !== undefined,
      )
      .map((declaration) => [declaration.name.text, declaration.initializer]),
  );

const nestedExpressions = (expression) => {
  if (ts.isCallExpression(expression)) return [...expression.arguments];
  return ts.isArrowFunction(expression) || ts.isFunctionExpression(expression)
    ? returnedExpressions(expression)
    : [];
};

const localObjectLiterals = (identifier, locals, seen) => {
  const initializer = seen.has(identifier.text)
    ? undefined
    : locals.get(identifier.text);
  return initializer === undefined
    ? []
    : objectLiterals(initializer, locals, new Set([...seen, identifier.text]));
};

const objectLiterals = (node, locals, seen) => {
  const expression = unwrap(node);
  if (ts.isObjectLiteralExpression(expression)) return [expression];
  if (ts.isIdentifier(expression))
    return localObjectLiterals(expression, locals, seen);
  return nestedExpressions(expression).flatMap((nested) =>
    objectLiterals(nested, locals, seen),
  );
};

const propertyName = (name) =>
  ts.isComputedPropertyName(name)
    ? propertyName(unwrap(name.expression))
    : ts.isIdentifier(name) ||
        ts.isStringLiteral(name) ||
        ts.isNoSubstitutionTemplateLiteral(name)
      ? name.text
      : undefined;

const topLevelKeys = (object, locals, visited) =>
  object.properties.flatMap((property) =>
    ts.isSpreadAssignment(property)
      ? objectLiterals(property.expression, locals, new Set())
          .filter((spread) => !visited.has(spread))
          .flatMap((spread) =>
            topLevelKeys(spread, locals, new Set([...visited, spread])),
          )
      : [propertyName(property.name)],
  );

const isDefineConfigCall = (node) =>
  ts.isCallExpression(node) &&
  ts.isIdentifier(node.expression) &&
  node.expression.text === 'defineConfig';

const configRoots = (node) => [
  ...(isDefineConfigCall(node) ? node.arguments.slice(0, 1) : []),
  ...(ts.isExportAssignment(node) && !node.isExportEquals
    ? [node.expression]
    : []),
  ...node.getChildren().flatMap((child) => configRoots(child)),
];

const declaredConfigKeys = (path, text) => {
  const sourceFile = ts.createSourceFile(
    path,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const locals = localInitializers(sourceFile);
  return new Set(
    configRoots(sourceFile)
      .flatMap((root) => objectLiterals(root, locals, new Set()))
      .flatMap((object) => topLevelKeys(object, locals, new Set([object]))),
  );
};

export const configsDeclaringKeys = (files, keys) =>
  files
    .filter(({ path }) => path !== 'vite.config.ts')
    .flatMap(({ path, text }) => {
      const declared = declaredConfigKeys(path, text);
      return keys
        .filter((key) => declared.has(key))
        .map((key) => ({ key, path }));
    });

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
