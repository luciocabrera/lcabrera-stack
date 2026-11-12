import type { Linter } from 'eslint';

import { ESLint } from 'eslint';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';

import { createBaseCustomRulesLintConfig } from './eslint.base-custom-rules.shared.config.mjs';
import { createCustomRulesLintConfig } from './eslint.custom-rules.shared.config.mjs';

const WORKSPACE = fileURLToPath(new URL('..', import.meta.url));

const globalIgnores = (config: readonly Linter.Config[]) =>
  config.find((entry) => Object.keys(entry).length === 1 && entry.ignores)
    ?.ignores;

describe('the shared ESLint configs', () => {
  it('ignores fallow run state in the base config, beside the caller’s patterns', () => {
    expect(
      globalIgnores(
        createBaseCustomRulesLintConfig({ ignorePatterns: ['extra/**'] }),
      ),
    ).toEqual([
      '.fallow/**',
      '.react-router/**',
      'build/**',
      'coverage/**',
      'dist/**',
      'node_modules/**',
      'extra/**',
    ]);
  });

  it('ignores fallow run state in the React config, beside the caller’s patterns', async () => {
    expect(
      globalIgnores(
        await createCustomRulesLintConfig({
          ignorePatterns: ['extra/**'],
          tsconfigRootDir: WORKSPACE,
        }),
      ),
    ).toEqual([
      '.fallow/**',
      '.react-router/**',
      'build/**',
      'coverage/**',
      'dist/**',
      'node_modules/**',
      'utils/**',
      'extra/**',
    ]);
  });

  it.each([
    {
      code: 'type Shape = { readonly a: number };\nexport const read = (value: unknown) => {\n  const shape = value as Shape;\n  return shape.a;\n};\n',
      filePath: 'src/probe.ts',
      reported: false,
    },
    {
      code: 'let total;\nif (globalThis.flag) {\n  total = 1;\n  globalThis.report(total);\n}\n',
      filePath: 'src/probe.mjs',
      reported: true,
    },
  ])(
    'reports unicorn/prefer-smaller-scope in $filePath: $reported',
    async ({ code, filePath, reported }) => {
      const eslint = new ESLint({
        cwd: WORKSPACE,
        overrideConfig: createBaseCustomRulesLintConfig(),
        overrideConfigFile: true,
      });
      const [result] = await eslint.lintText(code, { filePath });

      expect(
        result?.messages.some(
          ({ ruleId }) => ruleId === 'unicorn/prefer-smaller-scope',
        ),
      ).toBe(reported);
    },
  );
});
