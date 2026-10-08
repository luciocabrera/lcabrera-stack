import { describe, expect, it } from 'vite-plus/test';

import {
  coverage,
  coverageFindings,
  indexedRules,
  indexFindings,
  overlaps,
  ruleGlobs,
} from './rules-consistency.mjs';

const HEADING = '## 2. Rules';

describe('ruleGlobs', () => {
  it('reads a flow sequence', () => {
    expect(ruleGlobs("---\npaths: ['a/**', '**/*.ts']\n---\nbody")).toEqual([
      'a/**',
      '**/*.ts',
    ]);
  });

  it('reads a block sequence', () => {
    expect(ruleGlobs("---\npaths:\n  - '**/*.mjs'\n  - 'x/**'\n---\n")).toEqual(
      ['**/*.mjs', 'x/**'],
    );
  });

  it('returns nothing without frontmatter or paths', () => {
    expect(ruleGlobs('# no frontmatter')).toEqual([]);
    expect(ruleGlobs('---\nname: x\n---\n')).toEqual([]);
  });
});

describe('indexedRules', () => {
  const agents = [
    '## 1. Intro',
    '| `.claude/rules/elsewhere.md` | not this section |',
    HEADING,
    '| Rule file | Applies to |',
    '| --- | --- |',
    '| `.claude/rules/a.md` | `**/*.ts` |',
    '| `.claude/rules/b.md` | mentions `.claude/rules/c.md` in column two |',
    '## 3. Next',
    '| `.claude/rules/later.md` | not this section |',
  ].join('\n');

  it('reads only the first column of the named section', () => {
    expect(indexedRules(agents, HEADING)).toEqual([
      '.claude/rules/a.md',
      '.claude/rules/b.md',
    ]);
  });

  it('returns nothing when the section is missing', () => {
    expect(indexedRules(agents, '## 9. Missing')).toEqual([]);
  });
});

describe('indexFindings', () => {
  it('reports a rule missing from the index and an index row with no file', () => {
    expect(
      indexFindings({
        indexed: ['.claude/rules/a.md', '.claude/rules/gone.md'],
        indexFile: 'AGENTS.md',
        onDisk: ['.claude/rules/a.md', '.claude/rules/new.md'],
      }),
    ).toEqual([
      '.claude/rules/new.md is not listed in the AGENTS.md rules index',
      'AGENTS.md indexes .claude/rules/gone.md, which does not exist',
    ]);
  });
});

describe('coverage and overlaps', () => {
  const rules = [
    { globs: ['**/*.ts'], label: 'ts' },
    { globs: ['**/*.test.ts'], label: 'test' },
    { globs: ['**/*.py'], label: 'dead' },
    { globs: [], label: 'empty' },
  ];
  const files = ['a.ts', 'src/b.test.ts', 'c.md'];
  const covered = coverage({ files, rules });

  it('maps each rule to the tracked files it matches', () => {
    expect(covered.get('ts')).toEqual(['a.ts', 'src/b.test.ts']);
    expect(covered.get('test')).toEqual(['src/b.test.ts']);
  });

  it('reports a rule that matches nothing, naming why', () => {
    expect(coverageFindings({ covered, rules })).toEqual([
      'dead matches no tracked file, so it never loads',
      'empty declares no paths, so it never loads',
    ]);
  });

  it('lists only the pairs that share a file', () => {
    expect(overlaps({ covered, rules })).toEqual([
      { first: 'ts', second: 'test', shared: ['src/b.test.ts'] },
    ]);
  });
});
