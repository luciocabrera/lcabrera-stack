import { describe, expect, it } from 'vite-plus/test';

import { matchingRecords } from './adjudication-case.mjs';

const finding = (overrides = {}) => ({
  end: 4,
  file: 'packages/a/src/a.ts',
  ruleNeedle: 'no-console',
  start: 2,
  whole: false,
  ...overrides,
});

describe('matchingRecords — the rule id', () => {
  it('matches the rule id exactly, not as a substring', () => {
    const diagnostic = {
      code: 'eslint(no-shadow-restricted-names)',
      filename: 'packages/a/src/a.ts',
      labels: [{ span: { line: 3 } }],
    };
    const report = { diagnostics: [diagnostic] };
    expect(
      matchingRecords({
        finding: finding({ ruleNeedle: 'no-shadow' }),
        report,
      }),
    ).toEqual([]);
    expect(
      matchingRecords({
        finding: finding({ ruleNeedle: 'no-shadow-restricted-names' }),
        report,
      }),
    ).toEqual([diagnostic]);
  });

  it.each([
    ['no-console', { code: 'eslint(no-console) and more' }],
    ['no-console', { code: 'see eslint(no-console)' }],
    ['7/r', { plugin: 7, rule: 'r' }],
  ])(
    'does not read the rule %s from a record spelled %j',
    (ruleNeedle, fields) => {
      const record = { ...fields, file: 'packages/a/src/a.ts', line: 3 };
      expect(
        matchingRecords({
          finding: finding({ ruleNeedle }),
          report: { items: [record] },
        }),
      ).toEqual([]);
    },
  );

  it.each([
    [
      'typescript-eslint/no-unused-vars',
      { code: 'typescript-eslint(no-unused-vars)' },
    ],
    [
      'react-doctor/no-redundant-roles',
      { plugin: 'react-doctor', rule: 'no-redundant-roles' },
    ],
    [
      'no-redundant-roles',
      { plugin: 'react-doctor', rule: 'no-redundant-roles' },
    ],
  ])('reads the rule %s from a record spelled %j', (ruleNeedle, fields) => {
    const record = { ...fields, file: 'packages/a/src/a.ts', line: 3 };
    expect(
      matchingRecords({
        finding: finding({ ruleNeedle }),
        report: { items: [record] },
      }),
    ).toEqual([record]);
  });
});
