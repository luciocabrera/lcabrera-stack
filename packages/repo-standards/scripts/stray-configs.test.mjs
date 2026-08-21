import { describe, expect, it } from 'vite-plus/test';

import {
  isStrayConfig,
  rosterProblem,
  strayConfigsIn,
} from './stray-configs.mjs';

/** A representative roster, standing in for whatever a consumer declares. */
const ROSTER = {
  unreadNames: [
    '.claudelintignore',
    '.eslintignore',
    '.oxfmtrc.json',
    '.oxlintrc.json',
    '.prettierignore',
  ],
  unreadPrefixes: ['.prettierrc'],
};

describe('isStrayConfig', () => {
  it('flags every name in the configured roster', () => {
    for (const filename of ROSTER.unreadNames) {
      expect(isStrayConfig({ filename, ...ROSTER })).toBe(true);
    }
  });

  it('flags a whole prefix family, not just the bare name', () => {
    // A set of exact names cannot cover `.prettierrc.json`, `.prettierrc.yaml`
    // and whichever spelling the tool adds next.
    for (const filename of [
      '.prettierrc',
      '.prettierrc.json',
      '.prettierrc.yaml',
      '.prettierrc.mjs',
    ]) {
      expect(isStrayConfig({ filename, ...ROSTER })).toBe(true);
    }
  });

  it('leaves the configs that ARE read alone', () => {
    // Flagging one of these would disable real configuration, a worse failure
    // than the drift the gate prevents.
    for (const filename of [
      'eslint.config.mjs',
      'biome.jsonc',
      'vite.config.ts',
      'package.json',
      'tsconfig.app.json',
    ]) {
      expect(isStrayConfig({ filename, ...ROSTER })).toBe(false);
    }
  });

  it('does not flag a name that merely contains a rostered name', () => {
    expect(
      isStrayConfig({ filename: 'docs-about-.prettierrc.md', ...ROSTER }),
    ).toBe(false);
    expect(isStrayConfig({ filename: 'my.eslintignore.bak', ...ROSTER })).toBe(
      false,
    );
  });

  it('answers for the roster it is given, not for a fixed toolchain', () => {
    // The point of the move: a repository formatted BY Prettier reads
    // `.prettierrc`, so the same filename must be able to come back clean.
    expect(
      isStrayConfig({
        filename: '.prettierrc',
        unreadNames: ['.oxfmtrc.json'],
        unreadPrefixes: [],
      }),
    ).toBe(false);
  });
});

describe('strayConfigsIn', () => {
  it('returns only the offenders, in input order', () => {
    expect(
      strayConfigsIn({
        paths: [
          'vite.config.ts',
          '.oxfmtrc.json',
          'packages/ui/eslint.config.mjs',
          'apps/web/.prettierrc',
        ],
        ...ROSTER,
      }),
    ).toEqual(['.oxfmtrc.json', 'apps/web/.prettierrc']);
  });

  it('matches on the basename, so nesting depth does not matter', () => {
    expect(
      strayConfigsIn({ paths: ['a/b/c/d/.eslintignore'], ...ROSTER }),
    ).toEqual(['a/b/c/d/.eslintignore']);
  });

  it('is empty for a clean tree', () => {
    expect(
      strayConfigsIn({
        paths: ['vite.config.ts', 'packages/ui/package.json'],
        ...ROSTER,
      }),
    ).toEqual([]);
  });

  it('does not mistake a directory-like path segment for a config file', () => {
    expect(
      strayConfigsIn({ paths: ['.prettierrc/README.md'], ...ROSTER }),
    ).toEqual([]);
  });
});

describe('rosterProblem', () => {
  it('refuses an empty roster rather than passing over nothing', () => {
    // Without this the gate compares every file against an empty list and
    // reports success — indistinguishable from a genuinely clean repository,
    // so a consumer who wired the task but never configured it would believe
    // they were covered.
    expect(rosterProblem({ unreadNames: [], unreadPrefixes: [] })).toContain(
      'names no unread config files',
    );
  });

  it('accepts a roster with either half filled in', () => {
    expect(
      rosterProblem({ unreadNames: ['.oxfmtrc.json'], unreadPrefixes: [] }),
    ).toBeUndefined();
    expect(
      rosterProblem({ unreadNames: [], unreadPrefixes: ['.prettierrc'] }),
    ).toBeUndefined();
  });
});
