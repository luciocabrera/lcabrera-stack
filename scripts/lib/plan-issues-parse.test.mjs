import { describe, expect, it } from 'vite-plus/test';

import {
  parseMilestoneNames,
  parsePlan,
  sectionText,
  splitIssueBlocks,
} from './plan-issues-parse.mjs';

const PLAN = `# Plan

## Epics

### E-1 — \`feat(server): epic — persistence\`

- **Problem:** the layer leaks detail,
  and runs untuned.
- **Children:** P-01, P-02
- **Metadata:** \`type: feature\`; \`pkg: server\`; Milestone **M1**. \`parent: null\`.

## Implementation issues

### P-01 — \`docs: ADR\`

**1. Problem Statement.** First line
continues here.

**2. Objective.** The objective.

**6. Acceptance Criteria.**

- [ ] One
- [ ] Two

**Planning metadata**

\`\`\`yaml
labels: [type: docs, pkg: server]
milestone: M1 - Foundation
dependencies: { blocking: [P-02], blockedBy: [], parent: E-1, children: [] }
\`\`\`

### P-02 — \`perf: sampled tracing\` _(optional)_

**Problem.** Compact form.
**Objective.** Compact objective.
**Metadata.** \`labels: [type: perf]\`; M5; \`parent: E-1\`.
`;

describe('splitIssueBlocks', () => {
  it('finds every issue, including one with a heading suffix', () => {
    expect(splitIssueBlocks(PLAN).map(({ id }) => id)).toEqual([
      'E-1',
      'P-01',
      'P-02',
    ]);
  });

  it('keeps the editorial suffix instead of rejecting the heading', () => {
    const [, , optional] = splitIssueBlocks(PLAN);
    expect(optional.title).toBe('perf: sampled tracing');
    expect(optional.note).toBe('_(optional)_');
  });

  it('stops a block at the next h2, not just the next h3', () => {
    const [epic] = splitIssueBlocks(PLAN);
    expect(epic.body).not.toContain('Implementation issues');
  });
});

describe('sectionText', () => {
  it('captures a section that runs past its first line', () => {
    const [, first] = splitIssueBlocks(PLAN);
    expect(sectionText(first.body, ['Problem Statement', 'Problem'])).toBe(
      'First line\ncontinues here.',
    );
  });

  it('dedents a list-item section without flattening its nesting', () => {
    const [epic] = splitIssueBlocks(PLAN);
    expect(sectionText(epic.body, ['Problem'])).toBe(
      'the layer leaks detail,\nand runs untuned.',
    );
  });

  it('stops before the fenced metadata block', () => {
    const [, first] = splitIssueBlocks(PLAN);
    expect(sectionText(first.body, ['Acceptance Criteria'])).toBe(
      '- [ ] One\n- [ ] Two',
    );
  });

  it('returns empty for a section the entry does not have', () => {
    const [epic] = splitIssueBlocks(PLAN);
    expect(sectionText(epic.body, ['Implementation Notes'])).toBe('');
  });
});

describe('parsePlan', () => {
  const records = parsePlan(PLAN, { milestoneNames: ['M1 - Foundation'] });

  it('classifies epics apart from issues', () => {
    expect(records.map(({ kind }) => kind)).toEqual(['epic', 'issue', 'issue']);
  });

  it('reads children from an epic bullet and dependencies from yaml', () => {
    expect(records[0].dependencies.children).toEqual(['P-01', 'P-02']);
    expect(records[1].dependencies).toMatchObject({
      blocking: ['P-02'],
      parent: 'E-1',
    });
  });

  it('reads a parent named inline on a compact entry', () => {
    expect(records[2].dependencies.parent).toBe('E-1');
  });

  it('takes labels from yaml or from the Metadata line', () => {
    expect(records[1].labels).toEqual(['type: docs', 'pkg: server']);
    expect(records[2].labels).toEqual(['type: perf']);
  });

  it('resolves a bare M-number against the known milestone names', () => {
    expect(records[0].milestone).toBe('M1 - Foundation');
  });
});

