import { describe, expect, it } from 'vite-plus/test';

import { parseLanguageLines, targetParam } from './sonar-api.mjs';

describe('targetParam', () => {
  it('uses pullRequest for a PR target', () => {
    expect(targetParam({ type: 'pullRequest', value: '263' })).toBe(
      'pullRequest=263',
    );
  });

  it('uses branch for a branch target', () => {
    expect(targetParam({ type: 'branch', value: 'main' })).toBe('branch=main');
  });

  it('encodes a branch name containing a slash', () => {
    expect(targetParam({ type: 'branch', value: 'fix/sonar' })).toBe(
      'branch=fix%2Fsonar',
    );
  });
});

describe('parseLanguageLines', () => {
  it('parses the measure into per-language counts', () => {
    expect(parseLanguageLines('js=5410;ts=50876;plsql=3024')).toEqual({
      js: 5410,
      plsql: 3024,
      ts: 50876,
    });
  });

  it('distinguishes an analysed language from an absent one', () => {
    const parsed = parseLanguageLines('ts=50876;pgsql=3024');

    expect(parsed.pgsql).toBe(3024);
    expect(parsed.plsql).toBeUndefined();
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['empty', ''],
    ['no separators', 'garbage'],
    ['missing counts', 'ts=;js='],
  ])('returns an empty object for %s input', (_case, value) => {
    expect(parseLanguageLines(value)).toEqual({});
  });

  it('skips malformed entries but keeps the well-formed ones', () => {
    expect(parseLanguageLines('ts=100;broken;js=5')).toEqual({
      js: 5,
      ts: 100,
    });
  });

  it('handles a single-language distribution', () => {
    expect(parseLanguageLines('ts=42')).toEqual({ ts: 42 });
  });
});
