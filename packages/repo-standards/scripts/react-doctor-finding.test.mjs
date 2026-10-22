import { describe, expect, it } from 'vite-plus/test';

import {
  blockingFindings,
  blockingSeverities,
  ciFailureFindings,
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

  it('refuses "none" in gate mode, pointing at --report', () => {
    expect(() =>
      judgeReport({
        config: { blocking: 'none' },
        diagnostics,
        reportOnly: false,
      }),
    ).toThrow(/cannot run at "blocking": "none"; use --report/);
  });

  it('accepts "none" in report mode', () => {
    expect(
      judgeReport({
        config: { blocking: 'none' },
        diagnostics,
        reportOnly: true,
      }),
    ).toEqual({ blocking: [], level: undefined });
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

const plain = {
  category: 'Bugs',
  column: 33,
  endLine: 8,
  filePath: 'src/List.tsx',
  fingerprint:
    'dca99bc28ef11c9d72caaa70356ae58b214263351a7c2c10bf2cc95ed6d5cb84',
  help: 'Use a stable id from the item, like `key={item.id}` or `key={item.slug}`. Index keys break when the list reorders or filters.',
  id: 'packages/web/src/List.tsx::8:33::react-doctor/no-array-index-as-key::4355749737c20ecca42e88a124407ac8602be73048f4c3deb95ffd199427279c',
  length: 11,
  line: 8,
  message:
    'Your users can see & submit the wrong data when this list reorders or filters, so use a stable id like `key={item.id}`, not the array index "index".',
  normalizedFilePath: 'src/List.tsx',
  offset: 265,
  plugin: 'react-doctor',
  rule: 'no-array-index-as-key',
  severity: 'warning',
  tags: [],
  title: 'Array index used as a key',
};

const plainInTest = {
  category: 'Bugs',
  column: 33,
  endLine: 2,
  fileContext: 'test',
  filePath: 'src/List.test.tsx',
  fingerprint:
    'dca99bc28ef11c9d72caaa70356ae58b214263351a7c2c10bf2cc95ed6d5cb84',
  help: 'Use a stable id from the item, like `key={item.id}` or `key={item.slug}`. Index keys break when the list reorders or filters.',
  id: 'packages/web/src/List.test.tsx::2:33::react-doctor/no-array-index-as-key::4355749737c20ecca42e88a124407ac8602be73048f4c3deb95ffd199427279c',
  length: 11,
  line: 2,
  message:
    'Your users can see & submit the wrong data when this list reorders or filters, so use a stable id like `key={item.id}`, not the array index "index".',
  normalizedFilePath: 'src/List.test.tsx',
  offset: 113,
  plugin: 'react-doctor',
  rule: 'no-array-index-as-key',
  severity: 'warning',
  tags: [],
  title: 'Array index used as a key',
};
const design = {
  category: 'Maintainability',
  plugin: 'react-doctor',
  rule: 'no-z-index-9999',
  severity: 'warning',
  tags: ['design', 'test-noise'],
};
const inTest = { ...plainInTest, rule: 'in-test' };
const inStory = { ...plainInTest, fileContext: 'story', rule: 'in-story' };

const gateRules = (config, findings) =>
  judgeReport({
    config,
    diagnostics: findings,
    reportOnly: false,
  }).blocking.map(({ rule }) => rule);

describe('judgeReport applies the CLI ciFailure surface', () => {
  it('lets a design-tagged warning through at "blocking": "warning" and blocks a plain one', () => {
    expect(gateRules({ blocking: 'warning' }, [design])).toEqual([]);
    expect(gateRules({ blocking: 'warning' }, [plain])).toEqual([
      'no-array-index-as-key',
    ]);
  });

  it('lets a design-tagged error through at "blocking": "error"', () => {
    expect(gateRules({}, [{ ...design, severity: 'error' }])).toEqual([]);
  });

  it('lets findings in test and story files through by default', () => {
    expect(gateRules({ blocking: 'warning' }, [inTest, inStory])).toEqual([]);
  });
});

describe('ciFailureFindings honours surfaces.ciFailure', () => {
  const all = [plain, design, inTest, inStory];
  const kept = (ciFailure) =>
    ciFailureFindings(all, { surfaces: { ciFailure } }).map(({ rule }) => rule);

  it('keeps plain findings when the config has no surfaces', () => {
    expect(ciFailureFindings(all, {}).map(({ rule }) => rule)).toEqual([
      'no-array-index-as-key',
    ]);
  });

  it('promotes the design tag back with includeTags', () => {
    expect(kept({ includeTags: ['design'] })).toEqual([
      'no-array-index-as-key',
      'no-z-index-9999',
    ]);
  });

  it('promotes a file context with includeFileContexts', () => {
    expect(kept({ includeFileContexts: ['test'] })).toEqual([
      'no-array-index-as-key',
      'in-test',
    ]);
  });

  it('lets an included rule, category or tag win over the file context', () => {
    expect(kept({ includeRules: ['react-doctor/in-story'] })).toEqual([
      'no-array-index-as-key',
      'in-story',
    ]);
    expect(kept({ includeCategories: ['Maintainability'] })).toEqual([
      'no-array-index-as-key',
      'no-z-index-9999',
    ]);
  });

  it('drops findings by excluded rule, category or tag', () => {
    expect(
      kept({ excludeRules: ['react-doctor/no-array-index-as-key'] }),
    ).toEqual([]);
    expect(kept({ excludeCategories: ['Bugs'] })).toEqual([]);
    expect(
      ciFailureFindings([{ ...plain, tags: ['perf'] }], {
        surfaces: { ciFailure: { excludeTags: ['perf'] } },
      }),
    ).toEqual([]);
  });

  it('reads only the ciFailure surface and ignores malformed controls', () => {
    expect(
      ciFailureFindings(all, {
        surfaces: { score: { includeTags: ['design'] } },
      }).map(({ rule }) => rule),
    ).toEqual(['no-array-index-as-key']);
    expect(kept({ includeTags: 'design' })).toEqual(['no-array-index-as-key']);
    expect(
      ciFailureFindings(all, { surfaces: { ciFailure: ['design'] } }).map(
        ({ rule }) => rule,
      ),
    ).toEqual(['no-array-index-as-key']);
  });
});

const surface = (findings, ciFailure) =>
  ciFailureFindings(findings, { surfaces: { ciFailure } }).map(({ id }) => id);

describe('ciFailureFindings matches the CLI on report-shaped findings', () => {
  it('promotes a test-file finding by its qualified rule key', () => {
    expect(surface([plainInTest], {})).toEqual([]);
    expect(
      surface([plainInTest], {
        includeRules: ['react-doctor/no-array-index-as-key'],
      }),
    ).toEqual([plainInTest.id]);
  });

  it('drops a production finding by its qualified rule key', () => {
    expect(
      surface([plain], {
        excludeRules: ['react-doctor/no-array-index-as-key'],
      }),
    ).toEqual([]);
    expect(
      surface([plain], { excludeRules: ['no-array-index-as-key'] }),
    ).toEqual([plain.id]);
  });

  it('ignores a configured category the CLI does not know, as its loader does', () => {
    const uncategorised = { ...plain, category: 'Correctness' };
    expect(
      surface([uncategorised], { excludeCategories: ['Correctness'] }),
    ).toEqual([plain.id]);
    expect(
      surface([{ ...plainInTest, category: 'Correctness' }], {
        includeCategories: ['Correctness'],
      }),
    ).toEqual([]);
  });
});

describe('ciFailureFindings names the file contexts it exempts', () => {
  it('keeps a finding whose fileContext is null', () => {
    expect(
      ciFailureFindings([{ ...plain, fileContext: null }], {}).map(
        ({ id }) => id,
      ),
    ).toEqual([plain.id]);
  });

  it('fails on a fileContext it does not know instead of exempting it', () => {
    expect(() =>
      judgeReport({
        config: { blocking: 'warning' },
        diagnostics: [{ ...plain, fileContext: 'generated' }],
        reportOnly: false,
      }),
    ).toThrow(/"fileContext": "generated", which is not one of story, test/);
  });
});