describe('malformed input', () => {
  const parseOne = (block) =>
    parsePlan(`### P-99 — \`docs: x\`\n\n${block}\n`)[0];

  it('yields no labels when the bracket list is never closed', () => {
    expect(parseOne('**Metadata.** `labels: [type: docs').labels).toEqual([]);
  });

  it('yields no metadata when the yaml fence is never closed', () => {
    const record = parseOne('```yaml\nlabels: [type: docs]\nmilestone: M1');
    expect(record.labels).toEqual([]);
    expect(record.dependencies.children).toEqual([]);
  });

  it('still reads a closed yaml block that has no trailing newline', () => {
    expect(parseOne('```yaml\nlabels: [type: docs]\n```').labels).toEqual([
      'type: docs',
    ]);
  });
});

describe('dependency maps', () => {
  const entry = (yaml) =>
    `### P-01 — \`docs(x): y\`\n\n\`\`\`yaml\nlabels: [type: docs]\n${yaml}\nmilestone: M1 - Foundation\n\`\`\`\n`;
  const dependenciesOf = (yaml) => parsePlan(entry(yaml))[0].dependencies;

  const BLOCK = [
    'dependencies:',
    '  blocking: [P-03]',
    '  blockedBy: [P-02]',
    '  parent: E-1',
    '  children: []',
  ].join('\n');

  const FLOW =
    'dependencies: { blocking: [P-03], blockedBy: [P-02], parent: E-1, children: [] }';

  it('reads every key of a block-style map', () => {
    expect(dependenciesOf(BLOCK)).toEqual({
      blocking: ['P-03'],
      blockedBy: ['P-02'],
      parent: 'E-1',
      children: [],
    });
  });

  it('parses block and flow style to the same record', () => {
    expect(dependenciesOf(BLOCK)).toEqual(dependenciesOf(FLOW));
  });

  it('reads a block-style list written one item per line', () => {
    const yaml = [
      'dependencies:',
      '  blockedBy:',
      '    - P-02',
      '    - P-04',
      '  parent: null',
    ].join('\n');
    expect(dependenciesOf(yaml)).toEqual({
      blocking: [],
      blockedBy: ['P-02', 'P-04'],
      parent: undefined,
      children: [],
    });
  });

  it('reads issue numbers in a block-style map', () => {
    const yaml = [
      'dependencies:',
      '  blocking: [#1270]',
      '  blockedBy:',
      '    - #1267',
      '    - #1268',
      '  parent: #1260',
      '  children: []',
    ].join('\n');
    expect(dependenciesOf(yaml)).toEqual({
      blocking: ['#1270'],
      blockedBy: ['#1267', '#1268'],
      parent: '#1260',
      children: [],
    });
  });

  it('reads issue numbers in a flow-style map', () => {
    expect(
      dependenciesOf(
        'dependencies: { blocking: [#1270], blockedBy: [#1267, #1268], parent: #1260, children: [] }',
      ),
    ).toEqual({
      blocking: ['#1270'],
      blockedBy: ['#1267', '#1268'],
      parent: '#1260',
      children: [],
    });
  });

  it('reads issue numbers and plan ids mixed in one list', () => {
    const block = 'dependencies:\n  blockedBy: [#1267, P-02]\n  parent: E-1';
    const flow = 'dependencies: { blockedBy: [#1267, P-02], parent: E-1 }';
    expect(dependenciesOf(block).blockedBy).toEqual(['#1267', 'P-02']);
    expect(dependenciesOf(flow)).toEqual(dependenciesOf(block));
  });

  it.each([
    ['a bare comment', '#upstream'],
    ['a heading-like comment', '### upstream'],
    ['a blank line and a comment', '\n# upstream'],
  ])('reads past %s at column 0 inside a block-style map', (_case, comment) => {
    const yaml = [
      'dependencies:',
      comment,
      '  blocking: []',
      '  blockedBy: [P-02]',
      '  parent: E-1',
      '  children: []',
    ].join('\n');
    expect(dependenciesOf(yaml)).toMatchObject({
      blockedBy: ['P-02'],
      parent: 'E-1',
    });
  });

  it('reads a multi-line flow map closed at column 0', () => {
    const yaml = [
      'dependencies: {',
      '  blocking: [P-03],',
      '  blockedBy: [#1267, P-02],',
      '  parent: E-1',
      '}',
    ].join('\n');
    expect(dependenciesOf(yaml)).toEqual({
      blocking: ['P-03'],
      blockedBy: ['#1267', 'P-02'],
      parent: 'E-1',
      children: [],
    });
  });

  it('stops at the next top-level key', () => {
    const yaml = 'dependencies:\n  blockedBy: [P-02]\nnotes: x';
    expect(dependenciesOf(yaml).blockedBy).toEqual(['P-02']);
  });

  it.each([
    [
      'first',
      ['  blockedBy: [', '    #1267,', '    P-02', '  ]'],
      ['#1267', 'P-02'],
    ],
    [
      'last',
      ['  blockedBy: [', '    P-02,', '    #1267', '  ]'],
      ['P-02', '#1267'],
    ],
    [
      'alone on a line',
      ['  blockedBy: [P-02,', '    #1267', '  ]'],
      ['P-02', '#1267'],
    ],
  ])(
    'reads an issue number %s in a wrapped flow list',
    (_case, lines, expected) => {
      expect(
        dependenciesOf(['dependencies:', ...lines].join('\n')).blockedBy,
      ).toEqual(expected);
    },
  );

  it.each([
    ['a spaced comment', '  # upstream'],
    ['an unspaced comment', '  #upstream'],
    ['a comment naming an issue', '  # waits on #1267'],
  ])('ignores %s inside the map', (_case, comment) => {
    const yaml = [
      'dependencies:',
      comment,
      '  blockedBy: [P-02] # after #1268',
      '  parent: E-1',
    ].join('\n');
    expect(dependenciesOf(yaml)).toMatchObject({
      blockedBy: ['P-02'],
      parent: 'E-1',
    });
  });

  it('leaves an issue number the author already quoted alone', () => {
    expect(
      dependenciesOf('dependencies:\n  blockedBy: [\'#1267\', "#1268"]')
        .blockedBy,
    ).toEqual(['#1267', '#1268']);
  });

  it('treats an absent map as no dependencies', () => {
    expect(dependenciesOf('')).toEqual({
      blocking: [],
      blockedBy: [],
      parent: undefined,
      children: [],
    });
  });

  it.each([
    ['malformed yaml', 'dependencies: { blockedBy: [P-02 }'],
    ['a misspelt key', 'dependencies:\n  blockedby: [P-02]'],
    ['a scalar where a list belongs', 'dependencies:\n  blockedBy: P-02'],
    ['a list where the parent belongs', 'dependencies:\n  parent: [E-1]'],
    ['a scalar in place of the map', 'dependencies: P-02'],
    ['an unclosed list of issue numbers', 'dependencies:\n  blockedBy: [#1267'],
    ['an issue number with trailing text', 'dependencies:\n  parent: #12x'],
    [
      'a bare issue number where a list belongs',
      'dependencies:\n  blockedBy:\n    #1267',
    ],
    ['stray text at column 0', 'dependencies:\n  blockedBy: [P-02]\nP-03'],
  ])('fails naming the entry on %s', (_case, yaml) => {
    expect(() => dependenciesOf(yaml)).toThrow(
      /^P-01: cannot parse dependencies/,
    );
  });
});

describe('parseMilestoneNames', () => {
  it('normalises en dashes so one milestone does not become two', () => {
    const scheme = '### M1 – Foundation\n\ntext\n\n### M3 – Cross‑App\n';
    expect(parseMilestoneNames(scheme)).toEqual([
      'M1 - Foundation',
      'M3 - Cross-App',
    ]);
  });
});
