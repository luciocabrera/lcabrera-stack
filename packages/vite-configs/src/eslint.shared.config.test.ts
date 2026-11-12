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

  it('turns unicorn/prefer-smaller-scope off for a TypeScript file', async () => {
    const eslint = new ESLint({
      cwd: WORKSPACE,
      overrideConfig: [...createBaseCustomRulesLintConfig({})],
      overrideConfigFile: true,
    });
    const resolved = await eslint.calculateConfigForFile('src/probe.ts');

    expect(resolved.rules['unicorn/prefer-smaller-scope']).toEqual([0]);
  });
});
