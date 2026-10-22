import { describe, expect, it } from 'vite-plus/test';

import {
  malformedProbes,
  namedRules,
  placeRuleProbes,
  probePath,
} from './lint-plugins-named-rules.mjs';

describe('namedRules', () => {
  it('lists every top-level rule that is not off', () => {
    expect(
      namedRules({
        rules: {
          'eslint/no-debugger': 'off',
          'promise/always-return': 'error',
          'react/no-unstable-nested-components': ['error', {}],
          'unicorn/no-null': 'allow',
          'unicorn/no-thenable': 0,
          'unicorn/prefer-at': 'warn',
        },
      }),
    ).toEqual([
      { entry: 'rules', id: 'promise/always-return' },
      { entry: 'rules', id: 'react/no-unstable-nested-components' },
      { entry: 'rules', id: 'unicorn/prefer-at' },
    ]);
  });

  it('lists an override rule with the files that scope it', () => {
    expect(
      namedRules({
        overrides: [
          { env: { node: true }, files: ['scripts/**'] },
          {
            files: ['**/*.test.ts'],
            rules: {
              'vitest/expect-expect': 'error',
              'vitest/valid-title': 'off',
            },
          },
        ],
      }),
    ).toEqual([
      {
        entry: 'overrides[1]',
        files: ['**/*.test.ts'],
        id: 'vitest/expect-expect',
        label: 'override-1',
      },
    ]);
  });

  it('is empty for a config that names no rule', () => {
    expect(namedRules({ categories: { correctness: 'error' } })).toEqual([]);
  });
});

describe('probePath', () => {
  const args = { dir: '.p', ext: 'ts', stem: 's' };

  it.each([
    ['**/*.test.ts', '.p/s.test.ts', '.p'],
    ['scripts/**', 'scripts/.p/s.ts', 'scripts/.p'],
    ['packages/*/scripts/**', 'packages/.p/scripts/.p/s.ts', 'packages/.p'],
    ['./src/**/*.ts', 'src/.p/s.ts', 'src/.p'],
    ['**', '.p/s.ts', '.p'],
  ])('fills %s as %s inside the fresh %s', (glob, path, root) => {
    expect(probePath({ ...args, glob })).toEqual({ path, root });
  });

  it.each([
    ['**/*.{ts,tsx}', 'a brace'],
    ['**/*.test.tsx', 'another extension'],
    ['src/[ab]/**', 'a character class'],
    ['*.test.ts', 'no directory to make fresh'],
    ['scripts/**/vite.config.ts', 'a file name without a wildcard'],
    ['**/a*b*.ts', 'two wildcards in the file name'],
    ['src/lib*/**', 'a partial wildcard in a directory'],
    ['../**/*.ts', 'a parent directory'],
    ['/abs/**', 'an absolute path'],
    ['src//**', 'an empty segment'],
  ])('refuses %s, which has %s', (glob) => {
    expect(probePath({ ...args, glob })).toBeUndefined();
  });
});

describe('placeRuleProbes', () => {
  const probes = [
    { code: 'x', plugin: 'promise', rule: 'always-return' },
    { code: 'x', plugin: 'vitest', rule: 'expect-expect' },
    {
      code: 'x',
      ext: 'tsx',
      plugin: 'react',
      rule: 'exhaustive-deps',
      scope: 'react-hooks',
    },
  ];

  it('puts a top-level rule probe in the probe directory', () => {
    const { placed } = placeRuleProbes({
      dir: '.p',
      probes,
      rules: [{ entry: 'rules', id: 'promise/always-return' }],
    });
    expect(placed.map(({ path, root }) => [path, root])).toEqual([
      ['.p/promise.always-return.probe.ts', '.p'],
    ]);
  });

  it('puts an override rule probe where the override applies', () => {
    const { placed } = placeRuleProbes({
      dir: '.p',
      probes,
      rules: [
        {
          entry: 'overrides[2]',
          files: ['**/*.test.tsx', '**/*.test.ts'],
          id: 'vitest/expect-expect',
          label: 'override-2',
        },
      ],
    });
    expect(placed.map(({ path }) => path)).toEqual([
      '.p/vitest.expect-expect.override-2.probe.test.ts',
    ]);
  });

  it('finds a probe by the prefix Oxlint prints as well as its family', () => {
    const { missing, placed } = placeRuleProbes({
      dir: '.p',
      probes,
      rules: [
        { entry: 'rules', id: 'react-hooks/exhaustive-deps' },
        { entry: 'rules', id: 'react/exhaustive-deps' },
      ],
    });
    expect([missing.length, placed.length]).toEqual([0, 2]);
  });

  it('reports a rule no probe covers, which is a renamed or new rule', () => {
    const { missing, placed } = placeRuleProbes({
      dir: '.p',
      probes,
      rules: [{ entry: 'rules', id: 'promise/always-returnz' }],
    });
    expect([missing.map(({ id }) => id), placed]).toEqual([
      ['promise/always-returnz'],
      [],
    ]);
  });

  it('reports an override whose globs give no path to plant at', () => {
    const { unplaceable } = placeRuleProbes({
      dir: '.p',
      probes,
      rules: [
        {
          entry: 'overrides[0]',
          files: ['**/*.{test,spec}.ts'],
          id: 'vitest/expect-expect',
          label: 'override-0',
        },
      ],
    });
    expect(unplaceable.map(({ id }) => id)).toEqual(['vitest/expect-expect']);
  });
});

describe('malformedProbes', () => {
  it('accepts a probe with code, plugin and rule', () => {
    expect(
      malformedProbes([{ code: 'x', plugin: 'unicorn', rule: 'no-null' }]),
    ).toEqual([]);
  });

  it('reports an entry missing one of them', () => {
    expect(
      malformedProbes([{ plugin: 'unicorn', rule: 'no-null' }, undefined]),
    ).toHaveLength(2);
  });
});
