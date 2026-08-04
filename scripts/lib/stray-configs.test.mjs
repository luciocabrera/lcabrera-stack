import { describe, expect, it } from 'vite-plus/test';

import {
  isStrayConfig,
  strayConfigsIn,
  UNREAD_CONFIG_NAMES,
} from './stray-configs.mjs';

describe('isStrayConfig', () => {
  it('flags every name in the unread set', () => {
    for (const name of UNREAD_CONFIG_NAMES) {
      expect(isStrayConfig(name)).toBe(true);
    }
  });

  it('flags the whole .prettierrc family, not just the bare name', () => {
    expect(isStrayConfig('.prettierrc')).toBe(true);
    expect(isStrayConfig('.prettierrc.json')).toBe(true);
    expect(isStrayConfig('.prettierrc.yaml')).toBe(true);
    expect(isStrayConfig('.prettierrc.mjs')).toBe(true);
  });

  it('leaves the configs that ARE read alone', () => {
    // The gate failing on one of these would disable real configuration,
    // which is a worse failure than the drift it prevents.
    expect(isStrayConfig('eslint.config.mjs')).toBe(false);
    expect(isStrayConfig('biome.jsonc')).toBe(false);
    expect(isStrayConfig('vite.config.ts')).toBe(false);
    expect(isStrayConfig('package.json')).toBe(false);
    expect(isStrayConfig('tsconfig.app.json')).toBe(false);
  });

  it('does not flag a name that merely contains a stray name', () => {
    expect(isStrayConfig('docs-about-.prettierrc.md')).toBe(false);
    expect(isStrayConfig('my.eslintignore.bak')).toBe(false);
  });
});

describe('strayConfigsIn', () => {
  it('returns only the offenders, in input order', () => {
    expect(
      strayConfigsIn([
        'vite.config.ts',
        '.oxfmtrc.json',
        'packages/ui/eslint.config.mjs',
        'apps/react-router/.prettierrc',
      ]),
    ).toEqual(['.oxfmtrc.json', 'apps/react-router/.prettierrc']);
  });

  it('matches on the basename, so nesting depth does not matter', () => {
    expect(strayConfigsIn(['a/b/c/d/.eslintignore'])).toEqual([
      'a/b/c/d/.eslintignore',
    ]);
  });

  it('is empty for a clean tree', () => {
    expect(
      strayConfigsIn(['vite.config.ts', 'packages/ui/package.json']),
    ).toEqual([]);
  });

  it('does not mistake a directory-like path segment for a config file', () => {
    // Only the final segment is the filename; a directory that happens to be
    // named like a config must not trip the gate.
    expect(strayConfigsIn(['.prettierrc/README.md'])).toEqual([]);
  });
});
