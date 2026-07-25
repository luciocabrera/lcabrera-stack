import { describe, expect, it } from 'vite-plus/test';

import {
  parseMilestoneNames,
  parsePlan,
  sectionText,
  splitIssueBlocks,
} from './plan-issues-parse.mjs';

// The planning document writes an issue three different ways, and each shape
// has already cost something: a heading suffix silently dropped a whole issue,
// and a multiline-anchored terminator truncated every section to its first
// line. Both failures are invisible — the run just comes out short or thin —
// so they are pinned here rather than left to review.

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
  // The bracket and fence readers were rewritten from regex to index
  // arithmetic to kill quadratic backtracking; these pin the unterminated
  // cases, which are exactly what the old patterns rescanned the input for.
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

describe('parseMilestoneNames', () => {
  it('normalises en dashes so one milestone does not become two', () => {
    const scheme = '### M1 – Foundation\n\ntext\n\n### M3 – Cross‑App\n';
    expect(parseMilestoneNames(scheme)).toEqual([
      'M1 - Foundation',
      'M3 - Cross-App',
    ]);
  });
});
