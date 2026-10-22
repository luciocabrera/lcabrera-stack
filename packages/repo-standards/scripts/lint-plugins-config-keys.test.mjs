import { describe, expect, it } from 'vite-plus/test';

import { configsDeclaringKeys } from './lint-plugins.mjs';

describe('configsDeclaringKeys', () => {
  const KEYS = ['lint', 'fmt', 'staged'];
  const PATH = 'packages/ui/vite.config.ts';
  const declared = (text) => configsDeclaringKeys([{ path: PATH, text }], KEYS);

  describe.each(KEYS)('the %s key', (key) => {
    it.each([
      [
        'at the start of a line',
        `export default defineConfig({\n  ${key}: x,\n});`,
      ],
      ['inline', `export default defineConfig({ ${key}: x });`],
      [
        'as a shorthand property on its own line',
        `const ${key} = {};\nexport default defineConfig({\n  ${key},\n});`,
      ],
      [
        'as an inline shorthand property',
        `const ${key} = {};\nexport default defineConfig({ ${key} });`,
      ],
      ['as a quoted key', `export default defineConfig({ '${key}': x });`],
      [
        'through a spread of a local object',
        `const base = { ${key}: x };\nexport default defineConfig({ ...base, test: t });`,
      ],
      [
        'in an object a local constant holds',
        `const config = { ${key}: x };\nexport default defineConfig(config);`,
      ],
      [
        'in the object a config function returns',
        `export default defineConfig(() => ({ ${key}: x }));`,
      ],
      ['in a default-exported object', `export default { ${key}: x };`],
      [
        'in an object passed to another default-exported call',
        `export default makeConfig({\n  ${key}: x,\n});`,
      ],
      [
        'as a shorthand in an object passed to another call',
        `const ${key} = {};\nexport default makeConfig({ ${key} });`,
      ],
      [
        'in an object a helper inside defineConfig receives',
        `export default defineConfig(someHelper({ ${key}: x }));`,
      ],
      [
        'in the object of a default-exported merging call',
        `export default mergeConfig(base, { ${key}: f });`,
      ],
      [
        'as a default-exported call to an aliased defineConfig',
        `import { defineConfig as define } from 'vite-plus';\nconst ${key} = {};\nexport default define({ ${key} });`,
      ],
      [
        'in a call to an aliased defineConfig that is not the default export',
        `import { defineConfig as define } from 'vite-plus';\nconst ${key} = {};\nexport const config = define({ ${key} });`,
      ],
      [
        'in a call to a namespace-qualified defineConfig that is not the default export',
        `import * as vp from 'vite-plus';\nexport const config = vp.defineConfig({ ${key}: x });`,
      ],
      [
        'in a return nested inside another statement',
        `export default defineConfig(({ command }) => {\n  if (command === 'serve') return { ${key}: f };\n  return base;\n});`,
      ],
      [
        'in either branch of a returned conditional',
        `export default defineConfig(({ mode }) => {\n  return mode === 'test' ? base : { ${key}: f };\n});`,
      ],
      [
        'in the fallback of a nullish default',
        `export default defineConfig(override ?? { ${key}: f });`,
      ],
      [
        'in the object a local function declaration returns',
        `function makeConfig() {\n  return { ${key}: x };\n}\nexport default defineConfig(makeConfig);`,
      ],
      [
        'in a constant declared inside the config function',
        `export default defineConfig(() => {\n  const config = { ${key}: createConfig() };\n  return config;\n});`,
      ],
      [
        'through a spread of an object declared inside the config function',
        `export default defineConfig(() => {\n  const base = { ${key}: x };\n  return { ...base };\n});`,
      ],
      [
        'in an object assigned to a let after its declaration',
        `let config = {};\nconfig = { ${key}: x };\nexport default defineConfig(config);`,
      ],
      [
        'in an object assigned to an uninitialised var',
        `var config;\nconfig = { ${key}: x };\nexport default defineConfig(config);`,
      ],
      [
        'as a shorthand of a destructured binding',
        `const { ${key} } = shared;\nexport default defineConfig({ ${key} });`,
      ],
      [
        'in the object an immediately invoked function returns',
        `export default defineConfig((() => ({ ${key}: x }))());`,
      ],
      [
        'in the object an async config function returns',
        `export default defineConfig(async ({ mode }) => {\n  const loaded = await load(mode);\n  return { ${key}: loaded };\n});`,
      ],
      [
        'in the object a nested helper returns when the config returns its result',
        `export default defineConfig(() => {\n  const helper = () => ({ ${key}: x });\n  return helper();\n});`,
      ],
      [
        'in the object of a mutation call that is itself the config',
        `const base = {};\nexport default defineConfig(Object.assign(base, { ${key}: x }));`,
      ],
      [
        'in an object checked with satisfies',
        `export default { ${key}: x } satisfies UserConfig;`,
      ],
      [
        'in the object a default-exported function returns',
        `export default function config() {\n  return { ${key}: x };\n}`,
      ],
      [
        'in a later argument of a merging call',
        `export default defineConfig(mergeConfig(base, { ${key}: x }));`,
      ],
    ])('flags it declared %s', (_form, text) => {
      expect(declared(text)).toEqual([{ key, path: PATH }]);
    });

    it('exempts the root config, which is the one Vite+ reads', () => {
      const files = [
        {
          path: 'vite.config.ts',
          text: `export default defineConfig({ ${key}: rootConfig });`,
        },
      ];
      expect(configsDeclaringKeys(files, KEYS)).toEqual([]);
    });

    it('ignores the key when it is commented out', () => {
      expect(
        declared(
          `export default defineConfig({\n  // ${key}: old,\n  test: t,\n});`,
        ),
      ).toEqual([]);
      expect(
        declared(
          `export default defineConfig({\n  /*\n  ${key}: old,\n  */\n  test: t,\n});`,
        ),
      ).toEqual([]);
    });

    it('does not flag a nested property with the same name', () => {
      expect(
        declared(
          `const ${key} = {};\nexport default defineConfig({\n  test: { ${key}: x },\n  run: { ${key} },\n});`,
        ),
      ).toEqual([]);
    });

    it('does not confuse a task name for the block', () => {
      expect(
        declared(
          `export default defineConfig({ run: { tasks: { '${key}:check': { command: 'x' } } } });`,
        ),
      ).toEqual([]);
    });

    it('does not read an object passed to a call that is neither defineConfig nor the default export', () => {
      expect(
        declared(`export const config = makeConfig({ ${key}: x });`),
      ).toEqual([]);
    });

    it('does not read a return inside a function nested in the config function', () => {
      expect(
        declared(
          `export default defineConfig(() => {\n  const helper = () => ({ ${key}: x });\n  return { test: helper() };\n});`,
        ),
      ).toEqual([]);
    });

    it('does not follow a binding destructured from another object to its source', () => {
      expect(
        declared(
          `const { base } = { base: { ${key}: x } };\nexport default defineConfig({ ...base });`,
        ),
      ).toEqual([]);
    });

    it('does not follow a spread of an imported object', () => {
      expect(
        declared(
          `import { base } from './base.ts';\nexport default defineConfig({ ...base });`,
        ),
      ).toEqual([]);
    });
  });

  it('terminates on objects that spread each other', () => {
    expect(
      declared(
        'const a = { ...b, lint: x };\nconst b = { ...a };\nexport default defineConfig(a);',
      ),
    ).toEqual([{ key: 'lint', path: PATH }]);
  });

  it('reports every key a config declares, in the order asked', () => {
    const files = [
      {
        path: 'apps/docs-site/vite.config.ts',
        text: 'export default defineConfig({\n  staged: s,\n  fmt: f,\n  test: t,\n});',
      },
    ];
    expect(configsDeclaringKeys(files, KEYS)).toEqual([
      { key: 'fmt', path: 'apps/docs-site/vite.config.ts' },
      { key: 'staged', path: 'apps/docs-site/vite.config.ts' },
    ]);
  });

  it('checks only the keys it is given', () => {
    const files = [
      {
        path: 'apps/docs-site/vite.config.ts',
        text: 'export default defineConfig({ fmt: fmtConfig });',
      },
    ];
    expect(configsDeclaringKeys(files, ['lint'])).toEqual([]);
  });
});
