import { describe, expect, it } from 'vite-plus/test';

import { DEFAULT_GATES, resolveGates } from './config.mjs';

// Its own file rather than a section of `config.test.mjs`: that file crossed the
// script-size ceiling the moment these landed, and the gate that caught it is
// one of the three this family moved.

describe('resolveGates', () => {
  const gates = (block) => resolveGates(JSON.stringify({ gates: block }));

  it('an absent config is the documented default, not an error', () => {
    expect(resolveGates(undefined)).toEqual(DEFAULT_GATES);
  });

  it('a config with no gates block is also the default', () => {
    expect(resolveGates(JSON.stringify({ profile: 'agent' }))).toEqual(
      DEFAULT_GATES,
    );
  });

  it('overrides only the keys it names', () => {
    const resolved = gates({ scriptSize: { ceiling: 200 } });

    expect(resolved.scriptSize.ceiling).toBe(200);
    expect(resolved.scriptSize.baselineFile).toBe(
      DEFAULT_GATES.scriptSize.baselineFile,
    );
    expect(resolved.strayConfigs).toEqual(DEFAULT_GATES.strayConfigs);
  });

  it('refuses a ceiling that is not a positive whole number', () => {
    // A typo here does not make the gate stricter or looser, it makes every
    // file breach or none — so it is named rather than coerced.
    for (const ceiling of [0, -1, 12.5, '350']) {
      expect(() => gates({ scriptSize: { ceiling } })).toThrow(
        /gates\.scriptSize\.ceiling/,
      );
    }
  });

  it('refuses a baseline path that leaves the repository', () => {
    expect(() =>
      gates({ scriptSize: { baselineFile: '../outside.json' } }),
    ).toThrow(/must stay inside the repository/);
    expect(() => gates({ docsPaths: { baselineFile: '/etc/passwd' } })).toThrow(
      /must be relative to the repository root/,
    );
  });

  it('keeps a match fragment exactly as written, trailing slash and all', () => {
    // The distinction that matters most in this block. These values are
    // compared as substrings against paths already collected, so nothing joins
    // them onto a root and there is nothing to canonicalise. Canonicalising
    // them anyway strips the trailing slash, and the slash IS the meaning:
    // `reports/` excludes a directory, `reports` excludes every document whose
    // name contains the word — which silently dropped one out of the corpus.
    const resolved = gates({
      docsPaths: {
        expectedAbsentPrefixes: ['docker/local/'],
        ignoredDocs: ['reports/'],
      },
    });

    expect(resolved.docsPaths.ignoredDocs).toEqual(['reports/']);
    expect(resolved.docsPaths.expectedAbsentPrefixes).toEqual([
      'docker/local/',
    ]);
  });

  it('canonicalises the values that really are paths', () => {
    const resolved = gates({
      docsPaths: { expectedAbsent: ['docs//generated/BOARD.md'] },
    });

    expect(resolved.docsPaths.expectedAbsent).toEqual([
      'docs/generated/BOARD.md',
    ]);
  });

  it("reads every stray-config key, so an empty roster is the consumer's choice", () => {
    const resolved = gates({
      strayConfigs: {
        configuredIn: 'the root config',
        skipDirs: ['.cache'],
        unreadNames: ['.oxfmtrc.json'],
        unreadPrefixes: ['.prettierrc'],
      },
    });

    expect(resolved.strayConfigs).toEqual({
      configuredIn: 'the root config',
      skipDirs: ['.cache'],
      unreadNames: ['.oxfmtrc.json'],
      unreadPrefixes: ['.prettierrc'],
    });
  });

  it('reads every docs-path key', () => {
    const resolved = gates({
      docsPaths: {
        baselineFile: 'tools/baseline.json',
        expectedAbsent: ['local/only.md'],
        expectedAbsentPrefixes: ['generated/'],
        ignoredDocs: ['vendor/'],
        onDemandReportDirs: ['reports/lint'],
        repoRoots: ['src', 'docs'],
      },
    });

    expect(resolved.docsPaths).toEqual({
      baselineFile: 'tools/baseline.json',
      expectedAbsent: ['local/only.md'],
      expectedAbsentPrefixes: ['generated/'],
      ignoredDocs: ['vendor/'],
      onDemandReportDirs: ['reports/lint'],
      repoRoots: ['src', 'docs'],
    });
  });

  it('ignores a non-array where a list belongs rather than crashing', () => {
    expect(
      gates({ docsPaths: { repoRoots: 'docs' } }).docsPaths.repoRoots,
    ).toEqual(DEFAULT_GATES.docsPaths.repoRoots);
  });

  it('drops empty strings from a list rather than matching everything', () => {
    // An empty fragment is a substring of every path, so one left in a list
    // would exempt the entire corpus.
    expect(
      gates({ docsPaths: { ignoredDocs: ['', '  ', 'vendor/'] } }).docsPaths
        .ignoredDocs,
    ).toEqual(['vendor/']);
  });
});
