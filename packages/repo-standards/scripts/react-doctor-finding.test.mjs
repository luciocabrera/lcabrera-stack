import { describe, expect, it } from 'vite-plus/test';

import {
  blockingFindings,
  blockingSeverities,
  findShadowingConfigs,
  judgeReport,
  renderFinding,
  SHADOWING_CONFIGS,
} from './react-doctor-finding.mjs';

const finding = (overrides) => ({
  line: 7,
  message: 'Avoid this.',
  normalizedFilePath: 'src/fallback.tsx',
  rule: 'no-thing',
  ...overrides,
});

describe('renderFinding', () => {
  it('names the repository path the id carries before its separator', () => {
    expect(renderFinding(finding({ id: 'src/real.tsx::no-thing::7' }))).toBe(
      '  src/real.tsx:7  no-thing\n      Avoid this.',
    );
  });

  it.each([
    ['null', null],
    ['missing', undefined],
    ['empty', ''],
  ])('falls back to the normalized path when the id is %s', (_label, id) => {
    expect(renderFinding(finding({ id }))).toBe(
      '  src/fallback.tsx:7  no-thing\n      Avoid this.',
    );
  });
});

describe('renderFinding severity', () => {
  it('labels the rule with the severity the report carries', () => {
    expect(
      renderFinding(
        finding({ id: 'src/real.tsx::no-thing::7', severity: 'warning' }),
      ),
    ).toBe('  src/real.tsx:7  no-thing (warning)\n      Avoid this.');
  });
});

const diagnostics = [
  { rule: 'a', severity: 'error' },
  { rule: 'b', severity: 'warning' },
];

const blockedRules = (config) =>
  blockingFindings(diagnostics, blockingSeverities(config).severities).map(
    ({ rule }) => rule,
  );

describe('blockingSeverities', () => {
  it.each([
    ['error', { blocking: 'error' }, ['a']],
    ['warning', { blocking: 'warning' }, ['a', 'b']],
    ['none', { blocking: 'none' }, []],
    ['absent, which takes the CLI default of error', {}, ['a']],
  ])(
    'blocks the matching findings when blocking is %s',
    (_label, config, expected) => {
      expect(blockedRules(config)).toEqual(expected);
    },
  );

  it('falls back to the deprecated failOn alias, as the CLI does', () => {
    expect(blockingSeverities({ failOn: 'warning' }).level).toBe('warning');
    expect(
      blockingSeverities({ blocking: 'none', failOn: 'warning' }).level,
    ).toBe('none');
  });

  it('reports the level it resolved, defaulting to error', () => {
    expect(blockingSeverities({}).level).toBe('error');
    expect(blockingSeverities({ blocking: 'warning' }).level).toBe('warning');
  });

  it.each([['warn'], [true], ['Error']])(
    'rejects %s rather than guessing',
    (blocking) => {
      expect(() => blockingSeverities({ blocking })).toThrow(
        /is not one of error, none, warning/,
      );
    },
  );
});

describe('findShadowingConfigs', () => {
  it('reports no shadowing when only doctor.config.ts exists and the jsonc does not', () => {
    expect(findShadowingConfigs((name) => name === 'doctor.config.ts')).toEqual(
      [],
    );
  });

  it('finds nothing when only the jsonc exists', () => {
    expect(
      findShadowingConfigs((name) => name === 'doctor.config.jsonc'),
    ).toEqual([]);
  });

  it('names every config the loader would prefer over the jsonc', () => {
    const present = new Set([
      'doctor.config.json',
      'doctor.config.jsonc',
      'doctor.config.ts',
    ]);
    expect(findShadowingConfigs((name) => present.has(name))).toEqual([
      'doctor.config.ts',
      'doctor.config.json',
    ]);
  });

  it('covers each extension the loader reads before .jsonc', () => {
    expect(SHADOWING_CONFIGS).toEqual(
      ['ts', 'mts', 'cts', 'js', 'mjs', 'cjs', 'json'].map(
        (ext) => `doctor.config.${ext}`,
      ),
    );
  });
});

describe('judgeReport', () => {
  it('never fails report mode, even on an unknown blocking value', () => {
    expect(
      judgeReport({
        config: { blocking: 'warn' },
        diagnostics,
        reportOnly: true,
      }),
    ).toEqual({ blocking: [], level: undefined });
  });

  it('rejects an unknown blocking value in gate mode', () => {
    expect(() =>
      judgeReport({
        config: { blocking: 'warn' },
        diagnostics,
        reportOnly: false,
      }),
    ).toThrow(/is not one of/);
  });

  it('returns the blocking findings and level in gate mode', () => {
    expect(
      judgeReport({
        config: { blocking: 'warning' },
        diagnostics,
        reportOnly: false,
      }),
    ).toEqual({ blocking: diagnostics, level: 'warning' });
  });
});
